import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSala } from '../contextos/SalaContexto';

export default function LobbyUnirse() {
  const navigate = useNavigate();
  const { codigo: codigoUrl } = useParams();
  const { emitir, escuchar, conectado, entrarEnSala } = useSala();

  const [nombre,   setNombre]   = useState('');
  const [codigo,   setCodigo]   = useState(codigoUrl || '');
  const [error,    setError]    = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const c1 = escuchar('unido-a-sala', ({ sala }) => {
      entrarEnSala(sala, nombre);
      navigate('/sala');
    });
    const c2 = escuchar('error', ({ mensaje }) => {
      setError(mensaje);
      setCargando(false);
    });
    return () => { c1(); c2(); };
  }, [escuchar, navigate, nombre, entrarEnSala]);

  const unirse = () => {
    if (!nombre.trim())                               return setError('Introduce tu nombre');
    if (!codigo.trim() || codigo.trim().length < 4)   return setError('Introduce el código de sala');
    if (!conectado)                                   return setError('Sin conexión al servidor...');
    setError('');
    setCargando(true);
    sessionStorage.setItem('sala_nombre', nombre.trim());
    emitir('unirse-sala', { codigo: codigo.trim().toUpperCase(), nombre: nombre.trim() });
  };

  return (
    <div className="fondo-mar" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div className="aparecer" style={{ background:'rgba(13,27,46,0.9)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:'16px', padding:'48px 40px', width:'100%', maxWidth:'440px', backdropFilter:'blur(20px)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'rgba(245,230,200,0.4)', fontFamily:'var(--fuente-subtitulo)', fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'32px', display:'block', cursor:'pointer' }}>← Volver</button>

        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>🚪</div>
          <h1 style={{ fontFamily:'var(--fuente-titulo)', fontSize:'22px', color:'var(--oro-dorado)', letterSpacing:'3px' }}>Unirse a Sala</h1>
        </div>

        <div style={{ marginBottom:'18px' }}>
          <label style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', display:'block', marginBottom:'8px' }}>Tu nombre</label>
          <input className="input-tema" type="text" placeholder="Introduce tu nombre..." value={nombre} onChange={e => setNombre(e.target.value)} maxLength={20} autoFocus />
        </div>

        <div style={{ marginBottom:'28px' }}>
          <label style={{ fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', display:'block', marginBottom:'8px' }}>Código de sala</label>
          <input className="input-tema" type="text" placeholder="XXXX" value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && unirse()} maxLength={4}
            style={{ textAlign:'center', fontSize:'28px', letterSpacing:'8px', fontFamily:'var(--fuente-titulo)' }} />
        </div>

        {error && <p style={{ color:'#ff8a8a', fontSize:'13px', marginBottom:'16px', textAlign:'center' }}>{error}</p>}

        <button className="btn-primario" onClick={unirse} style={{ width:'100%' }} disabled={!conectado || cargando}>
          {cargando ? '🔄 Uniéndose...' : conectado ? '⚓ Unirme' : '🔄 Conectando...'}
        </button>
      </div>
    </div>
  );
}
