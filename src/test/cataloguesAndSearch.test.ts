import { describe, it, expect } from 'vitest';
import { STARS_CATALOGUE } from '../astronomy/catalogues/stars';
import { SOLAR_SYSTEM_OBJECTS } from '../astronomy/catalogues/planets';
import { CONSTELLATIONS_CATALOGUE } from '../astronomy/catalogues/constellations';
import { SATELLITES_CATALOGUE } from '../astronomy/satellites/satelliteTracker';

describe('Astrometric Catalogues & Data Consistency', () => {
  it('contains valid Hipparcos catalogue star data', () => {
    expect(STARS_CATALOGUE.length).toBeGreaterThan(30);

    STARS_CATALOGUE.forEach((star) => {
      expect(star.id).toBeTruthy();
      expect(star.name).toBeTruthy();
      expect(star.coordinates.rightAscension).toBeGreaterThanOrEqual(0);
      expect(star.coordinates.rightAscension).toBeLessThanOrEqual(24);
      expect(star.coordinates.declination).toBeGreaterThanOrEqual(-90);
      expect(star.coordinates.declination).toBeLessThanOrEqual(90);
      expect(typeof star.magnitude).toBe('number');
      expect(star.colorHex).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  it('contains the Sun and all 8 major planets with valid physical data', () => {
    const requiredNames = ['Sun', 'Mercury', 'Venus', 'Moon', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    requiredNames.forEach((name) => {
      const found = SOLAR_SYSTEM_OBJECTS.find((p) => p.name === name);
      expect(found).toBeDefined();
      expect(found?.diameterKm).toBeGreaterThan(0);
      expect(found?.description).toBeTruthy();
    });
  });

  it('ensures constellation connecting lines reference existing star IDs', () => {
    const starIds = new Set(STARS_CATALOGUE.map((s) => s.id));

    CONSTELLATIONS_CATALOGUE.forEach((constellation) => {
      expect(constellation.name).toBeTruthy();
      expect(constellation.iauCode).toBeTruthy();

      constellation.lines.forEach(([startId, endId]) => {
        expect(starIds.has(startId)).toBe(true);
        expect(starIds.has(endId)).toBe(true);
      });
    });
  });

  it('contains valid TLE lines for active spacecraft', () => {
    expect(SATELLITES_CATALOGUE.length).toBeGreaterThanOrEqual(3);

    SATELLITES_CATALOGUE.forEach((sat) => {
      expect(sat.noradId).toBeGreaterThan(0);
      expect(sat.line1.startsWith('1 ')).toBe(true);
      expect(sat.line2.startsWith('2 ')).toBe(true);
      expect(sat.line1.length).toBeGreaterThanOrEqual(60);
      expect(sat.line2.length).toBeGreaterThanOrEqual(60);
    });
  });
});
