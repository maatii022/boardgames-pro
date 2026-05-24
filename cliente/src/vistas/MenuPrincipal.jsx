import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

/* ─── Posiciones de velas (% relativo a la imagen) ─────────── */
// Candelabro central + velas laterales visibles en la foto
const VELAS = [
  { x:49, y:33, sz:220, dur:2.1, del:0.0, anim:'vela-parpadeo-1' }, // vela central izq
  { x:52, y:31, sz:170, dur:1.7, del:0.4, anim:'vela-parpadeo-2' }, // vela central med
  { x:55, y:34, sz:160, dur:2.5, del:0.9, anim:'vela-parpadeo-1' }, // vela central der
  { x:46, y:35, sz:130, dur:1.9, del:1.2, anim:'vela-parpadeo-2' }, // vela lateral izq
  { x:76, y:38, sz:140, dur:2.3, del:0.6, anim:'vela-parpadeo-1' }, // vela pared der
  { x:18, y:42, sz:120, dur:2.0, del:1.5, anim:'vela-parpadeo-2' }, // vela pared izq
];

/* ─── Focos de luz ambar general (ilumina la escena) ────────── */
const FOCOS_AMBAR = [
  { x:50, y:38, sz:500, dur:3.2, del:0.0 }, // foco principal candelabro
  { x:22, y:48, sz:300, dur:4.1, del:1.0 }, // foco izquierda
  { x:78, y:45, sz:280, dur:3.8, del:0.7 }, // foco derecha
];

/* ─── Pociones brillando ────────────────────────────────────── */
const POCIONES = [
  { x:50, y:26, sz:70, col:'rgba(30,140,255,0.55)', dur:3.2, del:0.0 }, // azul
  { x:53, y:25, sz:55, col:'rgba(50,220,90,0.50)',  dur:4.5, del:1.2 }, // verde
  { x:61, y:28, sz:60, col:'rgba(230,155,20,0.48)', dur:3.9, del:0.5 }, // ámbar
  { x:57, y:40, sz:65, col:'rgba(160,80,240,0.42)', dur:5.2, del:2.0 }, // cristal morado
];

/* ─── Destellos puntuales ──────────────────────────────────── */
const DESTELLOS = [
  { x:50, y:26, dur:3.2, del:0.0, col:'rgba(140,200,255,0.9)' },
  { x:53, y:25, dur:4.5, del:1.5, col:'rgba(120,255,130,0.9)' },
  { x:57, y:40, dur:5.2, del:2.5, col:'rgba(200,140,255,0.85)' },
];

/* ─── Burbujas oceánicas ────────────────────────────────────── */
const BURBUJAS = Array.from({length:16}, (_,i) => ({
  x:   (i*73+13) % 100,
  sz:  3 + (i*4) % 13,
  dur: 3 + (i*1.8) % 6,
  del: (i*0.9) % 8,
}));

