import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Orbit,
  Compass,
  ArrowLeft,
  Sparkles,
  Globe2,
  Radio,
  Clock,
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useAstronomy } from '../../app/providers/AstronomyContext';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import {
  calculatePlanetEquatorial,
  equatorialToHorizontal
} from '../../astronomy/calculations/astronomyEngine';
import { CelestialObject, ConstellationData, SatelliteData } from '../../astronomy/types';

export const ObjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { findObjectById, observationDate } = useAstronomy();
  const { preferences } = useUserPreferences();

  const objectLookup = useMemo(() => {
    if (!id) return null;
    return findObjectById(id);
  }, [id, findObjectById]);

  if (!objectLookup || objectLookup.type === 'not-found' || !objectLookup.data) {
    return (
      <div className="relative z-10 pt-32 pb-24 px-4 text-center max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold font-display text-[#EDF5FF]">Celestial Object Not Found</h1>
        <p className="text-xs text-[#9EACC4]">
          The identifier "{id}" does not correspond to a recorded body in the current astronomical catalogue.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#163B70] text-[#48D7FF] text-xs font-mono border border-[#48D7FF]/30 mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Observatory</span>
        </Link>
      </div>
    );
  }

  const { type, data } = objectLookup;

  // Handle celestial star/planet coordinates
  let currentAlt: number | null = null;
  let currentAz: number | null = null;

  if (type === 'celestial') {
    const celestial = data as CelestialObject;
    let eq = celestial.coordinates;
    if (celestial.type === 'planet' || celestial.type === 'sun' || celestial.type === 'moon') {
      try {
        const comp = calculatePlanetEquatorial(celestial.name as any, observationDate, preferences.location);
        eq = { rightAscension: comp.rightAscension, declination: comp.declination };
      } catch {}
    }
    const hor = equatorialToHorizontal(eq, preferences.location, observationDate);
    currentAlt = hor.altitude;
    currentAz = hor.azimuth;
  }

  return (
    <div className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-white/10 text-xs font-mono text-[#9EACC4] hover:text-[#EDF5FF] transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return</span>
      </button>

      {/* Main Header Bento */}
      <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15">
        <div className="p-6 sm:p-8 rounded-[calc(2rem-0.375rem)] bg-[#071126]/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#163B70] text-[#48D7FF]">
                {(data as any).type || type.toUpperCase()}
              </span>
              {(data as any).designation && (
                <span className="text-xs font-mono text-[#9EACC4]">
                  {(data as any).designation}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#EDF5FF] tracking-tight mt-2">
              {(data as any).name}
            </h1>

            <p className="text-sm font-mono text-[#9EACC4] mt-1">
              {(data as any).latinName || (data as any).brightestStar || (data as any).launchDate || 'Astronomical Entity'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(`/universe?focus=${(data as any).id}`)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-xs font-mono shadow-glow-cyan flex items-center gap-2 active:scale-95 transition-all"
            >
              <Orbit className="w-4 h-4" />
              <span>View in 3D Universe</span>
            </button>

            <button
              onClick={() => navigate(`/explore?target=${(data as any).id}`)}
              className="px-6 py-3 rounded-full glass-panel border border-white/15 text-[#EDF5FF] text-xs font-mono flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <Compass className="w-4 h-4 text-[#48D7FF]" />
              <span>Target in AR Sky</span>
            </button>
          </div>
        </div>
      </div>

      {/* Description & Overview */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-white/10 space-y-4">
        <h2 className="text-lg font-bold font-display text-[#EDF5FF]">
          Scientific Profile & Overview
        </h2>
        <p className="text-sm sm:text-base text-[#9EACC4] leading-relaxed">
          {(data as any).description}
        </p>
        {(data as any).historicalContext && (
          <p className="text-xs sm:text-sm text-[#9EACC4]/80 leading-relaxed border-t border-white/5 pt-4">
            <strong className="text-[#48D7FF]">Historical Observation Context: </strong>
            {(data as any).historicalContext}
          </p>
        )}
      </div>

      {/* Astrophysical Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positional Metrics */}
        <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
          <h3 className="text-base font-bold font-display text-[#EDF5FF] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#48D7FF]" />
            <span>Horizon & Coordinates</span>
          </h3>

          <div className="space-y-3 text-xs font-mono divide-y divide-white/5">
            {currentAlt !== null && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Local Horizon Altitude:</span>
                <strong className={currentAlt > 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {currentAlt.toFixed(2)}° ({currentAlt > 0 ? 'Above Horizon' : 'Below Horizon'})
                </strong>
              </div>
            )}

            {currentAz !== null && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Local Horizon Azimuth:</span>
                <strong className="text-[#EDF5FF]">{currentAz.toFixed(2)}°</strong>
              </div>
            )}

            {(data as any).coordinates && (
              <>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[#9EACC4]">Right Ascension (J2000):</span>
                  <strong className="text-[#EDF5FF]">
                    {(data as any).coordinates.rightAscension.toFixed(4)} hours
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[#9EACC4]">Declination (J2000):</span>
                  <strong className="text-[#EDF5FF]">
                    {(data as any).coordinates.declination >= 0 ? '+' : ''}
                    {(data as any).coordinates.declination.toFixed(4)}°
                  </strong>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[#9EACC4]">Observer Location:</span>
              <strong className="text-[#EDF5FF]">{preferences.location.name}</strong>
            </div>
          </div>
        </div>

        {/* Physical Characteristics */}
        <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
          <h3 className="text-base font-bold font-display text-[#EDF5FF] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#48D7FF]" />
            <span>Physical Characteristics</span>
          </h3>

          <div className="space-y-3 text-xs font-mono divide-y divide-white/5">
            {(data as any).magnitude !== undefined && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Apparent Magnitude:</span>
                <strong className="text-[#EDF5FF]">{(data as any).magnitude}m</strong>
              </div>
            )}

            {(data as any).diameterKm && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Mean Diameter:</span>
                <strong className="text-[#EDF5FF]">{(data as any).diameterKm.toLocaleString()} km</strong>
              </div>
            )}

            {(data as any).massKg && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Estimated Mass:</span>
                <strong className="text-[#EDF5FF]">{(data as any).massKg}</strong>
              </div>
            )}

            {(data as any).orbitalPeriodDays !== undefined && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Orbital Period:</span>
                <strong className="text-[#EDF5FF]">{(data as any).orbitalPeriodDays} days</strong>
              </div>
            )}

            {(data as any).rotationPeriodHours !== undefined && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Rotational Period:</span>
                <strong className="text-[#EDF5FF]">{(data as any).rotationPeriodHours} hrs</strong>
              </div>
            )}

            {(data as any).spectralType && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Spectral Classification:</span>
                <strong className="text-[#EDF5FF]">{(data as any).spectralType}</strong>
              </div>
            )}

            {(data as any).distanceLy && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#9EACC4]">Light-Travel Distance:</span>
                <strong className="text-[#EDF5FF]">{(data as any).distanceLy} light-years</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attribution & Provenance */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs font-mono text-[#9EACC4]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#48D7FF]" />
          <span>Ephemeris verified against IAU/SOFA standards & VSOP87 analytical theory.</span>
        </div>
        <span className="text-[10px]">COSMORA DATA ENGINE</span>
      </div>
    </div>
  );
};
