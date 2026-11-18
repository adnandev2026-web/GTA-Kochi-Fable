// City configurations for Kochi extra POIs plus 7 additional playable cities:
// Pookkottumpadam, Trivandrum, Kozhikkode, New York, Dubai, London, and Tokyo.
// Coordinates are Three.js world metres (+X = east, +Z = south).

import { CITIES_CATALOG } from '../shared/catalog.ts';

export const KOCHI_EXTRA_POIS = {
  cityId: 'kochi',
  cityName: 'Kochi',
  cityMl: 'കൊച്ചി',
  theme: {
    skyTint: 0xa9c4d8,
    fogColor: 0xc3cdd0,
    fogDensity: 0.00122,
    sunColor: 0xffe2bd,
    sunIntensity: 3.0,
    palmRatio: 1.0,
    waterColor: 0x164a52,
  },
  schools: [
    { id: 'sch_kochi_1', name: 'Cochin Public School', x: -395, z: -610, rot: 0 },
    { id: 'sch_kochi_2', name: 'Edappally High School', x: -535, z: -1350, rot: Math.PI / 2 },
  ],
  petrolPumps: [
    { id: 'fuel_kochi_1', name: 'IndianOil Kundannoor', x: 85, z: 540, rot: Math.PI / 2 },
    { id: 'fuel_kochi_2', name: 'BPCL Palarivattom', x: -245, z: -875, rot: 0 },
    { id: 'fuel_kochi_3', name: 'HP Petrol Vyttila', x: -290, z: 32, rot: 0 },
  ],
  policeStations: [
    { id: 'pol_kochi_1', name: 'Maradu Police Station', x: 310, z: 710, rot: 0 },
    { id: 'pol_kochi_2', name: 'Palarivattom Police HQ', x: -520, z: -860, rot: Math.PI },
    { id: 'pol_kochi_3', name: 'Kaloor Traffic Police', x: -890, z: -480, rot: Math.PI / 2 },
  ],
  tollGates: [
    { id: 'toll_kochi_1', name: 'NH66 Kundannoor Toll', x: 64, z: -1020, heading: 0.14, fee: 40 },
    { id: 'toll_kochi_2', name: 'Edappally Bypass Toll', x: -245, z: -1200, heading: -0.25, fee: 40 },
  ],
  signatureLandmarks: [],
};

