import { baseGenreIds, baseThemeIds, comboMatrix, critics, developmentEventScenarios, gameNameParts, genres, negativeMarketEvents, platforms, positiveMarketEvents, themes } from './gameData';
import type { AudienceState, ComboQuality, DevEventChoice, Focus, FocusTriple, GameState, GenreId, LedgerEntry, MarketEvent, NewsEntry, PhaseId, PlatformId, Project, ReleaseResult, ReleasedGame, ScoreBreakdownItem, ScheduledDevEvent, ThemeId } from './types';

// Сутки замедлены ещё в 2 раза после v0.6.3: 1 игровой день = 72 секунды реального времени.
export const GAME_DAY_MS = 72_000;
const DAYS_PER_MONTH = 30;
const MIN_COINS = -50_000;
const MARKET_EVENT_DURATION_DAYS = 14;
export const studioUpgradeCosts: Record<number, number> = { 2: 12_000, 3: 320_000, 4: 2_200_000 };
const defaultFocus: Focus = {
  pre: [34, 33, 33],
  production: [33, 34, 33],
  post: [33, 33, 34],
};

export const phaseLabels: Record<PhaseId, string[]> = {
  pre: ['Технологии', 'Геймплей', 'Сюжет'],
  production: ['Диалоги', 'Уровни', 'ИИ'],
  post: ['Мир', 'Визуал', 'Звук'],
};

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function nowId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneFocus(): Focus {
  return {
    pre: [...defaultFocus.pre] as FocusTriple,
    production: [...defaultFocus.production] as FocusTriple,
    post: [...defaultFocus.post] as FocusTriple,
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function employeeSlotsForLevel(level: number) {
  if (level >= 4) return 11;
  if (level >= 3) return 7;
  if (level >= 2) return 3;
  return 0;
}

export function nextStudioUpgradeCost(level: number) {
  return studioUpgradeCosts[level + 1] ?? null;
}

function canSpend(coins: number, amount: number) {
  return coins - amount >= MIN_COINS;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeTriple(values: FocusTriple): FocusTriple {
  const safe = values.map((value) => clamp(Math.round(Number(value) || 0), 0, 100)) as FocusTriple;
  const total = safe.reduce((acc, item) => acc + item, 0) || 1;
  const a = Math.round((safe[0] / total) * 100);
  const b = Math.round((safe[1] / total) * 100);
  return [a, b, 100 - a - b];
}

function addTriples(base: FocusTriple, bias?: FocusTriple): FocusTriple {
  if (!bias) return normalizeTriple(base);
  return normalizeTriple([base[0] + bias[0], base[1] + bias[1], base[2] + bias[2]]);
}

const FORBIDDEN_NAME_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy',
  'хуй', 'хуе', 'хуё', 'пизд', 'пзд', 'еба', 'ёба', 'ебл', 'ёбл', 'бля', 'бляд', 'сука', 'мраз', 'гандон', 'пидор', 'педик', 'уеб', 'уёб',
];

function censorForbiddenWords(value: string) {
  return value.split(/(\s+)/).map((part) => {
    const compact = part.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
    const forbidden = FORBIDDEN_NAME_WORDS.some((word) => compact.includes(word));
    if (!forbidden || part.length <= 2) return part;
    const letters = Array.from(part);
    return letters.map((char, index) => {
      if (/\s/.test(char)) return char;
      return index === 0 || index === letters.length - 1 ? char : '*';
    }).join('');
  }).join('');
}

export function sanitizeProjectName(value: string) {
  const safe = value.replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 28);
  return censorForbiddenWords(safe) || 'Безымянный проект';
}

export function sanitizeStudioName(value: string) {
  const safe = value.replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18);
  return censorForbiddenWords(safe);
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function defaultAudience(): AudienceState {
  return {
    mood: 0.66,
    desiredGenreId: 'arcade',
    desiredThemeId: 'cyberpunk',
    vibe: 'Ждут быстрые, яркие игры с понятным вау-моментом.',
    lastUpdatedMonth: 0,
    revealedUntilMonth: -1,
    learnedFrom: [],
  };
}

export const initialState: GameState = {
  coins: 3000,
  rp: 0,
  stars: 0,
  qualifiedReferrals: 0,
  qualifiedSecondLevelReferrals: 0,
  referralMilestoneClaims: {},
  studioName: '',
  level: 1,
  studioXp: 0,
  gamesReleased: 0,
  bestScore: 0,
  screen: 'develop',
  onboardingDone: false,
  tutorialDone: false,
  tutorialStep: 0,
  tutorialRewardClaimed: false,
  lastSavedAt: Date.now(),
  lastGameTickAt: Date.now(),
  gameDay: 1,
  lastOfflineReward: 0,
  selectedProject: null,
  latestRelease: null,
  activeGames: [],
  releaseHistory: [],
  employees: [],
  hiredEmployeeIds: [],
  unlockedResearchIds: [],
  unlockedGenreIds: baseGenreIds,
  unlockedThemeIds: baseThemeIds,
  dailyClaimedAt: null,
  dailyStatsDate: todayKey(),
  dailyGamesReleased: 0,
  dailyWorkTaps: 0,
  dailyResearchUnlocked: 0,
  dailyPassiveIncome: 0,
  dailyTaskClaims: {},
  weeklyExpenseTotal: 0,
  unpaidSinceMonth: null,
  closureWarningMonth: null,
  ratingResetCount: 0,
  activeMarketEvents: [],
  newsFeed: [{ id: 'launch-news', day: 1, title: 'Инди-рынок открыт', body: 'Игроки ищут свежие идеи. Следи за сводками: рынок может резко помогать или мешать релизам.', tone: 'neutral' }],
  audience: defaultAudience(),
  lastLedger: [],
  marketMustRecover: false,
  offerSeen: false,
};

export function ensureDailyState(state: GameState): GameState {
  const key = todayKey();
  if (state.dailyStatsDate === key) return state;
  return {
    ...state,
    dailyStatsDate: key,
    dailyGamesReleased: 0,
    dailyWorkTaps: 0,
    dailyResearchUnlocked: 0,
    dailyPassiveIncome: 0,
    dailyTaskClaims: {},
  };
}

function normalizeProject(project: Partial<Project> | null | undefined): Project | null {
  if (!project) return null;
  const genre = project.genre && genres.some((item) => item.id === project.genre) ? project.genre : null;
  const theme = project.theme && themes.some((item) => item.id === project.theme) ? project.theme : null;
  const platform = project.platform && platforms.some((item) => item.id === project.platform) ? project.platform : 'micro_pc';
  return {
    id: String(project.id || nowId()),
    name: sanitizeProjectName(String(project.name || 'Безымянный проект')),
    genre,
    theme,
    platform,
    focus: {
      pre: normalizeTriple(project.focus?.pre ?? defaultFocus.pre),
      production: normalizeTriple(project.focus?.production ?? defaultFocus.production),
      post: normalizeTriple(project.focus?.post ?? defaultFocus.post),
    },
    progress: clamp(Number(project.progress) || 0, 0, 100),
    durationSeconds: clamp(Number(project.durationSeconds) || 180, 20, 900),
    devCost: Math.max(0, Math.floor(Number(project.devCost) || 0)),
    techComplexity: clamp(Number(project.techComplexity) || 1, 0.5, 5),
    startedAt: project.startedAt ? Number(project.startedAt) : null,
    isTutorial: Boolean(project.isTutorial),
    promotionUsed: Boolean(project.promotionUsed),
    promotionBoost: clamp(Number(project.promotionBoost) || 0, 0, 1.2),
    devGlitchTriggered: Boolean(project.devGlitchTriggered),
    devEventId: typeof project.devEventId === 'string' ? project.devEventId.slice(0, 64) : undefined,
    devEventText: typeof project.devEventText === 'string' ? project.devEventText.slice(0, 40) : undefined,
    devEventTone: project.devEventTone === 'danger' ? 'danger' : project.devEventText ? 'normal' : undefined,
    devEventAt: Math.max(0, Number(project.devEventAt) || 0),
    devEventQueue: safeArray<ScheduledDevEvent>(project.devEventQueue).map((item) => ({
      instanceId: String(item.instanceId || nowId()).slice(0, 64),
      scenarioId: String(item.scenarioId || '').slice(0, 64),
      progressAt: clamp(Number(item.progressAt) || 50, 5, 96),
      triggered: Boolean(item.triggered),
    })).filter((item) => developmentEventScenarios.some((scenario) => scenario.id === item.scenarioId)).slice(0, 3),
    pendingDevEvent: project.pendingDevEvent && developmentEventScenarios.some((scenario) => scenario.id === project.pendingDevEvent?.scenarioId) ? {
      instanceId: String(project.pendingDevEvent.instanceId || nowId()).slice(0, 64),
      scenarioId: String(project.pendingDevEvent.scenarioId).slice(0, 64),
      triggeredAtProgress: clamp(Number(project.pendingDevEvent.triggeredAtProgress) || Number(project.progress) || 0, 0, 100),
    } : null,
    devDecisionScoreBonus: clamp(Number(project.devDecisionScoreBonus) || 0, -2, 2),
    devDecisionSalesMultiplier: clamp(Number(project.devDecisionSalesMultiplier) || 1, 0.55, 1.85),
    devDecisionLog: safeArray<string>(project.devDecisionLog).map((item) => String(item).slice(0, 120)).slice(-4),
  };
}

function normalizeAudience(value: unknown, stateMonth: number): AudienceState {
  const raw = value && typeof value === 'object' ? value as Partial<AudienceState> : {};
  const genre = raw.desiredGenreId && genres.some((item) => item.id === raw.desiredGenreId) ? raw.desiredGenreId : 'arcade';
  const theme = raw.desiredThemeId && themes.some((item) => item.id === raw.desiredThemeId) ? raw.desiredThemeId : 'cyberpunk';
  return {
    mood: clamp(Number.isFinite(Number(raw.mood)) ? Number(raw.mood) : 0.66, 0.1, 1),
    desiredGenreId: genre,
    desiredThemeId: theme,
    vibe: String(raw.vibe || 'Ждут быстрые, яркие игры с понятным вау-моментом.').slice(0, 120),
    lastUpdatedMonth: Math.max(0, Math.floor(Number.isFinite(Number(raw.lastUpdatedMonth)) ? Number(raw.lastUpdatedMonth) : stateMonth)),
    revealedUntilMonth: Math.floor(Number.isFinite(Number(raw.revealedUntilMonth)) ? Number(raw.revealedUntilMonth) : -1),
    learnedFrom: safeArray<string>(raw.learnedFrom).slice(0, 4).map((item) => String(item).slice(0, 32)),
  };
}


function normalizeMarketEvent(value: Partial<MarketEvent>): MarketEvent | null {
  if (!value.id || !value.title) return null;
  return {
    id: String(value.id).slice(0, 64),
    title: String(value.title).slice(0, 80),
    description: String(value.description || '').slice(0, 180),
    tone: value.tone === 'negative' ? 'negative' : 'positive',
    daysRemaining: clamp(Math.floor(Number(value.daysRemaining) || 0), 0, MARKET_EVENT_DURATION_DAYS),
    salesMultiplier: clamp(Number(value.salesMultiplier) || 1, 0.5, 1.6),
    scoreModifier: clamp(Number(value.scoreModifier) || 0, -1, 1),
    startedDay: Math.max(1, Math.floor(Number(value.startedDay) || 1)),
  };
}

function normalizeNewsEntry(value: Partial<NewsEntry>): NewsEntry | null {
  if (!value.id || !value.title) return null;
  return {
    id: String(value.id).slice(0, 64),
    day: Math.max(1, Math.floor(Number(value.day) || 1)),
    title: String(value.title).slice(0, 80),
    body: String(value.body || '').slice(0, 220),
    tone: value.tone === 'positive' || value.tone === 'negative' ? value.tone : 'neutral',
  };
}

function normalizeReleasedGame(value: Partial<ReleasedGame>): ReleasedGame | null {
  if (!value.id || !value.genre || !value.theme) return null;
  if (!genres.some((item) => item.id === value.genre) || !themes.some((item) => item.id === value.theme)) return null;
  return {
    id: String(value.id).slice(0, 64),
    title: sanitizeProjectName(String(value.title || 'Выпущенная игра')),
    genre: value.genre,
    theme: value.theme,
    score: clamp(Number(value.score) || 1, 1, 10),
    popularity: clamp(Number(value.popularity) || 1, 0.15, 3),
    baseDailyIncome: Math.max(0, Math.floor(Number(value.baseDailyIncome) || 0)),
    lifeDaysRemaining: clamp(Math.floor(Number(value.lifeDaysRemaining) || 0), 0, 30),
    maxLifeDays: clamp(Math.floor(Number(value.maxLifeDays) || 5), 5, 30),
    totalEarned: Math.max(0, Math.floor(Number(value.totalEarned) || 0)),
    lastEvent: String(value.lastEvent || 'Релиз свежий').slice(0, 80),
    createdGameDay: Math.max(1, Math.floor(Number(value.createdGameDay) || 1)),
  };
}

const COMBO_QUALITY_VALUES: ComboQuality[] = ['Great', 'Good', 'Neutral', 'Bad'];
const BREAKDOWN_KINDS = ['base', 'bonus', 'penalty', 'random'] as const;

function normalizeReleaseResult(value: unknown): ReleaseResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Partial<ReleaseResult> & Record<string, unknown>;
  const score = clamp(Number(raw.score) || 1, 1, 10);
  const combo: ComboQuality = COMBO_QUALITY_VALUES.includes(raw.combo as ComboQuality)
    ? (raw.combo as ComboQuality)
    : 'Neutral';
  const critics = safeArray<{ name: string; score: number; quote: string }>(raw.critics)
    .slice(0, 10)
    .map((c) => ({
      name: String(c.name || '').slice(0, 64),
      score: clamp(Number(c.score) || score, 1, 10),
      quote: String(c.quote || '').slice(0, 200),
    }));
  const scoreBreakdown = safeArray<ScoreBreakdownItem>(raw.scoreBreakdown)
    .slice(0, 20)
    .map((item) => ({
      label: String(item.label || '').slice(0, 80),
      value: Number(item.value) || 0,
      kind: (BREAKDOWN_KINDS as readonly string[]).includes(item.kind)
        ? (item.kind as ScoreBreakdownItem['kind'])
        : ('base' as const),
    }));
  return {
    projectName: sanitizeProjectName(String(raw.projectName || 'Без названия')),
    score,
    critics,
    criticAverage: clamp(Number(raw.criticAverage) || score, 1, 10),
    scoreBreakdown,
    sales: Math.max(0, Math.floor(Number(raw.sales) || 0)),
    passivePerDay: Math.max(0, Math.floor(Number(raw.passivePerDay) || 0)),
    lifetimeDays: clamp(Math.floor(Number(raw.lifetimeDays) || 5), 1, 30),
    rp: Math.max(0, Math.floor(Number(raw.rp) || 0)),
    stars: Math.max(0, Math.floor(Number(raw.stars) || 0)),
    bonusRewards: safeArray<string>(raw.bonusRewards).slice(0, 10).map((item) => String(item).slice(0, 120)),
    promotionBoost: clamp(Number(raw.promotionBoost) || 0, 0, 1.2),
    qualityLabel: String(raw.qualityLabel || '').slice(0, 40),
    combo,
    createdAt: Number(raw.createdAt) || Date.now(),
  };
}

