"use client";

import { useState } from "react";

// Botón que pide confirmación en un modal antes de enviar el formulario que
// lo contiene (mismo estilo que el de eliminar una postulación). El botón de
// confirmar es el que envía el formulario; con `formAction` puede usar una
// acción distinta a la del formulario, así un mismo formulario puede tener
// varios botones de envío con su propia confirmación.
export default function ConfirmarAccionBoton({
  etiqueta,
  titulo,
  mensaje,
  etiquetaConfirmar,
  className,
  deshabilitado = false,
  formAction,
}: {
  etiqueta: string;
  titulo: string;
  mensaje: string;
  etiquetaConfirmar: string;
  className: string;
  deshabilitado?: boolean;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button type="button" disabled={deshabilitado} onClick={() => setAbierto(true)} className={className}>
        {etiqueta}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-brand-dark">{titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">{mensaje}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                formAction={formAction}
                formNoValidate
                // El cierre espera al siguiente ciclo: si se desmontara el
                // botón durante el clic, el formulario no llegaría a enviarse.
                onClick={() => setTimeout(() => setAbierto(false), 0)}
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {etiquetaConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