function makeStandardGridCity({
  id,
  name,
  localLabel,
  roadNames,
  zones,
  theme,
  water,
  landmarks,
  schools,
  petrolPumps,
  policeStations,
  tollGates,
}) {
  const NODES = {
    N_EXIT: { p: [0, -860], exit: true, toward: `${name} North Highway` },
    S_EXIT: { p: [0, 860], exit: true, toward: `${name} South Expressway` },
    W_EXIT: { p: [-860, 0], exit: true, toward: `${name} West Corridor` },
    E_EXIT: { p: [860, 0], exit: true, toward: `${name} East Bypass` },

    NW: { p: [-320, -320], name: zones[0]?.name || 'North West Jn', signal: true },
    N_C: { p: [0, -320], name: zones[1]?.name || 'North Central Jn', signal: true },
    NE: { p: [320, -320], name: zones[2]?.name || 'North East Jn', signal: true },

    W_C: { p: [-320, 0], name: zones[3]?.name || 'West Central Jn', signal: true },
    C: { p: [0, 0], name: `${name} Central Square`, signal: true },
    E_C: { p: [320, 0], name: zones[4]?.name || 'East Central Jn', signal: true },

    SW: { p: [-320, 320], name: zones[5]?.name || 'South West Jn', signal: true },
    S_C: { p: [0, 320], name: zones[6]?.name || 'South Central Jn', signal: true },
    SE: { p: [320, 320], name: zones[7]?.name || 'South East Jn', signal: true },
  };

  const EDGES = [
    { id: 'N_SPINE', a: 'N_EXIT', b: 'N_C', cls: 'highway', name: roadNames.nsMain, via: [[0, -600]] },
    { id: 'C_N', a: 'N_C', b: 'C', cls: 'highway', name: roadNames.nsMain },
    { id: 'C_S', a: 'C', b: 'S_C', cls: 'highway', name: roadNames.nsMain },
    { id: 'S_SPINE', a: 'S_C', b: 'S_EXIT', cls: 'highway', name: roadNames.nsMain, via: [[0, 600]] },

    { id: 'W_SPINE', a: 'W_EXIT', b: 'W_C', cls: 'arterial', name: roadNames.ewMain, via: [[-600, 0]] },
    { id: 'C_W', a: 'W_C', b: 'C', cls: 'arterial', name: roadNames.ewMain },
    { id: 'C_E', a: 'C', b: 'E_C', cls: 'arterial', name: roadNames.ewMain },
    { id: 'E_SPINE', a: 'E_C', b: 'E_EXIT', cls: 'arterial', name: roadNames.ewMain, via: [[600, 0]] },

    { id: 'RING_NW_NC', a: 'NW', b: 'N_C', cls: 'arterial', name: roadNames.northAve },
    { id: 'RING_NC_NE', a: 'N_C', b: 'NE', cls: 'arterial', name: roadNames.northAve },
    { id: 'RING_SW_SC', a: 'SW', b: 'S_C', cls: 'arterial', name: roadNames.southAve },
    { id: 'RING_SC_SE', a: 'S_C', b: 'SE', cls: 'arterial', name: roadNames.southAve },

    { id: 'RING_NW_WC', a: 'NW', b: 'W_C', cls: 'arterial', name: roadNames.westAve },
    { id: 'RING_WC_SW', a: 'W_C', b: 'SW', cls: 'arterial', name: roadNames.westAve },
    { id: 'RING_NE_EC', a: 'NE', b: 'E_C', cls: 'arterial', name: roadNames.eastAve },
    { id: 'RING_EC_SE', a: 'E_C', b: 'SE', cls: 'arterial', name: roadNames.eastAve },
  ];

  const PLACE_NAMES = {
    C: { en: name.toUpperCase(), ml: localLabel, hi: name.toUpperCase() },
    N_C: { en: (zones[1]?.name || 'NORTH').toUpperCase(), ml: localLabel, hi: 'NORTH' },
    S_C: { en: (zones[6]?.name || 'SOUTH').toUpperCase(), ml: localLabel, hi: 'SOUTH' },
    W_C: { en: (zones[3]?.name || 'WEST').toUpperCase(), ml: localLabel, hi: 'WEST' },
    E_C: { en: (zones[4]?.name || 'EAST').toUpperCase(), ml: localLabel, hi: 'EAST' },
  };

  const catalog = CITIES_CATALOG.find((c) => c.id === id);
  const homes = catalog ? catalog.homes : [];

  const RESERVED = [
    ...landmarks.map((l) => ({ c: [l.x, l.z], hx: l.hx || 48, hz: l.hz || 48, rot: 0, tag: l.id })),
    ...schools.map((s) => ({ c: [s.x, s.z], hx: 34, hz: 28, rot: 0, tag: s.id })),
    ...petrolPumps.map((p) => ({ c: [p.x, p.z], hx: 22, hz: 18, rot: 0, tag: p.id })),
    ...policeStations.map((p) => ({ c: [p.x, p.z], hx: 26, hz: 22, rot: 0, tag: p.id })),
    ...homes.map((h) => ({ c: [h.x, h.z], hx: 20, hz: 20, rot: 0, tag: h.id })),
  ];

  const LANDMARKS = {};
  for (const lm of landmarks) {
    LANDMARKS[lm.id] = { p: [lm.x, lm.z], rot: lm.rot || 0, name: lm.name };
  }

  return {
    cityId: id,
    cityName: name,
    cityMl: localLabel,
    WORLD: { minX: -940, maxX: 940, minZ: -940, maxZ: 940 },
    CORE: { minX: -620, maxX: 620, minZ: -620, maxZ: 620 },
    NODES,
    EDGES,
    FLYOVERS: [],
    METRO: { railHeight: 13.2, deckHalf: 4.6, pillarSpacing: 27, lines: [] },
    WATER: water,
    LANDMARKS,
    RESERVED,
    RESERVED_CIRCLES: [],
    OPEN_AREAS: [],
    ZONES: zones,
    SPAWN: { p: [homes[0]?.x ?? 65, (homes[0]?.z ?? 65) + 14], heading: homes[0]?.heading ?? 0 },
    PLACE_NAMES,
    POIS: {
      cityId: id,
      cityName: name,
      cityMl: localLabel,
      theme,
      schools,
      petrolPumps,
      policeStations,
      tollGates,
      homes,
      signatureLandmarks: landmarks,
    },
  };
}

