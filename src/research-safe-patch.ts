import { applyVisibleBalanceFromSave } from './visible-balance-sync';
import { researchNodes } from './gameData';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';
const RESEARCH_BY_TITLE = new Map(researchNodes.map((node) => [node.title, node.id]));

type ApiPayload = { ok?: boolean; error?: string; save?: { data?: unknown }; invoiceLink?: string; invoice?: { invoiceId?: string; status?: string } };
type TgWebApp = { showPopup?: (params: { title?: string; message: string; buttons?: Array<{ type: string; text?: string }> }) => void; openInvoice?: (url: string, callback?: (status: string) => void) => void };

function initData() {
  return window.Telegram?.WebApp?.initData || '';
}

function textOf(element: Element | null) {
  return (element?.textContent || '').replace(/\s+/g, ' ').trim();
}

function notice(message: string) {
  const webApp = window.Telegram?.WebApp as TgWebApp | undefined;
  try {
    webApp?.showPopup?.({ title: 'Исследования', message, buttons: [{ type: 'ok' }] });
    return;
  } catch {
    window.alert(message);
  }
}

function persistSave(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    applyVisibleBalanceFromSave(data);
    window.dispatchEvent(new CustomEvent('devstudio:server-save', { detail: { data } }));
    return true;
  } catch {
    return false;
  }
}

async function postJson(path: string, body: Record<string, unknown>) {
  const telegramData = initData();
  if (!API_URL || !telegramData) throw new Error('telegram_auth_required');
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `tma ${telegramData}` },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as ApiPayload | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'request_failed');
  if (payload.save?.data) persistSave(payload.save.data);
  return payload;
}

async function getInvoiceStatus(invoiceId: string) {
  const telegramData = initData();
  if (!API_URL || !telegramData) return null;
  const response = await fetch(`${API_URL}/api/stars/invoice/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `tma ${telegramData}` },
  });
  const payload = await response.json().catch(() => null) as ApiPayload | null;
  if (payload?.save?.data) persistSave(payload.save.data);
  return payload;
}

async function waitForPaidInvoice(invoiceId: string) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, attempt < 6 ? 500 : 1000));
    const payload = await getInvoiceStatus(invoiceId).catch(() => null);
    if (payload?.invoice?.status === 'paid') return true;
  }
  return false;
}

async function openProductInvoice() {
  const webApp = window.Telegram?.WebApp as TgWebApp | undefined;
  if (!webApp?.openInvoice) {
    notice('Оплата Telegram Stars доступна только внутри Telegram Mini App.');
    return;
  }
  const payload = await postJson('/api/stars/invoice', { itemId: 'product_instinct' });
  const link = payload.invoiceLink;
  const invoiceId = payload.invoice?.invoiceId;
  if (!link || !invoiceId) throw new Error('invoice_create_failed');
  webApp.openInvoice(link, (status) => {
    if (status === 'paid') void waitForPaidInvoice(invoiceId);
    if (status === 'cancelled') notice('Оплата отменена. Исследование не открыто.');
    if (status === 'failed') notice('Оплата не прошла. Исследование не открыто.');
  });
}

function actionForButton(button: HTMLButtonElement): Record<string, unknown> | null {
  if (button.closest('.premium-research-card')) return { action: 'product_instinct' };
  const label = textOf(button);
  if (label.includes('Новый случайный жанр')) return { action: 'random_genre' };
  if (label.includes('Новый случайный сеттинг')) return { action: 'random_theme' };
  const title = textOf(button.querySelector('strong')).replace(/^✅\s*/, '');
  const nodeId = RESEARCH_BY_TITLE.get(title);
  if (!nodeId) return null;
  return nodeId === 'product-instinct' ? { action: 'product_instinct' } : { action: 'node', nodeId };
}

function replayReactHandler(button: HTMLButtonElement) {
  button.dataset.researchSafeBypass = '1';
  button.disabled = false;
  button.classList.remove('backend-action-pending');
  window.setTimeout(() => button.click(), 0);
}

function patchButton(button: HTMLButtonElement) {
  const action = actionForButton(button);
  if (!action || button.dataset.researchSafePatched === '1') return;
  button.dataset.researchSafePatched = '1';

  button.addEventListener('click', async (event) => {
    if (button.dataset.researchSafeBypass === '1') {
      delete button.dataset.researchSafeBypass;
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (button.disabled && action.action !== 'product_instinct') return;
    button.disabled = true;
    button.classList.add('backend-action-pending');
    try {
      const payload = action.action === 'product_instinct'
        ? await postJson('/api/economy/shop/purchase', { itemId: 'product_instinct' }).catch(async (error) => {
          if (error instanceof Error && error.message.includes('not_enough_stars')) {
            await openProductInvoice();
            return null;
          }
          throw error;
        })
        : await postJson('/api/research/unlock', action);
      if (payload?.save?.data) replayReactHandler(button);
      else button.disabled = false;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('not_enough_rp')) notice('Не хватает очков науки. Покупка не выполнена.');
      else if (message.includes('already')) notice('Уже открыто.');
      else if (message.includes('requirement')) notice('Сначала нужно предыдущее исследование.');
      else notice('Сервер исследований временно недоступен. Покупка не выполнена.');
      button.disabled = false;
    } finally {
      button.classList.remove('backend-action-pending');
    }
  }, { capture: true });
}

function applyPatch() {
  document.querySelectorAll<HTMLButtonElement>('button.unlock-card, button.research-node, .premium-research-card > button').forEach(patchButton);
}

export function installResearchSafePatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyPatch();
  const observer = new MutationObserver(applyPatch);
  observer.observe(document.body, { childList: true, subtree: true });
}
