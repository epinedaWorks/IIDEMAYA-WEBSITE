"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const campo =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand";

// Filtros de la lista. Se aplican en cuanto cambia cualquier campo (la
// posición y las fechas viajan en la dirección, así que se pueden compartir
// o recargar sin perder el filtro).
export default function FiltrosPostulaciones({
  vacantes,
  inicial,
}: {
  vacantes: { id: string; titulo: string }[];
  inicial: { posicion: string; desde: string; hasta: string };
}) {
  const router = useRouter();
  const [posicion, setPosicion] = useState(inicial.posicion);
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);

  function aplicar(nuevo: { posicion: string; desde: string; hasta: string }) {
    const params = new URLSearchParams();
    if (nuevo.posicion) params.set("posicion", nuevo.posicion);
    if (nuevo.desde) params.set("desde", nuevo.desde);
    if (nuevo.hasta) params.set("hasta", nuevo.hasta);
    const consulta = params.toString();
    router.replace(consulta ? `/admin?${consulta}` : "/admin");
  }

  const hayFiltros = Boolean(posicion || desde || hasta);

  return (
    <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-posicion" className="text-xs font-semibold text-foreground/60">
          Posición
        </label>
        <select
          id="filtro-posicion"
          value={posicion}
          onChange={(e) => {
            setPosicion(e.target.value);
            aplicar({ posicion: e.target.value, desde, hasta });
          }}
          className={`${campo} min-w-[16rem]`}
        >
          <option value="">Todas</option>
          {vacantes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.titulo}
            </option>
          ))}
          <option value="general">Postulación general</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-desde" className="text-xs font-semibold text-foreground/60">
          Desde
        </label>
        <input
          id="filtro-desde"
          type="date"
          value={desde}
          max={hasta || undefined}
          onChange={(e) => {
            setDesde(e.target.value);
            aplicar({ posicion, desde: e.target.value, hasta });
          }}
          className={campo}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-hasta" className="text-xs font-semibold text-foreground/60">
          Hasta
        </label>
        <input
          id="filtro-hasta"
          type="date"
          value={hasta}
          min={desde || undefined}
          onChange={(e) => {
            setHasta(e.target.value);
            aplicar({ posicion, desde, hasta: e.target.value });
          }}
          className={campo}
        />
      </div>

      {hayFiltros && (
        <Link
          href="/admin"
          onClick={() => {
            setPosicion("");
            setDesde("");
            setHasta("");
          }}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition hover:bg-black/5 active:scale-95"
        >
          Limpiar filtros
        </Link>
      )}
    </div>
  );
}
