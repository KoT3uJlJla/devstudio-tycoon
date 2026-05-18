const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

type EconomyEndpoint = 'daily' | 'shop/purchase' | 'referral/claim';

type EconomyPayload = {
  ok?: boolean;
  error?: string;
  save?: { data?: unknown };
  economy?: { stars?: number };
};

type InvoicePayload = {
  ok?: boolean;
  error?: string;
  invoiceLink?: string;
  invoice?: { invoiceId?: string; status?: string };
  save?: { data?: unknown };
};

type TelegramPopupWebApp = {
  showPopup?: (params: {
    title?: string;
    message: string;
    buttons?: Array<{ type: 'ok' | 'close' | 'cancel' | 'default' | 'destructive'; text?: string; id?: string }>;
  }) => void;
  openInvoice?: (url: string, callback?: (status: string) => void) => void;
};

const SHOP_ITEM_BY_TITLE: Record<string, string> = {
  'Стартовый набор': 'starter_pack',
  'Малый набор монет': 'coins_small',
  'Средний набор монет': 'coins_medium',
  'Ускорение науки': 'research_boost',
};

const REFERRAL_MILESTONE_BY_LABEL: Record<string, string> = {
  '1 активный друг': 'm1',
  '3 активных друга': 'm3',
  '5 активных друзей': 'm5',
  '10 активных друзей': 'm10',
  '25 активных друзей': 'm25',
};

function telegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

function canUseBackendEconomy() {
  return Boolean(API_URL && telegramInitData());
}

function textOf(element: Element | null) {
  return (element?.textContent || '').replace(/\s+/g, ' ').trim();
}

function persistServerSave(payload: EconomyPayload | InvoicePayload) {
  const data = payload?.save?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function showEconomyNotice(message: string) {
  const webApp = window.Telegram?.WebApp as TelegramPopupWebApp | undefined;
  try {
    if (webApp?.showPopup) {
      webApp.showPopup({ title: 'Магазин студии', message, buttons: [{ type: 'ok' }] });
      return;
    }
  } catch {
    // fallback below
  }
  window.alert(message);
}

async function postJson<T>(url: string, body: Record<string, unknown> = {}, timeoutMs = 4500): Promise<T> {
  if (!canUseBackendEconomy()) throw new Error('backend_economy_unavailable');
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `tma ${telegramInitData()}`,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null) as T & { ok?: boolean; error?: string } | null;
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || `request_failed:${url}`);
    return payload;
  } finally {
    window.clearTimeout(timer);
  }
}

