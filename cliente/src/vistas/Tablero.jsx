import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAudio } from '../contextos/AudioContexto';
import SalaEspera from './SalaEspera';
import Modelo3D from '../components/tablero/Modelo3D';

/* ═══════════════════════════════════════════════════════════════════════
   🎛️  POSICIONES — ESTE ES EL ÚNICO BLOQUE QUE NECESITAS EDITAR.

   Lienzo base: 1920 × 1080 px.
   Todos los valores son píxeles dentro de ese lienzo.
   El lienzo escala completo como una imagen: pantalla pequeña o grande,
   TODO cambia de tamaño en bloque. La disposición siempre es idéntica.

   ┌─────────────────────────────────────────────────────────────────┐
   │  left / top → posición dentro del lienzo 1920 × 1080           │
   │  width      → ancho en px                                      │
   │  size       → ancho = alto (elementos cuadrados)               │
   └─────────────────────────────────────────────────────────────────┘

   Punto de anclaje:
   • tablero      → CENTRO del SVG  (translate -50% -50%)
   • marcoTablero → CENTRO del PNG  (translate -50% -50%)
   • panelIzq     → ESQUINA SUPERIOR IZQUIERDA
   • panelDer     → ESQUINA SUPERIOR IZQUIERDA

   Cambia un número, guarda → el navegador se actualiza solo.
════════════════════════════════════════════════════════════════════════ */
const POS = {

  // ── Vídeo del tablero (cuadrado 1:1, 2160×2160) ───────────────────────
  //    Ancla: CENTRO. width=height = marcoTablero.size / 1.5
  tablero: {
    left:   960,
    top:    572,
    width:  980,
    height: 980,
  },

  // ── Marco ornamental (PNG 3:2 = 1536×1024) ───────────────────────────
  //    Ancla: CENTRO. left/top deben coincidir con tablero.left/top.
  //    Cambia solo `size`; la altura se calcula sola (size / 1.5).
  marcoTablero: {
    left: 960,
    top:  615,
    size: 1750,
  },

  // ── Panel izquierdo — capitán + lista de jugadores ────────────────────
  //    Ancla: ESQUINA SUPERIOR IZQUIERDA del panel.
  panelIzq: {
    left:  22,
    top:   14,   // sin header → empieza casi en el borde superior
    width: 268,
  },

  // ── Panel derecho — mazo + última carta ──────────────────────────────
  //    Ancla: ESQUINA SUPERIOR IZQUIERDA del panel.
  panelDer: {
    left:  1630,
    top:    70,
    width:  268,
  },

  // ── Insignias de rol en la lista de jugadores ─────────────────────────
  //    Assets: /tablero/ui/insignia-capitan.png, insignia-teniente.png,
  //            insignia-navegante.png
  insignias: {
    size: 22,  // px — ancho de cada imagen de insignia
  },

  // ── Botones de control del host (sin header) ─────────────────────────
  //    Ancla: CENTRO del botón.
  //    Assets: /tablero/ui/boton-retroceder.png, boton-avanzar.png,
  //            boton-reiniciar.png, boton-salir.png
  controles: {
    botonRetroceder: { left: 1646, top: 38, size: 44 },
    botonAvanzar:    { left: 1700, top: 38, size: 44 },
    botonReiniciar:  { left: 1680, top: 36, size: 150 },
    botonSalir:      { left: 1820, top: 38, size: 150 },
  },

  // ── Modelos 3D ─────────────────────────────────────────────────────────
  //    Ancla: CENTRO del canvas (translate -50% -50%).
  //    size    → lado del canvas cuadrado en px.
  //    visible → true activa el slot; false lo oculta sin coste de render.
  //    Assets en /public/tablero/modelos/  (.glb)
  //    ✅  Deps ya instaladas: three + @react-three/fiber@8 + @react-three/drei@9
  //       Para activar un modelo: visible: false → true
  modelos3d: {
    barco:      { left: 960,  top: 572, size: 180, escala: 1, camPos: [0, 2, 4], visible: true  },  // sigue barco.hexId
    kraken:     { left: 960,  top: 572, size: 200, visible: false },  // casilla kraken_centro
    tentaculo1: { left: 840,  top: 480, size: 80,  visible: false },  // kraken_menor izq
    tentaculo2: { left: 1080, top: 480, size: 80,  visible: false },  // kraken_menor der
    lupa1:      { left: 760,  top: 572, size: 60,  visible: false },  // acción lupa 1
    lupa2:      { left: 960,  top: 410, size: 60,  visible: false },  // acción lupa 2
    lupa3:      { left: 1160, top: 572, size: 60,  visible: false },  // acción lupa 3
  },
};

/* ─── Modo debug ──────────────────────────────────────────────────────
   true  → contornos de colores en los elementos posicionables
   false → versión limpia final
────────────────────────────────────────────────────────────────────── */
const DEBUG = false;

/* ─── Preview de desarrollo ──────────────────────────────────────────
   true  → tablero visible con datos de prueba (sin servidor)
   false → comportamiento normal en producción
────────────────────────────────────────────────────────────────────── */
const DEV_PREVIEW = true;

const MOCK = {
  sala: {
    hostId: 'j1',
    fase: 'fase_1',
    numJugadores: 6,
    jugadores: [
      { id: 'j1', nombre: 'Sergio',   conectado: true,  esCapitan: true  },
      { id: 'j2', nombre: 'Laura',    conectado: true,  esTeniente: true },
      { id: 'j3', nombre: 'Marcos',   conectado: true,  esNavegante: true },
      { id: 'j4', nombre: 'Elena',    conectado: true  },
      { id: 'j5', nombre: 'Tomás',    conectado: false },
      { id: 'j6', nombre: 'Cristina', conectado: true,  curriculos: 2 },
    ],
  },
  tablero: {
    fase: 'fase_1',
    turno: 3,
    capitanIdx: 0,
    mazoDisponibleCount: 18,
    barco: { hexId: 'mid_centro_alto' },
    ultimaCarta: {
      color: 'azul',
      nombre: 'Viento en Popa',
      descripcion: 'El barco avanza una casilla hacia el destino.',
    },
  },
};