export function normalizeState(partial?: Partial<GameState>): GameState {
  const merged = { ...initialState, ...(partial ?? {}) } as GameState;
  const gameDay = Math.max(1, Math.floor(Number(merged.gameDay) || 1));
  const unlockedGenreIds = safeArray<GenreId>(merged.unlockedGenreIds);
  const unlockedThemeIds = safeArray<ThemeId>(merged.unlockedThemeIds);
  const unlockedResearchIds = safeArray<string>(merged.unlockedResearchIds).filter((id) => typeof id === 'string').slice(0, 100);
  const selectedProject = normalizeProject(merged.selectedProject);
  const activeGames = safeArray<Partial<ReleasedGame>>(merged.activeGames).map(normalizeReleasedGame).filter(Boolean) as ReleasedGame[];
  const releaseHistory = safeArray<any>(merged.releaseHistory).slice(-16).map((item) => ({
    title: sanitizeProjectName(String(item.title || 'Игра')),
    genre: genres.some((genre) => genre.id === item.genre) ? item.genre : 'arcade',
    theme: themes.some((theme) => theme.id === item.theme) ? item.theme : 'cyberpunk',
    score: clamp(Number(item.score) || 1, 1, 10),
    day: Math.max(1, Math.floor(Number(item.day) || 1)),
  }));

  return ensureDailyState({
    ...initialState,
    ...merged,
    coins: clamp(Math.floor(Number.isFinite(Number(merged.coins)) ? Number(merged.coins) : initialState.coins), MIN_COINS, Number.MAX_SAFE_INTEGER),
    rp: Math.max(0, Math.floor(Number(merged.rp) || 0)),
    stars: clamp(Math.max(0, Math.floor(Number(merged.stars) || 0)), 0, 9_999_999),
    qualifiedReferrals: Math.max(0, Math.floor(Number(merged.qualifiedReferrals) || 0)),
    qualifiedSecondLevelReferrals: Math.max(0, Math.floor(Number(merged.qualifiedSecondLevelReferrals) || 0)),
    referralMilestoneClaims: (() => {
      const raw = (merged as unknown as { referralMilestoneClaims?: unknown }).referralMilestoneClaims;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
      return Object.fromEntries(Object.entries(raw as Record<string, unknown>).slice(0, 16).map(([key, value]) => [String(key).slice(0, 32), Boolean(value)]));
    })(),
    studioName: merged.studioName === undefined ? 'Моя студия' : sanitizeStudioName(String(merged.studioName ?? '')),
    level: clamp(Math.floor(Number(merged.level) || 1), 1, 4),
    studioXp: clamp(Math.floor(Number(merged.studioXp) || 0), 0, 999_999),
    gamesReleased: Math.max(0, Math.floor(Number(merged.gamesReleased) || 0)),
    bestScore: clamp(Number(merged.bestScore) || 0, 0, 10),
    selectedProject,
    latestRelease: merged.latestRelease ? normalizeReleaseResult(merged.latestRelease) : null,
    activeGames,
    releaseHistory,
    employees: safeArray<any>(merged.employees).slice(0, employeeSlotsForLevel(clamp(Math.floor(Number(merged.level) || 1), 1, 4))),
    hiredEmployeeIds: safeArray<string>(merged.hiredEmployeeIds).filter((id) => typeof id === 'string'),
    unlockedResearchIds,
    unlockedGenreIds: Array.from(new Set([...baseGenreIds, ...unlockedGenreIds.filter((id) => genres.some((genre) => genre.id === id))])),
    unlockedThemeIds: Array.from(new Set([...baseThemeIds, ...unlockedThemeIds.filter((id) => themes.some((theme) => theme.id === id))])),
    dailyTaskClaims: (() => {
      const raw = merged.dailyTaskClaims;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
      return Object.fromEntries(
        Object.entries(raw as Record<string, unknown>)
          .slice(0, 32)
          .map(([k, v]) => [String(k).slice(0, 64), Boolean(v)]),
      );
    })(),
    dailyPassiveIncome: Math.max(0, Math.floor(Number(merged.dailyPassiveIncome) || 0)),
    weeklyExpenseTotal: Math.max(0, Math.floor(Number(merged.weeklyExpenseTotal) || 0)),
    unpaidSinceMonth: merged.unpaidSinceMonth === null || merged.unpaidSinceMonth === undefined ? null : Math.max(0, Math.floor(Number(merged.unpaidSinceMonth) || 0)),
    closureWarningMonth: merged.closureWarningMonth === null || merged.closureWarningMonth === undefined ? null : Math.max(0, Math.floor(Number(merged.closureWarningMonth) || 0)),
    ratingResetCount: Math.max(0, Math.floor(Number(merged.ratingResetCount) || 0)),
    activeMarketEvents: safeArray<Partial<MarketEvent>>(merged.activeMarketEvents).map(normalizeMarketEvent).filter(Boolean).filter((event) => (event as MarketEvent).daysRemaining > 0).slice(0, 3) as MarketEvent[],
    marketMustRecover: Boolean(merged.marketMustRecover),
    newsFeed: safeArray<Partial<NewsEntry>>(merged.newsFeed).map(normalizeNewsEntry).filter(Boolean).slice(-8) as NewsEntry[],
    gameDay,
    audience: normalizeAudience(merged.audience, Math.floor(gameDay / DAYS_PER_MONTH)),
    lastLedger: safeArray<LedgerEntry>(merged.lastLedger).slice(-10),
    lastSavedAt: Number(merged.lastSavedAt) || Date.now(),
    lastGameTickAt: Number(merged.lastGameTickAt) || Date.now(),
  });
}

