import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import {
  PREGUNTAS_TEXTO,
  PREGUNTA_DIA_NO_DISPONIBLE,
  PREGUNTAS_SI_NO,
  OPCIONES_MODALIDAD,
} from "@/lib/postulacion-preguntas";
import { agregarComentario, cambiarEstado } from "./actions";

export const metadata: Metadata = { title: "Postulación | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

const ESTADOS = ["NUEVA", "EN_REVISION", "ENTREVISTA", "RECHAZADA", "CONTRATADA"] as const;
const ESTADO_LABEL: Record<string, string> = {
  NUEVA: "Nueva",
  EN_REVISION: "En revisión",
  ENTREVISTA: "Entrevista",
  RECHAZADA: "Rechazada",
  CONTRATADA: "Contratada",
};
const SI_NO_LABEL: Record<string, string> = { true: "Sí", false: "No" };

export default async function DetallePostulacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;

  const postulacion = await prisma.postulacion.findUnique({
    where: { id },
    include: {
      comentarios: {
        orderBy: { createdAt: "asc" },
        include: { admin: { select: { name: true, email: true } } },
      },
    },
  });

  if (!postulacion) notFound();

  const modalidadLabel =
    OPCIONES_MODALIDAD.find((o) => o.value === postulacion.modalidadTrabajo)?.label ??
    postulacion.modalidadTrabajo;

  const agregarComentarioConId = agregarComentario.bind(null, postulacion.id);
  const cambiarEstadoConId = cambiarEstado.bind(null, postulacion.id);

  return (
    <div>
      <Link href="/admin" className="text-sm text-brand hover:underline">
        ← Volver a postulaciones
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">{postulacion.nombre}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {postulacion.correo}
            {postulacion.telefono ? ` · ${postulacion.telefono}` : ""}
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            Enviado el{" "}
            {postulacion.createdAt.toLocaleDateString("es-GT", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <form action={cambiarEstadoConId} className="flex items-center gap-2">
          <select
            name="estado"
            defaultValue={postulacion.estado}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Actualizar estado
          </button>
        </form>
      </div>

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">Documentos</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={`/api/admin/archivo/${postulacion.cvBlobKey}`}
            className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
          >
            Descargar CV
          </a>
          {postulacion.documentoBlobKey && (
            <a
              href={`/api/admin/archivo/${postulacion.documentoBlobKey}`}
              className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
            >
              Descargar documento adicional
            </a>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">Datos adicionales</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground/50">Modalidad de trabajo</dt>
            <dd className="font-medium">{modalidadLabel}</dd>
          </div>
          {PREGUNTAS_SI_NO.map((p) => (
            <div key={p.key}>
              <dt className="text-foreground/50">{p.label}</dt>
              <dd className="font-medium">
                {SI_NO_LABEL[String(postulacion[p.key as keyof typeof postulacion])]}
              </dd>
            </div>
          ))}
          {postulacion.diaNoDisponible && (
            <div>
              <dt className="text-foreground/50">{PREGUNTA_DIA_NO_DISPONIBLE.label}</dt>
              <dd className="font-medium">{postulacion.diaNoDisponible}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">Cuestionario</h2>
        <div className="mt-3 flex flex-col gap-4">
          {PREGUNTAS_TEXTO.map((p) => (
            <div key={p.key}>
              <p className="text-sm font-medium text-foreground/70">{p.label}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                {String(postulacion[p.key as keyof typeof postulacion])}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">Comentarios internos</h2>
        <div className="mt-4 flex flex-col gap-4">
          {postulacion.comentarios.length === 0 && (
            <p className="text-sm text-foreground/50">Todavía no hay comentarios.</p>
          )}
          {postulacion.comentarios.map((c) => (
            <div key={c.id} className="rounded-lg bg-brand-light/40 p-3 text-sm">
              <p className="whitespace-pre-wrap">{c.texto}</p>
              <p className="mt-1 text-xs text-foreground/50">
                {c.admin.name || c.admin.email} ·{" "}
                {c.createdAt.toLocaleDateString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>

        <form action={agregarComentarioConId} className="mt-4 flex flex-col gap-2">
          <textarea
            name="texto"
            required
            rows={3}
            maxLength={4000}
            placeholder="Escribe un comentario para el equipo…"
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="self-start rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Comentar
          </button>
        </form>
      </section>
    </div>
  );
}
