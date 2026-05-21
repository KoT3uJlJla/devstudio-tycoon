import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const helperBlock = String.raw`
const ECONOMY_GAME_DAY_MS = 72_000;
const ECONOMY_DAYS_PER_MONTH = 30;
const ECONOMY_MIN_COINS = -50_000;
const ECONOMY_MARKET_EVENT_DURATION_DAYS = 14;
const MAX_ECONOMY_OFFLINE_DAYS = Number(process.env.ECONOMY_SERVER_MAX_OFFLINE_DAYS || 45);

const SERVER_GENRES = [
  ['arcade', 'Аркада'], ['platformer', 'Платформер'], ['rpg', 'РПГ'], ['strategy', 'Стратегия'], ['puzzle', 'Головоломка'],
  ['horror', 'Хоррор'], ['racing', 'Гонки'], ['fighting', 'Файтинг'], ['simulator', 'Симулятор'], ['visual-novel', 'Визуальная новелла'],
  ['roguelike', 'Рогалик'], ['deckbuilder', 'Колодострой'], ['survival', 'Survival'], ['metroidvania', 'Метроидвания'], ['sandbox', 'Песочница'],
  ['battle-royale', 'Королевская битва'], ['rhythm', 'Ритм-игра'], ['party', 'Вечериночная игра'], ['idle', 'Айдл'], ['tower-defense', 'Защита башни'],
  ['moba-lite', 'MOBA-lite'], ['city-builder', 'Градостроитель'], ['detective-game', 'Детективная'], ['sports-manager', 'Спорт-менеджер'], ['social-sim', 'Соц-сим'],
];
const SERVER_THEMES = [
  ['space', 'Космос'], ['fantasy', 'Фэнтези'], ['cyberpunk', 'Киберпанк'], ['school', 'Школа'], ['zombie', 'Зомби'],
  ['detective', 'Детектив'], ['medieval', 'Средневековье'], ['sport', 'Спорт'], ['postapoc', 'Постапокалипсис'], ['military', 'Военный'],
  ['mythology', 'Мифология'], ['underwater', 'Подводный мир'], ['pirates', 'Пираты'], ['kaiju', 'Кайдзю'], ['dreams', 'Сны'],
  ['office', 'Офис'], ['food', 'Еда'], ['music', 'Музыка'], ['ai-revolt', 'ИИ-бунт'], ['time-travel', 'Петля времени'],
];
const SERVER_POSITIVE_MARKET_EVENTS = [
  { id: 'creator-boom', title: 'Стримеры ищут свежие инди', description: 'Создатели контента поднимают органический интерес к релизам.', salesMultiplier: 1.18, scoreModifier: 0.05 },
  { id: 'retro-week', title: 'Неделя ностальгии', description: 'Игроки охотнее покупают яркие небольшие проекты.', salesMultiplier: 1.12, scoreModifier: 0.02 },
  { id: 'platform-festival', title: 'Фестиваль платформ', description: 'Магазины дают дополнительную видимость активным играм.', salesMultiplier: 1.22, scoreModifier: 0 },
];
const SERVER_NEGATIVE_MARKET_EVENTS = [
  { id: 'ad-prices-rise', title: 'Реклама подорожала', description: 'Продвижение и органика работают слабее обычного.', salesMultiplier: 0.86, scoreModifier: -0.02 },
  { id: 'genre-fatigue', title: 'Аудитория устала от клонов', description: 'Игроки строже реагируют на похожие релизы.', salesMultiplier: 0.9, scoreModifier: -0.08 },
  { id: 'store-chaos', title: 'Платформы меняют витрины', description: 'Часть релизов теряет видимость в магазинах.', salesMultiplier: 0.82, scoreModifier: 0 },
];

function serverStableHash(value) {
  const text = String(value || '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function serverRandom(day, salt, key = '') {
  let value = (day + 1) * 1103515245 + 12345 + salt * 2654435761 + serverStableHash(key);
  value ^= value >>> 16;
  value = Math.imul(value >>> 0, 2246822519);
  value ^= value >>> 13;
  return ((value >>> 0) % 1000000) / 1000000;
}
function serverSeededIndex(seed, length, salt = 0) {
  if (length <= 0) return 0;
  return Math.floor(serverRandom(seed, salt) * length) % length;
}
function serverLedgerEntry(day, title, amount, kind) {
  return { id: 'server-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8), day, title, amount, kind };
}
function serverNewsEntry(day, title, body, tone) {
  return { id: 'server-news-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8), day, title, body, tone };
}
function estimateServerWeeklyExpenses(data) {
  const level = safeInt(data?.level, 1, 4);
  const employees = safeArray(data?.employees);
  const activeGames = safeArray(data?.activeGames);
  const rent = 300 + level * 55 + Math.max(0, employees.length - 1) * 65;
  const team = employees.reduce((sum, employee) => {
    const cost = safeInt(employee?.cost, 0, 10000000);
    const employeeLevel = safeInt(employee?.level, 1, 99);
    const scorePremium = Math.max(0, Number(employee?.scoreBoost) || 0) * 8200;
    const sciencePremium = Math.max(0, Number(employee?.scienceBoost) || 0) * 1350;
    const tradeoffDiscount = Math.max(0, -(Number(employee?.speedBoost) || 0)) * 650;
    return sum + Math.round(cost * 0.045 + employeeLevel * 35 + scorePremium + sciencePremium - tradeoffDiscount);
  }, 0);
  const infrastructure = 80 + activeGames.length * 22 + (researchHas(data, 'engine-v2') ? 110 : 0) + (researchHas(data, 'ai-assist') ? 90 : 0);
  return Math.max(0, Math.round(rent + team + infrastructure));
}
function serverMarketSalesMultiplier(events) {
  return clampNumber(safeArray(events).reduce((acc, event) => acc * clampNumber(event?.salesMultiplier, 0.1, 5), 1), 0.45, 1.85);
}
function makeServerMarketEvent(day, tone) {
  const pool = tone === 'positive' ? SERVER_POSITIVE_MARKET_EVENTS : SERVER_NEGATIVE_MARKET_EVENTS;
  const template = pool[serverSeededIndex(day, pool.length, tone === 'positive' ? 31 : 47)] || pool[0];
  return {
    id: template.id + '-' + day + '-' + Math.floor(serverRandom(day, tone === 'positive' ? 311 : 477) * 999999).toString(16),
    title: template.title,
    description: template.description,
    tone,
    daysRemaining: ECONOMY_MARKET_EVENT_DURATION_DAYS,
    salesMultiplier: template.salesMultiplier,
    scoreModifier: template.scoreModifier,
    startedDay: day,
  };
}
function newsFromServerMarketEvent(event) {
  return serverNewsEntry(event.startedDay, event.title, event.description + ' Эффект продлится ' + ECONOMY_MARKET_EVENT_DURATION_DAYS + ' игровых дней.', event.tone);
}
function updateServerAudience(state, newMonth) {
  const recent = safeArray(state.releaseHistory).slice(-8);
  const top = [...recent].sort((a, b) => clampNumber(b?.score, 0, 10) - clampNumber(a?.score, 0, 10))[0];
  const genreTuple = SERVER_GENRES[serverSeededIndex(newMonth, SERVER_GENRES.length, 7)] || SERVER_GENRES[0];
  const themeTuple = SERVER_THEMES[serverSeededIndex(newMonth, SERVER_THEMES.length, 19)] || SERVER_THEMES[2];
  const avgScore = recent.length ? recent.reduce((sum, entry) => sum + clampNumber(entry?.score, 0, 10), 0) / recent.length : 6.4;
  const marketMood = safeArray(state.activeMarketEvents).reduce((sum, event) => sum + (event?.tone === 'positive' ? 0.03 : event?.tone === 'negative' ? -0.04 : 0), 0);
  const mood = clampNumber(0.31 + avgScore / 17 + marketMood + serverRandom(newMonth, 61) * 0.16 - 0.08, 0.1, 1);
  const genre = genreTuple[1];
  const theme = themeTuple[1];
  const vibe = mood >= 0.75
    ? 'Глобальная аудитория в хайпе: просит ' + genre + ' в сеттинге «' + theme + '» и активно спорит в чатах.'
    : mood >= 0.48
      ? 'Глобальный спрос ровный: хотят ' + genre + ' + «' + theme + '», но ждут качества.'
      : 'Глобальная аудитория устала от однотипных релизов: ' + genre + ' + «' + theme + '» может вернуть интерес.';
  const previousAudience = isPlainObject(state.audience) ? state.audience : {};
  const learnedFrom = top?.title
    ? [safeText(top.title, 'Релиз'), ...safeArray(previousAudience.learnedFrom).filter((item) => item !== top.title)].slice(0, 4)
    : safeArray(previousAudience.learnedFrom);
  return {
    mood,
    desiredGenreId: genreTuple[0],
    desiredThemeId: themeTuple[0],
    vibe,
    lastUpdatedMonth: newMonth,
    revealedUntilMonth: safeInt(previousAudience.revealedUntilMonth, -1, 999999),
    learnedFrom,
  };
}
function updateServerBankruptcyState(state, newMonth, oldMonth, ledger) {
  let employees = safeArray(state.employees);
  let unpaidSinceMonth = state.unpaidSinceMonth === null || state.unpaidSinceMonth === undefined ? null : safeInt(state.unpaidSinceMonth, 0, 999999);
  let closureWarningMonth = state.closureWarningMonth === null || state.closureWarningMonth === undefined ? null : safeInt(state.closureWarningMonth, 0, 999999);
  let bestScore = clampNumber(state.bestScore, 0, 10);
  let gamesReleased = safeInt(state.gamesReleased, 0, 999999999);
  let releaseHistory = safeArray(state.releaseHistory);
  let ratingResetCount = safeInt(state.ratingResetCount, 0, 999999);
  let activeGames = safeArray(state.activeGames);
  let newsFeed = safeArray(state.newsFeed);

  if (safeInt(state.coins, ECONOMY_MIN_COINS, Number.MAX_SAFE_INTEGER) >= 0) {
    return { ...state, unpaidSinceMonth: null, closureWarningMonth: null, employees, bestScore, gamesReleased, releaseHistory, ratingResetCount, activeGames, newsFeed, lastLedger: ledger };
  }

  if (unpaidSinceMonth === null) {
    unpaidSinceMonth = oldMonth;
    ledger.push(serverLedgerEntry(state.gameDay, 'Кассовый разрыв: зарплаты под угрозой', 0, 'event'));
  }

  if (employees.length > 0 && newMonth - unpaidSinceMonth >= 1) {
    employees = [];
    closureWarningMonth = newMonth;
    ledger.push(serverLedgerEntry(state.gameDay, 'Команда уволилась после месяца без зарплаты', 0, 'event'));
    newsFeed = [serverNewsEntry(state.gameDay, 'Команда покинула студию', 'Из-за долга сотрудники ушли. Есть один игровой месяц, чтобы выбраться из минуса до закрытия студии.', 'negative'), ...newsFeed].slice(0, 8);
  }

  if (closureWarningMonth !== null && newMonth - closureWarningMonth >= 1) {
    bestScore = 0;
    gamesReleased = 0;
    releaseHistory = [];
    activeGames = [];
    ratingResetCount += 1;
    closureWarningMonth = newMonth;
    ledger.push(serverLedgerEntry(state.gameDay, 'Студия закрыта: прогресс рейтинга обнулён', 0, 'event'));
    newsFeed = [serverNewsEntry(state.gameDay, 'Студия закрыта кредиторами', 'Рейтинг обнулён. Можно продолжать с долгом, но нужно восстановить баланс выше нуля.', 'negative'), ...newsFeed].slice(0, 8);
  }

  return { ...state, unpaidSinceMonth, closureWarningMonth, employees, bestScore, gamesReleased, releaseHistory, ratingResetCount, activeGames, newsFeed, lastLedger: ledger };
}
function advanceServerEconomyOneDay(state) {
  const day = safeInt(state.gameDay, 1, 999999999) + 1;
  let coins = safeInt(state.coins, ECONOMY_MIN_COINS, Number.MAX_SAFE_INTEGER);
  let dailyPassiveIncome = safeInt(state.dailyPassiveIncome, 0, Number.MAX_SAFE_INTEGER);
  let weeklyExpenseTotal = safeInt(state.weeklyExpenseTotal, 0, Number.MAX_SAFE_INTEGER);
  let activeGames = sanitizeActiveGames(state.activeGames).map((game) => ({ ...game }));
  let ledger = sanitizeLedger(state.lastLedger);
  let newsFeed = safeArray(state.newsFeed).filter(isPlainObject).slice(0, 8);
  let activeMarketEvents = sanitizeMarketEvents(state.activeMarketEvents)
    .map((event) => ({ ...event, daysRemaining: safeInt(event.daysRemaining, 0, 31) - 1 }))
    .filter((event) => event.daysRemaining > 0);
  let marketMustRecover = Boolean(state.marketMustRecover);

  const hasEventSlot = activeMarketEvents.length < 2;
  const eventChance = serverRandom(day, 101);
  if (hasEventSlot && marketMustRecover && eventChance < 0.032) {
    const event = makeServerMarketEvent(day, 'positive');
    activeMarketEvents = [event, ...activeMarketEvents];
    newsFeed = [newsFromServerMarketEvent(event), ...newsFeed].slice(0, 8);
    ledger.push(serverLedgerEntry(day, 'Глобальное событие: ' + event.title, 0, 'event'));
    marketMustRecover = false;
  } else if (hasEventSlot && !marketMustRecover && eventChance < 0.018) {
    const event = makeServerMarketEvent(day, 'positive');
    activeMarketEvents = [event, ...activeMarketEvents];
    newsFeed = [newsFromServerMarketEvent(event), ...newsFeed].slice(0, 8);
    ledger.push(serverLedgerEntry(day, 'Глобальное событие: ' + event.title, 0, 'event'));
  } else if (hasEventSlot && !marketMustRecover && eventChance > 0.982) {
    const event = makeServerMarketEvent(day, 'negative');
    activeMarketEvents = [event, ...activeMarketEvents];
    newsFeed = [newsFromServerMarketEvent(event), ...newsFeed].slice(0, 8);
    ledger.push(serverLedgerEntry(day, 'Глобальное событие: ' + event.title, 0, 'event'));
    marketMustRecover = true;
  }

  const marketLiveMultiplier = serverMarketSalesMultiplier(activeMarketEvents);
  activeGames = activeGames.map((game) => {
    if (game.lifeDaysRemaining <= 0) return game;
    const liveOps = researchHas(state, 'liveops-lite') ? 0.045 : 0;
    const producerSafety = researchHas(state, 'producer-calendar') && game.lifeDaysRemaining > game.maxLifeDays - 3 ? 0.035 : 0;
    const key = String(game.id || game.title || 'game');
    const randomDrift = serverRandom(day, 201, key) * 0.28 - 0.14 + (game.score >= 8.5 ? 0.01 : -0.012) + liveOps + producerSafety;
    const eventRoll = serverRandom(day, 303, key);
    let eventText = game.lastEvent;
    let eventBoost = 0;
    if (eventRoll < 0.065 + liveOps && game.score >= 7) {
      eventBoost = 0.2;
      eventText = 'Стримеры подняли хайп: популярность выросла.';
    } else if (eventRoll > 0.9 && !researchHas(state, 'producer-calendar')) {
      eventBoost = -0.22;
      eventText = 'Комьюнити устало: популярность просела.';
    } else if (eventRoll > 0.84 && game.score >= 8.8) {
      eventBoost = 0.14;
      eventText = 'Фан-арты пошли в чаты: плюс органика.';
    }
    const popularity = Number(clampNumber(game.popularity + randomDrift + eventBoost, 0.14, 2.6).toFixed(2));
    const earned = Math.max(0, Math.round(safeInt(game.baseDailyIncome, 0, 1000000) * popularity * marketLiveMultiplier));
    coins = Math.min(Number.MAX_SAFE_INTEGER, Math.max(ECONOMY_MIN_COINS, coins + earned));
    dailyPassiveIncome += earned;
    return {
      ...game,
      popularity,
      totalEarned: safeInt(game.totalEarned, 0, Number.MAX_SAFE_INTEGER) + earned,
      lifeDaysRemaining: Math.max(0, safeInt(game.lifeDaysRemaining, 0, 30) - 1),
      lastEvent: eventText,
    };
  }).filter((game) => game.lifeDaysRemaining > 0);

  if (day % 7 === 0) {
    const expenses = estimateServerWeeklyExpenses({ ...state, gameDay: day, activeGames, coins, activeMarketEvents, newsFeed });
    coins = Math.min(Number.MAX_SAFE_INTEGER, Math.max(ECONOMY_MIN_COINS, coins - expenses));
    weeklyExpenseTotal = expenses;
    ledger.push(serverLedgerEntry(day, 'Аренда + команда + инфраструктура', -expenses, 'expense'));
  }

  const newMonth = Math.floor(day / ECONOMY_DAYS_PER_MONTH);
  const oldMonth = Math.floor(safeInt(state.gameDay, 1, 999999999) / ECONOMY_DAYS_PER_MONTH);
  const audience = newMonth !== oldMonth ? updateServerAudience({ ...state, activeGames, coins, newsFeed, activeMarketEvents }, newMonth) : state.audience;

  let next = {
    ...state,
    coins,
    gameDay: day,
    activeGames,
    activeMarketEvents,
    marketMustRecover,
    newsFeed,
    audience,
    dailyPassiveIncome,
    weeklyExpenseTotal,
    lastLedger: ledger.slice(-10),
  };

  if (newMonth !== oldMonth || next.coins < 0) {
    next = updateServerBankruptcyState(next, newMonth, oldMonth, [...next.lastLedger]);
  }

  return { ...next, lastLedger: safeArray(next.lastLedger).slice(-10), newsFeed: safeArray(next.newsFeed).slice(0, 8) };
}
function advanceServerEconomy(data) {
  if (!isPlainObject(data)) return data;
  const lastGameTickAt = Number(data.lastGameTickAt) || Date.now();
  const elapsed = Math.max(0, Date.now() - lastGameTickAt);
  const days = Math.min(MAX_ECONOMY_OFFLINE_DAYS, Math.floor(elapsed / ECONOMY_GAME_DAY_MS));
  if (days <= 0) return data;

  let next = data;
  for (let index = 0; index < days; index += 1) {
    next = advanceServerEconomyOneDay(next);
  }

  return {
    ...next,
    lastGameTickAt: lastGameTickAt + days * ECONOMY_GAME_DAY_MS,
    lastSavedAt: Date.now(),
  };
}
`;

