// Modular City Configuration System
// Easily add new cities anywhere in the world via center coordinates, bounding box,
// traffic rules, local language/script signage, vehicle pools, and regional attire presets.

export type TrafficSide = 'left' | 'right';

export interface CityBilingualShop {
  local: string;
  en: string;
  category: string;
  bg?: string;
  fg?: string;
}

export interface CityHoarding {
  local: string;
  en: string;
  accent: string;
  bg: string;
}

export interface CityConfig {
  id: string;
  name: string;
  localName: string;
  country: string;
  regionLabel: string;
  category: 'Kerala' | 'International';
  center: { lat: number; lon: number };
  /** [southLat, westLon, northLat, eastLon] */
  bbox: [number, number, number, number];
  /** Metric scale applied when projecting OSM coords to world meters (e.g. 0.35 for expansive 15km Nilambur-Kalikavu corridor, 1.0 for city districts). */
  worldScale: number;
  trafficSide: TrafficSide;
  language: {
    code: string;
    label: string;
    scriptName: string;
    rtl?: boolean;
  };
  plate: {
    prefix: string;
    bg: string;
    fg: string;
    bandBg?: string;
  };
  traditionalOutfit: {
    label: string;
    hat: 'none' | 'cap' | 'beanie' | 'fedora' | 'helmet' | 'ghutra' | 'kasa';
    hatColor: string;
    shirtStyle: 'tshirt' | 'polo' | 'hoodie' | 'kurta' | 'kimono_top' | 'kandura_top';
    shirtColor: string;
    overcoat: 'none' | 'leather' | 'trench' | 'bomber' | 'denim';
    overcoatColor: string;
    pantsStyle: 'jeans' | 'cargo' | 'chinos' | 'track' | 'mundu' | 'hakama' | 'kandura_robe';
    pantsColor: string;
    shoeColor: string;
  };
  /** Weighted spawn probabilities for AI traffic (every id must exist in VEHICLES & VEHICLE_RENDERER CAPACITY) */
  trafficMix: Array<[string, number]>;
  carParkingMix: Array<[string, number]>;
  bikeParkingMix: Array<[string, number]>;
  shops: CityBilingualShop[];
  hoardings: CityHoarding[];
  busDestinations: Array<[string, string]>;
  signTranslations: {
    schoolZone: string;
    petrolPump: string;
    policeStation: string;
    tollPlaza: string;
    yourHome: string;
    welcome: string;
    speedLimit: string;
    busStop: string;
  };
  theme: {
    skyTint: number;
    fogColor: number;
    fogDensity: number;
    sunColor: number;
    sunIntensity: number;
    palmRatio: number;
    waterColor: number;
    themeColor: string;
  };
}

