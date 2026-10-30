"use client";

// Expande o contrae de una vez todos los <details data-despliegue="<objetivo>">.
export default function ControlesDespliegue({ objetivo }: { objetivo: string }) {
  const cambiar = (abrir: boolean) =>
    document
      .querySelectorAll<HTMLDetailsElement>(`details[data-despliegue="${objetivo}"]`)
      .forEach((d) => {
        d.open = abrir;
      });

  const cls = "text-xs font-medium text-brand underline-offset-2 hover:underline";
  return (
    <div className="flex gap-3">
      <button type="button" onClick={() => cambiar(true)} className={cls}>
        Expandir todo
      </button>
      <button type="button" onClick={() => cambiar(false)} className={cls}>
        Contraer todo
      </button>
    </div>
  );
}
