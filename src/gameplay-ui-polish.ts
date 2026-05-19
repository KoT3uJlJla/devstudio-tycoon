const TON_WALLET_KEY = 'devstudio_ton_wallet_address';

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

function textOf(element: Element | null) {
  return (element?.textContent || '').replace(/\s+/g, ' ').trim();
}

function readTonWallet() {
  try {
    return localStorage.getItem(TON_WALLET_KEY) || '';
  } catch {
    return '';
  }
}

function writeTonWallet(value: string) {
  try {
    if (value) localStorage.setItem(TON_WALLET_KEY, value);
    else localStorage.removeItem(TON_WALLET_KEY);
  } catch {
    // best effort only
  }
}

function shortenWallet(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function isPlausibleTonAddress(value: string) {
  const clean = value.trim();
  return /^(EQ|UQ)[A-Za-z0-9_-]{46,}$/.test(clean) || /^0:[a-fA-F0-9]{64}$/.test(clean);
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
    <div class="ton-wallet-form">
      <input class="ton-wallet-input" inputmode="text" autocomplete="off" spellcheck="false" placeholder="EQ… или 0:…" />
      <button class="primary ton-wallet-bind" type="button">Привязать</button>
      <button class="ghost ton-wallet-unbind" type="button">Отвязать</button>
    </div>
    <p class="small muted ton-wallet-hint">Мы только сохраняем адрес в игре. Подписывать транзакции и отправлять TON здесь нельзя.</p>
  `;
  return panel;
}

function refreshTonPanel(panel: HTMLElement) {
  const wallet = readTonWallet();
  const input = panel.querySelector<HTMLInputElement>('.ton-wallet-input');
  const status = panel.querySelector<HTMLElement>('.ton-wallet-status');
  const unbind = panel.querySelector<HTMLButtonElement>('.ton-wallet-unbind');
  if (input && document.activeElement !== input) input.value = wallet;
  if (status) status.textContent = wallet ? `привязан ${shortenWallet(wallet)}` : 'не привязан';
  if (unbind) unbind.disabled = !wallet;
  panel.classList.toggle('ton-wallet-connected', Boolean(wallet));
}

function installTonWalletPanel() {
  const anchor = document.querySelector<HTMLElement>('.referral-panel');
  if (!anchor || document.querySelector('.ton-wallet-panel')) return;
  const panel = makeTonWalletPanel();
  anchor.insertAdjacentElement('afterend', panel);

  const input = panel.querySelector<HTMLInputElement>('.ton-wallet-input');
  const bind = panel.querySelector<HTMLButtonElement>('.ton-wallet-bind');
  const unbind = panel.querySelector<HTMLButtonElement>('.ton-wallet-unbind');

  bind?.addEventListener('click', () => {
    const value = (input?.value || '').trim();
    if (!isPlausibleTonAddress(value)) {
      window.Telegram?.WebApp?.showPopup?.({ title: 'TON-кошелёк', message: 'Проверь адрес кошелька. Поддерживаются адреса EQ…, UQ… или raw 0:…', buttons: [{ type: 'ok' }] });
      input?.focus();
      return;
    }
    writeTonWallet(value);
    refreshTonPanel(panel);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
  });

  unbind?.addEventListener('click', () => {
    writeTonWallet('');
    if (input) input.value = '';
    refreshTonPanel(panel);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('warning');
  });

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') bind?.click();
  });

  refreshTonPanel(panel);
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
