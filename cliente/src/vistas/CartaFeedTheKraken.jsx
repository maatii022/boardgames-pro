import React from 'react';

/* ════════════════════════════════════════════════════════════════
   Carta Feed The Kraken

   • El resplandor se implementa como un div absolutamente
     posicionado DETRÁS de la carta (zIndex 0), con un gradiente
     radial difuminado (blur) que abarca todo el contorno.
     Así el glow es uniforme en los 4 lados sin depender de
     drop-shadow, que sólo se aplica al contorno alfa de la imagen
     y puede quedar cortado por el layout del grid.

   • La carta (img) tiene zIndex 1 para aparecer sobre el glow.
════════════════════════════════════════════════════════════════ */
export default function CartaFeedTheKraken({
  onCrear, creando, conectado, esHover, onHover, onLeave,
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ position: 'relative' }}
    >

      {/* ── Resplandor de contorno ──────────────────────────────
          inset negativo: el div sobresale un 10 % por cada lado,
          así el blur cubre por igual los 4 bordes de la carta.
          La transición de opacidad lo hace aparecer/desaparecer.
      ────────────────────────────────────────────────────────── */}
      <div style={{
        position:   'absolute',
        top:        '-10%',
        left:       '-10%',
        width:      '120%',
        height:     '120%',
        background: 'radial-gradient(ellipse 75% 80% at 50% 52%, rgba(201,168,76,0.52) 0%, rgba(180,130,35,0.24) 42%, transparent 70%)',
        filter:     'blur(26px)',
        borderRadius: '10%',
        opacity:    esHover ? 1 : 0,
        transition: 'opacity 0.40s ease',
        pointerEvents: 'none',
        zIndex:     0,
      }} />

      {/* ── Carta ─────────────────────────────────────────────── */}
      <img
        src="/cartas/ftk/carta.png"
        alt="Feed The Kraken"
        onClick={!creando && conectado ? onCrear : undefined}
        draggable={false}
        style={{
          display:    'block',
          position:   'relative',
          zIndex:     1,
          width:      '100%',
          height:     'auto',
          userSelect: 'none',
          cursor:     creando || !conectado ? 'not-allowed' : 'pointer',
          opacity:    !conectado ? 0.55 : creando ? 0.65 : 1,
          filter:     esHover
            ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.70)) brightness(1.04)'
            : 'drop-shadow(0 8px 28px rgba(0,0,0,0.55))',
          transform:  esHover ? 'translateY(-7px) scale(1.025)' : 'none',
          transition: 'transform 0.38s cubic-bezier(0.25,0.8,0.25,1), filter 0.38s ease, opacity 0.28s ease',
        }}
      />

    </div>
  );
}
