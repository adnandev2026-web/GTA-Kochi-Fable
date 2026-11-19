// Shared texture atlas for vehicles: city-localized license plates, bus destination boards,
// transit liveries, taxi roof signs, and delivery truck branding.

import { makeCanvas, canvasTexture, fitText, font, roundRect } from '../../utils/canvas.js';
import { RNG } from '../../utils/rng.js';
import { getCityConfig } from '../../config/cityConfigs.ts';

const SIZE = 2048;

const CITY_TRANSIT_BRANDS = {
  pookkottumpadam: {
    local: 'കെ.എസ്.ആർ.ടി.സി',
    en: 'KSRTC',
    service: 'MALABAR FAST PASSENGER',
    bg: '#9e0d0d',
    fg: '#f6e9b8',
    privateNames: ['WAYANAD QUEEN', 'NILAMBUR EXPRESS', 'CHALIYAR STAR', 'SREE KRISHNA', 'AL-AMEEN', 'MALABAR KING'],
    deliveryLocal: 'മലബാർ കാർഗോ',
    deliveryEn: 'KERALA EXPRESS CARGO',
  },
  kozhikkode: {
    local: 'കെ.എസ്.ആർ.ടി.സി',
    en: 'KSRTC',
    service: 'CALICUT CITY EXPRESS',
    bg: '#9e0d0d',
    fg: '#f6e9b8',
    privateNames: ['CALICUT QUEEN', 'MALABAR STAR', 'BEYPORE EXPRESS', 'ZAMORIN', 'AL-MANAR', 'SEA BREEZE'],
    deliveryLocal: 'കോഴിക്കോട് ലോജിസ്റ്റിക്സ്',
    deliveryEn: 'MALABAR PARCEL SERVICE',
  },
  trivandrum: {
    local: 'കെ.എസ്.ആർ.ടി.സി',
    en: 'KSRTC',
    service: 'CAPITAL SWIFT LINE',
    bg: '#9e0d0d',
    fg: '#f6e9b8',
    privateNames: ['ANANTHAPURI', 'TRAVANCORE STAR', 'KOVALAM QUEEN', 'PADMANABHA', 'CAPITAL LINE', 'ROYAL EXPRESS'],
    deliveryLocal: 'തിരുവനന്തപുരം കാർഗോ',
    deliveryEn: 'SOUTHERN LOGISTICS',
  },
  kochi: {
    local: 'കെ.എസ്.ആർ.ടി.സി',
    en: 'KSRTC',
    service: 'FAST PASSENGER',
    bg: '#9e0d0d',
    fg: '#f6e9b8',
    privateNames: ['ST. GEORGE', 'SREE KRISHNA', 'AL-AMEEN', 'KOCHI QUEEN', 'MALABAR EXPRESS', 'JAI HIND'],
    deliveryLocal: 'കൊച്ചി കാർഗോ',
    deliveryEn: 'COCHIN FREIGHT',
  },
  tokyo: {
    local: '都営バス',
    en: 'TOEI BUS',
    service: 'TOKYO METROPOLITAN TRANSIT',
    bg: '#065f46',
    fg: '#fef3c7',
    privateNames: ['渋谷急行 SHIBUYA', '新宿ライン SHINJUKU', '銀座バス GINZA', '品川観光 SHINAGAWA', '東京観光 TOKYO', '港区バス MINATO'],
    deliveryLocal: '東京急便',
    deliveryEn: 'TOKYO EXPRESS DELIVERY',
  },
  london: {
    local: 'LONDON BUSES',
    en: 'TFL',
    service: 'CENTRAL LONDON EXPRESS',
    bg: '#b91c1c',
    fg: '#ffffff',
    privateNames: ['WESTMINSTER', 'PICCADILLY', 'TRAFALGAR', 'THE STRAND', 'SOUTHBANK', 'VICTORIA LINE'],
    deliveryLocal: 'ROYAL FREIGHT UK',
    deliveryEn: 'LONDON PARCEL POST',
  },
  newyork: {
    local: 'MTA NYC',
    en: 'TRANSIT',
    service: 'SELECT BUS SERVICE · NYC',
    bg: '#1e3a8a',
    fg: '#ffffff',
    privateNames: ['MANHATTAN SBS', 'MIDTOWN EXPRESS', '5TH AVE LIMITED', 'BROADWAY LINE', 'HUDSON LINK', 'DOWNTOWN LOOP'],
    deliveryLocal: 'EMPIRE FREIGHT',
    deliveryEn: 'MANHATTAN LOGISTICS',
  },
  dubai: {
    local: 'هيئة الطرق RTA',
    en: 'DUBAI BUS',
    service: 'DOWNTOWN & MARINA LINE',
    bg: '#b91c1c',
    fg: '#f8fafc',
    privateNames: ['دبي إكسبرس RTA', 'المرسى MARINA', 'الخليج GULF', 'برج خليفة BURJ', 'الشيخ زايد E11', 'نخلة جميرا PALM'],
    deliveryLocal: 'إمارات للشحن',
    deliveryEn: 'EMIRATES CARGO DUBAI',
  },
};

