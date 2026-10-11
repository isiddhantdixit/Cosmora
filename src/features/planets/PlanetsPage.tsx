import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Orbit, Compass, ArrowRight, ShieldCheck, Layers, Eye } from 'lucide-react';
import { SOLAR_SYSTEM_OBJECTS } from '../../astronomy/catalogues/planets';
import { useAstronomy } from '../../app/providers/AstronomyContext';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import { calculatePlanetEquatorial, equatorialToHorizontal } from '../../astronomy/calculations/astronomyEngine';

export const PlanetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { observationDate } = useAstronomy();
  const { preferences } = useUserPreferences();
  const [filter, setFilter] = useState<'all' | 'terrestrial' | 'gas-giant' | 'ice-giant'>('all');

  const filteredPlanets = SOLAR_SYSTEM_OBJECTS.filter((obj) => {
    if (filter === 'terrestrial') return ['body-mercury', 'body-venus', 'body-mars', 'body-moon'].includes(obj.id);
    if (filter === 'gas-giant') return ['body-jupiter', 'body-saturn'].includes(obj.id);
    if (filter === 'ice-giant') return ['body-uranus', 'body-neptune'].includes(obj.id);
    return true;
  });

  return (
    <div className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 text-xs font-mono text-[#48D7FF] mb-3">
            <Globe2 className="w-3.5 h-3.5" />
            <span>SOLAR SYSTEM CORONA & ORBITS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#EDF5FF] tracking-tight">
            Planet Explorer
          </h1>
          <p className="text-sm sm:text-base text-[#9EACC4] mt-2 max-w-2xl font-normal">
            Physical astrophysics, atmospheric compositions, and instantaneous planetary coordinates computed with VSOP87 analytical ephemerides.
          </p>
        </div>

        {/* Category Filters */}
        <div className="p-1 rounded-full glass-panel border border-white/10 flex items-center gap-1 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full transition-all ${filter === 'all' ? 'bg-[#163B70] text-[#48D7FF]' : 'text-[#9EACC4]'}`}
          >
            All Bodies
          </button>
          <button
            onClick={() => setFilter('terrestrial')}
            className={`px-3 py-1.5 rounded-full transition-all ${filter === 'terrestrial' ? 'bg-[#163B70] text-[#48D7FF]' : 'text-[#9EACC4]'}`}
          >
            Terrestrial
          </button>
          <button
            onClick={() => setFilter('gas-giant')}
            className={`px-3 py-1.5 rounded-full transition-all ${filter === 'gas-giant' ? 'bg-[#163B70] text-[#48D7FF]' : 'text-[#9EACC4]'}`}
          >
            Gas Giants
          </button>
          <button
            onClick={() => setFilter('ice-giant')}
            className={`px-3 py-1.5 rounded-full transition-all ${filter === 'ice-giant' ? 'bg-[#163B70] text-[#48D7FF]' : 'text-[#9EACC4]'}`}
          >
            Ice Giants
          </button>
        </div>
      </div>

      {/* Planets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlanets.map((planet) => {
          let currentAlt = 0;
          let currentAz = 0;
          try {
            const eq = calculatePlanetEquatorial(planet.name as any, observationDate, preferences.location);
            const hor = equatorialToHorizontal(eq, preferences.location, observationDate);
            currentAlt = hor.altitude;
            currentAz = hor.azimuth;
          } catch {}

          return (
            <div
              key={planet.id}
              className="p-1 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#48D7FF]/40 transition-all flex flex-col justify-between group"
            >
              <div className="p-6 rounded-[calc(2rem-0.25rem)] bg-[#071126]/85 flex flex-col justify-between h-full space-y-5">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#163B70] text-[#48D7FF]">
                        {planet.type}
                      </span>
                      <h3 className="text-2xl font-bold font-display text-[#EDF5FF] mt-2 group-hover:text-[#48D7FF] transition-colors">
                        {planet.name}
                      </h3>
                      <p className="text-xs font-mono text-[#9EACC4]">
                        {planet.designation || planet.latinName}
                      </p>
                    </div>

                    {/* Planet Visual Swatch */}
                    <div
                      className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shadow-lg"
                      style={{
                        backgroundColor: planet.colorHex || '#EDF5FF',
                        boxShadow: `0 0 25px ${planet.colorHex}40`
                      }}
                    />
                  </div>

                  <p className="text-xs text-[#9EACC4] mt-3 leading-relaxed line-clamp-3">
                    {planet.description}
                  </p>
                </div>

                {/* Astrophysical Metrics Bento */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#9EACC4] bg-black/40 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="block text-[10px] text-[#9EACC4]/60">Diameter</span>
                    <strong className="text-[#EDF5FF]">
                      {planet.diameterKm?.toLocaleString()} km
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#9EACC4]/60">Orbital Period</span>
                    <strong className="text-[#EDF5FF]">
                      {planet.orbitalPeriodDays ? `${planet.orbitalPeriodDays} d` : 'Center'}
                    </strong>
                  </div>
                  <div className="pt-1">
                    <span className="block text-[10px] text-[#9EACC4]/60">Current Altitude</span>
                    <strong className={currentAlt > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {currentAlt.toFixed(1)}° ({currentAlt > 0 ? 'Above' : 'Below'})
                    </strong>
                  </div>
                  <div className="pt-1">
                    <span className="block text-[10px] text-[#9EACC4]/60">Moons Count</span>
                    <strong className="text-[#EDF5FF]">{planet.moonsCount || 0}</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/object/${planet.id}`)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-xs font-mono flex items-center justify-center gap-1.5 shadow-glow-cyan"
                  >
                    <span>Full Telemetry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigate(`/universe?focus=${planet.id}`)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#48D7FF] text-xs font-mono border border-white/10"
                    title="Focus in 3D Universe"
                  >
                    <Orbit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate(`/explore?target=${planet.id}`)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#3B82F6] text-xs font-mono border border-white/10"
                    title="Track in AR Sky"
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
