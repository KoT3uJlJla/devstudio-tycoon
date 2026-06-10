type GameLanguage = 'ru' | 'en';

type TelegramWebApp = {
  initDataUnsafe?: {
    user?: {
      language_code?: string;
      languageCode?: string;
    };
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
    __DEVSTUDIO_LANGUAGE__?: GameLanguage;
  }
}

const exactEnglish: Record<string, string> = {
  'Загрузка': 'Loading',
  'Загружаем студию': 'Loading your studio',
  'Синхронизация': 'Syncing',
  'Ведутся технические работы. Возвращайтесь позже': 'Maintenance is in progress. Come back a bit later.',
  'Студия': 'Studio',
  'Разработка': 'Development',
  'Наука': 'Research',
  'Команда': 'Team',
  'Магазин': 'Shop',
  'Рейтинг': 'Leaderboard',
  'Награды': 'Rewards',
  'Офис студии': 'Studio Office',
  'Цели студии': 'Studio Goals',
  'Ежедневные награды': 'Daily Rewards',
  'Ежедневные задачи': 'Daily Tasks',
  'Задачи': 'Tasks',
  'Интересы аудитории': 'Audience Buzz',
  'Экономика': 'Economy',
  'Календарь': 'Calendar',
  'Касса': 'Cash',
  'Монеты': 'Coins',
  'Очки науки': 'Research Points',
  'Фанаты': 'Fans',
  'Репутация': 'Reputation',
  'Доход релизов': 'Release Income',
  'Расходы': 'Expenses',
  'Аренда': 'Rent',
  'Инфраструктура': 'Infrastructure',
  'Пассивный доход': 'Passive income',
  'Недельные расходы': 'Weekly expenses',
  'Баланс': 'Balance',
  'Уровень студии': 'Studio level',
  'Название студии': 'Studio name',
  'Игровой день': 'Game day',
  'День': 'Day',
  'Год': 'Year',
  'Месяц': 'Month',
  'Начать разработку': 'Start development',
  'Продолжить разработку': 'Continue development',
  'Выпустить игру': 'Launch the game',
  'Продвигать': 'Promote',
  'Продвижение': 'Promotion',
  'Ускорить': 'Speed up',
  'Ускорить на 25%': 'Speed up by 25%',
  'Создать проект': 'Create project',
  'Новая игра': 'New game',
  'Закрыть': 'Close',
  'Далее': 'Next',
  'Назад': 'Back',
  'Готово': 'Done',
  'Начать': 'Start',
  'Позже': 'Later',
  'Отмена': 'Cancel',
  'Сохранить': 'Save',
  'Изменить': 'Change',
  'Поделиться': 'Share',
  'Забрать': 'Claim',
  'Получить': 'Get',
  'Купить': 'Buy',
  'Открыть': 'Unlock',
  'Исследовать': 'Research',
  'Нанять': 'Hire',
  'Уволить': 'Fire',
  'Активно': 'Active',
  'Недоступно': 'Locked',
  'Забрано': 'Claimed',
  'Выполнено': 'Done',
  'В процессе': 'In progress',
  'Сегодня': 'Today',
  'Завтра': 'Tomorrow',
  'На этой неделе': 'This week',
  'Премиальный навык · 7 дней': 'Premium skill · 7 days',
  '7 дней подсказок': '7 days of hints',
  'Продуктовое чутьё': 'Product Instinct',
  'Смена названия': 'Rename Studio',
  'Набор науки': 'Research Pack',
  'Набор монет': 'Coin Pack',
  'Малый набор монет': 'Small Coin Pack',
  'Средний набор монет': 'Medium Coin Pack',
  'Большой набор монет': 'Big Coin Pack',
  'TON-кошелёк': 'TON Wallet',
  'Привязать': 'Link',
  'Отвязать': 'Unlink',
  'Кошелёк привязан': 'Wallet linked',
  'Введите адрес TON-кошелька': 'Enter your TON wallet address',
  'Топ-5': 'Top 5',
  'Топ-10': 'Top 10',
  'Призовой фонд': 'Prize pool',
  'Место': 'Place',
  'Игрок': 'Player',
  'Счёт': 'Score',
  'Проверенные релизы': 'Verified releases',
  'Средняя оценка прессы': 'Average press score',
  'Первый релиз': 'First release',
  'Релиз': 'Release',
  'Итоги релиза': 'Release Results',
  'Оценка': 'Score',
  'Доход': 'Income',
  'Выручка': 'Revenue',
  'Продажи': 'Sales',
  'Пресса': 'Press',
  'Детализация оценки': 'Score breakdown',
  'Ваши решения сильно влияют на этот модификатор': 'Your choices strongly affect this modifier.',
  'Этот модификатор не зависит от ваших решений': 'This modifier is outside your control.',
  'Жанр': 'Genre',
  'Сеттинг': 'Theme',
  'Платформа': 'Platform',
  'Фокус разработки': 'Development focus',
  'Код': 'Code',
  'Арт': 'Art',
  'Дизайн': 'Design',
  'Маркетинг': 'Marketing',
  'Качество': 'Quality',
  'Баги': 'Bugs',
  'Комбо': 'Combo',
  'Отличное комбо': 'Great combo',
  'Хорошее комбо': 'Good combo',
  'Слабое комбо': 'Weak combo',
  'Аркада': 'Arcade',
  'Симулятор': 'Simulator',
  'Стратегия': 'Strategy',
  'Головоломка': 'Puzzle',
  'Выживание': 'Survival',
  'Гонки': 'Racing',
  'Платформер': 'Platformer',
  'Киберпанк': 'Cyberpunk',
  'Фэнтези': 'Fantasy',
  'Космос': 'Space',
  'Школа': 'School',
  'Зомби': 'Zombies',
  'Коты': 'Cats',
  'Пираты': 'Pirates',
  'Спорт': 'Sports',
  'Микро-ПК': 'Micro PC',
  'Браузер': 'Browser',
  'Мобилка': 'Mobile',
  'Консоль': 'Console',
  'Портативка': 'Handheld',
  'Кодер': 'Coder',
  'Художник': 'Artist',
  'Дизайнер': 'Designer',
  'Маркетолог': 'Marketer',
  'Продюсер': 'Producer',
  'Геймдизайнер': 'Game Designer',
  'чеклист тестирования': 'testing checklist',
  'Быстрый старт': 'Quick Start',
  'СТУДИЯ РАБОТАЛА': 'STUDIO KEPT WORKING',
  'Сильный старт': 'Strong start',
  'Первое улучшение': 'First upgrade',
  'Ежедневный контракт': 'Daily Contract',
  'Открыть первое улучшение': 'Unlock your first upgrade',
  'Пусто': 'Nothing here yet',
  'Нет данных': 'No data yet',
  'Скоро': 'Coming soon',
  'Собрано': 'Collected',
  'Доступно': 'Available',
  'Награда': 'Reward',
  'Прогресс': 'Progress',
  'Цель': 'Goal',
  'Сложность': 'Difficulty',
  'Рынок': 'Market',
  'Спрос': 'Demand',
  'Хайп': 'Hype',
  'Настроение': 'Mood',
  'Рекомендация': 'Tip',
  'Подсказка': 'Hint'
};

