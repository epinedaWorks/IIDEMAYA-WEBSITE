"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";

export type OpcionSelect<T extends string> = { value: T; label: string; color: string };

// Selector que guarda en cuanto se elige una opción (sin botón) y avisa si
// el cambio se aplicó. `compacto` es la versión en forma de etiqueta de
// color que se usa dentro de la lista. Lo usan el estado y el interés.
export default function SelectGuardado<T extends string>({
  valor: valorInicial,
  opciones,
  guardar,
  mensajeOk,
  mensajeError,
  etiqueta,
  compacto = false,
}: {
  valor: T;
  opciones: readonly OpcionSelect<T>[];
  guardar: (nuevo: T) => Promise<{ ok: boolean }>;
  mensajeOk: (label: string) => string;
  mensajeError: string;
  etiqueta: string;
  compacto?: boolean;
}) {
  const [valor, setValor] = useState<T>(valorInicial);
  const [aviso, setAviso] = useState<"" | "ok" | "error">("");
  const [pendiente, iniciar] = useTransition();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si el servidor manda un valor distinto (por ejemplo tras recargar la
  // lista), manda el servidor.
  useEffect(() => setValor(valorInicial), [valorInicial]);
  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    []
  );

  function mostrarAviso(tipo: "ok" | "error") {
    setAviso(tipo);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(""), tipo === "ok" ? 2500 : 5000);
  }

  function alCambiar(e: ChangeEvent<HTMLSelectElement>) {
    const nuevo = e.target.value as T;
    const anterior = valor;
    setValor(nuevo);
    setAviso("");
    iniciar(async () => {
      try {
        const r = await guardar(nuevo);
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

  const actual = opciones.find((o) => o.value === valor);
  const clasesSelect = compacto
    ? `cursor-pointer rounded-full border-0 py-1 pl-3 pr-7 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand/40 ${actual?.color ?? ""}`
    : "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div className="flex flex-col items-start gap-1">
      <select
        value={valor}
        onChange={alCambiar}
        disabled={pendiente}
        aria-label={etiqueta}
        className={`${clasesSelect} disabled:opacity-60`}
      >
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <span role="status" aria-live="polite" className="min-h-4 text-xs font-medium">
        {pendiente && <span className="text-foreground/50">Guardando…</span>}
        {!pendiente && aviso === "ok" && (
          <span className="text-green-700">{mensajeOk(actual?.label ?? "")}</span>
        )}
        {!pendiente && aviso === "error" && <span className="text-red-600">{mensajeError}</span>}
      </span>
    </div>
  );
}
