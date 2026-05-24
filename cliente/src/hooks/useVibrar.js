/**
 * useVibrar — Haptic feedback para eventos clave del juego
 *
 * Patrones (ms): pulso único corto, pausa, repetición
 * Silencioso si el navegador no soporta la API o el usuario
 * tiene el silencio activado (móvil sin vibración).
 */

const soportado = typeof navigator !== 'undefined' && 'vibrate' in navigator;

const PATRONES = {
  // Confirmaciones suaves
  confirmar:    [40],
  seleccionar:  [20],

  // Eventos de juego medios
  cartaRevelada:  [60, 40, 60],
  motin:          [80, 50, 80, 50, 200],
  motinFallado:   [30, 30, 30],

  // Eventos dramáticos
  krakenSacrificio: [100, 60, 100, 60, 300],
  victoria:         [80, 40, 80, 40, 80, 40, 400],
  derrota:          [200, 100, 200],

  // Ritual
  ritualReveal:   [50, 30, 50, 30, 50],
  convertido:     [60, 40, 120, 40, 60],

  // Atención: te toca actuar
  turnoAccion:        [70, 30, 70, 30, 70],

  // Recibir un arma
  armaRecibida:       [40, 25, 120],

  // Alguien registró tu camarote
  camaroteRegistrado: [25, 20, 25, 20, 70],
};

/**
 * Dispara un patrón de vibración por nombre.
 * No hace nada en iOS ni en navegadores sin soporte.
 * @param {keyof typeof PATRONES} nombre
 */
export const vibrar = (nombre) => {
  if (!soportado) return;
  const patron = PATRONES[nombre];
  if (!patron) return;
  try {
    navigator.vibrate(patron);
  } catch (_) {
    // Silencioso en navegadores que bloquean la API
  }
};

/**
 * Hook para usar dentro de componentes React.
 * Devuelve la función `vibrar` directamente.
 */
export default function useVibrar() {
  return vibrar;
}
