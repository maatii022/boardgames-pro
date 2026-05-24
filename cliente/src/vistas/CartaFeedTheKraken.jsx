import React from 'react';

/* Ruta base de los assets de esta carta */
const A = '/cartas/ftk/';

/*
  Color unificado para kraken + título:
  sepia cálido oscuro → mismo tono de "tinta de pergamino"
  Ajusta brightness si las imágenes salen muy claras/oscuras.
*/
const TINTA = 'sepia(1) saturate(0.6) brightness(0.28)';

/* ════════════════════════════════════════════════════════════════
   Carta Feed The Kraken
   • fondo.png (width:100% height:auto) fija la proporción.
   • Todo el contenido va en position:absolute inset:0.
   • flex-column con justify-content:flex-start + marginTop:auto
     en el botón para anclarlo al fondo del pergamino.
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

      {/* ── FONDO: fija la proporción natural del pergamino ── */}
      <img
        src={`${A}fondo.png`}
        alt=""
        style={{ display:'block', width:'100%', height:'auto', userSelect:'none', pointerEvents:'none' }}
      />

      {/* ── CONTENIDO superpuesto ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        /* top: espacio para la cuerda/nudo del pergamino
           lados y bottom: margen interior del borde rasgado    */
        padding: '11% 8% 8%',
      }}>

        {/* ── Kraken: grande, protagonista ── */}
        <img
          src={`${A}kraken.png`}
          alt="Kraken"
          style={{
            width: '54%',
            height: 'auto',
            display: 'block',
            userSelect: 'none',
            filter: TINTA,
          }}
        />

        {/* ── Título + divisor: justo debajo del kraken ── */}
        <img
          src={`${A}titulo.png`}
          alt="Feed The Kraken"
          style={{
            width: '88%',
            height: 'auto',
            display: 'block',
            marginTop: '2%',
            userSelect: 'none',
            filter: TINTA,
          }}
        />

        {/* ── Descripción: debajo del divisor incorporado en titulo.png ── */}
        <p style={{
          fontFamily: 'var(--fuente-pirata)',
          fontSize: 'clamp(9px,1vw,12.5px)',
          color: '#2a1608',
          textAlign: 'center',
          lineHeight: 1.55,
          margin: '3% 0 0',
          padding: '0 5%',
          letterSpacing: '0.15px',
        }}>
          Deducción social en alta mar. Piratas, Marineros y el misterioso Cultista compiten por el control del barco.
        </p>

        {/* ── Stats ── */}
        <div style={{
          display: 'flex',
          gap: '7%',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'flex-start',
          marginTop: '4%',
        }}>
          <div style={{ textAlign:'center' }}>
            <img src={`${A}personas.png`} alt="Jugadores"
                 style={{ width:'32px', height:'auto', display:'block', margin:'0 auto 3px',
                          userSelect:'none', filter: TINTA }}/>
            <div style={{ fontFamily:'var(--fuente-pirata)', fontSize:'clamp(11px,1.15vw,14px)', color:'#1a0d02', lineHeight:1 }}>5–11</div>
            <div style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'clamp(6px,0.58vw,8px)', color:'#5a3510', letterSpacing:'1.4px', textTransform:'uppercase', marginTop:'2px' }}>Jugadores</div>
          </div>
          <div style={{ width:'1px', background:'rgba(80,40,8,0.3)', alignSelf:'stretch', margin:'2px 0' }}/>
          <div style={{ textAlign:'center' }}>
            <img src={`${A}reloj.png`} alt="Duración"
                 style={{ width:'24px', height:'auto', display:'block', margin:'0 auto 3px',
                          userSelect:'none', filter: TINTA }}/>
            <div style={{ fontFamily:'var(--fuente-pirata)', fontSize:'clamp(11px,1.15vw,14px)', color:'#1a0d02', lineHeight:1 }}>45–90 min</div>
            <div style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'clamp(6px,0.58vw,8px)', color:'#5a3510', letterSpacing:'1.4px', textTransform:'uppercase', marginTop:'2px' }}>Duración</div>
          </div>
        </div>

        {/* ── Botón: anclado al fondo con marginTop:auto ── */}
        <img
          src={`${A}boton.png`}
          alt="Crear Sala"
          onClick={!creando && conectado ? onCrear : undefined}
          style={{
            width: '80%',
            height: 'auto',
            display: 'block',
            marginTop: 'auto',
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
