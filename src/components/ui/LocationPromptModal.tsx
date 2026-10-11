import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Radio,
  Eye,
  Shield,
  X,
  ChevronDown,
  Globe2
} from 'lucide-react';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import { ObserverLocation } from '../../astronomy/types';

const PROMPT_STORAGE_KEY = 'cosmora_coordinates_prompt_dismissed_v1';

const PRESET_OBSERVATORIES: ObserverLocation[] = [
  { name: 'New Delhi (Default)', latitude: 28.6139, longitude: 77.2090, elevation: 216 },
  { name: 'London / Greenwich', latitude: 51.4769, longitude: -0.0005, elevation: 46 },
  { name: 'New York City', latitude: 40.7128, longitude: -74.0060, elevation: 10 },
  { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, elevation: 40 },
  { name: 'Sydney Observatory', latitude: -33.8596, longitude: 151.2049, elevation: 42 },
  { name: 'Mauna Kea Observatory', latitude: 19.8207, longitude: -155.4681, elevation: 4205 },
  { name: 'Atacama ALMA Observatory', latitude: -23.0229, longitude: -67.7550, elevation: 5050 }
];

export const LocationPromptModal: React.FC = () => {
  const { preferences, updateLocation, detectGeolocation, isLocating } = useUserPreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'success' | 'denied'>('idle');
  const [showManualPresets, setShowManualPresets] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Automatically prompt right after opening the site if never answered
    const hasAnswered = localStorage.getItem(PROMPT_STORAGE_KEY);
    const isCustomDetected = preferences.location.name.startsWith('Detected');

    if (!hasAnswered && !isCustomDetected) {
      // Gentle 700ms delay so the initial 3D background mounts smoothly first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }

    // Allow opening anytime from header location button
    const handleManualOpen = () => setIsOpen(true);
    window.addEventListener('cosmora:open-location-prompt', handleManualOpen);
    return () => {
      window.removeEventListener('cosmora:open-location-prompt', handleManualOpen);
    };
  }, [preferences.location.name]);

  const handleGrantPermission = async () => {
    setStatus('detecting');
    const success = await detectGeolocation();

    if (success) {
      // Read updated coordinates from current position
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setDetectedCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        });
      }
      setStatus('success');
      localStorage.setItem(PROMPT_STORAGE_KEY, 'granted');

      // Auto dismiss after 1.4s showing confirmed lock
      setTimeout(() => {
        setIsOpen(false);
      }, 1400);
    } else {
      setStatus('denied');
    }
  };

  const handleSelectPreset = (loc: ObserverLocation) => {
    updateLocation(loc);
    localStorage.setItem(PROMPT_STORAGE_KEY, 'preset_chosen');
    setStatus('success');
    setDetectedCoords({ lat: loc.latitude, lng: loc.longitude });
    setTimeout(() => {
      setIsOpen(false);
    }, 900);
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_STORAGE_KEY, 'dismissed_default');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl bg-[#071126]/95 border border-[#48D7FF]/30 shadow-[0_0_60px_rgba(72,215,255,0.18)] p-6 sm:p-8 overflow-hidden text-[#EDF5FF]"
          role="dialog"
          aria-modal="true"
        >
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#48D7FF]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 rounded-full text-[#9EACC4] hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss and keep default"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon & Eyebrow */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-[#163B70]/60 border border-[#48D7FF]/40 flex items-center justify-center shadow-glow-cyan/20">
              <Compass className="w-6 h-6 text-[#48D7FF] animate-spin-slow" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#48D7FF] animate-ping" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#163B70]/50 border border-[#48D7FF]/30 text-[10px] font-mono text-[#48D7FF] uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Local Horizon Calibration</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#EDF5FF] mt-1">
                Calibrate Coordinates
              </h2>
            </div>
          </div>

          {/* Main Scientific Justification */}
          <div className="mt-5 space-y-3">
            <p className="text-sm text-[#BAC7DD] leading-relaxed">
              Cosmora calculates real-time celestial horizons using your exact coordinates. We need your coordinates for:
            </p>

            {/* Feature Justification Pills */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <Radio className="w-5 h-5 text-[#48D7FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[#EDF5FF] font-mono uppercase">
                    Accurate AR Sky View
                  </div>
                  <div className="text-xs text-[#9EACC4] mt-0.5">
                    Aligns camera reticle and direction arrows with stars and planets physically positioned above your device.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <Eye className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[#EDF5FF] font-mono uppercase">
                    Live Horizon & Astronomical Ephemeris
                  </div>
                  <div className="text-xs text-[#9EACC4] mt-0.5">
                    Calculates exact local rise, transit, and set times, twilight phases, and real-time planetary visibility.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#9EACC4] font-mono px-1">
                <Shield className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Stored 100% locally on your device • Zero server tracking</span>
              </div>
            </div>
          </div>

          {/* Status Feedback */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-3 rounded-2xl bg-[#059669]/20 border border-[#10B981]/40 flex items-center gap-3 text-emerald-300"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="text-xs font-mono">
                <div className="font-semibold uppercase tracking-wider">Astrometry Locked</div>
                <div>
                  {detectedCoords
                    ? `${detectedCoords.lat.toFixed(4)}°N, ${detectedCoords.lng.toFixed(4)}°E (Horizon Synced)`
                    : `${preferences.location.name} Configured`}
                </div>
              </div>
            </motion.div>
          )}

          {status === 'denied' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-3 rounded-2xl bg-[#DC2626]/20 border border-[#EF4444]/40 flex items-start gap-3 text-rose-300"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold font-mono uppercase">Browser Permission Blocked</div>
                <div className="text-rose-200/80 mt-0.5">
                  Location was denied in browser settings. You can pick an observatory manually below or continue with default.
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={handleGrantPermission}
              disabled={status === 'detecting' || isLocating}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-sm tracking-wide shadow-glow-cyan hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <MapPin className="w-4 h-4" />
              <span>
                {status === 'detecting' || isLocating
                  ? 'Acquiring GPS Astronomical Fix...'
                  : 'Enable Precise Coordinates'}
              </span>
            </button>

            {/* Manual City Selector Toggle */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowManualPresets((prev) => !prev)}
                className="text-xs font-mono text-[#48D7FF] hover:underline flex items-center gap-1.5"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Choose City or Observatory</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showManualPresets ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs font-mono text-[#9EACC4] hover:text-[#EDF5FF] transition-colors"
              >
                Use Default (New Delhi)
              </button>
            </div>

            {/* Presets List */}
            {showManualPresets && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 max-h-48 overflow-y-auto rounded-2xl bg-black/40 border border-white/10 p-2 space-y-1 text-xs font-mono divide-y divide-white/5"
              >
                {PRESET_OBSERVATORIES.map((obs) => (
                  <button
                    key={obs.name}
                    type="button"
                    onClick={() => handleSelectPreset(obs)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-[#EDF5FF] flex items-center justify-between transition-colors"
                  >
                    <span className="font-sans font-medium">{obs.name}</span>
                    <span className="text-[11px] text-[#9EACC4]">
                      {obs.latitude.toFixed(1)}°, {obs.longitude.toFixed(1)}°
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
