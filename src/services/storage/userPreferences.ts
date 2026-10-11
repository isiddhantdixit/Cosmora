import { ObserverLocation } from '../../astronomy/types';

export interface UserPreferences {
  location: ObserverLocation;
  graphicsQuality: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  showConstellationLines: boolean;
  showStarLabels: boolean;
  showPlanetOrbits: boolean;
  showAtmosphereGlow: boolean;
  distanceUnit: 'metric' | 'astronomical';
  timeFormat: '24h' | '12h';
}

const STORAGE_KEY = 'cosmora_user_preferences_v1';

export const DEFAULT_OBSERVER_LOCATION: ObserverLocation = {
  latitude: 28.6139,
  longitude: 77.2090,
  elevation: 216,
  name: 'New Delhi (Default)'
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  location: DEFAULT_OBSERVER_LOCATION,
  graphicsQuality: 'high',
  reducedMotion: false,
  showConstellationLines: true,
  showStarLabels: true,
  showPlanetOrbits: true,
  showAtmosphereGlow: true,
  distanceUnit: 'astronomical',
  timeFormat: '24h'
};

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (err) {
    console.warn('Failed to load user preferences from localStorage, using defaults:', err);
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save user preferences:', err);
  }
}

export function clearUserPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear user preferences:', err);
  }
}
