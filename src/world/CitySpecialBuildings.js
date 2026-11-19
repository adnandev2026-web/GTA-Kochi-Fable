// Builds 3D interactive city structures: Schools, Petrol Pumps, Police Stations,
// Toll Plazas, Neighborhood Homes (highlighting Player's Home), and Global City Landmarks.

import * as THREE from 'three';
import { CITY_POIS } from './layout.js';
import { SIGN_FONT } from '../core/Assets.js';

function makeSignTexture(title, subtitle, bg, fg, accent = '#facc15') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, c.width - 12, c.height - 12);
  ctx.fillStyle = fg;
  ctx.font = `700 34px ${SIGN_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.slice(0, 32), c.width / 2, 58);
  ctx.fillStyle = accent;
  ctx.font = `700 22px ${SIGN_FONT}`;
  ctx.fillText(subtitle.slice(0, 40), c.width / 2, 114);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class CitySpecialBuildings {
  constructor(world) {
    this.world = world;
    this.group = new THREE.Group();
    this.group.name = 'city-special-buildings';
    this.beacons = [];
    this._geos = [];
    this._mats = [];
    this._texs = [];
  }

  _geo(g) {
    this._geos.push(g);
    return g;
  }

  _mat(opts) {
    const m = new THREE.MeshStandardMaterial(opts);
    this._mats.push(m);
    return m;
  }

  _signBoard(title, subtitle, bg, fg, accent, w = 8, h = 2.5) {
    const tex = makeSignTexture(title, subtitle, bg, fg, accent);
    this._texs.push(tex);
    const mat = this._mat({ map: tex, roughness: 0.45, metalness: 0.05 });
    const mesh = new THREE.Mesh(this._geo(new THREE.PlaneGeometry(w, h)), mat);
    return mesh;
  }

  _addBox(parent, w, h, d, x, y, z, color, rough = 0.72, metal = 0.08, emissive = null) {
    const mat = this._mat({
      color,
      roughness: rough,
      metalness: metal,
      ...(emissive ? { emissive, emissiveIntensity: 0.9 } : {}),
    });
    const m = new THREE.Mesh(this._geo(new THREE.BoxGeometry(w, h, d)), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  build() {
    this._buildSchools();
    this._buildPetrolPumps();
    this._buildPoliceStations();
    this._buildTollGates();
    this._buildHomes();
    this._buildSignatureLandmarks();
    return this.group;
  }

  _buildSchools() {
    const colliders = this.world.colliders;
    for (const s of CITY_POIS.schools || []) {
      const g = new THREE.Group();
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.rot || 0;

      // Paved yard
      this._addBox(g, 38, 0.14, 30, 0, 0.07, 0, 0xcbd5e1, 0.9, 0.02);
      // Main campus block (warm yellow & cream)
      this._addBox(g, 28, 9, 14, 0, 4.5, -4, 0xfef08a, 0.75);
      this._addBox(g, 29, 0.9, 15, 0, 9.45, -4, 0x991b1b, 0.65);
      // Clock/entrance portico
      this._addBox(g, 7, 10.5, 4, 0, 5.25, 4, 0xfde047, 0.7);
      this._addBox(g, 7.6, 0.7, 4.6, 0, 10.8, 4, 0x7f1d1d, 0.65);

      const tr = CITY_POIS.signTranslations || {};
      const sign = this._signBoard(s.name, tr.schoolZone || 'SCHOOL ZONE · 30 KM/H', '#eab308', '#111827', '#b91c1c', 11, 3.2);
      sign.position.set(0, 7.8, 6.1);
      g.add(sign);

      this.group.add(g);
      colliders.addBox(s.x, s.z, 14.5, 9, s.rot || 0, 0, 11, 'school');
    }
  }

  _buildPetrolPumps() {
    const colliders = this.world.colliders;
    for (const p of CITY_POIS.petrolPumps || []) {
      const g = new THREE.Group();
      g.position.set(p.x, 0, p.z);
      g.rotation.y = p.rot || 0;

      // Forecourt concrete pad
      this._addBox(g, 26, 0.16, 20, 0, 0.08, 0, 0x475569, 0.85);
      // Canopy pillars
      for (const sx of [-7, 7]) {
        for (const sz of [-4.5, 4.5]) {
          this._addBox(g, 0.7, 5.6, 0.7, sx, 2.8, sz, 0xe2e8f0, 0.4, 0.5);
          colliders.addCircle(p.x + sx, p.z + sz, 0.55, 0, 6, 'fuel-pillar');
        }
      }
      // Canopy fascia
      this._addBox(g, 20, 1.3, 13, 0, 6.2, 0, 0xdc2626, 0.45, 0.25);
      this._addBox(g, 20.3, 0.45, 13.3, 0, 6.9, 0, 0xfacc15, 0.4, 0.2);

      // Fuel dispenser islands
      for (const ix of [-3.5, 3.5]) {
        this._addBox(g, 2.2, 0.25, 1.2, ix, 0.28, 0, 0xf1f5f9, 0.7);
        this._addBox(g, 1.1, 1.7, 0.6, ix, 1.1, 0, 0xef4444, 0.35, 0.3);
        this._addBox(g, 0.9, 0.5, 0.65, ix, 1.65, 0, 0x38bdf8, 0.2, 0.1, 0x38bdf8);
      }

      // Attendant booth
      this._addBox(g, 7, 3.8, 4.5, 0, 1.9, -7.2, 0xf8fafc, 0.6);
      const tr = CITY_POIS.signTranslations || {};
      const sign = this._signBoard(p.name, tr.petrolPump || '24H PETROL PUMP · $30 REFUEL', '#991b1b', '#ffffff', '#facc15', 11, 2.8);
      sign.position.set(0, 6.3, 6.6);
      g.add(sign);

      this.group.add(g);
    }
  }

  _buildPoliceStations() {
    const colliders = this.world.colliders;
    for (const p of CITY_POIS.policeStations || []) {
      const g = new THREE.Group();
      g.position.set(p.x, 0, p.z);
      g.rotation.y = p.rot || 0;

      // Compound courtyard
      this._addBox(g, 30, 0.14, 24, 0, 0.07, 0, 0x94a3b8, 0.9);
      // Main station building
      this._addBox(g, 22, 8.5, 13, 0, 4.25, -3, 0xf1f5f9, 0.65);
      this._addBox(g, 22.4, 1.2, 13.4, 0, 8.8, -3, 0x1d4ed8, 0.45, 0.2);
      // Police blue & red rooftop strobe beacons
      const redBeacon = this._addBox(g, 1.6, 0.7, 1.0, -3.5, 9.75, 2.8, 0xef4444, 0.2, 0.2, 0xef4444);
      const blueBeacon = this._addBox(g, 1.6, 0.7, 1.0, 3.5, 9.75, 2.8, 0x3b82f6, 0.2, 0.2, 0x3b82f6);
      this.beacons.push(redBeacon, blueBeacon);

      const tr = CITY_POIS.signTranslations || {};
      const sign = this._signBoard(p.name, tr.policeStation || 'POLICE STATION · OBEY SPEED LIMIT', '#1e3a8a', '#ffffff', '#60a5fa', 11.5, 3.0);
      sign.position.set(0, 6.4, 3.6);
      g.add(sign);

      this.group.add(g);
      colliders.addBox(p.x, p.z, 11.5, 7, p.rot || 0, 0, 10, 'police-station');
    }
  }

  _buildTollGates() {
    const colliders = this.world.colliders;
    for (const t of CITY_POIS.tollGates || []) {
      const g = new THREE.Group();
      g.position.set(t.x, 0, t.z);
      g.rotation.y = t.heading || 0;

      // Wide side booths leaving clear driving lanes in the middle (-12..12)
      for (const sx of [-16, 16]) {
        this._addBox(g, 3.2, 4.2, 5.5, sx, 2.1, 0, 0xe2e8f0, 0.55);
        this._addBox(g, 3.4, 0.6, 5.7, sx, 4.4, 0, 0xf59e0b, 0.45);
        colliders.addCircle(t.x + sx, t.z, 2.2, 0, 5, 'toll-booth');
      }
      // Overhead steel gantry spanning the road
      this._addBox(g, 36, 1.8, 4.2, 0, 6.2, 0, 0x0f172a, 0.45, 0.5);
      this._addBox(g, 36.2, 0.45, 4.4, 0, 7.2, 0, 0xfacc15, 0.35, 0.2, 0xfacc15);

      const tr = CITY_POIS.signTranslations || {};
      const tollSub = `${tr.tollPlaza || 'TOLL PLAZA'} · $${t.fee || 40}`;
      const frontSign = this._signBoard(t.name, tollSub, '#0f172a', '#ffffff', '#facc15', 14, 2.6);
      frontSign.position.set(0, 6.2, 2.15);
      g.add(frontSign);

      const backSign = this._signBoard(t.name, tollSub, '#0f172a', '#ffffff', '#facc15', 14, 2.6);
      backSign.position.set(0, 6.2, -2.15);
      backSign.rotation.y = Math.PI;
      g.add(backSign);

      this.group.add(g);
    }
  }

  _buildHomes() {
    const colliders = this.world.colliders;
    const selectedId = CITY_POIS.selectedHomeId;
    for (const h of CITY_POIS.homes || []) {
      const isPlayerHome = h.id === selectedId;
      const g = new THREE.Group();
      // Place house slightly behind spawn driveway so spawn point (h.x, h.z) is on the front lawn/driveway
      const fwdX = Math.sin(h.heading || 0);
      const fwdZ = Math.cos(h.heading || 0);
      const bx = h.x - fwdX * 14;
      const bz = h.z - fwdZ * 14;
      g.position.set(bx, 0, bz);
      g.rotation.y = h.heading || 0;

      // Driveway & yard
      this._addBox(g, 20, 0.14, 18, 0, 0.07, 4, 0xd6d3d1, 0.9);
      // Villa body
      this._addBox(g, 14, 5.8, 10, 0, 2.9, -2, isPlayerHome ? 0xfef3c7 : 0xf1f5f9, 0.72);
      // Upper balcony floor
      this._addBox(g, 10, 3.6, 8, -1.5, 7.6, -2.5, isPlayerHome ? 0xfde68a : 0xe2e8f0, 0.7);
      // Terracotta / Slate pitched roof
      this._addBox(g, 15.2, 0.8, 11.2, 0, 6.1, -2, isPlayerHome ? 0xb45309 : 0x475569, 0.65);
      this._addBox(g, 11.2, 0.9, 9.2, -1.5, 9.7, -2.5, isPlayerHome ? 0x9a3412 : 0x334155, 0.65);
      // Porch columns
      for (const px of [-3, 3]) {
        this._addBox(g, 0.55, 4.2, 0.55, px, 2.1, 3.6, 0xffffff, 0.6);
      }

      if (isPlayerHome) {
        const tr = CITY_POIS.signTranslations || {};
        const sign = this._signBoard(tr.yourHome || 'YOUR HOME', h.name.toUpperCase(), '#065f46', '#ffffff', '#34d399', 9.5, 2.5);
        sign.position.set(0, 6.4, 3.3);
        g.add(sign);

        // Glowing home waypoint pillar at the side of driveway
        const beaconMat = this._mat({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 1.4,
          transparent: true,
          opacity: 0.42,
        });
        const beacon = new THREE.Mesh(this._geo(new THREE.CylinderGeometry(0.9, 0.9, 14, 16, 1, true)), beaconMat);
        beacon.position.set(6.5, 7, 7);
        g.add(beacon);
      } else {
        const sign = this._signBoard(h.name, h.district.toUpperCase(), '#334155', '#f8fafc', '#94a3b8', 8, 2.1);
        sign.position.set(0, 5.2, 3.2);
        g.add(sign);
      }

      this.group.add(g);
      colliders.addBox(bx, bz, 7.2, 5.2, h.heading || 0, 0, 10, 'home');
    }
  }

  _buildSignatureLandmarks() {
    const colliders = this.world.colliders;
    for (const lm of CITY_POIS.signatureLandmarks || []) {
      const g = new THREE.Group();
      g.position.set(lm.x, 0, lm.z);

      // Plaza base
      this._addBox(g, 74, 0.25, 74, 0, 0.12, 0, 0xd4d4d8, 0.85);

      if (lm.kind === 'burj') {
        // Stepped Y-wing silver-glass megatower
        const tiers = [
          [26, 26, 28],
          [20, 32, 20],
          [14, 38, 14],
          [9, 42, 9],
          [4.5, 34, 4.5],
          [1.4, 24, 1.4],
        ];
        let y = 0;
        for (const [w, h, d] of tiers) {
          this._addBox(g, w, h, d, 0, y + h / 2, 0, 0xcbd5e1, 0.22, 0.82);
          y += h;
        }
        this._addBox(g, 0.6, 14, 0.6, 0, y + 7, 0, 0xfef08a, 0.1, 0.9, 0xfef08a);
      } else if (lm.kind === 'clocktower') {
        // Big Ben Elizabeth Tower
        this._addBox(g, 16, 62, 16, 0, 31, 0, 0xd6b88d, 0.72);
        this._addBox(g, 18, 14, 18, 0, 69, 0, 0xca8a04, 0.55);
        for (const [cx, cz] of [[0, 9.2], [0, -9.2], [9.2, 0], [-9.2, 0]]) {
          this._addBox(g, cx === 0 ? 10 : 0.4, 10, cz === 0 ? 10 : 0.4, cx, 69, cz, 0xfef9c3, 0.2, 0.1, 0xfef08a);
        }
        const roof = new THREE.Mesh(this._geo(new THREE.ConeGeometry(12.5, 22, 4)), this._mat({ color: 0x334155, roughness: 0.6 }));
        roof.position.set(0, 87, 0);
        roof.rotation.y = Math.PI / 4;
        g.add(roof);
      } else if (lm.kind === 'tokyotower') {
        // Red & white tapered lattice tower
        const segs = [
          [24, 34, 0xef4444],
          [17, 28, 0xffffff],
          [12, 26, 0xef4444],
          [8, 22, 0xffffff],
          [4, 26, 0xef4444],
        ];
        let y = 0;
        for (const [w, h, col] of segs) {
          this._addBox(g, w, h, w, 0, y + h / 2, 0, col, 0.4, 0.4);
          y += h;
        }
        this._addBox(g, 20, 6, 20, 0, 48, 0, 0xf8fafc, 0.3, 0.6);
      } else if (lm.kind === 'lighthouse') {
        // Tall red & white striped lighthouse
        let y = 0;
        for (let i = 0; i < 6; i++) {
          const r = 7 - i * 0.6;
          const mesh = new THREE.Mesh(
            this._geo(new THREE.CylinderGeometry(r - 0.5, r, 10, 18)),
            this._mat({ color: i % 2 === 0 ? 0xf8fafc : 0xdc2626, roughness: 0.5 }),
          );
          mesh.position.set(0, y + 5, 0);
          mesh.castShadow = true;
          g.add(mesh);
          y += 10;
        }
        this._addBox(g, 6, 5, 6, 0, y + 2.5, 0, 0xfef08a, 0.2, 0.1, 0xfacc15);
      } else if (lm.kind === 'frame') {
        // Dubai Frame
        this._addBox(g, 8, 72, 10, -20, 36, 0, 0xf59e0b, 0.25, 0.85);
        this._addBox(g, 8, 72, 10, 20, 36, 0, 0xf59e0b, 0.25, 0.85);
        this._addBox(g, 50, 10, 12, 0, 74, 0, 0xfbbf24, 0.25, 0.85);
      } else if (lm.kind === 'dome') {
        // Secretariat / Heritage dome palace
        this._addBox(g, 48, 18, 28, 0, 9, 0, 0xf8fafc, 0.72);
        this._addBox(g, 26, 26, 22, 0, 13, 0, 0xfef3c7, 0.68);
        const dome = new THREE.Mesh(this._geo(new THREE.SphereGeometry(11, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2)), this._mat({ color: 0xb45309, roughness: 0.45, metalness: 0.35 }));
        dome.position.set(0, 26, 0);
        g.add(dome);
      } else if (lm.kind === 'neon') {
        // Shibuya / Times Square media tower
        this._addBox(g, 34, 58, 30, 0, 29, 0, 0x0f172a, 0.25, 0.75);
        this._addBox(g, 28, 16, 30.6, 0, 24, 0, 0x38bdf8, 0.2, 0.2, 0x0ea5e9);
        this._addBox(g, 28, 14, 30.6, 0, 44, 0, 0xf43f5e, 0.2, 0.2, 0xe11d48);
      } else if (lm.kind === 'arch' || lm.kind === 'bazaar') {
        // Kerala valley arch / bazaar hall
        this._addBox(g, 44, 12, 24, 0, 6, 0, 0xfef3c7, 0.75);
        this._addBox(g, 46, 1.4, 26, 0, 12.7, 0, 0x991b1b, 0.65);
        this._addBox(g, 14, 16, 14, 0, 8, 0, 0xfde68a, 0.7);
      } else {
        // Modern stepped skyscraper / plaza
        this._addBox(g, 32, 64, 32, 0, 32, 0, 0x64748b, 0.25, 0.75);
        this._addBox(g, 20, 32, 20, 0, 80, 0, 0x94a3b8, 0.22, 0.8);
        this._addBox(g, 4, 24, 4, 0, 108, 0, 0xe2e8f0, 0.2, 0.85);
      }

      const sign = this._signBoard(lm.name, 'CITY LANDMARK', '#0f172a', '#ffffff', '#38bdf8', 18, 4.2);
      sign.position.set(0, 14, 28);
      g.add(sign);

      this.group.add(g);
      colliders.addBox(lm.x, lm.z, (lm.hx || 36) * 0.55, (lm.hz || 36) * 0.55, 0, 0, 100, lm.id);
    }
  }

  update(time) {
    if (!this.beacons.length) return;
    const redOn = Math.sin(time * 9) > 0;
    for (let i = 0; i < this.beacons.length; i += 2) {
      const r = this.beacons[i];
      const b = this.beacons[i + 1];
      if (r) r.material.emissiveIntensity = redOn ? 2.2 : 0.25;
      if (b) b.material.emissiveIntensity = redOn ? 0.25 : 2.2;
    }
  }

  dispose() {
    for (const g of this._geos) g.dispose();
    for (const m of this._mats) m.dispose();
    for (const t of this._texs) t.dispose();
  }
}
