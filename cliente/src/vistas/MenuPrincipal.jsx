import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JUEGOS = [
  {
    id: 'feed-the-kraken',
    nombre: 'Feed The Kraken',
    descripcion: 'Un juego de deducción social en alta mar. Piratas, Marineros y el misterioso Cultista compiten por el control del barco.',
    jugadores: '5–11',
    duracion: '45–90 min',
    disponible: true,
    color: '#0a9396',
    emoji: '🐙',
  },
  {
    id: 'catan',
    nombre: 'Catán',
    descripcion: 'Construye asentamientos, comercia recursos y domina la isla. Próximamente disponible.',
    jugadores: '3–4',
    duracion: '60–120 min',
    disponible: false,
    color: '#c9a84c',
    emoji: '🏝️',
  },
  {
    id: 'proximo',
    nombre: '??? Próximamente',
    descripcion: 'Nuevos juegos en camino.',
    jugadores: '—',
    duracion: '—',
    disponible: false,
    color: '#555',
    emoji: '🔮',
  },
];

export default function MenuPrincipal() {
  const navigate = useNavigate();
  const [juegoHover, setJuegoHover] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(26,58,92,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(10,147,150,0.15) 0%, transparent 40%), linear-gradient(180deg, #08070f 0%, #0d1b2e 40%, #08070f 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflowY: 'auto', padding: '40px 20px 60px',
    }}>
      {/* Partículas decorativas */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            background: `rgba(${i % 2 === 0 ? '201,168,76' : '10,147,150'}, ${Math.random() * 0.5 + 0.2})`,
            borderRadius: '50%',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animation: `flotar ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: Math.random() * 4 + 's',
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: '900px',
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)',
        transition: 'all 0.8s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'flotar 4s ease-in-out infinite' }}>🐙</div>
          <h1 style={{
            fontFamily: 'var(--fuente-titulo)',
            fontSize: 'clamp(28px, 5vw, 52px)',
            color: 'var(--oro-dorado)',
            textShadow: '0 0 40px rgba(201,168,76,0.5)',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}>
            MESA DIGITAL
          </h1>
          <p style={{
            fontFamily: 'var(--fuente-subtitulo)',
            color: 'rgba(245,230,200,0.5)',
            letterSpacing: '4px',
            fontSize: '12px',
            textTransform: 'uppercase',
          }}>
            Juegos de mesa · En la palma de tu mano
          </p>
          <div className="divisor-oro" style={{ marginTop: '24px' }}><span>⚓</span></div>
        </div>

        {/* Grid de juegos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}>
          {JUEGOS.map((juego, i) => (
            <div
              key={juego.id}
              onMouseEnter={() => setJuegoHover(juego.id)}
              onMouseLeave={() => setJuegoHover(null)}
              onClick={() => juego.disponible && navigate('/crear', { state: { juego: juego.id } })}
              style={{
                background: juegoHover === juego.id && juego.disponible
                  ? `linear-gradient(135deg, rgba(13,27,46,0.95), rgba(${juego.color === '#0a9396' ? '10,147,150' : '201,168,76'}, 0.15))`
                  : 'rgba(13,27,46,0.6)',
                border: `1px solid ${juegoHover === juego.id && juego.disponible ? juego.color : 'rgba(201,168,76,0.2)'}`,
                borderRadius: '12px',
                padding: '32px 28px',
                cursor: juego.disponible ? 'pointer' : 'default',
                transition: 'all 0.4s ease',
                opacity: juego.disponible ? 1 : 0.4,
                transform: juegoHover === juego.id && juego.disponible ? 'translateY(-4px)' : 'none',
                boxShadow: juegoHover === juego.id && juego.disponible
                  ? `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${juego.color}30`
                  : '0 4px 20px rgba(0,0,0,0.3)',
                animation: `aparecer 0.6s ease ${i * 0.15}s both`,
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
              }}>

              {!juego.disponible && (
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(201,168,76,0.15)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: '20px', padding: '2px 10px',
                  fontFamily: 'var(--fuente-subtitulo)',
                  fontSize: '9px', color: 'var(--oro-dorado)',
                  letterSpacing: '2px', textTransform: 'uppercase',
                }}>Próximamente</div>
              )}

              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{juego.emoji}</div>
              <h2 style={{
                fontFamily: 'var(--fuente-subtitulo)',
                fontSize: '20px',
                color: juego.disponible ? 'var(--crema-pergamino)' : 'rgba(245,230,200,0.6)',
                marginBottom: '12px',
                letterSpacing: '1px',
              }}>{juego.nombre}</h2>
              <p style={{
                fontFamily: 'var(--fuente-cuerpo)',
                color: 'rgba(245,230,200,0.6)',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '20px',
              }}>{juego.descripcion}</p>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '2px' }}>👥</div>
                  <div style={{ fontFamily: 'var(--fuente-subtitulo)', fontSize: '11px', color: 'var(--oro-dorado)', letterSpacing: '1px' }}>{juego.jugadores}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(245,230,200,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>jugadores</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '2px' }}>⏱️</div>
                  <div style={{ fontFamily: 'var(--fuente-subtitulo)', fontSize: '11px', color: 'var(--oro-dorado)', letterSpacing: '1px' }}>{juego.duracion}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(245,230,200,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>duración</div>
                </div>
              </div>

              {juego.disponible && (
                <div style={{
                  marginTop: '24px',
                  background: `linear-gradient(135deg, ${juego.color}, ${juego.color}cc)`,
                  color: '#08070f',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontFamily: 'var(--fuente-subtitulo)',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  opacity: juegoHover === juego.id ? 1 : 0.7,
                  transition: 'opacity 0.3s',
                }}>Crear Sala →</div>
              )}
            </div>
          ))}
        </div>

        {/* Botón unirse */}
        <div style={{ textAlign: 'center' }}>
          <div className="divisor-oro"><span>~</span></div>
          <p style={{
            fontFamily: 'var(--fuente-subtitulo)',
            color: 'rgba(245,230,200,0.5)',
            fontSize: '13px',
            letterSpacing: '2px',
            margin: '20px 0 16px',
            textTransform: 'uppercase',
          }}>¿Te han invitado a una partida?</p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-secundario" onClick={() => navigate('/unirse')}>
              🚪 Unirme a una sala
            </button>
            <button className="btn-secundario" onClick={() => navigate('/tablero')}
              style={{ borderColor:'rgba(10,147,150,0.4)', color:'var(--turquesa-kraken)' }}>
              📺 Abrir tablero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
