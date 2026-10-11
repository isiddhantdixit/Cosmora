import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';

interface SpiralGalaxyProps {
  particleCount?: number;
  radius?: number;
  branches?: number;
  spin?: number;
  randomness?: number;
  insideColor?: string;
  midColor?: string;
  outsideColor?: string;
}

/**
 * Procedural 3D Logarithmic Spiral Galaxy
 * Generates an authentic rotating pinwheel galaxy with a glowing core,
 * distinct spiral arms, interstellar dust lanes, and spatial depth.
 */
const SpiralGalaxy3D: React.FC<SpiralGalaxyProps> = ({
  particleCount = 7500,
  radius = 220,
  branches = 3,
  spin = 1.35,
  randomness = 0.42,
  insideColor = '#FFF4D0',  // Warm brilliant stellar core
  midColor = '#48D7FF',     // Electric cyan spiral arms
  outsideColor = '#8B5CF6'  // Deep cosmic violet outer fringe
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);

  const { positions, colors, scales } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const scl = new Float32Array(particleCount);

    const cInside = new THREE.Color(insideColor);
    const cMid = new THREE.Color(midColor);
    const cOutside = new THREE.Color(outsideColor);

    for (let i = 0; i < particleCount; i++) {
      // Distance from center: higher density at core
      const rRatio = Math.pow(Math.random(), 1.7);
      const r = rRatio * radius;

      // Branch angle for spiral arms
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * (spin / 100);

      // Random scatter off the spiral spine (decreases towards center)
      const randomPower = 2.4;
      const randomX = Math.pow(Math.random(), randomPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
      const randomY = Math.pow(Math.random(), randomPower) * (Math.random() < 0.5 ? 1 : -1) * (randomness * 0.4) * r; // Disk thickness
      const randomZ = Math.pow(Math.random(), randomPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;

      const x = Math.cos(branchAngle + spinAngle) * r + randomX;
      const y = randomY; // disk vertical axis
      const z = Math.sin(branchAngle + spinAngle) * r + randomZ;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color interpolation: Core -> Mid Arms -> Outer Halo
      const mixedColor = new THREE.Color();
      if (rRatio < 0.3) {
        mixedColor.copy(cInside).lerp(cMid, rRatio / 0.3);
      } else {
        mixedColor.copy(cMid).lerp(cOutside, (rRatio - 0.3) / 0.7);
      }

      // Add occasional bright white star bursts
      if (Math.random() < 0.08) {
        mixedColor.set('#EDF5FF');
      }

      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;

      // Scale: core stars are slightly larger and brighter
      scl[i] = rRatio < 0.15 ? Math.random() * 2.8 + 2.0 : Math.random() * 2.0 + 1.0;
    }

    return {
      positions: pos,
      colors: col,
      scales: scl
    };
  }, [particleCount, radius, branches, spin, randomness, insideColor, midColor, outsideColor]);

  // Shader material for crisp glowing circular stars
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aScale;
        attribute vec3 aColor;
        varying vec3 vColor;
        uniform float uPixelRatio;

        void main() {
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          gl_PointSize = aScale * uPixelRatio * (280.0 / -mvPosition.z);
          gl_PointSize = max(gl_PointSize, 1.2);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          // Circular particle with soft radiant edge
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = pow(1.0 - dist * 2.0, 1.6);
          gl_FragColor = vec4(vColor, alpha * 0.92);
        }
      `,
      uniforms: {
        uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      // Constant cinematic galactic rotation
      pointsRef.current.rotation.y += delta * 0.045;
    }
    if (coreGlowRef.current) {
      // Core pulse
      const t = state.clock.getElapsedTime();
      const s = 1.0 + Math.sin(t * 1.8) * 0.08;
      coreGlowRef.current.scale.set(s, s, s);
      coreGlowRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    // Tilt the galaxy plane (X-axis ~ 58 degrees, Z-axis slight roll) for stunning perspective
    <group rotation={[-Math.PI / 3.0, 0.15, -Math.PI / 10]} position={[0, -10, -40]}>
      {/* Central Supermassive Core Bulge */}
      <mesh ref={coreGlowRef}>
        <sphereGeometry args={[14, 24, 24]} />
        <meshBasicMaterial
          color="#FFF5D6"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Secondary Core Corona */}
      <mesh scale={1.8}>
        <sphereGeometry args={[16, 24, 24]} />
        <meshBasicMaterial
          color="#48D7FF"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3D Spiral Points System */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        </bufferGeometry>
        <primitive object={shaderMaterial} attach="material" />
      </points>
    </group>
  );
};

/**
 * Distant Isotropic Deep-Space Starfield
 */
const DistantCosmicField: React.FC<{ count?: number; radius?: number }> = ({ count = 2000, radius = 550 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    const palette = [
      new THREE.Color('#EDF5FF'),
      new THREE.Color('#93C5FD'),
      new THREE.Color('#48D7FF'),
      new THREE.Color('#FEF08A')
    ];

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * radius + 150;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;

      sz[i] = Math.random() < 0.05 ? 2.5 : 1.2;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, [count, radius]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const CameraParallaxRig: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion }) => {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;

    const handlePointerMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, [reducedMotion]);

  useFrame((state) => {
    if (reducedMotion) return;
    const targetX = mouse.current.x * 20;
    const targetY = -mouse.current.y * 15;

    state.camera.position.x += (targetX - state.camera.position.x) * 0.035;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.035;
    state.camera.lookAt(0, 0, -30);
  });

  return null;
};

export const GalaxyBackground: React.FC = () => {
  const { preferences } = useUserPreferences();
  const particleCount = preferences.graphicsQuality === 'high' ? 8500 : preferences.graphicsQuality === 'medium' ? 5000 : 2500;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#030611] overflow-hidden">
      <Canvas
        camera={{ position: [0, 45, 190], fov: 60 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={typeof window !== 'undefined' ? [1, Math.min(window.devicePixelRatio, 1.75)] : 1}
      >
        <color attach="background" args={['#030611']} />
        <CameraParallaxRig reducedMotion={preferences.reducedMotion} />

        {/* Ambient Cosmic Core Lights */}
        <pointLight position={[0, 0, -40]} intensity={2.2} color="#FFF5D6" distance={300} />
        <pointLight position={[50, 30, -20]} intensity={1.5} color="#48D7FF" distance={250} />

        {/* 3D Rotating Spiral Galaxy (Main Feature) */}
        <SpiralGalaxy3D particleCount={particleCount} radius={210} branches={3} spin={1.3} />

        {/* Deep Field Stars */}
        <DistantCosmicField count={Math.floor(particleCount * 0.35)} radius={550} />
      </Canvas>

      {/* Atmospheric Vignette & Contrast Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, transparent 25%, rgba(3, 6, 17, 0.45) 65%, rgba(3, 6, 17, 0.92) 100%)'
        }}
      />
    </div>
  );
};
