import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { formatearFechaGt, formatearFechaHoraGt } from "@/lib/fecha";
import {
  PREGUNTAS_TEXTO,
  PREGUNTA_DIA_NO_DISPONIBLE,
  PREGUNTAS_SI_NO,
  OPCIONES_MODALIDAD,
} from "@/lib/postulacion-preguntas";
import { agregarComentario, eliminarPostulacion } from "./actions";
import EliminarPostulacionBoton from "@/components/admin/EliminarPostulacionBoton";
import EstadoSelect from "@/components/admin/EstadoSelect";
import InteresSelect from "@/components/admin/InteresSelect";
import { consultaDeFiltros, leerFiltros, whereDeFiltros } from "@/lib/postulacion-filtros";
import GenerarResumenBoton from "@/components/admin/GenerarResumenBoton";
import { iaConfigurada } from "@/lib/resumen-ia";

export const metadata: Metadata = { title: "Postulación | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

const SI_NO_LABEL: Record<string, string> = { true: "Sí", false: "No" };

export default async function DetallePostulacion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const filtros = leerFiltros(await searchParams);

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

  // Anterior / siguiente según el orden de la lista (más recientes primero)
  // y los filtros con los que se llegó. Si esta postulación quedó fuera de
  // esos filtros (por ejemplo, se le cambió el interés), se usa la lista
  // completa para no dejar al equipo sin navegación.
  const idsDe = async (donde: ReturnType<typeof whereDeFiltros>) =>
    (
      await prisma.postulacion.findMany({
        where: donde,
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    ).map((p) => p.id);

  let consulta = consultaDeFiltros(filtros);
  let ids = await idsDe(whereDeFiltros(filtros));
  if (!ids.includes(postulacion.id)) {
    consulta = "";
    ids = await idsDe({});
  }
  const posicionEnLista = ids.indexOf(postulacion.id);
  const idAnterior = posicionEnLista > 0 ? ids[posicionEnLista - 1] : null;
  const idSiguiente =
    posicionEnLista >= 0 && posicionEnLista < ids.length - 1 ? ids[posicionEnLista + 1] : null;

  const sufijo = consulta ? `?${consulta}` : "";
  const rutaLista = `/admin${sufijo}`;
  const rutaDe = (otroId: string) => `/admin/postulaciones/${otroId}${sufijo}`;

  const agregarComentarioConId = agregarComentario.bind(null, postulacion.id);
  // Al eliminar, se sigue con la siguiente postulación (o la anterior, o la
  // lista si era la única) en vez de perder el hilo.
  const eliminarPostulacionConId = eliminarPostulacion.bind(
    null,
    postulacion.id,
    idSiguiente ? rutaDe(idSiguiente) : idAnterior ? rutaDe(idAnterior) : rutaLista
  );

  const botonNavegacion =
    "rounded-full border border-brand px-4 py-1.5 text-sm font-medium text-brand transition hover:bg-brand-light active:scale-95";
  const botonNavegacionInactivo =
    "rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium text-foreground/30";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={rutaLista} className="text-sm text-brand hover:underline">
          ← Volver a postulaciones
        </Link>

        <nav aria-label="Navegar entre postulantes" className="flex items-center gap-2">
          {idAnterior ? (
            <Link href={rutaDe(idAnterior)} className={botonNavegacion}>
              ← Anterior
            </Link>
          ) : (
            <span className={botonNavegacionInactivo} aria-disabled="true">
              ← Anterior
            </span>
          )}
          {posicionEnLista >= 0 && (
            <span className="px-1 text-xs font-medium text-foreground/60">
              {posicionEnLista + 1} de {ids.length}
            </span>
          )}
          {idSiguiente ? (
            <Link href={rutaDe(idSiguiente)} className={botonNavegacion}>
              Siguiente →
            </Link>
          ) : (
            <span className={botonNavegacionInactivo} aria-disabled="true">
              Siguiente →
            </span>
          )}
        </nav>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">{postulacion.nombre}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {postulacion.correo}
            {postulacion.telefono ? ` · ${postulacion.telefono}` : ""}
          </p>
          {postulacion.direccion && (
            <p className="mt-1 text-sm text-foreground/60">Dirección: {postulacion.direccion}</p>
          )}
          <p className="mt-1 text-sm font-medium text-brand">
            Posición: {postulacion.vacanteTitulo ?? "Postulación general"}
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            Enviado el {formatearFechaGt(postulacion.createdAt, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-foreground/60">Estado</span>
            <EstadoSelect id={postulacion.id} estado={postulacion.estado} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-foreground/60">Interés de la empresa</span>
            <InteresSelect id={postulacion.id} interes={postulacion.interes} />
          </div>
          <div className="pt-5">
            <EliminarPostulacionBoton nombre={postulacion.nombre} action={eliminarPostulacionConId} />
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-dark">Resumen sugerido con IA</h2>
          {iaConfigurada() && (
            <GenerarResumenBoton
              id={postulacion.id}
              compacto
              etiqueta={postulacion.resumenIA ? "Volver a generar" : "Generar resumen"}
            />
          )}
        </div>
        {postulacion.resumenIA ? (
          <>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {postulacion.resumenIA}
            </p>
            <p className="mt-3 text-xs text-foreground/50">
              Generado por IA a partir de las respuestas del cuestionario
              {postulacion.resumenIAAt ? ` · ${formatearFechaHoraGt(postulacion.resumenIAAt)}` : ""}.
              Es una sugerencia para leer más rápido; revisa siempre las respuestas completas.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-foreground/60">
            {iaConfigurada()
              ? "Todavía no hay resumen para esta postulación."
              : "La IA no está configurada en este sitio."}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
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
          <a
            href={`/api/admin/postulaciones/${postulacion.id}/pdf`}
            className="rounded-full bg-accent-light px-4 py-2 text-sm font-medium text-accent hover:brightness-95"
          >
            Descargar cuestionario en PDF
          </a>
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
                {c.admin.name || c.admin.email} · {formatearFechaHoraGt(c.createdAt)}
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
