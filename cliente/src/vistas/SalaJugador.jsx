import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

// Colores por rol
const ROL_CONFIG = {
  marinero:  { color: '#4a9bc7', bg: 'rgba(26,58,92,0.8)',     emoji: '⚓', nombre: 'Marinero' },
  pirata:    { color: '#c0392b', bg: 'rgba(139,26,26,0.8)',    emoji: '💀', nombre: 'Pirata' },
  cultista:  { color: '#4caf50', bg: 'rgba(45,106,79,0.8)',    emoji: '🐙', nombre: 'Cultista' },
  adepto:    { color: '#e9c46a', bg: 'rgba(100,80,20,0.8)',    emoji: '👁️', nombre: 'Adepto' },
};

const FASE_LABELS = {
  lobby: 'Sala de espera',
  fase_0: 'Revelando Roles',
  durmiendo: 'La tripulación duerme...',
  fase_1: 'Elegir Equipo',
  fase_2: 'Votación de Motín',
  fase_3: 'El Cofre de Navegación',
  fase_4: 'Casilla Especial',
  fase_5: 'Fin de Turno',
  victoria: '¡Victoria!',
};

export default function SalaJugador() {
  const navigate = useNavigate();
  const location = useLocation();
  const { emitir, escuchar, socketId } = useSocket();
  const [sala, setSala] = useState(location.state?.sala || null);
  const [estadoJugador, setEstadoJugador] = useState(null);
  const [fase, setFase] = useState(location.state?.sala?.fase || 'lobby');
  const [rolConfirmado, setRolConfirmado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const c1 = escuchar('sala-actualizada', (s) => { setSala(s); setFase(s.fase); });
    const c2 = escuchar('estado-actualizado', (e) => { setEstadoJugador(e); setFase(e?.fase || fase); });
    const c3 = escuchar('fase-cambiada', ({ fase: f }) => setFase(f));
    const c4 = escuchar('error', ({ mensaje }) => setError(mensaje));
    return () => { c1(); c2(); c3(); c4(); };
  }, [escuchar]);

  const confirmarRol = () => {
    emitir('confirmar-rol');
    setRolConfirmado(true);
  };

  const miJugador = estadoJugador?.miJugador;
  const rolCfg = miJugador?.rol ? ROL_CONFIG[miJugador.rol] : null;
  const soyCapitan = miJugador?.esCapitan;
  const soyTeniente = miJugador?.esTeniente;
  const soyNavegante = miJugador?.esNavegante;

  if (!sala) {
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>🌊</div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.5)', letterSpacing:'2px' }}>
            Conectando...
          </p>
        </div>
      </div>
    );
  }

  // ── FASE 0: Mostrar rol ──
  if (fase === 'fase_0' && miJugador) {
    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        <div className="aparecer" style={{ width:'100%', maxWidth:'380px', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'11px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'32px' }}>
            Tu rol en esta partida
          </p>

          <div style={{
            background: rolCfg?.bg,
            border: `2px solid ${rolCfg?.color}`,
            borderRadius:'20px', padding:'40px 32px',
            boxShadow: `0 0 60px ${rolCfg?.color}40`,
            marginBottom:'32px',
            animation: 'aparecer 0.8s ease',
          }}>
            <div style={{ fontSize:'72px', marginBottom:'16px', animation:'flotar 3s ease-in-out infinite' }}>
              {rolCfg?.emoji}
            </div>
            <h1 style={{
              fontFamily:'var(--fuente-titulo)', fontSize:'32px',
              color: rolCfg?.color,
              textShadow: `0 0 30px ${rolCfg?.color}80`,
              letterSpacing:'4px', marginBottom:'8px',
            }}>{rolCfg?.nombre?.toUpperCase()}</h1>

            {miJugador.personaje && (
              <>
                <div className="divisor-oro" style={{ margin:'20px 0' }}><span>⚔️</span></div>
                <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'16px', letterSpacing:'2px', marginBottom:'8px' }}>
                  {miJugador.personaje.nombre}
                </p>
                <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.7)', fontSize:'14px', lineHeight:'1.6' }}>
                  {miJugador.personaje.habilidad}
                </p>
              </>
            )}
          </div>

          {!rolConfirmado ? (
            <button className="btn-primario" onClick={confirmarRol} style={{ width:'100%', padding:'16px' }}>
              ✅ He visto mi rol
            </button>
          ) : (
            <div style={{
              padding:'16px', background:'rgba(98,228,165,0.1)',
              border:'1px solid rgba(98,228,165,0.3)', borderRadius:'8px',
            }}>
              <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'13px', letterSpacing:'2px' }}>
                ✓ Esperando al resto de la tripulación...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FASE DURMIENDO ──
  if (fase === 'durmiendo') {
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ textAlign:'center', animation:'aparecer 1s ease' }}>
          <div style={{ fontSize:'64px', marginBottom:'24px', animation:'flotar 4s ease-in-out infinite' }}>🌙</div>
          <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--crema-pergamino)', fontSize:'24px', letterSpacing:'3px', marginBottom:'12px' }}>
            La tripulación duerme
          </h2>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'15px' }}>
            Los piratas se están conociendo entre sí...
          </p>
          <div style={{ marginTop:'32px', display:'flex', gap:'8px', justifyContent:'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width:'8px', height:'8px', borderRadius:'50%',
                background:'var(--oro-dorado)',
                animation:`pulsar-oro 1.5s ease-in-out ${i*0.3}s infinite`,
              }}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── FASE 1: Capitán elige equipo ──
  if (fase === 'fase_1') {
    const jugadores = estadoJugador?.jugadores || [];
    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', padding:'24px 16px' }}>
        <div style={{ maxWidth:'400px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'8px' }}>
              Fase 1
            </p>
            <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'20px', letterSpacing:'2px' }}>
              {soyCapitan ? '⚓ Elige tu equipo' : 'El capitán está eligiendo...'}
            </h2>
            {soyCapitan && (
              <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.6)', fontSize:'14px', marginTop:'8px' }}>
                Selecciona un Teniente y un Navegante
              </p>
            )}
          </div>

          {soyCapitan ? (
            <SeleccionEquipo jugadores={jugadores} socketId={socketId} estadoJugador={estadoJugador} emitir={emitir} />
          ) : (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:'48px', marginBottom:'16px', animation:'ondas 3s ease-in-out infinite' }}>⚓</div>
              <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)' }}>
                Esperando al Capitán...
              </p>
              {soyTeniente && <RolBadge rol="Teniente" />}
              {soyNavegante && <RolBadge rol="Navegante" />}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FASE 2: Motín ──
  if (fase === 'fase_2') {
    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', padding:'24px 16px' }}>
        <div style={{ maxWidth:'400px', margin:'0 auto', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'8px' }}>
            Fase 2
          </p>
          <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'#ff8a8a', fontSize:'20px', letterSpacing:'2px', marginBottom:'24px' }}>
            💀 Votación de Motín
          </h2>
          <VotacionMotin
            pistolas={miJugador?.pistolas || 0}
            umbral={estadoJugador?.motin?.umbral}
            confirmados={estadoJugador?.motin?.confirmados}
            total={estadoJugador?.jugadores?.length}
            emitir={emitir}
          />
        </div>
      </div>
    );
  }

  // ── FASE 3: Cofre ──
  if (fase === 'fase_3') {
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ textAlign:'center', maxWidth:'380px' }}>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'12px' }}>
            Fase 3
          </p>
          <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'20px', letterSpacing:'2px', marginBottom:'24px' }}>
            📦 El Cofre de Navegación
          </h2>
          {soyCapitan || soyTeniente || soyNavegante ? (
            <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'#98e4a5', fontSize:'15px' }}>
              🔔 Es tu turno — el cofre llega pronto...
            </p>
          ) : (
            <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'15px' }}>
              El cofre está pasando entre el equipo...
            </p>
          )}
          <div style={{ marginTop:'24px', fontSize:'48px', animation:'flotar 2s ease-in-out infinite' }}>📦</div>
        </div>
      </div>
    );
  }

  // ── VICTORIA ──
  if (fase === 'victoria') {
    const ganador = estadoJugador?.victoria;
    const ganadores = { piratas:'💀 ¡Victoria Pirata!', marineros:'⚓ ¡Victoria Marinera!', cultistas:'🐙 ¡El Kraken ha sido invocado!' };
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ textAlign:'center', animation:'aparecer 1s ease' }}>
          <div style={{ fontSize:'80px', marginBottom:'24px', animation:'flotar 2s ease-in-out infinite' }}>
            {ganador === 'piratas' ? '💀' : ganador === 'marineros' ? '⚓' : '🐙'}
          </div>
          <h1 style={{ fontFamily:'var(--fuente-titulo)', fontSize:'28px', color:'var(--oro-dorado)', letterSpacing:'3px', textShadow:'0 0 40px rgba(201,168,76,0.6)' }}>
            {ganadores[ganador] || '¡Partida terminada!'}
          </h1>
        </div>
      </div>
    );
  }

  // ── LOBBY / ESPERA GENERAL ──
  return (
    <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ textAlign:'center', maxWidth:'380px' }}>
        <div style={{ fontSize:'48px', marginBottom:'20px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
        <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--oro-dorado)', fontSize:'22px', letterSpacing:'3px', marginBottom:'8px' }}>
          Feed The Kraken
        </h2>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'11px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'32px' }}>
          {FASE_LABELS[fase] || 'Esperando...'}
        </p>

        <div style={{ background:'rgba(13,27,46,0.8)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'12px', padding:'20px', marginBottom:'20px' }}>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'12px' }}>
            Sala {sala.codigo}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {sala.jugadores?.map(j => (
              <div key={j.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'6px' }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: j.conectado ? '#98e4a5' : '#ff8a8a' }} />
                <span style={{ fontFamily:'var(--fuente-cuerpo)', color:'var(--crema-pergamino)', fontSize:'14px' }}>{j.nombre}</span>
                {j.esHost && <span style={{ fontSize:'10px', color:'var(--oro-dorado)', marginLeft:'auto' }}>⚓ Host</span>}
              </div>
            ))}
          </div>
        </div>

        {error && <p style={{ color:'#ff8a8a', fontSize:'13px' }}>{error}</p>}
      </div>
    </div>
  );
}

