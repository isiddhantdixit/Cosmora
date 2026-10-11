import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useUserPreferences } from './UserPreferencesProvider';
import {
  CelestialObject,
  ConstellationData,
  SatelliteData,
  LocalSkySummary
} from '../../astronomy/types';
import { STARS_CATALOGUE } from '../../astronomy/catalogues/stars';
import { SOLAR_SYSTEM_OBJECTS } from '../../astronomy/catalogues/planets';
import { CONSTELLATIONS_CATALOGUE } from '../../astronomy/catalogues/constellations';
import { SATELLITES_CATALOGUE } from '../../astronomy/satellites/satelliteTracker';
import { getLocalSkySummary } from '../../astronomy/calculations/astronomyEngine';

interface SearchResultItem {
  id: string;
  name: string;
  secondary: string;
  type: 'star' | 'planet' | 'moon' | 'sun' | 'constellation' | 'satellite';
  object?: CelestialObject;
  constellation?: ConstellationData;
  satellite?: SatelliteData;
}

interface AstronomyContextType {
  observationDate: Date;
  setObservationDate: (d: Date) => void;
  isLiveTime: boolean;
  setIsLiveTime: (live: boolean) => void;
  resetToCurrentTime: () => void;
  skySummary: LocalSkySummary;
  searchCatalogue: (query: string) => SearchResultItem[];
  findObjectById: (id: string) => {
    type: 'celestial' | 'constellation' | 'satellite' | 'not-found';
    data: CelestialObject | ConstellationData | SatelliteData | null;
  };
}

const AstronomyContext = createContext<AstronomyContextType | undefined>(undefined);

export const AstronomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = useUserPreferences();
  const [observationDate, setObservationDate] = useState<Date>(new Date());
  const [isLiveTime, setIsLiveTime] = useState<boolean>(true);

  // Live timer tick every 10 seconds if in live time mode
  useEffect(() => {
    if (!isLiveTime) return;
    const interval = setInterval(() => {
      setObservationDate(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, [isLiveTime]);

  const resetToCurrentTime = () => {
    setIsLiveTime(true);
    setObservationDate(new Date());
  };

  // Real-time calculated local sky summary
  const skySummary = useMemo(() => {
    return getLocalSkySummary(preferences.location, observationDate);
  }, [preferences.location, observationDate]);

  // Global search catalogue index
  const searchIndex: SearchResultItem[] = useMemo(() => {
    const list: SearchResultItem[] = [];

    // Planets & Sun & Moon
    SOLAR_SYSTEM_OBJECTS.forEach((obj) => {
      list.push({
        id: obj.id,
        name: obj.name,
        secondary: `${obj.type.toUpperCase()} • ${obj.spectralType || obj.designation || 'Solar System'}`,
        type: obj.type as any,
        object: obj
      });
    });

    // Stars
    STARS_CATALOGUE.forEach((star) => {
      list.push({
        id: star.id,
        name: star.name,
        secondary: `STAR • Mag ${star.magnitude.toFixed(1)} • ${star.spectralType || ''} (${star.designation || ''})`,
        type: 'star',
        object: star
      });
    });

    // Constellations
    CONSTELLATIONS_CATALOGUE.forEach((c) => {
      list.push({
        id: c.id,
        name: c.name,
        secondary: `CONSTELLATION • ${c.latinName} (${c.iauCode}) • ${c.brightestStar}`,
        type: 'constellation',
        constellation: c
      });
    });

    // Satellites
    SATELLITES_CATALOGUE.forEach((sat) => {
      list.push({
        id: sat.id,
        name: sat.name,
        secondary: `SATELLITE • NORAD #${sat.noradId} • ${sat.type}`,
        type: 'satellite',
        satellite: sat
      });
    });

    return list;
  }, []);

  const searchCatalogue = (query: string): SearchResultItem[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return searchIndex
      .filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          item.secondary.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
        );
      })
      .slice(0, 10);
  };

  const findObjectById = (id: string) => {
    // Check planets & stars
    const planet = SOLAR_SYSTEM_OBJECTS.find((p) => p.id === id);
    if (planet) return { type: 'celestial' as const, data: planet };

    const star = STARS_CATALOGUE.find((s) => s.id === id);
    if (star) return { type: 'celestial' as const, data: star };

    const constellation = CONSTELLATIONS_CATALOGUE.find((c) => c.id === id);
    if (constellation) return { type: 'constellation' as const, data: constellation };

    const satellite = SATELLITES_CATALOGUE.find((sat) => sat.id === id);
    if (satellite) return { type: 'satellite' as const, data: satellite };

    return { type: 'not-found' as const, data: null };
  };

  return (
    <AstronomyContext.Provider
      value={{
        observationDate,
        setObservationDate,
        isLiveTime,
        setIsLiveTime,
        resetToCurrentTime,
        skySummary,
        searchCatalogue,
        findObjectById
      }}
    >
      {children}
    </AstronomyContext.Provider>
  );
};

export const useAstronomy = (): AstronomyContextType => {
  const context = useContext(AstronomyContext);
  if (!context) {
    throw new Error('useAstronomy must be used within an AstronomyProvider');
  }
  return context;
};
