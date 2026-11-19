import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Home, MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { fetchCityOsmApi } from '../lib/api';
import { CITIES_CATALOG } from '../shared/catalog';
import {
  encodeCustomHomeId,
  getCityConfig,
  parseCustomHomeId,
  worldToLatLon,
} from '../config/cityConfigs';

interface OsmNode {
  id: string;
  p: [number, number];
  name?: string;
}

interface OsmEdge {
  a: string;
  b: string;
  cls: 'highway' | 'arterial' | 'street';
  name: string;
  via: [number, number][];
}

interface OsmBuilding {
  id: string;
  cx: number;
  cz: number;
  width: number;
  depth: number;
  rot: number;
  name?: string;
  pts: [number, number][];
}

interface OsmWater {
  pts: [number, number][];
  width: number;
}

interface OsmPoi {
  id: string;
  kind: 'school' | 'fuel' | 'police';
  name: string;
  x: number;
  z: number;
}

interface OsmData {
  cityId: string;
  source: 'overpass' | 'fallback';
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  nodes: Record<string, OsmNode>;
  edges: OsmEdge[];
  buildings: OsmBuilding[];
  waterChannels: OsmWater[];
  pois: OsmPoi[];
}

const OSM_CACHE = new Map<string, OsmData>();

interface Props {
  cityId: string;
  selectedHomeId: string;
  onSelectHome: (homeId: string) => void;
}

