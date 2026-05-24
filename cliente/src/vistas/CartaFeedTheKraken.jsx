import React from 'react';

/* ── Clip-path: bordes rasgados de pergamino ─────────────────── */
const TORN = `polygon(
  0.5% 3%,   2%  0.5%, 5%  2.5%, 8%   0%,   12% 2%,   16% 0.5%,
  20% 2.5%,  25% 0%,   29% 2%,   33%  0.5%, 38% 2.5%, 43% 0%,
  47% 2%,    51% 0.5%, 56% 2.5%, 61%  0%,   65% 2%,   70% 0.5%,
  74% 2.5%,  79% 0%,   83% 2%,   87%  0.5%, 91% 2.5%, 95% 0%,
  98% 2%,    100% 1%,
  99% 8%,    100.5% 15%, 99% 22%, 100.5% 30%, 99% 38%, 100.5% 46%,
  99% 54%,   100.5% 62%, 99% 70%, 100.5% 78%, 99% 86%, 100.5% 93%, 99% 100%,
  96% 99%,   92% 100.5%, 88% 99%, 84% 100.5%, 80% 99%, 76% 100.5%,
  72% 99%,   68% 100.5%, 64% 99%, 60% 100.5%, 56% 99%, 52% 100.5%,
  48% 99%,   44% 100.5%, 40% 99%, 36% 100.5%, 32% 99%, 28% 100.5%,
  24% 99%,   20% 100.5%, 16% 99%, 12% 100.5%, 8% 99%, 4% 100.5%, 1% 99%,
  -0.5% 93%, 1%  86%,   -0.5% 78%, 1% 70%,  -0.5% 62%, 1% 54%,
  -0.5% 46%, 1%  38%,   -0.5% 30%, 1% 22%,  -0.5% 15%, 1% 8%,
  0.5% 3%
)`;

/* ── SVG: Kraken silueta ─────────────────────────────────────── */
function KrakenSil() {
  const c = '#18090100';  // usamos fill directo
  return (
    <svg viewBox="0 0 200 205" xmlns="http://www.w3.org/2000/svg"
         style={{ width:'82px', height:'auto', display:'block', margin:'0 auto',
                  filter:'drop-shadow(1px 2px 4px rgba(0,0,0,0.22))' }}>
      {/* Corona/punta superior del manto */}
      <path d="M84,32 Q88,14 93,30 Q97,11 102,27 Q107,11 113,30 Q117,14 122,32 L122,44 L84,44 Z"
            fill="#1a0a02"/>
      {/* Tentáculos (dibujados antes del cuerpo) */}
      {/* Superior izquierdo */}
      <path d="M74,46 Q60,30 42,14 Q68,24 84,38 Z" fill="#1a0a02"/>
      {/* Izquierdo */}
      <path d="M58,68 Q36,64 14,74 Q36,84 58,84 Z" fill="#1a0a02"/>
      {/* Inferior izquierdo */}
      <path d="M64,108 Q46,124 36,154 Q52,140 74,118 Z" fill="#1a0a02"/>
      {/* Abajo izquierdo */}
      <path d="M82,122 Q72,144 70,180 Q79,160 94,124 Z" fill="#1a0a02"/>
      {/* Abajo derecho */}
      <path d="M106,124 Q122,160 130,180 Q128,144 118,122 Z" fill="#1a0a02"/>
      {/* Inferior derecho */}
      <path d="M126,118 Q148,140 164,154 Q154,124 136,108 Z" fill="#1a0a02"/>
      {/* Derecho */}
      <path d="M142,84 Q164,84 186,74 Q164,64 142,68 Z" fill="#1a0a02"/>
      {/* Superior derecho */}
      <path d="M116,38 Q132,24 158,14 Q140,30 126,46 Z" fill="#1a0a02"/>
      {/* Cuerpo principal */}
      <ellipse cx="100" cy="75" rx="43" ry="47" fill="#1a0a02"/>
      {/* Ojos */}
      <ellipse cx="88"  cy="68" rx="9" ry="10" fill="#7a4018"/>
      <ellipse cx="112" cy="68" rx="9" ry="10" fill="#7a4018"/>
      <circle  cx="88"  cy="69" r="5.2" fill="#0e0400"/>
      <circle  cx="112" cy="69" r="5.2" fill="#0e0400"/>
      <circle  cx="85"  cy="66" r="1.8" fill="rgba(255,215,140,0.42)"/>
      <circle  cx="109" cy="66" r="1.8" fill="rgba(255,215,140,0.42)"/>
      {/* Ventosas visibles en tentáculos laterales */}
      <circle cx="22"  cy="74"  r="2.8" fill="none" stroke="#2a1204" strokeWidth="1.2"/>
      <circle cx="178" cy="74"  r="2.8" fill="none" stroke="#2a1204" strokeWidth="1.2"/>
      <circle cx="28"  cy="68"  r="2"   fill="none" stroke="#2a1204" strokeWidth="1"/>
      <circle cx="172" cy="68"  r="2"   fill="none" stroke="#2a1204" strokeWidth="1"/>
    </svg>
  );
}