export function createProject(isTutorial: boolean, overrides?: Partial<Project>): Project {
  const prefix = gameNameParts.prefix[Math.floor(Math.random() * gameNameParts.prefix.length)];
  const suffix = gameNameParts.suffix[Math.floor(Math.random() * gameNameParts.suffix.length)];
  return {
    id: nowId(),
    name: `${prefix} ${suffix}`,
    genre: null,
    theme: null,
    platform: 'micro_pc',
    focus: cloneFocus(),
    progress: 0,
    durationSeconds: isTutorial ? 30 : 180,
    devCost: 0,
    techComplexity: 1,
    startedAt: null,
    isTutorial,
    promotionUsed: false,
    promotionBoost: 0,
    devGlitchTriggered: false,
    devEventQueue: [],
    pendingDevEvent: null,
    devDecisionScoreBonus: 0,
    devDecisionSalesMultiplier: 1,
    devDecisionLog: [],
    ...overrides,
  };
}

export function comboFor(genre: GenreId, theme: ThemeId): ComboQuality {
  return comboMatrix[`${genre}:${theme}`] ?? 'Neutral';
}

export function comboMultiplier(combo: ComboQuality) {
  if (combo === 'Great') return 1.27;
  if (combo === 'Good') return 1.11;
  if (combo === 'Bad') return 0.76;
  return 1;
}


function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function focusVariance(genreId: GenreId, themeId: ThemeId, phase: PhaseId): FocusTriple {
  const seed = hashString(`${genreId}:${themeId}:${phase}`);
  const first = ((seed % 17) - 8);
  const second = (((Math.floor(seed / 17)) % 15) - 7);
  const third = -first - second;
  return [first, second, third];
}

export function getRecommendedFocus(genreId: GenreId | null, themeId: ThemeId | null): Focus {
  const genre = genres.find((item) => item.id === genreId) ?? genres[0];
  const theme = themes.find((item) => item.id === themeId);
  return {
    pre: addTriples(addTriples(genre.ideal.pre, theme?.focusBias.pre), focusVariance(genre.id, theme?.id ?? 'base', 'pre')),
    production: addTriples(addTriples(genre.ideal.production, theme?.focusBias.production), focusVariance(genre.id, theme?.id ?? 'base', 'production')),
    post: addTriples(addTriples(genre.ideal.post, theme?.focusBias.post), focusVariance(genre.id, theme?.id ?? 'base', 'post')),
  };
}

export function projectInsight(project: Project | null) {
  if (!project?.genre || !project.theme) return null;
  const genre = genres.find((item) => item.id === project.genre);
  const theme = themes.find((item) => item.id === project.theme);
  if (!genre || !theme) return null;
  const combo = comboFor(genre.id, theme.id);
  return {
    combo,
    recommendedFocus: getRecommendedFocus(genre.id, theme.id),
    note: `${genre.name} требует ${genre.difficulty >= 1.25 ? 'дорогого продакшена' : genre.difficulty <= 0.9 ? 'лёгкого цикла' : 'сбалансированного цикла'}, а сеттинг «${theme.name}» добавляет собственный рыночный перекос. Подсказка вариативна для каждой пары жанра и сеттинга.`,
  };
}

function focusFit(project: Project) {
  if (!project.genre || !project.theme) return 0.65;
  const recommended = getRecommendedFocus(project.genre, project.theme);
  const phases = ['pre', 'production', 'post'] as const;
  const phaseWeights: Record<PhaseId, number> = { pre: 1.05, production: 1.15, post: 1 };
  const totalWeight = phases.reduce((sum, phase) => sum + phaseWeights[phase], 0);
  const score = phases.reduce((acc, phase) => {
    const ideal = recommended[phase];
    const actual = project.focus[phase];
    const weightedDistance = Math.abs(ideal[0] - actual[0]) * 1.05 + Math.abs(ideal[1] - actual[1]) * 1.1 + Math.abs(ideal[2] - actual[2]) * 1;
    const phaseScore = clamp(1 - Math.pow(weightedDistance / 128, 1.18), 0.18, 1);
    return acc + phaseScore * phaseWeights[phase];
  }, 0);
  return score / totalWeight;
}

function researchHas(state: GameState, id: string) {
  return state.unlockedResearchIds.includes(id);
}

export function studioMomentumRatio(state: GameState) {
  return clamp((Number(state.studioXp) || 0) / 1200, 0, 1);
}

