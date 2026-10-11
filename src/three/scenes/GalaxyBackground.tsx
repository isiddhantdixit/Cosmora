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
 * 3D Logarithmic Spiral Galaxy that responds to cursor and scroll movement
 */
const SpiralGalaxy3D: React.FC<SpiralGalaxyProps> = ({
  particleCount = 8500,
  radius = 230,
  branches = 3,
  spin = 1.35,
  randomness = 0.44,
  insideColor = '#FFF6D6',  // Warm luminous stellar core
  midColor = '#48D7FF',     // Electric neon cyan arms
  outsideColor = '#A78BFA'  // Cosmic violet/magenta fringe
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);
  const coreOuterGlowRef = useRef<THREE.Mesh>(null);

  const { positions, colors, scales } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const scl = new Float32Array(particleCount);

    const cInside = new THREE.Color(insideColor);
    const cMid = new THREE.Color(midColor);
    const cOutside = new THREE.Color(outsideColor);

    for (let i = 0; i < particleCount; i++) {
      // Density: concentrated near galactic nucleus
      const rRatio = Math.pow(Math.random(), 1.6);
      const r = rRatio * radius;

      // Logarithmic spiral branch geometry
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * (spin / 100);

      const randomPower = 2.4;
      const randomX = Math.pow(Math.random(), randomPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
      const randomY = Math.pow(Math.random(), randomPower) * (Math.random() < 0.5 ? 1 : -1) * (randomness * 0.45) * r;
      const randomZ = Math.pow(Math.random(), randomPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;

      const x = Math.cos(branchAngle + spinAngle) * r + randomX;
      const y = randomY; // vertical disk thickness
      const z = Math.sin(branchAngle + spinAngle) * r + randomZ;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color interpolation along galactic radius
      const mixedColor = new THREE.Color();
      if (rRatio < 0.28) {
        mixedColor.copy(cInside).lerp(cMid, rRatio / 0.28);
      } else {
        mixedColor.copy(cMid).lerp(cOutside, (rRatio - 0.28) / 0.72);
      }

      // Add brilliant white & electric star clusters
      if (Math.random() < 0.12) {
        mixedColor.set('#EDF5FF');
      } else if (Math.random() < 0.05) {
        mixedColor.set('#38BDF8');
      }

      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;

      // Core stars are larger and brighter
      scl[i] = rRatio < 0.12 ? Math.random() * 3.2 + 2.4 : Math.random() * 2.2 + 1.2;
    }

    return {
      positions: pos,
      colors: col,
      scales: scl
    };
  }, [particleCount, radius, branches, spin, randomness, insideColor, midColor, outsideColor]);

  // Shader material for radiant glowing circular stars
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
          
          gl_PointSize = aScale * uPixelRatio * (290.0 / -mvPosition.z);
          gl_PointSize = max(gl_PointSize, 1.4);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = pow(1.0 - dist * 2.0, 1.5);
          gl_FragColor = vec4(vColor, alpha * 0.95);
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
      // Natural continuous galactic rotation
      pointsRef.current.rotation.y += delta * 0.05;
    }
    if (coreGlowRef.current) {
      const t = state.clock.getElapsedTime();
      const s = 1.0 + Math.sin(t * 2.0) * 0.08;
      coreGlowRef.current.scale.set(s, s, s);
    }
    if (coreOuterGlowRef.current) {
      const t = state.clock.getElapsedTime();
      const s = 1.0 + Math.cos(t * 1.5) * 0.1;
      coreOuterGlowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 3.0, 0.12, -Math.PI / 10]} position={[0, -10, -35]}>
      {/* Brilliant Galactic Nucleus */}
      <mesh ref={coreGlowRef}>
        <sphereGeometry args={[15, 24, 24]} />
        <meshBasicMaterial
          color="#FFF6D6"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Radiant Cyan Corona */}
      <mesh ref={coreOuterGlowRef} scale={1.8}>
        <sphereGeometry args={[17, 24, 24]} />
        <meshBasicMaterial
          color="#48D7FF"
          transparent
          opacity={0.16}
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
 * Distant Deep-Space Stars with twinkling
 */
