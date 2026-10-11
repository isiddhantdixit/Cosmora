import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Globe2,
  Moon,
  Orbit,
  Sparkles,
  Radio,
  Search,
  Settings,
  MapPin,
  Smartphone,
  Menu,
  X
} from 'lucide-react';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import { GlobalSearchModal } from '../ui/GlobalSearchModal';

export const Header: React.FC = () => {
  const { preferences, detectGeolocation, isLocating } = useUserPreferences();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { to: '/explore', label: 'AR Sky', icon: Compass, badge: 'LIVE AR' },
    { to: '/universe', label: '3D Universe', icon: Orbit },
    { to: '/tonight', label: "Tonight's Sky", icon: Moon },
    { to: '/planets', label: 'Planets', icon: Globe2 },
    { to: '/constellations', label: 'Constellations', icon: Sparkles },
    { to: '/satellites', label: 'Satellites', icon: Radio },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-3 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#48D7FF]"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#163B70] to-[#071126] p-0.5 border border-white/15 shadow-glow-cyan/20 group-hover:shadow-glow-cyan transition-all duration-300">
              <div className="w-full h-full rounded-[10px] bg-[#030611] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient from-[#48D7FF]/20 to-transparent opacity-60" />
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#48D7FF] group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-wider font-display bg-clip-text text-transparent bg-gradient-to-r from-[#EDF5FF] via-[#EDF5FF] to-[#48D7FF]">
                COSMORA
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#9EACC4] uppercase hidden sm:block">
                Astrophysics & AR
              </span>
            </div>
          </Link>

          {/* Desktop Primary Nav Bar (Floating Double-Bezel Island) */}
          <nav className="hidden lg:flex items-center p-1.5 rounded-full glass-panel border border-white/10 shadow-lg">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `relative px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide flex items-center gap-2 transition-all duration-200 ${
                        isActive
                          ? 'bg-[#163B70]/80 text-[#EDF5FF] border border-[#48D7FF]/40 shadow-glow-cyan/30'
                          : 'text-[#9EACC4] hover:text-[#EDF5FF] hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 text-[#48D7FF]" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#3B82F6]/30 text-[#48D7FF] border border-[#48D7FF]/30 animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Actions: Location Context, Mobile Pair, Search, Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Observer Location Pill */}
            <button
              onClick={() => detectGeolocation()}
              title="Click to detect current GPS coordinates"
              disabled={isLocating}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel-subtle text-xs font-mono text-[#9EACC4] hover:text-[#EDF5FF] hover:border-[#48D7FF]/30 transition-all cursor-pointer"
            >
              <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce text-[#48D7FF]' : 'text-[#48D7FF]'}`} />
              <span className="max-w-[120px] truncate">{preferences.location.name}</span>
            </button>

            {/* Mobile Camera Companion Link for PC */}
            <button
              onClick={() => navigate('/explore?mode=pair')}
              title="Connect Smartphone Camera to PC Screen"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#163B70]/40 border border-[#48D7FF]/30 text-xs font-medium text-[#48D7FF] hover:bg-[#163B70]/80 hover:shadow-glow-cyan transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pair Phone</span>
            </button>

            {/* Global Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full glass-panel-subtle text-xs text-[#9EACC4] hover:text-[#EDF5FF] hover:border-white/20 transition-all flex items-center gap-2"
              aria-label="Search astronomical objects"
            >
              <Search className="w-4 h-4 text-[#48D7FF]" />
              <span className="hidden sm:inline font-mono text-[11px]">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 text-[9px] font-mono bg-white/10 rounded border border-white/10 text-[#9EACC4]">
                ⌘K
              </kbd>
            </button>

            {/* Settings Link */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `p-2 rounded-full glass-panel-subtle transition-all ${
                  isActive ? 'border-[#48D7FF]/50 text-[#48D7FF]' : 'text-[#9EACC4] hover:text-[#EDF5FF]'
                }`
              }
              aria-label="Preferences and calibration"
            >
              <Settings className="w-4 h-4" />
            </NavLink>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full glass-panel text-[#EDF5FF]"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Expanded Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 p-4 rounded-2xl glass-panel-glow border border-white/15 space-y-2 animate-in fade-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `p-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 border ${
                        isActive
                          ? 'bg-[#163B70] text-[#48D7FF] border-[#48D7FF]/40'
                          : 'bg-black/30 text-[#9EACC4] border-white/5 hover:text-[#EDF5FF]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-[#48D7FF]" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#9EACC4]">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#48D7FF]" />
                <span className="truncate">{preferences.location.name}</span>
              </div>
              <button
                onClick={() => {
                  detectGeolocation();
                  setIsMobileMenuOpen(false);
                }}
                className="text-[#48D7FF] underline text-[11px]"
              >
                Refresh GPS
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
