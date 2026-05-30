import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ── Elementos editables del POS ──────────────────────────────────────
const ELEMENTS = [
  { key: 'tablero',              label: 'Tablero (vídeo)',       path: ['tablero'],                   props: ['left','top','width','height'] },
  { key: 'marcoTablero',         label: 'Marco del Tablero',     path: ['marcoTablero'],              props: ['left','top','size'] },
  { key: 'panelIzq.rowH',        label: 'Panel Izq — Altura fila', path: ['panelIzq'],              props: ['rowH'] },
  { key: 'panelIzq.header',      label: 'Panel Izq — Capitán',   path: ['panelIzq','header'],        props: ['left','top','width','height','scale','fondoImg','fondoSlice','fondoSliceWidth','marcoImg','labelSize','labelSpacing','labelGap','nameSize','nameSpacing','alignH'] },
  { key: 'panelIzq.lista',       label: 'Panel Izq — Lista',     path: ['panelIzq','lista'],
    props: ['left','top','width','height','scale',
            'fondoImg','fondoSlice','fondoSliceWidth','fondoTile','listaPadH','listaPadV','marcoImg',
            'cellImg','cellSlice','cellSliceWidth','cellTile','cellWidthPx','cellWidthPct','cellAlignX','cellOffsetX',
            'rowH','rowGap','rowPadH','cellPadV','rowContentGap','insGap','dotSize',
            'nameSize','nameSpacing','sepSize','sepSpacing'] },
  { key: 'panelDer',             label: 'Panel Derecho',          path: ['panelDer'],                props: ['left','top','width','height','scale','fondoImg','marcoImg'] },
  { key: 'ultimaCarta',          label: 'Última Carta',           path: ['ultimaCarta'],             props: ['left','top','width','scale','visible'] },
  { key: 'mazoNav',              label: 'Mazo Navegación',        path: ['mazoNav'],                 props: ['left','top','width','scale','visible'] },
  { key: 'mazoCultista',         label: 'Mazo Cultista',          path: ['mazoCultista'],            props: ['left','top','width','scale','visible'] },
  { key: 'insignias',            label: 'Insignias',              path: ['insignias'],               props: ['size'] },
  { key: 'ctrl.retroceder',      label: 'Botón Retroceder',       path: ['controles','botonRetroceder'], props: ['left','top','size'] },
  { key: 'ctrl.avanzar',         label: 'Botón Avanzar',          path: ['controles','botonAvanzar'],    props: ['left','top','size'] },
  { key: 'ctrl.reiniciar',       label: 'Botón Reiniciar',        path: ['controles','botonReiniciar'],  props: ['left','top','size'] },
  { key: 'ctrl.salir',           label: 'Botón Salir',            path: ['controles','botonSalir'],      props: ['left','top','size'] },
  // Props compartidos para modelos 3D
  ...(() => {
    const MOD = ['left','top','size','escala','rotX','rotY','rotZ','visible','colorBase','tintColor','filterCss','opacidad'];
    const m3d = (key, label, props) => ({ key: `mod3d.${key}`, label, path: ['modelos3d', key], props });
    return [
      m3d('barco',      '3D — Barco',               ['left','top','size','escala','rotX','rotY','rotZ','visible','tintColor','filterCss','opacidad']),
      m3d('kraken',     '3D — Kraken (hex vc)',     MOD),
      m3d('tentaculo1', '3D — Tentáculo (hex 8-1)', MOD),
      m3d('tentaculo2', '3D — Tentáculo (hex 8-2)', MOD),
      m3d('lupa1',      '3D — Lupa (hex 4-1)',      MOD),
      m3d('lupa2',      '3D — Lupa (hex 4-2)',      MOD),
      m3d('lupa3',      '3D — Lupa (hex 5-1)',      MOD),
    ];
  })(),
  { key: 'cer.capitan',          label: 'Ceremonia — Capitán',    path: ['ceremonia','capitan'],         props: ['left','top','wImg'] },
  { key: 'cer.teniente',         label: 'Ceremonia — Teniente',   path: ['ceremonia','teniente'],        props: ['left','top','wImg'] },
  { key: 'cer.navegante',        label: 'Ceremonia — Navegante',  path: ['ceremonia','navegante'],       props: ['left','top','wImg'] },
  { key: 'cer.motin',            label: 'Ceremonia — Motín',      path: ['ceremonia','motin'],           props: ['left','top','width','sombra'] },
];

