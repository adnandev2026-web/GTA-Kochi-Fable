export type DeviceMode = 'mobile' | 'laptop' | 'desktop';

export interface CharacterAppearance {
  skinTone: string;
  faceStyle: 'classic' | 'focused' | 'scarred' | 'sunglasses' | 'aviators';
  hat: 'none' | 'cap' | 'beanie' | 'fedora' | 'helmet';
  hatColor: string;
  mustache: 'none' | 'handlebar' | 'chevron' | 'thin';
  beard: 'none' | 'stubble' | 'goatee' | 'full';
  facialHairColor: string;
  shirtStyle: 'tshirt' | 'polo' | 'hoodie' | 'kurta';
  shirtColor: string;
  overcoat: 'none' | 'leather' | 'trench' | 'bomber' | 'denim';
  overcoatColor: string;
  pantsStyle: 'jeans' | 'cargo' | 'chinos' | 'track';
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
    description: 'Agile city commuter great for cutting through narrow alleys.',
  },
  {
    id: 'auto',
    name: 'Kerala Auto Rickshaw',
    category: 'Three-Wheeler',
    price: 0,
    starter: true,
    topSpeedKmh: 63,
    color: '#141414',
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
    description: 'High-torque street bike with sharp lean cornering.',
  },
  {
    id: 'sedan',
    name: 'Executive City Sedan',
    category: 'Car',
    price: 1400,
    starter: false,
    topSpeedKmh: 162,
    color: '#1f3f78',
    description: 'Balanced highway cruiser with smooth high-speed stability.',
  },
  {
    id: 'suv',
    name: 'Highlander 4x4 SUV',
    category: 'Sports',
    price: 2600,
    starter: false,
    topSpeedKmh: 155,
    color: '#2f6f78',
    description: 'Heavy-duty urban SUV ready for highways, flyovers, and hill roads.',
  },
  {
    id: 'bus',
    name: 'Express City Coach',
    category: 'Heavy',
    price: 3400,
    starter: false,
    topSpeedKmh: 97,
    color: '#2a63b8',
    description: 'Full-length passenger coach with commanding presence.',
  },
  {
    id: 'ksrtc',
    name: 'KSRTC Super Fast',
    category: 'Heavy',
    price: 4200,
    starter: false,
    topSpeedKmh: 90,
    color: '#b91c1c',
    description: 'Legendary red-and-white Kerala state transport flagship.',
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
  highlights: string[];
  homes: CityHomePlot[];
}

