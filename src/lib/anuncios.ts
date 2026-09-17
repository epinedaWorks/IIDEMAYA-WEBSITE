// Utilidades puras (sin acceso a base de datos ni red) para el envío de
// anuncios. Las usa tanto el formulario del panel (cliente) como la acción
// que envía de verdad (servidor) — por eso viven separadas de lib/email.ts.

export type PersonaAnuncio = { correo: string; nombre: string };

export const ES_CORREO_ANUNCIO = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

export function dedupePorCorreo(lista: PersonaAnuncio[]): PersonaAnuncio[] {
  const vistos = new Set<string>();
  return lista.filter((d) => {
    const k = d.correo.toLowerCase();
    if (!d.correo || vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}
