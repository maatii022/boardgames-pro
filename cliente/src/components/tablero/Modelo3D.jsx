/**
 * Modelo3D — canvas R3F con GLTFLoader + AnimationMixer.
 *
 * Uso:
 *   <Modelo3D src="/tablero/modelos/barco.glb" size={180} />
 *
 * Props:
 *   src       — ruta al .glb  (carpeta public/)
 *   size      — lado del canvas cuadrado en px  (default 120)
 *   escala    — escala uniforme del modelo       (default 1)
 *   rotacion  — [x, y, z] en radianes           (default [0,0,0])
 *   camPos    — posición de la cámara            (default [0,1.5,3])
 *
 * Carga vía GLTFLoader (useLoader de R3F) + AnimationMixer:
 *   Si el .glb contiene animaciones, todas se reproducen en bucle
 *   automáticamente — igual que el patrón:
 *     mixer.clipAction(clip).play()
 *
 * ErrorBoundary interno → modelo faltante/corrupto = render nulo.
 * Suspense fallback null → sin parpadeos durante la carga.
 * Fondo transparente   → se superpone sobre el tablero.
 * pointerEvents: none  → no interfiere con clics.
 */

import React, { Suspense, Component, useEffect, useRef } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/* ── ErrorBoundary: .glb faltante/roto → render nulo, sin crash ── */
class ModeloBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(err) {
    if (import.meta.env.DEV) {
      console.warn('[Modelo3D] No se pudo cargar:', err.message);
    }
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

/* ── Mesh interno ─────────────────────────────────────────────────
   useLoader(GLTFLoader, src) es el equivalente R3F de:
     const loader = new GLTFLoader();
     loader.load(src, (gltf) => { ... });

   useFrame avanza el AnimationMixer en cada frame del canvas.
─────────────────────────────────────────────────────────────────── */
function ModeloMesh({ src, escala = 1, rotacion = [0, 0, 0] }) {
  const gltf      = useLoader(GLTFLoader, src);
  const mixerRef  = useRef(null);

  useEffect(() => {
    if (!gltf.animations?.length) return;

    // Crea un mixer ligado a la escena del modelo
    const mixer = new THREE.AnimationMixer(gltf.scene);

    // Reproduce TODAS las animaciones en bucle (igual que el ejemplo)
    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });

    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
    };
  }, [gltf]);

  // Avanza el mixer en cada frame del canvas
  useFrame((_state, delta) => {
    mixerRef.current?.update(delta);
  });

  return (
    <primitive
      object={gltf.scene}
      scale={escala}
      rotation={rotacion}
    />
  );
}

/* ── Componente público ───────────────────────────────────────────
   Canvas con alpha:true → fondo completamente transparente.
   Toda la configuración de posición/tamaño viene de POS.modelos3d.
─────────────────────────────────────────────────────────────────── */
export default function Modelo3D({
  src,
  size     = 120,
  escala   = 1,
  rotacion = [0, 0, 0],
  camPos   = [0, 1.5, 3],
}) {
  return (
    <div style={{
      width:         `${size}px`,
      height:        `${size}px`,
      pointerEvents: 'none',
      userSelect:    'none',
    }}>
      <ModeloBoundary>
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ fov: 45, near: 0.1, far: 100, position: camPos }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          {/* Iluminación pirata — cálida principal + fría de relleno */}
          <ambientLight intensity={0.55} color="#ffe5b0" />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1.1}
            color="#fff5dc"
            castShadow
          />
          <directionalLight
            position={[-4, 2, -3]}
            intensity={0.30}
            color="#8ab4d4"
          />

          <Suspense fallback={null}>
            <ModeloMesh src={src} escala={escala} rotacion={rotacion} />
          </Suspense>
        </Canvas>
      </ModeloBoundary>
    </div>
  );
}
