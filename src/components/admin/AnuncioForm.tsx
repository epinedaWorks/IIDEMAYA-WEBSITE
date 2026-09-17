"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ES_CORREO_ANUNCIO as ES_CORREO, dedupePorCorreo as dedupe } from "@/lib/anuncios";

type Persona = { correo: string; nombre: string };

// Botón + modal de confirmación PROPIOS (no window.confirm: no se puede
// centrar ni estilar). Vive DENTRO del <form> para que useFormStatus
// refleje el envío real.
function BotonEnviar({ total, formRef }: { total: number; formRef: React.RefObject<HTMLFormElement | null> }) {
  const { pending } = useFormStatus();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={pending || total === 0}
        onClick={() => setConfirmando(true)}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Enviando…" : `Enviar a ${total} persona${total === 1 ? "" : "s"}`}
      </button>

      {confirmando && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmando(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-brand-dark">¿Enviar este correo?</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              Se va a enviar, tal cual lo escribiste, a{" "}
              <strong>
                {total} persona{total === 1 ? "" : "s"}
              </strong>
              . No se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmando(false);
                  formRef.current?.requestSubmit();
                }}
                className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Sí, enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AnuncioForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [lista, setLista] = useState<Persona[]>([]);
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const quitar = (correo: string) => setLista((l) => l.filter((p) => p.correo !== correo));

  const agregar = () => {
    const correo = nuevoCorreo.trim().toLowerCase();
    if (!ES_CORREO(correo)) return;
    setLista((l) => dedupe([...l, { correo, nombre: nuevoNombre.trim() || correo.split("@")[0] }]));
    setNuevoCorreo("");
    setNuevoNombre("");
  };

  const vaciarLista = () => setLista([]);
  const limpiarMensaje = () => {
    setAsunto("");
    setMensaje("");
  };

  const inputCls =
    "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <form ref={formRef} action={action} className="mt-6 flex flex-col gap-5">
      {/* La lista de abajo es la ÚNICA fuente de a quién le llega. Viaja como
          JSON; el servidor la usa tal cual, sin ninguna marca ni
          modificación automática al asunto/mensaje. */}
      <input type="hidden" name="destinatariosJson" value={JSON.stringify(lista)} />

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm font-semibold text-brand-dark">
            Destinatarios ({lista.length})
          </strong>
          {lista.length > 0 && (
            <button
              type="button"
              onClick={vaciarLista}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Vaciar lista
            </button>
          )}
        </div>

        <div className="mt-3 flex max-h-56 flex-col gap-1.5 overflow-y-auto">
          {lista.length === 0 && (
            <p className="text-sm text-foreground/50">Nadie en la lista todavía.</p>
          )}
          {lista.map((p) => (
            <div
              key={p.correo}
              className="flex items-center gap-2 rounded-md bg-brand-light/40 px-3 py-1.5 text-sm"
            >
              <span className="flex-1 truncate">
                {p.nombre} <span className="text-foreground/50">· {p.correo}</span>
              </span>
              <button
                type="button"
                onClick={() => quitar(p.correo)}
                title="Quitar de la lista"
                className="font-bold text-red-600 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            placeholder="correo@ejemplo.com"
            value={nuevoCorreo}
            onChange={(e) => setNuevoCorreo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregar())}
            className={`${inputCls} min-w-[180px] flex-1`}
          />
          <input
            placeholder="Nombre (opcional)"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregar())}
            className={`${inputCls} w-40`}
          />
          <button
            type="button"
            onClick={agregar}
            className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
          >
            + Agregar
          </button>
        </div>
        <p className="mt-2 text-xs text-foreground/50">A quien esté aquí le llega el correo. Nada más.</p>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <label htmlFor="asunto" className="text-sm font-semibold text-brand-dark">
          Asunto
        </label>
        <input
          id="asunto"
          name="asunto"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          required
          maxLength={200}
          autoComplete="off"
          placeholder="Ej. Convocatoria para nueva vacante"
          className={`${inputCls} mt-1 w-full`}
        />

        <label htmlFor="mensaje" className="mt-4 block text-sm font-semibold text-brand-dark">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          required
          rows={9}
          maxLength={8000}
          placeholder={"Hola {{nombre}},\n\nEscribe aquí tu mensaje..."}
          className={`${inputCls} mt-1 w-full`}
        />
        <p className="mt-1 text-xs text-foreground/60">
          Usa <code>{"{{nombre}}"}</code> para que salga el nombre de cada quien. Se envía
          exactamente como lo escribas, sin nada agregado.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <BotonEnviar total={lista.length} formRef={formRef} />
        {(asunto || mensaje) && (
          <button
            type="button"
            onClick={limpiarMensaje}
            className="text-sm font-medium text-foreground/60 hover:text-brand"
          >
            Limpiar asunto y mensaje
          </button>
        )}
      </div>
    </form>
  );
}
