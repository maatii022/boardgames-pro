import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { AudioProvider } from './contextos/AudioContexto';
import { SalaProvider } from './contextos/SalaContexto';
import MenuPrincipal   from './vistas/MenuPrincipal';
import LobbyCrear      from './vistas/LobbyCrear';
import LobbyUnirse     from './vistas/LobbyUnirse';
import SalaJugador     from './vistas/SalaJugador';
import Tablero              from './vistas/Tablero';
import EntradaTablero       from './vistas/EntradaTablero';
import PreviewSalaEspera    from './vistas/PreviewSalaEspera';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AudioProvider>
    <BrowserRouter>
      <SalaProvider>
        <Routes>
          <Route path="/"               element={<MenuPrincipal />} />
          <Route path="/crear"          element={<LobbyCrear />} />
          <Route path="/unirse"         element={<LobbyUnirse />} />
          <Route path="/unirse/:codigo" element={<LobbyUnirse />} />
          <Route path="/sala"           element={<SalaJugador />} />
          <Route path="/tablero"        element={<EntradaTablero />} />
          <Route path="/tablero/:codigo"        element={<Tablero />} />
          <Route path="/preview/sala-espera"   element={<PreviewSalaEspera />} />
        </Routes>
      </SalaProvider>
    </BrowserRouter>
    </AudioProvider>
  </React.StrictMode>
);
