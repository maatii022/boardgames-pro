const { crearEstadoInicial } = require('./juego/estado');
const { FASES } = require('../compartido/constantes');
const {
  elegirCapitanAleatorio,
  elegirEquipo,
  votarMotin,
  elegirCartaCofre,
  aplicarCartaNavegacion,
  ejecutarFase5,
} = require('./juego/fases');

// ============================================================
// GESTIÓN DE SALAS
// ============================================================

const salas = new Map();

const generarCodigo = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const crearSala = (socketId, nombreHost, esSoloTablero = false) => {
  let codigo;
  do { codigo = generarCodigo(); } while (salas.has(codigo));

  const sala = {
    codigo,
    hostId: socketId,
    // Si es solo tablero, no añadimos al socket como jugador
    jugadores: esSoloTablero ? [] : [{
      id: socketId,
      nombre: nombreHost,
      esHost: true,
      conectado: true,
    }],
    tableroSocketId: esSoloTablero ? socketId : null,
    estado: null,
    fase: FASES.LOBBY,
    tablero: 'principal',
    createdAt: Date.now(),
  };
  salas.set(codigo, sala);
  return sala;
};

const unirseASala = (codigo, socketId, nombre) => {
  const sala = salas.get(codigo);
  if (!sala) throw new Error('Sala no encontrada');
  if (sala.fase !== FASES.LOBBY) throw new Error('La partida ya ha comenzado');
  if (sala.jugadores.length >= 11) throw new Error('Sala llena (máximo 11 jugadores)');
  if (sala.jugadores.find(j => j.id === socketId)) throw new Error('Ya estás en esta sala');

  sala.jugadores.push({
    id: socketId,
    nombre,
    esHost: false,
    conectado: true,
  });
  return sala;
};

const seleccionarHost = (codigo, socketId, nuevoHostId) => {
  const sala = salas.get(codigo);
  if (!sala) throw new Error('Sala no encontrada');
  if (sala.hostId !== socketId) throw new Error('Solo el host puede transferir el rol');

  sala.hostId = nuevoHostId;
  sala.jugadores = sala.jugadores.map(j => ({
    ...j,
    esHost: j.id === nuevoHostId,
  }));
  return sala;
};

const iniciarPartida = (codigo, socketId) => {
  const sala = salas.get(codigo);
  if (!sala) throw new Error('Sala no encontrada');
  if (sala.hostId !== socketId) throw new Error('Solo el host puede iniciar la partida');
  if (sala.jugadores.length < 5) throw new Error('Se necesitan al menos 5 jugadores');

  sala.estado = crearEstadoInicial(sala.jugadores, sala.tablero);
  sala.fase = FASES.FASE_0;
  sala.estado.fase = FASES.FASE_0;
  return sala;
};

const confirmarRol = (codigo, socketId) => {
  const sala = salas.get(codigo);
  if (!sala || !sala.estado) throw new Error('Sala o estado no encontrado');

  sala.estado.jugadores = sala.estado.jugadores.map(j =>
    j.id === socketId ? { ...j, rolConfirmado: true } : j
  );

  const todosConfirmados = sala.estado.jugadores.every(j => j.rolConfirmado);
  if (todosConfirmados) {
    sala.estado.fase = FASES.DURMIENDO;
    sala.fase = FASES.DURMIENDO;
  }
  return { sala, todosConfirmados };
};

const avanzarFase = (codigo, socketId) => {
  const sala = salas.get(codigo);
  if (!sala) throw new Error('Sala no encontrada');
  if (sala.hostId !== socketId) throw new Error('Solo el host puede avanzar la fase');

  const ordenFases = [
    FASES.LOBBY, FASES.FASE_0, FASES.DURMIENDO,
    FASES.FASE_1, FASES.FASE_2, FASES.FASE_3,
    FASES.FASE_4, FASES.FASE_5, FASES.VICTORIA,
  ];
  const idx = ordenFases.indexOf(sala.fase);
  if (idx < ordenFases.length - 1) {
    const nuevaFase = ordenFases[idx + 1];
    sala.fase = nuevaFase;
    if (sala.estado) sala.estado.fase = nuevaFase;

    // Lógica al entrar a Fase 1 por primera vez
    if (nuevaFase === FASES.FASE_1 && !sala.estado?.capitanIdx && sala.estado?.capitanIdx !== 0) {
      sala.estado = elegirCapitanAleatorio(sala.estado);
    }
  }
  return sala;
};

const retrocederFase = (codigo, socketId) => {
  const sala = salas.get(codigo);
  if (!sala) throw new Error('Sala no encontrada');
  if (sala.hostId !== socketId) throw new Error('Solo el host puede retroceder la fase');

  const ordenFases = [
    FASES.LOBBY, FASES.FASE_0, FASES.DURMIENDO,
    FASES.FASE_1, FASES.FASE_2, FASES.FASE_3,
    FASES.FASE_4, FASES.FASE_5, FASES.VICTORIA,
  ];
  const idx = ordenFases.indexOf(sala.fase);
  if (idx > 0) {
    const nuevaFase = ordenFases[idx - 1];
    sala.fase = nuevaFase;
    if (sala.estado) sala.estado.fase = nuevaFase;
  }
  return sala;
};

