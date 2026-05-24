import React, { useState, useEffect, useRef } from 'react';
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

  const [rolConfirmado, setRolConf]         = useState(false);
  const [error, setError]                   = useState('');
  const [motin, setMotin]                   = useState(null);
  const [investigacion, setInvestigacion]   = useState(null);
  const [kraken, setKraken]                 = useState(null);
  const [eliminado, setEliminado]           = useState(false);
  const [ritualReveladoId, setRitualReveladoId] = useState(null);
  const [convertidoAlCulto, setConvertidoAlCulto] = useState(false);

  // Si no hay sala (recarga sin reconexión aún), redirigir
  useEffect(() => {
    const codigo = sessionStorage.getItem('sala_codigo');
    if (!sala && !codigo) navigate('/');
  }, [sala]);

  // Pedir estado al montar
  useEffect(() => {
    emitir('pedir-estado');
  }, []);

  // Escuchar expulsión, motín y resultado de investigación
  useEffect(() => {
    const c1 = escuchar('expulsado', ({ mensaje }) => {
      salirDeSala(); alert(mensaje); navigate('/');
    });
    const c2 = escuchar('error', ({ mensaje }) => setError(mensaje));
    const c3 = escuchar('motin-resultado', (data) => {
      setMotin(data);
      setTimeout(() => setMotin(null), 5000);
    });
    const c4 = escuchar('investigacion-resultado', (data) => setInvestigacion(data));
    const c5 = escuchar('kraken-sacrificio', (data) => {
      setKraken(data);
      if (!data.victoriaCultistas) setTimeout(() => setKraken(null), 6000);
    });
    const c6 = escuchar('kraken-eliminado', () => setEliminado(true));
    const c7 = escuchar('convertido-al-culto', () => setConvertidoAlCulto(true));
    return () => { c1(); c2(); c3(); c4(); c5(); c6(); c7(); };
  }, [escuchar, navigate, salirDeSala]);

  // Auto-transición: mostrar carta ritual 4 s → pantalla de acción
  const _cartaRitualId = estado?.accionEspecial?.tipo === 'ritual' ? estado?.accionEspecial?.carta?.id : null;
  useEffect(() => {
    if (!_cartaRitualId) { setRitualReveladoId(null); return; }
    if (ritualReveladoId === _cartaRitualId) return;
    const t = setTimeout(() => setRitualReveladoId(_cartaRitualId), 10000);
    return () => clearTimeout(t);
  }, [_cartaRitualId]); // eslint-disable-line

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

  // ── Overlays globales (visibles encima de cualquier fase) ───
  const overlayMotin = motin && (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.78)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', animation:'aparecer 0.3s ease' }}>
      <div style={{ background: motin.exitoso ? 'rgba(92,26,26,0.97)' : 'rgba(13,27,46,0.97)', border:`2px solid ${motin.exitoso ? '#c0392b' : '#4a9bc7'}`, borderRadius:'16px', padding:'32px 28px', maxWidth:'340px', width:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }}>
        <div style={{ fontSize:'60px', marginBottom:'12px', animation:'flotar 2s ease-in-out infinite' }}>{motin.exitoso ? '💀' : '⚓'}</div>
        <h2 style={{ fontFamily:'var(--fuente-titulo)', color: motin.exitoso ? '#ff8a8a' : 'var(--oro-dorado)', fontSize:'22px', letterSpacing:'3px', marginBottom:'10px' }}>
          {motin.exitoso ? '¡MOTÍN!' : 'Motín fallado'}
        </h2>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.6)', fontSize:'14px', marginBottom: motin.exitoso && motin.nuevoCapitan ? '10px' : 0 }}>
          {motin.totalPistolas} pistola{motin.totalPistolas !== 1 ? 's' : ''} / {motin.umbral} necesarias
        </p>
        {motin.exitoso && motin.nuevoCapitan && (
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'15px', letterSpacing:'1px', marginTop:'6px' }}>
            Nuevo capitán: <strong>{motin.nuevoCapitan.nombre}</strong>
          </p>
        )}
      </div>
    </div>
  );

  const overlayKraken = kraken && (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', animation:'aparecer 0.3s ease' }}>
      <div style={{ background:'rgba(45,106,79,0.15)', border:`2px solid ${kraken.victoriaCultistas ? '#4caf50' : '#c0392b'}`, borderRadius:'16px', padding:'32px 28px', maxWidth:'340px', width:'100%', textAlign:'center', boxShadow:`0 20px 60px ${kraken.victoriaCultistas ? 'rgba(76,175,80,0.3)' : 'rgba(192,57,43,0.3)'}` }}>
        <div style={{ fontSize:'60px', marginBottom:'12px', animation:'flotar 2s ease-in-out infinite' }}>🌊</div>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'12px' }}>Sacrificio al Kraken</p>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'var(--crema-pergamino)', fontSize:'18px', marginBottom:'8px' }}>{kraken.nombre}</p>
        {kraken.victoriaCultistas ? (<>
          <p style={{ fontFamily:'var(--fuente-titulo)', fontSize:'20px', color:'#4caf50', letterSpacing:'2px', marginBottom:'16px' }}>🐙 ¡Era el Cultista!</p>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'#4caf50', fontSize:'13px', letterSpacing:'2px' }}>¡El Kraken ha encontrado a su elegido!</p>
        </>) : (
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'14px', marginTop:'4px' }}>
            No era el Cultista — el juego continúa...
          </p>
        )}
      </div>
    </div>
  );

  const overlayInvestigacion = investigacion && (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', animation:'aparecer 0.3s ease' }}>
      <div style={{ background:'rgba(10,147,150,0.12)', border:'2px solid var(--turquesa-kraken)', borderRadius:'16px', padding:'32px 28px', maxWidth:'340px', width:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(10,147,150,0.3)' }}>
        <div style={{ fontSize:'52px', marginBottom:'14px' }}>🔍</div>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'14px' }}>Resultado de la investigación</p>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'var(--crema-pergamino)', fontSize:'18px', marginBottom:'8px' }}>{investigacion.nombre}</p>
        <p style={{ fontFamily:'var(--fuente-titulo)', fontSize:'22px', color:'var(--turquesa-kraken)', letterSpacing:'2px', marginBottom:'24px' }}>
          {investigacion.rol === 'marinero' ? '⚓ Marinero' : investigacion.rol === 'pirata' ? '💀 Pirata' : investigacion.rol === 'cultista' ? '🐙 Cultista' : '👁️ Adepto'}
        </p>
        <button className="btn-primario" onClick={() => setInvestigacion(null)} style={{ width:'100%' }}>
          Entendido
        </button>
      </div>
    </div>
  );

  // ── Pantalla de jugador sacrificado (permanente) ──────────
  const soyEliminado = eliminado || miJugador?.sacrificado;
  if (soyEliminado && fase !== 'lobby' && fase !== 'fase_0' && fase !== 'victoria') {
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        <div style={{ textAlign:'center', animation:'aparecer 0.8s ease', maxWidth:'360px' }}>
          <div style={{ fontSize:'80px', marginBottom:'20px' }}>🌊</div>
          <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#4a9bc7', fontSize:'22px', letterSpacing:'3px', marginBottom:'12px' }}>
            Has servido de alimento para el Kraken
          </h2>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'14px', lineHeight:'1.6' }}>
            Las profundidades te han reclamado. Solo puedes observar cómo los demás deciden el destino del barco.
          </p>
          <div style={{ marginTop:'32px', display:'flex', gap:'8px', justifyContent:'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4a9bc7', animation:`pulsar-kraken 1.4s ease-in-out ${i*0.25}s infinite` }} />)}
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de carga mientras reconecta
  if (!sala) {
    return (
      <>
        {overlayMotin}
        <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px', animation:'flotar 3s ease-in-out infinite' }}>🌊</div>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'13px', letterSpacing:'2px' }}>Reconectando...</p>
          </div>
        </div>
      </>
    );
  }

  // ── Overlay: jugador convertido al Culto ─────────────────
  const overlayConvertido = convertidoAlCulto && (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', animation:'aparecer 0.4s ease' }}>
      <div style={{ background:'rgba(45,106,79,0.18)', border:'2px solid #4caf50', borderRadius:'16px', padding:'36px 28px', maxWidth:'340px', width:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(76,175,80,0.3)' }}>
        <div style={{ fontSize:'60px', marginBottom:'16px', animation:'flotar 2s ease-in-out infinite' }}>👁️</div>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(76,175,80,0.6)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'10px' }}>Ritual del Culto</p>
        <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#4caf50', fontSize:'22px', letterSpacing:'3px', marginBottom:'12px' }}>
          Has sido convertido
        </h2>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.65)', fontSize:'14px', lineHeight:'1.6', marginBottom:'20px' }}>
          El Cultista ha actuado sobre ti en las sombras.<br/>Ahora eres un <strong style={{ color:'#4caf50' }}>Adepto del Culto</strong>.
        </p>
        <button className="btn-primario" onClick={() => setConvertidoAlCulto(false)} style={{ width:'100%' }}>
          Entendido
        </button>
      </div>
    </div>
  );

  // ── RITUAL DEL CULTO (prioridad sobre cualquier fase) ────
  const accionEspecialRitual = estado?.accionEspecial;
  if (accionEspecialRitual?.tipo === 'ritual') {
    const revelacionCompleta = ritualReveladoId === accionEspecialRitual.carta?.id;
    return (
      <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        {overlayConvertido}
        {!revelacionCompleta
          ? <RitualReveal carta={accionEspecialRitual.carta} />
          : accionEspecialRitual.esCultista
            ? <RitualCultista accionEspecial={accionEspecialRitual} jugadores={jugadores} socketId={socketId} emitir={emitir} />
            : <RitualEspera />
        }
        <BotonRol miJugador={miJugador} />
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
    const aliados = miJugador?.aliados || [];
    const esPirata = miJugador?.rol === 'pirata';

    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        <div style={{ width:'100%', maxWidth:'360px', textAlign:'center' }}>

          {esPirata ? (
            // ── Vista Pirata: ve a sus compañeros ──
            <>
              <div style={{ fontSize:'56px', marginBottom:'16px' }}>💀</div>
              <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#c0392b', fontSize:'20px', letterSpacing:'3px', marginBottom:'8px' }}>
                Sois piratas
              </h2>
              <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.45)', fontSize:'13px', marginBottom:'24px' }}>
                Estos son tus compañeros de tripulación:
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'28px' }}>
                {aliados.map(a => (
                  <div key={a.id} style={{ padding:'12px 16px', background:'rgba(139,26,26,0.15)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:'10px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'20px' }}>💀</span>
                    <span style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--crema-pergamino)', fontSize:'15px' }}>{a.nombre}</span>
                  </div>
                ))}
                {aliados.length === 0 && (
                  <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.3)', fontSize:'13px' }}>
                    Eres el único pirata
                  </p>
                )}
              </div>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.3)', fontSize:'11px', letterSpacing:'2px' }}>
                Memoriza bien a tus aliados
              </p>
            </>
          ) : (
            // ── Vista Marinero / Cultista / Adepto: ojos cerrados ──
            <>
              <div style={{ fontSize:'64px', marginBottom:'20px', animation:'flotar 4s ease-in-out infinite' }}>🌙</div>
              <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--crema-pergamino)', fontSize:'22px', letterSpacing:'3px', marginBottom:'10px' }}>
                Cierra los ojos
              </h2>
              <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.45)', fontSize:'15px', marginBottom:'28px' }}>
                Los piratas se están reconociendo...
              </p>
              <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
                {[0,1,2].map(i => <div key={i} style={{ width:'9px', height:'9px', borderRadius:'50%', background:'var(--oro-dorado)', animation:`pulsar-oro 1.5s ease-in-out ${i*0.3}s infinite` }} />)}
              </div>
            </>
          )}

        </div>
        <BotonRol miJugador={miJugador} />
        {soyHost && <PanelHost fase={fase} emitir={emitir} />}
      </div>
    );
  }

  // ── FASE 1 ───────────────────────────────────────────────
  if (fase === 'fase_1') {
    return (
      <>{overlayConvertido}{overlayMotin}{overlayInvestigacion}<div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', padding:'24px 16px 40px' }}>
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
          <BotonRol miJugador={miJugador} />
          {soyHost && <PanelHost fase={fase} emitir={emitir} />}
        </div>
      </div></>
    );
  }

  // ── FASE 2 ───────────────────────────────────────────────
  if (fase === 'fase_2') {
    return (
      <>{overlayConvertido}{overlayMotin}{overlayInvestigacion}<div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', padding:'24px 16px 40px' }}>
        <div style={{ maxWidth:'400px', margin:'0 auto', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.35)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Fase 2</p>
          <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'#ff8a8a', fontSize:'20px', letterSpacing:'2px', marginBottom:'24px' }}>💀 Votación de Motín</h2>
          <VotacionMotin pistolas={miJugador?.pistolas ?? 3} umbral={estado?.motin?.umbral} confirmados={estado?.motin?.confirmados} total={jugadores.length} emitir={emitir} />
        </div>
        <BotonRol miJugador={miJugador} />
        {soyHost && <PanelHost fase={fase} emitir={emitir} />}
      </div></>
    );
  }

  // ── FASE 3 ───────────────────────────────────────────────
  if (fase === 'fase_3') {
    const cofre          = estado?.cofre || {};
    const etapa          = cofre.etapa;
    const cartas         = cofre.cartasDisponibles || [];
    const accionEspecial = estado?.accionEspecial;
    const esTurnoMio     = (etapa === 'capitan'   && soyCapitan)  ||
                           (etapa === 'teniente'  && soyTeniente) ||
                           (etapa === 'navegante' && soyNavegante);

    return (
      <>{overlayConvertido}{overlayMotin}{overlayInvestigacion}<div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px 48px' }}>
        <div style={{ width:'100%', maxWidth:'380px' }}>
          <div style={{ textAlign:'center', marginBottom:'24px' }}>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.35)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Fase 3</p>
            <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'20px', letterSpacing:'2px' }}>📦 El Cofre</h2>
          </div>

          {/* ── ACCIÓN ESPECIAL PENDIENTE (SIRENA / TELESCOPIO) ── */}
          {accionEspecial && accionEspecial.etapa === 'capitan-elige' && (
            soyCapitan
              ? <SeleccionJugadorAccionEspecial tipo={accionEspecial.tipo} jugadores={jugadores} socketId={socketId} emitir={emitir} />
              : <EsperandoAccionEspecial tipo={accionEspecial.tipo} etapa="capitan-elige" nombre={null} />
          )}
          {accionEspecial && accionEspecial.etapa === 'jugador-actua' && (
            accionEspecial.jugadorElegido === socketId
              ? <RealizarAccionEspecial accionEspecial={accionEspecial} emitir={emitir} />
              : <EsperandoAccionEspecial
                  tipo={accionEspecial.tipo} etapa="jugador-actua"
                  nombre={(jugadores.find(j => j.id === accionEspecial.jugadorElegido) || {}).nombre}
                />
          )}

          {/* ── FLUJO NORMAL DEL COFRE ── */}
          {!accionEspecial && (<>
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
          </>)}
        </div>
        <BotonRol miJugador={miJugador} />
        {soyHost && <PanelHost fase={fase} emitir={emitir} />}
      </div></>
    );
  }

  // ── FASE 4 ───────────────────────────────────────────────
  if (fase === 'fase_4') {
    const tipoFase4  = estado?.accionFase4?.tipo;
    const krakenVoto = estado?.accionFase4?.kraken;
    const esLupa     = tipoFase4 === 'lupa';
    const esKraken   = tipoFase4 === 'kraken_menor';

    return (
      <>
        {overlayConvertido}
        {overlayMotin}
        {overlayKraken}
        {overlayInvestigacion}
        <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px 48px' }}>
          <div style={{ width:'100%', maxWidth:'380px' }}>

            {/* Registro de Camarote (LUPA) */}
            {esLupa && (<>
              <div style={{ textAlign:'center', marginBottom:'24px' }}>
                <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.35)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Fase 4 — Casilla Lupa</p>
                <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--turquesa-kraken)', fontSize:'20px', letterSpacing:'2px' }}>🔍 Registro de Camarote</h2>
              </div>
              {soyCapitan ? (
                <InvestigacionCapitan jugadores={jugadores} socketId={socketId} emitir={emitir} />
              ) : (
                <div style={{ textAlign:'center', padding:'40px 20px', background:'rgba(13,27,46,0.6)', border:'1px solid rgba(10,147,150,0.15)', borderRadius:'12px' }}>
                  <div style={{ fontSize:'48px', marginBottom:'16px', animation:'flotar 2s ease-in-out infinite' }}>🔍</div>
                  <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'14px' }}>El Capitán está registrando un camarote...</p>
                </div>
              )}
            </>)}

            {/* Sacrificio al Kraken (KRAKEN menor) */}
            {esKraken && (<>
              <div style={{ textAlign:'center', marginBottom:'24px' }}>
                <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.35)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Fase 4 — Kraken Menor</p>
                <h2 style={{ fontFamily:'var(--fuente-subtitulo)', color:'#4caf50', fontSize:'20px', letterSpacing:'2px' }}>🌊 ¿A quién alimentamos al Kraken?</h2>
              </div>
              <VotacionKraken
                jugadores={jugadores}
                socketId={socketId}
                emitir={emitir}
                krakenVoto={krakenVoto}
              />
            </>)}

            {/* Fallback si aún no llegó el tipo */}
            {!esLupa && !esKraken && (
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'12px' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--oro-dorado)', animation:`pulsar-oro 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                </div>
                <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'14px' }}>Cargando acción especial...</p>
              </div>
            )}

          </div>
          <BotonRol miJugador={miJugador} />
          {soyHost && <PanelHost fase={fase} emitir={emitir} />}
        </div>
      </>
    );
  }

  // ── VICTORIA ─────────────────────────────────────────────
  if (fase === 'victoria') {
    const ganador = estado?.victoria;
    const miRol   = miJugador?.rol;
    const gane    = (ganador==='piratas' && miRol==='pirata') || (ganador==='marineros' && miRol==='marinero') || (ganador==='cultistas' && (miRol==='cultista'||miRol==='adepto'));

    const ROL_EQUIPO = { piratas: ['pirata'], marineros: ['marinero'], cultistas: ['cultista','adepto'] };
    const rolesEquipo = ROL_EQUIPO[ganador] || [];
    const equipoGanador = (estado?.jugadores || []).filter(j => rolesEquipo.includes(j.rol));

    const ROL_LABEL = { pirata:'💀 Pirata', marinero:'⚓ Marinero', cultista:'🐙 Cultista', adepto:'👁️ Adepto' };

    return (
      <div className="fondo-mar movil-scroll" style={{ width:'100%', minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        <div style={{ textAlign:'center', animation:'aparecer 1s ease', maxWidth:'380px', width:'100%' }}>
          <div style={{ fontSize:'72px', marginBottom:'16px', animation:'flotar 2s ease-in-out infinite' }}>{ganador==='piratas'?'💀':ganador==='marineros'?'⚓':'🐙'}</div>
          <h1 style={{ fontFamily:'var(--fuente-titulo)', fontSize:'26px', color: gane?'var(--oro-dorado)':'rgba(245,230,200,0.5)', letterSpacing:'3px', textShadow: gane?'0 0 40px rgba(201,168,76,0.6)':'none', marginBottom:'8px' }}>
            {gane ? '¡Has ganado!' : 'Has perdido'}
          </h1>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'13px', letterSpacing:'2px', marginBottom:'28px' }}>
            {ganador==='piratas'?'Victoria Pirata':ganador==='marineros'?'Victoria Marinera':'El Kraken ha sido invocado'}
          </p>

          {equipoGanador.length > 0 && (
            <div style={{ background:'rgba(13,27,46,0.8)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:'12px', padding:'20px' }}>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'14px' }}>
                Equipo ganador
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {equipoGanador.map(j => (
                  <div key={j.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px' }}>
                    <span style={{ fontFamily:'var(--fuente-cuerpo)', color:'var(--crema-pergamino)', fontSize:'15px' }}>{j.nombre}</span>
                    <span style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.45)', fontSize:'11px', letterSpacing:'1px' }}>{ROL_LABEL[j.rol] || j.rol}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>{overlayMotin}<div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px', animation:'flotar 3s ease-in-out infinite' }}>🌊</div>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'13px', letterSpacing:'2px' }}>{fase || 'Conectando...'}</p>
      </div>
    </div></>
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
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'13px' }}>Esperando: {confirmados?.length || 0}/{total||0}</p>
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

// ── Registro de Camarote — Capitán investiga un rol (FASE_4 LUPA) ──
function InvestigacionCapitan({ jugadores, socketId, emitir }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const elegibles = jugadores.filter(j => j.id !== socketId && !j.sacrificado && !j.fueraDeServicio);
  const confirmar = () => { if (seleccionado) emitir('fase4-investigar', { jugadorId: seleccionado }); };

  return (
    <div>
      <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.5)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'16px', textAlign:'center' }}>
        Elige a quién investigar:
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
        {elegibles.map(j => {
          const activo = seleccionado === j.id;
          return (
            <button key={j.id} onClick={() => setSeleccionado(activo ? null : j.id)} style={{
              padding:'13px 16px', borderRadius:'8px', cursor:'pointer', textAlign:'left',
              background: activo ? 'rgba(10,147,150,0.18)' : 'rgba(13,27,46,0.7)',
              border:`1px solid ${activo ? 'var(--turquesa-kraken)' : 'rgba(255,255,255,0.07)'}`,
              color:'var(--crema-pergamino)', fontFamily:'var(--fuente-cuerpo)', fontSize:'15px',
              transition:'all 0.2s', display:'flex', alignItems:'center', gap:'10px',
            }}>
              <span style={{ color:'var(--turquesa-kraken)' }}>{activo ? '✓' : '○'}</span>
              {j.nombre}
            </button>
          );
        })}
      </div>
      <button className="btn-primario" onClick={confirmar} disabled={!seleccionado} style={{ width:'100%', padding:'16px' }}>
        🔍 Investigar
      </button>
    </div>
  );
}

