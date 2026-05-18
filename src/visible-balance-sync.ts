type BalanceLike = {
  coins?: unknown;
  rp?: unknown;
  stars?: unknown;
};

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

export function applyVisibleBalanceFromSave(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const balance = data as BalanceLike;
  const wallet = document.querySelector<HTMLElement>('.compact-wallet');
  if (!wallet) return false;
  const spans = Array.from(wallet.querySelectorAll<HTMLElement>('span'));
  setSpanValue(spans[0], money(balance.coins));
  setSpanValue(spans[1], money(balance.rp));
  setSpanValue(spans[2], String(Math.round(safeNumber(balance.stars))));
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
