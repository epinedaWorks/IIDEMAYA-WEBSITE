"use client";

import { useState } from "react";

const MENSAJE_SUGERIDO =
  "Nos gustaría conocerte y agendar una entrevista contigo. Elige el día y la hora que mejor te acomoden con el botón de abajo.\n\nSi tienes alguna duda, responde a este correo.";

// Cómo sale la invitación: con el mensaje predeterminado o uno propio, y a
// quién más se le copia. Va dentro del formulario de invitaciones (sus campos
// se envían junto con él). Plegado por defecto para no alargar la página.
export default function OpcionesCorreo({ correosEquipo }: { correosEquipo: string[] }) {
  const [personalizado, setPersonalizado] = useState(false);
  const [copias, setCopias] = useState("");
  const [equipo, setEquipo] = useState(false);

  const nCopias = copias.split(/[\s,;]+/).filter(Boolean).length + (equipo ? correosEquipo.length : 0);

  return (
    <details className="mt-4 rounded-xl border border-black/5 bg-white">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-brand-dark">
        Mensaje y copias del correo
        <span className="ml-2 text-xs font-normal text-foreground/60">
          {personalizado ? "mensaje personalizado" : "mensaje predeterminado"} ·{" "}
          {nCopias === 0 ? "sin copias" : `${nCopias} ${nCopias === 1 ? "copia" : "copias"}`}
        </span>
      </summary>

      <div className="grid gap-5 border-t border-black/5 px-4 py-4 lg:grid-cols-2">
        <fieldset>
          <legend className="text-xs font-semibold text-foreground/60">Mensaje</legend>
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="modoMensaje"
              value="predeterminado"
              checked={!personalizado}
              onChange={() => setPersonalizado(false)}
              className="mt-1 accent-[var(--brand)]"
            />
            <span>
              Usar el mensaje predeterminado
              <span className="block text-xs text-foreground/60">
                A quienes postularon: «Gracias por postularte… Nos gustaría conocerte: elige el día y la
                hora». A quienes invitas a mano: «Nos gustaría conocerte y te invitamos a una
                entrevista…».
              </span>
            </span>
          </label>
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="modoMensaje"
              value="personalizado"
              checked={personalizado}
              onChange={() => setPersonalizado(true)}
              className="mt-1 accent-[var(--brand)]"
            />
            <span>Escribir un mensaje personalizado</span>
          </label>

          {personalizado && (
            <>
              <textarea
                name="mensaje"
                rows={6}
                maxLength={2000}
                defaultValue={MENSAJE_SUGERIDO}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <p className="mt-1 text-xs text-foreground/60">
                Escribe <code>{"{{nombre}}"}</code> donde quieras el primer nombre de cada persona. El
                botón «Agendar mi entrevista» con su enlace se agrega siempre debajo del mensaje.
              </p>
            </>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold text-foreground/60">Con copia a más personas</legend>
          <textarea
            name="cc"
            rows={3}
            value={copias}
            onChange={(e) => setCopias(e.target.value)}
            placeholder={"jefe@iidemaya.org.gt\notra@correo.com"}
            className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <p className="mt-1 text-xs text-foreground/60">
            Un correo por línea (o separados por comas). Máximo 10. Cada invitación sale con estas copias.
          </p>

          {correosEquipo.length > 0 && (
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="copiaEquipo"
                checked={equipo}
                onChange={(e) => setEquipo(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
              />
              <span>
                Copiar también al equipo
                <span className="block break-all text-xs text-foreground/60">{correosEquipo.join(", ")}</span>
              </span>
            </label>
          )}

          <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-foreground/60">
            Tipo de copia
            <select
              name="tipoCopia"
              defaultValue="cc"
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-normal text-foreground outline-none focus:border-brand"
            >
              <option value="cc">Visible (CC): la persona ve a quién más se le copia</option>
              <option value="bcc">Oculta (BCC): la persona no lo ve</option>
            </select>
          </label>
        </fieldset>
      </div>
    </details>
  );
}
