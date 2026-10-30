"use client";

import Link from "next/link";
import { useState } from "react";
import ConfirmarAccionBoton from "@/components/admin/ConfirmarAccionBoton";

export type PersonaInvitable = {
  id: string;
  nombre: string;
  correo: string;
  posicion: string | null;
  // "Agendó el …", "Invitada el …" o null si aún no se le ha escrito.
  situacion: string | null;
  yaAgendo: boolean;
  yaInvitada: boolean;
};

// Lista con casillas para elegir a quién mandarle la invitación. Por defecto
// quedan marcadas solo las personas a las que todavía no se les ha escrito.
export default function InvitarSeleccion({
  personas,
  action,
}: {
  personas: PersonaInvitable[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [elegidas, setElegidas] = useState<Set<string>>(
    () => new Set(personas.filter((p) => !p.yaInvitada && !p.yaAgendo).map((p) => p.id))
  );

  const alternar = (id: string) =>
    setElegidas((prev) => {
      const sig = new Set(prev);
      if (sig.has(id)) sig.delete(id);
      else sig.add(id);
      return sig;
    });

  const todasMarcadas = personas.length > 0 && elegidas.size === personas.length;
  const n = elegidas.size;

  return (
    <form action={action}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground/70">
          <input
            type="checkbox"
            checked={todasMarcadas}
            onChange={() => setElegidas(todasMarcadas ? new Set() : new Set(personas.map((p) => p.id)))}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          Seleccionar todas
        </label>
        <ConfirmarAccionBoton
          etiqueta={n === 0 ? "Enviar invitación" : `Enviar invitación a ${n} ${n === 1 ? "persona" : "personas"}`}
          titulo="¿Enviar la invitación?"
          mensaje={`Se enviará un correo a ${n} ${n === 1 ? "persona" : "personas"} con el enlace para agendar su entrevista. A quienes ya la recibieron se les vuelve a enviar.`}
          etiquetaConfirmar="Sí, enviar"
          deshabilitado={n === 0}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-95 disabled:opacity-50"
        />
      </div>

      <ul className="mt-3 divide-y divide-black/5 rounded-xl border border-black/5">
        {personas.map((p) => (
          <li key={p.id} className="flex items-start gap-3 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="ids"
              value={p.id}
              checked={elegidas.has(p.id)}
              onChange={() => alternar(p.id)}
              aria-label={`Invitar a ${p.nombre}`}
              className="mt-1 h-4 w-4 accent-[var(--brand)]"
            />
            <div className="min-w-0 flex-1">
              <Link href={`/admin/postulaciones/${p.id}`} className="font-medium text-brand-dark hover:underline">
                {p.nombre}
              </Link>
              <div className="break-words text-xs text-foreground/60">
                {p.correo}
                {p.posicion ? ` · ${p.posicion}` : ""}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold ${
                p.yaAgendo
                  ? "bg-green-100 text-green-700"
                  : p.yaInvitada
                    ? "bg-blue-100 text-blue-700"
                    : "bg-black/5 text-foreground/60"
              }`}
            >
              {p.situacion ?? "Sin invitar"}
            </span>
          </li>
        ))}
      </ul>
    </form>
  );
}
