import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Camera,
  Compass,
  CheckCircle2,
  AlertCircle,
  Radio,
  ArrowLeft,
  Navigation2
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
  const [pitch, setPitch] = useState(30);

  const clientRef = useRef<CompanionClient | null>(null);

  // Auto connect on mount if roomId is available
  useEffect(() => {
    if (roomId) {
      startCompanionStream();
    }
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (clientRef.current) clientRef.current.destroy();
    };
  }, [stream]);

  const startCompanionStream = async () => {
    if (!roomId) {
      setErrorMessage('No pairing code provided in link.');
      setConnectionStatus('error');
      return;
    }

    try {
      setConnectionStatus('connecting');

      // Attempt camera access
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
        console.warn('Camera permission unavailable, proceeding with motion orientation only:', camErr);
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
          console.warn('Peer connection fallback notice:', err.message);
        }
      );

      // Bind motion sensors
      bindSensors(client);
      setConnectionStatus('connected');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize phone connection');
      setConnectionStatus('error');
    }
  };

  const bindSensors = (client: CompanionClient) => {
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
          className="p-2.5 rounded-full glass-panel text-[#9EACC4] hover:text-[#EDF5FF]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs font-mono text-[#48D7FF] px-3 py-1 rounded-full bg-[#163B70]/50 border border-[#48D7FF]/30">
          <Radio className="w-3.5 h-3.5 animate-pulse text-[#48D7FF]" />
          <span>CONNECTED: {roomId.toUpperCase()}</span>
        </div>
      </div>

      {/* Main Status */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#163B70] to-[#48D7FF] p-1 shadow-glow-cyan animate-pulse">
          <div className="w-full h-full rounded-full bg-[#030611] flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-[#48D7FF]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold font-display text-[#EDF5FF]">
            Wireless Sky Lens
          </h1>
          <p className="text-xs text-[#9EACC4] mt-1.5 max-w-xs leading-relaxed">
            Your phone is now acting as a live sky telescope controller for your laptop screen.
          </p>
        </div>

        {connectionStatus === 'connected' ? (
          <div className="w-full p-5 rounded-2xl glass-panel-glow border border-emerald-500/40 text-emerald-300 space-y-3">
            <div className="flex items-center justify-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Transmitting Sky Position to Laptop!</span>
            </div>
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              Aim your phone towards any star or constellation. The view on your computer will adjust smoothly in real time.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 text-[#EDF5FF]">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-[#9EACC4] block">Compass Heading</span>
                <strong className="text-base text-[#48D7FF]">{heading.toFixed(0)}°</strong>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-[#9EACC4] block">Sky Elevation</span>
                <strong className="text-base text-[#48D7FF]">{pitch.toFixed(0)}°</strong>
              </div>
            </div>
          </div>
        ) : connectionStatus === 'connecting' ? (
          <div className="text-xs font-mono text-[#48D7FF] flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-[#48D7FF]" />
            Synchronizing with screen...
          </div>
        ) : (
          <button
            onClick={startCompanionStream}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-bold text-sm shadow-glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Connect Sky Camera</span>
          </button>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Hidden local video preview */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="w-full h-32 object-cover rounded-2xl border border-white/10 opacity-30 mt-4"
      />
    </div>
  );
};
