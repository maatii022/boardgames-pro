import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../hooks/useSocket';

const urlBase = 'https://boardgames-pro.onrender.com';

const FASE_INFO = {
  lobby:     { label: 'Sala de Espera',              color: 'var(--oro-dorado)' },
  fase_0:    { label: 'Revelando Roles',             color: 'var(--turquesa-kraken)' },
  durmiendo: { label: 'La tripulación duerme...',    color: '#7ec8e3' },
  fase_1:    { label: 'Eligiendo Equipo',            color: 'var(--oro-dorado)' },
  fase_2:    { label: 'Votación de Motín',           color: '#ff8a8a' },
  fase_3:    { label: 'El Cofre de Navegación',      color: 'var(--oro-dorado)' },
  fase_4:    { label: 'Casilla Especial',            color: 'var(--turquesa-kraken)' },
  fase_5:    { label: 'Fin de Turno',                color: 'rgba(245,230,200,0.4)' },
  victoria:  { label: '¡VICTORIA!',                  color: '#e8c97a' },
};

export default function Tablero() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { emitir, escuchar, conectado, socketId } = useSocket();
  const [sala, setSala] = useState(null);
  const [tablero, setTablero] = useState(null);
  const [fase, setFase] = useState('lobby');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!codigo) return;
    emitir('unirse-tablero', { codigo: codigo.toUpperCase() });

    const c1 = escuchar('tablero-conectado', ({ sala }) => { setSala(sala); setFase(sala.fase); });
    const c2 = escuchar('tablero-actualizado', (t) => { setTablero(t); setFase(t.fase); });
    const c3 = escuchar('sala-actualizada', (s) => { setSala(s); setFase(s.fase); });
    const c4 = escuchar('fase-cambiada', ({ fase: f }) => setFase(f));
    const c5 = escuchar('error', ({ mensaje }) => setError(mensaje));
    return () => { c1(); c2(); c3(); c4(); c5(); };
  }, [codigo, emitir, escuchar]);

  // Acciones del host
  const iniciarPartida = () => emitir('tablero-iniciar');
  const avanzarFase    = () => emitir('tablero-avanzar');
  const retrocederFase = () => emitir('tablero-retroceder');
  const reiniciar      = () => { if (window.confirm('¿Reiniciar la partida?')) emitir('tablero-reiniciar'); };
  const cambiarHost    = (id) => emitir('tablero-cambiar-host', { nuevoHostId: id });

  const jugadores   = tablero?.jugadores || sala?.jugadores || [];
  const numJugadores = sala?.numJugadores || jugadores.length || 0;

  // ── Cargando ──
  if (!sala) {
    return (
      <div className="fondo-mar" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px', animation: 'flotar 3s ease-in-out infinite' }}>🐙</div>
          <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)', fontSize: '14px', letterSpacing: '3px' }}>
            Conectando...
          </p>
          {error && <p style={{ color: '#ff8a8a', marginTop: '12px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── SALA DE ESPERA (LOBBY) ──
  if (fase === 'lobby') {
    return (
      <div className="fondo-mar" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 40px', borderBottom: '1px solid rgba(201,168,76,0.15)',
          background: 'rgba(8,7,15,0.85)', backdropFilter: 'blur(10px)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '30px' }}>🐙</span>
            <div>
              <h1 style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--oro-dorado)', fontSize: '20px', letterSpacing: '3px' }}>Feed The Kraken</h1>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.35)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Sala de espera
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: conectado ? '#98e4a5' : '#ff8a8a' }} />
            <button onClick={() => navigate('/')} style={{
              background: 'none', border: '1px solid rgba(245,230,200,0.15)', color: 'rgba(245,230,200,0.3)',
              padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'var(--fuente-subtitulo)', fontSize: '11px', letterSpacing: '1px',
            }}>Salir</button>
          </div>
        </div>

        {/* Cuerpo lobby */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', overflow: 'hidden' }}>

          {/* Izquierda: código QR grande */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '32px' }}>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.35)', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>
                Únete escaneando
              </p>
              <div style={{
                display: 'inline-block', padding: '20px', background: 'white',
                borderRadius: '16px', boxShadow: '0 0 60px rgba(10,147,150,0.4)',
              }}>
                <QRCodeSVG
                  value={`${urlBase}/unirse/${codigo}`}
                  size={220} level="M" bgColor="#ffffff" fgColor="#08070f"
                />
              </div>
              <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.25)', fontSize: '12px', marginTop: '12px' }}>
                {urlBase}/unirse/{codigo}
              </p>
            </div>

            <div className="divisor-oro" style={{ width: '100%', maxWidth: '300px' }}><span>◈</span></div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.35)', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px' }}>
                O introduce el código
              </p>
              <div style={{
                fontFamily: 'var(--fuente-titulo)',
                fontSize: 'clamp(56px, 8vw, 96px)',
                color: 'var(--oro-dorado)',
                letterSpacing: '20px',
                textShadow: '0 0 50px rgba(201,168,76,0.6)',
                animation: 'pulsar-oro 3s ease-in-out infinite',
              }}>
                {codigo}
              </div>
            </div>
          </div>

          {/* Derecha: jugadores + controles */}
          <div style={{
            borderLeft: '1px solid rgba(201,168,76,0.12)',
            background: 'rgba(8,7,15,0.5)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Lista jugadores */}
            <div style={{ flex: 1, padding: '28px 24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--crema-pergamino)', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Tripulación
                </h2>
                <span style={{
                  fontFamily: 'var(--fuente-subtitulo)', fontSize: '12px',
                  color: numJugadores >= 5 ? '#98e4a5' : 'var(--oro-dorado)',
                }}>
                  {numJugadores}/11
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {jugadores.map((j, i) => (
                  <div key={j.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px',
                    background: j.id === sala.hostId ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${j.id === sala.hostId ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    animation: `aparecer 0.4s ease ${i * 0.07}s both`,
                    transition: 'all 0.3s',
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: j.id === sala.hostId
                        ? 'linear-gradient(135deg, #c9a84c, #e8c97a)'
                        : 'linear-gradient(135deg, #1a3a5c, #0d1b2e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      {j.id === sala.hostId ? '⚓' : '🧑‍✈️'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--fuente-subtitulo)', fontSize: '14px', color: 'var(--crema-pergamino)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {j.nombre}
                      </p>
                      {j.id === sala.hostId && (
                        <p style={{ fontSize: '10px', color: 'var(--oro-dorado)', letterSpacing: '1px', textTransform: 'uppercase' }}>Host</p>
                      )}
                    </div>

                    {/* Indicador conexión */}
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: j.conectado !== false ? '#98e4a5' : '#ff8a8a' }} />

                    {/* Botón hacer host */}
                    {j.id !== sala.hostId && (
                      <button onClick={() => cambiarHost(j.id)} style={{
                        background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
                        color: 'var(--oro-dorado)', borderRadius: '4px', padding: '3px 8px',
                        fontSize: '10px', fontFamily: 'var(--fuente-subtitulo)',
                        cursor: 'pointer', letterSpacing: '1px', flexShrink: 0,
                      }}>host</button>
                    )}
                  </div>
                ))}

                {numJugadores === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(245,230,200,0.25)', fontFamily: 'var(--fuente-cuerpo)', fontSize: '14px' }}>
                    Esperando jugadores...
                  </div>
                )}
              </div>
            </div>

            {/* Panel inicio */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid rgba(201,168,76,0.12)',
              background: 'rgba(8,7,15,0.6)',
              flexShrink: 0,
            }}>
              {numJugadores < 5 && (
                <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.4)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
                  Faltan {5 - numJugadores} jugador{5 - numJugadores !== 1 ? 'es' : ''} para poder iniciar
                </p>
              )}
              <button
                className="btn-primario"
                onClick={iniciarPartida}
                disabled={numJugadores < 5}
                style={{ width: '100%', padding: '16px', fontSize: '15px' }}
              >
                🎮 Iniciar Partida
              </button>
              {error && <p style={{ color: '#ff8a8a', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PARTIDA EN CURSO ──
  const faseInfo = FASE_INFO[fase] || { label: fase, color: 'var(--crema-pergamino)' };
  const capitan = tablero?.capitanIdx !== null && tablero?.capitanIdx !== undefined
    ? jugadores[tablero.capitanIdx] : null;

  return (
    <div className="fondo-mar" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header partida */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 28px', borderBottom: '1px solid rgba(201,168,76,0.15)',
        background: 'rgba(8,7,15,0.85)', backdropFilter: 'blur(10px)', flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '26px' }}>🐙</span>
          <div>
            <h1 style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--oro-dorado)', fontSize: '17px', letterSpacing: '3px' }}>Feed The Kraken</h1>
            <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.35)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Sala {codigo} · Turno {tablero?.turno || 1} · {numJugadores} jugadores
            </p>
          </div>
        </div>

        {/* Fase */}
        <div style={{ background: 'rgba(13,27,46,0.9)', border: `1px solid ${faseInfo.color}50`, borderRadius: '8px', padding: '8px 20px' }}>
          <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: faseInfo.color, fontSize: '13px', letterSpacing: '2px' }}>{faseInfo.label}</p>
        </div>

        {/* Controles host */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: conectado ? '#98e4a5' : '#ff8a8a' }} />
          <button onClick={retrocederFase} title="Retroceder fase" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,230,200,0.5)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}>◀</button>
          <button onClick={avanzarFase} title="Avanzar fase" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,230,200,0.5)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}>▶</button>
          <button onClick={reiniciar} style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(192,57,43,0.3)', color: '#ff8a8a', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--fuente-subtitulo)', fontSize: '11px', letterSpacing: '1px' }}>↺ Reiniciar</button>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(245,230,200,0.15)', color: 'rgba(245,230,200,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--fuente-subtitulo)', fontSize: '11px' }}>Salir</button>
        </div>
      </div>

      {/* Cuerpo partida */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Tablero central */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '16px' }}>
          <div style={{ width: 'min(75vh, 78vw)', height: 'min(75vh, 78vw)' }}>
            <TableroHex barcoHex={tablero?.barco?.hexId || 'inicio'} />
          </div>

          {/* Overlay durmiendo */}
          {fase === 'durmiendo' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,15,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
              <div style={{ textAlign: 'center', animation: 'aparecer 1s ease' }}>
                <div style={{ fontSize: 'clamp(60px,10vw,100px)', marginBottom: '24px', animation: 'flotar 4s ease-in-out infinite' }}>🌙</div>
                <h2 style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--crema-pergamino)', fontSize: 'clamp(22px,4vw,48px)', letterSpacing: '4px', marginBottom: '12px' }}>
                  La tripulación se va a dormir
                </h2>
                <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.5)', fontSize: 'clamp(14px,2vw,20px)' }}>
                  Los piratas están abriéndose los ojos entre sí...
                </p>
                <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.3)', fontSize: '11px', letterSpacing: '2px', marginTop: '20px', textTransform: 'uppercase' }}>
                  El Host pulsa ▶ cuando estén listos
                </p>
              </div>
            </div>
          )}

          {/* Overlay victoria */}
          {fase === 'victoria' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,15,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', animation: 'aparecer 0.8s ease' }}>
                <div style={{ fontSize: 'clamp(60px,12vw,120px)', marginBottom: '24px', animation: 'flotar 2s ease-in-out infinite' }}>
                  {tablero?.victoria === 'piratas' ? '💀' : tablero?.victoria === 'marineros' ? '⚓' : '🐙'}
                </div>
                <h1 style={{ fontFamily: 'var(--fuente-titulo)', fontSize: 'clamp(28px,6vw,72px)', color: 'var(--oro-dorado)', letterSpacing: '6px', textShadow: '0 0 60px rgba(201,168,76,0.8)' }}>
                  {tablero?.victoria === 'piratas' ? 'VICTORIA PIRATA' :
                   tablero?.victoria === 'marineros' ? 'VICTORIA MARINERA' :
                   '¡EL KRAKEN HA SIDO INVOCADO!'}
                </h1>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div style={{ width: '240px', flexShrink: 0, borderLeft: '1px solid rgba(201,168,76,0.12)', background: 'rgba(8,7,15,0.65)', padding: '16px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {capitan && (
            <div style={{ padding: '10px 14px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '8px' }}>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px' }}>Capitán</p>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--crema-pergamino)', fontSize: '15px' }}>⚓ {capitan.nombre}</p>
            </div>
          )}

          <div>
            <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.28)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Tripulación ({numJugadores})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {jugadores.map((j, i) => (
                <div key={j.id || i} style={{
                  padding: '8px 10px', borderRadius: '6px',
                  background: j.esCapitan ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${j.esCapitan ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: j.fueraDeServicio ? 0.38 : j.conectado === false ? 0.45 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, background: j.conectado === false ? '#ff8a8a' : '#98e4a5' }} />
                    <span style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'var(--crema-pergamino)', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.nombre}</span>
                    <span style={{ fontSize: '11px', flexShrink: 0 }}>
                      {j.esCapitan && '⚓'}{j.esTeniente && '🎖️'}{j.esNavegante && '🧭'}{j.fueraDeServicio && '😴'}
                    </span>
                  </div>
                  {j.curriculos > 0 && (
                    <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.28)', fontSize: '10px', marginTop: '3px', paddingLeft: '12px' }}>📜 {j.curriculos}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {tablero && (
            <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: '12px' }}>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.28)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Mazo</p>
              <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '20px', marginBottom: '2px' }}>🃏</div>
                <div style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--crema-pergamino)', fontSize: '22px' }}>{tablero.mazoDisponibleCount}</div>
                <div style={{ fontSize: '9px', color: 'rgba(245,230,200,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>disponible</div>
              </div>
            </div>
          )}

          {fase === 'fase_2' && tablero?.motin && (
            <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: '#ff8a8a', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Motín</p>
              <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.6)', fontSize: '12px' }}>Votando: {tablero.motin.confirmados}/{tablero.motin.total}</p>
              <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.4)', fontSize: '11px' }}>Umbral: {tablero.motin.umbral} pistolas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SVG Tablero hexagonal ──