const fragmentEnglish: Array<[string, string]> = [
  ['монет', 'coins'],
  ['очков науки', 'Research Points'],
  ['звёзд', 'Stars'],
  ['звезды', 'Stars'],
  ['дней', 'days'],
  ['дня', 'days'],
  ['день', 'day'],
  ['часов', 'hours'],
  ['часа', 'hours'],
  ['час', 'hour'],
  ['минут', 'minutes'],
  ['минуты', 'minutes'],
  ['минута', 'minute'],
  ['секунд', 'seconds'],
  ['секунды', 'seconds'],
  ['секунда', 'second'],
  ['игр', 'games'],
  ['игры', 'games'],
  ['игру', 'game'],
  ['релизов', 'releases'],
  ['релиза', 'releases'],
  ['релиз', 'release']
];

const attributeNames = ['placeholder', 'title', 'aria-label', 'alt'];
let installed = false;

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function keepPadding(source: string, value: string) {
  const start = source.match(/^\s*/)?.[0] ?? '';
  const end = source.match(/\s*$/)?.[0] ?? '';
  return start + value + end;
}

function getRawClientLanguage() {
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const telegramLanguage = telegramUser?.language_code || telegramUser?.languageCode;
  return telegramLanguage || navigator.languages?.[0] || navigator.language || 'en';
}

export function getGameLanguage(): GameLanguage {
  const language = getRawClientLanguage().toLowerCase();
  return language === 'ru' || language.startsWith('ru-') || language.startsWith('ru_') ? 'ru' : 'en';
}

