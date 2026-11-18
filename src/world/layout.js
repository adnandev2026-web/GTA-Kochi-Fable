// Dynamic World Layout supporting Kochi + 7 additional cities.
// Mutates live exported bindings in-place so every world module reads the active city cleanly.

import { KOCHI_EXTRA_POIS, EXTRA_CITY_LAYOUTS } from './cities.js';
import { CITIES_CATALOG } from '../shared/catalog.ts';

export const P = (east, north) => [east, -north];
export const EXIT_BUFFER = 285;
export const FLYOVER_DECK_HALF = 8.0;

export const ROAD_CLASSES = {
  highway: {
    lanes: 4,
    laneWidth: 3.3,
    median: 1.8,
    separatorAfter: 2,
    separator: 1.0,
    shoulder: 0.4,
    sidewalk: 2.6,
    speed: 20,
  },
  arterial: {
    lanes: 2,
    laneWidth: 3.3,
    median: 1.8,
    separatorAfter: -1,
    separator: 0,
    shoulder: 0.4,
    sidewalk: 2.4,
    speed: 14.5,
  },
  street: {
    lanes: 1,
    laneWidth: 3.5,
    median: 0,
    separatorAfter: -1,
    separator: 0,
    shoulder: 0.3,
    sidewalk: 1.8,
    speed: 10,
  },
};

export function laneOffset(cls, i) {
  const c = ROAD_CLASSES[cls];
  let o = c.median / 2 + (i + 0.5) * c.laneWidth;
  if (c.separatorAfter > 0 && i >= c.separatorAfter) o += c.separator;
  return o;
}

export function carriageHalf(cls) {
  const c = ROAD_CLASSES[cls];
  return c.median / 2 + c.lanes * c.laneWidth + (c.separatorAfter > 0 ? c.separator : 0) + c.shoulder;
}