/* ── SVG: Rosa de los vientos ────────────────────────────────── */
function RosaVientos() {
  const c = '#2a1406';
  return (
    <svg viewBox="0 0 54 54" style={{ width:'36px', height:'36px', opacity:0.55 }}>
      {/* Puntas cardinales (largas) */}
      <polygon points="27,2 29.5,25 27,29 24.5,25"  fill={c}/>
      <polygon points="27,52 29.5,29 27,25 24.5,29" fill={c}/>
      <polygon points="2,27 25,29.5 29,27 25,24.5"  fill={c}/>
      <polygon points="52,27 29,29.5 25,27 29,24.5" fill={c}/>
      {/* Puntas diagonales (cortas) */}
      <polygon points="9,9 23.5,23.5 27,27 22,22"   fill={c} opacity="0.72"/>
      <polygon points="45,9 30.5,23.5 27,27 32,22"  fill={c} opacity="0.72"/>
      <polygon points="45,45 30.5,30.5 27,27 32,32" fill={c} opacity="0.72"/>
      <polygon points="9,45 23.5,30.5 27,27 22,32"  fill={c} opacity="0.72"/>
      {/* Centro */}
      <circle cx="27" cy="27" r="4"   fill={c}/>
      <circle cx="27" cy="27" r="2.2" fill="#c8a050"/>
      {/* N */}
      <text x="27" y="19.5" textAnchor="middle" fontSize="6" fill={c}
            fontFamily="serif" fontWeight="bold">N</text>
      <text x="27" y="50"   textAnchor="middle" fontSize="5" fill={c} fontFamily="serif">S</text>
      <text x="6"  y="30"   textAnchor="middle" fontSize="5" fill={c} fontFamily="serif">W</text>
      <text x="48" y="30"   textAnchor="middle" fontSize="5" fill={c} fontFamily="serif">E</text>
    </svg>
  );
}

/* ── SVG: Nudo de cuerda (esquina) ──────────────────────────── */
function CuerdaEsquina() {
  return (
    <svg viewBox="0 0 54 54"
         style={{ position:'absolute', top:0, left:0, width:'50px', opacity:0.7 }}>
      {/* Hebra principal */}
      <path d="M4,4 Q14,18 22,26 Q30,34 40,48"
            fill="none" stroke="#5a3010" strokeWidth="3.8" strokeLinecap="round"/>
      {/* Sombra de la cuerda */}
      <path d="M6,6 Q16,20 24,28 Q32,36 42,50"
            fill="none" stroke="#3a1a08" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      {/* Torsión de la cuerda */}
      <path d="M8,8   Q12,13 16,16"  fill="none" stroke="#7a4818" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      <path d="M18,18 Q22,23 26,26"  fill="none" stroke="#7a4818" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      <path d="M28,28 Q32,33 36,38"  fill="none" stroke="#7a4818" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      {/* Nudo/lazo */}
      <circle cx="15" cy="15" r="7"   fill="none" stroke="#5a3010" strokeWidth="2.8"/>
      <circle cx="15" cy="15" r="3.2" fill="#5a3010"/>
      {/* Tachuela */}
      <circle cx="4.5" cy="4.5" r="4.5" fill="#8a5828" stroke="#3a1a06" strokeWidth="1"/>
      <circle cx="4.5" cy="4.5" r="2"   fill="#c47830"/>
    </svg>
  );
}