export const CityHomeMapPicker: React.FC<Props> = ({ cityId, selectedHomeId, onSelectHome }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [osm, setOsm] = useState<OsmData | null>(() => OSM_CACHE.get(cityId) || null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [pickedLabel, setPickedLabel] = useState<string>('');
  const dragRef = useRef<{ active: boolean; sx: number; sy: number; px: number; pz: number; moved: boolean }>({
    active: false,
    sx: 0,
    sy: 0,
    px: 0,
    pz: 0,
    moved: false,
  });

  const citySummary = useMemo(
    () => CITIES_CATALOG.find((c) => c.id === cityId) || CITIES_CATALOG[0],
    [cityId],
  );
  const cityCfg = useMemo(() => getCityConfig(cityId), [cityId]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, z: 0 });
    setPickedLabel('');
    const cached = OSM_CACHE.get(cityId);
    if (cached) {
      setOsm(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCityOsmApi(cityId)
      .then((res) => {
        if (cancelled) return;
        if (res?.osm) {
          OSM_CACHE.set(cityId, res.osm);
          setOsm(res.osm);
        }
      })
      .catch(() => {
        if (!cancelled) setOsm(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cityId]);

  const activeWorldPoint = useMemo(() => {
    const custom = parseCustomHomeId(selectedHomeId, cityId);
    if (custom) {
      return { x: custom.x, z: custom.z, lat: custom.lat, lon: custom.lon, isCustom: true };
    }
    const preset = citySummary.homes.find((h) => h.id === selectedHomeId) || citySummary.homes[0];
    const ll = worldToLatLon(cityId, preset.x, preset.z);
    return { x: preset.x, z: preset.z, lat: ll.lat, lon: ll.lon, isCustom: false, name: preset.name };
  }, [cityId, selectedHomeId, citySummary]);

  const bounds = useMemo(() => {
    if (osm?.bounds) return osm.bounds;
    return { minX: -900, maxX: 900, minZ: -900, maxZ: 900 };
  }, [osm]);

  // Draw the interactive 2D city vector map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const spanX = Math.max(400, bounds.maxX - bounds.minX);
    const spanZ = Math.max(400, bounds.maxZ - bounds.minZ);
    const cxWorld = (bounds.minX + bounds.maxX) * 0.5 + pan.x;
    const czWorld = (bounds.minZ + bounds.maxZ) * 0.5 + pan.z;
    const baseScale = Math.min((w - 36) / spanX, (h - 36) / spanZ);
    const scale = baseScale * zoom;

    const toScreen = (wx: number, wz: number): [number, number] => [
      w * 0.5 + (wx - cxWorld) * scale,
      h * 0.5 + (wz - czWorld) * scale,
    ];

    // Background land
    ctx.fillStyle = '#0d151c';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const step = spanX > 2500 ? 400 : 200;
    const gx0 = Math.floor((cxWorld - w / (2 * scale)) / step) * step;
    const gx1 = Math.ceil((cxWorld + w / (2 * scale)) / step) * step;
    const gz0 = Math.floor((czWorld - h / (2 * scale)) / step) * step;
    const gz1 = Math.ceil((czWorld + h / (2 * scale)) / step) * step;
    for (let gx = gx0; gx <= gx1; gx += step) {
      const [sx] = toScreen(gx, 0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let gz = gz0; gz <= gz1; gz += step) {
      const [, sy] = toScreen(0, gz);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    // Water channels
    if (osm?.waterChannels) {
      ctx.strokeStyle = '#0e4c66';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const ch of osm.waterChannels) {
        if (!ch.pts?.length) continue;
        ctx.lineWidth = Math.max(2, (ch.width || 12) * scale);
        ctx.beginPath();
        ch.pts.forEach(([x, z], idx) => {
          const [sx, sy] = toScreen(x, z);
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
      }
    }

    // Buildings
    if (osm?.buildings) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.24)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.36)';
      ctx.lineWidth = 0.8;
      for (const b of osm.buildings) {
        if (b.pts && b.pts.length >= 3) {
          ctx.beginPath();
          b.pts.forEach(([px, pz], idx) => {
            const [sx, sy] = toScreen(px, pz);
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fill();
          if (zoom >= 1.3) ctx.stroke();
        } else {
          const [sx, sy] = toScreen(b.cx, b.cz);
          const bw = Math.max(2, b.width * scale);
          const bd = Math.max(2, b.depth * scale);
          ctx.fillRect(sx - bw * 0.5, sy - bd * 0.5, bw, bd);
        }
      }
    }

    // Roads
    if (osm?.edges && osm?.nodes) {
      const order: Array<'street' | 'arterial' | 'highway'> = ['street', 'arterial', 'highway'];
      for (const cls of order) {
        ctx.strokeStyle =
          cls === 'highway' ? '#f59e0b' : cls === 'arterial' ? '#94a3b8' : 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth =
          cls === 'highway' ? Math.max(2.6, 10 * scale) : cls === 'arterial' ? Math.max(1.6, 6 * scale) : Math.max(0.9, 3 * scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const e of osm.edges) {
          if (e.cls !== cls) continue;
          const na = osm.nodes[e.a];
          const nb = osm.nodes[e.b];
          if (!na || !nb) continue;
          const pts = [na.p, ...(e.via || []), nb.p];
          ctx.beginPath();
          pts.forEach(([x, z], idx) => {
            const [sx, sy] = toScreen(x, z);
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.stroke();
        }
      }
    }

    // POIs (police/fuel/school)
    if (osm?.pois) {
      for (const poi of osm.pois) {
        const [sx, sy] = toScreen(poi.x, poi.z);
        ctx.fillStyle = poi.kind === 'police' ? '#3b82f6' : poi.kind === 'fuel' ? '#ef4444' : '#facc15';
        ctx.beginPath();
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Preset homes markers
    for (const hm of citySummary.homes) {
      const [sx, sy] = toScreen(hm.x, hm.z);
      const isActive = selectedHomeId === hm.id;
      ctx.fillStyle = isActive ? '#10b981' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(sx, sy, isActive ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#080c10';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = isActive ? '#6ee7b7' : '#cbd5e1';
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillText(hm.district, sx + 7, sy + 3);
    }

    // Active selected Home pin (big pulsing-style crosshair without CSS animation)
    {
      const [hx, hy] = toScreen(activeWorldPoint.x, activeWorldPoint.z);
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = '#ffd34d';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('HOME SPAWN', hx + 14, hy - 3);
    }
  }, [osm, bounds, pan, zoom, citySummary, selectedHomeId, activeWorldPoint]);

  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, z: 0 };
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * canvas.width;
    const py = ((clientY - rect.top) / rect.height) * canvas.height;
    const spanX = Math.max(400, bounds.maxX - bounds.minX);
    const spanZ = Math.max(400, bounds.maxZ - bounds.minZ);
    const cxWorld = (bounds.minX + bounds.maxX) * 0.5 + pan.x;
    const czWorld = (bounds.minZ + bounds.maxZ) * 0.5 + pan.z;
    const baseScale = Math.min((canvas.width - 36) / spanX, (canvas.height - 36) / spanZ);
    const scale = baseScale * zoom;
    return {
      x: cxWorld + (px - canvas.width * 0.5) / scale,
      z: czWorld + (py - canvas.height * 0.5) / scale,
    };
  };

  const pickAt = (clientX: number, clientY: number) => {
    const wPos = screenToWorld(clientX, clientY);
    let bestName = '';
    if (osm?.buildings) {
      let bestDist = 32;
      for (const b of osm.buildings) {
        const d = Math.hypot(b.cx - wPos.x, b.cz - wPos.z);
        if (d < bestDist && b.name) {
          bestDist = d;
          bestName = b.name;
        }
      }
    }
    const { lat, lon } = worldToLatLon(cityId, wPos.x, wPos.z);
    setPickedLabel(bestName ? `Near ${bestName}` : 'Custom Map Pin');
    onSelectHome(encodeCustomHomeId(lat, lon));
  };

  return (
    <div className="map-picker-panel">
      <div className="map-picker-header">
        <div>
          <div className="muted-tag">
            INTERACTIVE OSM HOME PICKER · {cityCfg.name.toUpperCase()} ({cityCfg.trafficSide === 'left' ? 'LHT' : 'RHT'})
          </div>
          <h4>Click any building or street on the {cityCfg.name} map to set your Home spawn</h4>
        </div>
        <div className="map-picker-controls">
          <button type="button" className="icon-btn" title="Zoom In" onClick={() => setZoom((z) => Math.min(6, +(z * 1.4).toFixed(2)))}>
            <ZoomIn size={15} />
          </button>
          <button type="button" className="icon-btn" title="Zoom Out" onClick={() => setZoom((z) => Math.max(0.7, +(z / 1.4).toFixed(2)))}>
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Reset View"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, z: 0 });
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="map-picker-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={680}
          height={340}
          className="map-picker-canvas"
          onPointerDown={(e) => {
            dragRef.current = {
              active: true,
              sx: e.clientX,
              sy: e.clientY,
              px: pan.x,
              pz: pan.z,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            if (!dragRef.current.active) return;
            const dx = e.clientX - dragRef.current.sx;
            const dy = e.clientY - dragRef.current.sy;
            if (Math.hypot(dx, dy) > 5) dragRef.current.moved = true;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const spanX = Math.max(400, bounds.maxX - bounds.minX);
            const spanZ = Math.max(400, bounds.maxZ - bounds.minZ);
            const baseScale = Math.min((canvas.width - 36) / spanX, (canvas.height - 36) / spanZ);
            const scale = baseScale * zoom;
            const rect = canvas.getBoundingClientRect();
            const ratioX = canvas.width / rect.width;
            const ratioY = canvas.height / rect.height;
            setPan({
              x: dragRef.current.px - (dx * ratioX) / scale,
              z: dragRef.current.pz - (dy * ratioY) / scale,
            });
          }}
          onPointerUp={(e) => {
            const wasClick = dragRef.current.active && !dragRef.current.moved;
            dragRef.current.active = false;
            if (wasClick) pickAt(e.clientX, e.clientY);
          }}
          onWheel={(e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.2 : 0.83;
            setZoom((z) => Math.max(0.7, Math.min(6, +(z * factor).toFixed(2))));
          }}
        />
        {loading && <div className="map-picker-loading">Streaming OpenStreetMap vector roads...</div>}
        <div className="map-picker-legend">
          <span><i style={{ background: '#f59e0b' }} /> Highways</span>
          <span><i style={{ background: '#94a3b8' }} /> Roads & Buildings</span>
          <span><i style={{ background: '#10b981' }} /> Home Spawn</span>
        </div>
      </div>

      <div className="map-picker-footer">
        <div className="map-coord-readout">
          <Crosshair size={14} />
          <span>
            {activeWorldPoint.isCustom
              ? `Custom Coordinate (${pickedLabel || 'Map Pin'}): ${activeWorldPoint.lat.toFixed(5)}, ${activeWorldPoint.lon.toFixed(5)}`
              : `Preset Home: ${activeWorldPoint.name} (${activeWorldPoint.lat.toFixed(5)}, ${activeWorldPoint.lon.toFixed(5)})`}
          </span>
        </div>
        <div className="chip-wrap">
          {citySummary.homes.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`chip-btn ${selectedHomeId === h.id ? 'active' : ''}`}
              onClick={() => {
                setPickedLabel('');
                onSelectHome(h.id);
              }}
            >
              <Home size={12} /> {h.district}
            </button>
          ))}
          {activeWorldPoint.isCustom && (
            <span className="chip-btn active">
              <MapPin size={12} /> Custom Pin Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
