import { applyOfflineReward, initialState, normalizeState } from './gameLogic';
import type { GameState } from './types';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const CLOUD_THROTTLE_MS = 15_000;
const MAX_SAVE_BYTES = 250_000;

type TelegramStorage = {
  setItem?: (key: string, value: string, callback?: (error?: string | null, success?: boolean) => void) => void;
  getItem?: (key: string, callback: (error?: string | null, value?: string | null) => void) => void;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTelegramRuntime(): boolean {
  const webApp = window.Telegram?.WebApp as
    | { initData?: string; initDataUnsafe?: { user?: unknown; start_param?: unknown } }
    | undefined;
  return Boolean(webApp?.initData || webApp?.initDataUnsafe?.user || webApp?.initDataUnsafe?.start_param);
}

function cloudStorage(): TelegramStorage | null {
  if (!isTelegramRuntime()) return null;
  return window.Telegram?.WebApp?.CloudStorage ?? null;
}

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = 700): Promise<T> {
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
  // Strict: only accept plain JSON objects. Arrays, strings, numbers, null are rejected
  // so we never spread non-object data into the merged state.
  if (!isPlainObject(parsed)) return null;
  try {
    return normalizeState(parsed as Partial<GameState>);
  } catch {
    return null;
  }
}

export async function loadGame(): Promise<GameState> {
  const fromLocal = parseSave(localStorage.getItem(STORAGE_KEY));
  if (fromLocal) return applyOfflineReward(fromLocal);

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
    );
    const parsedCloud = parseSave(cloudSave);
    if (parsedCloud) {
      const state = applyOfflineReward(parsedCloud);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Quota exceeded or storage disabled — silently ignore, we still have state in memory.
      }
      return state;
    }
  }

  return initialState;
}

let lastCloudWriteAt = 0;
let pendingCloudPayload: string | null = null;
let cloudFlushTimer: number | null = null;

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
  // The Telegram WebApp CloudStorage has tight rate limits; throttle to one
  // write per CLOUD_THROTTLE_MS, keeping the most recent payload.
  pendingCloudPayload = payload;
  const elapsed = Date.now() - lastCloudWriteAt;
  if (elapsed >= CLOUD_THROTTLE_MS) {
    flushCloud();
    return;
  }
  if (cloudFlushTimer !== null) return;
  cloudFlushTimer = window.setTimeout(flushCloud, CLOUD_THROTTLE_MS - elapsed);
}

export function saveGame(state: GameState) {
  const safeState = normalizeState({ ...state, lastSavedAt: Date.now() });
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
    // Storage disabled (private mode / quota); skip and hope cloud picks it up.
  }
  scheduleCloudWrite(payload);
}

export function resetGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  pendingCloudPayload = null;
  if (cloudFlushTimer !== null) {
    window.clearTimeout(cloudFlushTimer);
    cloudFlushTimer = null;
  }
  try {
    cloudStorage()?.setItem?.(STORAGE_KEY, '');
  } catch {
    // ignore
  }
}
