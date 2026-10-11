import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialObject, ConstellationData } from '../../astronomy/types';
import { STARS_CATALOGUE } from '../../astronomy/catalogues/stars';
import { SOLAR_SYSTEM_OBJECTS } from '../../astronomy/catalogues/planets';
import { CONSTELLATIONS_CATALOGUE } from '../../astronomy/catalogues/constellations';
import { equatorialToCartesian } from '../../astronomy/coordinates/coordinateMath';
import { calculatePlanetEquatorial } from '../../astronomy/calculations/astronomyEngine';
import { Planet3D } from '../objects/Planet3D';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';

export type PlanetariumViewMode = 'skydome' | 'solarsystem';

interface PlanetariumSceneProps {
  viewMode: PlanetariumViewMode;
  selectedObject: CelestialObject | null;
  onSelectObject: (obj: CelestialObject) => void;
  observationDate: Date;
  focusedObjectId?: string | null;
}

// 3D Constellation connecting lines
const ConstellationLines: React.FC<{
  constellations: ConstellationData[];
  starsMap: Map<string, THREE.Vector3>;
  visible: boolean;
}> = ({ constellations, starsMap, visible }) => {
  const lineSegments = useMemo(() => {
    if (!visible) return null;
    const points: THREE.Vector3[] = [];

    constellations.forEach((c) => {
      c.lines.forEach(([startId, endId]) => {
        const p1 = starsMap.get(startId);
        const p2 = starsMap.get(endId);
        if (p1 && p2) {
          points.push(p1);
          points.push(p2);
        }
      });
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [constellations, starsMap, visible]);

  if (!visible || !lineSegments) return null;

  return (
    <lineSegments geometry={lineSegments}>
      <lineBasicMaterial
        color="#48D7FF"
        transparent
        opacity={0.35}
        linewidth={1.5}
      />
    </lineSegments>
  );
};

// Camera Controller for smooth focusing
const CameraController: React.FC<{
  targetPosition: THREE.Vector3 | null;
  defaultPosition: [number, number, number];
}> = ({ targetPosition, defaultPosition }) => {
  const controlsRef = useRef<any>(null);

  useFrame((state) => {
    if (controlsRef.current) {
      if (targetPosition) {
        // Smoothly lerp camera lookAt target to object
        controlsRef.current.target.lerp(targetPosition, 0.05);
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={10}
      maxDistance={800}
      makeDefault
    />
  );
};

export const PlanetariumScene: React.FC<PlanetariumSceneProps> = ({
  viewMode,
  selectedObject,
  onSelectObject,
  observationDate,
  focusedObjectId
}) => {
  const { preferences } = useUserPreferences();
  const [hoveredObject, setHoveredObject] = useState<CelestialObject | null>(null);

  // Map stars onto a celestial sphere (Radius = 320)
  const starSphereRadius = 320;

  const { starPositions, starsWithVectors, starsMap } = useMemo(() => {
    const vectorsMap = new Map<string, THREE.Vector3>();
    const starsList: { object: CelestialObject; vector: THREE.Vector3 }[] = [];

    STARS_CATALOGUE.forEach((star) => {
      const vec = equatorialToCartesian(star.coordinates, starSphereRadius);
      vectorsMap.set(star.id, vec);
      starsList.push({ object: star, vector: vec });
    });

    return {
      starPositions: starsList,
      starsWithVectors: starsList,
      starsMap: vectorsMap
    };
  }, [starSphereRadius]);

  // Compute instantaneous planetary positions for the observation date
  const dynamicPlanets = useMemo(() => {
    return SOLAR_SYSTEM_OBJECTS.map((planet) => {
      if (planet.id === 'body-sun') {
        return {
          object: planet,
          vectorSky: new THREE.Vector3(0, 0, 0),
          vectorSolar: new THREE.Vector3(0, 0, 0),
          orbitRadius: 0
        };
      }

      const bodyName = planet.name as any;
      let eq = planet.coordinates;
      let distAu = planet.coordinates.distanceAu || 1;

      try {
        const computed = calculatePlanetEquatorial(bodyName, observationDate);
        eq = { rightAscension: computed.rightAscension, declination: computed.declination };
        if (computed.distanceAu) distAu = computed.distanceAu;
      } catch {
        // Fallback to static catalogue
      }

      // SkyDome position on celestial sphere
      const vectorSky = equatorialToCartesian(eq, starSphereRadius * 0.85);

      // Heliocentric solar system position (log-scaled AU for usability)
      const orbitRadius = Math.log(distAu + 1.2) * 45 + 15;
      const angle = (observationDate.getTime() / (planet.orbitalPeriodDays || 365) / 86400000) * Math.PI * 2;
      const vectorSolar = new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius
      );

      const updatedObj: CelestialObject = {
        ...planet,
        coordinates: eq
      };

      return {
        object: updatedObj,
        vectorSky,
        vectorSolar,
        orbitRadius
      };
    });
  }, [observationDate, starSphereRadius]);

  // Target position for camera focusing
  const targetFocusPosition = useMemo(() => {
    if (!focusedObjectId) return null;

    // Check stars
    const star = starsWithVectors.find((s) => s.object.id === focusedObjectId);
    if (star) return star.vector;

    // Check planets
    const planet = dynamicPlanets.find((p) => p.object.id === focusedObjectId);
    if (planet) {
      return viewMode === 'solarsystem' ? planet.vectorSolar : planet.vectorSky;
    }

    return null;
  }, [focusedObjectId, starsWithVectors, dynamicPlanets, viewMode]);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 60, 220], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={typeof window !== 'undefined' ? [1, Math.min(window.devicePixelRatio, 2)] : 1}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} intensity={2.5} color="#FBBF24" />
        <directionalLight position={[100, 150, 80]} intensity={0.8} />

        <CameraController
          targetPosition={targetFocusPosition}
          defaultPosition={[0, 60, 220]}
        />

        {/* ================= SKY DOME MODE ================= */}
        {viewMode === 'skydome' && (
          <>
            {/* Celestial Stars */}
            {starPositions.map(({ object, vector }) => {
              const isSelected = selectedObject?.id === object.id;
              const isHovered = hoveredObject?.id === object.id;
              const starSize = Math.max(1.0, 3.8 - (object.magnitude + 1.5) * 0.5);

              return (
                <group key={object.id} position={[vector.x, vector.y, vector.z]}>
                  <mesh
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectObject(object);
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      setHoveredObject(object);
                    }}
                    onPointerOut={() => setHoveredObject(null)}
                  >
                    <sphereGeometry args={[starSize, 16, 16]} />
                    <meshBasicMaterial
                      color={object.colorHex || '#EDF5FF'}
                    />
                  </mesh>

                  {/* Pulsing selection ring */}
                  {(isSelected || isHovered) && (
                    <mesh scale={1.8}>
                      <ringGeometry args={[starSize * 1.5, starSize * 2.2, 32]} />
                      <meshBasicMaterial
                        color={isSelected ? '#48D7FF' : '#3B82F6'}
                        side={THREE.DoubleSide}
                        transparent
                        opacity={0.8}
                      />
                    </mesh>
                  )}

                  {/* 3D Celestial Label */}
                  {preferences.showStarLabels && (isSelected || isHovered || object.magnitude < 1.0) && (
                    <Html distanceFactor={140} position={[0, starSize + 2, 0]} center>
                      <div className={`px-2 py-0.5 rounded text-[11px] font-mono tracking-wider whitespace-nowrap pointer-events-none transition-all ${
                        isSelected 
                          ? 'bg-[#48D7FF]/20 text-[#48D7FF] border border-[#48D7FF]/60 shadow-glow-cyan' 
                          : 'bg-black/60 text-[#EDF5FF]/90 border border-white/10'
                      }`}>
                        {object.name} ({object.magnitude.toFixed(1)}m)
                      </div>
                    </Html>
                  )}
                </group>
              );
            })}

            {/* Constellation Lines */}
            <ConstellationLines
              constellations={CONSTELLATIONS_CATALOGUE}
              starsMap={starsMap}
              visible={preferences.showConstellationLines}
            />

            {/* Planets in the Sky Dome */}
            {dynamicPlanets.map(({ object, vectorSky }) => {
              const isSelected = selectedObject?.id === object.id;
              const isHovered = hoveredObject?.id === object.id;
              const planetRadius = object.id === 'body-sun' ? 6 : object.id.includes('jupiter') || object.id.includes('saturn') ? 4 : 2.5;

              return (
                <group key={object.id} position={[vectorSky.x, vectorSky.y, vectorSky.z]}>
                  <Planet3D
                    object={object}
                    radius={planetRadius}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    onClick={() => onSelectObject(object)}
                    onPointerOver={() => setHoveredObject(object)}
                    onPointerOut={() => setHoveredObject(null)}
                  />
                  {preferences.showStarLabels && (
                    <Html distanceFactor={140} position={[0, planetRadius + 3, 0]} center>
                      <div className={`px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider whitespace-nowrap pointer-events-none ${
                        isSelected
                          ? 'bg-[#48D7FF]/20 text-[#48D7FF] border border-[#48D7FF]/60 shadow-glow-cyan'
                          : 'bg-[#071126]/80 text-[#EDF5FF] border border-white/20'
                      }`}>
                        {object.name}
                      </div>
                    </Html>
                  )}
                </group>
              );
            })}
          </>
        )}

        {/* ================= SOLAR SYSTEM MODE ================= */}
        {viewMode === 'solarsystem' && (
          <>
            {/* Sun at Center */}
            <Planet3D
              object={SOLAR_SYSTEM_OBJECTS[0]}
              radius={8}
              position={[0, 0, 0]}
              isSelected={selectedObject?.id === 'body-sun'}
              onClick={() => onSelectObject(SOLAR_SYSTEM_OBJECTS[0])}
            />

            {/* Orbit paths & Planets */}
            {dynamicPlanets.map(({ object, vectorSolar, orbitRadius }) => {
              if (object.id === 'body-sun') return null;
              const isSelected = selectedObject?.id === object.id;
              const isHovered = hoveredObject?.id === object.id;

              return (
                <group key={object.id}>
                  {/* Orbit Ring */}
                  {preferences.showPlanetOrbits && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[orbitRadius - 0.2, orbitRadius + 0.2, 128]} />
                      <meshBasicMaterial
                        color="#3B82F6"
                        transparent
                        opacity={0.2}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}

                  {/* Planet body at its orbital coordinate */}
                  <group position={[vectorSolar.x, vectorSolar.y, vectorSolar.z]}>
                    <Planet3D
                      object={object}
                      radius={
                        object.id === 'body-jupiter' ? 3.8 :
                        object.id === 'body-saturn' ? 3.4 :
                        object.id === 'body-uranus' || object.id === 'body-neptune' ? 2.6 : 1.8
                      }
                      isSelected={isSelected}
                      isHovered={isHovered}
                      onClick={() => onSelectObject(object)}
                      onPointerOver={() => setHoveredObject(object)}
                      onPointerOut={() => setHoveredObject(null)}
                    />
                    <Html distanceFactor={90} position={[0, 4, 0]} center>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider pointer-events-none whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#48D7FF]/25 text-[#48D7FF] border border-[#48D7FF]/60'
                          : 'bg-black/70 text-[#EDF5FF]/90 border border-white/10'
                      }`}>
                        {object.name}
                      </div>
                    </Html>
                  </group>
                </group>
              );
            })}
          </>
        )}
      </Canvas>
    </div>
  );
};
