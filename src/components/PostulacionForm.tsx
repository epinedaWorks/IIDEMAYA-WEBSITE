"use client";

import { useState, type FormEvent } from "react";
import {
  PREGUNTAS_TEXTO,
  PREGUNTA_DIA_NO_DISPONIBLE,
  PREGUNTAS_SI_NO,
  OPCIONES_MODALIDAD,
} from "@/lib/postulacion-preguntas";

type Estado = "idle" | "enviando" | "ok" | "error";

const campo = "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand w-full";
const etiqueta = "text-sm font-medium text-foreground/80";

export default function PostulacionForm() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setEstado("enviando");
    setErrorMsg("");
    try {
      const res = await fetch("/api/talento", { method: "POST", body: data });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.error || "No se pudo enviar tu postulación.");
        setEstado("error");
        return;
      }
      setEstado("ok");
      form.reset();
    } catch {
      setErrorMsg("No se pudo enviar tu postulación. Revisa tu conexión.");
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">¡Postulación enviada!</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          Gracias por tu interés en IIDEMAYA. Revisamos tu información y te contactaremos a tu
          correo si tu perfil avanza en el proceso.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-brand-dark">Datos de contacto</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className={etiqueta}>Nombre completo</label>
            <input id="nombre" name="nombre" required maxLength={200} className={campo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="correo" className={etiqueta}>Correo</label>
            <input id="correo" name="correo" type="email" required maxLength={200} className={campo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="telefono" className={etiqueta}>Teléfono (opcional)</label>
            <input id="telefono" name="telefono" maxLength={50} className={campo} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-brand-dark">Sobre usted</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="modalidadTrabajo" className={etiqueta}>
              ¿Qué modalidad de trabajo prefiere?
            </label>
            <select id="modalidadTrabajo" name="modalidadTrabajo" required defaultValue="" className={campo}>
              <option value="" disabled>Selecciona una opción</option>
              {OPCIONES_MODALIDAD.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {PREGUNTAS_SI_NO.map((p) => (
            <fieldset key={p.key} className="flex flex-col gap-1.5">
              <legend className={etiqueta}>{p.label}</legend>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name={p.key} value="si" required /> Sí
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name={p.key} value="no" required /> No
                </label>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-brand-dark">Cuestionario</h2>
        <div className="mt-4 flex flex-col gap-4">
          {PREGUNTAS_TEXTO.map((p) => (
            <div key={p.key} className="flex flex-col gap-1.5">
              <label htmlFor={p.key} className={etiqueta}>{p.label}</label>
              <textarea id={p.key} name={p.key} required rows={3} maxLength={4000} className={campo} />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={PREGUNTA_DIA_NO_DISPONIBLE.key} className={etiqueta}>
              {PREGUNTA_DIA_NO_DISPONIBLE.label}
            </label>
            <input
              id={PREGUNTA_DIA_NO_DISPONIBLE.key}
              name={PREGUNTA_DIA_NO_DISPONIBLE.key}
              maxLength={200}
              className={campo}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-brand-dark">Documentos</h2>
        <p className="mt-1 text-sm text-foreground/60">Formatos aceptados: PDF o Word, hasta 8 MB.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cv" className={etiqueta}>CV</label>
            <input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx" required className={campo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="documento" className={etiqueta}>
              Otro documento (opcional)
            </label>
            <input id="documento" name="documento" type="file" accept=".pdf,.doc,.docx" className={campo} />
          </div>
        </div>
      </section>

      {estado === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="self-start rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando…" : "Enviar postulación"}
      </button>
    </form>
  );
}