function TableroHex({ barcoHex }) {
  const hexs = [
    { id: 'puerto_piratas',   x: 22, y: 10, tipo: 'puerto_piratas',   label: 'Cala Carmesí' },
    { id: 'kraken_centro',    x: 50, y: 6,  tipo: 'kraken',           label: 'El Kraken' },
    { id: 'puerto_marineros', x: 78, y: 10, tipo: 'puerto_marineros', label: 'Bahía Azul' },
    { id: 'mid_izq_alto',     x: 30, y: 24, tipo: 'normal' },
    { id: 'mid_centro_alto',  x: 50, y: 24, tipo: 'lupa' },
    { id: 'mid_der_alto',     x: 70, y: 24, tipo: 'normal' },
    { id: 'izq_medio',        x: 14, y: 40, tipo: 'kraken_menor' },
    { id: 'mid_izq_medio',    x: 36, y: 40, tipo: 'normal' },
    { id: 'mid_centro_medio', x: 50, y: 40, tipo: 'lupa' },
    { id: 'mid_der_medio',    x: 64, y: 40, tipo: 'normal' },
    { id: 'der_medio',        x: 86, y: 40, tipo: 'kraken_menor' },
    { id: 'mid_izq_bajo',     x: 36, y: 57, tipo: 'normal' },
    { id: 'mid_centro_bajo',  x: 50, y: 57, tipo: 'lupa' },
    { id: 'mid_der_bajo',     x: 64, y: 57, tipo: 'normal' },
    { id: 'inicio',           x: 50, y: 75, tipo: 'inicio',           label: 'Isla Cangrejo' },
  ];
  const colores = { puerto_piratas: '#3a0a0a', puerto_marineros: '#0a1a30', kraken: '#2a2000', kraken_menor: '#0a200a', lupa: '#0a1830', normal: '#0d1b2e', inicio: '#112240' };
  const bordes  = { puerto_piratas: '#c0392b', puerto_marineros: '#4a9bc7', kraken: '#e9c46a', kraken_menor: '#4caf50', lupa: '#0a9396', normal: 'rgba(201,168,76,0.22)', inicio: 'rgba(201,168,76,0.55)' };
  const iconos  = { kraken: '🐙', kraken_menor: '🐙', lupa: '🔍', puerto_piratas: '💀', puerto_marineros: '⚓', inicio: '🏝️' };
  const R = 8;

  return (
    <svg viewBox="0 0 100 88" style={{ width: '100%', height: '100%' }}>
      <rect width="100" height="88" fill="#08101e" rx="5" />
      <ellipse cx="50" cy="44" rx="46" ry="38" fill="#0c1c34" opacity="0.6" />
      {hexs.map(h => {
        const esBarco = barcoHex === h.id;
        const pts = hexPoints(h.x, h.y, R);
        return (
          <g key={h.id}>
            <polygon points={pts} fill={colores[h.tipo] || '#0d1b2e'} stroke={esBarco ? '#e8c97a' : bordes[h.tipo] || 'rgba(201,168,76,0.2)'} strokeWidth={esBarco ? 0.7 : 0.35} />
            {iconos[h.tipo] && <text x={h.x} y={h.y + 0.8} textAnchor="middle" dominantBaseline="middle" fontSize="4">{iconos[h.tipo]}</text>}
            {esBarco && <text x={h.x} y={h.y - R - 1.5} textAnchor="middle" dominantBaseline="middle" fontSize="5">⛵</text>}
            {h.label && <text x={h.x} y={h.y + R + 2.2} textAnchor="middle" fontSize="2" fill="rgba(245,230,200,0.45)" fontFamily="serif">{h.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}
