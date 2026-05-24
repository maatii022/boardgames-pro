import React from 'react';

/* Ruta base de los assets de esta carta */
const A = '/cartas/ftk/';

/* Iconos de stats — imágenes reales */
function IcoPersonas() {
  return <img src={`${A}personas.png`} alt="Jugadores"
              style={{ width:'30px', display:'block', margin:'0 auto 2px', userSelect:'none' }}/>;
}
function IcoReloj() {
  return <img src={`${A}reloj.png`} alt="Duración"
              style={{ width:'22px', display:'block', margin:'0 auto 2px', userSelect:'none' }}/>;
}

/* ════════════════════════════════════════════════════════════════
   Carta Feed The Kraken — usa assets reales en /cartas/ftk/
═══════════════════════════════════════════════════════════════ */
export default function CartaFeedTheKraken({
  onCrear, creando, conectado, esHover, onHover, onLeave,
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        /* La transición de hover la hace drop-shadow + translate */
        filter: esHover
          ? 'drop-shadow(0 22px 44px rgba(0,0,0,0.65)) drop-shadow(0 0 20px rgba(180,130,40,0.2))'
          : 'drop-shadow(0 8px 28px rgba(0,0,0,0.55))',
        transform: esHover ? 'translateY(-7px) scale(1.025)' : 'none',
        transition: 'transform 0.38s cubic-bezier(0.25,0.8,0.25,1), filter 0.38s ease',
        cursor: 'default',
      }}>

      {/* ── FONDO: imagen del pergamino ── */}
      {/* Ocupa todo el espacio del contenedor; debe ser PNG con bordes transparentes */}
      <img
        src={`${A}fondo.png`}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'fill',   /* estira para rellenar el contenedor */
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* ── CONTENIDO (z-index sobre el fondo) ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        /* Padding interior para no pisar los bordes rasgados del pergamino */
        padding: 'clamp(14px,2.2vh,22px) clamp(14px,5%,22px) clamp(12px,2vh,20px)',
      }}>

        {/* ── Kraken ── */}
        <img
          src={`${A}kraken.png`}
          alt="Kraken"
          style={{
            width: 'clamp(72px,22%,104px)',
            height: 'auto',
            display: 'block',
            marginTop: 'clamp(10px,1.5vh,18px)',
            marginBottom: 'clamp(4px,0.8vh,8px)',
            userSelect: 'none',
          }}
        />

        {/* ── Título + divisor (un solo asset) ── */}
        <img
          src={`${A}titulo.png`}
          alt="Feed The Kraken"
          style={{
            width: '88%', maxWidth: '220px',
            display: 'block',
            margin: 'clamp(4px,0.8vh,8px) auto clamp(4px,0.8vh,8px)',
            userSelect: 'none',
          }}
        />

        {/* ── Descripción ── */}
        <p style={{
          fontFamily: 'var(--fuente-pirata)',
          fontSize: 'clamp(12px,1.2vw,14.5px)',
          color: '#2a1608',
          textAlign: 'center',
          lineHeight: 1.72,
          margin: '0 0 clamp(10px,1.4vh,16px)',
          padding: '0 2px',
          letterSpacing: '0.2px',
        }}>
          Deducción social en alta mar. Piratas, Marineros y el misterioso Cultista compiten por el control del barco.
        </p>

        {/* ── Stats ── */}
        <div style={{
          display: 'flex', gap: 'clamp(18px,3vw,34px)',
          marginBottom: 'clamp(10px,1.4vh,16px)',
          width: '100%', justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
          <div style={{ textAlign: 'center' }}>
            <IcoPersonas/>
            <div style={{ fontFamily:'var(--fuente-pirata)', fontSize:'clamp(14px,1.4vw,17px)', color:'#1a0d02', lineHeight:1 }}>5–11</div>
            <div style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'8px', color:'#5a3510', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:'2px' }}>Jugadores</div>
          </div>
          <div style={{ width:'1px', background:'rgba(80,40,8,0.28)', alignSelf:'stretch', margin:'4px 0' }}/>
          <div style={{ textAlign: 'center' }}>
            <IcoReloj/>
            <div style={{ fontFamily:'var(--fuente-pirata)', fontSize:'clamp(14px,1.4vw,17px)', color:'#1a0d02', lineHeight:1 }}>45–90 min</div>
            <div style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'8px', color:'#5a3510', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:'2px' }}>Duración</div>
          </div>
        </div>

        {/* ── Botón Crear Sala (imagen con texto incluido) ── */}
        <img
          src={`${A}boton.png`}
          alt="Crear Sala"
          onClick={!creando && conectado ? onCrear : undefined}
          style={{
            width: '88%', maxWidth: '220px',
            display: 'block',
            margin: '0 auto clamp(2px,0.4vh,6px)',
            userSelect: 'none',
            cursor: creando || !conectado ? 'not-allowed' : 'pointer',
            opacity: !conectado ? 0.45 : creando ? 0.55 : 1,
            transition: 'opacity 0.28s ease, transform 0.18s ease',
            transform: esHover && !creando && conectado ? 'scale(1.03)' : 'none',
          }}
        />

      </div>
    </div>
  );
}
