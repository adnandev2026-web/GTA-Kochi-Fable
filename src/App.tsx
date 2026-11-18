import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Smartphone,
  Laptop,
  Monitor,
  MapPin,
  Car,
  User,
  Wallet,
  Users,
  MessageSquare,
  Send,
  LogOut,
  Check,
  ShieldAlert,
  Play,
  ArrowLeft,
  Settings,
  Cookie,
  Home,
} from 'lucide-react';
import bannerImg from './assets/images/gta_world_banner_1795006243771.jpg';
import logoImg from './assets/images/gta_world_logo_1795006244444.jpg';
import {
  APPEARANCE_OPTIONS,
  CITIES_CATALOG,
  DEFAULT_APPEARANCE,
  STARTER_VEHICLES,
  STARTING_MONEY,
  VEHICLE_CATALOG,
  type CharacterAppearance,
  type DeviceMode,
} from './shared/catalog';
import {
  loadFirestoreProfile,
  saveFirestoreProfile,
  signInWithGoogle,
  signOutFirebase,
  subscribeAuth,
  testFirestoreConnection,
} from './lib/firebase';
import {
  buyVehicleApi,
  getCityPlayersCount,
  getHealth,
  logoutSession,
  recordEconomyEventApi,
  saveCookieConsent,
  saveDeviceCookie,
  syncAuthSession,
  updateProfileApi,
  type PlayerProfile,
} from './lib/api';
import { getCookie, setCookie } from './lib/cookies';
import { CharacterPreview3D } from './components/CharacterPreview3D';
import { MobileControls } from './components/MobileControls';
import { SetupGuideModal } from './components/SetupGuideModal';
import { Game } from './Game.js';

type Step = 'landing' | 'home' | 'city' | 'vehicles' | 'playing';
type StudioTab = 'identity' | 'head' | 'outfit';

interface EconomyToast {
  id: number;
  delta: number;
  reason: string;
}

interface ChatMsg {
  id: string;
  name: string;
  text: string;
  ts: number;
  isSelf?: boolean;
}

