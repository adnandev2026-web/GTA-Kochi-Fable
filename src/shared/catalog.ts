export type DeviceMode = 'mobile' | 'laptop' | 'desktop';

export interface CharacterAppearance {
  skinTone: string;
  faceStyle: 'classic' | 'focused' | 'scarred' | 'sunglasses' | 'aviators';
  hat: 'none' | 'cap' | 'beanie' | 'fedora' | 'helmet' | 'ghutra' | 'kasa';
  hatColor: string;
  mustache: 'none' | 'handlebar' | 'chevron' | 'thin';
  beard: 'none' | 'stubble' | 'goatee' | 'full';
  facialHairColor: string;
  shirtStyle: 'tshirt' | 'polo' | 'hoodie' | 'kurta' | 'kimono_top' | 'kandura_top';
  shirtColor: string;
  overcoat: 'none' | 'leather' | 'trench' | 'bomber' | 'denim';
  overcoatColor: string;
  pantsStyle: 'jeans' | 'cargo' | 'chinos' | 'track' | 'mundu' | 'hakama' | 'kandura_robe';
  pantsColor: string;
  shoeColor: string;
}

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  skinTone: '#c68b59',
  faceStyle: 'classic',
  hat: 'cap',
  hatColor: '#1f2937',
  mustache: 'chevron',
  beard: 'stubble',
  facialHairColor: '#1e1b18',
  shirtStyle: 'tshirt',
  shirtColor: '#e6e8eb',
  overcoat: 'bomber',
  overcoatColor: '#1e3a5f',
  pantsStyle: 'jeans',
  pantsColor: '#253549',
  shoeColor: '#18181b',
};

export interface VehicleCatalogItem {
  id: string;
  name: string;
  category: 'Car' | 'Two-Wheeler' | 'Three-Wheeler' | 'Heavy' | 'Sports';
  price: number;
  starter: boolean;
  topSpeedKmh: number;
  color: string;
  regionTag?: string;
  description: string;
}

