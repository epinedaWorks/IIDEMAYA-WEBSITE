"use client";

import { useState, useTransition } from "react";
import { invitarPostulacion } from "@/app/admin/entrevistas/actions";

// Manda (o vuelve a mandar) a una persona el correo con su enlace para
// agendar. Al terminar, la acción refresca el detalle y la fecha de la última
// invitación se actualiza sola.
export default function InvitarEntrevistaBoton({ id, yaInvitada }: { id: string; yaInvitada: boolean }) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");
  const [enviada, setEnviada] = useState(false);

  function alHacerClick() {
    setError("");
    setEnviada(false);
    iniciar(async () => {
      try {
        const r = await invitarPostulacion(id);
        if (r.ok) setEnviada(true);
        else setError(r.error ?? "No se pudo enviar la invitación.");
      } catch {
        setError("No se pudo enviar la invitación.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={alHacerClick}
        disabled={pendiente}
        className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand-light active:scale-95 disabled:opacity-60"
      >
        {pendiente ? "Enviando…" : yaInvitada ? "Volver a enviar la invitación" : "Enviar invitación para agendar"}
      </button>
      {enviada && <span className="text-xs font-medium text-green-700">Invitación enviada.</span>}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}
