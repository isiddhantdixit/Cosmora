import { CelestialObject } from '../types';

export const SOLAR_SYSTEM_OBJECTS: CelestialObject[] = [
  {
    id: 'body-sun',
    name: 'Sun',
    latinName: 'Sol',
    designation: 'Sol / 1 AU Central Star',
    type: 'sun',
    magnitude: -26.74,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 1.0 },
    spectralType: 'G2V Yellow Dwarf',
    colorHex: '#FBBF24',
    diameterKm: 1392700,
    massKg: '1.989 × 10^30 kg',
    orbitalPeriodDays: 0,
    rotationPeriodHours: 609.12, // 25.38 days differential equator
    atmosphere: 'Hydrogen (73.46%), Helium (24.85%), Oxygen (0.77%)',
    moonsCount: 8, // planets
    description: 'The yellow dwarf star at the center of the Solar System, comprising 99.86% of the total mass of the solar system.',
    historicalContext: 'Core nuclear furnace fusing ~600 million tons of hydrogen into helium every second via proton-proton chain.'
  },
  {
    id: 'body-mercury',
    name: 'Mercury',
    latinName: 'Mercurius',
    designation: 'Sol I',
    type: 'planet',
    magnitude: -0.4,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 0.387 },
    colorHex: '#CBD5E1',
    diameterKm: 4879.4,
    massKg: '3.301 × 10^23 kg',
    orbitalPeriodDays: 87.97,
    rotationPeriodHours: 1407.6, // 58.6 days (3:2 spin-orbit resonance)
    atmosphere: 'Trace exosphere (Oxygen 42%, Sodium 29%, Hydrogen 22%)',
    moonsCount: 0,
    description: 'The smallest planet and closest to the Sun. Highly cratered with extreme temperature variations from -180°C at night to 430°C in daylight.',
    historicalContext: 'Its 43 arcseconds per century anomalous perihelion precession proved Einstein’s General Theory of Relativity in 1915.'
  },
  {
    id: 'body-venus',
    name: 'Venus',
    latinName: 'Venus',
    designation: 'Sol II',
    type: 'planet',
    magnitude: -4.4,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 0.723 },
    colorHex: '#FDE68A',
    diameterKm: 12103.6,
    massKg: '4.867 × 10^24 kg',
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: 5832.5, // 243 days retrograde
    atmosphere: 'Carbon dioxide 96.5%, Nitrogen 3.5%, Sulfuric acid clouds',
    moonsCount: 0,
    description: 'The hottest planet in the Solar System due to a runaway greenhouse effect, with a crushing surface atmospheric pressure 92 times that of Earth.',
    historicalContext: 'Often termed Earth’s "evil twin", shines as the brilliant "Morning Star" or "Evening Star" (Phosphorus & Hesperus).'
  },
  {
    id: 'body-moon',
    name: 'Moon',
    latinName: 'Luna',
    designation: 'Earth I / Luna',
    type: 'moon',
    magnitude: -12.74,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 0.00257 },
    colorHex: '#E2E8F0',
    diameterKm: 3474.8,
    massKg: '7.342 × 10^22 kg',
    orbitalPeriodDays: 27.32,
    rotationPeriodHours: 655.7, // synchronous rotation
    atmosphere: 'Virtually vacuum (exosphere of argon, helium, neon)',
    moonsCount: 0,
    description: 'Earth’s only natural satellite. Tidally locked to Earth, stabilizing our axial tilt and driving the ocean tides.',
    historicalContext: 'Formed ~4.51 billion years ago, likely from the giant impact of Mars-sized protoplanet Theia with early proto-Earth.'
  },
  {
    id: 'body-mars',
    name: 'Mars',
    latinName: 'Mars',
    designation: 'Sol IV',
    type: 'planet',
    magnitude: -1.5,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 1.524 },
    colorHex: '#F87171',
    diameterKm: 6779,
    massKg: '6.417 × 10^23 kg',
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.62, // 1 sol
    atmosphere: 'Carbon dioxide 95.3%, Nitrogen 2.6%, Argon 1.9%',
    moonsCount: 2, // Phobos & Deimos
    description: 'The Red Planet, tinted by iron oxide (rust) across its surface regolith. Hosts Olympus Mons, the largest volcano in the Solar System.',
    historicalContext: 'Possesses immense ancient dry river valleys, deltas, and sub-surface water ice explored by NASA and ESA rovers.'
  },
  {
    id: 'body-jupiter',
    name: 'Jupiter',
    latinName: 'Iuppiter',
    designation: 'Sol V',
    type: 'planet',
    magnitude: -2.7,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 5.204 },
    colorHex: '#FDBA74',
    diameterKm: 139820,
    massKg: '1.898 × 10^27 kg (317.8 Earths)',
    orbitalPeriodDays: 4332.59, // 11.86 years
    rotationPeriodHours: 9.93,
    atmosphere: 'Hydrogen 89.8%, Helium 10.2%, trace methane, ammonia',
    moonsCount: 95,
    description: 'The king of planets, more massive than all other planets combined. Features the iconic Great Red Spot storm which has raged for centuries.',
    historicalContext: 'Galileo Galilei’s 1610 discovery of Io, Europa, Ganymede, and Callisto provided pivotal proof of the heliocentric Copernican system.'
  },
  {
    id: 'body-saturn',
    name: 'Saturn',
    latinName: 'Saturnus',
    designation: 'Sol VI',
    type: 'planet',
    magnitude: 0.2,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 9.582 },
    colorHex: '#FDE047',
    diameterKm: 116460,
    massKg: '5.683 × 10^26 kg',
    orbitalPeriodDays: 10759.22, // 29.46 years
    rotationPeriodHours: 10.57,
    atmosphere: 'Hydrogen 96.3%, Helium 3.25%, trace methane',
    moonsCount: 146,
    description: 'The ringed jewel of the solar system. The rings span up to 282,000 km wide yet are as thin as 10 to 30 meters, made almost entirely of water ice.',
    historicalContext: 'Possesses the lowest density of any planet (0.687 g/cm³)—it would literally float if placed in a sufficiently massive body of water.'
  },
  {
    id: 'body-uranus',
    name: 'Uranus',
    latinName: 'Uranus',
    designation: 'Sol VII',
    type: 'planet',
    magnitude: 5.7,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 19.2 },
    colorHex: '#67E8F9',
    diameterKm: 50724,
    massKg: '8.681 × 10^25 kg',
    orbitalPeriodDays: 30685.4, // 84 years
    rotationPeriodHours: 17.24, // retrograde, 97.77° axial tilt
    atmosphere: 'Hydrogen 82.5%, Helium 15.2%, Methane 2.3%',
    moonsCount: 28,
    description: 'An ice giant tilted sideways at an extreme 97.8° angle, essentially rolling around the Sun along its orbital path.',
    historicalContext: 'First planet discovered with a telescope by William Herschel in 1781. The cyan color stems from atmospheric methane absorbing red light.'
  },
  {
    id: 'body-neptune',
    name: 'Neptune',
    latinName: 'Neptunus',
    designation: 'Sol VIII',
    type: 'planet',
    magnitude: 7.8,
    coordinates: { rightAscension: 0, declination: 0, distanceAu: 30.05 },
    colorHex: '#38BDF8',
    diameterKm: 49244,
    massKg: '1.024 × 10^26 kg',
    orbitalPeriodDays: 60189, // 164.8 years
    rotationPeriodHours: 16.11,
    atmosphere: 'Hydrogen 80%, Helium 19%, Methane 1.5%',
    moonsCount: 16,
    description: 'The outermost major planet, an ice giant swept by supersonic winds exceeding 2,100 km/h—the fastest atmospheric winds in the Solar System.',
    historicalContext: 'The only planet discovered purely via mathematical prediction (Urbain Le Verrier and John Couch Adams) prior to visual telescope confirmation in 1846.'
  }
];
