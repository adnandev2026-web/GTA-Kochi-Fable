import fs from 'node:fs';
import path from 'node:path';
import { getCityConfig, latLonToWorld } from '../src/config/cityConfigs.js';

export interface OsmRoadNode {
  id: string;
  p: [number, number];
  name?: string;
  signal?: boolean;
  exit?: boolean;
  toward?: string;
}

export interface OsmRoadEdge {
  id: string;
  a: string;
  b: string;
  cls: 'highway' | 'arterial' | 'street';
  name: string;
  via: [number, number][];
}

export interface OsmBuilding {
  id: string;
  cx: number;
  cz: number;
  width: number;
  depth: number;
  rot: number;
  height: number;
  levels: number;
  name?: string;
  shop?: string;
  amenity?: string;
  pts: [number, number][];
}

export interface OsmWaterChannel {
  pts: [number, number][];
  width: number;
  name?: string;
}

export interface OsmPoi {
  id: string;
  kind: 'school' | 'fuel' | 'police';
  name: string;
  x: number;
  z: number;
  lat: number;
  lon: number;
}

export interface OsmCityPayload {
  cityId: string;
  source: 'overpass' | 'fallback';
  fetchedAt: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  nodes: Record<string, OsmRoadNode>;
  edges: OsmRoadEdge[];
  buildings: OsmBuilding[];
  waterChannels: OsmWaterChannel[];
  pois: OsmPoi[];
}

const CACHE_DIR = '/tmp/gta-osm-cache';
const MEMORY_CACHE = new Map<string, OsmCityPayload>();
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch {
    // ignore read-only fs errors
  }
}

function classifyHighway(hw: string): 'highway' | 'arterial' | 'street' | null {
  switch (hw) {
    case 'motorway':
    case 'trunk':
    case 'primary':
      return 'highway';
    case 'secondary':
    case 'tertiary':
      return 'arterial';
    case 'residential':
    case 'unclassified':
    case 'living_street':
      return 'street';
    default:
      return null;
  }
}

function computePolygonMetrics(pts: [number, number][]): {
  cx: number;
  cz: number;
  width: number;
  depth: number;
  rot: number;
} {
  let sx = 0;
  let sz = 0;
  for (const [x, z] of pts) {
    sx += x;
    sz += z;
  }
  const cx = sx / pts.length;
  const cz = sz / pts.length;

  // Dominant edge orientation
  let bestLen = 0;
  let rot = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len > bestLen) {
      bestLen = len;
      rot = Math.atan2(dx, dz);
    }
  }

  const c = Math.cos(-rot);
  const s = Math.sin(-rot);
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const [x, z] of pts) {
    const dx = x - cx;
    const dz = z - cz;
    const u = dx * c - dz * s;
    const v = dx * s + dz * c;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  return {
    cx: Math.round(cx * 10) / 10,
    cz: Math.round(cz * 10) / 10,
    width: Math.max(4, Math.min(90, Math.round((maxU - minU) * 10) / 10)),
    depth: Math.max(4, Math.min(90, Math.round((maxV - minV) * 10) / 10)),
    rot: Math.round(rot * 1000) / 1000,
  };
}

/**
 * Generates geographically grounded OSM-style fallback data when Overpass is offline/throttled.
 * For Pookkottumpadam, builds the full corridor spanning Nilambur -> Amarambalam -> Pookkottumpadam -> Kalikavu Circle!
 */
