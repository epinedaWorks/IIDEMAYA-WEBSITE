import { prisma } from "./prisma";

// Ajustes editables desde /admin/ajustes, con la variable de entorno como
// respaldo si aún no se ha guardado nada en la base de datos. Cache corto
// para no consultar la BD en cada correo.
const cache = new Map<string, { v: string | null; t: number }>();
const TTL_MS = 30_000;

export async function getSetting(key: string): Promise<string | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL_MS) return hit.v;
  let v: string | null = null;
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    v = row?.value ?? null;
  } catch {
    v = null;
  }
  cache.set(key, { v, t: Date.now() });
  return v;
}

export function invalidarSettingsCache() {
  cache.clear();
}

// Devuelve la lista de correos de un ajuste ("a@x.com, b@y.com" -> [...]),
// usando el valor guardado o, si no hay, el de la variable de entorno.
export async function getListaCorreos(key: string, envFallback?: string): Promise<string[]> {
  const raw = (await getSetting(key)) ?? envFallback ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Claves usadas
export const SETTING_CONTACT_EMAIL = "contactEmail";
export const SETTING_POSTULACION_EMAIL = "postulacionEmail";
