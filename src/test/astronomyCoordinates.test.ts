import { describe, it, expect } from 'vitest';
import {
  equatorialToCartesian,
  horizontalToCartesian,
  projectCelestialToScreen
} from '../astronomy/coordinates/coordinateMath';
import {
  calculateLocalSiderealTime,
  equatorialToHorizontal
} from '../astronomy/calculations/astronomyEngine';
import { ObserverLocation } from '../astronomy/types';

describe('Astrometric Coordinate Math & Conversions', () => {
  const greenwich: ObserverLocation = {
    latitude: 51.4769,
    longitude: 0.0,
    elevation: 46,
    name: 'Greenwich Observatory'
  };

  it('converts equatorial coordinates to 3D Cartesian coordinates accurately', () => {
    // North Celestial Pole (Dec = +90°) should point directly along +Y
    const northPoleVec = equatorialToCartesian({ rightAscension: 0, declination: 90 }, 100);
    expect(northPoleVec.x).toBeCloseTo(0, 1);
    expect(northPoleVec.y).toBeCloseTo(100, 1);
    expect(northPoleVec.z).toBeCloseTo(0, 1);

    // Vernal Equinox (RA = 0h, Dec = 0°) should point along +X
    const equinoxVec = equatorialToCartesian({ rightAscension: 0, declination: 0 }, 100);
    expect(equinoxVec.x).toBeCloseTo(100, 1);
    expect(equinoxVec.y).toBeCloseTo(0, 1);
    expect(equinoxVec.z).toBeCloseTo(0, 1);
  });

  it('converts horizontal Alt/Az coordinates to 3D Cartesian coordinates', () => {
    // Zenith (Altitude = +90°) should point directly along +Y
    const zenithVec = horizontalToCartesian({ altitude: 90, azimuth: 0, isVisible: true }, 100);
    expect(zenithVec.x).toBeCloseTo(0, 1);
    expect(zenithVec.y).toBeCloseTo(100, 1);
    expect(zenithVec.z).toBeCloseTo(0, 1);

    // True North Horizon (Alt = 0°, Az = 0°) should point along -Z
    const northVec = horizontalToCartesian({ altitude: 0, azimuth: 0, isVisible: false }, 100);
    expect(northVec.x).toBeCloseTo(0, 1);
    expect(northVec.y).toBeCloseTo(0, 1);
    expect(northVec.z).toBeCloseTo(-100, 1);

    // Due East Horizon (Alt = 0°, Az = 90°) should point along +X
    const eastVec = horizontalToCartesian({ altitude: 0, azimuth: 90, isVisible: false }, 100);
    expect(eastVec.x).toBeCloseTo(100, 1);
    expect(eastVec.y).toBeCloseTo(0, 1);
    expect(eastVec.z).toBeCloseTo(0, 1);
  });

  it('calculates Local Sidereal Time within valid 0 to 24 hours range', () => {
    const testDate = new Date('2026-03-21T12:00:00Z'); // Vernal equinox
    const lst = calculateLocalSiderealTime(greenwich, testDate);
    expect(lst).toBeGreaterThanOrEqual(0);
    expect(lst).toBeLessThanOrEqual(24);
  });

  it('transforms equatorial coordinates to observer horizontal coordinates', () => {
    // Test Polaris (Dec ~ 89.26°) from Greenwich (Lat ~ 51.5°N)
    // Polaris altitude should be very close to observer latitude (~51.5°)
    const polarisHor = equatorialToHorizontal(
      { rightAscension: 2.53, declination: 89.26 },
      greenwich,
      new Date('2026-06-21T00:00:00Z')
    );
    expect(polarisHor.altitude).toBeGreaterThan(50);
    expect(polarisHor.altitude).toBeLessThan(53);
    expect(polarisHor.isVisible).toBe(true);
  });

  it('projects celestial Alt/Az coordinates onto 2D AR screen viewport', () => {
    // Object straight ahead (Heading 0°, Pitch 45°, Object at Az 0°, Alt 45°)
    // Should project directly at the center of the screen
    const screenWidth = 1080;
    const screenHeight = 1920;
    const projCenter = projectCelestialToScreen(
      { altitude: 45, azimuth: 0, isVisible: true },
      0,   // device heading 0°
      45,  // device pitch 45°
      screenWidth,
      screenHeight,
      65   // FOV
    );

    expect(projCenter.inView).toBe(true);
    expect(projCenter.x).toBeCloseTo(screenWidth / 2, 0);
    expect(projCenter.y).toBeCloseTo(screenHeight / 2, 0);
    expect(projCenter.distanceFromCenter).toBeCloseTo(0, 1);

    // Object completely behind camera should have inView = false
    const projBehind = projectCelestialToScreen(
      { altitude: 45, azimuth: 180, isVisible: true }, // opposite azimuth (behind)
      0,
      45,
      screenWidth,
      screenHeight,
      65
    );
    expect(projBehind.inView).toBe(false);
  });
});