export const VEHICLE_CATALOG: VehicleCatalogItem[] = [
  {
    id: 'hatchback',
    name: 'Swift City Hatchback',
    category: 'Car',
    price: 0,
    starter: true,
    topSpeedKmh: 148,
    color: '#9a1414',
    regionTag: 'Global',
    description: 'Nimble street hatchback parked right in your home driveway.',
  },
  {
    id: 'scooter',
    name: 'Metro Zip Scooter',
    category: 'Two-Wheeler',
    price: 0,
    starter: true,
    topSpeedKmh: 90,
    color: '#c8a21a',
    regionTag: 'Kerala / Global',
    description: 'Agile city commuter great for cutting through narrow streets.',
  },
  {
    id: 'auto',
    name: 'Kerala Auto Rickshaw',
    category: 'Three-Wheeler',
    price: 0,
    starter: true,
    topSpeedKmh: 63,
    color: '#141414',
    regionTag: 'Kerala',
    description: 'Iconic black-and-yellow three-wheeler built for tight turns.',
  },
  {
    id: 'motorcycle',
    name: 'Street Interceptor 350',
    category: 'Two-Wheeler',
    price: 650,
    starter: false,
    topSpeedKmh: 137,
    color: '#16171a',
    regionTag: 'Global',
    description: 'High-torque street bike with sharp lean cornering.',
  },
  {
    id: 'jeep',
    name: 'Malabar Hill 4x4 Jeep',
    category: 'Sports',
    price: 950,
    starter: false,
    topSpeedKmh: 128,
    color: '#166534',
    regionTag: 'Kerala / Pookkottumpadam',
    description: 'Rugged estate jeep built for Nilambur – Kalikavu hill climbs.',
  },
  {
    id: 'kei_car',
    name: 'Tokyo Kei Boxster',
    category: 'Car',
    price: 1100,
    starter: false,
    topSpeedKmh: 122,
    color: '#e2e8f0',
    regionTag: 'Tokyo',
    description: 'Compact Japanese kei micro-wagon ideal for tight Shibuya alleys.',
  },
  {
    id: 'sedan',
    name: 'Executive City Sedan',
    category: 'Car',
    price: 1400,
    starter: false,
    topSpeedKmh: 162,
    color: '#1f3f78',
    regionTag: 'Global',
    description: 'Balanced highway cruiser with smooth high-speed stability.',
  },
  {
    id: 'jdm_sedan',
    name: 'Shibuya JDM Turbo',
    category: 'Sports',
    price: 2200,
    starter: false,
    topSpeedKmh: 196,
    color: '#f8fafc',
    regionTag: 'Tokyo',
    description: 'Twin-turbo Japanese street legend with aggressive rear wing.',
  },
  {
    id: 'black_cab',
    name: 'London Black Cab',
    category: 'Car',
    price: 1600,
    starter: false,
    topSpeedKmh: 138,
    color: '#111827',
    regionTag: 'London',
    description: 'Classic Westminster Hackney carriage with tight turning circle.',
  },
  {
    id: 'nyc_taxi',
    name: 'NYC Yellow Medallion Cab',
    category: 'Car',
    price: 1650,
    starter: false,
    topSpeedKmh: 158,
    color: '#facc15',
    regionTag: 'New York',
    description: 'Iconic Manhattan yellow taxi built to weave through 5th Ave.',
  },
  {
    id: 'muscle_car',
    name: 'Brooklyn V8 Muscle GT',
    category: 'Sports',
    price: 2900,
    starter: false,
    topSpeedKmh: 215,
    color: '#dc2626',
    regionTag: 'New York',
    description: 'Thundering American V8 coupe with racing stripes and blower.',
  },
  {
    id: 'suv',
    name: 'Highlander 4x4 SUV',
    category: 'Sports',
    price: 2600,
    starter: false,
    topSpeedKmh: 155,
    color: '#2f6f78',
    regionTag: 'Global',
    description: 'Heavy-duty urban SUV ready for highways, flyovers, and hill roads.',
  },
  {
    id: 'desert_4x4',
    name: 'Emirates Desert 4x4',
    category: 'Sports',
    price: 3200,
    starter: false,
    topSpeedKmh: 176,
    color: '#f8fafc',
    regionTag: 'Dubai',
    description: 'Full-size luxury Sheikh Zayed boulevard and dune conqueror.',
  },
  {
    id: 'supercar',
    name: 'Dubai Hyper-Wedge V12',
    category: 'Sports',
    price: 4800,
    starter: false,
    topSpeedKmh: 252,
    color: '#f59e0b',
    regionTag: 'Dubai',
    description: 'Low-slung mid-engine exotic engineered for extreme top speed.',
  },
  {
    id: 'bus',
    name: 'Express City Coach',
    category: 'Heavy',
    price: 3400,
    starter: false,
    topSpeedKmh: 97,
    color: '#2a63b8',
    regionTag: 'Global',
    description: 'Full-length passenger coach with commanding presence.',
  },
  {
    id: 'ksrtc',
    name: 'KSRTC Super Fast',
    category: 'Heavy',
    price: 3900,
    starter: false,
    topSpeedKmh: 90,
    color: '#b91c1c',
    regionTag: 'Kerala',
    description: 'Legendary red-and-white Kerala state transport flagship.',
  },
  {
    id: 'double_decker',
    name: 'London Double-Decker',
    category: 'Heavy',
    price: 4400,
    starter: false,
    topSpeedKmh: 84,
    color: '#dc2626',
    regionTag: 'London',
    description: 'Iconic red two-story Westminster bus towering above traffic.',
  },
];

export interface CityHomePlot {
  id: string;
  name: string;
  district: string;
  x: number;
  z: number;
  heading: number;
  style: string;
}

export interface CitySummary {
  id: string;
  name: string;
  regionLabel: string;
  country: string;
  category: 'Kerala' | 'International';
  tagline: string;
  themeColor: string;
  trafficSide: 'left' | 'right';
  languageLabel: string;
  traditionalLabel: string;
  highlights: string[];
  homes: CityHomePlot[];
}

