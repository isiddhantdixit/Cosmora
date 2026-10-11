import * as Astronomy from 'astronomy-engine';
import {
  EquatorialCoordinates,
  HorizontalCoordinates,
  ObserverLocation,
  RiseSetInfo,
  LocalSkySummary
} from '../types';

/**
 * Creates an Astronomy.Observer from application ObserverLocation
 */
export function createAstroObserver(loc: ObserverLocation): Astronomy.Observer {
  return new Astronomy.Observer(loc.latitude, loc.longitude, loc.elevation || 0);
}

/**
 * Converts Equatorial Coordinates (RA in hours, Dec in degrees)
 * to Local Horizontal Coordinates (Altitude, Azimuth in degrees)
 */
export function equatorialToHorizontal(
  eq: EquatorialCoordinates,
  observerLoc: ObserverLocation,
  date: Date = new Date()
): HorizontalCoordinates {
  const obs = createAstroObserver(observerLoc);
  const astroTime = new Astronomy.AstroTime(date);
  
  // astronomy-engine expects RA in hours and Dec in degrees
  const hor = Astronomy.Horizon(astroTime, obs, eq.rightAscension, eq.declination, 'normal');

  return {
    altitude: hor.altitude,
    azimuth: hor.azimuth,
    isVisible: hor.altitude > 0
  };
}

/**
 * Calculates current Local Sidereal Time in hours (0 to 24)
 */
export function calculateLocalSiderealTime(
  observerLoc: ObserverLocation,
  date: Date = new Date()
): number {
  const astroTime = new Astronomy.AstroTime(date);
  const gmst = Astronomy.SiderealTime(astroTime); // Greenwich Mean Sidereal Time in hours
  // Add observer longitude offset (1 hour = 15 degrees)
  let lst = gmst + (observerLoc.longitude / 15.0);
  lst = ((lst % 24) + 24) % 24;
  return lst;
}

/**
 * Calculates real-time Equatorial Coordinates for a Solar System body
 */
export function calculatePlanetEquatorial(
  bodyName: 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune',
  date: Date = new Date(),
  observerLoc?: ObserverLocation
): EquatorialCoordinates & { distanceAu?: number; illuminationFraction?: number; visualMagnitude?: number } {
  const astroTime = new Astronomy.AstroTime(date);
  const body = Astronomy.Body[bodyName];
  
  const obs = observerLoc ? createAstroObserver(observerLoc) : new Astronomy.Observer(0, 0, 0);
  const eq = Astronomy.Equator(body, astroTime, obs, true, true);
  
  let illuminationFraction: number | undefined;
  let visualMagnitude: number | undefined;
  
  try {
    const illum = Astronomy.Illumination(body, astroTime);
    illuminationFraction = illum.phase_fraction;
    visualMagnitude = illum.mag;
  } catch {
    // Some bodies or models might not support illumination calculation directly
  }

  return {
    rightAscension: eq.ra,
    declination: eq.dec,
    distanceAu: eq.dist,
    illuminationFraction,
    visualMagnitude
  };
}

/**
 * Calculates Moon phase info: degrees, fraction, and readable phase name
 */
export function calculateMoonPhase(date: Date = new Date()): {
  phaseAngleDeg: number;
  illuminationFraction: number;
  phaseName: string;
} {
  const astroTime = new Astronomy.AstroTime(date);
  const phaseAngle = Astronomy.MoonPhase(astroTime); // 0..360
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, astroTime);

  let phaseName = 'New Moon';
  if (phaseAngle >= 350 || phaseAngle < 10) {
    phaseName = 'New Moon';
  } else if (phaseAngle >= 10 && phaseAngle < 80) {
    phaseName = 'Waxing Crescent';
  } else if (phaseAngle >= 80 && phaseAngle < 100) {
    phaseName = 'First Quarter';
  } else if (phaseAngle >= 100 && phaseAngle < 170) {
    phaseName = 'Waxing Gibbous';
  } else if (phaseAngle >= 170 && phaseAngle < 190) {
    phaseName = 'Full Moon';
  } else if (phaseAngle >= 190 && phaseAngle < 260) {
    phaseName = 'Waning Gibbous';
  } else if (phaseAngle >= 260 && phaseAngle < 280) {
    phaseName = 'Third Quarter';
  } else {
    phaseName = 'Waning Crescent';
  }

  return {
    phaseAngleDeg: phaseAngle,
    illuminationFraction: illum.phase_fraction,
    phaseName
  };
}

/**
 * Calculates Rise, Transit, and Set times for any solar system body
 */
export function calculateRiseSet(
  bodyName: 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune',
  observerLoc: ObserverLocation,
  date: Date = new Date()
): RiseSetInfo {
  const obs = createAstroObserver(observerLoc);
  const astroTime = new Astronomy.AstroTime(date);
  const body = Astronomy.Body[bodyName];

  let rise: Date | null = null;
  let set: Date | null = null;
  let transit: Date | null = null;

  try {
    const riseTime = Astronomy.SearchRiseSet(body, obs, +1, astroTime, 1);
    if (riseTime) rise = riseTime.date;
  } catch {
    // Circumpolar or always below horizon
  }

  try {
    const setTime = Astronomy.SearchRiseSet(body, obs, -1, astroTime, 1);
    if (setTime) set = setTime.date;
  } catch {
    // Circumpolar or always below horizon
  }

  try {
    const transitTime = Astronomy.SearchHourAngle(body, obs, 0, astroTime, 1);
    if (transitTime) transit = transitTime.time.date;
  } catch {
    // Never culiminates above horizon
  }

  return { rise, transit, set };
}

/**
 * Determines current twilight condition based on Sun altitude
 */
export function getTwilightState(sunAltitude: number): LocalSkySummary['twilightState'] {
  if (sunAltitude > 0) return 'Day';
  if (sunAltitude > -6) return 'Civil Twilight';
  if (sunAltitude > -12) return 'Nautical Twilight';
  if (sunAltitude > -18) return 'Astronomical Twilight';
  return 'Astronomical Night';
}

/**
 * Computes an overall local sky summary for the observer
 */
export function getLocalSkySummary(
  observerLoc: ObserverLocation,
  date: Date = new Date()
): LocalSkySummary {
  const sunEq = calculatePlanetEquatorial('Sun', date, observerLoc);
  const sunHor = equatorialToHorizontal(sunEq, observerLoc, date);

  const moonEq = calculatePlanetEquatorial('Moon', date, observerLoc);
  const moonHor = equatorialToHorizontal(moonEq, observerLoc, date);

  const moonData = calculateMoonPhase(date);
  const lst = calculateLocalSiderealTime(observerLoc, date);
  const twilight = getTwilightState(sunHor.altitude);

  // Check how many major planets are currently above the horizon
  const majorPlanets: ('Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn')[] = [
    'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'
  ];
  let observablePlanetsCount = 0;
  for (const p of majorPlanets) {
    const pEq = calculatePlanetEquatorial(p, date, observerLoc);
    const pHor = equatorialToHorizontal(pEq, observerLoc, date);
    if (pHor.altitude > 5 && twilight !== 'Day') {
      observablePlanetsCount++;
    }
  }

  return {
    observer: observerLoc,
    observationTime: date,
    localSiderealTimeHours: lst,
    sunHorizontal: sunHor,
    moonHorizontal: moonHor,
    moonPhaseName: moonData.phaseName,
    moonIlluminationFraction: moonData.illuminationFraction,
    twilightState: twilight,
    observablePlanetsCount,
    observableStarsCount: twilight === 'Astronomical Night' ? 84 : twilight === 'Astronomical Twilight' ? 45 : 12
  };
}
