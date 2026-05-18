const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const BACKEND_ECONOMY_ACTION_KEY = 'devstudio_backend_economy_action';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

type EconomyEndpoint = 'daily' | 'shop/purchase' | 'referral/claim';

type EconomyPayload = {
  ok?: boolean;
  save?: { data?: unknown };
  economy?: { stars?: number };
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

function persistServerSave(payload: EconomyPayload) {
  const data = payload?.save?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Local state remains the visual source until the next load.
  }
}

function markBackendEconomyAction(name: string) {
  try {
    sessionStorage.setItem(BACKEND_ECONOMY_ACTION_KEY, name);
  } catch {
    // best effort only
  }
}

async function postEconomyAction(endpoint: EconomyEndpoint, body: Record<string, unknown> = {}) {
  if (!canUseBackendEconomy()) throw new Error('backend_economy_unavailable');
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(`${API_URL}/api/economy/${endpoint}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `tma ${telegramInitData()}`,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null) as EconomyPayload | null;
    if (!response.ok || !payload?.ok) throw new Error(`backend_economy_failed:${endpoint}`);
    persistServerSave(payload);
    return payload;
  } finally {
    window.clearTimeout(timer);
  }
}

function rerunOriginalClick(button: HTMLButtonElement) {
  button.dataset.backendEconomyFallback = '1';
  window.setTimeout(() => button.click(), 0);
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
    if (button.dataset.backendEconomyFallback === '1') {
      delete button.dataset.backendEconomyFallback;
      return;
    }
    if (button.disabled || !canUseBackendEconomy()) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    button.disabled = true;
    button.classList.add('backend-action-pending');
    try {
      await postEconomyAction(endpoint, body);
      markBackendEconomyAction(key);
    } catch {
      // If backend is unavailable, keep the existing local behavior so the UI does not break.
    } finally {
      button.disabled = false;
      button.classList.remove('backend-action-pending');
      rerunOriginalClick(button);
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
    // Progressive enhancement only. It must never block the game.
  }
}

export function installBackendEconomyUiPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyBackendEconomyUiPatch();
  const observer = new MutationObserver(() => applyBackendEconomyUiPatch());
  observer.observe(document.body, { childList: true, subtree: true });
}
