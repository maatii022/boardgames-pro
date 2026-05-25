// ════════════════════════════════════════════════════════════
// SISTEMA DE AUDIO GLOBAL — Howler.js
// ════════════════════════════════════════════════════════════
import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';

const AudioCtx = createContext(null);

// ── Singletons de módulo (persisten mientras la página esté abierta) ─
const PISTAS      = {};   // instancias Howl por key
const BASE_VOLS   = {};   // volumen base por key (antes del multiplicador)
const LOOP_FLAGS  = {};   // música: true = seguir en loop, false = parar
const STOP_TIMERS = {};   // ambientes: ID del setTimeout pendiente de stop

function getPista(key, src, opts = {}) {
  if (!PISTAS[key]) {
    PISTAS[key] = new Howl({
      src:     Array.isArray(src) ? src : [src],
      loop:    opts.loop    ?? false,
      volume:  opts.volume  ?? 0.5,
      html5:   opts.html5   ?? true,
      preload: true,
      onloaderror: () => console.warn(`[Audio] Archivo no encontrado: ${src}`),
    });
  }
  return PISTAS[key];
}

// ════════════════════════════════════════════════════════════
export function AudioProvider({ children }) {
  const [silenciado,     setSilenciado]     = useState(false);
  const [volMusica,      setVolMusica]      = useState(1.0);
  const [volAmbSFX,      setVolAmbSFX]      = useState(1.0);
  const [mostrarControl, setMostrarControl] = useState(false);
  const timersRandom = useRef([]);

  // Refs para leer el valor actual dentro de callbacks sin dependencias
  const volMusicaRef = useRef(1.0);
  const volAmbSFXRef = useRef(1.0);

  // ── Música ─────────────────────────────────────────────────
  // Loop manual (loop:false) para poder hacer fade-in en cada ciclo.
  const playMusica = useCallback((key, src, { vol = 0.55, fadeIn = 3000 } = {}) => {
    BASE_VOLS[key]  = vol;
    LOOP_FLAGS[key] = true;
    const target = vol * volMusicaRef.current;
    const h = getPista(key, src, { loop: false, volume: 0, html5: false });

    // Re-registrar el handler de fin para que cada ciclo haga fade-in
    h.off('end');
    h.on('end', () => {
      if (!LOOP_FLAGS[key]) return;          // fue parado intencionalmente
      const id = h.play();
      h.fade(0, vol * volMusicaRef.current, fadeIn, id);
    });

    if (!h.playing()) {
      const id = h.play();
      h.fade(0, target, fadeIn, id);
    }
  }, []);

  const stopMusica = useCallback((key, fadeOut = 2500) => {
    LOOP_FLAGS[key] = false;                 // desactivar loop manual
    const h = PISTAS[key];
    if (!h || !h.playing()) return;
    h.fade(h.volume(), 0, fadeOut);
    setTimeout(() => h.stop(), fadeOut + 100);
  }, []);

  // ── Ambientes ──────────────────────────────────────────────
  // Cancela cualquier stop pendiente y siempre reinicia limpio,
  // evitando la carrera: "fade-out en curso → playAmbiente llega antes del stop()".
  const playAmbiente = useCallback((key, src, vol = 0.18) => {
    BASE_VOLS[key] = vol;
    const target = vol * volAmbSFXRef.current;

    // Cancelar stop pendiente si lo hubiera
    if (STOP_TIMERS[key]) {
      clearTimeout(STOP_TIMERS[key]);
      delete STOP_TIMERS[key];
    }

    const h = getPista(key, src, { loop: true, volume: 0, html5: true });
    if (h.playing()) h.stop();       // cortar cualquier fade-out en curso
    h.volume(0);
    h.play();
    h.fade(0, target, 2200);
  }, []);

  const stopAmbiente = useCallback((key, fadeOut = 1500) => {
    const h = PISTAS[key];
    if (!h?.playing()) return;

    // Cancelar stop anterior si ya había uno programado
    if (STOP_TIMERS[key]) {
      clearTimeout(STOP_TIMERS[key]);
      delete STOP_TIMERS[key];
    }

    h.fade(h.volume(), 0, fadeOut);
    STOP_TIMERS[key] = setTimeout(() => {
      h.stop();
      delete STOP_TIMERS[key];
    }, fadeOut + 100);
  }, []);

  // ── SFX puntual ────────────────────────────────────────────
  const playSFX = useCallback((key, src, vol = 0.45) => {
    BASE_VOLS[key] = vol;
    const target = vol * volAmbSFXRef.current;
    const h = getPista(key, src, { loop: false, volume: target, html5: false });
    h.volume(target);
    h.play();
  }, []);

  // ── SFX con fade-out (para sonidos largos: gaviotas, trueno…) ─
  const stopSFX = useCallback((key, fadeOut = 400) => {
    const h = PISTAS[key];
    if (!h?.playing()) return;
    h.fade(h.volume(), 0, fadeOut);
    setTimeout(() => h.stop(), fadeOut + 100);
  }, []);

  // ── SFX aleatorio recurrente ───────────────────────────────
  const startRandom = useCallback((key, src, { vol = 0.3, minMs = 20000, maxMs = 80000 } = {}) => {
    const tick = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      const t = setTimeout(() => {
        BASE_VOLS[key] = vol;
        const h = getPista(key, src, { loop: false, volume: vol * volAmbSFXRef.current, html5: false });
        h.play();
        tick();
      }, delay);
      timersRandom.current.push(t);
    };
    const t0 = setTimeout(tick, 8000 + Math.random() * 12000);
    timersRandom.current.push(t0);
  }, []);

  const stopAllRandom = useCallback(() => {
    timersRandom.current.forEach(clearTimeout);
    timersRandom.current = [];
  }, []);

  // ── Ajustar volumen por categoría ─────────────────────────
  const aplicarVolMusica = useCallback((v) => {
    volMusicaRef.current = v;
    setVolMusica(v);
    Object.keys(PISTAS)
      .filter(k => k.startsWith('musica-'))
      .forEach(k => {
        const h = PISTAS[k];
        if (h?.playing()) h.volume((BASE_VOLS[k] ?? 0.5) * v);
      });
  }, []);

  const aplicarVolAmbSFX = useCallback((v) => {
    volAmbSFXRef.current = v;
    setVolAmbSFX(v);
    Object.keys(PISTAS)
      .filter(k => !k.startsWith('musica-'))
      .forEach(k => {
        const h = PISTAS[k];
        if (h?.playing()) h.volume((BASE_VOLS[k] ?? 0.5) * v);
      });
  }, []);

  // ── Silencio global ────────────────────────────────────────
  const toggleSilencio = useCallback(() => {
    setSilenciado(prev => { Howler.mute(!prev); return !prev; });
  }, []);

  const value = {
    silenciado,
    playMusica, stopMusica,
    playAmbiente, stopAmbiente,
    playSFX, stopSFX,
    startRandom, stopAllRandom,
    toggleSilencio,
    volMusica, volAmbSFX,
    aplicarVolMusica, aplicarVolAmbSFX,
  };

  return (
    <AudioCtx.Provider value={value}>
      {children}

      {/* ── Panel de control de volumen ───────────────────────── */}
      {mostrarControl && (
        <div style={{
          position:       'fixed',
          bottom:         '68px',
          right:          '18px',
          zIndex:         9998,
          background:     'rgba(6,4,12,0.93)',
          backdropFilter: 'blur(18px)',
          border:         '1px solid rgba(201,168,76,0.28)',
          borderRadius:   '12px',
          padding:        '14px 18px 12px',
          display:        'flex',
          flexDirection:  'column',
          gap:            '12px',
          minWidth:       '200px',
          boxShadow:      '0 4px 24px rgba(0,0,0,0.6)',
        }}>

          <span style={{
            fontFamily:    'var(--fuente-subtitulo)',
            fontSize:      '9px',
            color:         'rgba(201,168,76,0.5)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textAlign:     'center',
          }}>Volumen</span>

          {[
            { label: '🎵 Música',          val: volMusica, fn: aplicarVolMusica },
            { label: '🌊 Efectos / Ambiente', val: volAmbSFX, fn: aplicarVolAmbSFX },
          ].map(({ label, val, fn }) => (
            <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{
                fontFamily:    'var(--fuente-subtitulo)',
                fontSize:      '10px',
                color:         'rgba(201,168,76,0.75)',
                letterSpacing: '1px',
                display:       'flex',
                justifyContent:'space-between',
              }}>
                <span>{label}</span>
                <span style={{ color: 'rgba(245,230,200,0.4)' }}>{Math.round(val * 100)}%</span>
              </span>
              <input
                type="range" min="0" max="1" step="0.01"
                value={val}
                onChange={e => fn(Number(e.target.value))}
                style={{ accentColor: '#c9a84c', width: '100%', cursor: 'pointer' }}
              />
            </label>
          ))}

          <button
            onClick={toggleSilencio}
            style={{
              background:    silenciado ? 'rgba(201,168,76,0.06)' : 'rgba(201,168,76,0.12)',
              border:        '1px solid rgba(201,168,76,0.22)',
              borderRadius:  '7px',
              color:         silenciado ? 'rgba(245,230,200,0.35)' : 'rgba(245,230,200,0.7)',
              fontFamily:    'var(--fuente-subtitulo)',
              fontSize:      '10px',
              letterSpacing: '1px',
              padding:       '6px 0',
              cursor:        'pointer',
            }}
          >
            {silenciado ? '🔇  Activar sonido' : '🔊  Silenciar todo'}
          </button>
        </div>
      )}

      {/* ── Botón flotante ────────────────────────────────────── */}
      <button
        onClick={() => setMostrarControl(prev => !prev)}
        title="Control de volumen"
        style={{
          position:       'fixed',
          bottom:         '18px',
          right:          '18px',
          zIndex:         9999,
          background:     'rgba(6,4,12,0.72)',
          backdropFilter: 'blur(10px)',
          border:         `1px solid ${
            mostrarControl        ? 'rgba(201,168,76,0.60)'
            : silenciado          ? 'rgba(201,168,76,0.12)'
            :                       'rgba(201,168,76,0.30)'
          }`,
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
          boxShadow:      mostrarControl
            ? '0 2px 20px rgba(201,168,76,0.40)'
            : silenciado ? 'none' : '0 2px 14px rgba(201,168,76,0.20)',
        }}
      >
        {silenciado ? '🔇' : '🔊'}
      </button>
    </AudioCtx.Provider>
  );
}

// ── Hook de consumo
export const useAudio = () => useContext(AudioCtx);
