import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Compass,
  Camera,
  Sparkles,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Navigation2,
  Target,
  ChevronRight,
  ArrowUpRight,
  Crosshair,
  Volume2,
  VolumeX,
  Eye
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAstronomy } from '../../app/providers/AstronomyContext';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import { STARS_CATALOGUE } from '../../astronomy/catalogues/stars';
import { SOLAR_SYSTEM_OBJECTS } from '../../astronomy/catalogues/planets';
import {
  equatorialToHorizontal,
  calculatePlanetEquatorial
} from '../../astronomy/calculations/astronomyEngine';
import { projectCelestialToScreen } from '../../astronomy/coordinates/coordinateMath';
import { CelestialObject, HorizontalCoordinates } from '../../astronomy/types';
import { CompanionHost, CompanionPacket, generatePairingCode } from '../../services/companion/companionBridge';

export const SkyExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { preferences } = useUserPreferences();
  const { observationDate } = useAstronomy();

  // Video and Stream State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unsupported'>('idle');

  // Device Orientation State (Heading 0..360, Pitch -90..90, Roll -180..180)
  const [orientation, setOrientation] = useState<{ heading: number; pitch: number; roll: number }>({
    heading: 0,
    pitch: 25, // Start with natural 25° forward elevation
    roll: 0
  });

  // Manual Drag Navigation (Fallback)
  const isDragging = useRef(false);
  const lastDragPos = useRef({ x: 0, y: 0 });
  const [isManualControl, setIsManualControl] = useState(false);

  // Target Finder & Guiding Arrow System
  const [targetObject, setTargetObject] = useState<CelestialObject | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [fov, setFov] = useState(65);
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);

  // Companion Phone Sync Mode (Clean & Instant)
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [companionRoomId, setCompanionRoomId] = useState<string>(() => generatePairingCode());
  const [companionStatus, setCompanionStatus] = useState<'waiting' | 'connected'>('waiting');
  const [isSimulatingPhone, setIsSimulatingPhone] = useState(false);
  const companionHostRef = useRef<CompanionHost | null>(null);

  // Default target: Jupiter or Mars or brightest visible object
  useEffect(() => {
    const targetId = searchParams.get('target');
    if (targetId) {
      const star = STARS_CATALOGUE.find((s) => s.id === targetId);
      const planet = SOLAR_SYSTEM_OBJECTS.find((p) => p.id === targetId);
      if (planet) {
        setTargetObject(planet);
        setSelectedObject(planet);
      } else if (star) {
        setTargetObject(star);
        setSelectedObject(star);
      }
    } else {
      // Default guide to Mars or Sirius
      const defaultTarget = SOLAR_SYSTEM_OBJECTS.find((p) => p.id === 'body-mars') || STARS_CATALOGUE[0];
      setTargetObject(defaultTarget);
    }

    if (searchParams.get('mode') === 'pair') {
      setIsCompanionModalOpen(true);
    }
  }, [searchParams]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (companionHostRef.current) companionHostRef.current.destroy();
    };
  }, [stream]);

  // Simulated phone motion for instant desktop testing
  useEffect(() => {
    if (!isSimulatingPhone) return;

    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.03;
      setOrientation({
        heading: (180 + Math.sin(angle) * 45 + 360) % 360,
        pitch: 30 + Math.cos(angle * 1.5) * 20,
        roll: Math.sin(angle) * 5
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSimulatingPhone]);

  // Start Camera Stream
  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      return;
    }

    try {
      setCameraState('requesting');
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(newStream);
      setCameraState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }

      bindOrientationSensors();
    } catch (err: any) {
      console.warn('Camera permission denied or camera unavailable:', err);
      setCameraState('denied');
    }
  };

  // Device Orientation Listener
  const bindOrientationSensors = () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission().catch(() => {});
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null) return;

      let heading = 0;
      if ((e as any).webkitCompassHeading) {
        heading = (e as any).webkitCompassHeading;
      } else {
        heading = (360 - (e.alpha || 0)) % 360;
      }

      const altitude = 90 - (e.beta || 0);

      setOrientation({
        heading,
        pitch: altitude,
        roll: e.gamma || 0
      });
      setIsManualControl(false);
    };

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
  };

  // Companion Host Initialization
  const setupCompanionHost = () => {
    const host = new CompanionHost(companionRoomId);
    companionHostRef.current = host;

    host.init(
      () => {
        setCompanionStatus('connected');
      },
      (packet: CompanionPacket) => {
        if (packet.type === 'motion') {
          setOrientation({
            heading: packet.heading,
            pitch: packet.pitch,
            roll: packet.roll
          });
          setIsManualControl(false);
        }
      },
      (remoteStream: MediaStream) => {
        setStream(remoteStream);
        setCameraState('active');
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.play();
        }
      },
      (err) => console.warn('Companion notice:', err.message)
    );
  };

  // Manual Drag Navigation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastDragPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setIsManualControl(true);

    const deltaX = e.clientX - lastDragPos.current.x;
    const deltaY = e.clientY - lastDragPos.current.y;
    lastDragPos.current = { x: e.clientX, y: e.clientY };

    setOrientation((prev) => {
      const newHeading = (prev.heading - deltaX * 0.18 + 360) % 360;
      const newPitch = Math.max(-85, Math.min(85, prev.pitch + deltaY * 0.18));
      return { ...prev, heading: newHeading, pitch: newPitch };
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Calculate current horizontal Alt/Az for target object
  const targetHor = useMemo<HorizontalCoordinates | null>(() => {
    if (!targetObject) return null;
    let eq = targetObject.coordinates;
    if (targetObject.type === 'planet' || targetObject.type === 'sun' || targetObject.type === 'moon') {
      try {
        const comp = calculatePlanetEquatorial(targetObject.name as any, observationDate, preferences.location);
        eq = { rightAscension: comp.rightAscension, declination: comp.declination };
      } catch {}
    }
    return equatorialToHorizontal(eq, preferences.location, observationDate);
  }, [targetObject, observationDate, preferences.location]);

  // Compute Direction Guidance Arrow & Movement Instructions
  const guidance = useMemo(() => {
    if (!targetHor) return null;

    // Relative azimuth difference (-180 to +180)
    let deltaAz = targetHor.azimuth - orientation.heading;
    while (deltaAz > 180) deltaAz -= 360;
    while (deltaAz < -180) deltaAz += 360;

    // Relative altitude difference
    const deltaAlt = targetHor.altitude - orientation.pitch;

    // Angular distance in degrees
    const angularDist = Math.sqrt(deltaAz * deltaAz + deltaAlt * deltaAlt);
    const isTargetLocked = angularDist < 7.5; // Within center reticle

    // Guidance arrow angle in 2D screen space (radians & degrees)
    // Positive deltaAz is right (+X), positive deltaAlt is up (-Y in screen space)
    const arrowAngleRad = Math.atan2(-deltaAlt, deltaAz);
    const arrowAngleDeg = (arrowAngleRad * 180) / Math.PI + 90; // Align with top-facing arrow

    // Human-readable movement suggestion
    const turnText = deltaAz > 5 ? `Pan Right ${Math.abs(deltaAz).toFixed(0)}°` : deltaAz < -5 ? `Pan Left ${Math.abs(deltaAz).toFixed(0)}°` : 'Heading Aligned';
    const tiltText = deltaAlt > 4 ? `Tilt Up ${Math.abs(deltaAlt).toFixed(0)}°` : deltaAlt < -4 ? `Tilt Down ${Math.abs(deltaAlt).toFixed(0)}°` : 'Altitude Aligned';

    return {
      deltaAz,
      deltaAlt,
      angularDist,
      isTargetLocked,
      arrowAngleDeg,
      turnText,
      tiltText
    };
  }, [targetHor, orientation]);

  // Compute screen projected coordinates for all celestial objects
  const visibleObjectsWithScreenPos = useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;

    const list: { object: CelestialObject; hor: HorizontalCoordinates; x: number; y: number; inView: boolean }[] = [];

    // Stars
    STARS_CATALOGUE.forEach((star) => {
      const hor = equatorialToHorizontal(star.coordinates, preferences.location, observationDate);
      const proj = projectCelestialToScreen(hor, orientation.heading, orientation.pitch, width, height, fov);
      if (proj.inView) list.push({ object: star, hor, x: proj.x, y: proj.y, inView: true });
    });

    // Planets
    SOLAR_SYSTEM_OBJECTS.forEach((planet) => {
      let eq = planet.coordinates;
      try {
        const comp = calculatePlanetEquatorial(planet.name as any, observationDate, preferences.location);
        eq = { rightAscension: comp.rightAscension, declination: comp.declination };
      } catch {}

      const hor = equatorialToHorizontal(eq, preferences.location, observationDate);
      const proj = projectCelestialToScreen(hor, orientation.heading, orientation.pitch, width, height, fov);
      if (proj.inView) list.push({ object: planet, hor, x: proj.x, y: proj.y, inView: true });
    });

    return list;
  }, [preferences.location, observationDate, orientation, fov]);

  // Cardinal direction text
  const cardinalHeading = useMemo(() => {
    const h = orientation.heading;
    if (h >= 337.5 || h < 22.5) return 'N (0°)';
    if (h >= 22.5 && h < 67.5) return 'NE (45°)';
    if (h >= 67.5 && h < 112.5) return 'E (90°)';
    if (h >= 112.5 && h < 157.5) return 'SE (135°)';
    if (h >= 157.5 && h < 202.5) return 'S (180°)';
    if (h >= 202.5 && h < 247.5) return 'SW (225°)';
    if (h >= 247.5 && h < 292.5) return 'W (270°)';
    return 'NW (315°)';
  }, [orientation.heading]);

  // Sky sector description
  const skySectorName = useMemo(() => {
    const p = orientation.pitch;
    if (p > 65) return 'Zenith (Directly Overhead)';
    if (p < -10) return 'Ground / Below Horizon';
    const h = orientation.heading;
    const dir = h >= 315 || h < 45 ? 'Northern' : h < 135 ? 'Eastern' : h < 225 ? 'Southern' : 'Western';
    return `${dir} Sky (${p.toFixed(0)}° Altitude)`;
  }, [orientation]);

  const companionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/companion?room=${companionRoomId}`
    : `https://cosmora.space/companion?room=${companionRoomId}`;

  return (
    <div
      className="fixed inset-0 z-30 bg-[#030611] overflow-hidden select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Live Video Camera Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          cameraState === 'active' ? 'opacity-85' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Atmospheric Star Grid Background when camera is off */}
      {cameraState !== 'active' && (
        <div className="absolute inset-0 celestial-radar bg-[#071126]/60 flex items-center justify-center pointer-events-none">
          <div className="w-[520px] h-[520px] rounded-full border border-[#48D7FF]/15 flex items-center justify-center animate-spin-slow">
            <div className="w-[340px] h-[340px] rounded-full border border-dashed border-[#48D7FF]/25" />
          </div>
        </div>
      )}

      {/* ================= AR CELESTIAL OVERLAY ================= */}
      <div className="absolute inset-0 pointer-events-none">
        {visibleObjectsWithScreenPos.map(({ object, hor, x, y }) => {
          const isSelected = selectedObject?.id === object.id;
          const isTarget = targetObject?.id === object.id;
          const isPlanet = object.type === 'planet' || object.type === 'sun' || object.type === 'moon';

          return (
            <div
              key={object.id}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto'
              }}
              className="cursor-pointer group flex flex-col items-center"
              onClick={() => {
                setSelectedObject(object);
                setTargetObject(object);
              }}
            >
              {/* Reticle / Celestial Target Marker */}
              <div
                className={`relative flex items-center justify-center transition-transform duration-200 ${
                  isSelected || isTarget ? 'scale-125' : 'group-hover:scale-110'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full border transition-all ${
                    isTarget
                      ? 'border-[#48D7FF] ring-2 ring-[#48D7FF]/50 shadow-glow-cyan animate-pulse'
                      : isPlanet
                      ? 'border-[#F59E0B] border-dashed'
                      : 'border-white/40'
                  }`}
                />
                <div
                  className="w-3 h-3 rounded-full absolute"
                  style={{ backgroundColor: object.colorHex || '#EDF5FF' }}
                />
              </div>

              {/* Object Label */}
              {showLabels && (
                <div className={`mt-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider whitespace-nowrap border shadow-xl ${
                  isTarget
                    ? 'bg-[#163B70]/95 text-[#48D7FF] border-[#48D7FF]/70 shadow-glow-cyan/30'
                    : 'bg-black/80 text-[#EDF5FF] border-white/10'
                }`}>
                  <span className="font-semibold">{object.name}</span>
                  <span className="text-[9px] text-[#9EACC4] ml-1.5">
                    Alt {hor.altitude.toFixed(0)}°
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Center Screen Crosshair Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`relative w-20 h-20 transition-all duration-300 ${
          guidance?.isTargetLocked ? 'scale-110' : ''
        }`}>
          <div className={`reticle-corner top-0 left-0 border-t-2 border-l-2 ${guidance?.isTargetLocked ? 'border-emerald-400' : 'border-[#48D7FF]'}`} />
          <div className={`reticle-corner top-0 right-0 border-t-2 border-r-2 ${guidance?.isTargetLocked ? 'border-emerald-400' : 'border-[#48D7FF]'}`} />
          <div className={`reticle-corner bottom-0 left-0 border-b-2 border-l-2 ${guidance?.isTargetLocked ? 'border-emerald-400' : 'border-[#48D7FF]'}`} />
          <div className={`reticle-corner bottom-0 right-0 border-b-2 border-r-2 ${guidance?.isTargetLocked ? 'border-emerald-400' : 'border-[#48D7FF]'}`} />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-1.5 h-1.5 rounded-full ${guidance?.isTargetLocked ? 'bg-emerald-400 shadow-glow-cyan' : 'bg-[#48D7FF]'}`} />
          </div>

          {/* Target Locked Text Overlay */}
          {guidance?.isTargetLocked && targetObject && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono tracking-wider whitespace-nowrap animate-pulse">
              TARGET LOCKED: {targetObject.name.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* ================= DYNAMIC CAMERA DIRECTION GUIDANCE ARROW ================= */}
      {guidance && targetObject && !guidance.isTargetLocked && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center animate-in fade-in duration-300">
          <div className="p-1 rounded-2xl bg-gradient-to-r from-[#48D7FF]/30 to-[#3B82F6]/30 border border-[#48D7FF]/40 shadow-glow-cyan/40">
            <div className="px-5 py-2.5 rounded-[calc(1rem-0.125rem)] bg-[#071126]/95 backdrop-blur-xl flex items-center gap-3.5">
              {/* 360° Direction Guidance Arrow */}
              <div
                className="w-9 h-9 rounded-full bg-[#163B70] border border-[#48D7FF] flex items-center justify-center shadow-glow-cyan transition-transform duration-300"
                style={{ transform: `rotate(${guidance.arrowAngleDeg}deg)` }}
              >
                <Navigation2 className="w-5 h-5 text-[#48D7FF] fill-[#48D7FF]" />
              </div>

              {/* Guiding Movement Instruction Text */}
              <div className="flex flex-col">
                <div className="text-xs font-mono font-bold text-[#EDF5FF] flex items-center gap-2">
                  <span className="text-[#48D7FF]">Point towards {targetObject.name}:</span>
                  <span className="text-emerald-400">{guidance.angularDist.toFixed(0)}° away</span>
                </div>
                <div className="text-[11px] font-mono text-[#9EACC4] flex items-center gap-2">
                  <span>{guidance.turnText}</span>
                  <span className="text-white/20">•</span>
                  <span>{guidance.tiltText}</span>
                </div>
              </div>

              {/* Target Switcher dropdown */}
              <select
                value={targetObject.id}
                onChange={(e) => {
                  const found = SOLAR_SYSTEM_OBJECTS.find((p) => p.id === e.target.value) || STARS_CATALOGUE.find((s) => s.id === e.target.value);
                  if (found) {
                    setTargetObject(found);
                    setSelectedObject(found);
                  }
                }}
                className="ml-2 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-[#48D7FF] focus:outline-none cursor-pointer"
              >
                <optgroup label="Planets">
                  {SOLAR_SYSTEM_OBJECTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Bright Stars">
                  {STARS_CATALOGUE.slice(0, 10).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.magnitude.toFixed(1)}m)</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ================= HUD TOP STATUS BAR ================= */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Exit AR */}
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-full glass-panel border border-white/15 text-[#EDF5FF] hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <X className="w-4 h-4" />
          <span className="text-xs font-mono hidden sm:inline">Exit AR</span>
        </button>

        {/* Real-time Compass Tape & Sector Readout */}
        <div className="px-4 py-2 rounded-full glass-panel-glow border border-[#48D7FF]/35 flex items-center gap-3 text-xs font-mono text-[#EDF5FF] shadow-2xl">
          <div className="flex items-center gap-1.5 text-[#48D7FF]">
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span className="font-bold">{cardinalHeading}</span>
          </div>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-[#9EACC4] hidden sm:inline truncate max-w-[200px]">
            {skySectorName}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs font-semibold text-emerald-400">
            {visibleObjectsWithScreenPos.length} in View
          </span>
        </div>

        {/* Camera Start / Pair Phone */}
        <div className="flex items-center gap-2">
          {cameraState !== 'active' ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-bold text-xs font-mono shadow-glow-cyan flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (stream) stream.getTracks().forEach((t) => t.stop());
                setStream(null);
                setCameraState('idle');
              }}
              className="p-2 rounded-full glass-panel text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all"
              title="Stop Camera Stream"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          {/* Connect Phone Button */}
          <button
            onClick={() => {
              setIsCompanionModalOpen(true);
              if (!companionHostRef.current) setupCompanionHost();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-full glass-panel border border-[#48D7FF]/35 text-[#48D7FF] text-xs font-mono flex items-center gap-1.5 hover:bg-[#163B70]/50 transition-all cursor-pointer"
            title="Connect your mobile phone as wireless lens"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">Pair Phone</span>
          </button>
        </div>
      </div>

      {/* ================= HUD RIGHT CONTROLS ================= */}
      <div className="absolute right-4 top-20 z-40 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`p-2.5 rounded-full glass-panel border transition-all ${
            showLabels ? 'border-[#48D7FF]/50 text-[#48D7FF]' : 'border-white/10 text-[#9EACC4]'
          }`}
          title="Toggle Celestial Labels"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setOrientation({ heading: 0, pitch: 30, roll: 0 });
            setIsManualControl(false);
          }}
          className="p-2.5 rounded-full glass-panel border border-white/10 text-[#9EACC4] hover:text-[#EDF5FF]"
          title="Recalibrate Compass (North)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setFov((prev) => Math.max(35, prev - 10))}
          className="p-2.5 rounded-full glass-panel border border-white/10 text-[#9EACC4] hover:text-[#EDF5FF]"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setFov((prev) => Math.min(100, prev + 10))}
          className="p-2.5 rounded-full glass-panel border border-white/10 text-[#9EACC4] hover:text-[#EDF5FF]"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* ================= SELECTED OBJECT BOTTOM DRAWER ================= */}
      {selectedObject && (
        <div className="absolute bottom-6 left-4 right-4 max-w-lg mx-auto z-40 pointer-events-auto animate-in slide-in-from-bottom duration-300">
          <div className="p-1 rounded-[1.8rem] bg-gradient-to-r from-[#48D7FF]/30 to-[#3B82F6]/30 border border-white/20 shadow-2xl">
            <div className="p-4 sm:p-5 rounded-[calc(1.8rem-0.25rem)] bg-[#071126]/95 backdrop-blur-2xl flex flex-col space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-display text-[#EDF5FF]">
                      {selectedObject.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#163B70] text-[#48D7FF]">
                      {selectedObject.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#9EACC4] font-mono mt-0.5">
                    {selectedObject.latinName || selectedObject.designation || 'Celestial Target'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedObject(null)}
                  className="p-1 text-[#9EACC4] hover:text-[#EDF5FF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#EDF5FF]/85 leading-relaxed line-clamp-2">
                {selectedObject.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#9EACC4] pt-1">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-[10px] block text-[#9EACC4]/60">Magnitude</span>
                  <strong className="text-[#EDF5FF]">{selectedObject.magnitude.toFixed(1)}m</strong>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-[10px] block text-[#9EACC4]/60">Coordinates</span>
                  <strong className="text-[#EDF5FF]">
                    {selectedObject.coordinates.declination >= 0 ? '+' : ''}
                    {selectedObject.coordinates.declination.toFixed(1)}° Dec
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => navigate(`/object/${selectedObject.id}`)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-xs font-mono flex items-center justify-center gap-1.5 shadow-glow-cyan"
                >
                  <span>Detailed Telemetry</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate(`/universe?focus=${selectedObject.id}`)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-[#EDF5FF] border border-white/10"
                >
                  View in 3D
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAIR PHONE MODAL (CLEAN & INSTANT, NO TECH JARGON) ================= */}
      {isCompanionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl glass-panel-glow border border-white/20 p-6 flex flex-col space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#163B70] border border-[#48D7FF]/40 flex items-center justify-center shadow-glow-cyan/30">
                  <Smartphone className="w-5 h-5 text-[#48D7FF]" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-[#EDF5FF]">
                    Pair Your Phone
                  </h3>
                  <p className="text-[11px] text-[#9EACC4] font-mono">
                    Wireless Sky Compass & Camera
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompanionModalOpen(false)}
                className="p-1.5 rounded-full text-[#9EACC4] hover:text-[#EDF5FF] hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9EACC4] leading-relaxed">
              Use your phone as a motion pointer for this screen. Scan the code, point your phone at any star, and watch this screen smoothly track your view.
            </p>

            {/* Instant QR Code Display */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
              <div className="p-3.5 bg-white rounded-2xl shadow-2xl">
                <QRCodeSVG value={companionUrl} size={180} level="M" />
              </div>

              <div className="text-center space-y-1">
                <div className="text-xs font-mono text-[#9EACC4]">
                  Pairing Code: <strong className="text-[#48D7FF] text-sm tracking-wider font-bold">{companionRoomId}</strong>
                </div>
                <div className="text-[10px] text-[#9EACC4]/70">
                  Scan with default Camera app on iOS or Android
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 text-xs font-mono pt-1">
                {companionStatus === 'connected' ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Phone Connected & Synchronized!
                  </span>
                ) : (
                  <span className="text-[#9EACC4] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#48D7FF] animate-ping" />
                    Waiting for camera scan...
                  </span>
                )}
              </div>
            </div>

            {/* Testing Options & Laptop Fallback */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={companionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#48D7FF] border border-white/10 flex items-center justify-center gap-1.5 text-center transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test in New Tab</span>
                </a>

                <button
                  onClick={() => {
                    setIsSimulatingPhone(!isSimulatingPhone);
                    setIsCompanionModalOpen(false);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-mono border flex items-center justify-center gap-1.5 transition-all ${
                    isSimulatingPhone
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-white/5 hover:bg-white/10 text-[#EDF5FF] border-white/10'
                  }`}
                >
                  <Navigation2 className="w-3.5 h-3.5 text-[#48D7FF]" />
                  <span>{isSimulatingPhone ? 'Stop Simulation' : 'Simulate Motion'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsCompanionModalOpen(false);
                  startCamera();
                }}
                className="w-full py-2.5 rounded-xl bg-[#163B70]/40 hover:bg-[#163B70] text-xs font-mono text-[#EDF5FF] border border-white/10 transition-all"
              >
                Use Laptop Integrated Webcam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