/* ─── SVG Barco ─────────────────────────────────────────────── */
function SvgBarco() {
  return (
    <svg viewBox="0 0 900 270" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <ellipse cx="450" cy="258" rx="390" ry="12" fill="rgba(10,147,150,0.07)"/>
      <path d="M178 188 Q450 210 722 188 L756 252 Q450 280 144 252 Z"
            fill="#0d1b2e" stroke="rgba(10,147,150,0.7)" strokeWidth="1.5"/>
      <path d="M198 198 Q450 218 702 198 L730 247 Q450 270 170 247 Z" fill="#112240"/>
      <path d="M198 210 Q450 228 702 210" fill="none" stroke="rgba(10,147,150,0.25)" strokeWidth="0.8"/>
      <line x1="450" y1="187" x2="450" y2="26"  stroke="#c9a84c" strokeWidth="2.5" opacity="0.9"/>
      <line x1="300" y1="187" x2="308" y2="54"  stroke="#c9a84c" strokeWidth="2"   opacity="0.8"/>
      <line x1="580" y1="187" x2="580" y2="72"  stroke="#c9a84c" strokeWidth="1.8" opacity="0.75"/>
      <line x1="178" y1="181" x2="82"  y2="124" stroke="#c9a84c" strokeWidth="1.8" opacity="0.7"/>
      <path d="M450 31 Q500 94 494 178 Q450 164 406 178 Q400 94 450 31"
            fill="rgba(245,230,200,0.07)" stroke="rgba(201,168,76,0.38)" strokeWidth="1.2"/>
      <path d="M308 58 Q336 112 330 178 Q308 165 284 178 Q280 112 308 58"
            fill="rgba(245,230,200,0.06)" stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>
      <path d="M580 76 Q602 118 598 178 Q580 168 562 178 Q558 118 580 76"
            fill="rgba(245,230,200,0.05)" stroke="rgba(201,168,76,0.24)" strokeWidth="1"/>
      <path d="M308 58 Q200 140 82 124 Q180 165 308 178"
            fill="rgba(245,230,200,0.04)" stroke="rgba(201,168,76,0.2)" strokeWidth="0.8"/>
      <line x1="450" y1="31"  x2="308" y2="58"  stroke="rgba(201,168,76,0.22)" strokeWidth="0.8"/>
      <line x1="450" y1="80"  x2="308" y2="100" stroke="rgba(201,168,76,0.18)" strokeWidth="0.7"/>
      <line x1="450" y1="31"  x2="82"  y2="124" stroke="rgba(201,168,76,0.16)" strokeWidth="0.7"/>
      <line x1="450" y1="31"  x2="580" y2="72"  stroke="rgba(201,168,76,0.2)"  strokeWidth="0.7"/>
      <line x1="450" y1="80"  x2="580" y2="100" stroke="rgba(201,168,76,0.15)" strokeWidth="0.6"/>
      <path d="M450 26 L474 36 L450 46 Z" fill="#8b1a1a" opacity="0.95"/>
      <circle cx="318" cy="216" r="7" fill="rgba(10,147,150,0.15)" stroke="rgba(10,147,150,0.55)" strokeWidth="1.2"/>
      <circle cx="450" cy="219" r="7" fill="rgba(10,147,150,0.15)" stroke="rgba(10,147,150,0.55)" strokeWidth="1.2"/>
      <circle cx="582" cy="216" r="7" fill="rgba(10,147,150,0.15)" stroke="rgba(10,147,150,0.55)" strokeWidth="1.2"/>
      <text x="450" y="240" textAnchor="middle"
            fontFamily="serif" fontSize="10" fill="rgba(201,168,76,0.45)" letterSpacing="3">
        THE KRAKEN
      </text>
    </svg>
  );
}

