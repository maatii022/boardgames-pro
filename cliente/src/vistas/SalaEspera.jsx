import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/* ─── Endpoint de sala ────────────────────────────────────────────────── */
const URL_BASE = 'https://boardgames-pro.onrender.com';

/* ═══════════════════════════════════════════════════════════════════════
   🎛️  POSICIONES — ESTE ES EL ÚNICO BLOQUE QUE NECESITAS EDITAR.

   Lienzo base: 1920 × 1080 px.
   Todos los valores son píxeles dentro de ese lienzo.
   El lienzo escala completo como una imagen: si la pantalla es
   más pequeña o más grande, TODO cambia de tamaño en bloque.
   La disposición de los elementos es siempre idéntica.

   ┌────────────────────────────────────────────────────────────────┐
   │  left   →  px desde el borde izquierdo   (0 = izquierda)      │
   │  top    →  px desde el borde superior    (0 = arriba)         │
   │  bottom →  px desde el borde inferior    (solo botón)         │
   │  width  →  px de ancho del elemento                           │
   │  rotate →  grados de inclinación (− izq, + der)               │
   └────────────────────────────────────────────────────────────────┘

   Punto de anclaje de left / top:
   • pergamino → CENTRO DEL BORDE SUPERIOR  (crece hacia abajo)
   • qr        → BORDE SUPERIOR IZQUIERDO
   • boton     → CENTRO HORIZONTAL          (bottom = desde abajo)

   Cambia un número, guarda → el navegador se actualiza solo.
════════════════════════════════════════════════════════════════════════ */
const POS = {

  // ── Pergamino (código de sala + lista de jugadores) ──────────────────
  //    left/top = CENTRO DEL BORDE SUPERIOR. Al añadir jugadores crece ↓
  pergamino: {
    left:   725,   // px — centro horizontal del borde superior
    top:    295,   // px — borde superior
    width:  415,   // px — ancho
    rotate: -10, // grados
  },

  // ── QR ───────────────────────────────────────────────────────────────
  qr: {
    left:   1292,  // px — borde izquierdo
    top:     370,  // px — borde superior
    width:   250,  // px — ancho
    rotate:  15, // grados
    svgSize: 340,  // px internos del SVG (no tocar)
  },

  // ── Botón "Iniciar Partida" ───────────────────────────────────────────
  //    left = centro horizontal.
  //    bottom = distancia al BORDE INFERIOR del lienzo.
  //    El texto "Faltan X jugadores" crece hacia ARRIBA desde el botón.
  boton: {
    left:   860,  // px — centro horizontal
    bottom:  108,  // px — distancia al borde inferior
    width:  384,  // px — ancho
    rotate: -9.5, // grados
  },
};

/* ─── Modo debug ─────────────────────────────────────────────────────────
   true  → contorno de colores + punto de anclaje en cada elemento
   false → versión final limpia
────────────────────────────────────────────────────────────────────── */
const DEBUG = false;

/* ─── Jugadores ficticios (solo cuando DEBUG = true) ─────────────────── */
const MOCKS_DEBUG = [
  { id: 'm1', nombre: 'Capitán Barbossa',   conectado: true  },
  { id: 'm2', nombre: 'Jack Sparrow',        conectado: true  },
  { id: 'm3', nombre: 'Will Turner',         conectado: false },
  { id: 'm4', nombre: 'Elizabeth Swann',     conectado: true  },
  { id: 'm5', nombre: 'Davy Jones',          conectado: true  },
  { id: 'm6', nombre: 'Hector el Corsario',  conectado: true  },
  { id: 'm7', nombre: 'Mati',                conectado: true  },
];

