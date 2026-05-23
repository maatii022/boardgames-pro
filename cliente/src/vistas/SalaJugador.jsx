import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSala } from '../contextos/SalaContexto';

const ROL_CONFIG = {
  marinero: { color:'#4a9bc7', bg:'rgba(26,58,92,0.9)',  borde:'#4a9bc7', emoji:'⚓', nombre:'Marinero' },
  pirata:   { color:'#c0392b', bg:'rgba(139,26,26,0.9)', borde:'#c0392b', emoji:'💀', nombre:'Pirata'   },
  cultista: { color:'#4caf50', bg:'rgba(45,106,79,0.9)', borde:'#4caf50', emoji:'🐙', nombre:'Cultista' },
  adepto:   { color:'#e9c46a', bg:'rgba(100,80,20,0.9)', borde:'#e9c46a', emoji:'👁️', nombre:'Adepto'   },
};

export default function SalaJugador() {
  const navigate = useNavigate();
  const { sala, estado, fase, socketId, emitir, escuchar, salirDeSala } = useSala();

  const [rolConfirmado, setRolConf] = useState(false);
  const [error, setError]           = useState('');

  // Si no hay sala (recarga sin reconexión aún), redirigir
  useEffect(() => {
    const codigo = sessionStorage.getItem('sala_codigo');
    if (!sala && !codigo) navigate('/');
  }, [sala]);

  // Pedir estado al montar
  useEffect(() => {
    emitir('pedir-estado');
  }, []);

  // Escuchar expulsión
  useEffect(() => {
    const c1 = escuchar('expulsado', ({ mensaje }) => {
      salirDeSala();
      alert(mensaje);
      navigate('/');
    });
    const c2 = escuchar('error', ({ mensaje }) => setError(mensaje));
    return () => { c1(); c2(); };
  }, [escuchar, navigate, salirDeSala]);

  const miJugador   = estado?.miJugador;
  const rolCfg      = miJugador?.rol ? ROL_CONFIG[miJugador.rol] : null;
  const soyHost     = sala?.hostId === socketId;
  const soyCapitan  = miJugador?.esCapitan;
  const soyTeniente = miJugador?.esTeniente;
  const soyNavegante= miJugador?.esNavegante;
  const jugadores   = estado?.jugadores || sala?.jugadores || [];
  const numJugadores= sala?.numJugadores || jugadores.length || 0;

  const kickJugador = (id) => {
    if (window.confirm('¿Expulsar a este jugador?')) emitir('kick-jugador', { jugadorId: id });
  };
  const cambiarHost = (id) => emitir('seleccionar-host', { nuevoHostId: id });

  // Pantalla de carga mientras reconecta
  if (!sala) {
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px', animation:'flotar 3s ease-in-out infinite' }}>🌊</div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'13px', letterSpacing:'2px' }}>Reconectando...</p>
        </div>
      </div>
    );
  }

  // ── LOBBY ────────────────────────────────────────────────
  if (fase === 'lobby') {
    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', padding:'28px 16px 48px' }}>
        <div style={{ maxWidth:'420px', margin:'0 auto' }}>

          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div style={{ fontSize:'40px', marginBottom:'10px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
            <h1 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--oro-dorado)', fontSize:'20px', letterSpacing:'3px', marginBottom:'4px' }}>Feed The Kraken</h1>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.35)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase' }}>Sala {sala.codigo}</p>
          </div>

          {/* Lista jugadores */}
          <div style={{ background:'rgba(13,27,46,0.8)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'12px', padding:'20px', marginBottom:'14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--crema-pergamino)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase' }}>Tripulación</h2>
              <span style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', color: numJugadores >= 5 ? '#98e4a5' : 'var(--oro-dorado)' }}>{numJugadores}/11</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
              {jugadores.map((j, i) => {
                const esYo   = j.id === socketId;
                const esHost = j.id === sala.hostId;
                return (
                  <div key={j.id || i} style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    padding:'10px 12px', borderRadius:'8px',
                    background: esHost ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                    border:`1px solid ${esHost ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    animation:`aparecer 0.4s ease ${i*0.07}s both`,
                  }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'50%', flexShrink:0, background: esHost ? 'linear-gradient(135deg,#c9a84c,#e8c97a)' : 'rgba(26,58,92,0.8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>
                      {esHost ? '⚓' : '🧑‍✈️'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'14px', color:'var(--crema-pergamino)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {j.nombre}{esYo && <span style={{ color:'var(--turquesa-kraken)', fontSize:'11px', marginLeft:'6px' }}>(tú)</span>}
                      </p>
                      {esHost && <p style={{ fontSize:'10px', color:'var(--oro-dorado)', letterSpacing:'1px', textTransform:'uppercase' }}>Host</p>}
                    </div>
                    <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: j.conectado !== false ? '#98e4a5' : '#ff8a8a', flexShrink:0 }} />
                    {soyHost && !esYo && (
                      <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
                        {!esHost && (
                          <button onClick={() => cambiarHost(j.id)} style={{ background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.25)', color:'var(--oro-dorado)', borderRadius:'4px', padding:'3px 7px', fontSize:'10px', fontFamily:'var(--fuente-subtitulo)', cursor:'pointer', letterSpacing:'1px' }}>host</button>
                        )}
                        <button onClick={() => kickJugador(j.id)} style={{ background:'rgba(192,57,43,0.12)', border:'1px solid rgba(192,57,43,0.3)', color:'#ff8a8a', borderRadius:'4px', padding:'3px 7px', fontSize:'13px', cursor:'pointer' }}>✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {numJugadores === 0 && (
                <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.25)', fontSize:'14px', textAlign:'center', padding:'20px 0' }}>Esperando jugadores...</p>
              )}
            </div>
          </div>

          {/* Panel host / espera */}
          {soyHost ? (
            <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:'12px', padding:'20px' }}>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'14px', textAlign:'center' }}>⚓ Eres el Host</p>
              {numJugadores < 5 && (
                <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'13px', textAlign:'center', marginBottom:'14px' }}>
                  Faltan {5 - numJugadores} jugador{5 - numJugadores !== 1 ? 'es' : ''} para iniciar
                </p>
              )}
              <button className="btn-primario" onClick={() => emitir('host-iniciar-partida')} disabled={numJugadores < 5} style={{ width:'100%', padding:'16px', fontSize:'15px' }}>
                🎮 Iniciar Partida
              </button>
            </div>
          ) : (
            <div style={{ background:'rgba(10,147,150,0.06)', border:'1px solid rgba(10,147,150,0.2)', borderRadius:'12px', padding:'24px', textAlign:'center' }}>
              <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'12px' }}>
                {[0,1,2].map(i => <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--turquesa-kraken)', animation:`pulsar-kraken 1.4s ease-in-out ${i*0.25}s infinite` }} />)}
              </div>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.45)', fontSize:'13px', letterSpacing:'1px' }}>Esperando al Host para iniciar...</p>
            </div>
          )}
          {error && <p style={{ color:'#ff8a8a', fontSize:'13px', marginTop:'14px', textAlign:'center' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── FASE 0 ───────────────────────────────────────────────
  if (fase === 'fase_0' && miJugador) {
    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        <div className="aparecer" style={{ width:'100%', maxWidth:'380px', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'28px' }}>Tu rol en esta partida</p>
          <div style={{ background:rolCfg?.bg, border:`2px solid ${rolCfg?.borde}`, borderRadius:'20px', padding:'36px 28px', boxShadow:`0 0 60px ${rolCfg?.color}40`, marginBottom:'28px' }}>
            <div style={{ fontSize:'64px', marginBottom:'14px', animation:'flotar 3s ease-in-out infinite' }}>{rolCfg?.emoji}</div>
            <h1 style={{ fontFamily:'var(--fuente-titulo)', fontSize:'28px', color:rolCfg?.color, textShadow:`0 0 30px ${rolCfg?.color}80`, letterSpacing:'4px', marginBottom:'6px' }}>{rolCfg?.nombre?.toUpperCase()}</h1>
            {miJugador.personaje && (<>
              <div className="divisor-oro" style={{ margin:'18px 0' }}><span>⚔️</span></div>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'15px', letterSpacing:'1px', marginBottom:'8px' }}>{miJugador.personaje.nombre}</p>
              <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.65)', fontSize:'13px', lineHeight:'1.6' }}>{miJugador.personaje.habilidad}</p>
            </>)}
          </div>
          {!rolConfirmado ? (
            <button className="btn-primario" onClick={() => { emitir('confirmar-rol'); setRolConf(true); }} style={{ width:'100%', padding:'16px' }}>✅ He visto mi rol</button>
          ) : (
            <div style={{ padding:'16px', background:'rgba(98,228,165,0.08)', border:'1px solid rgba(98,228,165,0.25)', borderRadius:'8px' }}>
              <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'2px' }}>✓ Esperando al resto...</p>
            </div>
          )}
        </div>
        {soyHost && <PanelHost fase={fase} emitir={emitir} />}
      </div>
    );
  }

  // ── DURMIENDO ────────────────────────────────────────────
  if (fase === 'durmiendo') {
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'64px', marginBottom:'20px', animation:'flotar 4s ease-in-out infinite' }}>🌙</div>
          <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--crema-pergamino)', fontSize:'22px', letterSpacing:'3px', marginBottom:'10px' }}>Cierra los ojos</h2>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.45)', fontSize:'15px', marginBottom:'28px' }}>Los piratas se están reconociendo...</p>
          <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width:'9px', height:'9px', borderRadius:'50%', background:'var(--oro-dorado)', animation:`pulsar-oro 1.5s ease-in-out ${i*0.3}s infinite` }} />)}
          </div>
        </div>
        {soyHost && <PanelHost fase={fase} emitir={emitir} />}
      </div>
    );
  }

  // ── FASE 1 ───────────────────────────────────────────────
  if (fase === 'fase_1') {
    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', padding:'24px 16px 40px' }}>
        <div style={{ maxWidth:'400px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'24px' }}>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.35)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Fase 1</p>
            <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'20px', letterSpacing:'2px' }}>{soyCapitan ? '⚓ Elige tu equipo' : 'El capitán está eligiendo...'}</h2>
          </div>
          {(soyCapitan || soyTeniente || soyNavegante) && (
            <div style={{ textAlign:'center', marginBottom:'20px' }}>
              <span style={{ display:'inline-block', padding:'6px 18px', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:'20px', fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'12px', letterSpacing:'1px' }}>
                {soyCapitan ? '⚓ Capitán' : soyTeniente ? '🎖️ Teniente' : '🧭 Navegante'}
              </span>
            </div>
          )}
          {soyCapitan ? (
            <SeleccionEquipo jugadores={jugadores} socketId={socketId} emitir={emitir} />
          ) : (
            <div style={{ textAlign:'center', padding:'40px 20px', background:'rgba(13,27,46,0.6)', border:'1px solid rgba(201,168,76,0.1)', borderRadius:'12px' }}>
              <div style={{ fontSize:'48px', marginBottom:'16px', animation:'ondas 3s ease-in-out infinite' }}>⚓</div>
              <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.45)', fontSize:'15px' }}>Esperando al Capitán...</p>
            </div>
          )}
          {soyHost && <PanelHost fase={fase} emitir={emitir} />}
        </div>
      </div>
    );
  }

  // ── FASE 2 ───────────────────────────────────────────────
  if (fase === 'fase_2') {
    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', padding:'24px 16px 40px' }}>
        <div style={{ maxWidth:'400px', margin:'0 auto', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.35)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Fase 2</p>
          <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'#ff8a8a', fontSize:'20px', letterSpacing:'2px', marginBottom:'24px' }}>💀 Votación de Motín</h2>
          <VotacionMotin pistolas={miJugador?.pistolas ?? 3} umbral={estado?.motin?.umbral} confirmados={estado?.motin?.confirmados} total={jugadores.length} emitir={emitir} />
        </div>
      </div>
    );
  }

  // ── FASE 3 ───────────────────────────────────────────────
  if (fase === 'fase_3') {
    const cofre       = estado?.cofre || {};
    const etapa       = cofre.etapa;
    const cartas      = cofre.cartasDisponibles || [];
    const esTurnoMio  = (etapa === 'capitan'   && soyCapitan)  ||
                        (etapa === 'teniente'  && soyTeniente) ||
                        (etapa === 'navegante' && soyNavegante);

    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px 48px' }}>
        <div style={{ width:'100%', maxWidth:'380px' }}>
          <div style={{ textAlign:'center', marginBottom:'24px' }}>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.35)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Fase 3</p>
            <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'20px', letterSpacing:'2px' }}>📦 El Cofre</h2>
          </div>

          {/* Turno activo: elegir carta */}
          {esTurnoMio && cartas.length > 0 && (
            <SeleccionCarta cartas={cartas} etapa={etapa} emitir={emitir} />
          )}

          {/* Turno activo pero aún sin cartas (esperando servidor) */}
          {esTurnoMio && cartas.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 20px' }}>
              <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'12px' }}>
                {[0,1,2].map(i => <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--oro-dorado)', animation:`pulsar-oro 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
              <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'14px' }}>Recibiendo cartas...</p>
            </div>
          )}

          {/* Etapa revelar: solo el capitán ve la carta y puede abrirla */}
          {etapa === 'revelar' && (
            <div>
              {soyCapitan ? (
                <>
                  <CartaNavegacion carta={cofre.cartaNavegante} />
                  <button className="btn-primario" onClick={() => emitir('abrir-cofre')} style={{ width:'100%', marginTop:'16px', padding:'16px' }}>
                    🃏 Enseñar carta y mover el barco
                  </button>
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'40px 20px', background:'rgba(13,27,46,0.6)', border:'1px solid rgba(201,168,76,0.1)', borderRadius:'12px' }}>
                  <div style={{ fontSize:'48px', marginBottom:'16px', animation:'flotar 2s ease-in-out infinite' }}>🔒</div>
                  <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'14px' }}>
                    El Capitán va a abrir el cofre...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Espera: no es tu turno */}
          {!esTurnoMio && etapa !== 'revelar' && (
            <div style={{ textAlign:'center', padding:'32px 20px', background:'rgba(13,27,46,0.6)', border:'1px solid rgba(201,168,76,0.1)', borderRadius:'12px' }}>
              <div style={{ fontSize:'48px', marginBottom:'16px', animation:'flotar 2s ease-in-out infinite' }}>📦</div>
              <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'14px' }}>
                {etapa === 'capitan'  ? 'El Capitán está eligiendo una carta...'   :
                 etapa === 'teniente' ? 'El Teniente está eligiendo una carta...'  :
                 etapa === 'navegante'? 'El Navegante está eligiendo la carta final...' :
                 'El cofre está preparándose...'}
              </p>
            </div>
          )}
        </div>
        {soyHost && <PanelHost fase={fase} emitir={emitir} />}
      </div>
    );
  }

  // ── VICTORIA ─────────────────────────────────────────────
  if (fase === 'victoria') {
    const ganador = estado?.victoria;
    const miRol   = miJugador?.rol;
    const gane    = (ganador==='piratas' && miRol==='pirata') || (ganador==='marineros' && miRol==='marinero') || (ganador==='cultistas' && (miRol==='cultista'||miRol==='adepto'));
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ textAlign:'center', animation:'aparecer 1s ease' }}>
          <div style={{ fontSize:'80px', marginBottom:'20px', animation:'flotar 2s ease-in-out infinite' }}>{ganador==='piratas'?'💀':ganador==='marineros'?'⚓':'🐙'}</div>
          <h1 style={{ fontFamily:'var(--fuente-titulo)', fontSize:'26px', color: gane?'var(--oro-dorado)':'rgba(245,230,200,0.5)', letterSpacing:'3px', textShadow: gane?'0 0 40px rgba(201,168,76,0.6)':'none', marginBottom:'12px' }}>{gane?'¡Has ganado!':'Has perdido'}</h1>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'13px', letterSpacing:'2px' }}>{ganador==='piratas'?'Victoria Pirata':ganador==='marineros'?'Victoria Marinera':'El Kraken ha sido invocado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px', animation:'flotar 3s ease-in-out infinite' }}>🌊</div>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'13px', letterSpacing:'2px' }}>{fase || 'Conectando...'}</p>
      </div>
    </div>
  );
}

