import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

// ID estable por dispositivo — persiste aunque cambie el socket
const getOrCreateJugadorId = () => {
  let id = localStorage.getItem('ftk_jugador_id');
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ftk_jugador_id', id);
  }
  return id;
};
export const jugadorIdEstable = getOrCreateJugadorId();

// Socket singleton global — persiste entre navegaciones
let socket = null;

const getSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return socket;
};

export const useSocket = () => {
  const [conectado, setConectado] = useState(() => getSocket().connected);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    const onConnect    = () => setConectado(true);
    const onDisconnect = () => setConectado(false);

    s.on('connect',    onConnect);
    s.on('disconnect', onDisconnect);
    setConectado(s.connected);

    return () => {
      s.off('connect',    onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  const emitir = useCallback((evento, datos) => {
    getSocket().emit(evento, datos);
  }, []);

  // Devuelve un cleanup function
  const escuchar = useCallback((evento, handler) => {
    const s = getSocket();
    s.on(evento, handler);
    return () => s.off(evento, handler);
  }, []);

  return {
    socket: socketRef.current,
    socketId: socketRef.current?.id,
    conectado,
    emitir,
    escuchar,
    jugadorId: jugadorIdEstable,
  };
};
