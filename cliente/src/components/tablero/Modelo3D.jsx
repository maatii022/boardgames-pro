/**
 * Modelo3D — GLTFLoader + normalización automática + AnimationMixer.
 *
 * Props:
 *   src        — ruta al .glb  (public/)
 *   size       — lado del canvas cuadrado en px  (default 180)
 *   escala     — multiplicador sobre tamaño normalizado (default 1)
 *   rotacion   — [x, y, z] en radianes (default [0, 0, 0])
 *   camPos     — [x, y, z] posición de la cámara (default [0, 2, 0.5])
 *   controles  — true → OrbitControls activos (girar/zoom con ratón)
 */

import React, { Suspense, Component, useEffect, useRef, useMemo } from 'react';
import { Canvas, useLoader, useFrame }                             from '@react-three/fiber';
import { OrbitControls }                                           from '@react-three/drei';
import { GLTFLoader }                                              from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE                                                  from 'three';

/* ── ErrorBoundary ────────────────────────────────────────────── */
class ModeloBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(err) { console.warn('[Modelo3D] error:', err.message); }
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

  const nodos = [];
  scene.traverse(c => nodos.push(`${c.type}(${c.name || '-'})`));
  console.warn('[Modelo3D] sin geometría. Árbol:', nodos.join(' › '));
  return null;
}

/* ── Mesh + normalización + AnimationMixer ─────────────────── */
function ModeloMesh({ src, escala, rotacion }) {
  const gltf       = useLoader(GLTFLoader, src);
  const mixerRef   = useRef(null);
  const groupRef   = useRef(null);

  // Rotación Y suave ─────────────────────────────────────────
  // Nunca pasamos rotation.y como prop para que R3F no pise
  // lo que calculamos en useFrame cada tick.
  const rotYTarget  = useRef(rotacion[1]);   // ángulo objetivo (rad)
  const firstMount  = useRef(true);           // snap en el primer render

  useEffect(() => {
    rotYTarget.current = rotacion[1];
    // En el primer frame: snap instantáneo (sin animación de entrada)
    if (firstMount.current && groupRef.current) {
      groupRef.current.rotation.y = rotacion[1];
      firstMount.current = false;
    }
  }, [rotacion]);
  // ──────────────────────────────────────────────────────────

  const { normScale, offset } = useMemo(() => {
    const box = calcularBbox(gltf.scene);
    if (!box) return { normScale: 1, offset: new THREE.Vector3() };

    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const ns     = maxDim > 0 ? 1 / maxDim : 1;

    console.log('[Modelo3D] ✅', {
      tamaño: size.toArray().map(v => v.toFixed(2)),
      normScale: ns.toFixed(5),
      escalaFinal: (ns * escala).toFixed(5),
    });

    return { normScale: ns, offset: new THREE.Vector3(-center.x, -center.y, -center.z) };
  }, [gltf, escala]);

  useEffect(() => {
    if (!gltf.animations?.length) return;
    const mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach(clip => mixer.clipAction(clip).play());
    mixerRef.current = mixer;
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene); };
  }, [gltf]);

  useFrame((_s, delta) => {
    mixerRef.current?.update(delta);
    const group = groupRef.current;
    if (!group) return;
    // Interpolación exponencial hacia el ángulo objetivo
    // (camino más corto, atraviesa π correctamente)
    let diff = rotYTarget.current - group.rotation.y;
    while (diff >  Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    group.rotation.y += diff * (1 - Math.exp(-10 * delta));
  });

  return (
    // rotation.y NO se pasa como prop → lo controla exclusivamente useFrame
    <group ref={groupRef} scale={normScale * escala}>
      <primitive object={gltf.scene} position={offset} />
    </group>
  );
}

/* ── Componente público ───────────────────────────────────────── */
export default function Modelo3D({
  src,
  size       = 180,
  escala     = 1,
  rotacion   = [0, 0, 0],
  camPos     = [0, 2, 0.5],   // ← ajustar en POS.modelos3d.barco.camPos
  controles  = true,           // ← true = girar/zoom con ratón para buscar ángulo
}) {
  return (
    <div style={{
      width:         `${size}px`,
      height:        `${size}px`,
      // pointer events ON para que OrbitControls funcione
      pointerEvents: controles ? 'auto' : 'none',
      userSelect:    'none',
    }}>
      <ModeloBoundary>
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ position: camPos, fov: 45, near: 0.01, far: 1000 }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[ 2,  4,  3]} intensity={1.4} />
          <directionalLight position={[-2,  1, -2]} intensity={0.5} />

          <Suspense fallback={null}>
            <ModeloMesh src={src} escala={escala} rotacion={rotacion} />
          </Suspense>

          {/* OrbitControls: drag para rotar, scroll para zoom
              onChange imprime la posición en consola → cópiala a POS.modelos3d.barco.camPos */}
          {controles && (
            <OrbitControls
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
              minDistance={0.3}
              maxDistance={8}
              onChange={e => {
                const p = e.target.object.position;
                console.log(
                  `camPos: [${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}]`
                );
              }}
            />
          )}
        </Canvas>
      </ModeloBoundary>
    </div>
  );
}
