const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { EVENTOS, FASES } = require('../compartido/constantes');
const {
  crearSala, unirseASala, seleccionarHost, iniciarPartida,
  confirmarRol, avanzarFase, retrocederFase, reiniciarPartida,
  procesarAccion, desconectarJugador, obtenerSala,
  vistaSalaParaCliente, vistaEstadoParaJugador,
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

const emitirSalaActualizada = (sala) => {
  const vistaPublica = vistaSalaParaCliente(sala);
  // Emitir a todos en la sala
  io.to(sala.codigo).emit(EVENTOS.SALA_ACTUALIZADA, vistaPublica);
  // Emitir estado personalizado a cada jugador
  if (sala.estado) {
    sala.jugadores.forEach(j => {
      const vista = vistaEstadoParaJugador(sala, j.id);
      io.to(j.id).emit('estado-actualizado', vista);
    });
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
      mazoDisponibleCount: sala.estado.mazoDisponible.length,
    });
  }
};

io.on('connection', (socket) => {
  console.log(`🔌 Conectado: ${socket.id}`);

  // Unirse como pantalla de tablero (TV)
  socket.on('unirse-tablero', ({ codigo }) => {
    const sala = obtenerSala(codigo?.toUpperCase());
    if (!sala) return socket.emit(EVENTOS.ERROR, { mensaje: 'Sala no encontrada' });
    socket.join(`tablero-${sala.codigo}`);
    socket.emit('tablero-conectado', { sala: vistaSalaParaCliente(sala) });
  });

  socket.on(EVENTOS.CREAR_SALA, ({ nombre }) => {
    try {
      const sala = crearSala(socket.id, nombre || 'Host');
      socketSala.set(socket.id, sala.codigo);
      socket.join(sala.codigo);
      socket.emit('sala-creada', { sala: vistaSalaParaCliente(sala) });
      console.log(`🏠 Sala creada: ${sala.codigo} por ${nombre}`);
    } catch (e) {
      socket.emit(EVENTOS.ERROR, { mensaje: e.message });
    }
  });

  socket.on(EVENTOS.UNIRSE_SALA, ({ codigo, nombre }) => {
    try {
      const sala = unirseASala(codigo?.toUpperCase(), socket.id, nombre || 'Jugador');
      socketSala.set(socket.id, sala.codigo);
      socket.join(sala.codigo);
      emitirSalaActualizada(sala);
      console.log(`👤 ${nombre} se unió a sala ${sala.codigo}`);
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
  ];

  accionesJuego.forEach(accion => {
    socket.on(accion, (datos) => {
      const codigo = socketSala.get(socket.id);
      if (!codigo) return;
      try {
        const sala = procesarAccion(codigo, socket.id, accion, datos || {});
        emitirSalaActualizada(sala);
        if (sala.estado?.victoria) {
          io.to(sala.codigo).emit(EVENTOS.VICTORIA_DECLARADA, { ganador: sala.estado.victoria });
        }
      } catch (e) {
        socket.emit(EVENTOS.ERROR, { mensaje: e.message });
      }
    });
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
