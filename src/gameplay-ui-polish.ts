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

const prizePool = [
  ['$70', '35%'],
  ['$50', '25%'],
  ['$35', '17.5%'],
  ['$25', '12.5%'],
  ['$20', '10%'],
] as const;

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

function maskTonAddress(value: string) {
  const clean = cleanTonAddress(value);
  if (!clean) return '';
  return clean.length > 12 ? `${clean.slice(0, 5)}...${clean.slice(-5)}` : clean;
}

function updateTonWalletActions(panel?: HTMLElement | null) {
  const root = panel ?? document.querySelector<HTMLElement>('.ton-wallet-panel');
  if (!root) return;
  const input = root.querySelector<HTMLInputElement>('.ton-wallet-input');
  const bindButton = root.querySelector<HTMLButtonElement>('.ton-wallet-bind');
  const unbindButton = root.querySelector<HTMLButtonElement>('.ton-wallet-unbind');
  const isDirty = input?.dataset.tonDirty === '1';
  const candidate = isDirty ? cleanTonAddress(input?.value || '') : '';
  const canSave = Boolean(isDirty && candidate && candidate !== backendTonAddress && !candidate.includes('...'));
  if (bindButton) bindButton.disabled = Boolean(tonSyncInFlight) || !canSave;
  if (unbindButton) unbindButton.disabled = Boolean(tonSyncInFlight) || !backendTonAddress;
}

function setTonUiState(label: string, address = '', connected = Boolean(address), forceInput = false) {
  const status = document.querySelector<HTMLElement>('.ton-wallet-status');
  const panel = document.querySelector<HTMLElement>('.ton-wallet-panel');
  const input = panel?.querySelector<HTMLInputElement>('.ton-wallet-input');
  const duplicateAddress = panel?.querySelector<HTMLElement>('.ton-wallet-address');
  duplicateAddress?.remove();
  if (status) status.textContent = label;
  if (panel) {
    panel.classList.toggle('ton-wallet-connected', connected);
    panel.dataset.tonAddress = address;
  }
  if (input && (forceInput || input.dataset.tonDirty !== '1')) {
    input.value = address ? maskTonAddress(address) : '';
    input.title = address || '';
    input.dataset.tonDirty = '0';
  }
  updateTonWalletActions(panel);
}

async function syncTonWalletToBackend(address: string) {
  const clean = cleanTonAddress(address);
  if (!clean || clean.includes('...')) {
    setTonUiState('введите адрес', backendTonAddress, Boolean(backendTonAddress), false);
    return;
  }
  writeStoredTonAddress(clean);
  setTonUiState('сохраняем…', clean, true, false);

  if (!canSyncTonWallet()) {
    backendTonAddress = clean;
    setTonUiState('сохранён локально', clean, true, true);
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
      setTonUiState('привязан', savedAddress, true, true);
    })
    .catch(() => {
      setTonUiState('ошибка адреса', clean, true, false);
    })
    .finally(() => {
      tonSyncInFlight = null;
      updateTonWalletActions();
    });
  await tonSyncInFlight;
}

async function syncTonWalletUnbindBackend() {
  backendTonAddress = '';
  writeStoredTonAddress('');
  setTonUiState('отвязываем…', '', false, true);

  if (!canSyncTonWallet()) {
    setTonUiState('не привязан', '', false, true);
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
      setTonUiState('не привязан', '', false, true);
    })
    .catch(() => {
      setTonUiState('ошибка', '', false, true);
    })
    .finally(() => {
      tonSyncInFlight = null;
      updateTonWalletActions();
    });
  await tonSyncInFlight;
}

async function loadBackendTonWallet() {
  if (!canSyncTonWallet()) {
    backendTonAddress = readStoredTonAddress();
    setTonUiState(backendTonAddress ? 'сохранён локально' : 'не привязан', backendTonAddress, Boolean(backendTonAddress), true);
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
    else writeStoredTonAddress('');
    setTonUiState(address ? 'привязан' : 'не привязан', address, Boolean(address), true);
  } catch {
    const address = readStoredTonAddress();
    backendTonAddress = address;
    setTonUiState(address ? 'локальный кэш' : 'не привязан', address, Boolean(address), true);
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
  input?.addEventListener('focus', () => {
    if (input.dataset.tonDirty !== '1' && backendTonAddress) input.select();
  });
  input?.addEventListener('input', () => {
    input.dataset.tonDirty = '1';
    updateTonWalletActions(panel);
  });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !bindButton?.disabled) void syncTonWalletToBackend(input.value);
  });
  updateTonWalletActions(panel);
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
    .replace(/топ-10/g, 'топ-5')
    .replace(/\$500/g, '$200')
    .replace(/Топ-10/g, 'Топ-5')
    .replace(/призовую десятку/g, 'призовую пятёрку');
  if (next !== node.textContent) node.textContent = next;
}

function replacePolishWords(root: ParentNode = document) {
  root.querySelectorAll('.dev-pop, .dev-ticker-pop, .dev-ambient span, .bottom-nav button, .rating-hero, .current-prize-card').forEach((element) => {
    element.childNodes.forEach(replaceTextNode);
  });
}

function rewritePrizePool() {
  const grid = document.querySelector<HTMLElement>('.prize-grid');
  if (!grid) return;
  const panel = grid.closest<HTMLElement>('.panel');
  const header = panel?.querySelector<HTMLElement>('h3');
  const pill = panel?.querySelector<HTMLElement>('.pill');
  if (header && textOf(header) !== 'Призовой фонд $200') header.textContent = 'Призовой фонд $200';
  if (pill && textOf(pill) !== 'только топ-5') pill.textContent = 'только топ-5';
  if (grid.dataset.prizePool === '200') return;
  const currentIndex = Array.from(grid.children).findIndex((child) => child.classList.contains('current'));
  grid.innerHTML = prizePool.map(([amount, percent], index) => `
    <div class="${currentIndex === index ? 'prize-cell current' : 'prize-cell'}">
      <span>#${index + 1}</span>
      <strong>${amount}</strong>
      <em>${percent}</em>
    </div>
  `).join('');
  grid.dataset.prizePool = '200';
}

function rewriteReferralCopy() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.referral-grid article'));
  const direct = cards[0]?.querySelector<HTMLElement>('span');
  const second = cards[1]?.querySelector<HTMLElement>('span');
  if (direct) direct.textContent = '10% ⭐ от трат твоих друзей';
  if (second) second.textContent = '3% ⭐ от трат друзей твоих друзей';
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
      <button class="primary ton-wallet-bind" type="button" disabled>Сохранить кошелёк</button>
      <button class="ghost ton-wallet-unbind" type="button" disabled>Отвязать</button>
    </div>
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
  rewritePrizePool();
  rewriteReferralCopy();
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