export function buildFallbackOsmCity(cityId: string): OsmCityPayload {
  const cfg = getCityConfig(cityId);
  if (cityId === 'pookkottumpadam') {
    const anchors: Array<{ id: string; lat: number; lon: number; name: string; signal?: boolean; exit?: boolean; toward?: string }> = [
      { id: 'NIL_N', lat: 11.284, lon: 76.224, name: 'Nilambur North Gate', exit: true, toward: 'Gudalur · Ooty' },
      { id: 'NILAMBUR', lat: 11.2775, lon: 76.2265, name: 'Nilambur Town Junction', signal: true },
      { id: 'NIL_W', lat: 11.2745, lon: 76.2165, name: 'Kozhikode Hwy Gate', exit: true, toward: 'Manjeri · Calicut' },
      { id: 'CHANDAKUNNU', lat: 11.262, lon: 76.242, name: 'Chandakunnu Jn', signal: true },
      { id: 'AMARAMPALAM', lat: 11.239, lon: 76.261, name: 'Amarambalam Cross', signal: true },
      { id: 'PKP_TOWN', lat: 11.2145, lon: 76.2835, name: 'Pookkottumpadam Town Jn', signal: true },
      { id: 'CHOKKAD', lat: 11.224, lon: 76.308, name: 'Chokkad Estate Rd', signal: true },
      { id: 'CHOKKAD_E', lat: 11.233, lon: 76.329, name: 'Silent Valley Gate', exit: true, toward: 'Karulai · Reserve' },
      { id: 'VANIYAM', lat: 11.196, lon: 76.266, name: 'Vaniyambalam Jn', signal: true },
      { id: 'WANDOOR_W', lat: 11.189, lon: 76.235, name: 'Wandoor Exit', exit: true, toward: 'Wandoor · Perinthalmanna' },
      { id: 'KALIKAVU', lat: 11.1755, lon: 76.3195, name: 'Kalikavu Circle', signal: true },
      { id: 'KAL_S', lat: 11.1685, lon: 76.329, name: 'Kalikavu South Exit', exit: true, toward: 'Karuvarkundu · Melattur' },
    ];
    const nodes: Record<string, OsmRoadNode> = {};
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const a of anchors) {
      const { x, z } = latLonToWorld(cityId, a.lat, a.lon);
      nodes[a.id] = { id: a.id, p: [x, z], name: a.name, signal: a.signal, exit: a.exit, toward: a.toward };
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    const edges: OsmRoadEdge[] = [
      { id: 'E_NIL_N', a: 'NIL_N', b: 'NILAMBUR', cls: 'highway', name: 'NH 766 Nilambur Rd', via: [] },
      { id: 'E_NIL_W', a: 'NIL_W', b: 'NILAMBUR', cls: 'highway', name: 'Nilambur – Manjeri Rd', via: [] },
      { id: 'E_NIL_CHD', a: 'NILAMBUR', b: 'CHANDAKUNNU', cls: 'highway', name: 'Nilambur – Kalikavu Hwy', via: [] },
      { id: 'E_CHD_AMR', a: 'CHANDAKUNNU', b: 'AMARAMPALAM', cls: 'highway', name: 'Nilambur – Kalikavu Hwy', via: [] },
      { id: 'E_AMR_PKP', a: 'AMARAMPALAM', b: 'PKP_TOWN', cls: 'highway', name: 'Pookkottumpadam Main Rd', via: [] },
      { id: 'E_PKP_KAL', a: 'PKP_TOWN', b: 'KALIKAVU', cls: 'highway', name: 'Pookkottumpadam – Kalikavu Rd', via: [] },
      { id: 'E_KAL_S', a: 'KALIKAVU', b: 'KAL_S', cls: 'highway', name: 'Kalikavu – Karuvarkundu Rd', via: [] },
      { id: 'E_PKP_CHK', a: 'PKP_TOWN', b: 'CHOKKAD', cls: 'arterial', name: 'Chokkad – Karulai Rd', via: [] },
      { id: 'E_CHK_E', a: 'CHOKKAD', b: 'CHOKKAD_E', cls: 'arterial', name: 'Chokkad Forest Corridor', via: [] },
      { id: 'E_PKP_VAN', a: 'PKP_TOWN', b: 'VANIYAM', cls: 'arterial', name: 'Vaniyambalam Bazaar Rd', via: [] },
      { id: 'E_VAN_WND', a: 'VANIYAM', b: 'WANDOOR_W', cls: 'arterial', name: 'Wandoor – Nilambur Rd', via: [] },
      { id: 'E_VAN_KAL', a: 'VANIYAM', b: 'KALIKAVU', cls: 'street', name: 'Chaliyar Cross Link', via: [] },
      { id: 'E_AMR_VAN', a: 'AMARAMPALAM', b: 'VANIYAM', cls: 'street', name: 'Amarambalam South Link', via: [] },
      { id: 'E_AMR_CHK', a: 'AMARAMPALAM', b: 'CHOKKAD', cls: 'street', name: 'Teak Estate Bypass', via: [] },
    ];

    const buildings: OsmBuilding[] = [];
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const na = nodes[e.a].p;
      const nb = nodes[e.b].p;
      const dx = nb[0] - na[0];
      const dz = nb[1] - na[1];
      const len = Math.hypot(dx, dz) || 1;
      const tx = dx / len;
      const tz = dz / len;
      const nx = -tz;
      const nz = tx;
      const rot = Math.atan2(tx, tz);
      const count = Math.max(4, Math.floor(len / 48));
      for (let k = 1; k < count; k++) {
        const t = k / count;
        for (const side of [-1, 1]) {
          if ((k + i + (side > 0 ? 1 : 0)) % 3 === 0) continue;
          const off = 22 + ((k * 7 + i * 5) % 10);
          const cx = Math.round((na[0] + dx * t + nx * off * side) * 10) / 10;
          const cz = Math.round((na[1] + dz * t + nz * off * side) * 10) / 10;
          const w = 12 + ((k * 5 + i) % 10);
          const d = 10 + ((k * 3 + i) % 8);
          const lv = 1 + ((k + i) % 3);
          buildings.push({
            id: `fb_b_${i}_${k}_${side}`,
            cx,
            cz,
            width: w,
            depth: d,
            rot,
            levels: lv,
            height: lv * 3.4,
            pts: [
              [cx - w / 2, cz - d / 2],
              [cx + w / 2, cz - d / 2],
              [cx + w / 2, cz + d / 2],
              [cx - w / 2, cz + d / 2],
            ],
          });
        }
      }
    }

    return {
      cityId,
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      bounds: {
        minX: Math.min(-960, Math.floor(minX - 240)),
        maxX: Math.max(960, Math.ceil(maxX + 240)),
        minZ: Math.min(-960, Math.floor(minZ - 240)),
        maxZ: Math.max(960, Math.ceil(maxZ + 240)),
      },
      nodes,
      edges,
      buildings,
      waterChannels: [
        {
          name: 'Chaliyar Tributary',
          width: 38,
          pts: [
            latLonToWorld(cityId, 11.27, 76.21),
            latLonToWorld(cityId, 11.245, 76.245),
            latLonToWorld(cityId, 11.21, 76.275),
            latLonToWorld(cityId, 11.18, 76.31),
          ].map((pt) => [pt.x, pt.z] as [number, number]),
        },
      ],
      pois: [
        { id: 'osm_sch_pkp', kind: 'school', name: 'GHSS Pookkottumpadam', x: 95, z: 120, lat: 11.211, lon: 76.286 },
        { id: 'osm_fuel_pkp', kind: 'fuel', name: 'Nilambur – Kalikavu HP Pump', x: -240, z: -260, lat: 11.248, lon: 76.256 },
        { id: 'osm_pol_pkp', kind: 'police', name: 'Pookkottumpadam Police Station', x: -48, z: -135, lat: 11.219, lon: 76.278 },
      ],
    };
  }

  // Standard geographic bounding grid fallback for any other city
  const half = 680;
  const ringCoords = [-340, 0, 340];
  const nodes: Record<string, OsmRoadNode> = {
    N_EXIT: { id: 'N_EXIT', p: [0, -780], exit: true, toward: `${cfg.name} North` },
    S_EXIT: { id: 'S_EXIT', p: [0, 780], exit: true, toward: `${cfg.name} South` },
    W_EXIT: { id: 'W_EXIT', p: [-780, 0], exit: true, toward: `${cfg.name} West` },
    E_EXIT: { id: 'E_EXIT', p: [780, 0], exit: true, toward: `${cfg.name} East` },
  };
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const id = `N_${r}_${c}`;
      nodes[id] = { id, p: [ringCoords[c], ringCoords[r]], name: `${cfg.name} Cross ${r * 3 + c + 1}`, signal: true };
    }
  }
  const edges: OsmRoadEdge[] = [
    { id: 'EX_N', a: 'N_EXIT', b: 'N_0_1', cls: 'highway', name: `${cfg.name} Main Blvd`, via: [] },
    { id: 'EX_S', a: 'N_2_1', b: 'S_EXIT', cls: 'highway', name: `${cfg.name} Main Blvd`, via: [] },
    { id: 'EX_W', a: 'W_EXIT', b: 'N_1_0', cls: 'arterial', name: `${cfg.name} Central Ave`, via: [] },
    { id: 'EX_E', a: 'N_1_2', b: 'E_EXIT', cls: 'arterial', name: `${cfg.name} Central Ave`, via: [] },
  ];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (c < 2) {
        edges.push({
          id: `H_${r}_${c}`,
          a: `N_${r}_${c}`,
          b: `N_${r}_${c + 1}`,
          cls: r === 1 ? 'arterial' : 'street',
          name: `${cfg.name} St ${r + 1}`,
          via: [],
        });
      }
      if (r < 2) {
        edges.push({
          id: `V_${r}_${c}`,
          a: `N_${r}_${c}`,
          b: `N_${r + 1}_${c}`,
          cls: c === 1 ? 'highway' : 'arterial',
          name: `${cfg.name} Ave ${c + 1}`,
          via: [],
        });
      }
    }
  }
  return {
    cityId,
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
    bounds: { minX: -half - 240, maxX: half + 240, minZ: -half - 240, maxZ: half + 240 },
    nodes,
    edges,
    buildings: [],
    waterChannels: [],
    pois: [],
  };
}