export const CITIES_CATALOG: CitySummary[] = [
  {
    id: 'kochi',
    name: 'Kochi',
    regionLabel: 'Ernakulam · Kerala',
    country: 'India',
    category: 'Kerala',
    tagline: 'NH66 Bypass, Kochi Metro, Vyttila Hub, LuLu Mall & Backwaters',
    themeColor: '#0ea5e9',
    highlights: ['LuLu Mall & JLN Stadium', '2 Schools & 3 Petrol Pumps', '3 Police Stations & 2 Toll Plazas'],
    homes: [
      { id: 'kochi_kundannoor', name: 'Kundannoor Waterfront Villa', district: 'Kundannoor', x: 205, z: 790, heading: 0.22, style: 'Tropical Modern Villa' },
      { id: 'kochi_vyttila', name: 'Vyttila Residency', district: 'Vyttila', x: -170, z: -120, heading: 1.57, style: 'Metro Courtyard Home' },
      { id: 'kochi_palarivattom', name: 'Palarivattom Bungalow', district: 'Palarivattom', x: -350, z: -810, heading: 0.0, style: 'Terracotta Roof Home' },
      { id: 'kochi_edappally', name: 'Edappally Garden House', district: 'Edappally', x: -450, z: -1490, heading: -1.57, style: 'Duplex Corner House' },
    ],
  },
  {
    id: 'pookkottumpadam',
    name: 'Pookkottumpadam',
    regionLabel: 'Malappuram · Kerala',
    country: 'India',
    category: 'Kerala',
    tagline: 'Lush Nilambur foothills, town bazaar, schools, riverside bridges & spice estates',
    themeColor: '#10b981',
    highlights: ['Pookkottumpadam Town Square', 'GHSS School & Hill Estate', '2 Petrol Pumps, Police Station & Toll'],
    homes: [
      { id: 'pkp_bazaar', name: 'Pookkottumpadam Town Villa', district: 'Town Centre', x: 52, z: 68, heading: 0, style: 'Kerala Laterite Home' },
      { id: 'pkp_hill', name: 'Nilambur Road Estate House', district: 'Hillside', x: -240, z: -210, heading: 1.57, style: 'Hillcrest Bungalow' },
      { id: 'pkp_river', name: 'Chaliyar Creek Cottage', district: 'Riverside', x: 245, z: -250, heading: 3.14, style: 'Veranda Courtyard Home' },
    ],
  },
  {
    id: 'trivandrum',
    name: 'Trivandrum',
    regionLabel: 'Thiruvananthapuram · Kerala',
    country: 'India',
    category: 'Kerala',
    tagline: 'MG Road Secretariat, Technopark corridor, Kovalam coastal drive & heritage towers',
    themeColor: '#f59e0b',
    highlights: ['Secretariat & Technopark', 'Model School & Petrol Pumps', 'City Police HQ & Bypass Toll'],
    homes: [
      { id: 'tvm_kowdiar', name: 'Kowdiar Palace Avenue Home', district: 'Kowdiar', x: -75, z: -260, heading: 0, style: 'Heritage Mansion' },
      { id: 'tvm_statue', name: 'Statue Junction Flat', district: 'MG Road', x: 180, z: 48, heading: -1.57, style: 'Urban Apartment' },
      { id: 'tvm_kovalam', name: 'Kovalam Cliff Villa', district: 'Coastal Strip', x: -255, z: 265, heading: 1.57, style: 'Sea-View Villa' },
    ],
  },
  {
    id: 'kozhikkode',
    name: 'Kozhikkode',
    regionLabel: 'Calicut · Kerala',
    country: 'India',
    category: 'Kerala',
    tagline: 'Kozhikode Beach Lighthouse, SM Street, Mananchira Square & Malabar coastal highway',
    themeColor: '#f97316',
    highlights: ['Beach Lighthouse & Mananchira', 'Malabar High School & Pumps', 'Town Police & Highway Toll'],
    homes: [
      { id: 'clt_beach', name: 'Beach Road Seafront Home', district: 'Calicut Beach', x: -230, z: 68, heading: 1.57, style: 'Malabar Sea Villa' },
      { id: 'clt_mananchira', name: 'Mananchira Square House', district: 'Mananchira', x: 58, z: -175, heading: 3.14, style: 'Heritage Courtyard' },
      { id: 'clt_hilite', name: 'Bypass Horizon Residence', district: 'Thondayad', x: 265, z: 185, heading: -1.57, style: 'Modern Duplex' },
    ],
  },
  {
    id: 'newyork',
    name: 'New York',
    regionLabel: 'Manhattan · USA',
    country: 'United States',
    category: 'International',
    tagline: 'Midtown skyscrapers, Times Square billboards, Central Park edge & Hudson avenues',
    themeColor: '#3b82f6',
    highlights: ['Empire Spire & Times Plaza', 'NYPD Precinct & Midtown High', 'Gas Stations & Bridge Toll'],
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
    tagline: 'Sheikh Zayed 6-lane boulevard, towering silver spires, desert gold sunset & Salik tolls',
    themeColor: '#eab308',
    highlights: ['Burj Sky Spire & Fountain Plaza', 'International Academy & Stations', 'Dubai Police HQ & Salik Toll'],
    homes: [
      { id: 'dxb_marina', name: 'Marina Promenade Villa', district: 'Dubai Marina', x: -235, z: 180, heading: 1.57, style: 'White Marble Villa' },
      { id: 'dxb_downtown', name: 'Boulevard Executive Suite', district: 'Downtown', x: 180, z: -65, heading: -1.57, style: 'Luxury Townhouse' },
      { id: 'dxb_jumeirah', name: 'Jumeirah Palm Residence', district: 'Jumeirah', x: 65, z: 255, heading: 3.14, style: 'Desert Modern Villa' },
    ],
  },
  {
    id: 'london',
    name: 'London',
    regionLabel: 'Westminster · UK',
    country: 'United Kingdom',
    category: 'International',
    tagline: 'Clock Tower Westminster, red brick avenues, Thames embankment & congestion toll gates',
    themeColor: '#ef4444',
    highlights: ['Big Ben Clock Tower & Eye', 'Westminster School & Petrol', 'Scotland Yard & Toll Gate'],
    homes: [
      { id: 'lon_kensington', name: 'Kensington Mews House', district: 'Kensington', x: -220, z: -180, heading: 1.57, style: 'Georgian Townhouse' },
      { id: 'lon_soho', name: 'Westminster Terrace Flat', district: 'Westminster', x: 68, z: 75, heading: 0, style: 'Brick Rowhouse' },
      { id: 'lon_thames', name: 'Embankment Riverside Home', district: 'Southbank', x: 225, z: 215, heading: -1.57, style: 'Modern Loft' },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    regionLabel: 'Shibuya & Minato · Japan',
    country: 'Japan',
    category: 'International',
    tagline: 'Tokyo Red Lattice Tower, Shibuya neon crossing, elevated expressways & Koban stations',
    themeColor: '#ec4899',
    highlights: ['Tokyo Tower & Shibuya Crossing', 'Minato High School & ENEOS', 'Koban Police & Shuto Toll'],
    homes: [
      { id: 'tyo_shibuya', name: 'Shibuya Hillside Residence', district: 'Shibuya', x: -185, z: 180, heading: 0, style: 'Minimalist Concrete Home' },
      { id: 'tyo_roppongi', name: 'Minato Town House', district: 'Minato', x: 185, z: -65, heading: -1.57, style: 'Modern Timber Duplex' },
      { id: 'tyo_odaiba', name: 'Bayfront Crossing House', district: 'Minato Bay', x: 65, z: 255, heading: 3.14, style: 'Bayfront Villa' },
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
  ],
  palette: ['#18181b', '#1e3a5f', '#7f1d1d', '#14532d', '#78350f', '#4c1d95', '#e6e8eb', '#d97706', '#0f766e', '#374151'],
  hairColors: ['#181512', '#3b281c', '#6b4226', '#9a7b4f', '#9ca3af', '#e5e7eb'],
};

export const STARTER_VEHICLES = VEHICLE_CATALOG.filter((v) => v.starter).map((v) => v.id);
export const STARTING_MONEY = 5000;
