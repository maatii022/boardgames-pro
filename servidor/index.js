const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { EVENTOS, FASES } = require('../compartido/constantes');
const {
  crearSala, unirseASala, seleccionarHost, iniciarPartida,
  confirmarRol, avanzarFase, retrocederFase, reiniciarPartida,
  procesarAccion, desconectarJugador, obtenerSala,
  vistaSalaParaCliente, vistaEstadoParaJugador, reintegrarJugador,
  reconectarPorJugadorId, investigarJugador,
} = require('./sala');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../cliente/dist')));

// Ruta para obtener info de sala (para QR)
app.get('/api/sala/:codigo', (req, res) => {
  const sala = obtenerSala(req.params.codigo.toUpperCase());
  if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
  res.json(vistaSalaParaCliente(sala));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../cliente/dist/index.html'));
});

// Mapa de socketId → codigo de sala
const socketSala = new Map();

const RITUAL_DELAY_MS = 7000; // Tiempo para que todos cierren los ojos antes de que vibre el móvil del Cultista

const emitirSalaActualizada = (sala) => {
  const vistaPublica = vistaSalaParaCliente(sala);
  // Emitir a todos en la sala
  io.to(sala.codigo).emit(EVENTOS.SALA_ACTUALIZADA, vistaPublica);

  if (sala.estado) {
    const ae = sala.estado.accionEspecial;
    // ¿Es la revelación inicial de un ritual? (etapa 'ver' = resultado del Registro, no necesita delay)
    const esRitualNuevo = ae?.tipo === 'ritual' && ae?.etapa !== 'ver';

    if (esRitualNuevo) {
      // El TABLERO recibe la actualización inmediatamente (muestra la carta a todos)
      // Los JUGADORES esperan 7 s para que den tiempo a cerrar los ojos antes de que el Cultista actúe
      setTimeout(() => {
        sala.jugadores.forEach(j => {
          io.to(j.id).emit('estado-actualizado', vistaEstadoParaJugador(sala, j.id));
        });
      }, RITUAL_DELAY_MS);
    } else {
      // Comportamiento normal — sin delay
      sala.jugadores.forEach(j => {
        io.to(j.id).emit('estado-actualizado', vistaEstadoParaJugador(sala, j.id));
      });
    }

    // Si el mazo se rebarajó en esta acción, emitir el evento de animación
    if (sala.estado.mazoRefrescado) {
      io.to(sala.codigo).emit('mazo-refrescado', sala.estado.mazoRefrescado);
      sala.estado.mazoRefrescado = null; // limpiar flag
    }

    // Emitir vista de tablero (sin info privada) a la pantalla grande
    io.to(`tablero-${sala.codigo}`).emit('tablero-actualizado', {
      fase: sala.estado.fase,
      barco: sala.estado.barco,
      turno: sala.estado.turno,
      jugadores: sala.estado.jugadores.map(j => ({
        id: j.id, nombre: j.nombre,
        curriculos: j.curriculos,
        fueraDeServicio: j.fueraDeServicio,
        esCapitan: j.esCapitan,
        esTeniente: j.esTeniente,
        esNavegante: j.esNavegante,
        rolConfirmado: j.rolConfirmado,
        conectado: j.conectado,
        rol: sala.estado.victoria ? j.rol : undefined,
      })),
      capitanIdx: sala.estado.capitanIdx,
      victoria: sala.estado.victoria,
      motin: {
        umbral: sala.estado.motin.umbral,
        confirmados: sala.estado.motin.confirmados.length,
        total: sala.jugadores.length,
        exitoso: sala.estado.motin.exitoso,
      },
      cofre: { etapa: sala.estado.cofre.etapa },
      cartasRitualesReveladas: sala.estado.cartasRitualesReveladas,
      accionEspecial: sala.estado.accionEspecial,
      ultimaCarta: sala.estado.ultimaCarta || null,
      mazoDisponibleCount: sala.estado.mazoDisponible.length,
    });
  }
};

