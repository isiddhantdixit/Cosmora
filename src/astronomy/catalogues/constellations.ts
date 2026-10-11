import { ConstellationData } from '../types';

export const CONSTELLATIONS_CATALOGUE: ConstellationData[] = [
  {
    id: 'ori',
    name: 'Orion',
    latinName: 'Orion',
    genitive: 'Orionis',
    iauCode: 'ORI',
    family: 'Orion',
    season: 'Winter',
    hemisphere: 'Equatorial',
    brightestStar: 'Rigel (β Ori)',
    description: 'The Hunter. One of the most prominent, universally recognizable constellations in the celestial sphere, spanning across the celestial equator.',
    mythology: 'In Greek mythology, Orion was a gigantic, handsome huntsman who boasted he could defeat any beast on Earth, until Gaia sent Scorpius.',
    starIds: [
      'star-betelgeuse',
      'star-bellatrix',
      'star-alnitak',
      'star-alnilam',
      'star-mintaka',
      'star-saiph',
      'star-rigel'
    ],
    lines: [
      ['star-betelgeuse', 'star-bellatrix'],
      ['star-betelgeuse', 'star-alnitak'],
      ['star-bellatrix', 'star-mintaka'],
      ['star-mintaka', 'star-alnilam'],
      ['star-alnilam', 'star-alnitak'],
      ['star-alnitak', 'star-saiph'],
      ['star-mintaka', 'star-rigel'],
      ['star-saiph', 'star-rigel']
    ]
  },
  {
    id: 'uma',
    name: 'Ursa Major',
    latinName: 'Ursa Major',
    genitive: 'Ursae Majoris',
    iauCode: 'UMA',
    family: 'Ursa Major',
    season: 'Spring',
    hemisphere: 'North',
    brightestStar: 'Alioth (ε UMa)',
    description: 'The Great Bear. Contains the Big Dipper (The Plough), an ancient navigational asterism known worldwide for pointing directly to the North Star.',
    mythology: 'Associated with Callisto, a nymph transformed into a bear by Hera due to Zeus’s infatuation, and subsequently set in the stars.',
    starIds: [
      'star-dubhe',
      'star-merak',
      'star-phecda',
      'star-megrez',
      'star-alioth',
      'star-mizar',
      'star-alkaid'
    ],
    lines: [
      ['star-dubhe', 'star-merak'],
      ['star-merak', 'star-phecda'],
      ['star-phecda', 'star-megrez'],
      ['star-megrez', 'star-dubhe'],
      ['star-megrez', 'star-alioth'],
      ['star-alioth', 'star-mizar'],
      ['star-mizar', 'star-alkaid']
    ]
  },
  {
    id: 'cas',
    name: 'Cassiopeia',
    latinName: 'Cassiopeia',
    genitive: 'Cassiopeiae',
    iauCode: 'CAS',
    family: 'Perseus',
    season: 'Autumn',
    hemisphere: 'North',
    brightestStar: 'Schedar (α Cas)',
    description: 'The Queen of Aethiopia. Recognizable by its distinctive "W" or "M" asterism of 5 bright stars circling the northern celestial pole.',
    mythology: 'Queen Cassiopeia boasted that she and her daughter Andromeda were more beautiful than the Nereids, inviting the wrath of Poseidon.',
    starIds: [
      'star-caph',
      'star-schedar',
      'star-gamma-cas',
      'star-ruchbah',
      'star-segin'
    ],
    lines: [
      ['star-caph', 'star-schedar'],
      ['star-schedar', 'star-gamma-cas'],
      ['star-gamma-cas', 'star-ruchbah'],
      ['star-ruchbah', 'star-segin']
    ]
  },
  {
    id: 'cyg',
    name: 'Cygnus',
    latinName: 'Cygnus',
    genitive: 'Cygni',
    iauCode: 'CYG',
    family: 'Hercules',
    season: 'Summer',
    hemisphere: 'North',
    brightestStar: 'Deneb (α Cyg)',
    description: 'The Swan, also known as the Northern Cross. Gracefully flying down the luminous river of the Milky Way galaxy.',
    mythology: 'Commonly identified as Zeus in disguise when visiting Leda, or Orpheus transformed into a swan upon his death.',
    starIds: [
      'star-deneb',
      'star-sadr',
      'star-albireo'
    ],
    lines: [
      ['star-deneb', 'star-sadr'],
      ['star-sadr', 'star-albireo']
    ]
  },
  {
    id: 'sco',
    name: 'Scorpius',
    latinName: 'Scorpius',
    genitive: 'Scorpii',
    iauCode: 'SCO',
    family: 'Zodiac',
    season: 'Summer',
    hemisphere: 'South',
    brightestStar: 'Antares (α Sco)',
    description: 'The Scorpion. One of the zodiac constellations with a curved stinger pointing towards the supermassive black hole at the galactic center.',
    mythology: 'The scorpion that stung and killed Orion in myth, placed on the opposite side of the sky so the two enemies never appear at the same time.',
    starIds: [
      'star-dschubba',
      'star-antares',
      'star-shaula'
    ],
    lines: [
      ['star-dschubba', 'star-antares'],
      ['star-antares', 'star-shaula']
    ]
  },
  {
    id: 'gem',
    name: 'Gemini',
    latinName: 'Gemini',
    genitive: 'Geminorum',
    iauCode: 'GEM',
    family: 'Zodiac',
    season: 'Winter',
    hemisphere: 'North',
    brightestStar: 'Pollux (β Gem)',
    description: 'The Twins, dominated by the bright fraternal twin stars Castor and Pollux.',
    mythology: 'Castor and Pollux (the Dioscuri), twin brothers of Helen of Troy, celebrated for their profound brotherly devotion.',
    starIds: [
      'star-castor',
      'star-pollux'
    ],
    lines: [
      ['star-castor', 'star-pollux']
    ]
  },
  {
    id: 'cma',
    name: 'Canis Major',
    latinName: 'Canis Major',
    genitive: 'Canis Majoris',
    iauCode: 'CMA',
    family: 'Orion',
    season: 'Winter',
    hemisphere: 'South',
    brightestStar: 'Sirius (α CMa)',
    description: 'The Greater Dog, faithfully following the hunter Orion across the southern winter sky.',
    mythology: 'Represents Laelaps, a dog so swift that no prey could escape him, gifted by Zeus to Europa.',
    starIds: [
      'star-sirius'
    ],
    lines: []
  }
];
