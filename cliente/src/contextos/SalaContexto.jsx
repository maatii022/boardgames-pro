import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

const SalaCtx = createContext(null);
export const useSala = () => useContext(SalaCtx);

export function SalaProvider({ children }) {
  const { emitir, escuchar, socketId, conectado, jugadorId } = useSocket();
  const [sala,   setSala]   = useState(null);
  const [estado, setEstado] = useState(null);
  const [fase,   setFase]   = useState('lobby');

  // Reconexión automática — pasa jugadorId para que el servidor
  // identifique al jugador existente en lugar de crear un duplicado
  useEffect(() => {
    if (!conectado) return;
    const codigo = sessionStorage.getItem('sala_codigo');
    const nombre = sessionStorage.getItem('sala_nombre');
    if (codigo && !sala) {
      // Reconectar: el servidor buscará por jugadorId y actualizará el socketId
      emitir('unirse-sala', { codigo, nombre: nombre || '', jugadorId });
    } else if (sala) {
      emitir('pedir-estado');
    }
  }, [conectado]);

  useEffect(() => {
    const c1 = escuchar('sala-actualizada',  (s) => { setSala(s); setFase(s.fase); });
    const c2 = escuchar('estado-actualizado',(e) => { setEstado(e); if (e?.fase) setFase(e.fase); });
    const c3 = escuchar('fase-cambiada',     ({ fase: f }) => setFase(f));
    const c4 = escuchar('unido-a-sala',      ({ sala: s }) => {
      setSala(s); setFase(s.fase);
      sessionStorage.setItem('sala_codigo', s.codigo);
    });
    const c5 = escuchar('sala-creada', ({ sala: s }) => { setSala(s); setFase(s.fase); });
    const c6 = escuchar('expulsado', () => {
      setSala(null); setEstado(null); setFase('lobby');
      sessionStorage.removeItem('sala_codigo');
      sessionStorage.removeItem('sala_nombre');
    });
    return () => { c1(); c2(); c3(); c4(); c5(); c6(); };
  }, [escuchar]);

  const entrarEnSala = useCallback((s, nombre) => {
    setSala(s); setFase(s.fase);
    if (nombre) sessionStorage.setItem('sala_nombre', nombre);
    if (s?.codigo) sessionStorage.setItem('sala_codigo', s.codigo);
  }, []);

  const salirDeSala = useCallback(() => {
    setSala(null); setEstado(null); setFase('lobby');
    sessionStorage.removeItem('sala_codigo');
    sessionStorage.removeItem('sala_nombre');
  }, []);

  return (
    <SalaCtx.Provider value={{ sala, estado, fase, socketId, conectado, emitir, escuchar, entrarEnSala, salirDeSala, jugadorId }}>
      {children}
    </SalaCtx.Provider>
  );
}
