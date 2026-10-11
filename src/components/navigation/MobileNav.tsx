import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Orbit, Moon, Globe2, Sparkles, Radio } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const location = useLocation();

  // If in active fullscreen camera AR mode, provide a dedicated streamlined HUD instead of bottom bar
  const isARActive = location.pathname === '/explore';

  const navItems = [
    { to: '/explore', label: 'AR Sky', icon: Compass, special: true },
    { to: '/universe', label: '3D Universe', icon: Orbit },
    { to: '/tonight', label: 'Tonight', icon: Moon },
    { to: '/planets', label: 'Planets', icon: Globe2 },
    { to: '/constellations', label: 'Stars', icon: Sparkles },
    { to: '/satellites', label: 'Satellites', icon: Radio },
  ];

  if (isARActive) {
    return null; // The AR Sky Explorer has its own integrated HUD and exit actions
  }

  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto">
      <div className="glass-panel-glow rounded-2xl p-1.5 flex items-center justify-around border border-white/10 shadow-2xl backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-[#48D7FF] bg-[#163B70]/50 font-semibold'
                    : 'text-[#9EACC4] hover:text-[#EDF5FF]'
                }`
              }
            >
              {item.special ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#163B70] to-[#48D7FF] flex items-center justify-center -mt-4 shadow-glow-cyan border border-white/20">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="text-[10px] mt-0.5 tracking-tight font-mono whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
