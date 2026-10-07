import Link from "next/link";

type Valores = {
  titulo: string;
  resumen: string;
  modalidad: string;
  funciones: string[];
  requisitos: string[];
  activa: boolean;
  orden: number;
};

const campo =
  "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand";
const etiqueta = "text-sm font-semibold text-brand-dark";
const ayuda = "mt-1 text-xs text-foreground/60";

// Formulario compartido para crear y editar una vacante (sin estado de
// cliente: es un <form> con server action).
export default function VacanteForm({
  action,
  valores,
  error,
  textoBoton,
}: {
  action: (formData: FormData) => void | Promise<void>;
  valores?: Valores;
  error?: boolean;
  textoBoton: string;
}) {
  return (
    <form action={action} className="mt-6 flex flex-col gap-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
          Completa el título, el resumen y la modalidad.
        </p>
      )}

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <label htmlFor="titulo" className={etiqueta}>Título de la plaza</label>
        <input
          id="titulo"
          name="titulo"
          required
          maxLength={150}
          defaultValue={valores?.titulo}
          placeholder="Ej. Desarrollador(a) Junior"
          className={campo}
        />

        <label htmlFor="resumen" className={`${etiqueta} mt-5 block`}>Resumen</label>
        <textarea
          id="resumen"
          name="resumen"
          required
          rows={3}
          maxLength={1500}
          defaultValue={valores?.resumen}
          placeholder="Qué hará la persona, explicado de forma sencilla."
          className={campo}
        />

        <label htmlFor="modalidad" className={`${etiqueta} mt-5 block`}>Modalidad</label>
        <input
          id="modalidad"
          name="modalidad"
          required
          maxLength={400}
          defaultValue={valores?.modalidad}
          placeholder="Ej. Presencial, tiempo completo"
          className={campo}
        />
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <label htmlFor="funciones" className={etiqueta}>Lo que hará (funciones)</label>
        <textarea
          id="funciones"
          name="funciones"
          rows={7}
          defaultValue={valores?.funciones.join("\n")}
          className={campo}
        />
        <p className={ayuda}>Una viñeta por línea.</p>

        <label htmlFor="requisitos" className={`${etiqueta} mt-5 block`}>Lo que buscamos (requisitos)</label>
        <textarea
          id="requisitos"
          name="requisitos"
          rows={7}
          defaultValue={valores?.requisitos.join("\n")}
          className={campo}
        />
        <p className={ayuda}>Una viñeta por línea.</p>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
          <input type="checkbox" name="activa" defaultChecked={valores?.activa ?? true} />
          Plaza habilitada (visible en /vacantes y en el formulario de postulación)
        </label>

        <label htmlFor="orden" className={`${etiqueta} mt-5 block`}>Orden</label>
        <input
          id="orden"
          name="orden"
          type="number"
          defaultValue={valores?.orden}
          placeholder="Vacío = al final"
          className={`${campo} max-w-[10rem]`}
        />
        <p className={ayuda}>Las plazas con número menor aparecen primero.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition active:scale-95 hover:bg-brand-dark"
        >
          {textoBoton}
        </button>
        <Link
          href="/admin/vacantes"
          className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
