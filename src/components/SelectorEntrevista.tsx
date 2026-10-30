"use client";

import { useState, useTransition } from "react";
import { agendarEntrevista } from "@/app/entrevista/[token]/actions";

export type DiaDisponible = {
  clave: string;
  titulo: string;
  franjas: { id: string; hora: string }[];
};

export type ReservaActual = {
  id: string;
  cuando: string;
  rango: string;
  detalle: string | null;
  puedeCambiar: boolean;
};

const esEnlace = (t: string) => /^https?:\/\/\S+$/i.test(t.trim());

export default function SelectorEntrevista({
  token,
  dias,
  reserva,
}: {
  token: string;
  dias: DiaDisponible[];
  reserva: ReservaActual | null;
}) {
  const [cambiando, setCambiando] = useState(false);
  const [elegida, setElegida] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();

  function confirmar() {
    if (!elegida) return;
    setError("");
    iniciar(async () => {
      try {
        const r = await agendarEntrevista(token, elegida);
        if (!r.ok) {
          setError(r.error);
          setElegida(null);
        }
      } catch {
        setError("No se pudo agendar. Revisa tu conexión e intenta de nuevo.");
      }
    });
  }

  if (reserva && !cambiando) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-green-800">¡Tu entrevista está agendada!</h2>
        <p className="mt-3 text-lg font-semibold first-letter:uppercase text-brand-dark">{reserva.cuando}</p>
        <p className="text-sm text-foreground/70">{reserva.rango} (hora de Guatemala)</p>
        {reserva.detalle && (
          <p className="mt-3 text-sm text-foreground/80">
            <span className="font-semibold">Dónde / cómo: </span>
            {esEnlace(reserva.detalle) ? (
              <a href={reserva.detalle.trim()} target="_blank" rel="noopener noreferrer" className="break-all text-brand underline">
                {reserva.detalle.trim()}
              </a>
            ) : (
              reserva.detalle
            )}
          </p>
        )}
        <p className="mt-3 text-sm text-foreground/70">Te enviamos la confirmación a tu correo.</p>
        {reserva.puedeCambiar ? (
          <button
            type="button"
            onClick={() => setCambiando(true)}
            className="mt-4 rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand transition hover:bg-brand-light active:scale-95"
          >
            Cambiar mi horario
          </button>
        ) : (
          <p className="mt-4 text-xs text-foreground/60">
            Tu entrevista es muy pronto para cambiarla desde aquí. Si no puedes asistir, escríbenos por correo.
          </p>
        )}
      </div>
    );
  }

  if (dias.length === 0) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <p className="font-semibold text-brand-dark">Por ahora no hay horarios disponibles.</p>
        <p className="mt-2 text-sm text-foreground/70">
          Habilitaremos nuevos horarios pronto. Vuelve a abrir este enlace más tarde o responde al
          correo que te enviamos y nos pondremos de acuerdo contigo.
        </p>
        {reserva && (
          <button
            type="button"
            onClick={() => setCambiando(false)}
            className="mt-4 text-sm font-medium text-brand underline"
          >
            Volver a mi entrevista
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-dark">
        {reserva ? "Elige tu nuevo horario" : "Elige el día y la hora"}
      </h2>
      <p className="mt-1 text-sm text-foreground/60">Los horarios están en hora de Guatemala.</p>

      <div className="mt-5 flex flex-col gap-5">
        {dias.map((d) => (
          <div key={d.clave}>
            <h3 className="text-sm font-semibold first-letter:uppercase text-brand">{d.titulo}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {d.franjas.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setElegida(f.id)}
                  aria-pressed={elegida === f.id}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition active:scale-95 ${
                    elegida === f.id
                      ? "border-brand bg-brand text-white"
                      : "border-black/10 text-foreground/80 hover:border-brand hover:bg-brand-light"
                  }`}
                >
                  {f.hora}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={confirmar}
          disabled={!elegida || pendiente}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-95 disabled:opacity-50"
        >
          {pendiente ? "Agendando…" : "Confirmar entrevista"}
        </button>
        {reserva && (
          <button
            type="button"
            onClick={() => setCambiando(false)}
            className="text-sm font-medium text-foreground/60 underline"
          >
            Cancelar cambio
          </button>
        )}
      </div>
    </div>
  );
}
