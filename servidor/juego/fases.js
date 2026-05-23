const { FASES, ROLES, TIPOS_CARTA_NAVEGACION, TIPOS_CARTA_RITUAL } = require('../../compartido/constantes');
const { moverBarco, verificarVictoria, esCasillaEspecial } = require('./tablero');
const { barajar } = require('./cartas');

// ============================================================
// MÁQUINA DE ESTADOS — Fases del juego
// ============================================================

const elegirCapitanAleatorio = (estado) => {
  const elegibles = estado.jugadores.filter(j => !j.fueraDeServicio);
  if (elegibles.length === 0) return estado;
  const idx = Math.floor(Math.random() * elegibles.length);
  const capitan = elegibles[idx];
  return {
    ...estado,
    jugadores: estado.jugadores.map(j => ({
      ...j,
      esCapitan: j.id === capitan.id,
      esTeniente: false,
      esNavegante: false,
    })),
    capitanIdx: estado.jugadores.findIndex(j => j.id === capitan.id),
    tenienteIdx: null,
    naveganteIdx: null,
  };
};

const elegirEquipo = (estado, tenienteId, naveganteId) => {
  const tIdx = estado.jugadores.findIndex(j => j.id === tenienteId);
  const nIdx = estado.jugadores.findIndex(j => j.id === naveganteId);
  if (tIdx === -1 || nIdx === -1) throw new Error('Jugadores no encontrados');
  if (estado.jugadores[tIdx].fueraDeServicio || estado.jugadores[nIdx].fueraDeServicio) {
    throw new Error('No puedes elegir jugadores fuera de servicio');
  }
  return {
    ...estado,
    jugadores: estado.jugadores.map((j, i) => ({
      ...j,
      esTeniente: i === tIdx,
      esNavegante: i === nIdx,
    })),
    tenienteIdx: tIdx,
    naveganteIdx: nIdx,
    fase: FASES.FASE_2,
    motin: { ...estado.motin, votos: {}, confirmados: [], activo: false },
  };
};

const votarMotin = (estado, jugadorId, pistolas) => {
  const jugador = estado.jugadores.find(j => j.id === jugadorId);
  if (!jugador) throw new Error('Jugador no encontrado');
  if (pistolas > jugador.pistolas) throw new Error('No tienes suficientes pistolas');

  const nuevosVotos = { ...estado.motin.votos, [jugadorId]: pistolas };
  const confirmados = [...new Set([...estado.motin.confirmados, jugadorId])];
  const todosVotaron = confirmados.length === estado.jugadores.length;

  if (!todosVotaron) {
    return { ...estado, motin: { ...estado.motin, votos: nuevosVotos, confirmados } };
  }

  // Calcular resultado del motín
  const totalPistolas = Object.values(nuevosVotos).reduce((a, b) => a + b, 0);
  const exitoso = totalPistolas >= estado.motin.umbral;

  if (exitoso) {
    // Rotar capitán hacia la derecha (jugador con menos currículums)
    const nuevoCapitan = encontrarSiguienteCapitan(estado);
    const jugadoresActualizados = estado.jugadores.map(j => ({
      ...j,
      pistolas: nuevosVotos[j.id] !== undefined ? j.pistolas - nuevosVotos[j.id] : j.pistolas,
      esCapitan: j.id === nuevoCapitan?.id,
      esTeniente: false,
      esNavegante: false,
    }));
    return {
      ...estado,
      jugadores: jugadoresActualizados,
      capitanIdx: estado.jugadores.findIndex(j => j.id === nuevoCapitan?.id),
      tenienteIdx: null,
      naveganteIdx: null,
      fase: FASES.FASE_1,
      motin: { ...estado.motin, votos: nuevosVotos, confirmados, exitoso: true, totalPistolas },
    };
  } else {
    // Sin motín, avanzar al cofre
    const jugadoresActualizados = estado.jugadores.map(j => ({
      ...j,
      pistolas: nuevosVotos[j.id] !== undefined ? j.pistolas - nuevosVotos[j.id] : j.pistolas,
    }));
    return {
      ...estado,
      jugadores: jugadoresActualizados,
      fase: FASES.FASE_3,
      motin: { ...estado.motin, votos: nuevosVotos, confirmados, exitoso: false, totalPistolas },
      cofre: { cartaCapitan: null, cartaTeniente: null, cartaNavegante: null, etapa: 'capitan' },
    };
  }
};

