// Valoración de la empresa sobre cada postulante (aparte del estado del
// proceso). El orden es el de los selectores.
export const INTERESES = ["SIN_VALORAR", "POSIBLE_BUEN_CANDIDATO", "CON_INTERES", "DESCARTADO"] as const;
export type Interes = (typeof INTERESES)[number];

export const INTERES_LABEL: Record<Interes, string> = {
  SIN_VALORAR: "Sin valorar",
  POSIBLE_BUEN_CANDIDATO: "Posible buen candidato",
  CON_INTERES: "Con interés",
  DESCARTADO: "Descartado",
};

export const INTERES_COLOR: Record<Interes, string> = {
  SIN_VALORAR: "bg-black/5 text-foreground/60",
  POSIBLE_BUEN_CANDIDATO: "bg-violet-100 text-violet-700",
  CON_INTERES: "bg-green-100 text-green-700",
  DESCARTADO: "bg-red-100 text-red-700",
};

export function esInteres(valor: string): valor is Interes {
  return (INTERESES as readonly string[]).includes(valor);
}
