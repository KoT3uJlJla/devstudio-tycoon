import { genres, negativeMarketEvents, positiveMarketEvents, themes } from './gameData';
import type { AudienceState, GameState, MarketEvent, NewsEntry } from './types';
import { GAME_DAY_MS } from './gameLogic';

const GLOBAL_START_AT = Date.UTC(2026, 4, 18, 0, 0, 0);
const MARKET_EVENT_DURATION_DAYS = 14;
const DAYS_PER_MONTH = 30;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function seededIndex(seed: string | number, length: number, salt = 0) {
  if (length <= 0) return 0;
  const value = hashString(`${seed}:${salt}`);
  return value % length;
}

export function currentGlobalGameDay(now = Date.now()) {
  return Math.max(1, Math.floor((now - GLOBAL_START_AT) / GAME_DAY_MS) + 1);
}

export function globalDayStartAt(day: number) {
  return GLOBAL_START_AT + (Math.max(1, day) - 1) * GAME_DAY_MS;
}

function toneForCycle(cycle: number): 'positive' | 'negative' | null {
  if (cycle < 0) return null;
  const previous = cycle > 0 ? toneForCycle(cycle - 1) : null;
  if (previous === 'negative') return 'positive';
  const roll = seededIndex(cycle, 100, 41);
  if (roll < 16) return 'negative';
  if (roll < 42) return 'positive';
  return null;
}

export function globalMarketEventsForDay(day: number): MarketEvent[] {
  const cycle = Math.floor((Math.max(1, day) - 1) / MARKET_EVENT_DURATION_DAYS);
  const tone = toneForCycle(cycle);
  if (!tone) return [];
  const pool = tone === 'positive' ? positiveMarketEvents : negativeMarketEvents;
  const template = pool[seededIndex(cycle, pool.length, tone === 'positive' ? 71 : 97)];
  const startedDay = cycle * MARKET_EVENT_DURATION_DAYS + 1;
  return [{
    id: `global-${template.id}-${cycle}`,
    title: template.title,
    description: template.description,
    tone,
    daysRemaining: Math.max(1, MARKET_EVENT_DURATION_DAYS - ((day - 1) % MARKET_EVENT_DURATION_DAYS)),
    salesMultiplier: template.salesMultiplier,
    scoreModifier: template.scoreModifier,
    startedDay,
  }];
}

export function globalAudienceForDay(day: number, previous?: AudienceState): AudienceState {
  const month = Math.floor(Math.max(1, day) / DAYS_PER_MONTH);
  const desiredGenreId = genres[seededIndex(month, genres.length, 7)]?.id ?? 'arcade';
  const desiredThemeId = themes[seededIndex(month, themes.length, 19)]?.id ?? 'cyberpunk';
  const activeEvents = globalMarketEventsForDay(day);
  const eventMood = activeEvents.reduce((acc, event) => acc + (event.tone === 'positive' ? 0.08 : -0.1), 0);
  const baseMood = 0.54 + (seededIndex(month, 100, 133) - 50) / 500;
  const mood = clamp(baseMood + eventMood, 0.1, 1);
  const genreName = genres.find((item) => item.id === desiredGenreId)?.name ?? 'Аркада';
  const themeName = themes.find((item) => item.id === desiredThemeId)?.name ?? 'Киберпанк';
  const vibe = mood >= 0.75
    ? `Глобальная аудитория в хайпе: просит ${genreName} в сеттинге «${themeName}».`
    : mood >= 0.48
      ? `Глобальный спрос ровный: хотят ${genreName} + «${themeName}», но ждут качества.`
      : `Аудитория осторожна: ${genreName} + «${themeName}» может вернуть интерес, если релиз будет сильным.`;

  return {
    mood,
    desiredGenreId,
    desiredThemeId,
    vibe,
    lastUpdatedMonth: month,
    revealedUntilMonth: previous?.revealedUntilMonth ?? -1,
    learnedFrom: previous?.learnedFrom ?? [],
  };
}

export function globalNewsForDay(day: number, existing: NewsEntry[] = []): NewsEntry[] {
  const eventNews = globalMarketEventsForDay(day).map((event) => ({
    id: `news-${event.id}`,
    day: event.startedDay,
    title: event.title,
    body: `${event.description} Эффект действует для всех игроков ещё ${event.daysRemaining} игровых дней.`,
    tone: event.tone,
  } as NewsEntry));
  const byId = new Map<string, NewsEntry>();
  [...eventNews, ...existing].forEach((item) => byId.set(item.id, item));
  return [...byId.values()].slice(0, 8);
}

export function syncGlobalState<T extends GameState>(state: T, now = Date.now()): T {
  const globalDay = currentGlobalGameDay(now);
  const synced = {
    ...state,
    gameDay: globalDay,
    lastGameTickAt: globalDayStartAt(globalDay),
    activeMarketEvents: globalMarketEventsForDay(globalDay),
    audience: globalAudienceForDay(globalDay, state.audience),
    newsFeed: globalNewsForDay(globalDay, state.newsFeed),
  };
  return synced as T;
}
