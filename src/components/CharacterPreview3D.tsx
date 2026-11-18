import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { Character } from '../entities/Character.js';
import type { CharacterAppearance } from '../shared/catalog';

interface Props {
  appearance: CharacterAppearance;
}

let cachedModelsPromise: Promise<{ xbot: any; avatar: any }> | null = null;

function loadPreviewModels() {
  if (!cachedModelsPromise) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const load = (url: string) =>
      new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
    cachedModelsPromise = Promise.all([
      load('/assets/models/Xbot.glb'),
      load('/assets/models/readyplayer.me.glb'),
    ]).then(([xbot, avatar]) => ({ xbot, avatar }));
  }
  return cachedModelsPromise;
}

export const CharacterPreview3D: React.FC<Props> = ({ appearance }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const charRef = useRef<any>(null);
  const appearanceRef = useRef(appearance);
  appearanceRef.current = appearance;

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let disposed = false;
    let rafId = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      34,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      50,
    );
    camera.position.set(0, 1.05, 3.35);
    camera.lookAt(0, 0.92, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x334155, 1.4);
    const key = new THREE.DirectionalLight(0xfff1d6, 2.4);
    key.position.set(2.2, 3.2, 3.0);
    const rim = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rim.position.set(-2.5, 2.0, -2.2);
    scene.add(hemi, key, rim);

    // Subtle studio pedestal
    const discGeo = new THREE.CylinderGeometry(0.75, 0.85, 0.06, 36);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.3 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.03;
    scene.add(disc);

    let yaw = 0.25;
    let dragging = false;
    let lastX = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    };
    const onUp = () => {
      dragging = false;
    };

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    const ro = new ResizeObserver(() => {
      if (!container || disposed) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    loadPreviewModels()
      .then((models) => {
        if (disposed) return;
        const character = new Character({ models }, 'avatar', {
          appearance: appearanceRef.current,
        });
        charRef.current = character;
        scene.add(character.root);

        let lastTime = performance.now();
        const tick = (now: number) => {
          if (disposed) return;
          const dt = Math.min(0.05, (now - lastTime) / 1000);
          lastTime = now;
          if (!dragging) yaw += dt * 0.28;
          character.root.rotation.y = yaw;
          character.update(dt);
          renderer.render(scene, camera);
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.warn('[preview] Could not load 3D character preview:', err);
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (charRef.current) {
        charRef.current.dispose();
        charRef.current = null;
      }
      discGeo.dispose();
      discMat.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (charRef.current) {
      charRef.current.applyAppearance(appearance);
    }
  }, [appearance]);

  return (
    <div className="preview-stage">
      <div ref={hostRef} className="preview-canvas-host" />
      <div className="preview-hint">Drag to rotate 360°</div>
    </div>
  );
};
