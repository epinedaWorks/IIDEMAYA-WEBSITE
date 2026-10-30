"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import EliminarPostulacionBoton from "@/components/admin/EliminarPostulacionBoton";
import EstadoSelect from "@/components/admin/EstadoSelect";
import GenerarResumenBoton from "@/components/admin/GenerarResumenBoton";
import InteresSelect from "@/components/admin/InteresSelect";
import { eliminarPostulacion } from "@/app/admin/postulaciones/[id]/actions";
import type { Estado } from "@/lib/postulacion-estados";
import type { Interes } from "@/lib/postulacion-interes";

export type PostulacionFila = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  direccion: string | null;
  remuneracion: string;
  posicion: string | null;
  fecha: string;
  estado: Estado;
  interes: Interes;
  // Fecha de la entrevista que reservó, o null; `invitada` = ya se le envió el enlace.
  entrevista: string | null;
  invitada: boolean;
  resumenIA: string | null;
};

// Cualquier clic sobre la fila abre la postulación, salvo en los controles
// de la propia fila (estado, interés, eliminar, generar resumen). `consulta`
// son los filtros activos de la lista, para que el detalle los conserve.
export default function FilaPostulacion({
  p,
  iaConfigurada,
  consulta,
}: {
  p: PostulacionFila;
  iaConfigurada: boolean;
  consulta: string;
}) {
  const router = useRouter();
  const destino = `/admin/postulaciones/${p.id}${consulta ? `?${consulta}` : ""}`;
  const detenerClic = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <tr
      onClick={() => router.push(destino)}
      className="cursor-pointer border-b border-black/5 align-top last:border-0 hover:bg-brand-light/20"
    >
      <td className="min-w-[10rem] px-3 py-3">
        <Link href={destino} className="font-medium text-brand-dark hover:underline" onClick={detenerClic}>
          {p.nombre}
        </Link>
      </td>
      <td className="min-w-[11rem] break-words px-3 py-3 text-foreground/70">{p.correo}</td>
      <td className="whitespace-nowrap px-3 py-3 text-foreground/70">
        {p.telefono || <span className="text-foreground/40">—</span>}
      </td>
      <td className="min-w-[12rem] px-3 py-3 text-foreground/70">
        {p.direccion ? (
          <p className="line-clamp-3" title={p.direccion}>
            {p.direccion}
          </p>
        ) : (
          <span className="text-foreground/40">—</span>
        )}
      </td>
      <td className="min-w-[9rem] px-3 py-3 text-foreground/70">
        {p.remuneracion ? (
          <p className="line-clamp-3" title={p.remuneracion}>
            {p.remuneracion}
          </p>
        ) : (
          <span className="text-foreground/40">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-foreground/70">
        {p.posicion ?? <span className="text-foreground/40">General</span>}
      </td>
      <td className="px-3 py-3 text-foreground/70">{p.fecha}</td>
      <td className="px-3 py-3" onClick={detenerClic}>
        <EstadoSelect id={p.id} estado={p.estado} compacto />
      </td>
      <td className="px-3 py-3" onClick={detenerClic}>
        <InteresSelect id={p.id} interes={p.interes} compacto />
      </td>
      <td className="min-w-[8rem] px-3 py-3 text-xs">
        {p.entrevista ? (
          <span className="font-medium text-green-700">{p.entrevista}</span>
        ) : p.invitada ? (
          <span className="text-blue-700">Invitada, sin agendar</span>
        ) : (
          <span className="text-foreground/40">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-right" onClick={detenerClic}>
        <EliminarPostulacionBoton
          compacto
          nombre={p.nombre}
          action={() => eliminarPostulacion(p.id, false)}
        />
      </td>
      <td className="min-w-[12rem] px-3 py-3" onClick={p.resumenIA ? undefined : detenerClic}>
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
