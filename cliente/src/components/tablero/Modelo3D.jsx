/**
 * Modelo3D — carga .glb (GLTFLoader, con animación) o .stl (STLLoader, geometría pura).
 *
 * Props:
 *   src        — ruta al .glb o .stl (public/)
 *   size       — lado del canvas cuadrado en px  (default 180)
 *   escala     — multiplicador sobre tamaño normalizado (default 1)
 *   rotacion   — [x, y, z] en radianes (default [0, 0, 0])
 *   camPos     — [x, y, z] posición de la cámara (default [0, 2, 0.5])
 *   controles  — true → OrbitControls activos (girar/zoom con ratón)
 *   loopMode   — animación GLB: 'repeat' | 'pingpong' | 'once'
 *   colorBase  — color del material para STL (default '#cccccc')
 */

import React, { Suspense, Component, useEffect, useRef, useMemo } from 'react';
import { Canvas, useLoader, useFrame }                             from '@react-three/fiber';
import { OrbitControls }                                           from '@react-three/drei';
import { GLTFLoader }                                              from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader }                                               from 'three/examples/jsm/loaders/STLLoader.js';
import { clone as cloneSkeleton }                                  from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE                                                  from 'three';

const esStl = (src = '') => src.toLowerCase().endsWith('.stl');

/* ── ErrorBoundary ────────────────────────────────────────────── */
class ModeloBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(err) {
    console.warn('[Modelo3D] error:', err.message);
    // Un modelo que falla cuenta como "terminado" para no bloquear la carga
    this.props.onListo?.();
  }
  render() { return this.state.error ? null : this.props.children; }
}

/* ── Bbox robusta (SkinnedMesh safe) ─────────────────────────── */
function calcularBbox(scene) {
  scene.traverse(child => {
    if (child.geometry) {
      child.geometry.computeBoundingBox();
      child.geometry.computeBoundingSphere();
    }
  });
  scene.updateMatrixWorld(true);

  const box    = new THREE.Box3();
  const tmpBox = new THREE.Box3();
  scene.traverse(child => {
    if ((!child.isMesh && !child.isSkinnedMesh) || !child.geometry?.boundingBox) return;
    tmpBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
    box.union(tmpBox);
  });
  if (!box.isEmpty()) return box;

  const box2 = new THREE.Box3().setFromObject(scene, true);
  if (!box2.isEmpty()) return box2;
  return null;
}

/* ── Hook: avisa (una vez) cuando el modelo ya se ha pintado ─────
   Cuenta frames dentro del Canvas; tras 2 frames la malla está subida
   a la GPU y visible. Devuelve una función para llamar en useFrame.  */
function avisarTrasFrames(contadorRef, onListo) {
  if (!onListo || contadorRef.avisado) return;
  contadorRef.frames = (contadorRef.frames || 0) + 1;
  // Esperar varios frames asegura que la geometría (incluido el kraken pesado)
  // ya está subida a la GPU y realmente visible antes de quitar la carga.
  if (contadorRef.frames >= 8) {
    contadorRef.avisado = true;
    onListo();
  }
}

/* ── Hook compartido: aplica rotación X/Z directa + Y interpolada ── */
function useRotacionGrupo(groupRef, rotacion) {
  const rotYTarget = useRef(rotacion[1]);
  const firstMount = useRef(true);

  useEffect(() => {
    rotYTarget.current = rotacion[1];
    if (groupRef.current) {
      groupRef.current.rotation.x = rotacion[0] || 0;
      groupRef.current.rotation.z = rotacion[2] || 0;
      if (firstMount.current) {
        groupRef.current.rotation.y = rotacion[1];
        firstMount.current = false;
      }
    }
  }, [rotacion]); // eslint-disable-line

  return rotYTarget;
}

