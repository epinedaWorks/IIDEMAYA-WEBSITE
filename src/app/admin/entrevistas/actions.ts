"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { asegurarToken, planificarFranjas } from "@/lib/entrevistas";
import { sendEntrevistaLiberada, sendInvitacionEntrevista, sendInvitacionesEntrevista } from "@/lib/email";

function refrescar(postulacionId?: string) {
  revalidatePath("/admin/entrevistas");
  revalidatePath("/admin");
  if (postulacionId) revalidatePath(`/admin/postulaciones/${postulacionId}`);
}

// Crea los horarios que se pueden reservar. Los que se empalman con uno que
// ya existe se omiten (así volver a enviar el mismo formulario no duplica).
export async function crearFranjas(formData: FormData) {
  await requireAdminSession();

  const plan = planificarFranjas({
    desde: String(formData.get("desde") ?? ""),
    hasta: String(formData.get("hasta") ?? ""),
    horaInicio: String(formData.get("horaInicio") ?? ""),
    horaFin: String(formData.get("horaFin") ?? ""),
    duracion: Number.parseInt(String(formData.get("duracion") ?? ""), 10),
    conFinDeSemana: formData.get("finDeSemana") === "on",
  });
  if (!plan.ok) redirect(`/admin/entrevistas?error=${encodeURIComponent(plan.error)}`);

  const detalle = String(formData.get("detalle") ?? "").trim().slice(0, 500) || null;

  const primero = plan.franjas[0].inicio;
  const ultimo = plan.franjas[plan.franjas.length - 1].fin;
  const existentes = await prisma.franjaEntrevista.findMany({
    where: { inicio: { lt: ultimo }, fin: { gt: primero } },
    select: { inicio: true, fin: true },
  });
  const nuevas = plan.franjas.filter(
    (f) => !existentes.some((e) => e.inicio < f.fin && e.fin > f.inicio)
  );

  if (nuevas.length > 0) {
    await prisma.franjaEntrevista.createMany({
      data: nuevas.map((f) => ({ inicio: f.inicio, fin: f.fin, detalle })),
    });
  }

  refrescar();
  redirect(`/admin/entrevistas?msg=creadas&n=${nuevas.length}&o=${plan.franjas.length - nuevas.length}`);
}

// Solo se pueden quitar horarios libres; uno reservado se libera primero.
export async function eliminarFranja(franjaId: string) {
  await requireAdminSession();
  await prisma.franjaEntrevista.deleteMany({ where: { id: franjaId, postulacionId: null } });
  refrescar();
}

// Quita la reserva (por ejemplo, el equipo no puede ese día) y le avisa a la
// persona con el enlace para elegir otro horario.
export async function liberarFranja(franjaId: string) {
  await requireAdminSession();

  const franja = await prisma.franjaEntrevista.findUnique({
    where: { id: franjaId },
    include: { postulacion: true },
  });
  if (!franja?.postulacion) return;

  await prisma.franjaEntrevista.update({
    where: { id: franjaId },
    data: { postulacionId: null, reservadaAt: null },
  });

  const token = await asegurarToken(franja.postulacion.id);
  const r = await sendEntrevistaLiberada(franja.postulacion, franja, token);

  refrescar(franja.postulacion.id);
  redirect(`/admin/entrevistas?msg=${r.ok ? "liberada" : "liberada_sin_correo"}`);
}

// Invitación a una sola persona (desde el detalle de su postulación).
export async function invitarPostulacion(
  postulacionId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminSession();

  const p = await prisma.postulacion.findUnique({
    where: { id: postulacionId },
    select: { id: true, nombre: true, correo: true, vacanteTitulo: true },
  });
  if (!p) return { ok: false, error: "La postulación ya no existe." };

  const token = await asegurarToken(p.id);
  const r = await sendInvitacionEntrevista(p, token);
  if (!r.ok) return { ok: false, error: "No se pudo enviar el correo. Intenta de nuevo." };

  await prisma.postulacion.update({ where: { id: p.id }, data: { entrevistaInvitadaAt: new Date() } });
  refrescar(p.id);
  return { ok: true };
}

// Invitación a varias personas a la vez (checkboxes de /admin/entrevistas).
export async function invitarVarias(formData: FormData) {
  await requireAdminSession();

  const ids = [...new Set(formData.getAll("ids").map(String))].slice(0, 300);
  if (ids.length === 0) redirect("/admin/entrevistas?error=" + encodeURIComponent("No elegiste a nadie."));

  const personas = await prisma.postulacion.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, correo: true, vacanteTitulo: true },
  });

  const conToken = await Promise.all(
    personas.map(async (p) => ({ ...p, token: await asegurarToken(p.id) }))
  );
  const { enviados, fallidos } = await sendInvitacionesEntrevista(conToken);

  if (enviados.length > 0) {
    await prisma.postulacion.updateMany({
      where: { id: { in: enviados } },
      data: { entrevistaInvitadaAt: new Date() },
    });
  }

  refrescar();
  redirect(`/admin/entrevistas?msg=invitadas&n=${enviados.length}&f=${fallidos.length}`);
}
