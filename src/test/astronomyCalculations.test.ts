import { describe, it, expect } from 'vitest';
import {
  calculatePlanetEquatorial,
  calculateMoonPhase,
  calculateRiseSet,
  getTwilightState,
  getLocalSkySummary
} from '../astronomy/calculations/astronomyEngine';
import { ObserverLocation } from '../astronomy/types';

describe('Astronomy Engine Calculations & Ephemerides', () => {
  const testLoc: ObserverLocation = {
    latitude: 28.6139,
    longitude: 77.2090,
    elevation: 216,
    name: 'New Delhi'
  };

  const testDate = new Date('2026-10-12T12:00:00Z');

  it('calculates real-time planetary equatorial coordinates', () => {
    const sunEq = calculatePlanetEquatorial('Sun', testDate, testLoc);
    expect(sunEq.rightAscension).toBeGreaterThanOrEqual(0);
    expect(sunEq.rightAscension).toBeLessThanOrEqual(24);
    expect(sunEq.declination).toBeGreaterThanOrEqual(-24);
    expect(sunEq.declination).toBeLessThanOrEqual(24);
    expect(sunEq.distanceAu).toBeCloseTo(1.0, 1);

    const jupiterEq = calculatePlanetEquatorial('Jupiter', testDate, testLoc);
    expect(jupiterEq.distanceAu).toBeGreaterThan(4.0); // Jupiter is 4 to 6 AU from Earth
    expect(jupiterEq.distanceAu).toBeLessThan(7.0);
  });

  it('calculates lunar phase angle and illumination fraction', () => {
    const moon = calculateMoonPhase(testDate);
    expect(moon.phaseAngleDeg).toBeGreaterThanOrEqual(0);
    expect(moon.phaseAngleDeg).toBeLessThanOrEqual(360);
    expect(moon.illuminationFraction).toBeGreaterThanOrEqual(0);
    expect(moon.illuminationFraction).toBeLessThanOrEqual(1.0);
    expect(typeof moon.phaseName).toBe('string');
  });

  it('calculates Sun and Moon rise and set events', () => {
    const sunEvents = calculateRiseSet('Sun', testLoc, testDate);
    // Over a 24h window at mid-latitudes, the Sun always rises and sets
    expect(sunEvents.rise).toBeInstanceOf(Date);
    expect(sunEvents.set).toBeInstanceOf(Date);
  });

  it('determines solar twilight state from altitude angles', () => {
    expect(getTwilightState(5.0)).toBe('Day');
    expect(getTwilightState(-3.0)).toBe('Civil Twilight');
    expect(getTwilightState(-9.0)).toBe('Nautical Twilight');
    expect(getTwilightState(-15.0)).toBe('Astronomical Twilight');
    expect(getTwilightState(-25.0)).toBe('Astronomical Night');
  });

  it('generates a complete LocalSkySummary', () => {
    const summary = getLocalSkySummary(testLoc, testDate);
    expect(summary.observer.name).toBe('New Delhi');
    expect(summary.localSiderealTimeHours).toBeGreaterThanOrEqual(0);
    expect(summary.sunHorizontal.altitude).toBeDefined();
    expect(summary.moonHorizontal.altitude).toBeDefined();
    expect(typeof summary.twilightState).toBe('string');
    expect(summary.observablePlanetsCount).toBeGreaterThanOrEqual(0);
  });
});
