"use client";

import { useState } from "react";

// Modal de confirmación propio (no window.confirm) — mismo patrón que ya
// se usa en Anuncios antes de un envío masivo, aquí antes de una acción
// igual de irreversible.
export default function EliminarPostulacionBoton({
  nombre,
  action,
  compacto = false,
}: {
  nombre: string;
  action: () => void | Promise<void>;
  compacto?: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label={`Eliminar postulación de ${nombre}`}
        className={
          compacto
            ? "rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 active:scale-95"
            : "rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        }
      >
        {compacto ? "Eliminar" : "Eliminar postulación"}
      </button>

      {confirmando && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmando(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-brand-dark">¿Eliminar esta postulación?</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              Se eliminará para siempre la postulación de <strong>{nombre}</strong>, junto con su CV,
              documentos y comentarios internos. No se puede deshacer.
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
                  action();
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
