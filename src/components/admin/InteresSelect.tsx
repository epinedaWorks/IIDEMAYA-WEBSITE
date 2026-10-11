"use client";

import SelectGuardado from "@/components/admin/SelectGuardado";
import { cambiarInteres } from "@/app/admin/postulaciones/[id]/actions";
import {
  INTERESES,
  INTERES_COLOR,
  INTERES_LABEL,
  type Interes,
} from "@/lib/postulacion-interes";

const OPCIONES = INTERESES.map((i) => ({ value: i, label: INTERES_LABEL[i], color: INTERES_COLOR[i] }));

export default function InteresSelect({
  id,
  interes,
  compacto = false,
}: {
  id: string;
  interes: Interes;
  compacto?: boolean;
}) {
  return (
    <SelectGuardado
      valor={interes}
      opciones={OPCIONES}
      guardar={(nuevo) => cambiarInteres(id, nuevo)}
      mensajeOk={(label) => `✓ Marcado como «${label}»`}
      mensajeError="No se pudo guardar la valoración"
      etiqueta="Interés de la empresa"
      compacto={compacto}
    />
  );
}
