import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { formatearFechaHoraGt } from "@/lib/fecha";
import { iaConfigurada } from "@/lib/resumen-ia";
import { consultaDeFiltros, hayFiltros, leerFiltros, whereDeFiltros } from "@/lib/postulacion-filtros";
import FilaPostulacion from "@/components/admin/FilaPostulacion";
import FiltrosPostulaciones from "@/components/admin/FiltrosPostulaciones";

export const metadata: Metadata = { title: "Postulaciones | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminSession();

  const filtros = leerFiltros(await searchParams);
  const consulta = consultaDeFiltros(filtros);
  const filtrado = hayFiltros(filtros);

  const [postulaciones, total, vacantes] = await Promise.all([
    prisma.postulacion.findMany({
      where: whereDeFiltros(filtros),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        correo: true,
        createdAt: true,
        estado: true,
        interes: true,
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
    // La tabla tiene muchas columnas: se ensancha un poco más que el resto
    // del panel en pantallas grandes.
    <div className="xl:-mx-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Postulaciones</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {filtrado
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

      {total > 0 && <FiltrosPostulaciones vacantes={vacantes} inicial={filtros} />}

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
                <th className="px-3 py-3 font-semibold">Nombre</th>
                <th className="px-3 py-3 font-semibold">Posición</th>
                <th className="px-3 py-3 font-semibold">Fecha</th>
                <th className="px-3 py-3 font-semibold">Estado</th>
                <th className="px-3 py-3 font-semibold">Interés</th>
                <th className="px-3 py-3 text-right font-semibold">Acciones</th>
                <th className="px-3 py-3 font-semibold">Resumen sugerido con IA</th>
              </tr>
            </thead>
            <tbody>
              {postulaciones.map((p) => (
                <FilaPostulacion
                  key={p.id}
                  iaConfigurada={ia}
                  consulta={consulta}
                  p={{
                    id: p.id,
                    nombre: p.nombre,
                    correo: p.correo,
                    posicion: p.vacanteTitulo,
                    fecha: formatearFechaHoraGt(p.createdAt),
                    estado: p.estado,
                    interes: p.interes,
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