function SeleccionEquipo({ jugadores, socketId, emitir }) {
  const [teniente, setTeniente]   = useState(null);
  const [navegante, setNavegante] = useState(null);
  const elegibles = jugadores.filter(j => j.id !== socketId && !j.fueraDeServicio);
  const confirmar = () => { if (teniente && navegante) emitir('elegir-equipo', { tenienteId: teniente, naveganteId: navegante }); };

  return (
    <div>
      {['Teniente','Navegante'].map(rol => {
        const sel    = rol==='Teniente' ? teniente  : navegante;
        const setSel = rol==='Teniente' ? setTeniente : setNavegante;
        const otro   = rol==='Teniente' ? navegante  : teniente;
        return (
          <div key={rol} style={{ marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'10px' }}>{rol}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
              {elegibles.map(j => {
                const ocupado = j.id===otro; const activo = j.id===sel;
                return (
                  <button key={j.id} onClick={() => !ocupado && setSel(activo ? null : j.id)} style={{ padding:'11px 14px', borderRadius:'8px', cursor: ocupado?'not-allowed':'pointer', background: activo?'rgba(201,168,76,0.18)':'rgba(255,255,255,0.04)', border:`1px solid ${activo?'var(--oro-dorado)':'rgba(255,255,255,0.08)'}`, color: ocupado?'rgba(245,230,200,0.2)':'var(--crema-pergamino)', fontFamily:'var(--fuente-cuerpo)', fontSize:'15px', textAlign:'left', transition:'all 0.2s', opacity: ocupado?0.35:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span>{activo?'✓ ':''}{j.nombre}</span>
                    {j.curriculos>0 && <span style={{ fontSize:'11px', color:'rgba(245,230,200,0.35)' }}>📜×{j.curriculos}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <button className="btn-primario" onClick={confirmar} disabled={!teniente||!navegante} style={{ width:'100%', marginTop:'8px' }}>⚓ Confirmar Equipo</button>
    </div>
  );
}

function VotacionMotin({ pistolas, umbral, confirmados, total, emitir }) {
  const [sel, setSel]       = useState(0);
  const [votado, setVotado] = useState(false);
  const votar = () => { emitir('votar-motin', { pistolas: sel }); setVotado(true); };
  return (
    <div>
      <div style={{ background:'rgba(139,26,26,0.1)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:'12px', padding:'16px', marginBottom:'24px' }}>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.55)', fontSize:'13px', marginBottom:'4px' }}>Pistolas para motín: <span style={{ color:'#ff8a8a' }}>{umbral}</span></p>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.55)', fontSize:'13px' }}>Tus pistolas: <span style={{ color:'var(--oro-dorado)' }}>{pistolas}</span></p>
      </div>
      {!votado ? (<>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'16px' }}>¿Cuántas pistolas aportas?</p>
        <div style={{ display:'flex', justifyContent:'center', gap:'10px', marginBottom:'24px', flexWrap:'wrap' }}>
          {Array.from({ length: pistolas+1 }, (_,i) => (
            <button key={i} onClick={() => setSel(i)} style={{ width:'54px', height:'54px', borderRadius:'50%', border:`2px solid ${i===sel?'#c0392b':'rgba(192,57,43,0.25)'}`, background: i===sel?'rgba(192,57,43,0.25)':'rgba(255,255,255,0.03)', color: i===sel?'#ff8a8a':'rgba(245,230,200,0.4)', fontFamily:'var(--fuente-subtitulo)', fontSize:'16px', fontWeight:'700', cursor:'pointer', transition:'all 0.2s', boxShadow: i===sel?'0 0 20px rgba(192,57,43,0.4)':'none' }}>
              {i===0?'✗':`${i}🔫`}
            </button>
          ))}
        </div>
        <button className="btn-primario" onClick={votar} style={{ width:'100%' }}>{sel===0?'✓ No me amotino':`💥 ${sel} pistola${sel>1?'s':''}`}</button>
      </>) : (
        <div style={{ padding:'24px', background:'rgba(98,228,165,0.07)', border:'1px solid rgba(98,228,165,0.2)', borderRadius:'12px' }}>
          <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'2px', marginBottom:'8px' }}>✓ Voto registrado</p>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'13px' }}>Esperando: {confirmados||0}/{total||0}</p>
        </div>
      )}
    </div>
  );
}

// ── Selección de carta del cofre ────────────────────────────
function SeleccionCarta({ cartas, etapa, emitir }) {
  const [elegida, setElegida] = useState(null);

  const confirmar = () => {
    if (!elegida) return;
    emitir('elegir-carta-cofre', { cartaId: elegida });
  };

  const colorStyle = (carta) => {
    const mapa = { azul: ['74,155,199', '#4a9bc7'], rojo: ['192,57,43', '#c0392b'], amarillo: ['201,168,76', '#c9a84c'] };
    return mapa[carta?.color] || mapa.azul;
  };

  return (
    <div>
      <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.5)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'16px', textAlign:'center' }}>
        {etapa === 'navegante' ? 'Elige la carta que irá al barco:' : 'Elige una carta para el cofre:'}
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'20px' }}>
        {cartas.map(carta => {
          const [rgb, hex] = colorStyle(carta);
          const activa = elegida === carta.id;
          return (
            <button
              key={carta.id}
              onClick={() => setElegida(carta.id)}
              style={{
                padding:'16px', border:`2px solid ${activa ? hex : 'rgba(201,168,76,0.15)'}`,
                borderRadius:'12px',
                background: activa ? `rgba(${rgb},0.15)` : 'rgba(13,27,46,0.7)',
                cursor:'pointer', textAlign:'left', transition:'all 0.2s',
                boxShadow: activa ? `0 0 20px rgba(${rgb},0.3)` : 'none',
              }}
            >
              <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                <div style={{
                  width:'36px', height:'36px', borderRadius:'8px', flexShrink:0,
                  background:`rgba(${rgb},0.25)`, border:`1px solid ${hex}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px',
                }}>
                  {carta.color === 'azul' ? '🔵' : carta.color === 'rojo' ? '🔴' : '🟡'}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'14px', color: activa ? hex : 'var(--crema-pergamino)', marginBottom:'4px' }}>
                    {activa ? '✓ ' : ''}{carta.nombre}
                  </p>
                  <p style={{ fontFamily:'var(--fuente-cuerpo)', fontSize:'12px', color:'rgba(245,230,200,0.45)', lineHeight:'1.5' }}>
                    {carta.descripcion}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <button className="btn-primario" onClick={confirmar} disabled={!elegida} style={{ width:'100%', padding:'16px' }}>
        ✓ Confirmar elección
      </button>
    </div>
  );
}

// ── Carta de navegación para la etapa revelar ───────────────
function CartaNavegacion({ carta }) {
  if (!carta) return (
    <div style={{ padding:'24px', textAlign:'center', background:'rgba(13,27,46,0.6)', border:'1px solid rgba(201,168,76,0.1)', borderRadius:'12px' }}>
      <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'14px' }}>Preparando carta...</p>
    </div>
  );
  const mapa = { azul: ['74,155,199', '#4a9bc7'], rojo: ['192,57,43', '#c0392b'], amarillo: ['201,168,76', '#c9a84c'] };
  const [rgb, hex] = mapa[carta.color] || mapa.azul;
  return (
    <div style={{
      padding:'20px', borderRadius:'12px',
      background:`rgba(${rgb},0.1)`, border:`1px solid ${hex}`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'8px', background:`rgba(${rgb},0.25)`, border:`1px solid ${hex}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>
          {carta.color === 'azul' ? '🔵' : carta.color === 'rojo' ? '🔴' : '🟡'}
        </div>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'16px', color:hex }}>{carta.nombre}</p>
      </div>
      <p style={{ fontFamily:'var(--fuente-cuerpo)', fontSize:'13px', color:'rgba(245,230,200,0.6)', lineHeight:'1.5' }}>{carta.descripcion}</p>
    </div>
  );
}

// ── Panel flotante para el Host ─────────────────────────────
function PanelHost({ fase, emitir }) {
  const [abierto, setAbierto] = useState(false);

  // No mostrar en lobby (tiene su propio panel) ni en victoria
  if (fase === 'lobby' || fase === 'victoria') return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(a => !a)}
        style={{
          position: 'fixed', bottom: '24px', right: '20px', zIndex: 100,
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--oro-dorado), var(--oro-claro))',
          border: 'none', fontSize: '20px', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(201,168,76,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
          transform: abierto ? 'rotate(45deg)' : 'none',
        }}
      >
        {abierto ? '✕' : '⚓'}
      </button>

      {/* Panel desplegable */}
      {abierto && (
        <div style={{
          position: 'fixed', bottom: '88px', right: '20px', zIndex: 99,
          background: 'rgba(13,27,46,0.97)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '12px', padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          minWidth: '200px',
          animation: 'aparecer 0.2s ease',
        }}>
          <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>
            Panel Host
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => { emitir('host-avanzar-fase'); setAbierto(false); }} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--oro-dorado)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'var(--fuente-subtitulo)', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}>
              ▶ Avanzar fase
            </button>
            <button onClick={() => { emitir('host-retroceder-fase'); setAbierto(false); }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,230,200,0.5)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'var(--fuente-subtitulo)', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}>
              ◀ Retroceder fase
            </button>
            <button onClick={() => { if (window.confirm('¿Reiniciar la partida?')) { emitir('host-reiniciar'); setAbierto(false); } }} style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#ff8a8a', borderRadius: '8px', padding: '10px 14px', fontFamily: 'var(--fuente-subtitulo)', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}>
              ↺ Reiniciar partida
            </button>
          </div>
        </div>
      )}
    </>
  );
}
