import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAudio } from '../contextos/AudioContexto';
import CartaFeedTheKraken from './CartaFeedTheKraken';
import CartaCatan from './CartaCatan';

/* ─── Luces sala arcana ─────────────────────────────────────── */
const VELAS = [
  { x:49, y:33, sz:220, dur:2.1, del:0.0, anim:'vela-parpadeo-1' },
  { x:52, y:31, sz:170, dur:1.7, del:0.4, anim:'vela-parpadeo-2' },
  { x:55, y:34, sz:160, dur:2.5, del:0.9, anim:'vela-parpadeo-1' },
  { x:46, y:35, sz:130, dur:1.9, del:1.2, anim:'vela-parpadeo-2' },
  { x:76, y:38, sz:140, dur:2.3, del:0.6, anim:'vela-parpadeo-1' },
  { x:18, y:42, sz:120, dur:2.0, del:1.5, anim:'vela-parpadeo-2' },
];
const FOCOS_AMBAR = [
  { x:50, y:38, sz:500, dur:3.2, del:0.0 },
  { x:22, y:48, sz:300, dur:4.1, del:1.0 },
  { x:78, y:45, sz:280, dur:3.8, del:0.7 },
];
const POCIONES = [
  { x:50, y:26, sz:70, col:'rgba(30,140,255,0.55)', dur:3.2, del:0.0 },
  { x:53, y:25, sz:55, col:'rgba(50,220,90,0.50)',  dur:4.5, del:1.2 },
  { x:61, y:28, sz:60, col:'rgba(230,155,20,0.48)', dur:3.9, del:0.5 },
  { x:57, y:40, sz:65, col:'rgba(160,80,240,0.42)', dur:5.2, del:2.0 },
];
const DESTELLOS = [
  { x:50, y:26, dur:3.2, del:0.0, col:'rgba(140,200,255,0.9)'  },
  { x:53, y:25, dur:4.5, del:1.5, col:'rgba(120,255,130,0.9)'  },
  { x:57, y:40, dur:5.2, del:2.5, col:'rgba(200,140,255,0.85)' },
];

