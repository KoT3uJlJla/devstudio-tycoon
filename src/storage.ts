import { applyOfflineReward, initialState, normalizeState } from './gameLogic';
import { syncGlobalState } from './globalWorld';
import type { GameState } from './types';

export const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v3';
const LEGACY_STORAGE_KEYS = ['devstudio_tycoon_mvp_save_v2', 'devstudio_tycoon_mvp_save_v1'];
const BACKEND_UI_ACTION_KEY = 'devstudio_backend_ui_action_endpoint';
const CLOUD_THROTTLE_MS = 15_000;
const ACTIVE_DEVELOPMENT_SERVER_THROTTLE_MS = 350;
const SERVER_SAVE_THROTTLE_MS = 350;
const SERVER_LOAD_TIMEOUT_MS = 9_000;
const LOCAL_SERVER_LOAD_TIMEOUT_MS = 2_800;
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

type WalletOverlay = { stars?: number };

type BackendSavePayload = {
  ok?: boolean;
  save?: { data?: unknown } | null;
  economy?: { stars?: unknown } | null;
};

type ServerLoadResult =
  | { kind: 'loaded'; state: GameState }
  | { kind: 'empty' }
  | { kind: 'unavailable' };

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

function clearLegacyLocalSaves() {
  try {
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function dispatchAuthoritativeSave(state: GameState) {
  try {
    window.dispatchEvent(new CustomEvent('devstudio:server-save', { detail: state }));
  } catch {
    // best-effort live sync
  }
}

function consumeDirectBackendAction(endpoint: DevelopmentAction['endpoint']) {
  try {
    if (sessionStorage.getItem(BACKEND_UI_ACTION_KEY) !== endpoint) return false;
    sessionStorage.removeItem(BACKEND_UI_ACTION_KEY);
    return true;
  } catch {
    return false;
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

function saveTimestamp(state: GameState | null) {
  const value = Number((state as unknown as { lastSavedAt?: unknown } | null)?.lastSavedAt);
  return Number.isFinite(value) ? value : 0;
}

function safeWalletNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function newestSave(...states: Array<GameState | null>) {
  return states.filter(Boolean).sort((a, b) => saveTimestamp(b) - saveTimestamp(a))[0] ?? null;
}

function walletOverlayFromPayload(payload: unknown): WalletOverlay | null {
  if (!isPlainObject(payload) || !payload.ok) return null;
  const economy = isPlainObject(payload.economy) ? payload.economy : null;
  const save = isPlainObject(payload.save) && isPlainObject(payload.save.data) ? payload.save.data : null;
  return {
    // Coins/RP are gameplay save resources. Never overlay them from economy.
    stars: safeWalletNumber(economy?.stars ?? save?.stars),
  };
}

async function loadWalletOverlay(): Promise<WalletOverlay | null> {
  if (!canUseServerSave()) return null;
  const payload = await withTimeout(
    fetch(`${API_URL}/api/wallet/state`, {
      headers: { Authorization: `tma ${telegramInitData()}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null),
    null,
    4200,
  );
  return walletOverlayFromPayload(payload);
}

function applyWalletOverlay(state: GameState, wallet: WalletOverlay | null): GameState {
  if (!wallet) return state;
  return syncGlobalState(normalizeState({
    ...state,
    ...(wallet.stars !== undefined ? { stars: wallet.stars } : {}),
  }));
}

function stateFromBackendPayload(payload: BackendSavePayload | null): GameState | null {
  const rawSave = payload?.save?.data;
  if (!payload?.ok || !rawSave || !isPlainObject(rawSave)) return null;
  try {
    const economyStars = safeWalletNumber(payload.economy?.stars);
    const merged = economyStars !== undefined ? { ...rawSave, stars: economyStars } : rawSave;
    return syncGlobalState(normalizeState(merged as Partial<GameState>));
  } catch {
    return null;
  }
}

function rememberAuthoritativeState(state: GameState) {
  lastActionSnapshot = state;
  writeLocalStorage(STORAGE_KEY, JSON.stringify(state));
  dispatchAuthoritativeSave(state);
}

async function fetchServerPayload(path: string, timeoutMs: number): Promise<BackendSavePayload | null> {
  if (!canUseServerSave()) return null;
  return withTimeout(
    fetch(`${API_URL}${path}`, {
      headers: { Authorization: `tma ${telegramInitData()}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null),
    null,
    timeoutMs,
  ) as Promise<BackendSavePayload | null>;
}

async function loadServerSave(): Promise<ServerLoadResult> {
  if (!canUseServerSave()) return { kind: 'unavailable' };
  const timeoutMs = isTelegramRuntime() ? SERVER_LOAD_TIMEOUT_MS : LOCAL_SERVER_LOAD_TIMEOUT_MS;

  const payload = await fetchServerPayload('/api/save', timeoutMs);
  if (!payload) return { kind: 'unavailable' };

  const state = stateFromBackendPayload(payload);
  if (state) return { kind: 'loaded', state };

  // Authenticated Telegram users are server-authoritative. If the backend says
  // there is no save, old localStorage/CloudStorage must not resurrect progress.
  if (payload.ok && !payload.save) {
    const reconciled = await fetchServerPayload('/api/stars/reconcile', 4200);
    const reconciledState = stateFromBackendPayload(reconciled);
    return reconciledState ? { kind: 'loaded', state: reconciledState } : { kind: 'empty' };
  }

  return { kind: 'unavailable' };
}

async function saveServerState(state: GameState, keepalive = false) {
  if (!canUseServerSave()) return;
  const payload = await fetch(`${API_URL}/api/save`, {
    method: 'POST',
    keepalive,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify(state),
  })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null) as BackendSavePayload | null;

  const authoritativeState = stateFromBackendPayload(payload);
  if (authoritativeState) rememberAuthoritativeState(authoritativeState);
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

  const normalized = stateFromBackendPayload(payload as BackendSavePayload | null);
  if (normalized) rememberAuthoritativeState(normalized);
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

function initialAuthoritativeState(wallet: WalletOverlay | null): GameState {
  return applyWalletOverlay(syncGlobalState(initialState), wallet);
}

async function loadCloudFallback(): Promise<GameState | null> {
  const cloud = cloudStorage();
  if (!cloud?.getItem) return null;
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
  return parseSave(cloudSave);
}

export async function loadGame(): Promise<GameState> {
  clearLegacyLocalSaves();
  try {
    const server = await loadServerSave();
    if (server.kind === 'loaded') {
      const state = finalizeLoadedState(server.state);
      writeLocalStorage(STORAGE_KEY, JSON.stringify(state));
      return rememberLoadedState(state);
    }

    if (server.kind === 'empty' && canUseServerSave()) {
      const state = initialAuthoritativeState(await loadWalletOverlay());
      writeLocalStorage(STORAGE_KEY, JSON.stringify(state));
      // Create a clean server save from the current app version. This replaces
      // the old behavior where stale localStorage could recreate deleted users.
      void saveServerState(state);
      return rememberLoadedState(state);
    }

    // Offline/dev fallback only. In a reachable Telegram backend session, local
    // cache is never the source of truth.
    const fromLocal = parseSave(readLocalStorage(STORAGE_KEY));
    const fromCloud = !canUseServerSave() ? await loadCloudFallback() : null;
    const preferred = newestSave(fromLocal, fromCloud);
    if (preferred) return rememberLoadedState(finalizeLoadedState(preferred));

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
  // CloudStorage is no longer used as an authoritative source when backend auth
  // is available, but keep it for offline/dev fallback.
  if (canUseServerSave()) return;
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

function scheduleServerWrite(state: GameState, immediate = false) {
  if (!canUseServerSave()) return;
  pendingServerState = state;
  if (immediate) {
    flushServer();
    return;
  }
  const throttleMs = isActiveDevelopmentSave(state) ? ACTIVE_DEVELOPMENT_SERVER_THROTTLE_MS : SERVER_SAVE_THROTTLE_MS;
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
  if (progressDelta >= 20 && starDelta >= 20 && currentProject.progress < 100 && !currentProject.pendingDevEvent) {
    return { endpoint: 'skip' };
  }

  return null;
}

function scheduleDevelopmentAction(previous: GameState | null, current: GameState) {
  const action = inferDevelopmentAction(previous, current);
  if (!action || !canUseServerSave()) return false;
  if (consumeDirectBackendAction(action.endpoint)) return true;
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

  // Development actions are useful for server-side validation/economy, but they
  // must not replace the authoritative save write. Otherwise a failed or stale
  // /api/development/* response leaves /api/save with the old project, and a
  // page refresh appears to reset development progress. Always persist the full
  // active-development state as well; do it immediately when an action was just
  // detected so start/promote/skip survive an instant refresh.
  scheduleServerWrite(safeState, actionHandled || isActiveDevelopmentSave(safeState));
}

export function resetGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
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
    for (const key of LEGACY_STORAGE_KEYS) cloudStorage()?.setItem?.(key, '');
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
