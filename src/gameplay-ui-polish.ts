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

type BackendTonWallet = { address?: string | null } | null;

let backendTonAddress = '';
let tonSyncInFlight: Promise<void> | null = null;

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

function cleanTonAddress(value: string) {
  return value.trim().replace(/\s+/g, '').slice(0, 128);
}

function shortenAddress(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function setTonUiState(label: string, address = '', connected = Boolean(address)) {
  const status = document.querySelector<HTMLElement>('.ton-wallet-status');
  const addressNode = document.querySelector<HTMLElement>('.ton-wallet-address');
  const panel = document.querySelector<HTMLElement>('.ton-wallet-panel');
  const input = document.querySelector<HTMLInputElement>('.ton-wallet-input');
  if (status) status.textContent = label;
  if (addressNode) addressNode.textContent = address ? shortenAddress(address) : 'Адрес кошелька не указан';
  if (input && address && input.value !== address) input.value = address;
  panel?.classList.toggle('ton-wallet-connected', connected);
}

async function syncTonWalletToBackend(address: string) {
  const clean = cleanTonAddress(address);
  if (!clean) {
    setTonUiState('введите адрес', '', false);
    return;
  }
  writeStoredTonAddress(clean);
  setTonUiState('сохраняем…', clean, true);

  if (!canSyncTonWallet()) {
    backendTonAddress = clean;
    setTonUiState('сохранён локально', clean, true);
    return;
  }

  if (tonSyncInFlight) await tonSyncInFlight.catch(() => undefined);
  tonSyncInFlight = fetch(`${API_URL}/api/wallet/ton`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify({ address: clean }),
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'ton_wallet_sync_failed');
      const savedAddress = String(payload?.tonWallet?.address || payload?.economy?.tonWallet?.address || clean);
      backendTonAddress = savedAddress;
      writeStoredTonAddress(savedAddress);
      setTonUiState('привязан', savedAddress, true);
    })
    .catch(() => {
      setTonUiState('ошибка адреса', clean, true);
    })
    .finally(() => {
      tonSyncInFlight = null;
    });
  await tonSyncInFlight;
}

async function syncTonWalletUnbindBackend() {
  backendTonAddress = '';
  writeStoredTonAddress('');
  const input = document.querySelector<HTMLInputElement>('.ton-wallet-input');
  if (input) input.value = '';
  setTonUiState('отвязываем…', '', false);

  if (!canSyncTonWallet()) {
    setTonUiState('не привязан', '', false);
    return;
  }

  if (tonSyncInFlight) await tonSyncInFlight.catch(() => undefined);
  tonSyncInFlight = fetch(`${API_URL}/api/wallet/ton`, {
    method: 'DELETE',
    headers: { Authorization: `tma ${telegramInitData()}` },
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'ton_wallet_unbind_failed');
      backendTonAddress = '';
      writeStoredTonAddress('');
      setTonUiState('не привязан', '', false);
    })
    .catch(() => {
      setTonUiState('ошибка', '', false);
    })
    .finally(() => {
      tonSyncInFlight = null;
    });
  await tonSyncInFlight;
}

async function loadBackendTonWallet() {
  if (!canSyncTonWallet()) {
    backendTonAddress = readStoredTonAddress();
    setTonUiState(backendTonAddress ? 'сохранён локально' : 'не привязан', backendTonAddress, Boolean(backendTonAddress));
    return;
  }
  try {
    const payload = await fetch(`${API_URL}/api/wallet/state`, {
      headers: { Authorization: `tma ${telegramInitData()}` },
    }).then((response) => (response.ok ? response.json() : null));
    const tonWallet = payload?.economy?.tonWallet as BackendTonWallet;
    const address = String(tonWallet?.address || '');
    backendTonAddress = address;
    if (address) writeStoredTonAddress(address);
    setTonUiState(address ? 'привязан' : 'не привязан', address, Boolean(address));
  } catch {
    const address = readStoredTonAddress();
    setTonUiState(address ? 'локальный кэш' : 'не привязан', address, Boolean(address));
  }
}

function bindManualTonPanel(panel: HTMLElement) {
  if (panel.dataset.manualTonBound === '1') return;
  panel.dataset.manualTonBound = '1';
  const input = panel.querySelector<HTMLInputElement>('.ton-wallet-input');
  const bindButton = panel.querySelector<HTMLButtonElement>('.ton-wallet-bind');
  const unbindButton = panel.querySelector<HTMLButtonElement>('.ton-wallet-unbind');
  bindButton?.addEventListener('click', () => void syncTonWalletToBackend(input?.value || ''));
  unbindButton?.addEventListener('click', () => void syncTonWalletUnbindBackend());
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') void syncTonWalletToBackend(input.value);
  });
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
    .replace(/топ-10/g, 'призовую пятёрку')
    .replace(/топ-5/g, 'призовую пятёрку')
    .replace(/\$500/g, '$200')
    .replace(/Топ-10/g, 'Топ-5');
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
    <input class="project-name ton-wallet-input" placeholder="EQ... или 0:..." inputmode="text" autocomplete="off" />
    <div class="inline-actions ton-wallet-actions">
      <button class="primary ton-wallet-bind" type="button">Сохранить кошелёк</button>
      <button class="ghost ton-wallet-unbind" type="button">Отвязать</button>
    </div>
    <p class="small muted ton-wallet-address">Адрес кошелька не указан</p>
    <p class="small muted ton-wallet-hint">В игре можно только привязать или отвязать адрес. Транзакции не подписываются.</p>
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
  bindManualTonPanel(panel);
  void loadBackendTonWallet();
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