const encontrarSiguienteCapitan = (estado) => {
  const capitanActual = estado.jugadores[estado.capitanIdx];
  const jugadoresOrdenados = [...estado.jugadores]
    .filter(j => !j.fueraDeServicio && j.id !== capitanActual?.id)
    .sort((a, b) => a.curriculos - b.curriculos);
  return jugadoresOrdenados[0] || estado.jugadores[(estado.capitanIdx + 1) % estado.jugadores.length];
};

const robarCartasMazo = (mazo, cantidad) => {
  if (mazo.length < cantidad) {
    // Si el mazo se acaba, no se puede robar más (en implementación real se barajaría el descarte)
    return { cartas: mazo.slice(0, mazo.length), nuevoMazo: [] };
  }
  return { cartas: mazo.slice(0, cantidad), nuevoMazo: mazo.slice(cantidad) };
};

const elegirCartaCofre = (estado, jugadorId, cartaElegidaId) => {
  const { cofre, mazoDisponible, mazoDescarte } = estado;

  if (cofre.etapa === 'capitan') {
    const { cartas, nuevoMazo } = robarCartasMazo(mazoDisponible, 2);
    const cartaElegida = cartas.find(c => c.id === cartaElegidaId);
    const cartaDescartada = cartas.find(c => c.id !== cartaElegidaId);
    if (!cartaElegida) throw new Error('Carta no válida');
    return {
      ...estado,
      mazoDisponible: nuevoMazo,
      mazoDescarte: cartaDescartada ? [...mazoDescarte, cartaDescartada] : mazoDescarte,
      cofre: { ...cofre, cartaCapitan: cartaElegida, etapa: 'teniente', cartasParaCapitan: cartas },
    };
  }

  if (cofre.etapa === 'teniente') {
    const { cartas, nuevoMazo } = robarCartasMazo(mazoDisponible, 2);
    const cartaElegida = cartas.find(c => c.id === cartaElegidaId);
    const cartaDescartada = cartas.find(c => c.id !== cartaElegidaId);
    if (!cartaElegida) throw new Error('Carta no válida');
    return {
      ...estado,
      mazoDisponible: nuevoMazo,
      mazoDescarte: cartaDescartada ? [...mazoDescarte, cartaDescartada] : mazoDescarte,
      cofre: { ...cofre, cartaTeniente: cartaElegida, etapa: 'navegante', cartasParaTeniente: cartas },
    };
  }

  if (cofre.etapa === 'navegante') {
    const opcionesNavegante = [cofre.cartaCapitan, cofre.cartaTeniente];
    const cartaElegida = opcionesNavegante.find(c => c?.id === cartaElegidaId);
    const cartaDescartada = opcionesNavegante.find(c => c?.id !== cartaElegidaId);
    if (!cartaElegida) throw new Error('Carta no válida');
    return {
      ...estado,
      mazoDescarte: cartaDescartada ? [...mazoDescarte, cartaDescartada] : mazoDescarte,
      cofre: { ...cofre, cartaNavegante: cartaElegida, etapa: 'revelar' },
    };
  }

  throw new Error('Etapa del cofre no válida');
};