export function momentumSpeedMultiplier(state: GameState) {
  return Number((1 + studioMomentumRatio(state) * 0.25).toFixed(3));
}

export function momentumScoreBonus(state: GameState) {
  return Number((studioMomentumRatio(state) * 0.2).toFixed(3));
}

export function momentumRevenueMultiplier(state: GameState) {
  return Number((1 + studioMomentumRatio(state) * 0.1).toFixed(3));
}

export function releaseVelocityBoost(state: GameState) {
  return Math.min(0.32, Math.log1p(Math.max(0, state.gamesReleased)) * 0.045);
}

export function studioLevelSpeedBoost(state: GameState) {
  return Math.max(0, state.level - 1) * 0.07;
}

export function employeeScoreBonus(state: GameState) {
  return Number(clamp(state.employees.reduce((acc, employee) => acc + (employee.scoreBoost ?? 0), 0), -0.35, 0.9).toFixed(3));
}

export function scienceMultiplier(state: GameState) {
  const employeeBoost = state.employees.reduce((acc, employee) => acc + (employee.scienceBoost ?? 0), 0);
  return clamp(1 + employeeBoost, 0.75, 2.2);
}

export function speedMultiplier(state: GameState) {
  const employeeBoost = state.employees.reduce((acc, employee) => acc + employee.speedBoost, 0);
  const researchBoost = (researchHas(state, 'fast-prototype') ? 0.1 : 0) + (researchHas(state, 'engine-v2') ? 0.15 : 0) + (researchHas(state, 'ai-assist') ? 0.12 : 0);
  const synergy = researchHas(state, 'team-synergy') ? state.employees.length * 0.025 : 0;
  const releaseBoost = releaseVelocityBoost(state);
  const levelBoost = studioLevelSpeedBoost(state);
  return clamp((1 + employeeBoost + researchBoost + synergy + releaseBoost + levelBoost) * momentumSpeedMultiplier(state), 0.55, 3.75);
}

export function incomeMultiplier(state: GameState) {
  const employeeBoost = state.employees.reduce((acc, employee) => acc + employee.incomeBoost, 0);
  const researchBoost =
    (researchHas(state, 'pixel-polish') ? 0.05 : 0) +
    (researchHas(state, 'community-posts') ? 0.07 : 0) +
    (researchHas(state, 'micro-influencers') ? 0.1 : 0) +
    (researchHas(state, 'service-model') ? 0.08 : 0);
  return clamp(1 + employeeBoost + researchBoost, 0.55, 4.5);
}

export function devCostMultiplier(state: GameState) {
  return (researchHas(state, 'budget-ops') ? 0.9 : 1) * (researchHas(state, 'reusable-tech') ? 0.92 : 1);
}

export function estimateProjectDuration(project: Project, state: GameState) {
  if (project.isTutorial) return 30;
  const genre = genres.find((item) => item.id === project.genre);
  const platform = platforms.find((item) => item.id === project.platform) ?? platforms[0];
  const difficulty = genre?.difficulty ?? 1;
  const seconds = 130 + difficulty * 52 + platform.techComplexity * 28;
  return Math.round(clamp(seconds, 120, 420));
}

export function estimateDevelopmentCost(project: Project, state: GameState) {
  if (project.isTutorial) return 0;
  const genre = genres.find((item) => item.id === project.genre);
  const platform = platforms.find((item) => item.id === project.platform) ?? platforms[0];
  const duration = estimateProjectDuration(project, state);
  const techResearchCount = ['engine-v2', 'sound-lab', 'liveops-lite', 'ai-assist', 'data-warehouse'].filter((id) => researchHas(state, id)).length;
  const raw = 360 + (duration / 10) * 28 + (genre?.difficulty ?? 1) * 260 + platform.techComplexity * 280 + techResearchCount * 95;
  return Math.round(raw * devCostMultiplier(state));
}

export function estimateWeeklyExpenses(state: GameState) {
  const rent = 300 + state.level * 55 + Math.max(0, state.employees.length - 1) * 65;
  const team = state.employees.reduce((acc, employee) => {
    const scorePremium = Math.max(0, employee.scoreBoost ?? 0) * 8200;
    const sciencePremium = Math.max(0, employee.scienceBoost ?? 0) * 1350;
    const tradeoffDiscount = Math.max(0, -(employee.speedBoost ?? 0)) * 650;
    return acc + Math.round(employee.cost * 0.045 + employee.level * 35 + scorePremium + sciencePremium - tradeoffDiscount);
  }, 0);
  const infrastructure = 80 + state.activeGames.length * 22 + (researchHas(state, 'engine-v2') ? 110 : 0) + (researchHas(state, 'ai-assist') ? 90 : 0);
  return { rent, team, infrastructure, total: rent + team + infrastructure };
}

function makeLedger(day: number, title: string, amount: number, kind: LedgerEntry['kind']): LedgerEntry {
  return { id: nowId(), day, title, amount, kind };
}

function seededIndex(seed: number, length: number, salt = 0) {
  if (length <= 0) return 0;
  let value = (seed + 1) * 1103515245 + 12345 + salt * 2654435761;
  value ^= value >>> 16;
  return Math.abs(value) % length;
}

function updateAudience(state: GameState, newMonth: number): AudienceState {
  const recent = state.releaseHistory.slice(-8);
  const top = [...recent].sort((a, b) => b.score - a.score)[0];
  // Желания месяца теперь берутся из полного каталога игры, а не из открытого контента игрока.
  // Индексы детерминированы от игрового месяца, поэтому у всех игроков с одним месяцем одинаковая рекомендация.
  const desiredGenreId = genres[seededIndex(newMonth, genres.length, 7)]?.id ?? 'arcade';
  const desiredThemeId = themes[seededIndex(newMonth, themes.length, 19)]?.id ?? 'cyberpunk';
  const avgScore = recent.length ? recent.reduce((acc, item) => acc + item.score, 0) / recent.length : 6.4;
  const marketMood = state.activeMarketEvents.reduce((acc, event) => acc + (event.tone === 'positive' ? 0.03 : -0.04), 0);
  const mood = clamp(0.31 + avgScore / 17 + marketMood + Math.random() * 0.16 - 0.08, 0.1, 1);
  const genre = genres.find((item) => item.id === desiredGenreId)?.name ?? 'Аркада';
  const theme = themes.find((item) => item.id === desiredThemeId)?.name ?? 'Киберпанк';
  const vibe = mood >= 0.75
    ? `Глобальная аудитория в хайпе: просит ${genre} в сеттинге «${theme}» и активно спорит в чатах.`
    : mood >= 0.48
      ? `Глобальный спрос ровный: хотят ${genre} + «${theme}», но ждут качества.`
      : `Глобальная аудитория устала от однотипных релизов: ${genre} + «${theme}» может вернуть интерес.`;
  return {
    mood,
    desiredGenreId,
    desiredThemeId,
    vibe,
    lastUpdatedMonth: newMonth,
    revealedUntilMonth: state.audience.revealedUntilMonth,
    learnedFrom: top ? [top.title, ...state.audience.learnedFrom.filter((item) => item !== top.title)].slice(0, 4) : state.audience.learnedFrom,
  };
}


function makeMarketEvent(day: number, tone: 'positive' | 'negative'): MarketEvent {
  const pool = tone === 'positive' ? positiveMarketEvents : negativeMarketEvents;
  const template = pool[randomInt(0, pool.length - 1)];
  return {
    id: `${template.id}-${day}-${Math.random().toString(16).slice(2, 8)}`,
    title: template.title,
    description: template.description,
    tone,
    daysRemaining: MARKET_EVENT_DURATION_DAYS,
    salesMultiplier: template.salesMultiplier,
    scoreModifier: template.scoreModifier,
    startedDay: day,
  };
}

function newsFromEvent(event: MarketEvent): NewsEntry {
  return {
    id: nowId(),
    day: event.startedDay,
    title: event.title,
    body: `${event.description} Эффект продлится ${MARKET_EVENT_DURATION_DAYS} игровых дней.`,
    tone: event.tone,
  };
}

function marketSalesMultiplier(events: MarketEvent[]) {
  return clamp(events.reduce((acc, event) => acc * event.salesMultiplier, 1), 0.45, 1.85);
}

function marketScoreModifier(events: MarketEvent[]) {
  return clamp(events.reduce((acc, event) => acc + event.scoreModifier, 0), -1.4, 1.1);
}

