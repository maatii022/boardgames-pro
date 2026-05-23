const { TIPOS_CARTA_NAVEGACION, TIPOS_CARTA_RITUAL } = require('../../compartido/constantes');

// ============================================================
// CARTAS DE NAVEGACIÓN
// ============================================================
const CARTAS_NAVEGACION = [
  // 4x Borracho Azul
  ...Array(4).fill(null).map((_, i) => ({
    id: `borracho_azul_${i}`,
    tipo: TIPOS_CARTA_NAVEGACION.BORRACHO_AZUL,
    nombre: 'Borracho',
    color: 'azul',
    descripcion: 'El capitán actual pierde su puesto. El rol pasa al siguiente jugador con menos currículums.',
    imagen: 'cartas/navegacion/borracho_azul.png',
  })),
  // 2x Desarmado Azul
  ...Array(2).fill(null).map((_, i) => ({
    id: `desarmado_azul_${i}`,
    tipo: TIPOS_CARTA_NAVEGACION.DESARMADO_AZUL,
    nombre: 'Desarmado',
    color: 'azul',
    descripcion: 'El Navegante descarta 1 pistola de sus armas disponibles.',
    imagen: 'cartas/navegacion/desarmado_azul.png',
  })),
  // 6x Levantamiento del Culto
  ...Array(6).fill(null).map((_, i) => ({
    id: `levantamiento_culto_${i}`,
    tipo: TIPOS_CARTA_NAVEGACION.LEVANTAMIENTO_CULTO,
    nombre: 'Levantamiento del Culto',
    color: 'amarillo',
    descripcion: 'Se revela una carta del Ritual del Culto.',
    imagen: 'cartas/navegacion/levantamiento_culto.png',
  })),
  // 6x Borracho Rojo
  ...Array(6).fill(null).map((_, i) => ({
    id: `borracho_rojo_${i}`,
    tipo: TIPOS_CARTA_NAVEGACION.BORRACHO_ROJO,
    nombre: 'Borracho',
    color: 'rojo',
    descripcion: 'El capitán actual pierde su puesto. El rol pasa al siguiente jugador con menos currículums.',
    imagen: 'cartas/navegacion/borracho_rojo.png',
  })),
  // 2x Sirena
  ...Array(2).fill(null).map((_, i) => ({
    id: `sirena_${i}`,
    tipo: TIPOS_CARTA_NAVEGACION.SIRENA,
    nombre: 'Sirena',
    color: 'rojo',
    descripcion: 'El capitán elige un jugador. Ese jugador ve las últimas 3 cartas del mazo de descarte (barajadas).',
    imagen: 'cartas/navegacion/sirena.png',
  })),
  // 2x Telescopio
  ...Array(2).fill(null).map((_, i) => ({
    id: `telescopio_${i}`,
    tipo: TIPOS_CARTA_NAVEGACION.TELESCOPIO,
    nombre: 'Telescopio',
    color: 'rojo',
    descripcion: 'El capitán elige un jugador. Ese jugador mira la primera carta del mazo disponible y decide si descartarla.',
    imagen: 'cartas/navegacion/telescopio.png',
  })),
  // 2x Armado
  ...Array(2).fill(null).map((_, i) => ({
    id: `armado_${i}`,
    tipo: TIPOS_CARTA_NAVEGACION.ARMADO,
    nombre: 'Armado',
    color: 'rojo',
    descripcion: 'El Navegante recibe 1 pistola. (Solo en Long Journey Map)',
    imagen: 'cartas/navegacion/armado.png',
  })),
];

// ============================================================
// CARTAS DEL RITUAL DEL CULTO
// ============================================================
const CARTAS_RITUAL = [
  {
    id: 'alijo_armas',
    tipo: TIPOS_CARTA_RITUAL.ALIJO_ARMAS,
    nombre: 'El Alijo de Armas del Culto',
    descripcion: 'Todos cierran los ojos. El Cultista distribuye 3 pistolas entre los jugadores que quiera.',
    imagen: 'cartas/ritual/alijo_armas.png',
    cantidad: 1,
  },
  {
    id: 'registro_camarote',
    tipo: TIPOS_CARTA_RITUAL.REGISTRO_CAMAROTE,
    nombre: 'Registro de Camarote del Culto',
    descripcion: 'Todos cierran los ojos. El Cultista ve el rol del Capitán, Teniente y Navegante actuales (30 segundos).',
    imagen: 'cartas/ritual/registro_camarote.png',
    cantidad: 1,
    timer: 30,
  },
  {
    id: 'conversion_culto_1',
    tipo: TIPOS_CARTA_RITUAL.CONVERSION_CULTO,
    nombre: 'Conversión al Culto',
    descripcion: 'Todos cierran los ojos. El Cultista convierte a un jugador en Adepto.',
    imagen: 'cartas/ritual/conversion_culto.png',
    cantidad: 3,
  },
  {
    id: 'conversion_culto_2',
    tipo: TIPOS_CARTA_RITUAL.CONVERSION_CULTO,
    nombre: 'Conversión al Culto',
    descripcion: 'Todos cierran los ojos. El Cultista convierte a un jugador en Adepto.',
    imagen: 'cartas/ritual/conversion_culto.png',
    cantidad: 3,
  },
  {
    id: 'conversion_culto_3',
    tipo: TIPOS_CARTA_RITUAL.CONVERSION_CULTO,
    nombre: 'Conversión al Culto',
    descripcion: 'Todos cierran los ojos. El Cultista convierte a un jugador en Adepto.',
    imagen: 'cartas/ritual/conversion_culto.png',
    cantidad: 3,
  },
];

const barajar = (arr) => {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

const crearMazoNavegacion = (tablero = 'principal') => {
  const cartas = tablero === 'long_journey'
    ? [...CARTAS_NAVEGACION]
    : CARTAS_NAVEGACION.filter(c => c.tipo !== 'armado');
  return barajar(cartas);
};
const crearMazoRitual = () => barajar([...CARTAS_RITUAL]);

module.exports = { CARTAS_NAVEGACION, CARTAS_RITUAL, crearMazoNavegacion, crearMazoRitual, barajar };