// ── Votación de Sacrificio al Kraken (FASE_4 KRAKEN menor) ──
function VotacionKraken({ jugadores, socketId, emitir, krakenVoto }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [votado, setVotado] = useState(krakenVoto?.haVotado || false);
  const elegibles = jugadores.filter(j => j.id !== socketId && !j.sacrificado);

  const confirmar = () => {
    if (!seleccionado) return;
    emitir('votar-kraken', { objetivoId: seleccionado });
    setVotado(true);
  };

  if (votado || krakenVoto?.haVotado) {
    return (
      <div style={{ padding:'24px', background:'rgba(76,175,80,0.07)', border:'1px solid rgba(76,175,80,0.2)', borderRadius:'12px', textAlign:'center' }}>
        <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'2px', marginBottom:'8px' }}>✓ Voto registrado</p>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'13px' }}>
          Esperando: {krakenVoto?.confirmados || 0}/{krakenVoto?.total || 0}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.5)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'16px', textAlign:'center' }}>
        ¿A quién sacrificamos?
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
        {elegibles.map(j => {
          const activo = seleccionado === j.id;
          return (
            <button key={j.id} onClick={() => setSeleccionado(activo ? null : j.id)} style={{
              padding:'13px 16px', borderRadius:'8px', cursor:'pointer', textAlign:'left',
              background: activo ? 'rgba(76,175,80,0.15)' : 'rgba(13,27,46,0.7)',
              border:`1px solid ${activo ? '#4caf50' : 'rgba(255,255,255,0.07)'}`,
              color:'var(--crema-pergamino)', fontFamily:'var(--fuente-cuerpo)', fontSize:'15px',
              transition:'all 0.2s', display:'flex', alignItems:'center', gap:'10px',
            }}>
              <span style={{ color:'#4caf50' }}>{activo ? '✓' : '○'}</span>
              {j.nombre}
            </button>
          );
        })}
      </div>
      <button className="btn-primario" onClick={confirmar} disabled={!seleccionado} style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,rgba(76,175,80,0.3),rgba(45,106,79,0.4))', borderColor:'#4caf50' }}>
        🌊 Sacrificar
      </button>
    </div>
  );
}