export const CITY_CONFIGS: Record<string, CityConfig> = {
  pookkottumpadam: {
    id: 'pookkottumpadam',
    name: 'Pookkottumpadam',
    localName: 'പൂക്കോട്ടുംപാടം',
    country: 'India',
    regionLabel: 'Nilambur – Pookkottumpadam – Kalikavu · Kerala',
    category: 'Kerala',
    center: { lat: 11.2245, lon: 76.2745 },
    bbox: [11.168, 76.215, 11.285, 76.332],
    worldScale: 0.28,
    trafficSide: 'left',
    language: { code: 'ml', label: 'Malayalam · മലയാളം', scriptName: 'Malayalam' },
    plate: { prefix: 'KL 71', bg: '#f5f5f4', fg: '#111827', bandBg: '#1d4ed8' },
    traditionalOutfit: {
      label: 'Kerala Mundu & Kasavu Shirt',
      hat: 'none',
      hatColor: '#f8fafc',
      shirtStyle: 'kurta',
      shirtColor: '#f8fafc',
      overcoat: 'none',
      overcoatColor: '#1e3a5f',
      pantsStyle: 'mundu',
      pantsColor: '#f8fafc',
      shoeColor: '#78350f',
    },
    trafficMix: [
      ['auto', 14],
      ['motorcycle', 13],
      ['scooter', 12],
      ['jeep', 7],
      ['hatchback', 12],
      ['sedan', 5],
      ['suv', 4],
      ['ksrtc', 7],
      ['bus', 5],
    ],
    carParkingMix: [['hatchback', 5], ['jeep', 4], ['suv', 3], ['sedan', 2], ['auto', 3]],
    bikeParkingMix: [['motorcycle', 5], ['scooter', 5]],
    shops: [
      { local: 'മലബാർ സൂപ്പർമാർക്കറ്റ്', en: 'MALABAR SUPERMARKET', category: 'MARKET', bg: '#0c5c43', fg: '#fff' },
      { local: 'നിലമ്പൂർ ബേക്കറി & ടീ', en: 'NILAMBUR BAKERY & TEA', category: 'BAKERY', bg: '#991b1b', fg: '#fef3c7' },
      { local: 'ചാലിയാർ മെഡിക്കൽസ്', en: 'CHALIYAR MEDICALS', category: 'PHARMACY', bg: '#f8fafc', fg: '#047857' },
      { local: 'കൽക്കാവ് ഹാർഡ്‌വെയർ', en: 'KALIKAVU HARDWARE', category: 'TOOLS', bg: '#1e3a8a', fg: '#fff' },
      { local: 'ഹിൽവാലി ടെക്സ്റ്റൈൽസ്', en: 'HILL VALLEY TEXTILES', category: 'SILKS', bg: '#701a75', fg: '#fde047' },
      { local: 'മലപ്പുറം ജ്വല്ലറി', en: 'MALAPPURAM JEWELLERS', category: 'GOLD', bg: '#78350f', fg: '#fef08a' },
      { local: 'ടീ & ബിരിയാണി ഹൗസ്', en: 'MALABAR BIRYANI HOUSE', category: 'HOTEL', bg: '#b45309', fg: '#fff' },
      { local: 'സഹ്യാദ്രി സ്പൈസസ്', en: 'SAHYADRI SPICE MART', category: 'SPICES', bg: '#14532d', fg: '#bbf7d0' },
      { local: 'അമരമ്പലം ഫ്രൂട്ട്സ്', en: 'AMARAMPALAM FRUITS', category: 'FRESH', bg: '#166534', fg: '#fef9c3' },
      { local: 'പൂക്കോട്ടുംപാടം മൊബൈൽസ്', en: 'TOWN MOBILE WORLD', category: 'ELECTRONICS', bg: '#0f172a', fg: '#38bdf8' },
      { local: 'ഗ്രീൻ വാലി ബുക്ക്സ്', en: 'GREEN VALLEY BOOKS', category: 'BOOKS', bg: '#1e293b', fg: '#facc15' },
      { local: 'റോയൽ ഫുട്‌വെയർ', en: 'ROYAL FOOTWEAR', category: 'SHOES', bg: '#3f3f46', fg: '#fff' },
      { local: 'അൽ-ബൈക്ക് കഫേ', en: 'VALLEY GRILL CAFE', category: 'CAFE', bg: '#7f1d1d', fg: '#fff' },
      { local: 'ജില്ലാ സഹകരണ ബാങ്ക്', en: 'CO-OP BANK BRANCH', category: 'BANK', bg: '#1e40af', fg: '#fff' },
      { local: 'മോഡേൺ ഓട്ടോ പാർട്സ്', en: 'JEEP & AUTO SPARES', category: 'AUTO', bg: '#111827', fg: '#facc15' },
      { local: 'കരുളായി ആയുർവേദ', en: 'KARULAI AYURVEDA', category: 'CLINIC', bg: '#064e3b', fg: '#d1fae5' },
    ],
    hoardings: [
      { local: 'നിലമ്പൂർ — പൂക്കോട്ടുംപാടം — കാളികാവ്', en: 'NILAMBUR · POOKKOTTUMPADAM · KALIKAVU CIRCLE', accent: '#facc15', bg: '#064e3b' },
      { local: 'മലബാർ സിൽക്സ് & ഗോൾഡ്', en: 'GRAND WEDDING SILK COLLECTION', accent: '#fbbf24', bg: '#581c87' },
      { local: 'കേരള ടൂറിസം · നിലമ്പൂർ തേക്ക്', en: 'KERALA GREEN HIGHLANDS · NILAMBUR', accent: '#34d399', bg: '#0f172a' },
      { local: 'ചാലിയാർ ഹിൽ വ്യൂ വില്ലകൾ', en: 'VALLEY SIDE PLOTS & VILLAS', accent: '#38bdf8', bg: '#1e293b' },
      { local: 'കെ.എസ്.ആർ.ടി.സി എക്സ്പ്രസ്', en: 'KERALA STATE TRANSPORT NETWORK', accent: '#fef08a', bg: '#991b1b' },
      { local: 'മലബാർ തനി രുചി', en: 'AUTHENTIC MALABAR CUISINE', accent: '#fb923c', bg: '#451a03' },
    ],
    busDestinations: [
      ['നിലമ്പൂർ', 'NILAMBUR'],
      ['കാളികാവ് സർക്കിൾ', 'KALIKAVU CIRCLE'],
      ['പൂക്കോട്ടുംപാടം', 'POOKKOTTUMPADAM'],
      ['വണ്ടൂർ', 'WANDOOR'],
      ['അമരമ്പലം', 'AMARAMPALAM'],
      ['മഞ്ചേരി', 'MANJERI'],
    ],
    signTranslations: {
      schoolZone: 'സ്കൂൾ സോൺ · SCHOOL ZONE · 30 KM/H',
      petrolPump: 'പെട്രോൾ പമ്പ് · 24H PETROL PUMP',
      policeStation: 'പോലീസ് സ്റ്റേഷൻ · POLICE STATION',
      tollPlaza: 'ടോൾ പ്ലാസ · VALLEY TOLL',
      yourHome: 'നിങ്ങളുടെ വീട് · YOUR HOME',
      welcome: 'പൂക്കോട്ടുംപാടത്തേക്ക് സ്വാഗതം',
      speedLimit: 'വേഗപരിധി · SPEED',
      busStop: 'ബസ് സ്റ്റോപ്പ് · BUS STOP',
    },
    theme: {
      skyTint: 0x9ec8dc,
      fogColor: 0xc2d4cc,
      fogDensity: 0.0009,
      sunColor: 0xffe6c0,
      sunIntensity: 3.1,
      palmRatio: 1.0,
      waterColor: 0x1a5a58,
      themeColor: '#10b981',
    },
  },

  kozhikkode: {
    id: 'kozhikkode',
    name: 'Kozhikkode',
    localName: 'കോഴിക്കോട്',
    country: 'India',
    regionLabel: 'Calicut · Malabar Coast · Kerala',
    category: 'Kerala',
    center: { lat: 11.2588, lon: 75.7804 },
    bbox: [11.244, 75.765, 11.274, 75.796],
    worldScale: 0.72,
    trafficSide: 'left',
    language: { code: 'ml', label: 'Malayalam · മലയാളം', scriptName: 'Malayalam' },
    plate: { prefix: 'KL 11', bg: '#f5f5f4', fg: '#111827', bandBg: '#1d4ed8' },
    traditionalOutfit: {
      label: 'Malabar Mundu & Kurta',
      hat: 'none',
      hatColor: '#f8fafc',
      shirtStyle: 'kurta',
      shirtColor: '#fef3c7',
      overcoat: 'none',
      overcoatColor: '#1e3a5f',
      pantsStyle: 'mundu',
      pantsColor: '#f8fafc',
      shoeColor: '#78350f',
    },
    trafficMix: [
      ['auto', 15],
      ['motorcycle', 13],
      ['scooter', 12],
      ['hatchback', 14],
      ['sedan', 7],
      ['suv', 5],
      ['jeep', 3],
      ['ksrtc', 6],
      ['bus', 5],
    ],
    carParkingMix: [['hatchback', 5], ['sedan', 3], ['suv', 3], ['jeep', 2]],
    bikeParkingMix: [['motorcycle', 5], ['scooter', 5]],
    shops: [
      { local: 'കോഴിക്കോടൻ ഹൽവ', en: 'CALICUT HALWA HOUSE', category: 'SWEETS', bg: '#7c2d12', fg: '#fef08a' },
      { local: 'എസ്.എം സ്ട്രീറ്റ് സിൽക്സ്', en: 'SM STREET SILKS', category: 'TEXTILES', bg: '#831843', fg: '#fff' },
      { local: 'മാനഞ്ചിറ ബുക്ക് ഹൗസ്', en: 'MANANCHIRA BOOKS', category: 'BOOKS', bg: '#1e3a8a', fg: '#fff' },
      { local: 'പാരഗൺ ഹോട്ടൽ', en: 'PARAGON MALABAR', category: 'DINING', bg: '#991b1b', fg: '#fde68a' },
      { local: 'ബീച്ച് കഫേ കോർണർ', en: 'BEACH CAFE', category: 'CAFE', bg: '#0f766e', fg: '#fff' },
      { local: 'മലബാർ ഗോൾഡ്', en: 'MALABAR GOLD MART', category: 'JEWELLERY', bg: '#78350f', fg: '#facc15' },
      { local: 'കോഴിക്കോട് മെഡിക്കൽസ്', en: 'CALICUT PHARMACY', category: 'PHARMACY', bg: '#f8fafc', fg: '#065f46' },
      { local: 'ബേപ്പൂർ സ്പൈസ് മാർട്ട്', en: 'BEYPORE SPICES', category: 'MARKET', bg: '#14532d', fg: '#fff' },
      { local: 'വെസ്റ്റ് ഹിൽ ബേക്കറി', en: 'WEST HILL BAKERY', category: 'BAKERY', bg: '#b45309', fg: '#fff' },
      { local: 'തൊണ്ടയാട് ഇലക്ട്രോണിക്സ്', en: 'CALICUT MOBILES', category: 'TECH', bg: '#0f172a', fg: '#38bdf8' },
      { local: 'ഹൈലൈറ്റ് ഫാഷൻസ്', en: 'HILITE FASHIONS', category: 'APPAREL', bg: '#4c1d95', fg: '#fff' },
      { local: 'കല്ലായി ടിമ്പർ ട്രേഡ്', en: 'KALLAI TRADERS', category: 'TIMBER', bg: '#3f3f46', fg: '#fde047' },
      { local: 'നടക്കാവ് സൂപ്പർസ്റ്റോർ', en: 'NADAKKAVU MART', category: 'GROCERY', bg: '#065f46', fg: '#fff' },
      { local: 'മാവൂർ ഫുട്‌വെയർ', en: 'MAVOOR FOOTWEAR', category: 'SHOES', bg: '#1e293b', fg: '#fff' },
      { local: 'സീ വ്യൂ ഐസ്ക്രീം', en: 'BEACH ICE CREAM', category: 'DESSERT', bg: '#be185d', fg: '#fff' },
      { local: 'പാളയം ബാങ്ക്', en: 'PALAYAM CO-OP BANK', category: 'BANK', bg: '#1d4ed8', fg: '#fff' },
    ],
    hoardings: [
      { local: 'കോഴിക്കോട് ബീച്ച് · ലൈറ്റ്ഹൗസ്', en: 'CALICUT BEACH PROMENADE', accent: '#38bdf8', bg: '#0f172a' },
      { local: 'എസ്.എം സ്ട്രീറ്റ് ഷോപ്പിംഗ് ഫെസ്റ്റ്', en: 'SWEET MEAT STREET HERITAGE', accent: '#facc15', bg: '#7c2d12' },
      { local: 'ഹൈലൈറ്റ് മാൾ · കോഴിക്കോട്', en: 'HILITE CITY MALL CALICUT', accent: '#fb923c', bg: '#3b0764' },
      { local: 'മലബാർ ബിരിയാണി ഫെസ്റ്റിവൽ', en: 'TASTE OF KOZHIKODE', accent: '#fde047', bg: '#991b1b' },
      { local: 'മാനഞ്ചിറ സ്ക്വയർ', en: 'MANANCHIRA HERITAGE PARK', accent: '#34d399', bg: '#064e3b' },
      { local: 'കെ.എസ്.ആർ.ടി.സി കോഴിക്കോട്', en: 'CALICUT EXPRESS CORRIDOR', accent: '#fef08a', bg: '#7f1d1d' },
    ],
    busDestinations: [
      ['മാനഞ്ചിറ', 'MANANCHIRA'],
      ['ബീച്ച് റോഡ്', 'CALICUT BEACH'],
      ['മാവൂർ റോഡ്', 'MAVOOR ROAD'],
      ['തൊണ്ടയാട്', 'THONDAYAD'],
      ['നടക്കാവ്', 'NADAKKAVU'],
      ['കല്ലായി', 'KALLAI'],
    ],
    signTranslations: {
      schoolZone: 'സ്കൂൾ സോൺ · SCHOOL ZONE',
      petrolPump: 'പെട്രോൾ പമ്പ് · PETROL PUMP',
      policeStation: 'പോലീസ് സ്റ്റേഷൻ · TOWN POLICE',
      tollPlaza: 'ടോൾ പ്ലാസ · BYPASS TOLL',
      yourHome: 'നിങ്ങളുടെ വീട് · YOUR HOME',
      welcome: 'കോഴിക്കോട്ടേക്ക് സ്വാഗതം',
      speedLimit: 'വേഗപരിധി · SPEED',
      busStop: 'ബസ് സ്റ്റോപ്പ് · BUS STOP',
    },
    theme: {
      skyTint: 0xb0d0e0,
      fogColor: 0xcad3d2,
      fogDensity: 0.0011,
      sunColor: 0xffd59e,
      sunIntensity: 3.1,
      palmRatio: 1.0,
      waterColor: 0x104c68,
      themeColor: '#f97316',
    },
  },

  trivandrum: {
    id: 'trivandrum',
    name: 'Trivandrum',
    localName: 'തിരുവനന്തപുരം',
    country: 'India',
    regionLabel: 'Thiruvananthapuram · Kerala Capital',
    category: 'Kerala',
    center: { lat: 8.5065, lon: 76.9485 },
    bbox: [8.492, 76.933, 8.522, 76.964],
    worldScale: 0.72,
    trafficSide: 'left',
    language: { code: 'ml', label: 'Malayalam · മലയാളം', scriptName: 'Malayalam' },
    plate: { prefix: 'KL 01', bg: '#f5f5f4', fg: '#111827', bandBg: '#1d4ed8' },
    traditionalOutfit: {
      label: 'Travancore Mundu & Silk Shirt',
      hat: 'none',
      hatColor: '#f8fafc',
      shirtStyle: 'kurta',
      shirtColor: '#f8fafc',
      overcoat: 'none',
      overcoatColor: '#1e3a5f',
      pantsStyle: 'mundu',
      pantsColor: '#fefce8',
      shoeColor: '#78350f',
    },
    trafficMix: [
      ['auto', 14],
      ['motorcycle', 12],
      ['scooter', 12],
      ['hatchback', 14],
      ['sedan', 9],
      ['suv', 6],
      ['ksrtc', 7],
      ['bus', 5],
    ],
    carParkingMix: [['hatchback', 5], ['sedan', 4], ['suv', 3], ['jeep', 1]],
    bikeParkingMix: [['motorcycle', 5], ['scooter', 5]],
    shops: [
      { local: 'എം.ജി റോഡ് സിൽക്സ്', en: 'MG ROAD SILK EMPORIUM', category: 'SILKS', bg: '#701a75', fg: '#fde047' },
      { local: 'സ്റ്റാച്യു ബുക്ക് സെന്റർ', en: 'STATUE BOOK HOUSE', category: 'BOOKS', bg: '#1e3a8a', fg: '#fff' },
      { local: 'കിഴക്കേകോട്ട കോഫി', en: 'EAST FORT COFFEE HOUSE', category: 'CAFE', bg: '#7c2d12', fg: '#fef3c7' },
      { local: 'കവടിയാർ ഫാർമസി', en: 'KOWDIAR MEDICALS', category: 'PHARMACY', bg: '#f8fafc', fg: '#047857' },
      { local: 'ടെക്നോപാർക്ക് ഡിജിറ്റൽ', en: 'TECHNOPARK SYSTEMS', category: 'IT', bg: '#0f172a', fg: '#38bdf8' },
      { local: 'പട്ടം ബേക്കറി', en: 'PATTOM ROYAL BAKERY', category: 'BAKERY', bg: '#b45309', fg: '#fff' },
      { local: 'ഭീമ ജ്വല്ലേഴ്സ്', en: 'TRAVANCORE GOLD', category: 'GOLD', bg: '#78350f', fg: '#facc15' },
      { local: 'കഴക്കൂട്ടം സൂപ്പർമാർട്ട്', en: 'KAZHAKOOTAM MART', category: 'MARKET', bg: '#065f46', fg: '#fff' },
      { local: 'വെള്ളയമ്പലം ആർട്സ്', en: 'VELLAYAMBALAM ARTS', category: 'GALLERY', bg: '#334155', fg: '#fff' },
      { local: 'ശംഖുമുഖം സീഫുഡ്', en: 'COASTAL SEAFOOD GRILL', category: 'DINING', bg: '#0e7490', fg: '#fff' },
      { local: 'ട്രിവാൻഡ്രം ഫാഷൻ', en: 'CAPITAL FASHION HUB', category: 'APPAREL', bg: '#991b1b', fg: '#fff' },
      { local: 'ഹാൻഡ്‌ലൂം ഹൗസ്', en: 'BALARAMAPURAM LOOMS', category: 'WEAVE', bg: '#14532d', fg: '#fef08a' },
      { local: 'പാലസ് ഹോട്ടൽ', en: 'HERITAGE PALACE INN', category: 'HOTEL', bg: '#3b0764', fg: '#fff' },
      { local: 'സ്റ്റേറ്റ് ബാങ്ക് ശാഖ', en: 'TRAVANCORE BANK', category: 'BANK', bg: '#1d4ed8', fg: '#fff' },
      { local: 'മോഡൽ ഓട്ടോകെയർ', en: 'CAPITAL AUTO CARE', category: 'AUTO', bg: '#18181b', fg: '#facc15' },
      { local: 'അനന്തപുരി ആയുർവേദം', en: 'ANANTHAPURI AYURVEDA', category: 'CLINIC', bg: '#064e3b', fg: '#d1fae5' },
    ],
    hoardings: [
      { local: 'തിരുവനന്തപുരം · തലസ്ഥാന നഗരി', en: 'TRIVANDRUM · CAPITAL CITY', accent: '#facc15', bg: '#1e3a8a' },
      { local: 'ടെക്നോപാർക്ക് · കേരള ഐടി ഹബ്', en: 'TECHNOPARK INNOVATION HUB', accent: '#38bdf8', bg: '#0f172a' },
      { local: 'കോവളം & ശംഖുമുഖം ബീച്ച്', en: 'KOVALAM COASTAL PARADISE', accent: '#34d399', bg: '#064e3b' },
      { local: 'ലുലു മാൾ തിരുവനന്തപുരം', en: 'TRIVANDRUM GRAND MALL', accent: '#fb923c', bg: '#7f1d1d' },
      { local: 'ബാലരാമപുരം കൈത്തറി', en: 'ROYAL KASAVU HERITAGE', accent: '#fde047', bg: '#581c87' },
      { local: 'കെ.എസ്.ആർ.ടി.സി സിറ്റി സർക്കുലർ', en: 'CAPITAL CITY ELECTRIC BUS', accent: '#a7f3d0', bg: '#047857' },
    ],
    busDestinations: [
      ['കിഴക്കേകോട്ട', 'EAST FORT'],
      ['സ്റ്റാച്യു · എം.ജി റോഡ്', 'STATUE'],
      ['പട്ടം', 'PATTOM'],
      ['കവടിയാർ', 'KOWDIAR'],
      ['കഴക്കൂട്ടം', 'KAZHAKOOTAM'],
      ['ശംഖുമുഖം', 'SHANGUMUGHAM'],
    ],
    signTranslations: {
      schoolZone: 'സ്കൂൾ സോൺ · SCHOOL ZONE',
      petrolPump: 'പെട്രോൾ പമ്പ് · FUEL STATION',
      policeStation: 'സിറ്റി പോലീസ് · POLICE HQ',
      tollPlaza: 'ടോൾ പ്ലാസ · NH66 TOLL',
      yourHome: 'നിങ്ങളുടെ വീട് · YOUR HOME',
      welcome: 'തിരുവനന്തപുരത്തേക്ക് സ്വാഗതം',
      speedLimit: 'വേഗപരിധി · SPEED',
      busStop: 'ബസ് സ്റ്റോപ്പ് · BUS STOP',
    },
    theme: {
      skyTint: 0xa5c8de,
      fogColor: 0xc9d2d4,
      fogDensity: 0.0011,
      sunColor: 0xffdfaf,
      sunIntensity: 3.1,
      palmRatio: 0.9,
      waterColor: 0x124e66,
      themeColor: '#f59e0b',
    },
  },

  kochi: {
    id: 'kochi',
    name: 'Kochi',
    localName: 'കൊച്ചി',
    country: 'India',
    regionLabel: 'Ernakulam · Kerala',
    category: 'Kerala',
    center: { lat: 9.9816, lon: 76.2999 },
    bbox: [9.958, 76.278, 10.028, 76.335],
    worldScale: 0.55,
    trafficSide: 'left',
    language: { code: 'ml', label: 'Malayalam · മലയാളം', scriptName: 'Malayalam' },
    plate: { prefix: 'KL 07', bg: '#f5f5f4', fg: '#111827', bandBg: '#1d4ed8' },
    traditionalOutfit: {
      label: 'Kochi Mundu & Kurta',
      hat: 'none',
      hatColor: '#f8fafc',
      shirtStyle: 'kurta',
      shirtColor: '#f8fafc',
      overcoat: 'none',
      overcoatColor: '#1e3a5f',
      pantsStyle: 'mundu',
      pantsColor: '#f8fafc',
      shoeColor: '#18181b',
    },
    trafficMix: [
      ['auto', 14],
      ['motorcycle', 12],
      ['scooter', 12],
      ['hatchback', 14],
      ['sedan', 8],
      ['suv', 6],
      ['ksrtc', 6],
      ['bus', 6],
    ],
    carParkingMix: [['hatchback', 5], ['sedan', 3], ['suv', 3]],
    bikeParkingMix: [['motorcycle', 5], ['scooter', 5]],
    shops: [
      { local: 'ബോംബെ ഡൈയിംഗ് · ബോർഡ്', en: 'COCHIN TEXTILES', category: 'SILKS', bg: '#0e3c78', fg: '#fff' },
      { local: 'ഹോട്ട് ബ്രെഡ്സ് ബേക്കറി', en: 'HOT BREADS BAKERY', category: 'BAKERY', bg: '#f6f2ea', fg: '#1a1a1a' },
      { local: 'വൈറ്റില സൂപ്പർമാർക്കറ്റ്', en: 'VYTTILA SUPERMARKET', category: 'MARKET', bg: '#0c5c43', fg: '#fff' },
      { local: 'കല്യാൺ ജ്വല്ലേഴ്സ്', en: 'KOCHI JEWELLERS', category: 'GOLD', bg: '#4e1222', fg: '#f6d57a' },
      { local: 'പാരഗൺ · എറണാകുളം', en: 'KOCHI SPICE KITCHEN', category: 'FOOD', bg: '#7c2d12', fg: '#fde68a' },
      { local: 'മെട്രോ മെഡിക്കൽസ്', en: 'METRO PHARMACY', category: 'PHARMACY', bg: '#f8fafc', fg: '#0d7a3a' },
      { local: 'ഫോർട്ട് കൊച്ചി കഫേ', en: 'KOCHI ART CAFE', category: 'CAFE', bg: '#1e293b', fg: '#fbbf24' },
      { local: 'ബാനർജി മൊബൈൽ ഹബ്', en: 'BANERJI DIGITAL', category: 'TECH', bg: '#0f172a', fg: '#38bdf8' },
      { local: 'കലൂർ സ്പോർട്സ്', en: 'KALOOR SPORTS WORLD', category: 'SPORTS', bg: '#1d4ed8', fg: '#fff' },
      { local: 'ഇടപ്പള്ളി ഹൈപ്പർ', en: 'EDAPPALLY HYPERMART', category: 'RETAIL', bg: '#065f46', fg: '#fff' },
      { local: 'പാലാരിവട്ടം ബുക്ക്സ്', en: 'CITY BOOK HOUSE', category: 'BOOKS', bg: '#312e81', fg: '#fff' },
      { local: 'മരട് മോട്ടോഴ്സ്', en: 'MARADU AUTO PARTS', category: 'AUTO', bg: '#18181b', fg: '#facc15' },
      { local: 'കടവന്ത്ര ബേക്കേഴ്സ്', en: 'KADAVANTHRA BAKEHOUSE', category: 'BAKERY', bg: '#b45309', fg: '#fff' },
      { local: 'കൊച്ചി ഫെഡറൽ ബാങ്ക്', en: 'KERALA URBAN BANK', category: 'BANK', bg: '#0369a1', fg: '#fff' },
      { local: 'ലുലു ഫാഷൻ സ്റ്റോർ', en: 'LULU FASHION ANNEX', category: 'STYLE', bg: '#831843', fg: '#fff' },
      { local: 'ആസ്റ്റർ ക്ലിനിക്ക്', en: 'ERNAKULAM CLINIC', category: 'CLINIC', bg: '#064e3b', fg: '#d1fae5' },
    ],
    hoardings: [
      { local: 'കൊച്ചി മെട്രോ · എല്ലാവർക്കും', en: 'KOCHI METRO · VYTTILA TO ALUVA', accent: '#38bdf8', bg: '#0e7490' },
      { local: 'ലുലു മാൾ · ഇടപ്പള്ളി', en: 'LULU INTERNATIONAL MALL', accent: '#facc15', bg: '#991b1b' },
      { local: 'കലൂർ സ്റ്റേഡിയം · മഞ്ഞപ്പട', en: 'JLN STADIUM · KERALA BLASTERS', accent: '#facc15', bg: '#1e3a8a' },
      { local: 'കൊച്ചി വാട്ടർ മെട്രോ', en: 'KOCHI WATER METRO', accent: '#6ee7b7', bg: '#064e3b' },
      { local: 'ഫോറം കൊച്ചി · മരട്', en: 'FORUM KOCHI SHOPPING', accent: '#fb923c', bg: '#3b0764' },
      { local: 'എൻ.എച്ച് 66 ബൈപ്പാസ്', en: 'NH 66 EXPRESS CORRIDOR', accent: '#fef08a', bg: '#18181b' },
    ],
    busDestinations: [
      ['ആലുവ', 'ALUVA'],
      ['വൈറ്റില ഹബ്', 'VYTTILA HUB'],
      ['കലൂർ', 'KALOOR'],
      ['ഇടപ്പള്ളി', 'EDAPPALLY'],
      ['ഫോർട്ട് കൊച്ചി', 'FORT KOCHI'],
      ['കാക്കനാട്', 'KAKKANAD'],
    ],
    signTranslations: {
      schoolZone: 'സ്കൂൾ സോൺ · SCHOOL ZONE',
      petrolPump: 'പെട്രോൾ പമ്പ് · 24H PETROL',
      policeStation: 'പോലീസ് സ്റ്റേഷൻ · POLICE HQ',
      tollPlaza: 'ടോൾ പ്ലാസ · NH66 TOLL',
      yourHome: 'നിങ്ങളുടെ വീട് · YOUR HOME',
      welcome: 'കൊച്ചിയിലേക്ക് സ്വാഗതം',
      speedLimit: 'വേഗപരിധി · SPEED',
      busStop: 'ബസ് സ്റ്റോപ്പ് · BUS STOP',
    },
    theme: {
      skyTint: 0xa9c4d8,
      fogColor: 0xc3cdd0,
      fogDensity: 0.00115,
      sunColor: 0xffe2bd,
      sunIntensity: 3.0,
      palmRatio: 1.0,
      waterColor: 0x164a52,
      themeColor: '#0ea5e9',
    },
  },

  tokyo: {
    id: 'tokyo',
    name: 'Tokyo',
    localName: '東京 · 渋谷',
    country: 'Japan',
    regionLabel: 'Shibuya & Minato · Japan',
    category: 'International',
    center: { lat: 35.6595, lon: 139.7004 },
    bbox: [35.649, 139.687, 35.670, 139.714],
    worldScale: 0.85,
    trafficSide: 'left',
    language: { code: 'ja', label: 'Japanese · 日本語', scriptName: 'Japanese' },
    plate: { prefix: '品川 300', bg: '#f8fafc', fg: '#14532d', bandBg: '#166534' },
    traditionalOutfit: {
      label: 'Japanese Yukata / Kimono',
      hat: 'none',
      hatColor: '#1e293b',
      shirtStyle: 'kimono_top',
      shirtColor: '#1e3a5f',
      overcoat: 'none',
      overcoatColor: '#18181b',
      pantsStyle: 'hakama',
      pantsColor: '#111827',
      shoeColor: '#78350f',
    },
    trafficMix: [
      ['kei_car', 16],
      ['jdm_sedan', 14],
      ['jp_taxi', 13],
      ['commuter_van', 9],
      ['delivery_truck', 8],
      ['motorcycle', 7],
      ['scooter', 7],
    ],
    carParkingMix: [['kei_car', 5], ['jdm_sedan', 4], ['jp_taxi', 2], ['commuter_van', 2]],
    bikeParkingMix: [['scooter', 5], ['motorcycle', 4]],
    shops: [
      { local: '渋谷ラーメン横丁', en: 'SHIBUYA RAMEN BAR', category: 'RAMEN', bg: '#7f1d1d', fg: '#fef08a' },
      { local: 'セブン・マート24', en: 'SHIBUYA KONBINI 24H', category: '24H', bg: '#065f46', fg: '#fff' },
      { local: '秋葉原ゲーム館', en: 'TOKYO ARCADE CENTER', category: 'ARCADE', bg: '#3b0764', fg: '#f472b6' },
      { local: '銀座寿司本店', en: 'GINZA SUSHI HOUSE', category: 'SUSHI', bg: '#0f172a', fg: '#facc15' },
      { local: '原宿ファッション', en: 'HARAJUKU STREETWEAR', category: 'FASHION', bg: '#be185d', fg: '#fff' },
      { local: '渋谷カフェ珈琲', en: 'DOGENZAKA COFFEE', category: 'CAFE', bg: '#451a03', fg: '#fde68a' },
      { local: '港区ドラッグストア', en: 'MINATO PHARMACY', category: 'DRUGSTORE', bg: '#f8fafc', fg: '#1d4ed8' },
      { local: '東京カメラ本店', en: 'TOKYO CAMERA & OPTICS', category: 'TECH', bg: '#18181b', fg: '#38bdf8' },
      { local: '新宿ブックタワー', en: 'SHINJUKU MANGA & BOOKS', category: 'BOOKS', bg: '#1e3a8a', fg: '#fff' },
      { local: '居酒屋さくら', en: 'IZAKAYA SAKURA', category: 'BAR', bg: '#991b1b', fg: '#fff' },
      { local: '焼肉ドラゴン東京', en: 'TOKYO YAKINIKU GRILL', category: 'GRILL', bg: '#111827', fg: '#fb923c' },
      { local: '表参道ブティック', en: 'OMOTESANDO BOUTIQUE', category: 'LUXURY', bg: '#27272a', fg: '#e5e7eb' },
      { local: '渋谷カラオケ館', en: 'KARAOKE BOX 109', category: 'MUSIC', bg: '#4c1d95', fg: '#67e8f9' },
      { local: '東京メトロ売店', en: 'METRO STATION KIOSK', category: 'KIOSK', bg: '#0369a1', fg: '#fff' },
      { local: 'オートバックス渋谷', en: 'JDM TUNING GARAGE', category: 'AUTO', bg: '#b45309', fg: '#fff' },
      { local: '三井東京銀行', en: 'TOKYO METROPOLITAN BANK', category: 'BANK', bg: '#064e3b', fg: '#fff' },
    ],
    hoardings: [
      { local: '渋谷スクランブル交差点', en: 'SHIBUYA CROSSING · TOKYO', accent: '#38bdf8', bg: '#0f172a' },
      { local: '東京タワー展望台', en: 'TOKYO TOWER · MINATO WARD', accent: '#f87171', bg: '#450a0a' },
      { local: '原宿・表参道スタイル', en: 'HARAJUKU NEON COLLECTION', accent: '#f472b6', bg: '#3b0764' },
      { local: '首都高速道路 ETC', en: 'SHUTO EXPRESSWAY NETWORK', accent: '#facc15', bg: '#1e293b' },
      { local: '東京エレクトロニクス', en: 'NEXT-GEN ROBOTICS EXPO', accent: '#34d399', bg: '#064e3b' },
      { local: '銀座ラグジュアリー', en: 'GINZA SIX · TOKYO NIGHTS', accent: '#fde68a', bg: '#18181b' },
    ],
    busDestinations: [
      ['渋谷駅', 'SHIBUYA STN'],
      ['新宿西口', 'SHINJUKU'],
      ['東京タワー', 'TOKYO TOWER'],
      ['六本木ヒルズ', 'ROPPONGI'],
      ['銀座四丁目', 'GINZA'],
      ['お台場海浜', 'ODAIBA BAY'],
    ],
    signTranslations: {
      schoolZone: '通学路 · SCHOOL ZONE · 30',
      petrolPump: 'ガソリンスタンド · ENEOS 24H',
      policeStation: '交番 · KOBAN POLICE',
      tollPlaza: '料金所 · SHUTO ETC TOLL',
      yourHome: '自宅 · YOUR HOME',
      welcome: '東京へようこそ · WELCOME TO TOKYO',
      speedLimit: '制限速度 · SPEED',
      busStop: 'バス停 · BUS STOP',
    },
    theme: {
      skyTint: 0x9ac1de,
      fogColor: 0xbac7d6,
      fogDensity: 0.00105,
      sunColor: 0xffdfc4,
      sunIntensity: 3.0,
      palmRatio: 0.0,
      waterColor: 0x15415c,
      themeColor: '#ec4899',
    },
  },

  london: {
    id: 'london',
    name: 'London',
    localName: 'WESTMINSTER · UK',
    country: 'United Kingdom',
    regionLabel: 'Westminster & West End · UK',
    category: 'International',
    center: { lat: 51.5074, lon: -0.1278 },
    bbox: [51.497, -0.145, 51.518, -0.110],
    worldScale: 0.85,
    trafficSide: 'left',
    language: { code: 'en-GB', label: 'British English', scriptName: 'Latin' },
    plate: { prefix: 'LD24', bg: '#facc15', fg: '#111827', bandBg: '#1d4ed8' },
    traditionalOutfit: {
      label: 'Savile Row Coat & Tweed',
      hat: 'fedora',
      hatColor: '#1f2937',
      shirtStyle: 'polo',
      shirtColor: '#f1f5f9',
      overcoat: 'trench',
      overcoatColor: '#334155',
      pantsStyle: 'chinos',
      pantsColor: '#1e293b',
      shoeColor: '#18181b',
    },
    trafficMix: [
      ['double_decker', 10],
      ['black_cab', 15],
      ['eu_hatchback', 16],
      ['sedan', 10],
      ['suv', 7],
      ['commuter_van', 6],
      ['motorcycle', 5],
    ],
    carParkingMix: [['eu_hatchback', 5], ['black_cab', 3], ['sedan', 3], ['suv', 2]],
    bikeParkingMix: [['motorcycle', 4], ['scooter', 4]],
    shops: [
      { local: 'WESTMINSTER ARMS PUB', en: 'TRADITIONAL ALE HOUSE', category: 'PUB', bg: '#7f1d1d', fg: '#fde68a' },
      { local: 'OXFORD ST TAILORS', en: 'BESPOKE SUITS & TWEED', category: 'TAILOR', bg: '#1e293b', fg: '#fff' },
      { local: 'PICCADILLY TEA ROOM', en: 'AFTERNOON TEA & SCONES', category: 'TEA', bg: '#064e3b', fg: '#fef3c7' },
      { local: 'SOHO VINYL & RECORDS', en: 'LONDON MUSIC SHOP', category: 'MUSIC', bg: '#18181b', fg: '#facc15' },
      { local: 'THAMES FISH & CHIPS', en: 'CLASSIC BRITISH CHIPPY', category: 'DINER', bg: '#1e3a8a', fg: '#fff' },
      { local: 'BOOTS CHEMIST LONDON', en: 'HIGH ST PHARMACY', category: 'CHEMIST', bg: '#f8fafc', fg: '#1d4ed8' },
      { local: 'COVENT GARDEN BOOKS', en: 'THEATRE & RARE BOOKS', category: 'BOOKS', bg: '#451a03', fg: '#fde68a' },
      { local: 'TESCO EXPRESS SOHO', en: 'DAILY GROCERIES', category: 'MARKET', bg: '#1d4ed8', fg: '#fff' },
      { local: 'MAYFAIR ROASTERY', en: 'SPECIALTY ESPRESSO BAR', category: 'CAFE', bg: '#27272a', fg: '#fff' },
      { local: 'REGENT ST WATCHES', en: 'FINE TIMEPIECES', category: 'LUXURY', bg: '#0f172a', fg: '#fde047' },
      { local: 'CHELSEA SPORTS CLUB', en: 'FOOTBALL & APPAREL', category: 'SPORTS', bg: '#1e40af', fg: '#fff' },
      { local: 'FLEET STREET PRESS', en: 'LONDON NEWSAGENT', category: 'NEWS', bg: '#991b1b', fg: '#fff' },
      { local: 'BLOOMSBURY BAKERY', en: 'ARTISAN SOURDOUGH', category: 'BAKERY', bg: '#78350f', fg: '#fff' },
      { local: 'VICTORIA MOTORS UK', en: 'GARAGE & SERVICE', category: 'AUTO', bg: '#334155', fg: '#facc15' },
      { local: 'BANK OF WESTMINSTER', en: 'CITY BANKING', category: 'BANK', bg: '#064e3b', fg: '#fff' },
      { local: 'SOUTHBANK THEATRE', en: 'WEST END BOX OFFICE', category: 'STAGE', bg: '#581c87', fg: '#fde047' },
    ],
    hoardings: [
      { local: 'WEST END THEATRE SEASON', en: 'PICCADILLY · LEICESTER SQUARE', accent: '#facc15', bg: '#7f1d1d' },
      { local: 'VISIT WESTMINSTER ABBEY', en: 'BIG BEN & PARLIAMENT SQUARE', accent: '#38bdf8', bg: '#0f172a' },
      { local: 'TRANSPORT FOR LONDON', en: 'NIGHT BUS & UNDERGROUND', accent: '#f87171', bg: '#1e3a8a' },
      { local: 'OXFORD CIRCUS FLAGSHIP', en: 'AUTUMN COLLECTION LONDON', accent: '#fde68a', bg: '#18181b' },
      { local: 'THAMES CLIPPER PIER', en: 'WATERLOO TO GREENWICH', accent: '#34d399', bg: '#064e3b' },
      { local: 'LONDON ULEZ CLEAN AIR', en: 'WESTMINSTER CONGESTION ZONE', accent: '#93c5fd', bg: '#1e293b' },
    ],
    busDestinations: [
      ['TRAFALGAR SQ', 'WESTMINSTER'],
      ['PICCADILLY', 'OXFORD CIRCUS'],
      ['WATERLOO STN', 'SOUTHBANK'],
      ['KENSINGTON', 'HYDE PARK'],
      ['COVENT GARDEN', 'THE STRAND'],
      ['KING’S CROSS', 'BLOOMSBURY'],
    ],
    signTranslations: {
      schoolZone: 'SCHOOL ZONE · 20 MPH · WESTMINSTER',
      petrolPump: 'PETROL STATION · 24H FUEL',
      policeStation: 'METROPOLITAN POLICE · SCOTLAND YARD',
      tollPlaza: 'CONGESTION CHARGE GATE',
      yourHome: 'YOUR LONDON RESIDENCE',
      welcome: 'WELCOME TO LONDON · WESTMINSTER',
      speedLimit: 'SPEED LIMIT',
      busStop: 'LONDON BUSES · STOP',
    },
    theme: {
      skyTint: 0x9bb0bf,
      fogColor: 0xb7c2c8,
      fogDensity: 0.00135,
      sunColor: 0xffe8cc,
      sunIntensity: 2.7,
      palmRatio: 0.0,
      waterColor: 0x1e3c47,
      themeColor: '#ef4444',
    },
  },

  newyork: {
    id: 'newyork',
    name: 'New York',
    localName: 'MANHATTAN · NYC',
    country: 'United States',
    regionLabel: 'Midtown & Times Square · USA',
    category: 'International',
    center: { lat: 40.758, lon: -73.9855 },
    bbox: [40.747, -74.000, 40.769, -73.971],
    worldScale: 0.85,
    trafficSide: 'right',
    language: { code: 'en-US', label: 'US English', scriptName: 'Latin' },
    plate: { prefix: 'NYC', bg: '#fbbf24', fg: '#1e3a8a', bandBg: '#1e3a8a' },
    traditionalOutfit: {
      label: 'NYC Street Bomber & Shades',
      hat: 'cap',
      hatColor: '#1e3a8a',
      shirtStyle: 'hoodie',
      shirtColor: '#e2e8f0',
      overcoat: 'bomber',
      overcoatColor: '#18181b',
      pantsStyle: 'jeans',
      pantsColor: '#1e293b',
      shoeColor: '#f8fafc',
    },
    trafficMix: [
      ['nyc_taxi', 18],
      ['muscle_car', 11],
      ['suv', 14],
      ['sedan', 11],
      ['nyc_bus', 7],
      ['delivery_truck', 7],
      ['motorcycle', 4],
    ],
    carParkingMix: [['suv', 4], ['muscle_car', 4], ['sedan', 4], ['nyc_taxi', 3]],
    bikeParkingMix: [['motorcycle', 5], ['scooter', 3]],
    shops: [
      { local: 'TIMES SQ PIZZA SLICE', en: 'NEW YORK STYLE 99¢', category: 'PIZZA', bg: '#991b1b', fg: '#fde047' },
      { local: 'MIDTOWN DELI & GRILL', en: '24/7 BODEGA MARKET', category: 'DELI', bg: '#065f46', fg: '#fff' },
      { local: 'BROADWAY BAGEL CO.', en: 'FRESH BAGELS & COFFEE', category: 'BAKERY', bg: '#78350f', fg: '#fef3c7' },
      { local: '5TH AVE SNEAKER LAB', en: 'LIMITED KICKS & STREET', category: 'STREET', bg: '#0f172a', fg: '#38bdf8' },
      { local: 'MANHATTAN PHARMACY', en: '24H DRUGSTORE', category: 'PHARMACY', bg: '#f8fafc', fg: '#dc2626' },
      { local: 'SOHO VINYL & COMICS', en: 'RECORDS & GRAPHIC NOVELS', category: 'COMICS', bg: '#3b0764', fg: '#facc15' },
      { local: 'HUDSON STEAKHOUSE', en: 'PRIME GRILL MANHATTAN', category: 'DINING', bg: '#27272a', fg: '#fde68a' },
      { local: 'CHELSEA ESPRESSO BAR', en: 'ROASTERS & PASTRY', category: 'CAFE', bg: '#451a03', fg: '#fff' },
      { local: 'LEXINGTON LIQUOR & WINE', en: 'SPIRITS & CELLAR', category: 'MARKET', bg: '#4c1d95', fg: '#fff' },
      { local: 'BROADWAY TICKET BOOTH', en: 'TONIGHT SHOWS', category: 'THEATER', bg: '#be185d', fg: '#fde047' },
      { local: 'WALL ST FINANCIAL', en: 'EMPIRE TRUST BANK', category: 'BANK', bg: '#1e3a8a', fg: '#fff' },
      { local: 'CENTRAL PARK CYCLES', en: 'BIKE & SCOOTER RENTALS', category: 'CYCLES', bg: '#047857', fg: '#fff' },
      { local: 'HELLS KITCHEN DINER', en: '24H CLASSIC PANCAKES', category: 'DINER', bg: '#1d4ed8', fg: '#fef08a' },
      { local: 'B&H PRO ELECTRONICS', en: 'CAMERAS & STUDIO GEAR', category: 'TECH', bg: '#18181b', fg: '#fff' },
      { local: 'WEST SIDE GARAGE', en: 'TUNING & TIRES', category: 'AUTO', bg: '#b45309', fg: '#fff' },
      { local: 'EMPIRE BARBERSHOP', en: 'MIDTOWN CUTS', category: 'BARBER', bg: '#7f1d1d', fg: '#fff' },
    ],
    hoardings: [
      { local: 'TIMES SQUARE LIVE', en: 'THE CROSSROADS OF THE WORLD', accent: '#38bdf8', bg: '#0f172a' },
      { local: 'BROADWAY MUSICALS', en: 'SHOWTIME 8 PM · 42ND STREET', accent: '#f472b6', bg: '#581c87' },
      { local: 'NYC YELLOW MEDALLION', en: 'HAIL A CAB ANYWHERE IN MANHATTAN', accent: '#facc15', bg: '#18181b' },
      { local: 'EMPIRE OBSERVATORY', en: '5TH AVE SKYLINE VIEWS', accent: '#fde68a', bg: '#1e3a8a' },
      { local: 'MTA TRANSIT EXPRESS', en: 'DOWNTOWN · MIDTOWN · HARLEM', accent: '#60a5fa', bg: '#172554' },
      { local: 'CENTRAL PARK CONSERVANCY', en: 'MANHATTAN GREEN OASIS', accent: '#34d399', bg: '#064e3b' },
    ],
    busDestinations: [
      ['TIMES SQUARE', '42ND STREET'],
      ['CENTRAL PARK', 'COLUMBUS CIR'],
      ['WALL STREET', 'SOUTH FERRY'],
      ['GRAND CENTRAL', 'LEXINGTON'],
      ['HUDSON YARDS', 'WEST SIDE'],
      ['SOHO · CANAL', 'DOWNTOWN'],
    ],
    signTranslations: {
      schoolZone: 'SCHOOL ZONE · 20 MPH · PHOTO ENFORCED',
      petrolPump: 'GAS STATION · 24H UNLEADED',
      policeStation: 'NYPD PRECINCT · KEEP CLEAR',
      tollPlaza: 'EZ-PASS BRIDGE & TUNNEL TOLL',
      yourHome: 'YOUR NYC APARTMENT',
      welcome: 'WELCOME TO NEW YORK CITY',
      speedLimit: 'NYC SPEED LIMIT',
      busStop: 'MTA NYC BUS STOP',
    },
    theme: {
      skyTint: 0x8fb6d8,
      fogColor: 0xb7c6d4,
      fogDensity: 0.00115,
      sunColor: 0xffe4c4,
      sunIntensity: 2.9,
      palmRatio: 0.0,
      waterColor: 0x1a3f54,
      themeColor: '#3b82f6',
    },
  },

  dubai: {
    id: 'dubai',
    name: 'Dubai',
    localName: 'دبي · وسط المدينة',
    country: 'UAE',
    regionLabel: 'Downtown & Marina · UAE',
    category: 'International',
    center: { lat: 25.1972, lon: 55.2744 },
    bbox: [25.184, 55.258, 25.210, 55.291],
    worldScale: 0.85,
    trafficSide: 'right',
    language: { code: 'ar', label: 'Arabic · العربية', scriptName: 'Arabic', rtl: true },
    plate: { prefix: 'DXB A', bg: '#f8fafc', fg: '#111827', bandBg: '#dc2626' },
    traditionalOutfit: {
      label: 'Emirati Kandura & Ghutra',
      hat: 'ghutra',
      hatColor: '#f8fafc',
      shirtStyle: 'kandura_top',
      shirtColor: '#f8fafc',
      overcoat: 'none',
      overcoatColor: '#1e3a5f',
      pantsStyle: 'kandura_robe',
      pantsColor: '#f8fafc',
      shoeColor: '#78350f',
    },
    trafficMix: [
      ['supercar', 14],
      ['desert_4x4', 15],
      ['rta_taxi', 14],
      ['sedan', 12],
      ['suv', 10],
      ['delivery_truck', 5],
      ['motorcycle', 4],
    ],
    carParkingMix: [['supercar', 5], ['desert_4x4', 5], ['suv', 3], ['rta_taxi', 2]],
    bikeParkingMix: [['motorcycle', 5], ['scooter', 3]],
    shops: [
      { local: 'سوق الذهب دبي', en: 'DUBAI GOLD SOUK', category: 'GOLD', bg: '#78350f', fg: '#facc15' },
      { local: 'مقهى المجلس العربي', en: 'AL MAJLIS ARABIC CAFE', category: 'CAFE', bg: '#064e3b', fg: '#fef3c7' },
      { local: 'معرض سيارات الخليجي', en: 'EXOTIC MOTORS DUBAI', category: 'MOTORS', bg: '#0f172a', fg: '#facc15' },
      { local: 'سوبرماركت المرسى', en: 'MARINA HYPERMARKET', category: 'MARKET', bg: '#0c5c43', fg: '#fff' },
      { local: 'عطور العود الملكي', en: 'ROYAL OUD PERFUMES', category: 'OUD', bg: '#4c1d95', fg: '#fde047' },
      { local: 'مطعم برج النخيل', en: 'PALM SKY DINING', category: 'DINING', bg: '#991b1b', fg: '#fff' },
      { local: 'صيدلية الإمارات', en: 'EMIRATES PHARMACY 24H', category: 'PHARMACY', bg: '#f8fafc', fg: '#047857' },
      { local: 'دار الأزياء الخليجية', en: 'DOWNTOWN BOUTIQUE', category: 'FASHION', bg: '#18181b', fg: '#f8fafc' },
      { local: 'مركز دبي للإلكترونيات', en: 'DIFC TECH STORE', category: 'TECH', bg: '#1e3a8a', fg: '#38bdf8' },
      { local: 'حلويات الشام دبي', en: 'LEVANT SWEETS & DATES', category: 'SWEETS', bg: '#92400e', fg: '#fef08a' },
      { local: 'بنك دبي الوطني', en: 'EMIRATES UNION BANK', category: 'BANK', bg: '#0369a1', fg: '#fff' },
      { local: 'فندق برج العربان', en: 'DOWNTOWN PALACE HOTEL', category: 'HOTEL', bg: '#701a75', fg: '#fde047' },
      { local: 'كراج الشيخ زايد', en: 'SUPERCAR DETAILING', category: 'AUTO', bg: '#1e293b', fg: '#fbbf24' },
      { local: 'مكتبة جميرا', en: 'JUMEIRAH BOOKSHOP', category: 'BOOKS', bg: '#14532d', fg: '#fff' },
      { local: 'نادي المرسى الرياضي', en: 'MARINA YACHT CLUB', category: 'CLUB', bg: '#0e7490', fg: '#fff' },
      { local: 'عيادة الخليج', en: 'GULF MEDICAL CLINIC', category: 'CLINIC', bg: '#f1f5f9', fg: '#0f172a' },
    ],
    hoardings: [
      { local: 'وسط مدينة دبي · برج خليفة', en: 'DOWNTOWN DUBAI · SKYLINE DISTRICT', accent: '#facc15', bg: '#0f172a' },
      { local: 'طريق الشيخ زايد E11', en: 'SHEIKH ZAYED ROAD CORRIDOR', accent: '#38bdf8', bg: '#1e293b' },
      { local: 'نخلة جميرا · مرسى دبي', en: 'PALM JUMEIRAH & MARINA WALK', accent: '#fbbf24', bg: '#451a03' },
      { local: 'مهرجان دبي للتسوق', en: 'DUBAI SHOPPING FESTIVAL', accent: '#f472b6', bg: '#581c87' },
      { local: 'هيئة الطرق والمواصلات', en: 'DUBAI RTA · SALIK EXPRESS', accent: '#ef4444', bg: '#18181b' },
      { local: 'مركز دبي المالي العالمي', en: 'DIFC GLOBAL FINANCE HUB', accent: '#34d399', bg: '#064e3b' },
    ],
    busDestinations: [
      ['وسط المدينة', 'DOWNTOWN BURJ'],
      ['مرسى دبي', 'DUBAI MARINA'],
      ['نخلة جميرا', 'PALM JUMEIRAH'],
      ['مركز دبي المالي', 'DIFC'],
      ['برواز دبي', 'DUBAI FRAME'],
      ['البرشاء', 'AL BARSHA'],
    ],
    signTranslations: {
      schoolZone: 'منطقة مدارس · SCHOOL ZONE · 30',
      petrolPump: 'محطة وقود إينوك · ENOC 24H',
      policeStation: 'شرطة دبي · DUBAI POLICE HQ',
      tollPlaza: 'بوابة سالك · SALIK TOLL GATE',
      yourHome: 'منزلك · YOUR DUBAI VILLA',
      welcome: 'أهلاً بكم في دبي · WELCOME TO DUBAI',
      speedLimit: 'السرعة القصوى · MAX',
      busStop: 'موقف حافلات دبي · RTA BUS',
    },
    theme: {
      skyTint: 0xd8c39b,
      fogColor: 0xdecbb0,
      fogDensity: 0.001,
      sunColor: 0xffcf88,
      sunIntensity: 3.3,
      palmRatio: 0.85,
      waterColor: 0x0e6e7d,
      themeColor: '#eab308',
    },
  },
};

