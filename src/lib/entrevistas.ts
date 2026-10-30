import { randomBytes } from "node:crypto";
import type { FranjaEntrevista } from "@prisma/client";
import { prisma } from "./prisma";

// Los horarios se guardan en UTC y se muestran siempre en hora de Guatemala.
// Guatemala no usa horario de verano, así que el desfase (UTC-6) es fijo.
const ZONA_GT = "America/Guatemala";
const DESFASE_GT = "-06:00";

// Tiempo mínimo entre "ahora" y el inicio de una entrevista para poder
// reservarla o cambiarla por cuenta propia.
export const ANTICIPACION_MIN = 60;

export const DURACIONES = [15, 20, 30, 45, 60] as const;
export const MAX_FRANJAS_POR_ENVIO = 200;
const MAX_DIAS_POR_ENVIO = 62;

// ---------- Fechas y horas (Guatemala) ----------

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function gtAUtc(fecha: string, hora: string): Date | null {
  if (!FECHA_RE.test(fecha) || !HORA_RE.test(hora)) return null;
  const d = new Date(`${fecha}T${hora}:00${DESFASE_GT}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// "2026-11-03" del día de hoy en Guatemala.
export const hoyGt = (): string => new Date().toLocaleDateString("sv-SE", { timeZone: ZONA_GT });

export const claveDiaGt = (d: Date): string => d.toLocaleDateString("sv-SE", { timeZone: ZONA_GT });

export const diaLargoGt = (d: Date): string =>
  d.toLocaleDateString("es-GT", { timeZone: ZONA_GT, weekday: "long", day: "numeric", month: "long" });

export const horaGt = (d: Date): string =>
  d.toLocaleTimeString("es-GT", { timeZone: ZONA_GT, hour: "numeric", minute: "2-digit" });

export const rangoHorasGt = (inicio: Date, fin: Date): string => `${horaGt(inicio)} a ${horaGt(fin)}`;

export const fechaHoraLargaGt = (d: Date): string => `${diaLargoGt(d)}, ${horaGt(d)}`;

const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
const deMinutos = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// ---------- Crear disponibilidad ----------

export type PlanFranjas = { inicio: Date; fin: Date }[];

// Convierte "estos días, de tal hora a tal hora, en bloques de N minutos" en
// la lista de horarios concretos. Con un rango de días salta sábados y
// domingos, salvo que se pida lo contrario.
export function planificarFranjas(o: {
  desde: string;
  hasta: string; // vacío = solo el día "desde"
  horaInicio: string;
  horaFin: string;
  duracion: number;
  conFinDeSemana: boolean;
}): { ok: true; franjas: PlanFranjas } | { ok: false; error: string } {
  if (!FECHA_RE.test(o.desde)) return { ok: false, error: "Elige la fecha." };
  const hasta = o.hasta || o.desde;
  if (!FECHA_RE.test(hasta)) return { ok: false, error: "La fecha final no es válida." };
  if (!HORA_RE.test(o.horaInicio) || !HORA_RE.test(o.horaFin)) {
    return { ok: false, error: "Indica la hora de inicio y la de fin." };
  }
  if (!(DURACIONES as readonly number[]).includes(o.duracion)) {
    return { ok: false, error: "La duración de cada entrevista no es válida." };
  }
  if (o.desde < hoyGt()) return { ok: false, error: "La fecha ya pasó." };
  if (hasta < o.desde) return { ok: false, error: "La fecha final es anterior a la inicial." };

  const ini = aMinutos(o.horaInicio);
  const fin = aMinutos(o.horaFin);
  if (fin <= ini) return { ok: false, error: "La hora de fin debe ser posterior a la de inicio." };

  // Se recorre el calendario con fechas al mediodía UTC: así sumar un día
  // nunca salta ni repite fecha, sin importar la zona del servidor.
  const dias: string[] = [];
  const cursor = new Date(`${o.desde}T12:00:00Z`);
  const ultimo = new Date(`${hasta}T12:00:00Z`);
  while (cursor <= ultimo) {
    if (dias.length >= MAX_DIAS_POR_ENVIO) {
      return { ok: false, error: `El rango es muy largo (máximo ${MAX_DIAS_POR_ENVIO} días).` };
    }
    const diaSemana = cursor.getUTCDay();
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
    // Un solo día se respeta tal cual, aunque caiga en fin de semana.
    if (o.desde === hasta || o.conFinDeSemana || !esFinDeSemana) {
      dias.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const franjas: PlanFranjas = [];
  for (const dia of dias) {
    for (let m = ini; m + o.duracion <= fin; m += o.duracion) {
      const inicio = gtAUtc(dia, deMinutos(m));
      const final = gtAUtc(dia, deMinutos(m + o.duracion));
      if (!inicio || !final) continue;
      if (inicio.getTime() <= Date.now()) continue; // ya pasó (hoy, horas atrás)
      franjas.push({ inicio, fin: final });
    }
  }

  if (franjas.length === 0) {
    return { ok: false, error: "Con esos datos no quedó ningún horario (revisa las horas y la duración)." };
  }
  if (franjas.length > MAX_FRANJAS_POR_ENVIO) {
    return { ok: false, error: `Son demasiados horarios de una vez (${franjas.length}); el máximo es ${MAX_FRANJAS_POR_ENVIO}.` };
  }
  return { ok: true, franjas };
}

// ---------- Enlace de agenda ----------

export function origenSitio(): string {
  try {
    return new URL(process.env.ADMIN_URL || "http://localhost:3000/admin").origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const urlAgenda = (token: string) => `${origenSitio()}/entrevista/${token}`;

// Cada postulación tiene un token propio e imposible de adivinar; se crea la
// primera vez que hace falta y después siempre es el mismo (el enlace de un
// correo anterior sigue sirviendo).
export async function asegurarToken(postulacionId: string): Promise<string> {
  const actual = await prisma.postulacion.findUnique({
    where: { id: postulacionId },
    select: { entrevistaToken: true },
  });
  if (!actual) throw new Error("Postulación no encontrada");
  if (actual.entrevistaToken) return actual.entrevistaToken;

  const nuevo = randomBytes(18).toString("base64url");
  // Solo escribe si nadie se adelantó entre la lectura y este momento.
  await prisma.postulacion.updateMany({
    where: { id: postulacionId, entrevistaToken: null },
    data: { entrevistaToken: nuevo },
  });
  const final = await prisma.postulacion.findUnique({
    where: { id: postulacionId },
    select: { entrevistaToken: true },
  });
  return final?.entrevistaToken ?? nuevo;
}

// ---------- Reservar / liberar ----------

class HorarioNoDisponible extends Error {}

export type ResultadoReserva =
  | { ok: true; franja: FranjaEntrevista; anterior: FranjaEntrevista | null }
  | { ok: false; error: string };

// Reserva `franjaId` para la persona. Si ya tenía otra entrevista futura, la
// cambia (la anterior queda libre), todo en una sola transacción: o queda con
// el horario nuevo o conserva el que tenía.
export async function reservarFranja(postulacionId: string, franjaId: string): Promise<ResultadoReserva> {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + ANTICIPACION_MIN * 60_000);
  try {
    return await prisma.$transaction(async (tx) => {
      const anterior = await tx.franjaEntrevista.findFirst({
        where: { postulacionId, inicio: { gt: ahora } },
      });
      if (anterior && anterior.inicio <= limite) {
        throw new HorarioNoDisponible(
          "Tu entrevista es muy pronto para cambiarla desde aquí. Escríbenos y lo resolvemos."
        );
      }
      if (anterior) {
        await tx.franjaEntrevista.update({
          where: { id: anterior.id },
          data: { postulacionId: null, reservadaAt: null },
        });
      }
      // Solo se queda con el horario si sigue libre y en el futuro: si otra
      // persona se lo ganó hace un instante, no afecta ninguna fila.
      const tomada = await tx.franjaEntrevista.updateMany({
        where: { id: franjaId, postulacionId: null, inicio: { gt: limite } },
        data: { postulacionId, reservadaAt: ahora },
      });
      if (tomada.count !== 1) {
        throw new HorarioNoDisponible("Ese horario ya no está disponible. Elige otro, por favor.");
      }
      const franja = await tx.franjaEntrevista.findUniqueOrThrow({ where: { id: franjaId } });
      return { ok: true as const, franja, anterior };
    });
  } catch (err) {
    if (err instanceof HorarioNoDisponible) return { ok: false, error: err.message };
    throw err;
  }
}

// ---------- Calendario (.ics) ----------

const icsFecha = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsTexto = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Archivo que Google Calendar, Outlook y Apple Calendar abren con un clic.
export function crearIcs(f: { id: string; inicio: Date; fin: Date; detalle: string | null }): string {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IIDEMAYA//Entrevistas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${f.id}@iidemaya.org.gt`,
    `DTSTAMP:${icsFecha(new Date())}`,
    `DTSTART:${icsFecha(f.inicio)}`,
    `DTEND:${icsFecha(f.fin)}`,
    "SUMMARY:Entrevista con IIDEMAYA",
    ...(f.detalle ? [`LOCATION:${icsTexto(f.detalle)}`, `DESCRIPTION:${icsTexto(f.detalle)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lineas.join("\r\n") + "\r\n";
}
