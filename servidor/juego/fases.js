const { FASES, ROLES, TIPOS_CARTA_NAVEGACION, TIPOS_CARTA_RITUAL } = require('../../compartido/constantes');
const { moverBarco, verificarVictoria, esCasillaEspecial, tipoCasillaEspecial } = require('./tablero');
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
    motin: { ...estado.motin, votos: {}, confirmados: [], activo: false, totalPistolas: undefined, exitoso: undefined },
  };
};

const votarMotin = (estado, jugadorId, pistolas) => {
  const jugador = estado.jugadores.find(j => j.id === jugadorId);
  if (!jugador) throw new Error('Jugador no encontrado');
  if (pistolas > jugador.pistolas) throw new Error('No tienes suficientes pistolas');

  const nuevosVotos = { ...estado.motin.votos, [jugadorId]: pistolas };
  const confirmados = [...new Set([...estado.motin.confirmados, jugadorId])];
  const activos = estado.jugadores.filter(j => !j.sacrificado);
  const todosVotaron = confirmados.length >= activos.length;

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
    // Sin motín, avanzar al cofre — pre-dibujar 2 cartas para el capitán
    const jugadoresActualizados = estado.jugadores.map(j => ({
      ...j,
      pistolas: nuevosVotos[j.id] !== undefined ? j.pistolas - nuevosVotos[j.id] : j.pistolas,
    }));
    // Refrescar mazo si quedan ≤4 cartas antes de robar
    const estadoRefrescado = refrescarMazoSiNecesario({ ...estado, jugadores: jugadoresActualizados });
    const { cartas: cartasCapitan, nuevoMazo } = robarCartasMazo(estadoRefrescado.mazoDisponible, 2);
    return {
      ...estadoRefrescado,
      mazoDisponible: nuevoMazo,
      fase: FASES.FASE_3,
      motin: { ...estado.motin, votos: nuevosVotos, confirmados, exitoso: false, totalPistolas },
      cofre: {
        cartaCapitan: null, cartaTeniente: null, cartaNavegante: null,
        etapa: 'capitan',
        cartasDisponibles: cartasCapitan,
      },
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
  const cartas = cofre.cartasDisponibles || [];

  if (cofre.etapa === 'capitan') {
    const cartaElegida = cartas.find(c => c.id === cartaElegidaId);
    if (!cartaElegida) throw new Error('Carta no válida');
    const cartaDescartada = cartas.find(c => c.id !== cartaElegidaId);
    // Descartar la carta no elegida, luego refrescar si quedan ≤4 y robar 2 para el teniente
    const descarteActualizado = cartaDescartada ? [...mazoDescarte, cartaDescartada] : mazoDescarte;
    const estadoTras = refrescarMazoSiNecesario({ ...estado, mazoDisponible, mazoDescarte: descarteActualizado });
    const { cartas: cartasTeniente, nuevoMazo } = robarCartasMazo(estadoTras.mazoDisponible, 2);
    return {
      ...estadoTras,
      mazoDisponible: nuevoMazo,
      mazoDescarte: estadoTras.mazoDescarte,
      cofre: { ...cofre, cartaCapitan: cartaElegida, etapa: 'teniente', cartasDisponibles: cartasTeniente },
    };
  }

  if (cofre.etapa === 'teniente') {
    const cartaElegida = cartas.find(c => c.id === cartaElegidaId);
    if (!cartaElegida) throw new Error('Carta no válida');
    const cartaDescartada = cartas.find(c => c.id !== cartaElegidaId);
    // El navegante elige entre la carta del capitán y la del teniente
    return {
      ...estado,
      mazoDescarte: cartaDescartada ? [...mazoDescarte, cartaDescartada] : mazoDescarte,
      cofre: {
        ...cofre,
        cartaTeniente: cartaElegida,
        etapa: 'navegante',
        cartasDisponibles: [cofre.cartaCapitan, cartaElegida],
      },
    };
  }

  if (cofre.etapa === 'navegante') {
    const cartaElegida = cartas.find(c => c?.id === cartaElegidaId);
    if (!cartaElegida) throw new Error('Carta no válida');
    const cartaDescartada = cartas.find(c => c?.id !== cartaElegidaId);
    return {
      ...estado,
      mazoDescarte: cartaDescartada ? [...mazoDescarte, cartaDescartada] : mazoDescarte,
      cofre: { ...cofre, cartaNavegante: cartaElegida, etapa: 'revelar', cartasDisponibles: null },
    };
  }

  throw new Error('Etapa del cofre no válida');
};

const aplicarCartaNavegacion = (estado) => {
  const carta = estado.cofre.cartaNavegante;
  if (!carta) throw new Error('No hay carta para aplicar');

  let nuevoEstado = {
    ...estado,
    ultimaCarta: carta,
    jugadores: estado.jugadores.map(j => ({
      ...j,
      curriculos: j.esCapitan ? j.curriculos + 1 : j.curriculos,
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
        // Registro de Camarote empieza en 'elegir' (el Cultista elige a quién investigar)
        const etapaInicial = cartaRitual.tipo === TIPOS_CARTA_RITUAL.REGISTRO_CAMAROTE ? 'elegir' : null;
        nuevoEstado = {
          ...nuevoEstado,
          mazoRitual: restoRitual,
          cartasRitualesReveladas: [...nuevoEstado.cartasRitualesReveladas, cartaRitual],
          accionEspecial: { tipo: 'ritual', carta: cartaRitual, etapa: etapaInicial },
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
    const tipoAccion = tipoCasillaEspecial(nuevoHex);
    nuevoEstado = {
      ...nuevoEstado,
      fase: FASES.FASE_4,
      accionFase4: {
        tipo: tipoAccion,
        kraken: tipoAccion === 'kraken_menor' ? { votos: {}, confirmados: [] } : null,
      },
    };
  } else {
    nuevoEstado = { ...nuevoEstado, fase: FASES.FASE_5 };
  }

  return nuevoEstado;
};

const ejecutarFase5 = (estado) => {
  const jugadoresActualizados = estado.jugadores.map(j => ({
    ...j,
    // Los sacrificados quedan fuera permanentemente; teniente/navegante solo este turno
    fueraDeServicio: j.sacrificado || j.esTeniente || j.esNavegante,
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
    // Preservar ritual si el Cultista aún no ha actuado
    accionEspecial: estado.accionEspecial?.tipo === 'ritual' ? estado.accionEspecial : null,
    accionFase4: null,
  };
};

const votarKraken = (estado, socketId, objetivoId) => {
  const { accionFase4 } = estado;
  if (!accionFase4?.kraken) throw new Error('No hay votación de sacrificio activa');

  const jugador = estado.jugadores.find(j => j.id === socketId && !j.sacrificado);
  if (!jugador) throw new Error('Jugador no válido');

  const nuevosVotos = { ...accionFase4.kraken.votos, [socketId]: objetivoId };
  const confirmados = [...new Set([...accionFase4.kraken.confirmados, socketId])];
  const activos = estado.jugadores.filter(j => !j.sacrificado);
  const todosVotaron = confirmados.length >= activos.length;

  if (!todosVotaron) {
    return {
      ...estado,
      accionFase4: { ...accionFase4, kraken: { ...accionFase4.kraken, votos: nuevosVotos, confirmados } },
    };
  }

  // Contar votos y determinar sacrificado
  const conteo = {};
  Object.values(nuevosVotos).forEach(id => { conteo[id] = (conteo[id] || 0) + 1; });
  const maxVotos = Math.max(...Object.values(conteo));
  const empatados = Object.keys(conteo).filter(id => conteo[id] === maxVotos);
  const sacrificadoId = empatados[0]; // en empate, primer candidato
  const sacrificado = estado.jugadores.find(j => j.id === sacrificadoId);
  if (!sacrificado) throw new Error('Sacrificado no encontrado');

  const nuevoKraken = { ...accionFase4.kraken, votos: nuevosVotos, confirmados, objetivo: sacrificadoId };

  // Victoria cultista si se sacrifica al Cultista
  if (sacrificado.rol === 'cultista') {
    return { ...estado, fase: FASES.VICTORIA, victoria: 'cultistas', accionFase4: { ...accionFase4, kraken: nuevoKraken } };
  }

  // Jugador eliminado, continuar
  const jugadoresActualizados = estado.jugadores.map(j =>
    j.id === sacrificadoId ? { ...j, sacrificado: true, fueraDeServicio: true } : j
  );
  return ejecutarFase5({ ...estado, jugadores: jugadoresActualizados, accionFase4: { ...accionFase4, kraken: nuevoKraken } });
};

// Inicializa el cofre cuando se entra a fase_3 manualmente (sin pasar por votarMotin)
const inicializarCofre = (estado) => {
  if (estado.cofre?.etapa) return estado; // ya inicializado
  let nuevoEstado = refrescarMazoSiNecesario(estado);
  const { cartas: cartasCapitan, nuevoMazo } = robarCartasMazo(nuevoEstado.mazoDisponible, 2);
  return {
    ...nuevoEstado,
    mazoDisponible: nuevoMazo,
    cofre: {
      cartaCapitan: null, cartaTeniente: null, cartaNavegante: null,
      etapa: 'capitan',
      cartasDisponibles: cartasCapitan,
    },
  };
};

// Rebaraja el mazo cuando quedan ≤ 4 cartas disponibles.
// Añade mazoRefrescado:true al estado para que index.js pueda emitir el evento de animación.
const refrescarMazoSiNecesario = (estado) => {
  if (estado.mazoDisponible.length <= 4 && estado.mazoDescarte.length > 0) {
    const anterior = estado.mazoDisponible.length + estado.mazoDescarte.length;
    const todas = barajar([...estado.mazoDisponible, ...estado.mazoDescarte]);
    return { ...estado, mazoDisponible: todas, mazoDescarte: [], mazoRefrescado: { anterior, nuevo: todas.length } };
  }
  return estado;
};

// ── Acciones especiales (SIRENA / TELESCOPIO) ─────────────────

// Inicia la acción especial pendiente antes de mover el barco
const iniciarAccionEspecialPendiente = (estado) => {
  const carta = estado.cofre?.cartaNavegante;
  if (!carta) throw new Error('No hay carta de navegación');
  return {
    ...estado,
    accionEspecial: { tipo: carta.tipo, etapa: 'capitan-elige', jugadorElegido: null },
  };
};

// El capitán elige qué jugador realiza la acción especial
const elegirJugadorAccionEspecial = (estado, jugadorId) => {
  const { accionEspecial, mazoDescarte, mazoDisponible } = estado;
  if (!accionEspecial || accionEspecial.etapa !== 'capitan-elige') throw new Error('No hay acción especial en curso');

  let nuevoAccion = { ...accionEspecial, jugadorElegido: jugadorId, etapa: 'jugador-actua' };
  let nuevoEstado = estado;

  if (accionEspecial.tipo === 'sirena') {
    // Últimas 3 cartas del descarte, barajadas para que no se sepa quién descartó cuál
    nuevoAccion.cartasSirena = barajar(mazoDescarte.slice(-3));
  } else if (accionEspecial.tipo === 'telescopio') {
    if (mazoDisponible.length === 0) throw new Error('No quedan cartas disponibles');
    const [cartaTelescopio, ...restoMazo] = mazoDisponible;
    nuevoAccion.cartaTelescopio = cartaTelescopio;
    nuevoEstado = { ...nuevoEstado, mazoDisponible: restoMazo };
  }

  return { ...nuevoEstado, accionEspecial: nuevoAccion };
};

// El jugador elegido confirma (SIRENA) o decide qué hacer con la carta (TELESCOPIO)
const confirmarAccionEspecial = (estado, decision) => {
  const { accionEspecial } = estado;
  if (!accionEspecial || accionEspecial.etapa !== 'jugador-actua') throw new Error('No hay acción especial en curso');

  let nuevoEstado = estado;

  if (accionEspecial.tipo === 'telescopio') {
    if (decision === 'descartar') {
      nuevoEstado = {
        ...nuevoEstado,
        mazoDescarte: [...nuevoEstado.mazoDescarte, accionEspecial.cartaTelescopio],
      };
    } else { // 'devolver' — vuelve arriba del mazo disponible
      nuevoEstado = {
        ...nuevoEstado,
        mazoDisponible: [accionEspecial.cartaTelescopio, ...nuevoEstado.mazoDisponible],
      };
    }
    nuevoEstado = refrescarMazoSiNecesario(nuevoEstado);
  }

  // Limpiar accionEspecial y aplicar la carta de navegación (mover el barco)
  nuevoEstado = { ...nuevoEstado, accionEspecial: null };
  return aplicarCartaNavegacion(nuevoEstado);
};

// ── Acciones Rituales del Culto ───────────────────────────────

const procesarAccionRitual = (estado, socketId, datos) => {
  const { accionEspecial } = estado;
  if (!accionEspecial || accionEspecial.tipo !== 'ritual') throw new Error('No hay acción ritual en curso');

  const jugador = estado.jugadores.find(j => j.id === socketId);
  if (!jugador || jugador.rol !== ROLES.CULTISTA) throw new Error('Solo el Cultista puede realizar acciones rituales');

  const tipoCarta = accionEspecial.carta?.tipo;
  let nuevoEstado = estado;

  switch (tipoCarta) {
    case TIPOS_CARTA_RITUAL.CONVERSION_CULTO: {
      const { jugadorId } = datos;
      if (!jugadorId) throw new Error('Debes elegir a quién convertir');
      const objetivo = nuevoEstado.jugadores.find(j => j.id === jugadorId);
      if (!objetivo) throw new Error('Jugador no encontrado');
      if (objetivo.sacrificado) throw new Error('No puedes convertir a un jugador eliminado');
      if (objetivo.rol === ROLES.CULTISTA) throw new Error('Ya es el Cultista');

      nuevoEstado = {
        ...nuevoEstado,
        jugadores: nuevoEstado.jugadores.map(j =>
          j.id === jugadorId ? { ...j, rol: ROLES.ADEPTO } : j
        ),
        cultista: {
          ...nuevoEstado.cultista,
          adeptos: [...(nuevoEstado.cultista.adeptos || []), jugadorId],
        },
      };
      break;
    }
    case TIPOS_CARTA_RITUAL.REGISTRO_CAMAROTE: {
      if (datos.jugadorId) {
        // Paso 1: el Cultista elige a quién investigar → transición a 'ver'
        const objetivo = nuevoEstado.jugadores.find(j => j.id === datos.jugadorId);
        if (!objetivo) throw new Error('Jugador no encontrado');
        // No limpiamos accionEspecial — actualizamos con el resultado
        return {
          ...nuevoEstado,
          accionEspecial: {
            ...accionEspecial,
            etapa: 'ver',
            objetivoId: datos.jugadorId,
            rolVisto: objetivo.rol,
            nombreVisto: objetivo.nombre,
          },
        };
      }
      // Paso 2: sin jugadorId = confirmar/temporizador → guardar quién fue visto y limpiar
      if (accionEspecial.objetivoId) {
        nuevoEstado = {
          ...nuevoEstado,
          cultista: {
            ...nuevoEstado.cultista,
            jugadoresVistos: [
              ...(nuevoEstado.cultista.jugadoresVistos || []),
              accionEspecial.objetivoId,
            ],
          },
        };
      }
      break;
    }
    case TIPOS_CARTA_RITUAL.ALIJO_ARMAS: {
      const distribucion = datos.distribucion || {};
      const totalDistribuido = Object.values(distribucion).reduce((a, b) => a + Number(b), 0);
      if (totalDistribuido > 3) throw new Error('Solo puedes distribuir 3 pistolas en total');

      nuevoEstado = {
        ...nuevoEstado,
        jugadores: nuevoEstado.jugadores.map(j => {
          const extra = Number(distribucion[j.id] || 0);
          return extra > 0 ? { ...j, pistolas: j.pistolas + extra } : j;
        }),
      };
      break;
    }
    default:
      throw new Error(`Tipo de carta ritual desconocido: ${tipoCarta}`);
  }

  return { ...nuevoEstado, accionEspecial: null };
};

module.exports = {
  elegirCapitanAleatorio,
  elegirEquipo,
  votarMotin,
  elegirCartaCofre,
  aplicarCartaNavegacion,
  ejecutarFase5,
  votarKraken,
  robarCartasMazo,
  inicializarCofre,
  refrescarMazoSiNecesario,
  iniciarAccionEspecialPendiente,
  elegirJugadorAccionEspecial,
  confirmarAccionEspecial,
  procesarAccionRitual,
};