function updateBankruptcyState(state: GameState, newMonth: number, oldMonth: number, ledger: LedgerEntry[]) {
  let employees = state.employees;
  let unpaidSinceMonth = state.unpaidSinceMonth;
  let closureWarningMonth = state.closureWarningMonth;
  let bestScore = state.bestScore;
  let gamesReleased = state.gamesReleased;
  let releaseHistory = state.releaseHistory;
  let ratingResetCount = state.ratingResetCount;
  let activeGames = state.activeGames;
  let newsFeed = state.newsFeed;

  if (state.coins >= 0) {
    return { ...state, unpaidSinceMonth: null, closureWarningMonth: null, employees, bestScore, gamesReleased, releaseHistory, ratingResetCount, activeGames, newsFeed, lastLedger: ledger };
  }

  if (unpaidSinceMonth === null) {
    unpaidSinceMonth = oldMonth;
    ledger.push(makeLedger(state.gameDay, 'Кассовый разрыв: зарплаты под угрозой', 0, 'event'));
  }

  if (employees.length > 0 && newMonth - unpaidSinceMonth >= 1) {
    employees = [];
    closureWarningMonth = newMonth;
    ledger.push(makeLedger(state.gameDay, 'Команда уволилась после месяца без зарплаты', 0, 'event'));
    newsFeed = [{ id: nowId(), day: state.gameDay, title: 'Команда покинула студию', body: 'Из-за долга сотрудники ушли. Есть один игровой месяц, чтобы выбраться из минуса до закрытия студии.', tone: 'negative' as const }, ...newsFeed].slice(0, 8);
  }

  if (closureWarningMonth !== null && newMonth - closureWarningMonth >= 1) {
    bestScore = 0;
    gamesReleased = 0;
    releaseHistory = [];
    activeGames = [];
    ratingResetCount += 1;
    closureWarningMonth = newMonth;
    ledger.push(makeLedger(state.gameDay, 'Студия закрыта: прогресс рейтинга обнулён', 0, 'event'));
    newsFeed = [{ id: nowId(), day: state.gameDay, title: 'Студия закрыта кредиторами', body: 'Рейтинг обнулён. Можно продолжать с долгом, но нужно восстановить баланс выше нуля.', tone: 'negative' as const }, ...newsFeed].slice(0, 8);
  }

  return { ...state, unpaidSinceMonth, closureWarningMonth, employees, bestScore, gamesReleased, releaseHistory, ratingResetCount, activeGames, newsFeed, lastLedger: ledger };
}

function advanceOneDay(state: GameState): GameState {
  const day = state.gameDay + 1;
  let coins = state.coins;
  let dailyPassiveIncome = state.dailyPassiveIncome;
  let activeGames = state.activeGames.map((game) => ({ ...game }));
  let ledger = [...state.lastLedger];
  let newsFeed = [...state.newsFeed];
  let activeMarketEvents = state.activeMarketEvents
    .map((event) => ({ ...event, daysRemaining: event.daysRemaining - 1 }))
    .filter((event) => event.daysRemaining > 0);

  const hasEventSlot = activeMarketEvents.length < 2;
  const eventChance = Math.random();
  let marketMustRecover = state.marketMustRecover;
  if (hasEventSlot && marketMustRecover && eventChance < 0.032) {
    const event = makeMarketEvent(day, 'positive');
    activeMarketEvents = [event, ...activeMarketEvents];
    newsFeed = [newsFromEvent(event), ...newsFeed].slice(0, 8);
    ledger.push(makeLedger(day, `Глобальное событие: ${event.title}`, 0, 'event'));
    marketMustRecover = false;
  } else if (hasEventSlot && !marketMustRecover && eventChance < 0.018) {
    const event = makeMarketEvent(day, 'positive');
    activeMarketEvents = [event, ...activeMarketEvents];
    newsFeed = [newsFromEvent(event), ...newsFeed].slice(0, 8);
    ledger.push(makeLedger(day, `Глобальное событие: ${event.title}`, 0, 'event'));
  } else if (hasEventSlot && !marketMustRecover && eventChance > 0.982) {
    const event = makeMarketEvent(day, 'negative');
    activeMarketEvents = [event, ...activeMarketEvents];
    newsFeed = [newsFromEvent(event), ...newsFeed].slice(0, 8);
    ledger.push(makeLedger(day, `Глобальное событие: ${event.title}`, 0, 'event'));
    marketMustRecover = true;
  }

  const marketLiveMultiplier = marketSalesMultiplier(activeMarketEvents);
  activeGames = activeGames.map((game) => {
    if (game.lifeDaysRemaining <= 0) return game;
    const liveOps = researchHas(state, 'liveops-lite') ? 0.045 : 0;
    const producerSafety = researchHas(state, 'producer-calendar') && game.lifeDaysRemaining > game.maxLifeDays - 3 ? 0.035 : 0;
    const randomDrift = Math.random() * 0.28 - 0.14 + (game.score >= 8.5 ? 0.01 : -0.012) + liveOps + producerSafety;
    const eventRoll = Math.random();
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
    const popularity = clamp(game.popularity + randomDrift + eventBoost, 0.14, 2.6);
    const earned = Math.max(0, Math.round(game.baseDailyIncome * popularity * marketLiveMultiplier));
    coins = clamp(coins + earned, MIN_COINS, Number.MAX_SAFE_INTEGER);
    dailyPassiveIncome += earned;
    return {
      ...game,
      popularity,
      totalEarned: game.totalEarned + earned,
      lifeDaysRemaining: Math.max(0, game.lifeDaysRemaining - 1),
      lastEvent: eventText,
    };
  }).filter((game) => game.lifeDaysRemaining > 0);

  if (day % 7 === 0) {
    const expenses = estimateWeeklyExpenses({ ...state, activeGames, coins, activeMarketEvents, newsFeed });
    coins = clamp(coins - expenses.total, MIN_COINS, Number.MAX_SAFE_INTEGER);
    ledger.push(makeLedger(day, 'Аренда + команда + инфраструктура', -expenses.total, 'expense'));
  }

  const newMonth = Math.floor(day / DAYS_PER_MONTH);
  const oldMonth = Math.floor(state.gameDay / DAYS_PER_MONTH);
  const audience = newMonth !== oldMonth ? updateAudience({ ...state, activeGames, coins, newsFeed, activeMarketEvents }, newMonth) : state.audience;

  let next: GameState = {
    ...state,
    coins,
    gameDay: day,
    activeGames,
    activeMarketEvents,
    marketMustRecover,
    newsFeed,
    audience,
    dailyPassiveIncome,
    weeklyExpenseTotal: day % 7 === 0 ? estimateWeeklyExpenses({ ...state, activeGames, coins }).total : state.weeklyExpenseTotal,
    lastLedger: ledger.slice(-10),
  };

  if (newMonth !== oldMonth || next.coins < 0) {
    next = updateBankruptcyState(next, newMonth, oldMonth, [...next.lastLedger]);
  }

  return { ...next, lastLedger: next.lastLedger.slice(-10), newsFeed: next.newsFeed.slice(0, 8) };
}

export function advanceGameTime(state: GameState, now = Date.now(), maxDays = 45): GameState {
  const normalized = ensureDailyState(state);
  const elapsed = Math.max(0, now - normalized.lastGameTickAt);
  const days = Math.min(maxDays, Math.floor(elapsed / GAME_DAY_MS));
  if (days <= 0) return normalized;
  let next = normalized;
  for (let index = 0; index < days; index += 1) next = advanceOneDay(next);
  return { ...next, lastGameTickAt: normalized.lastGameTickAt + days * GAME_DAY_MS };
}

export function startProject(state: GameState): GameState {
  const current = ensureDailyState(state);
  const project = current.selectedProject;
  if (!project) return current;
  const durationSeconds = estimateProjectDuration(project, current);
  const devCost = estimateDevelopmentCost({ ...project, durationSeconds }, current);
  const platform = platforms.find((item) => item.id === project.platform) ?? platforms[0];
  const techComplexity = platform.techComplexity + (researchHas(current, 'engine-v2') ? 0.25 : 0) + (researchHas(current, 'ai-assist') ? 0.18 : 0);
  if (!canSpend(current.coins, devCost)) return current;
  return {
    ...current,
    coins: clamp(current.coins - devCost, MIN_COINS, Number.MAX_SAFE_INTEGER),
    screen: 'develop',
    tutorialStep: current.tutorialDone ? current.tutorialStep : 4,
    selectedProject: {
      ...project,
      name: sanitizeProjectName(project.name),
      durationSeconds,
      devCost,
      techComplexity,
      startedAt: Date.now(),
      progress: Math.max(project.progress, 1),
      promotionUsed: false,
      promotionBoost: 0,
      devGlitchTriggered: false,
      devEventQueue: makeDevelopmentEventQueue(project.isTutorial),
      pendingDevEvent: null,
      devDecisionScoreBonus: 0,
      devDecisionSalesMultiplier: 1,
      devDecisionLog: [],
      devEventId: undefined,
      devEventText: undefined,
      devEventTone: undefined,
      devEventAt: 0,
    },
    lastLedger: devCost > 0 ? [...current.lastLedger, makeLedger(current.gameDay, `Старт разработки: ${sanitizeProjectName(project.name)}`, -devCost, 'expense')].slice(-10) : current.lastLedger,
  };
}