export function getCityConfig(cityId: string): CityConfig {
  return CITY_CONFIGS[cityId] || CITY_CONFIGS.kochi;
}

export function latLonToWorld(cityId: string, lat: number, lon: number): { x: number; z: number } {
  const cfg = getCityConfig(cityId);
  const cosLat = Math.cos((cfg.center.lat * Math.PI) / 180);
  const x = (lon - cfg.center.lon) * cosLat * 111320 * cfg.worldScale;
  const z = -(lat - cfg.center.lat) * 111320 * cfg.worldScale;
  return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 };
}

export function worldToLatLon(cityId: string, x: number, z: number): { lat: number; lon: number } {
  const cfg = getCityConfig(cityId);
  const cosLat = Math.cos((cfg.center.lat * Math.PI) / 180) || 1;
  const lat = cfg.center.lat - z / (111320 * cfg.worldScale);
  const lon = cfg.center.lon + x / (111320 * cosLat * cfg.worldScale);
  return {
    lat: Math.round(lat * 100000) / 100000,
    lon: Math.round(lon * 100000) / 100000,
  };
}

export function encodeCustomHomeId(lat: number, lon: number): string {
  return `custom:${lat.toFixed(5)},${lon.toFixed(5)}`;
}

export function parseCustomHomeId(homeId: string, cityId: string): { lat: number; lon: number; x: number; z: number } | null {
  if (!homeId || !homeId.startsWith('custom:')) return null;
  const parts = homeId.slice(7).split(',');
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const { x, z } = latLonToWorld(cityId, lat, lon);
  return { lat, lon, x, z };
}