/* ══════════════════════════════════════════════════════════════════════ */
export default function SalaEspera({
  codigo       = '----',
  jugadores    = [],
  hostId,
  socketId,
  conectado    = false,
  numJugadores = 0,
  onIniciar,
  onCambiarHost,
  onSalir,
  error        = '',
}) {
  const [copiado, setCopiado] = useState(false);

  /* ── scene: posición y escala del lienzo 1920×1080 ── */
  const [scene, setScene] = useState({ x: 0, y: 0, s: 1 });

  const seenIds = useRef(new Set());

  /* ─────────────────────────────────────────────────────────────────────
     Calcula:
       s = factor de escala  (Math.min para que quepa sin recortar)
       x = desplazamiento horizontal para centrar el lienzo en el viewport
       y = desplazamiento vertical   para centrar el lienzo en el viewport

     Con transform-origin: top left el lienzo crece desde (x, y)
     hacia abajo-derecha con el factor s aplicado.
  ───────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const calc = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const x = (window.innerWidth  - 1920 * s) / 2;
      const y = (window.innerHeight - 1080 * s) / 2;
      setScene({ x, y, s });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const urlUnirse = `${URL_BASE}/unirse/${codigo}`;

  const usandoMocks        = DEBUG && MOCKS_DEBUG.length > 0;
  const jugadoresMostrados = usandoMocks ? MOCKS_DEBUG : jugadores;
  const hostIdEfectivo     = usandoMocks ? 'm1' : hostId;
  const totalJugadores     = usandoMocks ? MOCKS_DEBUG.length : numJugadores;
  const listo              = totalJugadores >= 5;
  const faltante           = Math.max(0, 5 - totalJugadores);

  /* registra IDs vistos para la animación de entrada */
  useEffect(() => {
    jugadoresMostrados.forEach(j => { if (j.id) seenIds.current.add(j.id); });
  });

  const copiar = () =>
    navigator.clipboard.writeText(urlUnirse)
      .then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500); });

  const dbg = (color) => DEBUG
    ? { outline: `2px dashed ${color}`, outlineOffset: '3px' }
    : {};

  return (
    /* ══════════════════════════════════════════════════════════════════
       VIEWPORT
       position: fixed + inset: 0 garantiza que siempre ocupa
       exactamente la pantalla completa, en cualquier modo y resolución.
       background: #000 rellena los márgenes si el aspect ratio
       de la pantalla no es 16:9 (efecto letterbox/pillarbox).
    ══════════════════════════════════════════════════════════════════ */
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000',
    }}>

      {/* ════════════════════════════════════════════════════════════════
          LIENZO 1920 × 1080
          ───────────────────────────────────────────────────────────────
          Siempre tiene 1920 × 1080 px de tamaño lógico.
          Se coloca en (scene.x, scene.y) y se escala con scene.s
          desde la esquina superior-izquierda (transform-origin: top left).

          → scene.x / scene.y  centran el lienzo en el viewport.
          → scene.s            = Math.min(vw/1920, vh/1080)
                                 → el lienzo siempre cabe sin recortarse.

          Todos los elementos usan coordenadas px dentro de este lienzo.
          Para mover algo, edita solo el bloque POS al inicio del archivo.
      ════════════════════════════════════════════════════════════════ */}
      <div style={{
        position:        'absolute',
        width:           '1920px',
        height:          '1080px',
        left:            `${scene.x}px`,
        top:             `${scene.y}px`,
        transformOrigin: 'top left',
        transform:       `scale(${scene.s})`,
        overflow:        'hidden',
        animation:       'aparecer-fade 0.7s ease 0.1s both',
      }}>

        {/* ── FONDO ─────────────────────────────────────────────────────
            Dentro del lienzo. Cubre los 1920×1080 con background-size: cover.
        ──────────────────────────────────────────────────────────────── */}
        <div style={{
          position:           'absolute',
          inset:              0,
          backgroundImage:    "url('/sala-espera/fondo.png')",
          backgroundSize:     'cover',
          backgroundPosition: 'center',
          filter:             'brightness(0.72) saturate(1.20)',
          zIndex:             0,
        }} />

        {/* ── Viñeta oscura en bordes ───────────────────────────────── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 85% 85% at 45% 52%,
              transparent 5%, rgba(0,0,0,0.30) 52%, rgba(0,0,0,0.88) 100%),
            linear-gradient(180deg,
              rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.08) 13%,
              rgba(0,0,0,0.08) 85%, rgba(0,0,0,0.65) 100%)
          `,
        }} />

        {/* ── Luz ambiental cálida ──────────────────────────────────── */}
        <div style={{
          position: 'absolute', left: '730px', top: '562px', zIndex: 2, pointerEvents: 'none',
          width: '820px', height: '680px', borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(ellipse, rgba(200,130,18,0.10) 0%, transparent 65%)',
          animation: 'luz-ambar 9.5s ease-in-out 1.8s infinite',
        }} />

        {/* ══════════════════════════════════════════════════════════════
            HEADER — barra en el borde superior del lienzo.
            No entra en POS: siempre top: 0, ancho 1920px.
        ══════════════════════════════════════════════════════════════ */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '52px',
          zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(4,2,1,0.80)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(201,168,76,0.13)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '22px', animation: 'flotar 5s ease-in-out infinite', filter: 'drop-shadow(0 0 10px rgba(255,140,30,0.55))' }}>🐙</span>
            <div>
              <h1 style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--oro-dorado)', fontSize: '17px', letterSpacing: '3px', textShadow: '0 0 22px rgba(201,168,76,0.38)' }}>
                Feed The Kraken
              </h1>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,220,170,0.36)', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase' }}>
                Sala de Espera
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background:  conectado ? '#6abf6a' : '#cc4444',
              boxShadow:   conectado ? '0 0 8px rgba(106,191,106,0.65)' : 'none',
            }} />
            <button
              onClick={onSalir}
              style={{ background: 'none', border: '1px solid rgba(201,168,76,0.20)', color: 'rgba(201,168,76,0.48)', padding: '5px 14px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--fuente-subtitulo)', fontSize: '10px', letterSpacing: '1px', transition: 'all 0.3s ease' }}
            >Salir</button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            .elem-pergamino — código de sala + lista de jugadores
            ┌────────────────────────────────────────────────────────┐
            │  POS.pergamino.left  → centro horizontal del borde sup │
            │  POS.pergamino.top   → borde superior                  │
            │  POS.pergamino.width → ancho en px                     │
            │  POS.pergamino.rotate→ inclinación en grados           │
            └────────────────────────────────────────────────────────┘
            Ancla: CENTRO DEL BORDE SUPERIOR
            → al unirse jugadores el pergamino crece hacia ABAJO.
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="elem-pergamino"
          style={{
            position:        'absolute',
            left:            `${POS.pergamino.left}px`,
            top:             `${POS.pergamino.top}px`,
            width:           `${POS.pergamino.width}px`,
            transform:       `translateX(-50%) rotate(${POS.pergamino.rotate}deg)`,
            transformOrigin: '50% 0%',
            zIndex:          10,
            ...dbg('rgba(255,165,0,0.8)'),
          }}
        >
          {/* Código de sala */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <p style={{ fontFamily: 'var(--fuente-ui)', fontSize: '11px', fontWeight: 700, letterSpacing: '6px', textTransform: 'uppercase', color: 'rgba(245,218,162,0.44)', marginBottom: '5px' }}>
               &nbsp;Código de sala&nbsp; 
            </p>
            <div style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '70px', letterSpacing: '0.22em', lineHeight: 1, color: '#faefd4', textShadow: '0 0 32px rgba(255,210,90,0.58), 0 0 70px rgba(255,175,40,0.22), 0 3px 0 rgba(55,24,4,0.95), 0 7px 22px rgba(0,0,0,0.98)' }}>
              {codigo}
            </div>
          </div>

          {/* Separador náutico */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.38))' }} />
            <span style={{ fontFamily: 'var(--fuente-pirata)', fontSize: '16px', color: 'rgba(245,218,162,0.62)', letterSpacing: '3.5px', textTransform: 'uppercase' }}>Tripulación</span>
            <span style={{ fontFamily: 'var(--fuente-subtitulo)', fontSize: '15px', color: 'rgba(245, 217, 162, 0.52)', fontWeight: 600 }}>
              {jugadoresMostrados.length}/11
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.38))' }} />
          </div>

          {/* Lista de jugadores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {jugadoresMostrados.length === 0 ? (
              <p style={{ fontFamily: 'var(--fuente-ui)', color: 'rgba(245, 217, 162, 0.63)', fontSize: '14px', letterSpacing: '0.3px', padding: '22px 6px', fontStyle: 'italic' }}>
                Esperando tripulantes…
              </p>
            ) : jugadoresMostrados.map((j, i) => {
              const esHost  = j.id === hostIdEfectivo;
              const esNuevo = !seenIds.current.has(j.id);
              return (
                <div key={j.id || i} style={{
                  position:     'relative',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '12px',
                  padding:      '2px 10px',
                  borderRadius: '4px',
                  background:   esHost ? 'rgba(200,165,70,0.08)' : 'transparent',
                  borderBottom: `1px solid rgba(245,218,162,${esHost ? '0.20' : '0.07'})`,
                  borderLeft:   esHost ? '2px solid rgba(201,168,76,0.50)' : '2px solid transparent',
                  animation:    esNuevo
                    ? `playerJoin 0.5s cubic-bezier(.22,.68,0,1.2) ${i * 0.06}s both`
                    : 'none',
                }}>
                  <span style={{ flexShrink: 0, minWidth: '20px', textAlign: 'center', fontFamily: 'var(--fuente-subtitulo)', fontSize: '11px', color: esHost ? 'rgba(232,201,122,0.90)' : 'rgba(245,218,162,0.28)', fontWeight: 700 }}>
                    {esHost ? 'Host' : String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontFamily: 'var(--fuente-ui)', fontSize: '20px', color: esHost ? '#f7e5bc' : '#edd5a0', fontWeight: esHost ? 700 : 500, lineHeight: 1.15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.3px', textShadow: '0 1px 10px rgba(0,0,0,0.88)' }}>
                    {j.nombre}
                  </span>
                  {socketId === hostId && !esHost && (
                    <button
                      onClick={() => onCambiarHost?.(j.id)}
                      title="Ceder el mando"
                      style={{ flexShrink: 0, background: 'transparent', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '3px', fontSize: '9px', color: 'rgba(250, 250, 250, 0.83)', cursor: 'pointer', padding: '2px 5px', lineHeight: 1 }}
                    >Host</button>
                  )}
                  <div
                    title={j.conectado !== false ? 'Conectado' : 'Desconectado'}
                    style={{ flexShrink: 0, width: '7px', height: '7px', borderRadius: '50%', background: j.conectado !== false ? '#5cb85c' : '#d9534f', boxShadow: j.conectado !== false ? '0 0 6px rgba(92,184,92,0.72)' : '0 0 4px rgba(217,83,79,0.60)' }}
                  />
                </div>
              );
            })}
          </div>
        </div>{/* /elem-pergamino */}

        {/* ══════════════════════════════════════════════════════════════
            .elem-qr — código QR para unirse
            ┌────────────────────────────────────────────────────────┐
            │  POS.qr.left   → borde izquierdo                      │
            │  POS.qr.top    → borde superior                        │
            │  POS.qr.width  → ancho en px                          │
            │  POS.qr.rotate → inclinación en grados                │
            └────────────────────────────────────────────────────────┘
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="elem-qr"
          style={{
            position:        'absolute',
            left:            `${POS.qr.left}px`,
            top:             `${POS.qr.top}px`,
            width:           `${POS.qr.width}px`,
            transform:       `rotate(${POS.qr.rotate}deg)`,
            transformOrigin: '50% 0%',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            zIndex:          10,
            ...dbg('rgba(220,50,50,0.8)'),
          }}
        >
          <div style={{
            position:  'relative',
            width:     '100%',
            padding:   '21% 3% 21%',
            borderRadius: '7px',
            background: '#fdf9f0',
            boxShadow: `
              0 6px 32px rgba(0,0,0,0.70), 0 0 0 1px rgba(185,148,60,0.22),
              inset 0 0 14px rgba(0,0,0,0.42), inset 11px 0 12px -4px rgba(0,0,0,0.52),
              inset 0 12px 12px -2px rgba(0,0,0,0.52), inset 12px 0 12px rgba(0,0,0,0.38),
              inset -8px -8px 10px -3px rgba(255,228,155,0.07)
            `,
          }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '7px', zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(-138deg, rgba(255,238,190,0.10) 0%, transparent 42%, rgba(0,0,0,0.16) 78%, rgba(0,0,0,0.26) 100%)' }} />
            <QRCodeSVG
              value={urlUnirse}
              size={POS.qr.svgSize}
              level="M"
              bgColor="#fdf9f0"
              fgColor="#0a0200"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: 'none', padding: '7% 6% 11%', borderRadius: '7px 7px 0 0', background: 'linear-gradient(to bottom, rgba(253,249,240,0.97) 0%, transparent 0%)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--fuente-ui)', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '14px', color: 'rgba(10,2,0,0.52)', margin: 0, fontWeight: 700 }}>
                Únete escaneando
              </p>
            </div>
            <button
              onClick={copiar}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, padding: '11% 6% 7%', borderRadius: '0 0 7px 7px', background: 'linear-gradient(to top, rgba(253,249,240,0.97) 0%, transparent 0%)', border: 'none', cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--fuente-ui)', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '14px', color: copiado ? 'rgba(50,130,50,0.80)' : 'rgba(10,2,0,0.38)', fontWeight: 700, transition: 'color 0.3s ease' }}
            >
              {copiado ? '✓ ¡Copiado!' : 'Copiar link'}
            </button>
          </div>
        </div>{/* /elem-qr */}

        {/* ══════════════════════════════════════════════════════════════
            .elem-boton — botón "Iniciar Partida"
            ┌────────────────────────────────────────────────────────┐
            │  POS.boton.left   → centro horizontal                  │
            │  POS.boton.bottom → distancia al borde inferior (px)   │
            │  POS.boton.width  → ancho en px                        │
            │  POS.boton.rotate → inclinación en grados              │
            └────────────────────────────────────────────────────────┘
            Ancla: CENTRO HORIZONTAL / BORDE INFERIOR
            → "Faltan X jugadores" crece hacia ARRIBA sin mover el botón.
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="elem-boton"
          style={{
            position:        'absolute',
            left:            `${POS.boton.left}px`,
            bottom:          `${POS.boton.bottom}px`,
            width:           `${POS.boton.width}px`,
            transform:       `translateX(-50%) rotate(${POS.boton.rotate}deg)`,
            transformOrigin: '50% 100%',
            textAlign:       'center',
            zIndex:          10,
            ...dbg('rgba(160,60,220,0.8)'),
          }}
        >
          {!listo && (
            <p style={{ fontFamily: 'var(--fuente-subtitulo)', fontSize: '11px', color: 'rgb(243, 220, 175)', textShadow: '0 1px 12px rgba(0,0,0,0.99)', marginBottom: '-55px', letterSpacing: '1.5px', lineHeight: 1.5 }}>
              Faltan {faltante} jugador{faltante !== 1 ? 'es' : ''} para iniciar
            </p>
          )}
          <img
            src="/sala-espera/iniciar-partida.png"
            alt="Iniciar Partida"
            onClick={listo ? onIniciar : undefined}
            draggable={false}
            style={{ width: '100%', display: 'block', cursor: listo ? 'pointer' : 'not-allowed', opacity: listo ? 1 : 0.35, filter: listo ? 'none' : 'grayscale(0.5)', transition: 'opacity 0.22s ease, filter 0.22s ease', userSelect: 'none' }}
          />
          {error && (
            <p style={{ color: '#ffccaa', fontSize: '10px', marginTop: '8px', fontFamily: 'var(--fuente-subtitulo)', letterSpacing: '0.5px', textShadow: '0 1px 4px rgba(0,0,0,0.92)' }}>
              {error}
            </p>
          )}
        </div>{/* /elem-boton */}

      </div>{/* /lienzo 1920×1080 */}
    </div>   /* /viewport */
  );
}