// ── Capitán elige jugador para SIRENA o TELESCOPIO ──────────
function SeleccionJugadorAccionEspecial({ tipo, jugadores, socketId, emitir }) {
  const [sel, setSel] = useState(null);
  const elegibles = jugadores.filter(j => j.id !== socketId && !j.sacrificado);
  const esSirena = tipo === 'sirena';

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:'20px' }}>
        <div style={{ fontSize:'36px', marginBottom:'10px' }}>{esSirena ? '🧜' : '🔭'}</div>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--turquesa-kraken)', fontSize:'13px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'8px' }}>
          {esSirena ? 'Carta Sirena' : 'Carta Telescopio'}
        </p>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.55)', fontSize:'13px', lineHeight:'1.5' }}>
          {esSirena
            ? 'Elige quién verá las últimas 3 cartas descartadas'
            : 'Elige quién mirará la siguiente carta del mazo'}
        </p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
        {elegibles.map(j => {
          const activo = sel === j.id;
          return (
            <button key={j.id} onClick={() => setSel(activo ? null : j.id)} style={{
              padding:'13px 16px', borderRadius:'8px', cursor:'pointer', textAlign:'left',
              background: activo ? 'rgba(10,147,150,0.18)' : 'rgba(13,27,46,0.7)',
              border:`1px solid ${activo ? 'var(--turquesa-kraken)' : 'rgba(255,255,255,0.07)'}`,
              color:'var(--crema-pergamino)', fontFamily:'var(--fuente-cuerpo)', fontSize:'15px',
              transition:'all 0.2s', display:'flex', alignItems:'center', gap:'10px',
            }}>
              <span style={{ color:'var(--turquesa-kraken)' }}>{activo ? '✓' : '○'}</span>
              {j.nombre}
            </button>
          );
        })}
      </div>
      <button className="btn-primario" onClick={() => sel && emitir('accion-especial-elegir-jugador', { jugadorId: sel })}
        disabled={!sel} style={{ width:'100%', padding:'16px' }}>
        {esSirena ? '🧜 Asignar visión' : '🔭 Asignar inspección'}
      </button>
    </div>
  );
}

