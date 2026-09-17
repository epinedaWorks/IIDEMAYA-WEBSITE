// Preguntas de entrevista, reformuladas para sonar menos "pesadas" que el
// cuestionario original en papel, sin cambiar lo que se está preguntando.
// El orden aquí es el orden en el formulario y en la vista del panel admin.
export const PREGUNTAS_TEXTO = [
  { key: "opinionSociedad", label: "¿Qué opinión tiene sobre la sociedad guatemalteca actual?" },
  { key: "opinionPoblacionMaya", label: "¿Qué opinión tiene sobre la población maya?" },
  {
    key: "comodidadTrabajarConPoblacionMaya",
    label: "¿Se sentiría cómodo/a trabajando con la población maya?",
  },
  {
    key: "opinionFormaPensarActuarMaya",
    label: "¿Cómo describiría, desde su perspectiva, la forma de pensar y actuar de la población maya?",
  },
  { key: "opinionCulturaMaya", label: "¿Qué opinión tiene sobre la cultura maya?" },
  { key: "opinionCosmovisionMaya", label: "¿Qué opinión tiene sobre la cosmovisión maya?" },
  {
    key: "disposicionCeremoniaMaya",
    label: "¿Estaría dispuesto/a a participar en una ceremonia maya?",
  },
  { key: "disponibilidadTiempo", label: "¿Cuál es su disponibilidad de tiempo?" },
  { key: "disponibilidadHorario", label: "¿Qué horario le queda mejor?" },
  {
    key: "trabajoBajoPresion",
    label: "¿Se considera capaz de trabajar bajo presión?",
  },
  {
    key: "porQueEstaOrganizacion",
    label: "¿Por qué le interesa formar parte de esta organización?",
  },
  {
    key: "etapaCarrera",
    label:
      "¿En qué etapa de su carrera profesional se encuentra: iniciando, en desarrollo, o en un momento de mayor experiencia?",
  },
  {
    key: "porQueContratarlo",
    label: "¿Por qué considera que sería la persona ideal para este puesto?",
  },
  { key: "expectativaSalarial", label: "¿Cuál es su expectativa salarial?" },
] as const;

// Único campo de texto opcional del bloque de entrevista.
export const PREGUNTA_DIA_NO_DISPONIBLE = {
  key: "diaNoDisponible",
  label: "¿Hay algún día de la semana en el que no podría trabajar? (opcional)",
} as const;

export const OPCIONES_MODALIDAD = [
  { value: "REMOTO", label: "Remoto" },
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "HIBRIDO", label: "Híbrido" },
] as const;

export const PREGUNTAS_SI_NO = [
  { key: "puedeFacturar", label: "¿Tiene disponibilidad para facturar por sus servicios?" },
  { key: "tieneVehiculo", label: "¿Cuenta con vehículo propio?" },
  { key: "esEstudianteActual", label: "¿Actualmente se encuentra estudiando?" },
  { key: "trabajaActualmente", label: "¿Actualmente se encuentra trabajando?" },
] as const;
