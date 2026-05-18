import { researchNodes } from './gameData';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

type ResearchPayload = {
  ok?: boolean;
  error?: string;
  save?: { data?: unknown };
};

type TelegramPopupApi = {
  showPopup?: (params: { title?: string; message: string; buttons?: Array<{ type: string; text?: string }> }) => void;
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

async function postResearch(body: Record<string, unknown>) {
  const telegramData = initData();
  if (!API_URL || !telegramData) throw new Error('telegram_auth_required');
  const response = await fetch(`${API_URL}/api/research/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `tma ${telegramData}` },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as ResearchPayload | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'research_unlock_failed');
  persistSave(payload.save?.data);
  return payload;
}

function actionForButton(button: HTMLButtonElement): Record<string, unknown> | null {
  const label = textOf(button);
  if (label.includes('Новый случайный жанр')) return { action: 'random_genre' };
  if (label.includes('Новый случайный сеттинг')) return { action: 'random_theme' };

  const title = textOf(button.querySelector('strong')).replace(/^✅\s*/, '');
  const nodeId = RESEARCH_BY_TITLE.get(title);
  if (!nodeId || nodeId === 'product-instinct') return null;
  return { action: 'node', nodeId };
}

function patchButton(button: HTMLButtonElement) {
  const body = actionForButton(button);
  if (!body || button.dataset.backendResearchPatched === '1') return;
  button.dataset.backendResearchPatched = '1';
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (button.disabled) return;
    button.disabled = true;
    try {
      await postResearch(body);
      window.setTimeout(() => window.location.reload(), 150);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('not_enough_rp')) notice('Не хватает очков науки. Исследование не открыто.');
      else if (message.includes('already')) notice('Это исследование уже открыто.');
      else if (message.includes('requirement')) notice('Сначала нужно предыдущее исследование.');
      else if (message.includes('not_implemented')) notice('Серверный патч исследований ещё не активен. Локальное открытие заблокировано, чтобы не было эксплойта.');
      else notice('Сервер исследований временно недоступен. Исследование не открыто.');
      button.disabled = false;
    }
  }, { capture: true });
}

function applyPatch() {
  document.querySelectorAll<HTMLButtonElement>('.unlock-card, .research-node').forEach(patchButton);
}

export function installBackendResearchUiPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyPatch();
  const observer = new MutationObserver(applyPatch);
  observer.observe(document.body, { childList: true, subtree: true });
}