const KOCHI_PRESET = {
  WORLD: { minX: -1620, maxX: 920, minZ: -2280, maxZ: 1680 },
  CORE: { minX: -1330, maxX: 670, minZ: -2030, maxZ: 1410 },
  NODES: {
    S_EDGE: { p: P(135, -1620), exit: true, toward: 'Aroor · Alappuzha' },
    K: { p: P(40, -850), name: 'Kundannoor Jn', signal: true },
    V: { p: P(0, 0), name: 'Vyttila Jn', signal: true },
    SLJ: { p: P(-85, 470), name: 'Chakkaraparambu', signal: true },
    PB: { p: P(-150, 850), name: 'Palarivattom Bypass Jn', signal: true },
    E: { p: P(-320, 1400), name: 'Edappally Jn', signal: true },
    NW_EDGE: { p: P(-845, 2200), exit: true, toward: 'Varapuzha · Guruvayur' },
    NE_EDGE: { p: P(90, 2215), exit: true, toward: 'Aluva · Thrissur' },
    CP: { p: P(-505, 1125), name: 'Changampuzha Park' },
    P: { p: P(-445, 880), name: 'Palarivattom Jn', signal: true },
    S: { p: P(-680, 765), name: 'Stadium Jn', signal: true },
    KL: { p: P(-960, 620), name: 'Kaloor Jn', signal: true },
    W_EDGE_N: { p: P(-1540, 395), exit: true, toward: 'MG Road · High Court' },
    KD: { p: P(-840, -40), name: 'Kadavanthra Jn', signal: true },
    W_EDGE_S: { p: P(-1560, -127), exit: true, toward: 'Ernakulam South' },
    E_EDGE_C: { p: P(577, 948), exit: true, toward: 'Kakkanad · Infopark' },
    SE_EDGE: { p: P(820, -745), exit: true, toward: 'Thrippunithura' },
    W_EDGE_K: { p: P(-840, -1028), exit: true, toward: 'Thevara · W. Island' },
    E_EDGE_K: { p: P(880, -612), exit: true, toward: 'Maradu · Petta' },
  },
  EDGES: [
    { id: 'NH66_1', a: 'S_EDGE', b: 'K', cls: 'highway', name: 'NH 66 Bypass', via: [P(100, -1340), P(75, -1100)] },
    { id: 'NH66_2', a: 'K', b: 'V', cls: 'highway', name: 'NH 66 Bypass', via: [P(28, -560), P(14, -300)] },
    { id: 'NH66_3', a: 'V', b: 'SLJ', cls: 'highway', name: 'NH 66 Bypass', via: [P(-22, 220)] },
    { id: 'NH66_4', a: 'SLJ', b: 'PB', cls: 'highway', name: 'NH 66 Bypass', via: [P(-118, 660)] },
    { id: 'NH66_5', a: 'PB', b: 'E', cls: 'highway', name: 'NH 66 Bypass', via: [P(-205, 1080), P(-275, 1270)] },
    { id: 'NH66_6', a: 'E', b: 'NW_EDGE', cls: 'arterial', name: 'NH 66', via: [P(-455, 1560), P(-585, 1770), P(-700, 1960)] },
    { id: 'NH544', a: 'E', b: 'NE_EDGE', cls: 'highway', name: 'NH 544', via: [P(-225, 1570), P(-110, 1790), P(-30, 1960)] },
    { id: 'ONH47', a: 'CP', b: 'E', cls: 'highway', name: 'Edappally - Palarivattom Rd', via: [P(-420, 1255)] },
    { id: 'BAN_1', a: 'P', b: 'CP', cls: 'arterial', name: 'Edappally - Palarivattom Rd', via: [P(-492, 1000)], metro: true },
    { id: 'BAN_2', a: 'S', b: 'P', cls: 'arterial', name: 'Banerji Road', via: [P(-560, 815)], metro: true },
    { id: 'BAN_3', a: 'KL', b: 'S', cls: 'arterial', name: 'Banerji Road', via: [P(-820, 695)], metro: true },
    { id: 'BAN_4', a: 'W_EDGE_N', b: 'KL', cls: 'arterial', name: 'Banerji Road', via: [P(-1280, 500), P(-1120, 565)], metro: true },
    { id: 'CIVIL_1', a: 'P', b: 'PB', cls: 'arterial', name: 'Civil Line Road', via: [P(-300, 858)] },
    { id: 'CIVIL_2', a: 'PB', b: 'E_EDGE_C', cls: 'arterial', name: 'Civil Line Road', via: [P(60, 868), P(300, 905)] },
    { id: 'KK', a: 'KL', b: 'KD', cls: 'street', name: 'Kaloor - Kadavanthra Rd', via: [P(-955, 420), P(-915, 180)] },
    { id: 'SA_1', a: 'W_EDGE_S', b: 'KD', cls: 'arterial', name: 'Sahodaran Ayyappan Road', via: [P(-1280, -95), P(-1060, -70)], metro: true },
    { id: 'SA_2', a: 'KD', b: 'V', cls: 'arterial', name: 'Sahodaran Ayyappan Road', via: [P(-620, -18), P(-400, -28), P(-190, -8)], metro: true },
    { id: 'TRP', a: 'V', b: 'SE_EDGE', cls: 'arterial', name: 'Ettumanoor - Ernakulam Road', via: [P(150, -30), P(300, -245), P(450, -420), P(610, -560)] },
    { id: 'KUN_W', a: 'W_EDGE_K', b: 'K', cls: 'arterial', name: 'Kundannoor Bridge Road', via: [P(-560, -985), P(-300, -945), P(-110, -890)] },
    { id: 'KUN_E', a: 'K', b: 'E_EDGE_K', cls: 'arterial', name: 'Kundannoor - Maradu Road', via: [P(215, -808), P(420, -745), P(610, -690)] },
    {
      id: 'STAD',
      a: 'S',
      b: 'SLJ',
      cls: 'arterial',
      name: 'Stadium Link Road',
      via: [P(-752, 680), P(-770, 560), P(-715, 455), P(-600, 418), P(-400, 438), P(-230, 462)],
    },
  ],
  FLYOVERS: [
    { id: 'F_K', name: 'Kundannoor Flyover', node: 'K', edges: ['NH66_1', 'NH66_2'], half: 150, flat: 42, height: 6.4 },
    { id: 'F_V', name: 'Vyttila Flyover', node: 'V', edges: ['NH66_2', 'NH66_3'], half: 150, flat: 42, height: 6.4 },
    { id: 'F_PB', name: 'Palarivattom Flyover', node: 'PB', edges: ['NH66_4', 'NH66_5'], half: 145, flat: 40, height: 6.2 },
    { id: 'F_E', name: 'Edappally Flyover', node: 'E', edges: ['ONH47', 'NH544'], half: 150, flat: 46, height: 6.4 },
  ],
  METRO: {
    railHeight: 13.2,
    deckHalf: 4.6,
    pillarSpacing: 27,
    lines: [
      {
        id: 'north',
        pieces: [
          { pts: [P(190, 2420), P(140, 2320)] },
          { edge: 'NH544', dir: -1, side: 1, offset: 22.5 },
          { edge: 'ONH47', dir: -1, side: 1, offset: 22.5, to: 235 },
          { pts: [P(-470, 1188)] },
          { edge: 'BAN_1', dir: -1, from: 55 },
          { edge: 'BAN_2', dir: -1 },
          { edge: 'BAN_3', dir: -1 },
          { edge: 'BAN_4', dir: -1 },
          { pts: [P(-1700, 330)] },
        ],
        stations: [
          { name: 'Edappally', ml: 'ഇടപ്പള്ളി', near: P(-300, 1455) },
          { name: 'Changampuzha Park', ml: 'ചങ്ങമ്പുഴ പാർക്ക്', near: P(-498, 1060) },
          { name: 'Palarivattom', ml: 'പാലാരിവട്ടം', near: P(-520, 845) },
          { name: 'JLN Stadium', ml: 'ജെ.എൽ.എൻ. സ്റ്റേഡിയം', near: P(-745, 732) },
          { name: 'Kaloor', ml: 'കലൂർ', near: P(-1040, 592) },
        ],
      },
      {
        id: 'south',
        pieces: [
          { pts: [P(-1720, -146)] },
          { edge: 'SA_1', dir: 1 },
          { edge: 'SA_2', dir: 1 },
          { pts: [P(60, 12), P(135, 30), P(215, 8), P(268, -70), P(298, -170)] },
          { edge: 'TRP', dir: 1, from: 345 },
          { pts: [P(960, -870)] },
        ],
        stations: [
          { name: 'Kadavanthra', ml: 'കടവന്ത്ര', near: P(-760, -32) },
          { name: 'Elamkulam', ml: 'ഇളംകുളം', near: P(-400, -28) },
          { name: 'Vyttila', ml: 'വൈറ്റില', near: P(140, 30) },
          { name: 'Thykoodam', ml: 'തൈക്കൂടം', near: P(405, -365) },
        ],
      },
    ],
  },
  WATER: {
    level: -0.9,
    polygons: [
      [P(-1800, -600), P(-700, -640), P(-420, -700), P(-250, -760), P(-170, -930), P(-150, -1060), P(-60, -1130), P(-40, -1900), P(-1800, -1900)],
      [P(392, 330), P(440, 250), P(452, 90), P(430, -40), P(470, -150), P(560, -215), P(1100, -270), P(1100, -120), P(560, -95), P(520, 40), P(540, 250), P(500, 360)],
    ],
    channels: [
      { pts: [P(-60, -1180), P(90, -1165), P(260, -1200), P(1100, -1290)], width: 95 },
      { pts: [P(-330, -700), P(-160, -470), P(20, -425), P(200, -440), P(360, -330), P(470, -170)], width: 34 },
      { pts: [P(-1800, 1100), P(-900, 1060), P(-640, 1010), P(-330, 1090), P(-120, 1060), P(140, 1120), P(1100, 1080)], width: 17 },
    ],
  },
  LANDMARKS: {
    lulu: { p: P(-338, 1662), rot: 0, name: 'LuLu Mall' },
    forum: { p: P(-78, -652), rot: 0, name: 'Forum Kochi' },
    stadium: { p: P(-612, 582), rot: 0, name: 'JLN Stadium' },
    hub: { p: P(250, 150), rot: -Math.PI / 2, name: 'Vyttila Mobility Hub' },
    brototype: { p: P(212, -768), rot: -Math.PI / 2, name: 'Brototype' },
    crowne: { p: P(150, -945), rot: Math.PI, name: 'Crowne Plaza' },
  },
  RESERVED: [
    { c: P(-338, 1662), hx: 78, hz: 125, rot: 0, tag: 'lulu' },
    { c: P(-345, 1840), hx: 45, hz: 45, rot: 0, tag: 'marriott' },
    { c: P(-78, -652), hx: 78, hz: 62, rot: 0, tag: 'forum' },
    { c: P(250, 150), hx: 118, hz: 135, rot: 0, tag: 'hub' },
    { c: P(212, -768), hx: 26, hz: 22, rot: 0.26, tag: 'brototype' },
    { c: P(150, -945), hx: 48, hz: 48, rot: 0, tag: 'crowne' },
  ],
  RESERVED_CIRCLES: [{ c: P(-612, 582), r: 128, tag: 'stadium' }],
  OPEN_AREAS: [
    [P(-262, 1540), P(-236, 1548), P(-132, 1752), P(-150, 1800), P(-262, 1800)],
    [P(-420, 1752), P(-262, 1752), P(-262, 1800), P(-420, 1800)],
    [P(-2, -720), P(14, -720), P(10, -590), P(-2, -590)],
    [P(132, 0), P(250, -12), P(250, 20), P(132, 22)],
  ],
  ZONES: [
    { name: 'KUNDANNOOR', ml: 'കുണ്ടന്നൂർ', p: P(40, -850), r: 260 },
    { name: 'MARADU', ml: 'മരട്', p: P(400, -760), r: 240 },
    { name: 'NETTOOR', ml: 'നെട്ടൂർ', p: P(90, -1260), r: 200 },
    { name: 'THYKOODAM', ml: 'തൈക്കൂടം', p: P(200, -400), r: 260 },
    { name: 'VYTTILA', ml: 'വൈറ്റില', p: P(40, 30), r: 300 },
    { name: 'ELAMKULAM', ml: 'ഇളംകുളം', p: P(-420, -30), r: 230 },
    { name: 'KADAVANTHRA', ml: 'കടവന്ത്ര', p: P(-860, -40), r: 280 },
    { name: 'CHAKKARAPARAMBU', ml: 'ചക്കരപ്പറമ്പ്', p: P(-85, 470), r: 210 },
    { name: 'PALARIVATTOM', ml: 'പാലാരിവട്ടം', p: P(-300, 870), r: 300 },
    { name: 'KALOOR', ml: 'കലൂർ', p: P(-800, 640), r: 330 },
    { name: 'CHANGAMPUZHA PARK', ml: 'ചങ്ങമ്പുഴ പാർക്ക്', p: P(-500, 1130), r: 170 },
    { name: 'EDAPPALLY', ml: 'ഇടപ്പള്ളി', p: P(-330, 1500), r: 420 },
  ],
  SPAWN: { p: P(209, -787), heading: 0.22 },
  PLACE_NAMES: {
    K: { en: 'KUNDANNOOR', ml: 'കുണ്ടന്നൂർ', hi: 'कुण्डन्नूर' },
    V: { en: 'VYTTILA', ml: 'വൈറ്റില', hi: 'वैटिला' },
    PB: { en: 'PALARIVATTOM', ml: 'പാലാരിവട്ടം', hi: 'पालारिवट्टम' },
    P: { en: 'PALARIVATTOM', ml: 'പാലാരിവട്ടം', hi: 'पालारिवट्टम' },
    E: { en: 'EDAPPALLY', ml: 'ഇടപ്പള്ളി', hi: 'इडप्पल्ली' },
    KL: { en: 'KALOOR', ml: 'കലൂർ', hi: 'कलूर' },
    S: { en: 'KALOOR', ml: 'കലൂർ', hi: 'कलूर' },
    KD: { en: 'KADAVANTHRA', ml: 'കടവന്ത്ര', hi: 'कडवन्त्रा' },
    SLJ: { en: 'CHAKKARAPARAMBU', ml: 'ചക്കരപ്പറമ്പ്', hi: 'चक्करपरम्बु' },
    CP: { en: 'CHANGAMPUZHA PARK', ml: 'ചങ്ങമ്പുഴ പാർക്ക്', hi: 'चंगम्पुषा पार्क' },
  },
};

