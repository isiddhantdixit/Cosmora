import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CelestialObject } from '../../astronomy/types';

interface Planet3DProps {
  object: CelestialObject;
  radius?: number;
  position?: [number, number, number];
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  showRings?: boolean;
}

export const Planet3D: React.FC<Planet3DProps> = ({
  object,
  radius = 2.0,
  position = [0, 0, 0],
  isSelected = false,
  isHovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
  showRings = true
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Rotation speed derived from rotational period (or sensible baseline)
  const rotationSpeed = useMemo(() => {
    if (object.id === 'body-sun') return 0.003;
    if (object.rotationPeriodHours) {
      return (24 / Math.abs(object.rotationPeriodHours)) * 0.005;
    }
    return 0.006;
  }, [object]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * (rotationSpeed * 0.5);
    }
  });

  // Material & texture styling based on planet characteristics
  const materialProps = useMemo(() => {
    const isSun = object.id === 'body-sun';
    const baseColor = new THREE.Color(object.colorHex || '#EDF5FF');

    if (isSun) {
      return {
        color: baseColor,
        emissive: new THREE.Color('#F59E0B'),
        emissiveIntensity: 1.8,
        roughness: 0.1,
        metalness: 0.0
      };
    }

    return {
      color: baseColor,
      roughness: object.id.includes('gas') || object.id === 'body-jupiter' || object.id === 'body-saturn' ? 0.3 : 0.8,
      metalness: 0.05,
      bumpScale: 0.05
    };
  }, [object]);

  // Procedural Saturn Ring Geometry
  const ringGeometry = useMemo(() => {
    if (object.id !== 'body-saturn' || !showRings) return null;
    return new THREE.RingGeometry(radius * 1.4, radius * 2.5, 64);
  }, [object.id, radius, showRings]);

  return (
    <group position={position}>
      {/* Interactive Hit & Visual Mesh */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver?.();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut?.();
        }}
      >
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* Saturn's Rings */}
      {ringGeometry && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2.3, 0.2, 0]}>
          <primitive object={ringGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#E2D4A8"
            roughness={0.7}
            metalness={0.1}
            side={THREE.DoubleSide}
            transparent
            opacity={0.88}
          />
        </mesh>
      )}

      {/* Sun Solar Corona / Atmospheric Glow */}
      {object.id === 'body-sun' && (
        <mesh ref={glowRef} scale={1.2}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshBasicMaterial
            color="#FBBF24"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Selection / Hover Aura Indicator */}
      {(isSelected || isHovered) && (
        <mesh scale={isSelected ? 1.35 : 1.2}>
          <sphereGeometry args={[radius, 24, 24]} />
          <meshBasicMaterial
            color={isSelected ? '#48D7FF' : '#3B82F6'}
            wireframe
            transparent
            opacity={isSelected ? 0.6 : 0.3}
          />
        </mesh>
      )}
    </group>
  );
};