function translateDuration(value: string) {
  return value
    .replace(/\bд\.\b/g, 'd')
    .replace(/\bч\.\b/g, 'h')
    .replace(/\bмин\.\b/g, 'min')
    .replace(/\bсек\.\b/g, 'sec')
    .replace(/дн\./g, 'd')
    .replace(/ч\./g, 'h')
    .replace(/мин\./g, 'min')
    .replace(/сек\./g, 'sec');
}

function translateReward(value: string) {
  let next = translateDuration(value);
  for (const [from, to] of fragmentEnglish) {
    next = next.split(from).join(to);
  }
  return next.replace(/\s+/g, ' ').trim();
}

function translateByPattern(value: string): string | null {
  let match = value.match(/^Активно ещё\s+(.+)$/);
  if (match) return 'Active for ' + translateDuration(match[1]);

  match = value.match(/^Активировать за ⭐\s*(\d+)$/);
  if (match) return 'Activate for ⭐' + match[1];

  match = value.match(/^Купить за ⭐\s*(\d+)$/);
  if (match) return 'Buy for ⭐' + match[1];

  match = value.match(/^Ускорить за\s+(.+)$/);
  if (match) return 'Speed up for ' + translateReward(match[1]);

  match = value.match(/^Забрать\s+(.+)$/);
  if (match) return 'Claim ' + translateReward(match[1]);

  match = value.match(/^Награда:\s+(.+)$/);
  if (match) return 'Reward: ' + translateReward(match[1]);

  match = value.match(/^Цена:\s+(.+)$/);
  if (match) return 'Price: ' + translateReward(match[1]);

  match = value.match(/^Стоимость:\s+(.+)$/);
  if (match) return 'Cost: ' + translateReward(match[1]);

  match = value.match(/^Уровень\s+(\d+)$/);
  if (match) return 'Level ' + match[1];

  match = value.match(/^Lvl:\s*(\d+)$/);
  if (match) return 'Lvl: ' + match[1];

  match = value.match(/^День\s+(\d+)$/);
  if (match) return 'Day ' + match[1];

  match = value.match(/^Г:\s*(\d+)\s+М:\s*(\d+)\s+Д:\s*(\d+)$/);
  if (match) return 'Y:' + match[1] + ' M:' + match[2] + ' D:' + match[3];

  match = value.match(/^Топ-(\d+)$/);
  if (match) return 'Top ' + match[1];

  match = value.match(/^([+−-]?\d[\d\s.,]*)\s*монет$/);
  if (match) return match[1].trim() + ' coins';

  match = value.match(/^([+−-]?\d[\d\s.,]*)\s*очков науки$/);
  if (match) return match[1].trim() + ' Research Points';

  match = value.match(/^(\d+)\s*сек\.?\s*\/\s*день$/);
  if (match) return match[1] + ' sec / day';

  if (/[А-Яа-яЁё]/.test(value)) {
    let next = translateReward(value);
    for (const [from, to] of Object.entries(exactEnglish)) {
      next = next.split(from).join(to);
    }
    return /[А-Яа-яЁё]/.test(next) || next === value ? null : next;
  }

  return null;
}

function translateText(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return value;

  const translated = exactEnglish[normalized] || translateByPattern(normalized);
  if (!translated || translated === normalized) return value;
  return keepPadding(value, translated);
}

function shouldSkipNode(node: Node) {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest('script, style, code, pre, textarea'));
}

function translateTextNode(node: Text) {
  if (shouldSkipNode(node)) return;
  const next = translateText(node.nodeValue || '');
  if (next !== node.nodeValue) node.nodeValue = next;
}

function translateElement(element: Element) {
  if (element.closest('script, style, code, pre, textarea')) return;

  for (const attr of attributeNames) {
    const value = element.getAttribute(attr);
    if (!value) continue;
    const translated = translateText(value);
    if (translated !== value) element.setAttribute(attr, translated);
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    translateTextNode(current as Text);
    current = walker.nextNode();
  }
}

function translateRoot() {
  if (!document.body) return;
  translateElement(document.body);
}

export function installGameLanguage() {
  const language = getGameLanguage();
  window.__DEVSTUDIO_LANGUAGE__ = language;
  document.documentElement.lang = language;
  document.documentElement.dataset.gameLanguage = language;

  if (language === 'ru' || installed) return;
  installed = true;

  const start = () => {
    translateRoot();

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        translateRoot();
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: attributeNames
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
