import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import MenuPrincipal from './vistas/MenuPrincipal';
import LobbyCrear from './vistas/LobbyCrear';
import LobbyUnirse from './vistas/LobbyUnirse';
import SalaJugador from './vistas/SalaJugador';
import Tablero from './vistas/Tablero';
import EntradaTablero from './vistas/EntradaTablero';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Menú principal */}
        <Route path="/" element={<MenuPrincipal />} />

        {/* Flujo jugador (móvil) */}
        <Route path="/crear" element={<LobbyCrear />} />
        <Route path="/unirse" element={<LobbyUnirse />} />
        <Route path="/unirse/:codigo" element={<LobbyUnirse />} />
        <Route path="/sala" element={<SalaJugador />} />

        {/* Flujo tablero (pantalla grande) — sin nombre, sin rol */}
        <Route path="/tablero" element={<EntradaTablero />} />
        <Route path="/tablero/:codigo" element={<Tablero />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
