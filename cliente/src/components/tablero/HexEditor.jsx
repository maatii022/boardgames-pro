/**
 * HexEditor v2 — Mapeo visual del tablero hexagonal.
 *
 * Modos:
 *   ✚ Colocar  — click = nuevo hex · drag = mover · ESC = cancelar nombre
 *   🔗 Conectar — click A → click B → rueda de dirección → guarda adj[A][d]=B y adj[B][opp]=A
 *   🗑 Eliminar — click en hex = eliminarlo
 *
 * Panel lateral (hex seleccionado en modo Colocar):
 *   Muestra las 6 conexiones con botón ✕ para borrar cada una individualmente.
 *
 * Rueda de dirección:
 *   6 botones en círculo (0=→ 1=↘ 2=↙ 3=← 4=↖ 5=↗)
 *   El botón sugerido (según ángulo A→B) se resalta en dorado.
 *
 * Teclas:
 *   ESC        → cancela estado actual / cierra
 *   Shift+H    → cierra el editor
 *   Enter      → confirma nombre pendiente
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ── Direcciones ───────────────────────────────────────────────────────
   0 = E  →   60°    3 = W  ←  180°
   1 = SE ↘  120°    4 = NW ↖  240°
   2 = SW ↙  180°    5 = NE ↗  300°
   OPP[d] = (d+3)%6  (dirección opuesta)
──────────────────────────────────────────────────────────────────────── */
const DIR_FLECHAS = ['→', '↘', '↙', '←', '↖', '↗'];
const DIR_NOMBRES = ['E', 'SE', 'SW', 'W', 'NW', 'NE'];
const DIR_ANGULOS = [0, 60, 120, 180, 240, 300];          // grados en pantalla (Y↓)
const OPP         = [3, 4, 5, 0, 1, 2];                   // opuesto de cada dir

function dirSugerida(ax, ay, bx, by) {
  let ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  if (ang < 0) ang += 360;
  let best = 0, bestD = 999;
  for (let d = 0; d < 6; d++) {
    let diff = ang - DIR_ANGULOS[d];
    while (diff >  180) diff -= 360;
    while (diff < -180) diff += 360;
    if (Math.abs(diff) < bestD) { bestD = Math.abs(diff); best = d; }
  }
  return best;
}

/* ── Auto-conectar ─────────────────────────────────────────────────── */
function autoConectar(hexes) {
  const adj = {};
  const ids = Object.keys(hexes);
  ids.forEach(id => {
    adj[id] = {};
    const { left: ax, top: ay } = hexes[id];
    const cands = ids
      .filter(o => o !== id)
      .map(o => {
        const { left: bx, top: by } = hexes[o];
        const dx = bx - ax, dy = by - ay;
        let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (ang < 0) ang += 360;
        return { id: o, dist: Math.sqrt(dx*dx + dy*dy), ang };
      })
      .sort((a, b) => a.dist - b.dist);

    for (let d = 0; d < 6; d++) {
      const en = cands.filter(c => {
        let diff = c.ang - DIR_ANGULOS[d];
        while (diff >  180) diff -= 360;
        while (diff < -180) diff += 360;
        return Math.abs(diff) < 30;
      });
      if (en.length) adj[id][d] = en[0].id;
    }
  });
  return adj;
}

/* ── Exportar ──────────────────────────────────────────────────────── */
function generarCodigo(hexes, adj, flechas) {
  const pos = Object.fromEntries(
    Object.entries(hexes).map(([id, { left, top }]) => [id, { left: Math.round(left), top: Math.round(top) }])
  );
  const adjLimpio = {};
  Object.entries(adj).forEach(([id, dirs]) => {
    const d = {};
    Object.entries(dirs).forEach(([k, v]) => { if (v) d[k] = v; });
    if (Object.keys(d).length) adjLimpio[id] = d;
  });
  const flechasLimpio = {};
  Object.entries(flechas).forEach(([id, colores]) => {
    const c = {};
    if (colores.amarillo) c.amarillo = colores.amarillo;
    if (colores.azul)     c.azul     = colores.azul;
    if (colores.rojo)     c.rojo     = colores.rojo;
    if (Object.keys(c).length) flechasLimpio[id] = c;
  });
  return (
`// ── HEX_POS — coords en 1920×1080 ──────────────────────────────────────
export const HEX_POS = ${JSON.stringify(pos, null, 2)};

// ── HEX_ADJ — vecinos por dirección (0=E 1=SE 2=SW 3=W 4=NW 5=NE) ──────
export const HEX_ADJ = ${JSON.stringify(adjLimpio, null, 2)};

// ── HEX_FLECHAS — flechas de color (amarillo=adelante, azul=derecha, rojo=izquierda) ──
export const HEX_FLECHAS = ${JSON.stringify(flechasLimpio, null, 2)};
`);
}

