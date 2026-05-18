import { applyOfflineReward, initialState, normalizeState } from './gameLogic';
import { syncGlobalState } from './globalWorld';
import type { GameState } from './types';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const CLOUD_THROTTLE_MS = 15_000;
const ACTIVE_DEVELOPMENT_SERVER_THROTTLE_MS = 2_500;
const MAX_SAVE_BYTES = 250_000;
const API_URL = import.meta.env.VITE_API_URL ?? '';

type TelegramStorage = {
  setItem?: (key: string, value: string, callback?: (error?: string | null, success?: boolean) => void) => void;
  getItem?: (key: string, callback: (error?: string | null, value?: string | null) => void) => void;
};

type DevelopmentAction = {
  endpoint: 'start' | 'skip' | 'promote' | 'resolve-event' | 'release';
  body?: Record<string, unknown>;
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

function readLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
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
  const payload = await withTimeout(
    fetch(`${API_URL}/api/save`, {
      headers: { Authorization: `tma ${telegramInitData()}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null),
    null,
    2800,
  );
  const rawSave = payload?.save?.data;
  if (!rawSave || !isPlainObject(rawSave)) return null;
  try {
    return syncGlobalState(normalizeState(rawSave as Partial<GameState>));
  } catch {
    return null;
  }
}

async function saveServerState(state: GameState, keepalive = false) {
  if (!canUseServerSave()) return;
  await fetch(`${API_URL}/api/save`, {
    method: 'POST',
    keepalive,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify(state),
  }).catch(() => undefined);
}

async function postDevelopmentAction(action: DevelopmentAction) {
  if (!canUseServerSave()) return;
  const payload = await withTimeout(
    fetch(`${API_URL}/api/development/${action.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `tma ${telegramInitData()}`,
      },
      body: JSON.stringify(action.body ?? {}),
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null),
    null,
    4500,
  );

  const serverSave = payload?.save?.data;
  if (!serverSave || !isPlainObject(serverSave)) return;

  try {
    const normalized = syncGlobalState(normalizeState(serverSave as Partial<GameState>));
    lastActionSnapshot = normalized;
    writeLocalStorage(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // If server payload cannot be normalized, keep the optimistic local state.
  }
}

function finalizeLoadedState(state: GameState): GameState {
  try {
    return syncGlobalState(applyOfflineReward(state));
  } catch {
    return syncGlobalState(normalizeState(state));
  }
}

function rememberLoadedState(state: GameState) {
  lastActionSnapshot = state;
  return state;
}

export async function loadGame(): Promise<GameState> {
  try {
    const serverSave = await loadServerSave();
    if (serverSave) {
      const state = finalizeLoadedState(serverSave);
      writeLocalStorage(STORAGE_KEY, JSON.stringify(state));
      return rememberLoadedState(state);
    }

    const fromLocal = parseSave(readLocalStorage(STORAGE_KEY));
    if (fromLocal) return rememberLoadedState(finalizeLoadedState(fromLocal));

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
        writeLocalStorage(STORAGE_KEY, JSON.stringify(state));
        if (canUseServerSave()) void saveServerState(state);
        return rememberLoadedState(state);
      }
    }

    return rememberLoadedState(syncGlobalState(initialState));
  } catch {
    return rememberLoadedState(syncGlobalState(initialState));
  }
}

let lastCloudWriteAt = 0;
let pendingCloudPayload: string | null = null;
let cloudFlushTimer: number | null = null;
let lastServerWriteAt = 0;
let pendingServerState: GameState | null = null;
let serverFlushTimer: number | null = null;
let lifecycleFlushInstalled = false;
let lastActionSnapshot: GameState | null = null;

function isActiveDevelopmentSave(state: GameState) {
  return Boolean(state.selectedProject?.startedAt || state.selectedProject?.pendingDevEvent || state.latestRelease);
}

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

function flushServer(keepalive = false) {
  serverFlushTimer = null;
  if (!pendingServerState) return;
  const state = pendingServerState;
  pendingServerState = null;
  lastServerWriteAt = Date.now();
  void saveServerState(state, keepalive);
}

function scheduleServerWrite(state: GameState) {
  if (!canUseServerSave()) return;
  pendingServerState = state;
  const throttleMs = isActiveDevelopmentSave(state) ? ACTIVE_DEVELOPMENT_SERVER_THROTTLE_MS : CLOUD_THROTTLE_MS;
  const elapsed = Date.now() - lastServerWriteAt;
  if (elapsed >= throttleMs) {
    flushServer();
    return;
  }
  if (serverFlushTimer !== null) return;
  serverFlushTimer = window.setTimeout(flushServer, throttleMs - elapsed);
}

function installLifecycleFlush() {
  if (lifecycleFlushInstalled || typeof window === 'undefined' || typeof document === 'undefined') return;
  lifecycleFlushInstalled = true;
  const flushAll = () => {
    flushCloud();
    flushServer(true);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAll();
  });
  window.addEventListener('pagehide', flushAll);
  window.addEventListener('beforeunload', flushAll);
}

function inferDevelopmentAction(previous: GameState | null, current: GameState): DevelopmentAction | null {
  if (!previous) return null;

  const previousProject = previous.selectedProject;
  const currentProject = current.selectedProject;

  if (previousProject?.startedAt && !currentProject && current.latestRelease?.createdAt !== previous.latestRelease?.createdAt) {
    return { endpoint: 'release' };
  }

  if (!previousProject?.startedAt && currentProject?.startedAt) {
    return { endpoint: 'start', body: { project: currentProject } };
  }

  if (!previousProject?.startedAt || !currentProject?.startedAt) return null;

  if (previousProject.pendingDevEvent && !currentProject.pendingDevEvent) {
    const scoreDelta = (currentProject.devDecisionScoreBonus ?? 0) - (previousProject.devDecisionScoreBonus ?? 0);
    const salesDelta = (currentProject.devDecisionSalesMultiplier ?? 1) - (previousProject.devDecisionSalesMultiplier ?? 1);
    return { endpoint: 'resolve-event', body: { choiceId: scoreDelta >= 0 || salesDelta >= 0 ? 'a' : 'b' } };
  }

  if (!previousProject.promotionUsed && currentProject.promotionUsed) {
    return { endpoint: 'promote' };
  }

  const progressDelta = currentProject.progress - previousProject.progress;
  const starDelta = previous.stars - current.stars;
  if (progressDelta >= 35 && starDelta >= 20 && currentProject.progress < 100 && !currentProject.pendingDevEvent) {
    return { endpoint: 'skip' };
  }

  return null;
}

function scheduleDevelopmentAction(previous: GameState | null, current: GameState) {
  const action = inferDevelopmentAction(previous, current);
  if (!action || !canUseServerSave()) return false;
  void postDevelopmentAction(action);
  return true;
}

export function saveGame(state: GameState) {
  installLifecycleFlush();
  const safeState = syncGlobalState(normalizeState({ ...state, lastSavedAt: Date.now() }));
  let payload: string;
  try {
    payload = JSON.stringify(safeState);
  } catch {
    return;
  }
  if (payload.length > MAX_SAVE_BYTES) return;
  writeLocalStorage(STORAGE_KEY, payload);
  scheduleCloudWrite(payload);

  const previousSnapshot = lastActionSnapshot;
  lastActionSnapshot = safeState;
  const actionHandled = scheduleDevelopmentAction(previousSnapshot, safeState);
  if (!actionHandled) scheduleServerWrite(safeState);
}

export function resetGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  pendingCloudPayload = null;
  pendingServerState = null;
  lastActionSnapshot = null;
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