io.on('connection', (socket) => {
  console.log(`🔌 Conectado: ${socket.id}`);

  // Unirse como pantalla de tablero (TV) — sin ser jugador
  socket.on('unirse-tablero', ({ codigo }) => {
    const sala = obtenerSala(codigo?.toUpperCase());
    if (!sala) return socket.emit(EVENTOS.ERROR, { mensaje: 'Sala no encontrada' });
    socket.join(sala.codigo);           // también al room general para recibir sala-actualizada
    socket.join(`tablero-${sala.codigo}`);
    socketSala.set(socket.id, sala.codigo); // registrar para que pueda emitir comandos
    socket.emit('tablero-conectado', { sala: vistaSalaParaCliente(sala) });
    // Emitir estado actual si hay partida en curso —
    // usamos tablero-actualizado (vista pública del tablero), NO estado-actualizado (vista privada de jugador)
    if (sala.estado) {
      socket.emit('tablero-actualizado', {
        fase:     sala.estado.fase,
        barco:    sala.estado.barco,
        turno:    sala.estado.turno,
        jugadores: sala.estado.jugadores.map(j => ({
          id: j.id, nombre: j.nombre,
          curriculos: j.curriculos,
          fueraDeServicio: j.fueraDeServicio,
          esCapitan:  j.esCapitan,
          esTeniente: j.esTeniente,
          esNavegante: j.esNavegante,
          rolConfirmado: j.rolConfirmado,
          conectado: j.conectado,
          rol: sala.estado.victoria ? j.rol : undefined,
        })),
        capitanIdx: sala.estado.capitanIdx,
        victoria:   sala.estado.victoria,
        motin: {
          umbral:      sala.estado.motin.umbral,
          confirmados: sala.estado.motin.confirmados.length,
          total:       sala.jugadores.length,
          exitoso:     sala.estado.motin.exitoso,
        },
        cofre:                    { etapa: sala.estado.cofre.etapa },
        cartasRitualesReveladas:  sala.estado.cartasRitualesReveladas,
        accionEspecial:           sala.estado.accionEspecial,
        ultimaCarta:              sala.estado.ultimaCarta || null,
        mazoDisponibleCount:      sala.estado.mazoDisponible.length,
      });
    }
  });

  // Comandos de tablero — sin verificar hostId, el tablero siempre puede controlar
  socket.on('tablero-iniciar', () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    const sala = obtenerSala(codigo);
    if (!sala) return;
    try {
      // Usar el hostId real de la sala para iniciar
      const salaActualizada = iniciarPartida(codigo, sala.hostId);
      emitirSalaActualizada(salaActualizada);
      io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: FASES.FASE_0 });
    } catch (e) { socket.emit(EVENTOS.ERROR, { mensaje: e.message }); }
  });

  socket.on('tablero-avanzar', () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    const sala = obtenerSala(codigo);
    if (!sala) return;
    try {
      const salaActualizada = avanzarFase(codigo, sala.hostId);
      emitirSalaActualizada(salaActualizada);
      io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: salaActualizada.fase });
    } catch (e) { socket.emit(EVENTOS.ERROR, { mensaje: e.message }); }
  });

  socket.on('tablero-retroceder', () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    const sala = obtenerSala(codigo);
    if (!sala) return;
    try {
      const salaActualizada = retrocederFase(codigo, sala.hostId);
      emitirSalaActualizada(salaActualizada);
      io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: salaActualizada.fase });
    } catch (e) { socket.emit(EVENTOS.ERROR, { mensaje: e.message }); }
  });

  socket.on('tablero-reiniciar', () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    const sala = obtenerSala(codigo);
    if (!sala) return;
    try {
      const salaActualizada = reiniciarPartida(codigo, sala.hostId);
      emitirSalaActualizada(salaActualizada);
      io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: FASES.LOBBY });
    } catch (e) { socket.emit(EVENTOS.ERROR, { mensaje: e.message }); }
  });

  socket.on('tablero-cambiar-host', ({ nuevoHostId }) => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    const sala = obtenerSala(codigo);
    if (!sala) return;
    try {
      const salaActualizada = seleccionarHost(codigo, sala.hostId, nuevoHostId);
      emitirSalaActualizada(salaActualizada);
    } catch (e) { socket.emit(EVENTOS.ERROR, { mensaje: e.message }); }
  });

  socket.on(EVENTOS.CREAR_SALA, ({ nombre, esSoloTablero, jugadorId }) => {
    try {
      const sala = crearSala(socket.id, jugadorId || socket.id, nombre || 'Host', esSoloTablero || false);
      socketSala.set(socket.id, sala.codigo);
      socket.join(sala.codigo);
      if (esSoloTablero) socket.join(`tablero-${sala.codigo}`);
      socket.emit('sala-creada', { sala: vistaSalaParaCliente(sala) });
      if (esSoloTablero) socket.emit('tablero-conectado', { sala: vistaSalaParaCliente(sala) });
      console.log(`🏠 Sala creada: ${sala.codigo}${esSoloTablero ? ' (tablero)' : ` por ${nombre}`}`);
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  socket.on(EVENTOS.UNIRSE_SALA, ({ codigo, nombre, jugadorId }) => {
    try {
      const sala = unirseASala(codigo?.toUpperCase(), socket.id, jugadorId || null, nombre || 'Jugador');
      socketSala.set(socket.id, sala.codigo);
      socket.join(sala.codigo);
      emitirSalaActualizada(sala);
      socket.emit('unido-a-sala', { sala: vistaSalaParaCliente(sala), socketId: socket.id });
      console.log(`👤 ${nombre} se unió a sala ${sala.codigo}`);
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  // Reconexión: el jugador vuelve con nuevo socket pero mismo jugadorId
  socket.on(EVENTOS.RECONECTAR_SALA, ({ codigo, jugadorId }) => {
    if (!codigo || !jugadorId) return;
    try {
      const sala = reconectarPorJugadorId(codigo.toUpperCase(), jugadorId, socket.id);
      if (!sala) {
        // Sala o jugador no encontrado — sesión expirada
        socket.emit('sesion-expirada');
        return;
      }
      socketSala.set(socket.id, sala.codigo);
      socket.join(sala.codigo);
      emitirSalaActualizada(sala);
      socket.emit('unido-a-sala', { sala: vistaSalaParaCliente(sala), socketId: socket.id, reconectado: true });
      if (sala.estado) {
        socket.emit('estado-actualizado', vistaEstadoParaJugador(sala, socket.id));
        socket.emit(EVENTOS.FASE_CAMBIADA, { fase: sala.estado.fase });
      }
      console.log(`🔄 Reconectado: ${jugadorId} en sala ${sala.codigo}`);
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  socket.on(EVENTOS.SELECCIONAR_HOST, ({ nuevoHostId }) => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    try {
      const sala = seleccionarHost(codigo, socket.id, nuevoHostId);
      emitirSalaActualizada(sala);
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  socket.on(EVENTOS.HOST_INICIAR_PARTIDA, () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    try {
      const sala = iniciarPartida(codigo, socket.id);
      emitirSalaActualizada(sala);
      io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: FASES.FASE_0 });
      console.log(`🎮 Partida iniciada en sala ${codigo}`);
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  socket.on(EVENTOS.CONFIRMAR_ROL, () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    try {
      const { sala, todosConfirmados } = confirmarRol(codigo, socket.id);
      emitirSalaActualizada(sala);
      if (todosConfirmados) {
        io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: FASES.DURMIENDO });
      }
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  socket.on(EVENTOS.HOST_AVANZAR_FASE, () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    try {
      const sala = avanzarFase(codigo, socket.id);
      emitirSalaActualizada(sala);
      io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: sala.fase });
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  socket.on(EVENTOS.HOST_RETROCEDER_FASE, () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    try {
      const sala = retrocederFase(codigo, socket.id);
      emitirSalaActualizada(sala);
      io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: sala.fase });
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  socket.on(EVENTOS.HOST_REINICIAR, () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    try {
      const sala = reiniciarPartida(codigo, socket.id);
      emitirSalaActualizada(sala);
      io.to(sala.codigo).emit(EVENTOS.FASE_CAMBIADA, { fase: FASES.LOBBY });
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  // Acciones de juego genéricas
  const accionesJuego = [
    EVENTOS.ELEGIR_EQUIPO,
    EVENTOS.VOTAR_MOTIN,
    EVENTOS.ELEGIR_CARTA_COFRE,
    EVENTOS.ABRIR_COFRE,
    EVENTOS.ACCION_RITUAL,
    'votar-kraken',
    'resolver-empate-kraken',
    'accion-especial-elegir-jugador',
    'accion-especial-confirmar',
  ];

  accionesJuego.forEach(accion => {
    socket.on(accion, (datos) => {
      const codigo = socketSala.get(socket.id);
      if (!codigo) return;
      try {
        // Capturar targets de notificaciones privadas antes de procesar la acción
        let conversionTargetId = null;
        let registroTargetId   = null;
        if (accion === EVENTOS.ACCION_RITUAL && datos?.jugadorId) {
          const salaActual = obtenerSala(codigo);
          const tipoCarta  = salaActual?.estado?.accionEspecial?.carta?.tipo;
          if (tipoCarta === 'conversion_culto')  conversionTargetId = datos.jugadorId;
          if (tipoCarta === 'registro_camarote') registroTargetId   = datos.jugadorId;
        }

        const sala = procesarAccion(codigo, socket.id, accion, datos || {});
        emitirSalaActualizada(sala);

        // Notificar al jugador convertido al Culto
        if (conversionTargetId) {
          const socketConvertido = sala.jugadores.find(sj => sj.id === conversionTargetId);
          if (socketConvertido) io.to(socketConvertido.id).emit('convertido-al-culto');
        }
        // Notificar al jugador cuyo camarote registró el Culto (vibración silenciosa)
        if (registroTargetId) {
          io.to(registroTargetId).emit('camarote-registrado');
        }
        if (sala.estado?.victoria) {
          io.to(sala.codigo).emit(EVENTOS.VICTORIA_DECLARADA, { ganador: sala.estado.victoria });
        }
        // Emitir resultado del sacrificio al Kraken cuando la votación se resuelva
        // (tanto por voto directo como tras el desempate decidido por el capitán)
        if (accion === 'votar-kraken' || accion === 'resolver-empate-kraken') {
          const objetivo = sala.estado.accionFase4?.kraken?.objetivo
            || (sala.estado.victoria === 'cultistas' ? sala.estado.jugadores.find(j => j.rol === 'cultista')?.id : null);
          if (objetivo) {
            const sacrificado = sala.estado.jugadores.find(j => j.id === objetivo);
            if (sacrificado) {
              if (sala.estado.victoria === 'cultistas') {
                // Victoria cultista: sí se revela que era el Cultista
                io.to(sala.codigo).emit('kraken-sacrificio', {
                  nombre: sacrificado.nombre,
                  rol: sacrificado.rol,
                  victoriaCultistas: true,
                });
              } else {
                // El sacrificado NO era el Cultista — no se revela su rol
                io.to(sala.codigo).emit('kraken-sacrificio', {
                  nombre: sacrificado.nombre,
                  victoriaCultistas: false,
                });
                // Solo el jugador sacrificado recibe el mensaje personal
                const socketSacrificado = sala.jugadores.find(sj => sj.id === objetivo);
                if (socketSacrificado) {
                  io.to(socketSacrificado.id).emit('kraken-eliminado');
                }
              }
            }
          }
        }
        // Emitir resultado del motín cuando todos hayan votado
        if (accion === EVENTOS.VOTAR_MOTIN && sala.estado.motin.totalPistolas !== undefined) {
          const nuevoCapitan = sala.estado.motin.exitoso
            ? sala.estado.jugadores.find(j => j.esCapitan) : null;
          io.to(sala.codigo).emit('motin-resultado', {
            exitoso: sala.estado.motin.exitoso,
            totalPistolas: sala.estado.motin.totalPistolas,
            umbral: sala.estado.motin.umbral,
            nuevoCapitan: nuevoCapitan ? { id: nuevoCapitan.id, nombre: nuevoCapitan.nombre } : null,
          });
        }
      } catch (e) {
        socket.emit(EVENTOS.ERROR, { mensaje: e.message });
      }
    });
  });

  // FASE_4: el navegante investiga el rol de un jugador
  socket.on('fase4-investigar', ({ jugadorId: objetivoId }) => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    try {
      const { sala, resultado } = investigarJugador(codigo, socket.id, objetivoId);
      // Solo el capitán ve el resultado
      socket.emit('investigacion-resultado', resultado);
      // El jugador investigado recibe una vibración silenciosa
      io.to(objetivoId).emit('camarote-registrado');
      emitirSalaActualizada(sala);
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  // Jugador pide estado actual al montar la vista (por si perdió eventos al navegar)
  socket.on('pedir-estado', () => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    const sala = obtenerSala(codigo);
    if (!sala) return;
    // Marcar jugador como conectado
    reintegrarJugador(codigo, socket.id);
    socket.emit(EVENTOS.SALA_ACTUALIZADA, vistaSalaParaCliente(sala));
    socket.emit('fase-cambiada', { fase: sala.fase });
    if (sala.estado) {
      socket.emit('estado-actualizado', vistaEstadoParaJugador(sala, socket.id));
    }
  });

  // Kick de jugador (solo el host puede)
  socket.on('kick-jugador', ({ jugadorId }) => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    const sala = obtenerSala(codigo);
    if (!sala) return socket.emit(EVENTOS.ERROR, { mensaje: 'Sala no encontrada' });
    if (sala.hostId !== socket.id) return socket.emit(EVENTOS.ERROR, { mensaje: 'Solo el host puede expulsar jugadores' });
    if (jugadorId === socket.id) return socket.emit(EVENTOS.ERROR, { mensaje: 'No puedes expulsarte a ti mismo' });

    sala.jugadores = sala.jugadores.filter(j => j.id !== jugadorId);
    if (sala.estado) sala.estado.jugadores = sala.estado.jugadores.filter(j => j.id !== jugadorId);
    sala.numJugadores = sala.jugadores.length;

    // Notificar al jugador expulsado
    io.to(jugadorId).emit('expulsado', { mensaje: 'Has sido expulsado de la sala' });
    socketSala.delete(jugadorId);

    emitirSalaActualizada(sala);
    console.log(`🚫 ${jugadorId} expulsado de sala ${codigo}`);
  });

  // ── DEBUG: vaciar mazo a N cartas para testear el refresco ──────────
  // Solo procesa la petición si viene desde la sala correcta.
  socket.on('debug-vaciar-mazo', ({ cartas = 2 } = {}) => {
    const codigo = socketSala.get(socket.id);
    if (!codigo) return;
    const sala = obtenerSala(codigo);
    if (!sala?.estado) return;
    const n = Math.max(0, Math.min(cartas, sala.estado.mazoDisponible.length));
    // Mover el exceso al descarte
    const sobrantes = sala.estado.mazoDisponible.slice(n);
    sala.estado.mazoDisponible = sala.estado.mazoDisponible.slice(0, n);
    sala.estado.mazoDescarte   = [...sala.estado.mazoDescarte, ...sobrantes];
    emitirSalaActualizada(sala);
    console.log(`🃏 [DEBUG] Mazo vaciado a ${n} cartas en sala ${codigo}`);
  });

  socket.on('disconnect', () => {
    const codigo = socketSala.get(socket.id);
    if (codigo) {
      const resultado = desconectarJugador(socket.id);
      if (resultado) emitirSalaActualizada(resultado.sala);
      socketSala.delete(socket.id);
    }
    console.log(`❌ Desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🐙 Feed The Kraken servidor corriendo en puerto ${PORT}`);
});
