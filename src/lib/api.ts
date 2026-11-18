import type { CharacterAppearance, DeviceMode } from '../shared/catalog';

export interface PlayerProfile {
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

async function req<T>(url: string, init?: RequestInit, uid?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (uid) headers['x-player-uid'] = uid;
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function getHealth() {
  return req<{ ok: boolean; db: string; uptime: number }>('/api/health');
}

export async function saveCookieConsent(choice: 'accepted' | 'essential') {
  return req<{ ok: boolean; consent: string }>('/api/cookies/consent', {
    method: 'POST',
    body: JSON.stringify({ choice }),
  });
}

export async function saveDeviceCookie(deviceMode: DeviceMode) {
  return req<{ ok: boolean; deviceMode: DeviceMode }>('/api/cookies/device', {
    method: 'POST',
    body: JSON.stringify({ deviceMode }),
  });
}

export async function syncAuthSession(payload: {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  deviceMode: DeviceMode;
}) {
  return req<{ ok: boolean; profile: PlayerProfile }>('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, payload.uid);
}

export async function logoutSession() {
  return req<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export async function updateProfileApi(uid: string, patch: Partial<PlayerProfile>) {
  return req<{ ok: boolean; profile: PlayerProfile }>(
    '/api/profile',
    {
      method: 'PUT',
      body: JSON.stringify({ uid, ...patch }),
    },
    uid,
  );
}

export async function buyVehicleApi(uid: string, vehicleId: string) {
  return req<{ ok: boolean; profile: PlayerProfile }>(
    '/api/vehicles/buy',
    {
      method: 'POST',
      body: JSON.stringify({ uid, vehicleId }),
    },
    uid,
  );
}

export async function recordEconomyEventApi(
  uid: string,
  kind: 'play_bonus' | 'fine' | 'toll' | 'fuel',
  amount: number,
) {
  return req<{ ok: boolean; delta: number; money: number; stats: PlayerProfile['stats'] }>(
    '/api/economy/event',
    {
      method: 'POST',
      body: JSON.stringify({ uid, kind, amount }),
    },
    uid,
  );
}

export async function getCityPlayersCount(cityId: string) {
  return req<{ ok: boolean; count: number }>(`/api/cities/${encodeURIComponent(cityId)}/players`);
}
