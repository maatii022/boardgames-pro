import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

export default function EntradaTablero() {
  const navigate = useNavigate();
  const { emitir, escuchar, conectado } = useSocket();
  const [modo, setModo] = useState('elegir'); // 'elegir' | 'unirse' | 'creando'
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const c1 = escuchar('sala-creada', ({ sala }) => {
      navigate(`/tablero/${sala.codigo}`);
    });
    const c2 = escuchar('error', ({ mensaje }) => {
      setError(mensaje);
      setModo('elegir');
    });
    return () => { c1(); c2(); };
  }, [escuchar, navigate]);

  const crearSala = () => {
    if (!conectado) return setError('Sin conexión al servidor...');
    setError('');
    setModo('creando');
    emitir('crear-sala', { nombre: 'Tablero', esSoloTablero: true });
  };

  const conectarSala = () => {
    if (!codigo.trim() || codigo.trim().length < 4) return setError('Introduce el código de sala');
    navigate(`/tablero/${codigo.trim().toUpperCase()}`);
  };

  return (
    <div className="fondo-mar" style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div className="aparecer" style={{
        background: 'rgba(13,27,46,0.92)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: '16px', padding: '48px 40px',
        width: '100%', maxWidth: '480px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '52px', marginBottom: '16px', animation: 'flotar 3s ease-in-out infinite' }}>🐙</div>
        <h1 style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '24px', color: 'var(--oro-dorado)', letterSpacing: '3px', marginBottom: '6px' }}>
          Feed The Kraken
        </h1>
        <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.35)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '40px' }}>
          Pantalla principal
        </p>

        {modo === 'elegir' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              <button onClick={crearSala} disabled={!conectado} style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(232,201,122,0.08))',
                border: '1px solid rgba(201,168,76,0.4)', borderRadius: '12px',
                padding: '22px 24px', cursor: conectado ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s', textAlign: 'left', opacity: conectado ? 1 : 0.5,
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🆕</div>
                <div style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)', fontSize: '15px', letterSpacing: '1px', marginBottom: '4px' }}>
                  Crear nueva sala
                </div>
                <div style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.5)', fontSize: '13px' }}>
                  Genera un código y QR para que los jugadores se unan
                </div>
              </button>

              <button onClick={() => setModo('unirse')} style={{
                background: 'rgba(10,147,150,0.08)', border: '1px solid rgba(10,147,150,0.3)',
                borderRadius: '12px', padding: '22px 24px', cursor: 'pointer',
                transition: 'all 0.3s', textAlign: 'left',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📺</div>
                <div style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--turquesa-kraken)', fontSize: '15px', letterSpacing: '1px', marginBottom: '4px' }}>
                  Conectar a sala existente
                </div>
                <div style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.5)', fontSize: '13px' }}>
                  Introduce el código de una sala ya creada
                </div>
              </button>
            </div>

            {error && <p style={{ color: '#ff8a8a', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

            <button onClick={() => navigate('/')} style={{
              background: 'none', border: 'none', color: 'rgba(245,230,200,0.28)',
              fontFamily: 'var(--fuente-subtitulo)', fontSize: '11px',
              letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
            }}>← Menú principal</button>
          </>
        )}

        {modo === 'creando' && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: 'var(--oro-dorado)',
                  animation: `pulsar-oro 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.5)', fontSize: '13px', letterSpacing: '2px' }}>
              Creando sala...
            </p>
          </div>
        )}

        {modo === 'unirse' && (
          <>
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{
                fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)',
                fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                display: 'block', marginBottom: '10px',
              }}>Código de sala</label>
              <input
                className="input-tema" type="text" placeholder="XXXX"
                value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && conectarSala()}
                maxLength={4} autoFocus
                style={{ textAlign: 'center', fontSize: '36px', letterSpacing: '12px', fontFamily: 'var(--fuente-titulo)' }}
              />
            </div>
            {error && <p style={{ color: '#ff8a8a', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secundario" onClick={() => { setModo('elegir'); setError(''); }} style={{ flex: 1 }}>← Volver</button>
              <button className="btn-primario" onClick={conectarSala} style={{ flex: 2 }}>📺 Conectar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
