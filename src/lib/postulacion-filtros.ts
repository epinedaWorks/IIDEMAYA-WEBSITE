import type { Prisma } from "@prisma/client";
import { esInteres } from "./postulacion-interes";

// Filtros de la lista de postulaciones. Viajan en la dirección (?posicion=…)
// y también al abrir una postulación, para que "anterior / siguiente" y
// "volver" respeten lo que se estaba viendo.
export type Filtros = { posicion: string; desde: string; hasta: string; interes: string };

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

// Las fechas son días de Guatemala (UTC-6, sin horario de verano): "desde"
// arranca a las 00:00 y "hasta" incluye todo ese día.
function inicioDelDia(dia: string): Date | null {
  if (!FECHA_RE.test(dia)) return null;
  const fecha = new Date(`${dia}T00:00:00-06:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
function finDelDia(dia: string): Date | null {
  if (!FECHA_RE.test(dia)) return null;
  const fecha = new Date(`${dia}T23:59:59.999-06:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// Toma los parámetros crudos de la dirección y descarta lo inválido.
export function leerFiltros(sp: Record<string, string | undefined>): Filtros {
  return {
    posicion: sp.posicion ?? "",
    desde: inicioDelDia(sp.desde ?? "") ? (sp.desde as string) : "",
    hasta: finDelDia(sp.hasta ?? "") ? (sp.hasta as string) : "",
    interes: esInteres(sp.interes ?? "") ? (sp.interes as string) : "",
  };
}

export function hayFiltros(f: Filtros): boolean {
  return Boolean(f.posicion || f.desde || f.hasta || f.interes);
}

export function whereDeFiltros(f: Filtros): Prisma.PostulacionWhereInput {
  const where: Prisma.PostulacionWhereInput = {};

  if (f.posicion === "general") where.vacanteId = null;
  else if (f.posicion) where.vacanteId = f.posicion;

  const desde = inicioDelDia(f.desde);
  const hasta = finDelDia(f.hasta);
  if (desde || hasta) {
    where.createdAt = { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) };
  }

  if (esInteres(f.interes)) where.interes = f.interes;
  return where;
}

// "posicion=…&desde=…" (sin el "?"), o "" si no hay filtros.
export function consultaDeFiltros(f: Filtros): string {
  const params = new URLSearchParams();
  if (f.posicion) params.set("posicion", f.posicion);
  if (f.desde) params.set("desde", f.desde);
  if (f.hasta) params.set("hasta", f.hasta);
  if (f.interes) params.set("interes", f.interes);
  return params.toString();
}