// ── Subcomponentes ──
function RolBadge({ rol }) {
  return (
    <div style={{ marginTop:'20px', display:'inline-block', padding:'8px 20px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:'20px' }}>
      <span style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'13px', letterSpacing:'2px' }}>
        Eres el {rol}
      </span>
    </div>
  );
}

function SeleccionEquipo({ jugadores, socketId, estadoJugador, emitir }) {
  const [teniente, setTeniente] = useState(null);
  const [navegante, setNavegante] = useState(null);

  const elegibles = jugadores.filter(j => j.id !== socketId && !j.fueraDeServicio);

  const confirmar = () => {
    if (!teniente || !navegante) return;
    emitir('elegir-equipo', { tenienteId: teniente, naveganteId: navegante });
  };

  return (
    <div>
      {['Teniente', 'Navegante'].map(rolEquipo => {
        const seleccionado = rolEquipo === 'Teniente' ? teniente : navegante;
        const setSeleccionado = rolEquipo === 'Teniente' ? setTeniente : setNavegante;
        return (
          <div key={rolEquipo} style={{ marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'10px' }}>
              {rolEquipo}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {elegibles.map(j => {
                const ocupado = rolEquipo === 'Teniente' ? j.id === navegante : j.id === teniente;
                return (
                  <button key={j.id}
                    onClick={() => !ocupado && setSeleccionado(j.id === seleccionado ? null : j.id)}
                    style={{
                      padding:'12px 16px', borderRadius:'8px', border:'none', cursor: ocupado ? 'not-allowed' : 'pointer',
                      background: j.id === seleccionado ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                      borderWidth:'1px', borderStyle:'solid',
                      borderColor: j.id === seleccionado ? 'var(--oro-dorado)' : 'rgba(255,255,255,0.08)',
                      color: ocupado ? 'rgba(245,230,200,0.2)' : 'var(--crema-pergamino)',
                      fontFamily:'var(--fuente-cuerpo)', fontSize:'15px',
                      textAlign:'left', transition:'all 0.2s',
                      opacity: ocupado ? 0.4 : 1,
                    }}>
                    {j.id === seleccionado ? '✓ ' : ''}{j.nombre}
                    {j.curriculos > 0 && <span style={{ float:'right', fontSize:'12px', color:'rgba(245,230,200,0.4)' }}>📜×{j.curriculos}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <button className="btn-primario" onClick={confirmar} disabled={!teniente || !navegante} style={{ width:'100%', marginTop:'8px' }}>
        ⚓ Confirmar Equipo
      </button>
    </div>
  );
}

function VotacionMotin({ pistolas, umbral, confirmados, total, emitir }) {
  const [seleccionadas, setSeleccionadas] = useState(0);
  const [votado, setVotado] = useState(false);

  const votar = () => {
    emitir('votar-motin', { pistolas: seleccionadas });
    setVotado(true);
  };

  return (
    <div>
      <div style={{ background:'rgba(139,26,26,0.1)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:'12px', padding:'20px', marginBottom:'24px' }}>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.6)', fontSize:'13px', marginBottom:'4px' }}>
          Pistolas necesarias para motín: <span style={{ color:'#ff8a8a' }}>{umbral}</span>
        </p>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.6)', fontSize:'13px' }}>
          Tus pistolas disponibles: <span style={{ color:'var(--oro-dorado)' }}>{pistolas}</span>
        </p>
      </div>

      {!votado ? (
        <>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.5)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'16px' }}>
            ¿Cuántas pistolas aportas?
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:'12px', marginBottom:'24px', flexWrap:'wrap' }}>
            {Array.from({ length: pistolas + 1 }, (_, i) => (
              <button key={i} onClick={() => setSeleccionadas(i)} style={{
                width:'52px', height:'52px', borderRadius:'50%', border:'2px solid',
                borderColor: i === seleccionadas ? '#c0392b' : 'rgba(192,57,43,0.3)',
                background: i === seleccionadas ? 'rgba(192,57,43,0.3)' : 'rgba(255,255,255,0.03)',
                color: i === seleccionadas ? '#ff8a8a' : 'rgba(245,230,200,0.5)',
                fontFamily:'var(--fuente-subtitulo)', fontSize:'18px', fontWeight:'700',
                cursor:'pointer', transition:'all 0.2s',
                boxShadow: i === seleccionadas ? '0 0 20px rgba(192,57,43,0.4)' : 'none',
              }}>
                {i === 0 ? '✗' : `${i}🔫`}
              </button>
            ))}
          </div>
          <button className="btn-primario" onClick={votar} style={{ width:'100%' }}>
            {seleccionadas === 0 ? '✓ No me amotino' : `💥 Amotinarme con ${seleccionadas} pistola${seleccionadas > 1 ? 's' : ''}`}
          </button>
        </>
      ) : (
        <div style={{ padding:'24px', background:'rgba(98,228,165,0.08)', border:'1px solid rgba(98,228,165,0.2)', borderRadius:'12px' }}>
          <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'13px', letterSpacing:'2px', marginBottom:'8px' }}>
            ✓ Voto registrado
          </p>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'13px' }}>
            Esperando: {confirmados || 0}/{total || 0} jugadores
          </p>
        </div>
      )}
    </div>
  );
}
