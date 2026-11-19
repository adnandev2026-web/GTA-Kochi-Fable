// Heads-up display: minimap, speedometer, interaction prompt, district banner, big map, POIs & multiplayer blips.

import { WORLD, ZONES, LANDMARKS, NODES, CITY_POIS } from '../world/layout.js';
import { SURF } from '../world/SurfaceMap.js';
import { SIGN_FONT } from '../core/Assets.js';

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor(game) {
    this.game = game;
    this.el = {
      hud: $('hud'),
      zone: $('zone'),
      zoneMl: $('zone-ml'),
      zoneEn: $('zone-en'),
      zoneRoad: $('zone-road'),
      speedo: $('speedo'),
      speed: $('speed-value'),
      fill: $('speedo-fill'),
      gear: $('gear'),
      vname: $('vehicle-name'),
      prompt: $('prompt'),
      promptText: $('prompt-text'),
      toast: $('toast'),
      controls: $('controls'),
      foot: $('controls-foot'),
      drive: $('controls-drive'),
      fps: $('fps'),
      minimap: $('minimap'),
      compass: $('compass'),
      bigmap: $('bigmap'),
      bigCanvas: $('bigmap-canvas'),
    };
    this.zoneName = '';
    this.zoneTimer = 0;
    this.toastTimer = 0;
    this.promptShown = null;
    this.frames = 0;
    this.fpsTime = 0;
    this.mapOpen = false;
    this.mini = this.el.minimap.getContext('2d');
    this.arc = 377;
    this._lastSpeed = -1;
    this._buildMap();
    this._onBigClick = (e) => this._mapClick(e);
    this.el.bigCanvas.addEventListener('click', this._onBigClick);
  }

  toMap(x, z) {
    return [(x - this.mapMinX) * this.mapScale, (z - this.mapMinZ) * this.mapScale];
  }

  _collectPois() {
    const list = [];
    const home = (CITY_POIS.homes || []).find((h) => h.id === CITY_POIS.selectedHomeId) || CITY_POIS.homes?.[0];
    if (home) {
      list.push({ key: 'home', label: 'Your Home', icon: '🏠', color: '#10b981', worldX: home.x, worldZ: home.z });
    }
    for (const [key, lm] of Object.entries(LANDMARKS)) {
      list.push({ key, label: lm.name, icon: '★', color: '#ffd34d', worldX: lm.p[0], worldZ: lm.p[1] });
    }
    for (const s of CITY_POIS.schools || []) {
      list.push({ key: s.id, label: s.name, icon: 'S', color: '#facc15', worldX: s.x, worldZ: s.z });
    }
    for (const p of CITY_POIS.petrolPumps || []) {
      list.push({ key: p.id, label: p.name, icon: 'P', color: '#ef4444', worldX: p.x, worldZ: p.z });
    }
    for (const pol of CITY_POIS.policeStations || []) {
      list.push({ key: pol.id, label: pol.name, icon: '🚓', color: '#3b82f6', worldX: pol.x, worldZ: pol.z });
    }
    for (const t of CITY_POIS.tollGates || []) {
      list.push({ key: t.id, label: t.name, icon: '$', color: '#f97316', worldX: t.x, worldZ: t.z });
    }
    return list;
  }

  _buildMap() {
    const world = this.game.world;
    const s = world.surface;
    this.mapMinX = s.minX;
    this.mapMinZ = s.minZ;
    const spanX = s.w * (s.cell || 1);
    const spanZ = s.h * (s.cell || 1);
    this.mapScale = Math.min(0.5, 1400 / Math.max(spanX, spanZ));
    const w = Math.max(320, Math.ceil(spanX * this.mapScale));
    const h = Math.max(320, Math.ceil(spanZ * this.mapScale));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const colours = {
      [SURF.LAND]: [38, 56, 44],
      [SURF.VERGE]: [42, 60, 47],
      [SURF.ROAD]: [92, 96, 100],
      [SURF.SIDEWALK]: [120, 112, 104],
      [SURF.MEDIAN]: [70, 92, 66],
      [SURF.PAVED]: [104, 100, 94],
      [SURF.BUILDING]: [74, 80, 84],
      [SURF.RESERVED]: [60, 76, 66],
      [SURF.OPEN]: [46, 70, 50],
    };
    const water = [36, 78, 98];
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const x = s.minX + (i + 0.5) / this.mapScale;
        const z = s.minZ + (j + 0.5) / this.mapScale;
        const t = s.typeAt(x, z);
        let col = colours[t] || colours[SURF.LAND];
        if ((t === SURF.LAND || t === SURF.VERGE || t === SURF.RESERVED) && world.terrain.waterDistance(x, z) < 0) col = water;
        const k = (j * w + i) * 4;
        img.data[k] = col[0];
        img.data[k + 1] = col[1];
        img.data[k + 2] = col[2];
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    const stroke = (pts, width, colour, dash = null) => {
      ctx.beginPath();
      pts.forEach((p, i) => {
        const [x, y] = this.toMap(p[0], p[1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineWidth = width;
      ctx.strokeStyle = colour;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(dash || []);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    const widths = { highway: 13, arterial: 7.5, street: 4 };
    const fills = { highway: '#f0c95a', arterial: '#e9e9e4', street: '#c9c9c4' };
    for (const pass of [0, 1]) {
      for (const e of world.roads.edges) {
        const pts = e.samples.map((p) => [p.x, p.z]);
        if (pass === 0) stroke(pts, widths[e.cls] + 3, 'rgba(10,14,16,0.75)');
        else stroke(pts, widths[e.cls], fills[e.cls]);
      }
    }
    for (const f of world.roads.flyovers) {
      const pts = f.samples.filter((p) => p.h > 1.5).map((p) => [p.x, p.z]);
      stroke(pts, 9.5, 'rgba(10,14,16,0.85)');
      stroke(pts, 6.5, '#ffe9a6');
    }
    if (world.metro) {
      for (const line of world.metro.lines) {
        const pts = line.path.map((p) => [p.x, p.z]);
        stroke(pts, 4.5, 'rgba(0,0,0,0.6)');
        stroke(pts, 2.6, '#2fd6cf');
        for (const st of line.stations) {
          const [x, y] = this.toMap(st.x, st.z);
          ctx.fillStyle = '#0a2a2a';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2fd6cf';
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    this.mapBase = c;

    const big = document.createElement('canvas');
    big.width = w;
    big.height = h;
    const b = big.getContext('2d');
    b.drawImage(c, 0, 0);
    b.textAlign = 'center';
    b.textBaseline = 'middle';
    for (const z of ZONES) {
      const [x, y] = this.toMap(z.p[0], z.p[1]);
      b.font = `700 13px ${SIGN_FONT}`;
      b.lineWidth = 4;
      b.strokeStyle = 'rgba(0,0,0,0.75)';
      b.fillStyle = 'rgba(255,255,255,0.86)';
      b.strokeText(z.name, x + 36, y - 24);
      b.fillText(z.name, x + 36, y - 24);
    }
    this.poiHits = [];
    for (const p of this._collectPois()) {
      const [x, y] = this.toMap(p.worldX, p.worldZ);
      b.fillStyle = p.color;
      b.strokeStyle = '#111';
      b.lineWidth = 2.5;
      b.beginPath();
      b.arc(x, y, 10, 0, Math.PI * 2);
      b.fill();
      b.stroke();
      b.font = 'bold 11px sans-serif';
      b.fillStyle = '#111';
      b.fillText(p.icon, x, y + 1);
      b.font = `700 13px ${SIGN_FONT}`;
      b.lineWidth = 4;
      b.strokeStyle = 'rgba(0,0,0,0.88)';
      b.fillStyle = p.color;
      b.strokeText(p.label, x, y + 20);
      b.fillText(p.label, x, y + 20);
      this.poiHits.push({ x, y, key: p.key, label: p.label, color: p.color, worldX: p.worldX, worldZ: p.worldZ });
    }
    for (const id in NODES) {
      const n = NODES[id];
      if (!n.toward) continue;
      const [x, y] = this.toMap(n.p[0], n.p[1]);
      b.font = `700 11px ${SIGN_FONT}`;
      b.lineWidth = 3;
      b.strokeStyle = 'rgba(0,0,0,0.8)';
      b.fillStyle = 'rgba(190,230,255,0.9)';
      const tx = Math.max(85, Math.min(w - 85, x));
      const ty = Math.max(14, Math.min(h - 14, y));
      b.strokeText(`→ ${n.toward}`, tx, ty);
      b.fillText(`→ ${n.toward}`, tx, ty);
    }
    this.mapBig = big;
    this.el.bigCanvas.width = w;
    this.el.bigCanvas.height = h;
  }

  rebuildMap() {
    this._buildMap();
  }

  _drawMinimap(px, pz, yaw, heading) {
    const ctx = this.mini;
    const size = this.el.minimap.width;
    const zoom = this.game.player.vehicle ? 1.35 : 1.9;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1d2a26';
    ctx.fillRect(0, 0, size, size);
    const [mx, my] = this.toMap(px, pz);
    ctx.translate(size / 2, size / 2);
    ctx.rotate(yaw - Math.PI);
    ctx.scale(zoom, zoom);
    ctx.translate(-mx, -my);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.mapBase, 0, 0);

    for (const p of this.poiHits) {
      ctx.fillStyle = p.color || '#ffd34d';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.key === 'home' ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const traffic = this.game.traffic;
    if (traffic) {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      for (const v of traffic.active) {
        const [x, y] = this.toMap(v.x, v.z);
        ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
      }
    }

    // Multiplayer peers in bright cyan
    const peers = this.game.multiplayer?.peers;
    if (peers) {
      for (const peer of peers.values()) {
        const [x, y] = this.toMap(peer.pos.x, peer.pos.z);
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(size / 2, size / 2);
    ctx.rotate(yaw - Math.PI - heading + Math.PI);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(7.5, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-7.5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.el.compass.style.transform = `rotate(${yaw - Math.PI}rad)`;
  }

  toggleMap(force) {
    this.mapOpen = force ?? !this.mapOpen;
    this.el.bigmap.classList.toggle('hidden', !this.mapOpen);
    if (this.mapOpen) this._drawBigMap();
    return this.mapOpen;
  }

  _drawBigMap() {
    const ctx = this.el.bigCanvas.getContext('2d');
    ctx.drawImage(this.mapBig, 0, 0);

    // Draw remote multiplayer players
    const peers = this.game.multiplayer?.peers;
    if (peers) {
      for (const peer of peers.values()) {
        const [px, py] = this.toMap(peer.pos.x, peer.pos.z);
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    const p = this.game.player.pos;
    const [x, y] = this.toMap(p.x, p.z);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#d22';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  _mapClick(e) {
    const r = this.el.bigCanvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * this.el.bigCanvas.width;
    const y = ((e.clientY - r.top) / r.height) * this.el.bigCanvas.height;
    let best = null;
    let bd = 60;
    for (const p of this.poiHits) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    if (best) {
      this.game.fastTravel(best);
      this.toggleMap(false);
    } else {
      const worldX = this.mapMinX + x / this.mapScale;
      const worldZ = this.mapMinZ + y / this.mapScale;
      this.game.fastTravel({ label: 'Selected Coordinate', worldX, worldZ });
      this.toggleMap(false);
    }
  }

  prompt(text) {
    if (text === this.promptShown) return;
    this.promptShown = text;
    this.el.prompt.classList.toggle('hidden', !text);
    if (text) this.el.promptText.textContent = text;
  }

  toast(text, seconds = 3) {
    this.el.toast.textContent = text;
    this.el.toast.classList.remove('hidden');
    this.toastTimer = seconds;
  }

  setDriving(vehicle) {
    this.el.speedo.classList.toggle('hidden', !vehicle);
    this.el.foot.classList.toggle('hidden', !!vehicle);
    this.el.drive.classList.toggle('hidden', !vehicle);
    if (vehicle) this.el.vname.textContent = vehicle.spec.label;
    this._lastSpeed = -1;
  }

  toggleControls() {
    this.el.controls.classList.toggle('faded');
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    const v = p.vehicle;
    if (v) {
      const kmh = Math.round(v.kmh);
      if (kmh !== this._lastSpeed) {
        this._lastSpeed = kmh;
        this.el.speed.textContent = kmh;
        const f = Math.min(1, kmh / (v.spec.top * 3.6 * 1.02));
        this.el.fill.style.strokeDashoffset = String(this.arc * (1 - f));
        this.el.fill.style.stroke = f > 0.85 ? '#ff6b4a' : '#ffd34d';
      }
      const gear = v.vf < -0.3 ? 'R' : Math.abs(v.vf) < 0.3 ? 'N' : String(Math.min(5, 1 + Math.floor((Math.abs(v.vf) / v.spec.top) * 5)));
      if (gear !== this._gear) {
        this._gear = gear;
        this.el.gear.textContent = gear;
      }
    }

    let zone = null;
    let best = Infinity;
    for (const z of ZONES) {
      const d = Math.hypot(p.pos.x - z.p[0], p.pos.z - z.p[1]) / z.r;
      if (d < 1 && d < best) {
        best = d;
        zone = z;
      }
    }
    if (zone && zone.name !== this.zoneName) {
      this.zoneName = zone.name;
      this.el.zoneMl.textContent = zone.ml;
      this.el.zoneEn.textContent = zone.name;
      this.zoneTimer = 5.5;
      this.el.zone.classList.add('show');
    }
    const road = g.currentRoadName?.() || '';
    if (road !== this._road) {
      this._road = road;
      this.el.zoneRoad.textContent = road;
      if (road && this.zoneTimer < 2.5) {
        this.zoneTimer = 3.5;
        this.el.zone.classList.add('show');
      }
    }
    if (this.zoneTimer > 0) {
      this.zoneTimer -= dt;
      if (this.zoneTimer <= 0) this.el.zone.classList.remove('show');
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.el.toast.classList.add('hidden');
    }

    this._drawMinimap(p.pos.x, p.pos.z, g.cameraController.yaw + (v ? g.cameraController.lookYaw : 0), p.heading);
    if (this.mapOpen) this._drawBigMap();

    this.frames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 0.5) {
      const fps = Math.round(this.frames / this.fpsTime);
      const info = g.renderer.info.render;
      this.el.fps.textContent = `${fps} fps · ${info.calls} calls · ${(info.triangles / 1000).toFixed(0)}k tris`;
      this.frames = 0;
      this.fpsTime = 0;
    }
  }

  dispose() {
    this.el.bigCanvas?.removeEventListener('click', this._onBigClick);
    this.el.hud?.classList.add('hidden');
    this.el.bigmap?.classList.add('hidden');
  }
}

export { WORLD };
