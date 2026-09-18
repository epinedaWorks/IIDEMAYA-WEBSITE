"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

const campo =
  "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand w-full";
const etiqueta = "text-sm font-medium text-foreground/80";

function Requisito({ cumplido, texto }: { cumplido: boolean; texto: string }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${cumplido ? "text-green-700" : "text-foreground/50"}`}>
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          cumplido ? "bg-green-600 text-white" : "border border-black/20"
        }`}
      >
        {cumplido ? "✓" : ""}
      </span>
      {texto}
    </li>
  );
}

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Cambiar contraseña"}
    </button>
  );
}

export default function CambiarPasswordForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const clases = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(nueva)).length;
  const cumpleLargo = nueva.length >= 12;
  const cumpleClases = clases >= 3;
  const coincide = confirmar.length > 0 && nueva === confirmar;

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="actual" className={etiqueta}>Contraseña actual</label>
        <input id="actual" name="actual" type="password" required autoComplete="current-password" className={campo} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nueva" className={etiqueta}>Nueva contraseña</label>
        <input
          id="nueva"
          name="nueva"
          type="password"
          required
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          className={campo}
        />
      </div>

      <ul className="flex flex-col gap-1.5 rounded-lg bg-brand-light/40 p-3">
        <Requisito cumplido={cumpleLargo} texto="Al menos 12 caracteres" />
        <Requisito
          cumplido={cumpleClases}
          texto="Al menos 3 de 4: mayúsculas, minúsculas, números y símbolos"
        />
      </ul>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmar" className={etiqueta}>Confirma la nueva contraseña</label>
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          required
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className={`${campo} ${confirmar.length > 0 && !coincide ? "border-red-400 focus:border-red-500" : ""}`}
        />
        {confirmar.length > 0 && !coincide && (
          <span className="text-xs font-medium text-red-600">Las contraseñas no coinciden.</span>
        )}
      </div>

      <BotonGuardar />
    </form>
  );
}