/* ─── SVG Tentáculo ─────────────────────────────────────────── */
function SvgTentaculo({ flip }) {
  return (
    <svg viewBox="0 0 320 400" xmlns="http://www.w3.org/2000/svg"
         style={{width:'100%',display:'block',transform:flip?'scaleX(-1)':'none',transformOrigin:'center'}}>
      <path d="M18 400 Q52 320 94 254 Q126 202 100 154 Q88 128 107 116 Q126 105 132 138 Q148 196 114 260 Q150 218 186 200 Q218 184 210 226 Q200 256 164 278 Q192 260 228 274 Q250 292 218 314 Q185 328 150 320 Q94 358 34 400 Z"
            fill="rgba(4,58,48,0.82)" stroke="rgba(10,147,150,0.62)" strokeWidth="1.5"/>
      <path d="M0 400 Q28 338 56 278 Q78 234 62 190 Q55 164 72 152 Q90 141 96 168 Q110 222 82 280 Q114 244 148 252 Q174 258 160 290 Q146 316 110 326 Q74 354 18 400 Z"
            fill="rgba(4,50,42,0.68)" stroke="rgba(10,147,150,0.48)" strokeWidth="1.2"/>
      <path d="M70 400 Q98 348 118 298 Q136 256 122 218 Q116 198 128 190 Q143 183 148 206 Q158 254 138 306 Q160 278 192 286 Q212 296 198 320 Q184 342 152 350 Q116 376 80 400 Z"
            fill="rgba(5,62,52,0.55)" stroke="rgba(10,147,150,0.38)" strokeWidth="1"/>
      {[[98,262],[110,228],[118,194],[114,162]].map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx="6" ry="5"
                 fill="rgba(10,147,150,0.1)" stroke="rgba(10,147,150,0.52)" strokeWidth="1.2"/>
      ))}
      <circle cx="120" cy="142" r="3.5" fill="rgba(10,200,200,0.65)"/>
      <circle cx="170" cy="210" r="2.5" fill="rgba(10,180,180,0.5)"/>
      <circle cx="214" cy="268" r="2"   fill="rgba(10,160,160,0.4)"/>
    </svg>
  );
}

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

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  useEffect(() => {
    const c1 = escuchar('sala-creada',       ({ sala }) => navigate(`/tablero/${sala.codigo}`));
    const c2 = escuchar('tablero-conectado', ({ sala }) => navigate(`/tablero/${sala.codigo}`));
    const c3 = escuchar('error',             ({ mensaje }) => { setError(mensaje); setCreando(false); });
    return () => { c1(); c2(); c3(); };
  }, [escuchar, navigate]);

  const crearSala = () => {
    if (!conectado) return setError('Conectando al servidor...');
    setError(''); setCreando(true);
    emitir('crear-sala', { nombre: 'Tablero', esSoloTablero: true });
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: esMar
        ? 'linear-gradient(175deg, #050c16 0%, #091a2e 30%, #0c2240 60%, #060f1e 100%)'
        : '#0a0710',
      transition: 'background 1.4s ease',
    }}>

      {/* ══ FONDO: SALA ARCANA (imagen real) ═══════════════════ */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden',
        opacity: esMar ? 0 : 1, transition: 'opacity 1.4s ease',
      }}>
        {/* Imagen de fondo — ligeramente desenfocada y oscurecida */}
        <div style={{
          position: 'absolute', inset: '-12px',
          backgroundImage: "url('/fondo-menu.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'blur(2.5px) brightness(0.28) saturate(1.3)',
          transform: 'scale(1.03)',
        }}/>

        {/* Overlay de oscurecimiento extra + calidez */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% 38%, rgba(120,60,5,0.18) 0%, transparent 70%),
            linear-gradient(180deg, rgba(5,3,8,0.35) 0%, rgba(8,5,15,0.2) 45%, rgba(5,3,10,0.55) 100%)
          `,
        }}/>

        {/* Focos de luz ambar general (ilumina la escena como las velas) */}
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

        {/* Llamas individuales de cada vela */}
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

        {/* Brillo de pociones */}
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

        {/* Destellos puntuales (el brillo que hace clic en las pociones) */}
        {DESTELLOS.map((d,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${d.x}%`, top: `${d.y}%`,
            width: '3px', height: '3px',
            borderRadius: '50%',
            background: d.col,
            boxShadow: `0 0 6px 3px ${d.col}`,
            transform: 'translate(-50%,-50%)',
            animation: `centelleo-luz ${d.dur}s ease-in-out ${d.del}s infinite`,
          }}/>
        ))}

        {/* Viñeta bordes */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 48%, transparent 45%, rgba(4,2,10,0.75) 100%)',
        }}/>
      </div>

      {/* ══ FONDO: OCÉANO (hover FTK) ══════════════════════════ */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        opacity: esMar ? 1 : 0, transition: 'opacity 1.4s ease',
        pointerEvents: 'none',
      }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            position: 'absolute',
            left: `${15+i*16}%`, top: 0,
            width: '2px', height: '100%',
            background: `linear-gradient(180deg, transparent 0%, rgba(10,147,150,${0.03+i*0.008}) 40%, transparent 100%)`,
            transform: `rotate(${-10+i*5}deg)`,
            transformOrigin: 'top center',
          }}/>
        ))}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(8,20,40,0.5) 50%, rgba(5,12,28,0.8) 100%)',
        }}/>
        {BURBUJAS.map((b,i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${b.x}%`, bottom: '-8%',
            width: `${b.sz}px`, height: `${b.sz}px`,
            borderRadius: '50%',
            border: '1px solid rgba(10,147,150,0.35)',
            background: 'rgba(10,147,150,0.05)',
            animation: `burbuja-subir ${b.dur}s ease-in ${b.del}s infinite`,
          }}/>
        ))}
      </div>

      {/* ══ TENTÁCULOS ═════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: 'clamp(160px, 25vw, 320px)',
        opacity: esMar ? 1 : 0,
        transform: esMar ? 'translateY(0px)' : 'translateY(50px)',
        transition: 'opacity 1.4s ease 0.2s, transform 1.4s ease 0.2s',
        pointerEvents: 'none', zIndex: 2,
      }}>
        <SvgTentaculo flip={false}/>
      </div>
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 'clamp(160px, 25vw, 320px)',
        opacity: esMar ? 1 : 0,
        transform: esMar ? 'translateY(0px)' : 'translateY(50px)',
        transition: 'opacity 1.4s ease 0.4s, transform 1.4s ease 0.4s',
        pointerEvents: 'none', zIndex: 2,
      }}>
        <SvgTentaculo flip={true}/>
      </div>

      {/* ══ BARCO ══════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: esMar
          ? 'translateX(-50%) translateY(0px)'
          : 'translateX(-50%) translateY(40px)',
        width: 'clamp(360px, 62vw, 840px)',
        opacity: esMar ? 0.88 : 0,
        transition: 'opacity 1.1s ease 0.1s, transform 1.1s ease 0.1s',
        pointerEvents: 'none', zIndex: 3,
      }}>
        <SvgBarco/>
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
              ? '0 0 40px rgba(10,147,150,0.65), 0 2px 8px rgba(0,0,0,0.7)'
              : '0 0 40px rgba(201,168,76,0.5),  0 2px 8px rgba(0,0,0,0.7)',
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
              const esFTK  = j.id === 'feed-the-kraken';
              return (
                <div
                  key={j.id}
                  onMouseEnter={() => j.disponible && setHover(j.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    background: esEste && j.disponible
                      ? esFTK
                        ? 'linear-gradient(140deg, rgba(8,24,44,0.97), rgba(10,147,150,0.16))'
                        : 'linear-gradient(140deg, rgba(14,7,28,0.97), rgba(201,168,76,0.12))'
                      : 'rgba(8,6,18,0.72)',
                    border: `1px solid ${
                      esEste && j.disponible
                        ? esFTK ? 'rgba(10,147,150,0.72)' : 'rgba(201,168,76,0.55)'
                        : 'rgba(201,168,76,0.14)'
                    }`,
                    borderRadius: 'clamp(8px,1vw,14px)',
                    padding: 'clamp(16px,2.2vw,28px) clamp(14px,1.8vw,24px)',
                    opacity: j.disponible ? 1 : 0.36,
                    transform: esEste && j.disponible ? 'translateY(-6px) scale(1.02)' : 'none',
                    boxShadow: esEste && j.disponible
                      ? esFTK
                        ? '0 20px 50px rgba(0,0,0,0.6), 0 0 44px rgba(10,147,150,0.2)'
                        : '0 20px 50px rgba(0,0,0,0.6), 0 0 44px rgba(201,168,76,0.14)'
                      : '0 4px 24px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(16px)',
                    transition: 'all 0.38s cubic-bezier(0.25,0.8,0.25,1)',
                    cursor: j.disponible ? 'default' : 'not-allowed',
                    position: 'relative', overflow: 'hidden',
                    animation: `aparecer 0.6s ease ${idx * 0.14}s both`,
                    display: 'flex', flexDirection: 'column',
                  }}>

                  {/* Shimmer FTK */}
                  {esFTK && esEste && (
                    <div style={{
                      position: 'absolute', top: 0, left: '-100%',
                      width: '55%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(10,147,150,0.07), transparent)',
                      animation: 'shimmer-card 2.2s ease infinite',
                      pointerEvents: 'none',
                    }}/>
                  )}

                  {!j.disponible && (
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'rgba(201,168,76,0.09)',
                      border: '1px solid rgba(201,168,76,0.22)',
                      borderRadius: '20px', padding: '2px 8px',
                      fontFamily: 'var(--fuente-subtitulo)', fontSize: '8px',
                      color: 'rgba(201,168,76,0.6)', letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                    }}>Próximamente</div>
                  )}

                  <div style={{
                    fontSize: 'clamp(26px,3.5vw,42px)',
                    marginBottom: 'clamp(8px,1.2vh,14px)',
                    filter: esFTK && esEste ? 'drop-shadow(0 0 10px rgba(10,200,200,0.55))' : 'none',
                    transition: 'filter 0.38s ease',
                  }}>{j.ico}</div>

                  <h2 style={{
                    fontFamily: 'var(--fuente-subtitulo)',
                    fontSize: 'clamp(13px,1.6vw,19px)',
                    color: esEste && j.disponible
                      ? esFTK ? 'rgba(10,220,230,0.95)' : 'var(--crema-pergamino)'
                      : j.disponible ? 'var(--crema-pergamino)' : 'rgba(245,230,200,0.45)',
                    marginBottom: 'clamp(6px,0.8vh,10px)',
                    letterSpacing: '0.8px',
                    transition: 'color 0.38s ease',
                  }}>{j.nombre}</h2>

                  <p style={{
                    fontFamily: 'var(--fuente-cuerpo)',
                    color: 'rgba(245,230,200,0.55)',
                    fontSize: 'clamp(11px,1.1vw,14px)',
                    lineHeight: 1.55, flex: 1,
                    marginBottom: 'clamp(10px,1.2vh,16px)',
                  }}>{j.desc}</p>

                  <div style={{
                    display: 'flex', gap: 'clamp(12px,1.8vw,22px)',
                    marginBottom: 'clamp(10px,1.2vh,16px)',
                  }}>
                    {[{ico:'👥',val:j.jugadores,lbl:'jugadores'},{ico:'⏱️',val:j.duracion,lbl:'duración'}].map(s => (
                      <div key={s.lbl}>
                        <div style={{fontSize:'13px',marginBottom:'1px'}}>{s.ico}</div>
                        <div style={{fontFamily:'var(--fuente-subtitulo)',fontSize:'clamp(9px,0.9vw,11px)',color:'var(--oro-dorado)',letterSpacing:'0.4px'}}>{s.val}</div>
                        <div style={{fontSize:'8px',color:'rgba(245,230,200,0.3)',textTransform:'uppercase',letterSpacing:'1px'}}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>

                  {j.disponible && (
                    <button
                      onClick={crearSala}
                      disabled={creando || !conectado}
                      style={{
                        width: '100%',
                        background: creando
                          ? 'rgba(10,147,150,0.18)'
                          : esFTK
                            ? 'linear-gradient(135deg, rgba(8,110,118,0.92), rgba(10,147,150,0.82))'
                            : 'linear-gradient(135deg, var(--oro-dorado), var(--oro-claro))',
                        color: esFTK ? '#d0f8f8' : '#08070f',
                        padding: 'clamp(8px,1vh,12px) 14px',
                        borderRadius: '6px',
                        fontFamily: 'var(--fuente-subtitulo)',
                        fontSize: 'clamp(9px,1vw,11px)',
                        fontWeight: 700, letterSpacing: '1.5px',
                        textTransform: 'uppercase', border: 'none',
                        cursor: creando || !conectado ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: !conectado ? 0.4 : 1,
                        boxShadow: esFTK && esEste ? '0 4px 20px rgba(10,147,150,0.3)' : 'none',
                      }}>
                      {creando ? '🔄 Creando...' : !conectado ? 'Conectando...' : esFTK ? '⚓ Crear Sala' : 'Crear Sala →'}
                    </button>
                  )}
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
            onClick={() => navigate('/unirse')}
            style={{
              fontSize: 'clamp(9px,1vw,12px)',
              padding: 'clamp(8px,0.9vh,11px) clamp(16px,1.8vw,26px)',
            }}>
            🚪 Unirme a una sala
          </button>
        </div>

      </div>
    </div>
  );
}
