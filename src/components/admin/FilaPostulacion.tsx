"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import EliminarPostulacionBoton from "@/components/admin/EliminarPostulacionBoton";
import EstadoSelect from "@/components/admin/EstadoSelect";
import GenerarResumenBoton from "@/components/admin/GenerarResumenBoton";
import { eliminarPostulacion } from "@/app/admin/postulaciones/[id]/actions";
import type { Estado } from "@/lib/postulacion-estados";

export type PostulacionFila = {
  id: string;
  nombre: string;
  correo: string;
  posicion: string | null;
  fecha: string;
  estado: Estado;
  resumenIA: string | null;
};

// Cualquier clic sobre la fila abre la postulación, salvo en los controles
// de la propia fila (estado, eliminar, generar resumen).
export default function FilaPostulacion({
  p,
  iaConfigurada,
}: {
  p: PostulacionFila;
  iaConfigurada: boolean;
}) {
  const router = useRouter();
  const destino = `/admin/postulaciones/${p.id}`;
  const detenerClic = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <tr
      onClick={() => router.push(destino)}
      className="cursor-pointer border-b border-black/5 align-top last:border-0 hover:bg-brand-light/20"
    >
      <td className="min-w-[10rem] px-4 py-3">
        <Link href={destino} className="font-medium text-brand-dark hover:underline" onClick={detenerClic}>
          {p.nombre}
        </Link>
        <div className="mt-0.5 break-words text-xs text-foreground/60">{p.correo}</div>
      </td>
      <td className="px-4 py-3 text-foreground/70">
        {p.posicion ?? <span className="text-foreground/40">General</span>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-foreground/70">{p.fecha}</td>
      <td className="px-4 py-3" onClick={detenerClic}>
        <EstadoSelect id={p.id} estado={p.estado} compacto />
      </td>
      <td className="px-4 py-3 text-right" onClick={detenerClic}>
        <EliminarPostulacionBoton
          compacto
          nombre={p.nombre}
          action={() => eliminarPostulacion(p.id, false)}
        />
      </td>
      <td className="min-w-[14rem] px-4 py-3" onClick={p.resumenIA ? undefined : detenerClic}>
        {p.resumenIA ? (
          <p className="line-clamp-5 text-xs leading-relaxed text-foreground/75" title={p.resumenIA}>
            {p.resumenIA}
          </p>
        ) : iaConfigurada ? (
          <GenerarResumenBoton id={p.id} compacto />
        ) : (
          <span className="text-xs text-foreground/40">IA sin configurar</span>
        )}
      </td>
    </tr>
  );
}
