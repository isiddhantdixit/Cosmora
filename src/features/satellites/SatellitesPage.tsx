import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  RefreshCw,
  Compass,
  Orbit,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Layers,
  Activity
} from 'lucide-react';
import { SATELLITES_CATALOGUE, calculateSatellitePosition } from '../../astronomy/satellites/satelliteTracker';
import { useAstronomy } from '../../app/providers/AstronomyContext';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';

export const SatellitesPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live timer tick every 2 seconds for high-precision orbital telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setCurrentDate(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 text-xs font-mono text-[#48D7FF] mb-3">
            <Radio className="w-3.5 h-3.5" />
            <span>SGP4 ORBITAL MECHANICS & TLE PROPAGATION</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#EDF5FF] tracking-tight">
            Satellite Tracker
          </h1>
          <p className="text-sm sm:text-base text-[#9EACC4] mt-2 max-w-2xl font-normal">
            Real-time orbital tracking and topocentric look angles for active space stations and scientific spacecraft calculated via NORAD Two-Line Element (TLE) sets.
          </p>
        </div>

        {/* Refresh Action & Observer Telemetry */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl glass-panel border border-white/10 text-xs font-mono text-[#9EACC4] space-y-1">
            <div className="flex items-center gap-1.5 text-[#EDF5FF]">
              <MapPin className="w-3.5 h-3.5 text-[#48D7FF]" />
              <span>{preferences.location.name}</span>
            </div>
            <div className="text-[11px] text-[#48D7FF]">
              Clock: {currentDate.toLocaleTimeString()} UTC
            </div>
          </div>

          <button
            onClick={handleManualRefresh}
            className={`p-3 rounded-2xl glass-panel border border-white/10 text-[#48D7FF] hover:border-[#48D7FF]/40 transition-all ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh Orbital Propagation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Satellites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SATELLITES_CATALOGUE.map((sat) => {
          const livePos = calculateSatellitePosition(sat, preferences.location, currentDate);

          return (
            <div
              key={sat.id}
              className="p-1 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#48D7FF]/40 transition-all flex flex-col justify-between group"
            >
              <div className="p-6 rounded-[calc(2rem-0.25rem)] bg-[#071126]/85 flex flex-col justify-between h-full space-y-5">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#163B70] text-[#48D7FF]">
                          NORAD #{sat.noradId}
                        </span>
                        <span className="text-[10px] font-mono text-[#9EACC4]">
                          {sat.type}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-display text-[#EDF5FF] mt-2 group-hover:text-[#48D7FF] transition-colors">
                        {sat.name}
                      </h3>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 flex items-center justify-center text-[#48D7FF]">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  <p className="text-xs text-[#9EACC4] mt-2.5 leading-relaxed">
                    {sat.description}
                  </p>

                  {/* Real-time Telemetry Bento */}
                  {livePos ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-[#9EACC4] bg-black/40 p-3.5 rounded-xl border border-white/5 mt-4">
                      <div>
                        <span className="block text-[10px] text-[#9EACC4]/60">Sub-Sat Lat</span>
                        <strong className="text-[#EDF5FF]">
                          {livePos.latitude.toFixed(2)}°
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#9EACC4]/60">Sub-Sat Lon</span>
                        <strong className="text-[#EDF5FF]">
                          {livePos.longitude.toFixed(2)}°
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#9EACC4]/60">Altitude</span>
                        <strong className="text-[#48D7FF]">
                          {livePos.altitudeKm.toFixed(1)} km
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#9EACC4]/60">Velocity</span>
                        <strong className="text-[#EDF5FF]">
                          {livePos.velocityKmS.toFixed(2)} km/s
                        </strong>
                      </div>

                      <div className="pt-2 border-t border-white/5 col-span-2">
                        <span className="block text-[10px] text-[#9EACC4]/60">Observer Look Angle</span>
                        <strong className={livePos.horizontal.altitude > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          Alt {livePos.horizontal.altitude.toFixed(1)}° • Az {livePos.horizontal.azimuth.toFixed(0)}°
                        </strong>
                      </div>
                      <div className="pt-2 border-t border-white/5 col-span-2">
                        <span className="block text-[10px] text-[#9EACC4]/60">Horizon Visibility</span>
                        <strong className={livePos.horizontal.isVisible ? 'text-emerald-400' : 'text-[#9EACC4]'}>
                          {livePos.horizontal.isVisible ? 'OVERHEAD NOW' : 'Below Local Horizon'}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-black/40 rounded-xl text-xs font-mono text-[#9EACC4] mt-4">
                      Calculating SGP4 Keplerian elements...
                    </div>
                  )}

                  {/* Raw TLE Attribution */}
                  <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-white/5 font-mono text-[9px] text-[#9EACC4]/70 overflow-x-auto space-y-0.5">
                    <div className="truncate">{sat.line1}</div>
                    <div className="truncate">{sat.line2}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => navigate(`/object/${sat.id}`)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-xs font-mono flex items-center justify-center gap-1.5 shadow-glow-cyan"
                  >
                    <span>Orbital Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigate(`/explore`)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#48D7FF] text-xs font-mono border border-white/10"
                    title="Track in AR Sky Explorer"
                  >
                    <Compass className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
