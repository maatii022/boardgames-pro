import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { SalaProvider } from './contextos/SalaContexto';
import MenuPrincipal   from './vistas/MenuPrincipal';
import LobbyCrear      from './vistas/LobbyCrear';
import LobbyUnirse     from './vistas/LobbyUnirse';
import SalaJugador     from './vistas/SalaJugador';
import Tablero         from './vistas/Tablero';
import EntradaTablero  from './vistas/EntradaTablero';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SalaProvider>
        <Routes>
          <Route path="/"               element={<MenuPrincipal />} />
          <Route path="/crear"          element={<LobbyCrear />} />
          <Route path="/unirse"         element={<LobbyUnirse />} />
          <Route path="/unirse/:codigo" element={<LobbyUnirse />} />
          <Route path="/sala"           element={<SalaJugador />} />
          <Route path="/tablero"        element={<EntradaTablero />} />
          <Route path="/tablero/:codigo" element={<Tablero />} />
        </Routes>
      </SalaProvider>
    </BrowserRouter>
  </React.StrictMode>
);
