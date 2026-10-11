"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { cambiarEstado } from "@/app/admin/postulaciones/[id]/actions";
import { ESTADOS, ESTADO_COLOR, ESTADO_LABEL, type Estado } from "@/lib/postulacion-estados";

// Selector de estado que guarda en cuanto se elige una opción (sin botón) y
// avisa si el cambio se aplicó. `compacto` es la versión en forma de
// etiqueta de color que se usa dentro de la lista.
export default function EstadoSelect({
  id,
  estado,
  compacto = false,
}: {
  id: string;
  estado: Estado;
  compacto?: boolean;
}) {
  const [valor, setValor] = useState<Estado>(estado);
  const [aviso, setAviso] = useState<"" | "ok" | "error">("");
  const [pendiente, iniciar] = useTransition();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si el servidor manda un estado distinto (por ejemplo tras recargar la
  // lista), manda el servidor.
  useEffect(() => setValor(estado), [estado]);
  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  function mostrarAviso(tipo: "ok" | "error") {
    setAviso(tipo);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(""), tipo === "ok" ? 2500 : 5000);
  }

  function alCambiar(e: ChangeEvent<HTMLSelectElement>) {
    const nuevo = e.target.value as Estado;
    const anterior = valor;
    setValor(nuevo);
    setAviso("");
    iniciar(async () => {
      try {
        const r = await cambiarEstado(id, nuevo);
        if (r.ok) {
          mostrarAviso("ok");
        } else {
          setValor(anterior);
          mostrarAviso("error");
        }
      } catch {
        setValor(anterior);
        mostrarAviso("error");
      }
    });
  }

  const clasesSelect = compacto
    ? `cursor-pointer rounded-full border-0 py-1 pl-3 pr-7 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand/40 ${ESTADO_COLOR[valor]}`
    : "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div className={compacto ? "flex flex-col items-start gap-1" : "flex items-center gap-3"}>
      <select
        value={valor}
        onChange={alCambiar}
        disabled={pendiente}
        aria-label="Estado de la postulación"
        className={`${clasesSelect} disabled:opacity-60`}
      >
        {ESTADOS.map((e) => (
          <option key={e} value={e}>
            {ESTADO_LABEL[e]}
          </option>
        ))}
      </select>

      <span role="status" aria-live="polite" className="text-xs font-medium">
        {pendiente && <span className="text-foreground/50">Guardando…</span>}
        {!pendiente && aviso === "ok" && (
          <span className="text-green-700">✓ Estado cambiado a «{ESTADO_LABEL[valor]}»</span>
        )}
        {!pendiente && aviso === "error" && (
          <span className="text-red-600">No se pudo cambiar el estado</span>
        )}
      </span>
    </div>
  );
}
