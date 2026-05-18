const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';

function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readSavedCoins() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parseNumber((parsed as { coins?: unknown }).coins);
  } catch {
    return null;
  }
}

function walletCoinTextNode() {
  const walletCoins = document.querySelector<HTMLElement>('.wallet span:first-child');
  if (!walletCoins) return null;
  return Array.from(walletCoins.childNodes).reverse().find((node) => node.nodeType === Node.TEXT_NODE) ?? null;
}

function writeWalletCoins(value: number) {
  const textNode = walletCoinTextNode();
  if (!textNode) return;
  textNode.textContent = ` ${Math.round(value).toLocaleString('ru-RU')}`;
}

function syncBalanceDisplay() {
  const coins = readSavedCoins();
  if (coins === null) return;
  writeWalletCoins(coins);
}

export function installBalanceLoadFix() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.setTimeout(syncBalanceDisplay, 0);
  window.setTimeout(syncBalanceDisplay, 300);
  window.setTimeout(syncBalanceDisplay, 900);

  const observer = new MutationObserver(() => syncBalanceDisplay());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