function patchDevAuthorityForEconomyClock() {
  const filePath = join(dirname(fileURLToPath(import.meta.url)), 'devAuthority.js');
  let source = '';
  try {
    source = readFileSync(filePath, 'utf8');
  } catch {
    return;
  }
  let next = source;

  if (!next.includes('function advanceServerEconomy')) {
    next = next.replace('export function normalizeServerDevelopment', helperBlock + '\nexport function normalizeServerDevelopment');
  }

  if (!next.includes('const economyAdvancedData = advanceServerEconomy(data);')) {
    next = next.replace(
      'export function normalizeServerDevelopment(data, previousData = null) {\n  if (!isPlainObject(data)) return data;\n  const baseData = sanitizePersistentCollections(data);',
      'export function normalizeServerDevelopment(data, previousData = null) {\n  if (!isPlainObject(data)) return data;\n  const economyAdvancedData = advanceServerEconomy(data);\n  const baseData = sanitizePersistentCollections(economyAdvancedData);',
    );
  }

  next = next.replace(
    "tone: ['boom', 'risk', 'neutral'].includes(event.tone) ? event.tone : 'neutral',",
    "tone: ['positive', 'negative', 'boom', 'risk', 'neutral'].includes(event.tone) ? event.tone : 'neutral',",
  );

  try {
    writeFileSync(filePath, next);
  } catch (error) {
    console.warn('economy-clock-hardening: failed to patch devAuthority.js', error?.message || error);
  }
}

patchDevAuthorityForEconomyClock();