function makeDevelopmentEventQueue(isTutorial: boolean): ScheduledDevEvent[] {
  if (isTutorial) return [];
  const count = randomInt(1, 3);
  // Fisher-Yates shuffle avoids the infinite-loop risk of rejection sampling.
  const indices = developmentEventScenarios.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
  }
  const queue: ScheduledDevEvent[] = [];
  for (let index = 0; index < Math.min(count, indices.length); index += 1) {
    const progressAt = clamp(randomInt(18 + index * 18, 48 + index * 18), 15, 88);
    queue.push({ instanceId: nowId(), scenarioId: developmentEventScenarios[indices[index]].id, progressAt, triggered: false });
  }
  return queue.sort((a, b) => a.progressAt - b.progressAt);
}

export function getDevelopmentScenario(id: string) {
  return developmentEventScenarios.find((scenario) => scenario.id === id) ?? null;
}

function describeDevEffect(choice: DevEventChoice) {
  const effect = choice.effect;
  const parts: string[] = [];
  if (effect.coins) parts.push(`${effect.coins > 0 ? '+' : ''}${effect.coins} монет`);
  if (effect.progress) parts.push(`${effect.progress > 0 ? '+' : ''}${effect.progress}% прогресса`);
  if (effect.score) parts.push(`${effect.score > 0 ? '+' : ''}${effect.score.toFixed(2)} к оценке`);
  if (effect.salesMultiplier && effect.salesMultiplier !== 1) parts.push(`доход ×${effect.salesMultiplier.toFixed(2)}`);
  if (effect.rp) parts.push(`${effect.rp > 0 ? '+' : ''}${effect.rp} науки`);
  if (effect.stars) parts.push(`${effect.stars > 0 ? '+' : ''}${effect.stars} ⭐`);
  return parts.length ? parts.join(' · ') : 'без числового эффекта';
}


function isDevChoiceAffordable(state: GameState, choice: DevEventChoice) {
  const effect = choice.effect;
  if ((effect.stars ?? 0) < 0 && state.stars < Math.abs(effect.stars ?? 0)) return false;
  if ((effect.rp ?? 0) < 0 && state.rp < Math.abs(effect.rp ?? 0)) return false;
  if ((effect.coins ?? 0) < 0 && state.coins + (effect.coins ?? 0) < MIN_COINS) return false;
  return true;
}

export function resolveDevelopmentEvent(state: GameState, choiceId: 'a' | 'b'): GameState {
  const current = ensureDailyState(state);
  const project = current.selectedProject;
  const pending = project?.pendingDevEvent;
  if (!project?.startedAt || !pending) return current;
  const scenario = getDevelopmentScenario(pending.scenarioId);
  const choice = scenario?.choices.find((item) => item.id === choiceId);
  if (!scenario || !choice) return current;
  const effect = choice.effect;
  const anyAffordableChoice = scenario.choices.some((item) => isDevChoiceAffordable(current, item));
  if (!isDevChoiceAffordable(current, choice) && anyAffordableChoice) return current;
  const nextProgress = clamp(project.progress + (effect.progress ?? 0), 0, 99);
  const now = Date.now();
  const nextCoins = clamp(current.coins + (effect.coins ?? 0), MIN_COINS, Number.MAX_SAFE_INTEGER);
  const nextStars = Math.max(0, current.stars + (effect.stars ?? 0));
  const scoreBonus = clamp((project.devDecisionScoreBonus ?? 0) + (effect.score ?? 0), -2, 2);
  const salesMultiplier = clamp((project.devDecisionSalesMultiplier ?? 1) * (effect.salesMultiplier ?? 1), 0.55, 1.85);
  const resultLine = `${scenario.title}: ${choice.result} (${describeDevEffect(choice)})`;
  const isPositiveOutcome = (effect.score ?? 0) > 0 || (effect.progress ?? 0) > 0 || (effect.coins ?? 0) > 0;
  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.(isPositiveOutcome ? 'success' : 'warning');
  return {
    ...current,
    coins: nextCoins,
    rp: Math.max(0, current.rp + (effect.rp ?? 0)),
    stars: nextStars,
    dailyWorkTaps: current.dailyWorkTaps + 1,
    selectedProject: withDevPop({
      ...project,
      progress: nextProgress,
      startedAt: startedAtForProgress(project, current, nextProgress, now),
      pendingDevEvent: null,
      devDecisionScoreBonus: scoreBonus,
      devDecisionSalesMultiplier: salesMultiplier,
      devDecisionLog: [resultLine, ...(project.devDecisionLog ?? [])].slice(0, 4),
    }, 'РЕШЕНИЕ!', (effect.score ?? 0) < 0 || (effect.salesMultiplier ?? 1) < 1 || (effect.stars ?? 0) < 0 ? 'danger' : 'normal'),
    lastLedger: effect.coins ? [...current.lastLedger, makeLedger(current.gameDay, `Решение: ${scenario.title}`, effect.coins, effect.coins > 0 ? 'income' : 'expense')].slice(-10) : current.lastLedger,
  };
}

const devPopWords = ['ПОЛИШ!', 'СБОРКА!', 'ФИКС!', 'ИДЕЯ!', 'ТЕСТ!', 'ВАУ!', 'КОМБО!', 'ПАТЧ!', 'ПИКСЕЛИ!', 'БАЛАНС!', 'ТЕСТ!', 'ХАЙП!'];

function startedAtForProgress(project: Project, state: GameState, progress: number, now = Date.now()) {
  const multiplier = Math.max(0.1, speedMultiplier(state));
  const elapsedMs = (clamp(progress, 0, 100) / 100) * project.durationSeconds * 1000 / multiplier;
  return Math.max(0, Math.round(now - elapsedMs));
}

function withDevPop(project: Project, text: string, tone: 'normal' | 'danger' = 'normal') {
  return {
    ...project,
    devEventId: nowId(),
    devEventText: text,
    devEventTone: tone,
    devEventAt: Date.now(),
  };
}

export function tickProgress(state: GameState): GameState {
  const advanced = advanceGameTime(state, Date.now(), 3);
  const project = advanced.selectedProject;
  if (!project?.startedAt || project.progress >= 100) return advanced;
  const now = Date.now();

  if (project.pendingDevEvent) {
    return {
      ...advanced,
      selectedProject: {
        ...project,
        startedAt: startedAtForProgress(project, advanced, project.progress, now),
      },
    };
  }

  const seconds = (now - project.startedAt) / 1000;
  let progress = clamp((seconds / project.durationSeconds) * 100 * speedMultiplier(advanced), project.progress, 100);
  let nextProject: Project = { ...project, progress };

  const dueEvent = (project.devEventQueue ?? []).find((event) => !event.triggered && progress >= event.progressAt);
  if (dueEvent && progress < 100) {
    progress = clamp(dueEvent.progressAt, project.progress, 99);
    const queue = (project.devEventQueue ?? []).map((event) => event.instanceId === dueEvent.instanceId ? { ...event, triggered: true } : event);
    nextProject = withDevPop({
      ...nextProject,
      progress,
      startedAt: startedAtForProgress(project, advanced, progress, now),
      devEventQueue: queue,
      pendingDevEvent: { instanceId: dueEvent.instanceId, scenarioId: dueEvent.scenarioId, triggeredAtProgress: progress },
    }, 'РЕШЕНИЕ!', 'danger');
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('warning');
    return { ...advanced, selectedProject: nextProject };
  }

  const canShowPop = now - (project.devEventAt ?? 0) > 1450;
  const glitch = !project.devGlitchTriggered && !project.isTutorial && progress > 12 && Math.random() < 0.028;
  if (glitch) {
    progress = clamp(progress - 5, 0, 100);
    nextProject = withDevPop({ ...nextProject, progress, startedAt: startedAtForProgress(project, advanced, progress, now), devGlitchTriggered: true }, '$@%**!!!! −5%', 'danger');
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('heavy');
  } else if (canShowPop && progress < 100 && Math.random() < 0.38) {
    nextProject = withDevPop(nextProject, devPopWords[randomInt(0, devPopWords.length - 1)]);
  }

  return { ...advanced, selectedProject: nextProject };
}


