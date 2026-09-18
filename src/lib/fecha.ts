// Los servidores de Netlify corren en UTC. Sin especificar timeZone,
// toLocaleDateString devuelve la hora UTC "disfrazada" con el idioma
// es-GT, pero no ajustada — por eso las fechas se veían corridas varias
// horas (a veces hasta un día). Guatemala no usa horario de verano, así
// que el offset (UTC-6) es fijo todo el año.
const ZONA_GT = "America/Guatemala";

export function formatearFechaGt(fecha: Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return fecha.toLocaleDateString("es-GT", { timeZone: ZONA_GT, ...opts });
}

export function formatearFechaHoraGt(fecha: Date): string {
  return fecha.toLocaleString("es-GT", {
    timeZone: ZONA_GT,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
