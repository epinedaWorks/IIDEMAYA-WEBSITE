// Estados del proceso de selección, compartidos por la lista y el detalle.
export const ESTADOS = ["NUEVA", "EN_REVISION", "ENTREVISTA", "RECHAZADA", "CONTRATADA"] as const;
export type Estado = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<Estado, string> = {
  NUEVA: "Nueva",
  EN_REVISION: "En revisión",
  ENTREVISTA: "Entrevista",
  RECHAZADA: "Rechazada",
  CONTRATADA: "Contratada",
};

export const ESTADO_COLOR: Record<Estado, string> = {
  NUEVA: "bg-accent-light text-accent",
  EN_REVISION: "bg-brand-light text-brand",
  ENTREVISTA: "bg-blue-100 text-blue-700",
  RECHAZADA: "bg-red-100 text-red-700",
  CONTRATADA: "bg-green-100 text-green-700",
};

export function esEstado(valor: string): valor is Estado {
  return (ESTADOS as readonly string[]).includes(valor);
}
