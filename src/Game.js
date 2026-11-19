// Game bootstrap, dynamic city launcher, economy events (playtime rewards, fines, tolls, fuel), and multiplayer sync.

import * as THREE from 'three';
import { chooseQuality } from './core/Quality.js';
import { RenderPipeline } from './core/RenderPipeline.js';
import { Assets } from './core/Assets.js';
import { Input } from './core/Input.js';
import { CameraController } from './core/CameraController.js';
import { AudioManager } from './core/AudioManager.js';
import { World } from './world/World.js';
import { setActiveCityLayout, applyOsmLayout, SPAWN, WORLD, LANDMARKS, NODES, EXIT_BUFFER, CITY_POIS } from './world/layout.js';
import { fetchCityOsmApi } from './lib/api.ts';
import { getCityConfig } from './config/cityConfigs.ts';
import { WeaponSystem } from './combat/WeaponSystem.js';
import { VehicleRenderer } from './entities/vehicles/VehicleRenderer.js';
import { VehicleManager } from './entities/VehicleManager.js';
import { Player } from './entities/Player.js';
import { Traffic } from './entities/Traffic.js';
import { Pedestrians } from './entities/Pedestrians.js';
import { MultiplayerManager } from './entities/MultiplayerManager.js';
import { HUD } from './ui/HUD.js';
import { clamp, saturate } from './utils/math.js';

const nextFrame = () =>
  new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    requestAnimationFrame(finish);
    setTimeout(finish, 60);
  });

export class Game {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = {
      cityId: config.cityId || 'kochi',
      homeId: config.homeId || '',
      vehicleId: config.vehicleId || 'hatchback',
      ownedVehicles: config.ownedVehicles || ['hatchback', 'scooter', 'auto'],
      appearance: config.appearance || null,
      playerName: config.playerName || 'Explorer',
      deviceMode: config.deviceMode || 'desktop',
      multiplayerEnabled: config.multiplayerEnabled !== false,
      roomCode: config.roomCode || 'GLOBAL',
      roomName: config.roomName || '',
      roomIsPrivate: Boolean(config.roomIsPrivate),
      uid: config.uid || 'guest',
      onMoneyEvent: config.onMoneyEvent || (() => {}),
      onPeersChange: config.onPeersChange || (() => {}),
      onChatMessage: config.onChatMessage || (() => {}),
      onWeaponChange: config.onWeaponChange || (() => {}),
      onToggleWeaponWheel: config.onToggleWeaponWheel || (() => {}),
      onVoiceStatus: config.onVoiceStatus || (() => {}),
      onReady: config.onReady || (() => {}),
    };

