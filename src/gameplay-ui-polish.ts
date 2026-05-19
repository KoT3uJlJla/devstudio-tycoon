const TON_WALLET_STORAGE_KEY = 'devstudio_ton_wallet_address';
const API_URL = import.meta.env.VITE_API_URL ?? '';

const RELEASE_QUOTES = {
  low: [
    'Идея видна, но билд разваливается под руками.',
    'Слишком сырой релиз: игроку приходится бороться не с игрой, а с её проблемами.',
    'Есть пара удачных моментов, но их тонет в хаосе.',
    'Проекту нужен ещё один полноценный цикл разработки.',
    'В таком виде это скорее прототип, чем релиз.',
    'Амбиции есть, но качество пока не дотягивает.',
  ],
  weak: [
    'Неровно: задумка интереснее исполнения.',
    'Местами цепляет, но слабые решения слишком заметны.',
    'Игре не хватает уверенности и аккуратной доводки.',
    'Потенциал есть, но релиз ощущается поспешным.',
    'Хорошая основа, которой пока не хватает формы.',
    'Команда нащупала направление, но не удержала качество.',
  ],
  mixed: [
    'Нормальный инди-релиз: не хит, но играть можно.',
    'У игры есть характер, хотя спорных мест хватает.',
    'Сильные идеи чередуются с осторожными компромиссами.',
    'Проект держится на удачных решениях, но не всегда стабилен.',
    'Не всё работает, зато видно, куда студия хотела прийти.',
    'Релиз средний, но отдельные сцены запоминаются.',
  ],
  good: [
    'Уверенная работа: студия стала заметно сильнее.',
    'Релиз приятно удивляет качеством и темпом.',
    'Хороший баланс идей, фокуса и исполнения.',
    'Игру хочется рекомендовать тем, кто любит жанр.',
    'Почти всё на месте: темп, стиль и понятная цель.',
    'Сильный релиз без лишнего шума.',
  ],
  great: [
    'Редкий случай, когда маленькая студия звучит как большая.',
    'Это уже не просто удачный релиз, а заявка на хит.',
    'Игра попадает в ритм с первых минут.',
    'Команда собрала яркий, уверенный и запоминающийся проект.',
    'Отличная работа: хочется сразу ждать следующую игру студии.',
    'Свежо, смело и очень собранно.',
  ],
};

type TonAccountLike = { address?: string };
type TonWalletLike = { account?: TonAccountLike | null };
type TonConnectUiLike = {
  onStatusChange?: (callback: (wallet: unknown) => void) => (() => void) | void;
  connected?: boolean;
  wallet?: TonWalletLike | null;
  account?: TonAccountLike | null;
};

type TonConnectModuleLike = {
  TonConnectUI?: new (options: Record<string, unknown>) => TonConnectUiLike;
  THEME?: { DARK?: string };
};

type BackendTonWallet = { address?: string | null } | null;

let tonConnectUi: TonConnectUiLike | null = null;
let tonConnectInitStarted = false;
let backendTonAddress = '';
let tonSyncInFlight: Promise<void> | null = null;
let lastSyncedTonAddress = '';

function textOf(element: Element | null) {
  return (element?.textContent || '').replace(/\s+/g, ' ').trim();
}

function telegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

function canSyncTonWallet() {
  return Boolean(API_URL && telegramInitData());
}

