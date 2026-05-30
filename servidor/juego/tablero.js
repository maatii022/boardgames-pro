// ============================================================
// TABLERO — Feed The Kraken
// IDs de hex sincronizados con cliente/src/data/hexMapa.js
//
// Cuando el HexEditor exporte datos nuevos, actualiza también
// HEX_FLECHAS aquí (y HEX_INICIO si cambia el hex de partida).
// ============================================================

// ── Movimiento por color de carta ────────────────────────────
// Fuente de verdad: HEX_FLECHAS en cliente/src/data/hexMapa.js
const HEX_FLECHAS = {
  '9':      { amarillo: 'vc',   azul: 'vm-1', rojo: 'vp-1' },
  'inicio': { amarillo: '3-2',  azul: '2-2',  rojo: '2-1'  },
  '2-2':    { amarillo: '4-2',  azul: '3-3',  rojo: '3-2'  },
  '2-1':    { amarillo: '4-1',  azul: '3-2',  rojo: '3-1'  },
  '3-3':    { amarillo: '5-3',  azul: '5-3',  rojo: '4-2'  },
  '3-2':    { amarillo: '4-1',  azul: '4-2',  rojo: '4-1'  },
  '3-1':    { amarillo: '5-1',  azul: '4-1',  rojo: '5-1'  },
  '4-2':    { amarillo: '6-3',  azul: '5-3',  rojo: '5-2'  },
  '4-1':    { amarillo: '6-2',  azul: '5-2',  rojo: '5-1'  },
  '5-1':    { amarillo: '7-1',  azul: '6-2',  rojo: '6-1'  },
  '5-2':    { amarillo: '7-2',  azul: '6-3',  rojo: '6-2'  },
  '5-3':    { amarillo: '7-3',  azul: '6-4',  rojo: '6-3'  },
  '6-4':    { amarillo: '7-3',  azul: 'vm-3', rojo: '7-3'  },
  '6-1':    { amarillo: '7-1',  azul: '7-1',  rojo: 'vp-3' },
  '6-2':    { amarillo: '8-1',  azul: '7-2',  rojo: '7-1'  },
  '6-3':    { amarillo: '8-2',  azul: '7-3',  rojo: '7-2'  },
  '7-1':    { amarillo: '8-1',  azul: '8-1',  rojo: 'vp-2' },
  '7-2':    { amarillo: '9',    azul: '8-2',  rojo: '8-1'  },
  '7-3':    { amarillo: '8-2',  azul: 'vm-2', rojo: '8-2'  },
  '8-1':    { amarillo: 'vp-1', azul: '9',    rojo: 'vp-2' },
  '8-2':    { amarillo: 'vm-1', azul: 'vm-2', rojo: '9'    },
};

// ── Hex de inicio ─────────────────────────────────────────────
const HEX_INICIO = 'inicio';

// ── Hexes de victoria ─────────────────────────────────────────
// Al llegar a cualquiera de estos hexes, el juego termina.
const VICTORIA_PIRATAS   = new Set(['vp-1', 'vp-2', 'vp-3']);
const VICTORIA_MARINEROS = new Set(['vm-1', 'vm-2', 'vm-3']);
const VICTORIA_CULTISTAS = new Set(['vc']);

// ── Hexes especiales ──────────────────────────────────────────
// kraken_menor: disparan votación de sacrificio (FASE_4).
//   → Los cultistas ganan si el cultista (no adepto) es sacrificado.
// lupa: disparan acción de investigación (FASE_4 tipo lupa).
//   → TODO: asignar hexes de lupa cuando estén definidos en el nuevo mapa.
const HEXES_KRAKEN_MENOR = new Set(['8-1', '8-2']);        // casillas de Kraken Menor (sacrificio)
const HEXES_LUPA         = new Set(['4-1', '4-2', '5-1']); // casillas de lupa (Registro de Camarote)

// ─────────────────────────────────────────────────────────────

/**
 * Devuelve el hexId destino para un movimiento dado.
 * colorCarta: 'amarillo' | 'azul' | 'rojo'
 */
const moverBarco = (hexActual, colorCarta) => {
  const flechas = HEX_FLECHAS[hexActual];
  if (!flechas) return hexActual;              // hex sin flechas (victoria / final)
  return flechas[colorCarta] ?? hexActual;
};

/**
 * Comprueba si el hex es un destino de victoria.
 * @returns {string|null}  'piratas' | 'marineros' | 'cultistas' | null
 */
const verificarVictoria = (hexId) => {
  if (VICTORIA_PIRATAS.has(hexId))   return 'piratas';
  if (VICTORIA_MARINEROS.has(hexId)) return 'marineros';
  if (VICTORIA_CULTISTAS.has(hexId)) return 'cultistas';
  return null;
};

/** Devuelve true si la casilla dispara FASE_4 */
const esCasillaEspecial = (hexId) =>
  HEXES_KRAKEN_MENOR.has(hexId) || HEXES_LUPA.has(hexId);

/** Devuelve el tipo de FASE_4 para la casilla */
const tipoCasillaEspecial = (hexId) => {
  if (HEXES_KRAKEN_MENOR.has(hexId)) return 'kraken_menor';
  if (HEXES_LUPA.has(hexId))         return 'lupa';
  return null;
};

module.exports = {
  HEX_FLECHAS,
  HEX_INICIO,
  moverBarco,
  verificarVictoria,
  esCasillaEspecial,
  tipoCasillaEspecial,
};
