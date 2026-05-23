import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

const FASE_INFO = {
  lobby: { label: 'Sala de Espera', color: 'var(--oro-dorado)' },
  fase_0: { label: 'Revelando Roles', color: 'var(--turquesa-kraken)' },
  durmiendo: { label: '🌙 La tripulación duerme...', color: '#7ec8e3' },
  fase_1: { label: '⚓ Eligiendo Equipo', color: 'var(--oro-dorado)' },
  fase_2: { label: '💀 Votación de Motín', color: '#ff8a8a' },
  fase_3: { label: '📦 El Cofre de Navegación', color: 'var(--oro-dorado)' },
  fase_4: { label: '🔍 Casilla Especial', color: 'var(--turquesa-kraken)' },
  fase_5: { label: '😴 Fin de Turno', color: 'rgba(245,230,200,0.4)' },
  victoria: { label: '🏆 ¡VICTORIA!', color: '#e8c97a' },
};

export default function Tablero() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { emitir, escuchar, conectado } = useSocket();
  const [sala, setSala] = useState(null);
  const [tablero, setTablero] = useState(null);
  const [fase, setFase] = useState('lobby');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!codigo) return;
    emitir('unirse-tablero', { codigo: codigo.toUpperCase() });

    const c1 = escuchar('tablero-conectado', ({ sala }) => { setSala(sala); setFase(sala.fase); });
    const c2 = escuchar('tablero-actualizado', (t) => { setTablero(t); setFase(t.fase); });
    const c3 = escuchar('sala-actualizada', (s) => { setSala(s); setFase(s.fase); });
    const c4 = escuchar('fase-cambiada', ({ fase: f }) => setFase(f));
    const c5 = escuchar('error', ({ mensaje }) => setError(mensaje));
    return () => { c1(); c2(); c3(); c4(); c5(); };
  }, [codigo, emitir, escuchar]);

  const faseInfo = FASE_INFO[fase] || { label: fase, color: 'var(--crema-pergamino)' };
  const jugadores = tablero?.jugadores || sala?.jugadores || [];
  const capitan = jugadores[tablero?.capitanIdx];

  if (!sala && !error) {
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'80px', marginBottom:'24px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'14px', letterSpacing:'3px' }}>
            Conectando al tablero...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 32px', borderBottom:'1px solid rgba(201,168,76,0.2)',
        background:'rgba(8,7,15,0.8)', backdropFilter:'blur(10px)',
        zIndex:10,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <span style={{ fontSize:'32px' }}>🐙</span>
          <div>
            <h1 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--oro-dorado)', fontSize:'20px', letterSpacing:'3px' }}>
              Feed The Kraken
            </h1>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase' }}>
              Sala {codigo} · Turno {tablero?.turno || 1}
            </p>
          </div>
        </div>

        {/* Fase actual */}
        <div style={{
          background:'rgba(13,27,46,0.9)',
          border:`1px solid ${faseInfo.color}40`,
          borderRadius:'8px', padding:'10px 20px', textAlign:'center',
        }}>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color: faseInfo.color, fontSize:'14px', letterSpacing:'2px' }}>
            {faseInfo.label}
          </p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: conectado ? '#98e4a5' : '#ff8a8a' }} />
          <button onClick={() => navigate('/')} style={{
            background:'none', border:'1px solid rgba(245,230,200,0.2)', color:'rgba(245,230,200,0.4)',
            padding:'6px 14px', borderRadius:'4px', cursor:'pointer',
            fontFamily:'var(--fuente-subtitulo)', fontSize:'11px', letterSpacing:'1px',
          }}>Salir</button>
        </div>
      </div>

      {/* Cuerpo principal */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Zona central: tablero placeholder */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>

          {/* Niebla / placeholder del tablero */}
          <div style={{
            width:'min(70vh, 70vw)', height:'min(70vh, 70vw)',
            position:'relative',
          }}>
            {/* Tablero hexagonal simplificado visual */}
            <TableroHex barcoHex={tablero?.barco?.hexId} />
          </div>

          {/* Overlay durmiendo */}
          {fase === 'durmiendo' && (
            <div style={{
              position:'absolute', inset:0,
              background:'rgba(8,7,15,0.85)',
              display:'flex', alignItems:'center', justifyContent:'center',
              backdropFilter:'blur(4px)',
            }}>
              <div style={{ textAlign:'center', animation:'aparecer 1s ease' }}>
                <div style={{ fontSize:'80px', marginBottom:'24px', animation:'flotar 4s ease-in-out infinite' }}>🌙</div>
                <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--crema-pergamino)', fontSize:'clamp(24px,4vw,48px)', letterSpacing:'4px', marginBottom:'12px' }}>
                  La tripulación se va a dormir
                </h2>
                <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'18px' }}>
                  Los piratas están abriéndose los ojos entre sí...
                </p>
              </div>
            </div>
          )}

          {/* Overlay victoria */}
          {fase === 'victoria' && (
            <div style={{
              position:'absolute', inset:0,
              background:'rgba(8,7,15,0.9)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <div style={{ textAlign:'center', animation:'aparecer 0.8s ease' }}>
                <div style={{ fontSize:'100px', marginBottom:'24px', animation:'flotar 2s ease-in-out infinite' }}>
                  {tablero?.victoria === 'piratas' ? '💀' : tablero?.victoria === 'marineros' ? '⚓' : '🐙'}
                </div>
                <h1 style={{
                  fontFamily:'var(--fuente-titulo)',
                  fontSize:'clamp(32px,6vw,72px)',
                  color:'var(--oro-dorado)',
                  letterSpacing:'6px',
                  textShadow:'0 0 60px rgba(201,168,76,0.8)',
                }}>
                  {tablero?.victoria === 'piratas' ? 'VICTORIA PIRATA' :
                   tablero?.victoria === 'marineros' ? 'VICTORIA MARINERA' :
                   '¡EL KRAKEN HA SIDO INVOCADO!'}
                </h1>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral derecho */}
        <div style={{
          width:'280px', borderLeft:'1px solid rgba(201,168,76,0.15)',
          background:'rgba(8,7,15,0.6)', padding:'20px', overflowY:'auto',
        }}>
          {/* Capitán */}
          {capitan && (
            <div style={{ marginBottom:'20px', padding:'12px 16px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:'8px' }}>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'6px' }}>Capitán</p>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--crema-pergamino)', fontSize:'16px' }}>⚓ {capitan.nombre}</p>
            </div>
          )}

          {/* Jugadores */}
          <div>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.3)', fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'12px' }}>
              Tripulación ({jugadores.length})
            </p>
            {jugadores.map((j, i) => (
              <div key={j.id || i} style={{
                padding:'10px 12px', marginBottom:'6px', borderRadius:'6px',
                background: j.esCapitan ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                border:`1px solid ${j.esCapitan ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)'}`,
                opacity: j.fueraDeServicio ? 0.4 : j.conectado === false ? 0.5 : 1,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', flexShrink:0,
                    background: j.conectado === false ? '#ff8a8a' : '#98e4a5' }} />
                  <span style={{ fontFamily:'var(--fuente-cuerpo)', color:'var(--crema-pergamino)', fontSize:'14px', flex:1 }}>{j.nombre}</span>
                  <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                    {j.esCapitan && <span title="Capitán" style={{ fontSize:'12px' }}>⚓</span>}
                    {j.esTeniente && <span title="Teniente" style={{ fontSize:'12px' }}>🎖️</span>}
                    {j.esNavegante && <span title="Navegante" style={{ fontSize:'12px' }}>🧭</span>}
                    {j.fueraDeServicio && <span title="Fuera de servicio" style={{ fontSize:'12px' }}>😴</span>}
                  </div>
                </div>
                {j.curriculos > 0 && (
                  <div style={{ marginTop:'4px', paddingLeft:'14px' }}>
                    <span style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.3)', fontSize:'10px' }}>
                      📜 {j.curriculos} currículos
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mazos */}
          {tablero && (
            <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:'1px solid rgba(201,168,76,0.1)' }}>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.3)', fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'10px' }}>Mazos</p>
              <div style={{ display:'flex', gap:'8px' }}>
                <div style={{ flex:1, textAlign:'center', padding:'10px', background:'rgba(255,255,255,0.03)', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:'20px', marginBottom:'4px' }}>🃏</div>
                  <div style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--crema-pergamino)', fontSize:'16px' }}>{tablero.mazoDisponibleCount}</div>
                  <div style={{ fontSize:'9px', color:'rgba(245,230,200,0.3)', letterSpacing:'1px', textTransform:'uppercase' }}>disponible</div>
                </div>
              </div>
            </div>
          )}

          {error && <p style={{ color:'#ff8a8a', fontSize:'12px', marginTop:'12px' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

// Tablero hexagonal visual simplificado
function TableroHex({ barcoHex }) {
  const hexs = [
    // fila superior
    { id:'puerto_piratas', x:22, y:8, tipo:'puerto_piratas', label:'Cala Carmesí' },
    { id:'kraken_centro', x:50, y:5, tipo:'kraken', label:'El Kraken' },
    { id:'puerto_marineros', x:78, y:8, tipo:'puerto_marineros', label:'Bahía Azul' },
    // fila media-alta
    { id:'mid_izq_alto', x:30, y:22, tipo:'normal' },
    { id:'mid_centro_alto', x:50, y:22, tipo:'lupa' },
    { id:'mid_der_alto', x:70, y:22, tipo:'normal' },
    // fila media
    { id:'izq_medio', x:15, y:38, tipo:'kraken_menor' },
    { id:'mid_izq_medio', x:36, y:38, tipo:'normal' },
    { id:'mid_centro_medio', x:50, y:38, tipo:'lupa' },
    { id:'mid_der_medio', x:64, y:38, tipo:'normal' },
    { id:'der_medio', x:85, y:38, tipo:'kraken_menor' },
    // fila media-baja
    { id:'mid_izq_bajo', x:36, y:56, tipo:'normal' },
    { id:'mid_centro_bajo', x:50, y:56, tipo:'lupa' },
    { id:'mid_der_bajo', x:64, y:56, tipo:'normal' },
    // inicio
    { id:'inicio', x:50, y:76, tipo:'inicio', label:'Isla Cangrejo' },
  ];

  const colores = {
    puerto_piratas: '#8b1a1a',
    puerto_marineros: '#1a3a5c',
    kraken: '#e9c46a',
    kraken_menor: '#2d6a4f',
    lupa: '#1a3a5c',
    normal: '#0d1b2e',
    inicio: '#112240',
  };

  const bordes = {
    puerto_piratas: '#c0392b',
    puerto_marineros: '#4a9bc7',
    kraken: '#e9c46a',
    kraken_menor: '#4caf50',
    lupa: '#0a9396',
    normal: 'rgba(201,168,76,0.25)',
    inicio: 'rgba(201,168,76,0.5)',
  };

  const size = 7;

  return (
    <svg viewBox="0 0 100 90" style={{ width:'100%', height:'100%' }}>
      <defs>
        <filter id="glow-oro">
          <feGaussianBlur stdDeviation="1" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="glow-kraken">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      {/* Fondo mar */}
      <rect width="100" height="90" fill="#0a1628" rx="4"/>
      <ellipse cx="50" cy="45" rx="45" ry="38" fill="#0d1f38" opacity="0.5"/>

      {hexs.map(h => {
        const esBarcoPosicion = barcoHex === h.id;
        const puntos = hexagonPoints(h.x, h.y, size);
        return (
          <g key={h.id}>
            <polygon
              points={puntos}
              fill={colores[h.tipo] || '#0d1b2e'}
              stroke={esBarcoPosicion ? '#e8c97a' : bordes[h.tipo] || 'rgba(201,168,76,0.2)'}
              strokeWidth={esBarcoPosicion ? 0.6 : 0.3}
              filter={esBarcoPosicion ? 'url(#glow-oro)' : h.tipo === 'kraken' ? 'url(#glow-kraken)' : undefined}
            />
            {/* Icono del hex */}
            <text x={h.x} y={h.y + 0.5} textAnchor="middle" dominantBaseline="middle"
              fontSize="3.5" fill="rgba(245,230,200,0.7)">
              {h.tipo === 'kraken' ? '🐙' : h.tipo === 'kraken_menor' ? '🐙' : h.tipo === 'lupa' ? '🔍' :
               h.tipo === 'puerto_piratas' ? '💀' : h.tipo === 'puerto_marineros' ? '⚓' :
               h.tipo === 'inicio' ? '🏝️' : ''}
            </text>
            {/* Barco */}
            {esBarcoPosicion && (
              <text x={h.x} y={h.y - 2} textAnchor="middle" dominantBaseline="middle" fontSize="4">⛵</text>
            )}
            {/* Label */}
            {h.label && (
              <text x={h.x} y={h.y + size + 2} textAnchor="middle" fontSize="1.8"
                fill="rgba(245,230,200,0.5)" fontFamily="serif">
                {h.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function hexagonPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}
