const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const BACKEND_UI_ACTION_KEY = 'devstudio_backend_ui_action_endpoint';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

type BackendEndpoint = 'skip' | 'promote' | 'resolve-event' | 'release';

type BackendPayload = {
  ok?: boolean;
  save?: { data?: unknown };
};

function telegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

function canUseBackendActions() {
  return Boolean(API_URL && telegramInitData());
}

function buttonText(button: HTMLElement) {
  return (button.textContent || '').replace(/\s+/g, ' ').trim();
}

function persistServerSave(payload: BackendPayload) {
  const data = payload?.save?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function markBackendUiAction(endpoint: BackendEndpoint) {
  try {
    sessionStorage.setItem(BACKEND_UI_ACTION_KEY, endpoint);
  } catch {
    // Best-effort marker. If unavailable, storage bridge may still retry safely.
  }
}

async function postBackendAction(endpoint: BackendEndpoint, body: Record<string, unknown> = {}) {
  if (!canUseBackendActions()) throw new Error('backend_actions_unavailable');
  const response = await fetch(`${API_URL}/api/development/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as BackendPayload | null;
  if (!response.ok || !payload?.ok || !persistServerSave(payload)) {
    throw new Error(`backend_action_failed:${endpoint}`);
  }
}

function rerunOriginalClick(button: HTMLButtonElement) {
  button.dataset.backendActionFallback = '1';
  window.setTimeout(() => button.click(), 0);
}

function attachBackendAction(button: HTMLButtonElement, endpoint: BackendEndpoint, body: Record<string, unknown> = {}) {
  if (button.dataset.backendActionPatched === endpoint) return;
  button.dataset.backendActionPatched = endpoint;
  button.addEventListener('click', async (event) => {
    if (button.dataset.backendActionFallback === '1') {
      delete button.dataset.backendActionFallback;
      return;
    }
    if (button.disabled || !canUseBackendActions()) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    button.disabled = true;
    button.classList.add('backend-action-pending');
    try {
      await postBackendAction(endpoint, body);
      markBackendUiAction(endpoint);
      button.disabled = false;
      button.classList.remove('backend-action-pending');
      rerunOriginalClick(button);
    } catch {
      button.disabled = false;
      button.classList.remove('backend-action-pending');
      rerunOriginalClick(button);
    }
  }, { capture: true });
}

function patchActiveDevelopmentButtons() {
  const active = document.querySelector<HTMLElement>('.active-dev');
  if (!active) return;
  active.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    const text = buttonText(button);
    if (text.includes('Ускорить на 1ч')) attachBackendAction(button, 'skip');
    if (text.startsWith('Продвижение') && !text.includes('+')) attachBackendAction(button, 'promote');
    if (text.includes('Релизнуть игру')) attachBackendAction(button, 'release');
  });
}

function patchDevelopmentEventButtons() {
  const choices = Array.from(document.querySelectorAll<HTMLButtonElement>('.dev-event-choices button'));
  choices.forEach((button, index) => {
    attachBackendAction(button, 'resolve-event', { choiceId: index === 1 ? 'b' : 'a' });
  });
}

function applyBackendDevUiPatch() {
  try {
    patchActiveDevelopmentButtons();
    patchDevelopmentEventButtons();
  } catch {
    // This patch is progressive enhancement only. It must never break the game UI.
  }
}

export function installBackendDevUiPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyBackendDevUiPatch();
  const observer = new MutationObserver(() => applyBackendDevUiPatch());
  observer.observe(document.body, { childList: true, subtree: true });
}
