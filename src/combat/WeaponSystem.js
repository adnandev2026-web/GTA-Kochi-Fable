// 360-degree weapon combat, realistic ballistic projectile physics, sniper zoom scope,
// and multiplayer tracer synchronization.

import * as THREE from 'three';

export const WEAPONS = {
  unarmed: {
    id: 'unarmed',
    label: 'Unarmed',
    short: 'Fists',
    fireRate: 0.42,
    speed: 10,
    damage: 28,
    range: 2.4,
    spread: 0,
    recoil: 0.08,
    melee: true,
  },
  pistol: {
    id: 'pistol',
    label: '9mm Tactical',
    short: 'Pistol',
    fireRate: 0.26,
    speed: 175,
    damage: 55,
    range: 110,
    spread: 0.01,
    recoil: 0.16,
  },
  rifle: {
    id: 'rifle',
    label: 'M4 Carbine',
    short: 'Assault Rifle',
    fireRate: 0.1,
    speed: 250,
    damage: 44,
    range: 165,
    spread: 0.016,
    recoil: 0.12,
  },
  sniper: {
    id: 'sniper',
    label: 'Sniper Rifle',
    short: 'Sniper',
    fireRate: 0.9,
    speed: 440,
    damage: 150,
    range: 380,
    spread: 0.0008,
    recoil: 0.45,
    zooms: [2, 4, 8],
  },
};

const TRACER_POOL_SIZE = 44;
const _camPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _aimPt = new THREE.Vector3();
const _muzzle = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3(0, 0, 1);
const _quat = new THREE.Quaternion();
const _imp = new THREE.Vector3();