/* ── SVG: Divisor ornamental ─────────────────────────────────── */
function DivisorPergamino() {
  const c = '#4a2a08';
  return (
    <svg viewBox="0 0 200 18" style={{ width:'100%', maxWidth:'175px', display:'block', margin:'6px auto 8px' }}>
      <line x1="0"   y1="9" x2="76"  y2="9" stroke={c} strokeWidth="0.9" opacity="0.65"/>
      <line x1="124" y1="9" x2="200" y2="9" stroke={c} strokeWidth="0.9" opacity="0.65"/>
      {/* Ornamento central */}
      <path d="M90,9 C90,5 94,3 100,3 C106,3 110,5 110,9 C110,13 106,15 100,15 C94,15 90,13 90,9 Z"
            fill="none" stroke={c} strokeWidth="0.9" opacity="0.75"/>
      <circle cx="100" cy="9" r="2.2" fill={c} opacity="0.7"/>
      {/* Flechitas laterales */}
      <path d="M76,9 C80,7 84,7 86,9 C84,11 80,11 76,9 Z" fill={c} opacity="0.55"/>
      <path d="M124,9 C120,7 116,7 114,9 C116,11 120,11 124,9 Z" fill={c} opacity="0.55"/>
    </svg>
  );
}

/* ── SVG: Icono personas ─────────────────────────────────────── */
function IcoPersonas() {
  const c = '#2a1205';
  return (
    <svg viewBox="0 0 40 26" style={{ width:'32px', display:'block', margin:'0 auto 3px' }}>
      <circle cx="20" cy="7"  r="5"   fill={c}/>
      <path d="M13,26 C13,17 27,17 27,26 Z" fill={c}/>
      <circle cx="9"  cy="8"  r="4.2" fill={c} opacity="0.75"/>
      <path d="M3,26  C3,18.5 15,18.5 15,26 Z" fill={c} opacity="0.75"/>
      <circle cx="31" cy="8"  r="4.2" fill={c} opacity="0.75"/>
      <path d="M25,26 C25,18.5 37,18.5 37,26 Z" fill={c} opacity="0.75"/>
    </svg>
  );
}

