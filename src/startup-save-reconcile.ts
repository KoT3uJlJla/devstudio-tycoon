import { applyVisibleBalanceFromSave } from './visible-balance-sync';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function overlayWallet(payload: ReconcilePayload) {
  const data = isPlainObject(payload.save?.data) ? payload.save.data : null;
  if (!data) return null;
  const economy = isPlainObject(payload.economy) ? payload.economy : null;
  return {
    ...data,
    ...(safeNumber(economy?.coins ?? data.coins) !== undefined ? { coins: safeNumber(economy?.coins ?? data.coins) } : {}),
    ...(safeNumber(economy?.rp ?? data.rp) !== undefined ? { rp: safeNumber(economy?.rp ?? data.rp) } : {}),
    ...(safeNumber(economy?.stars ?? data.stars) !== undefined ? { stars: safeNumber(economy?.stars ?? data.stars) } : {}),
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
  }
}