const DistantCosmicField: React.FC<{ count?: number; radius?: number }> = ({ count = 2500, radius = 600 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    const palette = [
      new THREE.Color('#EDF5FF'),
      new THREE.Color('#93C5FD'),
      new THREE.Color('#48D7FF'),
      new THREE.Color('#FEF08A'),
      new THREE.Color('#FCA5A5')
    ];

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * radius + 140;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;

      sz[i] = Math.random() < 0.08 ? 2.6 : 1.3;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, [count, radius]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.006;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.6}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

/**
 * Camera Controller that actively responds to:
 * 1. Cursor Movement (smooth interactive parallax & 3D tilt)
 * 2. Scroll Progression (camera travels deeper into space & pivots viewing angle)
 */
const InteractiveParallaxAndScrollRig: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion }) => {
  const mouse = useRef({ x: 0, y: 0 });
  const scrollFraction = useRef(0);
  const cursorLightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    if (reducedMotion) return;

    // Track cursor movement across window
    const handlePointerMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to +1
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    // Track scroll progression down the page
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        scrollFraction.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [reducedMotion]);

  useFrame((state) => {
    if (reducedMotion) return;

    const scroll = scrollFraction.current;
    const mx = mouse.current.x;
    const my = mouse.current.y;

    // Dynamic camera target based on cursor AND scroll position
    // As you scroll down, camera moves down, zooms in closer (Z travels from 195 to 145), and rotates!
    const targetCamX = mx * 35;
    const targetCamY = 45 - my * 25 - scroll * 40;
    const targetCamZ = 195 - scroll * 50;

    // Smooth lerp camera position
    state.camera.position.x += (targetCamX - state.camera.position.x) * 0.045;
    state.camera.position.y += (targetCamY - state.camera.position.y) * 0.045;
    state.camera.position.z += (targetCamZ - state.camera.position.z) * 0.045;

    // Look target pivots slightly with scroll and mouse
    const lookTargetY = -25 - scroll * 20;
    const lookTargetX = mx * 10;
    state.camera.lookAt(lookTargetX, lookTargetY, -35);

    // Interactive cursor spotlight that follows mouse in 3D space
    if (cursorLightRef.current) {
      cursorLightRef.current.position.x = mx * 80;
      cursorLightRef.current.position.y = -my * 60 + 20;
      cursorLightRef.current.position.z = 40;
    }
  });

  return (
    <pointLight
      ref={cursorLightRef}
      position={[0, 0, 40]}
      intensity={1.2}
      color="#48D7FF"
      distance={260}
    />
  );
};

export const GalaxyBackground: React.FC = () => {
  const { preferences } = useUserPreferences();
  const particleCount = preferences.graphicsQuality === 'high' ? 9500 : preferences.graphicsQuality === 'medium' ? 6000 : 3000;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#030611] overflow-hidden">
      <Canvas
        camera={{ position: [0, 45, 195], fov: 60 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={typeof window !== 'undefined' ? [1, Math.min(window.devicePixelRatio, 1.75)] : 1}
      >
        <color attach="background" args={['#030611']} />
        
        {/* Interactive Cursor and Scroll Rig */}
        <InteractiveParallaxAndScrollRig reducedMotion={preferences.reducedMotion} />

        {/* Ambient Cosmic Core Lights */}
        <pointLight position={[0, -10, -35]} intensity={2.8} color="#FFF5D6" distance={350} />
        <pointLight position={[60, 25, -20]} intensity={1.8} color="#48D7FF" distance={300} />
        <pointLight position={[-60, -25, -20]} intensity={1.6} color="#8B5CF6" distance={300} />

        {/* 3D Rotating Spiral Galaxy (Main Moving Feature) */}
        <SpiralGalaxy3D particleCount={particleCount} radius={230} branches={3} spin={1.35} />

        {/* Deep Field Twinkling Stars */}
        <DistantCosmicField count={Math.floor(particleCount * 0.35)} radius={600} />
      </Canvas>

      {/* Subtle Vignette that leaves the core luminous while keeping text readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 42%, transparent 20%, rgba(3, 6, 17, 0.4) 65%, rgba(3, 6, 17, 0.9) 100%)'
        }}
      />
    </div>
  );
};
