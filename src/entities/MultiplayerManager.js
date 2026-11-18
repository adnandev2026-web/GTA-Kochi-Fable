// Real-time WebSocket multiplayer manager syncing peers inside the same city room.

import * as THREE from 'three';
import { Character } from './Character.js';
import { angleDiff, damp, dampAngle } from '../utils/math.js';

function makeNameSprite(label) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(10, 14, 18, 0.78)';
  ctx.beginPath();
  ctx.roundRect(12, 10, 232, 44, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 18), 128, 33);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1);
  sprite.position.set(0, 2.25, 0);
  return { sprite, tex, mat };
}

export class MultiplayerManager {
  constructor(game, opts = {}) {
    this.game = game;
    this.enabled = opts.enabled !== false;
    this.cityId = opts.cityId || 'kochi';
    this.uid = opts.uid || `guest_${Math.random().toString(36).slice(2, 8)}`;
    this.playerName = opts.playerName || 'Explorer';
    this.appearance = opts.appearance || null;
    this.onPeersChange = opts.onPeersChange || (() => {});
    this.onChatMessage = opts.onChatMessage || (() => {});

    this.peers = new Map();
    this.ws = null;
    this.selfId = null;
    this._sendAccum = 0;
    this._closed = false;
  }

  connect() {
    if (!this.enabled) return;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${location.host}/ws`;
    try {
      this.ws = new WebSocket(url);
    } catch {
      return;
    }

    this.ws.addEventListener('open', () => {
      if (this._closed || !this.ws) return;
      const p = this.game.player;
      const v = p?.vehicle;
      this.ws.send(
        JSON.stringify({
          type: 'join',
          cityId: this.cityId,
          uid: this.uid,
          name: this.playerName,
          appearance: this.appearance,
          x: p?.pos.x || 0,
          y: p?.pos.y || 0,
          z: p?.pos.z || 0,
          heading: p?.heading || 0,
          vehicleType: v ? v.type : null,
          vehicleColor: v ? v.colour : null,
        }),
      );
    });

    this.ws.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'room_snapshot') {
          this.selfId = msg.selfId;
          for (const peer of msg.peers || []) this._upsertPeer(peer);
          this._emitPeers();
        } else if (msg.type === 'peer_join') {
          this._upsertPeer(msg.peer);
          this._emitPeers();
        } else if (msg.type === 'peer_state') {
          const p = this.peers.get(msg.id);
          if (p) {
            p.targetPos.set(msg.x, msg.y, msg.z);
            p.targetHeading = msg.heading;
            p.speed = msg.speed || 0;
            p.onFoot = msg.onFoot;
            if (p.vehicleType !== msg.vehicleType) {
              this._setPeerVehicle(p, msg.vehicleType, msg.vehicleColor);
            }
          }
        } else if (msg.type === 'peer_chat') {
          this.onChatMessage({
            id: msg.id,
            name: msg.name,
            text: msg.text,
            ts: msg.ts,
            isSelf: msg.id === this.selfId,
          });
        } else if (msg.type === 'peer_leave') {
          this._removePeer(msg.id);
          this._emitPeers();
        }
      } catch {
        // ignore invalid json
      }
    });

    this.ws.addEventListener('close', () => {
      if (!this._closed) {
        setTimeout(() => {
          if (!this._closed) this.connect();
        }, 4000);
      }
    });
  }

  _upsertPeer(info) {
    if (!info || info.id === this.selfId) return;
    let peer = this.peers.get(info.id);
    if (!peer) {
      const character = new Character(this.game.assets, 'avatar', {
        appearance: info.appearance,
      });
      const label = makeNameSprite(info.name || 'Player');
      character.root.add(label.sprite);
      this.game.scene.add(character.root);
      peer = {
        id: info.id,
        name: info.name || 'Player',
        character,
        label,
        vehicleHandle: null,
        vehicleType: null,
        pos: new THREE.Vector3(info.x || 0, info.y || 0, info.z || 0),
        targetPos: new THREE.Vector3(info.x || 0, info.y || 0, info.z || 0),
        heading: info.heading || 0,
        targetHeading: info.heading || 0,
        speed: info.speed || 0,
        onFoot: info.onFoot !== false,
      };
      character.root.position.copy(peer.pos);
      character.root.rotation.y = peer.heading;
      this.peers.set(info.id, peer);
    }
    if (info.vehicleType) {
      this._setPeerVehicle(peer, info.vehicleType, info.vehicleColor);
    }
  }

  _setPeerVehicle(peer, vehicleType, vehicleColor) {
    if (peer.vehicleHandle) {
      peer.vehicleHandle.dispose();
      peer.vehicleHandle = null;
    }
    peer.vehicleType = vehicleType || null;
    if (vehicleType && this.game.vehicles) {
      peer.vehicleHandle = this.game.vehicles.create(vehicleType, vehicleColor ?? 0x1f3f78);
      peer.character.setVisible(false);
    } else {
      peer.character.setVisible(true);
    }
  }

  _removePeer(id) {
    const p = this.peers.get(id);
    if (!p) return;
    this.game.scene.remove(p.character.root);
    p.character.dispose();
    p.label.tex.dispose();
    p.label.mat.dispose();
    if (p.vehicleHandle) p.vehicleHandle.dispose();
    this.peers.delete(id);
  }

  _emitPeers() {
    this.onPeersChange([...this.peers.values()].map((p) => ({ id: p.id, name: p.name, x: p.pos.x, z: p.pos.z })));
  }

  sendChat(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'chat', text }));
  }

  update(dt) {
    if (!this.enabled) return;

    // Interpolate remote peers
    for (const p of this.peers.values()) {
      p.pos.x = damp(p.pos.x, p.targetPos.x, 10, dt);
      p.pos.y = damp(p.pos.y, p.targetPos.y, 12, dt);
      p.pos.z = damp(p.pos.z, p.targetPos.z, 10, dt);
      const diff = angleDiff(p.heading, p.targetHeading);
      p.heading = dampAngle(p.heading, p.heading + diff, 10, dt);

      if (p.vehicleHandle) {
        p.vehicleHandle.update(p.pos.x, p.pos.y, p.pos.z, p.heading, 0, 0, 0, p.speed * dt);
        p.character.root.position.set(p.pos.x, p.pos.y + 0.6, p.pos.z);
      } else {
        p.character.root.position.copy(p.pos);
        p.character.root.rotation.y = p.heading;
        p.character.locomotion(p.speed, dt, false);
        p.character.update(dt);
      }
    }

    // Broadcast local player state at 15Hz
    this._sendAccum += dt;
    if (this._sendAccum >= 0.066 && this.ws && this.ws.readyState === WebSocket.OPEN && this.game.player) {
      this._sendAccum = 0;
      const pl = this.game.player;
      const v = pl.vehicle;
      this.ws.send(
        JSON.stringify({
          type: 'state',
          x: Number(pl.pos.x.toFixed(2)),
          y: Number(pl.pos.y.toFixed(2)),
          z: Number(pl.pos.z.toFixed(2)),
          heading: Number(pl.heading.toFixed(3)),
          speed: v ? Math.abs(v.vf) : pl.speed,
          vehicleType: v ? v.type : null,
          vehicleColor: v ? v.colour : null,
          onFoot: !v,
        }),
      );
    }
  }

  dispose() {
    this._closed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    for (const id of [...this.peers.keys()]) this._removePeer(id);
  }
}
