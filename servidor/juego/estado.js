const { ROLES, FASES, CONFIG_JUGADORES } = require('../../compartido/constantes');
const { crearMazoNavegacion, crearMazoRitual } = require('./cartas');
const { obtenerPersonajesAleatorios } = require('./personajes');
const { HEX_INICIO } = require('./tablero');

const crearEstadoInicial = (jugadores, tablero = 'principal') => {
  const n = jugadores.length;
  const config = CONFIG_JUGADORES[n];
  if (!config) throw new Error(`Número de jugadores inválido: ${n}`);

  // Asignar roles
  const roles = [
    ...Array(config.piratas).fill(ROLES.PIRATA),
    ...Array(config.cultistas).fill(ROLES.CULTISTA),
    ...Array(config.adeptos || 0).fill(ROLES.ADEPTO),
    ...Array(config.marineros).fill(ROLES.MARINERO),
  ];
  // Barajar roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  const personajes = obtenerPersonajesAleatorios(n);
  const jugadoresConRol = jugadores.map((j, i) => ({
    ...j,
    rol: roles[i],
    personaje: personajes[i],
    pistolas: 3,
    curriculos: 0,
    fueraDeServicio: false,
    esCapitan: false,
    esTeniente: false,
    esNavegante: false,
    rolConfirmado: false,
  }));

  // Detectar si hay personaje "Capitán" para asignar primer capitán
  const idxCapitan = jugadoresConRol.findIndex(j => j.personaje?.id === 'capitan');
  // Si hay capitán por personaje, marcarle con esCapitan:true desde el principio
  if (idxCapitan >= 0) jugadoresConRol[idxCapitan].esCapitan = true;

  return {
    fase: FASES.FASE_0,
    turno: 1,
    tablero,
    barco: { hexId: HEX_INICIO },
    jugadores: jugadoresConRol,
    capitanIdx: idxCapitan >= 0 ? idxCapitan : null, // null = aún no elegido
    tenienteIdx: null,
    naveganteIdx: null,
    mazoDisponible: crearMazoNavegacion(tablero),
    mazoDescarte: [],
    mazoRitual: crearMazoRitual(),
    cartasRitualesReveladas: [],
    motin: {
      umbral: config.umbralMotin,
      votos: {},
      confirmados: [],
      activo: false,
    },
    cofre: {
      cartaCapitan: null,
      cartaTeniente: null,
      cartaNavegante: null,
      etapa: null, // 'capitan' | 'teniente' | 'navegante' | 'revelar'
    },
    cultista: {
      jugadorId: null,
      adeptos: [],
      jugadoresVistos: [],
    },
    historialFases: [],
    victoria: null,
  };
};

module.exports = { crearEstadoInicial };
