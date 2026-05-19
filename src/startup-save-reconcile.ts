import { applyVisibleBalanceFromSave } from './visible-balance-sync';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

type SaveObject = Record<string, unknown>;

type ReconcilePayload = {
  ok?: boolean;
  save?: { data?: unknown } | null;
  economy?: { coins?: unknown; rp?: unknown; stars?: unknown } | null;
};

function telegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

function isTelegramRuntime() {
  const webApp = window.Telegram?.WebApp as
    | { initData?: string; initDataUnsafe?: { user?: unknown; start_param?: unknown } }
    | undefined;
  return Boolean(webApp?.initData || webApp?.initDataUnsafe?.user || webApp?.initDataUnsafe?.start_param);
}

function isPlainObject(value: unknown): value is SaveObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readLocalSave(): SaveObject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function safeTimestamp(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function preferLocalGameplayField(serverData: SaveObject, localData: SaveObject | null, key: 'coins' | 'rp') {
  if (!localData) return serverData[key];
  const serverValue = safeNumber(serverData[key]);
  const localValue = safeNumber(localData[key]);
  if (localValue === undefined) return serverData[key];
  if (serverValue === undefined) return localValue;

  // Wallet endpoints may return an old save snapshot for a moment during startup.
  // If the local save is at least as fresh and the server gameplay value is an
  // empty zero, keep the local gameplay balance instead of flashing/writing 0.
  const serverSavedAt = safeTimestamp(serverData.lastSavedAt);
  const localSavedAt = safeTimestamp(localData.lastSavedAt);
  if (serverValue === 0 && localValue > 0 && localSavedAt >= serverSavedAt) return localValue;
  return serverValue;
}

function overlayWallet(payload: ReconcilePayload) {
  const data = isPlainObject(payload.save?.data) ? payload.save.data : null;
  if (!data) return null;
  const economy = isPlainObject(payload.economy) ? payload.economy : null;
  const stars = safeNumber(economy?.stars ?? data.stars);
  const localData = readLocalSave();

  // Coins and RP belong to the gameplay save. Old/new economy records can have
  // coins=0 before the first economy action, so never write those over save data.
  return {
    ...data,
    coins: preferLocalGameplayField(data, localData, 'coins'),
    rp: preferLocalGameplayField(data, localData, 'rp'),
    ...(stars !== undefined ? { stars } : {}),
  };
}

function persistSaveData(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, timeoutMs);
    promise
      .then((value) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          resolve(fallback);
        }
      })
      .finally(() => window.clearTimeout(timer));
  });
}

export async function reconcileStartupSave() {
  const initData = telegramInitData();
  if (!API_URL || !initData || !isTelegramRuntime()) return;

  const payload = await withTimeout(
    fetch(`${API_URL}/api/wallet/state`, {
      headers: { Authorization: `tma ${initData}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null) as Promise<ReconcilePayload | null>,
    null,
    9000,
  );

  if (payload?.ok && payload.save?.data) {
    const data = overlayWallet(payload) || payload.save.data;
    persistSaveData(data);
    window.setTimeout(() => applyVisibleBalanceFromSave(data), 0);
    window.setTimeout(() => applyVisibleBalanceFromSave(data), 120);
  }
}