export function timeSkipProject(state: GameState): GameState {
  const current = ensureDailyState(state);
  const project = current.selectedProject;
  const cost = 25;
  if (!project?.startedAt || project.progress >= 100 || project.pendingDevEvent || current.stars < cost) return current;
  const nextProgress = clamp(project.progress + 45, 0, 100);
  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
  return {
    ...current,
    stars: current.stars - cost,
    selectedProject: withDevPop({
      ...project,
      progress: nextProgress,
      startedAt: startedAtForProgress(project, current, nextProgress),
    }, 'ПРОПУСК +1Ч'),
  };
}

export function workTap(state: GameState): GameState {
  const current = ensureDailyState(state);
  const project = current.selectedProject;
  if (!project?.startedAt) return current;
  const baseBoost = project.isTutorial ? 6 : 2.3;
  const boost = baseBoost * (researchHas(current, 'game-feel') ? 1.08 : 1);
  const glitch = !project.devGlitchTriggered && !project.isTutorial && project.progress > 12 && Math.random() < 0.07;
  const nextProgress = clamp(project.progress + boost - (glitch ? 5 : 0), 0, 100);
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(glitch ? 'heavy' : 'light');
  return {
    ...current,
    dailyWorkTaps: current.dailyWorkTaps + 1,
    selectedProject: withDevPop({
      ...project,
      progress: nextProgress,
      startedAt: startedAtForProgress(project, current, nextProgress),
      devGlitchTriggered: project.devGlitchTriggered || glitch,
    }, glitch ? '$@%**!!!! −5%' : devPopWords[randomInt(0, devPopWords.length - 1)], glitch ? 'danger' : 'normal'),
  };
}

function audienceDemandMultiplier(state: GameState, genre: GenreId, theme: ThemeId) {
  const genreHit = state.audience.desiredGenreId === genre;
  const themeHit = state.audience.desiredThemeId === theme;
  const matchBonus = (genreHit ? 0.42 : -0.16) + (themeHit ? 0.34 : -0.12);
  const moodSwing = (state.audience.mood - 0.52) * 0.95;
  return clamp(0.92 + moodSwing + matchBonus, 0.48, 1.95);
}

function audienceScoreModifier(state: GameState, genre: GenreId, theme: ThemeId) {
  const genreHit = state.audience.desiredGenreId === genre;
  const themeHit = state.audience.desiredThemeId === theme;
  const match = (genreHit ? 0.55 : -0.34) + (themeHit ? 0.45 : -0.28);
  const mood = (state.audience.mood - 0.55) * 1.15;
  return clamp(match + mood, -1.35, 1.25);
}

export function releaseProject(state: GameState): GameState {
  const current = ensureDailyState(advanceGameTime(state, Date.now(), 3));
  const project = current.selectedProject;
  if (!project?.genre || !project.theme || !project.platform) return current;
  const combo = comboFor(project.genre, project.theme);
  const platform = platforms.find((item) => item.id === project.platform) ?? platforms[0];
  const audienceScore = audienceScoreModifier(current, project.genre, project.theme);
  const marketScore = marketScoreModifier(current.activeMarketEvents);
  const focusQualityScore = 2.7 + focusFit(project) * 4.05;
  const comboScore = (comboMultiplier(combo) - 1) * 1.75;
  const qualityBase = focusQualityScore + comboScore;
  const qaBonus = researchHas(current, 'qa-checklist') ? 0.24 : 0;
  const feelBonus = researchHas(current, 'game-feel') ? 0.3 : 0;
  const soundBonus = researchHas(current, 'sound-lab') ? 0.16 : 0;
  const complexityPenalty = Math.max(0, project.techComplexity - 1.05) * 0.28;
  const randomFlavor = Math.random() * 2.5 - 1.25;
  const promotionBoost = clamp(Number(project.promotionBoost) || 0, 0, 1.2);
  const decisionScore = clamp(Number(project.devDecisionScoreBonus) || 0, -2, 2);
  const decisionSales = clamp(Number(project.devDecisionSalesMultiplier) || 1, 0.55, 1.85);
  const momentumScore = momentumScoreBonus(current);
  const momentumRevenue = momentumRevenueMultiplier(current);
  const teamScore = employeeScoreBonus(current);
  const rawScore = qualityBase + qaBonus + feelBonus + soundBonus + promotionBoost + decisionScore + momentumScore + teamScore + audienceScore + marketScore - complexityPenalty + randomFlavor;
  const score = Number(clamp(rawScore, 1, 10).toFixed(1));
  const scoreBreakdown = [
    { label: 'Фокус разработки', value: focusQualityScore, kind: 'base' as const },
    { label: `Комбо ${combo}`, value: comboScore, kind: comboScore >= 0 ? 'bonus' as const : 'penalty' as const },
    ...(qaBonus ? [{ label: 'Чеклист тестирования', value: qaBonus, kind: 'bonus' as const }] : []),
    ...(feelBonus ? [{ label: 'Ощущение от игры', value: feelBonus, kind: 'bonus' as const }] : []),
    ...(soundBonus ? [{ label: 'Звуковая лаборатория', value: soundBonus, kind: 'bonus' as const }] : []),
    ...(promotionBoost ? [{ label: 'Продвижение', value: promotionBoost, kind: 'bonus' as const }] : []),
    ...(decisionScore ? [{ label: 'Решения разработки', value: decisionScore, kind: decisionScore > 0 ? 'bonus' as const : 'penalty' as const }] : []),
    ...(momentumScore ? [{ label: 'Импульс студии', value: momentumScore, kind: 'bonus' as const }] : []),
    ...(teamScore ? [{ label: 'Команда студии', value: teamScore, kind: teamScore > 0 ? 'bonus' as const : 'penalty' as const }] : []),
    { label: 'Настроение аудитории', value: audienceScore, kind: audienceScore >= 0 ? 'bonus' as const : 'penalty' as const },
    ...(marketScore ? [{ label: 'События рынка', value: marketScore, kind: marketScore > 0 ? 'bonus' as const : 'penalty' as const }] : []),
    ...(complexityPenalty ? [{ label: 'Сложность технологий', value: -complexityPenalty, kind: 'penalty' as const }] : []),
    { label: 'Непредсказуемость прессы', value: randomFlavor, kind: 'random' as const },
  ].filter((item) => Math.abs(item.value) >= 0.005);

  const criticResults = critics.map((critic) => ({
    name: critic.name,
    quote: critic.quote,
    score: Number(clamp(score + Math.random() * 2.2 - 1.1 + audienceScore * 0.18 + marketScore * 0.15, 1, 10).toFixed(1)),
  }));

  const criticAverage = Number((criticResults.reduce((sum, critic) => sum + critic.score, 0) / criticResults.length).toFixed(1));

  const reviewMultiplier = 0.48 + score / 8.7;
  const highScoreMultiplier = score > 8 ? 1 + Math.pow((score - 8) / 2, 1.35) * 1.8 : 1;
  const viralMultiplier = score >= 9 && researchHas(current, 'viral-hooks') ? 1.15 : 1;
  const demand = audienceDemandMultiplier(current, project.genre, project.theme);
  const marketSales = marketSalesMultiplier(current.activeMarketEvents);
  const immediateSales = Math.round((project.isTutorial ? 1000 : 1500) * reviewMultiplier * comboMultiplier(combo) * platform.userbase * incomeMultiplier(current) * momentumRevenue * viralMultiplier * highScoreMultiplier * demand * marketSales * decisionSales);
  const rp = Math.max(5, Math.round(score * (project.isTutorial ? 1 : 1.45) * scienceMultiplier(current)));
  const tutorialBonusActive = project.isTutorial && !current.tutorialRewardClaimed;
  const tutorialCoins = tutorialBonusActive ? 1200 : 0;
  const tutorialRp = tutorialBonusActive ? 15 : 0;
  const tutorialStars = tutorialBonusActive ? 1 : 0;
  const life = clamp(randomInt(5, 30), 5, 30);
  const passiveMultiplier = researchHas(current, 'service-model') ? 1.15 : 1;
  const passivePerDay = Math.max(20, Math.round((immediateSales / life) * (0.22 + score / 34) * passiveMultiplier));
  const activeGame: ReleasedGame = {
    id: nowId(),
    title: sanitizeProjectName(project.name),
    genre: project.genre,
    theme: project.theme,
    score,
    popularity: clamp(0.62 + score / 10 + (combo === 'Great' ? 0.16 : combo === 'Bad' ? -0.16 : 0), 0.35, 1.9),
    baseDailyIncome: passivePerDay,
    lifeDaysRemaining: life,
    maxLifeDays: life,
    totalEarned: 0,
    lastEvent: 'Релиз свежий: аудитория только учится на игре.',
    createdGameDay: current.gameDay,
  };
  const xp = Math.round(score * 12 + immediateSales / 180);
  const remainingXp = clamp(current.studioXp + xp, 0, 999_999);

  const result: ReleaseResult = {
    projectName: sanitizeProjectName(project.name),
    score,
    critics: criticResults,
    criticAverage,
    scoreBreakdown,
    sales: immediateSales + tutorialCoins,
    passivePerDay,
    lifetimeDays: life,
    rp: rp + tutorialRp,
    stars: tutorialStars,
    promotionBoost,
    bonusRewards: [
      ...(tutorialBonusActive ? ['Бонус за туториал: +1 200 🪙', 'Бонус за туториал: +15 🧪', 'Бонус за туториал: +1 ⭐'] : []),
      ...(promotionBoost > 0 ? [`Продвижение усилило релиз: +${promotionBoost.toFixed(1)} к оценке`] : []),
      ...(momentumScore > 0 ? [`Импульс студии: +${momentumScore.toFixed(2)} к оценке, доход ×${momentumRevenue.toFixed(2)}`] : []),
      ...(teamScore !== 0 ? [`Команда студии: ${teamScore > 0 ? '+' : ''}${teamScore.toFixed(2)} к оценке, наука ×${scienceMultiplier(current).toFixed(2)}`] : []),
      ...(decisionScore !== 0 ? [`Решения во время разработки: ${decisionScore > 0 ? '+' : ''}${decisionScore.toFixed(2)} к оценке`] : []),
      ...(decisionSales !== 1 ? [`Решения повлияли на продажи: ×${decisionSales.toFixed(2)}`] : []),
    ],
    combo,
    qualityLabel: score >= 9 ? 'Хит!' : score >= 7.5 ? 'Сильный релиз' : score >= 6 ? 'Ок для MVP' : 'Нужно полировать',
    createdAt: Date.now(),
  };

  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.(score >= 8 ? 'success' : 'warning');

  return {
    ...current,
    coins: current.coins + immediateSales + tutorialCoins,
    rp: current.rp + rp + tutorialRp,
    stars: current.stars + tutorialStars,
    studioXp: remainingXp,
    gamesReleased: current.gamesReleased + 1,
    dailyGamesReleased: current.dailyGamesReleased + 1,
    bestScore: Math.max(current.bestScore, score),
    latestRelease: result,
    selectedProject: null,
    activeGames: [activeGame, ...current.activeGames].slice(0, 12),
    releaseHistory: [...current.releaseHistory, { title: sanitizeProjectName(project.name), genre: project.genre, theme: project.theme, score, day: current.gameDay }].slice(-16),
    tutorialDone: current.tutorialDone || project.isTutorial,
    tutorialRewardClaimed: current.tutorialRewardClaimed || tutorialBonusActive,
    tutorialStep: project.isTutorial ? 5 : current.tutorialStep,
    screen: 'develop',
    lastLedger: [...current.lastLedger, makeLedger(current.gameDay, `Релиз: ${sanitizeProjectName(project.name)}`, immediateSales + tutorialCoins, 'income')].slice(-10),
  };
}