    this.params = new URLSearchParams(location.search);
    this.quality = chooseQuality();
    this.pipeline = new RenderPipeline(canvas, this.quality);
    this.renderer = this.pipeline.renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.25, this.quality.drawDistance);
    this.timer = new THREE.Timer();
    this.time = 0;
    this.running = false;
    this.paused = false;
    this._disposed = false;
    this.input = new Input(canvas);
    this.input.setDeviceMode(this.config.deviceMode);
    this.audio = new AudioManager();
    this._obstacles = [];
    this._pool = [];
    this._poolUsed = 0;
    this._nearby = [];

    // Economy timers & cooldown maps
    this._playBonusAccum = 0;
    this._zoneCooldowns = new Map();
    this._crashFineCooldown = 0;
  }

  async start() {
    const cityCfg = getCityConfig(this.config.cityId);

    const loading = document.getElementById('loading');
    const bar = document.getElementById('bar-fill');
    const status = document.getElementById('loading-status');
    const loadingTitle = document.getElementById('loading-title');
    const loadingMl = document.getElementById('loading-ml');
    const loadingSub = document.getElementById('loading-sub');
    const startBtn = document.getElementById('start');

    if (loading) loading.classList.remove('hidden', 'fade');
    if (startBtn) startBtn.classList.add('hidden');
    if (loadingTitle) loadingTitle.textContent = (cityCfg.name || 'KOCHI').toUpperCase();
    if (loadingMl) loadingMl.textContent = cityCfg.localName || '';
    if (loadingSub) loadingSub.textContent = `Streaming ${cityCfg.regionLabel} · OpenStreetMap Roads & Buildings`;

    const setProgress = (p, label) => {
      if (bar) bar.style.width = `${Math.round(p * 100)}%`;
      if (status && label) status.textContent = label;
    };

    setProgress(0.05, `Fetching OpenStreetMap data for ${cityCfg.name}...`);
    let osmData = null;
    if (this.config.cityId !== 'kochi') {
      osmData = await Promise.race([
        fetchCityOsmApi(this.config.cityId)
          .then((r) => r?.osm || null)
          .catch(() => null),
        new Promise((resolve) => setTimeout(() => resolve(null), 6500)),
      ]);
    }
    if (this._disposed) return;

    applyOsmLayout(this.config.cityId, this.config.homeId, osmData);
    this.focus = new THREE.Vector3(SPAWN.p[0], 0, SPAWN.p[1]);
    if (loadingSub) {
      const roadCount = osmData?.edges?.length || 0;
      loadingSub.textContent = roadCount > 4
        ? `${cityCfg.name} · ${roadCount} OSM Roads · Bilingual Signage · Real Spawn`
        : `${cityCfg.name} · Homes · Schools · Petrol · Police · Tolls`;
    }

    this.assets = new Assets(this.renderer, this.quality);
    await this.assets.load((p, label) => setProgress(0.08 + p * 0.34, `Loading ${label}`));
    if (this._disposed) return;

    this.world = new World(this.scene, this.renderer, this.assets, this.quality, this);
    const steps = [...this.world.steps()];
    for (let i = 0; i < steps.length; i++) {
      if (this._disposed) return;
      const [label, fn] = steps[i];
      setProgress(0.4 + (i / steps.length) * 0.5, label);
      await nextFrame();
      await fn();
    }
    if (this._disposed) return;

    setProgress(0.92, 'Parking your vehicles at Home');
    await nextFrame();
    this.vehicles = new VehicleRenderer(this.scene, this.assets);
    this.vehicleManager = new VehicleManager(this);

    const home = (CITY_POIS.homes || []).find((h) => h.id === CITY_POIS.selectedHomeId) || CITY_POIS.homes?.[0];
    const spawnX = home ? home.x : SPAWN.p[0];
    const spawnZ = home ? home.z : SPAWN.p[1];
    const spawnHeading = home ? home.heading : SPAWN.heading;
    this.spawn = { x: spawnX, z: spawnZ, heading: spawnHeading };

    this.player = new Player(this, spawnX, spawnZ, spawnHeading);
    if (this.config.appearance) {
      this.player.character.applyAppearance(this.config.appearance);
    }

    this.cameraController = new CameraController(this.camera, this);
    this.cameraController.snapBehind(spawnHeading);
    this.cameraController.pitch = -0.08;
    this.weaponSystem = new WeaponSystem(this);

    await this.world.populate(this, this.config.vehicleId, this.config.ownedVehicles);
    this.traffic = new Traffic(this);
    this.traffic.populate(this.player.pos);
    this.pedestrians = new Pedestrians(this);
    this.hud = new HUD(this);

    this.multiplayer = new MultiplayerManager(this, {
      enabled: this.config.multiplayerEnabled,
      cityId: this.config.cityId,
      roomCode: this.config.roomCode || 'GLOBAL',
      roomName: this.config.roomName || '',
      isPrivate: Boolean(this.config.roomIsPrivate),
      uid: this.config.uid,
      playerName: this.config.playerName,
      appearance: this.config.appearance,
      onPeersChange: this.config.onPeersChange,
      onChatMessage: this.config.onChatMessage,
      onVoiceStatus: this.config.onVoiceStatus,
    });
    this.multiplayer.connect();

    this.pipeline.init(this.scene, this.camera);
    setProgress(0.97, 'Warming up shaders');
    await nextFrame();
    this.cameraController.update(0.016, this.input);
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch (e) {
      console.warn('[game] shader precompile skipped', e);
    }
    if (this._disposed) return;
    setProgress(1, 'Ready');

    this.running = true;
    this.renderer.setAnimationLoop(() => this.frame());
    document.getElementById('hud')?.classList.remove('hidden');
    if (loading) {
      loading.classList.add('fade');
      setTimeout(() => loading.classList.add('hidden'), 650);
    }
    this.audio.start();
    this.audio.resume();
    if (this.config.deviceMode !== 'mobile') {
      this.input.requestLock();
    }
    this.hud.toast(`Welcome home to ${home?.name || CITY_POIS.cityName}! Your ${this.config.vehicleId} is parked outside.`, 4.5);
    this.config.onReady();
  }

  frame() {
    if (this._disposed) return;
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    this.step(dt);
  }

  step(dt) {
    if (this._disposed) return;
    this.time += dt;
    const input = this.input;
    this._handleKeys();

    if (!this.paused) {
      const player = this.player;
      const vehicle = player.vehicle;
      let throttle = 0;
      if (vehicle) {
        throttle = input.moveY;
        vehicle.update(dt, { throttle, steer: -input.moveX, handbrake: input.down('Space') });
        this.audio.setHorn(input.down('KeyH'), vehicle.type === 'auto' ? 'auto' : vehicle.spec.heavy ? 'bus' : vehicle.twoWheeler ? 'bike' : 'car');
      } else {
        this.audio.setHorn(false);
      }
      player.update(dt, input, this.cameraController.moveYaw);
      this.weaponSystem?.update(dt);
      this._checkExits(dt);
      this._checkEconomyZones(dt);
      this.vehicleManager.update(dt, player.pos);
      this.traffic?.update(dt, player.pos);
      this.pedestrians?.update(dt, player.pos);
      this.multiplayer?.update(dt);
      if (!this.debugView) this.cameraController.update(dt, input);
      this._updatePrompt();
      this.focus.copy(player.pos);
      this.world.update(dt, this.focus, this.camera);
      this.audio.update(dt, vehicle, Math.abs(throttle), this.traffic ? this.traffic.nearest(this.camera, this._nearby) : this._nearby);
      this.hud.update(dt);
    }

    this.vehicles.flush(this.camera);
    const v = this.player.vehicle;
    const speedFx = v ? saturate((Math.abs(v.vf) - 22) / 22) : 0;
    this.pipeline.adapt(dt);
    this.pipeline.render(dt, speedFx);
    input.endFrame();
  }

  _checkEconomyZones(dt) {
    // 1. Playtime income bonus (+$25 every 10 seconds of active play)
    this._playBonusAccum += dt;
    if (this._playBonusAccum >= 10) {
      this._playBonusAccum = 0;
      this.config.onMoneyEvent('play_bonus', 25, 'Active Exploration Bonus');
    }

    // Tick cooldowns
    this._crashFineCooldown = Math.max(0, this._crashFineCooldown - dt);
    for (const [k, t] of this._zoneCooldowns) {
      if (t - dt <= 0) this._zoneCooldowns.delete(k);
      else this._zoneCooldowns.set(k, t - dt);
    }

    const pos = this.player.pos;
    const v = this.player.vehicle;
    const kmh = v ? Math.abs(v.kmh) : 0;

    // 2. Toll Gates (-$40 when driving through)
    if (v) {
      for (const toll of CITY_POIS.tollGates || []) {
        if (this._zoneCooldowns.has(toll.id)) continue;
        if (Math.hypot(pos.x - toll.x, pos.z - toll.z) < 16) {
          this._zoneCooldowns.set(toll.id, 18);
          const fee = toll.fee || 40;
          this.config.onMoneyEvent('toll', fee, `${toll.name} Toll`);
          this.hud.toast(`Toll paid at ${toll.name}: -$${fee}`, 3);
        }
      }
    }

    // 3. Police Stations (Speeding > 48 km/h within 45m -> -$120 fine)
    if (v && kmh > 48) {
      for (const pol of CITY_POIS.policeStations || []) {
        if (this._zoneCooldowns.has(pol.id)) continue;
        if (Math.hypot(pos.x - pol.x, pos.z - pol.z) < 45) {
          this._zoneCooldowns.set(pol.id, 20);
          this.config.onMoneyEvent('fine', 120, `Speeding near ${pol.name}`);
          this.hud.toast(`POLICE FINE at ${pol.name}: -$120 (${Math.round(kmh)} km/h)`, 3.5);
        }
      }
    }

    // 4. School Zones (Speeding > 35 km/h within 42m -> -$100 fine)
    if (v && kmh > 35) {
      for (const sch of CITY_POIS.schools || []) {
        if (this._zoneCooldowns.has(sch.id)) continue;
        if (Math.hypot(pos.x - sch.x, pos.z - sch.z) < 42) {
          this._zoneCooldowns.set(sch.id, 20);
          this.config.onMoneyEvent('fine', 100, `School Zone Speeding (${sch.name})`);
          this.hud.toast(`SCHOOL ZONE FINE (${sch.name}): -$100`, 3.5);
        }
      }
    }

    // 5. Petrol Pumps (Refuel when pulled in slowly < 18 km/h -> -$30)
    if (v && kmh < 18) {
      for (const pump of CITY_POIS.petrolPumps || []) {
        if (this._zoneCooldowns.has(pump.id)) continue;
        if (Math.hypot(pos.x - pump.x, pos.z - pump.z) < 14) {
          this._zoneCooldowns.set(pump.id, 28);
          this.config.onMoneyEvent('fuel', 30, `Refueled at ${pump.name}`);
          this.hud.toast(`Tank refueled at ${pump.name}: -$30`, 3);
        }
      }
    }
  }

  _handleKeys() {
    const input = this.input;
    if (input.hit('KeyE')) this.interact();
    if (input.hit('KeyM')) {
      const open = this.hud.toggleMap();
      if (open) input.exitLock();
    }
    if (input.hit('Escape') && this.hud.mapOpen) this.hud.toggleMap(false);
    if (input.hit('F1')) this.hud.toggleControls();
    if (input.hit('KeyT')) this.cycleTravel();
    if (input.hit('KeyR') && this.player.vehicle) this.resetVehicle();
    if (input.hit('Digit1')) this.selectWeapon('unarmed');
    if (input.hit('Digit2')) this.selectWeapon('pistol');
    if (input.hit('Digit3')) this.selectWeapon('rifle');
    if (input.hit('Digit4')) this.selectWeapon('sniper');
    if (input.hit('KeyQ') || input.hit('Tab')) this.config.onToggleWeaponWheel?.();
    if (input.hit('KeyV')) this.cycleSniperZoom();
  }

  selectWeapon(weaponId) {
    this.weaponSystem?.selectWeapon(weaponId);
  }

  cycleSniperZoom() {
    this.weaponSystem?.cycleSniperZoom(1);
  }

  setVoiceMuted(muted) {
    return this.multiplayer?.setVoiceMuted?.(muted);
  }

  setVoiceProximity(enabled) {
    this.multiplayer?.setVoiceProximity?.(enabled);
  }

  setPaused(paused) {
    this.paused = !!paused;
    if (paused) this.input.exitLock();
  }

  interact() {
    const p = this.player;
    if (p.vehicle) {
      if (Math.abs(p.vehicle.vf) > 4) {
        this.hud.toast('Slow down to get out');
        return;
      }
      p.exit();
      this.hud.setDriving(null);
      this.cameraController.yaw += this.cameraController.lookYaw;
      return;
    }
    const v = this.findVehicle();
    if (v) {
      p.enter(v);
      this.hud.setDriving(v);
    }
  }

  findVehicle() {
    const p = this.player;
    let v = this.vehicleManager.nearest(p.pos, 2.5);
    if (!v && this.traffic) v = this.traffic.claim(p.pos, 2.5);
    return v;
  }

  _updatePrompt() {
    const p = this.player;
    if (p.vehicle) {
      this.hud.prompt(null);
      return;
    }
    this._promptTimer = (this._promptTimer || 0) + 1;
    if (this._promptTimer % 6 !== 0) return;
    const v = this.vehicleManager.nearest(p.pos, 2.5) || this.traffic?.peek(p.pos, 2.5);
    this.hud.prompt(v ? `${v.twoWheeler ? 'Ride' : 'Drive'} ${v.spec.label}` : null);
  }

  resetVehicle() {
    const v = this.player.vehicle;
    v.vx = v.vz = v.vf = v.vl = v.vy = 0;
    v.pitch = v.roll = 0;
    const lane = this.traffic?.nearestLanePoint(v.pos.x, v.pos.z);
    if (lane) {
      v.pos.set(lane.x, lane.y + 0.2, lane.z);
      v.heading = Math.atan2(lane.tx, lane.tz);
    }
    v.sync();
    this.hud.toast('Vehicle reset');
  }

  cycleTravel() {
    const pois = this.hud.poiHits || [];
    if (!pois.length) return;
    this._travelIndex = ((this._travelIndex ?? -1) + 1) % pois.length;
    this.fastTravel(pois[this._travelIndex]);
  }

  fastTravel(target) {
    let x = this.spawn.x;
    let z = this.spawn.z;
    let label = 'Home';
    if (typeof target === 'string') {
      if (target === 'home') {
        x = this.spawn.x;
        z = this.spawn.z;
        label = 'Your Home';
      } else if (LANDMARKS[target]) {
        x = LANDMARKS[target].p[0];
        z = LANDMARKS[target].p[1] + 22;
        label = LANDMARKS[target].name;
      }
    } else if (target && typeof target === 'object') {
      x = target.worldX;
      z = target.worldZ + 14;
      label = target.label || 'Location';
    }
    const v = this.player.vehicle;
    if (v) {
      v.pos.set(x, this.world.ground.height(x, z, 60, 100), z);
      v.vx = v.vz = v.vf = v.vl = 0;
      v.sync();
    } else {
      this.player.teleport(x, z, this.spawn.heading);
    }
    this.cameraController.snapBehind(this.player.heading);
    this.hud.toast(`Fast travel · ${label}`);
  }

  obstaclesNear(x, z, range, exclude) {
    const out = this._obstacles;
    out.length = 0;
    this._poolUsed = 0;
    const pool = () => {
      if (this._poolUsed >= this._pool.length) this._pool.push({});
      return this._pool[this._poolUsed++];
    };
    const mine = exclude === this.player ? this.player.vehicle : exclude;
    this.vehicleManager?.collect(x, z, range, mine, out, pool);
    this.traffic?.collect(x, z, range, out, pool);
    if (exclude !== this.player) this.pedestrians?.collect(x, z, range, out, pool);
    return out;
  }

  _checkExits(dt) {
    this._exitCooldown = Math.max(0, (this._exitCooldown || 0) - dt);
    if (this._exitCooldown > 0) return;
    const v = this.player.vehicle;
    const pos = v ? v.pos : this.player.pos;
    for (const id in NODES) {
      const n = NODES[id];
      if (!n.exit) continue;
      const d = Math.hypot(pos.x - n.p[0], pos.z - n.p[1]);
      if (d > EXIT_BUFFER) continue;
      const node = this.world.roads.nodes[id];
      const arm = node.arms[0];
      const f = this.world.roads.armFrame(arm, EXIT_BUFFER + 40);
      const heading = Math.atan2(f.tx, f.tz);
      const ts = CITY_POIS.trafficSide === 'right' ? -1 : 1;
      const lane = f.rx * 5.85 * ts;
      const lanez = f.rz * 5.85 * ts;
      const x = f.x - lane;
      const z = f.z - lanez;
      if (v) {
        const speed = Math.min(Math.abs(v.vf), 14);
        v.pos.set(x, this.world.ground.height(x, z, 2, 3), z);
        v.heading = heading;
        v.vx = Math.sin(heading) * speed;
        v.vz = Math.cos(heading) * speed;
        v.vf = speed;
        v.vl = 0;
        v.sync();
      } else {
        this.player.teleport(x, z, heading);
      }
      this.cameraController.snapBehind(heading);
      this.hud.toast(`${node.arms[0].edge.name} leads toward ${n.toward} — turning back`, 4);
      this.flash();
      this._exitCooldown = 3;
      return;
    }
    const m = 30;
    if (v) {
      const cx = clamp(v.pos.x, WORLD.minX + m, WORLD.maxX - m);
      const cz = clamp(v.pos.z, WORLD.minZ + m, WORLD.maxZ - m);
      if (cx !== v.pos.x || cz !== v.pos.z) {
        v.pos.x = cx;
        v.pos.z = cz;
        v.vx *= 0.5;
        v.vz *= 0.5;
      }
    }
  }

  flash() {
    let el = document.getElementById('flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'flash';
      el.style.cssText = 'position:fixed;inset:0;background:#0b0f10;pointer-events:none;opacity:0;transition:opacity .45s ease;z-index:4';
      document.body.appendChild(el);
    }
    el.style.transition = 'none';
    el.style.opacity = '1';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity .7s ease';
      el.style.opacity = '0';
    });
  }

  clampToWorld(pos) {
    const m = 40;
    pos.x = clamp(pos.x, WORLD.minX + m, WORLD.maxX - m);
    pos.z = clamp(pos.z, WORLD.minZ + m, WORLD.maxZ - m);
  }

  onImpact(strength) {
    this.audio.crash(strength);
    this.cameraController.addShake(clamp(strength / 25, 0.1, 0.8));
    if (strength > 24 && this._crashFineCooldown <= 0 && this.player?.vehicle) {
      this._crashFineCooldown = 10;
      this.config.onMoneyEvent('fine', 75, 'Traffic Collision Fine');
      this.hud?.toast('Reckless Crash Fine: -$75', 2.8);
    }
  }

  currentRoadName() {
    return this.world.roadNameAt?.(this.player.pos.x, this.player.pos.z) || '';
  }

  dispose() {
    this._disposed = true;
    this.running = false;
    this.renderer.setAnimationLoop(null);
    this.weaponSystem?.dispose?.();
    this.multiplayer?.dispose();
    this.hud?.dispose();
    this.world?.dispose();
    this.input?.dispose();
    try {
      this.audio?.ctx?.close();
    } catch {
      // ignore
    }
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    this.pipeline?.dispose?.();
    document.getElementById('loading')?.classList.add('hidden');
  }
}
