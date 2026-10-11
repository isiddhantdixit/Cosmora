import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Compass,
  Camera,
  Layers,
  Sparkles,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  Smartphone,
  Info,
  Sliders,
  AlertCircle,
  Eye,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAstronomy } from '../../app/providers/AstronomyContext';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import { STARS_CATALOGUE } from '../../astronomy/catalogues/stars';
import { SOLAR_SYSTEM_OBJECTS } from '../../astronomy/catalogues/planets';
import { CONSTELLATIONS_CATALOGUE } from '../../astronomy/catalogues/constellations';
import {
  equatorialToHorizontal,
  calculatePlanetEquatorial
} from '../../astronomy/calculations/astronomyEngine';
import { projectCelestialToScreen } from '../../astronomy/coordinates/coordinateMath';
import { CelestialObject, HorizontalCoordinates } from '../../astronomy/types';
import { CompanionHost, CompanionPacket } from '../../services/companion/companionBridge';

export const SkyExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { preferences } = useUserPreferences();
  const { observationDate } = useAstronomy();

  // Video and Stream State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unsupported'>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Device Orientation State (Heading, Pitch, Roll in degrees)
  const [orientation, setOrientation] = useState<{ heading: number; pitch: number; roll: number }>({
    heading: 0,
    pitch: 30, // Default 30° elevation facing north
    roll: 0
  });
  const [hasSensorData, setHasSensorData] = useState(false);
  const [sensorPermission, setSensorPermission] = useState<'granted' | 'prompt' | 'denied'>('prompt');

  // Manual Drag Navigation (Joystick Fallback when sensors unavailable or on PC)
  const [isManualControl, setIsManualControl] = useState(false);
  const isDragging = useRef(false);
  const lastDragPos = useRef({ x: 0, y: 0 });

  // Display Settings in AR HUD
  const [showConstellations, setShowConstellations] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [fov, setFov] = useState(65); // Standard mobile camera horizontal FOV ~65°
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);

  // Companion Phone Sync Mode (for PC/Laptop)
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [companionRoomId, setCompanionRoomId] = useState<string>('');
  const [companionStatus, setCompanionStatus] = useState<'disconnected' | 'waiting' | 'connected'>('disconnected');
  const companionHostRef = useRef<CompanionHost | null>(null);

  // Check URL params for target or companion
  useEffect(() => {
    const targetId = searchParams.get('target');
    if (targetId) {
      const star = STARS_CATALOGUE.find((s) => s.id === targetId);
      const planet = SOLAR_SYSTEM_OBJECTS.find((p) => p.id === targetId);
      if (star) setSelectedObject(star);
      else if (planet) setSelectedObject(planet);
    }

    if (searchParams.get('mode') === 'pair') {
      setIsCompanionModalOpen(true);
    }
  }, [searchParams]);

  // Clean up camera stream when unmounting
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (companionHostRef.current) {
        companionHostRef.current.destroy();
      }
    };
  }, [stream]);

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
          facingMode: { ideal: facingMode },
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

      // Request iOS Device Orientation if needed
      requestDeviceOrientation();
    } catch (err: any) {
      console.warn('Camera permission denied or camera unavailable:', err);
      setCameraState('denied');
    }
  };

  // Device Orientation Handler
  const requestDeviceOrientation = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setSensorPermission('granted');
          bindOrientationListener();
        } else {
          setSensorPermission('denied');
        }
      } catch (err) {
        console.warn('iOS orientation permission error:', err);
        bindOrientationListener();
      }
    } else {
      bindOrientationListener();
    }
  };

  const bindOrientationListener = () => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null) return;
      setHasSensorData(true);

      // Compass heading calculation
      let heading = 0;
      if ((e as any).webkitCompassHeading) {
        // iOS provides true compass heading
        heading = (e as any).webkitCompassHeading;
      } else {
        // Android / standard compass estimation
        heading = (360 - (e.alpha || 0)) % 360;
      }

      // Beta: tilt front-to-back (-180 to 180). When pointing camera horizontally, beta is ~90°
      // Convert beta to sky altitude: 90° = 0° (horizon), 0° = +90° (zenith), 180° = -90° (nadir)
      const altitude = 90 - (e.beta || 0);

      setOrientation({
        heading,
        pitch: altitude,
        roll: e.gamma || 0
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  };

  // Setup Companion Host for PC
  const initializeCompanionSync = async () => {
    const host = new CompanionHost();
    companionHostRef.current = host;
    setCompanionRoomId(host.roomId);
    setCompanionStatus('waiting');

    try {
      await host.init(
        () => {
          setCompanionStatus('connected');
        },
        (packet: CompanionPacket) => {
          if (packet.type === 'motion') {
            setHasSensorData(true);
            setOrientation({
              heading: packet.heading,
              pitch: packet.pitch,
              roll: packet.roll
            });
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
        (err) => {
          console.warn('Companion Host error:', err);
        }
      );
    } catch (err) {
      console.error('Failed to init companion host:', err);
    }
  };

  // Manual Touch/Mouse Drag on Sky when not moving device
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

    // Update heading and pitch manually
    setOrientation((prev) => {
      let newHeading = (prev.heading - deltaX * 0.15 + 360) % 360;
      let newPitch = Math.max(-85, Math.min(85, prev.pitch + deltaY * 0.15));
      return { ...prev, heading: newHeading, pitch: newPitch };
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Compute instantaneous horizontal coordinates for all stars & planets
  const visibleObjectsWithScreenPos = useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;

    const list: { object: CelestialObject; hor: HorizontalCoordinates; x: number; y: number; inView: boolean }[] = [];

    // Stars
    STARS_CATALOGUE.forEach((star) => {
      const hor = equatorialToHorizontal(star.coordinates, preferences.location, observationDate);
      const proj = projectCelestialToScreen(
        hor,
        orientation.heading,
        orientation.pitch,
        width,
        height,
        fov
      );
      if (proj.inView) {
        list.push({ object: star, hor, x: proj.x, y: proj.y, inView: true });
      }
    });

    // Planets
    SOLAR_SYSTEM_OBJECTS.forEach((planet) => {
      let eq = planet.coordinates;
      try {
        const comp = calculatePlanetEquatorial(planet.name as any, observationDate, preferences.location);
        eq = { rightAscension: comp.rightAscension, declination: comp.declination };
      } catch {
        // Fallback
      }

      const hor = equatorialToHorizontal(eq, preferences.location, observationDate);
      const proj = projectCelestialToScreen(
        hor,
        orientation.heading,
        orientation.pitch,
        width,
        height,
        fov
      );
      if (proj.inView) {
        list.push({ object: planet, hor, x: proj.x, y: proj.y, inView: true });
      }
    });

    return list;
  }, [preferences.location, observationDate, orientation, fov]);

  // Cardinal direction label based on heading
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
      {/* ================= LIVE CAMERA FEED OR STAR MAP ================= */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          cameraState === 'active' ? 'opacity-85' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Atmospheric Star Grid Background when camera is off or initializing */}
      {cameraState !== 'active' && (
        <div className="absolute inset-0 celestial-radar bg-[#071126]/60 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full border border-[#48D7FF]/10 flex items-center justify-center animate-spin-slow">
            <div className="w-[320px] h-[320px] rounded-full border border-dashed border-[#48D7FF]/20" />
          </div>
        </div>
      )}

      {/* ================= AR CELESTIAL OVERLAY ================= */}
      <div className="absolute inset-0 pointer-events-none">
        {visibleObjectsWithScreenPos.map(({ object, hor, x, y }) => {
          const isSelected = selectedObject?.id === object.id;
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
              onClick={() => setSelectedObject(object)}
            >
              {/* Reticle / Celestial Target Marker */}
              <div
                className={`relative flex items-center justify-center transition-transform duration-200 ${
                  isSelected ? 'scale-125' : 'group-hover:scale-110'
                }`}
              >
                {/* Outer Targeting Rings */}
                <div
                  className={`w-8 h-8 rounded-full border transition-all ${
                    isSelected
                      ? 'border-[#48D7FF] ring-2 ring-[#48D7FF]/40 shadow-glow-cyan animate-pulse'
                      : isPlanet
                      ? 'border-[#F59E0B] border-dashed'
                      : 'border-white/40'
                  }`}
                />
                {/* Core Object Point */}
                <div
                  className="w-2.5 h-2.5 rounded-full absolute"
                  style={{ backgroundColor: object.colorHex || '#EDF5FF' }}
                />
              </div>

              {/* Object Label */}
              {showLabels && (
                <div className={`mt-1.5 px-2 py-0.5 rounded text-[11px] font-mono tracking-wider whitespace-nowrap border shadow-lg ${
                  isSelected
                    ? 'bg-[#163B70]/90 text-[#48D7FF] border-[#48D7FF]/60'
                    : 'bg-black/75 text-[#EDF5FF] border-white/10'
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

      {/* Center Screen Reticle Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-16 h-16">
          <div className="reticle-corner top-0 left-0 border-t-2 border-l-2" />
          <div className="reticle-corner top-0 right-0 border-t-2 border-r-2" />
          <div className="reticle-corner bottom-0 left-0 border-b-2 border-l-2" />
          <div className="reticle-corner bottom-0 right-0 border-b-2 border-r-2" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#48D7FF] shadow-glow-cyan" />
          </div>
        </div>
      </div>

      {/* ================= HUD TOP BAR ================= */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Back / Exit Button */}
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-full glass-panel border border-white/15 text-[#EDF5FF] hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          <span className="text-xs font-mono hidden sm:inline">Exit AR</span>
        </button>

        {/* Real-time Compass & Pitch Telemetry */}
        <div className="px-4 py-1.5 rounded-full glass-panel-glow border border-[#48D7FF]/30 flex items-center gap-3 text-xs font-mono text-[#EDF5FF]">
          <div className="flex items-center gap-1.5 text-[#48D7FF]">
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span className="font-bold">{cardinalHeading}</span>
          </div>
          <span className="text-white/20">|</span>
          <span className="text-[#9EACC4]">
            Pitch: <strong className="text-[#EDF5FF]">{orientation.pitch.toFixed(1)}°</strong>
          </span>
          {isManualControl && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono hidden sm:inline">
              Drag Nav
            </span>
          )}
        </div>

        {/* Camera Activation / Companion Connect */}
        <div className="flex items-center gap-2">
          {cameraState !== 'active' ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-xs font-mono shadow-glow-cyan flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
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
              title="Stop Camera"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          {/* Pair Mobile Phone Camera Trigger */}
          <button
            onClick={() => {
              setIsCompanionModalOpen(true);
              if (!companionHostRef.current) initializeCompanionSync();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-full glass-panel border border-[#48D7FF]/30 text-[#48D7FF] text-xs font-mono flex items-center gap-1.5 hover:bg-[#163B70]/50 transition-all"
            title="Use Smartphone Camera on this Laptop/PC"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">Pair Mobile</span>
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
          title="Recalibrate Compass / North"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setFov((prev) => Math.max(35, prev - 10))}
          className="p-2.5 rounded-full glass-panel border border-white/10 text-[#9EACC4] hover:text-[#EDF5FF]"
          title="Zoom In (Decrease FOV)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setFov((prev) => Math.min(100, prev + 10))}
          className="p-2.5 rounded-full glass-panel border border-white/10 text-[#9EACC4] hover:text-[#EDF5FF]"
          title="Zoom Out (Increase FOV)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* ================= BOTTOM SELECTED OBJECT DRAWER ================= */}
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

              <p className="text-xs text-[#EDF5FF]/80 leading-relaxed line-clamp-2">
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
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-xs font-mono flex items-center justify-center gap-1.5 shadow-glow-cyan"
                >
                  <span>Detailed Telemetry</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate(`/universe?focus=${selectedObject.id}`)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-[#EDF5FF] border border-white/10"
                >
                  View in 3D
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPANION PAIRING MODAL (FOR PC SCREEN) ================= */}
      {isCompanionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl glass-panel-glow border border-white/20 p-6 flex flex-col space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#48D7FF]" />
                <h3 className="text-base font-bold font-display text-[#EDF5FF]">
                  Use Mobile Camera on PC
                </h3>
              </div>
              <button
                onClick={() => setIsCompanionModalOpen(false)}
                className="p-1 rounded-full text-[#9EACC4] hover:text-[#EDF5FF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9EACC4] leading-relaxed">
              Scan this QR code with your mobile phone. Your smartphone’s rear camera & orientation gyro will stream live to this PC screen with zero backend lag via peer-to-peer WebRTC!
            </p>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              {companionRoomId ? (
                <>
                  <div className="p-3 bg-white rounded-xl shadow-lg">
                    <QRCodeSVG value={companionUrl} size={180} level="M" />
                  </div>
                  <div className="text-xs font-mono text-center">
                    <span className="text-[#9EACC4]">Room Code: </span>
                    <strong className="text-[#48D7FF] tracking-wider text-sm">{companionRoomId}</strong>
                  </div>
                </>
              ) : (
                <div className="py-12 text-xs font-mono text-[#9EACC4] animate-pulse">
                  Generating secure peer key...
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-2 text-xs font-mono">
                {companionStatus === 'connected' ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Mobile Device Connected!
                  </span>
                ) : (
                  <span className="text-[#9EACC4] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#48D7FF] animate-ping" />
                    Waiting for mobile phone scan...
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIsCompanionModalOpen(false);
                  startCamera(); // Or activate laptop webcam
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-[#EDF5FF] border border-white/10"
              >
                Use Laptop Webcam Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied / Camera Fallback Banner */}
      {cameraState === 'denied' && (
        <div className="absolute bottom-6 left-4 right-4 max-w-md mx-auto z-40 p-4 rounded-2xl glass-panel-glow border border-amber-500/40 text-amber-200 text-xs space-y-2 pointer-events-auto">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Camera Access Denied or Unavailable</span>
          </div>
          <p className="text-amber-200/80 leading-relaxed">
            Cosmora is running in Interactive Sky Map fallback mode. Drag across the screen with your finger or mouse to pan and tilt towards any celestial coordinate.
          </p>
        </div>
      )}
    </div>
  );
};
