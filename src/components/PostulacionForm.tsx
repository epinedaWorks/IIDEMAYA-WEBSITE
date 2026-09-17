"use client";

import { useRef, useState, type ClipboardEvent, type FormEvent } from "react";
import {
  PREGUNTAS_TEXTO,
  PREGUNTA_DIA_NO_DISPONIBLE,
  PREGUNTAS_SI_NO,
  OPCIONES_MODALIDAD,
} from "@/lib/postulacion-preguntas";

type Estado = "idle" | "enviando" | "ok" | "error";

const campo = "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand w-full";
const etiqueta = "text-sm font-medium text-foreground/80";

// Cuenta cuántos campos requeridos del form están completos para la barra
// de progreso. Los radios se agrupan por name (un grupo cuenta como 1 campo,
// satisfecho si alguna opción está marcada).
function calcularProgreso(form: HTMLFormElement): number {
  const elementos = Array.from(form.elements) as HTMLInputElement[];
  const requeridos = elementos.filter((el) => el.required);
  const nombresVistos = new Set<string>();
  let total = 0;
  let completos = 0;

  for (const el of requeridos) {
    if (el.type === "radio") {
      if (nombresVistos.has(el.name)) continue;
      nombresVistos.add(el.name);
      total++;
      const grupo = form.querySelectorAll<HTMLInputElement>(`input[name="${el.name}"]`);
      if (Array.from(grupo).some((r) => r.checked)) completos++;
      continue;
    }
    total++;
    if (el.type === "file") {
      if (el.files && el.files.length > 0) completos++;
    } else if (el.value.trim()) {
      completos++;
    }
  }

  return total === 0 ? 0 : Math.round((completos / total) * 100);
}

function bloquearPortapapeles(e: ClipboardEvent<HTMLElement>) {
  e.preventDefault();
}

export default function PostulacionForm() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progreso, setProgreso] = useState(0);
  const [correo, setCorreo] = useState("");
  const [confirmCorreo, setConfirmCorreo] = useState("");
  const [avisoPortapapeles, setAvisoPortapapeles] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const avisoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const correoNoCoincide = confirmCorreo.length > 0 && correo.trim().toLowerCase() !== confirmCorreo.trim().toLowerCase();

  function actualizarProgreso() {
    if (formRef.current) setProgreso(calcularProgreso(formRef.current));
  }

  function avisarBloqueo(e: ClipboardEvent<HTMLElement>) {
    bloquearPortapapeles(e);
    setAvisoPortapapeles(true);
    if (avisoTimeout.current) clearTimeout(avisoTimeout.current);
    avisoTimeout.current = setTimeout(() => setAvisoPortapapeles(false), 3500);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (correoNoCoincide) return;
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
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onChange={actualizarProgreso}
      onInput={actualizarProgreso}
      className="flex flex-col gap-8"
    >
      {/* Barra de progreso — pegada bajo el header al hacer scroll */}
      <div className="sticky top-[65px] z-40 -mx-6 bg-background/95 px-6 py-3 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:border-black/5 sm:px-5 sm:shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-brand-dark">
          <span>Avance del formulario</span>
          <span>{progreso}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-brand-light">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-brand-dark">Datos de contacto</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className={etiqueta}>Nombre completo</label>
            <input id="nombre" name="nombre" required maxLength={200} className={campo} />
          </div>
          <div />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="correo" className={etiqueta}>Correo</label>
            <input
              id="correo"
              name="correo"
              type="email"
              required
              maxLength={200}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={campo}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmCorreo" className={etiqueta}>Confirma tu correo</label>
            <input
              id="confirmCorreo"
              name="confirmCorreo"
              type="email"
              required
              maxLength={200}
              value={confirmCorreo}
              onChange={(e) => setConfirmCorreo(e.target.value)}
              onPaste={bloquearPortapapeles}
              aria-invalid={correoNoCoincide}
              className={`${campo} ${correoNoCoincide ? "border-red-400 focus:border-red-500" : ""}`}
            />
            {correoNoCoincide && (
              <span className="text-xs font-medium text-red-600">Los correos no coinciden.</span>
            )}
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
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-brand-dark">Cuestionario</h2>
          <span className="rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-accent">
            Responde con tus propias palabras — copiar y pegar está desactivado aquí
          </span>
        </div>
        <div
          className="mt-4 flex flex-col gap-4"
          onCopy={avisarBloqueo}
          onCut={avisarBloqueo}
          onPaste={avisarBloqueo}
        >
          {avisoPortapapeles && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              Copiar y pegar está desactivado en esta sección — escribe tu respuesta directamente.
            </p>
          )}
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
        disabled={estado === "enviando" || correoNoCoincide}
        className="self-start rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando…" : "Enviar postulación"}
      </button>
    </form>
  );
}
