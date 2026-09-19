import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { formatearFechaHoraGt } from "@/lib/fecha";
import EliminarPostulacionBoton from "@/components/admin/EliminarPostulacionBoton";
import { eliminarPostulacion } from "./postulaciones/[id]/actions";

export const metadata: Metadata = { title: "Postulaciones | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

const ESTADO_LABEL: Record<string, string> = {
  NUEVA: "Nueva",
  EN_REVISION: "En revisión",
  ENTREVISTA: "Entrevista",
  RECHAZADA: "Rechazada",
  CONTRATADA: "Contratada",
};

const ESTADO_COLOR: Record<string, string> = {
  NUEVA: "bg-accent-light text-accent",
  EN_REVISION: "bg-brand-light text-brand",
  ENTREVISTA: "bg-blue-100 text-blue-700",
  RECHAZADA: "bg-red-100 text-red-700",
  CONTRATADA: "bg-green-100 text-green-700",
};

export default async function AdminDashboard() {
  await requireAdminSession();

  const postulaciones = await prisma.postulacion.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nombre: true,
      correo: true,
      createdAt: true,
      estado: true,
      modalidadTrabajo: true,
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Postulaciones</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {postulaciones.length} {postulaciones.length === 1 ? "postulación recibida" : "postulaciones recibidas"}
          </p>
        </div>
        {postulaciones.length > 0 && (
          <a
            href="/api/admin/postulaciones/exportar"
            className="rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand hover:bg-brand-light"
          >
            Exportar a Excel
          </a>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {postulaciones.length === 0 ? (
          <p className="p-8 text-center text-sm text-foreground/60">
            Todavía no hay postulaciones.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-brand-light/40 text-xs uppercase tracking-wide text-foreground/60">
              <tr>
                <th className="px-5 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 font-semibold">Correo</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {postulaciones.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-brand-light/20">
                  <td className="px-5 py-3">
                    <Link href={`/admin/postulaciones/${p.id}`} className="font-medium text-brand-dark hover:underline">
                      {p.nombre}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-foreground/70">{p.correo}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-foreground/70">
                    {formatearFechaHoraGt(p.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLOR[p.estado]}`}>
                      {ESTADO_LABEL[p.estado]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <EliminarPostulacionBoton
                      compacto
                      nombre={p.nombre}
                      action={eliminarPostulacion.bind(null, p.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
