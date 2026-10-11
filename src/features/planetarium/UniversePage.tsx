import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Orbit,
  Sparkles,
  Eye,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  X,
  Compass
} from 'lucide-react';
import { PlanetariumScene, PlanetariumViewMode } from '../../three/scenes/PlanetariumScene';
import { CelestialObject } from '../../astronomy/types';
import { useAstronomy } from '../../app/providers/AstronomyContext';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';

export const UniversePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { observationDate, setObservationDate, isLiveTime, setIsLiveTime, resetToCurrentTime, findObjectById } = useAstronomy();
  const { preferences, updatePreferences } = useUserPreferences();

  const [viewMode, setViewMode] = useState<PlanetariumViewMode>('skydome');
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Time control slider offset in hours (-24h to +24h)
  const [hourOffset, setHourOffset] = useState<number>(0);

  // Handle URL focus parameter
  useEffect(() => {
    const focusParam = searchParams.get('focus');
    if (focusParam) {
      setFocusedId(focusParam);
      const res = findObjectById(focusParam);
      if (res.type === 'celestial' && res.data) {
        setSelectedObject(res.data as CelestialObject);
      }
    }
  }, [searchParams, findObjectById]);

  // Adjust time when slider changes
  const handleTimeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setHourOffset(val);
    setIsLiveTime(false);

    const base = new Date();
    base.setHours(base.getHours() + val);
    setObservationDate(base);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#030611] overflow-hidden">
      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0">
        <PlanetariumScene
          viewMode={viewMode}
          selectedObject={selectedObject}
          onSelectObject={(obj) => {
            setSelectedObject(obj);
            setFocusedId(obj.id);
          }}
          observationDate={observationDate}
          focusedObjectId={focusedId}
        />
      </div>

      {/* Top Floating Context & Mode Selector */}
      <div className="absolute top-16 sm:top-20 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Mode Switcher: Sky Dome vs Solar System */}
        <div className="p-1 rounded-full glass-panel border border-white/10 flex items-center gap-1 pointer-events-auto shadow-xl">
          <button
            onClick={() => setViewMode('skydome')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all flex items-center gap-2 ${
              viewMode === 'skydome'
                ? 'bg-[#163B70] text-[#48D7FF] border border-[#48D7FF]/40 shadow-glow-cyan/20'
                : 'text-[#9EACC4] hover:text-[#EDF5FF]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sky Dome (Local Horizon)</span>
          </button>

          <button
            onClick={() => setViewMode('solarsystem')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all flex items-center gap-2 ${
              viewMode === 'solarsystem'
                ? 'bg-[#163B70] text-[#48D7FF] border border-[#48D7FF]/40 shadow-glow-cyan/20'
                : 'text-[#9EACC4] hover:text-[#EDF5FF]'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>Solar System (Heliocentric)</span>
          </button>
        </div>

        {/* View Toggles: Constellations, Labels, Orbits */}
        <div className="p-1 rounded-full glass-panel border border-white/10 flex items-center gap-1 pointer-events-auto shadow-xl">
          <button
            onClick={() => updatePreferences({ showConstellationLines: !preferences.showConstellationLines })}
            className={`p-2 rounded-full text-xs transition-all ${
              preferences.showConstellationLines ? 'text-[#48D7FF] bg-white/5' : 'text-[#9EACC4]'
            }`}
            title="Toggle Constellation Lines"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => updatePreferences({ showStarLabels: !preferences.showStarLabels })}
            className={`p-2 rounded-full text-xs transition-all ${
              preferences.showStarLabels ? 'text-[#48D7FF] bg-white/5' : 'text-[#9EACC4]'
            }`}
            title="Toggle Celestial Labels"
          >
            <Eye className="w-4 h-4" />
          </button>

          {focusedId && (
            <button
              onClick={() => {
                setFocusedId(null);
                setSelectedObject(null);
              }}
              className="px-2.5 py-1 text-xs font-mono text-[#9EACC4] hover:text-[#EDF5FF] flex items-center gap-1"
              title="Reset Camera Target"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Floating Time Travel & Ephemeris Bar */}
      <div className="absolute bottom-16 lg:bottom-6 left-4 right-4 max-w-xl mx-auto z-20 pointer-events-auto">
        <div className="p-1 rounded-2xl glass-panel-glow border border-white/10 shadow-2xl">
          <div className="px-4 py-3 rounded-[calc(1rem-0.125rem)] bg-[#071126]/90 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-[#48D7FF]">
                <Clock className="w-3.5 h-3.5" />
                <span>Ephemeris Observation Time:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#EDF5FF] font-semibold">
                  {observationDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {observationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isLiveTime ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      resetToCurrentTime();
                      setHourOffset(0);
                    }}
                    className="text-[10px] text-[#48D7FF] underline"
                  >
                    Reset to Now
                  </button>
                )}
              </div>
            </div>

            {/* Time Travel Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-[#9EACC4]">-24h</span>
              <input
                type="range"
                min="-24"
                max="24"
                step="0.5"
                value={hourOffset}
                onChange={handleTimeSliderChange}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#48D7FF]"
              />
              <span className="text-[10px] font-mono text-[#9EACC4]">+24h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Object Detail Side Drawer (Desktop Right, Mobile Bottom) */}
      {selectedObject && (
        <div className="absolute top-24 right-4 bottom-28 w-80 max-w-[90vw] z-30 pointer-events-auto hidden md:flex flex-col animate-in slide-in-from-right duration-300">
          <div className="h-full p-1 rounded-2xl glass-panel-glow border border-white/15 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#163B70] text-[#48D7FF]">
                    {selectedObject.type}
                  </span>
                  <h3 className="text-xl font-bold font-display text-[#EDF5FF] mt-1.5">
                    {selectedObject.name}
                  </h3>
                  <p className="text-xs font-mono text-[#9EACC4]">
                    {selectedObject.latinName || selectedObject.designation || 'Celestial Object'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedObject(null)}
                  className="p-1 rounded-full text-[#9EACC4] hover:text-[#EDF5FF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#EDF5FF]/85 leading-relaxed">
                {selectedObject.description}
              </p>

              {/* Physical Parameters */}
              <div className="space-y-2 pt-1 border-t border-white/10 text-xs font-mono">
                <div className="flex items-center justify-between text-[#9EACC4]">
                  <span>Apparent Magnitude:</span>
                  <strong className="text-[#EDF5FF]">{selectedObject.magnitude.toFixed(2)}m</strong>
                </div>

                <div className="flex items-center justify-between text-[#9EACC4]">
                  <span>Right Ascension (RA):</span>
                  <strong className="text-[#EDF5FF]">
                    {selectedObject.coordinates.rightAscension.toFixed(2)}h
                  </strong>
                </div>

                <div className="flex items-center justify-between text-[#9EACC4]">
                  <span>Declination (Dec):</span>
                  <strong className="text-[#EDF5FF]">
                    {selectedObject.coordinates.declination >= 0 ? '+' : ''}
                    {selectedObject.coordinates.declination.toFixed(2)}°
                  </strong>
                </div>

                {selectedObject.distanceLy && (
                  <div className="flex items-center justify-between text-[#9EACC4]">
                    <span>Distance from Earth:</span>
                    <strong className="text-[#EDF5FF]">{selectedObject.distanceLy} light-yrs</strong>
                  </div>
                )}

                {selectedObject.spectralType && (
                  <div className="flex items-center justify-between text-[#9EACC4]">
                    <span>Spectral Type:</span>
                    <strong className="text-[#EDF5FF]">{selectedObject.spectralType}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => navigate(`/object/${selectedObject.id}`)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-xs font-mono flex items-center justify-center gap-2 shadow-glow-cyan"
                >
                  <span>Detailed Telemetry</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => navigate(`/explore?target=${selectedObject.id}`)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-[#EDF5FF] flex items-center justify-center gap-2 border border-white/10"
                >
                  <Compass className="w-3.5 h-3.5 text-[#48D7FF]" />
                  <span>Target in AR Sky Explorer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