function buildOverpassQuery(cityId: string): string {
  const cfg = getCityConfig(cityId);
  const [s, w, n, e] = cfg.bbox;
  // For expansive corridors like Pookkottumpadam (Nilambur to Kalikavu Circle), limit minor service paths so JSON stays crisp & fast
  const hwFilter =
    cityId === 'pookkottumpadam'
      ? 'motorway|trunk|primary|secondary|tertiary|unclassified'
      : 'motorway|trunk|primary|secondary|tertiary|residential|unclassified';

  return `[out:json][timeout:14];
(
  way["highway"~"${hwFilter}"](${s},${w},${n},${e});
  way["building"](${s},${w},${n},${e});
  way["waterway"~"river|canal|stream"](${s},${w},${n},${e});
  node["amenity"~"school|fuel|police"](${s},${w},${n},${e});
);
out body geom;`;
}

function parseOverpassResponse(cityId: string, json: any): OsmCityPayload | null {
  const elements = Array.isArray(json?.elements) ? json.elements : [];
  if (!elements.length) return null;

  const rawWays = elements.filter((el: any) => el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 2);
  const roadWays = rawWays.filter((w: any) => w.tags?.highway && classifyHighway(w.tags.highway));
  if (roadWays.length < 4) return null;

  // Cluster / snap nearby endpoints within SNAP_DIST metres so intersections link cleanly
  const SNAP_DIST = cityId === 'pookkottumpadam' ? 28 : 16;
  const coordBuckets = new Map<string, { id: string; x: number; z: number; deg: number; name?: string }>();
  const clusterCell = (x: number, z: number) => `${Math.round(x / SNAP_DIST)}_${Math.round(z / SNAP_DIST)}`;

  let nextNodeSeq = 1;
  const getOrMakeNode = (lat: number, lon: number, label?: string) => {
    const { x, z } = latLonToWorld(cityId, lat, lon);
    const key = clusterCell(x, z);
    let entry = coordBuckets.get(key);
    if (!entry) {
      // Search adjacent 3x3 cells
      const gx = Math.round(x / SNAP_DIST);
      const gz = Math.round(z / SNAP_DIST);
      outer: for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const cand = coordBuckets.get(`${gx + dx}_${gz + dz}`);
          if (cand && Math.hypot(cand.x - x, cand.z - z) <= SNAP_DIST) {
            entry = cand;
            break outer;
          }
        }
      }
    }
    if (!entry) {
      entry = { id: `OSM_${nextNodeSeq++}`, x, z, deg: 0, name: label };
      coordBuckets.set(key, entry);
    } else if (label && !entry.name) {
      entry.name = label;
    }
    return entry;
  };

  // Count how many road ways hit each geometry vertex to detect intersections
  const vertexHits = new Map<string, number>();
  for (const w of roadWays) {
    for (const pt of w.geometry) {
      const { x, z } = latLonToWorld(cityId, pt.lat, pt.lon);
      const k = clusterCell(x, z);
      vertexHits.set(k, (vertexHits.get(k) || 0) + 1);
    }
  }

  const edges: OsmRoadEdge[] = [];
  const usedEdgeKeys = new Set<string>();
  const MAX_EDGES = 190;

  // Prioritize higher road classes first
  const priority = { highway: 0, arterial: 1, street: 2 };
  roadWays.sort((a: any, b: any) => {
    const ca = classifyHighway(a.tags.highway) || 'street';
    const cb = classifyHighway(b.tags.highway) || 'street';
    return priority[ca] - priority[cb];
  });

  for (const w of roadWays) {
    if (edges.length >= MAX_EDGES) break;
    const cls = classifyHighway(w.tags.highway) || 'street';
    const roadName = String(w.tags.name || w.tags['name:en'] || w.tags.ref || `${cls.toUpperCase()} RD`).slice(0, 48);
    const geom = w.geometry;

    // Split way at shared intersection vertices
    let segStart = 0;
    for (let i = 1; i < geom.length; i++) {
      const isLast = i === geom.length - 1;
      const { x, z } = latLonToWorld(cityId, geom[i].lat, geom[i].lon);
      const hits = vertexHits.get(clusterCell(x, z)) || 1;
      if (hits > 1 || isLast) {
        const na = getOrMakeNode(geom[segStart].lat, geom[segStart].lon, roadName);
        const nb = getOrMakeNode(geom[i].lat, geom[i].lon, roadName);
        if (na.id !== nb.id) {
          const d = Math.hypot(nb.x - na.x, nb.z - na.z);
          const ek = na.id < nb.id ? `${na.id}_${nb.id}` : `${nb.id}_${na.id}`;
          if (d >= 20 && !usedEdgeKeys.has(ek)) {
            usedEdgeKeys.add(ek);
            const via: [number, number][] = [];
            for (let k = segStart + 1; k < i; k++) {
              const vp = latLonToWorld(cityId, geom[k].lat, geom[k].lon);
              const prev = via.length ? via[via.length - 1] : [na.x, na.z];
              if (Math.hypot(vp.x - prev[0], vp.z - prev[1]) > 14 && Math.hypot(vp.x - nb.x, vp.z - nb.z) > 14) {
                via.push([vp.x, vp.z]);
              }
            }
            // Limit intermediate points so road builder stays crisp
            const step = via.length > 4 ? Math.ceil(via.length / 4) : 1;
            const prunedVia = via.filter((_, idx) => idx % step === 0);
            edges.push({
              id: `E_${edges.length + 1}`,
              a: na.id,
              b: nb.id,
              cls,
              name: roadName,
              via: prunedVia,
            });
            na.deg++;
            nb.deg++;
          }
        }
        segStart = i;
      }
    }
  }

  if (edges.length < 4) return null;

  const nodes: Record<string, OsmRoadNode> = {};
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const e of edges) {
    for (const nid of [e.a, e.b]) {
      const bucket = [...coordBuckets.values()].find((b) => b.id === nid);
      if (!bucket) continue;
      if (!nodes[nid]) {
        nodes[nid] = {
          id: nid,
          p: [bucket.x, bucket.z],
          name: bucket.name,
          signal: bucket.deg >= 3,
          exit: bucket.deg === 1,
          toward: bucket.deg === 1 ? `${bucket.name || 'City Border'}` : undefined,
        };
        minX = Math.min(minX, bucket.x);
        maxX = Math.max(maxX, bucket.x);
        minZ = Math.min(minZ, bucket.z);
        maxZ = Math.max(maxZ, bucket.z);
      }
    }
  }

  // Extract real OSM buildings (capped at 480 for crisp 60fps geometry batching)
  const buildings: OsmBuilding[] = [];
  for (const w of rawWays) {
    if (!w.tags?.building || buildings.length >= 480) continue;
    const pts: [number, number][] = [];
    for (const pt of w.geometry) {
      const { x, z } = latLonToWorld(cityId, pt.lat, pt.lon);
      pts.push([x, z]);
    }
    if (pts.length < 3) continue;
    const m = computePolygonMetrics(pts);
    if (m.cx < minX - 180 || m.cx > maxX + 180 || m.cz < minZ - 180 || m.cz > maxZ + 180) continue;
    const levelsRaw = Number(w.tags['building:levels']);
    const heightRaw = Number(String(w.tags.height || '').replace(/[^0-9.]/g, ''));
    const levels = Number.isFinite(levelsRaw) && levelsRaw > 0 ? Math.min(28, Math.round(levelsRaw)) : 2;
    const height = Number.isFinite(heightRaw) && heightRaw > 2 ? Math.min(110, heightRaw) : levels * 3.4;
    buildings.push({
      id: `b_${w.id}`,
      cx: m.cx,
      cz: m.cz,
      width: m.width,
      depth: m.depth,
      rot: m.rot,
      height,
      levels,
      name: w.tags.name ? String(w.tags.name).slice(0, 42) : undefined,
      shop: w.tags.shop ? String(w.tags.shop) : undefined,
      amenity: w.tags.amenity ? String(w.tags.amenity) : undefined,
      pts: pts.slice(0, 12),
    });
  }

  // Extract water channels
  const waterChannels: OsmWaterChannel[] = [];
  for (const w of rawWays) {
    if (!w.tags?.waterway || waterChannels.length >= 16) continue;
    const pts = w.geometry.map((pt: any) => {
      const p = latLonToWorld(cityId, pt.lat, pt.lon);
      return [p.x, p.z] as [number, number];
    });
    if (pts.length >= 2) {
      waterChannels.push({
        pts,
        width: w.tags.waterway === 'river' ? 36 : w.tags.waterway === 'canal' ? 22 : 12,
        name: w.tags.name,
      });
    }
  }

  // Extract POIs (schools, fuel, police)
  const pois: OsmPoi[] = [];
  for (const el of elements) {
    if (el.type !== 'node' || !el.tags?.amenity) continue;
    const a = el.tags.amenity;
    if (a !== 'school' && a !== 'fuel' && a !== 'police') continue;
    const { x, z } = latLonToWorld(cityId, el.lat, el.lon);
    pois.push({
      id: `poi_${el.id}`,
      kind: a,
      name: String(el.tags.name || el.tags['name:en'] || a.toUpperCase()).slice(0, 40),
      x,
      z,
      lat: el.lat,
      lon: el.lon,
    });
    if (pois.length >= 24) break;
  }

  return {
    cityId,
    source: 'overpass',
    fetchedAt: new Date().toISOString(),
    bounds: {
      minX: Math.min(-880, Math.floor(minX - 240)),
      maxX: Math.max(880, Math.ceil(maxX + 240)),
      minZ: Math.min(-880, Math.floor(minZ - 240)),
      maxZ: Math.max(880, Math.ceil(maxZ + 240)),
    },
    nodes,
    edges,
    buildings,
    waterChannels,
    pois,
  };
}

export async function getCityOsmData(cityId: string): Promise<OsmCityPayload> {
  const existing = MEMORY_CACHE.get(cityId);
  if (existing) return existing;

  ensureCacheDir();
  const cacheFile = path.join(CACHE_DIR, `${cityId.replace(/[^a-z0-9_-]/gi, '')}.json`);
  try {
    if (fs.existsSync(cacheFile)) {
      const parsed = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as OsmCityPayload;
      if (parsed && parsed.edges?.length >= 4) {
        MEMORY_CACHE.set(cityId, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore corrupted cache
  }

  const query = buildOverpassQuery(cityId);
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = await res.json();
      const parsed = parseOverpassResponse(cityId, json);
      if (parsed) {
        MEMORY_CACHE.set(cityId, parsed);
        try {
          fs.writeFileSync(cacheFile, JSON.stringify(parsed));
        } catch {
          // ignore disk write issues
        }
        return parsed;
      }
    } catch {
      // Try next Overpass mirror
    }
  }

  const fallback = buildFallbackOsmCity(cityId);
  MEMORY_CACHE.set(cityId, fallback);
  return fallback;
}
