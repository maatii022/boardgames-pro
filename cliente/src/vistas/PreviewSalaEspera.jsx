import React, { useState } from 'react';
import SalaEspera from './SalaEspera';

/* ─── Datos ficticios para la vista previa ─────────────────────────
   Cambia estos datos para probar distintos estados:
   • Añade/quita jugadores de JUGADORES_PREVIEW
   • Cambia numJugadores para probar el botón bloqueado/desbloqueado
   • Cambia codigo para ver cómo queda el código de sala
────────────────────────────────────────────────────────────────── */
const JUGADORES_PREVIEW = [
  { id: 'p1', nombre: 'Capitán Barbossa',   conectado: true  },
  { id: 'p2', nombre: 'Jack Sparrow',        conectado: true  },
  { id: 'p3', nombre: 'Will Turner',         conectado: false },
  { id: 'p4', nombre: 'Elizabeth Swann',     conectado: true  },
  { id: 'p5', nombre: 'Davy Jones',          conectado: true  },
  { id: 'p6', nombre: 'Hector el Corsario',  conectado: true  },
];

export default function PreviewSalaEspera() {
  // Permite añadir/quitar jugadores en la preview para ver la animación
  const [jugadores, setJugadores] = useState(JUGADORES_PREVIEW);

  const nombres = [
    'Mati', 'Ema', 'Simón', 'Tomy', 'Iolhm',
    'Blackbeard', 'Anne Bonny', 'Calico Jack',
  ];

  const añadirJugador = () => {
    if (jugadores.length >= 11) return;
    const nombre = nombres[jugadores.length % nombres.length];
    setJugadores(prev => [...prev, {
      id: `p${prev.length + 1}`,
      nombre,
      conectado: true,
    }]);
  };

  const quitarJugador = () => {
    if (jugadores.length <= 1) return;
    setJugadores(prev => prev.slice(0, -1));
  };

  return (
    <div>

      <SalaEspera
        codigo="ABCD"
        jugadores={jugadores}
        hostId="p1"
        socketId="p1"          /* simula ser el host */
        conectado={true}
        numJugadores={jugadores.length}
        onIniciar={     () => alert('▶ Iniciar partida')}
        onCambiarHost={ (id) => alert(`👑 Nuevo host: ${id}`)}
        onSalir={       () => alert('← Salir')}
      />

      {/* ── Controles de la preview (no aparecen en producción) ── */}
      <div style={{
        position: 'fixed', bottom: '16px', right: '16px',
        zIndex: 999,
        display: 'flex', flexDirection: 'column', gap: '8px',
        background: 'rgba(0,0,0,0.82)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: '8px', padding: '12px 16px',
        fontFamily: 'monospace', fontSize: '12px', color: '#e8c97a',
      }}>
        <div style={{ marginBottom: '4px', letterSpacing: '1px', opacity: 0.6, fontSize: '10px' }}>
          PREVIEW CONTROLS
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={quitarJugador}
            style={{
              background: 'rgba(139,26,26,0.6)', border: '1px solid rgba(192,57,43,0.5)',
              color: '#ff8a8a', borderRadius: '4px', padding: '4px 10px',
              cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px',
            }}>−</button>
          <span style={{ minWidth: '80px', textAlign: 'center' }}>
            {jugadores.length} / 11 jugadores
          </span>
          <button
            onClick={añadirJugador}
            disabled={jugadores.length >= 11}
            style={{
              background: 'rgba(45,106,79,0.6)', border: '1px solid rgba(76,175,80,0.5)',
              color: '#98e4a5', borderRadius: '4px', padding: '4px 10px',
              cursor: jugadores.length >= 11 ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace', fontSize: '14px',
              opacity: jugadores.length >= 11 ? 0.4 : 1,
            }}>+</button>
        </div>
        <div style={{ fontSize: '10px', opacity: 0.45, textAlign: 'center' }}>
          ≥ 5 jugadores activa el botón
        </div>
      </div>

    </div>
  );
}
