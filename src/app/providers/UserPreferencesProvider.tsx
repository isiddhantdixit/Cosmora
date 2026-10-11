import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
  loadUserPreferences,
  saveUserPreferences,
  clearUserPreferences
} from '../../services/storage/userPreferences';
import { ObserverLocation } from '../../astronomy/types';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  updateLocation: (loc: ObserverLocation) => void;
  detectGeolocation: () => Promise<boolean>;
  resetToDefaults: () => void;
  isLocating: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences());
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    saveUserPreferences(preferences);
  }, [preferences]);

  const updatePreferences = (partial: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
  };

  const updateLocation = (loc: ObserverLocation) => {
    setPreferences((prev) => ({ ...prev, location: loc }));
  };

  const detectGeolocation = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(false);
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc: ObserverLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            elevation: pos.coords.altitude || 0,
            name: `Detected (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`
          };
          updateLocation(newLoc);
          setIsLocating(false);
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation access failed or denied:', err.message);
          setIsLocating(false);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const resetToDefaults = () => {
    clearUserPreferences();
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        updateLocation,
        detectGeolocation,
        resetToDefaults,
        isLocating
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