/* ─── Información visual por fase ──────────────────────────────────── */
const FASE_INFO = {
  lobby:     { label: 'Sala de Espera',          color: 'var(--oro-dorado)' },
  fase_0:    { label: 'Revelando Roles',         color: 'var(--turquesa-kraken)' },
  durmiendo: { label: 'La tripulación duerme…', color: '#7ec8e3' },
  fase_1:    { label: 'Eligiendo Equipo',        color: 'var(--oro-dorado)' },
  fase_2:    { label: 'Votación de Motín',       color: '#ff8a8a' },
  fase_3:    { label: 'El Cofre de Navegación',  color: 'var(--oro-dorado)' },
  fase_4:    { label: 'Casilla Especial',        color: 'var(--turquesa-kraken)' },
  fase_5:    { label: 'Fin de Turno',            color: 'rgba(245,230,200,0.4)' },
  victoria:  { label: '¡VICTORIA!',             color: '#e8c97a' },
};

const dbg = (color) => DEBUG ? { outline: `2px dashed ${color}`, outlineOffset: '3px' } : {};

/* ══════════════════════════════════════════════════════════════════════ */
export default function Tablero() {
  const { codigo } = useParams();
  const navigate   = useNavigate();
  const { emitir, escuchar, conectado, socketId } = useSocket();

  const [sala,    setSala]    = useState(DEV_PREVIEW ? MOCK.sala    : null);
  const [tablero, setTablero] = useState(DEV_PREVIEW ? MOCK.tablero : null);
  const [fase,    setFase]    = useState(DEV_PREVIEW ? MOCK.tablero.fase : 'lobby');
  const [error,   setError]   = useState('');
  const [motin,   setMotin]   = useState(null);
  const [kraken,  setKraken]  = useState(null);

  /* ── Audio ambiente del tablero ─────────────────────────────────── */
  const { playAmbiente, stopAmbiente, playSFX } = useAudio();

  useEffect(() => {
    // Ambiente: oleaje + crujidos del barco, en bucle
    playAmbiente('tab-olas',  '/sonidos/ocean-waves.wav', 0.20);
    playAmbiente('tab-barco', '/sonidos/amb-barco.mp3',   0.15);

    // SFX: pool de 4 sonidos, muy espaciados (40–120 s), nunca superpuestos
    const SFX_POOL = [
      { key: 'gaviotas1',  src: '/sonidos/sfx-gaviotas1.mp3', vol: 0.32 },
      { key: 'gaviotas2',  src: '/sonidos/sfx-gaviotas2.mp3', vol: 0.32 },
      { key: 'puerta',     src: '/sonidos/door_creak.mp3',     vol: 0.28 },
      { key: 'madera',     src: '/sonidos/sfx-madera1.mp3',    vol: 0.30 },
    ];
    let active = true;
    let timer  = null;
    const scheduleNext = () => {
      if (!active) return;
      const silencio = 40000 + Math.random() * 80000;           // 40 – 120 s
      timer = setTimeout(() => {
        if (!active) return;
        const sfx = SFX_POOL[Math.floor(Math.random() * SFX_POOL.length)];
        playSFX(`tab-sfx-${sfx.key}`, sfx.src, sfx.vol);
        timer = setTimeout(scheduleNext, 7000);                  // 7 s de margen
      }, silencio);
    };
    scheduleNext();

    return () => {
      active = false;
      clearTimeout(timer);
      stopAmbiente('tab-olas',  1200);
      stopAmbiente('tab-barco', 1200);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Escala del lienzo 1920 × 1080 ─────────────────────────────── */
  const [scene, setScene] = useState({ x: 0, y: 0, s: 1 });
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

  /* ── Socket ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!codigo || DEV_PREVIEW) return;
    emitir('unirse-tablero', { codigo: codigo.toUpperCase() });

    const c1 = escuchar('tablero-conectado',  ({ sala }) => { setSala(sala); setFase(sala.fase); });
    const c2 = escuchar('tablero-actualizado', (t)       => { setTablero(t); setFase(t.fase); });
    const c3 = escuchar('sala-actualizada',    (s)       => { setSala(s); setFase(s.fase); });
    const c4 = escuchar('fase-cambiada',       ({ fase: f }) => setFase(f));
    const c5 = escuchar('error',               ({ mensaje }) => setError(mensaje));
    const c6 = escuchar('motin-resultado', (data) => {
      setMotin(data);
      setTimeout(() => setMotin(null), 6000);
    });
    const c7 = escuchar('kraken-sacrificio', (data) => {
      setKraken(data);
      if (!data.victoriaCultistas) setTimeout(() => setKraken(null), 7000);
    });
    return () => { c1(); c2(); c3(); c4(); c5(); c6(); c7(); };
  }, [codigo, emitir, escuchar]);

  /* ── Acciones del host ──────────────────────────────────────────── */
  const iniciarPartida = () => emitir('tablero-iniciar');
  const avanzarFase    = () => emitir('tablero-avanzar');
  const retrocederFase = () => emitir('tablero-retroceder');
  const reiniciar      = () => { if (window.confirm('¿Reiniciar la partida?')) emitir('tablero-reiniciar'); };
  const cambiarHost    = (id) => emitir('tablero-cambiar-host', { nuevoHostId: id });

  const jugadores    = tablero?.jugadores || sala?.jugadores || [];
  const numJugadores = sala?.numJugadores || jugadores.length || 0;

  /* ── Pantalla de carga ──────────────────────────────────────────── */
  if (!sala) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#08070f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px', animation: 'flotar 3s ease-in-out infinite' }}>🐙</div>
          <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)', fontSize: '14px', letterSpacing: '3px' }}>
            Conectando al tablero…
          </p>
          {error && <p style={{ color: '#ff8a8a', marginTop: '12px', fontFamily: 'var(--fuente-cuerpo)' }}>{error}</p>}
        </div>
      </div>
    );
  }

  /* ── SALA DE ESPERA (LOBBY) ─────────────────────────────────────── */
  if (fase === 'lobby') {
    return (
      <SalaEspera
        codigo={codigo}
        jugadores={jugadores}
        hostId={sala.hostId}
        socketId={socketId}
        conectado={conectado}
        numJugadores={numJugadores}
        onIniciar={iniciarPartida}
        onCambiarHost={cambiarHost}
        onSalir={() => navigate('/')}
        error={error}
      />
    );
  }

  /* ── PARTIDA EN CURSO ───────────────────────────────────────────── */
  const faseInfo = FASE_INFO[fase] || { label: fase, color: 'var(--crema-pergamino)' };
  const capitan  = tablero?.capitanIdx != null ? jugadores[tablero.capitanIdx] : null;

  const TIPO_EMOJI_RITUAL = { conversion_culto: '👥', registro_camarote: '📋', alijo_armas: '🔫' };
  const ROL_EQUIPO  = { piratas: ['pirata'], marineros: ['marinero'], cultistas: ['cultista', 'adepto'] };
  const ROL_LABEL   = { pirata: '💀 Pirata', marinero: '⚓ Marinero', cultista: '🐙 Cultista', adepto: '👁️ Adepto' };

  return (
    /* ════════════════════════════════════════════════════════════════
       VIEWPORT — siempre ocupa la pantalla completa.
       background: #000 rellena márgenes en pantallas no 16:9.
    ════════════════════════════════════════════════════════════════ */
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000',
    }}>

      {/* ════════════════════════════════════════════════════════════
          LIENZO 1920 × 1080
          Todos los elementos usan coordenadas px dentro de este div.
          Para mover algo, edita solo el bloque POS al inicio del archivo.
      ════════════════════════════════════════════════════════════ */}
      <div style={{
        position:        'absolute',
        width:           '1920px',
        height:          '1080px',
        left:            `${scene.x}px`,
        top:             `${scene.y}px`,
        transformOrigin: 'top left',
        transform:       `scale(${scene.s})`,
        overflow:        'hidden',
        animation:       'aparecer-fade 0.6s ease 0.05s both',
      }}>

        {/* ── FONDO ────────────────────────────────────────────────
            Asset: /tablero/fondo.png
            Mientras no tengas el asset, se muestra el gradiente.
        ─────────────────────────────────────────────────────────── */}
        <div style={{
          position:           'absolute',
          inset:              0,
          backgroundImage:    "url('/tablero/fondo.png'), linear-gradient(160deg, #06080f 0%, #0a1220 40%, #07111e 70%, #05090e 100%)",
          backgroundSize:     'cover',
          backgroundPosition: 'center',
          filter:             'brightness(0.78) saturate(1.15)',
          zIndex:             0,
        }} />

        {/* ── Viñeta oscura en bordes ───────────────────────────── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 70% 70% at 50% 52%,
              transparent 10%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.80) 100%),
            linear-gradient(180deg,
              rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.04) 8%,
              rgba(0,0,0,0.04) 88%, rgba(0,0,0,0.55) 100%)
          `,
        }} />

        {/* ── Luz ambiental central sutil ───────────────────────── */}
        <div style={{
          position: 'absolute', left: '960px', top: '540px',
          width: '900px', height: '700px', borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(ellipse, rgba(10,60,100,0.12) 0%, transparent 65%)',
          zIndex: 2, pointerEvents: 'none',
          animation: 'shimmer-mar 9s ease-in-out 1s infinite',
        }} />

        {/* ══════════════════════════════════════════════════════════
            BOTONES DE CONTROL DEL HOST
            Posición en POS.controles. Assets en /tablero/ui/.
            Mientras no tengas los assets se muestran como áreas
            semitransparentes (invisible en producción sin asset).
        ══════════════════════════════════════════════════════════ */}
        {[
          { cfg: POS.controles.botonRetroceder, src: '/tablero/ui/boton-retroceder.png', onClick: retrocederFase,       title: 'Retroceder fase' },
          { cfg: POS.controles.botonAvanzar,    src: '/tablero/ui/boton-avanzar.png',    onClick: avanzarFase,           title: 'Avanzar fase'    },
          { cfg: POS.controles.botonReiniciar,  src: '/tablero/ui/boton-reiniciar.png',  onClick: reiniciar,             title: 'Reiniciar'       },
          { cfg: POS.controles.botonSalir,      src: '/tablero/ui/boton-salir.png',      onClick: () => navigate('/'),  title: 'Salir'           },
        ].map(({ cfg, src, onClick, title }) => (
          <div
            key={title}
            onClick={onClick}
            title={title}
            style={{
              position:  'absolute',
              left:      `${cfg.left}px`,
              top:       `${cfg.top}px`,
              width:     `${cfg.size}px`,
              height:    `${cfg.size}px`,
              transform: 'translate(-50%,-50%)',
              zIndex:    25,
              cursor:    'pointer',
              ...dbg('rgba(255,80,80,0.6)'),
            }}
          >
            <img
              src={src}
              alt={title}
              draggable={false}
              onError={e => { e.currentTarget.style.display = 'none'; }}
              style={{ width: '100%', height: '100%', objectFit: 'contain',
                       userSelect: 'none', pointerEvents: 'none' }}
            />
          </div>
        ))}

        {/* Dot de conexión — esquina superior derecha, sin header */}
        <div style={{
          position: 'absolute', right: '18px', top: '18px', zIndex: 25,
          width: '8px', height: '8px', borderRadius: '50%',
          background: conectado ? '#98e4a5' : '#ff8a8a',
          boxShadow: conectado ? '0 0 7px rgba(152,228,165,0.7)' : 'none',
          pointerEvents: 'none',
        }} />

        {/* ══════════════════════════════════════════════════════════
            PANEL IZQUIERDO — capitán + lista de jugadores
            ┌──────────────────────────────────────────────────────┐
            │  POS.panelIzq.left  → borde izquierdo del panel     │
            │  POS.panelIzq.top   → borde superior del panel      │
            │  POS.panelIzq.width → ancho en px                   │
            └──────────────────────────────────────────────────────┘
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            left:     `${POS.panelIzq.left}px`,
            top:      `${POS.panelIzq.top}px`,
            width:    `${POS.panelIzq.width}px`,
            maxHeight: `${1080 - POS.panelIzq.top - 18}px`,
            zIndex:   10,
            display:  'flex',
            flexDirection: 'column',
            gap:      '8px',
            padding:  '12px 11px',
            background: 'rgba(4,6,13,0.80)',
            border:   '1px solid rgba(201,168,76,0.13)',
            borderRadius: '10px',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.60), inset 0 1px 0 rgba(201,168,76,0.07)',
            overflowY: 'auto',
            ...dbg('rgba(255,165,0,0.7)'),
          }}
        >
          {/* ── Capitán ──────────────────────────────────────────── */}
          {capitan ? (
            <div style={{
              padding: '10px 13px 11px',
              background: 'linear-gradient(135deg, rgba(201,168,76,0.09) 0%, rgba(201,168,76,0.04) 100%)',
              border: '1px solid rgba(201,168,76,0.22)',
              borderRadius: '7px',
              boxShadow: '0 0 22px rgba(201,168,76,0.07), inset 0 1px 0 rgba(201,168,76,0.09)',
            }}>
              <p style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'rgba(204, 166, 63, 0.68)',
                fontSize: '20px', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', fontWeight: 700,
                marginBottom: '6px',
              }}>
                &nbsp;Capitán
              </p>
              <p style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'var(--crema-pergamino)',
                fontSize: '32px', letterSpacing: '0.4px', textAlign: 'center', fontWeight: 700,
              }}>
                {capitan.nombre}
              </p>
            </div>
          ) : (
            <div style={{ padding: '10px 13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '7px' }}>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.22)', fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                Sin capitán
              </p>
            </div>
          )}

          {/* ── Separador "Tripulación" ──────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 1px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.18))' }} />
            <p style={{
              fontFamily: 'var(--fuente-subtitulo)',
              color: 'rgba(245, 230, 200, 0.48)',
              fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase', flexShrink: 0,
            }}>
              Tripulación · {numJugadores}
            </p>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.18))' }} />
          </div>

          {/* ── Lista de jugadores ───────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {jugadores.map((j, i) => (
              /* ── Fila exterior: [tarjeta──flex:1 | badge-currículos] ── */
              <div key={j.id || i} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                opacity:    j.fueraDeServicio ? 0.32 : j.conectado === false ? 0.42 : 1,
                transition: 'opacity 0.3s ease',
              }}>

                {/* ── Tarjeta del jugador ──────────────────────────── */}
                <div style={{
                  flex: 1, minWidth: 0,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: j.esCapitan
                    ? 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)'
                    : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${j.esCapitan ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    {/* Indicador de conexión */}
                    <div style={{
                      width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                      background: j.conectado === false ? '#ff8a8a' : '#98e4a5',
                      boxShadow:  j.conectado !== false ? '0 0 6px rgba(152,228,165,0.55)' : 'none',
                    }} />

                    {/* Nombre */}
                    <span style={{
                      padding: '3px 6px',
                      fontFamily: 'var(--fuente-cuerpo)',
                      color: j.esCapitan ? 'rgba(245,220,160,0.92)' : 'var(--crema-pergamino)',
                      fontSize: '25px', flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      letterSpacing: '0.2px',
                    }}>
                      {j.nombre}
                    </span>

                    {/* Insignias — assets, tamaño en POS.insignias.size */}
                    <div style={{ display: 'flex', gap: '3px', flexShrink: 0, alignItems: 'center' }}>
                      {j.esCapitan    && <img src="/tablero/ui/insignia-capitan.png"
                        draggable={false} onError={e => { e.currentTarget.style.display='none'; }}
                        style={{ width: `${POS.insignias.size}px`, height: `${POS.insignias.size}px`, objectFit: 'contain' }} />}
                      {j.esTeniente   && <img src="/tablero/ui/insignia-teniente.png"
                        draggable={false} onError={e => { e.currentTarget.style.display='none'; }}
                        style={{ width: `${POS.insignias.size}px`, height: `${POS.insignias.size}px`, objectFit: 'contain' }} />}
                      {j.esNavegante  && <img src="/tablero/ui/insignia-navegante.png"
                        draggable={false} onError={e => { e.currentTarget.style.display='none'; }}
                        style={{ width: `${POS.insignias.size}px`, height: `${POS.insignias.size}px`, objectFit: 'contain' }} />}
                      {j.fueraDeServicio && <span style={{ fontSize: '16px', opacity: 0.6 }}>😴</span>}
                    </div>
                  </div>
                </div>

                {/* ── Badge de currículos — FUERA de la tarjeta ──────
                    Solo aparece si el jugador tiene currículos.
                    El espacio siempre se reserva para mantener alineación.
                ─────────────────────────────────────────────────────── */}
                <div style={{ flexShrink: 0, width: '34px', textAlign: 'center' }}>
                  {j.curriculos > 0 && (
                    <div style={{
                      background: 'rgba(201,168,76,0.13)',
                      border: '1px solid rgba(201,168,76,0.30)',
                      borderRadius: '5px',
                      padding: '2px 4px',
                      fontFamily: 'var(--fuente-subtitulo)',
                      color: 'rgba(245,220,160,0.78)',
                      fontSize: '11px',
                      lineHeight: 1.25,
                      letterSpacing: '0.3px',
                    }}>
                      📜<br />{j.curriculos}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>{/* /panel-izq */}

        {/* ══════════════════════════════════════════════════════════
            TABLERO — vídeo en bucle
            ┌──────────────────────────────────────────────────────┐
            │  Asset: /tablero/tablero.mp4                         │
            │  POS.tablero.left/top  → centro del vídeo            │
            │  POS.tablero.width/height → dimensiones en px        │
            └──────────────────────────────────────────────────────┘
            Ancla: CENTRO (translate -50% -50%)
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            position:  'absolute',
            left:      `${POS.tablero.left}px`,
            top:       `${POS.tablero.top}px`,
            width:     `${POS.tablero.width}px`,
            height:    `${POS.tablero.height}px`,
            transform: 'translate(-50%, -50%)',
            zIndex:    5,
            ...dbg('rgba(0,200,255,0.7)'),
          }}
        >
          <video
            src="/tablero/tablero.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width:         '100%',
              height:        '100%',
              objectFit:     'cover',
              display:       'block',
              pointerEvents: 'none',
              userSelect:    'none',
            }}
          />
        </div>

        {/* ── Halo ambiental bajo el tablero ───────────────────────
            Glow difuso que hace "flotar" el marco sobre el fondo.
        ─────────────────────────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          left:          `${POS.marcoTablero.left}px`,
          top:           `${POS.marcoTablero.top}px`,
          width:         `${POS.marcoTablero.size * 1.10}px`,
          height:        `${POS.marcoTablero.size * 1.10}px`,
          transform:     'translate(-50%, -50%)',
          background:    'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(180,130,40,0.18) 0%, rgba(120,80,20,0.08) 50%, transparent 75%)',
          filter:        'blur(28px)',
          zIndex:        4,
          pointerEvents: 'none',
        }} />

        {/* ── Marco ornamental del tablero ──────────────────────────
            Asset: /tablero/marco-tablero.png
            Ajusta POS.marcoTablero.size y left/top si no encaja.
        ─────────────────────────────────────────────────────────── */}
        <img
          src="/tablero/marco-tablero.png"
          alt=""
          draggable={false}
          style={{
            position:      'absolute',
            left:          `${POS.marcoTablero.left}px`,
            top:           `${POS.marcoTablero.top}px`,
            width:         `${POS.marcoTablero.size}px`,
            transform:     'translate(-50%, -50%)',
            zIndex:        6,
            pointerEvents: 'none',
            userSelect:    'none',
          }}
        />

        {/* ══════════════════════════════════════════════════════════
            MODELOS 3D — barco / kraken / tentáculos / lupa
            ┌──────────────────────────────────────────────────────┐
            │  Activa cada modelo con POS.modelos3d.<nombre>.      │
            │  visible: true  → renderiza el canvas 3D             │
            │  visible: false → no monta nada (sin coste)          │
            │                                                      │
            │  Assets esperados en /public/tablero/modelos/:       │
            │    barco.glb      — barco pirata                     │
            │    kraken.glb     — cuerpo central del Kraken        │
            │    tentaculo.glb  — tentáculo (reutilizado ×2)       │
            │    lupa.glb       — lupa (reutilizada ×3)            │
            │                                                      │
            │  Para activar: POS.modelos3d.<nombre>.visible: true  │
            │  Pon el .glb en /public/tablero/modelos/ y listo.    │
            └──────────────────────────────────────────────────────┘
            Ancla: CENTRO del canvas (translate -50% -50%)
        ══════════════════════════════════════════════════════════ */}

        {/* ── Barco pirata ─────────────────────────────────────── */}
        {POS.modelos3d.barco.visible && (
          <div style={{
            position: 'absolute',
            left:      `${POS.modelos3d.barco.left}px`,
            top:       `${POS.modelos3d.barco.top}px`,
            transform: 'translate(-50%,-50%)',
            zIndex:    7,
            pointerEvents: 'none',
            ...dbg('rgba(0,255,100,0.6)'),
          }}>
            <Modelo3D
              src="/tablero/modelos/barco.glb"
              size={POS.modelos3d.barco.size}
              escala={POS.modelos3d.barco.escala}
              camPos={POS.modelos3d.barco.camPos}
              rotacion={[0, Math.PI / 6, 0]}
            />
          </div>
        )}

        {/* ── Kraken central ───────────────────────────────────── */}
        {POS.modelos3d.kraken.visible && (
          <div style={{
            position: 'absolute',
            left:      `${POS.modelos3d.kraken.left}px`,
            top:       `${POS.modelos3d.kraken.top}px`,
            transform: 'translate(-50%,-50%)',
            zIndex:    9,
            pointerEvents: 'none',
            ...dbg('rgba(180,0,255,0.6)'),
          }}>
            <Modelo3D
              src="/tablero/modelos/kraken.glb"
              size={POS.modelos3d.kraken.size}
              escala={1}
              rotacion={[0, 0, 0]}
            />
          </div>
        )}

        {/* ── Tentáculos (kraken_menor ×2) ─────────────────────── */}
        {POS.modelos3d.tentaculo1.visible && (
          <div style={{
            position: 'absolute',
            left: `${POS.modelos3d.tentaculo1.left}px`,
            top:  `${POS.modelos3d.tentaculo1.top}px`,
            transform: 'translate(-50%,-50%)', zIndex: 9, pointerEvents: 'none',
          }}>
            <Modelo3D src="/tablero/modelos/tentaculo.glb" size={POS.modelos3d.tentaculo1.size} rotacion={[0, Math.PI, 0]} />
          </div>
        )}
        {POS.modelos3d.tentaculo2.visible && (
          <div style={{
            position: 'absolute',
            left: `${POS.modelos3d.tentaculo2.left}px`,
            top:  `${POS.modelos3d.tentaculo2.top}px`,
            transform: 'translate(-50%,-50%)', zIndex: 9, pointerEvents: 'none',
          }}>
            <Modelo3D src="/tablero/modelos/tentaculo.glb" size={POS.modelos3d.tentaculo2.size} />
          </div>
        )}

        {/* ── Lupas (acción lupa ×3) ───────────────────────────── */}
        {[POS.modelos3d.lupa1, POS.modelos3d.lupa2, POS.modelos3d.lupa3].map((cfg, idx) =>
          cfg.visible && (
            <div key={`lupa-${idx}`} style={{
              position: 'absolute', left: `${cfg.left}px`, top: `${cfg.top}px`,
              transform: 'translate(-50%,-50%)', zIndex: 7, pointerEvents: 'none',
            }}>
              <Modelo3D src="/tablero/modelos/lupa.glb" size={cfg.size} />
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════════════════
            PANEL DERECHO — mazo, última carta, motín
            ┌──────────────────────────────────────────────────────┐
            │  POS.panelDer.left  → borde izquierdo del panel     │
            │  POS.panelDer.top   → borde superior del panel      │
            │  POS.panelDer.width → ancho en px                   │
            └──────────────────────────────────────────────────────┘
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            left:     `${POS.panelDer.left}px`,
            top:      `${POS.panelDer.top}px`,
            width:    `${POS.panelDer.width}px`,
            maxHeight: `${1080 - POS.panelDer.top - 18}px`,
            zIndex:   10,
            display:  'flex',
            flexDirection: 'column',
            gap:      '8px',
            padding:  '12px 11px',
            background: 'rgba(4,6,13,0.80)',
            border:   '1px solid rgba(201,168,76,0.13)',
            borderRadius: '10px',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.60), inset 0 1px 0 rgba(201,168,76,0.07)',
            overflowY: 'auto',
            ...dbg('rgba(160,80,240,0.7)'),
          }}
        >
          {/* ── MAZO — reverso apilado + contador ───────────────── */}
          {tablero && (
            <div style={{ padding: '12px 10px 16px', textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'rgba(245,230,200,0.28)',
                fontSize: '8px', letterSpacing: '3px', textTransform: 'uppercase',
                marginBottom: '12px',
              }}>Mazo</p>

              {/* Cartas apiladas */}
              <div style={{ position: 'relative', width: '100px', margin: '0 auto' }}>
                {/* Sombras de cartas debajo */}
                {[3, 2, 1].map(i => (
                  <img key={i} src="/tablero/cartas-nav/carta-reverso.png"
                    draggable={false}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                    style={{
                      position: 'absolute',
                      top:    `${-i * 4}px`,
                      left:   `${i * 3}px`,
                      width:  '100%',
                      filter: `brightness(${0.35 + i * 0.10})`,
                      borderRadius: '6px',
                      pointerEvents: 'none',
                    }}
                  />
                ))}
                {/* Carta superior */}
                <img src="/tablero/cartas-nav/carta-reverso.png"
                  draggable={false}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                  style={{
                    position: 'relative', zIndex: 4,
                    width: '100%', display: 'block',
                    borderRadius: '6px',
                    boxShadow: '0 6px 22px rgba(0,0,0,0.60)',
                    pointerEvents: 'none',
                  }}
                />
                {/* Badge con el número */}
                <div style={{
                  position: 'absolute', bottom: '-12px', right: '-12px', zIndex: 5,
                  width: '32px', height: '32px',
                  background: 'rgba(4,6,13,0.92)',
                  border: `1px solid ${tablero.mazoDisponibleCount === 0 ? 'rgba(255,100,100,0.50)' : 'rgba(201,168,76,0.42)'}`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--fuente-titulo)',
                  fontSize: '13px',
                  color: tablero.mazoDisponibleCount === 0 ? '#ff8a8a' : 'var(--crema-pergamino)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
                }}>
                  {tablero.mazoDisponibleCount}
                </div>
              </div>
            </div>
          )}

          {/* ── Separador ────────────────────────────────────────── */}
          {tablero?.ultimaCarta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 1px' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.15))' }} />
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.20)', fontSize: '8px', letterSpacing: '3px', textTransform: 'uppercase', flexShrink: 0 }}>
                Última carta
              </p>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.15))' }} />
            </div>
          )}

          {/* ── ÚLTIMA CARTA — asset por color ──────────────────── */}
          {tablero?.ultimaCarta && (() => {
            const c = tablero.ultimaCarta;
            // Assets: carta-azul.png | carta-roja.png | carta-amarilla.png
            const CARTA_SRC = {
              azul:     '/tablero/cartas-nav/carta-azul.png',
              rojo:     '/tablero/cartas-nav/carta-roja.png',
              amarillo: '/tablero/cartas-nav/carta-amarilla.png',
            };
            const COL_GLOW = { azul: 'rgba(74,155,199,0.35)', rojo: 'rgba(192,57,43,0.35)', amarillo: 'rgba(201,168,76,0.35)' };
            return (
              <div style={{ padding: '8px 10px 14px', textAlign: 'center' }}>
                <img
                  src={CARTA_SRC[c.color] || '/tablero/cartas-nav/carta-reverso.png'}
                  alt={c.nombre}
                  draggable={false}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                  style={{
                    width: '100px',
                    display: 'inline-block',
                    borderRadius: '7px',
                    boxShadow: `0 6px 24px rgba(0,0,0,0.55), 0 0 18px ${COL_GLOW[c.color] || 'rgba(201,168,76,0.25)'}`,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />
              </div>
            );
          })()}

          {/* ── Estado del motín (fase_2) ────────────────────────── */}
          {fase === 'fase_2' && tablero?.motin && (
            <div style={{
              background: 'rgba(192,57,43,0.07)',
              border: '1px solid rgba(192,57,43,0.22)',
              borderLeft: '3px solid rgba(192,57,43,0.55)',
              borderRadius: '7px',
              padding: '10px 12px',
            }}>
              <p style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'rgba(255,138,138,0.70)',
                fontSize: '8px', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '7px',
              }}>
                🔫 &nbsp;Votación de motín
              </p>
              {/* Barra de progreso del motín */}
              <div style={{ marginBottom: '5px' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '3px', height: '5px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${Math.min(100, (tablero.motin.confirmados / tablero.motin.total) * 100)}%`,
                    background: 'linear-gradient(to right, rgba(192,57,43,0.75), rgba(255,100,80,0.90))',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
              <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.62)', fontSize: '12px' }}>
                {tablero.motin.confirmados} / {tablero.motin.total} confirmados
              </p>
              <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.32)', fontSize: '10px', marginTop: '3px' }}>
                Umbral: {tablero.motin.umbral} pistolas
              </p>
            </div>
          )}
        </div>{/* /panel-der */}

        {/* ── Niebla ambiental ────────────────────────────────────── */}
        <NieblaTablero fase={fase} />

        {/* ══════════════════════════════════════════════════════════
            OVERLAYS — cubren todo el lienzo cuando están activos.
            Todos tienen zIndex: 50 y position: absolute; inset: 0.
        ══════════════════════════════════════════════════════════ */}

        {/* Overlay: Ritual del Culto */}
        {tablero?.accionEspecial?.tipo === 'ritual' && (() => {
          const carta = tablero.accionEspecial.carta;
          return (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,15,0.90)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', zIndex: 50, animation: 'aparecer 0.4s ease' }}>
              <div style={{ textAlign: 'center', maxWidth: '560px', padding: '0 32px' }}>
                <div style={{ fontSize: '88px', marginBottom: '12px', animation: 'flotar 3s ease-in-out infinite' }}>🐙</div>
                <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(76,175,80,0.55)', fontSize: '11px', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '16px' }}>
                  Levantamiento del Culto
                </p>
                <div style={{ background: 'rgba(76,175,80,0.07)', border: '2px solid rgba(76,175,80,0.28)', borderRadius: '14px', padding: '28px 40px', marginBottom: '22px', boxShadow: '0 0 60px rgba(76,175,80,0.18)' }}>
                  <div style={{ fontSize: '52px', marginBottom: '14px' }}>{TIPO_EMOJI_RITUAL[carta?.tipo] || '🐙'}</div>
                  <h2 style={{ fontFamily: 'var(--fuente-titulo)', color: '#4caf50', fontSize: '44px', letterSpacing: '5px', textShadow: '0 0 40px rgba(76,175,80,0.5)', marginBottom: '12px' }}>
                    {carta?.nombre || 'Ritual del Culto'}
                  </h2>
                  <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.48)', fontSize: '18px', lineHeight: 1.6 }}>
                    {carta?.descripcion || ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4caf50', animation: `pulsar-kraken 1.4s ease-in-out ${i*0.3}s infinite` }} />)}
                  <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.28)', fontSize: '13px', letterSpacing: '2px', marginLeft: '8px' }}>El Culto actúa en las sombras…</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Overlay: Sacrificio al Kraken */}
        {kraken && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,15,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', zIndex: 50, animation: 'aparecer 0.4s ease' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '96px', marginBottom: '18px', animation: 'flotar 2.5s ease-in-out infinite' }}>🌊</div>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.38)', fontSize: '14px', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '18px' }}>
                Sacrificio al Kraken
              </p>
              <h2 style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '50px', color: 'var(--crema-pergamino)', letterSpacing: '3px', marginBottom: '12px' }}>
                {kraken.nombre}
              </h2>
              {kraken.victoriaCultistas ? (
                <>
                  <p style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '34px', color: '#4caf50', letterSpacing: '2px', marginBottom: '18px' }}>🐙 ¡ERA EL CULTISTA!</p>
                  <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: '#4caf50', fontSize: '22px', letterSpacing: '3px', textShadow: '0 0 30px rgba(76,175,80,0.7)' }}>
                    ¡EL KRAKEN HA ENCONTRADO A SU ELEGIDO!
                  </p>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '28px', color: 'rgba(245,230,200,0.55)', letterSpacing: '2px' }}>
                  No era el Cultista — el juego continúa
                </p>
              )}
            </div>
          </div>
        )}

        {/* Overlay: Resultado de motín */}
        {motin && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,15,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 50, animation: 'aparecer 0.3s ease' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '96px', marginBottom: '18px', animation: 'flotar 2s ease-in-out infinite' }}>
                {motin.exitoso ? '💀' : '⚓'}
              </div>
              <h2 style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '58px', color: motin.exitoso ? '#ff8a8a' : 'var(--oro-dorado)', letterSpacing: '5px', textShadow: `0 0 40px ${motin.exitoso ? 'rgba(192,57,43,0.6)' : 'rgba(201,168,76,0.6)'}`, marginBottom: '14px' }}>
                {motin.exitoso ? '¡MOTÍN!' : 'MOTÍN FALLADO'}
              </h2>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.50)', fontSize: '20px', letterSpacing: '2px', marginBottom: motin.exitoso && motin.nuevoCapitan ? '12px' : 0 }}>
                {motin.totalPistolas} pistola{motin.totalPistolas !== 1 ? 's' : ''} / {motin.umbral} necesarias
              </p>
              {motin.exitoso && motin.nuevoCapitan && (
                <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)', fontSize: '24px', letterSpacing: '2px' }}>
                  Nuevo capitán: <strong>{motin.nuevoCapitan.nombre}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Overlay: La tripulación duerme */}
        {fase === 'durmiendo' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(5,9,20,0.45) 0%, transparent 100%)',
          }}>
            <div style={{ textAlign: 'center', animation: 'aparecer 1.2s ease' }}>
              <div style={{ fontSize: '96px', marginBottom: '26px', animation: 'flotar 4s ease-in-out infinite', filter: 'drop-shadow(0 0 24px rgba(120,160,220,0.55))' }}>🌙</div>
              <h2 style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--crema-pergamino)', fontSize: '46px', letterSpacing: '4px', marginBottom: '14px', textShadow: '0 2px 20px rgba(5,9,20,0.9)' }}>
                La tripulación se va a dormir
              </h2>
              <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.50)', fontSize: '20px', textShadow: '0 1px 12px rgba(5,9,20,0.8)' }}>
                Los piratas están abriéndose los ojos entre sí…
              </p>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.25)', fontSize: '11px', letterSpacing: '2px', marginTop: '24px', textTransform: 'uppercase' }}>
                El Host pulsa ▶ cuando estén listos
              </p>
            </div>
          </div>
        )}

        {/* Overlay: Victoria */}
        {fase === 'victoria' && (() => {
          const ganador       = tablero?.victoria;
          const rolesEquipo   = ROL_EQUIPO[ganador] || [];
          const equipoGanador = jugadores.filter(j => rolesEquipo.includes(j.rol));
          return (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,15,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '80px', animation: 'aparecer 0.8s ease', zIndex: 50 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '96px', marginBottom: '22px', animation: 'flotar 2s ease-in-out infinite' }}>
                  {ganador === 'piratas' ? '💀' : ganador === 'marineros' ? '⚓' : '🐙'}
                </div>
                <h1 style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '58px', color: 'var(--oro-dorado)', letterSpacing: '6px', textShadow: '0 0 60px rgba(201,168,76,0.8)', marginBottom: '8px' }}>
                  {ganador === 'piratas' ? 'VICTORIA PIRATA' : ganador === 'marineros' ? 'VICTORIA MARINERA' : '¡EL KRAKEN HA SIDO INVOCADO!'}
                </h1>
              </div>
              {equipoGanador.length > 0 && (
                <div style={{ animation: 'aparecer 1.2s ease', minWidth: '240px' }}>
                  <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(201,168,76,0.60)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '14px', textAlign: 'center' }}>
                    Equipo ganador
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {equipoGanador.map(j => (
                      <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 16px', background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '7px' }}>
                        <span style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'var(--crema-pergamino)', fontSize: '16px' }}>{j.nombre}</span>
                        <span style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.40)', fontSize: '11px' }}>{ROL_LABEL[j.rol] || j.rol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>{/* /lienzo 1920×1080 */}
    </div>   /* /viewport */
  );
}

