export type CelestialObjectType = 
  | 'star'
  | 'planet'
  | 'moon'
  | 'sun'
  | 'constellation'
  | 'satellite'
  | 'deep-sky';

export interface EquatorialCoordinates {
  rightAscension: number; // in hours (0 to 24) or degrees (0 to 360)
  declination: number;    // in degrees (-90 to +90)
  distanceAu?: number;
  distanceLy?: number;
}

export interface HorizontalCoordinates {
  altitude: number; // degrees (-90 to +90)
  azimuth: number;  // degrees (0 to 360, 0 = North, 90 = East, 180 = South, 270 = West)
  isVisible: boolean;
  distanceKm?: number;
}

export interface ObserverLocation {
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
  elevation: number;  // meters above sea level
  name: string;
}

export interface CelestialObject {
  id: string;
  name: string;
  latinName?: string;
  designation?: string;
  type: CelestialObjectType;
  magnitude: number; // apparent visual magnitude
  coordinates: EquatorialCoordinates;
  spectralType?: string;
  colorHex?: string;
  distanceLy?: number;
  diameterKm?: number;
  massKg?: string;
  orbitalPeriodDays?: number;
  rotationPeriodHours?: number;
  atmosphere?: string;
  moonsCount?: number;
  description: string;
  historicalContext?: string;
  constellationId?: string;
  hipId?: number; // Hipparcos catalogue number
}

export interface ConstellationData {
  id: string;
  name: string;
  latinName: string;
  genitive: string;
  iauCode: string;
  family: string;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Circumpolar';
  hemisphere: 'North' | 'South' | 'Equatorial';
  brightestStar: string;
  description: string;
  mythology: string;
  starIds: string[]; // matches CelestialObject.id
  lines: [string, string][]; // pairs of object IDs to connect
}

export interface SatelliteData {
  id: string;
  noradId: number;
  name: string;
  type: string;
  line1: string;
  line2: string;
  launchDate: string;
  description: string;
  periodMinutes: number;
  inclinationDeg: number;
}

export interface SatelliteLivePosition {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmS: number;
  horizontal: HorizontalCoordinates;
  timestamp: Date;
}

export interface RiseSetInfo {
  rise: Date | null;
  transit: Date | null;
  set: Date | null;
}

export interface LocalSkySummary {
  observer: ObserverLocation;
  observationTime: Date;
  localSiderealTimeHours: number;
  sunHorizontal: HorizontalCoordinates;
  moonHorizontal: HorizontalCoordinates;
  moonPhaseName: string;
  moonIlluminationFraction: number; // 0.0 to 1.0
  twilightState: 'Day' | 'Civil Twilight' | 'Nautical Twilight' | 'Astronomical Twilight' | 'Astronomical Night';
  observablePlanetsCount: number;
  observableStarsCount: number;
}
