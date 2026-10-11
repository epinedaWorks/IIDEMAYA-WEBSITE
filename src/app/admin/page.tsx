import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { formatearFechaHoraGt } from "@/lib/fecha";
import { iaConfigurada } from "@/lib/resumen-ia";
import FilaPostulacion from "@/components/admin/FilaPostulacion";
import FiltrosPostulaciones from "@/components/admin/FiltrosPostulaciones";

export const metadata: Metadata = { title: "Postulaciones | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

// Las fechas del filtro son días de Guatemala (UTC-6, sin horario de
// verano): "desde" arranca a las 00:00 y "hasta" incluye todo ese día.
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

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ posicion?: string; desde?: string; hasta?: string }>;
}) {
  await requireAdminSession();
  const { posicion = "", desde = "", hasta = "" } = await searchParams;

  const where: Prisma.PostulacionWhereInput = {};
  if (posicion === "general") where.vacanteId = null;
  else if (posicion) where.vacanteId = posicion;

  const fechaDesde = inicioDelDia(desde);
  const fechaHasta = finDelDia(hasta);
  if (fechaDesde || fechaHasta) {
    where.createdAt = {
      ...(fechaDesde ? { gte: fechaDesde } : {}),
      ...(fechaHasta ? { lte: fechaHasta } : {}),
    };
  }
  const hayFiltros = Boolean(posicion || fechaDesde || fechaHasta);

  const [postulaciones, total, vacantes] = await Promise.all([
    prisma.postulacion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        correo: true,
        createdAt: true,
        estado: true,
        vacanteTitulo: true,
        resumenIA: true,
      },
    }),
    prisma.postulacion.count(),
    prisma.vacante.findMany({
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
      select: { id: true, titulo: true },
    }),
  ]);

  const ia = iaConfigurada();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Postulaciones</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {hayFiltros
              ? `${postulaciones.length} de ${total} ${total === 1 ? "postulación" : "postulaciones"}`
              : `${total} ${total === 1 ? "postulación recibida" : "postulaciones recibidas"}`}
          </p>
        </div>
        {total > 0 && (
          <a
            href="/api/admin/postulaciones/exportar"
            className="rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand hover:bg-brand-light"
          >
            Exportar a Excel
          </a>
        )}
      </div>

      {total > 0 && (
        <FiltrosPostulaciones
          vacantes={vacantes}
          inicial={{ posicion, desde: fechaDesde ? desde : "", hasta: fechaHasta ? hasta : "" }}
        />
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
        {postulaciones.length === 0 ? (
          <p className="p-8 text-center text-sm text-foreground/60">
            {total === 0
              ? "Todavía no hay postulaciones."
              : "Ninguna postulación coincide con los filtros."}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-brand-light/40 text-xs uppercase tracking-wide text-foreground/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Posición</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                <th className="px-4 py-3 font-semibold">Resumen sugerido con IA</th>
              </tr>
            </thead>
            <tbody>
              {postulaciones.map((p) => (
                <FilaPostulacion
                  key={p.id}
                  iaConfigurada={ia}
                  p={{
                    id: p.id,
                    nombre: p.nombre,
                    correo: p.correo,
                    posicion: p.vacanteTitulo,
                    fecha: formatearFechaHoraGt(p.createdAt),
                    estado: p.estado,
                    resumenIA: p.resumenIA,
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-foreground/50">
        El resumen lo genera una IA a partir de las respuestas del cuestionario y es solo una
        sugerencia para agilizar la lectura; la decisión es siempre del equipo.
      </p>
    </div>
  );
}
