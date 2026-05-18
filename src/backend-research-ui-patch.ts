import { applyVisibleBalanceFromSave } from './visible-balance-sync';
import { researchNodes } from './gameData';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

type ResearchPayload = {
  ok?: boolean;
  error?: string;
  save?: { data?: unknown };
};

type InvoicePayload = {
  ok?: boolean;
  error?: string;
  invoiceLink?: string;
  invoice?: { invoiceId?: string; status?: string };
  save?: { data?: unknown };
};

type TelegramPopupApi = {
  showPopup?: (params: { title?: string; message: string; buttons?: Array<{ type: string; text?: string }> }) => void;
  openInvoice?: (url: string, callback?: (status: string) => void) => void;
};

const RESEARCH_BY_TITLE = new Map(researchNodes.map((node) => [node.title, node.id]));

function initData() {
  return window.Telegram?.WebApp?.initData || '';
}

function textOf(element: Element | null) {
  return (element?.textContent || '').replace(/\s+/g, ' ').trim();
}

function persistSave(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    applyVisibleBalanceFromSave(data);
    return true;
  } catch {
    return false;
  }
}

function notice(message: string) {
  try {
    const webApp = window.Telegram?.WebApp as TelegramPopupApi | undefined;
    webApp?.showPopup?.({ title: 'Исследования', message, buttons: [{ type: 'ok' }] });
    return;
  } catch {
    window.alert(message);
  }
}

async function postJson<T>(path: string, body: Record<string, unknown>) {
  const telegramData = initData();
  if (!API_URL || !telegramData) throw new Error('telegram_auth_required');
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `tma ${telegramData}` },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as T & { ok?: boolean; error?: string } | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'request_failed');
  return payload;
}

async function getInvoiceStatus(invoiceId: string): Promise<InvoicePayload | null> {
  const telegramData = initData();
  if (!API_URL || !telegramData) return null;
  const response = await fetch(`${API_URL}/api/stars/invoice/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `tma ${telegramData}` },
  });
  const payload = await response.json().catch(() => null) as InvoicePayload | null;
  if (payload?.save?.data) persistSave(payload.save.data);
  return payload;
}

async function waitForPaidInvoice(invoiceId: string) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, attempt < 6 ? 500 : 1000));
    const status = await getInvoiceStatus(invoiceId).catch(() => null);
    if (status?.invoice?.status === 'paid') return true;
  }
  return false;
}

async function openProductInstinctInvoice() {
  const webApp = window.Telegram?.WebApp as TelegramPopupApi | undefined;
  if (!webApp?.openInvoice) {
    notice('Оплата Telegram Stars доступна только внутри Telegram Mini App.');
    return;
  }
  const invoice = await postJson<InvoicePayload>('/api/stars/invoice', { itemId: 'product_instinct' });
  const link = invoice.invoiceLink;
  const invoiceId = invoice.invoice?.invoiceId;
  if (!link || !invoiceId) throw new Error('invoice_create_failed');
  webApp.openInvoice(link, (status) => {
    if (status === 'paid') {
      notice('Оплата прошла. Подтягиваем исследование с сервера…');
      void waitForPaidInvoice(invoiceId);
    }
    if (status === 'cancelled') notice('Оплата отменена. Исследование не открыто.');
    if (status === 'failed') notice('Оплата не прошла. Исследование не открыто.');
  });
}

async function postResearch(body: Record<string, unknown>) {
  const payload = await postJson<ResearchPayload>('/api/research/unlock', body);
  persistSave(payload.save?.data);
  return payload;
}

async function postProductInstinct() {
  try {
    const payload = await postJson<ResearchPayload>('/api/economy/shop/purchase', { itemId: 'product_instinct' });
    persistSave(payload.save?.data);
    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('not_enough_stars')) {
      await openProductInstinctInvoice();
      return null;
    }
    throw error;
  }
}

function actionForButton(button: HTMLButtonElement): Record<string, unknown> | null {
  const label = textOf(button);
  if (label.includes('Новый случайный жанр')) return { action: 'random_genre' };
  if (label.includes('Новый случайный сеттинг')) return { action: 'random_theme' };

  const title = textOf(button.querySelector('strong')).replace(/^✅\s*/, '');
  const nodeId = RESEARCH_BY_TITLE.get(title);
  if (!nodeId) return null;
  if (nodeId === 'product-instinct') return { action: 'product_instinct' };
  return { action: 'node', nodeId };
}

function markButtonDone(button: HTMLButtonElement) {
  const strong = button.querySelector('strong');
  if (strong && !textOf(strong).startsWith('✅')) strong.textContent = `✅ ${textOf(strong)}`;
  button.classList.add('unlocked');
  button.disabled = true;
}

function patchButton(button: HTMLButtonElement) {
  const body = actionForButton(button);
  if (!body || button.dataset.backendResearchPatched === '1') return;
  button.dataset.backendResearchPatched = '1';

  if (body.action === 'product_instinct' && !textOf(button).includes('Открыто')) {
    button.disabled = false;
    const innerButton = button.querySelector<HTMLButtonElement>('button');
    if (innerButton) innerButton.disabled = false;
  }

  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (button.disabled && body.action !== 'product_instinct') return;
    button.disabled = true;
    try {
      const payload = body.action === 'product_instinct'
        ? await postProductInstinct()
        : await postResearch(body);
      if (payload?.save?.data) {
        markButtonDone(button);
      } else {
        button.disabled = false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('not_enough_rp')) notice('Не хватает очков науки. Исследование не открыто.');
      else if (message.includes('not_enough_stars')) notice('Не хватает игровых ⭐. Открываем оплату Telegram Stars…');
      else if (message.includes('already')) notice('Это исследование уже открыто.');
      else if (message.includes('requirement')) notice('Сначала нужно предыдущее исследование.');
      else notice('Сервер исследований временно недоступен. Исследование не открыто.');
      button.disabled = false;
    }
  }, { capture: true });
}

function applyPatch() {
  document.querySelectorAll<HTMLButtonElement>('.unlock-card, .research-node, .premium-research-card, .premium-research-card button').forEach(patchButton);
}

export function installBackendResearchUiPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyPatch();
  const observer = new MutationObserver(applyPatch);
  observer.observe(document.body, { childList: true, subtree: true });
}
