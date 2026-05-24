import React from 'react';

/* Ruta base de los assets de esta carta */
const A = '/cartas/ftk/';

/* ════════════════════════════════════════════════════════════════
   Carta Feed The Kraken — usa assets reales en /cartas/ftk/

   ESTRATEGIA DE LAYOUT:
   • fondo.png se renderiza como <img width:100% height:auto>
     → su proporción natural fija la altura del contenedor.
   • Todo el contenido va en un <div position:absolute inset:0>
     superpuesto, con flex-column para distribuir los elementos.
   • Los porcentajes de padding se ajustan a los márgenes del
     pergamino (bordes rasgados, cuerda arriba, etc.).
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
        width: '100%',
        filter: esHover
          ? 'drop-shadow(0 22px 44px rgba(0,0,0,0.65)) drop-shadow(0 0 20px rgba(180,130,40,0.2))'
          : 'drop-shadow(0 8px 28px rgba(0,0,0,0.55))',
        transform: esHover ? 'translateY(-7px) scale(1.025)' : 'none',
        transition: 'transform 0.38s cubic-bezier(0.25,0.8,0.25,1), filter 0.38s ease',
        cursor: 'default',
      }}>

      {/* ── FONDO: fija la proporción natural de la carta ── */}
      <img
        src={`${A}fondo.png`}
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',          /* ← respeta el aspect-ratio del PNG */
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* ── CONTENIDO: superpuesto absolutamente ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        /* Padding relativo al tamaño de la carta para respetar
           los bordes rasgados / cuerda superior / margen inferior */
        padding: '14% 10% 10%',
      }}>

        {/* ── Kraken ── */}
        <img
          src={`${A}kraken.png`}
          alt="Kraken"
          style={{
            width: '28%',
            height: 'auto',
            display: 'block',
            userSelect: 'none',
          }}
        />

        {/* ── Título + divisor ── */}
        <img
          src={`${A}titulo.png`}
          alt="Feed The Kraken"
          style={{
            width: '82%',
            height: 'auto',
            display: 'block',
            userSelect: 'none',
          }}
        />

        {/* ── Descripción ── */}
        <p style={{
          fontFamily: 'var(--fuente-pirata)',
          fontSize: 'clamp(10px,1.05vw,13px)',
          color: '#2a1608',
          textAlign: 'center',
          lineHeight: 1.6,
          margin: 0,
          padding: '0 4%',
          letterSpacing: '0.2px',
        }}>
          Deducción social en alta mar. Piratas, Marineros y el misterioso Cultista compiten por el control del barco.
        </p>

        {/* ── Stats ── */}
        <div style={{
          display: 'flex',
          gap: '8%',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
          <div style={{ textAlign: 'center' }}>
            <img src={`${A}personas.png`} alt="Jugadores"
                 style={{ width:'16%', minWidth:'18px', maxWidth:'28px', display:'block', margin:'0 auto 3px', userSelect:'none' }}/>
            <div style={{ fontFamily:'var(--fuente-pirata)', fontSize:'clamp(12px,1.2vw,15px)', color:'#1a0d02', lineHeight:1 }}>5–11</div>
            <div style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'clamp(6px,0.6vw,8px)', color:'#5a3510', letterSpacing:'1.4px', textTransform:'uppercase', marginTop:'2px' }}>Jugadores</div>
          </div>
          <div style={{ width:'1px', background:'rgba(80,40,8,0.28)', alignSelf:'stretch', margin:'2px 0' }}/>
          <div style={{ textAlign: 'center' }}>
            <img src={`${A}reloj.png`} alt="Duración"
                 style={{ width:'12%', minWidth:'14px', maxWidth:'22px', display:'block', margin:'0 auto 3px', userSelect:'none' }}/>
            <div style={{ fontFamily:'var(--fuente-pirata)', fontSize:'clamp(12px,1.2vw,15px)', color:'#1a0d02', lineHeight:1 }}>45–90 min</div>
            <div style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'clamp(6px,0.6vw,8px)', color:'#5a3510', letterSpacing:'1.4px', textTransform:'uppercase', marginTop:'2px' }}>Duración</div>
          </div>
        </div>

        {/* ── Botón Crear Sala ── */}
        <img
          src={`${A}boton.png`}
          alt="Crear Sala"
          onClick={!creando && conectado ? onCrear : undefined}
          style={{
            width: '75%',
            height: 'auto',
            display: 'block',
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
