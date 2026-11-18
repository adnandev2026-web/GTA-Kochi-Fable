import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CITIES_CATALOG,
  DEFAULT_APPEARANCE,
  STARTER_VEHICLES,
  STARTING_MONEY,
  type CharacterAppearance,
  type DeviceMode,
} from '../shared/catalog';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'players', '_connection_probe'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[firebase] Firestore client is offline — check config or network');
      return false;
    }
    return true;
  }
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export interface CloudPlayerFields {
  uid: string;
  displayName?: string;
  characterName: string;
  deviceMode: DeviceMode;
  cityId: string;
  homeId: string;
  money: number;
  ownedVehicles: string[];
  selectedVehicle: string;
  playTimeSeconds: number;
  finesTotal: number;
  tollsTotal: number;
  appearance: CharacterAppearance;
}

export async function loadFirestoreProfile(user: User, defaultDevice: DeviceMode): Promise<CloudPlayerFields | null> {
  const path = `players/${user.uid}`;
  try {
    const ref = doc(db, 'players', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        uid: user.uid,
        displayName: String(d.displayName || user.displayName || ''),
        characterName: String(d.characterName || user.displayName || 'Street Explorer').slice(0, 32),
        deviceMode: (d.deviceMode as DeviceMode) || defaultDevice,
        cityId: String(d.cityId || CITIES_CATALOG[0].id),
        homeId: String(d.homeId || CITIES_CATALOG[0].homes[0].id),
        money: typeof d.money === 'number' ? d.money : STARTING_MONEY,
        ownedVehicles: Array.isArray(d.ownedVehicles) && d.ownedVehicles.length ? d.ownedVehicles : [...STARTER_VEHICLES],
        selectedVehicle: String(d.selectedVehicle || 'hatchback'),
        playTimeSeconds: typeof d.playTimeSeconds === 'number' ? d.playTimeSeconds : 0,
        finesTotal: typeof d.finesTotal === 'number' ? d.finesTotal : 0,
        tollsTotal: typeof d.tollsTotal === 'number' ? d.tollsTotal : 0,
        appearance: { ...DEFAULT_APPEARANCE, ...(d.appearance || {}) },
      };
    }

    const initial: CloudPlayerFields = {
      uid: user.uid,
      displayName: (user.displayName || '').slice(0, 80),
      characterName: (user.displayName || 'Street Explorer').slice(0, 32),
      deviceMode: defaultDevice,
      cityId: CITIES_CATALOG[0].id,
      homeId: CITIES_CATALOG[0].homes[0].id,
      money: STARTING_MONEY,
      ownedVehicles: [...STARTER_VEHICLES],
      selectedVehicle: 'hatchback',
      playTimeSeconds: 0,
      finesTotal: 0,
      tollsTotal: 0,
      appearance: { ...DEFAULT_APPEARANCE },
    };

    await setDoc(ref, {
      ...initial,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return initial;
  } catch (err) {
    console.warn('[firebase] Firestore profile load/create skipped or denied:', err);
    return null;
  }
}

export async function saveFirestoreProfile(uid: string, patch: Partial<CloudPlayerFields>): Promise<void> {
  const path = `players/${uid}`;
  try {
    const ref = doc(db, 'players', uid);
    const cleanPatch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (patch.displayName !== undefined) cleanPatch.displayName = String(patch.displayName).slice(0, 80);
    if (patch.characterName !== undefined) cleanPatch.characterName = String(patch.characterName).slice(0, 32) || 'Street Explorer';
    if (patch.deviceMode !== undefined) cleanPatch.deviceMode = patch.deviceMode;
    if (patch.cityId !== undefined) cleanPatch.cityId = String(patch.cityId).slice(0, 40);
    if (patch.homeId !== undefined) cleanPatch.homeId = String(patch.homeId).slice(0, 64);
    if (patch.money !== undefined) cleanPatch.money = Math.max(0, Math.round(patch.money));
    if (patch.ownedVehicles !== undefined) cleanPatch.ownedVehicles = patch.ownedVehicles.slice(0, 20);
    if (patch.selectedVehicle !== undefined) cleanPatch.selectedVehicle = String(patch.selectedVehicle).slice(0, 40);
    if (patch.playTimeSeconds !== undefined) cleanPatch.playTimeSeconds = Math.max(0, Math.round(patch.playTimeSeconds));
    if (patch.finesTotal !== undefined) cleanPatch.finesTotal = Math.max(0, Math.round(patch.finesTotal));
    if (patch.tollsTotal !== undefined) cleanPatch.tollsTotal = Math.max(0, Math.round(patch.tollsTotal));
    if (patch.appearance !== undefined) cleanPatch.appearance = patch.appearance;
    await updateDoc(ref, cleanPatch);
  } catch (err) {
    console.warn('[firebase] Firestore save warning:', path, err);
  }
}