export class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.currentId = 'unarmed';
    this.aiming = false;
    this.cooldown = 0;
    this.sniperZoomIdx = 1; // 4.0x
    this.zoomLevels = [2, 4, 8];
    this._scopedHidden = false;
    this._fireLatch = false;
    this.onWeaponChange = game.config?.onWeaponChange || (() => {});

    // Pre-allocated tracer pool (zero runtime allocations per shot)
    this._tracers = [];
    this._tracerGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.8, 5);
    this._tracerGeo.rotateX(Math.PI / 2);
    this._tracerMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    for (let i = 0; i < TRACER_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this._tracerGeo, this._tracerMat);
      mesh.visible = false;
      mesh.frustumCulled = false;
      game.scene.add(mesh);
      this._tracers.push({
        active: false,
        mesh,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        damage: 0,
        remote: false,
        weaponId: 'pistol',
      });
    }

    this._crosshairEl = document.getElementById('crosshair');
    this._scopeEl = document.getElementById('sniper-scope');
    this._scopeZoomEl = document.getElementById('scope-zoom-label');
    this._weaponHudEl = document.getElementById('weapon-hud');
    this._weaponNameEl = document.getElementById('weapon-hud-name');
    this._syncHud();
  }

  get spec() {
    return WEAPONS[this.currentId] || WEAPONS.unarmed;
  }

  get sniperZoom() {
    return this.zoomLevels[this.sniperZoomIdx] || 4;
  }

  selectWeapon(id) {
    if (!WEAPONS[id]) return;
    this.currentId = id;
    this.game.player?.character?.setWeapon(id);
    if (id === 'unarmed') {
      this.aiming = false;
    }
    this._restorePlayerVisibility();
    this._syncHud();
    this.onWeaponChange(id);
    this.game.multiplayer?.sendWeaponState(id, this.aiming);
  }

  cycleSniperZoom(step = 1) {
    this.sniperZoomIdx = (this.sniperZoomIdx + step + this.zoomLevels.length) % this.zoomLevels.length;
    this._syncHud();
  }

  _restorePlayerVisibility() {
    if (this._scopedHidden && this.game.player && !this.game.player.vehicle) {
      this.game.player.character.setVisible(true);
    }
    this._scopedHidden = false;
  }

  _syncHud() {
    if (this._weaponHudEl) {
      this._weaponHudEl.classList.toggle('hidden', !!this.game.player?.vehicle);
    }
    if (this._weaponNameEl) {
      this._weaponNameEl.textContent = this.spec.label;
    }
    if (this._scopeZoomEl) {
      this._scopeZoomEl.textContent = `${this.sniperZoom.toFixed(1)}x`;
    }
    const showScope = this.currentId === 'sniper' && this.aiming && !this.game.player?.vehicle && !this.game.hud?.mapOpen;
    if (this._scopeEl) {
      this._scopeEl.classList.toggle('hidden', !showScope);
    }
    if (this._crosshairEl) {
      const showCrosshair = !showScope && this.currentId !== 'unarmed' && !this.game.player?.vehicle && !this.game.hud?.mapOpen;
      this._crosshairEl.classList.toggle('hidden', !showCrosshair);
      this._crosshairEl.classList.toggle('aiming', this.aiming);
    }
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const player = this.game.player;
    const input = this.game.input;

    if (!player || player.vehicle || this.game.hud?.mapOpen || this.game.paused) {
      if (this.aiming) {
        this.aiming = false;
        player?.character?.setAim(false, 0);
      }
      this._restorePlayerVisibility();
      this._syncHud();
      this._updateTracers(dt);
      return;
    }

    const wantAim = input.aim && this.currentId !== 'unarmed';
    if (wantAim !== this.aiming) {
      this.aiming = wantAim;
      this.game.multiplayer?.sendWeaponState(this.currentId, this.aiming);
    }

    if (this.currentId === 'sniper' && this.aiming && input.wheel !== 0) {
      this.cycleSniperZoom(input.wheel < 0 ? 1 : -1);
    }

    const isScoped = this.currentId === 'sniper' && this.aiming;
    if (isScoped && !this._scopedHidden) {
      player.character.setVisible(false);
      this._scopedHidden = true;
    } else if (!isScoped && this._scopedHidden) {
      this._restorePlayerVisibility();
    }

    const firingNow = input.fire;
    if (this.currentId === 'rifle') {
      if (firingNow && this.cooldown <= 0) this._fire();
    } else {
      if (firingNow && !this._fireLatch && this.cooldown <= 0) {
        this._fire();
      }
      this._fireLatch = firingNow;
    }

    this._syncHud();
    this._updateTracers(dt);
  }

  _fire() {
    const spec = this.spec;
    this.cooldown = spec.fireRate;
    const player = this.game.player;

    if (spec.melee) {
      this.game.audio?.step(1.3);
      const fx = Math.sin(player.heading);
      const fz = Math.cos(player.heading);
      const peds = this.game.pedestrians;
      if (peds) {
        for (const p of peds.active) {
          if (!p.visible || p.state === 'ragdoll') continue;
          const dx = p.x - player.pos.x;
          const dz = p.z - player.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist < spec.range && (dx * fx + dz * fz) / Math.max(0.01, dist) > 0.25) {
            _imp.set(fx * 4.5, 2.2, fz * 4.5);
            peds.hitPed(p, spec.damage, _imp, false);
            break;
          }
        }
      }
      return;
    }

    // Raycast from camera through reticle center so bullets hit exactly where aimed
    const cam = this.game.camera;
    cam.getWorldPosition(_camPos);
    cam.getWorldDirection(_camDir);
    const worldHitDist = this.game.world.colliders.raycast(
      _camPos.x,
      _camPos.y,
      _camPos.z,
      _camDir.x,
      _camDir.y,
      _camDir.z,
      spec.range,
    );
    const aimDist = Math.max(6, Math.min(spec.range, worldHitDist));
    _aimPt.copy(_camPos).addScaledVector(_camDir, aimDist);

    if (this.currentId === 'sniper' && this.aiming) {
      _muzzle.copy(_camPos).addScaledVector(_camDir, 0.85);
    } else {
      player.character.getMuzzleWorldPos(_muzzle);
    }

    _dir.subVectors(_aimPt, _muzzle).normalize();
    const spread = this.aiming ? spec.spread * 0.25 : spec.spread;
    if (spread > 0) {
      _dir.x += (Math.random() - 0.5) * spread;
      _dir.y += (Math.random() - 0.5) * spread;
      _dir.z += (Math.random() - 0.5) * spread;
      _dir.normalize();
    }

    this._spawnTracer(_muzzle, _dir, spec.speed, spec.damage, false, this.currentId);
    this.game.audio?.shoot(this.currentId);
    this.game.cameraController?.addShake(spec.recoil);
    this.game.multiplayer?.sendShoot(
      { x: _muzzle.x, y: _muzzle.y, z: _muzzle.z },
      { x: _dir.x, y: _dir.y, z: _dir.z },
      this.currentId,
    );
  }

  spawnRemoteTracer(origin, dir, weaponId = 'pistol') {
    const spec = WEAPONS[weaponId] || WEAPONS.pistol;
    _muzzle.set(origin.x, origin.y, origin.z);
    _dir.set(dir.x, dir.y, dir.z).normalize();
    this._spawnTracer(_muzzle, _dir, spec.speed, spec.damage, true, weaponId);
    const d = _muzzle.distanceTo(this.game.player?.pos || _muzzle);
    if (d < 95) {
      this.game.audio?.shoot(weaponId, Math.max(0.15, 1 - d / 95));
    }
  }

  _spawnTracer(origin, dir, speed, damage, remote, weaponId) {
    const slot = this._tracers.find((t) => !t.active) || this._tracers[0];
    slot.active = true;
    slot.pos.copy(origin);
    slot.vel.copy(dir).multiplyScalar(speed);
    slot.life = Math.min(2.2, (WEAPONS[weaponId]?.range || 140) / Math.max(20, speed));
    slot.damage = damage;
    slot.remote = remote;
    slot.weaponId = weaponId;
    slot.mesh.position.copy(origin);
    slot.mesh.quaternion.setFromUnitVectors(_fwd, dir);
    slot.mesh.visible = true;
  }

  _updateTracers(dt) {
    const peds = this.game.pedestrians;
    const colliders = this.game.world.colliders;
    const ground = this.game.world.ground;

    for (let i = 0; i < this._tracers.length; i++) {
      const t = this._tracers[i];
      if (!t.active) continue;
      t.life -= dt;
      if (t.life <= 0) {
        t.active = false;
        t.mesh.visible = false;
        continue;
      }

      // Gravity drop on physical projectiles
      t.vel.y -= 9.81 * dt;
      const stepDist = t.vel.length() * dt;
      _dir.copy(t.vel).normalize();

      let hitSomething = false;

      // 1. Check pedestrian hits (swept cylinder test along step)
      if (!t.remote && peds) {
        const list = peds.active;
        let bestFrac = 1.01;
        let hitPed = null;
        let hitY = 0;

        for (let k = 0; k < list.length; k++) {
          const p = list[k];
          if (!p.visible || p.state === 'ragdoll') continue;
          const rx = t.pos.x - p.x;
          const rz = t.pos.z - p.z;
          // Broadphase
          if (rx * rx + rz * rz > (stepDist + 2.5) ** 2) continue;

          const segDx = _dir.x * stepDist;
          const segDz = _dir.z * stepDist;
          const segLen2 = segDx * segDx + segDz * segDz || 1e-6;
          const u = Math.max(0, Math.min(1, -(rx * segDx + rz * segDz) / segLen2));
          const cx = t.pos.x + segDx * u;
          const cz = t.pos.z + segDz * u;
          const cy = t.pos.y + _dir.y * stepDist * u;
          const distXZ = Math.hypot(cx - p.x, cz - p.z);
          if (distXZ <= 0.44 && cy >= p.y && cy <= p.y + 1.84) {
            if (u < bestFrac) {
              bestFrac = u;
              hitPed = p;
              hitY = cy;
            }
          }
        }

        if (hitPed) {
          const isHeadshot = hitY >= hitPed.y + 1.38;
          const finalDmg = isHeadshot ? t.damage * 2.5 : t.damage;
          const impulseScale = t.weaponId === 'sniper' ? 9.5 : t.weaponId === 'rifle' ? 4.8 : 3.6;
          _imp.copy(_dir).multiplyScalar(impulseScale);
          _imp.y = t.weaponId === 'sniper' ? 3.2 : 1.6;
          peds.hitPed(hitPed, finalDmg, _imp, isHeadshot);
          hitSomething = true;
        }
      }

      // 2. Check vehicles (parked + traffic)
      if (!hitSomething && !t.remote) {
        const vmList = this.game.vehicleManager?.list || [];
        for (let k = 0; k < vmList.length; k++) {
          const v = vmList[k];
          const dx = t.pos.x - v.pos.x;
          const dz = t.pos.z - v.pos.z;
          if (dx * dx + dz * dz < (v.radius + 1.2) ** 2 && t.pos.y >= v.pos.y && t.pos.y <= v.pos.y + v.height) {
            v.vx += _dir.x * 1.6;
            v.vz += _dir.z * 1.6;
            v.sleeping = false;
            this.game.audio?.hit(false);
            hitSomething = true;
            break;
          }
        }
        if (!hitSomething && this.game.traffic) {
          for (const tv of this.game.traffic.active) {
            const dx = t.pos.x - tv.x;
            const dz = t.pos.z - tv.z;
            if (dx * dx + dz * dz < (tv.radius + 1.1) ** 2 && t.pos.y >= tv.y && t.pos.y <= tv.y + 2.2) {
              tv.stun = Math.max(tv.stun, 1.5);
              tv.v *= 0.4;
              this.game.audio?.hit(false);
              hitSomething = true;
              break;
            }
          }
        }
      }

      // 3. Static world buildings & terrain
      if (!hitSomething) {
        const wallDist = colliders.raycast(t.pos.x, t.pos.y, t.pos.z, _dir.x, _dir.y, _dir.z, stepDist);
        if (wallDist < stepDist - 0.01) {
          hitSomething = true;
        } else {
          t.pos.addScaledVector(t.vel, dt);
          const gy = ground.height(t.pos.x, t.pos.z, t.pos.y + 1, 2);
          if (t.pos.y <= gy) hitSomething = true;
        }
      }

      if (hitSomething) {
        t.active = false;
        t.mesh.visible = false;
      } else {
        t.mesh.position.copy(t.pos);
        t.mesh.quaternion.setFromUnitVectors(_fwd, _dir);
      }
    }
  }

  dispose() {
    this._restorePlayerVisibility();
    for (const t of this._tracers) {
      t.mesh.parent?.remove(t.mesh);
    }
    this._tracerGeo.dispose();
    this._tracerMat.dispose();
  }
}
