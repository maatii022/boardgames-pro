import React from 'react';

/* ════════════════════════════════════════════════════════════════
   Carta Feed The Kraken — carta.png ocupa el 100% del espacio
   y actúa como botón completo para crear sala.
═══════════════════════════════════════════════════════════════ */
export default function CartaFeedTheKraken({
  onCrear, creando, conectado, esHover, onHover, onLeave,
}) {
  return (
    <img
      src="/cartas/ftk/carta.png"
      alt="Feed The Kraken"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={!creando && conectado ? onCrear : undefined}
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',                /* preserva la proporción original */
        userSelect: 'none',
        cursor: creando || !conectado ? 'not-allowed' : 'pointer',
        opacity: !conectado ? 0.55 : creando ? 0.65 : 1,
        filter: esHover
          ? 'drop-shadow(0 22px 44px rgba(0,0,0,0.65)) drop-shadow(0 0 20px rgba(180,130,40,0.25))'
          : 'drop-shadow(0 8px 28px rgba(0,0,0,0.55))',
        transform: esHover ? 'translateY(-7px) scale(1.025)' : 'none',
        transition: 'transform 0.38s cubic-bezier(0.25,0.8,0.25,1), filter 0.38s ease, opacity 0.28s ease',
      }}
    />
  );
}