/* ─── Luces escena FTK (barco + kraken + tormenta) ─────────── */
// Posiciones aproximadas sobre fondo-menu-feed-the-kraken.png
// Nota: luna-pulsar (0.06-0.12) y bio-kraken (0.07-0.20) aplican su propio opacity
// al elemento, multiplicando el alpha del color → resultado invisible.
// Usamos las animaciones dedicadas: foco-tormenta, shimmer-mar, bio-fx (rangos útiles).
const LUCES_FTK = [
  // Luna difusa — usa foco-tormenta para que sea visible
  { x:52, y:18, sz:700, col:'rgba(110,130,220,0.28)',  dur:7,   del:0,   anim:'foco-tormenta'  },
  // Reflejo de luna en el agua
  { x:55, y:68, sz:420, col:'rgba(80,105,195,0.22)',   dur:9,   del:2.5, anim:'foco-tormenta'  },
  // Linterna izquierda del barco — cabina
  { x:33, y:47, sz:220, col:'rgba(255,160,50,0.28)',   dur:1.8, del:0.2, anim:'vela-parpadeo-1' },
  { x:36, y:45, sz:130, col:'rgba(255,130,20,0.20)',   dur:2.2, del:0.7, anim:'vela-parpadeo-2' },
  // Segunda linterna — popa del barco
  { x:43, y:52, sz:120, col:'rgba(255,145,40,0.18)',   dur:2.0, del:1.1, anim:'vela-parpadeo-1' },
  // Bioluminiscencia tentáculo izquierdo — usa bio-fx para opacidad real
  { x:10, y:38, sz:320, col:'rgba(70,45,210,0.32)',    dur:4.5, del:0.8, anim:'bio-fx'          },
  { x:14, y:52, sz:230, col:'rgba(90,55,225,0.26)',    dur:5.8, del:2.0, anim:'bio-fx'          },
  { x:5,  y:60, sz:180, col:'rgba(55,35,180,0.20)',    dur:6.5, del:1.5, anim:'bio-fx'          },
  // Bioluminiscencia tentáculo derecho
  { x:87, y:35, sz:300, col:'rgba(70,45,210,0.30)',    dur:5.2, del:1.2, anim:'bio-fx'          },
  { x:83, y:50, sz:210, col:'rgba(90,55,225,0.24)',    dur:4.8, del:0.3, anim:'bio-fx'          },
  { x:92, y:57, sz:160, col:'rgba(55,35,180,0.18)',    dur:6.8, del:3.0, anim:'bio-fx'          },
  // Espray del oleaje en la proa
  { x:27, y:60, sz:150, col:'rgba(120,195,235,0.22)',  dur:3.5, del:1.8, anim:'foco-tormenta'   },
];
// Focos de tormenta — nubes iluminadas desde dentro (usa foco-tormenta: 0.38-0.78)
const FOCOS_TORMENTA = [
  { x:50, y:22, sz:950, col:'rgba(65,85,195,0.26)', dur:6.5, del:0.0 },
  { x:28, y:17, sz:600, col:'rgba(55,75,180,0.22)', dur:8.2, del:1.8 },
  { x:74, y:19, sz:540, col:'rgba(60,80,190,0.20)', dur:7.0, del:3.5 },
  { x:50, y:36, sz:720, col:'rgba(50,70,175,0.18)', dur:9.0, del:0.8 },
];
// Reflejos del mar — superficie del agua (usa shimmer-mar: 0.24-0.60)
const REFLEJOS_MAR = [
  { x:50, y:80, sz:1200, col:'rgba(8,65,140,0.32)',  dur:5.5, del:0.0 },
  { x:22, y:86, sz: 720, col:'rgba(6,55,125,0.28)',  dur:7.0, del:2.2 },
  { x:80, y:83, sz: 660, col:'rgba(7,60,135,0.26)',  dur:6.2, del:1.0 },
];
// Pociones azules en la mesa del primer plano
const POCIONES_FTK = [
  { x:34, y:73, sz:90,  col:'rgba(40,90,255,0.55)',  dur:3.2, del:0.0 },
  { x:37, y:72, sz:70,  col:'rgba(60,110,255,0.48)', dur:4.0, del:1.2 },
];
const DESTELLOS_FTK = [
  { x:34, y:73, dur:3.2, del:0.5, col:'rgba(100,150,255,0.95)' },
  { x:37, y:72, dur:4.0, del:1.9, col:'rgba(120,170,255,0.90)' },
];
// Burbujas oceánicas
const BURBUJAS = Array.from({length:16}, (_,i) => ({
  x:   (i*73+13) % 100,
  sz:  3 + (i*4) % 13,
  dur: 3 + (i*1.8) % 6,
  del: (i*0.9) % 8,
}));

/* ─── Datos juegos ──────────────────────────────────────────── */
const JUEGOS = [
  {
    id: 'feed-the-kraken',
    nombre: 'Feed The Kraken',
    desc: 'Deducción social en alta mar. Piratas, Marineros y el misterioso Cultista compiten por el control del barco.',
    jugadores: '5–11', duracion: '45–90 min',
    disponible: true, ico: '🐙',
  },
  {
    id: 'catan',
    nombre: 'Catán',
    desc: 'Construye asentamientos, comercia recursos y domina la isla. Próximamente disponible.',
    jugadores: '3–4', duracion: '60–120 min',
    disponible: false, ico: '🏝️',
  },
  {
    id: 'proximo',
    nombre: 'Próximamente',
    desc: 'Nuevos mundos y aventuras en camino...',
    jugadores: '—', duracion: '—',
    disponible: false, ico: '🔮',
  },
];