const aplicarCartaNavegacion = (estado) => {
  const carta = estado.cofre.cartaNavegante;
  if (!carta) throw new Error('No hay carta para aplicar');

  let nuevoEstado = {
    ...estado,
    jugadores: estado.jugadores.map(j => ({
      ...j,
      curriculos: (j.esCapitan || j.esTeniente || j.esNavegante) ? j.curriculos + 1 : j.curriculos,
    })),
  };

  // Mover barco según color de carta
  const colorMap = {
    'azul': 'azul',
    'amarillo': 'amarillo',
    'rojo': 'rojo',
  };
  const color = colorMap[carta.color] || 'azul';
  const nuevoHex = moverBarco(nuevoEstado.barco.hexId, color);
  nuevoEstado = { ...nuevoEstado, barco: { hexId: nuevoHex } };

  // Verificar victoria
  const ganador = verificarVictoria(nuevoHex);
  if (ganador) {
    return { ...nuevoEstado, fase: FASES.VICTORIA, victoria: ganador };
  }

  // Efectos especiales de cartas
  switch (carta.tipo) {
    case TIPOS_CARTA_NAVEGACION.BORRACHO_AZUL:
    case TIPOS_CARTA_NAVEGACION.BORRACHO_ROJO: {
      const nuevoCapitan = encontrarSiguienteCapitan(nuevoEstado);
      nuevoEstado = {
        ...nuevoEstado,
        jugadores: nuevoEstado.jugadores.map(j => ({
          ...j,
          esCapitan: j.id === nuevoCapitan?.id,
        })),
        capitanIdx: nuevoEstado.jugadores.findIndex(j => j.id === nuevoCapitan?.id),
      };
      break;
    }
    case TIPOS_CARTA_NAVEGACION.LEVANTAMIENTO_CULTO: {
      if (nuevoEstado.mazoRitual.length > 0) {
        const [cartaRitual, ...restoRitual] = nuevoEstado.mazoRitual;
        nuevoEstado = {
          ...nuevoEstado,
          mazoRitual: restoRitual,
          cartasRitualesReveladas: [...nuevoEstado.cartasRitualesReveladas, cartaRitual],
          accionEspecial: { tipo: 'ritual', carta: cartaRitual },
        };
      }
      break;
    }
    case TIPOS_CARTA_NAVEGACION.DESARMADO_AZUL: {
      // El navegante pierde 1 pistola
      nuevoEstado = {
        ...nuevoEstado,
        jugadores: nuevoEstado.jugadores.map(j =>
          j.esNavegante ? { ...j, pistolas: Math.max(0, j.pistolas - 1) } : j
        ),
      };
      break;
    }
    case TIPOS_CARTA_NAVEGACION.SIRENA:
    case TIPOS_CARTA_NAVEGACION.TELESCOPIO: {
      nuevoEstado = { ...nuevoEstado, accionEspecial: { tipo: carta.tipo } };
      break;
    }
  }

  // Verificar casilla especial
  if (esCasillaEspecial(nuevoHex)) {
    nuevoEstado = { ...nuevoEstado, fase: FASES.FASE_4 };
  } else {
    nuevoEstado = { ...nuevoEstado, fase: FASES.FASE_5 };
  }

  return nuevoEstado;
};

const ejecutarFase5 = (estado) => {
  // Poner fuera de servicio a teniente y navegante anteriores
  const jugadoresActualizados = estado.jugadores.map(j => ({
    ...j,
    fueraDeServicio: j.esTeniente || j.esNavegante ? true : false,
    esTeniente: false,
    esNavegante: false,
  }));
  return {
    ...estado,
    jugadores: jugadoresActualizados,
    tenienteIdx: null,
    naveganteIdx: null,
    fase: FASES.FASE_1,
    turno: estado.turno + 1,
    cofre: { cartaCapitan: null, cartaTeniente: null, cartaNavegante: null, etapa: null },
    accionEspecial: null,
  };
};

module.exports = {
  elegirCapitanAleatorio,
  elegirEquipo,
  votarMotin,
  elegirCartaCofre,
  aplicarCartaNavegacion,
  ejecutarFase5,
  robarCartasMazo,
};
