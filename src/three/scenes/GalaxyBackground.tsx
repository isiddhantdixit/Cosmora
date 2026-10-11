import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StarShaderMaterial, NebulaShaderMaterial } from '../shaders/galaxyShaders';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';

interface StarFieldProps {
  count?: number;
  radius?: number;
}

const ProceduralStarField: React.FC<StarFieldProps> = ({ count = 3500, radius = 600 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, twinkleSpeeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const tw = new Float32Array(count);

    const palette = [
      new THREE.Color('#EDF5FF'), // Soft white
      new THREE.Color('#48D7FF'), // Cyan
      new THREE.Color('#93C5FD'), // Blue
      new THREE.Color('#FEF08A'), // Yellow
      new THREE.Color('#FCA5A5'), // Reddish
      new THREE.Color('#C4B5FD')  // Soft violet
    ];

    for (let i = 0; i < count; i++) {
      // 65% in galactic disc disk, 35% isotropic halo
      const inDisk = Math.random() < 0.65;
      let x = 0, y = 0, z = 0;

      if (inDisk) {
        // Disk distribution inclined at 30 degrees
        const r = (Math.random() * 0.85 + 0.15) * radius;
        const theta = Math.random() * Math.PI * 2;
        const h = (Math.random() - 0.5) * (radius * 0.15); // thin disk height

        // Rotated plane
        x = r * Math.cos(theta);
        y = r * Math.sin(theta) * 0.5 + h;
        z = r * Math.sin(theta) * 0.866 + h;
      } else {
        // Spherical halo
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * radius;

        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color selection
      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;

      // Sizes (most small, few bright giants)
      const sizeRand = Math.random();
      sz[i] = sizeRand > 0.95 ? 4.5 : sizeRand > 0.8 ? 2.8 : 1.4;

      // Twinkle speed
      tw[i] = 0.5 + Math.random() * 2.5;
    }

    return {
      positions: pos,
      colors: col,
      sizes: sz,
      twinkleSpeeds: tw
    };
  }, [count, radius]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
    if (pointsRef.current) {
      // Very slow natural galactic drift
      pointsRef.current.rotation.y += delta * 0.008;
      pointsRef.current.rotation.x += delta * 0.003;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 }
  }), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aTwinkleSpeed"
          args={[twinkleSpeeds, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={StarShaderMaterial.vertexShader}
        fragmentShader={StarShaderMaterial.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const VolumetricNebulaPlane: React.FC<{
  position: [number, number, number];
  colorA: string;
  colorB: string;
  opacity: number;
  size: number;
}> = ({ position, colorA, colorB, opacity, size }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) },
    uOpacity: { value: opacity }
  }), [colorA, colorB, opacity]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[size, size, 16, 16]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={NebulaShaderMaterial.vertexShader}
        fragmentShader={NebulaShaderMaterial.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
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
    const targetX = mouse.current.x * 25;
    const targetY = -mouse.current.y * 20;

    state.camera.position.x += (targetX - state.camera.position.x) * 0.03;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};

export const GalaxyBackground: React.FC = () => {
  const { preferences } = useUserPreferences();
  const starCount = preferences.graphicsQuality === 'high' ? 4500 : preferences.graphicsQuality === 'medium' ? 2500 : 1200;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#030611] overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 250], fov: 60 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={typeof window !== 'undefined' ? [1, Math.min(window.devicePixelRatio, 1.75)] : 1}
      >
        <color attach="background" args={['#030611']} />
        <CameraParallaxRig reducedMotion={preferences.reducedMotion} />
        
        {/* Layer 1: Distant Galaxy Starfield */}
        <ProceduralStarField count={starCount} radius={700} />
        
        {/* Layer 2: Close Atmospheric Cosmic Dust */}
        <ProceduralStarField count={Math.floor(starCount * 0.15)} radius={280} />

        {/* Volumetric Nebulae: Cyan & Deep Violet clouds */}
        {preferences.showAtmosphereGlow && (
          <>
            <VolumetricNebulaPlane
              position={[80, -40, -120]}
              colorA="#163B70"
              colorB="#48D7FF"
              opacity={0.32}
              size={360}
            />
            <VolumetricNebulaPlane
              position={[-120, 60, -180]}
              colorA="#3B82F6"
              colorB="#8B5CF6"
              opacity={0.28}
              size={420}
            />
          </>
        )}
      </Canvas>
      {/* Subtle vignette gradient overlay */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" 
           style={{
             background: 'radial-gradient(circle at center, transparent 30%, rgba(3, 6, 17, 0.6) 80%, rgba(3, 6, 17, 0.95) 100%)'
           }}
      />
    </div>
  );
};