const kochiCatalog = CITIES_CATALOG.find((c) => c.id === 'kochi');
const kochiHomes = kochiCatalog ? kochiCatalog.homes : [];

export const WORLD = { ...KOCHI_PRESET.WORLD };
export const CORE = { ...KOCHI_PRESET.CORE };
export const NODES = { ...KOCHI_PRESET.NODES };
export const EDGES = [...KOCHI_PRESET.EDGES];
export const FLYOVERS = [...KOCHI_PRESET.FLYOVERS];
export const METRO = { ...KOCHI_PRESET.METRO };
export const WATER = { ...KOCHI_PRESET.WATER };
export const LANDMARKS = { ...KOCHI_PRESET.LANDMARKS };
export const RESERVED = [...KOCHI_PRESET.RESERVED];
export const RESERVED_CIRCLES = [...KOCHI_PRESET.RESERVED_CIRCLES];
export const OPEN_AREAS = [...KOCHI_PRESET.OPEN_AREAS];
export const ZONES = [...KOCHI_PRESET.ZONES];
export const SPAWN = { ...KOCHI_PRESET.SPAWN };
export const PLACE_NAMES = { ...KOCHI_PRESET.PLACE_NAMES };
export const CITY_POIS = {
  ...KOCHI_EXTRA_POIS,
  homes: kochiHomes,
  selectedHomeId: kochiHomes[0]?.id || 'kochi_kundannoor',
};

