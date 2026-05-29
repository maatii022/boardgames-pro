import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAudio } from '../contextos/AudioContexto';
import SalaEspera from './SalaEspera';
import Modelo3D from '../components/tablero/Modelo3D';
import HexEditor from '../components/tablero/HexEditor';
import { HEX_POS, HEX_ADJ, HEX_FLECHAS } from '../data/hexMapa';

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
    left:   22,
    top:    14,
    width:  300,
    rowH:   70,       // ← alto de cada contenedor del panel (px) — todos usan el mismo valor
    // Assets del panel — cada panel es independiente del otro.
    // fondoImg → null = fondo semitransparente por defecto
    //            ruta = PNG como fondo (sustituye el glass effect)
    // marcoImg → null = sin overlay
    //            ruta = PNG encima del contenido (marco decorativo, pointer-events:none)
    fondoImg: null,   // p.ej. '/tablero/ui/panel-izq-fondo.png'
    marcoImg: null,   // p.ej. '/tablero/ui/panel-izq-marco.png'
  },

  // ── Panel derecho — mazo + última carta ──────────────────────────────
  panelDer: {
    left:  1580,
    top:    120,
    width:  300,
    mazoPilaW:    250,
    ultimaCartaW: 250,
    // Assets del panel — independientes del panel izquierdo.
    fondoImg: '/tablero/ui/panel-der-fondo.png',   // p.ej. '/tablero/ui/panel-der-fondo.png'
    marcoImg: null,   // p.ej. '/tablero/ui/panel-der-marco.png'
  },

  // ── Insignias de rol en la lista de jugadores ─────────────────────────
  //    Assets: /tablero/ui/insignia-capitan.png, insignia-teniente.png,
  //            insignia-navegante.png
  insignias: {
    size: 90,  // px — ancho de cada imagen de insignia
  },

  // ── Botones de control del host (sin header) ─────────────────────────
  //    Ancla: CENTRO del botón.
  //    Assets: /tablero/ui/boton-retroceder.png, boton-avanzar.png,
  //            boton-reiniciar.png, boton-salir.png
  controles: {
    botonRetroceder: { left: 1646, top: 38, size: 44 },
    botonAvanzar:    { left: 1700, top: 38, size: 44 },
    botonReiniciar:  { left: 1680, top: 40, size: 150 },
    botonSalir:      { left: 1820, top: 38, size: 150 },
  },

  // ── Modelos 3D ─────────────────────────────────────────────────────────
  //    Ancla: CENTRO del canvas (translate -50% -50%).
  //    left/top  → coords fijas en el lienzo 1920×1080; el escalado de
  //                pantalla lo gestiona el stage CSS — nunca cambian.
  //    size      → lado del canvas cuadrado en px (dentro del lienzo).
  //    escala    → multiplicador sobre el tamaño normalizado del modelo.
  //    camPos    → [x, y, z] posición de la cámara. Para buscar el ángulo
  //                ideal: controles: true → girar con ratón → leer coords
  //                de consola → copiarlas aquí → controles: false.
  //    controles → false = cámara fija + pointerEvents:none (producción).
  //                true  = OrbitControls activos (exploración de ángulo).
  //    visible   → true activa el slot; false lo oculta sin coste de render.
  //    Assets en /public/tablero/modelos/  (.glb)
  //    ✅  Deps: three + @react-three/fiber@8 + @react-three/drei@9
  modelos3d: {
    barco:      { left: 970,  top: 600, size: 1100, escala: 1, camPos: [-1.484, 4.302, 0.019], controles: false, visible: true  },  // sigue barco.hexId
    kraken:     { left: 960,  top: 572, size: 200, visible: false },  // casilla kraken_centro
    tentaculo1: { left: 840,  top: 480, size: 80,  visible: false },  // kraken_menor izq
    tentaculo2: { left: 1080, top: 480, size: 80,  visible: false },  // kraken_menor der
    lupa1:      { left: 760,  top: 572, size: 60,  visible: false },  // acción lupa 1
    lupa2:      { left: 960,  top: 410, size: 60,  visible: false },  // acción lupa 2
    lupa3:      { left: 1160, top: 572, size: 60,  visible: false },  // acción lupa 3
  },

  // ── Carteles de la Ceremonia de Equipo ────────────────────────────────
  //    Ancla: CENTRO de cada cartel (translate -50% -50%).
  //    left/top → posición en el lienzo 1920×1080 (px). Cambia para reposicionar.
  //    wImg     → ancho del asset PNG del cartel (px).
  //
  //    Distribución estándar:
  //       [capitán]          ← arriba, centro
  //    [teniente] [navegante] ← abajo, lados (pirámide)
  ceremonia: {
    capitan:   { left: 960,  top: 350, wImg: 700 },
    teniente:  { left: 620,  top: 715, wImg: 590 },
    navegante: { left: 1320, top: 715, wImg: 550 },
  },
};

/* ─── Modo debug ──────────────────────────────────────────────────────
   true  → contornos de colores en los elementos posicionables
   false → versión limpia final
────────────────────────────────────────────────────────────────────── */
const DEBUG = false;

/* ─── Editor de hexes ────────────────────────────────────────────────
   true  → abre el editor al cargar (se puede alternar con Shift+H)
   false → desactivado en producción
────────────────────────────────────────────────────────────────────── */
const DEV_HEX_EDITOR = false;

/* ─── Preview de desarrollo ──────────────────────────────────────────
   true  → tablero visible con datos de prueba (sin servidor)
   false → comportamiento normal en producción
────────────────────────────────────────────────────────────────────── */
const DEV_PREVIEW = false;

/* ─── Carta de navegación revelada ──────────────────────────────────
   Edita estos valores para ajustar la presentación de la carta.

   CARTA_NAV_MS  → milisegundos que permanece centrada antes de volar
   CARTA_NAV_W   → ancho del asset en px (alto escala automáticamente)
   CARTA_NAV_POS → posición en el viewport: left/top como string CSS
                   ('50vw' / '50vh' = centro de pantalla)
────────────────────────────────────────────────────────────────────── */
const CARTA_NAV_MS  = 5000;
const CARTA_NAV_W   = 280;
const CARTA_NAV_POS = { left: '50vw', top: '50vh' };

/* ─── Efecto de profundidad del tablero ──────────────────────────────
   Simula que el tablero está hundido dentro del marco.
   Edita estos valores hasta que el resultado te convenza.

   opacidad  → 0 = sin efecto · 1 = efecto completo
   gradiente → vignette radial (oscuro en borde, transparente en centro)
   sombra    → inset box-shadow (refuerza el borde más cercano)
────────────────────────────────────────────────────────────────────── */
const DEPTH = {
  opacidad: 1,
  // Vignette rectangular: 4 degradados lineales (uno por lado) superpuestos
  // — mismo enfoque que el QR del lobby, encaja con el marco cuadrado.
  gradiente: [
    'linear-gradient(to bottom, rgba(0,1,6,0.82) 0%, transparent 22%, transparent 78%, rgba(0,1,6,0.82) 100%)',
    'linear-gradient(to right,  rgba(0,1,6,0.72) 0%, transparent 22%, transparent 78%, rgba(0,1,6,0.72) 100%)',
  ].join(', '),
  sombra: [
    'inset 0   16px 50px rgba(0,0,0,0.65)',
    'inset 0  -16px 50px rgba(0,0,0,0.65)',
    'inset  16px 0  50px rgba(0,0,0,0.50)',
    'inset -16px 0  50px rgba(0,0,0,0.50)',
  ].join(', '),
};

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
    barco: { hexId: 'inicio', rotAngle: 0 },  // 0 rad = orientación base confirmada en 'inicio'
    ultimaCarta: {
      color: 'azul',
      nombre: 'Viento en Popa',
      descripcion: 'El barco avanza una casilla hacia el destino.',
    },
  },
};

/* ─── Condiciones de victoria ────────────────────────────────────────
   El barco llega a uno de estos hexes → el juego termina.
   Sincronizado con servidor/juego/tablero.js (VICTORIA_*).
────────────────────────────────────────────────────────────────────── */
const _VICTORIA_HEX = {
  'vp-1': 'piratas',   'vp-2': 'piratas',   'vp-3': 'piratas',
  'vm-1': 'marineros', 'vm-2': 'marineros', 'vm-3': 'marineros',
  'vc':   'cultistas',
};

/* ─── Movimiento del barco ────────────────────────────────────────────
   Devuelve el hexId destino, o null si el movimiento no es posible.
   La lógica de rotación vive en moverBarco() (dentro del componente).
────────────────────────────────────────────────────────────────────── */
const _COLOR_KEY = { adelante: 'amarillo', derecha: 'azul', izquierda: 'rojo' };

/**
 * Devuelve la ruta del asset PNG para una carta de navegación.
 * Archivos: carta-amarilla | carta-azul-borracho | carta-azul-desarmado
 *           carta-roja-borracho | carta-roja-sirena | carta-roja-telescopio
 *           carta-reverso
 */
