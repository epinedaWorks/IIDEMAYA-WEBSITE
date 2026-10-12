import { createHash } from "node:crypto";
import { prisma } from "./prisma";

// Limitador de frecuencia respaldado por la base de datos: en un entorno
// sin servidor no hay memoria compartida entre peticiones, así que el
// contador no puede vivir en una variable.

// IP del visitante. Netlify pone la real en x-nf-client-connection-ip (no
// la puede falsear quien visita); x-forwarded-for queda de respaldo.
export function ipDe(headers: Headers): string {
  return (
    headers.get("x-nf-client-connection-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconocida"
  );
}

// Huella corta del valor, para no guardar correos en claro en la clave.
export function huella(valor: string): string {
  return createHash("sha256").update(valor.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export async function intentosEn(clave: string, ventanaMs: number): Promise<number> {
  return prisma.limiteTasa.count({
    where: { clave, createdAt: { gte: new Date(Date.now() - ventanaMs) } },
  });
}

export async function registrarIntento(clave: string): Promise<void> {
  await prisma.limiteTasa.create({ data: { clave } });
  // Limpieza ocasional de registros viejos, para que la tabla no crezca.
  if (Math.random() < 0.05) {
    await prisma.limiteTasa
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } } })
      .catch(() => undefined);
  }
}

export async function borrarIntentos(clave: string): Promise<void> {
  await prisma.limiteTasa.deleteMany({ where: { clave } });
}

// Cuenta y registra en un solo paso. Devuelve true si el intento está
// permitido. Si la base de datos falla, deja pasar (un formulario público
// no debe quedar inutilizable por esto).
export async function permitir(clave: string, max: number, ventanaMs: number): Promise<boolean> {
  try {
    if ((await intentosEn(clave, ventanaMs)) >= max) return false;
    await registrarIntento(clave);
    return true;
  } catch (err) {
    console.error("[rate-limit] no se pudo consultar el límite:", err);
    return true;
  }
}
