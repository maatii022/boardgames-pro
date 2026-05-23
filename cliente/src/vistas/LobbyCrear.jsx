import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../hooks/useSocket';

export default function LobbyCrear() {
  const navigate = useNavigate();
  const location = useLocation();
  const { emitir, escuchar, conectado, socketId } = useSocket();
  const [nombre, setNombre] = useState('');
  const [sala, setSala] = useState(null);
  const [paso, setPaso] = useState('nombre'); // 'nombre' | 'sala'
  const [error, setError] = useState('');
  const [hostSeleccionado, setHostSeleccionado] = useState(null);

  const urlBase = window.location.origin;

  useEffect(() => {
    const cleanupSala = escuchar('sala-creada', ({ sala }) => {
      setSala(sala);
      setHostSeleccionado(sala.hostId);
      setPaso('sala');
    });
    const cleanupActualizada = escuchar('sala-actualizada', (salaActualizada) => {
      setSala(salaActualizada);
    });
    const cleanupError = escuchar('error', ({ mensaje }) => setError(mensaje));
    const cleanupFase = escuchar('fase-cambiada', ({ fase }) => {
      if (fase === 'fase_0') {
        navigate('/sala', { state: { sala, esHost: true } });
      }
    });
    return () => { cleanupSala(); cleanupActualizada(); cleanupError(); cleanupFase(); };
  }, [escuchar, sala, navigate]);

  const crearSala = () => {
    if (!nombre.trim()) return setError('Introduce tu nombre');
    if (!conectado) return setError('Conectando al servidor...');
    setError('');
    emitir('crear-sala', { nombre: nombre.trim() });
  };

  const iniciarPartida = () => {
    if (!sala || sala.numJugadores < 5) return setError('Se necesitan al menos 5 jugadores');
    emitir('host-iniciar-partida');
  };

  const cambiarHost = (nuevoId) => {
    setHostSeleccionado(nuevoId);
    emitir('seleccionar-host', { nuevoHostId: nuevoId });
  };

  const irATablero = () => {
    if (sala) navigate(`/tablero/${sala.codigo}`);
  };

  if (paso === 'nombre') {
    return (
      <div className="fondo-mar" style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}>
        <div className="aparecer" style={{
          background: 'rgba(13,27,46,0.9)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '16px',
          padding: '48px 40px',
          width: '100%', maxWidth: '440px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', color: 'rgba(245,230,200,0.4)',
            fontFamily: 'var(--fuente-subtitulo)', fontSize: '12px',
            letterSpacing: '2px', textTransform: 'uppercase',
            marginBottom: '32px', display: 'block',
          }}>← Volver</button>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🐙</div>
            <h1 style={{
              fontFamily: 'var(--fuente-titulo)', fontSize: '22px',
              color: 'var(--oro-dorado)', letterSpacing: '3px',
              textShadow: '0 0 20px rgba(201,168,76,0.4)',
            }}>Feed The Kraken</h1>
            <p style={{
              fontFamily: 'var(--fuente-subtitulo)',
              color: 'rgba(245,230,200,0.4)',
              fontSize: '11px', letterSpacing: '2px',
              textTransform: 'uppercase', marginTop: '6px',
            }}>Nueva partida</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontFamily: 'var(--fuente-subtitulo)',
              color: 'var(--oro-dorado)', fontSize: '11px',
              letterSpacing: '2px', textTransform: 'uppercase',
              display: 'block', marginBottom: '8px',
            }}>Tu nombre</label>
            <input
              className="input-tema"
              type="text"
              placeholder="Capitán..."
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && crearSala()}
              maxLength={20}
              autoFocus
            />
          </div>

          {error && (
            <p style={{ color: '#ff8a8a', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>
          )}

          <button className="btn-primario" onClick={crearSala} style={{ width: '100%' }}
            disabled={!conectado}>
            {conectado ? '⚓ Crear Sala' : '🔄 Conectando...'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fondo-mar" style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', padding: '24px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>

        {/* Header sala */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '32px',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--fuente-titulo)',
              color: 'var(--oro-dorado)', fontSize: '28px', letterSpacing: '3px',
            }}>Sala de Espera</h1>
            <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.4)', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Feed The Kraken
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secundario" onClick={irATablero} style={{ fontSize: '11px' }}>
              📺 Abrir Tablero
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>

          {/* Panel izquierdo: jugadores */}
          <div>
            <div style={{
              background: 'rgba(13,27,46,0.8)', borderRadius: '12px',
              border: '1px solid rgba(201,168,76,0.2)', padding: '28px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--crema-pergamino)', fontSize: '16px', letterSpacing: '2px' }}>
                  TRIPULACIÓN
                </h2>
                <span style={{
                  fontFamily: 'var(--fuente-subtitulo)',
                  color: sala?.numJugadores >= 5 ? '#98e4a5' : 'var(--oro-dorado)',
                  fontSize: '13px',
                }}>
                  {sala?.numJugadores || 0}/11 jugadores
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sala?.jugadores?.map((j, i) => (
                  <div key={j.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '8px',
                    background: j.id === sala.hostId
                      ? 'rgba(201,168,76,0.1)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${j.id === sala.hostId ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    animation: `aparecer 0.4s ease ${i * 0.08}s both`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${j.id === sala.hostId ? '#c9a84c' : '#1a3a5c'}, ${j.id === sala.hostId ? '#e8c97a' : '#0d1b2e'})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0,
                    }}>
                      {j.id === sala.hostId ? '⚓' : '🧑‍✈️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--fuente-subtitulo)', fontSize: '14px', color: 'var(--crema-pergamino)' }}>
                        {j.nombre}
                      </div>
                      {j.id === sala.hostId && (
                        <div style={{ fontSize: '10px', color: 'var(--oro-dorado)', letterSpacing: '1px', textTransform: 'uppercase' }}>Host</div>
                      )}
                    </div>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: j.conectado ? '#98e4a5' : '#ff8a8a',
                    }} />
                    {j.id !== sala.hostId && j.id !== socketId && (
                      <button
                        onClick={() => cambiarHost(j.id)}
                        style={{
                          background: 'rgba(201,168,76,0.1)',
                          border: '1px solid rgba(201,168,76,0.2)',
                          color: 'var(--oro-dorado)', borderRadius: '4px',
                          padding: '4px 8px', fontSize: '10px',
                          fontFamily: 'var(--fuente-subtitulo)',
                          cursor: 'pointer', letterSpacing: '1px',
                        }}
                        title="Hacer Host">
                        Host
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {sala?.numJugadores < 5 && (
                <div style={{
                  marginTop: '16px', padding: '10px',
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '6px', textAlign: 'center',
                }}>
                  <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.6)', fontSize: '13px' }}>
                    Necesitas al menos 5 jugadores para iniciar ({5 - sala.numJugadores} más)
                  </p>
                </div>
              )}
            </div>

            {/* Panel host */}
            <div style={{
              background: 'rgba(201,168,76,0.05)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px', padding: '24px',
            }}>
              <h3 style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'var(--oro-dorado)', fontSize: '12px',
                letterSpacing: '3px', textTransform: 'uppercase',
                marginBottom: '16px',
              }}>⚓ Panel del Host</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="btn-primario"
                  onClick={iniciarPartida}
                  disabled={!sala || sala.numJugadores < 5}
                  style={{ flex: 1, minWidth: '140px' }}>
                  🎮 Iniciar Partida
                </button>
              </div>
              {error && <p style={{ color: '#ff8a8a', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
            </div>
          </div>

          {/* Panel derecho: código y QR */}
          <div>
            <div style={{
              background: 'rgba(13,27,46,0.8)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px', padding: '28px',
              textAlign: 'center', marginBottom: '20px',
            }}>
              <p style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'rgba(245,230,200,0.4)',
                fontSize: '10px', letterSpacing: '3px',
                textTransform: 'uppercase', marginBottom: '12px',
              }}>Código de Sala</p>
              <div style={{
                fontFamily: 'var(--fuente-titulo)',
                fontSize: '52px',
                color: 'var(--oro-dorado)',
                letterSpacing: '12px',
                textShadow: '0 0 30px rgba(201,168,76,0.6)',
                animation: 'pulsar-oro 3s ease-in-out infinite',
                marginBottom: '24px',
              }}>
                {sala?.codigo}
              </div>

              <div className="divisor-oro"><span>◈</span></div>

              <p style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'rgba(245,230,200,0.4)',
                fontSize: '10px', letterSpacing: '3px',
                textTransform: 'uppercase', margin: '20px 0 16px',
              }}>O escanea el QR</p>

              <div style={{
                display: 'inline-block',
                padding: '16px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 0 30px rgba(10,147,150,0.3)',
              }}>
                <QRCodeSVG
                  value={`${urlBase}/unirse/${sala?.codigo}`}
                  size={160}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#08070f"
                />
              </div>

              <p style={{
                fontFamily: 'var(--fuente-cuerpo)',
                color: 'rgba(245,230,200,0.3)',
                fontSize: '12px', marginTop: '12px',
              }}>
                {urlBase}/unirse/{sala?.codigo}
              </p>
            </div>

            {/* Instrucciones */}
            <div style={{
              background: 'rgba(10,147,150,0.05)',
              border: '1px solid rgba(10,147,150,0.2)',
              borderRadius: '12px', padding: '20px',
            }}>
              <h4 style={{
                fontFamily: 'var(--fuente-subtitulo)',
                color: 'var(--turquesa-kraken)', fontSize: '11px',
                letterSpacing: '2px', textTransform: 'uppercase',
                marginBottom: '12px',
              }}>Cómo unirse</h4>
              {[
                '📱 Escanea el QR con tu móvil',
                '🔢 O ve a la web e introduce el código',
                '✍️ Escribe tu nombre',
                '⚓ ¡Espera a que el Host inicie!',
              ].map((paso, i) => (
                <p key={i} style={{
                  fontFamily: 'var(--fuente-cuerpo)',
                  color: 'rgba(245,230,200,0.6)',
                  fontSize: '13px', marginBottom: '6px',
                }}>{paso}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
