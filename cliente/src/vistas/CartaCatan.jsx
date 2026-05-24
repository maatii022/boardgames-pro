import React from 'react';

/* ════════════════════════════════════════════════════════════════
   Carta Catán — carta.png como imagen completa, no disponible aún.
═══════════════════════════════════════════════════════════════ */
export default function CartaCatan() {
  return (
    <img
      src="/cartas/catan/carta.png"
      alt="Catán"
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',              /* preserva la proporción original */
        userSelect: 'none',
        cursor: 'not-allowed',
        opacity: 0.45,
        filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.55)) grayscale(0.25)',
      }}
    />
  );
}
