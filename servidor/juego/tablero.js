// ============================================================
// TABLERO — Feed The Kraken (Tablero Principal)
// Cuadrícula hexagonal axial
// ============================================================

const TIPOS_HEX = {
  NORMAL: 'normal',
  LUPA: 'lupa',
  KRAKEN: 'kraken',
  PUERTO_PIRATAS: 'puerto_piratas',
  PUERTO_MARINEROS: 'puerto_marineros',
  INICIO: 'inicio',
};

// Cada hex: { id, tipo, flechas: { rojo: [ids], azul: [ids], amarillo: [ids] } }
// Basado en la imagen del tablero. El barco empieza en "inicio" (Isla Cangrejo)
// Las flechas representan hacia dónde se mueve el barco según el color de la carta
const HEXAGONOS = {
  // Fila inferior (inicio)
  'inicio': {
    id: 'inicio', tipo: TIPOS_HEX.INICIO, nombre: 'Isla Cangrejo',
    fila: 0, col: 0,
    flechas: { rojo: ['mid_izq_bajo'], azul: ['mid_der_bajo'], amarillo: ['mid_centro_bajo'] },
  },

  // Fila media-baja
  'mid_izq_bajo': {
    id: 'mid_izq_bajo', tipo: TIPOS_HEX.NORMAL,
    fila: 1, col: -1,
    flechas: { rojo: ['izq_medio'], azul: ['mid_centro_bajo'], amarillo: ['mid_izq_medio'] },
  },
  'mid_centro_bajo': {
    id: 'mid_centro_bajo', tipo: TIPOS_HEX.LUPA,
    fila: 1, col: 0,
    flechas: { rojo: ['mid_izq_bajo'], azul: ['mid_der_bajo'], amarillo: ['mid_centro_medio'] },
  },
  'mid_der_bajo': {
    id: 'mid_der_bajo', tipo: TIPOS_HEX.NORMAL,
    fila: 1, col: 1,
    flechas: { rojo: ['mid_centro_bajo'], azul: ['der_medio'], amarillo: ['mid_der_medio'] },
  },

  // Fila media
  'izq_medio': {
    id: 'izq_medio', tipo: TIPOS_HEX.KRAKEN,
    fila: 2, col: -2,
    flechas: { rojo: ['puerto_piratas'], azul: ['mid_izq_medio'], amarillo: ['mid_izq_bajo'] },
  },
  'mid_izq_medio': {
    id: 'mid_izq_medio', tipo: TIPOS_HEX.NORMAL,
    fila: 2, col: -1,
    flechas: { rojo: ['izq_medio'], azul: ['mid_centro_medio'], amarillo: ['mid_izq_alto'] },
  },
  'mid_centro_medio': {
    id: 'mid_centro_medio', tipo: TIPOS_HEX.LUPA,
    fila: 2, col: 0,
    flechas: { rojo: ['mid_izq_medio'], azul: ['mid_der_medio'], amarillo: ['mid_centro_alto'] },
  },
  'mid_der_medio': {
    id: 'mid_der_medio', tipo: TIPOS_HEX.NORMAL,
    fila: 2, col: 1,
    flechas: { rojo: ['mid_centro_medio'], azul: ['der_medio'], amarillo: ['mid_der_alto'] },
  },
  'der_medio': {
    id: 'der_medio', tipo: TIPOS_HEX.KRAKEN,
    fila: 2, col: 2,
    flechas: { rojo: ['mid_der_medio'], azul: ['puerto_marineros'], amarillo: ['mid_der_bajo'] },
  },

  // Fila media-alta
  'mid_izq_alto': {
    id: 'mid_izq_alto', tipo: TIPOS_HEX.NORMAL,
    fila: 3, col: -1,
    flechas: { rojo: ['puerto_piratas'], azul: ['mid_centro_alto'], amarillo: ['izq_medio'] },
  },
  'mid_centro_alto': {
    id: 'mid_centro_alto', tipo: TIPOS_HEX.LUPA,
    fila: 3, col: 0,
    flechas: { rojo: ['mid_izq_alto'], azul: ['mid_der_alto'], amarillo: ['kraken_centro'] },
  },
  'mid_der_alto': {
    id: 'mid_der_alto', tipo: TIPOS_HEX.NORMAL,
    fila: 3, col: 1,
    flechas: { rojo: ['mid_centro_alto'], azul: ['puerto_marineros'], amarillo: ['der_medio'] },
  },

  // Fila superior (destinos)
  'puerto_piratas': {
    id: 'puerto_piratas', tipo: TIPOS_HEX.PUERTO_PIRATAS, nombre: 'Cala Carmesí',
    fila: 4, col: -1,
    flechas: {},
  },
  'kraken_centro': {
    id: 'kraken_centro', tipo: TIPOS_HEX.KRAKEN, nombre: 'El Kraken',
    fila: 4, col: 0,
    flechas: {},
  },
  'puerto_marineros': {
    id: 'puerto_marineros', tipo: TIPOS_HEX.PUERTO_MARINEROS, nombre: 'Bahía Agua Azul',
    fila: 4, col: 1,
    flechas: {},
  },
};

const HEX_INICIO = 'inicio';

const moverBarco = (hexActual, colorCarta) => {
  const hex = HEXAGONOS[hexActual];
  if (!hex) return hexActual;
  const destinos = hex.flechas[colorCarta] || [];
  return destinos.length > 0 ? destinos[0] : hexActual;
};

const verificarVictoria = (hexId) => {
  const hex = HEXAGONOS[hexId];
  if (!hex) return null;
  if (hex.tipo === TIPOS_HEX.PUERTO_PIRATAS) return 'piratas';
  if (hex.tipo === TIPOS_HEX.PUERTO_MARINEROS) return 'marineros';
  if (hex.tipo === TIPOS_HEX.KRAKEN && hexId === 'kraken_centro') return 'cultistas';
  return null;
};

const esCasillaEspecial = (hexId) => {
  const hex = HEXAGONOS[hexId];
  if (!hex) return false;
  return hex.tipo === TIPOS_HEX.LUPA || hex.tipo === TIPOS_HEX.KRAKEN;
};

// Devuelve el tipo de acción especial que dispara la casilla
const tipoCasillaEspecial = (hexId) => {
  const hex = HEXAGONOS[hexId];
  if (!hex) return null;
  if (hex.tipo === TIPOS_HEX.LUPA) return 'lupa';
  if (hex.tipo === TIPOS_HEX.KRAKEN && hexId !== 'kraken_centro') return 'kraken_menor';
  return null;
};

module.exports = { HEXAGONOS, TIPOS_HEX, HEX_INICIO, moverBarco, verificarVictoria, esCasillaEspecial, tipoCasillaEspecial };