export function App() {
  const [step, setStep] = useState<Step>('landing');
  const [studioTab, setStudioTab] = useState<StudioTab>('identity');
  const [cityFilter, setCityFilter] = useState<'All' | 'Kerala' | 'International'>('All');

  const initialDevice = (getCookie('gta_device') as DeviceMode) || 'desktop';
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(
    ['mobile', 'laptop', 'desktop'].includes(initialDevice) ? initialDevice : 'desktop',
  );
  const [cookieConsent, setCookieConsent] = useState<string | null>(() => getCookie('gta_cookie_consent'));

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<PlayerProfile>({
    uid: '',
    email: '',
    name: 'Street Explorer',
    photoURL: '',
    money: STARTING_MONEY,
    deviceMode: initialDevice,
    selectedCity: 'kochi',
    selectedHome: 'kochi_kundannoor',
    selectedVehicle: 'hatchback',
    ownedVehicles: [...STARTER_VEHICLES],
    appearance: { ...DEFAULT_APPEARANCE },
    stats: { playSeconds: 0, finesPaid: 0, tollsPaid: 0, fuelPaid: 0, earnedFromPlay: 0 },
    updatedAt: new Date().toISOString(),
  });

  const [multiplayerEnabled, setMultiplayerEnabled] = useState(true);
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [dbStatus, setDbStatus] = useState('checking...');
  const [setupOpen, setSetupOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // In-game live state
  const gameRef = useRef<any>(null);
  const [gameReady, setGameReady] = useState(false);
  const [peers, setPeers] = useState<Array<{ id: string; name: string }>>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [econFlash, setEconFlash] = useState<EconomyToast | null>(null);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    testFirestoreConnection().catch(() => {});
    getHealth()
      .then((h) => setDbStatus(h.db))
      .catch(() => setDbStatus('memory-fallback'));
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth(async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) return;
      try {
        const [{ profile: serverProf }, cloudProf] = await Promise.all([
          syncAuthSession({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Street Explorer',
            photoURL: user.photoURL || '',
            deviceMode,
          }),
          loadFirestoreProfile(user, deviceMode),
        ]);

        const merged: PlayerProfile = {
          ...serverProf,
          name: cloudProf?.characterName || serverProf.name || user.displayName || 'Street Explorer',
          money: typeof cloudProf?.money === 'number' ? Math.max(serverProf.money, cloudProf.money) : serverProf.money,
          selectedCity: cloudProf?.cityId || serverProf.selectedCity,
          selectedHome: cloudProf?.homeId || serverProf.selectedHome,
          selectedVehicle: cloudProf?.selectedVehicle || serverProf.selectedVehicle,
          ownedVehicles: Array.from(
            new Set([
              ...STARTER_VEHICLES,
              ...(serverProf.ownedVehicles || []),
              ...(cloudProf?.ownedVehicles || []),
            ]),
          ),
          appearance: {
            ...DEFAULT_APPEARANCE,
            ...(serverProf.appearance || {}),
            ...(cloudProf?.appearance || {}),
          },
        };
        setProfile(merged);
      } catch (err) {
        console.warn('[auth] Profile sync warning:', err);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (step !== 'city') return;
    Promise.all(
      CITIES_CATALOG.map((c) =>
        getCityPlayersCount(c.id)
          .then((r) => [c.id, r.count] as const)
          .catch(() => [c.id, 0] as const),
      ),
    ).then((entries) => {
      setCityCounts(Object.fromEntries(entries));
    });
  }, [step]);

  const handleSelectDevice = async (mode: DeviceMode) => {
    setDeviceMode(mode);
    setCookie('gta_device', mode, 30);
    setProfile((prev) => ({ ...prev, deviceMode: mode }));
    try {
      await saveDeviceCookie(mode);
    } catch {
      // cookie already written locally
    }
  };

  const handleCookieConsent = async (choice: 'accepted' | 'essential') => {
    setCookieConsent(choice);
    setCookie('gta_cookie_consent', choice, 365);
    try {
      await saveCookieConsent(choice);
    } catch {
      // local cookie preserved
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await signInWithGoogle();
      setStep('home');
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in was cancelled or blocked');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOutFirebase();
    await logoutSession().catch(() => {});
    setStep('landing');
  };

  const persistProfile = useCallback(async (patch: Partial<PlayerProfile>) => {
    const cur = profileRef.current;
    const next = { ...cur, ...patch };
    setProfile(next);
    if (!cur.uid) return;
    try {
      await Promise.all([
        updateProfileApi(cur.uid, patch),
        saveFirestoreProfile(cur.uid, {
          characterName: next.name,
          deviceMode: next.deviceMode,
          cityId: next.selectedCity,
          homeId: next.selectedHome,
          money: next.money,
          ownedVehicles: next.ownedVehicles,
          selectedVehicle: next.selectedVehicle,
          appearance: next.appearance,
        }),
      ]);
    } catch (err) {
      console.warn('[profile] save warning:', err);
    }
  }, []);

  const updateAppearance = (patch: Partial<CharacterAppearance>) => {
    setProfile((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...patch },
    }));
  };

  const handleCitySelect = (cityId: string) => {
    const city = CITIES_CATALOG.find((c) => c.id === cityId) || CITIES_CATALOG[0];
    const validHome = city.homes.some((h) => h.id === profile.selectedHome)
      ? profile.selectedHome
      : city.homes[0].id;
    setProfile((prev) => ({
      ...prev,
      selectedCity: city.id,
      selectedHome: validHome,
    }));
  };

  const handleBuyOrSelectVehicle = async (vehicleId: string) => {
    setActionMsg(null);
    if (profile.ownedVehicles.includes(vehicleId)) {
      await persistProfile({ selectedVehicle: vehicleId });
      setActionMsg('Primary vehicle updated — parked outside your home!');
      return;
    }
    const item = VEHICLE_CATALOG.find((v) => v.id === vehicleId);
    if (!item) return;
    if (profile.money < item.price) {
      setActionMsg(`Need $${(item.price - profile.money).toLocaleString()} more! Play in any city to earn bonuses.`);
      return;
    }
    try {
      const res = await buyVehicleApi(profile.uid, vehicleId);
      setProfile(res.profile);
      await saveFirestoreProfile(profile.uid, {
        money: res.profile.money,
        ownedVehicles: res.profile.ownedVehicles,
        selectedVehicle: res.profile.selectedVehicle,
      });
      setActionMsg(`Purchased ${item.name}! Selected as your driveway ride.`);
    } catch (err: any) {
      setActionMsg(err?.message || 'Purchase failed');
    }
  };

  const handleMoneyEvent = useCallback(
    async (kind: 'play_bonus' | 'fine' | 'toll' | 'fuel', amount: number, reason: string) => {
      const uid = profileRef.current.uid;
      let delta = kind === 'play_bonus' ? amount : -amount;
      let nextMoney = Math.max(0, profileRef.current.money + delta);

      setProfile((prev) => ({
        ...prev,
        money: Math.max(0, prev.money + delta),
      }));
      setEconFlash({ id: Date.now(), delta, reason });

      if (uid) {
        try {
          const res = await recordEconomyEventApi(uid, kind, amount);
          nextMoney = res.money;
          setProfile((prev) => ({ ...prev, money: res.money, stats: res.stats }));
          await saveFirestoreProfile(uid, {
            money: nextMoney,
            playTimeSeconds: res.stats.playSeconds,
            finesTotal: res.stats.finesPaid,
            tollsTotal: res.stats.tollsPaid,
          });
        } catch (err) {
          console.warn('[economy] sync warning:', err);
        }
      }
    },
    [],
  );

  const launchGame = async () => {
    await persistProfile({
      name: profile.name,
      deviceMode,
      selectedCity: profile.selectedCity,
      selectedHome: profile.selectedHome,
      selectedVehicle: profile.selectedVehicle,
      appearance: profile.appearance,
    });

    if (gameRef.current) {
      gameRef.current.dispose();
      gameRef.current = null;
    }
    const canvas = document.getElementById('game') as HTMLCanvasElement | null;
    if (!canvas) return;

    setGameReady(false);
    setPeers([]);
    setChatMsgs([]);
    setStep('playing');

    const g = new Game(canvas, {
      cityId: profile.selectedCity,
      homeId: profile.selectedHome,
      vehicleId: profile.selectedVehicle,
      ownedVehicles: profile.ownedVehicles,
      appearance: profile.appearance,
      playerName: profile.name,
      deviceMode,
      multiplayerEnabled,
      uid: profile.uid || 'guest',
      onMoneyEvent: handleMoneyEvent,
      onPeersChange: (list: Array<{ id: string; name: string }>) => setPeers(list),
      onChatMessage: (msg: ChatMsg) => setChatMsgs((prev) => [...prev.slice(-24), msg]),
      onReady: () => setGameReady(true),
    });
    gameRef.current = g;
    g.start().catch((err) => {
      console.error('[game] Start failed:', err);
    });
  };

  const exitGameTo = (targetStep: Step) => {
    if (gameRef.current) {
      gameRef.current.dispose();
      gameRef.current = null;
    }
    setGameReady(false);
    setStep(targetStep);
  };

  useEffect(() => {
    if (!econFlash) return;
    const t = setTimeout(() => setEconFlash(null), 3200);
    return () => clearTimeout(t);
  }, [econFlash]);

  const activeCity = useMemo(
    () => CITIES_CATALOG.find((c) => c.id === profile.selectedCity) || CITIES_CATALOG[0],
    [profile.selectedCity],
  );
  const activeHome = useMemo(
    () => activeCity.homes.find((h) => h.id === profile.selectedHome) || activeCity.homes[0],
    [activeCity, profile.selectedHome],
  );
  const filteredCities = useMemo(
    () => CITIES_CATALOG.filter((c) => cityFilter === 'All' || c.category === cityFilter),
    [cityFilter],
  );

  // Mobile body class for responsive HUD scaling
  useEffect(() => {
    document.body.classList.toggle('is-mobile-ui', deviceMode === 'mobile');
  }, [deviceMode]);

  return (
    <>
      {step !== 'playing' && (
        <div className="app-shell">
          {/* Top Navigation Bar */}
          <header className="topbar">
            <div className="brand-cluster">
              <img src={logoImg} alt="GTA World Logo" className="brand-logo" />
              <div>
                <div className="brand-title">GTA WORLD</div>
                <div className="brand-sub">OPEN-WORLD MULTIPLAYER</div>
              </div>
            </div>

            <div className="topbar-right">
              {firebaseUser && (
                <div className="wallet-chip">
                  <Wallet size={16} />
                  <span>${profile.money.toLocaleString()}</span>
                </div>
              )}
              <button type="button" className="ghost-btn" onClick={() => setSetupOpen(true)}>
                <Settings size={15} />
                <span>Setup & Env</span>
              </button>
              {firebaseUser && (
                <button type="button" className="ghost-btn" onClick={handleSignOut}>
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </header>

          {/* SCREEN 1: LANDING / DEVICE / FIREBASE GOOGLE SIGN IN */}
          {step === 'landing' && (
            <main className="landing-wrap">
              <div className="hero-banner-card">
                <img src={bannerImg} alt="GTA World Banner" className="hero-banner-img" />
                <div className="hero-banner-overlay">
                  <div className="hero-badge">KERALA & GLOBAL OPEN WORLD</div>
                  <h1>Explore Iconic Streets, Drive Anywhere, Build Your Empire</h1>
                  <p>
                    Customize every detail of your character, pick your neighborhood home across Kochi,
                    Pookkottumpadam, Trivandrum, Kozhikkode, New York, Dubai, London, or Tokyo, and play live with friends.
                  </p>
                </div>
              </div>

              <section className="panel-card">
                <div className="section-head">
                  <h2>1. Choose Your Device & Control Mode</h2>
                  <span className="muted-tag">Saved automatically in cookies</span>
                </div>
                <div className="device-grid">
                  {[
                    {
                      id: 'mobile' as DeviceMode,
                      title: 'Mobile',
                      icon: Smartphone,
                      desc: 'On-screen touch joystick, touch look & action pads',
                    },
                    {
                      id: 'laptop' as DeviceMode,
                      title: 'Laptop',
                      icon: Laptop,
                      desc: 'WASD + boosted trackpad camera sensitivity',
                    },
                    {
                      id: 'desktop' as DeviceMode,
                      title: 'Desktop',
                      icon: Monitor,
                      desc: 'Full Pointer-Lock mouse + keyboard precision',
                    },
                  ].map((d) => {
                    const Icon = d.icon;
                    const selected = deviceMode === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`device-card ${selected ? 'selected' : ''}`}
                        onClick={() => handleSelectDevice(d.id)}
                      >
                        <Icon size={26} />
                        <div className="device-title">{d.title}</div>
                        <div className="device-desc">{d.desc}</div>
                        {selected && <span className="selected-check"><Check size={14} /> Active</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="auth-cta-bar">
                  {!authReady ? (
                    <div className="muted-tag">Checking Firebase authentication...</div>
                  ) : firebaseUser ? (
                    <div className="signed-in-cta">
                      <div className="user-pill">
                        {firebaseUser.photoURL && <img src={firebaseUser.photoURL} alt="" className="user-avatar" />}
                        <div>
                          <div className="user-name">{firebaseUser.displayName || profile.name}</div>
                          <div className="user-email">{firebaseUser.email}</div>
                        </div>
                      </div>
                      <button type="button" className="primary-btn go-btn" onClick={() => setStep('home')}>
                        <Play size={18} />
                        <span>GO</span>
                      </button>
                    </div>
                  ) : (
                    <div className="signed-out-cta">
                      <button
                        type="button"
                        className="primary-btn google-btn"
                        disabled={authBusy}
                        onClick={handleGoogleSignIn}
                      >
                        <span>{authBusy ? 'Signing in...' : 'Sign Up / Sign In using Google'}</span>
                      </button>
                      {authError && <div className="error-text">{authError}</div>}
                    </div>
                  )}
                </div>
              </section>
            </main>
          )}

          {/* SCREEN 2: HOME / CHARACTER STUDIO */}
          {step === 'home' && (
            <main className="studio-layout">
              <div className="studio-left">
                <div className="studio-preview-card">
                  <div className="studio-name-plate">
                    <div>
                      <div className="muted-tag">CHARACTER PROFILE</div>
                      <h2>{profile.name}</h2>
                    </div>
                    <div className="wallet-badge-lg">${profile.money.toLocaleString()}</div>
                  </div>
                  <CharacterPreview3D appearance={profile.appearance} />
                  <div className="studio-home-summary">
                    <Home size={16} />
                    <span>Home: <strong>{activeHome.name}</strong> ({activeCity.name})</span>
                  </div>
                </div>
              </div>

              <div className="studio-right panel-card">
                <div className="studio-tabs">
                  <button
                    type="button"
                    className={studioTab === 'identity' ? 'active' : ''}
                    onClick={() => setStudioTab('identity')}
                  >
                    <User size={15} /> Identity & Home
                  </button>
                  <button
                    type="button"
                    className={studioTab === 'head' ? 'active' : ''}
                    onClick={() => setStudioTab('head')}
                  >
                    Face, Hats & Beard
                  </button>
                  <button
                    type="button"
                    className={studioTab === 'outfit' ? 'active' : ''}
                    onClick={() => setStudioTab('outfit')}
                  >
                    Shirt, Overcoat & Pants
                  </button>
                </div>

                <div className="studio-tab-body">
                  {studioTab === 'identity' && (
                    <div className="form-stack">
                      <label className="field-block">
                        <span>Character Name</span>
                        <input
                          type="text"
                          maxLength={32}
                          value={profile.name}
                          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Enter your character name"
                        />
                      </label>

                      <div className="field-block">
                        <span>Starter City & Home Plot</span>
                        <div className="mini-city-row">
                          {CITIES_CATALOG.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={`chip-btn ${profile.selectedCity === c.id ? 'active' : ''}`}
                              onClick={() => handleCitySelect(c.id)}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                        <div className="home-plot-list">
                          {activeCity.homes.map((h) => (
                            <button
                              key={h.id}
                              type="button"
                              className={`home-plot-btn ${profile.selectedHome === h.id ? 'active' : ''}`}
                              onClick={() => setProfile((p) => ({ ...p, selectedHome: h.id }))}
                            >
                              <div>
                                <strong>{h.name}</strong>
                                <div className="muted-tag">{h.district} · {h.style}</div>
                              </div>
                              {profile.selectedHome === h.id && <Check size={16} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field-row-between">
                        <div>
                          <strong>Multiplayer Mode</strong>
                          <div className="muted-tag">See live players, vehicles & city chat</div>
                        </div>
                        <button
                          type="button"
                          className={`chip-btn ${multiplayerEnabled ? 'active' : ''}`}
                          onClick={() => setMultiplayerEnabled((v) => !v)}
                        >
                          <Users size={15} /> {multiplayerEnabled ? 'Multiplayer ON' : 'Solo Mode'}
                        </button>
                      </div>
                    </div>
                  )}

                  {studioTab === 'head' && (
                    <div className="form-stack">
                      <div className="field-block">
                        <span>Skin Tone</span>
                        <div className="swatch-row">
                          {APPEARANCE_OPTIONS.skinTones.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              title={s.label}
                              className={`swatch ${profile.appearance.skinTone === s.value ? 'active' : ''}`}
                              style={{ background: s.value }}
                              onClick={() => updateAppearance({ skinTone: s.value })}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="field-block">
                        <span>Face Style & Eyewear</span>
                        <div className="chip-wrap">
                          {APPEARANCE_OPTIONS.faces.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              className={`chip-btn ${profile.appearance.faceStyle === f.id ? 'active' : ''}`}
                              onClick={() => updateAppearance({ faceStyle: f.id as CharacterAppearance['faceStyle'] })}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field-block">
                        <span>Hat</span>
                        <div className="chip-wrap">
                          {APPEARANCE_OPTIONS.hats.map((h) => (
                            <button
                              key={h.id}
                              type="button"
                              className={`chip-btn ${profile.appearance.hat === h.id ? 'active' : ''}`}
                              onClick={() => updateAppearance({ hat: h.id as CharacterAppearance['hat'] })}
                            >
                              {h.label}
                            </button>
                          ))}
                        </div>
                        <div className="swatch-row">
                          {APPEARANCE_OPTIONS.palette.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`swatch ${profile.appearance.hatColor === c ? 'active' : ''}`}
                              style={{ background: c }}
                              onClick={() => updateAppearance({ hatColor: c })}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="field-block">
                        <span>Mustache</span>
                        <div className="chip-wrap">
                          {APPEARANCE_OPTIONS.mustaches.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              className={`chip-btn ${profile.appearance.mustache === m.id ? 'active' : ''}`}
                              onClick={() => updateAppearance({ mustache: m.id as CharacterAppearance['mustache'] })}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field-block">
                        <span>Beard</span>
                        <div className="chip-wrap">
                          {APPEARANCE_OPTIONS.beards.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              className={`chip-btn ${profile.appearance.beard === b.id ? 'active' : ''}`}
                              onClick={() => updateAppearance({ beard: b.id as CharacterAppearance['beard'] })}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                        <div className="swatch-row">
                          {APPEARANCE_OPTIONS.hairColors.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`swatch ${profile.appearance.facialHairColor === c ? 'active' : ''}`}
                              style={{ background: c }}
                              onClick={() => updateAppearance({ facialHairColor: c })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {studioTab === 'outfit' && (
                    <div className="form-stack">
                      <div className="field-block">
                        <span>Shirt Style & Color</span>
                        <div className="chip-wrap">
                          {APPEARANCE_OPTIONS.shirtStyles.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className={`chip-btn ${profile.appearance.shirtStyle === s.id ? 'active' : ''}`}
                              onClick={() => updateAppearance({ shirtStyle: s.id as CharacterAppearance['shirtStyle'] })}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                        <div className="swatch-row">
                          {APPEARANCE_OPTIONS.palette.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`swatch ${profile.appearance.shirtColor === c ? 'active' : ''}`}
                              style={{ background: c }}
                              onClick={() => updateAppearance({ shirtColor: c })}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="field-block">
                        <span>Overcoat / Jacket & Color</span>
                        <div className="chip-wrap">
                          {APPEARANCE_OPTIONS.overcoats.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              className={`chip-btn ${profile.appearance.overcoat === o.id ? 'active' : ''}`}
                              onClick={() => updateAppearance({ overcoat: o.id as CharacterAppearance['overcoat'] })}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                        <div className="swatch-row">
                          {APPEARANCE_OPTIONS.palette.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`swatch ${profile.appearance.overcoatColor === c ? 'active' : ''}`}
                              style={{ background: c }}
                              onClick={() => updateAppearance({ overcoatColor: c })}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="field-block">
                        <span>Pants Style & Color</span>
                        <div className="chip-wrap">
                          {APPEARANCE_OPTIONS.pantsStyles.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className={`chip-btn ${profile.appearance.pantsStyle === p.id ? 'active' : ''}`}
                              onClick={() => updateAppearance({ pantsStyle: p.id as CharacterAppearance['pantsStyle'] })}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <div className="swatch-row">
                          {APPEARANCE_OPTIONS.palette.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`swatch ${profile.appearance.pantsColor === c ? 'active' : ''}`}
                              style={{ background: c }}
                              onClick={() => updateAppearance({ pantsColor: c })}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="field-block">
                        <span>Shoes Color</span>
                        <div className="swatch-row">
                          {APPEARANCE_OPTIONS.palette.slice(0, 7).map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`swatch ${profile.appearance.shoeColor === c ? 'active' : ''}`}
                              style={{ background: c }}
                              onClick={() => updateAppearance({ shoeColor: c })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="studio-footer">
                  <button type="button" className="ghost-btn" onClick={() => setStep('landing')}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={async () => {
                      await persistProfile({
                        name: profile.name,
                        appearance: profile.appearance,
                        selectedCity: profile.selectedCity,
                        selectedHome: profile.selectedHome,
                      });
                      setStep('city');
                    }}
                  >
                    <Play size={16} /> PLAY — CHOOSE CITY MAP
                  </button>
                </div>
              </div>
            </main>
          )}

          {/* SCREEN 3: CITY / MAP SELECTION */}
          {step === 'city' && (
            <main className="page-container">
              <div className="page-header">
                <div>
                  <div className="muted-tag">STEP 3 · OPEN WORLD MAPS</div>
                  <h1>Choose Your City & Starting Home</h1>
                </div>
                <div className="chip-wrap">
                  {(['All', 'Kerala', 'International'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`chip-btn ${cityFilter === tab ? 'active' : ''}`}
                      onClick={() => setCityFilter(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cities-grid">
                {filteredCities.map((city) => {
                  const selected = profile.selectedCity === city.id;
                  const online = cityCounts[city.id] || 0;
                  return (
                    <div
                      key={city.id}
                      className={`city-card ${selected ? 'selected' : ''}`}
                      style={{ borderColor: selected ? city.themeColor : undefined }}
                      onClick={() => handleCitySelect(city.id)}
                    >
                      <div className="city-card-head">
                        <div>
                          <span className="city-cat">{city.category}</span>
                          <h3>{city.name}</h3>
                          <div className="muted-tag">{city.regionLabel}</div>
                        </div>
                        <div className="online-badge">
                          <Users size={13} /> {online} online
                        </div>
                      </div>
                      <p className="city-tagline">{city.tagline}</p>
                      <ul className="city-highlights">
                        {city.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                      {selected && (
                        <div className="city-home-picker" onClick={(e) => e.stopPropagation()}>
                          <div className="muted-tag">Pick Start Home:</div>
                          <div className="chip-wrap">
                            {city.homes.map((h) => (
                              <button
                                key={h.id}
                                type="button"
                                className={`chip-btn ${profile.selectedHome === h.id ? 'active' : ''}`}
                                onClick={() => setProfile((p) => ({ ...p, selectedHome: h.id }))}
                              >
                                <MapPin size={12} /> {h.district}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="page-footer">
                <button type="button" className="ghost-btn" onClick={() => setStep('home')}>
                  <ArrowLeft size={16} /> Back to Studio
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={async () => {
                    await persistProfile({
                      selectedCity: profile.selectedCity,
                      selectedHome: profile.selectedHome,
                    });
                    setStep('vehicles');
                  }}
                >
                  <Car size={16} /> NEXT — SELECT VEHICLES
                </button>
              </div>
            </main>
          )}

          {/* SCREEN 4: VEHICLE DEALERSHIP & GARAGE */}
          {step === 'vehicles' && (
            <main className="page-container">
              <div className="page-header">
                <div>
                  <div className="muted-tag">STEP 4 · GARAGE & DEALERSHIP ({activeCity.name.toUpperCase()})</div>
                  <h1>Choose or Unlock Your Vehicles</h1>
                </div>
                <div className="wallet-badge-lg">Balance: ${profile.money.toLocaleString()}</div>
              </div>

              {actionMsg && <div className="info-banner">{actionMsg}</div>}

              <div className="vehicles-grid">
                {VEHICLE_CATALOG.map((v) => {
                  const owned = profile.ownedVehicles.includes(v.id);
                  const selected = profile.selectedVehicle === v.id;
                  const canAfford = profile.money >= v.price;
                  return (
                    <div key={v.id} className={`vehicle-card ${selected ? 'selected' : ''}`}>
                      <div className="vehicle-top">
                        <span className="city-cat">{v.category}</span>
                        <span className={`price-tag ${owned ? 'owned' : ''}`}>
                          {owned ? (v.starter ? 'STARTER OWNED' : 'OWNED') : `$${v.price.toLocaleString()}`}
                        </span>
                      </div>
                      <h3>{v.name}</h3>
                      <p className="city-tagline">{v.description}</p>
                      <div className="vehicle-meta">Top Speed: {v.topSpeedKmh} km/h</div>
                      <button
                        type="button"
                        className={`full-btn ${selected ? 'primary-btn' : owned ? 'ghost-btn' : canAfford ? 'primary-btn' : 'disabled-btn'}`}
                        disabled={!owned && !canAfford}
                        onClick={() => handleBuyOrSelectVehicle(v.id)}
                      >
                        {selected
                          ? 'Selected for Home Driveway'
                          : owned
                          ? 'Select Vehicle'
                          : canAfford
                          ? `Buy for $${v.price.toLocaleString()}`
                          : `Need $${(v.price - profile.money).toLocaleString()}`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="page-footer">
                <button type="button" className="ghost-btn" onClick={() => setStep('city')}>
                  <ArrowLeft size={16} /> Back to Map
                </button>
                <button type="button" className="primary-btn go-btn" onClick={launchGame}>
                  <Play size={18} /> START IN {activeCity.name.toUpperCase()}
                </button>
              </div>
            </main>
          )}

          {/* Cookie Management Bar */}
          {!cookieConsent && (
            <div className="cookie-bar">
              <div className="cookie-text">
                <Cookie size={18} />
                <span>
                  GTA World uses cookies to remember your device controls ({deviceMode}), session sign-in, and game preferences.
                </span>
              </div>
              <div className="cookie-actions">
                <button type="button" className="ghost-btn" onClick={() => handleCookieConsent('essential')}>
                  Essential Only
                </button>
                <button type="button" className="primary-btn" onClick={() => handleCookieConsent('accepted')}>
                  Accept Cookies
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IN-GAME OVERLAYS (WALLET, MULTIPLAYER CHAT, MOBILE CONTROLS, SWITCH CITY) */}
      {step === 'playing' && gameReady && (
        <div className="ingame-overlay">
          <div className="ingame-topbar">
            <div className="ingame-stat-pill">
              <Wallet size={15} />
              <span className="money-val">${profile.money.toLocaleString()}</span>
              <span className="city-label">· {activeCity.name}</span>
            </div>

            {multiplayerEnabled && (
              <button
                type="button"
                className="ingame-btn"
                onClick={() => {
                  setChatOpen((o) => !o);
                  gameRef.current?.input?.exitLock();
                }}
              >
                <Users size={14} />
                <span>{peers.length + 1} Online</span>
                <MessageSquare size={14} />
              </button>
            )}

            <button
              type="button"
              className="ingame-btn"
              onClick={() => exitGameTo('city')}
            >
              Switch Map / Vehicles
            </button>

            <button
              type="button"
              className="ingame-btn"
              onClick={() => exitGameTo('home')}
            >
              Home Studio
            </button>
          </div>

          {econFlash && (
            <div className={`econ-toast ${econFlash.delta >= 0 ? 'plus' : 'minus'}`}>
              {econFlash.delta >= 0 ? `+$${econFlash.delta}` : `-$${Math.abs(econFlash.delta)}`} · {econFlash.reason}
            </div>
          )}

          {chatOpen && (
            <div className="mp-chat-drawer">
              <div className="mp-chat-head">
                <strong>{activeCity.name} Multiplayer Chat ({peers.length + 1})</strong>
                <button type="button" className="icon-btn" onClick={() => setChatOpen(false)}>×</button>
              </div>
              <div className="mp-chat-list">
                {chatMsgs.length === 0 && (
                  <div className="muted-tag">Say hello to players in {activeCity.name}!</div>
                )}
                {chatMsgs.map((m, i) => (
                  <div key={`${m.ts}_${i}`} className={`mp-chat-msg ${m.isSelf ? 'self' : ''}`}>
                    <strong>{m.name}:</strong> {m.text}
                  </div>
                ))}
              </div>
              <form
                className="mp-chat-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatDraft.trim()) return;
                  gameRef.current?.multiplayer?.sendChat(chatDraft.trim());
                  setChatDraft('');
                }}
              >
                <input
                  type="text"
                  maxLength={120}
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="Message city..."
                />
                <button type="submit" aria-label="Send"><Send size={14} /></button>
              </form>
            </div>
          )}

          {deviceMode === 'mobile' && (
            <MobileControls
              onAxes={(mx, my, sprint) => gameRef.current?.input?.setVirtualAxes(mx, my, sprint)}
              onKey={(code, down) => gameRef.current?.input?.triggerKey(code, down)}
              onInteract={() => gameRef.current?.interact()}
              onToggleMap={() => gameRef.current?.hud?.toggleMap()}
            />
          )}

          <div className="economy-rules-hint">
            <ShieldAlert size={13} />
            <span>+Playtime Bonus · -Police & School Speed Fines · -Toll Plazas · -Petrol</span>
          </div>
        </div>
      )}

      <SetupGuideModal open={setupOpen} onClose={() => setSetupOpen(false)} dbStatus={dbStatus} />
    </>
  );
}

export default App;
