// ============================================================
// APP PRINCIPAL — Router y providers
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './SocketContext';
import { AudioProvider } from './contextos/AudioContexto';
import MenuPrincipal from './vistas/MenuPrincipal';
import Lobby from './vistas/Lobby';
import UnirseConQR from './vistas/UnirseConQR';
import './estilos.css';

// Placeholders para vistas aún no construidas
function Juego() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>🦑</div>
      <p style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--color-oro)', fontSize: 24 }}>
        Vista de juego (móvil)
      </p>
      <p style={{ fontFamily: 'var(--fuente-ui)', color: 'var(--color-texto-dim)' }}>
        Sprint 2 →
      </p>
    </div>
  );
}

function Tablero() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>🗺️</div>
      <p style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--color-oro)', fontSize: 24 }}>
        Vista de tablero (pantalla grande)
      </p>
      <p style={{ fontFamily: 'var(--fuente-ui)', color: 'var(--color-texto-dim)' }}>
        Sprint 3 →
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuPrincipal />} />
          <Route path="/lobby/:juegoId" element={<Lobby />} />
          <Route path="/unirse/:codigo" element={<UnirseConQR />} />
          <Route path="/juego/:codigo" element={<Juego />} />
          <Route path="/tablero/:codigo" element={<Tablero />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
    </AudioProvider>
  );
}
