import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { alternarVacante } from "./actions";

export const metadata: Metadata = { title: "Vacantes | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

const MENSAJES: Record<string, string> = {
  creada: "Vacante creada.",
  guardada: "Cambios guardados.",
};

export default async function AdminVacantes({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireAdminSession();
  const { msg } = await searchParams;

  const vacantes = await prisma.vacante.findMany({
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { postulaciones: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Vacantes</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Las plazas habilitadas se muestran en <code>/vacantes</code> y en la lista de
            posiciones del formulario de postulación. Los cambios se aplican de inmediato.
          </p>
        </div>
        <Link
          href="/admin/vacantes/nueva"
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition active:scale-95 hover:bg-brand-dark"
        >
          + Nueva vacante
        </Link>
      </div>

      {msg && MENSAJES[msg] && (
        <p className="mt-4 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-brand">
          {MENSAJES[msg]}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {vacantes.length === 0 && (
          <p className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-foreground/60 shadow-sm">
            Todavía no hay vacantes. Crea la primera con el botón de arriba.
          </p>
        )}
        {vacantes.map((v) => (
          <div
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-brand-dark">{v.titulo}</h2>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                    v.activa ? "bg-green-100 text-green-700" : "bg-black/5 text-foreground/60"
                  }`}
                >
                  {v.activa ? "Habilitada" : "Deshabilitada"}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/60">
                {v._count.postulaciones}{" "}
                {v._count.postulaciones === 1 ? "postulación" : "postulaciones"} · {v.modalidad}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/vacantes/${v.id}`}
                className="rounded-lg border border-brand px-4 py-1.5 text-sm font-medium text-brand transition active:scale-95 hover:bg-brand-light"
              >
                Editar
              </Link>
              <form action={alternarVacante.bind(null, v.id)}>
                <button
                  type="submit"
                  className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition active:scale-95 ${
                    v.activa
                      ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                      : "border-green-300 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {v.activa ? "Deshabilitar" : "Habilitar"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
