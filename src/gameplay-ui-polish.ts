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
  node.textContent = node.textContent
    .replace(/ПОЛИШ!/g, 'РАБОТА!')
    .replace(/Полиш/g, 'Работа')
    .replace(/полиш/g, 'работа');
}

function replacePolishWords(root: ParentNode = document) {
  root.querySelectorAll('.dev-pop, .dev-ticker-pop, .dev-ambient span').forEach((element) => {
    element.childNodes.forEach(replaceTextNode);
  });
}

function hideOfflineDrop() {
  document.querySelectorAll<HTMLElement>('.offline-toast').forEach((node) => {
    node.classList.add('offline-toast-hidden');
    node.setAttribute('aria-hidden', 'true');
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
  replacePolishWords();
  rewriteStudioUpgradeText();
  installStaticCatArt();
  tuneReleaseQuotes();
}

export function installGameplayUiPolish() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyGameplayPolish();
  const observer = new MutationObserver(applyGameplayPolish);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
