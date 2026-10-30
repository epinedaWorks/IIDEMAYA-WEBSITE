"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConfirmarAccionBoton from "@/components/admin/ConfirmarAccionBoton";
import { INTERESES, INTERES_COLOR, INTERES_LABEL, type Interes } from "@/lib/postulacion-interes";

export type PersonaInvitable = {
  // "p:<id>" = postulante, "i:<id>" = invitado a mano. Es lo que recibe la acción.
  clave: string;
  id: string;
  invitadoManual: boolean;
  nombre: string;
  correo: string;
  posicion: string | null;
  interes: Interes | null;
  // "Agendó: …", "Invitada el …" o null si aún no se le ha escrito.
  situacion: string | null;
  yaAgendo: boolean;
  yaInvitada: boolean;
};

const GENERAL = "__general__";

const selectCls =
  "rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand";

// Lista para elegir a quién mandarle la invitación. Nadie viene marcada: el
// equipo filtra (puesto, interés, situación, origen) y marca a quien quiera.
// Lo marcado se conserva aunque después cambien los filtros.
export default function InvitarSeleccion({
  personas,
  action,
  quitarInvitado,
}: {
  personas: PersonaInvitable[];
  action: (formData: FormData) => void | Promise<void>;
  quitarInvitado: (id: string) => void | Promise<void>;
}) {
  const [elegidas, setElegidas] = useState<Set<string>>(() => new Set());
  const [posicion, setPosicion] = useState("");
  const [interes, setInteres] = useState("");
  const [situacion, setSituacion] = useState("");
  const [origen, setOrigen] = useState("");

  const posiciones = useMemo(
    () => [...new Set(personas.map((p) => p.posicion).filter((x): x is string => Boolean(x)))].sort(),
    [personas]
  );

  const visibles = useMemo(
    () =>
      personas.filter((p) => {
        if (origen === "postulante" && p.invitadoManual) return false;
        if (origen === "invitado" && !p.invitadoManual) return false;
        // Quien fue invitado a mano no tiene puesto ni interés: con esos
        // filtros puestos no cuenta.
        if (posicion) {
          if (p.invitadoManual) return false;
          if (posicion === GENERAL ? p.posicion !== null : p.posicion !== posicion) return false;
        }
        if (interes && p.interes !== interes) return false;
        if (situacion === "sin" && (p.yaInvitada || p.yaAgendo)) return false;
        if (situacion === "sinagendar" && !(p.yaInvitada && !p.yaAgendo)) return false;
        if (situacion === "agendo" && !p.yaAgendo) return false;
        return true;
      }),
    [personas, posicion, interes, situacion, origen]
  );

  const alternar = (clave: string) =>
    setElegidas((prev) => {
      const sig = new Set(prev);
      if (sig.has(clave)) sig.delete(clave);
      else sig.add(clave);
      return sig;
    });

  const todasVisiblesMarcadas = visibles.length > 0 && visibles.every((p) => elegidas.has(p.clave));
  const alternarVisibles = () =>
    setElegidas((prev) => {
      const sig = new Set(prev);
      for (const p of visibles) {
        if (todasVisiblesMarcadas) sig.delete(p.clave);
        else sig.add(p.clave);
      }
      return sig;
    });

  const hayFiltros = Boolean(posicion || interes || situacion || origen);
  const n = elegidas.size;

  return (
    <form action={action}>
      {/* Lo marcado viaja aunque la fila esté oculta por un filtro. */}
      {[...elegidas].map((clave) => (
        <input key={clave} type="hidden" name="ids" value={clave} />
      ))}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-foreground/60">
          Puesto
          <select value={posicion} onChange={(e) => setPosicion(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {posiciones.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value={GENERAL}>Postulación general</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-foreground/60">
          Interés de la empresa
          <select value={interes} onChange={(e) => setInteres(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {INTERESES.map((i) => (
              <option key={i} value={i}>
                {INTERES_LABEL[i]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-foreground/60">
          Situación
          <select value={situacion} onChange={(e) => setSituacion(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            <option value="sin">Sin invitar</option>
            <option value="sinagendar">Invitadas, sin agendar</option>
            <option value="agendo">Ya agendaron</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-foreground/60">
          Origen
          <select value={origen} onChange={(e) => setOrigen(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            <option value="postulante">Postularon en el sitio</option>
            <option value="invitado">Invitados a mano</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground/70">
            <input
              type="checkbox"
              checked={todasVisiblesMarcadas}
              disabled={visibles.length === 0}
              onChange={alternarVisibles}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            {hayFiltros ? `Seleccionar las ${visibles.length} que se ven` : "Seleccionar todas"}
          </label>
          <span className="text-xs text-foreground/50">
            {visibles.length} de {personas.length} · {n} {n === 1 ? "seleccionada" : "seleccionadas"}
          </span>
          {n > 0 && (
            <button type="button" onClick={() => setElegidas(new Set())} className="text-xs font-medium text-foreground/60 underline">
              Quitar la selección
            </button>
          )}
        </div>
        <ConfirmarAccionBoton
          etiqueta={n === 0 ? "Enviar invitación" : `Enviar invitación a ${n} ${n === 1 ? "persona" : "personas"}`}
          titulo="¿Enviar la invitación?"
          mensaje={`Se enviará un correo a ${n} ${n === 1 ? "persona" : "personas"} con el enlace para agendar su entrevista. A quienes ya la recibieron se les vuelve a enviar.`}
          etiquetaConfirmar="Sí, enviar"
          deshabilitado={n === 0}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-95 disabled:opacity-50"
        />
      </div>

      {visibles.length === 0 ? (
        <p className="mt-3 rounded-xl border border-black/5 px-4 py-6 text-center text-sm text-foreground/60">
          Nadie coincide con esos filtros.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-black/5 rounded-xl border border-black/5">
          {visibles.map((p) => (
            <li key={p.clave} className="flex items-start gap-3 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={elegidas.has(p.clave)}
                onChange={() => alternar(p.clave)}
                aria-label={`Invitar a ${p.nombre}`}
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {p.invitadoManual ? (
                    <span className="font-medium text-brand-dark">{p.nombre}</span>
                  ) : (
                    <Link href={`/admin/postulaciones/${p.id}`} className="font-medium text-brand-dark hover:underline">
                      {p.nombre}
                    </Link>
                  )}
                  {p.invitadoManual ? (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                      Invitado a mano
                    </span>
                  ) : (
                    p.interes &&
                    p.interes !== "SIN_VALORAR" && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${INTERES_COLOR[p.interes]}`}>
                        {INTERES_LABEL[p.interes]}
                      </span>
                    )
                  )}
                </div>
                <div className="break-words text-xs text-foreground/60">
                  {p.correo}
                  {p.posicion ? ` · ${p.posicion}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                    p.yaAgendo
                      ? "bg-green-100 text-green-700"
                      : p.yaInvitada
                        ? "bg-blue-100 text-blue-700"
                        : "bg-black/5 text-foreground/60"
                  }`}
                >
                  {p.situacion ?? "Sin invitar"}
                </span>
                {p.invitadoManual && (
                  <button
                    type="submit"
                    formNoValidate
                    formAction={async () => {
                      setElegidas((prev) => {
                        const sig = new Set(prev);
                        sig.delete(p.clave);
                        return sig;
                      });
                      await quitarInvitado(p.id);
                    }}
                    className="text-xs font-medium text-red-600 underline"
                  >
                    Quitar de la lista
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
