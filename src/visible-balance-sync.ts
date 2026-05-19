type BalanceLike = {
  coins?: unknown;
  rp?: unknown;
  stars?: unknown;
};

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasFiniteNumber(value: unknown) {
  return Number.isFinite(Number(value));
}

function money(value: unknown) {
  return Math.round(safeNumber(value)).toLocaleString('ru-RU');
}

function setSpanValue(span: HTMLElement | undefined, value: string) {
  if (!span) return;
  Array.from(span.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) node.remove();
  });
  span.appendChild(document.createTextNode(` ${value}`));
}

function dispatchServerSave(data: unknown) {
  try {
    window.dispatchEvent(new CustomEvent('devstudio:server-save', { detail: data }));
  } catch {
    // best-effort live React sync
  }
}

export function applyVisibleBalanceFromSave(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  dispatchServerSave(data);
  const balance = data as BalanceLike;
  const wallet = document.querySelector<HTMLElement>('.compact-wallet');
  if (!wallet) return true;
  const spans = Array.from(wallet.querySelectorAll<HTMLElement>('span'));
  // Do not write fallback zeroes when a partial backend payload misses gameplay
  // fields. Coins/RP live in save.data; only update them when finite values exist.
  if (hasFiniteNumber(balance.coins)) setSpanValue(spans[0], money(balance.coins));
  if (hasFiniteNumber(balance.rp)) setSpanValue(spans[1], money(balance.rp));
  if (hasFiniteNumber(balance.stars)) setSpanValue(spans[2], String(Math.round(safeNumber(balance.stars))));
  return true;
}

export function applyVisibleBalanceFromLocalStorage(storageKey: string) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;
    return applyVisibleBalanceFromSave(JSON.parse(raw));
  } catch {
    return false;
  }
}
