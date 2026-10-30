"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { huella, ipDe, permitir } from "@/lib/rate-limit";
import { reservarFranja } from "@/lib/entrevistas";
import { sendEntrevistaAgendada } from "@/lib/email";

export type ResultadoAgendar = { ok: true } | { ok: false; error: string };

const HORA_MS = 60 * 60 * 1000;

// Quien tiene el enlace elige un horario libre. No hay sesión: el token del
// enlace es lo que identifica la postulación, por eso se limita la frecuencia.
export async function agendarEntrevista(token: string, franjaId: string): Promise<ResultadoAgendar> {
  if (typeof token !== "string" || token.length < 10 || token.length > 64) {
    return { ok: false, error: "Este enlace no es válido." };
  }
  if (typeof franjaId !== "string" || franjaId.length < 5 || franjaId.length > 64) {
    return { ok: false, error: "Elige un horario." };
  }

  const ip = ipDe(await headers());
  const [porIp, porToken] = await Promise.all([
    permitir(`entrevista:ip:${ip}`, 30, HORA_MS),
    permitir(`entrevista:token:${huella(token)}`, 15, HORA_MS),
  ]);
  if (!porIp || !porToken) {
    return { ok: false, error: "Hiciste demasiados intentos. Espera un rato y vuelve a intentar." };
  }

  const postulacion = await prisma.postulacion.findUnique({ where: { entrevistaToken: token } });
  if (!postulacion || postulacion.estado === "RECHAZADA" || postulacion.estado === "CONTRATADA") {
    return { ok: false, error: "Este enlace ya no está activo." };
  }

  const reserva = await reservarFranja(postulacion.id, franjaId);
  if (!reserva.ok) return reserva;

  // Agendar es avanzar en el proceso; no se toca si el equipo ya lo movió a
  // otro estado (entrevista, rechazada, contratada…).
  if (postulacion.estado === "NUEVA" || postulacion.estado === "EN_REVISION") {
    await prisma.postulacion
      .update({ where: { id: postulacion.id }, data: { estado: "ENTREVISTA" } })
      .catch((err) => console.error("[entrevista] no se pudo actualizar el estado:", err));
  }

  // Un correo que no sale no debe deshacer la reserva: ya quedó guardada.
  await sendEntrevistaAgendada(postulacion, reserva.franja, token, reserva.anterior !== null).catch((err) =>
    console.error("[entrevista] no se pudo enviar la confirmación:", err)
  );

  revalidatePath("/admin");
  revalidatePath("/admin/entrevistas");
  revalidatePath(`/admin/postulaciones/${postulacion.id}`);
  revalidatePath(`/entrevista/${token}`);
  return { ok: true };
}
