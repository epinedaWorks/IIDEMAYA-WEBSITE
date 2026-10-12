// Tiempos de la sesión del panel (un solo lugar para ajustarlos).

// Si no hay actividad en este tiempo, la sesión se cierra. La cookie se
// renueva con cada petición, así que funciona como "inactividad".
export const INACTIVIDAD_SEGUNDOS = 30 * 60;

// Aunque haya actividad constante, la sesión no dura más que esto: pasado
// ese tiempo hay que volver a ingresar.
export const SESION_MAXIMA_MS = 8 * 60 * 60 * 1000;
