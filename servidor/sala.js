const { crearEstadoInicial } = require('./juego/estado');
const { FASES } = require('../compartido/constantes');
const {
  elegirCapitanAleatorio,
  elegirEquipo,
  votarMotin,
  elegirCartaCofre,
  aplicarCartaNavegacion,
  ejecutarFase5,
  votarKraken,
  inicializarCofre,
  iniciarAccionEspecialPendiente,
  elegirJugadorAccionEspecial,
  confirmarAccionEspecial,
} = require('./juego/fases');

// ============================================================
// GESTIÓN DE SALAS
// ============================================================

const salas = new Map();

const generarCodigo = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const crearSala = (socketId, jugadorId, nombreHost, esSoloTablero = false) => {
  let codigo;
  do { codigo = generarCodigo(); } while (salas.has(codigo));

  const sala = {
    codigo,
    hostId: socketId,
    jugadores: esSoloTablero ? [] : [{
      id: socketId,
      jugadorId: jugadorId || socketId,
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

const unirseASala = (codigo, socketId, jugadorId, nombre) => {
  const sala = salas.get(codigo);
  if (!sala) throw new Error('Sala no encontrada');

  // Reconexión: el jugadorId ya existe en la sala
  const jugadorExistente = jugadorId && sala.jugadores.find(j => j.jugadorId === jugadorId);
  if (jugadorExistente) {
    const oldSocketId = jugadorExistente.id;
    jugadorExistente.id = socketId;
    jugadorExistente.conectado = true;
    if (sala.estado) actualizarSocketIdEnEstado(sala.estado, oldSocketId, socketId);
    if (sala.hostId === oldSocketId) sala.hostId = socketId;
    return sala;
  }

  if (sala.fase !== FASES.LOBBY) throw new Error('La partida ya ha comenzado');
  if (sala.jugadores.length >= 11) throw new Error('Sala llena (máximo 11 jugadores)');

  sala.jugadores.push({
    id: socketId,
    jugadorId: jugadorId || socketId,
    nombre,
    esHost: false,
    conectado: true,
  });
  return sala;
};

// Actualiza todas las referencias a un socketId viejo tras reconexión
const actualizarSocketIdEnEstado = (estado, oldId, newId) => {
  estado.jugadores = estado.jugadores.map(j =>
    j.id === oldId ? { ...j, id: newId } : j
  );
  // Votos del motín
  if (estado.motin.votos[oldId] !== undefined) {
    estado.motin.votos[newId] = estado.motin.votos[oldId];
    delete estado.motin.votos[oldId];
  }
  const confIdx = estado.motin.confirmados.indexOf(oldId);
  if (confIdx !== -1) estado.motin.confirmados[confIdx] = newId;
  // Cultista
  if (estado.cultista.jugadorId === oldId) estado.cultista.jugadorId = newId;
  estado.cultista.adeptos = estado.cultista.adeptos.map(id => id === oldId ? newId : id);
  estado.cultista.jugadoresVistos = estado.cultista.jugadoresVistos.map(id => id === oldId ? newId : id);
  // Votos del Kraken menor
  if (estado.accionFase4?.kraken) {
    const kraken = estado.accionFase4.kraken;
    if (kraken.votos[oldId] !== undefined) {
      kraken.votos[newId] = kraken.votos[oldId];
      delete kraken.votos[oldId];
    }
    const kIdx = kraken.confirmados.indexOf(oldId);
    if (kIdx !== -1) kraken.confirmados[kIdx] = newId;
    if (kraken.objetivo === oldId) kraken.objetivo = newId;
  }
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

    if (sala.estado) {
      // Elegir capitán al entrar en Fase 1 si ningún jugador tiene esCapitan:true
      if (nuevaFase === FASES.FASE_1 && !sala.estado.jugadores.some(j => j.esCapitan)) {
        sala.estado = elegirCapitanAleatorio(sala.estado);
      }
      // Inicializar cofre al entrar en Fase 3 manualmente (si no viene de votarMotin)
      if (nuevaFase === FASES.FASE_3) {
        sala.estado = inicializarCofre(sala.estado);
      }
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
      const tipoCarta = sala.estado.cofre?.cartaNavegante?.tipo;
      if (tipoCarta === 'sirena' || tipoCarta === 'telescopio') {
        // No mover barco aún: esperar que el capitán elija un jugador
        sala.estado = iniciarAccionEspecialPendiente(sala.estado);
      } else {
        sala.estado = aplicarCartaNavegacion(sala.estado);
        if (sala.estado.fase === FASES.FASE_5) {
          sala.estado = ejecutarFase5(sala.estado);
        }
      }
      break;
    }
    case 'accion-especial-elegir-jugador': {
      sala.estado = elegirJugadorAccionEspecial(sala.estado, datos.jugadorId);
      break;
    }
    case 'accion-especial-confirmar': {
      sala.estado = confirmarAccionEspecial(sala.estado, datos.decision);
      if (sala.estado.fase === FASES.FASE_5) {
        sala.estado = ejecutarFase5(sala.estado);
      }
      break;
    }
    case 'fase-5': {
      sala.estado = ejecutarFase5(sala.estado);
      break;
    }
    case 'votar-kraken': {
      sala.estado = votarKraken(sala.estado, socketId, datos.objetivoId);
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
  const cofre = sala.estado.cofre;

  // Solo enviar las cartas al jugador que debe elegir en este turno
  let cartasCofreParaJugador = null;
  if (jugadorActual && cofre.etapa) {
    const { etapa, cartasDisponibles } = cofre;
    if (etapa === 'capitan' && jugadorActual.esCapitan) {
      cartasCofreParaJugador = cartasDisponibles;
    } else if (etapa === 'teniente' && jugadorActual.esTeniente) {
      cartasCofreParaJugador = cartasDisponibles;
    } else if (etapa === 'navegante' && jugadorActual.esNavegante) {
      cartasCofreParaJugador = cartasDisponibles;
    }
  }

  return {
    fase: sala.estado.fase,
    turno: sala.estado.turno,
    barco: sala.estado.barco,
    capitanIdx: sala.estado.capitanIdx,
    tenienteIdx: sala.estado.tenienteIdx,
    naveganteIdx: sala.estado.naveganteIdx,
    motin: sala.estado.motin,
    cofre: {
      etapa: cofre.etapa,
      cartasDisponibles: cartasCofreParaJugador,
      // Carta final visible para todos cuando está lista para revelar
      cartaNavegante: cofre.etapa === 'revelar' ? cofre.cartaNavegante : null,
    },
    jugadores: sala.estado.jugadores.map(j => ({
      id: j.id,
      nombre: j.nombre,
      pistolas: j.id === socketId ? j.pistolas : undefined,
      curriculos: j.curriculos,
      fueraDeServicio: j.fueraDeServicio,
      esCapitan: j.esCapitan,
      esTeniente: j.esTeniente,
      esNavegante: j.esNavegante,
      rolConfirmado: j.rolConfirmado,
      conectado: j.conectado,
      rol: sala.estado.victoria ? j.rol : undefined,
      sacrificado: j.sacrificado || false,
    })),
    miJugador: jugadorActual ? {
      rol: jugadorActual.rol,
      personaje: jugadorActual.personaje,
      pistolas: jugadorActual.pistolas,
      esCapitan: jugadorActual.esCapitan,
      esTeniente: jugadorActual.esTeniente,
      esNavegante: jugadorActual.esNavegante,
      sacrificado: jugadorActual.sacrificado || false,
      // Durante DURMIENDO, los piratas ven a sus compañeros piratas
      aliados: (sala.estado.fase === 'durmiendo' && jugadorActual.rol === 'pirata')
        ? sala.estado.jugadores
            .filter(j => j.rol === 'pirata' && j.id !== socketId)
            .map(j => ({ id: j.id, nombre: j.nombre }))
        : null,
    } : null,
    victoria: sala.estado.victoria,
    accionEspecial: (() => {
      const ae = sala.estado.accionEspecial;
      if (!ae) return null;
      const soyElegido = ae.jugadorElegido === socketId;
      return {
        tipo: ae.tipo,
        etapa: ae.etapa,
        jugadorElegido: ae.jugadorElegido,
        // Solo el jugador elegido recibe las cartas específicas
        cartasSirena: (ae.tipo === 'sirena' && soyElegido) ? ae.cartasSirena : null,
        cartaTelescopio: (ae.tipo === 'telescopio' && soyElegido) ? ae.cartaTelescopio : null,
      };
    })(),
    accionFase4: sala.estado.accionFase4 ? {
      tipo: sala.estado.accionFase4.tipo,
      kraken: sala.estado.accionFase4.kraken ? {
        confirmados: sala.estado.accionFase4.kraken.confirmados.length,
        total: sala.estado.jugadores.filter(j => !j.sacrificado).length,
        haVotado: sala.estado.accionFase4.kraken.confirmados.includes(socketId),
        objetivo: sala.estado.accionFase4.kraken.objetivo || null,
      } : null,
    } : null,
    cartasRitualesReveladas: sala.estado.cartasRitualesReveladas,
    mazoDisponibleCount: sala.estado.mazoDisponible.length,
    mazoDescarteCount: sala.estado.mazoDescarte.length,
  };
};

const reintegrarJugador = (codigo, socketId) => {
  const sala = salas.get(codigo);
  if (!sala) return null;
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

// Reconectar un jugador que vuelve con nuevo socket.id pero mismo jugadorId
const reconectarPorJugadorId = (codigo, jugadorId, nuevoSocketId) => {
  const sala = salas.get(codigo);
  if (!sala) return null;

  const jugador = sala.jugadores.find(j => j.jugadorId === jugadorId);
  if (!jugador) return null; // jugador no encontrado en esta sala

  const oldSocketId = jugador.id;
  if (oldSocketId === nuevoSocketId) {
    // Misma conexión, solo marcar como conectado
    jugador.conectado = true;
    if (sala.estado) {
      sala.estado.jugadores = sala.estado.jugadores.map(j =>
        j.id === oldSocketId ? { ...j, conectado: true } : j
      );
    }
    return sala;
  }

  // Actualizar socketId en sala y en el estado de juego
  jugador.id = nuevoSocketId;
  jugador.conectado = true;
  if (sala.estado) actualizarSocketIdEnEstado(sala.estado, oldSocketId, nuevoSocketId);
  if (sala.hostId === oldSocketId) sala.hostId = nuevoSocketId;

  return sala;
};

// El navegante investiga el rol de otro jugador (FASE_4)
const investigarJugador = (codigo, socketId, objetivoId) => {
  const sala = salas.get(codigo);
  if (!sala?.estado) throw new Error('No hay partida activa');

  const navegante = sala.estado.jugadores.find(j => j.esCapitan);
  if (!navegante || navegante.id !== socketId) throw new Error('Solo el capitán puede investigar');

  const objetivo = sala.estado.jugadores.find(j => j.id === objetivoId);
  if (!objetivo) throw new Error('Jugador no encontrado');

  const resultado = { nombre: objetivo.nombre, rol: objetivo.rol };
  sala.estado = ejecutarFase5(sala.estado);
  sala.fase = sala.estado.fase;

  return { sala, resultado };
};

module.exports = {
  crearSala, unirseASala, seleccionarHost, iniciarPartida,
  confirmarRol, avanzarFase, retrocederFase, reiniciarPartida,
  procesarAccion, desconectarJugador, obtenerSala,
  vistaSalaParaCliente, vistaEstadoParaJugador, reintegrarJugador,
  reconectarPorJugadorId, investigarJugador,
};
