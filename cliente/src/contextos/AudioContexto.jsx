// ════════════════════════════════════════════════════════════
// SISTEMA DE AUDIO GLOBAL — Howler.js
// ════════════════════════════════════════════════════════════
import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';

const AudioCtx = createContext(null);

// ── Singleton de instancias Howl (persisten durante toda la sesión para
//    evitar recargas innecesarias al cambiar de página)
const PISTAS = {};
function getPista(key, src, opts = {}) {
  if (!PISTAS[key]) {
    PISTAS[key] = new Howl({
      src:     Array.isArray(src) ? src : [src],
      loop:    opts.loop    ?? false,
      volume:  opts.volume  ?? 0.5,
      html5:   opts.html5   ?? true,   // html5:true → streaming (mejor para música larga)
      preload: true,
      onloaderror: () => console.warn(`[Audio] Archivo no encontrado: ${src}`),
    });
  }
  return PISTAS[key];
}

// ════════════════════════════════════════════════════════════
export function AudioProvider({ children }) {
  const [silenciado, setSilenciado] = useState(false);
  const timersRandom = useRef([]);

  // ── Música principal: play con fade in ─────────────────────
  // html5: false → Web Audio API → Howler gestiona el autoUnlock automáticamente
  const playMusica = useCallback((key, src, { vol = 0.55, fadeIn = 3000 } = {}) => {
    const h = getPista(key, src, { loop: true, volume: 0, html5: false });
    if (!h.playing()) {
      const id = h.play();
      h.fade(0, vol, fadeIn, id);
    }
  }, []);

  const stopMusica = useCallback((key, fadeOut = 2500) => {
    const h = PISTAS[key];
    if (!h || !h.playing()) return;
    const vol = h.volume();
    h.fade(vol, 0, fadeOut);
    setTimeout(() => h.stop(), fadeOut + 100);
  }, []);

  // ── Sonidos de ambiente: loops continuos a bajo volumen ────
  const playAmbiente = useCallback((key, src, vol = 0.18) => {
    const h = getPista(key, src, { loop: true, volume: 0, html5: true });
    if (!h.playing()) {
      h.play();
      h.fade(0, vol, 2200);
    }
  }, []);

  const stopAmbiente = useCallback((key, fadeOut = 1500) => {
    const h = PISTAS[key];
    if (!h?.playing()) return;
    h.fade(h.volume(), 0, fadeOut);
    setTimeout(() => h.stop(), fadeOut + 100);
  }, []);

  // ── SFX puntual (hover, click, etc.) ───────────────────────
  const playSFX = useCallback((key, src, vol = 0.45) => {
    // SFX cortos usan Web Audio (html5:false) → latencia mínima
    const h = getPista(key, src, { loop: false, volume: vol, html5: false });
    h.play();
  }, []);

  // ── SFX aleatorio recurrente (búho, madera, gotas...) ──────
  const startRandom = useCallback((key, src, { vol = 0.3, minMs = 20000, maxMs = 80000 } = {}) => {
    const tick = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      const t = setTimeout(() => {
        const h = getPista(key, src, { loop: false, volume: vol, html5: false });
        h.play();
        tick(); // reprogramar para el siguiente disparo
      }, delay);
      timersRandom.current.push(t);
    };
    // Primer disparo: entre 8 y 20 s tras activarse (no inmediato)
    const t0 = setTimeout(tick, 8000 + Math.random() * 12000);
    timersRandom.current.push(t0);
  }, []);

  const stopAllRandom = useCallback(() => {
    timersRandom.current.forEach(clearTimeout);
    timersRandom.current = [];
  }, []);

  // ── Silencio global ─────────────────────────────────────────
  const toggleSilencio = useCallback(() => {
    setSilenciado(prev => {
      Howler.mute(!prev);
      return !prev;
    });
  }, []);

  const value = {
    silenciado,
    playMusica, stopMusica,
    playAmbiente, stopAmbiente,
    playSFX,
    startRandom, stopAllRandom,
    toggleSilencio,
  };

  return (
    <AudioCtx.Provider value={value}>
      {children}

      {/* ── Botón de silencio global (visible en todas las páginas) ── */}
      <button
        onClick={toggleSilencio}
        title={silenciado ? 'Activar sonido' : 'Silenciar'}
        style={{
          position:       'fixed',
          bottom:         '18px',
          right:          '18px',
          zIndex:         9999,
          background:     'rgba(6,4,12,0.72)',
          backdropFilter: 'blur(10px)',
          border:         `1px solid ${silenciado ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.30)'}`,
          borderRadius:   '50%',
          width:          '40px',
          height:         '40px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '16px',
          cursor:         'pointer',
          color:          silenciado ? 'rgba(245,230,200,0.28)' : 'rgba(245,230,200,0.75)',
          transition:     'all 0.3s ease',
          boxShadow:      silenciado ? 'none' : '0 2px 14px rgba(201,168,76,0.20)',
        }}
      >
        {silenciado ? '🔇' : '🔊'}
      </button>
    </AudioCtx.Provider>
  );
}

// ── Hook de consumo
export const useAudio = () => useContext(AudioCtx);
