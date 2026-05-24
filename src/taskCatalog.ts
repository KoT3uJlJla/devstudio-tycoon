import type { DailyTaskId, GameState } from './types';

export type TaskReward = {
  coins?: number;
  rp?: number;
  stars?: number;
};

export type TaskCatalogItemOverride = {
  enabled?: boolean;
  visible?: boolean;
  hidden?: boolean;
  status?: 'active' | 'hidden' | 'disabled' | string;
  title?: string;
  desc?: string;
  description?: string;
  target?: number;
  reward?: TaskReward;
  order?: number;
};

export type TaskCatalogOverrides = {
  daily?: Record<string, TaskCatalogItemOverride>;
  studio?: Record<string, TaskCatalogItemOverride>;
};

type DailyTaskBase = {
  id: DailyTaskId;
  title: string;
  desc: string;
  target: number;
  reward: TaskReward;
  current: (state: GameState) => number;
  order: number;
};

type StudioGoalBase = {
  id: string;
  title: string;
  desc: string;
  target: number;
  reward: TaskReward;
  current: (state: GameState) => number;
  order: number;
};

export type DailyTaskModel = {
  id: DailyTaskId;
  title: string;
  desc: string;
  current: number;
  target: number;
  reward: TaskReward;
  order: number;
};

export type StudioGoalModel = {
  id: string;
  title: string;
  desc: string;
  current: number;
  target: number;
  reward: TaskReward;
  order: number;
};

function isProductInstinctActiveCompat(state: GameState) {
  const maybeTimed = state as GameState & { productInstinctExpiresAt?: unknown };
  const expiresAt = Number(maybeTimed.productInstinctExpiresAt || 0);
  if (expiresAt > 0) return expiresAt > Date.now();
  return state.unlockedResearchIds.includes('product-instinct');
}

const dailyTaskBase: DailyTaskBase[] = [
  {
    id: 'release',
    title: 'Релизный спринт',
    desc: 'Выпусти 3 игры за день.',
    target: 3,
    reward: { coins: 1800, rp: 12 },
    current: (state) => state.dailyGamesReleased,
    order: 10,
  },
  {
    id: 'work',
    title: 'Продюсерская смена',
    desc: 'Прими 2 решения во время разработки.',
    target: 2,
    reward: { coins: 1200, stars: 1 },
    current: (state) => state.dailyWorkTaps,
    order: 20,
  },
  {
    id: 'research',
    title: 'День лаборатории',
    desc: 'Открой 2 исследования, жанра или сеттинга.',
    target: 2,
    reward: { coins: 700, rp: 16 },
    current: (state) => state.dailyResearchUnlocked,
    order: 30,
  },
  {
    id: 'income',
    title: 'Long-tail доход',
    desc: 'Получи 2 500 монет пассивно от выпущенных игр.',
    target: 2500,
    reward: { coins: 1400 },
    current: (state) => state.dailyPassiveIncome,
    order: 40,
  },
];

const baseContentCount = 7;

const studioGoalBase: StudioGoalBase[] = [
  {
    id: 'first-release',
    title: 'Первый релиз',
    desc: 'Выпусти первую игру студии.',
    target: 1,
    reward: { coins: 2000, rp: 5 },
    current: (state) => state.gamesReleased,
    order: 10,
  },
  {
    id: 'score-7',
    title: 'Крепкий релиз',
    desc: 'Получи оценку 7.0 или выше.',
    target: 7,
    reward: { coins: 3500, rp: 10 },
    current: (state) => state.bestScore,
    order: 20,
  },
  {
    id: 'coins-10000',
    title: 'Финансовая подушка',
    desc: 'Накопи 10 000 монет на балансе студии.',
    target: 10000,
    reward: { coins: 1500, rp: 6 },
    current: (state) => Math.max(0, state.coins),
    order: 30,
  },
  {
    id: 'studio-level-2',
    title: 'Первое расширение',
    desc: 'Улучши студию до 2 уровня.',
    target: 2,
    reward: { coins: 3000, rp: 10 },
    current: (state) => state.level,
    order: 40,
  },
  {
    id: 'first-employee',
    title: 'Первый сотрудник',
    desc: 'Найми первого человека в команду.',
    target: 1,
    reward: { coins: 2500, rp: 8 },
    current: (state) => state.employees.length,
    order: 50,
  },
  {
    id: 'content-explorer',
    title: 'Свежие идеи',
    desc: 'Открой 3 новых жанра или сеттинга.',
    target: 3,
    reward: { coins: 4000, rp: 18 },
    current: (state) => Math.max(0, state.unlockedGenreIds.length + state.unlockedThemeIds.length - baseContentCount),
    order: 60,
  },
  {
    id: 'release-10',
    title: 'Производственный ритм',
    desc: 'Выпусти 10 игр за карьеру студии.',
    target: 10,
    reward: { coins: 9000, rp: 30 },
    current: (state) => state.gamesReleased,
    order: 70,
  },
  {
    id: 'score-9',
    title: 'Настоящий хит',
    desc: 'Получи оценку 9.0 или выше.',
    target: 9,
    reward: { coins: 12000, rp: 45, stars: 1 },
    current: (state) => state.bestScore,
    order: 80,
  },
  {
    id: 'product-instinct-active',
    title: 'Работа по чутью',
    desc: 'Активируй «Продуктовое чутьё».',
    target: 1,
    reward: { coins: 3000, rp: 12 },
    current: (state) => isProductInstinctActiveCompat(state) ? 1 : 0,
    order: 90,
  },
  {
    id: 'studio-level-3',
    title: 'Студия растёт',
    desc: 'Улучши студию до 3 уровня.',
    target: 3,
    reward: { coins: 18000, rp: 60, stars: 2 },
    current: (state) => state.level,
    order: 100,
  },
  {
    id: 'release-50',
    title: 'Каталог студии',
    desc: 'Выпусти 50 игр за карьеру студии.',
    target: 50,
    reward: { coins: 50000, rp: 160, stars: 3 },
    current: (state) => state.gamesReleased,
    order: 110,
  },
];

