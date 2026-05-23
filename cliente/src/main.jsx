import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import MenuPrincipal from './vistas/MenuPrincipal';
import LobbyUnirse from './vistas/LobbyUnirse';
import SalaJugador from './vistas/SalaJugador';
import Tablero from './vistas/Tablero';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Pantalla grande */}
        <Route path="/" element={<MenuPrincipal />} />
        <Route path="/tablero/:codigo" element={<Tablero />} />

        {/* Flujo móvil jugador */}
        <Route path="/unirse" element={<LobbyUnirse />} />
        <Route path="/unirse/:codigo" element={<LobbyUnirse />} />
        <Route path="/sala" element={<SalaJugador />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