export const EXTRA_CITY_LAYOUTS = {
  pookkottumpadam: makeStandardGridCity({
    id: 'pookkottumpadam',
    name: 'Pookkottumpadam',
    localLabel: 'പൂക്കോട്ടുംപാടം',
    roadNames: {
      nsMain: 'Nilambur - Kalikavu Main Rd',
      ewMain: 'Pookkottumpadam Bazaar Rd',
      northAve: 'Amarambalam Hill Road',
      southAve: 'Chaliyar Bridge Road',
      westAve: 'Thamarassery Estate Ave',
      eastAve: 'Vaniyambalam Road',
    },
    zones: [
      { name: 'NILAMBUR GATE', ml: 'നിലമ്പൂർ ഗേറ്റ്', p: [-320, -320], r: 220 },
      { name: 'AMARAMPALAM', ml: 'അമരമ്പലം', p: [0, -320], r: 220 },
      { name: 'HILL ESTATE', ml: 'ഹിൽ എസ്റ്റേറ്റ്', p: [320, -320], r: 220 },
      { name: 'CHOKKAD ROAD', ml: 'ചോക്കാട് റോഡ്', p: [-320, 0], r: 220 },
      { name: 'TOWN SQUARE', ml: 'പൂക്കോട്ടുംപാടം ടൗൺ', p: [0, 0], r: 250 },
      { name: 'VANIYAMBALAM', ml: 'വാണിയമ്പലം', p: [320, 0], r: 220 },
      { name: 'KARULAI EDGE', ml: 'കരുളായി', p: [-320, 320], r: 220 },
      { name: 'CHALIYAR BANK', ml: 'ചാലിയാർ', p: [320, 320], r: 220 },
    ],
    theme: {
      skyTint: 0x9ec8dc,
      fogColor: 0xc2d4cc,
      fogDensity: 0.0011,
      sunColor: 0xffe6c0,
      sunIntensity: 3.1,
      palmRatio: 1.0,
      waterColor: 0x1a5a58,
    },
    water: {
      level: -0.9,
      polygons: [],
      channels: [
        { pts: [[-940, 480], [-360, 460], [180, 495], [940, 440]], width: 42 },
      ],
    },
    landmarks: [
      { id: 'pkp_square', name: 'Pookkottumpadam Grand Bazaar', kind: 'bazaar', x: -120, z: -120, hx: 48, hz: 42 },
      { id: 'pkp_arch', name: 'Nilambur Valley Gateway', kind: 'arch', x: 130, z: -135, hx: 42, hz: 42 },
      { id: 'pkp_estate', name: 'Malabar Spice Heritage Hall', kind: 'dome', x: -135, z: 145, hx: 45, hz: 40 },
    ],
    schools: [
      { id: 'sch_pkp_1', name: 'GHSS Pookkottumpadam', x: 145, z: 155, rot: 0 },
      { id: 'sch_pkp_2', name: 'RMC Public School', x: -245, z: -135, rot: Math.PI / 2 },
    ],
    petrolPumps: [
      { id: 'fuel_pkp_1', name: 'HP Fuel Town Pump', x: 65, z: -55, rot: 0 },
      { id: 'fuel_pkp_2', name: 'IndianOil Nilambur Rd', x: -58, z: 245, rot: Math.PI / 2 },
    ],
    policeStations: [
      { id: 'pol_pkp_1', name: 'Pookkottumpadam Police Station', x: -62, z: -245, rot: 0 },
    ],
    tollGates: [
      { id: 'toll_pkp_1', name: 'Nilambur Valley Toll', x: 0, z: -470, heading: 0, fee: 40 },
      { id: 'toll_pkp_2', name: 'Chaliyar River Toll', x: 0, z: 540, heading: 0, fee: 40 },
    ],
  }),

  trivandrum: makeStandardGridCity({
    id: 'trivandrum',
    name: 'Trivandrum',
    localLabel: 'തിരുവനന്തപുരം',
    roadNames: {
      nsMain: 'MG Road · Secretariat Corridor',
      ewMain: 'Kowdiar - Statue Avenue',
      northAve: 'Pattom Bypass Road',
      southAve: 'East Fort Heritage Ave',
      westAve: 'Kazhakootam Technopark Rd',
      eastAve: 'Vellayambalam Boulevard',
    },
    zones: [
      { name: 'KAZHAKOOTAM', ml: 'കഴക്കൂട്ടം', p: [-320, -320], r: 220 },
      { name: 'PATTOM', ml: 'പട്ടം', p: [0, -320], r: 220 },
      { name: 'KOWDIAR', ml: 'കവടിയാർ', p: [320, -320], r: 220 },
      { name: 'TECHNOPARK', ml: 'ടെക്നോപാർക്ക്', p: [-320, 0], r: 220 },
      { name: 'STATUE · MG ROAD', ml: 'സ്റ്റാച്യു · എം.ജി റോഡ്', p: [0, 0], r: 250 },
      { name: 'VELLAYAMBALAM', ml: 'വെള്ളയമ്പലം', p: [320, 0], r: 220 },
      { name: 'SHANGUMUGHAM', ml: 'ശംഖുമുഖം', p: [-320, 320], r: 220 },
      { name: 'EAST FORT', ml: 'കിഴക്കേകോട്ട', p: [320, 320], r: 220 },
    ],
    theme: {
      skyTint: 0xa5c8de,
      fogColor: 0xc9d2d4,
      fogDensity: 0.00115,
      sunColor: 0xffdfaf,
      sunIntensity: 3.1,
      palmRatio: 0.9,
      waterColor: 0x124e66,
    },
    water: {
      level: -0.9,
      polygons: [
        [[-940, 560], [-420, 540], [940, 590], [940, 940], [-940, 940]],
      ],
      channels: [],
    },
    landmarks: [
      { id: 'tvm_secretariat', name: 'Kerala Secretariat Dome', kind: 'dome', x: -135, z: -135, hx: 52, hz: 46 },
      { id: 'tvm_technopark', name: 'Technopark Glass Tower', kind: 'spire', x: -145, z: 140, hx: 46, hz: 44 },
      { id: 'tvm_lulu', name: 'Trivandrum Mall & Square', kind: 'plaza', x: 140, z: -140, hx: 52, hz: 46 },
    ],
    schools: [
      { id: 'sch_tvm_1', name: 'Govt Model Boys HSS', x: 135, z: 145, rot: 0 },
      { id: 'sch_tvm_2', name: 'Loyola Academy', x: -245, z: -145, rot: 0 },
    ],
    petrolPumps: [
      { id: 'fuel_tvm_1', name: 'IndianOil Statue Jn', x: 65, z: -58, rot: 0 },
      { id: 'fuel_tvm_2', name: 'BPCL Pattom Bypass', x: -58, z: -240, rot: Math.PI / 2 },
    ],
    policeStations: [
      { id: 'pol_tvm_1', name: 'Trivandrum City Police HQ', x: 245, z: -235, rot: Math.PI },
    ],
    tollGates: [
      { id: 'toll_tvm_1', name: 'NH66 Kazhakootam Toll', x: 0, z: -475, heading: 0, fee: 40 },
      { id: 'toll_tvm_2', name: 'Kovalam Bypass Toll', x: 0, z: 465, heading: 0, fee: 40 },
    ],
  }),

  kozhikkode: makeStandardGridCity({
    id: 'kozhikkode',
    name: 'Kozhikkode',
    localLabel: 'കോഴിക്കോട്',
    roadNames: {
      nsMain: 'Calicut Beach Road',
      ewMain: 'SM Street · Mananchira Ave',
      northAve: 'West Hill Highway',
      southAve: 'Kallai Bridge Road',
      westAve: 'Marine Drive Promenade',
      eastAve: 'Thondayad Bypass',
    },
    zones: [
      { name: 'WEST HILL', ml: 'വെസ്റ്റ് ഹിൽ', p: [-320, -320], r: 220 },
      { name: 'NADAKKAVU', ml: 'നടക്കാവ്', p: [0, -320], r: 220 },
      { name: 'MAVOOR ROAD', ml: 'മാവൂർ റോഡ്', p: [320, -320], r: 220 },
      { name: 'KOZHIKODE BEACH', ml: 'കോഴിക്കോട് ബീച്ച്', p: [-320, 0], r: 230 },
      { name: 'MANANCHIRA', ml: 'മാനഞ്ചിറ', p: [0, 0], r: 250 },
      { name: 'PALAYAM', ml: 'പാളയം', p: [320, 0], r: 220 },
      { name: 'KALLAI', ml: 'കല്ലായി', p: [0, 320], r: 220 },
      { name: 'THONDAYAD', ml: 'തൊണ്ടയാട്', p: [320, 320], r: 220 },
    ],
    theme: {
      skyTint: 0xb0d0e0,
      fogColor: 0xcad3d2,
      fogDensity: 0.00115,
      sunColor: 0xffd59e,
      sunIntensity: 3.1,
      palmRatio: 1.0,
      waterColor: 0x104c68,
    },
    water: {
      level: -0.9,
      polygons: [
        [[-940, -940], [-560, -940], [-540, 940], [-940, 940]],
      ],
      channels: [
        { pts: [[-540, 480], [0, 460], [940, 510]], width: 38 },
      ],
    },
    landmarks: [
      { id: 'clt_lighthouse', name: 'Kozhikode Beach Lighthouse', kind: 'lighthouse', x: -145, z: -135, hx: 42, hz: 42 },
      { id: 'clt_mananchira', name: 'Mananchira Heritage Square', kind: 'dome', x: 140, z: 140, hx: 50, hz: 44 },
      { id: 'clt_hilite', name: 'HiLITE City Mall', kind: 'plaza', x: 145, z: -140, hx: 52, hz: 48 },
    ],
    schools: [
      { id: 'sch_clt_1', name: 'BEM Girls High School', x: -135, z: 155, rot: 0 },
      { id: 'sch_clt_2', name: 'Malabar Christian College', x: -235, z: -235, rot: 0 },
    ],
    petrolPumps: [
      { id: 'fuel_clt_1', name: 'IndianOil Mavoor Rd', x: 245, z: -55, rot: 0 },
      { id: 'fuel_clt_2', name: 'HP Petrol Beach Rd', x: -58, z: 240, rot: Math.PI / 2 },
    ],
    policeStations: [
      { id: 'pol_clt_1', name: 'Town Police Station', x: 60, z: 62, rot: 0 },
    ],
    tollGates: [
      { id: 'toll_clt_1', name: 'Thondayad Bypass Toll', x: 0, z: -475, heading: 0, fee: 40 },
      { id: 'toll_clt_2', name: 'Kallai Bridge Toll', x: 0, z: 540, heading: 0, fee: 40 },
    ],
  }),

  newyork: makeStandardGridCity({
    id: 'newyork',
    name: 'New York',
    localLabel: 'MANHATTAN · NYC',
    roadNames: {
      nsMain: '5th Avenue · Broadway',
      ewMain: '42nd Street · Times Sq',
      northAve: 'Central Park South',
      southAve: 'Canal Street',
      westAve: 'West Side Highway',
      eastAve: 'Lexington Avenue',
    },
    zones: [
      { name: 'HELLS KITCHEN', ml: 'MIDTOWN WEST', p: [-320, -320], r: 220 },
      { name: 'CENTRAL PARK', ml: 'UPPER MIDTOWN', p: [0, -320], r: 220 },
      { name: 'UPPER EAST', ml: 'FIFTH AVE', p: [320, -320], r: 220 },
      { name: 'HUDSON YARDS', ml: 'WEST SIDE', p: [-320, 0], r: 220 },
      { name: 'TIMES SQUARE', ml: 'MIDTOWN MANHATTAN', p: [0, 0], r: 260 },
      { name: 'GRAND CENTRAL', ml: 'LEXINGTON', p: [320, 0], r: 220 },
      { name: 'SOHO', ml: 'LOWER MANHATTAN', p: [-320, 320], r: 220 },
      { name: 'WALL STREET', ml: 'FINANCIAL DIST', p: [320, 320], r: 220 },
    ],
    theme: {
      skyTint: 0x8fb6d8,
      fogColor: 0xb7c6d4,
      fogDensity: 0.00125,
      sunColor: 0xffe4c4,
      sunIntensity: 2.9,
      palmRatio: 0.0,
      waterColor: 0x1a3f54,
    },
    water: {
      level: -0.9,
      polygons: [
        [[-940, -940], [-590, -940], [-590, 940], [-940, 940]],
      ],
      channels: [],
    },
    landmarks: [
      { id: 'nyc_empire', name: 'Empire Skyscraper Spire', kind: 'spire', x: -140, z: -140, hx: 48, hz: 48 },
      { id: 'nyc_times', name: 'Times Square Media Tower', kind: 'neon', x: 140, z: -140, hx: 50, hz: 44 },
      { id: 'nyc_freedom', name: 'One World Glass Tower', kind: 'spire', x: 140, z: 140, hx: 48, hz: 48 },
    ],
    schools: [
      { id: 'sch_nyc_1', name: 'Stuyvesant High School', x: -135, z: 145, rot: 0 },
      { id: 'sch_nyc_2', name: 'Midtown Prep Academy', x: 245, z: 140, rot: 0 },
    ],
    petrolPumps: [
      { id: 'fuel_nyc_1', name: 'Shell 42nd St Station', x: 65, z: -58, rot: 0 },
      { id: 'fuel_nyc_2', name: 'Mobil West Side Fuel', x: -58, z: 245, rot: Math.PI / 2 },
    ],
    policeStations: [
      { id: 'pol_nyc_1', name: 'NYPD Midtown Precinct', x: -62, z: -245, rot: 0 },
      { id: 'pol_nyc_2', name: 'NYPD Downtown HQ', x: 245, z: 245, rot: Math.PI },
    ],
    tollGates: [
      { id: 'toll_nyc_1', name: 'Lincoln Tunnel Toll', x: -480, z: 0, heading: Math.PI / 2, fee: 50 },
      { id: 'toll_nyc_2', name: 'Brooklyn Bridge Toll', x: 0, z: 480, heading: 0, fee: 50 },
    ],
  }),

  dubai: makeStandardGridCity({
    id: 'dubai',
    name: 'Dubai',
    localLabel: 'دبي · DOWNTOWN',
    roadNames: {
      nsMain: 'Sheikh Zayed Road (E11)',
      ewMain: 'Financial Centre Blvd',
      northAve: 'Jumeirah Beach Road',
      southAve: 'Dubai Marina Walk',
      westAve: 'Palm Crescent Blvd',
      eastAve: 'Al Khail Road',
    },
    zones: [
      { name: 'JUMEIRAH', ml: 'جميرا', p: [-320, -320], r: 220 },
      { name: 'DIFC', ml: 'مركز دبي المالي', p: [0, -320], r: 220 },
      { name: 'CREEK HARBOUR', ml: 'خور دبي', p: [320, -320], r: 220 },
      { name: 'DUBAI MARINA', ml: 'مرسى دبي', p: [-320, 0], r: 220 },
      { name: 'DOWNTOWN · BURJ', ml: 'وسط مدينة دبي', p: [0, 0], r: 260 },
      { name: 'BUSINESS BAY', ml: 'الخليج التجاري', p: [320, 0], r: 220 },
      { name: 'PALM GATE', ml: 'نخلة جميرا', p: [-320, 320], r: 220 },
      { name: 'AL BARSHA', ml: 'البرشاء', p: [320, 320], r: 220 },
    ],
    theme: {
      skyTint: 0xd8c39b,
      fogColor: 0xdecbb0,
      fogDensity: 0.0011,
      sunColor: 0xffcf88,
      sunIntensity: 3.3,
      palmRatio: 0.85,
      waterColor: 0x0e6e7d,
    },
    water: {
      level: -0.9,
      polygons: [
        [[-940, -940], [-595, -940], [-595, 940], [-940, 940]],
      ],
      channels: [
        { pts: [[-595, 470], [180, 470], [940, 450]], width: 45 },
      ],
    },
    landmarks: [
      { id: 'dxb_burj', name: 'Burj Sky Spire', kind: 'burj', x: -145, z: -145, hx: 54, hz: 54 },
      { id: 'dxb_mall', name: 'Dubai Fountain Mall', kind: 'plaza', x: 145, z: -145, hx: 55, hz: 48 },
      { id: 'dxb_frame', name: 'Dubai Golden Frame', kind: 'frame', x: 145, z: 145, hx: 46, hz: 46 },
    ],
    schools: [
      { id: 'sch_dxb_1', name: 'Dubai International Academy', x: -135, z: 145, rot: 0 },
      { id: 'sch_dxb_2', name: 'Emirates Horizon School', x: 245, z: 240, rot: 0 },
    ],
    petrolPumps: [
      { id: 'fuel_dxb_1', name: 'ENOC Sheikh Zayed Station', x: 65, z: -58, rot: 0 },
      { id: 'fuel_dxb_2', name: 'ADNOC Marina Oasis', x: -58, z: 245, rot: Math.PI / 2 },
    ],
    policeStations: [
      { id: 'pol_dxb_1', name: 'Dubai Supercar Police HQ', x: -62, z: -245, rot: 0 },
    ],
    tollGates: [
      { id: 'toll_dxb_1', name: 'Salik Al Garhoud Gate', x: 0, z: -475, heading: 0, fee: 45 },
      { id: 'toll_dxb_2', name: 'Salik Al Barsha Gate', x: 0, z: 540, heading: 0, fee: 45 },
    ],
  }),

  london: makeStandardGridCity({
    id: 'london',
    name: 'London',
    localLabel: 'WESTMINSTER · UK',
    roadNames: {
      nsMain: 'Whitehall · Regent St',
      ewMain: 'Oxford St · Piccadilly',
      northAve: 'Marylebone Road',
      southAve: 'Victoria Embankment',
      westAve: 'Kensington Park Lane',
      eastAve: 'Fleet Street · Strand',
    },
    zones: [
      { name: 'KENSINGTON', ml: 'WEST LONDON', p: [-320, -320], r: 220 },
      { name: 'OXFORD CIRCUS', ml: 'WEST END', p: [0, -320], r: 220 },
      { name: 'BLOOMSBURY', ml: 'CENTRAL NORTH', p: [320, -320], r: 220 },
      { name: 'HYDE PARK', ml: 'MAYFAIR', p: [-320, 0], r: 220 },
      { name: 'TRAFALGAR · BIG BEN', ml: 'WESTMINSTER', p: [0, 0], r: 260 },
      { name: 'COVENT GARDEN', ml: 'THE STRAND', p: [320, 0], r: 220 },
      { name: 'CHELSEA', ml: 'THAMES WEST', p: [-320, 320], r: 220 },
      { name: 'SOUTHBANK', ml: 'WATERLOO', p: [320, 320], r: 220 },
    ],
    theme: {
      skyTint: 0x9bb0bf,
      fogColor: 0xb7c2c8,
      fogDensity: 0.00145,
      sunColor: 0xffe8cc,
      sunIntensity: 2.7,
      palmRatio: 0.0,
      waterColor: 0x1e3c47,
    },
    water: {
      level: -0.9,
      polygons: [],
      channels: [
        { pts: [[-940, 470], [-200, 445], [280, 465], [940, 440]], width: 52 },
      ],
    },
    landmarks: [
      { id: 'lon_bigben', name: 'Elizabeth Clock Tower (Big Ben)', kind: 'clocktower', x: -140, z: -140, hx: 46, hz: 46 },
      { id: 'lon_shard', name: 'Thames Glass Shard', kind: 'spire', x: 145, z: 145, hx: 46, hz: 46 },
      { id: 'lon_palace', name: 'Westminster Grand Hall', kind: 'dome', x: 140, z: -140, hx: 52, hz: 46 },
    ],
    schools: [
      { id: 'sch_lon_1', name: 'Westminster School', x: -135, z: 145, rot: 0 },
      { id: 'sch_lon_2', name: 'King’s College Hall', x: 245, z: -140, rot: 0 },
    ],
    petrolPumps: [
      { id: 'fuel_lon_1', name: 'BP Westminster Station', x: -58, z: -245, rot: 0 },
      { id: 'fuel_lon_2', name: 'Shell Southbank Pump', x: 245, z: 60, rot: Math.PI / 2 },
    ],
    policeStations: [
      { id: 'pol_lon_1', name: 'New Scotland Yard', x: -65, z: 62, rot: 0 },
    ],
    tollGates: [
      { id: 'toll_lon_1', name: 'Congestion Charge Gate N', x: 0, z: -475, heading: 0, fee: 45 },
      { id: 'toll_lon_2', name: 'Westminster Bridge Toll', x: 0, z: 540, heading: 0, fee: 45 },
    ],
  }),

  tokyo: makeStandardGridCity({
    id: 'tokyo',
    name: 'Tokyo',
    localLabel: '東京 · SHIBUYA',
    roadNames: {
      nsMain: 'Roppongi - Ginza Expressway',
      ewMain: 'Shibuya Dogenzaka Ave',
      northAve: 'Shinjuku Meiji Dori',
      southAve: 'Odaiba Rainbow Blvd',
      westAve: 'Harajuku Omotesando',
      eastAve: 'Minato Tower Street',
    },
    zones: [
      { name: 'SHINJUKU', ml: '新宿', p: [-320, -320], r: 220 },
      { name: 'HARAJUKU', ml: '原宿', p: [0, -320], r: 220 },
      { name: 'AKIHABARA', ml: '秋葉原', p: [320, -320], r: 220 },
      { name: 'YOYOGI', ml: '代々木', p: [-320, 0], r: 220 },
      { name: 'SHIBUYA CROSSING', ml: '渋谷スクランブル', p: [0, 0], r: 260 },
      { name: 'GINZA', ml: '銀座', p: [320, 0], r: 220 },
      { name: 'ROPPONGI', ml: '六本木', p: [-320, 320], r: 220 },
      { name: 'TOKYO BAY', ml: 'お台場', p: [320, 320], r: 220 },
    ],
    theme: {
      skyTint: 0x9ac1de,
      fogColor: 0xbac7d6,
      fogDensity: 0.00118,
      sunColor: 0xffdfc4,
      sunIntensity: 3.0,
      palmRatio: 0.0,
      waterColor: 0x15415c,
    },
    water: {
      level: -0.9,
      polygons: [
        [[580, -940], [940, -940], [940, 940], [580, 940]],
      ],
      channels: [],
    },
    landmarks: [
      { id: 'tyo_tower', name: 'Tokyo Red Lattice Tower', kind: 'tokyotower', x: 145, z: -145, hx: 50, hz: 50 },
      { id: 'tyo_shibuya', name: 'Shibuya 109 Neon Plaza', kind: 'neon', x: -145, z: -140, hx: 50, hz: 46 },
      { id: 'tyo_skytree', name: 'Minato Sky Spire', kind: 'spire', x: 140, z: 140, hx: 48, hz: 48 },
    ],
    schools: [
      { id: 'sch_tyo_1', name: 'Minato Senior High', x: -135, z: 145, rot: 0 },
      { id: 'sch_tyo_2', name: 'Shibuya Tech Academy', x: -245, z: -240, rot: 0 },
    ],
    petrolPumps: [
      { id: 'fuel_tyo_1', name: 'ENEOS Shibuya Station', x: -58, z: -245, rot: 0 },
      { id: 'fuel_tyo_2', name: 'Idemitsu Roppongi Fuel', x: 245, z: 60, rot: Math.PI / 2 },
    ],
    policeStations: [
      { id: 'pol_tyo_1', name: 'Shibuya Koban HQ', x: -62, z: 62, rot: 0 },
    ],
    tollGates: [
      { id: 'toll_tyo_1', name: 'Shuto Expressway Toll N', x: 0, z: -475, heading: 0, fee: 45 },
      { id: 'toll_tyo_2', name: 'Rainbow Bridge Toll', x: 0, z: 480, heading: 0, fee: 45 },
    ],
  }),
};