/* ══════════════════════════════════════════════════════════════════════
   NIEBLA AMBIENTAL (sin cambios respecto al original)
══════════════════════════════════════════════════════════════════════ */
function NieblaTablero({ fase }) {
  const [estado, setEstado] = useState(fase === 'durmiendo' ? 'visible' : 'oculto');
  const prevFaseRef = useRef(fase);
  const timerRef    = useRef(null);

  useEffect(() => {
    const prev = prevFaseRef.current;
    prevFaseRef.current = fase;

    if (fase === 'durmiendo' && estado !== 'visible') {
      clearTimeout(timerRef.current);
      setEstado('visible');
    } else if (prev === 'durmiendo' && fase !== 'durmiendo') {
      setEstado('dispersando');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setEstado('oculto'), 3200);
    }
  }, [fase]); // eslint-disable-line

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (estado === 'oculto') return null;
  const dispersando = estado === 'dispersando';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 120% at 50% 50%, rgba(8,14,26,0.55) 0%, rgba(5,9,18,0.68) 100%)', transition: 'opacity 3s ease', opacity: dispersando ? 0 : 1 }} />
      <div style={{ position: 'absolute', inset: '-30%', background: 'radial-gradient(ellipse 72% 56% at 38% 62%, rgba(140,175,212,0.21) 0%, rgba(100,142,188,0.07) 55%, transparent 72%)', filter: 'blur(26px)', animation: dispersando ? 'niebla-dispersar 2.8s ease-out forwards' : 'niebla-deriva-1 20s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: '-30%', background: 'radial-gradient(ellipse 66% 50% at 64% 37%, rgba(158,196,222,0.16) 0%, rgba(118,158,192,0.06) 52%, transparent 70%)', filter: 'blur(32px)', animation: dispersando ? 'niebla-dispersar 2.5s ease-out 0.25s forwards' : 'niebla-deriva-2 27s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: '-30%', background: 'radial-gradient(ellipse 56% 40% at 50% 21%, rgba(202,222,240,0.11) 0%, transparent 65%)', filter: 'blur(18px)', animation: dispersando ? 'niebla-dispersar 2.1s ease-out 0.10s forwards' : 'niebla-deriva-3 15s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: '-30%', background: 'radial-gradient(ellipse 48% 38% at 55% 72%, rgba(10,100,80,0.08) 0%, transparent 65%)', filter: 'blur(22px)', animation: dispersando ? 'niebla-dispersar 3.0s ease-out 0.05s forwards' : 'niebla-deriva-1 24s ease-in-out 4s infinite' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   El tablero visual es el vídeo /tablero/tablero.mp4 (en bucle).
   La posición y tamaño se controlan desde POS.tablero en el bloque
   de configuración al inicio del archivo.
══════════════════════════════════════════════════════════════════════ */