function replaceObject(target, next) {
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, next);
}

function replaceArray(target, next) {
  target.length = 0;
  for (const item of next) target.push(item);
}

export function setActiveCityLayout(cityId = 'kochi', homeId = '') {
  if (cityId === 'kochi' || !EXTRA_CITY_LAYOUTS[cityId]) {
    replaceObject(WORLD, KOCHI_PRESET.WORLD);
    replaceObject(CORE, KOCHI_PRESET.CORE);
    replaceObject(NODES, KOCHI_PRESET.NODES);
    replaceArray(EDGES, KOCHI_PRESET.EDGES);
    replaceArray(FLYOVERS, KOCHI_PRESET.FLYOVERS);
    replaceObject(METRO, KOCHI_PRESET.METRO);
    replaceObject(WATER, KOCHI_PRESET.WATER);
    replaceObject(LANDMARKS, KOCHI_PRESET.LANDMARKS);
    const extraReserved = [
      ...KOCHI_EXTRA_POIS.schools.map((s) => ({ c: [s.x, s.z], hx: 30, hz: 24, rot: 0, tag: s.id })),
      ...KOCHI_EXTRA_POIS.petrolPumps.map((p) => ({ c: [p.x, p.z], hx: 20, hz: 16, rot: 0, tag: p.id })),
      ...KOCHI_EXTRA_POIS.policeStations.map((p) => ({ c: [p.x, p.z], hx: 24, hz: 20, rot: 0, tag: p.id })),
      ...kochiHomes.slice(1).map((h) => ({ c: [h.x, h.z], hx: 18, hz: 18, rot: 0, tag: h.id })),
    ];
    replaceArray(RESERVED, [...KOCHI_PRESET.RESERVED, ...extraReserved]);
    replaceArray(RESERVED_CIRCLES, KOCHI_PRESET.RESERVED_CIRCLES);
    replaceArray(OPEN_AREAS, KOCHI_PRESET.OPEN_AREAS);
    replaceArray(ZONES, KOCHI_PRESET.ZONES);
    replaceObject(PLACE_NAMES, KOCHI_PRESET.PLACE_NAMES);

    const chosenHome = kochiHomes.find((h) => h.id === homeId) || kochiHomes[0];
    replaceObject(SPAWN, { p: chosenHome ? [chosenHome.x, chosenHome.z] : KOCHI_PRESET.SPAWN.p, heading: chosenHome?.heading ?? 0.22 });
    replaceObject(CITY_POIS, {
      ...KOCHI_EXTRA_POIS,
      homes: kochiHomes,
      selectedHomeId: chosenHome?.id || 'kochi_kundannoor',
    });
    return CITY_POIS;
  }

  const preset = EXTRA_CITY_LAYOUTS[cityId];
  replaceObject(WORLD, preset.WORLD);
  replaceObject(CORE, preset.CORE);
  replaceObject(NODES, preset.NODES);
  replaceArray(EDGES, preset.EDGES);
  replaceArray(FLYOVERS, preset.FLYOVERS);
  replaceObject(METRO, preset.METRO);
  replaceObject(WATER, preset.WATER);
  replaceObject(LANDMARKS, preset.LANDMARKS);
  replaceArray(RESERVED, preset.RESERVED);
  replaceArray(RESERVED_CIRCLES, preset.RESERVED_CIRCLES);
  replaceArray(OPEN_AREAS, preset.OPEN_AREAS);
  replaceArray(ZONES, preset.ZONES);
  replaceObject(PLACE_NAMES, preset.PLACE_NAMES);

  const chosenHome = preset.POIS.homes.find((h) => h.id === homeId) || preset.POIS.homes[0];
  replaceObject(SPAWN, {
    p: chosenHome ? [chosenHome.x, chosenHome.z] : preset.SPAWN.p,
    heading: chosenHome?.heading ?? 0,
  });
  replaceObject(CITY_POIS, {
    ...preset.POIS,
    selectedHomeId: chosenHome?.id || preset.POIS.homes[0]?.id || '',
  });
  return CITY_POIS;
}