// ── Metadatos de cada propiedad ──────────────────────────────────────
const PROP_META = {
  left:          { label: 'Left',              type: 'number', unit: 'px',  step: 1,    cat: 'pos'  },
  top:           { label: 'Top',               type: 'number', unit: 'px',  step: 1,    cat: 'pos'  },
  width:         { label: 'Width',             type: 'number', unit: 'px',  step: 1,    cat: 'pos'  },
  height:        { label: 'Height',            type: 'number', unit: 'px',  step: 1,    cat: 'pos',  nullable: true },
  size:          { label: 'Size (tamaño)',     type: 'number', unit: 'px',  step: 5,    cat: 'pos', slider: true, min: 20,  max: 800 },
  wImg:          { label: 'Width imagen',      type: 'number', unit: 'px',  step: 1,    cat: 'pos'  },
  scale:         { label: 'Scale',             type: 'number', unit: '×',   step: 0.01, cat: 'pos'  },
  escala:        { label: 'Escala 3D (fino)',  type: 'number', unit: '×',   step: 0.01, cat: 'pos', slider: true, min: 0.5, max: 2 },
  visible:       { label: 'Visible',           type: 'bool',   unit: '',               cat: 'pos'  },
  espejo:        { label: 'Espejo (scaleX-1)', type: 'bool',   unit: '',               cat: 'pos'  },
  loopMode:      { label: 'Loop animación',    type: 'enum',   unit: '', options: ['repeat','pingpong','once'], cat: 'pos' },
  rotX:          { label: 'Rotación X',        type: 'number', unit: 'rad', step: 0.05, cat: 'pos'  },
  rotY:          { label: 'Rotación Y',        type: 'number', unit: 'rad', step: 0.05, cat: 'pos'  },
  rotZ:          { label: 'Rotación Z',        type: 'number', unit: 'rad', step: 0.05, cat: 'pos'  },
  opacidad:      { label: 'Opacidad',          type: 'number', unit: '',   step: 0.05, cat: 'pos'  },
  colorBase:     { label: 'Color material',    type: 'color',  unit: '',               cat: 'pos'  },
  tintColor:     { label: 'Color tinte (CSS)', type: 'color',  unit: '',               cat: 'pos'  },
  filterCss:     { label: 'Filtro CSS extra',  type: 'text',   unit: '',               cat: 'pos'  },
  fondoImg:      { label: 'Imagen fondo',      type: 'img',    unit: '',               cat: 'img'  },
  marcoImg:      { label: 'Imagen marco',      type: 'img',    unit: '',               cat: 'img',  nullable: true },
  cellImg:       { label: 'Imagen celda',      type: 'img',    unit: '',               cat: 'img',  nullable: true },
  fondoSlice:      { label: 'Corte imagen fondo',  type: 'slice',  unit: '',               cat: 'img'  },
  fondoSliceWidth: { label: 'Grosor visible fondo', type: 'sliceW', unit: 'px',            cat: 'img'  },
  fondoTile:       { label: 'Modo borde marco',     type: 'enum',   unit: '', options: ['round','stretch','repeat','space'], cat: 'img' },
  cellSlice:       { label: 'Corte imagen celda',   type: 'slice',  unit: '',               cat: 'img'  },
  cellSliceWidth:  { label: 'Grosor visible celda', type: 'sliceW', unit: 'px',            cat: 'img'  },
  cellTile:        { label: 'Modo borde celda',     type: 'enum',   unit: '', options: ['stretch','round','repeat','space'], cat: 'img' },
  listaPadH:     { label: 'Marco→celdas pad. H', type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  listaPadV:     { label: 'Marco→celdas pad. V', type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  cellWidthPx:   { label: 'Ancho celda px',     type: 'sliceW', unit: 'px',  step: 1,   cat: 'txt'  },
  cellWidthPct:  { label: 'Ancho celda %',      type: 'number', unit: '%',   step: 1,   cat: 'txt'  },
  cellAlignX:    { label: 'Alineación celda',   type: 'enum',   unit: '', options: ['left','center','right'], cat: 'txt' },
  cellOffsetX:   { label: 'Desplaz. X celda',   type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  rowH:          { label: 'Altura fila',        type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  rowGap:        { label: 'Gap entre filas',    type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  rowPadH:       { label: 'Celda pad. H',       type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  cellPadV:      { label: 'Celda pad. V',       type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  rowContentGap: { label: 'Gap dot↔nombre↔ins', type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  insGap:        { label: 'Gap insignias',      type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  dotSize:       { label: 'Dot conexión',       type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  labelSize:     { label: 'Label — tamaño',    type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  labelSpacing:  { label: 'Label — tracking',  type: 'number', unit: 'px',  step: 0.5, cat: 'txt'  },
  labelGap:      { label: 'Label — gap inf.',  type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  nameSize:      { label: 'Nombre — tamaño',   type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  nameSpacing:   { label: 'Nombre — tracking', type: 'number', unit: 'px',  step: 0.1, cat: 'txt'  },
  sepSize:       { label: 'Separador — tamaño',type: 'number', unit: 'px',  step: 1,   cat: 'txt'  },
  sepSpacing:    { label: 'Sep. — tracking',   type: 'number', unit: 'px',  step: 0.5, cat: 'txt'  },
  alignH:        { label: 'Alineación H',      type: 'enum',   unit: '',    options: ['left','center','right'], cat: 'txt' },
  sombra:        { label: 'Sombra CSS',        type: 'text',   unit: '',               cat: 'txt'  },
};

// ── Helpers ──────────────────────────────────────────────────────────
function getNestedVal(obj, path) {
  return path.reduce((o, k) => o?.[k], obj);
}

function normalizeSlice(v) {
  if (typeof v === 'object' && v !== null) return v;
  const n = v || 0;
  return { top: n, right: n, bottom: n, left: n };
}

// ── Canvas Nine-Slice ────────────────────────────────────────────────
function NineSliceCanvas({ src, slice, onSliceChange }) {
  const canvasRef  = useRef(null);
  const imgRef     = useRef(null);
  const dragRef    = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovering,  setHovering]  = useState(null);
  const CW = 320, CH = 200;

  useEffect(() => {
    setImgLoaded(false);
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => { imgRef.current = img; setImgLoaded(true); };
    img.onerror = () => { imgRef.current = null; setImgLoaded(false); };
    img.src = src;
  }, [src]);

  const toDisp = (val, isH) => {
    const img = imgRef.current;
    if (!img) return 0;
    return val * (isH ? CW / img.naturalWidth : CH / img.naturalHeight);
  };
  const toImg = (val, isH) => {
    const img = imgRef.current;
    if (!img) return 0;
    return Math.round(val * (isH ? img.naturalWidth / CW : img.naturalHeight / CH));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CW, CH);

    if (!imgRef.current || !imgLoaded) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = 'rgba(245,230,200,0.25)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Introduce una URL de imagen', CW / 2, CH / 2);
      return;
    }

    ctx.drawImage(imgRef.current, 0, 0, CW, CH);

    const t = toDisp(slice.top,    false);
    const r = CW - toDisp(slice.right,  true);
    const b = CH - toDisp(slice.bottom, false);
    const l = toDisp(slice.left,   true);

    // Zonas coloreadas
    ctx.fillStyle = 'rgba(59,130,246,0.28)';  // esquinas azul
    [[0,0,l,t],[r,0,CW-r,t],[0,b,l,CH-b],[r,b,CW-r,CH-b]].forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));
    ctx.fillStyle = 'rgba(34,197,94,0.20)';   // bordes verde
    [[l,0,r-l,t],[l,b,r-l,CH-b],[0,t,l,b-t],[r,t,CW-r,b-t]].forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));
    ctx.fillStyle = 'rgba(234,179,8,0.14)';   // centro amarillo
    ctx.fillRect(l, t, r-l, b-t);

    // Líneas de corte
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 3]);
    [[0,t,CW,t],[0,b,CW,b]].forEach(([x1,y1,x2,y2]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
    [[l,0,l,CH],[r,0,r,CH]].forEach(([x1,y1,x2,y2]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
    ctx.restore();

    // Handles (círculos)
    ctx.setLineDash([]);
    [{ x: CW/2, y: t }, { x: CW/2, y: b }, { x: l, y: CH/2 }, { x: r, y: CH/2 }].forEach(({ x, y }) => {
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle   = '#3b82f6'; ctx.fill();
      ctx.strokeStyle = '#fff';    ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Leyenda de zonas
    ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(59,130,246,0.7)';  ctx.fillText('esquina', 2, CH - 4);
    ctx.fillStyle = 'rgba(34,197,94,0.7)';   ctx.fillText('borde',   55, CH - 4);
    ctx.fillStyle = 'rgba(234,179,8,0.7)';   ctx.fillText('centro',  100, CH - 4);
  }, [imgLoaded, slice]);

  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const hitTest = ({ x, y }) => {
    const t = toDisp(slice.top,    false), b = CH - toDisp(slice.bottom, false);
    const l = toDisp(slice.left,   true),  r = CW - toDisp(slice.right,  true);
    const D = 12;
    if (Math.abs(y - t) < D) return 'top';
    if (Math.abs(y - b) < D) return 'bottom';
    if (Math.abs(x - l) < D) return 'left';
    if (Math.abs(x - r) < D) return 'right';
    return null;
  };

  const onMouseDown = (e) => {
    if (!imgRef.current) return;
    const hit = hitTest(getCanvasPos(e));
    if (hit) { dragRef.current = hit; e.preventDefault(); }
  };
  const onMouseMove = (e) => {
    const cpos = getCanvasPos(e);
    if (!dragRef.current) { setHovering(hitTest(cpos)); return; }
    const { x, y } = cpos;
    const s = { ...slice };
    const img = imgRef.current;
    if (dragRef.current === 'top')    s.top    = Math.max(0, Math.min(toImg(y, false), img.naturalHeight - slice.bottom - 1));
    if (dragRef.current === 'bottom') s.bottom = Math.max(0, Math.min(toImg(CH - y, false), img.naturalHeight - slice.top - 1));
    if (dragRef.current === 'left')   s.left   = Math.max(0, Math.min(toImg(x, true),  img.naturalWidth  - slice.right - 1));
    if (dragRef.current === 'right')  s.right  = Math.max(0, Math.min(toImg(CW - x, true), img.naturalWidth - slice.left - 1));
    onSliceChange(s);
  };
  const onMouseUp = () => { dragRef.current = null; };

  const cur = dragRef.current || hovering;
  const cursor = (cur === 'top' || cur === 'bottom') ? 'ns-resize'
    : (cur === 'left' || cur === 'right') ? 'ew-resize' : 'default';

  return (
    <canvas ref={canvasRef} width={CW} height={CH}
      style={{ cursor, display: 'block', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
    />
  );
}

// ── Preview Nine-Slice con CSS border-image ──────────────────────────
function NineSlicePreview({ src, slice, previewW, previewH }) {
  const { top, right, bottom, left } = slice;
  if (!src || (!top && !right && !bottom && !left)) return (
    <div style={{ width: previewW, height: previewH, background: 'rgba(255,255,255,0.04)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(245,230,200,0.2)', fontSize: 11 }}>sin nine-slice</span>
    </div>
  );
  return (
    <div style={{
      width: previewW, height: previewH, boxSizing: 'border-box',
      borderStyle: 'solid',
      borderWidth: `${top}px ${right}px ${bottom}px ${left}px`,
      borderImage: `url('${src}') ${top} ${right} ${bottom} ${left} fill / ${top}px ${right}px ${bottom}px ${left}px stretch`,
      background: 'none',
    }} />
  );
}

// ── Estilos base del panel ────────────────────────────────────────────
const S = {
  panel:   { position: 'fixed', width: 430, background: 'rgba(5,7,16,0.97)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.75)', zIndex: 9998, fontFamily: 'monospace', fontSize: 12, color: 'rgba(245,230,200,0.85)', overflow: 'hidden' },
  header:  { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', background: 'rgba(59,130,246,0.15)', cursor: 'move', borderBottom: '1px solid rgba(59,130,246,0.2)', userSelect: 'none', flexShrink: 0 },
  tabs:    { display: 'flex', gap: 3, padding: '6px 10px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  body:    { padding: '10px 12px', maxHeight: 560, overflowY: 'auto' },
  section: { marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' },
  title:   { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(245,230,200,0.32)', marginBottom: 6 },
  row:     { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 },
  label:   { width: 138, color: 'rgba(245,230,200,0.48)', fontSize: 11, flexShrink: 0 },
  inp:     (mod) => ({
    flex: 1, background: mod ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${mod ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.10)'}`,
    borderRadius: 4, padding: '3px 6px', color: mod ? '#93c5fd' : 'rgba(245,230,200,0.88)',
    fontSize: 12, fontFamily: 'monospace',
  }),
  btn: (col = 'dim') => {
    const cols = {
      blue:  { bg: 'rgba(59,130,246,0.2)',  bd: 'rgba(59,130,246,0.45)',  txt: '#93c5fd' },
      red:   { bg: 'rgba(239,68,68,0.15)',  bd: 'rgba(239,68,68,0.4)',    txt: '#fca5a5' },
      green: { bg: 'rgba(34,197,94,0.15)',  bd: 'rgba(34,197,94,0.4)',    txt: '#86efac' },
      dim:   { bg: 'rgba(255,255,255,0.05)',bd: 'rgba(255,255,255,0.12)', txt: 'rgba(245,230,200,0.55)' },
    };
    const c = cols[col] || cols.dim;
    return { padding: '3px 9px', borderRadius: 4, cursor: 'pointer', fontSize: 11, background: c.bg, border: `1px solid ${c.bd}`, color: c.txt };
  },
  tabBtn: (active) => ({
    padding: '4px 11px', borderRadius: 4, cursor: 'pointer', fontSize: 11, userSelect: 'none',
    background: active ? 'rgba(59,130,246,0.28)' : 'transparent',
    border:     active ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
    color:      active ? '#93c5fd' : 'rgba(245,230,200,0.45)',
  }),
};

// ── Componente principal ─────────────────────────────────────────────
export default function DevAssetEditor({ pos, posDefaults, onUpdatePath, onReset, onResetAll }) {
  const [tab,         setTab]        = useState('props');
  const [selKey,      setSelKey]     = useState(ELEMENTS[0].key);
  const [panelPos,    setPanelPos]   = useState({ left: 10, top: 10 });
  const [open,        setOpen]       = useState(true);
  const [nsImgSrc,    setNsImgSrc]   = useState('');
  const [nsSlice,     setNsSlice]    = useState({ top: 8, right: 8, bottom: 8, left: 8 });
  const [nsPrevW,     setNsPrevW]    = useState(300);
  const [nsPrevH,     setNsPrevH]    = useState(80);
  const [nsApplyEl,   setNsApplyEl]  = useState('panelIzq.lista');
  const [nsApplyProp, setNsApplyProp]= useState('fondoSlice');
  const [copyDone,    setCopyDone]   = useState(false);
  const [pickMode,    setPickMode]   = useState(false);
  const dragRef = useRef({ active: false, ox: 0, oy: 0 });

  // ── Modo pick: clic en el tablero → selecciona elemento ──────────
  useEffect(() => {
    if (!pickMode) return;
    const onPick = (e) => {
      const el = e.target.closest('[data-pos-key]');
      if (!el) return;
      const key = el.dataset.posKey;
      const found = ELEMENTS.find(el => el.key === key);
      if (found) {
        setSelKey(key);
        setTab('props');
      }
      setPickMode(false);
      e.stopPropagation();
    };
    const onKey = (e) => { if (e.key === 'Escape') setPickMode(false); };
    document.addEventListener('click', onPick, true);
    document.addEventListener('keydown', onKey);
    document.body.style.cursor = 'crosshair';
    return () => {
      document.removeEventListener('click', onPick, true);
      document.removeEventListener('keydown', onKey);
      document.body.style.cursor = '';
    };
  }, [pickMode]);

  const selEl  = ELEMENTS.find(e => e.key === selKey);
  const getVal = (propKey) => getNestedVal(pos, [...(selEl?.path || []), propKey]);
  const getDef = (propKey) => getNestedVal(posDefaults, [...(selEl?.path || []), propKey]);
  const isMod  = (propKey) => JSON.stringify(getVal(propKey)) !== JSON.stringify(getDef(propKey));
  const update = (propKey, val) => selEl && onUpdatePath([...selEl.path, propKey], val);

  // Panel drag
  const onHeaderDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const r = e.currentTarget.parentElement.getBoundingClientRect();
    dragRef.current = { active: true, ox: e.clientX - r.left, oy: e.clientY - r.top };
    const mv = (ev) => {
      if (!dragRef.current.active) return;
      setPanelPos({ left: Math.max(0, Math.min(window.innerWidth - 430, ev.clientX - dragRef.current.ox)), top: Math.max(0, ev.clientY - dragRef.current.oy) });
    };
    const up = () => { dragRef.current.active = false; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
  };

  // JSON export helpers
  const computeDiff = (cur, def) => {
    if (typeof cur !== 'object' || cur === null) return cur !== def ? cur : undefined;
    const out = {};
    for (const k of Object.keys(cur)) {
      if (typeof cur[k] === 'object' && cur[k] !== null && !Array.isArray(cur[k]) && typeof def?.[k] === 'object') {
        const sub = computeDiff(cur[k], def?.[k]);
        if (sub !== undefined && Object.keys(sub).length > 0) out[k] = sub;
      } else if (JSON.stringify(cur[k]) !== JSON.stringify(def?.[k])) {
        out[k] = cur[k];
      }
    }
    return out;
  };
  const deltaJSON = useMemo(() => JSON.stringify(computeDiff(pos, posDefaults), null, 2), [pos, posDefaults]);
  const fullJSON  = useMemo(() => `const POS = ${JSON.stringify(pos, null, 2)};`, [pos]);

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => { setCopyDone(true); setTimeout(() => setCopyDone(false), 1800); });
  };

  // ── Control individual ─────────────────────────────────────────────
  const renderControl = (propKey) => {
    const meta = PROP_META[propKey];
    if (!meta) return null;
    const val = getVal(propKey);
    const mod = isMod(propKey);
    const is  = S.inp(mod);
    const rst = mod ? <button style={{ ...S.btn('red'), padding: '2px 5px', fontSize: 10 }} onClick={() => update(propKey, getDef(propKey))}>↩</button> : null;

    if (meta.type === 'number') return (
      <div key={propKey} style={{ ...S.row, flexWrap: meta.slider ? 'wrap' : 'nowrap' }}>
        <span style={S.label}>{meta.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
          <button style={{ ...S.btn(), padding: '2px 5px' }} onClick={() => update(propKey, +(val || 0) - meta.step)}>−</button>
          <input type="number" value={val ?? ''} step={meta.step}
            style={{ ...is, width: 72, textAlign: 'right', flex: 'none' }}
            onChange={e => update(propKey, +e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowUp')   { e.preventDefault(); update(propKey, +(val || 0) + meta.step); }
              if (e.key === 'ArrowDown') { e.preventDefault(); update(propKey, +(val || 0) - meta.step); }
            }}
          />
          <button style={{ ...S.btn(), padding: '2px 5px' }} onClick={() => update(propKey, +(val || 0) + meta.step)}>+</button>
          <span style={{ color: 'rgba(245,230,200,0.28)', fontSize: 10 }}>{meta.unit}</span>
        </div>
        {rst}
        {meta.slider && (
          <input type="range" min={meta.min} max={meta.max} step={meta.step}
            value={Math.min(meta.max, Math.max(meta.min, val ?? meta.min))}
            onChange={e => update(propKey, +e.target.value)}
            style={{ width: '100%', marginTop: 3, accentColor: '#3b82f6', cursor: 'pointer' }}
          />
        )}
      </div>
    );

    if (meta.type === 'color') return (
      <div key={propKey} style={S.row}>
        <span style={S.label}>{meta.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <input type="color" value={val || '#ffffff'}
            style={{ width: 36, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none' }}
            onChange={e => update(propKey, e.target.value === '#ffffff' ? '' : e.target.value)}
          />
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: mod ? '#93c5fd' : 'rgba(245,230,200,0.45)' }}>
            {val || '(sin tinte)'}
          </span>
          {val && <button style={{ ...S.btn('red'), fontSize: 10, padding: '2px 5px' }} onClick={() => update(propKey, '')}>✕</button>}
        </div>
        {rst}
      </div>
    );

    if (meta.type === 'bool') return (
      <div key={propKey} style={S.row}>
        <span style={S.label}>{meta.label}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', flex: 1 }}>
          <input type="checkbox" checked={!!val} onChange={e => update(propKey, e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#3b82f6' }} />
          <span style={{ color: mod ? '#93c5fd' : 'rgba(245,230,200,0.55)', fontSize: 11 }}>{val ? 'sí' : 'no'}</span>
        </label>
        {rst}
      </div>
    );

    if (meta.type === 'img') return (
      <div key={propKey} style={{ ...S.row, flexWrap: 'wrap', gap: 4 }}>
        <span style={S.label}>{meta.label}</span>
        <input type="text" value={val || ''} style={{ ...is, flex: 1, minWidth: 160 }}
          placeholder={meta.nullable ? '(vacío = ninguno)' : 'ruta del asset…'}
          onChange={e => update(propKey, e.target.value || (meta.nullable ? null : ''))}
        />
        {val && <img src={val} alt="" style={{ width: 30, height: 30, objectFit: 'contain', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }} onError={e => { e.target.style.display = 'none'; }} />}
        {rst}
      </div>
    );

    // ── Grosor visible (número simple, nullable) ────────────────────
    if (meta.type === 'sliceW') return (
      <div key={propKey} style={S.row}>
        <span style={S.label}>{meta.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
          <button style={{ ...S.btn(), padding: '2px 5px' }} onClick={() => update(propKey, Math.max(0, (val || 0) - 1))}>−</button>
          <input type="number" value={val ?? ''} step={1} placeholder="auto"
            style={{ ...is, width: 65, textAlign: 'right', flex: 'none' }}
            onChange={e => update(propKey, e.target.value === '' ? null : +e.target.value)}
          />
          <button style={{ ...S.btn(), padding: '2px 5px' }} onClick={() => update(propKey, (val || 0) + 1)}>+</button>
          <span style={{ color: 'rgba(245,230,200,0.28)', fontSize: 10 }}>px</span>
        </div>
        {rst}
      </div>
    );

    if (meta.type === 'slice') {
      const sv = normalizeSlice(val);
      const allSame = sv.top === sv.right && sv.right === sv.bottom && sv.bottom === sv.left;
      const uniVal  = allSame ? sv.top : '';
      const upSide  = (side, v) => update(propKey, { ...sv, [side]: Math.max(0, v) });
      return (
        <div key={propKey} style={{ ...S.section, marginBottom: 6 }}>
          <div style={S.row}>
            <span style={S.label}>{meta.label}</span>
            <input type="number" value={uniVal} placeholder="—" step={1}
              style={{ ...is, width: 60, textAlign: 'right', flex: 'none' }}
              title="Valor igual para todos los lados"
              onChange={e => { const n = +e.target.value; update(propKey, { top: n, right: n, bottom: n, left: n }); }}
            />
            <span style={{ color: 'rgba(245,230,200,0.28)', fontSize: 10 }}>px uniforme</span>
            <button style={{ ...S.btn('blue'), fontSize: 10, padding: '2px 6px' }}
              onClick={() => { setNsImgSrc(getVal('fondoImg') || getVal('cellImg') || ''); setNsSlice(sv); setTab('nineslice'); }}>
              ✂️
            </button>
            {rst}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', marginLeft: 8, marginTop: 2 }}>
            {['top','right','bottom','left'].map(side => (
              <div key={side} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 38, color: 'rgba(245,230,200,0.38)', fontSize: 10 }}>{side}</span>
                <button style={{ ...S.btn(), padding: '1px 4px' }} onClick={() => upSide(side, sv[side] - 1)}>−</button>
                <input type="number" value={sv[side]} step={1}
                  style={{ ...is, width: 44, textAlign: 'right', flex: 'none', padding: '2px 4px' }}
                  onChange={e => upSide(side, +e.target.value)}
                />
                <button style={{ ...S.btn(), padding: '1px 4px' }} onClick={() => upSide(side, sv[side] + 1)}>+</button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (meta.type === 'enum') return (
      <div key={propKey} style={S.row}>
        <span style={S.label}>{meta.label}</span>
        <select value={val || ''} style={{ ...is, flex: 1, cursor: 'pointer' }}
          onChange={e => update(propKey, e.target.value)}>
          {meta.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {rst}
      </div>
    );

    if (meta.type === 'text') return (
      <div key={propKey} style={S.row}>
        <span style={S.label}>{meta.label}</span>
        <input type="text" value={val || ''} style={{ ...is, flex: 1 }}
          onChange={e => update(propKey, e.target.value)}
        />
        {rst}
      </div>
    );

    return null;
  };

  // ── Mini panel (colapsado) ─────────────────────────────────────────
  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ position: 'fixed', left: panelPos.left, top: panelPos.top, zIndex: 9998, padding: '5px 12px', background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.5)', borderRadius: 8, color: '#93c5fd', fontSize: 12, cursor: 'pointer' }}>
      🔧 Asset Editor
    </button>
  );

  const propsByCat = (cat) => selEl?.props.filter(p => PROP_META[p]?.cat === cat) || [];

  return (
    <div style={{ ...S.panel, left: panelPos.left, top: panelPos.top }}>

      {/* Header */}
      <div style={S.header} onMouseDown={onHeaderDown}>
        <span>🔧</span>
        <span style={{ flex: 1, color: '#93c5fd', fontSize: 12, fontWeight: 600 }}>
          Dev Asset Editor
          {pickMode && <span style={{ marginLeft: 8, color: '#86efac', fontSize: 11 }}>— haz clic en el tablero</span>}
        </span>
        <button
          style={{ ...S.btn(pickMode ? 'green' : 'dim'), padding: '2px 8px', fontSize: 13 }}
          title="Clic en cualquier elemento del tablero para seleccionarlo"
          onClick={() => setPickMode(p => !p)}
        >🎯</button>
        <button style={{ ...S.btn('dim'), padding: '2px 7px' }} onClick={() => setOpen(false)}>_</button>
        <button style={{ ...S.btn('red'), fontSize: 10 }} onClick={onResetAll}>↺ Reset todo</button>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[['props','🎛️ Propiedades'],['nineslice','✂️ Nine-Slice'],['export','📋 Export']].map(([t,l]) => (
          <button key={t} style={S.tabBtn(tab === t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── TAB: PROPIEDADES ── */}
      {tab === 'props' && (
        <div style={S.body}>
          <div style={{ ...S.section }}>
            <div style={S.title}>Elemento</div>
            <select value={selKey} style={{ ...S.inp(false), width: '100%', cursor: 'pointer' }}
              onChange={e => setSelKey(e.target.value)}>
              {ELEMENTS.map(el => <option key={el.key} value={el.key}>{el.label}</option>)}
            </select>
          </div>

          {/* Posición & Tamaño */}
          {propsByCat('pos').length > 0 && (
            <div style={S.section}>
              <div style={S.title}>📐 Posición & Tamaño</div>
              {propsByCat('pos').map(renderControl)}
            </div>
          )}

          {/* Imagen & Nine-Slice */}
          {propsByCat('img').length > 0 && (
            <div style={S.section}>
              <div style={S.title}>🖼️ Imagen & Nine-Slice</div>
              {propsByCat('img').map(renderControl)}
            </div>
          )}

          {/* Tipografía */}
          {propsByCat('txt').length > 0 && (
            <div style={S.section}>
              <div style={S.title}>🔤 Tipografía & Espaciado</div>
              {propsByCat('txt').map(renderControl)}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button style={{ ...S.btn('red'), flex: 1 }} onClick={() => selEl && onReset(selEl.path)}>↩ Reset "{selEl?.label}"</button>
          </div>
        </div>
      )}

      {/* ── TAB: NINE-SLICE ── */}
      {tab === 'nineslice' && (
        <div style={S.body}>
          <div style={S.section}>
            <div style={S.title}>Asset</div>
            <input type="text" value={nsImgSrc} placeholder="/tablero/ui/marco-lista.png"
              style={{ ...S.inp(false), width: '100%', marginBottom: 6 }}
              onChange={e => setNsImgSrc(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                '/tablero/ui/marco-lista.png',
                '/tablero/ui/marco_cartel_capitan.png',
                '/tablero/ui/tablon-lista.png',
                '/tablero/ui/panel-der-fondo.png',
              ].map(src => (
                <button key={src} style={{ ...S.btn(), fontSize: 10, padding: '2px 7px' }} onClick={() => setNsImgSrc(src)}>
                  {src.split('/').pop()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...S.section, display: 'flex', justifyContent: 'center' }}>
            <NineSliceCanvas src={nsImgSrc} slice={nsSlice} onSliceChange={setNsSlice} />
          </div>

          {/* Controles numéricos de corte */}
          <div style={S.section}>
            <div style={S.title}>Valores de corte (px de la imagen original)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              {['top','right','bottom','left'].map(side => (
                <div key={side} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 38, color: 'rgba(245,230,200,0.45)', fontSize: 11 }}>{side}</span>
                  <button style={{ ...S.btn(), padding: '2px 5px' }} onClick={() => setNsSlice(p => ({ ...p, [side]: Math.max(0, p[side] - 1) }))}>−</button>
                  <input type="number" value={nsSlice[side]} step={1}
                    style={{ ...S.inp(false), width: 52, textAlign: 'right', flex: 'none' }}
                    onChange={e => setNsSlice(p => ({ ...p, [side]: Math.max(0, +e.target.value) }))}
                  />
                  <button style={{ ...S.btn(), padding: '2px 5px' }} onClick={() => setNsSlice(p => ({ ...p, [side]: p[side] + 1 }))}>+</button>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={S.section}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={S.title}>Preview</div>
              <input type="number" value={nsPrevW} step={10} style={{ ...S.inp(false), width: 58, textAlign: 'right', flex: 'none' }}
                onChange={e => setNsPrevW(+e.target.value)} title="Ancho del preview" />
              <span style={{ color: 'rgba(245,230,200,0.3)', fontSize: 10 }}>×</span>
              <input type="number" value={nsPrevH} step={10} style={{ ...S.inp(false), width: 58, textAlign: 'right', flex: 'none' }}
                onChange={e => setNsPrevH(+e.target.value)} title="Alto del preview" />
              <span style={{ color: 'rgba(245,230,200,0.3)', fontSize: 10 }}>px</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: 8, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
              <NineSlicePreview src={nsImgSrc} slice={nsSlice} previewW={nsPrevW} previewH={nsPrevH} />
            </div>
          </div>

          {/* Código generado */}
          <div style={S.section}>
            <div style={S.title}>JS generado</div>
            <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: 8, fontSize: 10, overflowX: 'auto', color: '#86efac', margin: 0 }}>
              {`fondoSlice: { top:${nsSlice.top}, right:${nsSlice.right}, bottom:${nsSlice.bottom}, left:${nsSlice.left} }\n\nborder-image: url('${nsImgSrc || '…'}')\n  ${nsSlice.top} ${nsSlice.right} ${nsSlice.bottom} ${nsSlice.left} fill\n  / ${nsSlice.top}px ${nsSlice.right}px ${nsSlice.bottom}px ${nsSlice.left}px\n  stretch`}
            </pre>
            <button style={{ ...S.btn('blue'), width: '100%', marginTop: 5 }}
              onClick={() => copyText(JSON.stringify(nsSlice))}>
              📋 Copiar slice values
            </button>
          </div>

          {/* Aplicar a un elemento */}
          <div>
            <div style={S.title}>Aplicar nine-slice a elemento</div>
            <div style={{ display: 'flex', gap: 5 }}>
              <select value={nsApplyEl} style={{ ...S.inp(false), flex: 1 }} onChange={e => setNsApplyEl(e.target.value)}>
                {ELEMENTS.filter(el => el.props.some(p => p.includes('Slice'))).map(el => (
                  <option key={el.key} value={el.key}>{el.label}</option>
                ))}
              </select>
              <select value={nsApplyProp} style={{ ...S.inp(false), width: 100 }} onChange={e => setNsApplyProp(e.target.value)}>
                <option value="fondoSlice">fondoSlice</option>
                <option value="cellSlice">cellSlice</option>
              </select>
              <button style={S.btn('green')} onClick={() => {
                const el = ELEMENTS.find(e => e.key === nsApplyEl);
                if (el) onUpdatePath([...el.path, nsApplyProp], { ...nsSlice });
              }}>✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: EXPORT ── */}
      {tab === 'export' && (
        <div style={S.body}>
          <div style={S.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={S.title}>Cambios (delta)</div>
              <button style={S.btn('blue')} onClick={() => copyText(deltaJSON)}>
                {copyDone ? '✓ Copiado' : '📋 Copiar'}
              </button>
            </div>
            <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: 8, fontSize: 10, maxHeight: 200, overflowY: 'auto', color: '#86efac', margin: 0 }}>
              {deltaJSON || '{}'}
            </pre>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={S.title}>POS completo (pegar en Tablero.jsx)</div>
              <button style={S.btn('blue')} onClick={() => copyText(fullJSON)}>
                {copyDone ? '✓ Copiado' : '📋 Copiar POS'}
              </button>
            </div>
            <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: 8, fontSize: 10, maxHeight: 320, overflowY: 'auto', color: '#a5f3fc', margin: 0 }}>
              {fullJSON}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Exportar deepMerge para Tablero.jsx ──────────────────────────────
export function deepMerge(base, override) {
  if (typeof override !== 'object' || override === null || Array.isArray(override)) return override;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (typeof override[key] === 'object' && override[key] !== null
        && !Array.isArray(override[key])
        && typeof base?.[key] === 'object' && base[key] !== null
        && !Array.isArray(base[key])) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}
