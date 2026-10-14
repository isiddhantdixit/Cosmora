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
  Menu,
  X,
  User
} from 'lucide-react';
import { useUserPreferences } from '../../app/providers/UserPreferencesProvider';
import { GlobalSearchModal } from '../ui/GlobalSearchModal';
import { DeveloperContactModal } from '../ui/DeveloperContactModal';

export const Header: React.FC = () => {
  const { preferences, detectGeolocation, isLocating } = useUserPreferences();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Navigation Links
  const navLinks = [
    { to: '/explore', label: 'AR Sky', icon: Compass, isAR: true },
    { to: '/universe', label: '3D Universe', icon: Orbit },
    { to: '/tonight', label: "Tonight's Sky", icon: Moon },
    { to: '/planets', label: 'Planets', icon: Globe2 },
    { to: '/constellations', label: 'Constellations', icon: Sparkles },
    { to: '/satellites', label: 'Satellites', icon: Radio },
  ];

  // Nicely format location string
  const formattedLocation = preferences.location.name.startsWith('Detected')
    ? `${preferences.location.latitude.toFixed(1)}°N, ${preferences.location.longitude.toFixed(1)}°E`
    : preferences.location.name;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-3 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#48D7FF]"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#163B70] via-[#071126] to-[#030611] p-0.5 border border-[#48D7FF]/30 shadow-glow-cyan/25 group-hover:shadow-glow-cyan group-hover:border-[#48D7FF]/60 transition-all duration-300">
              <div className="w-full h-full rounded-[10px] bg-[#030611] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient from-[#48D7FF]/20 to-transparent opacity-60" />
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#48D7FF] group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-widest font-display bg-clip-text text-transparent bg-gradient-to-r from-[#EDF5FF] via-[#EDF5FF] to-[#48D7FF]">
                COSMORA
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#9EACC4] uppercase hidden sm:block">
                Astrophysics & AR
              </span>
            </div>
          </Link>

          {/* Unified Desktop Navigation Bar */}
          <nav className="hidden lg:flex items-center p-1 rounded-full glass-panel border border-white/10 shadow-lg">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                if (link.isAR) {
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] shadow-glow-cyan font-bold'
                            : 'bg-[#163B70]/40 text-[#48D7FF] border border-[#48D7FF]/30 hover:border-[#48D7FF] hover:bg-[#163B70]/70'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono bg-[#48D7FF]/20 uppercase">
                        Live
                      </span>
                    </NavLink>
                  );
                }

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-full text-xs font-medium tracking-wide flex items-center gap-1.5 transition-all duration-200 ${
                        isActive
                          ? 'bg-[#163B70]/80 text-[#EDF5FF] border border-[#48D7FF]/40 shadow-glow-cyan/20'
                          : 'text-[#9EACC4] hover:text-[#EDF5FF] hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 text-[#48D7FF]/80" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Action Icons: Location, Search, Contact, Settings */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Observer Location Context */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('cosmora:open-location-prompt'))}
              title="Click to calibrate GPS coordinates and local horizon"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel-subtle text-xs font-mono text-[#9EACC4] hover:text-[#EDF5FF] hover:border-[#48D7FF]/30 transition-all cursor-pointer"
            >
              <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce text-[#48D7FF]' : 'text-[#48D7FF]'}`} />
              <span className="max-w-[120px] truncate">{formattedLocation}</span>
            </button>

            {/* Global Search Dialog Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full glass-panel-subtle text-xs text-[#9EACC4] hover:text-[#EDF5FF] hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              aria-label="Search astronomical objects"
            >
              <Search className="w-3.5 h-3.5 text-[#48D7FF]" />
              <span className="hidden sm:inline font-mono text-[11px]">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono bg-white/10 rounded border border-white/10 text-[#9EACC4]">
                ⌘K
              </kbd>
            </button>

            {/* Developer Contact Button */}
            <button
              onClick={() => setIsContactOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full glass-panel-subtle text-xs font-mono text-[#9EACC4] hover:text-[#EDF5FF] hover:border-[#48D7FF]/30 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Developer Contact: Siddhant Dixit"
            >
              <User className="w-3.5 h-3.5 text-[#48D7FF]" />
              <span className="hidden xl:inline text-[11px]">Developer</span>
            </button>

            {/* Settings Link */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `p-2 rounded-full glass-panel-subtle transition-all cursor-pointer ${
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
              className="lg:hidden p-2 rounded-full glass-panel text-[#EDF5FF] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 p-4 rounded-2xl glass-panel-glow border border-white/15 space-y-3 animate-in fade-in slide-in-from-top duration-200">
            {/* Prominent AR Sky Button in Mobile Menu */}
            <NavLink
              to="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-bold text-sm flex items-center justify-between shadow-glow-cyan"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-[#030611]" />
                <span className="font-display tracking-wider">OPEN AR SKY EXPLORER</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/20 text-[#030611]">
                LIVE CAMERA
              </span>
            </NavLink>

            {/* Navigation Links Grid */}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.filter((l) => !l.isAR).map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
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

            {/* Developer Contact Quick Link */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsContactOpen(true);
              }}
              className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs text-[#EDF5FF] font-mono"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#48D7FF]" />
                <span>Developer: Siddhant Dixit</span>
              </div>
              <span className="text-[10px] text-[#48D7FF]">Contact</span>
            </button>

            {/* GPS Location & Settings */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#9EACC4]">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#48D7FF]" />
                <span className="truncate">{formattedLocation}</span>
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

      {/* Developer Contact Modal */}
      <DeveloperContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
};
