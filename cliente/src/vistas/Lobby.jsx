// ============================================================
// LOBBY — Crear sala, mostrar QR, lista de jugadores, panel host
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket, guardarSesion } from '../SocketContext';
import { EVENTOS } from '../../../compartido/constantes';

const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';

export default function Lobby() {
  const { juegoId } = useParams();
  const navigate = useNavigate();
  const { socket, jugadorId } = useSocket();

  const [pantalla, setPantalla] = useState('nombre'); // 'nombre' | 'sala' | 'tablero_espera'
  const [nombre, setNombre] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [sala, setSala] = useState(null);
  const [error, setError] = useState('');
  const [modoTablero, setModoTablero] = useState(false);

  const esHost = sala?.hostId === socket?.id;

  // ── Escuchar eventos del servidor ───────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onSalaActualizada = (data) => {
      setSala(data);
      if (pantalla === 'nombre') setPantalla('sala');
    };

    const onUnidoASala = ({ sala: salaData, reconectado }) => {
      setSala(salaData);
      setPantalla('sala');
      if (reconectado) console.log('🔄 Reconectado a sala existente');
    };

    const onSalaCreada = ({ sala: salaData }) => {
      setSala(salaData);
      setPantalla('sala');
      guardarSesion(salaData.codigo, nombre);
    };

    const onEstadoJuego = ({ fase }) => {
      if (!sala?.codigo) return;
      // Navegar cuando la partida comienza (sale del lobby)
      if (fase && fase !== 'lobby') {
        if (modoTablero) {
          navigate(`/tablero/${sala.codigo}`);
        } else {
          navigate(`/juego/${sala.codigo}`);
        }
      }
    };

    const onError = ({ mensaje }) => setError(mensaje);

    socket.on(EVENTOS.SALA_ACTUALIZADA, onSalaActualizada);
    socket.on('sala-creada', onSalaCreada);
    socket.on('unido-a-sala', onUnidoASala);
    socket.on(EVENTOS.FASE_CAMBIADA, onEstadoJuego);
    socket.on(EVENTOS.ERROR, onError);

    return () => {
      socket.off(EVENTOS.SALA_ACTUALIZADA, onSalaActualizada);
      socket.off('sala-creada', onSalaCreada);
      socket.off('unido-a-sala', onUnidoASala);
      socket.off(EVENTOS.FASE_CAMBIADA, onEstadoJuego);
      socket.off(EVENTOS.ERROR, onError);
    };
  }, [socket, pantalla, modoTablero, sala, navigate]);

  // ── Acciones ────────────────────────────────────────────────
  const crearSala = () => {
    if (!nombre.trim()) return setError('Introduce tu nombre');
    setError('');
    socket.emit(EVENTOS.CREAR_SALA, { nombre: nombre.trim(), jugadorId });
  };

  const unirseASala = () => {
    if (!nombre.trim()) return setError('Introduce tu nombre');
    if (!codigoManual.trim()) return setError('Introduce el código de sala');
    setError('');
    guardarSesion(codigoManual.trim().toUpperCase(), nombre.trim());
    socket.emit(EVENTOS.UNIRSE_SALA, {
      codigo: codigoManual.trim().toUpperCase(),
      nombre: nombre.trim(),
      jugadorId,
    });
  };

  const unirseComoTablero = () => {
    if (!codigoManual.trim()) return setError('Introduce el código de sala');
    socket.emit('unirse-tablero', { codigo: codigoManual.trim().toUpperCase() });
    setModoTablero(true);
  };

  const iniciarPartida = () => {
    socket.emit(EVENTOS.HOST_INICIAR_PARTIDA);
  };

  const seleccionarHost = (nuevoHostId) => {
    socket.emit(EVENTOS.SELECCIONAR_HOST, {
      codigo: sala.codigo,
      nuevoHostId,
    });
  };

  // ── Renderizado ──────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div className="fondo-animado" />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%',
        padding: '24px',
        overflowY: 'auto',
      }}>

        <AnimatePresence mode="wait">
          {pantalla === 'nombre' ? (
            <PantallaEntrada
              key="entrada"
              nombre={nombre} setNombre={setNombre}
              codigoManual={codigoManual} setCodigoManual={setCodigoManual}
              error={error} setError={setError}
              onCrear={crearSala}
              onUnirse={unirseASala}
              onTablero={unirseComoTablero}
              onVolver={() => navigate('/')}
            />
          ) : (
            <PantallaSala
              key="sala"
              sala={sala}
              socket={socket}
              esHost={esHost}
              onIniciar={iniciarPartida}
              onSeleccionarHost={seleccionarHost}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// ── Pantalla de entrada ──────────────────────────────────────
function PantallaEntrada({
  nombre, setNombre, codigoManual, setCodigoManual,
  error, setError, onCrear, onUnirse, onTablero, onVolver,
}) {
  const [modo, setModo] = useState('crear'); // 'crear' | 'unirse' | 'tablero'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      style={{ width: '100%', maxWidth: 420 }}
    >
      {/* Botón volver */}
      <button
        onClick={onVolver}
        style={{
          background: 'none', border: 'none', color: 'var(--color-texto-dim)',
          fontFamily: 'var(--fuente-ui)', fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 24, letterSpacing: '0.05em',
        }}
      >
        ← Volver
      </button>

      <div className="tarjeta tarjeta-oro borde-pergamino">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🦑</div>
          <h2 style={{
            fontFamily: 'var(--fuente-titulo)', fontSize: 20,
            color: 'var(--color-oro)', letterSpacing: '0.05em',
          }}>
            Feed The Kraken
          </h2>
        </div>

        {/* Selector de modo */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.3)',
          borderRadius: 'var(--radio)', padding: 4, marginBottom: 24, gap: 2,
        }}>
          {[
            { id: 'crear', label: 'Crear sala' },
            { id: 'unirse', label: 'Unirse' },
            { id: 'tablero', label: '📺 Tablero' },
          ].map(m => (
            <button key={m.id} onClick={() => setModo(m.id)} style={{
              flex: 1, padding: '8px 4px',
              background: modo === m.id ? 'var(--color-borde-oro)' : 'transparent',
              color: modo === m.id ? '#0a0612' : 'var(--color-texto-dim)',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'var(--fuente-ui)', fontSize: 11,
              fontWeight: modo === m.id ? 700 : 400,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Nombre (siempre visible excepto en tablero) */}
        {modo !== 'tablero' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontFamily: 'var(--fuente-ui)',
              fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-texto-dim)',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Tu nombre
            </label>
            <input
              type="text"
              placeholder="Capitán Sparrow..."
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && (modo === 'crear' ? onCrear() : onUnirse())}
              maxLength={20}
            />
          </div>
        )}

        {/* Código de sala */}
        {(modo === 'unirse' || modo === 'tablero') && (
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontFamily: 'var(--fuente-ui)',
              fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-texto-dim)',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Código de sala
            </label>
            <input
              type="text"
              placeholder="ABC123"
              value={codigoManual}
              onChange={e => { setCodigoManual(e.target.value.toUpperCase()); setError(''); }}
              maxLength={6}
              style={{ textAlign: 'center', fontSize: 24, letterSpacing: '0.3em', fontWeight: 700 }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{
            color: 'var(--color-error)', fontFamily: 'var(--fuente-ui)',
            fontSize: 13, textAlign: 'center', marginBottom: 12,
          }}>
            {error}
          </p>
        )}

        {/* Acción */}
        <button
          className="btn btn-primario"
          style={{ width: '100%', marginTop: 8 }}
          onClick={modo === 'crear' ? onCrear : modo === 'unirse' ? onUnirse : onTablero}
        >
          {modo === 'crear' ? 'Crear sala' : modo === 'unirse' ? 'Unirse' : 'Conectar tablero'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Pantalla de sala ─────────────────────────────────────────
function PantallaSala({ sala, socket, esHost, onIniciar, onSeleccionarHost }) {
  if (!sala) return null;

  const urlUnirse = `${CLIENT_URL}/unirse/${sala.codigo}`;
  const jugadores = sala.jugadores || [];
  const minJugadores = 5;
  const puedeIniciar = esHost && jugadores.length >= minJugadores;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      style={{ width: '100%', maxWidth: 700 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Panel izquierdo — info de sala */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Código de sala */}
          <div className="tarjeta tarjeta-oro" style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--fuente-ui)', fontSize: 11,
              color: 'var(--color-texto-dim)', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Código de sala
            </p>
            <p style={{
              fontFamily: 'var(--fuente-titulo)', fontSize: 36,
              color: 'var(--color-oro)', letterSpacing: '0.3em',
              textShadow: '0 0 20px rgba(201,168,76,0.5)',
            }}>
              {sala.codigo}
            </p>
          </div>

          {/* QR */}
          <div className="tarjeta" style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--fuente-ui)', fontSize: 11,
              color: 'var(--color-texto-dim)', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 12,
            }}>
              Escanea para unirte
            </p>
            <div style={{
              display: 'inline-block', padding: 12,
              background: '#f5e6d3', borderRadius: 8,
            }}>
              <QRCodeSVG value={urlUnirse} size={160} />
            </div>
            <p style={{
              marginTop: 8, fontSize: 11,
              color: 'var(--color-texto-dim)', fontFamily: 'var(--fuente-ui)',
              wordBreak: 'break-all',
            }}>
              {urlUnirse}
            </p>
          </div>

          {/* Panel host */}
          {esHost && (
            <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{
                fontFamily: 'var(--fuente-ui)', fontSize: 11,
                color: 'var(--color-oro)', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 4,
              }}>
                ⚓ Panel del Host
              </p>
              <button
                className="btn btn-primario"
                disabled={!puedeIniciar}
                onClick={onIniciar}
                style={{ width: '100%' }}
              >
                Iniciar partida
              </button>
              {!puedeIniciar && jugadores.length < minJugadores && (
                <p style={{
                  fontSize: 12, color: 'var(--color-texto-dim)',
                  fontFamily: 'var(--fuente-ui)', textAlign: 'center',
                }}>
                  Faltan {minJugadores - jugadores.length} jugadores más
                </p>
              )}
            </div>
          )}
        </div>

        {/* Panel derecho — jugadores */}
        <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{
            fontFamily: 'var(--fuente-ui)', fontSize: 11,
            color: 'var(--color-texto-dim)', letterSpacing: '0.1em',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            Jugadores ({jugadores.length}/11)
          </p>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {jugadores.map((j, idx) => (
                <motion.div
                  key={j.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: j.id === socket?.id
                      ? 'rgba(201,168,76,0.1)'
                      : 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radio)',
                    border: `1px solid ${j.id === socket?.id ? 'var(--color-borde-oro)' : 'var(--color-borde)'}`,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--color-borde)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>
                    {j.esHost ? '⚓' : '🏴'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'var(--fuente-ui)', fontSize: 14,
                      color: j.id === socket?.id ? 'var(--color-oro)' : 'var(--color-texto)',
                    }}>
                      {j.nombre}
                      {j.id === socket?.id && (
                        <span style={{ fontSize: 11, color: 'var(--color-texto-dim)', marginLeft: 6 }}>
                          (tú)
                        </span>
                      )}
                    </p>
                    {j.esHost && (
                      <p style={{ fontSize: 11, color: 'var(--color-oro)', fontFamily: 'var(--fuente-ui)' }}>
                        Host
                      </p>
                    )}
                  </div>

                  {/* Botón para hacer host (solo el host actual puede) */}
                  {esHost && !j.esHost && socket?.id !== j.id && (
                    <button
                      onClick={() => onSeleccionarHost(j.id)}
                      style={{
                        background: 'none', border: '1px solid var(--color-borde)',
                        color: 'var(--color-texto-dim)', borderRadius: 4,
                        padding: '3px 8px', cursor: 'pointer',
                        fontFamily: 'var(--fuente-ui)', fontSize: 10,
                        letterSpacing: '0.05em',
                      }}
                      title="Hacer host"
                    >
                      ⚓
                    </button>
                  )}

                  {/* Indicador de conexión */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: j.conectado ? 'var(--color-exito)' : 'var(--color-error)',
                  }} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