/* ══════════════════════════════════════════════════════════════════════
   DirPicker — rueda de 6 direcciones
══════════════════════════════════════════════════════════════════════ */
function DirPicker({ idA, idB, sugerida, sx, sy, onPick, onCancel }) {
  const SIZE = 156;  // px — diámetro del contenedor
  const R    = 54;   // radio del círculo de botones
  const BTN  = 34;   // diámetro de cada botón

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <>
      {/* Click-outside → cancelar */}
      <div
        onClick={onCancel}
        style={{ position: 'fixed', inset: 0, zIndex: 218, background: 'transparent' }}
      />

      {/* Rueda */}
      <div style={{
        position:  'fixed',
        left:      sx,
        top:       sy,
        transform: 'translate(-50%,-50%)',
        width:     SIZE,
        height:    SIZE,
        zIndex:    220,
        pointerEvents: 'none',
      }}>
        {/* Fondo circular */}
        <div style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '50%',
          background:   'rgba(5,8,18,0.97)',
          border:       '1.5px solid rgba(201,168,76,0.50)',
          boxShadow:    '0 10px 44px rgba(0,0,0,0.85), 0 0 22px rgba(201,168,76,0.12)',
        }} />

        {/* Etiqueta central */}
        <div style={{
          position:  'absolute',
          top:       '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          fontFamily: 'monospace', fontSize: 8.5, lineHeight: 1.5,
          color:     'rgba(245,230,200,0.40)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex:    1,
          maxWidth:  60, overflow: 'hidden',
        }}>
          <span style={{ color: 'rgba(255,160,30,0.85)', fontWeight: 700 }}>{idA}</span>
          <br />↓<br />
          <span style={{ color: 'rgba(100,220,200,0.85)', fontWeight: 700 }}>{idB}</span>
        </div>

        {/* Botones de dirección */}
        {[0,1,2,3,4,5].map(dir => {
          const rad  = (dir * 60 * Math.PI) / 180;
          const cx   = SIZE / 2 + R * Math.cos(rad);
          const cy   = SIZE / 2 + R * Math.sin(rad);
          const isHot = dir === sugerida;
          return (
            <button
              key={dir}
              onClick={(e) => { e.stopPropagation(); onPick(dir); }}
              title={`${DIR_NOMBRES[dir]} (${dir})`}
              style={{
                position:     'absolute',
                left:         cx - BTN / 2,
                top:          cy - BTN / 2,
                width:        BTN,
                height:       BTN,
                borderRadius: '50%',
                background:   isHot ? 'rgba(201,168,76,0.80)' : 'rgba(100,200,255,0.18)',
                border:       isHot
                  ? '2px solid rgba(255,220,80,0.95)'
                  : '1.5px solid rgba(100,200,255,0.40)',
                color:        isHot ? '#fff' : 'rgba(150,220,255,0.90)',
                fontSize:     18,
                cursor:       'pointer',
                zIndex:       2,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                boxShadow:    isHot ? '0 0 14px rgba(201,168,76,0.70)' : '0 2px 6px rgba(0,0,0,0.4)',
                fontFamily:   'monospace',
                transition:   'transform 0.08s',
                pointerEvents: 'all',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {DIR_FLECHAS[dir]}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   HexEditor principal
══════════════════════════════════════════════════════════════════════ */
export default function HexEditor({ scene, onClose }) {
  /* ── Estado de datos ──────────────────────────────────────────── */
  const [hexes,     setHexes]     = useState({});  // { id: {left,top} }
  const [adjacency, setAdjacency] = useState({});  // { id: { dir: id } }
  const [flechas,   setFlechas]   = useState({});  // { id: { amarillo?, azul?, rojo? } }

  /* ── Modo ─────────────────────────────────────────────────────── */
  const [modo,      setModo]      = useState('colocar'); // 'colocar'|'conectar'|'eliminar'

  /* ── Estado temporal ──────────────────────────────────────────── */
  const [pending,   setPending]   = useState(null);  // {left,top} esperando nombre
  const [nombre,    setNombre]    = useState('');
  const [selected,  setSelected]  = useState(null);  // hexId seleccionado
  const [dragging,  setDragging]  = useState(null);  // hexId en drag
  const didDragRef                = useRef(false);

  /* ── Modo conectar ────────────────────────────────────────────── */
  const [conectDesde, setConectDesde] = useState(null);        // hexId fuente
  const [hovered,     setHovered]     = useState(null);        // hexId hover en modo conectar
  const [mouseScr,    setMouseScr]    = useState({ x: 0, y: 0 }); // posición ratón pantalla
  const [dirPicker,   setDirPicker]   = useState(null);        // {idA,idB,sugerida,sx,sy}

  /* ── UI ───────────────────────────────────────────────────────── */
  const [copied,    setCopied]    = useState(false);

  /* ── Paneles flotantes ────────────────────────────────────────── */
  // null = posición por defecto (CSS anchor); { left, top } = posición arrastrada
  const [panelPos,      setPanelPos]      = useState({ toolbar: null, info: null, banner: null });
  // Visibilidad de cada panel (Shift+T / Shift+I / Shift+B)
  const [panelVis,      setPanelVis]      = useState({ toolbar: true, info: true, banner: true });
  // Panel que se está arrastrando ahora mismo
  const [draggingPanel, setDraggingPanel] = useState(null); // { id, mx0, my0, px0, py0 }
  const toolbarRef   = useRef(null);
  const infoPanelRef = useRef(null);
  const bannerRef    = useRef(null);

  /* ── Refs de escena (para callbacks que cierran sobre scene) ──── */
  const sceneRef = useRef(scene);
  useEffect(() => { sceneRef.current = scene; }, [scene]);

  /* ── Conversiones ─────────────────────────────────────────────── */
  const s2s = useCallback((sx, sy) => ({
    left: (sx - sceneRef.current.x) / sceneRef.current.s,
    top:  (sy - sceneRef.current.y) / sceneRef.current.s,
  }), []);

  const t2s = (left, top) => ({
    x: scene.x + left * scene.s,
    y: scene.y + top  * scene.s,
  });

  /* ── Cambio de modo ───────────────────────────────────────────── */
  const cambiarModo = (m) => {
    setModo(m);
    setPending(null);
    setConectDesde(null);
    setDirPicker(null);
    setHovered(null);
    if (m !== 'colocar') setSelected(null);
  };

  /* ── Mouse global (preview line en modo conectar) ─────────────── */
  useEffect(() => {
    const move = (e) => setMouseScr({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  /* ── Overlay click ────────────────────────────────────────────── */
  const handleOverlayClick = (e) => {
    if (dragging) return;
    if (modo === 'colocar') {
      if (pending) return;
      setPending(s2s(e.clientX, e.clientY));
      setNombre('');
    } else if (modo === 'conectar') {
      setConectDesde(null);
      setSelected(null);
    }
  };

  /* ── Hex marker: mousedown (drag en modo colocar) ─────────────── */
  const handleMarkerDown = (e, id) => {
    e.stopPropagation();
    if (modo !== 'colocar') return;
    didDragRef.current = false;
    setDragging(id);
  };

  /* ── Hex marker: click ────────────────────────────────────────── */
  const handleMarkerClick = (e, id) => {
    e.stopPropagation();
    if (didDragRef.current) { didDragRef.current = false; return; }

    if (modo === 'eliminar') { eliminarHex(id); return; }

    if (modo === 'conectar') {
      if (dirPicker) return;
      if (!conectDesde) {
        setConectDesde(id);
        setSelected(id);
      } else if (conectDesde === id) {
        setConectDesde(null);
        setSelected(null);
      } else {
        // Abrir rueda de dirección
        const a = hexes[conectDesde], b = hexes[id];
        const sa = t2s(a.left, a.top), sb = t2s(b.left, b.top);
        setDirPicker({
          idA: conectDesde, idB: id,
          sugerida: dirSugerida(a.left, a.top, b.left, b.top),
          sx: (sa.x + sb.x) / 2,
          sy: (sa.y + sb.y) / 2,
        });
      }
      return;
    }

    // modo colocar: seleccionar
    setSelected(prev => prev === id ? null : id);
  };

  /* ── Drag ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      didDragRef.current = true;
      const p = s2s(e.clientX, e.clientY);
      setHexes(prev => ({ ...prev, [dragging]: p }));
    };
    const up = () => setDragging(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup',   up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, s2s]);

  /* ── Drag de paneles flotantes ────────────────────────────────── */
  useEffect(() => {
    if (!draggingPanel) return;
    const move = (e) => {
      const dx = e.clientX - draggingPanel.mx0;
      const dy = e.clientY - draggingPanel.my0;
      setPanelPos(prev => ({
        ...prev,
        [draggingPanel.id]: { left: draggingPanel.px0 + dx, top: draggingPanel.py0 + dy },
      }));
    };
    const up = () => setDraggingPanel(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup',   up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [draggingPanel]);

  const startPanelDrag = (e, id, ref) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingPanel({ id, mx0: e.clientX, my0: e.clientY, px0: rect.left, py0: rect.top });
  };

  /* ── Confirmar nombre ─────────────────────────────────────────── */
  const confirmarNombre = () => {
    const n = nombre.trim();
    if (!n) return;
    if (hexes[n]) { alert(`Ya existe un hex con id "${n}"`); return; }
    setHexes(prev => ({ ...prev, [n]: pending }));
    setAdjacency(prev => ({ ...prev, [n]: {} }));
    setPending(null);
    setNombre('');
  };

  /* ── Eliminar hex ─────────────────────────────────────────────── */
  const eliminarHex = (id) => {
    setHexes(prev => { const n = { ...prev }; delete n[id]; return n; });
    setAdjacency(prev => {
      const n = {};
      Object.entries(prev).forEach(([k, dirs]) => {
        if (k === id) return;
        n[k] = {};
        Object.entries(dirs).forEach(([d, v]) => { if (v !== id) n[k][d] = v; });
      });
      return n;
    });
    setFlechas(prev => {
      const n = {};
      Object.entries(prev).forEach(([k, colores]) => {
        if (k === id) return;
        const c = {};
        Object.entries(colores).forEach(([color, v]) => { if (v !== id) c[color] = v; });
        if (Object.keys(c).length) n[k] = c;
      });
      return n;
    });
    if (selected    === id) setSelected(null);
    if (conectDesde === id) setConectDesde(null);
  };

  /* ── Confirmar dirección (rueda) ──────────────────────────────── */
  const confirmarDir = (dir) => {
    if (!dirPicker) return;
    const { idA, idB } = dirPicker;
    setAdjacency(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      if (!n[idA]) n[idA] = {};
      if (!n[idB]) n[idB] = {};
      n[idA][dir]       = idB;
      n[idB][OPP[dir]]  = idA;   // inverso automático
      return n;
    });
    setDirPicker(null);
    // Mantenemos conectDesde para seguir conectando desde A
  };

  /* ── Asignar flecha de color ──────────────────────────────────── */
  const asignarFlecha = (hexId, color, vecino) => {
    setFlechas(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      if (!n[hexId]) n[hexId] = {};
      if (vecino === null) {
        delete n[hexId][color];
      } else {
        n[hexId][color] = vecino;
      }
      return n;
    });
  };

  /* ── Eliminar conexión individual ─────────────────────────────── */
  const eliminarConexion = (idA, dir) => {
    setAdjacency(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      const idB = n[idA]?.[dir];
      delete n[idA]?.[dir];
      // Eliminar también el inverso si apunta de vuelta
      if (idB && n[idB]?.[OPP[dir]] === idA) delete n[idB][OPP[dir]];
      return n;
    });
    // Limpiar flechas que apunten a este vecino desde idA
    setFlechas(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      const idB = adjacency[idA]?.[dir];
      if (idB && n[idA]) {
        ['amarillo', 'azul', 'rojo'].forEach(c => {
          if (n[idA][c] === idB) delete n[idA][c];
        });
      }
      return n;
    });
  };

  /* ── Teclas globales ──────────────────────────────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        if (dirPicker)    { setDirPicker(null);                        return; }
        if (pending)      { setPending(null); setNombre('');           return; }
        if (conectDesde)  { setConectDesde(null); setSelected(null);   return; }
        onClose?.();
      }
      if (e.key === 'Enter' && pending) confirmarNombre();
      if (!e.shiftKey) return;
      // Shift + letra → visibilidad de paneles / cerrar editor
      const k = e.key.toUpperCase();
      if (k === 'H') { onClose?.(); return; }
      if (k === 'T') { setPanelVis(v => ({ ...v, toolbar: !v.toolbar })); return; }
      if (k === 'I') { setPanelVis(v => ({ ...v, info:    !v.info    })); return; }
      if (k === 'B') { setPanelVis(v => ({ ...v, banner:  !v.banner  })); return; }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, nombre, dirPicker, conectDesde]);

  /* ── Exportar ─────────────────────────────────────────────────── */
  const exportar = () => {
    const code = generarCodigo(hexes, adjacency, flechas);
    console.log('%c[HexEditor] Código exportado ↓', 'color:#98e4a5;font-weight:bold');
    console.log(code);
    navigator.clipboard?.writeText(code).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2500); },
      () => alert('Mira la consola — clipboard no disponible')
    );
  };

  /* ── Aristas para dibujar ─────────────────────────────────────── */
  const aristas = [];
  const pares   = new Set();
  Object.entries(adjacency).forEach(([idA, dirs]) => {
    Object.entries(dirs).forEach(([dirStr, idB]) => {
      if (!idB || !hexes[idA] || !hexes[idB]) return;
      const dir  = parseInt(dirStr);
      const clave = [idA, idB].sort().join('|');
      if (pares.has(clave)) return;
      pares.add(clave);
      const inverso = adjacency[idB]?.[OPP[dir]] === idA ? OPP[dir] : null;
      aristas.push({ idA, idB, dirAB: dir, dirBA: inverso });
    });
  });

  /* ── Preview line ─────────────────────────────────────────────── */
  let preview = null;
  if (modo === 'conectar' && conectDesde && hexes[conectDesde] && !dirPicker) {
    const s = t2s(hexes[conectDesde].left, hexes[conectDesde].top);
    const tx = hovered && hexes[hovered] ? t2s(hexes[hovered].left, hexes[hovered].top).x : mouseScr.x;
    const ty = hovered && hexes[hovered] ? t2s(hexes[hovered].left, hexes[hovered].top).y : mouseScr.y;
    preview = { x1: s.x, y1: s.y, x2: tx, y2: ty };
  }

  const hexEntries = Object.entries(hexes);
  const r = Math.max(10, 14 * scene.s);  // radio de los marcadores

  /* ══════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Overlay captura de clicks ──────────────────────────────── */}
      <div
        onClick={handleOverlayClick}
        style={{
          position:   'fixed',
          left:       scene.x,
          top:        scene.y,
          width:      1920 * scene.s,
          height:     1080 * scene.s,
          zIndex:     200,
          cursor:     modo === 'colocar'  ? 'crosshair'
                    : modo === 'eliminar' ? 'not-allowed'
                    : 'default',
          background: 'rgba(0,0,0,0.16)',
        }}
      />

      {/* ── SVG: aristas + preview ─────────────────────────────────── */}
      <svg style={{
        position:      'fixed',
        inset:         0,
        width:         '100vw',
        height:        '100vh',
        zIndex:        201,
        pointerEvents: 'none',
        overflow:      'visible',
      }}>
        <defs>
          {/* Punta de flecha azul (A→B) */}
          <marker id="he-arr-azul" markerWidth="7" markerHeight="7"
            refX="6" refY="3.5" orient="auto">
            <path d="M0,1 L6,3.5 L0,6 Z" fill="rgba(100,200,255,0.80)" />
          </marker>
          {/* Punta de flecha dorada (B→A cuando es bidireccional) */}
          <marker id="he-arr-oro" markerWidth="7" markerHeight="7"
            refX="1" refY="3.5" orient="auto-start-reverse">
            <path d="M6,1 L0,3.5 L6,6 Z" fill="rgba(201,168,76,0.80)" />
          </marker>
        </defs>

        {/* Preview line */}
        {preview && (
          <line
            x1={preview.x1} y1={preview.y1}
            x2={preview.x2} y2={preview.y2}
            stroke="rgba(255,160,30,0.65)"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}

        {/* Aristas */}
        {aristas.map(({ idA, idB, dirAB, dirBA }) => {
          const sa = t2s(hexes[idA].left, hexes[idA].top);
          const sb = t2s(hexes[idB].left, hexes[idB].top);
          const dx = sb.x - sa.x, dy = sb.y - sa.y;
          const d  = Math.sqrt(dx*dx + dy*dy) || 1;
          const mg = r + 5;
          const x1 = sa.x + (dx / d) * mg,  y1 = sa.y + (dy / d) * mg;
          const x2 = sb.x - (dx / d) * mg,  y2 = sb.y - (dy / d) * mg;
          const mx = (sa.x + sb.x) / 2,     my = (sa.y + sb.y) / 2;
          const bidi = dirBA !== null;

          return (
            <g key={`${idA}|${idB}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(100,200,255,0.50)"
                strokeWidth={2}
                strokeDasharray="5 3"
                markerEnd="url(#he-arr-azul)"
                markerStart={bidi ? 'url(#he-arr-oro)' : undefined}
              />
              <text
                x={mx} y={my - 8}
                fill="rgba(150,220,255,0.85)"
                fontSize={Math.max(9, 9 * scene.s)}
                textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'monospace', fontWeight: 700 }}
              >
                {DIR_NOMBRES[dirAB]}{bidi ? `↔${DIR_NOMBRES[dirBA]}` : ''}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Botones ✕ sobre las aristas ────────────────────────────── */}
      {aristas.map(({ idA, idB, dirAB }) => {
        if (!hexes[idA] || !hexes[idB]) return null;
        const sa = t2s(hexes[idA].left, hexes[idA].top);
        const sb = t2s(hexes[idB].left, hexes[idB].top);
        const mx = (sa.x + sb.x) / 2;
        const my = (sa.y + sb.y) / 2 + 10;
        return (
          <button
            key={`xbtn-${idA}|${idB}`}
            onClick={(e) => { e.stopPropagation(); eliminarConexion(idA, dirAB); }}
            title={`Borrar conexión ${idA} ↔ ${idB}`}
            style={{
              position:      'fixed',
              left:          mx,
              top:           my,
              transform:     'translate(-50%,-50%)',
              width:         18, height: 18,
              borderRadius:  '50%',
              background:    'rgba(160,20,20,0.90)',
              border:        '1px solid rgba(255,90,90,0.70)',
              color:         'white',
              fontSize:      10,
              cursor:        'pointer',
              zIndex:        205,
              display:       'flex',
              alignItems:    'center',
              justifyContent: 'center',
              boxShadow:     '0 2px 6px rgba(0,0,0,0.55)',
              fontFamily:    'monospace',
              lineHeight:    1,
            }}
          >
            ✕
          </button>
        );
      })}

      {/* ── Marcadores de hexes ────────────────────────────────────── */}
      {hexEntries.map(([id, { left, top }]) => {
        const { x, y } = t2s(left, top);
        const isSource   = conectDesde === id;
        const isSel      = selected    === id && !isSource;
        const isHovered  = hovered     === id && modo === 'conectar';
        const isElim     = modo        === 'eliminar';

        let bg  = 'rgba(50,200,255,0.80)';
        let bdr = '2px solid rgba(255,255,255,0.80)';
        let shd = '0 0 6px rgba(0,0,0,0.5)';
        if (isSource)  { bg = 'rgba(255,155,20,0.92)'; bdr = '2px solid #ffb020'; shd = '0 0 18px rgba(255,155,20,0.75)'; }
        if (isSel)     { bg = 'rgba(255,220,50,0.90)'; bdr = '2px solid #fff700'; shd = '0 0 14px rgba(255,220,50,0.70)'; }
        if (isHovered) { bg = 'rgba(100,240,180,0.88)'; bdr = '2px solid #60f0b0'; shd = '0 0 14px rgba(100,240,180,0.65)'; }
        if (isElim)    { bg = 'rgba(255,60,60,0.70)';  bdr = '1.5px solid rgba(255,100,100,0.75)'; }

        return (
          <div
            key={id}
            onMouseDown={(e) => handleMarkerDown(e, id)}
            onClick={(e) => handleMarkerClick(e, id)}
            onMouseEnter={() => { if (modo === 'conectar') setHovered(id); }}
            onMouseLeave={() => setHovered(null)}
            title={`${id}  (${Math.round(left)}, ${Math.round(top)})`}
            style={{
              position:      'fixed',
              left:          x, top: y,
              transform:     'translate(-50%,-50%)',
              width:         r * 2, height: r * 2,
              borderRadius:  '50%',
              background:    bg,
              border:        bdr,
              zIndex:        202,
              cursor:        isElim ? 'pointer' : (modo === 'conectar' ? 'pointer' : (dragging === id ? 'grabbing' : 'grab')),
              boxShadow:     shd,
              pointerEvents: 'all',
              transition:    'background 0.1s, box-shadow 0.1s',
            }}
          >
            <span style={{
              position:   'absolute', top: '115%', left: '50%',
              transform:  'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              fontSize:   Math.max(9, 10 * scene.s),
              fontWeight: 700,
              color:      isSource ? '#ffb020' : (isSel ? '#fff700' : (isHovered ? '#60f0b0' : 'rgba(200,240,255,0.95)')),
              background: 'rgba(0,0,0,0.78)',
              padding:    '1px 4px', borderRadius: 3,
              pointerEvents: 'none',
            }}>
              {id}{isSource ? ' ◉' : ''}
            </span>
          </div>
        );
      })}

      {/* ── Punto pendiente (esperando nombre) ─────────────────────── */}
      {pending && (() => {
        const { x, y } = t2s(pending.left, pending.top);
        return (
          <div style={{
            position:     'fixed', left: x, top: y,
            transform:    'translate(-50%,-50%)',
            width:        r*2, height: r*2,
            borderRadius: '50%',
            background:   'rgba(255,100,50,0.85)',
            border:       '2px solid white',
            zIndex:       203, pointerEvents: 'none',
          }} />
        );
      })()}

      {/* ── Input de nombre ────────────────────────────────────────── */}
      {pending && (
        <div style={{
          position:     'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background:   'rgba(4,6,13,0.97)',
          border:       '1px solid rgba(201,168,76,0.45)',
          borderRadius: 10, padding: '13px 17px', zIndex: 215,
          display:      'flex', gap: 9, alignItems: 'center',
          boxShadow:    '0 8px 32px rgba(0,0,0,0.75)',
        }}>
          <span style={{ color: 'rgba(245,230,200,0.60)', fontFamily: 'monospace', fontSize: 13 }}>hexId:</span>
          <input
            autoFocus
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  confirmarNombre();
              if (e.key === 'Escape') { setPending(null); setNombre(''); }
            }}
            placeholder="ej: inicio, mid_centro_alto…"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.38)',
              borderRadius: 5, padding: '6px 10px',
              color: 'var(--crema-pergamino)', fontFamily: 'monospace', fontSize: 13,
              width: 240, outline: 'none',
            }}
          />
          <button onClick={confirmarNombre}         style={btn('#c9a84c', 0.28)}>OK</button>
          <button onClick={() => { setPending(null); setNombre(''); }} style={btn('#ff5050', 0.18)}>✕</button>
        </div>
      )}

      {/* ── Rueda de dirección ─────────────────────────────────────── */}
      {dirPicker && (
        <DirPicker
          {...dirPicker}
          onPick={confirmarDir}
          onCancel={() => setDirPicker(null)}
        />
      )}

      {/* ── Banner modo conectar ───────────────────────────────────── */}
      {modo === 'conectar' && panelVis.banner && (
        <div
          ref={bannerRef}
          onMouseDown={(e) => startPanelDrag(e, 'banner', bannerRef)}
          style={{
            ...(panelPos.banner
              ? { position: 'fixed', left: panelPos.banner.left, top: panelPos.banner.top }
              : { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)' }),
            background:   conectDesde ? 'rgba(200,120,10,0.92)' : 'rgba(5,8,18,0.92)',
            border:       `1px solid ${conectDesde ? 'rgba(255,160,40,0.75)' : 'rgba(100,200,255,0.38)'}`,
            borderRadius: 8, padding: '8px 18px', zIndex: 210,
            fontFamily:   'monospace', fontSize: 12.5,
            color:        conectDesde ? '#fff' : 'rgba(100,200,255,0.85)',
            boxShadow:    '0 4px 18px rgba(0,0,0,0.65)',
            cursor:       draggingPanel?.id === 'banner' ? 'grabbing' : 'grab',
            userSelect:   'none',
          }}
        >
          <span style={{ opacity: 0.35, marginRight: 6, fontSize: 11 }}>⠿</span>
          {conectDesde
            ? `◉ ${conectDesde}  →  haz clic en el hex destino`
            : '🔗 Modo Conectar — haz clic en el hex ORIGEN'}
        </div>
      )}

      {/* ── Panel de info (hex seleccionado) ───────────────────────── */}
      {selected && hexes[selected] && panelVis.info && (
        <div
          ref={infoPanelRef}
          style={{
            ...(panelPos.info
              ? { position: 'fixed', left: panelPos.info.left, top: panelPos.info.top }
              : { position: 'fixed', top: 16, right: 16 }),
            background:   'rgba(4,6,13,0.97)',
            border:       '1px solid rgba(255,220,50,0.28)',
            borderRadius: 8, padding: '11px 14px', zIndex: 210,
            fontFamily:   'monospace', fontSize: 11,
            color:        'rgba(245,230,200,0.75)', minWidth: 210,
            boxShadow:    '0 6px 24px rgba(0,0,0,0.65)',
          }}
        >
          {/* Drag handle */}
          <div
            onMouseDown={(e) => startPanelDrag(e, 'info', infoPanelRef)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
              cursor: draggingPanel?.id === 'info' ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
          >
            <span style={{ color: 'rgba(245,230,200,0.20)', fontSize: 11 }}>⠿</span>
            <span style={{ color: '#fff700', fontWeight: 700, fontSize: 12, flex: 1 }}>{selected}</span>
          </div>
          <div style={{ color: 'rgba(245,230,200,0.35)', marginBottom: 10, fontSize: 10 }}>
            {Math.round(hexes[selected].left)} px, {Math.round(hexes[selected].top)} px
          </div>

          {/* Tabla de conexiones */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginBottom: 10 }}>
            <div style={{ color: 'rgba(100,200,255,0.65)', fontSize: 9.5, letterSpacing: 1, marginBottom: 7, textTransform: 'uppercase' }}>
              Conexiones
            </div>
            {[0,1,2,3,4,5].map(dir => {
              const vecino = adjacency[selected]?.[dir];
              return (
                <div key={dir} style={{
                  display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3,
                  opacity: vecino ? 1 : 0.28,
                }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center', lineHeight: 1 }}>
                    {DIR_FLECHAS[dir]}
                  </span>
                  <span style={{ color: 'rgba(150,210,255,0.70)', width: 28, fontSize: 10 }}>
                    {DIR_NOMBRES[dir]}
                  </span>
                  <span style={{
                    flex: 1, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: vecino ? 'rgba(190,240,190,0.90)' : 'rgba(255,255,255,0.12)',
                  }}>
                    {vecino || '—'}
                  </span>

                  {/* Botones de flecha de color ── solo si hay vecino
                      Varios colores pueden apuntar al MISMO vecino → siempre clickables.
                      Si el color ya apunta a OTRO hex se muestra semitransparente
                      para indicar "reasignará" al hacer click. */}
                  {vecino && [
                    { c: 'amarillo', bg: '#ffd060' },
                    { c: 'azul',     bg: '#60c8ff' },
                    { c: 'rojo',     bg: '#ff7070' },
                  ].map(({ c, bg }) => {
                    const active     = flechas[selected]?.[c] === vecino;
                    const usedOtro   = !active && !!flechas[selected]?.[c];  // apunta a otro hex
                    const titleText  = active
                      ? `Quitar flecha ${c} (↑ ${vecino})`
                      : usedOtro
                        ? `Reasignar flecha ${c}: ${flechas[selected][c]} → ${vecino}`
                        : `Flecha ${c} → ${vecino}`;
                    return (
                      <button
                        key={c}
                        onClick={() => asignarFlecha(selected, c, active ? null : vecino)}
                        title={titleText}
                        style={{
                          width: 11, height: 11, borderRadius: '50%', padding: 0,
                          flexShrink: 0,
                          background: active ? bg : 'transparent',
                          border: `1.5px solid ${bg}`,
                          cursor: 'pointer',
                          opacity: usedOtro ? 0.45 : 1,
                          transition: 'background 0.12s, opacity 0.12s',
                        }}
                      />
                    );
                  })}

                  {vecino && (
                    <button
                      onClick={() => eliminarConexion(selected, dir)}
                      style={{
                        background: 'rgba(180,20,20,0.75)', border: '1px solid rgba(255,80,80,0.50)',
                        borderRadius: 3, color: 'rgba(255,200,200,0.85)',
                        width: 16, height: 16, fontSize: 9,
                        cursor: 'pointer', padding: 0, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Acciones rápidas */}
          <button
            onClick={() => { cambiarModo('conectar'); setConectDesde(selected); setSelected(selected); }}
            style={{ ...btn('#ffa040', 0.22), width: '100%', marginBottom: 5, fontSize: 11 }}
          >
            🔗 Conectar desde aquí
          </button>
          <button
            onClick={() => eliminarHex(selected)}
            style={{ ...btn('#ff5050', 0.18), width: '100%', fontSize: 11 }}
          >
            🗑 Eliminar este hex
          </button>
        </div>
      )}

      {/* ── Toolbar principal ──────────────────────────────────────── */}
      {panelVis.toolbar && (
        <div
          ref={toolbarRef}
          style={{
            ...(panelPos.toolbar
              ? { position: 'fixed', left: panelPos.toolbar.left, top: panelPos.toolbar.top }
              : { position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)' }),
            background:   'rgba(4,6,13,0.97)',
            border:       '1px solid rgba(100,200,255,0.22)',
            borderRadius: 10, padding: '8px 14px', zIndex: 210,
            display:      'flex', gap: 8, alignItems: 'center',
            fontFamily:   'monospace', fontSize: 12,
            boxShadow:    '0 6px 26px rgba(0,0,0,0.70)',
            userSelect:   'none',
          }}
        >
          {/* Logo — drag handle */}
          <span
            onMouseDown={(e) => startPanelDrag(e, 'toolbar', toolbarRef)}
            title="Arrastra para mover · Shift+T para ocultar"
            style={{
              color:   'rgba(100,200,255,0.80)',
              fontWeight: 700, letterSpacing: 1, marginRight: 2,
              cursor:  draggingPanel?.id === 'toolbar' ? 'grabbing' : 'grab',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span style={{ opacity: 0.35, fontSize: 11 }}>⠿</span>
            ⬡ HEX EDITOR
          </span>
          <span style={{ color: 'rgba(245,230,200,0.30)', fontSize: 10 }}>
            {hexEntries.length} hex{hexEntries.length !== 1 ? 'es' : ''}
          </span>

          <Sep />

          {/* Modos */}
          {[
            { key: 'colocar',  label: '✚ Colocar',   color: '#64c8ff', hint: 'Click=colocar · Drag=mover · Seleccionar=info' },
            { key: 'conectar', label: '🔗 Conectar',  color: '#ffa040', hint: 'Click A → Click B → elige dirección en la rueda' },
            { key: 'eliminar', label: '🗑 Eliminar',   color: '#ff6060', hint: 'Click en un hex para eliminarlo' },
          ].map(({ key, label, color, hint }) => (
            <button
              key={key}
              onClick={() => cambiarModo(key)}
              title={hint}
              style={{
                ...btn(color, modo === key ? 0.38 : 0.12),
                fontWeight: modo === key ? 700 : 400,
                outline:    modo === key ? `1.5px solid ${color}` : 'none',
                outlineOffset: '1px',
              }}
            >
              {label}
            </button>
          ))}

          <Sep />

          <button onClick={() => setAdjacency(autoConectar(hexes))} style={btn('#b0a0ff', 0.14)} title="Auto-detecta vecinos por ángulo y distancia. Úsalo como punto de partida y ajusta manualmente.">
            ⚡ Auto-conectar
          </button>
          <button onClick={exportar} style={btn(copied ? '#50dc80' : '#40c870', 0.16)}>
            {copied ? '✓ Copiado!' : '📋 Exportar'}
          </button>
          <button onClick={onClose} style={btn('#ff5050', 0.12)}>
            Cerrar (Esc)
          </button>
        </div>
      )}

      {/* ── Indicadores de paneles ocultos ─────────────────────────── */}
      {(!panelVis.toolbar || !panelVis.info || !panelVis.banner) && (
        <div style={{
          position:     'fixed', bottom: 16, right: 16, zIndex: 215,
          display:      'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end',
        }}>
          {!panelVis.toolbar && (
            <button
              onClick={() => setPanelVis(v => ({ ...v, toolbar: true }))}
              title="Mostrar toolbar (Shift+T)"
              style={{ ...btn('#64c8ff', 0.28), fontSize: 11, padding: '4px 10px' }}
            >
              ⬡ Toolbar  <span style={{ opacity: 0.5, fontSize: 9 }}>Shift+T</span>
            </button>
          )}
          {!panelVis.info && selected && (
            <button
              onClick={() => setPanelVis(v => ({ ...v, info: true }))}
              title="Mostrar panel info (Shift+I)"
              style={{ ...btn('#fff700', 0.22), fontSize: 11, padding: '4px 10px' }}
            >
              ◈ Info  <span style={{ opacity: 0.5, fontSize: 9 }}>Shift+I</span>
            </button>
          )}
          {!panelVis.banner && modo === 'conectar' && (
            <button
              onClick={() => setPanelVis(v => ({ ...v, banner: true }))}
              title="Mostrar banner conectar (Shift+B)"
              style={{ ...btn('#ffa040', 0.22), fontSize: 11, padding: '4px 10px' }}
            >
              🔗 Banner  <span style={{ opacity: 0.5, fontSize: 9 }}>Shift+B</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────── */
const Sep = () => (
  <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.09)', margin: '0 3px' }} />
);

function btn(color, alpha) {
  const rgb = `${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)}`;
  return {
    background:   `rgba(${rgb},${alpha})`,
    border:       `1px solid rgba(${rgb},${Math.min(1, alpha * 2.3)})`,
    borderRadius: 5,
    color,
    padding:      '5px 10px',
    cursor:       'pointer',
    fontFamily:   'monospace',
    fontSize:     12,
    transition:   'background 0.12s',
  };
}