function safeNumber(value: unknown, fallback: number, min = 0, max = 999999999) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function cleanText(value: unknown, fallback: string, max = 96) {
  const text = String(value || '').replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : fallback;
}

function cleanReward(value: unknown, fallback: TaskReward): TaskReward {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as TaskReward : {};
  return {
    coins: safeNumber(raw.coins, fallback.coins ?? 0, 0, 9999999) || undefined,
    rp: safeNumber(raw.rp, fallback.rp ?? 0, 0, 999999) || undefined,
    stars: safeNumber(raw.stars, fallback.stars ?? 0, 0, 999) || undefined,
  };
}

function isVisible(override?: TaskCatalogItemOverride) {
  if (!override) return true;
  if (override.enabled === false || override.visible === false || override.hidden === true) return false;
  return !['hidden', 'disabled', 'off'].includes(String(override.status || '').toLowerCase());
}

function mergeTask<T extends DailyTaskBase | StudioGoalBase>(base: T, override: TaskCatalogItemOverride | undefined, state: GameState) {
  if (!isVisible(override)) return null;
  return {
    id: base.id,
    title: cleanText(override?.title, base.title),
    desc: cleanText(override?.desc ?? override?.description, base.desc, 160),
    current: Math.max(0, base.current(state)),
    target: safeNumber(override?.target, base.target, 1, 999999999),
    reward: cleanReward(override?.reward, base.reward),
    order: safeNumber(override?.order, base.order, 0, 9999),
  };
}

function isDailyTaskModel(task: DailyTaskModel | null): task is DailyTaskModel {
  return task !== null;
}

function isStudioGoalModel(goal: StudioGoalModel | null): goal is StudioGoalModel {
  return goal !== null;
}

export function buildDailyTasks(state: GameState, overrides: TaskCatalogOverrides = {}): DailyTaskModel[] {
  return dailyTaskBase
    .map((task) => mergeTask(task, overrides.daily?.[task.id], state) as DailyTaskModel | null)
    .filter(isDailyTaskModel)
    .sort((a, b) => a.order - b.order);
}

export function buildStudioGoals(state: GameState, overrides: TaskCatalogOverrides = {}): StudioGoalModel[] {
  return studioGoalBase
    .map((goal) => mergeTask(goal, overrides.studio?.[goal.id], state) as StudioGoalModel | null)
    .filter(isStudioGoalModel)
    .sort((a, b) => a.order - b.order);
}

export function taskProgressPercent(current: number, target: number) {
  return Math.min(100, Math.round((Math.max(0, current) / Math.max(1, target)) * 100));
}

export function rewardLabel(reward: TaskReward) {
  const parts: string[] = [];
  if (reward.coins) parts.push('+' + Math.round(reward.coins).toLocaleString('ru-RU') + ' 🪙');
  if (reward.rp) parts.push('+' + Math.round(reward.rp).toLocaleString('ru-RU') + ' 🧪');
  if (reward.stars) parts.push('+' + Math.round(reward.stars).toLocaleString('ru-RU') + ' ⭐');
  return parts.join(' ') || 'Забрать';
}

export function applyTaskReward(state: GameState, reward: TaskReward): GameState {
  return {
    ...state,
    coins: state.coins + Math.max(0, Math.floor(reward.coins || 0)),
    rp: state.rp + Math.max(0, Math.floor(reward.rp || 0)),
    stars: state.stars + Math.max(0, Math.floor(reward.stars || 0)),
  };
}
