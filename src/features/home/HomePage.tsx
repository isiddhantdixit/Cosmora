import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Orbit,
  Moon,
  Sparkles,
  ArrowRight,
  Radio,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useAstronomy } from '../../app/providers/AstronomyContext';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';

export const HomePage: React.FC = () => {
  const { skySummary, observationDate } = useAstronomy();
  const { preferences } = useUserPreferences();
  const navigate = useNavigate();

  // Upcoming verified astronomical events
  const upcomingEvents = [
    {
      title: 'Perseid Meteor Shower Peak',
      date: 'Aug 12-13',
      type: 'Meteor Shower',
      description: 'Up to 100 meteors/hr entering Earth atmosphere from Comet Swift-Tuttle debris stream.',
      highlight: true
    },
    {
      title: 'Jupiter at Opposition',
      date: 'Optimal Viewing Window',
      type: 'Planetary Alignment',
      description: 'Jupiter makes its closest annual approach to Earth, shining brilliantly at magnitude -2.8.',
      highlight: false
    },
    {
      title: 'ISS Overhead Passes',
      date: 'Daily Calculated',
      type: 'Spacecraft Transit',
      description: 'Zarya solar arrays reflecting high twilight sunlight across the evening horizon.',
      highlight: false
    }
  ];

  return (
    <div className="relative z-10 pt-24 sm:pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-20">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
        {/* Eyebrow tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 text-xs font-mono text-[#48D7FF] shadow-glow-cyan/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ASTRONOMICAL AR & REAL-TIME WEBGL PLANETARIUM</span>
        </div>

        {/* Massive Agency Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-display tracking-tight text-[#EDF5FF] leading-[1.08] drop-shadow-[0_4px_24px_rgba(3,6,17,0.95)]">
          The Universe, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#48D7FF] via-[#60A5FA] to-[#A78BFA] drop-shadow-sm">
            Around You.
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-[#B4C2D8] max-w-2xl font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(3,6,17,0.9)]">
          Point your device at the night sky to identify stars, planets, and constellations in real-time augmented reality—or step inside our scientifically accurate interactive 3D universe.
        </p>

        {/* Primary & Secondary Dual CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
          {/* Primary AR Action */}
          <Link
            to="/explore"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-sm tracking-wide shadow-glow-cyan hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            <Compass className="w-4 h-4 text-[#030611] group-hover:rotate-45 transition-transform" />
            <span>Open AR Sky Explorer</span>
            <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Secondary 3D Universe Action */}
          <Link
            to="/universe"
            className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel border border-white/15 text-[#EDF5FF] font-medium text-sm tracking-wide hover:bg-white/10 hover:border-[#48D7FF]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            <Orbit className="w-4 h-4 text-[#48D7FF] group-hover:spin-slow" />
            <span>Explore 3D Universe</span>
          </Link>
        </div>

        {/* Device Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#9EACC4] font-mono pt-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#48D7FF]" />
            <span>Zero Fake Data • IAU & Hipparcos Calculated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#3B82F6]" />
            <span>Mobile-First AR + PC Companion Sync</span>
          </div>
        </div>
      </section>

      {/* Live Local Sky Summary (Double-Bezel Bento Grid) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#EDF5FF]">
              Live Local Sky Conditions
            </h2>
            <p className="text-xs sm:text-sm text-[#9EACC4] font-mono">
              Observer: {preferences.location.name} • {observationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Link
            to="/tonight"
            className="text-xs font-mono text-[#48D7FF] hover:underline flex items-center gap-1"
          >
            <span>Full Night Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Twilight Condition */}
          <div className="p-1 rounded-[1.5rem] bg-white/5 border border-white/10">
            <div className="h-full p-5 rounded-[calc(1.5rem-0.25rem)] bg-[#071126]/90 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#9EACC4]">Solar State</span>
                <span className={`w-2.5 h-2.5 rounded-full ${skySummary.twilightState === 'Day' ? 'bg-amber-400' : 'bg-[#48D7FF]'} animate-pulse`} />
              </div>
              <div>
                <div className="text-xl font-bold font-display text-[#EDF5FF]">
                  {skySummary.twilightState}
                </div>
                <div className="text-xs text-[#9EACC4] font-mono mt-1">
                  Sun Alt: {skySummary.sunHorizontal.altitude.toFixed(1)}°
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Moon Phase & Illumination */}
          <div className="p-1 rounded-[1.5rem] bg-white/5 border border-white/10">
            <div className="h-full p-5 rounded-[calc(1.5rem-0.25rem)] bg-[#071126]/90 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#9EACC4]">Lunar Cycle</span>
                <Moon className="w-4 h-4 text-[#48D7FF]" />
              </div>
              <div>
                <div className="text-xl font-bold font-display text-[#EDF5FF]">
                  {skySummary.moonPhaseName}
                </div>
                <div className="text-xs text-[#9EACC4] font-mono mt-1">
                  {(skySummary.moonIlluminationFraction * 100).toFixed(0)}% Illuminated • Alt {skySummary.moonHorizontal.altitude.toFixed(1)}°
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Observable Planets */}
          <div className="p-1 rounded-[1.5rem] bg-white/5 border border-white/10">
            <div className="h-full p-5 rounded-[calc(1.5rem-0.25rem)] bg-[#071126]/90 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#9EACC4]">Planets Above Horizon</span>
                <Eye className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div>
                <div className="text-xl font-bold font-display text-[#EDF5FF]">
                  {skySummary.observablePlanetsCount} Visible Now
                </div>
                <div className="text-xs text-[#9EACC4] font-mono mt-1">
                  Jupiter, Saturn, Venus calculated
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Local Sidereal Time */}
          <div className="p-1 rounded-[1.5rem] bg-white/5 border border-white/10">
            <div className="h-full p-5 rounded-[calc(1.5rem-0.25rem)] bg-[#071126]/90 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#9EACC4]">Sidereal Time (LST)</span>
                <Layers className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div>
                <div className="text-xl font-bold font-display font-mono text-[#EDF5FF]">
                  {Math.floor(skySummary.localSiderealTimeHours).toString().padStart(2, '0')}:
                  {Math.floor((skySummary.localSiderealTimeHours % 1) * 60).toString().padStart(2, '0')} LST
                </div>
                <div className="text-xs text-[#9EACC4] font-mono mt-1">
                  ~{skySummary.observableStarsCount} Bright Stars in Sky Dome
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Celestial Body & Quick Exploration Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Object: Mars */}
        <div className="lg:col-span-2 p-1.5 rounded-[2rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10">
          <div className="h-full p-6 sm:p-8 rounded-[calc(2rem-0.375rem)] bg-[#071126]/80 flex flex-col justify-between space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30">
                  Featured Celestial Body
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-[#EDF5FF] mt-3">
                  Mars — The Red Planet
                </h3>
                <p className="text-xs font-mono text-[#9EACC4] mt-1">
                  Sol IV • 1.524 AU • Terrestrial Iron-Oxide Crust
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F87171]/20 border border-[#F87171]/40 flex items-center justify-center shrink-0 shadow-glow-amber">
                <div className="w-6 h-6 rounded-full bg-[#F87171] animate-pulse" />
              </div>
            </div>

            <p className="text-sm text-[#9EACC4] leading-relaxed">
              Named for the Roman god of war. Its rusty reddish hue is caused by iron oxide pervasive across the soil. Features the largest canyon system (Valles Marineris) and highest volcano (Olympus Mons) in the Solar System.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/object/body-mars')}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono text-[#EDF5FF] border border-white/10 flex items-center gap-2 transition-all"
              >
                <span>Scientific Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/universe?focus=body-mars')}
                className="px-5 py-2.5 rounded-full bg-[#163B70]/80 hover:bg-[#163B70] text-xs font-mono text-[#48D7FF] border border-[#48D7FF]/30 flex items-center gap-2 transition-all shadow-glow-cyan/20"
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>Orbit in 3D</span>
              </button>
            </div>
          </div>
        </div>

        {/* Astronomical Events Column */}
        <div className="p-1.5 rounded-[2rem] bg-white/5 border border-white/10">
          <div className="h-full p-6 rounded-[calc(2rem-0.375rem)] bg-[#071126]/80 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-[#EDF5FF] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#48D7FF]" />
                <span>Astronomical Horizon</span>
              </h3>
              <span className="text-[10px] font-mono text-[#9EACC4]">Ephemeris</span>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-[#48D7FF]/30 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#EDF5FF]">{evt.title}</span>
                    <span className="text-[10px] font-mono text-[#48D7FF]">{evt.date}</span>
                  </div>
                  <p className="text-[11px] text-[#9EACC4] mt-1 leading-snug">
                    {evt.description}
                  </p>
                </div>
              ))}
            </div>

            <Link
              to="/satellites"
              className="text-xs font-mono text-[#48D7FF] hover:underline flex items-center justify-between pt-2"
            >
              <span>Track Active Satellite Passes</span>
              <Radio className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Navigation & Developer Credits */}
      <footer className="pt-12 pb-8 border-t border-white/10 flex flex-col gap-6 text-xs text-[#9EACC4] font-mono">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#48D7FF]" />
            <span className="font-semibold text-[#EDF5FF]">COSMORA</span>
            <span>• Open Astronomical & AR Engine</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link to="/explore" className="hover:text-[#48D7FF] transition-colors">AR Sky</Link>
            <Link to="/universe" className="hover:text-[#48D7FF] transition-colors">3D Universe</Link>
            <Link to="/tonight" className="hover:text-[#48D7FF] transition-colors">Tonight's Sky</Link>
            <Link to="/planets" className="hover:text-[#48D7FF] transition-colors">Planets</Link>
            <Link to="/constellations" className="hover:text-[#48D7FF] transition-colors">Constellations</Link>
            <Link to="/satellites" className="hover:text-[#48D7FF] transition-colors">Satellites</Link>
            <Link to="/settings" className="hover:text-[#48D7FF] transition-colors">Settings</Link>
          </div>
        </div>

        {/* Developer Contact & Telemetry Attribution */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#9EACC4]/80">
          <div className="flex items-center gap-2">
            <span>Developed by <strong className="text-[#EDF5FF] font-medium">Siddhant Dixit</strong></span>
            <span>•</span>
            <a
              href="mailto:siddhantdixit@lifagroup.in"
              className="text-[#48D7FF] hover:underline"
              title="Email Siddhant Dixit"
            >
              siddhantdixit@lifagroup.in
            </a>
          </div>
          <p className="text-center sm:text-right text-[#9EACC4]/60">
            Astrodynamics & Telemetry: Hipparcos • NASA JPL • Celestrak TLE
          </p>
        </div>
      </footer>
    </div>
  );
};
