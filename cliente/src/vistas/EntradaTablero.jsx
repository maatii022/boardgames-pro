import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EntradaTablero() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');

  const entrar = () => {
    if (!codigo.trim() || codigo.trim().length < 4) return setError('Introduce el código de sala');
    navigate(`/tablero/${codigo.trim().toUpperCase()}`);
  };

  return (
    <div className="fondo-mar" style={{
      width:'100%', height:'100%', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'20px',
    }}>
      <div className="aparecer" style={{
        background:'rgba(13,27,46,0.9)',
        border:'1px solid rgba(201,168,76,0.3)',
        borderRadius:'16px', padding:'48px 40px',
        width:'100%', maxWidth:'440px',
        backdropFilter:'blur(20px)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
        textAlign:'center',
      }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>📺</div>
        <h1 style={{
          fontFamily:'var(--fuente-titulo)', fontSize:'22px',
          color:'var(--oro-dorado)', letterSpacing:'3px', marginBottom:'6px',
        }}>Pantalla Principal</h1>
        <p style={{
          fontFamily:'var(--fuente-subtitulo)', color:'rgba(245,230,200,0.4)',
          fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase',
          marginBottom:'36px',
        }}>Vista de tablero · Solo lectura</p>

        <div style={{ marginBottom:'24px', textAlign:'left' }}>
          <label style={{
            fontFamily:'var(--fuente-subtitulo)', color:'var(--oro-dorado)',
            fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase',
            display:'block', marginBottom:'8px',
          }}>Código de sala</label>
          <input
            className="input-tema" type="text"
            placeholder="XXXX"
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            maxLength={4}
            style={{ textAlign:'center', fontSize:'32px', letterSpacing:'10px', fontFamily:'var(--fuente-titulo)' }}
            autoFocus
          />
        </div>

        {error && <p style={{ color:'#ff8a8a', fontSize:'13px', marginBottom:'16px' }}>{error}</p>}

        <button className="btn-primario" onClick={entrar} style={{ width:'100%' }}>
          📺 Conectar Tablero
        </button>

        <button onClick={() => navigate('/')} style={{
          background:'none', border:'none', color:'rgba(245,230,200,0.3)',
          fontFamily:'var(--fuente-subtitulo)', fontSize:'11px',
          letterSpacing:'2px', textTransform:'uppercase',
          marginTop:'20px', cursor:'pointer', display:'block', width:'100%',
        }}>← Volver al menú</button>
      </div>
    </div>
  );
}
