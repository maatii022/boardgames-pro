// ============================================================
// PÁGINA DE UNIRSE — Se abre al escanear el QR
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../SocketContext';
import { EVENTOS } from '../../../compartido/constantes';

export default function UnirseConQR() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [sala, setSala] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Comprobar que la sala existe
  useEffect(() => {
    fetch(`/api/sala/${codigo}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setSala(data);
        setCargando(false);
      })
      .catch(() => { setError('No se pudo conectar'); setCargando(false); });
  }, [codigo]);

  // Escuchar eventos
  useEffect(() => {
    if (!socket) return;

    const onSalaActualizada = (data) => {
      navigate(`/lobby/feed-the-kraken`, { state: { sala: data, unido: true } });
    };

    const onEstadoJuego = (estado) => {
      navigate(`/juego/${codigo}`, { state: { estado } });
    };

    const onError = ({ mensaje }) => { setError(mensaje); };

    socket.on(EVENTOS.SALA_ACTUALIZADA, onSalaActualizada);
    socket.on(EVENTOS.ESTADO_JUEGO, onEstadoJuego);
    socket.on(EVENTOS.ERROR, onError);

    return () => {
      socket.off(EVENTOS.SALA_ACTUALIZADA, onSalaActualizada);
      socket.off(EVENTOS.ESTADO_JUEGO, onEstadoJuego);
      socket.off(EVENTOS.ERROR, onError);
    };
  }, [socket, codigo, navigate]);

  const unirse = () => {
    if (!nombre.trim()) return setError('Introduce tu nombre');
    setError('');
    socket.emit(EVENTOS.UNIRSE_SALA, {
      codigo,
      nombre: nombre.trim(),
    });
  };

  if (cargando) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', flexDirection: 'column', gap: 16,
      }}>
        <div className="fondo-animado" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 40 }}
        >
          ⚓
        </motion.div>
        <p style={{ fontFamily: 'var(--fuente-ui)', color: 'var(--color-texto-dim)' }}>
          Buscando la sala...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="fondo-animado" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}
      >
        {error && !sala ? (
          <div className="tarjeta" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <p style={{ fontFamily: 'var(--fuente-ui)', color: 'var(--color-error)' }}>{error}</p>
            <button
              className="btn btn-secundario"
              style={{ marginTop: 20 }}
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <div className="tarjeta tarjeta-oro borde-pergamino">
            {/* Cabecera */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🦑</div>
              <h2 style={{
                fontFamily: 'var(--fuente-titulo)', fontSize: 18,
                color: 'var(--color-oro)',
              }}>
                Feed The Kraken
              </h2>
              {sala && (
                <p style={{
                  marginTop: 8, fontFamily: 'var(--fuente-ui)',
                  fontSize: 13, color: 'var(--color-texto-dim)',
                }}>
                  Sala <span style={{ color: 'var(--color-oro)' }}>{codigo}</span>
                  {' · '}{sala.jugadores.length} jugadores
                </p>
              )}
            </div>

            {/* Separador */}
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, var(--color-borde-oro), transparent)',
              marginBottom: 24,
            }} />

            <label style={{
              display: 'block', fontFamily: 'var(--fuente-ui)',
              fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-texto-dim)',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              ¿Cómo te llamas, marinero?
            </label>

            <input
              type="text"
              placeholder="Tu nombre..."
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && unirse()}
              maxLength={20}
              autoFocus
            />

            {error && (
              <p style={{
                color: 'var(--color-error)', fontFamily: 'var(--fuente-ui)',
                fontSize: 13, textAlign: 'center', marginTop: 10,
              }}>
                {error}
              </p>
            )}

            <button
              className="btn btn-primario"
              style={{ width: '100%', marginTop: 20 }}
              onClick={unirse}
              disabled={!nombre.trim()}
            >
              Unirme a la tripulación
            </button>

            {sala?.jugadores?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{
                  fontFamily: 'var(--fuente-ui)', fontSize: 11,
                  color: 'var(--color-texto-dim)', letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: 10, textAlign: 'center',
                }}>
                  Ya a bordo
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {sala.jugadores.map(j => (
                    <span key={j.nombre} style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--color-borde)',
                      borderRadius: 20, padding: '4px 12px',
                      fontFamily: 'var(--fuente-ui)', fontSize: 12,
                      color: 'var(--color-texto-dim)',
                    }}>
                      {j.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