async function getInvoiceStatus(invoiceId: string): Promise<InvoicePayload> {
  const response = await fetch(`${API_URL}/api/stars/invoice/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `tma ${telegramInitData()}` },
  });
  const payload = await response.json().catch(() => null) as InvoicePayload | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'invoice_status_failed');
  persistServerSave(payload);
  return payload;
}

async function postEconomyAction(endpoint: EconomyEndpoint, body: Record<string, unknown> = {}) {
  const payload = await postJson<EconomyPayload>(`${API_URL}/api/economy/${endpoint}`, body);
  persistServerSave(payload);
  return payload;
}

async function createStarsInvoice(itemId: string) {
  return postJson<InvoicePayload>(`${API_URL}/api/stars/invoice`, { itemId }, 6500);
}

function refreshAfterServerState() {
  window.setTimeout(() => window.location.reload(), 120);
}

async function waitForPaidInvoice(invoiceId: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const status = await getInvoiceStatus(invoiceId).catch(() => null);
    if (status?.invoice?.status === 'paid') {
      refreshAfterServerState();
      return true;
    }
  }
  return false;
}

async function openStarsInvoice(itemId: string) {
  const webApp = window.Telegram?.WebApp as TelegramPopupWebApp | undefined;
  if (!webApp?.openInvoice) {
    showEconomyNotice('Оплата Telegram Stars доступна только внутри Telegram Mini App.');
    return;
  }
  const invoicePayload = await createStarsInvoice(itemId);
  const invoiceLink = invoicePayload.invoiceLink;
  const invoiceId = invoicePayload.invoice?.invoiceId;
  if (!invoiceLink || !invoiceId) throw new Error('invoice_create_failed');

  webApp.openInvoice(invoiceLink, (status) => {
    if (status === 'paid') {
      void waitForPaidInvoice(invoiceId).then((success) => {
        if (!success) showEconomyNotice('Оплата прошла, но награда ещё подтверждается сервером. Закрой и открой игру через несколько секунд.');
      });
      return;
    }
    if (status === 'cancelled') showEconomyNotice('Оплата отменена. Товар не выдан.');
    if (status === 'failed') showEconomyNotice('Оплата не прошла. Товар не выдан.');
  });
}

function attachEconomyAction(
  button: HTMLButtonElement,
  key: string,
  endpoint: EconomyEndpoint,
  body: Record<string, unknown> = {},
) {
  if (button.dataset.backendEconomyPatched === key) return;
  button.dataset.backendEconomyPatched = key;
  button.addEventListener('click', async (event) => {
    if (button.disabled || !canUseBackendEconomy()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showEconomyNotice('Экономика защищена сервером. Открой игру через Telegram и попробуй ещё раз.');
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    button.disabled = true;
    button.classList.add('backend-action-pending');
    try {
      await postEconomyAction(endpoint, body);
      refreshAfterServerState();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('not_enough_stars') && endpoint === 'shop/purchase' && typeof body.itemId === 'string') {
        await openStarsInvoice(body.itemId);
      } else if (message.includes('not_enough_stars')) {
        showEconomyNotice('Не хватает игровых ⭐. Для этого действия пока нельзя открыть оплату Telegram Stars.');
      } else if (message.includes('daily_already_claimed')) {
        showEconomyNotice('Ежедневная награда уже получена сегодня.');
      } else if (message.includes('milestone_not_ready')) {
        showEconomyNotice('Эта реферальная награда пока недоступна.');
      } else if (message.includes('milestone_already_claimed')) {
        showEconomyNotice('Эта реферальная награда уже получена.');
      } else {
        showEconomyNotice('Сервер экономики временно недоступен. Товар не выдан, попробуй позже.');
      }
    } finally {
      button.disabled = false;
      button.classList.remove('backend-action-pending');
    }
  }, { capture: true });
}

function patchDailyReward() {
  document.querySelectorAll<HTMLButtonElement>('button.daily-card').forEach((button) => {
    attachEconomyAction(button, 'daily', 'daily');
  });
}

function patchShopPurchases() {
  document.querySelectorAll<HTMLElement>('.shop-card').forEach((card) => {
    const title = textOf(card.querySelector('h3'));
    const itemId = SHOP_ITEM_BY_TITLE[title];
    if (!itemId) return;
    const button = card.querySelector<HTMLButtonElement>('button');
    if (!button) return;
    attachEconomyAction(button, `shop:${itemId}`, 'shop/purchase', { itemId });
  });
}

function patchReferralClaims() {
  document.querySelectorAll<HTMLButtonElement>('button.milestone').forEach((button) => {
    const label = textOf(button.querySelector('span'));
    const milestoneId = REFERRAL_MILESTONE_BY_LABEL[label];
    if (!milestoneId) return;
    attachEconomyAction(button, `referral:${milestoneId}`, 'referral/claim', { milestoneId });
  });
}

function applyBackendEconomyUiPatch() {
  try {
    patchDailyReward();
    patchShopPurchases();
    patchReferralClaims();
  } catch {
    // Protected economy actions should fail closed, not grant local rewards.
  }
}

export function installBackendEconomyUiPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyBackendEconomyUiPatch();
  const observer = new MutationObserver(() => applyBackendEconomyUiPatch());
  observer.observe(document.body, { childList: true, subtree: true });
}
