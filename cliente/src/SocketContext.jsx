// ============================================================
// CONTEXTO DE SOCKET — compartido por toda la app
// ============================================================
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    socketRef.current = io(SERVER_URL, { autoConnect: true });

    socketRef.current.on('connect', () => setConectado(true));
    socketRef.current.on('disconnect', () => setConectado(false));

    return () => socketRef.current?.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, conectado }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