const reiniciarPartida = (codigo, socketId) => {
  const sala = salas.get(codigo);
  if (!sala) throw new Error('Sala no encontrada');
  if (sala.hostId !== socketId) throw new Error('Solo el host puede reiniciar');

  sala.estado = null;
  sala.fase = FASES.LOBBY;
  sala.jugadores = sala.jugadores.map(j => ({ ...j, esHost: j.id === sala.hostId }));
  return sala;
};

const procesarAccion = (codigo, socketId, accion, datos) => {
  const sala = salas.get(codigo);
  if (!sala || !sala.estado) throw new Error('Sala o estado no encontrado');

  switch (accion) {
    case 'elegir-equipo': {
      sala.estado = elegirEquipo(sala.estado, datos.tenienteId, datos.naveganteId);
      break;
    }
    case 'votar-motin': {
      sala.estado = votarMotin(sala.estado, socketId, datos.pistolas);
      break;
    }
    case 'elegir-carta-cofre': {
      sala.estado = elegirCartaCofre(sala.estado, socketId, datos.cartaId);
      break;
    }
    case 'abrir-cofre': {
      sala.estado = aplicarCartaNavegacion(sala.estado);
      break;
    }
    case 'fase-5': {
      sala.estado = ejecutarFase5(sala.estado);
      break;
    }
    default:
      throw new Error(`Acción desconocida: ${accion}`);
  }

  sala.fase = sala.estado.fase;
  return sala;
};

const desconectarJugador = (socketId) => {
  for (const [codigo, sala] of salas.entries()) {
    const idx = sala.jugadores.findIndex(j => j.id === socketId);
    if (idx !== -1) {
      sala.jugadores[idx].conectado = false;
      if (sala.estado) {
        sala.estado.jugadores = sala.estado.jugadores.map(j =>
          j.id === socketId ? { ...j, conectado: false } : j
        );
      }
      return { sala, codigo };
    }
  }
  return null;
};

const obtenerSala = (codigo) => salas.get(codigo) || null;

const vistaSalaParaCliente = (sala) => ({
  codigo: sala.codigo,
  hostId: sala.hostId,
  fase: sala.fase,
  tablero: sala.tablero,
  jugadores: sala.jugadores.map(j => ({
    id: j.id,
    nombre: j.nombre,
    esHost: j.esHost,
    conectado: j.conectado,
  })),
  numJugadores: sala.jugadores.length,
});

const vistaEstadoParaJugador = (sala, socketId) => {
  if (!sala.estado) return null;
  const jugadorActual = sala.estado.jugadores.find(j => j.id === socketId);
  return {
    fase: sala.estado.fase,
    turno: sala.estado.turno,
    barco: sala.estado.barco,
    capitanIdx: sala.estado.capitanIdx,
    tenienteIdx: sala.estado.tenienteIdx,
    naveganteIdx: sala.estado.naveganteIdx,
    motin: sala.estado.motin,
    cofre: {
      etapa: sala.estado.cofre.etapa,
      // Solo mostrar las cartas al jugador correspondiente
    },
    jugadores: sala.estado.jugadores.map(j => ({
      id: j.id,
      nombre: j.nombre,
      pistolas: j.id === socketId ? j.pistolas : undefined, // Solo el propio
      curriculos: j.curriculos,
      fueraDeServicio: j.fueraDeServicio,
      esCapitan: j.esCapitan,
      esTeniente: j.esTeniente,
      esNavegante: j.esNavegante,
      rolConfirmado: j.rolConfirmado,
      conectado: j.conectado,
    })),
    // Info privada solo para este jugador
    miJugador: jugadorActual ? {
      rol: jugadorActual.rol,
      personaje: jugadorActual.personaje,
      pistolas: jugadorActual.pistolas,
      esCapitan: jugadorActual.esCapitan,
      esTeniente: jugadorActual.esTeniente,
      esNavegante: jugadorActual.esNavegante,
    } : null,
    victoria: sala.estado.victoria,
    accionEspecial: sala.estado.accionEspecial,
    cartasRitualesReveladas: sala.estado.cartasRitualesReveladas,
    mazoDisponibleCount: sala.estado.mazoDisponible.length,
    mazoDescarteCount: sala.estado.mazoDescarte.length,
  };
};

const reintegrarJugador = (codigo, socketId) => {
  const sala = salas.get(codigo);
  if (!sala) return null;
  // Actualizar el socketId del jugador si ya existía con ese nombre
  const jugador = sala.jugadores.find(j => j.id === socketId);
  if (jugador) {
    jugador.conectado = true;
    if (sala.estado) {
      sala.estado.jugadores = sala.estado.jugadores.map(j =>
        j.id === socketId ? { ...j, conectado: true } : j
      );
    }
  }
  return sala;
};

module.exports = {
  crearSala, unirseASala, seleccionarHost, iniciarPartida,
  confirmarRol, avanzarFase, retrocederFase, reiniciarPartida,
  procesarAccion, desconectarJugador, obtenerSala,
  vistaSalaParaCliente, vistaEstadoParaJugador, reintegrarJugador,
};