const TAXI_TOP_LABEL = {
  tokyo: ['空車 · TAXI', '東京無線'],
  london: ['FOR HIRE', 'BLACK CAB'],
  newyork: ['NYC TAXI', 'MEDALLION'],
  dubai: ['TAXI تاكسي', 'RTA DUBAI'],
};

function formatPlateString(cfg, rng) {
  const prefix = cfg.plate?.prefix || 'KL 07';
  const letters =
    String.fromCharCode(65 + rng.int(0, 25)) + String.fromCharCode(65 + rng.int(0, 25));
  const num = String(rng.int(100, 9999)).padStart(4, '0');
  if (cfg.id === 'tokyo') {
    const kana = rng.pick(['あ', 'さ', 'な', 'わ', 'れ', 'た']);
    return `${prefix} ${kana} ${rng.int(10, 99)}-${rng.int(10, 99)}`;
  }
  if (cfg.id === 'london') {
    return `${prefix} ${letters}${String(rng.int(1, 9))}`;
  }
  if (cfg.id === 'newyork') {
    return `${prefix}-${letters}${rng.int(100, 999)}`;
  }
  if (cfg.id === 'dubai') {
    return `${prefix} ${rng.int(10000, 99999)}`;
  }
  return `${prefix} ${letters} ${num}`;
}

