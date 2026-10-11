import * as THREE from 'three';
import { EquatorialCoordinates, HorizontalCoordinates } from '../types';

/**
 * Converts Equatorial Coordinates (RA in hours, Dec in degrees)
 * to a 3D Cartesian position vector on a celestial sphere of given radius.
 * Orientation: +Y is North Celestial Pole (Dec = +90°),
 * +X is Vernal Equinox (RA = 0h, Dec = 0°).
 */
export function equatorialToCartesian(
  eq: EquatorialCoordinates,
  radius: number = 100
): THREE.Vector3 {
  const raRad = (eq.rightAscension * 15.0) * (Math.PI / 180.0); // 1 hr = 15 deg
  const decRad = eq.declination * (Math.PI / 180.0);

  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = -radius * Math.cos(decRad) * Math.sin(raRad);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts Local Horizontal Coordinates (Altitude, Azimuth in degrees)
 * to a 3D Cartesian position vector.
 * Orientation:
 *   +Y is Zenith (Altitude = +90°)
 *   -Z is True North (Azimuth = 0°)
 *   +X is East (Azimuth = 90°)
 *   +Z is South (Azimuth = 180°)
 *   -X is West (Azimuth = 270°)
 */
export function horizontalToCartesian(
  hor: HorizontalCoordinates,
  radius: number = 100
): THREE.Vector3 {
  const altRad = hor.altitude * (Math.PI / 180.0);
  const azRad = hor.azimuth * (Math.PI / 180.0);

  const y = radius * Math.sin(altRad);
  const x = radius * Math.cos(altRad) * Math.sin(azRad);
  const z = -radius * Math.cos(altRad) * Math.cos(azRad);

  return new THREE.Vector3(x, y, z);
}

/**
 * AR Camera Projection:
 * Computes screen viewport coordinates (x, y in pixels, and whether in front of camera)
 * given device orientation (heading, pitch, roll in degrees), object Alt/Az,
 * viewport dimensions, and camera Field Of View (FOV).
 */
export interface ScreenProjectionResult {
  x: number; // pixels from left
  y: number; // pixels from top
  inView: boolean;
  distanceFromCenter: number; // normalized angular distance
}

export function projectCelestialToScreen(
  objectHor: HorizontalCoordinates,
  deviceHeading: number, // 0..360 (compass north)
  devicePitch: number,   // -90..90 (tilt up/down)
  screenWidth: number,
  screenHeight: number,
  fovDeg: number = 65
): ScreenProjectionResult {
  // Relative azimuth difference (-180 to +180)
  let deltaAz = objectHor.azimuth - deviceHeading;
  while (deltaAz > 180) deltaAz -= 360;
  while (deltaAz < -180) deltaAz += 360;

  // Relative altitude difference (-90 to +90)
  const deltaAlt = objectHor.altitude - devicePitch;

  // Check if roughly in front of device hemisphere
  if (Math.abs(deltaAz) > 90 || Math.abs(deltaAlt) > 90) {
    return { x: -999, y: -999, inView: false, distanceFromCenter: 999 };
  }

  // Perspective projection based on camera FOV
  const fovRad = (fovDeg * Math.PI) / 180.0;
  const fovAspect = screenWidth / screenHeight;
  const horizontalFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * fovAspect);

  const deltaAzRad = (deltaAz * Math.PI) / 180.0;
  const deltaAltRad = (deltaAlt * Math.PI) / 180.0;

  const xNorm = Math.tan(deltaAzRad) / Math.tan(horizontalFovRad / 2);
  const yNorm = Math.tan(deltaAltRad) / Math.tan(fovRad / 2);

  // Convert to pixel coordinates (center is screenWidth/2, screenHeight/2)
  const x = screenWidth / 2 + xNorm * (screenWidth / 2);
  const y = screenHeight / 2 - yNorm * (screenHeight / 2); // inverted Y for screen space

  const inView = x >= -50 && x <= screenWidth + 50 && y >= -50 && y <= screenHeight + 50;
  const distanceFromCenter = Math.sqrt(deltaAz * deltaAz + deltaAlt * deltaAlt);

  return { x, y, inView, distanceFromCenter };
}
