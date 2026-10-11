"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { INTERESES, INTERES_LABEL } from "@/lib/postulacion-interes";
import { consultaDeFiltros, hayFiltros, type Filtros } from "@/lib/postulacion-filtros";

const campo =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand";

// Filtros de la lista. Se aplican en cuanto cambia cualquier campo (viajan
// en la dirección, así que se pueden compartir o recargar sin perderlos).
export default function FiltrosPostulaciones({
  vacantes,
  inicial,
}: {
  vacantes: { id: string; titulo: string }[];
  inicial: Filtros;
}) {
  const router = useRouter();
  const [filtros, setFiltros] = useState<Filtros>(inicial);

  function cambiar(parcial: Partial<Filtros>) {
    const nuevos = { ...filtros, ...parcial };
    setFiltros(nuevos);
    const consulta = consultaDeFiltros(nuevos);
    router.replace(consulta ? `/admin?${consulta}` : "/admin");
  }

  return (
    <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-posicion" className="text-xs font-semibold text-foreground/60">
          Posición
        </label>
        <select
          id="filtro-posicion"
          value={filtros.posicion}
          onChange={(e) => cambiar({ posicion: e.target.value })}
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
        <label htmlFor="filtro-interes" className="text-xs font-semibold text-foreground/60">
          Interés
        </label>
        <select
          id="filtro-interes"
          value={filtros.interes}
          onChange={(e) => cambiar({ interes: e.target.value })}
          className={`${campo} min-w-[13rem]`}
        >
          <option value="">Todos</option>
          {INTERESES.map((i) => (
            <option key={i} value={i}>
              {INTERES_LABEL[i]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-desde" className="text-xs font-semibold text-foreground/60">
          Desde
        </label>
        <input
          id="filtro-desde"
          type="date"
          value={filtros.desde}
          max={filtros.hasta || undefined}
          onChange={(e) => cambiar({ desde: e.target.value })}
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
          value={filtros.hasta}
          min={filtros.desde || undefined}
          onChange={(e) => cambiar({ hasta: e.target.value })}
          className={campo}
        />
      </div>

      {hayFiltros(filtros) && (
        <Link
          href="/admin"
          onClick={() => setFiltros({ posicion: "", desde: "", hasta: "", interes: "" })}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition hover:bg-black/5 active:scale-95"
        >
          Limpiar filtros
        </Link>
      )}
    </div>
  );
}