export function buildVehicleAtlas(maxAniso = 8, cityId = 'kochi') {
  const cfg = getCityConfig(cityId);
  const brand = CITY_TRANSIT_BRANDS[cfg.id] || CITY_TRANSIT_BRANDS.kochi;
  const destinations = cfg.busDestinations && cfg.busDestinations.length ? cfg.busDestinations : CITY_TRANSIT_BRANDS.kochi.privateNames.map((n) => [n, n]);
  const isRtl = !!cfg.language?.rtl;

  const canvas = makeCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  const rng = new RNG(4242 + cfg.id.length * 97);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const rects = { plates: [], platesYellow: [], boards: [], privateNames: [], privateFront: [] };
  const uv = (x, y, w, h) => ({
    u0: x / SIZE,
    v0: 1 - (y + h) / SIZE,
    u1: (x + w) / SIZE,
    v1: 1 - y / SIZE,
  });

  // --- number plates ----------------------------------------------------------
  const plate = (x, y, w, h, commercial) => {
    ctx.fillStyle = commercial ? '#f2c313' : cfg.plate?.bg || '#f4f4f0';
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 10);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#111';
    ctx.stroke();

    ctx.fillStyle = cfg.plate?.bandBg || '#1d3f9c';
    ctx.fillRect(x + 8, y + 10, 34, h - 20);
    ctx.fillStyle = '#fff';
    ctx.font = font(12, 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const countryBadge =
      cfg.id === 'tokyo' ? 'JP' : cfg.id === 'london' ? 'UK' : cfg.id === 'newyork' ? 'NY' : cfg.id === 'dubai' ? 'UAE' : 'IND';
    ctx.fillText(countryBadge, x + 25, y + h - 22);

    ctx.fillStyle = cfg.plate?.fg || '#111';
    const text = formatPlateString(cfg, rng);
    fitText(ctx, text, x + w / 2 + 18, y + h / 2 + 3, w - 70, h * 0.6, 800);
  };

  const PW = 384;
  const PH = 96;
  for (let i = 0; i < 10; i++) {
    const x = (i % 5) * PW;
    const y = Math.floor(i / 5) * PH;
    plate(x, y, PW, PH, false);
    rects.plates.push(uv(x, y, PW, PH));
  }
  for (let i = 0; i < 5; i++) {
    const x = i * PW;
    const y = 2 * PH;
    plate(x, y, PW, PH, true);
    rects.platesYellow.push(uv(x, y, PW, PH));
  }

  // --- Bus destination boards (Bilingual Local + English) ---------------------
  const BW = 1024;
  const BH = 128;
  destinations.slice(0, 8).forEach((d, i) => {
    const x = (i % 2) * BW;
    const y = 300 + Math.floor(i / 2) * BH;
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(x, y, BW, BH);
    ctx.save();
    if (isRtl) ctx.direction = 'rtl';
    ctx.fillStyle = '#ffd21f';
    fitText(ctx, d[0], x + BW * 0.36, y + BH / 2 + 4, BW * 0.58, 76, 800);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    fitText(ctx, d[1], x + BW * 0.82, y + BH / 2 + 4, BW * 0.3, 42, 700);
    rects.boards.push(uv(x + 6, y + 6, BW - 12, BH - 12));
  });

  // --- Transit side lettering -------------------------------------------------
  {
    const x = 0;
    const y = 820;
    ctx.fillStyle = brand.bg;
    ctx.fillRect(x, y, 1024, 160);
    ctx.save();
    if (isRtl) ctx.direction = 'rtl';
    ctx.fillStyle = brand.fg;
    fitText(ctx, brand.local, x + 310, y + 84, 540, 86, 800);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    fitText(ctx, brand.en, x + 800, y + 84, 380, 86, 800);
    rects.ksrtcSide = uv(x, y, 1024, 160);
  }
  {
    const x = 1024;
    const y = 820;
    ctx.fillStyle = brand.bg;
    ctx.fillRect(x, y, 1024, 160);
    ctx.fillStyle = brand.fg;
    fitText(ctx, brand.service, x + 512, y + 84, 920, 74, 800);
    rects.ksrtcType = uv(x, y, 1024, 160);
  }

  // --- Regional Bus / Transit Line Side Banners -------------------------------
  brand.privateNames.forEach((name, i) => {
    const x = (i % 2) * 1024;
    const y = 1000 + Math.floor(i / 2) * 150;
    const g = ctx.createLinearGradient(x, y, x + 1024, y);
    const hues = [
      [205, 40],
      [350, 20],
      [140, 60],
      [280, 30],
      [25, 50],
      [190, 320],
    ][i];
    g.addColorStop(0, `hsl(${hues[0]} 80% 38%)`);
    g.addColorStop(1, `hsl(${hues[1]} 85% 48%)`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 1024, 150);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let k = 0; k < 9; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 130 - 40, y + 150);
      ctx.lineTo(x + k * 130 + 60, y);
      ctx.lineTo(x + k * 130 + 100, y);
      ctx.lineTo(x + k * 130, y + 150);
      ctx.fill();
    }
    ctx.save();
    if (isRtl) ctx.direction = 'rtl';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 8;
    ctx.font = font(92, 800);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(name, x + 512, y + 82);
    fitText(ctx, name, x + 512, y + 82, 950, 92, 800);
    ctx.restore();
    rects.privateNames.push(uv(x, y, 1024, 150));
  });

  // --- Auto rickshaw / city rear panel ----------------------------------------
  {
    const x = 0;
    const y = 1470;
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(x, y, 512, 256);
    ctx.save();
    if (isRtl) ctx.direction = 'rtl';
    ctx.fillStyle = '#f0c313';
    fitText(ctx, cfg.localName || cfg.name, x + 256, y + 86, 460, 92, 800);
    ctx.restore();
    ctx.fillStyle = '#fff';
    fitText(ctx, 'HORN · OK · PLEASE', x + 256, y + 190, 460, 40, 700);
    rects.autoRear = uv(x, y, 512, 256);
  }

  // --- Taxi roof sign decal ---------------------------------------------------
  {
    const x = 512;
    const y = 1470;
    const labels = TAXI_TOP_LABEL[cfg.id] || ['TAXI', cfg.name.toUpperCase()];
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x, y, 512, 256);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#111';
    ctx.strokeRect(x + 8, y + 8, 496, 240);
    ctx.save();
    if (isRtl) ctx.direction = 'rtl';
    ctx.fillStyle = '#111111';
    fitText(ctx, labels[0], x + 256, y + 100, 450, 78, 800);
    ctx.restore();
    ctx.fillStyle = '#991b1b';
    fitText(ctx, labels[1], x + 256, y + 196, 440, 46, 700);
    rects.taxiSign = uv(x, y, 512, 256);
  }

  // --- Delivery box truck side decal ------------------------------------------
  {
    const x = 1024;
    const y = 1470;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, 1024, 256);
    ctx.fillStyle = brand.bg;
    ctx.fillRect(x, y, 1024, 34);
    ctx.fillRect(x, y + 222, 1024, 34);
    ctx.save();
    if (isRtl) ctx.direction = 'rtl';
    ctx.fillStyle = '#0f172a';
    fitText(ctx, brand.deliveryLocal, x + 512, y + 105, 920, 72, 800);
    ctx.restore();
    ctx.fillStyle = '#334155';
    fitText(ctx, brand.deliveryEn, x + 512, y + 185, 920, 44, 700);
    rects.deliverySide = uv(x, y, 1024, 256);
  }

  // --- White texel block ------------------------------------------------------
  ctx.fillStyle = '#fff';
  ctx.fillRect(SIZE - 64, SIZE - 64, 64, 64);

  const texture = canvasTexture(canvas, { anisotropy: maxAniso });
  return { texture, rects };
}