/* ── Mesh GLB (escena + animación) ─────────────────────────────── */
function GltfMesh({ src, escala, rotacion, loopMode = 'repeat', onListo }) {
  const gltf     = useLoader(GLTFLoader, src);
  const mixerRef = useRef(null);
  const groupRef = useRef(null);
  const listoRef = useRef({ frames: 0, avisado: false });

  // Clon por instancia (sin clonar, varias instancias del mismo .glb se pelean por la escena)
  const escena = useMemo(() => cloneSkeleton(gltf.scene), [gltf]);
  const rotYTarget = useRotacionGrupo(groupRef, rotacion);

  const { normScale, offset } = useMemo(() => {
    const box = calcularBbox(escena);
    if (!box) return { normScale: 1, offset: new THREE.Vector3() };
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const ns     = maxDim > 0 ? 1 / maxDim : 1;
    return { normScale: ns, offset: new THREE.Vector3(-center.x, -center.y, -center.z) };
  }, [escena]);

  useEffect(() => {
    if (!gltf.animations?.length) return;
    const mode = loopMode === 'pingpong' ? THREE.LoopPingPong
               : loopMode === 'once'     ? THREE.LoopOnce
               :                          THREE.LoopRepeat;
    const mixer = new THREE.AnimationMixer(escena);
    gltf.animations.forEach(clip => {
      const action = mixer.clipAction(clip);
      action.setLoop(mode, Infinity);
      if (loopMode === 'once') action.clampWhenFinished = true;
      action.play();
    });
    mixerRef.current = mixer;
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(escena); };
  }, [gltf, escena, loopMode]);

  useFrame((_s, delta) => {
    mixerRef.current?.update(delta);
    const group = groupRef.current;
    if (group) {
      let diff = rotYTarget.current - group.rotation.y;
      while (diff >  Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      group.rotation.y += diff * (1 - Math.exp(-10 * delta));
    }
    avisarTrasFrames(listoRef.current, onListo);
  });

  return (
    <group ref={groupRef} scale={normScale * escala}>
      <primitive object={escena} position={offset} />
    </group>
  );
}

/* ── Mesh STL (geometría pura, sin animación) ──────────────────── */
function StlMesh({ src, escala, rotacion, colorBase = '#cccccc', onListo }) {
  const geom     = useLoader(STLLoader, src);
  const groupRef = useRef(null);
  const listoRef = useRef({ frames: 0, avisado: false });
  const rotYTarget = useRotacionGrupo(groupRef, rotacion);

  // Normalización: centrar y escalar a 1 unidad la dimensión mayor
  const { normScale, offset } = useMemo(() => {
    geom.computeBoundingBox();
    const box    = geom.boundingBox;
    if (!box) return { normScale: 1, offset: new THREE.Vector3() };
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const ns     = maxDim > 0 ? 1 / maxDim : 1;
    return { normScale: ns, offset: new THREE.Vector3(-center.x, -center.y, -center.z) };
  }, [geom]);

  useFrame((_s, delta) => {
    const group = groupRef.current;
    if (group) {
      let diff = rotYTarget.current - group.rotation.y;
      while (diff >  Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      group.rotation.y += diff * (1 - Math.exp(-10 * delta));
    }
    avisarTrasFrames(listoRef.current, onListo);
  });

  return (
    <group ref={groupRef} scale={normScale * escala}>
      <mesh geometry={geom} position={offset}>
        <meshStandardMaterial color={colorBase} roughness={0.55} metalness={0.1} />
      </mesh>
    </group>
  );
}

/* ── Componente público ───────────────────────────────────────── */
export default function Modelo3D({
  src,
  size       = 180,
  escala     = 1,
  rotacion   = [0, 0, 0],
  camPos     = [0, 2, 0.5],
  controles  = true,
  loopMode   = 'repeat',
  colorBase  = '#cccccc',
  onListo,
}) {
  const stl = esStl(src);
  return (
    <div style={{
      width:         `${size}px`,
      height:        `${size}px`,
      pointerEvents: controles ? 'auto' : 'none',
      userSelect:    'none',
    }}>
      <ModeloBoundary onListo={onListo}>
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ position: camPos, fov: 45, near: 0.01, far: 1000 }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[ 2,  4,  3]} intensity={1.4} />
          <directionalLight position={[-2,  1, -2]} intensity={0.5} />

          <Suspense fallback={null}>
            {stl
              ? <StlMesh  src={src} escala={escala} rotacion={rotacion} colorBase={colorBase} onListo={onListo} />
              : <GltfMesh src={src} escala={escala} rotacion={rotacion} loopMode={loopMode} onListo={onListo} />
            }
          </Suspense>

          {controles && (
            <OrbitControls
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
              minDistance={0.3}
              maxDistance={8}
              onChange={e => {
                const p = e.target.object.position;
                console.log(`camPos: [${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}]`);
              }}
            />
          )}
        </Canvas>
      </ModeloBoundary>
    </div>
  );
}
