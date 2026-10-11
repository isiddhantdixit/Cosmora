import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/navigation/Header';
import { MobileNav } from '../components/navigation/MobileNav';
import { GalaxyBackground } from '../three/scenes/GalaxyBackground';
import { LocationPromptModal } from '../components/ui/LocationPromptModal';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  // Certain immersive routes manage their own 3D scene or camera stream
  const isDedicatedCanvas = location.pathname === '/explore' || location.pathname === '/universe';
  const isCompanion = location.pathname === '/companion';

  return (
    <div className="min-h-[100dvh] bg-[#030611] text-[#EDF5FF] flex flex-col relative selection:bg-[#48D7FF]/30 selection:text-white">
      {/* Real-time 3D Galaxy background for observatory & informational pages */}
      {!isDedicatedCanvas && !isCompanion && <GalaxyBackground />}

      {/* Main Top Header Navigation */}
      {!isCompanion && <Header />}

      {/* Coordinate & AR Calibration Prompt on Site Launch */}
      {!isCompanion && <LocationPromptModal />}

      {/* Page Content Outlet */}
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>

      {/* Mobile Bottom Thumb Bar */}
      {!isCompanion && <MobileNav />}
    </div>
  );
};