export const CITIES_CATALOG: CitySummary[] = [
  {
    id: 'pookkottumpadam',
    name: 'Pookkottumpadam',
    regionLabel: 'Nilambur – Kalikavu Circle · Kerala',
    country: 'India',
    category: 'Kerala',
    tagline: 'Expansive real OSM corridor from Nilambur through Pookkottumpadam Town to Kalikavu Circle',
    themeColor: '#10b981',
    trafficSide: 'left',
    languageLabel: 'Malayalam + EN',
    traditionalLabel: 'Mundu & Kurta',
    highlights: ['Nilambur to Kalikavu Circle OSM Map', 'KSRTC, Autos, Jeeps & Bikes', 'Malayalam + English Signage'],
    homes: [
      { id: 'pkp_bazaar', name: 'Pookkottumpadam Town Villa', district: 'Pookkottumpadam', x: 52, z: 68, heading: 0, style: 'Kerala Laterite Home' },
      { id: 'pkp_nilambur', name: 'Nilambur Junction Estate', district: 'Nilambur', x: -560, z: -620, heading: 0.78, style: 'Teak Valley Bungalow' },
      { id: 'pkp_kalikavu', name: 'Kalikavu Circle Residence', district: 'Kalikavu Circle', x: 640, z: 620, heading: -2.35, style: 'Malabar Courtyard Home' },
    ],
  },
  {
    id: 'kozhikkode',
    name: 'Kozhikkode',
    regionLabel: 'Calicut · Kerala',
    country: 'India',
    category: 'Kerala',
    tagline: 'Kozhikode Beach, SM Street, Mananchira Square & Malabar coastal highway powered by OSM',
    themeColor: '#f97316',
    trafficSide: 'left',
    languageLabel: 'Malayalam + EN',
    traditionalLabel: 'Mundu & Kurta',
    highlights: ['Real OSM Roads & Beachfront', 'KSRTC, Autos & Scooters', 'Malayalam + English Boards'],
    homes: [
      { id: 'clt_beach', name: 'Beach Road Seafront Home', district: 'Calicut Beach', x: -230, z: 68, heading: 1.57, style: 'Malabar Sea Villa' },
      { id: 'clt_mananchira', name: 'Mananchira Square House', district: 'Mananchira', x: 58, z: -175, heading: 3.14, style: 'Heritage Courtyard' },
      { id: 'clt_hilite', name: 'Bypass Horizon Residence', district: 'Thondayad', x: 265, z: 185, heading: -1.57, style: 'Modern Duplex' },
    ],
  },
  {
    id: 'trivandrum',
    name: 'Trivandrum',
    regionLabel: 'Thiruvananthapuram · Kerala',
    country: 'India',
    category: 'Kerala',
    tagline: 'MG Road Secretariat, Kowdiar, Statue Junction & East Fort heritage corridor via OSM',
    themeColor: '#f59e0b',
    trafficSide: 'left',
    languageLabel: 'Malayalam + EN',
    traditionalLabel: 'Mundu & Silk Shirt',
    highlights: ['Secretariat & East Fort OSM', 'KSRTC, Autos & Commuters', 'Malayalam + English Signs'],
    homes: [
      { id: 'tvm_kowdiar', name: 'Kowdiar Palace Avenue Home', district: 'Kowdiar', x: -75, z: -260, heading: 0, style: 'Heritage Mansion' },
      { id: 'tvm_statue', name: 'Statue Junction Flat', district: 'MG Road', x: 180, z: 48, heading: -1.57, style: 'Urban Apartment' },
      { id: 'tvm_kovalam', name: 'Kovalam Cliff Villa', district: 'Coastal Strip', x: -255, z: 265, heading: 1.57, style: 'Sea-View Villa' },
    ],
  },
  {
    id: 'kochi',
    name: 'Kochi',
    regionLabel: 'Ernakulam · Kerala',
    country: 'India',
    category: 'Kerala',
    tagline: 'NH66 Bypass, Kochi Metro, Vyttila Hub, LuLu Mall & Kaloor Stadium',
    themeColor: '#0ea5e9',
    trafficSide: 'left',
    languageLabel: 'Malayalam + EN',
    traditionalLabel: 'Mundu & Kurta',
    highlights: ['LuLu Mall & JLN Stadium', 'Elevated Kochi Metro Rail', 'Malayalam + English Signage'],
    homes: [
      { id: 'kochi_kundannoor', name: 'Kundannoor Waterfront Villa', district: 'Kundannoor', x: 205, z: 790, heading: 0.22, style: 'Tropical Modern Villa' },
      { id: 'kochi_vyttila', name: 'Vyttila Residency', district: 'Vyttila', x: -170, z: -120, heading: 1.57, style: 'Metro Courtyard Home' },
      { id: 'kochi_palarivattom', name: 'Palarivattom Bungalow', district: 'Palarivattom', x: -350, z: -810, heading: 0.0, style: 'Terracotta Roof Home' },
      { id: 'kochi_edappally', name: 'Edappally Garden House', district: 'Edappally', x: -450, z: -1490, heading: -1.57, style: 'Duplex Corner House' },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    regionLabel: 'Shibuya & Minato · Japan',
    country: 'Japan',
    category: 'International',
    tagline: 'Shibuya Scramble, Tokyo Tower, real OSM Shibuya streets, Kei cars & JDM traffic',
    themeColor: '#ec4899',
    trafficSide: 'left',
    languageLabel: 'Japanese + EN',
    traditionalLabel: 'Kimono / Yukata',
    highlights: ['Real Shibuya OSM Streets', 'Kei Cars, JDM & Tokyo Taxis', '日本語 + English Neon Signs'],
    homes: [
      { id: 'tyo_shibuya', name: 'Shibuya Hillside Residence', district: 'Shibuya', x: -185, z: 180, heading: 0, style: 'Minimalist Concrete Home' },
      { id: 'tyo_roppongi', name: 'Minato Town House', district: 'Minato', x: 185, z: -65, heading: -1.57, style: 'Modern Timber Duplex' },
      { id: 'tyo_odaiba', name: 'Bayfront Crossing House', district: 'Minato Bay', x: 65, z: 255, heading: 3.14, style: 'Bayfront Villa' },
    ],
  },
  {
    id: 'london',
    name: 'London',
    regionLabel: 'Westminster · UK',
    country: 'United Kingdom',
    category: 'International',
    tagline: 'Big Ben Westminster, Trafalgar Square, red double-deckers & black cabs on real OSM roads',
    themeColor: '#ef4444',
    trafficSide: 'left',
    languageLabel: 'English (UK)',
    traditionalLabel: 'Savile Coat & Fedora',
    highlights: ['Real Westminster OSM Map', 'Double-Deckers & Black Cabs', 'UK Road & Shop Signage'],
    homes: [
      { id: 'lon_kensington', name: 'Kensington Mews House', district: 'Kensington', x: -220, z: -180, heading: 1.57, style: 'Georgian Townhouse' },
      { id: 'lon_soho', name: 'Westminster Terrace Flat', district: 'Westminster', x: 68, z: 75, heading: 0, style: 'Brick Rowhouse' },
      { id: 'lon_thames', name: 'Embankment Riverside Home', district: 'Southbank', x: 225, z: 215, heading: -1.57, style: 'Modern Loft' },
    ],
  },
  {
    id: 'newyork',
    name: 'New York',
    regionLabel: 'Manhattan · USA',
    country: 'United States',
    category: 'International',
    tagline: 'Times Square, 5th Ave, Broadway OSM grid, yellow cabs, MTA buses & right-hand traffic',
    themeColor: '#3b82f6',
    trafficSide: 'right',
    languageLabel: 'English (US)',
    traditionalLabel: 'NYC Bomber & Shades',
    highlights: ['Real Midtown Manhattan OSM', 'Yellow Cabs & Muscle Cars', 'Right-Hand US Traffic Rules'],
    homes: [
      { id: 'nyc_soho', name: 'SoHo Loft Brownstone', district: 'SoHo', x: -185, z: 220, heading: 0, style: 'Classic Brownstone' },
      { id: 'nyc_midtown', name: '5th Ave Penthouse Base', district: 'Midtown', x: 185, z: -65, heading: -1.57, style: 'Glass Townhouse' },
      { id: 'nyc_park', name: 'Central Park West Residence', district: 'Upper West', x: -75, z: -265, heading: 1.57, style: 'Parkside Terrace' },
    ],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    regionLabel: 'Downtown & Marina · UAE',
    country: 'UAE',
    category: 'International',
    tagline: 'Sheikh Zayed Road OSM, Burj Skyline, luxury supercars, desert 4x4s & Arabic+English signs',
    themeColor: '#eab308',
    trafficSide: 'right',
    languageLabel: 'Arabic + EN',
    traditionalLabel: 'Kandura & Ghutra',
    highlights: ['Real Downtown Dubai OSM', 'Supercars, 4x4s & RTA Taxis', 'العربية + English Signage'],
    homes: [
      { id: 'dxb_marina', name: 'Marina Promenade Villa', district: 'Dubai Marina', x: -235, z: 180, heading: 1.57, style: 'White Marble Villa' },
      { id: 'dxb_downtown', name: 'Boulevard Executive Suite', district: 'Downtown', x: 180, z: -65, heading: -1.57, style: 'Luxury Townhouse' },
      { id: 'dxb_jumeirah', name: 'Jumeirah Palm Residence', district: 'Jumeirah', x: 65, z: 255, heading: 3.14, style: 'Desert Modern Villa' },
    ],
  },
];

export const APPEARANCE_OPTIONS = {
  skinTones: [
    { label: 'Fair', value: '#f0c4a0' },
    { label: 'Warm Olive', value: '#d9a47c' },
    { label: 'Tan', value: '#c68b59' },
    { label: 'Brown', value: '#94613b' },
    { label: 'Deep Brown', value: '#5c3822' },
  ],
  faces: [
    { id: 'classic', label: 'Classic' },
    { id: 'focused', label: 'Focused' },
    { id: 'scarred', label: 'Battle Scar' },
    { id: 'sunglasses', label: 'Dark Shades' },
    { id: 'aviators', label: 'Gold Aviators' },
  ],
  hats: [
    { id: 'none', label: 'No Hat' },
    { id: 'cap', label: 'Street Cap' },
    { id: 'beanie', label: 'Beanie' },
    { id: 'fedora', label: 'Classic Fedora' },
    { id: 'helmet', label: 'Biker Helmet' },
    { id: 'ghutra', label: 'Ghutra & Agal' },
    { id: 'kasa', label: 'Straw Kasa' },
  ],
  mustaches: [
    { id: 'none', label: 'Clean' },
    { id: 'thin', label: 'Trimmed' },
    { id: 'chevron', label: 'Chevron' },
    { id: 'handlebar', label: 'Handlebar' },
  ],
  beards: [
    { id: 'none', label: 'Clean Shaven' },
    { id: 'stubble', label: 'Light Stubble' },
    { id: 'goatee', label: 'Goatee' },
    { id: 'full', label: 'Full Beard' },
  ],
  shirtStyles: [
    { id: 'tshirt', label: 'Crew T-Shirt' },
    { id: 'polo', label: 'Polo Collar' },
    { id: 'hoodie', label: 'Street Hoodie' },
    { id: 'kurta', label: 'Kerala Kurta' },
    { id: 'kimono_top', label: 'Kimono / Yukata' },
    { id: 'kandura_top', label: 'Kandura Tunic' },
  ],
  overcoats: [
    { id: 'none', label: 'No Overcoat' },
    { id: 'bomber', label: 'Bomber Jacket' },
    { id: 'leather', label: 'Leather Biker' },
    { id: 'trench', label: 'Long Trenchcoat' },
    { id: 'denim', label: 'Denim Jacket' },
  ],
  pantsStyles: [
    { id: 'jeans', label: 'Denim Jeans' },
    { id: 'cargo', label: 'Cargo Pants' },
    { id: 'chinos', label: 'Slim Chinos' },
    { id: 'track', label: 'Track Pants' },
    { id: 'mundu', label: 'Kerala Mundu' },
    { id: 'hakama', label: 'Japanese Hakama' },
    { id: 'kandura_robe', label: 'Kandura Lower' },
  ],
  palette: ['#18181b', '#1e3a5f', '#7f1d1d', '#14532d', '#78350f', '#4c1d95', '#e6e8eb', '#d97706', '#0f766e', '#374151'],
  hairColors: ['#181512', '#3b281c', '#6b4226', '#9a7b4f', '#9ca3af', '#e5e7eb'],
};

export const STARTER_VEHICLES = VEHICLE_CATALOG.filter((v) => v.starter).map((v) => v.id);
export const STARTING_MONEY = 5000;
