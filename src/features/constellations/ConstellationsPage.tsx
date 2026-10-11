import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Orbit, Compass, Search, ArrowRight, Eye, ShieldCheck } from 'lucide-react';
import { CONSTELLATIONS_CATALOGUE } from '../../astronomy/catalogues/constellations';

export const ConstellationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState<'All' | 'Winter' | 'Spring' | 'Summer' | 'Autumn'>('All');

  const filteredConstellations = CONSTELLATIONS_CATALOGUE.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.latinName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.iauCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brightestStar.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeason = seasonFilter === 'All' || c.season === seasonFilter;
    return matchesQuery && matchesSeason;
  });

  return (
    <div className="relative z-10 pt-24 pb-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 text-xs font-mono text-[#48D7FF] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>IAU 88 ASTRONOMICAL PATTERNS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#EDF5FF] tracking-tight">
            Constellation Explorer
          </h1>
          <p className="text-sm sm:text-base text-[#9EACC4] mt-2 max-w-2xl font-normal">
            Real celestial star patterns mapped to verified Hipparcos coordinate lines, mythological histories, and seasonal visibility windows.
          </p>
        </div>

        {/* Search & Season Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#48D7FF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search constellations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-full glass-panel border border-white/10 text-xs font-mono text-[#EDF5FF] placeholder-[#9EACC4]/60 focus:outline-none focus:border-[#48D7FF]/40"
            />
          </div>

          <div className="p-1 rounded-full glass-panel border border-white/10 flex items-center gap-1 text-xs font-mono">
            {['All', 'Winter', 'Spring', 'Summer', 'Autumn'].map((season) => (
              <button
                key={season}
                onClick={() => setSeasonFilter(season as any)}
                className={`px-3 py-1 rounded-full transition-all ${
                  seasonFilter === season ? 'bg-[#163B70] text-[#48D7FF]' : 'text-[#9EACC4]'
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Constellations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConstellations.map((constellation) => (
          <div
            key={constellation.id}
            className="p-1 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#48D7FF]/40 transition-all flex flex-col justify-between group"
          >
            <div className="p-6 rounded-[calc(2rem-0.25rem)] bg-[#071126]/85 flex flex-col justify-between h-full space-y-5">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#163B70] text-[#48D7FF]">
                      {constellation.iauCode} • {constellation.season} Sky
                    </span>
                    <h3 className="text-2xl font-bold font-display text-[#EDF5FF] mt-2 group-hover:text-[#48D7FF] transition-colors">
                      {constellation.name}
                    </h3>
                    <p className="text-xs font-mono text-[#9EACC4]">
                      {constellation.latinName} ({constellation.genitive})
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 flex items-center justify-center text-[#48D7FF]">
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </div>
                </div>

                <p className="text-xs text-[#9EACC4] mt-3 leading-relaxed">
                  {constellation.description}
                </p>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 mt-4 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#9EACC4]">
                    <span>Brightest Star:</span>
                    <strong className="text-[#EDF5FF]">{constellation.brightestStar}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[#9EACC4]">
                    <span>Celestial Hemisphere:</span>
                    <strong className="text-[#EDF5FF]">{constellation.hemisphere}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[#9EACC4]">
                    <span>Key Asterism Stars:</span>
                    <strong className="text-[#48D7FF]">{constellation.starIds.length} Stars Mapped</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => navigate(`/universe?focus=${constellation.id}`)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-semibold text-xs font-mono flex items-center justify-center gap-1.5 shadow-glow-cyan"
                >
                  <Orbit className="w-3.5 h-3.5" />
                  <span>View in 3D Planetarium</span>
                </button>

                <button
                  onClick={() => navigate(`/explore`)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#48D7FF] text-xs font-mono border border-white/10"
                  title="Find in AR Sky"
                >
                  <Compass className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
