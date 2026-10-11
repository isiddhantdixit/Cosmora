import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';

/**
 * Clean 3D Milky Way Arc & Dust Lane System
 * Modeled after real astrophotography of the Milky Way band stretching across the night sky.
 * Engineered specifically so the galactic bulge is positioned off-center, leaving the
 * central viewport dark and high-contrast for crisp text legibility.
 */
interface MilkyWayProps {
  particleCount?: number;
}

const MilkyWayArch3D: React.FC<MilkyWayProps> = ({ particleCount = 10000 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);
  const coreOuterGlowRef = useRef<THREE.Mesh>(null);
  const bandGroupRef = useRef<THREE.Group>(null);

  const { positions, colors, scales } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const scl = new Float32Array(particleCount);

    // Natural Milky Way Astrophotography Palette
    const cCoreGold = new THREE.Color('#FDE68A');   // Warm Sagittarius star cloud stardust
    const cSoftCyan = new THREE.Color('#38BDF8');   // O/B stellar nurseries
    const cLavender = new THREE.Color('#A78BFA');   // Ionized hydrogen / emission rim
    const cDeepAzure = new THREE.Color('#2563EB');  // Distant disk stars
    const cCrispWhite = new THREE.Color('#F8FAFC'); // Bright pinpoint foreground stars

    for (let i = 0; i < particleCount; i++) {
      // 70% of particles form the sweeping Milky Way river / band
      // 30% are distributed as diffuse deep-space galactic halo & ambient stars
      const isBand = i < particleCount * 0.72;

      let x = 0;
      let y = 0;
      let z = 0;
      let mixedColor = new THREE.Color();
      let starSize = 1.0;

      if (isBand) {
        // Parametric curve along the Milky Way band stretching diagonally across the sky
        // Length from -260 to +260
        const t = (Math.random() - 0.5) * 520;
        
        // Gentle S-curve arch
        const curveY = Math.sin((t / 260) * Math.PI * 0.8) * 45;
        
        // Dispersion: wider near the galactic core (t > 0), narrower at extremities
        const coreProximity = Math.exp(-Math.pow((t - 70) / 90, 2));
        const bandWidth = 22 + coreProximity * 55;
        const bandDepth = 25 + coreProximity * 45;

        // Gaussian cross-sectional spread with subtle dark rift splitting
        const crossSpread = (Math.random() + Math.random() - 1.0) * bandWidth;
        // Dark rift silhouette: thin lane with reduced star density near core axis
        const isRift = coreProximity > 0.4 && Math.abs(crossSpread) < 6 && Math.random() < 0.65;
        
        const spreadY = (Math.random() + Math.random() - 1.0) * (bandWidth * 0.45);
        const spreadZ = (Math.random() + Math.random() - 1.0) * bandDepth;

        x = t;
        y = curveY + spreadY;
        z = spreadZ - 30;

        // Color based on location along the galactic band
        if (coreProximity > 0.5) {
          mixedColor.copy(cCoreGold).lerp(cLavender, Math.random() * 0.4);
          starSize = Math.random() * 2.2 + 1.2;
        } else if (Math.random() < 0.35) {
          mixedColor.copy(cSoftCyan).lerp(cDeepAzure, Math.random() * 0.5);
          starSize = Math.random() * 1.8 + 0.9;
        } else if (Math.random() < 0.15) {
          mixedColor.copy(cCrispWhite);
          starSize = Math.random() * 2.0 + 1.0;
        } else {
          mixedColor.copy(cLavender).lerp(cDeepAzure, Math.random() * 0.6);
          starSize = Math.random() * 1.5 + 0.8;
        }

        // Dark rift dimming
        if (isRift) {
          mixedColor.multiplyScalar(0.2);
          starSize *= 0.6;
        }

        // TEXT PROTECTION: If particle happens to fall right in the central screen region
        // (x between -60 and +20, y between -30 and +30), soften it so it never obscures text
        const distFromCenter = Math.sqrt(x * x + y * y);
        if (distFromCenter < 55) {
          mixedColor.multiplyScalar(0.4);
          starSize *= 0.65;
        }
      } else {
        // Ambient celestial starfield surrounding the Milky Way
        const r = Math.random() * 420 + 80;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;

        x = r * Math.cos(theta) * Math.cos(phi);
        y = r * Math.sin(phi);
        z = r * Math.sin(theta) * Math.cos(phi) - 60;

        // Ambient faint starlight
        if (Math.random() < 0.1) {
          mixedColor.copy(cCrispWhite);
          starSize = Math.random() * 1.6 + 0.8;
        } else if (Math.random() < 0.5) {
          mixedColor.copy(cSoftCyan).multiplyScalar(0.65);
          starSize = Math.random() * 1.2 + 0.6;
        } else {
          mixedColor.copy(cLavender).multiplyScalar(0.5);
          starSize = Math.random() * 1.0 + 0.5;
        }
      }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;

      scl[i] = starSize;
    }

    return { positions: pos, colors: col, scales: scl };
  }, [particleCount]);

  // Clean soft particle shader with gentle radial falloff for natural stardust
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
          
          gl_PointSize = aScale * uPixelRatio * (340.0 / -mvPosition.z);
          gl_PointSize = max(gl_PointSize, 1.8);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Soft natural starlight glow
          float alpha = pow(1.0 - dist * 2.0, 1.35);
          gl_FragColor = vec4(vColor, alpha * 0.92);
        }
      `,
      uniforms: {
        uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.75) : 1 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, []);

  useFrame((state, delta) => {
    if (bandGroupRef.current) {
      // Gentle cosmic drift along the celestial band
      bandGroupRef.current.rotation.z += delta * 0.006;
    }
    if (coreGlowRef.current) {
      const t = state.clock.getElapsedTime();
      const s = 1.0 + Math.sin(t * 1.2) * 0.05;
      coreGlowRef.current.scale.set(s, s, s);
    }
    if (coreOuterGlowRef.current) {
      const t = state.clock.getElapsedTime();
      const s = 1.0 + Math.cos(t * 0.9) * 0.06;
      coreOuterGlowRef.current.scale.set(s, s, s);
    }
  });

  return (
    // Tilted gracefully so the Milky Way streams diagonally across the background
    <group ref={bandGroupRef} rotation={[-0.22, 0.28, 0.42]} position={[20, 18, -15]}>
      {/* Galactic Bulge: Placed off-center at upper right [85, 45, -25] */}
      <group position={[85, 45, -25]}>
        <mesh ref={coreGlowRef}>
          <sphereGeometry args={[16, 24, 24]} />
          <meshBasicMaterial
            color="#FDE68A"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh ref={coreOuterGlowRef} scale={1.8}>
          <sphereGeometry args={[18, 24, 24]} />
          <meshBasicMaterial
            color="#818CF8"
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Ambient Milky Way Nebula Glow Clouds */}
      <mesh position={[-60, -10, -40]} scale={[2.2, 1.0, 1.0]}>
        <sphereGeometry args={[32, 16, 16]} />
        <meshBasicMaterial
          color="#3B82F6"
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[40, 25, -35]} scale={[1.8, 1.2, 1.0]}>
        <sphereGeometry args={[28, 16, 16]} />
        <meshBasicMaterial
          color="#8B5CF6"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3D Milky Way Stardust Band */}
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
 * Camera Controller that actively responds to:
 * 1. Cursor Movement: Smooth interactive 3D parallax & tilt
 * 2. Scroll Progression: Camera travels smoothly along the Milky Way band
 */
const MilkyWayParallaxAndScrollRig: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion }) => {
  const mouse = useRef({ x: 0, y: 0 });
  const scrollFraction = useRef(0);
  const cursorLightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const handlePointerMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        scrollFraction.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
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

    // Smooth camera drift responding to cursor and scroll depth
    const targetCamX = mx * 32 + scroll * 15;
    const targetCamY = 15 - my * 22 - scroll * 45;
    const targetCamZ = 180 - scroll * 40;

    state.camera.position.x += (targetCamX - state.camera.position.x) * 0.045;
    state.camera.position.y += (targetCamY - state.camera.position.y) * 0.045;
    state.camera.position.z += (targetCamZ - state.camera.position.z) * 0.045;

    // Look target pivots subtly with mouse and scroll
    const lookTargetX = mx * 12 + scroll * 10;
    const lookTargetY = -scroll * 20;
    state.camera.lookAt(lookTargetX, lookTargetY, -25);

    // Subtle ethereal point light following cursor
    if (cursorLightRef.current) {
      cursorLightRef.current.position.x = mx * 70;
      cursorLightRef.current.position.y = -my * 50 + 10;
      cursorLightRef.current.position.z = 50;
    }
  });

  return (
    <pointLight
      ref={cursorLightRef}
      position={[0, 0, 50]}
      intensity={0.8}
      color="#38BDF8"
      distance={240}
    />
  );
};

export const GalaxyBackground: React.FC = () => {
  const { preferences } = useUserPreferences();
  const particleCount = preferences.graphicsQuality === 'high' ? 11000 : preferences.graphicsQuality === 'medium' ? 7500 : 4000;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 15, 180], fov: 58 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={typeof window !== 'undefined' ? [1, Math.min(window.devicePixelRatio, 1.75)] : 1}
        className="w-full h-full"
      >
        <color attach="background" args={['#030611']} />

        {/* Interactive Cursor and Scroll Rig */}
        <MilkyWayParallaxAndScrollRig reducedMotion={preferences.reducedMotion} />

        {/* Ambient Soft Celestial Lights */}
        <pointLight position={[75, 40, -25]} intensity={1.8} color="#FDE68A" distance={320} />
        <pointLight position={[-60, -20, -20]} intensity={1.2} color="#60A5FA" distance={280} />

        {/* 3D Diagonal Milky Way Stream */}
        <MilkyWayArch3D particleCount={particleCount} />
      </Canvas>

      {/*
        PRO CONTRAST SCRIM:
        A radial backdrop mask tailored specifically for text clarity:
        - Keeps the central hero text zone deep midnight with high contrast
        - Lets the sweeping Milky Way stardust band shine brightly around the periphery and behind glass cards
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 46% 36% at 50% 34%, rgba(3, 6, 17, 0.70) 0%, rgba(3, 6, 17, 0.45) 45%, rgba(3, 6, 17, 0.08) 85%, transparent 100%)'
        }}
      />
    </div>
  );
};