function getCartaNavSrc(color, nombre = '') {
  const n = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const b = '/tablero/cartas-nav/';
  if (color === 'amarillo') return `${b}carta-amarilla.png`;
  if (color === 'azul') {
    if (n.includes('desarmado')) return `${b}carta-azul-desarmado.png`;
    return `${b}carta-azul-borracho.png`;         // Borracho (azul)
  }
  if (color === 'rojo') {
    if (n.includes('sirena'))     return `${b}carta-roja-sirena.png`;
    if (n.includes('telescopio')) return `${b}carta-roja-telescopio.png`;
    return `${b}carta-roja-borracho.png`;          // Borracho (rojo)
  }
  return `${b}carta-reverso.png`;
}

function calcularMovimiento(hexId, tipo, prevHexId) {
  const nuevoHex = HEX_FLECHAS[hexId]?.[_COLOR_KEY[tipo]];
  if (!nuevoHex)              return null;   // sin flecha asignada
  if (nuevoHex === prevHexId) return null;   // nunca marcha atrás
  return nuevoHex;
}

/* ─── Ángulo visual geométrico (radianes) ────────────────────────────
   Referencia ABSOLUTA: "recto hacia arriba en pantalla" = −π/2 = 0°.

   El tablero está diseñado de modo que:
     • Los movimientos de avance van ~recto hacia arriba (≈ −90°)
     • Los movimientos a la derecha van arriba-derecha        (≈ −30°)
     • Los movimientos a la izquierda van arriba-izquierda   (≈ −150°)

   Por eso la inclinación correcta es función del ángulo ABSOLUTO del
   movimiento en pantalla, no del ángulo relativo a la flecha amarilla.
   Esto resuelve los hexes con doble flecha (p.ej. 6-1 azul=amarillo=7-1):
   7-1 está arriba-derecha desde 6-1 → −45°, sea cual sea la carta.

   rel = moveAngle − (−π/2) = moveAngle + π/2
     ≈ 0        → destino recto arriba  → 0°
     > 0 (CW)   → destino arriba-der.   → −45°
     < 0 (CCW)  → destino arriba-izq.   → +45°
────────────────────────────────────────────────────────────────────── */
function computeTargetRot(hexId, nuevoHex) {
  const cur = HEX_POS[hexId];
  const dst = HEX_POS[nuevoHex];
  if (!cur || !dst) return 0;

  const moveAngle = Math.atan2(dst.top - cur.top, dst.left - cur.left);
  let rel = moveAngle + Math.PI / 2;          // relativo a "recto arriba"
  while (rel >  Math.PI) rel -= 2 * Math.PI;
  while (rel < -Math.PI) rel += 2 * Math.PI;

  if (Math.abs(rel) < 0.2) return 0;                        // recto → sin inclinación
  return rel > 0 ? -(Math.PI / 4) : (Math.PI / 4);          // CW=derecha | CCW=izquierda
}

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

// CER_POS y CER_IMG_W → fusionados en POS.ceremonia (ver bloque de configuración arriba)

