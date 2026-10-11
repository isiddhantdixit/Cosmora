import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Sun,
  Globe2,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  MapPin,
  Orbit
} from 'lucide-react';
import { useAstronomy } from '../../app/providers/AstronomyContext';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import { SOLAR_SYSTEM_OBJECTS } from '../../astronomy/catalogues/planets';
import { STARS_CATALOGUE } from '../../astronomy/catalogues/stars';
import {
  calculatePlanetEquatorial,
  equatorialToHorizontal,
  calculateRiseSet,
  getTwilightState
} from '../../astronomy/calculations/astronomyEngine';

export const TonightPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();
  const { skySummary, observationDate } = useAstronomy();

  // Evening time slider: hours offset from current time (-6h to +12h)
  const [hourOffset, setHourOffset] = useState<number>(0);

  const plannerDate = useMemo(() => {
    const d = new Date(observationDate);
    d.setHours(d.getHours() + hourOffset);
    return d;
  }, [observationDate, hourOffset]);

  // Planet visibility calculations
  const planetVisibilities = useMemo(() => {
    return SOLAR_SYSTEM_OBJECTS.filter((p) => p.id !== 'body-sun').map((planet) => {
      const bodyName = planet.name as any;
      let eq = planet.coordinates;
      try {
        const comp = calculatePlanetEquatorial(bodyName, plannerDate, preferences.location);
        eq = { rightAscension: comp.rightAscension, declination: comp.declination };
      } catch {}

      const hor = equatorialToHorizontal(eq, preferences.location, plannerDate);
      const riseSet = calculateRiseSet(bodyName, preferences.location, plannerDate);

      // Observable if altitude > 0 and Sun altitude < -6 (nautical/astronomical twilight or night)
      const sunEq = calculatePlanetEquatorial('Sun', plannerDate, preferences.location);
      const sunHor = equatorialToHorizontal(sunEq, preferences.location, plannerDate);
      const isNightOrTwilight = sunHor.altitude < -6;
      const isObservable = hor.altitude > 8 && isNightOrTwilight;

      return {
        planet,
        hor,
        riseSet,
        isObservable,
        altitude: hor.altitude,
        azimuth: hor.azimuth
      };
    });
  }, [plannerDate, preferences.location]);

  // Top visible navigation stars
  const visibleStars = useMemo(() => {
    return STARS_CATALOGUE.map((star) => {
      const hor = equatorialToHorizontal(star.coordinates, preferences.location, plannerDate);
      return {
        star,
        hor,
        isVisible: hor.altitude > 15
      };
    })
      .filter((item) => item.isVisible)
      .sort((a, b) => a.star.magnitude - b.star.magnitude)
      .slice(0, 8);
  }, [plannerDate, preferences.location]);

  const sunEq = calculatePlanetEquatorial('Sun', plannerDate, preferences.location);
  const sunHor = equatorialToHorizontal(sunEq, preferences.location, plannerDate);
  const twilight = getTwilightState(sunHor.altitude);

  return (
    <div className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 text-xs font-mono text-[#48D7FF] mb-3">
            <Moon className="w-3.5 h-3.5" />
            <span>EPHEMERIS OBSERVATION PLANNER</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#EDF5FF] tracking-tight">
            Tonight's Sky
          </h1>
          <p className="text-sm sm:text-base text-[#9EACC4] mt-2 max-w-2xl font-normal">
            Calculated visibility, horizon altitudes, and optimal observing windows tailored to your precise geographic coordinates.
          </p>
        </div>

        {/* Location & Time Indicator */}
        <div className="p-3 rounded-2xl glass-panel border border-white/10 text-xs font-mono text-[#9EACC4] space-y-1.5 shrink-0">
          <div className="flex items-center gap-2 text-[#EDF5FF]">
            <MapPin className="w-4 h-4 text-[#48D7FF]" />
            <span className="font-semibold">{preferences.location.name}</span>
          </div>
          <div>
            Coordinates: {preferences.location.latitude.toFixed(2)}°N, {preferences.location.longitude.toFixed(2)}°E
          </div>
          <div className="text-[#48D7FF]">
            Selected Time: {plannerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Observation Time Scrub Bar */}
      <div className="p-1 rounded-2xl glass-panel-glow border border-white/10 shadow-xl">
        <div className="p-5 rounded-[calc(1rem-0.125rem)] bg-[#071126]/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#EDF5FF]">
              <Clock className="w-4 h-4 text-[#48D7FF]" />
              <span className="font-semibold">Simulate Night Progression:</span>
              <span className="text-[#48D7FF]">
                {plannerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({twilight})
              </span>
            </div>
            {hourOffset !== 0 && (
              <button
                onClick={() => setHourOffset(0)}
                className="text-xs text-[#48D7FF] underline hover:text-white"
              >
                Reset to Current Live Moment
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#9EACC4] shrink-0">-6 hrs</span>
            <input
              type="range"
              min="-6"
              max="12"
              step="0.5"
              value={hourOffset}
              onChange={(e) => setHourOffset(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#48D7FF]"
            />
            <span className="text-xs font-mono text-[#9EACC4] shrink-0">+12 hrs</span>
          </div>
        </div>
      </div>

      {/* Lunar Phase & Twilight Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Moon Card */}
        <div className="p-1.5 rounded-[2rem] bg-white/5 border border-white/10">
          <div className="h-full p-6 rounded-[calc(2rem-0.375rem)] bg-[#071126]/80 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-[#9EACC4]">Lunar Illumination</span>
              <h3 className="text-2xl font-bold font-display text-[#EDF5FF]">
                {skySummary.moonPhaseName}
              </h3>
              <p className="text-xs font-mono text-[#9EACC4]">
                {(skySummary.moonIlluminationFraction * 100).toFixed(1)}% Illuminated • Altitude {skySummary.moonHorizontal.altitude.toFixed(1)}°
              </p>
              <p className="text-xs text-[#9EACC4]/80 leading-relaxed pt-1">
                {skySummary.moonIlluminationFraction > 0.75
                  ? 'Strong moonlight will wash out faint nebulae; optimal for planetary and lunar surface observation.'
                  : 'Low lunar interference; exceptional dark-sky conditions for deep-sky objects and Milky Way.'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 flex items-center justify-center shrink-0 shadow-glow-cyan/20">
              <Moon className="w-8 h-8 text-[#48D7FF]" />
            </div>
          </div>
        </div>

        {/* Solar & Twilight Card */}
        <div className="p-1.5 rounded-[2rem] bg-white/5 border border-white/10">
          <div className="h-full p-6 rounded-[calc(2rem-0.375rem)] bg-[#071126]/80 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-[#9EACC4]">Twilight Status</span>
              <h3 className="text-2xl font-bold font-display text-[#EDF5FF]">
                {twilight}
              </h3>
              <p className="text-xs font-mono text-[#9EACC4]">
                Sun Altitude: {sunHor.altitude.toFixed(1)}° (Azimuth: {sunHor.azimuth.toFixed(0)}°)
              </p>
              <p className="text-xs text-[#9EACC4]/80 leading-relaxed pt-1">
                {twilight === 'Astronomical Night'
                  ? 'True astronomical darkness. Maximum contrast across the celestial dome.'
                  : twilight === 'Day'
                  ? 'Daylight conditions. Planetary observation requires optical solar filters or twilight waiting.'
                  : 'Atmospheric scattering present. Bright planets and magnitude 1 stars clearly visible.'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sun className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Observable Planets Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[#EDF5FF] flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#48D7FF]" />
            <span>Solar System Planets Visibility</span>
          </h2>
          <span className="text-xs font-mono text-[#9EACC4]">
            {planetVisibilities.filter((p) => p.isObservable).length} Observable At Selected Time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planetVisibilities.map(({ planet, hor, riseSet, isObservable }) => (
            <div
              key={planet.id}
              onClick={() => navigate(`/object/${planet.id}`)}
              className="p-1 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-[#48D7FF]/40 transition-all cursor-pointer group"
            >
              <div className="p-5 rounded-[calc(1.5rem-0.25rem)] bg-[#071126]/80 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold font-display text-[#EDF5FF] group-hover:text-[#48D7FF] transition-colors">
                      {planet.name}
                    </h3>
                    <p className="text-xs font-mono text-[#9EACC4]">
                      Mag: {planet.magnitude}m • {planet.spectralType || 'Planet'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase flex items-center gap-1 ${
                      isObservable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : hor.altitude > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isObservable ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Visible</span>
                      </>
                    ) : hor.altitude > 0 ? (
                      <>
                        <Sun className="w-3 h-3" />
                        <span>Twilight/Sun</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Below Horizon</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#9EACC4] bg-black/40 p-3 rounded-xl">
                  <div>
                    <span className="block text-[10px] text-[#9EACC4]/60">Altitude</span>
                    <strong className="text-[#EDF5FF]">{hor.altitude.toFixed(1)}°</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#9EACC4]/60">Azimuth</span>
                    <strong className="text-[#EDF5FF]">{hor.azimuth.toFixed(0)}°</strong>
                  </div>
                  <div className="pt-1">
                    <span className="block text-[10px] text-[#9EACC4]/60">Rises</span>
                    <strong className="text-[#EDF5FF]">
                      {riseSet.rise ? riseSet.rise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </strong>
                  </div>
                  <div className="pt-1">
                    <span className="block text-[10px] text-[#9EACC4]/60">Sets</span>
                    <strong className="text-[#EDF5FF]">
                      {riseSet.set ? riseSet.set.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#48D7FF] font-mono pt-1 group-hover:translate-x-1 transition-transform">
                  <span>View in 3D Universe</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prominent Visible Stars */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-[#EDF5FF] flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#48D7FF]" />
          <span>Prominent Bright Stars in Current Sky</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {visibleStars.map(({ star, hor }) => (
            <div
              key={star.id}
              onClick={() => navigate(`/object/${star.id}`)}
              className="p-3 rounded-xl glass-panel border border-white/5 hover:border-[#48D7FF]/30 cursor-pointer transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#EDF5FF]">{star.name}</span>
                <span className="text-[10px] font-mono text-[#48D7FF]">{star.magnitude.toFixed(1)}m</span>
              </div>
              <div className="text-[11px] font-mono text-[#9EACC4]">
                Alt: {hor.altitude.toFixed(0)}° • Az: {hor.azimuth.toFixed(0)}°
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