// ── Jugador elegido realiza su acción especial ───────────────
function RealizarAccionEspecial({ accionEspecial, emitir }) {
  const [confirmado, setConfirmado] = useState(false);
  const { tipo, cartasSirena, cartaTelescopio } = accionEspecial;

  const colorStyle = (carta) => {
    const mapa = { azul: ['74,155,199', '#4a9bc7'], rojo: ['192,57,43', '#c0392b'], amarillo: ['201,168,76', '#c9a84c'] };
    return mapa[carta?.color] || mapa.azul;
  };

  if (tipo === 'sirena') {
    const cartas = cartasSirena || [];
    return (
      <div>
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'36px', marginBottom:'8px' }}>🧜</div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--turquesa-kraken)', fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'6px' }}>Últimas 3 cartas descartadas</p>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'12px' }}>Solo tú puedes ver estas cartas</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
          {cartas.map((carta, i) => {
            const [rgb, hex] = colorStyle(carta);
            return (
              <div key={carta?.id || i} style={{ padding:'14px 16px', borderRadius:'10px', background:`rgba(${rgb},0.1)`, border:`1px solid ${hex}`, display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:`rgba(${rgb},0.25)`, border:`1px solid ${hex}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                  {carta?.color === 'azul' ? '🔵' : carta?.color === 'rojo' ? '🔴' : '🟡'}
                </div>
                <div>
                  <p style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'13px', color:hex }}>{carta?.nombre}</p>
                  <p style={{ fontFamily:'var(--fuente-cuerpo)', fontSize:'11px', color:'rgba(245,230,200,0.4)' }}>{carta?.descripcion}</p>
                </div>
              </div>
            );
          })}
          {cartas.length === 0 && (
            <p style={{ textAlign:'center', fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.3)', fontSize:'13px', padding:'20px' }}>No hay cartas descartadas aún</p>
          )}
        </div>
        {!confirmado ? (
          <button className="btn-primario" onClick={() => { setConfirmado(true); emitir('accion-especial-confirmar', {}); }} style={{ width:'100%', padding:'16px' }}>
            ✓ Visto, continuar
          </button>
        ) : (
          <div style={{ textAlign:'center', padding:'14px', background:'rgba(98,228,165,0.07)', border:'1px solid rgba(98,228,165,0.2)', borderRadius:'8px' }}>
            <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'2px' }}>✓ Confirmado</p>
          </div>
        )}
      </div>
    );
  }

  if (tipo === 'telescopio') {
    const carta = cartaTelescopio;
    const [rgb, hex] = colorStyle(carta);
    return (
      <div>
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'36px', marginBottom:'8px' }}>🔭</div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--turquesa-kraken)', fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'6px' }}>Siguiente carta del mazo</p>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.4)', fontSize:'12px' }}>Solo tú puedes ver esta carta</p>
        </div>
        {carta ? (
          <div style={{ padding:'16px', borderRadius:'12px', background:`rgba(${rgb},0.1)`, border:`1px solid ${hex}`, marginBottom:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'8px', background:`rgba(${rgb},0.25)`, border:`1px solid ${hex}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                {carta.color === 'azul' ? '🔵' : carta.color === 'rojo' ? '🔴' : '🟡'}
              </div>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', fontSize:'15px', color:hex }}>{carta.nombre}</p>
            </div>
            <p style={{ fontFamily:'var(--fuente-cuerpo)', fontSize:'12px', color:'rgba(245,230,200,0.55)', lineHeight:'1.5' }}>{carta.descripcion}</p>
          </div>
        ) : (
          <p style={{ textAlign:'center', fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.3)', fontSize:'13px', padding:'20px' }}>No quedan cartas</p>
        )}
        {!confirmado && carta && (
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => { setConfirmado(true); emitir('accion-especial-confirmar', { decision:'descartar' }); }} style={{ flex:1, padding:'14px', borderRadius:'10px', border:'1px solid rgba(192,57,43,0.4)', background:'rgba(192,57,43,0.12)', color:'#ff8a8a', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'1px', cursor:'pointer' }}>
              🗑️ Descartar
            </button>
            <button onClick={() => { setConfirmado(true); emitir('accion-especial-confirmar', { decision:'devolver' }); }} style={{ flex:1, padding:'14px', borderRadius:'10px', border:'1px solid rgba(10,147,150,0.4)', background:'rgba(10,147,150,0.12)', color:'var(--turquesa-kraken)', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'1px', cursor:'pointer' }}>
              ↩ Devolver
            </button>
          </div>
        )}
        {(confirmado || !carta) && (
          <div style={{ textAlign:'center', padding:'14px', background:'rgba(98,228,165,0.07)', border:'1px solid rgba(98,228,165,0.2)', borderRadius:'8px' }}>
            <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'2px' }}>✓ Confirmado</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ── Pantalla de espera mientras otro jugador actúa ───────────
function EsperandoAccionEspecial({ tipo, etapa, nombre }) {
  const esSirena = tipo === 'sirena';
  return (
    <div style={{ textAlign:'center', padding:'40px 20px', background:'rgba(13,27,46,0.6)', border:'1px solid rgba(10,147,150,0.15)', borderRadius:'12px' }}>
      <div style={{ fontSize:'44px', marginBottom:'16px' }}>{esSirena ? '🧜' : '🔭'}</div>
      <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--turquesa-kraken)', fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'10px' }}>
        Carta {esSirena ? 'Sirena' : 'Telescopio'}
      </p>
      <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.45)', fontSize:'14px' }}>
        {etapa === 'capitan-elige'
          ? 'El Capitán está eligiendo quién actúa...'
          : nombre ? `${nombre} está revisando las cartas...` : 'Esperando...'}
      </p>
    </div>
  );
}

// ── Botón de rol (abajo-izquierda) para todos los jugadores ─
function BotonRol({ miJugador }) {
  const [visible, setVisible] = useState(false);
  if (!miJugador?.rol) return null;
  const cfg = ROL_CONFIG[miJugador.rol];
  if (!cfg) return null;

  return (
    <>
      <button
        onClick={() => setVisible(v => !v)}
        style={{
          position: 'fixed', bottom: '24px', left: '20px', zIndex: 100,
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'rgba(13,27,46,0.92)',
          border: '2px solid rgba(245,230,200,0.2)',
          fontSize: '22px', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
          transform: visible ? 'scale(1.1)' : 'none',
        }}
      >
        👁️
      </button>

      {visible && (
        <div
          onClick={() => setVisible(false)}
          style={{
            position: 'fixed', bottom: '88px', left: '20px', zIndex: 99,
            background: cfg.bg, border: `2px solid ${cfg.borde}`,
            borderRadius: '16px', padding: '20px 18px',
            boxShadow: `0 8px 32px ${cfg.color}40`,
            maxWidth: '260px', animation: 'aparecer 0.2s ease', cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px' }}>{cfg.emoji}</span>
            <p style={{ fontFamily: 'var(--fuente-titulo)', color: cfg.color, fontSize: '18px', letterSpacing: '2px' }}>
              {cfg.nombre.toUpperCase()}
            </p>
          </div>
          {miJugador.personaje && (<>
            <div className="divisor-oro" style={{ margin: '8px 0' }}><span>⚔️</span></div>
            <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)', fontSize: '13px', letterSpacing: '1px', marginBottom: '6px' }}>
              {miJugador.personaje.nombre}
            </p>
            <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.65)', fontSize: '12px', lineHeight: '1.5' }}>
              {miJugador.personaje.habilidad}
            </p>
          </>)}
          <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.3)', fontSize: '10px', letterSpacing: '1px', marginTop: '10px', textAlign: 'center' }}>
            Toca para cerrar
          </p>
        </div>
      )}
    </>
  );
}

// ── Revelación de carta ritual (4 s para todos) ─────────────
function RitualReveal({ carta }) {
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const TIPO_EMOJI = {
    conversion_culto:   '👥',
    registro_camarote:  '📋',
    alijo_armas:        '🔫',
  };

  return (
    <div style={{ width:'100%', maxWidth:'380px', textAlign:'center', animation:'aparecer 0.5s ease' }}>
      <div style={{ fontSize:'52px', marginBottom:'10px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
      <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(76,175,80,0.6)', fontSize:'10px', letterSpacing:'4px', textTransform:'uppercase', marginBottom:'18px' }}>
        Levantamiento del Culto
      </p>

      {/* Carta revelada */}
      <div style={{ background:'rgba(76,175,80,0.08)', border:'2px solid rgba(76,175,80,0.3)', borderRadius:'16px', padding:'28px 24px', marginBottom:'20px', boxShadow:'0 0 40px rgba(76,175,80,0.15)' }}>
        <div style={{ fontSize:'36px', marginBottom:'12px' }}>
          {TIPO_EMOJI[carta?.tipo] || '🐙'}
        </div>
        <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#4caf50', fontSize:'22px', letterSpacing:'3px', marginBottom:'10px', textShadow:'0 0 20px rgba(76,175,80,0.5)' }}>
          {carta?.nombre || 'Carta Ritual'}
        </h2>
        <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.55)', fontSize:'13px', lineHeight:'1.6' }}>
          {carta?.descripcion || ''}
        </p>
      </div>

      {/* Cuenta atrás */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(76,175,80,0.12)', border:`2px solid ${timer > 0 ? 'rgba(76,175,80,0.5)' : 'rgba(76,175,80,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.4s' }}>
          <span style={{ fontFamily:'var(--fuente-subtitulo)', color:'#4caf50', fontSize:'14px', fontWeight:'700' }}>{timer}</span>
        </div>
        <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.3)', fontSize:'11px', letterSpacing:'2px' }}>
          Cerrando los ojos...
        </p>
      </div>
    </div>
  );
}

// ── Ritual del Culto — vista para el Cultista ───────────────
function RitualCultista({ accionEspecial, jugadores, socketId, emitir }) {
  const { carta, etapa, resultado } = accionEspecial;
  const tipoCarta = carta?.tipo;
  const [confirmado, setConfirmado] = useState(false);
  const [distribucion, setDistribucion] = useState({});
  const [tiempoRestante, setTiempoRestante] = useState(30);
  const [selRegistro, setSelRegistro] = useState(null);
  const emitidoRef = useRef(false);

  // Timer auto-confirma Registro de Camarote tras 30s — solo cuando etapa === 'ver'
  useEffect(() => {
    if (tipoCarta !== 'registro_camarote' || etapa !== 'ver') return;
    emitidoRef.current = false;
    setTiempoRestante(30);
    const interval = setInterval(() => setTiempoRestante(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [tipoCarta, etapa]); // eslint-disable-line

  useEffect(() => {
    if (tipoCarta === 'registro_camarote' && etapa === 'ver' && tiempoRestante <= 0 && !emitidoRef.current) {
      emitidoRef.current = true;
      emitir('accion-ritual', {});
    }
  }, [tiempoRestante, tipoCarta, etapa, emitir]);

  const ROL_LABEL = {
    pirata:'💀 Pirata', marinero:'⚓ Marinero', cultista:'🐙 Cultista', adepto:'👁️ Adepto',
  };

  // ── Conversión al Culto ──────────────────────────────────
  if (tipoCarta === 'conversion_culto') {
    const vistos = accionEspecial.jugadoresVistos || [];
    const elegibles = jugadores.filter(j => j.id !== socketId && !j.sacrificado && !vistos.includes(j.id));
    return (
      <div style={{ width:'100%', maxWidth:'380px', animation:'aparecer 0.4s ease' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ fontSize:'52px', marginBottom:'12px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(76,175,80,0.6)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Carta Ritual</p>
          <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#4caf50', fontSize:'20px', letterSpacing:'2px', marginBottom:'8px' }}>Conversión al Culto</h2>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'13px' }}>Elige a quién convertir en Adepto:</p>
        </div>
        {!confirmado ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {elegibles.map(j => (
              <button key={j.id} onClick={() => {
                setConfirmado(true);
                emitir('accion-ritual', { jugadorId: j.id });
              }} style={{
                padding:'14px 16px', borderRadius:'10px', cursor:'pointer', textAlign:'left',
                background:'rgba(76,175,80,0.08)', border:'1px solid rgba(76,175,80,0.25)',
                color:'var(--crema-pergamino)', fontFamily:'var(--fuente-cuerpo)', fontSize:'15px',
                transition:'all 0.2s', display:'flex', alignItems:'center', gap:'10px',
              }}>
                <span style={{ color:'rgba(76,175,80,0.6)' }}>○</span>
                {j.nombre}
              </button>
            ))}
            {elegibles.length === 0 && (
              <p style={{ textAlign:'center', fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.3)', fontSize:'13px', padding:'20px' }}>No hay jugadores disponibles</p>
            )}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'24px', background:'rgba(76,175,80,0.07)', border:'1px solid rgba(76,175,80,0.2)', borderRadius:'12px' }}>
            <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'13px', letterSpacing:'2px' }}>✓ Conversión realizada</p>
          </div>
        )}
      </div>
    );
  }

  // ── Registro de Camarote ─────────────────────────────────
  if (tipoCarta === 'registro_camarote') {
    // Paso 2: mostrar resultado + cuenta atrás
    if (etapa === 'ver' && resultado) {
      return (
        <div style={{ width:'100%', maxWidth:'380px', animation:'aparecer 0.4s ease' }}>
          <div style={{ textAlign:'center', marginBottom:'20px' }}>
            <div style={{ fontSize:'52px', marginBottom:'12px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(76,175,80,0.6)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Carta Ritual</p>
            <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#4caf50', fontSize:'20px', letterSpacing:'2px', marginBottom:'12px' }}>Registro de Camarote</h2>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'48px', height:'48px', borderRadius:'50%', background:'rgba(76,175,80,0.12)', border:'2px solid rgba(76,175,80,0.4)' }}>
              <span style={{ fontFamily:'var(--fuente-subtitulo)', color:'#4caf50', fontSize:'16px', fontWeight:'700' }}>{Math.max(0, tiempoRestante)}</span>
            </div>
          </div>
          <div style={{ background:'rgba(13,27,46,0.85)', border:'1px solid rgba(76,175,80,0.2)', borderRadius:'12px', padding:'24px', textAlign:'center', marginBottom:'14px' }}>
            <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'10px' }}>Camarote inspeccionado</p>
            <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'var(--crema-pergamino)', fontSize:'17px', marginBottom:'8px' }}>{resultado.nombre}</p>
            <p style={{ fontFamily:'var(--fuente-titulo)', color:'var(--oro-dorado)', fontSize:'18px', letterSpacing:'2px' }}>{ROL_LABEL[resultado.rol] || resultado.rol}</p>
          </div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.25)', fontSize:'11px', letterSpacing:'1px', textAlign:'center' }}>
            Se cierra automáticamente en {Math.max(0, tiempoRestante)}s
          </p>
        </div>
      );
    }
    // Paso 1: elegir jugador a inspeccionar — todos menos el propio Cultista
    const candidatos = jugadores.filter(j => j.id !== socketId && !j.sacrificado);
    return (
      <div style={{ width:'100%', maxWidth:'380px', animation:'aparecer 0.4s ease' }}>
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'52px', marginBottom:'12px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(76,175,80,0.6)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Carta Ritual</p>
          <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#4caf50', fontSize:'20px', letterSpacing:'2px', marginBottom:'8px' }}>Registro de Camarote</h2>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'13px' }}>Elige el camarote a inspeccionar:</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
          {candidatos.map(j => {
            const soyYo = j.id === socketId;
            const activo = selRegistro === j.id;
            return (
              <button key={j.id} onClick={() => setSelRegistro(activo ? null : j.id)} style={{
                padding:'13px 16px', borderRadius:'10px', cursor:'pointer', textAlign:'left',
                background: activo ? 'rgba(76,175,80,0.12)' : 'rgba(13,27,46,0.7)',
                border:`1px solid ${activo ? 'rgba(76,175,80,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color:'var(--crema-pergamino)', fontFamily:'var(--fuente-cuerpo)', fontSize:'15px',
                transition:'all 0.2s', display:'flex', alignItems:'center', gap:'10px',
              }}>
                <span style={{ color:'rgba(76,175,80,0.6)' }}>{activo ? '✓' : '○'}</span>
                <span>{j.nombre}</span>
                {soyYo && <span style={{ color:'var(--turquesa-kraken)', fontSize:'12px' }}>(tú)</span>}
              </button>
            );
          })}
        </div>
        <button className="btn-primario" onClick={() => {
          if (!selRegistro) return;
          emitir('accion-ritual', { jugadorId: selRegistro });
        }} disabled={!selRegistro} style={{ width:'100%', padding:'16px' }}>
          🔍 Inspeccionar camarote
        </button>
      </div>
    );
  }

  // ── Alijo de Armas ───────────────────────────────────────
  if (tipoCarta === 'alijo_armas') {
    const elegibles = jugadores.filter(j => !j.sacrificado);
    const totalDistribuido = Object.values(distribucion).reduce((a, b) => a + b, 0);
    const pistolasRestantes = 3 - totalDistribuido;

    const ajustar = (id, delta) => {
      const actual = distribucion[id] || 0;
      const nuevo = actual + delta;
      if (nuevo < 0) return;
      if (delta > 0 && totalDistribuido >= 3) return;
      setDistribucion(d => ({ ...d, [id]: nuevo }));
    };

    return (
      <div style={{ width:'100%', maxWidth:'380px', animation:'aparecer 0.4s ease' }}>
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'52px', marginBottom:'12px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
          <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(76,175,80,0.6)', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Carta Ritual</p>
          <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#4caf50', fontSize:'20px', letterSpacing:'2px', marginBottom:'8px' }}>Alijo de Armas</h2>
          <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'13px' }}>
            Distribuye hasta <strong style={{ color:'var(--oro-dorado)' }}>3 pistolas</strong> entre quien quieras
            {pistolasRestantes < 3 && <span style={{ color:'#4caf50' }}> ({pistolasRestantes} restantes)</span>}
          </p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
          {elegibles.map(j => {
            const soyYo = j.id === socketId;
            const asignadas = distribucion[j.id] || 0;
            return (
              <div key={j.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:'10px', background: asignadas > 0 ? 'rgba(76,175,80,0.08)' : 'rgba(13,27,46,0.7)', border:`1px solid ${asignadas > 0 ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.07)'}`, transition:'all 0.2s' }}>
                <span style={{ fontFamily:'var(--fuente-cuerpo)', color:'var(--crema-pergamino)', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
                  {j.nombre}
                  {soyYo && <span style={{ color:'var(--turquesa-kraken)', fontSize:'11px' }}>(tú)</span>}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <button onClick={() => ajustar(j.id, -1)} disabled={!asignadas} style={{ width:'30px', height:'30px', borderRadius:'50%', border:'1px solid rgba(192,57,43,0.4)', background:'rgba(192,57,43,0.1)', color:'#ff8a8a', fontSize:'18px', lineHeight:'1', cursor: asignadas ? 'pointer' : 'not-allowed', opacity: asignadas ? 1 : 0.35, transition:'opacity 0.2s' }}>−</button>
                  <span style={{ fontFamily:'var(--fuente-subtitulo)', color: asignadas > 0 ? 'var(--oro-dorado)' : 'rgba(245,230,200,0.3)', fontSize:'14px', minWidth:'36px', textAlign:'center' }}>
                    {asignadas > 0 ? `${asignadas}🔫` : '0'}
                  </span>
                  <button onClick={() => ajustar(j.id, 1)} disabled={totalDistribuido >= 3} style={{ width:'30px', height:'30px', borderRadius:'50%', border:'1px solid rgba(201,168,76,0.4)', background:'rgba(201,168,76,0.1)', color:'var(--oro-dorado)', fontSize:'18px', lineHeight:'1', cursor: totalDistribuido < 3 ? 'pointer' : 'not-allowed', opacity: totalDistribuido < 3 ? 1 : 0.35, transition:'opacity 0.2s' }}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        {!confirmado ? (
          <button className="btn-primario" onClick={() => {
            setConfirmado(true);
            emitir('accion-ritual', { distribucion });
          }} style={{ width:'100%', padding:'16px' }}>
            🔫 Confirmar distribución ({totalDistribuido}/3)
          </button>
        ) : (
          <div style={{ textAlign:'center', padding:'14px', background:'rgba(98,228,165,0.07)', border:'1px solid rgba(98,228,165,0.2)', borderRadius:'8px' }}>
            <p style={{ color:'#98e4a5', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'2px' }}>✓ Distribuido</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ── Ritual del Culto — vista para los demás jugadores ────────
function RitualEspera() {
  return (
    <div style={{ width:'100%', maxWidth:'360px', textAlign:'center', animation:'aparecer 0.5s ease' }}>
      <div style={{ fontSize:'64px', marginBottom:'20px', animation:'flotar 4s ease-in-out infinite' }}>🌑</div>
      <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--crema-pergamino)', fontSize:'22px', letterSpacing:'3px', marginBottom:'10px' }}>
        Cierra los ojos
      </h2>
      <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.45)', fontSize:'15px', marginBottom:'28px' }}>
        El Culto actúa en las sombras...
      </p>
      <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#4caf50', animation:`pulsar-kraken 1.4s ease-in-out ${i*0.3}s infinite` }} />
        ))}
      </div>
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
