"use client";

import SelectGuardado from "@/components/admin/SelectGuardado";
import { cambiarEstado } from "@/app/admin/postulaciones/[id]/actions";
import { ESTADOS, ESTADO_COLOR, ESTADO_LABEL, type Estado } from "@/lib/postulacion-estados";

const OPCIONES = ESTADOS.map((e) => ({ value: e, label: ESTADO_LABEL[e], color: ESTADO_COLOR[e] }));

export default function EstadoSelect({
  id,
  estado,
  compacto = false,
}: {
  id: string;
  estado: Estado;
  compacto?: boolean;
}) {
  return (
    <SelectGuardado
      valor={estado}
      opciones={OPCIONES}
      guardar={(nuevo) => cambiarEstado(id, nuevo)}
      mensajeOk={(label) => `✓ Estado cambiado a «${label}»`}
      mensajeError="No se pudo cambiar el estado"
      etiqueta="Estado de la postulación"
      compacto={compacto}
    />
  );
}
