const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL || 'https://devstudio-tycoon-api.onrender.com';

type WalletPayload = {
  ok?: boolean;
  save?: { data?: unknown } | null;
  economy?: { coins?: unknown; rp?: unknown; stars?: unknown };
};

type WalletState = { coins: number; rp: number; stars: number; rawSave?: unknown };

let latestWallet: WalletState | null = null;
let fetchInFlight = false;

function telegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return Math.round(value).toLocaleString('ru-RU');
}

function walletFromPayload(payload: WalletPayload): WalletState | null {
  const saveData = payload.save?.data;
  const saveObject = saveData && typeof saveData === 'object' && !Array.isArray(saveData)
    ? saveData as Record<string, unknown>
    : null;
  if (!payload.ok || (!saveObject && !payload.economy)) return null;
  return {
    coins: Math.max(safeNumber(payload.economy?.coins), safeNumber(saveObject?.coins)),
    rp: Math.max(safeNumber(payload.economy?.rp), safeNumber(saveObject?.rp)),
    stars: Math.max(safeNumber(payload.economy?.stars), safeNumber(saveObject?.stars)),
    rawSave: saveData,
  };
}

function persistWallet(wallet: WalletState) {
  if (!wallet.rawSave || typeof wallet.rawSave !== 'object' || Array.isArray(wallet.rawSave)) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...(wallet.rawSave as Record<string, unknown>),
      coins: wallet.coins,
      rp: wallet.rp,
      stars: wallet.stars,
    }));
  } catch {
    // best effort
  }
}

function setSpanText(span: HTMLElement | undefined, value: string) {
  if (!span) return;
  const icon = span.querySelector('svg');
  span.textContent = '';
  if (icon) span.appendChild(icon);
  span.appendChild(document.createTextNode(` ${value}`));
}

function applyWalletToDom(wallet: WalletState) {
  document.querySelectorAll<HTMLElement>('.compact-wallet, .wallet').forEach((node) => {
    const spans = Array.from(node.querySelectorAll<HTMLElement>(':scope > span'));
    setSpanText(spans[0], formatMoney(wallet.coins));
    setSpanText(spans[1], formatMoney(wallet.rp));
    setSpanText(spans[2], String(Math.round(wallet.stars)));
  });
}

async function refreshWalletFromBackend() {
  const initData = telegramInitData();
  if (!API_URL || !initData || fetchInFlight) return;
  fetchInFlight = true;
  try {
    const response = await fetch(`${API_URL}/api/wallet/state`, {
      headers: { Authorization: `tma ${initData}` },
    });
    const payload = await response.json().catch(() => null) as WalletPayload | null;
    if (!response.ok || !payload?.ok) return;
    const wallet = walletFromPayload(payload);
    if (!wallet) return;
    latestWallet = wallet;
    persistWallet(wallet);
    applyWalletToDom(wallet);
  } catch {
    // keep last known wallet
  } finally {
    fetchInFlight = false;
  }
}

export function installAuthoritativeWalletUiPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  void refreshWalletFromBackend();
  window.setInterval(refreshWalletFromBackend, 2000);
  window.setInterval(() => {
    if (latestWallet) applyWalletToDom(latestWallet);
  }, 250);
}
