import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Camera,
  Compass,
  CheckCircle2,
  AlertCircle,
  Wifi,
  ArrowLeft
} from 'lucide-react';
import { CompanionClient } from '../../services/companion/companionBridge';

export const CompanionSenderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room') || '';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [heading, setHeading] = useState(0);
  const [pitch, setPitch] = useState(0);

  const clientRef = useRef<CompanionClient | null>(null);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (clientRef.current) clientRef.current.destroy();
    };
  }, [stream]);

  const startCompanionStream = async () => {
    if (!roomId) {
      setErrorMessage('No room code specified in QR link.');
      setConnectionStatus('error');
      return;
    }

    try {
      setConnectionStatus('connecting');

      // Request camera
      let mediaStream: MediaStream | null = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (camErr) {
        console.warn('Camera failed on mobile, streaming sensors only:', camErr);
      }

      // Initialize Client
      const client = new CompanionClient();
      clientRef.current = client;

      await client.connect(
        roomId,
        mediaStream,
        () => {
          setConnectionStatus('connected');
        },
        (err) => {
          setErrorMessage(err.message || 'Connection to PC failed');
          setConnectionStatus('error');
        }
      );

      // Start orientation sensor listener
      bindSensors(client);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start companion stream');
      setConnectionStatus('error');
    }
  };

  const bindSensors = (client: CompanionClient) => {
    // Request iOS orientation permission if required
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission().catch(() => {});
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null) return;

      let compassHeading = 0;
      if ((e as any).webkitCompassHeading) {
        compassHeading = (e as any).webkitCompassHeading;
      } else {
        compassHeading = (360 - (e.alpha || 0)) % 360;
      }

      const skyPitch = 90 - (e.beta || 0);
      setHeading(compassHeading);
      setPitch(skyPitch);

      // Transmit to host PC
      client.sendPacket({
        type: 'motion',
        heading: compassHeading,
        pitch: skyPitch,
        roll: e.gamma || 0,
        timestamp: Date.now()
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
  };

  return (
    <div className="min-h-screen bg-[#030611] text-[#EDF5FF] p-6 flex flex-col justify-between max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full glass-panel text-[#9EACC4] hover:text-[#EDF5FF]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs font-mono text-[#48D7FF]">
          <Wifi className="w-4 h-4 animate-pulse" />
          <span>ROOM: {roomId.toUpperCase()}</span>
        </div>
      </div>

      {/* Main Connection Status View */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#163B70] to-[#48D7FF] p-1 shadow-glow-cyan">
          <div className="w-full h-full rounded-full bg-[#030611] flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-[#48D7FF]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold font-display text-[#EDF5FF]">
            Mobile AR Controller
          </h1>
          <p className="text-xs text-[#9EACC4] mt-1.5 max-w-xs">
            Stream your phone’s camera and motion sensors live to your laptop or PC screen.
          </p>
        </div>

        {connectionStatus === 'connected' ? (
          <div className="w-full p-5 rounded-2xl glass-panel-glow border border-emerald-500/40 text-emerald-300 space-y-3">
            <div className="flex items-center justify-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Streaming Live to PC Screen!</span>
            </div>
            <p className="text-xs text-emerald-300/80">
              Point your phone towards the sky. The celestial overlay and camera feed are now rendering directly on your laptop screen.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 text-[#EDF5FF]">
              <div className="p-2 bg-black/40 rounded-lg">
                Compass: <strong>{heading.toFixed(0)}°</strong>
              </div>
              <div className="p-2 bg-black/40 rounded-lg">
                Altitude: <strong>{pitch.toFixed(0)}°</strong>
              </div>
            </div>
          </div>
        ) : connectionStatus === 'connecting' ? (
          <div className="text-xs font-mono text-[#48D7FF] flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#48D7FF]" />
            Establishing WebRTC connection with PC...
          </div>
        ) : (
          <button
            onClick={startCompanionStream}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-sm shadow-glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Start Live Streaming</span>
          </button>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Hidden/Muted local video preview */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="w-full h-32 object-cover rounded-xl border border-white/10 opacity-40 mt-4"
      />
    </div>
  );
};
