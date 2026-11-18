import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { WebSocketServer, WebSocket } from 'ws';
import {
  CITIES_CATALOG,
  DEFAULT_APPEARANCE,
  STARTER_VEHICLES,
  STARTING_MONEY,
  VEHICLE_CATALOG,
  type CharacterAppearance,
  type DeviceMode,
} from './src/shared/catalog.js';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'gta-world-local-cookie-secret';
const MONGODB_URI = process.env.MONGODB_URI || '';

export interface PlayerRecord {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  money: number;
  deviceMode: DeviceMode;
  selectedCity: string;
  selectedHome: string;
  selectedVehicle: string;
  ownedVehicles: string[];
  appearance: CharacterAppearance;
  stats: {
    playSeconds: number;
    finesPaid: number;
    tollsPaid: number;
    fuelPaid: number;
    earnedFromPlay: number;
  };
  updatedAt: string;
}

// Mongoose Setup (MongoDB Atlas when MONGODB_URI is provided, graceful in-memory fallback otherwise)
mongoose.set('bufferCommands', false);

const playerSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, default: 'Street Explorer' },
    photoURL: { type: String, default: '' },
    money: { type: Number, default: STARTING_MONEY, min: 0 },
    deviceMode: { type: String, enum: ['mobile', 'laptop', 'desktop'], default: 'desktop' },
    selectedCity: { type: String, default: 'kochi' },
    selectedHome: { type: String, default: 'kochi_kundannoor' },
    selectedVehicle: { type: String, default: 'hatchback' },
    ownedVehicles: { type: [String], default: () => [...STARTER_VEHICLES] },
    appearance: { type: mongoose.Schema.Types.Mixed, default: () => ({ ...DEFAULT_APPEARANCE }) },
    stats: {
      playSeconds: { type: Number, default: 0 },
      finesPaid: { type: Number, default: 0 },
      tollsPaid: { type: Number, default: 0 },
      fuelPaid: { type: Number, default: 0 },
      earnedFromPlay: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const PlayerModel: mongoose.Model<any> =
  (mongoose.models.Player as mongoose.Model<any>) || mongoose.model('Player', playerSchema);
const memoryPlayers = new Map<string, PlayerRecord>();
let mongoConnected = false;

async function initDatabase() {
  if (!MONGODB_URI) {
    console.log('[db] MONGODB_URI not set — running with in-memory fallback + Firebase Firestore sync');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
    mongoConnected = true;
    console.log('[db] Connected to MongoDB Atlas');
  } catch (err) {
    mongoConnected = false;
    console.warn('[db] MongoDB connection unavailable, using in-memory fallback:', (err as Error).message);
  }
}

function defaultPlayer(uid: string, overrides: Partial<PlayerRecord> = {}): PlayerRecord {
  const defaultCity = CITIES_CATALOG[0];
  return {
    uid,
    email: overrides.email || '',
    name: overrides.name || 'Street Explorer',
    photoURL: overrides.photoURL || '',
    money: typeof overrides.money === 'number' ? Math.max(0, overrides.money) : STARTING_MONEY,
    deviceMode: overrides.deviceMode || 'desktop',
    selectedCity: overrides.selectedCity || defaultCity.id,
    selectedHome: overrides.selectedHome || defaultCity.homes[0].id,
    selectedVehicle: overrides.selectedVehicle || 'hatchback',
    ownedVehicles: Array.isArray(overrides.ownedVehicles) && overrides.ownedVehicles.length > 0
      ? Array.from(new Set([...STARTER_VEHICLES, ...overrides.ownedVehicles]))
      : [...STARTER_VEHICLES],
    appearance: { ...DEFAULT_APPEARANCE, ...(overrides.appearance || {}) },
    stats: {
      playSeconds: overrides.stats?.playSeconds || 0,
      finesPaid: overrides.stats?.finesPaid || 0,
      tollsPaid: overrides.stats?.tollsPaid || 0,
      fuelPaid: overrides.stats?.fuelPaid || 0,
      earnedFromPlay: overrides.stats?.earnedFromPlay || 0,
    },
    updatedAt: new Date().toISOString(),
  };
}

function serializeDoc(doc: any): PlayerRecord {
  const obj = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
  return defaultPlayer(obj.uid, {
    ...obj,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString(),
  });
}

async function getOrCreatePlayer(uid: string, seed?: Partial<PlayerRecord>): Promise<PlayerRecord> {
  if (mongoConnected) {
    let doc = await PlayerModel.findOne({ uid });
    if (!doc) {
      doc = await PlayerModel.create(defaultPlayer(uid, seed));
    } else if (seed && (seed.email || seed.photoURL)) {
      if (seed.email && !doc.email) doc.email = seed.email;
      if (seed.photoURL && !doc.photoURL) doc.photoURL = seed.photoURL;
      await doc.save();
    }
    return serializeDoc(doc);
  }
  let rec = memoryPlayers.get(uid);
  if (!rec) {
    rec = defaultPlayer(uid, seed);
    memoryPlayers.set(uid, rec);
  }
  return rec;
}

async function updatePlayer(uid: string, patch: Partial<PlayerRecord>): Promise<PlayerRecord> {
  const current = await getOrCreatePlayer(uid);
  const next: PlayerRecord = {
    ...current,
    name: typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim().slice(0, 32) : current.name,
    email: typeof patch.email === 'string' ? patch.email : current.email,
    photoURL: typeof patch.photoURL === 'string' ? patch.photoURL : current.photoURL,
    deviceMode: patch.deviceMode && ['mobile', 'laptop', 'desktop'].includes(patch.deviceMode) ? patch.deviceMode : current.deviceMode,
    selectedCity: typeof patch.selectedCity === 'string' ? patch.selectedCity : current.selectedCity,
    selectedHome: typeof patch.selectedHome === 'string' ? patch.selectedHome : current.selectedHome,
    selectedVehicle: typeof patch.selectedVehicle === 'string' && current.ownedVehicles.includes(patch.selectedVehicle)
      ? patch.selectedVehicle
      : current.selectedVehicle,
    appearance: patch.appearance ? { ...current.appearance, ...patch.appearance } : current.appearance,
    updatedAt: new Date().toISOString(),
  };

  if (mongoConnected) {
    const doc = await PlayerModel.findOneAndUpdate({ uid }, { $set: next }, { new: true, upsert: true });
    return serializeDoc(doc);
  }
  memoryPlayers.set(uid, next);
  return next;
}

function getCookieOpts() {
  return {
    httpOnly: false,
    sameSite: 'lax' as const,
    secure: IS_PROD,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: '/',
  };
}

function resolveUid(req: express.Request): string | null {
  const headerUid = req.header('x-player-uid');
  if (headerUid && typeof headerUid === 'string') return headerUid.slice(0, 128);
  const cookieUid = req.signedCookies?.gta_uid || req.cookies?.gta_uid;
  if (cookieUid && typeof cookieUid === 'string') return cookieUid.slice(0, 128);
  if (typeof req.query.uid === 'string' && req.query.uid) return req.query.uid.slice(0, 128);
  return null;
}

async function startServer() {
  await initDatabase();

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(COOKIE_SECRET));

  // Health endpoint for Render & monitoring
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'gta-world',
      db: mongoConnected ? 'mongodb-atlas' : 'memory-fallback',
      uptime: Math.round(process.uptime()),
      timestamp: Date.now(),
    });
  });

  // Cookie preference management
  app.get('/api/cookies/status', (req, res) => {
    res.json({
      consent: req.cookies?.gta_cookie_consent || null,
      deviceMode: req.cookies?.gta_device || null,
      hasSession: Boolean(req.signedCookies?.gta_uid || req.cookies?.gta_uid),
    });
  });

  app.post('/api/cookies/consent', (req, res) => {
    const choice = req.body?.choice === 'essential' ? 'essential' : 'accepted';
    res.cookie('gta_cookie_consent', choice, getCookieOpts());
    res.json({ ok: true, consent: choice });
  });

  app.post('/api/cookies/device', (req, res) => {
    const deviceMode: DeviceMode = ['mobile', 'laptop', 'desktop'].includes(req.body?.deviceMode)
      ? req.body.deviceMode
      : 'desktop';
    res.cookie('gta_device', deviceMode, getCookieOpts());
    res.json({ ok: true, deviceMode });
  });

  // Session sync with Firebase Auth Google Sign-In
  app.post('/api/auth/session', async (req, res) => {
    const { uid, email, displayName, photoURL, deviceMode } = req.body || {};
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Missing Firebase user uid' });
    }
    const cleanUid = uid.slice(0, 128);
    const profile = await getOrCreatePlayer(cleanUid, {
      email: typeof email === 'string' ? email : '',
      name: typeof displayName === 'string' && displayName.trim() ? displayName.trim().slice(0, 32) : 'Street Explorer',
      photoURL: typeof photoURL === 'string' ? photoURL : '',
      deviceMode: ['mobile', 'laptop', 'desktop'].includes(deviceMode) ? deviceMode : (req.cookies?.gta_device || 'desktop'),
    });

    res.cookie('gta_uid', cleanUid, { ...getCookieOpts(), signed: true });
    res.cookie('gta_session_active', '1', getCookieOpts());
    if (profile.deviceMode) {
      res.cookie('gta_device', profile.deviceMode, getCookieOpts());
    }
    res.json({ ok: true, profile });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('gta_uid', { path: '/' });
    res.clearCookie('gta_session_active', { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/profile', async (req, res) => {
    const uid = resolveUid(req);
    if (!uid) return res.status(401).json({ error: 'Not signed in' });
    const profile = await getOrCreatePlayer(uid);
    res.json({ ok: true, profile });
  });

  app.put('/api/profile', async (req, res) => {
    const uid = resolveUid(req) || req.body?.uid;
    if (!uid || typeof uid !== 'string') return res.status(401).json({ error: 'Not signed in' });
    const profile = await updatePlayer(uid, req.body || {});
    if (profile.deviceMode) res.cookie('gta_device', profile.deviceMode, getCookieOpts());
    res.json({ ok: true, profile });
  });

  // Vehicle dealership purchase
  app.post('/api/vehicles/buy', async (req, res) => {
    const uid = resolveUid(req) || req.body?.uid;
    const vehicleId = String(req.body?.vehicleId || '');
    if (!uid) return res.status(401).json({ error: 'Not signed in' });

    const item = VEHICLE_CATALOG.find((v) => v.id === vehicleId);
    if (!item) return res.status(404).json({ error: 'Vehicle not found' });

    const player = await getOrCreatePlayer(uid);
    if (player.ownedVehicles.includes(vehicleId)) {
      const updated = await updatePlayer(uid, { selectedVehicle: vehicleId });
      return res.json({ ok: true, alreadyOwned: true, profile: updated });
    }
    if (player.money < item.price) {
      return res.status(400).json({ error: `Need $${item.price - player.money} more to buy ${item.name}`, money: player.money });
    }

    const nextMoney = player.money - item.price;
    const nextOwned = [...player.ownedVehicles, vehicleId];
    if (mongoConnected) {
      const doc = await PlayerModel.findOneAndUpdate(
        { uid, money: { $gte: item.price } },
        {
          $inc: { money: -item.price },
          $addToSet: { ownedVehicles: vehicleId },
          $set: { selectedVehicle: vehicleId },
        },
        { new: true },
      );
      if (!doc) return res.status(400).json({ error: 'Insufficient balance' });
      return res.json({ ok: true, profile: serializeDoc(doc) });
    }

    const updated: PlayerRecord = {
      ...player,
      money: nextMoney,
      ownedVehicles: nextOwned,
      selectedVehicle: vehicleId,
      updatedAt: new Date().toISOString(),
    };
    memoryPlayers.set(uid, updated);
    res.json({ ok: true, profile: updated });
  });

  // Dynamic economy updates (playtime bonus, police fine, toll gate, petrol pump)
  app.post('/api/economy/event', async (req, res) => {
    const uid = resolveUid(req) || req.body?.uid;
    if (!uid) return res.status(401).json({ error: 'Not signed in' });
    const kind = String(req.body?.kind || '');
    const rawAmount = Number(req.body?.amount || 0);
    if (!Number.isFinite(rawAmount) || rawAmount < 0 || rawAmount > 1000) {
      return res.status(400).json({ error: 'Invalid economy amount' });
    }
    const player = await getOrCreatePlayer(uid);
    let delta = 0;
    const stats = { ...player.stats };

    if (kind === 'play_bonus') {
      const bonus = Math.min(100, Math.round(rawAmount || 25));
      delta = bonus;
      stats.earnedFromPlay += bonus;
      stats.playSeconds += 10;
    } else if (kind === 'fine') {
      const fine = Math.min(player.money, Math.round(rawAmount || 120));
      delta = -fine;
      stats.finesPaid += fine;
    } else if (kind === 'toll') {
      const toll = Math.min(player.money, Math.round(rawAmount || 40));
      delta = -toll;
      stats.tollsPaid += toll;
    } else if (kind === 'fuel') {
      const fuel = Math.min(player.money, Math.round(rawAmount || 30));
      delta = -fuel;
      stats.fuelPaid += fuel;
    } else {
      return res.status(400).json({ error: 'Unsupported economy event kind' });
    }

    const nextMoney = Math.max(0, player.money + delta);
    if (mongoConnected) {
      const doc = await PlayerModel.findOneAndUpdate(
        { uid },
        { $set: { money: nextMoney, stats } },
        { new: true },
      );
      return res.json({ ok: true, delta, money: doc.money, stats: doc.stats });
    }

    player.money = nextMoney;
    player.stats = stats;
    player.updatedAt = new Date().toISOString();
    memoryPlayers.set(uid, player);
    res.json({ ok: true, delta, money: player.money, stats: player.stats });
  });

  // WebSocket Multiplayer Rooms by cityId
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  interface PeerState {
    id: string;
    uid: string;
    cityId: string;
    name: string;
    appearance: CharacterAppearance;
    x: number;
    y: number;
    z: number;
    heading: number;
    speed: number;
    vehicleType: string | null;
    vehicleColor: number | null;
    onFoot: boolean;
    ws: WebSocket;
  }

  const rooms = new Map<string, Map<string, PeerState>>();

  function getRoom(cityId: string) {
    let r = rooms.get(cityId);
    if (!r) {
      r = new Map();
      rooms.set(cityId, r);
    }
    return r;
  }

  function broadcast(cityId: string, exceptId: string | null, payload: unknown) {
    const room = rooms.get(cityId);
    if (!room) return;
    const msg = JSON.stringify(payload);
    for (const [id, peer] of room) {
      if (id === exceptId) continue;
      if (peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(msg);
      }
    }
  }

  function serializePeer(p: PeerState) {
    return {
      id: p.id,
      uid: p.uid,
      name: p.name,
      appearance: p.appearance,
      x: p.x,
      y: p.y,
      z: p.z,
      heading: p.heading,
      speed: p.speed,
      vehicleType: p.vehicleType,
      vehicleColor: p.vehicleColor,
      onFoot: p.onFoot,
    };
  }

  app.get('/api/cities/:cityId/players', (req, res) => {
    const room = rooms.get(req.params.cityId);
    const players = room ? [...room.values()].map(serializePeer) : [];
    res.json({ ok: true, count: players.length, players });
  });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    let currentPeer: PeerState | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'join') {
          const cityId = String(msg.cityId || 'kochi');
          const id = `${msg.uid || 'guest'}_${Math.random().toString(36).slice(2, 7)}`;
          if (currentPeer) {
            const oldRoom = rooms.get(currentPeer.cityId);
            oldRoom?.delete(currentPeer.id);
            broadcast(currentPeer.cityId, currentPeer.id, { type: 'peer_leave', id: currentPeer.id });
          }
          currentPeer = {
            id,
            uid: String(msg.uid || 'guest'),
            cityId,
            name: String(msg.name || 'Player').slice(0, 28),
            appearance: msg.appearance || DEFAULT_APPEARANCE,
            x: Number(msg.x) || 0,
            y: Number(msg.y) || 0,
            z: Number(msg.z) || 0,
            heading: Number(msg.heading) || 0,
            speed: 0,
            vehicleType: msg.vehicleType || null,
            vehicleColor: typeof msg.vehicleColor === 'number' ? msg.vehicleColor : null,
            onFoot: !msg.vehicleType,
            ws,
          };
          const room = getRoom(cityId);
          const snapshot = [...room.values()].map(serializePeer);
          room.set(id, currentPeer);
          ws.send(JSON.stringify({ type: 'room_snapshot', selfId: id, peers: snapshot }));
          broadcast(cityId, id, { type: 'peer_join', peer: serializePeer(currentPeer) });
        } else if (msg.type === 'state' && currentPeer) {
          currentPeer.x = Number(msg.x) || 0;
          currentPeer.y = Number(msg.y) || 0;
          currentPeer.z = Number(msg.z) || 0;
          currentPeer.heading = Number(msg.heading) || 0;
          currentPeer.speed = Number(msg.speed) || 0;
          currentPeer.vehicleType = msg.vehicleType || null;
          currentPeer.vehicleColor = typeof msg.vehicleColor === 'number' ? msg.vehicleColor : null;
          currentPeer.onFoot = Boolean(msg.onFoot);
          broadcast(currentPeer.cityId, currentPeer.id, {
            type: 'peer_state',
            id: currentPeer.id,
            x: currentPeer.x,
            y: currentPeer.y,
            z: currentPeer.z,
            heading: currentPeer.heading,
            speed: currentPeer.speed,
            vehicleType: currentPeer.vehicleType,
            vehicleColor: currentPeer.vehicleColor,
            onFoot: currentPeer.onFoot,
          });
        } else if (msg.type === 'chat' && currentPeer) {
          const text = String(msg.text || '').trim().slice(0, 140);
          if (!text) return;
          broadcast(currentPeer.cityId, null, {
            type: 'peer_chat',
            id: currentPeer.id,
            name: currentPeer.name,
            text,
            ts: Date.now(),
          });
        }
      } catch {
        // Ignore malformed payloads
      }
    });

    ws.on('close', () => {
      if (!currentPeer) return;
      const room = rooms.get(currentPeer.cityId);
      room?.delete(currentPeer.id);
      broadcast(currentPeer.cityId, currentPeer.id, { type: 'peer_leave', id: currentPeer.id });
    });
  });

  // Frontend Vite middleware in development, static dist/ in production
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('/{*splat}', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path === '/ws') return next();
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] GTA World listening on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
