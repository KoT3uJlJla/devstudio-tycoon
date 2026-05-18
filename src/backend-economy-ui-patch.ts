const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

type EconomyEndpoint = 'daily' | 'shop/purchase' | 'referral/claim';

type EconomyPayload = {
  ok?: boolean;
  error?: string;
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
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function showEconomyNotice(message: string) {
  try {
    window.Telegram?.WebApp?.showPopup?.({
      title: 'Магазин студии',
      message,
      buttons: [{ type: 'ok' }],
    });
    return;
  } catch {
    // fallback below
  }
  window.alert(message);
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
    if (!response.ok || !payload?.ok) {
      const error = payload?.error || `backend_economy_failed:${endpoint}`;
      throw new Error(error);
    }
    persistServerSave(payload);
    return payload;
  } finally {
    window.clearTimeout(timer);
  }
}

function refreshAfterServerState() {
  window.setTimeout(() => window.location.reload(), 120);
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
      if (message.includes('not_enough_stars')) {
        showEconomyNotice('Не хватает игровых ⭐. Покупка за баланс Telegram Stars будет подключена следующим патчем через invoice. Сейчас товар не выдан.');
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