/* ════════════════════════════════════════════════════════════ */
export default function MenuPrincipal() {
  const navigate = useNavigate();
  const { emitir, escuchar, conectado } = useSocket();
  const [hover,   setHover]   = useState(null);
  const [visible, setVisible] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error,   setError]   = useState('');

  const esMar = hover === 'feed-the-kraken';

  const { playMusica, stopMusica, playAmbiente, stopAmbiente, playSFX, stopSFX } = useAudio();

  // ── Refs para la gestión local de timers de audio ─────────
  const timersAudio  = useRef([]);
  const maderaIdx    = useRef(0);
  const audioStarted = useRef(false);
  const [audioListo, setAudioListo] = useState(false);

  const pararTimers = useCallback(() => {
    timersAudio.current.forEach(clearTimeout);
    timersAudio.current = [];
  }, []);

  // Programa un sfx que se auto-reprograma con delay aleatorio
  const programar = useCallback((fn, minMs, maxMs) => {
    const delay = minMs + Math.random() * (maxMs - minMs);
    const t = setTimeout(() => { fn(); programar(fn, minMs, maxMs); }, delay);
    timersAudio.current.push(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Música: arranca al montar; usa Web Audio API (html5:false) para que
  //    Howler gestione el autoUnlock automáticamente sin necesitar gesto previo.
  useEffect(() => {
    playMusica('musica-menu', '/sonidos/menu.mp3', { vol: 0.30, fadeIn: 3000 });
    return () => {
      pararTimers();
      stopMusica('musica-menu', 1200);
      stopMusica('musica-ftk',  1200);
      stopAmbiente('amb-fogata');
      stopAmbiente('amb-olas');
      stopAmbiente('amb-barco');
      stopAmbiente('amb-lluvia');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ambientes (HTML5 Audio): necesitan un gesto real del usuario.
  //    pointerdown/keydown/touchstart son "user activations" reconocidas por el navegador.
  useEffect(() => {
    const iniciarAmbiente = () => {
      if (audioStarted.current) return;
      audioStarted.current = true;
      setAudioListo(true);
    };
    document.addEventListener('pointerdown', iniciarAmbiente, { once: true });
    document.addEventListener('keydown',     iniciarAmbiente, { once: true });
    document.addEventListener('touchstart',  iniciarAmbiente, { once: true });
    return () => {
      document.removeEventListener('pointerdown', iniciarAmbiente);
      document.removeEventListener('keydown',     iniciarAmbiente);
      document.removeEventListener('touchstart',  iniciarAmbiente);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Transición entre escena menú ↔ escena FTK ───────────────
  useEffect(() => {
    if (!audioListo) return;

    if (esMar) {
      /* ── ENTRAR en hover FTK ── */
      pararTimers();

      // Apagar menú: ambiente rápido, música con fade-out largo
      stopAmbiente('amb-fogata', 350);
      stopMusica('musica-menu', 1600);

      // Música FTK: una sola reproducción con fade-in al inicio y fade-out al final
      playMusica('musica-ftk', '/sonidos/ftk-musica.mp3', { vol: 0.45, fadeIn: 2200, loop: true, fadeOut: 2200 });

      // Ambientes continuos (loops) con fade-in escalonado
      const tOlas   = setTimeout(() => playAmbiente('amb-olas',   '/sonidos/amb-olas.mp3',   0.40), 200);
      const tBarco  = setTimeout(() => playAmbiente('amb-barco',  '/sonidos/amb-barco.mp3',  0.30), 400);
      const tLluvia = setTimeout(() => playAmbiente('amb-lluvia', '/sonidos/amb-lluvia.mp3', 0.16), 600);
      timersAudio.current.push(tOlas, tBarco, tLluvia);

      // ── Truenos sincronizados con rayo-tormenta ──────────────
      // CSS: flash al 79% del ciclo (opacity 0.18 en ese frame).
      // Trueno 350 ms después del flash (tormenta cerca, sonido casi inmediato).
      // Rayo 1: ciclo 11 s, delay 1.5 s  → flash ≈ 10 190 ms → trueno ≈ 10 540 ms
      // Rayo 2: ciclo 14 s, delay 6.3 s  → flash ≈ 17 360 ms → trueno ≈ 17 710 ms
      const RETARDO = 350;
      const tTrueno1 = setTimeout(() => {
        playSFX('sfx-trueno', '/sonidos/sfx-trueno.mp3', 0.58);
        const iv1 = setInterval(
          () => playSFX('sfx-trueno', '/sonidos/sfx-trueno.mp3', 0.58), 11000
        );
        timersAudio.current.push(iv1);
      }, Math.round(1500 + 11000 * 0.79 + RETARDO));
      timersAudio.current.push(tTrueno1);

      const tTrueno2 = setTimeout(() => {
        playSFX('sfx-trueno', '/sonidos/sfx-trueno.mp3', 0.44);
        const iv2 = setInterval(
          () => playSFX('sfx-trueno', '/sonidos/sfx-trueno.mp3', 0.44), 14000
        );
        timersAudio.current.push(iv2);
      }, Math.round(6300 + 14000 * 0.79 + RETARDO));
      timersAudio.current.push(tTrueno2);

      // Gaviotas: primera vez 1.5–3.5 s, luego cada 10–28 s
      const tGaviotas = setTimeout(() => {
        programar(() => playSFX('sfx-gaviotas', '/sonidos/sfx-gaviotas.mp3', 0.38), 10000, 28000);
      }, 1500 + Math.random() * 2000);
      timersAudio.current.push(tGaviotas);

      // Madera de barco: primera vez 3–7 s, luego cada 10–28 s
      const tMaderaBarco = setTimeout(() => {
        programar(() => playSFX('sfx-madera-barco', '/sonidos/sfx-madera-barco.mp3', 0.22), 10000, 28000);
      }, 3000 + Math.random() * 4000);
      timersAudio.current.push(tMaderaBarco);

      // Velas: primera vez 6–14 s, luego cada 18–45 s
      const tVelas = setTimeout(() => {
        programar(() => playSFX('sfx-velas', '/sonidos/sfx-velas.mp3', 0.20), 18000, 45000);
      }, 6000 + Math.random() * 8000);
      timersAudio.current.push(tVelas);

      // Cadenas: primera vez 8–18 s, luego cada 22–55 s
      const tCadenas = setTimeout(() => {
        programar(() => playSFX('sfx-cadenas', '/sonidos/sfx-cadenas.mp3', 0.24), 22000, 55000);
      }, 8000 + Math.random() * 10000);
      timersAudio.current.push(tCadenas);

    } else {
      /* ── SALIR de hover FTK / estado inicial de menú ── */
      pararTimers();

      // Cortar SFX largos con fade-out antes de que el silencio sea brusco
      stopSFX('sfx-gaviotas', 400);
      stopSFX('sfx-trueno',   300);

      // Apagar ambientes FTK con fade-out suave
      stopAmbiente('amb-olas',   1800);
      stopAmbiente('amb-barco',  1800);
      stopAmbiente('amb-lluvia', 1800);

      // Música FTK: fade-out largo para que no acabe repentinamente
      stopMusica('musica-ftk', 3000);

      // Reiniciar música menú (fade-in moderado)
      playMusica('musica-menu', '/sonidos/menu.mp3', { vol: 0.30, fadeIn: 1800 });

      // Fogata
      const tFogata = setTimeout(() => {
        playAmbiente('amb-fogata', '/sonidos/ambiente-fogata.mp3', 0.22);
      }, 300);
      timersAudio.current.push(tFogata);

      // Búho: primera vez 4–9 s, luego cada 15–50 s
      const tBuho = setTimeout(() => {
        programar(() => playSFX('sfx-buho', '/sonidos/sfx-buho.mp3', 0.30), 15000, 50000);
      }, 4000 + Math.random() * 5000);
      timersAudio.current.push(tBuho);

      // Crujidos madera1/madera2 alternados: primera vez 6–12 s, luego cada 15–50 s
      const MADERAS = [
        { key: 'sfx-madera1', src: '/sonidos/sfx-madera1.mp3' },
        { key: 'sfx-madera2', src: '/sonidos/sfx-madera2.mp3' },
      ];
      const tMadera = setTimeout(() => {
        programar(() => {
          const m = MADERAS[maderaIdx.current % 2];
          maderaIdx.current += 1;
          playSFX(m.key, m.src, 0.14);
        }, 15000, 50000);
      }, 6000 + Math.random() * 6000);
      timersAudio.current.push(tMadera);
    }
  }, [esMar, audioListo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Precarga ambas imágenes de fondo para que estén en caché antes del hover
  useEffect(() => {
    ['fondo-menu.png', 'fondo-menu-feed-the-kraken.png'].forEach(src => {
      const img = new Image();
      img.src = `/${src}`;
    });
    setTimeout(() => setVisible(true), 80);
  }, []);

  useEffect(() => {
    const c1 = escuchar('sala-creada',       ({ sala }) => navigate(`/tablero/${sala.codigo}`));
    const c2 = escuchar('tablero-conectado', ({ sala }) => navigate(`/tablero/${sala.codigo}`));
    const c3 = escuchar('error',             ({ mensaje }) => { setError(mensaje); setCreando(false); });
    return () => { c1(); c2(); c3(); };
  }, [escuchar, navigate]);

  const crearSala = () => {
    playSFX('sfx-click', '/sonidos/sfx-click.mp3', 0.55);
    if (!conectado) return setError('Conectando al servidor...');
    setError(''); setCreando(true);
    emitir('crear-sala', { nombre: 'Tablero', esSoloTablero: true });
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: '#080610',
    }}>

      {/* ══ FONDO: SALA ARCANA ════════════════════════════════ */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden',
        opacity: esMar ? 0 : 1,
        transition: 'opacity 1.4s ease',
        pointerEvents: 'none',
      }}>
        {/* Imagen desenfocada y oscurecida */}
        <div style={{
          position: 'absolute', inset: '-12px',
          backgroundImage: "url('/fondo-menu.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'blur(1px) brightness(0.28) saturate(1.3)',
          transform: 'scale(1.03)',
        }}/>
        {/* Overlay cálido */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% 38%, rgba(120,60,5,0.18) 0%, transparent 70%),
            linear-gradient(180deg, rgba(5,3,8,0.35) 0%, rgba(8,5,15,0.2) 45%, rgba(5,3,10,0.55) 100%)
          `,
        }}/>
        {/* Focos de luz ámbar */}
        {FOCOS_AMBAR.map((f,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${f.x}%`, top: `${f.y}%`,
            width: `${f.sz}px`, height: `${f.sz}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,140,20,0.14) 0%, rgba(200,80,5,0.06) 40%, transparent 70%)',
            transform: 'translate(-50%,-50%)',
            animation: `luz-ambar ${f.dur}s ease-in-out ${f.del}s infinite`,
          }}/>
        ))}
        {/* Velas individuales */}
        {VELAS.map((v,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${v.x}%`, top: `${v.y}%`,
            width: `${v.sz}px`, height: `${v.sz}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,175,50,0.22) 0%, rgba(255,100,10,0.08) 45%, transparent 70%)',
            transform: 'translate(-50%,-50%)',
            animation: `${v.anim} ${v.dur}s ease-in-out ${v.del}s infinite`,
          }}/>
        ))}
        {/* Pociones */}
        {POCIONES.map((p,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.sz}px`, height: `${p.sz}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${p.col} 0%, transparent 70%)`,
            transform: 'translate(-50%,-50%)',
            animation: `pocion-brillar ${p.dur}s ease-in-out ${p.del}s infinite`,
          }}/>
        ))}
        {/* Destellos puntuales */}
        {DESTELLOS.map((d,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${d.x}%`, top: `${d.y}%`,
            width: '3px', height: '3px', borderRadius: '50%',
            background: d.col, boxShadow: `0 0 6px 3px ${d.col}`,
            transform: 'translate(-50%,-50%)',
            animation: `centelleo-luz ${d.dur}s ease-in-out ${d.del}s infinite`,
          }}/>
        ))}
        {/* Viñeta */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 48%, transparent 45%, rgba(4,2,10,0.75) 100%)',
        }}/>
      </div>

      {/* ══ FONDO: FEED THE KRAKEN ════════════════════════════ */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden',
        opacity: esMar ? 1 : 0,
        transition: 'opacity 1.4s ease',
        pointerEvents: 'none',
      }}>
        {/* Imagen desenfocada y oscurecida */}
        <div style={{
          position: 'absolute', inset: '-12px',
          backgroundImage: "url('/fondo-menu-feed-the-kraken.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          filter: 'blur(1px) brightness(0.30) saturate(1.2)',
          transform: 'scale(1.03)',
        }}/>
        {/* Overlay frío marino */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 90% 50% at 52% 20%, rgba(20,30,80,0.20) 0%, transparent 65%),
            linear-gradient(180deg, rgba(4,8,20,0.40) 0%, rgba(6,10,25,0.15) 40%, rgba(4,8,18,0.55) 100%)
          `,
        }}/>
        {/* Focos de tormenta — nubes iluminadas desde dentro */}
        {FOCOS_TORMENTA.map((f,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${f.x}%`, top: `${f.y}%`,
            width: `${f.sz}px`, height: `${f.sz}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${f.col} 0%, transparent 70%)`,
            transform: 'translate(-50%,-50%)',
            animation: `foco-tormenta ${f.dur}s ease-in-out ${f.del}s infinite`,
          }}/>
        ))}
        {/* Reflejos del mar — superficie del agua */}
        {REFLEJOS_MAR.map((r,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${r.x}%`, top: `${r.y}%`,
            width: `${r.sz}px`, height: `${Math.round(r.sz * 0.35)}px`,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${r.col} 0%, transparent 70%)`,
            transform: 'translate(-50%,-50%)',
            animation: `shimmer-mar ${r.dur}s ease-in-out ${r.del}s infinite`,
          }}/>
        ))}
        {/* Luna y luces de escena */}
        {LUCES_FTK.map((l,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${l.x}%`, top: `${l.y}%`,
            width: `${l.sz}px`, height: `${l.sz}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${l.col} 0%, transparent 70%)`,
            transform: 'translate(-50%,-50%)',
            animation: `${l.anim} ${l.dur}s ease-in-out ${l.del}s infinite`,
          }}/>
        ))}
        {/* Pociones azules del primer plano */}
        {POCIONES_FTK.map((p,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.sz}px`, height: `${p.sz}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${p.col} 0%, transparent 70%)`,
            transform: 'translate(-50%,-50%)',
            animation: `pocion-brillar ${p.dur}s ease-in-out ${p.del}s infinite`,
          }}/>
        ))}
        {/* Destellos pociones */}
        {DESTELLOS_FTK.map((d,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${d.x}%`, top: `${d.y}%`,
            width: '3px', height: '3px', borderRadius: '50%',
            background: d.col, boxShadow: `0 0 8px 4px ${d.col}`,
            transform: 'translate(-50%,-50%)',
            animation: `centelleo-luz ${d.dur}s ease-in-out ${d.del}s infinite`,
          }}/>
        ))}
        {/* Relámpago de tormenta (flash pantalla completa) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(180,200,255,1)',
          animation: 'rayo-tormenta 11s ease-in-out 1.5s infinite',
        }}/>
        {/* Segundo relámpago desfasado (tormenta más viva) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(200,215,255,1)',
          animation: 'rayo-tormenta 14s ease-in-out 6.3s infinite',
        }}/>
        {/* Burbujas oceánicas */}
        {BURBUJAS.map((b,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${b.x}%`, bottom: '-8%',
            width: `${b.sz}px`, height: `${b.sz}px`,
            borderRadius: '50%',
            border: '1px solid rgba(10,147,150,0.3)',
            background: 'rgba(10,147,150,0.04)',
            animation: `burbuja-subir ${b.dur}s ease-in ${b.del}s infinite`,
          }}/>
        ))}
        {/* Viñeta marina */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(2,4,14,0.72) 100%)',
        }}/>
      </div>

      {/* ══ CONTENIDO ══════════════════════════════════════════ */}
      <div style={{
        position: 'relative', zIndex: 10,
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(14px,2.5vh,36px) clamp(16px,3vw,48px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(24px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
      }}>

        {/* ── CABECERA ── */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            fontSize: 'clamp(34px,5.5vw,58px)',
            marginBottom: '6px',
            animation: 'flotar 5s ease-in-out infinite',
            filter: esMar
              ? 'drop-shadow(0 0 18px rgba(10,147,150,0.6))'
              : 'drop-shadow(0 0 16px rgba(255,140,30,0.5))',
            transition: 'filter 1.4s ease',
          }}>
            {esMar ? '🐙' : '🎴'}
          </div>
          <h1 style={{
            fontFamily: 'var(--fuente-titulo)',
            fontSize: 'clamp(18px,3.5vw,40px)',
            color: esMar ? 'var(--turquesa-kraken)' : 'var(--oro-dorado)',
            textShadow: esMar
              ? '0 0 40px rgba(10,147,150,0.65), 0 2px 8px rgba(0,0,0,0.8)'
              : '0 0 40px rgba(201,168,76,0.5),  0 2px 8px rgba(0,0,0,0.8)',
            letterSpacing: 'clamp(2px,0.5vw,6px)',
            marginBottom: '4px',
            transition: 'color 1.4s ease, text-shadow 1.4s ease',
          }}>
            {esMar ? 'ALTA MAR' : 'MESA DIGITAL'}
          </h1>
          <p style={{
            fontFamily: 'var(--fuente-subtitulo)',
            color: esMar ? 'rgba(10,180,190,0.65)' : 'rgba(245,230,200,0.45)',
            letterSpacing: 'clamp(2px,0.4vw,5px)',
            fontSize: 'clamp(8px,1.1vw,11px)',
            textTransform: 'uppercase',
            transition: 'color 1.4s ease',
          }}>
            {esMar ? 'Las profundidades te aguardan' : 'Juegos de mesa · En la palma de tu mano'}
          </p>
          <div className="divisor-oro" style={{
            marginTop: 'clamp(8px,1.5vh,18px)',
            opacity: esMar ? 0.45 : 0.7,
            transition: 'opacity 1.4s ease',
          }}>
            <span>{esMar ? '⚓' : '✦'}</span>
          </div>
        </div>

        {/* ── TARJETAS ── */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          width: '100%', maxWidth: '960px',
          padding: 'clamp(6px,1.2vh,14px) 0',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(10px,1.8vw,24px)',
            width: '100%',
          }}>
            {JUEGOS.map((j, idx) => {
              const esEste = hover === j.id;

              /* ── Carta Feed The Kraken ── */
              if (j.id === 'feed-the-kraken') {
                return (
                  <div key={j.id} style={{ animation: `aparecer 0.6s ease 0s both` }}>
                    <CartaFeedTheKraken
                      onCrear={crearSala}
                      creando={creando}
                      conectado={conectado}
                      esHover={esEste}
                      onHover={() => { setHover('feed-the-kraken'); playSFX('sfx-hover', '/sonidos/sfx-hover.mp3', 0.30); }}
                      onLeave={() => setHover(null)}
                    />
                  </div>
                );
              }

              /* ── Carta Catán ── */
              if (j.id === 'catan') {
                return (
                  <div key={j.id} style={{ animation: `aparecer 0.6s ease ${idx * 0.14}s both` }}>
                    <CartaCatan />
                  </div>
                );
              }

              /* ── Carta Próximamente ── */
              return (
                <div key={j.id} style={{ animation: `aparecer 0.6s ease ${idx * 0.14}s both` }}>
                  <img
                    src="/cartas/prox/carta-prox.png"
                    alt="Próximamente"
                    draggable={false}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      userSelect: 'none',
                      cursor: 'not-allowed',
                      opacity: 0.45,
                      filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.55)) grayscale(0.25)',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PIE ── */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div className="divisor-oro" style={{ marginBottom: 'clamp(6px,1vh,12px)', opacity: 0.38 }}>
            <span style={{ color: 'rgba(245,230,200,0.25)' }}>~</span>
          </div>
          <p style={{
            fontFamily: 'var(--fuente-subtitulo)',
            color: 'rgba(245,230,200,0.35)',
            fontSize: 'clamp(8px,0.9vw,11px)',
            letterSpacing: '2px', textTransform: 'uppercase',
            marginBottom: 'clamp(8px,1vh,12px)',
          }}>¿Te han invitado a una partida?</p>
          {error && <p style={{ color: '#ff8a8a', fontSize: '12px', marginBottom: '8px' }}>{error}</p>}
          <button
            className="btn-secundario"
            onClick={() => { playSFX('sfx-click', '/sonidos/sfx-click.mp3', 0.45); navigate('/unirse'); }}
            style={{
              fontSize: 'clamp(9px,1vw,12px)',
              padding: 'clamp(8px,0.9vh,11px) clamp(16px,1.8vw,26px)',
            }}>
            🚪 Unirme a una sala
          </button>
          <p style={{
            fontFamily:    'var(--fuente-subtitulo)',
            fontSize:      'clamp(7px,0.65vw,9px)',
            letterSpacing: '1.5px',
            marginTop:     'clamp(10px,1.4vh,18px)',
            fontStyle:     'italic',
            color: esMar ? 'rgba(10,147,150,0.50)' : 'rgba(245,230,200,0.38)',
            transition:    'color 1.4s ease',
          }}>by Mati y Ema</p>
        </div>

      </div>
    </div>
  );
}
