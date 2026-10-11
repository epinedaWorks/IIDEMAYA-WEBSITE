"use client";

import { useState, useTransition } from "react";
import { generarResumenIA } from "@/app/admin/postulaciones/[id]/actions";

// Genera (o vuelve a generar) el resumen con IA de una postulación. Al
// terminar, la acción refresca la página y el texto aparece solo.
export default function GenerarResumenBoton({
  id,
  etiqueta = "Generar resumen",
  compacto = false,
}: {
  id: string;
  etiqueta?: string;
  compacto?: boolean;
}) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");

  function alHacerClick() {
    setError("");
    iniciar(async () => {
      try {
        const r = await generarResumenIA(id);
        if (!r.ok) setError(r.error ?? "No se pudo generar el resumen.");
      } catch {
        setError("No se pudo generar el resumen.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={alHacerClick}
        disabled={pendiente}
        className={
          compacto
            ? "rounded-lg border border-brand px-3 py-1 text-xs font-medium text-brand transition hover:bg-brand-light active:scale-95 disabled:opacity-60"
            : "rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand-light active:scale-95 disabled:opacity-60"
        }
      >
        {pendiente ? "Generando…" : etiqueta}
      </button>
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}
