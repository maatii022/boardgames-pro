// ============================================================
// CONTEXTO DE SOCKET — compartido por toda la app
// ============================================================
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Genera un ID estable por dispositivo, persiste en localStorage
const getOrCreateJugadorId = () => {
  let id = localStorage.getItem('ftk_jugador_id');
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    localStorage.setItem('ftk_jugador_id', id);
  }
  return id;
};

// Helpers para guardar/leer/borrar la sesión activa
export const guardarSesion = (codigo, nombre) => {
  localStorage.setItem('ftk_sesion', JSON.stringify({ codigo, nombre }));
};

export const getSesionGuardada = () => {
  try { return JSON.parse(localStorage.getItem('ftk_sesion')); }
  catch { return null; }
};

export const borrarSesion = () => {
  localStorage.removeItem('ftk_sesion');
};

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [conectado, setConectado] = useState(false);
  const jugadorIdRef = useRef(getOrCreateJugadorId());

  useEffect(() => {
    socketRef.current = io(SERVER_URL, { autoConnect: true });

    socketRef.current.on('connect', () => {
      setConectado(true);
      // Intentar reconectar automáticamente si hay sesión guardada
      const sesion = getSesionGuardada();
      if (sesion?.codigo) {
        socketRef.current.emit('reconectar-sala', {
          codigo: sesion.codigo,
          jugadorId: jugadorIdRef.current,
        });
      }
    });

    socketRef.current.on('disconnect', () => setConectado(false));

    // Si la sesión expiró en el servidor (sala eliminada), limpiar
    socketRef.current.on('sesion-expirada', () => {
      borrarSesion();
    });

    return () => socketRef.current?.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      conectado,
      jugadorId: jugadorIdRef.current,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
