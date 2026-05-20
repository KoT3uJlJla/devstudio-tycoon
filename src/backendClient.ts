import { normalizeState } from './gameLogic';
import type { GameState } from './types';

type BackendStatePayload = {
  ok?: boolean;
  error?: string;
  save?: { data?: unknown } | null;
  economy?: { stars?: unknown } | null;
};

type InvoicePayload = {
  ok?: boolean;
  invoiceLink?: string;
  invoice?: { invoiceId?: string; status?: string };
};

type InvoiceStatePayload = InvoicePayload & BackendStatePayload;

type TelegramWebAppWithInvoice = NonNullable<Window['Telegram']>['WebApp'] & {
  openInvoice?: (url: string, callback: (status: string) => void) => void;
};

type DevelopmentEndpoint = 'start' | 'skip' | 'promote' | 'release' | 'resolve-event';
export type ShopPurchaseStatus = 'checking_balance' | 'opening_invoice' | 'checking_payment' | 'credited' | 'cancelled' | 'failed';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const BACKEND_UI_ACTION_KEY = 'devstudio_backend_ui_action_endpoint';

function initData() {
  return window.Telegram?.WebApp?.initData || '';
}

function canUseBackend() {
  return Boolean(API_URL && initData());
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function markDirectBackendAction(endpoint: DevelopmentEndpoint) {
  try {
    sessionStorage.setItem(BACKEND_UI_ACTION_KEY, endpoint);
  } catch {
    // SessionStorage is only used to avoid duplicate best-effort action sync.
  }
}

function stateFromPayload(payload: BackendStatePayload | null, endpoint?: DevelopmentEndpoint): GameState | null {
  const rawSave = payload?.save?.data;
  if (!payload?.ok || !isObject(rawSave)) return null;
  const stars = Number(payload.economy?.stars);
  const merged = Number.isFinite(stars) ? { ...rawSave, stars } : rawSave;
  try {
    const state = normalizeState(merged as Partial<GameState>);
    if (endpoint) markDirectBackendAction(endpoint);
    return state;
  } catch {
    return null;
  }
}

async function postJson(path: string, body: Record<string, unknown> = {}) {
  if (!canUseBackend()) return null;
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${initData()}`,
    },
    body: JSON.stringify(body),
  })
    .then(async (response) => {
      const data = await response.json().catch(() => null);
      return data && typeof data === 'object' ? data as BackendStatePayload : null;
    })
    .catch(() => null);
}

function openInvoice(link: string): Promise<string> {
  return new Promise((resolve) => {
    const webApp = window.Telegram?.WebApp as TelegramWebAppWithInvoice | undefined;
    try {
      if (webApp?.openInvoice) {
        webApp.openInvoice(link, (status) => resolve(status || 'closed'));
        return;
      }
    } catch {
      // fall through to external window
    }
    window.open(link, '_blank', 'noopener,noreferrer');
    resolve('opened_external');
  });
}

async function createInvoice(itemId: string) {
  if (!canUseBackend()) return null;
  return fetch(`${API_URL}/api/stars/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${initData()}`,
    },
    body: JSON.stringify({ itemId }),
  })
    .then(async (response) => {
      const data = await response.json().catch(() => null) as InvoicePayload | null;
      if (!response.ok || !data?.ok || !data.invoiceLink || !data.invoice?.invoiceId) return null;
      return { invoiceId: data.invoice.invoiceId, invoiceLink: data.invoiceLink };
    })
    .catch(() => null);
}

async function fetchInvoicePayload(invoiceId: string) {
  if (!canUseBackend()) return null;
  return fetch(`${API_URL}/api/stars/invoice/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `tma ${initData()}` },
  })
    .then(async (response) => (response.ok ? await response.json().catch(() => null) : null))
    .catch(() => null) as Promise<InvoiceStatePayload | null>;
}

async function pollInvoicePaid(invoiceId: string, attempts = 18) {
  if (!canUseBackend()) return false;
  for (let index = 0; index < attempts; index += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, index < 4 ? 900 : 1500));
    const payload = await fetchInvoicePayload(invoiceId);
    const status = payload?.invoice?.status;
    if (status === 'paid') return true;
    if (status && status !== 'pending') return false;
  }
  return false;
}

async function paidInvoiceState(invoiceId: string) {
  const payload = await fetchInvoicePayload(invoiceId);
  return stateFromPayload(payload);
}

async function payWithTelegramStars(itemId: string, onStatus?: (status: ShopPurchaseStatus) => void) {
  onStatus?.('opening_invoice');
  const invoice = await createInvoice(itemId);
  if (!invoice) {
    onStatus?.('failed');
    window.Telegram?.WebApp?.showPopup?.({ message: 'Не удалось открыть инвойс Telegram Stars. Попробуй ещё раз позже.', buttons: [{ type: 'ok' }] });
    return null;
  }
  const status = await openInvoice(invoice.invoiceLink);
  if (status === 'cancelled' || status === 'failed' || status === 'closed') {
    onStatus?.('cancelled');
    return null;
  }
  onStatus?.('checking_payment');
  const paid = await pollInvoicePaid(invoice.invoiceId);
  if (!paid) onStatus?.('failed');
  return paid ? invoice.invoiceId : null;
}

export async function runDevelopmentAction(endpoint: DevelopmentEndpoint, body: Record<string, unknown> = {}, invoiceItemId?: string) {
  const payload = await postJson(`/api/development/${endpoint}`, body);
  const state = stateFromPayload(payload, endpoint);
  if (state) return state;

  if (payload?.error === 'not_enough_stars' && invoiceItemId) {
    const invoiceId = await payWithTelegramStars(invoiceItemId);
    if (!invoiceId) return null;
    const retryPayload = await postJson(`/api/development/${endpoint}`, { ...body, invoiceId });
    return stateFromPayload(retryPayload, endpoint);
  }

  return null;
}

export async function purchaseShopItem(itemId: string, onStatus?: (status: ShopPurchaseStatus) => void) {
  onStatus?.('checking_balance');
  const payload = await postJson('/api/economy/shop/purchase', { itemId });
  const state = stateFromPayload(payload);
  if (state) {
    onStatus?.('credited');
    return state;
  }

  if (payload?.error === 'not_enough_stars') {
    const invoiceId = await payWithTelegramStars(itemId, onStatus);
    if (!invoiceId) return null;
    onStatus?.('checking_payment');
    const invoiceState = await paidInvoiceState(invoiceId);
    if (invoiceState) onStatus?.('credited');
    else onStatus?.('failed');
    return invoiceState;
  }

  onStatus?.('failed');
  return null;
}

export function hasBackendSession() {
  return canUseBackend();
}
