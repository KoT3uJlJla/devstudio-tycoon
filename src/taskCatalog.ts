import { isProductInstinctActive } from './gameLogic';
import { getLocale, t, type TranslationKey } from './i18n';
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
  titleKey: TranslationKey;
  descKey: TranslationKey;
  target: number;
  reward: TaskReward;
  current: (state: GameState) => number;
  order: number;
};

type StudioGoalBase = {
  id: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
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

const dailyTaskBase: DailyTaskBase[] = [
  {
    id: 'release',
    titleKey: 'tasks.release.title',
    descKey: 'tasks.release.desc',
    target: 3,
    reward: { coins: 1800, rp: 12 },
    current: (state) => state.dailyGamesReleased,
    order: 10,
  },
  {
    id: 'work',
    titleKey: 'tasks.work.title',
    descKey: 'tasks.work.desc',
    target: 2,
    reward: { coins: 1200, stars: 1 },
    current: (state) => state.dailyWorkTaps,
    order: 20,
  },
  {
    id: 'research',
    titleKey: 'tasks.research.title',
    descKey: 'tasks.research.desc',
    target: 2,
    reward: { coins: 700, rp: 16 },
    current: (state) => state.dailyResearchUnlocked,
    order: 30,
  },
  {
    id: 'income',
    titleKey: 'tasks.income.title',
    descKey: 'tasks.income.desc',
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
    titleKey: 'goals.firstRelease.title',
    descKey: 'goals.firstRelease.desc',
    target: 1,
    reward: { coins: 2000, rp: 5 },
    current: (state) => state.gamesReleased,
    order: 10,
  },
  {
    id: 'score-7',
    titleKey: 'goals.score7.title',
    descKey: 'goals.score7.desc',
    target: 7,
    reward: { coins: 3500, rp: 10 },
    current: (state) => state.bestScore,
    order: 20,
  },
  {
    id: 'coins-10000',
    titleKey: 'goals.coins10000.title',
    descKey: 'goals.coins10000.desc',
    target: 10000,
    reward: { coins: 1500, rp: 6 },
    current: (state) => Math.max(0, state.coins),
    order: 30,
  },
  {
    id: 'studio-level-2',
    titleKey: 'goals.studioLevel2.title',
    descKey: 'goals.studioLevel2.desc',
    target: 2,
    reward: { coins: 3000, rp: 10 },
    current: (state) => state.level,
    order: 40,
  },
  {
    id: 'first-employee',
    titleKey: 'goals.firstEmployee.title',
    descKey: 'goals.firstEmployee.desc',
    target: 1,
    reward: { coins: 2500, rp: 8 },
    current: (state) => state.employees.length,
    order: 50,
  },
  {
    id: 'content-explorer',
    titleKey: 'goals.contentExplorer.title',
    descKey: 'goals.contentExplorer.desc',
    target: 3,
    reward: { coins: 4000, rp: 18 },
    current: (state) => Math.max(0, state.unlockedGenreIds.length + state.unlockedThemeIds.length - baseContentCount),
    order: 60,
  },
  {
    id: 'release-10',
    titleKey: 'goals.release10.title',
    descKey: 'goals.release10.desc',
    target: 10,
    reward: { coins: 9000, rp: 30 },
    current: (state) => state.gamesReleased,
    order: 70,
  },
  {
    id: 'score-9',
    titleKey: 'goals.score9.title',
    descKey: 'goals.score9.desc',
    target: 9,
    reward: { coins: 12000, rp: 45, stars: 1 },
    current: (state) => state.bestScore,
    order: 80,
  },
  {
    id: 'product-instinct-active',
    titleKey: 'goals.productInstinct.title',
    descKey: 'goals.productInstinct.desc',
    target: 1,
    reward: { coins: 3000, rp: 12 },
    current: (state) => isProductInstinctActive(state) ? 1 : 0,
    order: 90,
  },
  {
    id: 'studio-level-3',
    titleKey: 'goals.studioLevel3.title',
    descKey: 'goals.studioLevel3.desc',
    target: 3,
    reward: { coins: 18000, rp: 60, stars: 2 },
    current: (state) => state.level,
    order: 100,
  },
  {
    id: 'release-50',
    titleKey: 'goals.release50.title',
    descKey: 'goals.release50.desc',
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
    title: cleanText(override?.title, t(base.titleKey)),
    desc: cleanText(override?.desc ?? override?.description, t(base.descKey), 160),
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
  if (reward.coins) parts.push('+' + Math.round(reward.coins).toLocaleString(getLocale()) + ' 🪙');
  if (reward.rp) parts.push('+' + Math.round(reward.rp).toLocaleString(getLocale()) + ' 🧪');
  if (reward.stars) parts.push('+' + Math.round(reward.stars).toLocaleString(getLocale()) + ' ⭐');
  return parts.join(' ') || t('button.claim');
}

export function applyTaskReward(state: GameState, reward: TaskReward): GameState {
  return {
    ...state,
    coins: state.coins + Math.max(0, Math.floor(reward.coins || 0)),
    rp: state.rp + Math.max(0, Math.floor(reward.rp || 0)),
    stars: state.stars + Math.max(0, Math.floor(reward.stars || 0)),
  };
}