/* ── SVG: Icono reloj de arena ───────────────────────────────── */
function IcoReloj() {
  const c = '#2a1205';
  return (
    <svg viewBox="0 0 26 30" style={{ width:'20px', display:'block', margin:'0 auto 3px' }}>
      {/* Marco */}
      <path d="M2,1 L24,1 L15.5,15 L24,29 L2,29 L10.5,15 Z"
            fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
      {/* Arena arriba */}
      <path d="M4,3 L22,3 L14,13 L12,13 Z" fill={c} opacity="0.6"/>
      {/* Arena abajo */}
      <path d="M13,17 L13,25 L20,27 L6,27 Z" fill={c} opacity="0.8"/>
      {/* Chorro central */}
      <line x1="13" y1="13" x2="13" y2="17" stroke={c} strokeWidth="1.2" opacity="0.6"/>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   Componente principal: Carta Feed The Kraken
═══════════════════════════════════════════════════════════════ */
export default function CartaFeedTheKraken({ onCrear, creando, conectado, esHover, onHover, onLeave }) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position: 'relative',
        clipPath: TORN,
        /* Pergamino: múltiples gradientes superpuestos */
        background: `
          radial-gradient(circle at 22% 78%, rgba(140,75,12,0.16) 0%, transparent 35%),
          radial-gradient(circle at 78% 22%, rgba(160,95,18,0.13) 0%, transparent 28%),
          radial-gradient(circle at 55% 65%, rgba(120,60,8,0.10) 0%, transparent 22%),
          radial-gradient(ellipse 88% 82% at 50% 50%, transparent 48%, rgba(95,45,8,0.42) 100%),
          linear-gradient(160deg, #eddfa6 0%, #d8ae72 22%, #c8925a 48%, #d4aa70 74%, #e6ce96 100%)
        `,
        boxShadow: esHover
          ? '0 22px 55px rgba(0,0,0,0.65), 0 0 30px rgba(201,160,60,0.18), inset 0 1px 0 rgba(255,240,180,0.4)'
          : '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,240,180,0.3)',
        transform: esHover ? 'translateY(-7px) scale(1.025)' : 'none',
        transition: 'all 0.38s cubic-bezier(0.25, 0.8, 0.25, 1)',
        padding: 'clamp(18px,2.4vw,26px) clamp(16px,2vw,24px) clamp(16px,2vh,22px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: 'default',
        overflow: 'hidden',
        minHeight: 0,
      }}>

      {/* ── Capa de grano/textura ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)'/%3E%3C/svg%3E")`,
        backgroundSize: '220px 220px',
        opacity: 0.09,
        mixBlendMode: 'multiply',
      }}/>

      {/* ── Decoraciones absolutas ── */}
      <CuerdaEsquina/>
      <div style={{ position:'absolute', top:'clamp(8px,1.5vh,14px)', right:'clamp(8px,1.5vw,14px)' }}>
        <RosaVientos/>
      </div>

      {/* ── Kraken ── */}
      <div style={{ marginTop:'clamp(10px,2vh,16px)', marginBottom:'clamp(6px,1vh,10px)' }}>
        <KrakenSil/>
      </div>

      {/* ── Título ── */}
      <h2 style={{
        fontFamily: 'var(--fuente-pirata)',
        fontSize: 'clamp(20px,2.4vw,28px)',
        color: '#1a0d02',
        textAlign: 'center',
        lineHeight: 1.15,
        margin: '0 0 2px',
        letterSpacing: '1px',
        textShadow: '1px 1px 2px rgba(255,240,180,0.3)',
      }}>
        Feed The Kraken
      </h2>

      {/* ── Divisor ── */}
      <DivisorPergamino/>

      {/* ── Descripción ── */}
      <p style={{
        fontFamily: 'var(--fuente-pirata)',
        fontSize: 'clamp(12px,1.2vw,14.5px)',
        color: '#2a1608',
        textAlign: 'center',
        lineHeight: 1.72,
        margin: '0 0 clamp(10px,1.5vh,16px)',
        padding: '0 4px',
        letterSpacing: '0.3px',
      }}>
        Deducción social en alta mar. Piratas, Marineros y el misterioso Cultista compiten por el control del barco.
      </p>

      {/* ── Stats ── */}
      <div style={{
        display: 'flex', gap: 'clamp(20px,3vw,36px)',
        marginBottom: 'clamp(12px,1.8vh,18px)',
        width: '100%', justifyContent: 'center',
      }}>
        {/* Jugadores */}
        <div style={{ textAlign:'center' }}>
          <IcoPersonas/>
          <div style={{ fontFamily:'var(--fuente-pirata)', fontSize:'clamp(13px,1.3vw,16px)', color:'#1a0d02', lineHeight:1 }}>5–11</div>
          <div style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'8px', color:'#5a3510', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:'2px' }}>Jugadores</div>
        </div>
        {/* Línea separadora vertical */}
        <div style={{ width:'1px', background:'rgba(80,40,8,0.3)', margin:'4px 0' }}/>
        {/* Duración */}
        <div style={{ textAlign:'center' }}>
          <IcoReloj/>
          <div style={{ fontFamily:'var(--fuente-pirata)', fontSize:'clamp(13px,1.3vw,16px)', color:'#1a0d02', lineHeight:1 }}>45–90 min</div>
          <div style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'8px', color:'#5a3510', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:'2px' }}>Duración</div>
        </div>
      </div>

      {/* ── Botón Crear Sala ── */}
      <button
        onClick={onCrear}
        disabled={creando || !conectado}
        style={{
          width: '100%',
          background: creando
            ? 'rgba(40,20,5,0.5)'
            : 'linear-gradient(180deg, #2e1a08 0%, #1a0d02 60%, #0e0800 100%)',
          color: creando ? 'rgba(200,160,80,0.5)' : '#c8a050',
          padding: 'clamp(9px,1.1vh,13px) 16px',
          borderRadius: '4px',
          border: '1.5px solid rgba(100,60,15,0.7)',
          boxShadow: esHover && !creando
            ? 'inset 0 1px 0 rgba(200,160,60,0.2), 0 4px 12px rgba(0,0,0,0.4)'
            : 'inset 0 1px 0 rgba(200,160,60,0.12)',
          fontFamily: 'var(--fuente-pirata)',
          fontSize: 'clamp(12px,1.2vw,15px)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          cursor: creando || !conectado ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: !conectado ? 0.45 : 1,
          outline: 'none',
          /* Textura madera simulada */
          backgroundSize: '100% 4px',
        }}>
        {creando ? '⚓ Creando...' : !conectado ? 'Conectando...' : '⚓ Crear Sala'}
      </button>

    </div>
  );
}
