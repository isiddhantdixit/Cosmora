import React, { useState } from 'react';
import {
  Settings,
  MapPin,
  Sliders,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  Compass,
  CheckCircle2,
  Trash2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import { ObserverLocation } from '../../astronomy/types';

export const SettingsPage: React.FC = () => {
  const { preferences, updatePreferences, updateLocation, detectGeolocation, resetToDefaults, isLocating } = useUserPreferences();
  const [customCity, setCustomCity] = useState(preferences.location.name);
  const [customLat, setCustomLat] = useState(preferences.location.latitude.toString());
  const [customLon, setCustomLon] = useState(preferences.location.longitude.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notable Astronomical Observatories Presets
  const observatoryPresets: ObserverLocation[] = [
    { name: 'Mauna Kea Observatory, Hawaii', latitude: 19.8206, longitude: -155.4681, elevation: 4205 },
    { name: 'Paranal Observatory, Atacama, Chile', latitude: -24.6272, longitude: -70.4042, elevation: 2635 },
    { name: 'Royal Observatory, Greenwich, UK', latitude: 51.4769, longitude: -0.0005, elevation: 46 },
    { name: 'New Delhi, India', latitude: 28.6139, longitude: 77.2090, elevation: 216 },
    { name: 'New York City, USA', latitude: 40.7128, longitude: -74.0060, elevation: 10 },
    { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, elevation: 40 }
  ];

  const handleManualLocationSave = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      alert('Latitude must be a valid number between -90 and 90 degrees.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      alert('Longitude must be a valid number between -180 and 180 degrees.');
      return;
    }

    updateLocation({
      name: customCity || 'Custom Location',
      latitude: lat,
      longitude: lon,
      elevation: 0
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 text-xs font-mono text-[#48D7FF] mb-3">
          <Settings className="w-3.5 h-3.5" />
          <span>SYSTEM CALIBRATION & PREFERENCES</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#EDF5FF] tracking-tight">
          Preferences & Diagnostics
        </h1>
        <p className="text-sm sm:text-base text-[#9EACC4] mt-2 font-normal">
          Configure observer coordinates, graphics level of detail, compass sensor calibration, and privacy preferences.
        </p>
      </div>

      {/* Observation Location Configuration */}
      <section className="p-6 sm:p-8 rounded-2xl glass-panel border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#48D7FF]" />
            <h2 className="text-lg font-bold font-display text-[#EDF5FF]">
              Observer Geographical Coordinates
            </h2>
          </div>
          <button
            onClick={() => detectGeolocation()}
            disabled={isLocating}
            className="px-4 py-2 rounded-full bg-[#163B70] text-[#48D7FF] hover:bg-[#163B70]/80 text-xs font-mono border border-[#48D7FF]/30 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>Auto Detect GPS</span>
          </button>
        </div>

        {/* Current Coordinate Summary */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div>
            <span className="text-[#9EACC4] block">Current Observing Site:</span>
            <strong className="text-sm text-[#EDF5FF]">{preferences.location.name}</strong>
          </div>
          <div className="text-right sm:text-left text-[#48D7FF]">
            {preferences.location.latitude.toFixed(4)}° Lat • {preferences.location.longitude.toFixed(4)}° Lon
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-xs font-mono text-[#9EACC4] uppercase block mb-2">
            Notable Observatory Presets
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {observatoryPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  updateLocation(preset);
                  setCustomCity(preset.name);
                  setCustomLat(preset.latitude.toString());
                  setCustomLon(preset.longitude.toString());
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-mono transition-all ${
                  preferences.location.name === preset.name
                    ? 'bg-[#163B70]/60 border-[#48D7FF]/40 text-[#48D7FF]'
                    : 'bg-white/5 border-white/5 text-[#9EACC4] hover:text-[#EDF5FF] hover:bg-white/10'
                }`}
              >
                <div className="font-semibold truncate">{preset.name}</div>
                <div className="text-[10px] text-[#9EACC4]/70 mt-0.5">
                  {preset.latitude}° / {preset.longitude}°
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleManualLocationSave} className="space-y-4 pt-4 border-t border-white/5">
          <span className="text-xs font-mono text-[#9EACC4] uppercase block">
            Manual Coordinate Override
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono text-[#9EACC4] block mb-1">City / Label</label>
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-[#EDF5FF] focus:outline-none focus:border-[#48D7FF]"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-[#9EACC4] block mb-1">Latitude (-90 to +90)</label>
              <input
                type="text"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-[#EDF5FF] focus:outline-none focus:border-[#48D7FF]"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-[#9EACC4] block mb-1">Longitude (-180 to +180)</label>
              <input
                type="text"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-[#EDF5FF] focus:outline-none focus:border-[#48D7FF]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-[#EDF5FF] border border-white/10 transition-all flex items-center gap-2"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Coordinates Saved!</span>
              </>
            ) : (
              <span>Save Coordinates</span>
            )}
          </button>
        </form>
      </section>

      {/* Graphics & Performance Settings */}
      <section className="p-6 sm:p-8 rounded-2xl glass-panel border border-white/10 space-y-6">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-[#48D7FF]" />
          <h2 className="text-lg font-bold font-display text-[#EDF5FF]">
            Graphics Level of Detail & Performance
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['high', 'medium', 'low'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => updatePreferences({ graphicsQuality: lvl })}
              className={`p-4 rounded-xl border text-left transition-all ${
                preferences.graphicsQuality === lvl
                  ? 'bg-[#163B70]/60 border-[#48D7FF]/40 text-[#48D7FF]'
                  : 'bg-black/30 border-white/5 text-[#9EACC4] hover:text-[#EDF5FF]'
              }`}
            >
              <div className="text-sm font-bold font-display uppercase">{lvl} Quality</div>
              <div className="text-xs font-mono text-[#9EACC4] mt-1">
                {lvl === 'high' ? '4,500 Stars, Volumetric Nebulae' : lvl === 'medium' ? '2,500 Stars, Balanced DPR' : '1,200 Stars, Battery Saver'}
              </div>
            </button>
          ))}
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
            <div>
              <div className="text-xs font-bold text-[#EDF5FF]">Reduced Motion</div>
              <div className="text-[11px] text-[#9EACC4]">Pauses camera parallax drift and slow rotation</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
              className="w-4 h-4 accent-[#48D7FF]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
            <div>
              <div className="text-xs font-bold text-[#EDF5FF]">Atmospheric Nebular Illumination</div>
              <div className="text-[11px] text-[#9EACC4]">Renders volumetric procedural dust clouds</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.showAtmosphereGlow}
              onChange={(e) => updatePreferences({ showAtmosphereGlow: e.target.checked })}
              className="w-4 h-4 accent-[#48D7FF]"
            />
          </div>
        </div>
      </section>

      {/* Mobile Sensor & Compass Calibration Guidance */}
      <section className="p-6 sm:p-8 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-[#48D7FF]" />
          <h2 className="text-lg font-bold font-display text-[#EDF5FF]">
            Compass & Orientation Calibration Guidance
          </h2>
        </div>

        <p className="text-xs text-[#9EACC4] leading-relaxed">
          Device compasses are sensitive to magnetic interference from metallic cases, laptop bodies, and indoor electromagnetic fields. If your AR reticle drifts:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-[#EDF5FF]">
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <strong className="text-[#48D7FF] block mb-1">1. Figure-8 Wave</strong>
            Wave your mobile phone in a smooth figure-8 infinity motion for 5 seconds.
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <strong className="text-[#48D7FF] block mb-1">2. Clear Magnetic Cases</strong>
            Ensure cases with magnetic ring mounts or metal plates are removed.
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <strong className="text-[#48D7FF] block mb-1">3. Manual Recalibrate</strong>
            Use the Recalibrate icon in AR Sky to instantly zero North to your gaze.
          </div>
        </div>
      </section>

      {/* Privacy & Storage Reset */}
      <section className="p-6 sm:p-8 rounded-2xl glass-panel border border-red-500/20 space-y-4">
        <div className="flex items-center gap-2.5 text-red-400">
          <ShieldAlert className="w-5 h-5" />
          <h2 className="text-lg font-bold font-display">
            Privacy & Local Storage Data
          </h2>
        </div>

        <p className="text-xs text-[#9EACC4] leading-relaxed">
          Cosmora operates client-side first. No camera frames, video feeds, or precise location traces are ever uploaded to any external server or saved in the cloud.
        </p>

        <button
          onClick={() => {
            if (confirm('Clear all stored Cosmora preferences and reset to default?')) {
              resetToDefaults();
              alert('Preferences cleared.');
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Local Storage & Reset</span>
        </button>
      </section>
    </div>
  );
};
