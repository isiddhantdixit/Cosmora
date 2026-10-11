import { describe, it, expect } from 'vitest';
import {
  SATELLITES_CATALOGUE,
  calculateSatellitePosition
} from '../astronomy/satellites/satelliteTracker';
import { ObserverLocation } from '../astronomy/types';

describe('SGP4 Satellite Orbit Tracking', () => {
  const observer: ObserverLocation = {
    latitude: 51.5,
    longitude: 0.0,
    elevation: 50,
    name: 'London'
  };

  it('propagates the International Space Station orbit successfully', () => {
    const iss = SATELLITES_CATALOGUE.find((s) => s.id === 'sat-iss');
    expect(iss).toBeDefined();

    const livePos = calculateSatellitePosition(iss!, observer, new Date());
    expect(livePos).not.toBeNull();
    if (livePos) {
      // ISS orbits in Low Earth Orbit between ~320 km and ~450 km
      expect(livePos.altitudeKm).toBeGreaterThan(300);
      expect(livePos.altitudeKm).toBeLessThan(500);

      // Orbital velocity in LEO is approximately 7.5 to 7.8 km/s
      expect(livePos.velocityKmS).toBeGreaterThan(7.0);
      expect(livePos.velocityKmS).toBeLessThan(8.2);

      // Latitude between -52° and +52° (inclination is 51.64°)
      expect(livePos.latitude).toBeGreaterThanOrEqual(-52);
      expect(livePos.latitude).toBeLessThanOrEqual(52);

      // Longitude between -180° and +180°
      expect(livePos.longitude).toBeGreaterThanOrEqual(-180);
      expect(livePos.longitude).toBeLessThanOrEqual(180);

      // Look angles
      expect(livePos.horizontal.altitude).toBeDefined();
      expect(livePos.horizontal.azimuth).toBeGreaterThanOrEqual(0);
      expect(livePos.horizontal.azimuth).toBeLessThanOrEqual(360);
    }
  });
});
