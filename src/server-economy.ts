import { normalizeState } from './gameLogic';
import { syncGlobalState } from './globalWorld';
import type { GameState } from './types';
import { STORAGE_KEY } from './storage';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const SAVE_SCHEMA_VERSION = 3;

type BackendPayload = {
  ok?: boolean;
  save?: { data?: unknown } | null;
  economy?: { stars?: unknown } | null;
  error?: string;
};

type InvoicePayload = {
  ok?: boolean;
  invoice?: { invoiceId?: string; status?: string } | null;
  invoiceLink?: string;
};

type DevelopmentEndpoint = 'skip' | 'promote' | 'start' | 'release' | 'resolve-event';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function telegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

function canUseBackend() {
  return Boolean(API_URL && telegramInitData());
}

function persistState(state: GameState) {
  const stamped = { ...state, saveSchemaVersion: SAVE_SCHEMA_VERSION };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  } catch {
    // local cache is best-effort
  }
  try {
    window.dispatchEvent(new CustomEvent('devstudio:server-save', { detail: state }));
  } catch {
    // best-effort live sync hook
  }
}

function normalizePayloadState(payload: BackendPayload | null): GameState | null {
  const data = payload?.save?.data;
  if (!payload?.ok || !isPlainObject(data)) return null;
  try {
    const economyStars = Number(payload.economy?.stars);
    const withEconomy = Number.isFinite(economyStars) ? { ...data, stars: economyStars } : data;
    const state = syncGlobalState(normalizeState(withEconomy as Partial<GameState>));
    persistState(state);
    return state;
  } catch {
    return null;
  }
}

async function postJson(path: string, body: Record<string, unknown> = {}): Promise<{ state: GameState | null; error?: string }> {
  if (!canUseBackend()) return { state: null, error: 'backend_unavailable' };
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!response) return { state: null, error: 'network_failed' };
  const payload = await response.json().catch(() => null) as BackendPayload | null;
  if (!response.ok || !payload?.ok) return { state: null, error: payload?.error || `http_${response.status}` };
  return { state: normalizePayloadState(payload) };
}

async function createInvoice(itemId: string) {
  if (!canUseBackend()) return null;
  const response = await fetch(`${API_URL}/api/stars/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify({ itemId }),
  }).catch(() => null);
  if (!response) return null;
  const payload = await response.json().catch(() => null) as InvoicePayload | null;
  if (!response.ok || !payload?.ok || !payload.invoiceLink || !payload.invoice?.invoiceId) return null;
  return { invoiceId: payload.invoice.invoiceId, invoiceLink: payload.invoiceLink };
}

function openTelegramInvoice(invoiceLink: string) {
  return new Promise<string>((resolve) => {
    const webApp = window.Telegram?.WebApp as typeof window.Telegram.WebApp & { openInvoice?: (url: string, callback?: (status: string) => void) => void };
    try {
      if (webApp?.openInvoice) {
        webApp.openInvoice(invoiceLink, (status) => resolve(status || 'closed'));
        return;
      }
    } catch {
      // fallback below
    }
    window.open(invoiceLink, '_blank', 'noopener,noreferrer');
    resolve('opened_external');
  });
}

async function pollInvoice(invoiceId: string, attempts = 18) {
  if (!canUseBackend()) return null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, attempt < 4 ? 900 : 1500));
    const payload = await fetch(`${API_URL}/api/stars/invoice/${encodeURIComponent(invoiceId)}`, {
      headers: { Authorization: `tma ${telegramInitData()}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null) as BackendPayload & { invoice?: { status?: string } } | null;
    const state = normalizePayloadState(payload);
    if (state) return state;
    if (payload?.invoice?.status && !['pending'].includes(payload.invoice.status)) return null;
  }
  return null;
}

async function buyWithTelegramStars(itemId: string) {
  const invoice = await createInvoice(itemId);
  if (!invoice) return null;
  const status = await openTelegramInvoice(invoice.invoiceLink);
  if (status === 'cancelled' || status === 'failed') return null;
  return pollInvoice(invoice.invoiceId);
}

export async function purchaseBackendItem(itemId: string) {
  const result = await postJson('/api/economy/shop/purchase', { itemId });
  if (result.state) return result.state;
  if (result.error === 'not_enough_stars') return buyWithTelegramStars(itemId);
  return null;
}

export async function claimBackendDailyReward() {
  return (await postJson('/api/economy/daily')).state;
}

export async function claimBackendDailyTask(taskId: string) {
  return (await postJson('/api/economy/daily-task/claim', { taskId })).state;
}

export async function claimBackendReferralMilestone(milestoneId: string) {
  return (await postJson('/api/economy/referral/claim', { milestoneId })).state;
}

export async function runBackendDevelopmentAction(endpoint: DevelopmentEndpoint, body: Record<string, unknown> = {}) {
  const result = await postJson(`/api/development/${endpoint}`, body);
  if (result.state) return result.state;
  if (result.error === 'not_enough_stars') {
    const itemId = endpoint === 'skip' ? 'time_skip' : endpoint === 'promote' ? 'promotion' : '';
    if (itemId) return buyWithTelegramStars(itemId);
  }
  return null;
}
