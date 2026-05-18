import { applyOfflineReward, initialState, normalizeState } from './gameLogic';
import { syncGlobalState } from './globalWorld';
import type { GameState } from './types';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const CLOUD_THROTTLE_MS = 15_000;
const MAX_SAVE_BYTES = 250_000;
const API_URL = import.meta.env.VITE_API_URL ?? '';

type TelegramStorage = {
  setItem?: (key: string, value: string, callback?: (error?: string | null, success?: boolean) => void) => void;
  getItem?: (key: string, callback: (error?: string | null, value?: string | null) => void) => void;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function telegramInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

function isTelegramRuntime(): boolean {
  const webApp = window.Telegram?.WebApp as
    | { initData?: string; initDataUnsafe?: { user?: unknown; start_param?: unknown } }
    | undefined;
  return Boolean(webApp?.initData || webApp?.initDataUnsafe?.user || webApp?.initDataUnsafe?.start_param);
}

function canUseServerSave(): boolean {
  return Boolean(API_URL && telegramInitData());
}

function cloudStorage(): TelegramStorage | null {
  if (!isTelegramRuntime()) return null;
  return window.Telegram?.WebApp?.CloudStorage ?? null;
}

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = 2500): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) { settled = true; resolve(fallback); }
    }, timeoutMs);
    promise
      .then((value) => {
        if (!settled) { settled = true; resolve(value); }
      })
      .catch(() => {
        if (!settled) { settled = true; resolve(fallback); }
      })
      .finally(() => window.clearTimeout(timer));
  });
}

function parseSave(raw: string | null): GameState | null {
  if (!raw || typeof raw !== 'string' || raw.length > MAX_SAVE_BYTES) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  try {
    return syncGlobalState(normalizeState(parsed as Partial<GameState>));
  } catch {
    return null;
  }
}

async function loadServerSave(): Promise<GameState | null> {
  if (!canUseServerSave()) return null;
  const response = await withTimeout(
    fetch(`${API_URL}/api/save`, {
      headers: { Authorization: `tma ${telegramInitData()}` },
    }),
    null,
  );
  if (!response?.ok) return null;
  const payload = await response.json().catch(() => null);
  const rawSave = payload?.save?.data;
  if (!rawSave || !isPlainObject(rawSave)) return null;
  try {
    return syncGlobalState(normalizeState(rawSave as Partial<GameState>));
  } catch {
    return null;
  }
}

async function saveServerState(state: GameState) {
  if (!canUseServerSave()) return;
  await fetch(`${API_URL}/api/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify(state),
  }).catch(() => undefined);
}

function finalizeLoadedState(state: GameState): GameState {
  return syncGlobalState(applyOfflineReward(state));
}

export async function loadGame(): Promise<GameState> {
  const serverSave = await loadServerSave();
  if (serverSave) {
    const state = finalizeLoadedState(serverSave);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded or storage disabled — silently ignore, we still have state in memory.
    }
    return state;
  }

  const fromLocal = parseSave(localStorage.getItem(STORAGE_KEY));
  if (fromLocal) return finalizeLoadedState(fromLocal);

  const cloud = cloudStorage();
  if (cloud?.getItem) {
    const cloudSave = await withTimeout(
      new Promise<string | null>((resolve) => {
        try {
          cloud.getItem?.(STORAGE_KEY, (_error, value) => resolve(value ?? null));
        } catch {
          resolve(null);
        }
      }),
      null,
      700,
    );
    const parsedCloud = parseSave(cloudSave);
    if (parsedCloud) {
      const state = finalizeLoadedState(parsedCloud);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Quota exceeded or storage disabled — silently ignore, we still have state in memory.
      }
      if (canUseServerSave()) void saveServerState(state);
      return state;
    }
  }

  return syncGlobalState(initialState);
}

let lastCloudWriteAt = 0;
let pendingCloudPayload: string | null = null;
let cloudFlushTimer: number | null = null;
let lastServerWriteAt = 0;
let pendingServerState: GameState | null = null;
let serverFlushTimer: number | null = null;

function flushCloud() {
  cloudFlushTimer = null;
  if (pendingCloudPayload === null) return;
  const payload = pendingCloudPayload;
  pendingCloudPayload = null;
  lastCloudWriteAt = Date.now();
  try {
    cloudStorage()?.setItem?.(STORAGE_KEY, payload);
  } catch {
    // CloudStorage is best-effort; localStorage already has the truth.
  }
}

function scheduleCloudWrite(payload: string) {
  pendingCloudPayload = payload;
  const elapsed = Date.now() - lastCloudWriteAt;
  if (elapsed >= CLOUD_THROTTLE_MS) {
    flushCloud();
    return;
  }
  if (cloudFlushTimer !== null) return;
  cloudFlushTimer = window.setTimeout(flushCloud, CLOUD_THROTTLE_MS - elapsed);
}

function flushServer() {
  serverFlushTimer = null;
  if (!pendingServerState) return;
  const state = pendingServerState;
  pendingServerState = null;
  lastServerWriteAt = Date.now();
  void saveServerState(state);
}

function scheduleServerWrite(state: GameState) {
  if (!canUseServerSave()) return;
  pendingServerState = state;
  const elapsed = Date.now() - lastServerWriteAt;
  if (elapsed >= CLOUD_THROTTLE_MS) {
    flushServer();
    return;
  }
  if (serverFlushTimer !== null) return;
  serverFlushTimer = window.setTimeout(flushServer, CLOUD_THROTTLE_MS - elapsed);
}

export function saveGame(state: GameState) {
  const safeState = syncGlobalState(normalizeState({ ...state, lastSavedAt: Date.now() }));
  let payload: string;
  try {
    payload = JSON.stringify(safeState);
  } catch {
    return;
  }
  if (payload.length > MAX_SAVE_BYTES) return;
  try {
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Storage disabled (private mode / quota); skip and hope cloud/server picks it up.
  }
  scheduleCloudWrite(payload);
  scheduleServerWrite(safeState);
}

export function resetGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  pendingCloudPayload = null;
  pendingServerState = null;
  if (cloudFlushTimer !== null) {
    window.clearTimeout(cloudFlushTimer);
    cloudFlushTimer = null;
  }
  if (serverFlushTimer !== null) {
    window.clearTimeout(serverFlushTimer);
    serverFlushTimer = null;
  }
  try {
    cloudStorage()?.setItem?.(STORAGE_KEY, '');
  } catch {
    // ignore
  }
  if (canUseServerSave()) {
    fetch(`${API_URL}/api/save`, {
      method: 'DELETE',
      headers: { Authorization: `tma ${telegramInitData()}` },
    }).catch(() => undefined);
  }
}