export function promoteProject(state: GameState): GameState {
  const current = ensureDailyState(state);
  const project = current.selectedProject;
  const cost = 35;
  if (!project?.startedAt || project.progress < 100 || project.promotionUsed || current.stars < cost) return current;
  const boost = Number((0.1 + Math.random() * 1.1).toFixed(1));
  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
  return {
    ...current,
    stars: current.stars - cost,
    selectedProject: {
      ...project,
      promotionUsed: true,
      promotionBoost: boost,
      devEventId: nowId(),
      devEventText: `ПРОМО +${boost.toFixed(1)}`,
      devEventTone: 'normal',
    },
  };
}

export function normalizeFocus(values: FocusTriple, index: number, value: number): FocusTriple {
  const next = [...values] as FocusTriple;
  next[index] = clamp(value, 0, 100);
  const otherIndexes = [0, 1, 2].filter((item) => item !== index);
  const remaining = Math.max(0, 100 - next[index]);
  const otherTotal = otherIndexes.reduce((acc, item) => acc + values[item], 0) || 1;
  otherIndexes.forEach((item, order) => {
    next[item] = order === 0 ? Math.round((values[item] / otherTotal) * remaining) : 0;
  });
  next[otherIndexes[1]] = 100 - next[index] - next[otherIndexes[0]];
  return next;
}

export function setProjectChoice<T extends 'genre' | 'theme' | 'platform'>(state: GameState, key: T, value: T extends 'genre' ? GenreId : T extends 'theme' ? ThemeId : PlatformId): GameState {
  const project = state.selectedProject ?? createProject(!state.tutorialDone);
  const nextStep = !state.tutorialDone ? Math.max(state.tutorialStep, key === 'genre' ? 1 : key === 'theme' ? 2 : 3) : state.tutorialStep;
  const nextProject = { ...project, [key]: value } as Project;
  return { ...state, selectedProject: { ...nextProject, durationSeconds: estimateProjectDuration(nextProject, state), devCost: estimateDevelopmentCost(nextProject, state) }, tutorialStep: nextStep };
}

export function revealAudience(state: GameState): GameState {
  const current = ensureDailyState(state);
  const month = Math.floor(current.gameDay / DAYS_PER_MONTH);
  const cost = researchHas(current, 'market-analysis') ? 500 : 800;
  if (current.coins < cost) return current;
  return {
    ...current,
    coins: current.coins - cost,
    audience: { ...current.audience, revealedUntilMonth: month },
    lastLedger: [...current.lastLedger, makeLedger(current.gameDay, 'Скан аудитории', -cost, 'expense')].slice(-10),
  };
}

export function isAudienceRevealed(state: GameState) {
  return state.audience.revealedUntilMonth >= Math.floor(state.gameDay / DAYS_PER_MONTH);
}

export function applyOfflineReward(state: GameState): GameState {
  const normalized = normalizeState(state);
  const beforeCoins = normalized.coins;
  const advanced = advanceGameTime(normalized, Date.now(), 30);
  const idleBoost = researchHas(advanced, 'async-standups') ? 1.2 : 1;
  const passiveDelta = Math.max(0, advanced.coins - beforeCoins);
  const studioIdle = advanced.gamesReleased > 0 ? Math.round((90 + advanced.level * 28 + advanced.employees.length * 70) * idleBoost) : 0;
  return {
    ...advanced,
    coins: advanced.coins + studioIdle,
    lastOfflineReward: passiveDelta + studioIdle,
    lastSavedAt: Date.now(),
  };
}


export function upgradeStudio(state: GameState): GameState {
  const current = ensureDailyState(state);
  const cost = nextStudioUpgradeCost(current.level);
  if (!cost || !canSpend(current.coins, cost)) return current;
  const newLevel = clamp(current.level + 1, 1, 4);
  return {
    ...current,
    level: newLevel,
    coins: clamp(current.coins - cost, MIN_COINS, Number.MAX_SAFE_INTEGER),
    lastLedger: [...current.lastLedger, makeLedger(current.gameDay, `Апгрейд студии до уровня ${newLevel}`, -cost, 'expense')].slice(-10),
  };
}

export function fireEmployee(state: GameState, employeeId: string): GameState {
  const current = ensureDailyState(state);
  const employee = current.employees.find((item) => item.id === employeeId);
  if (!employee) return current;
  return {
    ...current,
    employees: current.employees.filter((item) => item.id !== employeeId),
    hiredEmployeeIds: current.hiredEmployeeIds.filter((id) => id !== employeeId),
    lastLedger: [...current.lastLedger, makeLedger(current.gameDay, `Уволен сотрудник: ${employee.name}`, 0, 'event')].slice(-10),
  };
}

export function gameMonthLabel(day: number) {
  return Math.floor(day / DAYS_PER_MONTH) + 1;
}