function readStoredTonAddress() {
  try {
    return localStorage.getItem(TON_WALLET_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function writeStoredTonAddress(address: string) {
  try {
    if (address) localStorage.setItem(TON_WALLET_STORAGE_KEY, address);
    else localStorage.removeItem(TON_WALLET_STORAGE_KEY);
  } catch {
    // best effort only
  }
}

function shortenAddress(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function walletAddress(wallet: unknown) {
  if (!wallet || typeof wallet !== 'object') return '';
  const data = wallet as { address?: unknown; account?: { address?: unknown } };
  if (typeof data.address === 'string') return data.address;
  if (typeof data.account?.address === 'string') return data.account.address;
  return '';
}

function currentTonAddress(wallet?: unknown) {
  return walletAddress(wallet)
    || walletAddress(tonConnectUi?.wallet)
    || walletAddress(tonConnectUi?.account)
    || backendTonAddress
    || readStoredTonAddress();
}

function setTonUiState(label: string, address = '', connected = Boolean(address)) {
  const status = document.querySelector<HTMLElement>('.ton-wallet-status');
  const addressNode = document.querySelector<HTMLElement>('.ton-wallet-address');
  const panel = document.querySelector<HTMLElement>('.ton-wallet-panel');
  if (status) status.textContent = label;
  if (addressNode) addressNode.textContent = address ? shortenAddress(address) : 'Выберите кошелёк через TON Connect';
  panel?.classList.toggle('ton-wallet-connected', connected);
}

function updateTonStatus(wallet?: unknown) {
  const address = currentTonAddress(wallet);
  const connected = Boolean(address || tonConnectUi?.connected);
  if (address) writeStoredTonAddress(address);
  if (backendTonAddress) {
    setTonUiState('привязан', backendTonAddress, true);
  } else if (connected && address) {
    setTonUiState('сохраняем…', address, true);
  } else {
    setTonUiState('не привязан', '', false);
  }
}

async function syncTonWalletToBackend(address: string) {
  if (!address || !canSyncTonWallet()) return;
  if (address === lastSyncedTonAddress && address === backendTonAddress) return;
  if (tonSyncInFlight) await tonSyncInFlight.catch(() => undefined);
  tonSyncInFlight = fetch(`${API_URL}/api/wallet/ton`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify({ address }),
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'ton_wallet_sync_failed');
      const savedAddress = String(payload?.tonWallet?.address || payload?.economy?.tonWallet?.address || address);
      backendTonAddress = savedAddress;
      lastSyncedTonAddress = savedAddress;
      writeStoredTonAddress(savedAddress);
      setTonUiState('привязан', savedAddress, true);
    })
    .catch(() => {
      setTonUiState('ошибка', address, true);
    })
    .finally(() => {
      tonSyncInFlight = null;
    });
  await tonSyncInFlight;
}

async function loadBackendTonWallet() {
  if (!canSyncTonWallet()) {
    backendTonAddress = readStoredTonAddress();
    updateTonStatus();
    return;
  }
  try {
    const payload = await fetch(`${API_URL}/api/wallet/state`, {
      headers: { Authorization: `tma ${telegramInitData()}` },
    }).then((response) => (response.ok ? response.json() : null));
    const tonWallet = payload?.economy?.tonWallet as BackendTonWallet;
    const address = String(tonWallet?.address || '');
    backendTonAddress = address;
    lastSyncedTonAddress = address;
    if (address) writeStoredTonAddress(address);
    updateTonStatus();
  } catch {
    updateTonStatus();
  }
}

function scheduleTonStatusRefresh() {
  window.setTimeout(() => {
    const address = currentTonAddress();
    updateTonStatus();
    if (address) void syncTonWalletToBackend(address);
  }, 250);
  window.setTimeout(() => {
    const address = currentTonAddress();
    updateTonStatus();
    if (address) void syncTonWalletToBackend(address);
  }, 1000);
  window.setTimeout(() => {
    const address = currentTonAddress();
    updateTonStatus();
    if (address) void syncTonWalletToBackend(address);
  }, 2500);
}

async function ensureTonConnect(buttonRootId: string) {
  if (tonConnectUi) {
    void loadBackendTonWallet();
    scheduleTonStatusRefresh();
    return;
  }
  if (tonConnectInitStarted) return;
  tonConnectInitStarted = true;
  try {
    const mod = await import('@tonconnect/ui') as unknown as TonConnectModuleLike;
    const TonConnectUI = mod.TonConnectUI;
    const darkTheme = mod.THEME?.DARK || 'DARK';
    if (!TonConnectUI || !document.getElementById(buttonRootId)) return;
    tonConnectUi = new TonConnectUI({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
      buttonRootId,
      language: 'ru',
      uiPreferences: { theme: darkTheme },
    });
    tonConnectUi.onStatusChange?.((wallet) => {
      const address = currentTonAddress(wallet);
      updateTonStatus(wallet);
      if (address) void syncTonWalletToBackend(address);
      else if (backendTonAddress) { backendTonAddress = ''; writeStoredTonAddress(''); updateTonStatus(); }
      scheduleTonStatusRefresh();
    });
    window.addEventListener('focus', () => { updateTonStatus(); scheduleTonStatusRefresh(); });
    document.addEventListener('visibilitychange', () => { updateTonStatus(); scheduleTonStatusRefresh(); });
    void loadBackendTonWallet();
    updateTonStatus();
    scheduleTonStatusRefresh();
  } catch {
    setTonUiState('недоступен', '', false);
  }
}

function seededIndex(seed: string, length: number) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % Math.max(1, length);
}

function quoteBand(score: number) {
  if (score < 4) return RELEASE_QUOTES.low;
  if (score < 5.8) return RELEASE_QUOTES.weak;
  if (score < 7.2) return RELEASE_QUOTES.mixed;
  if (score < 8.8) return RELEASE_QUOTES.good;
  return RELEASE_QUOTES.great;
}

function replaceTextNode(node: Node) {
  if (node.nodeType !== Node.TEXT_NODE || !node.textContent) return;
  const next = node.textContent
    .replace(/ПОЛИШ!/g, 'РАБОТА!')
    .replace(/Полиш/g, 'Работа')
    .replace(/полиш/g, 'работа')
    .replace(/\bТоп\b/g, 'Награды')
    .replace(/Недельный топ-10/g, 'Еженедельные награды')
    .replace(/топ-10/g, 'призовую десятку');
  if (next !== node.textContent) node.textContent = next;
}

function replacePolishWords(root: ParentNode = document) {
  root.querySelectorAll('.dev-pop, .dev-ticker-pop, .dev-ambient span, .bottom-nav button, .rating-hero, .current-prize-card').forEach((element) => {
    element.childNodes.forEach(replaceTextNode);
  });
}

function hideOfflineDrop() {
  document.querySelectorAll<HTMLElement>('.offline-toast').forEach((node) => {
    node.classList.add('offline-toast-hidden');
    node.setAttribute('aria-hidden', 'true');
  });
}

function hideResetButton() {
  document.querySelectorAll<HTMLButtonElement>('button.danger').forEach((button) => {
    if (!textOf(button).includes('Сбросить прогресс')) return;
    button.classList.add('reset-progress-hidden');
    button.setAttribute('aria-hidden', 'true');
    button.tabIndex = -1;
  });
}

function rewriteStudioUpgradeText() {
  document.querySelectorAll<HTMLElement>('.studio-upgrade .muted').forEach((node) => {
    if (node.dataset.copyPolished === '1') return;
    node.dataset.copyPolished = '1';
    node.textContent = 'Повышение уровня открывает больше слотов команды, усиливает темп студии и помогает брать более крупные проекты. Следующий уровень — это заметный скачок возможностей.';
  });
}

function installStaticCatArt() {
  document.querySelectorAll<HTMLElement>('.cover-art, .pixel-cat-cover').forEach((node) => {
    node.classList.add('static-pixel-cat');
  });
}

function makeTonWalletPanel() {
  const panel = document.createElement('section');
  panel.className = 'panel comic-card ton-wallet-panel';
  panel.innerHTML = `
    <div class="section-head compact">
      <div>
        <p class="eyebrow">TON-кошелёк</p>
        <h3>Кошелёк для еженедельных наград</h3>
      </div>
      <span class="pill ton-wallet-status">не привязан</span>
    </div>
    <p class="muted small">Это необходимо для того, чтобы вы могли получить свою еженедельную награду.</p>
    <div class="ton-connect-root" id="ton-connect-root"></div>
    <p class="small muted ton-wallet-address">Выберите кошелёк через TON Connect</p>
    <p class="small muted ton-wallet-hint">Здесь можно только привязать или отвязать кошелёк. Транзакции в игре не подписываются.</p>
  `;
  return panel;
}

function installTonWalletPanel() {
  const anchor = document.querySelector<HTMLElement>('.referral-panel');
  if (!anchor) return;
  let panel = document.querySelector<HTMLElement>('.ton-wallet-panel');
  if (!panel) {
    panel = makeTonWalletPanel();
    anchor.insertAdjacentElement('afterend', panel);
  }
  updateTonStatus();
  void ensureTonConnect('ton-connect-root');
}

function tuneReleaseQuotes() {
  document.querySelectorAll<HTMLElement>('.critic-card.shown').forEach((card, index) => {
    if (card.dataset.scoreQuoteTuned === '1') return;
    const score = Number(textOf(card.querySelector('b')).replace(',', '.'));
    const quote = card.querySelector<HTMLElement>('em');
    if (!quote || !Number.isFinite(score)) return;
    const band = quoteBand(score);
    const criticName = textOf(card.querySelector('span'));
    quote.textContent = band[seededIndex(`${criticName}:${score}:${index}`, band.length)];
    card.dataset.scoreQuoteTuned = '1';
  });
}

function applyGameplayPolish() {
  hideOfflineDrop();
  hideResetButton();
  replacePolishWords();
  rewriteStudioUpgradeText();
  installStaticCatArt();
  installTonWalletPanel();
  document.querySelectorAll('.time-skip-button').forEach((button) => {
    if (textOf(button).includes('1ч')) button.textContent = button.textContent?.replace('на 1ч', 'на 25%') || 'Ускорить на 25% ⭐25';
  });
  tuneReleaseQuotes();
}

let scheduled = false;
function scheduleGameplayPolish() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyGameplayPolish();
  });
}

export function installGameplayUiPolish() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyGameplayPolish();
  const observer = new MutationObserver(scheduleGameplayPolish);
  observer.observe(document.body, { childList: true, subtree: true });
}
