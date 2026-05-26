import React, { useState, useEffect, useRef } from 'react';
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
  const [sala, setSala]     = useState(null);
  const [tablero, setTablero] = useState(null);
  const [fase, setFase]     = useState('lobby');
  const [error, setError]   = useState('');
  const [motin, setMotin]   = useState(null);
  const [kraken, setKraken] = useState(null);

  // Tracking de jugadores ya vistos para animación de entrada
  const seenPlayerIds = useRef(new Set());

  useEffect(() => {
    if (!codigo) return;
    emitir('unirse-tablero', { codigo: codigo.toUpperCase() });

    const c1 = escuchar('tablero-conectado', ({ sala }) => { setSala(sala); setFase(sala.fase); });
    const c2 = escuchar('tablero-actualizado', (t) => { setTablero(t); setFase(t.fase); });
    const c3 = escuchar('sala-actualizada', (s) => { setSala(s); setFase(s.fase); });
    const c4 = escuchar('fase-cambiada', ({ fase: f }) => setFase(f));
    const c5 = escuchar('error', ({ mensaje }) => setError(mensaje));
    const c6 = escuchar('motin-resultado', (data) => {
      setMotin(data);
      setTimeout(() => setMotin(null), 6000);
    });
    const c7 = escuchar('kraken-sacrificio', (data) => {
      setKraken(data);
      if (!data.victoriaCultistas) setTimeout(() => setKraken(null), 7000);
    });
    return () => { c1(); c2(); c3(); c4(); c5(); c6(); c7(); };
  }, [codigo, emitir, escuchar]);

  // Acciones del host
  const iniciarPartida = () => emitir('tablero-iniciar');
  const avanzarFase    = () => emitir('tablero-avanzar');
  const retrocederFase = () => emitir('tablero-retroceder');
  const reiniciar      = () => { if (window.confirm('¿Reiniciar la partida?')) emitir('tablero-reiniciar'); };
  const cambiarHost    = (id) => emitir('tablero-cambiar-host', { nuevoHostId: id });

  const jugadores   = tablero?.jugadores || sala?.jugadores || [];
  const numJugadores = sala?.numJugadores || jugadores.length || 0;

  // Actualizar IDs vistos DESPUÉS de cada render (para animación playerJoin)
  useEffect(() => {
    jugadores.forEach(j => { if (j.id) seenPlayerIds.current.add(j.id); });
  }); // sin deps: corre en cada render, justo después de que el DOM se actualiza

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
    const urlUnirse = `${urlBase}/unirse/${codigo}`;
    const listo     = numJugadores >= 5;

    return (
      <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', background:'#060300' }}>

        {/* ═══ FONDO — imagen oscurecida ═══ */}
        <div style={{
          position:'absolute', inset:'-8px', zIndex:0,
          backgroundImage:"url('/sala-espera/fondo.png')",
          backgroundSize:'cover', backgroundPosition:'center',
          filter:'brightness(0.44) saturate(1.32)',
          transform:'scale(1.01)',
        }}/>

        {/* ═══ Viñeta cinematográfica ═══ */}
        <div style={{
          position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background:`
            radial-gradient(circle at 50% 50%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.52) 58%, rgba(0,0,0,0.86) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.24) 46%, rgba(0,0,0,0.76) 100%)
          `,
        }}/>

        {/* ═══ Calidez ambiental de mesa ═══ */}
        <div style={{
          position:'absolute', left:'50%', top:'52%', zIndex:2, pointerEvents:'none',
          width:'1050px', height:'780px', borderRadius:'50%',
          transform:'translate(-50%,-50%)',
          background:'radial-gradient(ellipse, rgba(105,48,5,0.11) 0%, transparent 65%)',
          animation:'luz-ambar 10s ease-in-out 2.5s infinite',
        }}/>

        {/* ═══ HEADER ═══ */}
        <div style={{
          position:'relative', zIndex:10, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'11px 32px',
          background:'rgba(4,2,1,0.76)', backdropFilter:'blur(14px)',
          borderBottom:'1px solid rgba(201,168,76,0.15)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <span style={{ fontSize:'22px', animation:'flotar 5s ease-in-out infinite', filter:'drop-shadow(0 0 10px rgba(255,140,30,0.55))' }}>🐙</span>
            <div>
              <h1 style={{ fontFamily:'var(--fuente-titulo)', color:'var(--oro-dorado)', fontSize:'17px', letterSpacing:'3px', textShadow:'0 0 22px rgba(201,168,76,0.38)' }}>Feed The Kraken</h1>
              <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,220,170,0.36)', fontSize:'9px', letterSpacing:'3px', textTransform:'uppercase' }}>Sala de Espera</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: conectado ? '#6abf6a' : '#cc4444', boxShadow: conectado ? '0 0 8px rgba(106,191,106,0.65)' : 'none' }}/>
            <button onClick={() => navigate('/')} style={{
              background:'none', border:'1px solid rgba(201,168,76,0.20)',
              color:'rgba(201,168,76,0.48)', padding:'5px 14px', borderRadius:'4px',
              cursor:'pointer', fontFamily:'var(--fuente-subtitulo)', fontSize:'10px', letterSpacing:'1px', transition:'all 0.3s ease',
            }}>Salir</button>
          </div>
        </div>

        {/* ═══ CONTENIDO PRINCIPAL ═══ */}
        <div style={{
          position:'relative', zIndex:10, flex:1,
          display:'flex', flexDirection:'column',
          padding:'clamp(6px,1.1vh,16px) clamp(20px,3.5vw,56px) clamp(8px,1.2vh,14px)',
          overflow:'hidden',
          animation:'aparecer 0.8s ease 0.15s both',
        }}>

          {/* ── Grid 3 columnas: código | pergamino | QR ── */}
          <div style={{
            flex:1, minHeight:0,
            display:'grid', gridTemplateColumns:'1fr auto 1fr',
            gap:'clamp(8px,1.6vw,32px)',
            alignItems:'center',
          }}>

            {/* ─── CÓDIGO DE SALA ─── */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px', position:'relative' }}>
              <p style={{
                fontFamily:'var(--fuente-subtitulo)', letterSpacing:'4px', textTransform:'uppercase',
                fontSize:'clamp(8px,0.68vw,10px)', color:'rgba(245,218,162,0.58)', margin:0,
              }}>Código de sala</p>

              <div style={{
                fontFamily:'var(--fuente-titulo)',
                fontSize:'clamp(42px,5.0vw,74px)',
                letterSpacing:'0.30em',
                color:'var(--oro-claro)',
                textShadow:'0 0 44px rgba(255,215,100,0.50), 0 0 90px rgba(255,215,100,0.16), 0 4px 20px rgba(0,0,0,0.99)',
                lineHeight:1,
              }}>
                {codigo}
              </div>

              {/* Vela bajo el código */}
              <div style={{
                position:'absolute', bottom:'-28px',
                width:'300px', height:'100px', borderRadius:'50%',
                background:'radial-gradient(ellipse, rgba(255,168,46,0.15) 0%, transparent 68%)',
                filter:'blur(18px)',
                animation:'vela-parpadeo-1 3.4s ease-in-out 0.6s infinite',
                pointerEvents:'none',
              }}/>
            </div>

            {/* ─── PERGAMINO ─── */}
            <div style={{
              position:'relative',
              width:'min(490px,40vw)',
              flexShrink:0,
              filter:`
                drop-shadow(0 32px 68px rgba(0,0,0,0.96))
                drop-shadow(0 10px 26px rgba(0,0,0,0.80))
              `,
            }}>
              <img src="/sala-espera/pergamino.png" alt=""
                style={{ display:'block', width:'100%', height:'auto', userSelect:'none', pointerEvents:'none', filter:'brightness(0.94)' }}/>

              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', padding:'13% 13% 6%' }}>

                {/* Cabecera del pergamino */}
                <div style={{ flexShrink:0, marginBottom:'4%' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2.5%' }}>
                    <h2 style={{
                      fontFamily:'var(--fuente-pirata)',
                      fontSize:'clamp(19px,1.82vw,28px)',
                      color:'#180700', letterSpacing:'1.5px', margin:0, lineHeight:1,
                    }}>Tripulación</h2>
                    <span style={{
                      fontFamily:'var(--fuente-subtitulo)',
                      fontSize:'clamp(13px,1.22vw,18px)',
                      color:'#2d1000', fontWeight:700, opacity:0.70,
                    }}>{numJugadores} / 11</span>
                  </div>
                  <div style={{ height:'2px', background:'linear-gradient(to right, transparent, rgba(40,14,2,0.38) 18%, rgba(40,14,2,0.38) 82%, transparent)' }}/>
                </div>

                {/* Lista de jugadores */}
                <div style={{
                  flex:1, display:'flex', flexDirection:'column',
                  gap:'clamp(3px,0.46vh,8px)', overflow:'hidden',
                }}>
                  {jugadores.length === 0 ? (
                    <p style={{
                      fontFamily:'var(--fuente-subtitulo)',
                      color:'rgba(10,4,0,0.48)',
                      fontSize:'clamp(11px,1.0vw,15px)',
                      textAlign:'center', marginTop:'16%', letterSpacing:'1.5px',
                    }}>Esperando tripulantes…</p>

                  ) : jugadores.map((j, i) => {
                    const esHost = j.id === sala.hostId;
                    const esNuevo = !seenPlayerIds.current.has(j.id);
                    return (
                      <div key={j.id || i} style={{
                        display:'flex', alignItems:'center',
                        gap:'clamp(5px,0.5vw,10px)',
                        padding:'clamp(5px,0.56vh,10px) clamp(6px,0.62vw,12px)',
                        borderRadius:'8px',
                        background: esHost
                          ? 'linear-gradient(to right, rgba(105,62,15,0.18), rgba(255,240,200,0.04))'
                          : 'linear-gradient(to right, rgba(85,50,18,0.09), rgba(255,255,255,0.02))',
                        border:`1px solid ${esHost ? 'rgba(78,44,10,0.22)' : 'rgba(65,38,8,0.08)'}`,
                        animation: esNuevo
                          ? `playerJoin 0.52s cubic-bezier(.25,.46,.45,.94) ${i * 0.06}s both`
                          : 'none',
                      }}>

                        {/* Número / ⚓ host */}
                        <span style={{
                          flexShrink:0,
                          width:'clamp(18px,1.65vw,25px)', textAlign:'center',
                          fontSize: esHost ? 'clamp(10px,0.92vw,14px)' : 'clamp(9px,0.80vw,12px)',
                          color: esHost ? '#3a1600' : 'rgba(48,20,4,0.52)',
                          fontWeight: esHost ? 800 : 600,
                          fontFamily:'var(--fuente-subtitulo)',
                        }}>
                          {esHost ? '⚓' : String(i + 1).padStart(2, '0')}
                        </span>

                        {/* NOMBRE — prioridad absoluta */}
                        <span style={{
                          fontFamily:'var(--fuente-subtitulo)',
                          fontSize:'clamp(13px,1.30vw,20px)',
                          color: esHost ? '#100400' : '#1c0900',
                          fontWeight: esHost ? 800 : 700,
                          lineHeight:1.1, flex:1,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          letterSpacing:'0.6px', textTransform:'uppercase',
                          textShadow:'0 1px 0 rgba(255,255,255,0.16)',
                        }}>
                          {j.nombre}
                        </span>

                        {/* Botón ceder mando */}
                        {socketId === sala.hostId && !esHost && (
                          <button onClick={() => cambiarHost(j.id)} title="Ceder el mando" style={{
                            flexShrink:0, background:'none',
                            border:'1px solid rgba(35,10,2,0.20)', borderRadius:'3px',
                            fontSize:'clamp(7px,0.64vw,10px)', color:'rgba(35,10,2,0.42)',
                            cursor:'pointer', padding:'2px 5px', lineHeight:1,
                          }}>⚓</button>
                        )}

                        {/* Indicador conexión */}
                        <div title={j.conectado !== false ? 'Conectado' : 'Desconectado'} style={{
                          flexShrink:0, width:'7px', height:'7px', borderRadius:'50%',
                          background: j.conectado !== false ? '#1a5a1a' : '#7a1a1a',
                          opacity:0.84,
                          boxShadow: j.conectado !== false ? '0 0 5px rgba(30,110,30,0.55)' : '0 0 5px rgba(130,30,30,0.55)',
                        }}/>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* ─── PANEL QR ─── */}
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
              <div style={{
                padding:'clamp(16px,1.9vh,26px) clamp(18px,2.0vw,28px)',
                borderRadius:'22px',
                background:'rgba(5,2,1,0.60)',
                backdropFilter:'blur(18px)',
                border:'1px solid rgba(255,255,255,0.055)',
                boxShadow:'0 18px 52px rgba(0,0,0,0.65), 0 0 0 1px rgba(201,168,76,0.045)',
                display:'flex', flexDirection:'column', alignItems:'center',
                gap:'clamp(10px,1.2vh,16px)',
              }}>
                <p style={{
                  fontFamily:'var(--fuente-subtitulo)', letterSpacing:'3px', textTransform:'uppercase',
                  fontSize:'clamp(7px,0.63vw,10px)', color:'rgba(245,218,162,0.65)', margin:0,
                }}>Únete escaneando</p>

                {/* QR sobre fondo blanco para máximo contraste */}
                <div style={{
                  padding:'clamp(8px,0.9vw,13px)', borderRadius:'12px',
                  background:'rgba(252,248,240,0.97)',
                  boxShadow:'0 4px 24px rgba(0,0,0,0.55)',
                }}>
                  <QRCodeSVG value={urlUnirse} size={160} level="M" bgColor="transparent" fgColor="#0a0200"/>
                </div>

                <p style={{
                  fontFamily:'var(--fuente-subtitulo)',
                  fontSize:'clamp(6px,0.55vw,8px)',
                  color:'rgba(245,218,162,0.40)',
                  textAlign:'center', margin:0,
                  maxWidth:'175px',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>{urlUnirse}</p>
              </div>
            </div>

          </div>

          {/* ─── CTA: aviso + botón iniciar ─── */}
          <div style={{ flexShrink:0, textAlign:'center', paddingTop:'clamp(6px,0.9vh,12px)', paddingBottom:'2px' }}>
            {!listo && (
              <p style={{
                fontFamily:'var(--fuente-subtitulo)', fontSize:'clamp(9px,0.82vw,12px)',
                color:'rgba(245,218,162,0.72)',
                textShadow:'0 1px 8px rgba(0,0,0,0.98)',
                marginBottom:'10px', letterSpacing:'1px',
              }}>
                Faltan {5 - numJugadores} jugador{5 - numJugadores !== 1 ? 'es' : ''} para iniciar
              </p>
            )}

            <button
              onClick={listo ? iniciarPartida : undefined}
              disabled={!listo}
              style={{
                minWidth:'clamp(210px,22vw,340px)',
                height:'clamp(52px,5.6vh,68px)',
                borderRadius:'14px',
                border:`1px solid ${listo ? 'rgba(255,210,120,0.26)' : 'rgba(115,76,18,0.16)'}`,
                background: listo
                  ? 'linear-gradient(180deg, #7c541f 0%, #3e260a 100%)'
                  : 'rgba(16,8,2,0.55)',
                color: listo ? '#f2d8a6' : 'rgba(180,132,44,0.38)',
                fontFamily:'var(--fuente-subtitulo)',
                fontSize:'clamp(11px,1.06vw,15px)',
                fontWeight:700, letterSpacing:'3px', textTransform:'uppercase',
                cursor: listo ? 'pointer' : 'not-allowed',
                transition:'all 0.25s ease',
                boxShadow: listo
                  ? '0 8px 36px rgba(125,82,14,0.44), inset 0 1px 0 rgba(255,220,140,0.10)'
                  : 'none',
              }}
            >
              ⚓&nbsp;&nbsp;Iniciar Partida
            </button>

            {error && <p style={{ color:'#ffccaa', fontSize:'11px', marginTop:'8px', fontFamily:'var(--fuente-subtitulo)', textShadow:'0 1px 4px rgba(0,0,0,0.85)' }}>{error}</p>}
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

          {/* Niebla ambiental */}
          <NieblaTablero fase={fase} />

          {/* Overlay ritual del Culto */}
          {tablero?.accionEspecial?.tipo === 'ritual' && (() => {
            const carta = tablero.accionEspecial.carta;
            const TIPO_EMOJI = { conversion_culto:'👥', registro_camarote:'📋', alijo_armas:'🔫' };
            return (
              <div style={{ position:'absolute', inset:0, background:'rgba(8,7,15,0.9)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', zIndex:50, animation:'aparecer 0.4s ease' }}>
                <div style={{ textAlign:'center', maxWidth:'520px', padding:'0 24px' }}>
                  <div style={{ fontSize:'clamp(50px,8vw,90px)', marginBottom:'12px', animation:'flotar 3s ease-in-out infinite' }}>🐙</div>
                  <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(76,175,80,0.6)', fontSize:'clamp(9px,1.2vw,13px)', letterSpacing:'4px', textTransform:'uppercase', marginBottom:'14px' }}>
                    Levantamiento del Culto
                  </p>
                  <div style={{ background:'rgba(76,175,80,0.07)', border:'2px solid rgba(76,175,80,0.3)', borderRadius:'16px', padding:'clamp(18px,3vw,32px) clamp(20px,4vw,40px)', marginBottom:'20px', boxShadow:'0 0 60px rgba(76,175,80,0.2)' }}>
                    <div style={{ fontSize:'clamp(28px,4vw,52px)', marginBottom:'12px' }}>
                      {TIPO_EMOJI[carta?.tipo] || '🐙'}
                    </div>
                    <h2 style={{ fontFamily:'var(--fuente-titulo)', color:'#4caf50', fontSize:'clamp(22px,3.5vw,52px)', letterSpacing:'4px', textShadow:'0 0 40px rgba(76,175,80,0.5)', marginBottom:'12px' }}>
                      {carta?.nombre || 'Ritual del Culto'}
                    </h2>
                    <p style={{ fontFamily:'var(--fuente-cuerpo)', color:'rgba(245,230,200,0.5)', fontSize:'clamp(12px,1.5vw,18px)', lineHeight:'1.6' }}>
                      {carta?.descripcion || ''}
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:'12px', justifyContent:'center', alignItems:'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:'clamp(8px,1.2vw,12px)', height:'clamp(8px,1.2vw,12px)', borderRadius:'50%', background:'#4caf50', animation:`pulsar-kraken 1.4s ease-in-out ${i*0.3}s infinite` }} />
                    ))}
                    <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.3)', fontSize:'clamp(10px,1.3vw,14px)', letterSpacing:'2px', marginLeft:'8px' }}>
                      El Culto actúa en las sombras...
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Overlay sacrificio Kraken */}
          {kraken && (
            <div style={{ position:'absolute', inset:0, background:'rgba(8,7,15,0.88)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)', zIndex:50, animation:'aparecer 0.4s ease' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'clamp(60px,10vw,100px)', marginBottom:'16px', animation:'flotar 2.5s ease-in-out infinite' }}>🌊</div>
                <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)', fontSize:'clamp(11px,1.5vw,16px)', letterSpacing:'4px', textTransform:'uppercase', marginBottom:'16px' }}>Sacrificio al Kraken</p>
                <h2 style={{ fontFamily:'var(--fuente-titulo)', fontSize:'clamp(24px,4vw,52px)', color:'var(--crema-pergamino)', letterSpacing:'3px', marginBottom:'10px' }}>{kraken.nombre}</h2>
                {kraken.victoriaCultistas ? (<>
                  <p style={{ fontFamily:'var(--fuente-titulo)', fontSize:'clamp(18px,3vw,36px)', color:'#4caf50', letterSpacing:'2px', marginBottom:'16px' }}>
                    🐙 ¡ERA EL CULTISTA!
                  </p>
                  <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'#4caf50', fontSize:'clamp(14px,2vw,22px)', letterSpacing:'3px', textShadow:'0 0 30px rgba(76,175,80,0.7)' }}>
                    ¡EL KRAKEN HA ENCONTRADO A SU ELEGIDO!
                  </p>
                </>) : (
                  <p style={{ fontFamily:'var(--fuente-titulo)', fontSize:'clamp(16px,2.5vw,30px)', color:'rgba(245,230,200,0.6)', letterSpacing:'2px', marginBottom:'8px' }}>
                    No era el Cultista — el juego continúa
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Overlay motín */}
          {motin && (
            <div style={{ position:'absolute', inset:0, background:'rgba(8,7,15,0.82)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', zIndex:50, animation:'aparecer 0.3s ease' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'clamp(60px,10vw,100px)', marginBottom:'16px', animation:'flotar 2s ease-in-out infinite' }}>
                  {motin.exitoso ? '💀' : '⚓'}
                </div>
                <h2 style={{ fontFamily:'var(--fuente-titulo)', fontSize:'clamp(28px,5vw,60px)', color: motin.exitoso ? '#ff8a8a' : 'var(--oro-dorado)', letterSpacing:'5px', textShadow:`0 0 40px ${motin.exitoso ? 'rgba(192,57,43,0.6)' : 'rgba(201,168,76,0.6)'}`, marginBottom:'14px' }}>
                  {motin.exitoso ? '¡MOTÍN!' : 'MOTÍN FALLADO'}
                </h2>
                <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.55)', fontSize:'clamp(14px,2vw,20px)', letterSpacing:'2px', marginBottom: motin.exitoso && motin.nuevoCapitan ? '12px' : 0 }}>
                  {motin.totalPistolas} pistola{motin.totalPistolas !== 1 ? 's' : ''} / {motin.umbral} necesarias
                </p>
                {motin.exitoso && motin.nuevoCapitan && (
                  <p style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'clamp(16px,2.5vw,26px)', letterSpacing:'2px' }}>
                    Nuevo capitán: <strong>{motin.nuevoCapitan.nombre}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Overlay durmiendo — texto flotante sobre la niebla */}
          {fase === 'durmiendo' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(5,9,20,0.45) 0%, transparent 100%)',
            }}>
              <div style={{ textAlign: 'center', animation: 'aparecer 1.2s ease' }}>
                <div style={{ fontSize: 'clamp(60px,10vw,100px)', marginBottom: '24px', animation: 'flotar 4s ease-in-out infinite', filter: 'drop-shadow(0 0 24px rgba(120,160,220,0.55))' }}>🌙</div>
                <h2 style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--crema-pergamino)', fontSize: 'clamp(22px,4vw,48px)', letterSpacing: '4px', marginBottom: '12px', textShadow: '0 2px 20px rgba(5,9,20,0.9)' }}>
                  La tripulación se va a dormir
                </h2>
                <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.55)', fontSize: 'clamp(14px,2vw,20px)', textShadow: '0 1px 12px rgba(5,9,20,0.8)' }}>
                  Los piratas están abriéndose los ojos entre sí...
                </p>
                <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.3)', fontSize: '11px', letterSpacing: '2px', marginTop: '20px', textTransform: 'uppercase' }}>
                  El Host pulsa ▶ cuando estén listos
                </p>
              </div>
            </div>
          )}

          {/* Overlay victoria */}
          {fase === 'victoria' && (() => {
            const ganador = tablero?.victoria;
            const ROL_EQUIPO = { piratas: ['pirata'], marineros: ['marinero'], cultistas: ['cultista','adepto'] };
            const ROL_LABEL  = { pirata:'💀 Pirata', marinero:'⚓ Marinero', cultista:'🐙 Cultista', adepto:'👁️ Adepto' };
            const rolesEquipo = ROL_EQUIPO[ganador] || [];
            const equipoGanador = jugadores.filter(j => rolesEquipo.includes(j.rol));
            return (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,15,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '60px' }}>
                <div style={{ textAlign: 'center', animation: 'aparecer 0.8s ease' }}>
                  <div style={{ fontSize: 'clamp(60px,10vw,100px)', marginBottom: '20px', animation: 'flotar 2s ease-in-out infinite' }}>
                    {ganador === 'piratas' ? '💀' : ganador === 'marineros' ? '⚓' : '🐙'}
                  </div>
                  <h1 style={{ fontFamily: 'var(--fuente-titulo)', fontSize: 'clamp(24px,5vw,64px)', color: 'var(--oro-dorado)', letterSpacing: '6px', textShadow: '0 0 60px rgba(201,168,76,0.8)' }}>
                    {ganador === 'piratas' ? 'VICTORIA PIRATA' : ganador === 'marineros' ? 'VICTORIA MARINERA' : '¡EL KRAKEN HA SIDO INVOCADO!'}
                  </h1>
                </div>
                {equipoGanador.length > 0 && (
                  <div style={{ animation: 'aparecer 1.2s ease', minWidth: '220px' }}>
                    <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--oro-dorado)', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
                      Equipo ganador
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {equipoGanador.map(j => (
                        <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 16px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'var(--crema-pergamino)', fontSize: '16px' }}>{j.nombre}</span>
                          <span style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.45)', fontSize: '12px' }}>{ROL_LABEL[j.rol] || j.rol}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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

          {tablero?.ultimaCarta && (
            <div style={{ background: `rgba(${
              tablero.ultimaCarta.color === 'azul' ? '74,155,199' :
              tablero.ultimaCarta.color === 'rojo' ? '192,57,43' : '201,168,76'
            },0.08)`, border: `1px solid ${
              tablero.ultimaCarta.color === 'azul' ? 'rgba(74,155,199,0.3)' :
              tablero.ultimaCarta.color === 'rojo' ? 'rgba(192,57,43,0.3)' : 'rgba(201,168,76,0.3)'
            }`, borderRadius: '8px', padding: '10px 12px' }}>
              <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'rgba(245,230,200,0.35)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Última carta</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>
                  {tablero.ultimaCarta.color === 'azul' ? '🔵' : tablero.ultimaCarta.color === 'rojo' ? '🔴' : '🟡'}
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--fuente-subtitulo)', color: 'var(--crema-pergamino)', fontSize: '12px' }}>{tablero.ultimaCarta.nombre}</p>
                  <p style={{ fontFamily: 'var(--fuente-cuerpo)', color: 'rgba(245,230,200,0.4)', fontSize: '10px', marginTop: '2px' }}>{tablero.ultimaCarta.descripcion}</p>
                </div>
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

// ── Niebla ambiental ──
function NieblaTablero({ fase }) {
  // estados: 'oculto' | 'visible' | 'dispersando'
  const [estado, setEstado] = useState(fase === 'durmiendo' ? 'visible' : 'oculto');
  const prevFaseRef = useRef(fase);
  const timerRef    = useRef(null);

  useEffect(() => {
    const prev = prevFaseRef.current;
    prevFaseRef.current = fase;

    if (fase === 'durmiendo' && estado !== 'visible') {
      // Entramos en durmiendo → mostrar niebla (cancela dispersión pendiente)
      clearTimeout(timerRef.current);
      setEstado('visible');
    } else if (prev === 'durmiendo' && fase !== 'durmiendo') {
      // Salimos de durmiendo → dispersar y luego ocultar
      setEstado('dispersando');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setEstado('oculto'), 3200);
    }
  }, [fase]); // eslint-disable-line

  // Limpieza al desmontar
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (estado === 'oculto') return null;
  const dispersando = estado === 'dispersando';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>
      {/* Velo base azul-oscuro — se desvanece suavemente al dispersar */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 120% 120% at 50% 50%, rgba(8,14,26,0.55) 0%, rgba(5,9,18,0.68) 100%)',
        transition: 'opacity 3s ease',
        opacity: dispersando ? 0 : 1,
      }} />

      {/* Capa 1 — masa principal, deriva lenta (20 s) */}
      <div style={{
        position: 'absolute', inset: '-30%',
        background: 'radial-gradient(ellipse 72% 56% at 38% 62%, rgba(140,175,212,0.21) 0%, rgba(100,142,188,0.07) 55%, transparent 72%)',
        filter: 'blur(26px)',
        animation: dispersando
          ? 'niebla-dispersar 2.8s ease-out forwards'
          : 'niebla-deriva-1 20s ease-in-out infinite',
      }} />

      {/* Capa 2 — masa secundaria, dirección opuesta (27 s) */}
      <div style={{
        position: 'absolute', inset: '-30%',
        background: 'radial-gradient(ellipse 66% 50% at 64% 37%, rgba(158,196,222,0.16) 0%, rgba(118,158,192,0.06) 52%, transparent 70%)',
        filter: 'blur(32px)',
        animation: dispersando
          ? 'niebla-dispersar 2.5s ease-out 0.25s forwards'
          : 'niebla-deriva-2 27s ease-in-out infinite',
      }} />

      {/* Capa 3 — jirones finos en la parte alta (15 s) */}
      <div style={{
        position: 'absolute', inset: '-30%',
        background: 'radial-gradient(ellipse 56% 40% at 50% 21%, rgba(202,222,240,0.11) 0%, transparent 65%)',
        filter: 'blur(18px)',
        animation: dispersando
          ? 'niebla-dispersar 2.1s ease-out 0.10s forwards'
          : 'niebla-deriva-3 15s ease-in-out infinite',
      }} />

      {/* Capa 4 — acento verdoso muy sutil (Kraken) — se mueve con deriva-1 desfasada */}
      <div style={{
        position: 'absolute', inset: '-30%',
        background: 'radial-gradient(ellipse 48% 38% at 55% 72%, rgba(10,100,80,0.08) 0%, transparent 65%)',
        filter: 'blur(22px)',
        animation: dispersando
          ? 'niebla-dispersar 3.0s ease-out 0.05s forwards'
          : 'niebla-deriva-1 24s ease-in-out 4s infinite',
      }} />
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