/* ══════════════════════════════════════════════════════════════════════ */
export default function Tablero() {
  const { codigo } = useParams();
  const navigate   = useNavigate();
  const { emitir, escuchar, conectado, socketId } = useSocket();

  const [sala,      setSala]      = useState(DEV_PREVIEW ? MOCK.sala    : null);
  const [tablero,   setTablero]   = useState(DEV_PREVIEW ? MOCK.tablero : null);
  const [fase,      setFase]      = useState(DEV_PREVIEW ? MOCK.tablero.fase : 'lobby');
  const [error,     setError]     = useState('');
  const [motin,     setMotin]     = useState(null);
  const [kraken,    setKraken]    = useState(null);
  const [prevHexId,      setPrevHexId]      = useState(null);   // bloquear marcha atrás (DEV)
  const [barcoAnimPhase, setBarcoAnimPhase] = useState('idle'); // 'idle'|'rotating'|'moving'
  // Rotación gestionada siempre en el cliente (el servidor no envía rotAngle)
  const [barcoRotAngle,  setBarcoRotAngle]  = useState(0);
  const [devPanelOpen,   setDevPanelOpen]   = useState(true);  // panel DEV abierto/cerrado
  const [devPanelPos,    setDevPanelPos]    = useState(() => ({
    left: typeof window !== 'undefined' ? Math.max(0, window.innerWidth  - 402) : 900,
    top:  typeof window !== 'undefined' ? Math.max(0, window.innerHeight - 650) : 50,
  }));
  const devDragRef = useRef({ dragging: false, ox: 0, oy: 0 });

  // ── Ceremonia de equipo (capitán → pirámide → encogimiento) ────────────────
  // 'idle' | 'capitan' | 'equipo' | 'pre-shrink' | 'shrinking'
  const [ceremoniaStep,   setCeremoniaStep]   = useState('idle');
  const [ceremoniaDatos,  setCeremoniaDatos]  = useState({ capitan: '', teniente: '', navegante: '' });
  // Offsets de encogimiento: cuánto se desplaza cada cartel hasta la insignia (coords stage)
  const [cerShrinkOff, setCerShrinkOff] = useState({
    cap: { dx: 0, dy: 0 }, ten: { dx: 0, dy: 0 }, nav: { dx: 0, dy: 0 },
  });
  const stageRef      = useRef(null);         // ref al lienzo 1920×1080 (para coords)
  const insigniaRefs  = useRef({});           // { capitan, teniente, navegante } → <img>
  const sceneRef      = useRef({ x: 0, y: 0, s: 1 }); // siempre actualizado en render

  // ── Animación "carta de navegación revelada" ────────────────────────
  // cartaNav: la carta que está animándose (null = ninguna)
  // cartaNavPhase: 'idle' | 'visible' (7s centrada) | 'flying' (vuela al slot)
  // cartaNavTarget: posición viewport del slot de última carta (para flying)
  const [cartaNav,       setCartaNav]       = useState(null);
  const [cartaNavPhase,  setCartaNavPhase]  = useState('idle');
  const [cartaNavTarget, setCartaNavTarget] = useState({ left: '50vw', top: '50vh' });
  const ultimaCartaRef     = useRef(null);  // ref al <img> del slot de última carta
  const cartaNavTimerRef   = useRef(null);  // guard para clearTimeout en desmonte
  const mostrarCartaNavRef = useRef(null);  // acceso estable a mostrarCartaNav desde hooks pre-early-return
  const _prevCartaNavKey   = useRef(null);  // clave anterior de ultimaCarta (para detectar cambio)

  /* ── Refs para la animación del barco ──────────────────────────────── */
  const ROTACION_MS   = 380;
  const MOVIMIENTO_MS = 1400;
  // hexId previo para computar rotación al recibir actualizaciones del servidor
  const prevBarcoHexRef = useRef(null);
  // Evita doble-disparo cuando los botones DEV mueven el barco
  const devMoveRef      = useRef(false);

  /* ── Animación del barco cuando el SERVIDOR mueve la posición ──────── */
  useEffect(() => {
    const nuevoHex = tablero?.barco?.hexId;
    if (!nuevoHex) return;

    const hexAnterior = prevBarcoHexRef.current;
    prevBarcoHexRef.current = nuevoHex;

    // Sin movimiento real o movimiento ya gestionado por botones DEV
    if (!hexAnterior || hexAnterior === nuevoHex) return;
    if (devMoveRef.current) { devMoveRef.current = false; return; }

    const targetRot = computeTargetRot(hexAnterior, nuevoHex);
    const debeRotar = Math.abs(barcoRotAngle - targetRot) > 0.001;

    const finalizarProd = () => {
      setBarcoAnimPhase('idle');
    };

    if (debeRotar) {
      setBarcoAnimPhase('rotating');
      setBarcoRotAngle(targetRot);
      setTimeout(() => {
        setBarcoAnimPhase('moving');
        setTimeout(finalizarProd, MOVIMIENTO_MS);
      }, ROTACION_MS);
    } else {
      setBarcoAnimPhase('moving');
      setTimeout(finalizarProd, MOVIMIENTO_MS);
    }
  }, [tablero?.barco?.hexId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Movimiento por botones DEV (solo en DEV_PREVIEW) ──────────────── */
  function moverBarco(tipo) {
    if (barcoAnimPhase !== 'idle') return;
    if (!tablero?.barco) return;
    if (fase === 'victoria')       return;

    const { hexId } = tablero.barco;
    const nuevoHex  = calcularMovimiento(hexId, tipo, prevHexId);
    if (!nuevoHex) return;

    const targetRot = computeTargetRot(hexId, nuevoHex);
    const debeRotar = Math.abs(barcoRotAngle - targetRot) > 0.001;

    const finalizarMovimiento = () => {
      const ganador = _VICTORIA_HEX[nuevoHex] ?? null;
      if (ganador) {
        setFase('victoria');
        setTablero(prev => ({ ...prev, victoria: ganador }));
      }
      setBarcoAnimPhase('idle');
    };

    // Marcar como movimiento DEV para que el useEffect no lo duplique
    devMoveRef.current = true;

    if (debeRotar) {
      setBarcoAnimPhase('rotating');
      setBarcoRotAngle(targetRot);
      // Solo actualizamos hexId (sin rotAngle — está en barcoRotAngle)
      setTimeout(() => {
        setBarcoAnimPhase('moving');
        setPrevHexId(hexId);
        setTablero(prev => ({ ...prev, barco: { ...prev.barco, hexId: nuevoHex } }));
        setTimeout(finalizarMovimiento, MOVIMIENTO_MS);
      }, ROTACION_MS);
    } else {
      setBarcoAnimPhase('moving');
      setPrevHexId(hexId);
      setTablero(prev => ({ ...prev, barco: { ...prev.barco, hexId: nuevoHex } }));
      setTimeout(finalizarMovimiento, MOVIMIENTO_MS);
    }
  }

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

  /* ── Editor de hexes ─────────────────────────────────────────────── */
  const [hexEditorOpen, setHexEditorOpen] = useState(DEV_HEX_EDITOR);
  useEffect(() => {
    const down = (e) => {
      if ((e.key === 'H' || e.key === 'h') && e.shiftKey)
        setHexEditorOpen(v => !v);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
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

  /* ── Hooks de producción — ANTES de los early returns ─────────────
     React exige que los hooks se llamen SIEMPRE en el mismo orden.
     Moverlos aquí evita el crash "Rendered more hooks than during
     previous render" que ocurre cuando sala===null hace el early return
     antes de que estos hooks se registren.                           ── */

  // Trigger de ceremonia (capitán / pirámide)
  useEffect(() => {
    if (DEV_PREVIEW) return;
    const jug = tablero?.jugadores || sala?.jugadores || [];
    const cap = jug.find(j => j.esCapitan);
    const ten = jug.find(j => j.esTeniente);
    const nav = jug.find(j => j.esNavegante);
    if (fase === 'fase_1' && cap) {
      setCeremoniaDatos({ capitan: cap.nombre, teniente: '', navegante: '' });
      setCeremoniaStep('capitan');
    } else if (fase === 'fase_2' && cap && ten && nav) {
      setCeremoniaDatos({ capitan: cap.nombre, teniente: ten.nombre, navegante: nav.nombre });
      setCeremoniaStep('equipo');
    } else if (fase !== 'fase_1' && fase !== 'fase_2') {
      setCeremoniaStep('idle');
    }
  }, [fase, tablero?.capitanIdx]); // eslint-disable-line

  // Auto-trigger animación carta nav cuando ultimaCarta cambia (producción)
  useEffect(() => {
    if (DEV_PREVIEW) return;
    const c = tablero?.ultimaCarta;
    if (!c) { _prevCartaNavKey.current = null; return; }
    const key = `${c.color}|${c.nombre}`;
    if (_prevCartaNavKey.current !== null && key !== _prevCartaNavKey.current) {
      mostrarCartaNavRef.current?.(c);  // mostrarCartaNav se asigna al ref más abajo
    }
    _prevCartaNavKey.current = key;
  }, [tablero?.ultimaCarta?.nombre, tablero?.ultimaCarta?.color]); // eslint-disable-line

  // Cleanup timer al desmontar — aquí (antes de early returns) para respetar la regla de hooks
  useEffect(() => () => clearTimeout(cartaNavTimerRef.current), []);

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

  // Actualiza sceneRef en cada render para que iniciarShrinking tenga los valores actuales
  sceneRef.current = scene;

  /**
   * Inicia la animación de encogimiento:
   * los carteles vuelan hasta la posición de cada insignia en el panel izquierdo.
   * Los offsets dx/dy son en coordenadas del lienzo (1920×1080).
   */
  const iniciarShrinking = () => {
    const s      = sceneRef.current.s;
    const stageEl = stageRef.current;

    const getOff = (cerPosKey, insKey) => {
      const insEl = insigniaRefs.current[insKey];
      if (!insEl || !stageEl) return { dx: 0, dy: 0 };
      const ir = insEl.getBoundingClientRect();
      const sr = stageEl.getBoundingClientRect();
      // Centro de la insignia en coords del lienzo
      const targetLeft = (ir.left + ir.width  / 2 - sr.left) / s;
      const targetTop  = (ir.top  + ir.height / 2 - sr.top)  / s;
      return {
        dx: targetLeft - POS.ceremonia[cerPosKey].left,
        dy: targetTop  - POS.ceremonia[cerPosKey].top,
      };
    };

    setCerShrinkOff({
      cap: getOff('capitan',   'capitan'),
      ten: getOff('teniente',  'teniente'),
      nav: getOff('navegante', 'navegante'),
    });
    // 'pre-shrink': un frame estático SIN animación activa.
    // Sirve de estado "before" para que la CSS transition del siguiente frame
    // encuentre un punto de partida claro (resuelve el conflicto con fill-mode:both).
    setCeremoniaStep('pre-shrink');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setCeremoniaStep('shrinking');
      setTimeout(() => setCeremoniaStep('idle'), 1200);
    }));
  };

  /* ── mostrarCartaNav: muestra la carta CARTA_NAV_MS centrada y luego la vuela al slot ── */
  const mostrarCartaNav = (carta) => {
    if (cartaNavTimerRef.current) clearTimeout(cartaNavTimerRef.current);
    setCartaNav(carta);
    setCartaNavPhase('visible');
    cartaNavTimerRef.current = setTimeout(() => {
      // getBoundingClientRect funciona correctamente dentro de transform:scale
      const el   = ultimaCartaRef.current;
      const rect = el ? el.getBoundingClientRect() : null;
      const tgt  = rect
        ? { left: `${rect.left + rect.width  / 2}px`, top: `${rect.top  + rect.height / 2}px` }
        : { left: `${window.innerWidth - 120}px`,     top: `${window.innerHeight * 0.65}px`   };
      setCartaNavTarget(tgt);
      // 32ms: un frame para que React aplique cartaNavTarget antes de activar la transición CSS
      setTimeout(() => {
        setCartaNavPhase('flying');
        cartaNavTimerRef.current = setTimeout(() => {
          setTablero(prev => ({ ...prev, ultimaCarta: carta }));
          setCartaNav(null);
          setCartaNavPhase('idle');
        }, 950);
      }, 32);
    }, CARTA_NAV_MS);
  };

  // Asignar mostrarCartaNav al ref para que el hook pre-early-return pueda invocarlo
  mostrarCartaNavRef.current = mostrarCartaNav;

  /* ── overlayActivo: cualquier overlay de pantalla completa está activo ── */
  // Usado para oscurecer el barco (zIndex 7, fuera del stage) desde el viewport
  // overlayActivo: TRUE cuando cualquier overlay de pantalla completa está activo.
  // - Oscurece el barco (directamente via opacity/filter, fuera del stage)
  // - Activa la capa z=40 dentro del stage que oscurece el fondo/paneles
  const overlayActivo = !!(
    ceremoniaStep !== 'idle'                   ||
    tablero?.accionEspecial?.tipo === 'ritual' ||
    kraken                                     ||
    motin                                      ||
    fase === 'victoria'                        ||
    fase === 'durmiendo'                       ||
    cartaNavPhase !== 'idle'
  );

  /* ── Arrastrar panel DEV ─── */
  const onDevDragStart = (e) => {
    if (e.button !== 0) return;   // solo botón izquierdo
    e.preventDefault();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    devDragRef.current = { dragging: true, ox: e.clientX - rect.left, oy: e.clientY - rect.top };
    const onMove = (ev) => {
      if (!devDragRef.current.dragging) return;
      setDevPanelPos({
        left: Math.max(0, Math.min(window.innerWidth  - 390, ev.clientX - devDragRef.current.ox)),
        top:  Math.max(0, Math.min(window.innerHeight -  40, ev.clientY - devDragRef.current.oy)),
      });
    };
    const onUp = () => {
      devDragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  };

  /* ── Estilos mini para el panel DEV ─── */
  const _btnMini   = { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: 'rgba(245,230,200,0.7)', padding: '2px 7px', cursor: 'pointer', fontSize: 12 };
  const _btnEvento = { background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11 };

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
      <div ref={stageRef} style={{
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
        {/* Wrapper: solo posicionamiento — permite que marcoImg cubra el contenido */}
        <div style={{
          position: 'absolute',
          left:     `${POS.panelIzq.left}px`,
          top:      `${POS.panelIzq.top}px`,
          width:    `${POS.panelIzq.width}px`,
          maxHeight: `${1080 - POS.panelIzq.top - 18}px`,
          zIndex:   10,
          ...dbg('rgba(255,165,0,0.7)'),
        }}>
        {/* Panel interior: fondo + contenido scrollable */}
        <div
          style={{
            position: 'relative',
            width:    '100%',
            display:  'flex',
            flexDirection: 'column',
            gap:      '8px',
            padding:  '12px 11px',
            background: POS.panelIzq.fondoImg
              ? `url('${POS.panelIzq.fondoImg}') center/cover no-repeat`
              : 'rgba(4,6,13,0.80)',
            border:         POS.panelIzq.fondoImg ? 'none' : '1px solid rgba(201,168,76,0.13)',
            borderRadius:   '10px',
            backdropFilter: POS.panelIzq.fondoImg ? 'none' : 'blur(14px)',
            boxShadow:      POS.panelIzq.fondoImg ? 'none' : '0 8px 48px rgba(0,0,0,0.60), inset 0 1px 0 rgba(201,168,76,0.07)',
            overflowY: 'auto',
            maxHeight: `${1080 - POS.panelIzq.top - 18}px`,
          }}
        >
          {/* ── Capitán ──────────────────────────────────────────── */}
          {capitan ? (
            <div style={{
              height: `${POS.panelIzq.rowH}px`,
              padding: '0 13px',
              boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(201,168,76,0.09) 0%, rgba(201,168,76,0.04) 100%)',
              border: '1px solid rgba(201,168,76,0.22)',
              borderRadius: '7px',
              boxShadow: '0 0 22px rgba(201,168,76,0.07), inset 0 1px 0 rgba(201,168,76,0.09)',
            }}>
              <p style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'rgba(204, 166, 63, 0.68)',
                fontSize: '20px', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', fontWeight: 700,
                marginBottom: '4px', lineHeight: 1,
              }}>
                &nbsp;Capitán
              </p>
              <p style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'var(--crema-pergamino)',
                fontSize: '32px', letterSpacing: '0.4px', textAlign: 'center', fontWeight: 700,
                lineHeight: 1,
              }}>
                {capitan.nombre}
              </p>
            </div>
          ) : (
            <div style={{
              height: `${POS.panelIzq.rowH}px`,
              padding: '0 13px',
              boxSizing: 'border-box',
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '7px',
            }}>
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
          {/* Todos los contenedores son width:100% del panel → mismo ancho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {jugadores.map((j, i) => (
              <div key={j.id || i} style={{
                width: '100%',
                opacity:    j.fueraDeServicio ? 0.32 : j.conectado === false ? 0.42 : 1,
                transition: 'opacity 0.3s ease',
              }}>

                {/* ── Tarjeta del jugador (mismo ancho y alto que el resto) ── */}
                <div style={{
                  width: '100%',
                  height: `${POS.panelIzq.rowH}px`,
                  padding: '0 10px',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center',
                  background: j.esCapitan
                    ? 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)'
                    : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${j.esCapitan ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '100%' }}>
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

                    {/* Insignias + currículos — todo dentro de la tarjeta */}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>

                      {/* Insignia capitán: div siempre visible (emoji fallback) + img encima */}
                      {j.esCapitan && (
                        <div ref={el => { insigniaRefs.current.capitan = el; }}
                          style={{ width: `${POS.insignias.size}px`, height: `${POS.insignias.size}px`,
                                   position: 'relative', display: 'flex', alignItems: 'center',
                                   justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: `${POS.insignias.size * 0.75}px`, lineHeight: 1, position: 'relative', zIndex: 0 }}></span>
                          <img src="/tablero/ui/insignia-capitan.png" draggable={false}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                                     objectFit: 'contain', zIndex: 1 }} />
                        </div>
                      )}

                      {/* Insignia teniente */}
                      {j.esTeniente && (
                        <div ref={el => { insigniaRefs.current.teniente = el; }}
                          style={{ width: `${POS.insignias.size}px`, height: `${POS.insignias.size}px`,
                                   position: 'relative', display: 'flex', alignItems: 'center',
                                   justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: `${POS.insignias.size * 0.75}px`, lineHeight: 1, position: 'relative', zIndex: 0 }}></span>
                          <img src="/tablero/ui/insignia-teniente.png" draggable={false}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                                     objectFit: 'contain', zIndex: 1 }} />
                        </div>
                      )}

                      {/* Insignia navegante */}
                      {j.esNavegante && (
                        <div ref={el => { insigniaRefs.current.navegante = el; }}
                          style={{ width: `${POS.insignias.size}px`, height: `${POS.insignias.size}px`,
                                   position: 'relative', display: 'flex', alignItems: 'center',
                                   justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: `${POS.insignias.size * 0.75}px`, lineHeight: 1, position: 'relative', zIndex: 0 }}></span>
                          <img src="/tablero/ui/insignia-navegante.png" draggable={false}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                                     objectFit: 'contain', zIndex: 1 }} />
                        </div>
                      )}

                      {j.fueraDeServicio && <span style={{ fontSize: '16px', opacity: 0.6 }}>😴</span>}

                      {/* Badge de currículos — ahora dentro de la tarjeta */}
                      {j.curriculos > 0 && (
                        <div style={{
                          background: 'rgba(201,168,76,0.13)',
                          border: '1px solid rgba(201,168,76,0.30)',
                          borderRadius: '5px',
                          padding: '2px 6px',
                          fontFamily: 'var(--fuente-subtitulo)',
                          color: 'rgba(245,220,160,0.78)',
                          fontSize: '11px',
                          letterSpacing: '0.3px',
                          whiteSpace: 'nowrap',
                        }}>
                          📜 {j.curriculos}
                        </div>
                      )}

                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>{/* /panel-izq interior */}
        {/* Marco decorativo encima del contenido — pointer-events:none */}
        {POS.panelIzq.marcoImg && (
          <img src={POS.panelIzq.marcoImg} alt="" draggable={false}
            onError={e => { e.currentTarget.style.display = 'none'; }}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
              borderRadius: '10px',
              zIndex: 2,
            }}
          />
        )}
        </div>{/* /panel-izq wrapper */}

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

        {/* ── Efecto de profundidad — tablero "hundido" en el marco ──
            Vignette circular sobre el vídeo del tablero.
            Ajusta la constante DEPTH (arriba del archivo) para editar.
        ─────────────────────────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          left:          `${POS.tablero.left}px`,
          top:           `${POS.tablero.top}px`,
          width:         `${POS.tablero.width}px`,
          height:        `${POS.tablero.height}px`,
          transform:     'translate(-50%, -50%)',
          zIndex:        5,          // mismo z que el vídeo → DOM order lo pone encima
          // sin borderRadius → forma cuadrada, encaja con el marco
          background:    DEPTH.gradiente,
          boxShadow:     DEPTH.sombra,
          opacity:       DEPTH.opacidad,
          pointerEvents: 'none',
        }} />

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

        {/* Barco: renderizado fuera del stage — ver slot debajo del /lienzo */}

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
        {/* Wrapper: solo posicionamiento */}
        <div style={{
          position: 'absolute',
          left:     `${POS.panelDer.left}px`,
          top:      `${POS.panelDer.top}px`,
          width:    `${POS.panelDer.width}px`,
          maxHeight: `${1080 - POS.panelDer.top - 18}px`,
          zIndex:   10,
          ...dbg('rgba(160,80,240,0.7)'),
        }}>
        {/* Panel interior */}
        <div
          style={{
            position: 'relative',
            width:    '100%',
            display:  'flex',
            flexDirection: 'column',
            gap:      '8px',
            padding:  '12px 11px',
            background: POS.panelDer.fondoImg
              ? `url('${POS.panelDer.fondoImg}') center/cover no-repeat`
              : 'rgba(4,6,13,0.80)',
            border:         POS.panelDer.fondoImg ? 'none' : '1px solid rgba(201,168,76,0.13)',
            borderRadius:   '10px',
            backdropFilter: POS.panelDer.fondoImg ? 'none' : 'blur(14px)',
            boxShadow:      POS.panelDer.fondoImg ? 'none' : '0 8px 48px rgba(0,0,0,0.60), inset 0 1px 0 rgba(201,168,76,0.07)',
            overflowY: 'auto',
            maxHeight: `${1080 - POS.panelDer.top - 18}px`,
          }}
        >
          {/* ── MAZO — reverso apilado + contador ───────────────── */}
          {tablero && (
            <div style={{ padding: '12px 10px 16px', textAlign: 'center' }}>
              

              {/* Cartas apiladas */}
              <div style={{ position: 'relative', width: `${POS.panelDer.mazoPilaW}px`, margin: '0 auto' }}>
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
                  width: '52px', height: '52px',
                  background: 'rgba(4,6,13,0.92)',
                  border: `1px solid ${tablero.mazoDisponibleCount === 0 ? 'rgba(255,100,100,0.50)' : 'rgba(201,168,76,0.42)'}`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--fuente-ui)',
                  fontSize: '23px',
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
            
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.15))' }} />
            </div>
          )}

          {/* ── ÚLTIMA CARTA — asset por color ──────────────────── */}
          {tablero?.ultimaCarta && (() => {
            const c = tablero.ultimaCarta;
            const COL_GLOW = {
              azul:     'rgba(48,138,240,0.72)',   // halo azul eléctrico
              rojo:     'rgba(215,48,38,0.72)',    // halo rojo vivo
              amarillo: 'rgba(201,168,76,0.50)',   // halo dorado (ya estaba bien)
            };
            return (
              <div style={{ padding: '8px 10px 14px', textAlign: 'center' }}>
                <img
                  ref={ultimaCartaRef}
                  src={getCartaNavSrc(c.color, c.nombre)}
                  alt={c.nombre}
                  draggable={false}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                  style={{
                    width: `${POS.panelDer.ultimaCartaW}px`,
                    display: 'inline-block',
                    borderRadius: '7px',
                    boxShadow: `0 6px 24px rgba(0,0,0,0.55), 0 0 26px ${COL_GLOW[c.color] || 'rgba(201,168,76,0.30)'}, 0 0 8px ${COL_GLOW[c.color] || 'rgba(201,168,76,0.20)'}`,
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
        </div>{/* /panel-der interior */}
        {POS.panelDer.marcoImg && (
          <img src={POS.panelDer.marcoImg} alt="" draggable={false}
            onError={e => { e.currentTarget.style.display = 'none'; }}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
              borderRadius: '10px',
              zIndex: 2,
            }}
          />
        )}
        </div>{/* /panel-der wrapper */}

        {/* ── Niebla ambiental ────────────────────────────────────── */}
        <NieblaTablero fase={fase} />

        {/* ── Oscurecimiento de fondo cuando hay evento activo ────────
            z=40: encima del tablero/paneles, debajo de los overlays (z=50).
            El barco (fuera del stage) se oscurece directamente via opacity. */}
        {overlayActivo && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 40,
            background: 'rgba(4,6,13,0.78)',
            pointerEvents: 'none',
            animation: 'aparecer 0.35s ease',
          }} />
        )}

        {/* ══════════════════════════════════════════════════════════
            OVERLAYS — cubren todo el lienzo cuando están activos.
            Todos tienen zIndex: 50 y position: absolute; inset: 0.
        ══════════════════════════════════════════════════════════ */}

        {/* ══════════════════════════════════════════════════════════
            OVERLAY DE CEREMONIA — capitán / equipo / encogimiento
            z=50 pero DOM-antes que los overlays de eventos (ritual,
            kraken, motín…) para que estos pinten encima si coinciden.
        ══════════════════════════════════════════════════════════ */}
        {ceremoniaStep !== 'idle' && (() => {
          // 'pre-shrink' debe mostrarse igual que 'equipo' (pirámide visible, sin animación).
          // 'shrinking' activa la transición de vuelo hacia las insignias.
          const isEquipo    = ceremoniaStep === 'equipo' || ceremoniaStep === 'pre-shrink' || ceremoniaStep === 'shrinking';
          const isShrinking = ceremoniaStep === 'shrinking';

          // Estilo de cada cartel en el lienzo
          const cartelStyle = (posKey, shrinkKey) => {
            // Parámetros de animación por cartel para el encogimiento
            const SHRINK_PARAMS = {
              cap: { delay: '0.00s', rot:  '6deg'  },
              ten: { delay: '0.10s', rot: '-14deg' },
              nav: { delay: '0.06s', rot:  '14deg' },
            };

            const pos = POS.ceremonia[posKey];
            const off = isShrinking ? cerShrinkOff[shrinkKey] : { dx: 0, dy: 0 };
            const sp  = SHRINK_PARAMS[shrinkKey];
            return {
              position:        'absolute',
              left:            `${pos.left}px`,
              top:             `${pos.top}px`,
              // Transición siempre definida para que el cambio de transform anime suavemente
              transition:      `transform 1.0s cubic-bezier(0.35,0,0.15,1) ${sp.delay},
                                opacity   0.75s ease ${sp.delay}`,
              transform:       isShrinking
                ? `translate(-50%,-50%) translate(${off.dx}px,${off.dy}px) scale(0.07) rotate(${sp.rot})`
                : 'translate(-50%,-50%) scale(1)',
              opacity:         isShrinking ? 0 : 1,
              textAlign:       'center',
              zIndex:          52,
              pointerEvents:   'none',
            };
          };

          return (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 50,
              background: 'rgba(4,6,13,0.90)',
              backdropFilter: 'blur(7px)',
            }}>

              {/* ── Halo dorado de fondo ── */}
              <div style={{
                position: 'absolute', left: '960px', top: '490px',
                width: '800px', height: '550px', borderRadius: '50%',
                transform: 'translate(-50%,-50%)',
                background: 'radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 68%)',
                filter: 'blur(44px)', pointerEvents: 'none',
              }} />

              {/* ── Cartel CAPITÁN ── */}
              <div style={{
                ...cartelStyle('capitan', 'cap'),
                // Solo anima la entrada en el step 'capitan'.
                // En 'equipo', 'pre-shrink' y 'shrinking' la transform viene de cartelStyle.
                animation: ceremoniaStep === 'capitan' ? 'ceremon-entrada 0.65s cubic-bezier(0.2,0.8,0.3,1) both' : 'none',
              }}>
                <img
                  src="/tablero/insignias/cartel-capitan.png" alt="Capitán"
                  draggable={false} onError={e => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: `${POS.ceremonia.capitan.wImg}px`, display: 'block', margin: '0 auto 4px' }}
                />
                <p style={{
                  fontFamily: 'var(--fuente-titulo)', color: 'var(--oro-dorado)', 
                  fontSize: '54px', letterSpacing: '4px',
                  textShadow: '0 0 50px rgba(201,168,76,0.55)', marginTop: '-15px',
                }}>
                  {ceremoniaDatos.capitan}
                </p>
              </div>

              {/* ── Cartel TENIENTE (pirámide) ── */}
              {isEquipo && (
                <div style={{
                  ...cartelStyle('teniente', 'ten'),
                  animation: ceremoniaStep === 'equipo' ? 'ceremon-entrada 0.60s cubic-bezier(0.2,0.8,0.3,1) 0.15s both' : 'none',
                }}>
                  <img
                    src="/tablero/insignias/cartel-teniente.png" alt="Teniente"
                    draggable={false} onError={e => { e.currentTarget.style.display = 'none'; }}
                    style={{ width: `${POS.ceremonia.teniente.wImg}px`, display: 'block', margin: '0 auto 4px' }}
                  />
                  <p style={{
                    fontFamily: 'var(--fuente-titulo)', color: 'var(--crema-pergamino)',
                    fontSize: '40px', letterSpacing: '2px', marginTop: '-50px',
                  }}>
                    {ceremoniaDatos.teniente}
                  </p>
                </div>
              )}

              {/* ── Cartel NAVEGANTE (pirámide) ── */}
              {isEquipo && (
                <div style={{
                  ...cartelStyle('navegante', 'nav'),
                  animation: ceremoniaStep === 'equipo' ? 'ceremon-entrada 0.60s cubic-bezier(0.2,0.8,0.3,1) 0.28s both' : 'none',
                }}>
                  <img
                    src="/tablero/insignias/cartel-navegante.png" alt="Navegante"
                    draggable={false} onError={e => { e.currentTarget.style.display = 'none'; }}
                    style={{ width: `${POS.ceremonia.navegante.wImg}px`, display: 'block', margin: '0 auto 4px' }}
                  />
                  <p style={{
                    fontFamily: 'var(--fuente-titulo)', color: 'var(--crema-pergamino)',
                    fontSize: '40px', letterSpacing: '2px', marginTop: '-35px',
                  }}>
                    {ceremoniaDatos.navegante}
                  </p>
                </div>
              )}

            </div>
          );
        })()}

        {/* Overlay: Ritual del Culto */}
        {tablero?.accionEspecial?.tipo === 'ritual' && (() => {
          const carta = tablero.accionEspecial.carta;
          // Mapeo tipo → nombre real del fichero en /public/tablero/cartas-ritual/
          const _RITUAL_SRC = {
            alijo_armas:       '/tablero/cartas-ritual/alijo-de-armas.png',
            conversion_culto:  '/tablero/cartas-ritual/conversion-al-culto.png',
            registro_camarote: '/tablero/cartas-ritual/registro-de-camarote.png',
          };
          const cartaRitualSrc = _RITUAL_SRC[carta?.tipo] ?? '/tablero/cartas-ritual/carta-reverso-ritual.png';
          return (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,15,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', zIndex: 50, animation: 'aparecer 0.4s ease' }}>
              <div style={{ textAlign: 'center', maxWidth: '480px', padding: '0 24px' }}>

                {/* ── Subtítulo tipo evento ── */}
                <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(76,175,80,0.55)', fontSize: '11px', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Levantamiento del Culto
                </p>

                {/* ── Título de la carta ── */}
                <h2 style={{ fontFamily: 'var(--fuente-titulo)', color: '#4caf50', fontSize: '38px', letterSpacing: '4px', textShadow: '0 0 30px rgba(76,175,80,0.5)', marginBottom: '20px', lineHeight: 1.1 }}>
                  {carta?.nombre || 'Ritual del Culto'}
                </h2>

                {/* ── Asset de la carta (flotando) ── */}
                <div style={{ width: '260px', margin: '0 auto 18px', animation: 'flotar 3.5s ease-in-out infinite' }}>
                  <img
                    src={cartaRitualSrc}
                    alt={carta?.nombre || 'Carta del Culto'}
                    draggable={false}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                    style={{
                      width: '100%', borderRadius: '14px', display: 'block',
                      boxShadow: '0 12px 60px rgba(0,0,0,0.7), 0 0 50px rgba(76,175,80,0.35)',
                    }}
                  />
                </div>

                {/* ── Descripción de la carta ── */}
                {carta?.descripcion && (
                  <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.55)', fontSize: '17px', lineHeight: 1.6, marginBottom: '22px' }}>
                    {carta.descripcion}
                  </p>
                )}

                {/* ── Indicador de espera — el móvil vibra en ~7s ── */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#4caf50', animation: `pulsar-kraken 1.4s ease-in-out ${i*0.3}s infinite` }} />)}
                  <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.25)', fontSize: '12px', letterSpacing: '2px', marginLeft: '6px' }}>
                    Cerrad los ojos — el Cultista actúa en las sombras…
                  </p>
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
            position: 'absolute', inset: 0, zIndex: 50,
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

        {/* Overlay: Victoria
            No mostrar si el overlay del Kraken cultista ya está activo —
            ese overlay muestra su propio mensaje de victoria. */}
        {fase === 'victoria' && !kraken?.victoriaCultistas && (() => {
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

{/* overlay externo eliminado — ver capa interna del stage y dimming directo del barco */}

      {/* ══════════════════════════════════════════════════════════════
          CARTA DE NAVEGACIÓN REVELADA — animación de 7s centrada
          y luego vuela hacia el slot de "última carta".
          Vive fuera del stage para evitar el transform:scale.
      ══════════════════════════════════════════════════════════════ */}
      {cartaNavPhase !== 'idle' && cartaNav && (() => {
        const isFlying = cartaNavPhase === 'flying';
        return (
          <div style={{
            position:   'fixed',
            zIndex:     15,
            left:       isFlying ? cartaNavTarget.left : CARTA_NAV_POS.left,
            top:        isFlying ? cartaNavTarget.top  : CARTA_NAV_POS.top,
            transform:  `translate(-50%, -50%) scale(${isFlying ? 0.28 : 1})`,
            opacity:    isFlying ? 0 : 1,
            transition: isFlying
              ? 'left 0.90s cubic-bezier(0.4,0,0.2,1), top 0.90s cubic-bezier(0.4,0,0.2,1), transform 0.90s cubic-bezier(0.4,0,0.2,1), opacity 0.70s ease'
              : 'none',
            pointerEvents: 'none',
          }}>
            {(() => {
              const CARTA_GLOW = {
                azul:     'rgba(48,138,240,0.65)',
                rojo:     'rgba(215,48,38,0.65)',
                amarillo: 'rgba(201,168,76,0.45)',
              };
              const glow = CARTA_GLOW[cartaNav.color] || CARTA_GLOW.amarillo;
              return (
            <img
              src={getCartaNavSrc(cartaNav.color, cartaNav.nombre)}
              alt={cartaNav.nombre || ''}
              draggable={false}
              onError={e => { e.currentTarget.style.opacity = '0.3'; }}
              style={{
                width:        CARTA_NAV_W,
                display:      'block',
                borderRadius: 14,
                boxShadow:    `0 24px 80px rgba(0,0,0,0.85), 0 0 55px ${glow}, 0 0 18px ${glow}`,
                userSelect:   'none',
              }}
            />
              );
            })()}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
          MODELOS 3D — fuera del lienzo CSS-transformado.
          Los Canvas WebGL (R3F) no pueden vivir dentro de un
          contenedor con transform:scale porque miden su tamaño
          con getBoundingClientRect() y obtienen las dimensiones
          ya escaladas → el contenido 3D se desplaza.
          Solución: colocarlos en el viewport (sin transform) y
          calcular left/top/size directamente en coordenadas de
          pantalla usando el mismo `scene` que usa el stage.

          ┌──────────────────────────────────────────────────────────┐
          │  screenLeft = scene.x + pos.left * scene.s              │
          │  screenTop  = scene.y + pos.top  * scene.s              │
          │  screenSize = Math.round(pos.size * scene.s)            │
          └──────────────────────────────────────────────────────────┘
      ══════════════════════════════════════════════════════════════ */}

      {/* ── Editor de hexes (Shift+H para abrir/cerrar) ──────────── */}
      {hexEditorOpen && (
        <HexEditor scene={scene} onClose={() => setHexEditorOpen(false)} />
      )}

      {/* ── Barco pirata ─────────────────────────────────────────── */}
      {POS.modelos3d.barco.visible && (() => {
        // Posición: HEX_POS[hexId] si existe, si no fallback a POS
        const bHexId    = tablero?.barco?.hexId;
        const bHexPos   = (bHexId && HEX_POS[bHexId]) ?? { left: POS.modelos3d.barco.left, top: POS.modelos3d.barco.top };
        const bRotAngle = barcoRotAngle;
        const bLeft     = scene.x + bHexPos.left * scene.s;
        const bTop      = scene.y + bHexPos.top  * scene.s;
        const bSize     = Math.round(POS.modelos3d.barco.size * scene.s);

        // El barco se oscurece cuando hay un overlay activo (evento, victoria…)
        // No hay capa externa que lo cubra — se gestiona aquí directamente.
        const barcoOscuro = overlayActivo;
        return (
          <div style={{
            position:   'absolute',
            left:       `${bLeft}px`,
            top:        `${bTop}px`,
            transform:  'translate(-50%,-50%)',
            transition: [
              'left 1.4s cubic-bezier(0.4,0,0.2,1)',
              'top 1.4s cubic-bezier(0.4,0,0.2,1)',
              'opacity 0.4s ease',
              'filter 0.4s ease',
            ].join(', '),
            zIndex:     7,
            opacity:    barcoOscuro ? 0.06 : 1,
            filter:     barcoOscuro ? 'brightness(0.12) saturate(0)' : 'none',
            pointerEvents: 'none',
            ...dbg('rgba(0,255,100,0.6)'),
          }}>
            <Modelo3D
              src="/tablero/modelos/barco.glb"
              size={bSize}
              escala={POS.modelos3d.barco.escala}
              camPos={POS.modelos3d.barco.camPos}
              controles={POS.modelos3d.barco.controles}
              rotacion={[0, bRotAngle, 0]}
            />
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
          PANEL DEV — solo visible con DEV_PREVIEW = true
          Arrastrable: coge por la barra de título para moverlo.
      ══════════════════════════════════════════════════════════════ */}
      {DEV_PREVIEW && (
        <div style={{
          position: 'fixed',
          left:  `${devPanelPos.left}px`,
          top:   `${devPanelPos.top}px`,
          zIndex: 400,
          width:  390,
          fontFamily: 'monospace', fontSize: 12,
          color: 'rgba(245,230,200,0.85)',
          userSelect: 'none',
        }}>

          {/* ── Barra de título / drag handle ── */}
          <div
            onMouseDown={onDevDragStart}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 11px',
              background: 'rgba(4,6,13,0.97)',
              border: '1px solid rgba(20,200,100,0.35)',
              borderBottom: devPanelOpen ? '1px solid rgba(20,200,100,0.15)' : '1px solid rgba(20,200,100,0.35)',
              borderRadius: devPanelOpen ? '10px 10px 0 0' : '10px',
              cursor: 'grab',
            }}
          >
            <span style={{ color: '#4cff90', fontSize: 11, letterSpacing: 2 }}>⠿ DEV PANEL</span>
            <button
              onMouseDown={e => e.stopPropagation()} // no arrastra al clickar el botón
              onClick={() => setDevPanelOpen(o => !o)}
              style={{
                background: 'transparent', border: 'none',
                color: '#4cff90', fontFamily: 'monospace', fontSize: 13,
                cursor: 'pointer', padding: '0 2px', lineHeight: 1,
              }}
            >
              {devPanelOpen ? '▲' : '▼'}
            </button>
          </div>

          {/* ── Cuerpo del panel ── */}
          {devPanelOpen && tablero && (
            <div style={{
              maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
              background: 'rgba(4,6,13,0.97)',
              border: '1px solid rgba(20,200,100,0.22)',
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              padding: '13px 15px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>

              {/* ─── FASE ─── */}
              <div>
                <div style={{ color: '#4cff90', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>FASE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(FASE_INFO).map(([f, info]) => (
                    <button key={f} onClick={() => setFase(f)} style={{
                      background:   fase === f ? 'rgba(76,255,144,0.13)' : 'transparent',
                      border:       `1px solid ${fase === f ? '#4cff90' : 'rgba(255,255,255,0.14)'}`,
                      borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontSize: 11,
                      color: fase === f ? '#4cff90' : 'rgba(245,230,200,0.50)',
                    }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* ─── BARCO ─── */}
              <div>
                <div style={{ color: '#4cff90', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
                  BARCO — <span style={{ color: 'rgba(245,230,200,0.6)' }}>{tablero.barco?.hexId}</span>
                  {' · '}{(barcoRotAngle * 180 / Math.PI).toFixed(0)}°
                  {prevHexId && <span style={{ color: 'rgba(245,230,200,0.35)' }}> · prev: {prevHexId}</span>}
                  {barcoAnimPhase !== 'idle' && <span style={{ color: '#ffd060', marginLeft: 5 }}>[{barcoAnimPhase}]</span>}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[
                    { tipo: 'izquierda', label: '← Rojo',    color: '#ff7070' },
                    { tipo: 'adelante',  label: '↑ Amarillo', color: '#ffd060' },
                    { tipo: 'derecha',   label: '→ Azul',     color: '#60c8ff' },
                  ].map(({ tipo, label, color }) => (
                    <button key={tipo} onClick={() => moverBarco(tipo)}
                      disabled={barcoAnimPhase !== 'idle' || fase === 'victoria'}
                      style={{
                        flex: 1, background: 'transparent', border: `1px solid ${color}`,
                        borderRadius: 5, color, padding: '5px 0', fontSize: 12,
                        cursor: barcoAnimPhase !== 'idle' ? 'not-allowed' : 'pointer',
                        opacity: barcoAnimPhase !== 'idle' ? 0.4 : 1,
                      }}>
                      {label}
                    </button>
                  ))}
                  <button onClick={() => {
                    setTablero(prev => ({ ...prev, barco: { ...prev.barco, hexId: 'inicio' } }));
                    setBarcoRotAngle(0); setPrevHexId(null);
                    prevBarcoHexRef.current = 'inicio'; setBarcoAnimPhase('idle');
                  }} style={{ ..._btnMini, padding: '5px 10px' }}>⌂</button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* ─── TRIPULACIÓN ─── */}
              <div>
                <div style={{ color: '#4cff90', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>TRIPULACIÓN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { campo: 'esCapitan',   emoji: '👑', label: 'Capitán' },
                    { campo: 'esTeniente',  emoji: '⚓', label: 'Teniente' },
                    { campo: 'esNavegante', emoji: '🧭', label: 'Navegante' },
                  ].map(({ campo, emoji, label }) => {
                    const jug = sala?.jugadores || [];
                    const idx = jug.findIndex(j => j[campo]);
                    return (
                      <div key={campo} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 95, color: 'rgba(245,230,200,0.55)', flexShrink: 0 }}>{emoji} {label}</span>
                        <select value={idx} onChange={e => {
                          const nuevoIdx = Number(e.target.value);
                          setSala(prev => ({
                            ...prev,
                            jugadores: prev.jugadores.map((j, i) => {
                              const u = { ...j }; delete u[campo];
                              if (i === nuevoIdx) u[campo] = true;
                              return u;
                            }),
                          }));
                          if (campo === 'esCapitan') setTablero(prev => ({ ...prev, capitanIdx: nuevoIdx }));
                        }} style={{
                          flex: 1, background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.14)', borderRadius: 4,
                          color: 'rgba(245,230,200,0.85)', padding: '3px 6px',
                          fontSize: 12, cursor: 'pointer',
                        }}>
                          <option value={-1}>— ninguno —</option>
                          {jug.map((j, i) => <option key={j.id} value={i}>{j.nombre}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* ─── Añadir / quitar jugadores ─── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(245,230,200,0.40)', fontSize: 10, letterSpacing: 1 }}>
                    {(sala?.jugadores||[]).length} / 10 jugadores
                  </span>
                  <button
                    onClick={() => {
                      const jug = sala?.jugadores || [];
                      if (jug.length >= 10) return;
                      const NOMBRES = ['Ana','Bea','Carlos','Diego','Eva','Fran','Gema','Hugo','Isa','Juan'];
                      const nombre  = NOMBRES[jug.length] ?? `Jugador ${jug.length + 1}`;
                      const id      = `j_${Date.now()}`;
                      setSala(prev => ({
                        ...prev,
                        jugadores:    [...prev.jugadores, { id, nombre, conectado: true }],
                        numJugadores: (prev.numJugadores || prev.jugadores.length) + 1,
                      }));
                    }}
                    style={{ ..._btnMini, color: '#4cff90', borderColor: 'rgba(76,255,144,0.35)' }}
                  >+ Jugador</button>
                  <button
                    onClick={() => {
                      const jug = sala?.jugadores || [];
                      if (jug.length <= 2) return;
                      setSala(prev => ({
                        ...prev,
                        jugadores:    prev.jugadores.slice(0, -1),
                        numJugadores: Math.max(2, (prev.numJugadores || prev.jugadores.length) - 1),
                      }));
                    }}
                    style={{ ..._btnMini, color: '#ff8a8a', borderColor: 'rgba(255,138,138,0.30)' }}
                  >− Quitar</button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* ─── TABLERO (turno / mazo / carta) ─── */}
              <div>
                <div style={{ color: '#4cff90', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>TABLERO</div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Turno */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: 'rgba(245,230,200,0.55)' }}>Turno</span>
                    <button onClick={() => setTablero(prev => ({ ...prev, turno: Math.max(1, (prev.turno||1) - 1) }))} style={_btnMini}>−</button>
                    <span style={{ minWidth: 20, textAlign: 'center' }}>{tablero.turno || 1}</span>
                    <button onClick={() => setTablero(prev => ({ ...prev, turno: (prev.turno||1) + 1 }))} style={_btnMini}>+</button>
                  </div>
                  {/* Mazo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: 'rgba(245,230,200,0.55)' }}>Mazo</span>
                    <button onClick={() => setTablero(prev => ({ ...prev, mazoDisponibleCount: Math.max(0, (prev.mazoDisponibleCount||0) - 1) }))} style={_btnMini}>−</button>
                    <span style={{ minWidth: 20, textAlign: 'center' }}>{tablero.mazoDisponibleCount ?? 0}</span>
                    <button onClick={() => setTablero(prev => ({ ...prev, mazoDisponibleCount: (prev.mazoDisponibleCount||0) + 1 }))} style={_btnMini}>+</button>
                  </div>
                </div>
                {/* Última carta */}
                <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: 'rgba(245,230,200,0.55)' }}>Última carta</span>
                  <select value={tablero.ultimaCarta?.color || 'amarillo'}
                    onChange={e => setTablero(prev => ({ ...prev, ultimaCarta: { ...(prev.ultimaCarta||{}), color: e.target.value } }))}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 4, color: 'rgba(245,230,200,0.85)', padding: '2px 6px', fontSize: 12, cursor: 'pointer' }}>
                    <option value="amarillo">🟡 Amarillo</option>
                    <option value="azul">🔵 Azul</option>
                    <option value="rojo">🔴 Rojo</option>
                  </select>
                  <select value={tablero.ultimaCarta?.nombre || ''}
                    onChange={e => setTablero(prev => ({ ...prev, ultimaCarta: { ...(prev.ultimaCarta||{}), nombre: e.target.value } }))}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 4, color: 'rgba(245,230,200,0.85)', padding: '2px 6px', fontSize: 12, cursor: 'pointer' }}>
                    {['Viento en Popa','Borracho','Desarmado','Armado','Sirena','Telescopio','Levantamiento del Culto'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* ─── EVENTOS ─── */}
              <div>
                <div style={{ color: '#4cff90', fontSize: 10, letterSpacing: 2, marginBottom: 7 }}>EVENTOS</div>

                {/* Ceremonia */}
                <div style={{ color: 'rgba(245,230,200,0.38)', fontSize: 10, marginBottom: 4, letterSpacing: 1 }}>CEREMONIA DE EQUIPO</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 4 }}>
                  <button onClick={() => {
                    const cap = sala?.jugadores?.find(j => j.esCapitan);
                    setCeremoniaDatos({ capitan: cap?.nombre || 'Capitán', teniente: '', navegante: '' });
                    setCeremoniaStep('capitan');
                  }} style={{ ..._btnEvento, borderColor: '#c9a84c', color: '#c9a84c' }}>👑 Capitán</button>

                  <button onClick={() => {
                    const cap = sala?.jugadores?.find(j => j.esCapitan);
                    const ten = sala?.jugadores?.find(j => j.esTeniente);
                    const nav = sala?.jugadores?.find(j => j.esNavegante);
                    setCeremoniaDatos({
                      capitan:   cap?.nombre || 'Capitán',
                      teniente:  ten?.nombre || 'Teniente',
                      navegante: nav?.nombre || 'Navegante',
                    });
                    setCeremoniaStep('equipo');
                  }} style={{ ..._btnEvento, borderColor: '#c9a84c', color: '#c9a84c' }}>🔺 Pirámide</button>

                  <button onClick={iniciarShrinking}
                    disabled={ceremoniaStep === 'idle'}
                    style={{ ..._btnEvento, borderColor: '#8ab4f8', color: '#8ab4f8', opacity: ceremoniaStep === 'idle' ? 0.4 : 1 }}>
                    ↙ Encoger
                  </button>

                  <button onClick={() => setCeremoniaStep('idle')}
                    style={{ ..._btnEvento, borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(245,230,200,0.35)' }}>✕ Cerrar</button>
                </div>
                <div style={{ color: 'rgba(245,230,200,0.25)', fontSize: 10, marginBottom: 8, letterSpacing: 1 }}>
                  Step actual: <span style={{ color: '#4cff90' }}>{ceremoniaStep}</span>
                </div>

                {/* Motín */}
                <div style={{ color: 'rgba(245,230,200,0.38)', fontSize: 10, marginBottom: 4, letterSpacing: 1 }}>MOTÍN</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  <button onClick={() => {
                    const jug = sala?.jugadores || [];
                    const nuevoIdx = ((tablero.capitanIdx || 0) + 1) % jug.length;
                    const nuevoCapitan = jug[nuevoIdx];
                    setMotin({ exitoso: true, totalPistolas: 4, umbral: 3, nuevoCapitan });
                    // Ceremony-aware: si hay pirámide → 3s motin → nueva ceremonia de capitán
                    if (ceremoniaStep === 'equipo') {
                      setTimeout(() => {
                        setMotin(null);
                        setTablero(prev => ({ ...prev, capitanIdx: nuevoIdx }));
                        setSala(prev => ({ ...prev, jugadores: prev.jugadores.map((j, i) => ({ ...j, esCapitan: i === nuevoIdx })) }));
                        setCeremoniaDatos({ capitan: nuevoCapitan.nombre, teniente: '', navegante: '' });
                        setCeremoniaStep('capitan');
                      }, 3000);
                    } else {
                      setTablero(prev => ({ ...prev, capitanIdx: nuevoIdx }));
                      setSala(prev => ({ ...prev, jugadores: prev.jugadores.map((j, i) => ({ ...j, esCapitan: i === nuevoIdx })) }));
                      setTimeout(() => setMotin(null), 6000);
                    }
                  }} style={{ ..._btnEvento, borderColor: '#ff8a8a', color: '#ff8a8a' }}>💀 Exitoso</button>

                  <button onClick={() => {
                    setMotin({ exitoso: false, totalPistolas: 1, umbral: 3, nuevoCapitan: null });
                    // Ceremony-aware: si hay pirámide → 3s motin → pirámide 2.5s → encoger
                    if (ceremoniaStep === 'equipo') {
                      setTimeout(() => {
                        setMotin(null);
                        setCeremoniaStep('equipo');
                        setTimeout(() => iniciarShrinking(), 2500);
                      }, 3000);
                    } else {
                      setTimeout(() => setMotin(null), 6000);
                    }
                  }} style={{ ..._btnEvento, borderColor: '#ffd060', color: '#ffd060' }}>⚓ Fallado</button>

                  <button onClick={() => setMotin(null)}
                    style={{ ..._btnEvento, borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(245,230,200,0.35)' }}>✕ Cerrar</button>
                </div>

                {/* Kraken */}
                <div style={{ color: 'rgba(245,230,200,0.38)', fontSize: 10, marginBottom: 4, letterSpacing: 1 }}>KRAKEN MENOR</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  <button onClick={() => {
                    setKraken({ nombre: 'Marinero inocente', victoriaCultistas: false });
                    setTimeout(() => setKraken(null), 7000);
                  }} style={{ ..._btnEvento, borderColor: '#7ec8e3', color: '#7ec8e3' }}>🌊 Inocente</button>

                  <button onClick={() => {
                    setKraken({ nombre: 'El Cultista', victoriaCultistas: true });
                    setFase('victoria');
                    setTablero(prev => ({ ...prev, victoria: 'cultistas' }));
                  }} style={{ ..._btnEvento, borderColor: '#4caf50', color: '#4caf50' }}>🐙 Era el Cultista</button>

                  <button onClick={() => setKraken(null)}
                    style={{ ..._btnEvento, borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(245,230,200,0.35)' }}>✕ Cerrar</button>
                </div>

                {/* Carta de navegación */}
                <div style={{ color: 'rgba(245,230,200,0.38)', fontSize: 10, marginBottom: 4, letterSpacing: 1 }}>CARTA NAVEGACIÓN</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {[
                    { color: 'amarillo', nombre: 'Viento en Popa', label: '🟡 Amarilla',   c: '#ffd060' },
                    { color: 'azul',     nombre: 'Borracho',       label: '🔵 Borracho',   c: '#60c8ff' },
                    { color: 'azul',     nombre: 'Desarmado',      label: '🔵 Desarmado',  c: '#60c8ff' },
                    { color: 'rojo',     nombre: 'Borracho',       label: '🔴 Borracho',   c: '#ff7070' },
                    { color: 'rojo',     nombre: 'Sirena',         label: '🔴 Sirena',     c: '#ff7070' },
                    { color: 'rojo',     nombre: 'Telescopio',     label: '🔴 Telescopio', c: '#ff7070' },
                  ].map(({ color, nombre, label, c }) => (
                    <button key={`${color}-${nombre}`}
                      onClick={() => mostrarCartaNav({ color, nombre })}
                      disabled={cartaNavPhase !== 'idle'}
                      style={{ ..._btnEvento, borderColor: c, color: c, opacity: cartaNavPhase !== 'idle' ? 0.4 : 1 }}>
                      {label}
                    </button>
                  ))}
                  {cartaNavPhase !== 'idle' && (
                    <button onClick={() => {
                      clearTimeout(cartaNavTimerRef.current);
                      setCartaNav(null); setCartaNavPhase('idle');
                    }} style={{ ..._btnEvento, borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(245,230,200,0.4)' }}>✕ Cancelar</button>
                  )}
                </div>

                {/* Ritual del culto */}
                <div style={{ color: 'rgba(245,230,200,0.38)', fontSize: 10, marginBottom: 4, letterSpacing: 1 }}>RITUAL CULTO</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {[
                    { tipo: 'alijo_armas',        nombre: 'Alijo de Armas',         emoji: '🔫' },
                    { tipo: 'registro_camarote',  nombre: 'Registro del Camarote',  emoji: '📋' },
                    { tipo: 'conversion_culto',   nombre: 'Conversión del Culto',   emoji: '👥' },
                  ].map(({ tipo, nombre, emoji }) => (
                    <button key={tipo} onClick={() => setTablero(prev => ({
                      ...prev,
                      accionEspecial: { tipo: 'ritual', carta: { tipo, nombre, descripcion: '…' } },
                    }))} style={{ ..._btnEvento, borderColor: '#4caf50', color: '#4caf50' }}>{emoji} {nombre}</button>
                  ))}
                  <button onClick={() => setTablero(prev => ({ ...prev, accionEspecial: null }))}
                    style={{ ..._btnEvento, borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(245,230,200,0.4)' }}>✕ Cerrar</button>
                </div>

                {/* Victoria directa */}
                <div style={{ color: 'rgba(245,230,200,0.38)', fontSize: 10, marginBottom: 4, letterSpacing: 1 }}>VICTORIA DIRECTA</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {[
                    { bando: 'piratas',   label: '💀 Piratas',   color: '#ff7070' },
                    { bando: 'marineros', label: '⚓ Marineros', color: '#60c8ff' },
                    { bando: 'cultistas', label: '🐙 Cultistas', color: '#4caf50' },
                  ].map(({ bando, label, color }) => (
                    <button key={bando} onClick={() => {
                      setFase('victoria');
                      setTablero(prev => ({ ...prev, victoria: bando }));
                    }} style={{ ..._btnEvento, borderColor: color, color }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* ─── RESET TOTAL ─── */}
              <button onClick={() => {
                setTablero({ ...MOCK.tablero });
                setSala({ ...MOCK.sala });
                setFase(MOCK.tablero.fase);
                setBarcoRotAngle(0);
                setPrevHexId(null);
                prevBarcoHexRef.current = null;
                setBarcoAnimPhase('idle');
                setMotin(null);
                setKraken(null);
                setCeremoniaStep('idle');
                setCeremoniaDatos({ capitan: '', teniente: '', navegante: '' });
              }} style={{
                background: 'rgba(255,80,80,0.10)',
                border: '1px solid rgba(255,80,80,0.35)', borderRadius: 6,
                color: '#ff8a8a', padding: '7px', cursor: 'pointer',
                fontSize: 12, letterSpacing: 1, fontFamily: 'monospace',
              }}>
                🔄 RESET TOTAL
              </button>

            </div>
          )}
        </div>
      )}

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
