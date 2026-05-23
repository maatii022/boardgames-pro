import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

let socketInstance = null;

export const useSocket = () => {
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    }
    socketRef.current = socketInstance;

    const onConnect = () => setConectado(true);
    const onDisconnect = () => setConectado(false);

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    if (socketInstance.connected) setConectado(true);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
    };
  }, []);

  const emitir = useCallback((evento, datos) => {
    if (socketRef.current) socketRef.current.emit(evento, datos);
  }, []);

  const escuchar = useCallback((evento, handler) => {
    if (socketRef.current) socketRef.current.on(evento, handler);
    return () => { if (socketRef.current) socketRef.current.off(evento, handler); };
  }, []);

  return { socket: socketRef.current, socketId: socketInstance?.id, conectado, emitir, escuchar };
};
