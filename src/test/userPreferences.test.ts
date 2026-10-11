import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadUserPreferences,
  saveUserPreferences,
  clearUserPreferences,
  DEFAULT_PREFERENCES
} from '../services/storage/userPreferences';

describe('User Preferences Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default preferences when storage is empty', () => {
    const prefs = loadUserPreferences();
    expect(prefs.graphicsQuality).toBe('high');
    expect(prefs.showConstellationLines).toBe(true);
    expect(prefs.location.latitude).toBeDefined();
  });

  it('persists and retrieves modified preferences in localStorage', () => {
    const updated = {
      ...DEFAULT_PREFERENCES,
      graphicsQuality: 'low' as const,
      reducedMotion: true
    };
    saveUserPreferences(updated);

    const reloaded = loadUserPreferences();
    expect(reloaded.graphicsQuality).toBe('low');
    expect(reloaded.reducedMotion).toBe(true);
  });

  it('clears stored preferences and resets to defaults', () => {
    saveUserPreferences({ ...DEFAULT_PREFERENCES, graphicsQuality: 'low' as const });
    clearUserPreferences();
    const afterClear = loadUserPreferences();
    expect(afterClear.graphicsQuality).toBe('high');
  });
});
