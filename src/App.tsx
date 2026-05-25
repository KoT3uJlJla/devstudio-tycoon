import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode } from 'react';
import { employeePool,
  genres,
  platforms,
  researchNodes,
  themes } from './gameData';
import {
  comboFor,
  createProject,
  ensureDailyState,
  employeeSlotsForLevel,
  estimateDevelopmentCost,
  estimateProjectDuration,
  estimateWeeklyExpenses,
  fireEmployee,
  GAME_DAY_MS,
  gameMonthLabel,
  incomeMultiplier,
  initialState,
  employeeScoreBonus,
  scienceMultiplier,
  releaseVelocityBoost,
  studioLevelSpeedBoost,
  momentumRevenueMultiplier,
  momentumScoreBonus,
  momentumSpeedMultiplier,
  isAudienceRevealed,
  normalizeFocus,
  phaseLabels,
  projectInsight,
  promoteProject,
  releaseProject,
  getDevelopmentScenario,
  resolveDevelopmentEvent,
  revealAudience,
  sanitizeProjectName,
  setProjectChoice,
  speedMultiplier,
  startProject,
  tickProgress,
  todayKey,
  timeSkipProject,
  upgradeStudio,
  nextStudioUpgradeCost,
  activateProductInstinct,
  isProductInstinctActive,
  productInstinctRemainingMs,
  gameDateParts,
} from './gameLogic';
import { loadGame, saveGame } from './storage';
import { haptic, initTelegram, shareRelease } from './telegram';
import { getTonWallet, purchaseShopItem, saveTonWallet, unlinkTonWallet, claimReferralMilestone, fetchTaskConfig, hasBackendSession, runDevelopmentAction } from './backendClient';
import { applyTaskReward, buildDailyTasks, buildStudioGoals, rewardLabel, taskProgressPercent, type DailyTaskModel, type StudioGoalModel, type TaskCatalogOverrides } from './taskCatalog';
import { claimBackendDailyReward, claimBackendReferralMilestone, purchaseBackendItem, runBackendDevelopmentAction } from './server-economy';
import type { DailyTaskId, DevEventChoice, Employee, Focus, GameState, GenreId, PhaseId, PlatformId, Project, ScoreBreakdownItem, ThemeId } from './types';

const navItems = [
  ['develop', 'Разработка', 'develop'],
  ['research', 'Наука', 'research'],
  ['studio', 'Студия', 'studio'],
  ['shop', 'Магазин', 'shop'],
  ['menu', 'Награды', 'rating'],
] as const;

const prizeDistribution = [
  ['$70', '35%'], ['$50', '25%'], ['$35', '17.5%'], ['$25', '12.5%'], ['$20', '10%'],
] as const;

function money(value: number) {
  return Math.round(value).toLocaleString('ru-RU');
}

function scoreDelta(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function comboLabel(value: 'Great' | 'Good' | 'Neutral' | 'Bad') {
  return ({ Great: 'Отличное', Good: 'Хорошее', Neutral: 'Нейтральное', Bad: 'Слабое' } as const)[value] ?? value;
}




type RealLeaderboardRow = {
  place?: number;
  telegramId?: string;
  displayName?: string;
  bestTitle?: string;
  score?: number;
  prize?: readonly [string, string] | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? '';

function currentTelegramId() {
  const webApp = window.Telegram?.WebApp as unknown as { initDataUnsafe?: { user?: { id?: number | string } } } | undefined;
  const id = webApp?.initDataUnsafe?.user?.id;
  return id === undefined || id === null ? '' : String(id);
}

async function fetchRealLeaderboard(): Promise<RealLeaderboardRow[]> {
  const initData = window.Telegram?.WebApp?.initData || '';
  if (!API_URL || !initData) return [];
  try {
    const response = await fetch(`${API_URL}/api/economy`, { headers: { Authorization: `tma ${initData}` } });
    const payload = await response.json().catch(() => null) as { leaderboard?: RealLeaderboardRow[] } | null;
    const rows = Array.isArray(payload?.leaderboard) ? payload.leaderboard : [];
    const seen = new Set<string>();
    return rows
      .filter((row) => row && Number.isFinite(Number(row.score)))
      .filter((row) => {
        const key = String(row.telegramId || row.displayName || row.bestTitle || '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10)
      .map((row, index) => ({ ...row, place: index + 1, score: Number(row.score || 0), prize: row.prize ?? prizeDistribution[index] ?? null }));
  } catch {
    return [];
  }
}

function signedPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value * 100)}%`;
}

function signedScore(value = 0) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function employeeMetrics(employee: Employee) {
  return [
    `Скорость ${signedPercent(employee.speedBoost)}`,
    `Доход ${signedPercent(employee.incomeBoost)}`,
    `Наука ${signedPercent(employee.scienceBoost ?? 0)}`,
    `Оценка ${signedScore(employee.scoreBoost ?? 0)}`,
  ].join(' · ');
}

function weeklyRatingBreakdown(state: GameState) {
  const currentDay = state.gameDay;
  const recent = state.releaseHistory.filter((entry) => currentDay - entry.day <= 7).slice(-5);
  const bestRecent = recent.reduce((best, entry) => Math.max(best, entry.score), 0);
  const avgRecent = recent.length ? recent.reduce((sum, entry) => sum + entry.score, 0) / recent.length : 0;
  const activeRevenue = Math.min(9000, state.activeGames.reduce((sum, game) => sum + game.totalEarned, 0) / 16);
  const releaseVolume = Math.min(3600, recent.length * 900);
  const momentum = Math.min(2600, Math.max(0, state.studioXp) / 2.4);
  const studioLevel = Math.max(0, state.level - 1) * 650;
  const resetPenalty = Math.min(6000, state.ratingResetCount * 1800);
  const debtPenalty = state.coins < 0 ? Math.min(5000, Math.abs(state.coins) / 6) : 0;
  const seasonal = state.unlockedResearchIds.includes('seasonal-pr') && bestRecent >= 7 ? 1200 : 0;
  const total = Math.max(0, Math.round(bestRecent * bestRecent * 930 + avgRecent * 1500 + activeRevenue + releaseVolume + momentum + studioLevel + seasonal - resetPenalty - debtPenalty));
  return {
    total,
    recent,
    items: [
      ['Лучший свежий релиз', Math.round(bestRecent * bestRecent * 930)],
      ['Среднее качество недели', Math.round(avgRecent * 1500)],
      ['Доход живых игр', Math.round(activeRevenue)],
      ['Релизный ритм', Math.round(releaseVolume)],
      ['Импульс студии', Math.round(momentum)],
      ['Уровень студии', Math.round(studioLevel)],
      ['Сезонный PR', Math.round(seasonal)],
      ['Штраф за сбросы', -Math.round(resetPenalty)],
      ['Штраф за долг', -Math.round(debtPenalty)],
    ].filter(([, value]) => Number(value) !== 0) as [string, number][],
  };
}

const REFERRAL_MILESTONES = [
  { id: 'm1', target: 1, reward: { coins: 1500, rp: 8 }, label: '1 активный друг' },
  { id: 'm3', target: 3, reward: { coins: 5000, rp: 20 }, label: '3 активных друга' },
  { id: 'm5', target: 5, reward: { coins: 11000, rp: 40 }, label: '5 активных друзей' },
  { id: 'm10', target: 10, reward: { coins: 28000, rp: 90 }, label: '10 активных друзей' },
  { id: 'm25', target: 25, reward: { coins: 90000, rp: 260 }, label: '25 активных друзей' },
] as const;

function applyReferralReward(state: GameState, tier: 'direct' | 'second'): GameState {
  if (tier === 'direct') {
    return { ...state, qualifiedReferrals: (state.qualifiedReferrals ?? 0) + 1 };
  }
  return { ...state, qualifiedSecondLevelReferrals: (state.qualifiedSecondLevelReferrals ?? 0) + 1 };
}

function playInterfaceTone(kind: 'hover' | 'press') {
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  const globalAudio = window as unknown as { __devstudioAudio?: AudioContext; __devstudioUnlocked?: boolean; __lastHoverTone?: number };
  if (kind === 'hover' && !globalAudio.__devstudioUnlocked) return;
  const now = Date.now();
  if (kind === 'hover' && now - (globalAudio.__lastHoverTone ?? 0) < 90) return;
  if (kind === 'hover') globalAudio.__lastHoverTone = now;
  const ctx = globalAudio.__devstudioAudio ?? new AudioContextCtor();
  globalAudio.__devstudioAudio = ctx;
  if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
  globalAudio.__devstudioUnlocked = true;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime;
  const freq = kind === 'hover' ? 310 : 240;
  const endFreq = kind === 'hover' ? 345 : 205;
  const volume = kind === 'hover' ? 0.0018 : 0.0042;
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + 0.12);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + 0.16);
}

function useInterfaceSounds() {
  useEffect(() => {
    const isInteractive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('button:not(:disabled), [role="button"]:not([aria-disabled="true"]), input[type="range"]'));
    const onPointerOver = (event: PointerEvent) => {
      if (isInteractive(event.target)) playInterfaceTone('hover');
    };
    const onPointerDown = (event: PointerEvent) => {
      if (isInteractive(event.target)) playInterfaceTone('press');
    };
    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, []);
}

function randomIndex(length: number) {
  if (length <= 0) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] % length;
  }
  return Math.floor(Math.random() * length);
}

function getTaskKey(id: DailyTaskId) {
  return `${todayKey()}:${id}`;
}

function fmtFocus(focus: Focus, phase: PhaseId) {
  return phaseLabels[phase].map((label, index) => `${label} ${focus[phase][index]}%`).join(' · ');
}

const priorityLabels: Record<PhaseId, string[]> = {
  pre: ['техоснова', 'геймплей', 'нарратив'],
  production: ['сценарий', 'уровни', 'ИИ'],
  post: ['мир', 'арт', 'звук'],
};

function prioritySentence(focus: Focus, phase: PhaseId) {
  const values = focus[phase];
  const index = values.indexOf(Math.max(...values));
  const label = priorityLabels[phase][index];
  if (phase === 'production' && label === 'ИИ') return 'Сборка игры: для этого жанра нужен сильный ИИ.';
  if (phase === 'pre' && label === 'геймплей') return 'Фокус разработки: лучше делать упор на геймплей.';
  if (phase === 'pre' && label === 'нарратив') return 'Фокус разработки: игроки ждут сильный нарратив.';
  if (phase === 'post' && label === 'звук') return 'Полировка: звук должен продавать эмоцию.';
  if (phase === 'post' && label === 'арт') return 'Полировка: арт должен стать главным крючком.';
  return `${phase === 'pre' ? 'Идея и прототип' : phase === 'production' ? 'Сборка игры' : 'Полировка'}: главный упор — ${label}.`;
}


type IconName =
  | 'studio' | 'develop' | 'hire' | 'research' | 'shop' | 'rating'
  | 'coin' | 'rp' | 'star' | 'trophy' | 'chart' | 'gamepad'
  | 'genre' | 'theme' | 'platform' | 'rocket' | 'clock' | 'audience'
  | 'paint' | 'megaphone' | 'brain' | 'producer' | 'analyst' | 'code' | 'spark';

const iconPaths: Record<IconName, ReactNode> = {
  studio: <><path d="M4 15h16l-2 5H6z" /><path d="M8 15V9l4-3 4 3v6" /><path d="M10 15v-3h4v3" /></>,
  develop: <><path d="M7 17 3 13l4-4" /><path d="m17 7 4 4-4 4" /><path d="m14 4-4 16" /></>,
  hire: <><circle cx="9" cy="8" r="3" /><path d="M3 20c1-4 4-6 8-6" /><path d="M16 11h5" /><path d="M18.5 8.5v5" /></>,
  research: <><path d="M9 3v6l-5 9c-.6 1 .1 2 1.3 2h13.4c1.2 0 1.9-1 1.3-2l-5-9V3" /><path d="M8 3h8" /><path d="M7 15h10" /></>,
  shop: <><path d="M4 9h16l-2 11H6z" /><path d="M8 9a4 4 0 0 1 8 0" /><path d="m10 14 2-2 2 2 3-3" /></>,
  rating: <><path d="M7 20h10" /><path d="M9 20V10h6v10" /><path d="M5 20v-6h4" /><path d="M15 20v-9h4v9" /><path d="M12 4l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 10l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" /></>,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M9 10c.7-1.1 2-1.8 3.6-1.6 1.5.2 2.4 1 2.4 2s-.7 1.8-3 2c-2 .2-3 .8-3 2s1.1 2.1 3 2.2c1.5.1 2.8-.4 3.7-1.4" /><path d="M12 6.5v11" /></>,
  rp: <><path d="M12 3 21 8l-9 13L3 8z" /><path d="M7 8h10" /><path d="m9 8 3 13 3-13" /></>,
  star: <><path d="m12 3 2.3 5 5.4.6-4 3.7 1.1 5.3L12 15l-4.8 2.6 1.1-5.3-4-3.7 5.4-.6z" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H4c0 4 1.5 6 4.5 6" /><path d="M16 6h4c0 4-1.5 6-4.5 6" /><path d="M12 13v5" /><path d="M8 20h8" /></>,
  chart: <><path d="M4 19h16" /><path d="M6 16l4-4 3 2 5-7" /><path d="M18 7v5h-5" /></>,
  gamepad: <><path d="M7 9h10a5 5 0 0 1 4 8 2.5 2.5 0 0 1-4-1l-.7-1H7.7L7 16a2.5 2.5 0 0 1-4 1 5 5 0 0 1 4-8Z" /><path d="M8 12v4" /><path d="M6 14h4" /><path d="M16.5 13h.1" /><path d="M18.5 15h.1" /></>,
  genre: <><path d="M4 6h16v12H4z" /><path d="m7 9 3 3-3 3" /><path d="M13 15h4" /></>,
  theme: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /><path d="M12 4c2.2 2.4 3.2 5 3.2 8S14.2 17.6 12 20" /><path d="M12 4C9.8 6.4 8.8 9 8.8 12S9.8 17.6 12 20" /></>,
  platform: <><rect x="4" y="5" width="16" height="11" rx="2" /><path d="M9 20h6" /><path d="M12 16v4" /></>,
  rocket: <><path d="M13 4c3.7.8 6.2 3.3 7 7l-5 5-5-5z" /><path d="M10 11 5 13l3 3-2 4 5-5" /><circle cx="15" cy="9" r="1.6" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  audience: <><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M3 20c.8-4 3.2-6 7-6" /><path d="M14 14c3.8 0 6.2 2 7 6" /></>,
  paint: <><path d="M5 14c0-5 4-9 9-9 4 0 7 2.7 7 6 0 2-1 3-2.5 3H17c-1 0-1.5.7-1.2 1.5.5 1.6-.7 3.5-2.8 3.5-4.4 0-8-1.8-8-5Z" /><circle cx="9" cy="11" r="1" /><circle cx="12" cy="8" r="1" /><circle cx="16" cy="10" r="1" /></>,
  megaphone: <><path d="M4 13V9h4l9-4v12l-9-4z" /><path d="m8 13 2 6" /><path d="M19 9c1 .8 1 3.2 0 4" /></>,
  brain: <><path d="M9 5a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 5 2 3 3 0 0 0 5-2v-1a3 3 0 0 0 0-6V8a3 3 0 0 0-5-2 3 3 0 0 0-2-1Z" /><path d="M12 6v12" /><path d="M8 11h3" /><path d="M13 14h3" /></>,
  producer: <><path d="M4 8h16v11H4z" /><path d="m8 8 2-4h4l2 4" /><path d="m10 12 4 2-4 2z" /></>,
  analyst: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-9" /></>,
  code: <><path d="m9 8-4 4 4 4" /><path d="m15 8 4 4-4 4" /><path d="m13 5-2 14" /></>,
  spark: <><path d="M12 3v6" /><path d="M12 15v6" /><path d="M3 12h6" /><path d="M15 12h6" /><path d="m5 5 4 4" /><path d="m15 15 4 4" /><path d="m19 5-4 4" /><path d="m9 15-4 4" /></>,
};

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{iconPaths[name]}</svg>;
}


const itemIconPaths: Record<string, ReactNode> = {
  arcade: <><rect x="5" y="6" width="14" height="12" rx="3" /><path d="M8 12h5" /><path d="M10.5 9.5v5" /><circle cx="16" cy="11" r="1" /><circle cx="16" cy="15" r="1" /></>,
  platformer: <><path d="M4 17h5l2-4 3 3 2-6 4 7" /><path d="M6 10h5" /><path d="M14 6h5" /></>,
  rpg: <><path d="M6 19 18 7" /><path d="m14 5 5 5" /><path d="M5 13 11 19" /><path d="m8 16-3 3" /></>,
  strategy: <><path d="M7 19h10" /><path d="M9 19l1-7h4l1 7" /><path d="M8 12h8" /><path d="M10 12V6h4v6" /></>,
  puzzle: <><path d="M5 9h5V6a2 2 0 1 1 4 0v3h5v5h-3a2 2 0 1 0 0 4h3v2H5v-5h3a2 2 0 1 0 0-4H5z" /></>,
  horror: <><path d="M6 20V9a6 6 0 0 1 12 0v11" /><path d="M8 15c1 1 2 1 3 0" /><path d="M13 15c1 1 2 1 3 0" /><path d="M9 10h.1M15 10h.1" /></>,
  racing: <><path d="M5 16h14l-2-5H7z" /><path d="M8 11l1-3h6l1 3" /><circle cx="8" cy="17" r="2" /><circle cx="16" cy="17" r="2" /></>,
  fighting: <><path d="M6 13V8a2 2 0 0 1 4 0v4" /><path d="M10 13V7a2 2 0 0 1 4 0v6" /><path d="M14 13V9a2 2 0 0 1 4 0v4" /><path d="M6 13c0 4 3 7 7 7s6-3 6-7" /></>,
  simulator: <><path d="M5 18h14" /><path d="M7 18V8l5-3 5 3v10" /><path d="M9 12h6" /><path d="M12 9v6" /></>,
  'visual-novel': <><path d="M5 7h14v9H9l-4 4z" /><path d="M8 10h8" /><path d="M8 13h5" /></>,
  roguelike: <><rect x="6" y="6" width="12" height="12" rx="3" /><circle cx="9" cy="9" r=".8" /><circle cx="15" cy="9" r=".8" /><circle cx="12" cy="12" r=".8" /><circle cx="9" cy="15" r=".8" /><circle cx="15" cy="15" r=".8" /></>,
  deckbuilder: <><rect x="7" y="5" width="9" height="13" rx="2" transform="rotate(-8 11.5 11.5)" /><rect x="10" y="6" width="8" height="13" rx="2" transform="rotate(8 14 12.5)" /><path d="M12 11h3" /></>,
  survival: <><path d="M12 4 4 20h16z" /><path d="M12 9v5" /><path d="M9 17h6" /></>,
  metroidvania: <><path d="M5 6h6v5H8v3h8v4h3" /><path d="M17 6h2v5h-5" /><circle cx="8" cy="17" r="2" /></>,
  sandbox: <><path d="M5 17 12 5l7 12z" /><path d="M8 17h8" /><path d="M12 5v12" /><path d="M8 12h8" /></>,
  'battle-royale': <><path d="M5 9c4-5 10-5 14 0" /><path d="M7 9l5 10 5-10" /><path d="M12 19v-6" /></>,
  rhythm: <><path d="M9 18V6l9-2v12" /><circle cx="7" cy="18" r="2" /><circle cx="16" cy="16" r="2" /></>,
  party: <><path d="M6 19 10 5l8 8z" /><path d="M12 7l4-3" /><path d="M16 11l4-2" /><path d="M8 15l-3 3" /></>,
  idle: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l4 2" /><path d="M5 5l3 3" /></>,
  'tower-defense': <><path d="M6 20V8h12v12" /><path d="M7 8V5h3v3h4V5h3v3" /><path d="M10 20v-5h4v5" /></>,
  'moba-lite': <><path d="M12 4 20 8v7l-8 5-8-5V8z" /><path d="M12 8v8" /><path d="M8 10l8 4" /><path d="M16 10l-8 4" /></>,
  'city-builder': <><path d="M5 20V9h5v11" /><path d="M10 20V5h5v15" /><path d="M15 20v-8h4v8" /><path d="M7 12h1M12 8h1M17 15h1" /></>,
  'detective-game': <><circle cx="10" cy="10" r="5" /><path d="m14 14 5 5" /><path d="M8 10h4" /><path d="M10 8v4" /></>,
  'sports-manager': <><path d="M6 5h12v16H6z" /><path d="M9 9h6" /><path d="M9 13h6" /><path d="M9 17h3" /></>,
  'social-sim': <><circle cx="9" cy="10" r="3" /><circle cx="16" cy="9" r="2.5" /><path d="M4 20c1-4 3-6 6-6" /><path d="M13 14c3 0 5 2 6 6" /></>,

  space: <><path d="M13 4c3.7.8 6.2 3.3 7 7l-5 5-5-5z" /><circle cx="15" cy="9" r="1.5" /><path d="M9 12 5 16" /></>,
  fantasy: <><path d="M12 4 16 12l-4 8-4-8z" /><path d="M5 9l3 3-3 3" /><path d="M19 9l-3 3 3 3" /></>,
  cyberpunk: <><path d="M5 19V8h5v11" /><path d="M10 19V5h4v14" /><path d="M14 19v-8h5v8" /><path d="M7 11h1M12 8h1M16 14h1" /></>,
  school: <><path d="M4 8 12 4l8 4-8 4z" /><path d="M7 11v4c3 2 7 2 10 0v-4" /><path d="M20 8v5" /></>,
  zombie: <><path d="M7 20V9a5 5 0 0 1 10 0v11" /><path d="M9 12h.1M15 12h.1" /><path d="M10 17h4" /></>,
  detective: <><circle cx="11" cy="11" r="5" /><path d="m15 15 4 4" /><path d="M8 8h6" /><path d="M9 6h4" /></>,
  medieval: <><path d="M6 20V8h12v12" /><path d="M7 8V5h3v3h4V5h3v3" /><path d="M12 12v8" /></>,
  sport: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /><path d="M12 4c2 2 3 5 3 8s-1 6-3 8" /><path d="M12 4c-2 2-3 5-3 8s1 6 3 8" /></>,
  postapoc: <><circle cx="12" cy="12" r="3" /><path d="M12 4v5" /><path d="M12 15v5" /><path d="M4 12h5" /><path d="M15 12h5" /><path d="M6 6l3.5 3.5" /><path d="M14.5 14.5 18 18" /></>,
  military: <><path d="M12 4 19 8v5c0 4-3 6-7 7-4-1-7-3-7-7V8z" /><path d="M12 8v8" /><path d="M8 12h8" /></>,
  mythology: <><path d="M12 4c3 3 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9Z" /><path d="M9 20h6" /><path d="M10 12h4" /></>,
  underwater: <><path d="M4 14c3-4 6-4 9 0 3 3 5 3 7 0" /><path d="M4 18c3-3 6-3 9 0 3 2 5 2 7 0" /><circle cx="16" cy="7" r="2" /></>,
  pirates: <><path d="M5 9c4-4 10-4 14 0" /><path d="M7 9v8h10V9" /><path d="M10 13h4" /><path d="M12 11v4" /></>,
  kaiju: <><path d="M6 18c1-7 4-11 8-12 1 3 0 6-2 8 2 0 4 1 6 4" /><path d="M8 18h10" /><path d="M14 7l4-2" /></>,
  dreams: <><path d="M15 4a7 7 0 1 0 5 11 8 8 0 0 1-9-9 7 7 0 0 1 4-2Z" /><path d="m6 6 1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></>,
  office: <><path d="M5 20V6h14v14" /><path d="M8 10h2M14 10h2M8 14h2M14 14h2" /><path d="M10 20v-4h4v4" /></>,
  food: <><path d="M8 4v8" /><path d="M5 4v4a3 3 0 0 0 6 0V4" /><path d="M16 4v16" /><path d="M16 4c3 2 4 5 2 8h-2" /></>,
  music: <><path d="M9 18V6l9-2v12" /><circle cx="7" cy="18" r="2" /><circle cx="16" cy="16" r="2" /></>,
  'ai-revolt': <><rect x="6" y="7" width="12" height="10" rx="3" /><path d="M9 11h.1M15 11h.1" /><path d="M10 15h4" /><path d="M12 7V4" /><path d="M8 20h8" /></>,
  'time-travel': <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /><path d="M7 7 5 5v5h5" />
  </>,

  micro_pc: <><rect x="4" y="5" width="16" height="11" rx="2" /><path d="M9 20h6" /><path d="M8 9h3M8 12h5" /></>,
  pocket_play: <><rect x="8" y="3" width="8" height="18" rx="3" /><path d="M10 7h4" /><circle cx="12" cy="17" r="1" /></>,
  game_station: <><path d="M7 10h10a5 5 0 0 1 4 7 2.5 2.5 0 0 1-4-1l-.7-1H7.7L7 16a2.5 2.5 0 0 1-4 1 5 5 0 0 1 4-7Z" /><path d="M8 12v4M6 14h4" /><path d="M16 13h.1M18 15h.1" /></>,
  smart_game: <><rect x="4" y="6" width="16" height="10" rx="2" /><path d="M9 20h6" /><path d="M12 16v4" /><path d="M8 10h8" /></>,
};

function ItemIcon({ id, fallback }: { id: string; fallback: IconName }) {
  return <svg className="item-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{itemIconPaths[id] ?? iconPaths[fallback]}</svg>;
}

function roleIcon(role: string): IconName {
  if (role === 'Художник') return 'paint';
  if (role === 'Маркетолог') return 'megaphone';
  if (role === 'Дизайнер') return 'brain';
  if (role === 'Продюсер') return 'producer';
  if (role === 'Аналитик') return 'analyst';
  return 'code';
}

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [gameClosed, setGameClosed] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Ведутся технические работы. Возвращайтесь позже');
  const [momentumOpen, setMomentumOpen] = useState(false);
  const [studioNamingMode, setStudioNamingMode] = useState<'initial' | 'rename' | null>(null);
  const [taskOverrides, setTaskOverrides] = useState<TaskCatalogOverrides>({});

  useInterfaceSounds();

  useEffect(() => {
    const onClosed = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setMaintenanceMessage(detail?.message || 'Ведутся технические работы. Возвращайтесь позже');
      setGameClosed(true);
    };
    window.addEventListener('devstudio:game-closed', onClosed);
    return () => window.removeEventListener('devstudio:game-closed', onClosed);
  }, []);

  const refreshTaskOverrides = () => fetchTaskConfig().then(setTaskOverrides).catch(() => undefined);

  useEffect(() => {
    initTelegram();
    loadGame().then(setState);
    refreshTaskOverrides();
    const onVisibility = () => { if (!document.hidden) refreshTaskOverrides(); };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(refreshTaskOverrides, 60000);
    return () => { document.removeEventListener('visibilitychange', onVisibility); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!state) return;
    const timer = window.setTimeout(() => saveGame(state), 1200);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => setState((current) => (current ? tickProgress(ensureDailyState(current)) : current)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!state) return;
    if (!state.studioName.trim()) setStudioNamingMode((current) => current ?? 'initial');
  }, [state?.studioName]);

  const canRelease = Boolean(state?.selectedProject?.startedAt && state.selectedProject.progress >= 100);

  useEffect(() => {
  window.Telegram?.WebApp?.MainButton?.hide?.();
}, []);

  if (gameClosed) return <MaintenanceScreen message={maintenanceMessage} />;
  if (!state) return <div className="loading"><span>Загружаем студию…</span></div>;
  const update = (recipe: (current: GameState) => GameState) => setState((current) => {
    if (!current) return current;
    const nextState = recipe(ensureDailyState(current));
    window.setTimeout(() => saveGame(nextState), 0);
    return nextState;
  });
  const startNewProject = () => {
    haptic();
    update((current) => ({ ...current, screen: 'develop', selectedProject: createProject(false), tutorialDone: true, tutorialStep: 5 }));
  };

  return (
    <main className="app-shell">
      <TopBar state={state} onMomentumOpen={() => setMomentumOpen(true)} />
      <GuidedTutorialOverlay state={state} onSkip={() => update((current) => ({ ...current, tutorialDone: true }))} />
      <section className="screen-card">
        {state.screen === 'studio' && <StudioScreen state={state} onNewProject={startNewProject} update={update} taskOverrides={taskOverrides} />}
        {state.screen === 'develop' && <DevelopScreen state={state} update={update} />}
        {state.screen === 'hire' && <HireScreen state={state} update={update} />}
        {state.screen === 'research' && <ResearchScreen state={state} update={update} />}
        {state.screen === 'shop' && <ShopScreen state={state} update={update} onRenameStudio={() => setStudioNamingMode('rename')} />}
        {state.screen === 'menu' && <RatingScreen state={state} update={update} />}
      </section>

      <BottomNav state={state} update={update} />
      {!state.onboardingDone && <Onboarding update={update} />}
      {studioNamingMode && <StudioNamingModal mode={studioNamingMode} currentName={state.studioName} onCancel={studioNamingMode === 'rename' ? () => setStudioNamingMode(null) : undefined} onSubmit={(name) => { update((current) => ({ ...current, studioName: name })); setStudioNamingMode(null); }} />}
      {state.latestRelease && <ReleaseModal state={state} update={update} />}
      {momentumOpen && <MomentumInfoModal state={state} onClose={() => setMomentumOpen(false)} />}
      {state.selectedProject?.pendingDevEvent && <DevelopmentEventModal state={state} update={update} />}
      {!state.offerSeen && state.tutorialDone && state.gamesReleased >= 3 && <StarterOffer update={update} />}
    </main>
  );
}

function MaintenanceScreen({ message }: { message: string }) {
  return <main className="app-shell maintenance-shell"><section className="maintenance-card comic-card splash-panel"><div className="poster-art"><span className="burst burst-a">PATCH</span><span className="burst burst-b">DEV</span><i className="slash slash-a" /><i className="slash slash-b" /></div><div className="hero-copy"><p className="eyebrow">DevStudio Tycoon</p><h2>Ведутся технические работы</h2><p className="muted">{message || 'Возвращайтесь позже'}</p><p className="small muted">Мы обновляем игру, чтобы не ломать сохранения и экономику игроков.</p></div></section></main>;
}

function TopBar({ state, onMomentumOpen }: { state: GameState; onMomentumOpen: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  const xpPercent = Math.min(100, Math.round((state.studioXp / 1200) * 100));
  const dayElapsed = Math.max(0, Math.min(GAME_DAY_MS, now - state.lastGameTickAt));
  const dayPercent = Math.round((dayElapsed / GAME_DAY_MS) * 100);
  const secondsLeft = Math.max(0, Math.ceil((GAME_DAY_MS - dayElapsed) / 1000));
  const topbarDate = gameDateParts(state.gameDay);
  return (
    <header className="topbar comic-strip compact-topbar">
      <div className="brand-row compact-brand-row">
        <div className="studio-title-block">
          <p className="eyebrow">Игровая студия</p>
          <h1 className="studio-name" title={state.studioName || 'Новая студия'}>{state.studioName || 'Новая студия'}</h1>
        </div>
        <div className="topbar-meta">
          <span className="badge kaboom studio-level-badge">Lvl: {state.level}</span>
          <span className="badge kaboom date-badge compact-date-badge">
            <span>Г:{topbarDate.year}</span>
            <span>М:{topbarDate.month}</span>
            <span>Д:{topbarDate.day}</span>
            <span className="day-dial" style={{ '--day-progress': `${dayPercent}%` } as CSSProperties}>
              <b>{secondsLeft}</b>
              <small>сек</small>
            </span>
          </span>
        </div>
      </div>
      <div className="wallet compact-wallet">
        <span><Icon name="coin" /> {money(state.coins)}</span>
        <span><Icon name="rp" /> {money(state.rp)}</span>
        <span><Icon name="star" /> {state.stars}</span>
      </div>
      <button className="level-row momentum-button" type="button" onClick={onMomentumOpen} aria-label="Открыть объяснение импульса студии">
        <span>Импульс студии</span>
        <div className="xp"><i style={{ width: `${xpPercent}%` }} /></div>
      </button>
    </header>
  );
}

function MomentumInfoModal({ state, onClose }: { state: GameState; onClose: () => void }) {
  const momentumSpeed = momentumSpeedMultiplier(state);
  const momentumScore = momentumScoreBonus(state);
  const momentumRevenue = momentumRevenueMultiplier(state);
  return (
    <div className="modal-backdrop momentum-backdrop" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="momentum-title" className="dev-event-modal comic-card momentum-full-modal tone-opportunity" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" type="button" onClick={onClose} aria-label="Закрыть">×</button>
        <p className="eyebrow">Справка</p>
        <h2 id="momentum-title">Импульс студии</h2>
        <div className="momentum-copy"><p className="muted">Импульс растёт от количества и качества релизов.</p><p className="muted">Чем успешнее игры и чем стабильнее студия выпускает проекты, тем выше шкала.</p></div>
        <div className="momentum-stats">
          <span><b>Скорость</b><strong>×{momentumSpeed.toFixed(2)}</strong><em>макс. ×1.25</em></span>
          <span><b>Оценка</b><strong>+{momentumScore.toFixed(2)}</strong><em>макс. +0.20</em></span>
          <span><b>Доход</b><strong>×{momentumRevenue.toFixed(2)}</strong><em>макс. ×1.10</em></span>
        </div>
        <div className="momentum-copy compact"><p className="small muted">Импульс постепенно теряет ценность, если студия долго не выпускает сильные игры.</p><p className="small muted">Это не отдельная валюта, а показатель текущего темпа студии.</p></div>
      </section>
    </div>
  );
}

type TutorialGuideStep = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  target: boolean;
  placement?: 'top' | 'bottom';
  cta?: string;
};

const tutorialGuideCopy = {
  genre: {
    id: 'genre', eyebrow: 'Обучение · 1/5', title: 'Выбери жанр первой игры',
    body: 'Жанр задаёт сложность и ожидания игроков. Для первого релиза подойдёт любой базовый вариант — обучение безопасное.',
    target: true, placement: 'bottom', cta: 'Нажми на любой жанр',
  },
  theme: {
    id: 'theme', eyebrow: 'Обучение · 2/5', title: 'Добавь сеттинг',
    body: 'Сеттинг меняет вкус проекта. Позже «Продуктовое чутьё» покажет лучшие сочетания, а сейчас просто соберём первый релиз.',
    target: true, placement: 'bottom', cta: 'Нажми на любой сеттинг',
  },
  platform: {
    id: 'platform', eyebrow: 'Обучение · 3/5', title: 'Подтверди платформу',
    body: 'Платформа влияет на бюджет и продажи. Микро-ПК — самый спокойный старт, поэтому он уже выбран.',
    target: true, placement: 'top', cta: 'Нажми на платформу',
  },
  start: {
    id: 'start', eyebrow: 'Обучение · 4/5', title: 'Запусти разработку',
    body: 'Фокус можно оставить сбалансированным. Главное сейчас — увидеть полный цикл: старт, сборка, релиз и первые деньги.',
    target: true, placement: 'top', cta: 'Нажми «Начать разработку»',
  },
  wait: {
    id: 'wait', eyebrow: 'Сборка идёт', title: 'Команда делает игру',
    body: 'Туториальный проект короткий: обычно он доходит до релиза примерно за полминуты. Потом игра начнёт жить и приносить пассивный доход.',
    target: false, placement: 'top', cta: 'Дождись 100%',
  },
  release: {
    id: 'release', eyebrow: 'Обучение · 5/5', title: 'Выпусти игру',
    body: 'Релиз даёт монеты, науку и запускает срок жизни игры. После этого будет понятнее, зачем возвращаться: живые релизы продолжают зарабатывать.',
    target: true, placement: 'top', cta: 'Нажми «Релизнуть игру»',
  },
  developTab: {
    id: 'develop-tab', eyebrow: 'Вернёмся к игре', title: 'Открой разработку',
    body: 'Первый релиз начинается на экране разработки. Остальные разделы пригодятся после первой игры.',
    target: true, placement: 'bottom', cta: 'Нажми «Разработка»',
  },
} satisfies Record<string, TutorialGuideStep>;

function getTutorialGuideStep(state: GameState): TutorialGuideStep | null {
  if (!state.onboardingDone || state.tutorialDone || state.latestRelease || state.gamesReleased > 0 || state.releaseHistory.length > 0 || state.tutorialRewardClaimed) return null;
  if (!state.studioName.trim()) return null;
  if (state.screen !== 'develop') return tutorialGuideCopy.developTab;
  const project = state.selectedProject;
  if (!project) return tutorialGuideCopy.genre;
  if (!project.startedAt) {
    if (state.tutorialStep <= 0 || !project.genre) return tutorialGuideCopy.genre;
    if (state.tutorialStep <= 1 || !project.theme) return tutorialGuideCopy.theme;
    if (state.tutorialStep <= 2) return tutorialGuideCopy.platform;
    return tutorialGuideCopy.start;
  }
  if (project.progress >= 100) return tutorialGuideCopy.release;
  return tutorialGuideCopy.wait;
}

function GuidedTutorialOverlay({ state, onSkip }: { state: GameState; onSkip: () => void }) {
  const step = getTutorialGuideStep(state);

  useEffect(() => {
    if (!step) return;
    const target = step.target ? document.querySelector<HTMLElement>('.tutorial-target') : null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    const centerTarget = () => {
      if (!target) return;
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    };

    const guardClick = (event: Event) => {
      if (!step.target || !target) return;
      const element = event.target as HTMLElement | null;
      if (!element || target.contains(element) || element.closest('.guided-tutorial-card')) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const preventScroll = (event: Event) => {
      if (step.target) event.preventDefault();
    };

    centerTarget();
    const timers = [window.setTimeout(centerTarget, 120), window.setTimeout(centerTarget, 360), window.setTimeout(centerTarget, 720)];
    if (step.target) {
      document.addEventListener('click', guardClick, true);
      document.addEventListener('pointerdown', guardClick, true);
      document.addEventListener('touchstart', guardClick, true);
      document.addEventListener('wheel', preventScroll, { passive: false, capture: true });
      document.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
      window.setTimeout(() => {
        centerTarget();
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }, 180);
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener('click', guardClick, true);
      document.removeEventListener('pointerdown', guardClick, true);
      document.removeEventListener('touchstart', guardClick, true);
      document.removeEventListener('wheel', preventScroll, true);
      document.removeEventListener('touchmove', preventScroll, true);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [step?.id, step?.target]);

  if (!step) return null;
  return (
    <div className="guided-tutorial inline-focus-mode" aria-live="polite">
      <section className={`guided-tutorial-card comic-card ${step.placement === 'top' ? 'place-top' : 'place-bottom'}`}>
        <p className="eyebrow">{step.eyebrow}</p>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="guided-tutorial-footer">
          <span>{step.cta}</span>
          <button className="ghost" type="button" onClick={onSkip}>Пропустить</button>
        </div>
      </section>
    </div>
  );
}

function TutorialBanner({ state, onAction, onSkip }: { state: GameState; onAction: () => void; onSkip: () => void }) {
  void onAction;
  return <GuidedTutorialOverlay state={state} onSkip={onSkip} />;
}

function StudioScreen({ state, onNewProject, update, taskOverrides }: { state: GameState; onNewProject: () => void; update: (fn: (state: GameState) => GameState) => void; taskOverrides: TaskCatalogOverrides }) {
  const project = state.selectedProject;
  const dailyReady = state.dailyClaimedAt !== todayKey();
  const speed = speedMultiplier(state);
  const income = incomeMultiplier(state);
  const expenses = estimateWeeklyExpenses(state);
  const nextRentDay = 7 - (state.gameDay % 7 || 7);

  return (
    <div className="stack">
      <section className="studio-summary comic-card">
        <div>
          <p className="eyebrow">Студия</p>
          <h2>{state.studioName || 'Новая студия'}</h2>
          <p className="muted">Скорость ×{speed.toFixed(2)} · Доход ×{income.toFixed(2)} · Релизов: {state.gamesReleased}</p>
        </div>
        <div className="mini-ledger"><span>Слоты</span><b>{state.employees.length}/{employeeSlotsForLevel(state.level)}</b><span>Активные игры</span><b>{state.activeGames.length}</b></div>
      </section>

      <GameClock state={state} expenses={expenses.total} nextRentDay={nextRentDay} />
      <BankruptcyNotice state={state} />
      <StudioUpgradePanel state={state} update={update} />
      {state.level > 1 && <HireEntryCard state={state} update={update} />}
      <NewsPanel state={state} />
      <AudiencePanel state={state} update={update} />

      <div className="stats-grid">
        <Stat label="Лучший рейтинг" value={state.bestScore ? `${state.bestScore}/10` : '—'} icon="trophy" />
        <Stat label="Активные игры" value={`${state.activeGames.length}`} icon="chart" />
        <Stat label="Контент" value={`${state.unlockedGenreIds.length}/${genres.length}`} icon="gamepad" />
      </div>

      {dailyReady && <button className="daily-card comic-card" onClick={() => void claimBackendDailyReward()}><span>ЕЖЕДНЕВНЫЙ ВХОД</span> Забрать +1 ⭐ и +500 🪙</button>}
      <DailyTasks state={state} update={update} taskOverrides={taskOverrides} />
      <StudioGoals state={state} update={update} taskOverrides={taskOverrides} />
      <ActiveGames state={state} />
      <ReleaseArchive state={state} />
      <Ledger state={state} />
    </div>
  );
}


function HireEntryCard({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const slots = employeeSlotsForLevel(state.level);
  return (
    <section className="hire-entry-card comic-card">
      <div>
        <p className="eyebrow">Команда</p>
        <h3>Найм сотрудников</h3>
        <p className="muted">Открыто мест: {state.employees.length}/{slots}. Усиль скорость разработки и доход релизов.</p>
      </div>
      <button className="primary" onClick={() => update((current) => ({ ...current, screen: 'hire' }))}>Открыть найм</button>
    </section>
  );
}

function GameClock({ state, expenses, nextRentDay }: { state: GameState; expenses: number; nextRentDay: number }) {
  const gameDate = gameDateParts(state.gameDay);
  return (
    <section className="time-card comic-card">
      <div><p className="eyebrow">Игровое время</p><h3>Год {gameDate.year} · Месяц {gameDate.month} · День {gameDate.day}</h3><p className="small muted">1 игровой день ≈ 72 секунды</p></div>
      <div className="mini-ledger"><span>След. списание</span><b>{nextRentDay === 0 ? 'сегодня' : `${nextRentDay} дн.`}</b><span>Расход/нед.</span><b>🪙 {money(expenses)}</b></div>
    </section>
  );
}


function BankruptcyNotice({ state }: { state: GameState }) {
  if (state.coins >= 0 && state.unpaidSinceMonth === null && state.closureWarningMonth === null) return null;
  const month = gameMonthLabel(state.gameDay);
  const stage = state.closureWarningMonth !== null
    ? 'Команда уже ушла. Если долг сохранится ещё месяц, рейтинг будет обнулён.'
    : state.unpaidSinceMonth !== null
      ? `Зарплата не выплачивается с месяца ${state.unpaidSinceMonth + 1}. Текущий месяц: ${month}.`
      : 'Баланс отрицательный. Можно уйти до -50 000, но зарплаты под угрозой.';
  return <section className="bankruptcy-card comic-card"><p className="eyebrow">Финансовая тревога</p><h3>Студия в минусе: {money(state.coins)} 🪙</h3><p>{stage}</p></section>;
}

function StudioUpgradePanel({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const slots = employeeSlotsForLevel(state.level);
  const nextCost = nextStudioUpgradeCost(state.level);
  const nextSlots = employeeSlotsForLevel(state.level + 1);
  const canUpgrade = Boolean(nextCost && state.coins - nextCost >= -50000);
  return (
    <section className="studio-upgrade comic-card">
      <div className="section-head compact">
        <div><p className="eyebrow">Уровень студии</p><h3>Ур. {state.level}/4 · слоты команды {slots}</h3></div>
        <span className="pill">долгий рост</span>
      </div>
      <p className="muted">Прокачка покупается за монеты. Улучшение студии открывает новые слоты команды. Больше сотрудников повышают эффективность разработки и релизов, но расходы на студию тоже вырастут.</p>
      {nextCost ? <button className="primary wide" disabled={!canUpgrade} onClick={() => update(upgradeStudio)}>Улучшить до ур. {state.level + 1}: +{nextSlots - slots} слотов · {money(nextCost)} 🪙</button> : <button className="ghost wide" disabled>Максимальный уровень студии</button>}
    </section>
  );
}

function NewsPanel({ state }: { state: GameState }) {
  return (
    <section className="news-panel comic-card">
      <div className="section-head compact"><div><p className="eyebrow">Глобальный рынок</p><h3>Активные события</h3></div><span className="pill">влияют сейчас</span></div>
      {state.activeMarketEvents.length ? (
        <div className="market-events">
          {state.activeMarketEvents.map((event) => <article key={event.id} className={`market-event ${event.tone}`}><strong>{event.title}</strong><p>{event.description}</p><small>{event.daysRemaining} дн. · продажи ×{event.salesMultiplier.toFixed(2)} · оценки {event.scoreModifier > 0 ? '+' : ''}{event.scoreModifier.toFixed(2)}</small></article>)}
        </div>
      ) : <p className="muted">Активных глобальных событий нет. Это нормально: рынок спокоен, релизы зависят в основном от качества и интереса аудитории.</p>}
    </section>
  );
}

function AudiencePanel({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const revealed = isAudienceRevealed(state);
  const genre = genres.find((item) => item.id === state.audience.desiredGenreId);
  const theme = themes.find((item) => item.id === state.audience.desiredThemeId);
  const platform = platforms.find((item) => item.id === state.audience.desiredPlatformId);
  const scanCost = state.unlockedResearchIds.includes('market-analysis') ? 500 : 800;
  return (
    <section className="audience-card comic-card">
      <div className="section-head compact">
        <div><p className="eyebrow">Желания месяца</p><h3>Интересы аудитории</h3></div>
        <span className="pill">платный скан</span>
      </div>
      {revealed ? (
        <div className="audience-reveal">
          <p className="muted">Скан показывает текущие интересы рынка: жанр, сеттинг и платформу.</p>
          <div className="insight-tags"><span>{genre?.emoji} Жанр: {genre?.name}</span><span>{theme?.emoji} Сеттинг: {theme?.name}</span><span>{platform?.emoji} Платформа: {platform?.name}</span></div>
        </div>
      ) : (
        <div className="hidden-audience"><p className="muted">Интересы аудитории скрыты. Скан откроет жанр, сеттинг и платформу, которые сейчас сильнее интересуют игроков.</p><button disabled={state.coins < scanCost} onClick={() => update(revealAudience)}>Открыть за 🪙 {scanCost}</button></div>
      )}
    </section>
  );
}


function ReleaseArchive({ state }: { state: GameState }) {
  if (!state.releaseHistory.length) return <section className="panel comic-card empty-panel"><h3>Архив релизов</h3><p className="muted">После первых релизов здесь появится история всех выпущенных игр и их оценок.</p></section>;
  return <section className="panel comic-card"><div className="section-head compact"><h3>Архив релизов</h3><span className="pill">все оценки студии</span></div><div className="release-archive-list">{[...state.releaseHistory].reverse().map((entry, index) => <article className="release-archive-row" key={`${entry.title}-${entry.day}-${index}`}><div><strong>{entry.title}</strong><p>{genres.find((genre) => genre.id === entry.genre)?.name} · {themes.find((theme) => theme.id === entry.theme)?.name}</p></div><div className="archive-score-box"><b>{entry.score.toFixed(1)}</b><span>день {entry.day}</span></div></article>)}</div></section>;
}

function DailyTasks({ state, update, taskOverrides }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; taskOverrides: TaskCatalogOverrides }) {
  const tasks = buildDailyTasks(state, taskOverrides);
  const claim = (task: DailyTaskModel) => update((current) => {
    const key = getTaskKey(task.id);
    if (current.dailyTaskClaims[key] || task.current < task.target) return current;
    haptic('success');
    return applyTaskReward({ ...current, dailyTaskClaims: { ...current.dailyTaskClaims, [key]: true } }, task.reward);
  });
  return (
    <section className="panel daily-tasks comic-card">
      <div className="section-head"><div><p className="eyebrow">Ежедневные задачи</p><h3>Забери награды за активность</h3></div><span className="pill">сброс раз в 24 ч</span></div>
      {tasks.map((task) => {
        const key = getTaskKey(task.id);
        const claimed = Boolean(state.dailyTaskClaims[key]);
        const ready = task.current >= task.target && !claimed;
        const progress = taskProgressPercent(task.current, task.target);
        return <article className="task-card" key={task.id}><div><strong>{task.title}</strong><p>{task.desc}</p><ProgressBar value={progress} /></div><button disabled={!ready} onClick={() => claim(task)}>{claimed ? '✅' : ready ? rewardLabel(task.reward) : Math.min(Math.round(task.current), task.target) + '/' + task.target}</button></article>;
      })}
    </section>
  );
}

function StudioGoals({ state, update, taskOverrides }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; taskOverrides: TaskCatalogOverrides }) {
  const [open, setOpen] = useState(false);
  const goals = buildStudioGoals(state, taskOverrides);
  const visibleGoals = open ? goals : goals.slice(0, 3);
  const completed = goals.filter((goal) => (state.studioGoalClaims ?? {})[goal.id]).length;
  const claim = (goal: StudioGoalModel) => update((current) => {
    if ((current.studioGoalClaims ?? {})[goal.id] || goal.current < goal.target) return current;
    haptic('success');
    return applyTaskReward({ ...current, studioGoalClaims: { ...current.studioGoalClaims, [goal.id]: true } }, goal.reward);
  });
  if (!goals.length) return null;
  return (
    <section className="panel daily-tasks comic-card">
      <div className="section-head"><div><p className="eyebrow">Цели студии</p><h3>Долгий путь инди-команды</h3></div><button className="ghost" type="button" onClick={() => setOpen((value) => !value)}>{open ? 'Свернуть' : 'Показать все'}</button></div>
      {visibleGoals.map((goal) => {
        const claimed = Boolean((state.studioGoalClaims ?? {})[goal.id]);
        const ready = goal.current >= goal.target && !claimed;
        const progress = taskProgressPercent(goal.current, goal.target);
        return <article className="task-card" key={goal.id}><div><strong>{goal.title}</strong><p>{goal.desc}</p><ProgressBar value={progress} /></div><button disabled={!ready} onClick={() => claim(goal)}>{claimed ? '✅' : ready ? rewardLabel(goal.reward) : Math.min(Math.round(goal.current), goal.target) + '/' + goal.target}</button></article>;
      })}
      <p className="small muted">Готово: {completed}/{goals.length}</p>
    </section>
  );
}

function ActiveGames({ state }: { state: GameState }) {
  if (!state.activeGames.length) return <section className="panel comic-card empty-panel"><h3>Срок жизни игр</h3><p className="muted">После релиза игры будут жить 5–30 игровых дней, приносить пассивный доход и ловить события популярности.</p></section>;
  return (
    <section className="panel comic-card">
      <div className="section-head compact"><h3>Живые релизы</h3><span className="pill">пассивный доход</span></div>
      <div className="live-games">
        {state.activeGames.slice(0, 5).map((game) => (
          <article className="live-game" key={game.id}>
            <div><strong>{game.title}</strong><p>{game.lifeDaysRemaining}/{game.maxLifeDays} дн. · популярность ×{game.popularity.toFixed(2)}</p><small>{game.lastEvent}</small></div>
            <b>~{money(game.baseDailyIncome * game.popularity)} 🪙/день</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function Ledger({ state }: { state: GameState }) {
  if (!state.lastLedger.length) return null;
  return (
    <section className="panel comic-card">
      <div className="section-head compact"><h3>Финансовая лента</h3><span className="pill">последние события</span></div>
      {state.lastLedger.slice(-4).reverse().map((entry) => <div className={entry.kind === 'expense' ? 'ledger-row expense' : 'ledger-row'} key={entry.id}><span>День {entry.day}: {entry.title}</span><b>{entry.amount > 0 ? '+' : ''}{money(entry.amount)} 🪙</b></div>)}
    </section>
  );
}

function DevelopScreen({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const project = state.selectedProject ?? createProject(false);
  const hasChoices = Boolean(project.genre && project.theme && project.platform);
  const hasProductInstinct = isProductInstinctActive(state);
  const availableGenres = genres.filter((item) => state.unlockedGenreIds.includes(item.id));
  const availableThemes = themes.filter((item) => state.unlockedThemeIds.includes(item.id));
  const devCost = hasChoices ? estimateDevelopmentCost(project, state) : 0;
  const duration = estimateProjectDuration(project, state);
  const insight = hasProductInstinct ? projectInsight(project) : null;

  // One-time init: if no project is selected, create one. We only want this on mount,
  // so we intentionally omit `project` from deps to avoid re-creating on every render.
  // The functional update inside uses the latest state, so this is safe.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!state.selectedProject) update((current) => ({ ...current, selectedProject: createProject(false) })); }, []);

  if (project.startedAt) {
    return (
      <div className="stack develop-screen active-only">
        <ActiveDevelopmentPanel project={project} state={state} update={update} />
      </div>
    );
  }

  return (
    <div className="stack develop-screen">
      <div className="section-head hero-title"><div><p className="eyebrow">Новая игра</p><input className="project-name" value={project.name} maxLength={28} onChange={(event) => update((current) => ({ ...current, selectedProject: { ...(current.selectedProject ?? project), name: sanitizeProjectName(event.target.value) } }))} /></div></div>

      <ChoiceBlock title="1. Жанр" items={availableGenres} selected={project.genre} onSelect={(id) => update((current) => setProjectChoice(current, 'genre', id as GenreId))} tutorialTarget={!state.tutorialDone && state.tutorialStep <= 0} />
      <ChoiceBlock title="2. Сеттинг" items={availableThemes} selected={project.theme} onSelect={(id) => update((current) => setProjectChoice(current, 'theme', id as ThemeId))} itemHint={hasProductInstinct && project.genre ? (id) => comboFor(project.genre!, id as ThemeId) : undefined} hint={!hasProductInstinct ? 'Исследуй «Продуктовое чутьё», чтобы видеть комбо и фокус.' : undefined} tutorialTarget={!state.tutorialDone && state.tutorialStep === 1} />
      <ChoiceBlock title="3. Платформа" items={platforms.filter((item) => item.unlockLevel <= state.level || item.id === 'micro_pc')} selected={project.platform} onSelect={(id) => update((current) => setProjectChoice(current, 'platform', id as PlatformId))} tutorialTarget={!state.tutorialDone && state.tutorialStep === 2} />

      {hasChoices && <EconomyPreview state={state} project={project} devCost={devCost} duration={duration} />}
      {hasProductInstinct && insight ? <ProductInstinctPanel insight={insight} /> : <LockedInsight />}
      <AudiencePanel state={state} update={update} />
      <FocusEditor project={project} update={update} />

      <button className={!state.tutorialDone && state.tutorialStep >= 3 ? "release-button tutorial-target" : "release-button"} disabled={!hasChoices || state.coins - devCost < -50000} onClick={() => update(startProject)}>{state.coins - devCost < -50000 ? `Лимит долга: -50 000 🪙` : `Начать разработку · ${money(devCost)} 🪙`}</button>
    </div>
  );
}


function ActiveDevelopmentPanel({ project, state, update }: { project: Project; state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const [busyAction, setBusyAction] = useState<'skip' | 'promote' | null>(null);
  const backendReady = hasBackendSession();
  const canTrySkip = project.progress < 100 && !project.pendingDevEvent;
  const canTryPromote = project.progress >= 100 && !project.promotionUsed;

  const runBackendOrLocal = async (action: 'skip' | 'promote') => {
    if (busyAction) return;
    setBusyAction(action);
    try {
      if (backendReady) {
        const nextState = await runDevelopmentAction(action, {}, action === 'skip' ? 'time_skip' : 'promotion');
        if (nextState) {
          update(() => nextState);
          haptic('success');
          return;
        }
        haptic('warning');
      }

      if (action === 'skip') update(timeSkipProject);
      if (action === 'promote') update(promoteProject);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="panel active-dev comic-card solo-dev-card">
      <div className="section-head compact"><div><p className="eyebrow">Активная разработка</p><h3>{project.name}</h3></div></div>
      <div className="progress-fx active-progress-fx"><ProgressBar value={project.progress} label={`${Math.floor(project.progress)}%`} />{project.progress < 100 && <DevelopmentAmbientFx />}{project.progress < 100 && <DevelopmentTicker project={project} />}<DevPop project={project} />{project.devEventText?.startsWith('ПРОМО') && <PromotionBurst trigger={project.devEventId ?? 'promo'} />}</div>
      <div className="dev-tools-row">
        {project.progress >= 100 ? (
          <button className="primary" onClick={() => runBackendOrLocal('promote')} disabled={!canTryPromote || busyAction === 'promote' || (!backendReady && state.stars < 35)}>{project.promotionUsed ? `Продвижение +${(project.promotionBoost ?? 0).toFixed(1)}` : busyAction === 'promote' ? 'Открываем…' : 'Продвижение ⭐35'}</button>
        ) : (
          <span className="dev-status-pill">Идёт разработка</span>
        )}
        {project.progress < 100 && <button className="time-skip-button" disabled={!canTrySkip || busyAction === 'skip' || (!backendReady && state.stars < 15)} onClick={() => runBackendOrLocal('skip')}>{busyAction === 'skip' ? 'Открываем…' : backendReady && state.stars < 15 ? 'Ускорить через Telegram ⭐15' : 'Ускорить на 25% ⭐15'}</button>}
      </div>
      {project.devDecisionLog?.length ? <div className="decision-log">{project.devDecisionLog.map((item) => <span key={item}>{item}</span>)}</div> : null}
      {project.progress >= 100 && <button className={!state.tutorialDone && project.isTutorial ? 'release-button tutorial-target' : 'release-button'} onClick={() => update(releaseProject)}>Релизнуть игру</button>}
    </div>
  );
}

function EconomyPreview({ state, project, devCost, duration }: { state: GameState; project: Project; devCost: number; duration: number }) {
  const platform = platforms.find((item) => item.id === project.platform);
  const genre = genres.find((item) => item.id === project.genre);
  return (
    <section className="economy-preview comic-card">
      <div><p className="eyebrow">Бюджет проекта</p><h3>{money(devCost)} 🪙 · {Math.ceil(duration / 60)} мин.</h3><p className="muted">Сложность зависит от жанра, платформы, длительности и технологий.</p></div>
      <div className="mini-ledger"><span>Жанр</span><b>×{(genre?.difficulty ?? 1).toFixed(2)}</b><span>Тех</span><b>×{(platform?.techComplexity ?? 1).toFixed(2)}</b></div>
    </section>
  );
}

function ProductInstinctPanel({ insight }: { insight: NonNullable<ReturnType<typeof projectInsight>> }) {
  return (
    <section className={`product-instinct comic-card combo-${insight.combo.toLowerCase()}`}>
      <div className="section-head compact"><div><p className="eyebrow">Продуктовое чутьё</p><h3>Комбо: {comboLabel(insight.combo)}</h3></div><span className="pill">открыто</span></div>
      <p className="muted">{insight.note}</p>
      {(['pre', 'production', 'post'] as const).map((phase) => <div className="focus-hint" key={phase}><strong>{phase === 'pre' ? 'Идея и прототип' : phase === 'production' ? 'Сборка игры' : 'Полировка'}</strong><span>{prioritySentence(insight.recommendedFocus, phase)}</span></div>)}
    </section>
  );
}

function LockedInsight() {
  return <section className="locked-insight comic-card"><strong>🔒 Комбо и фокус скрыты</strong><p className="muted">Открой исследование «Продуктовое чутьё», чтобы видеть сочетания жанра/сеттинга и короткие приоритеты без точных процентов.</p></section>;
}

function FocusEditor({ project, update }: { project: Project; update: (fn: (state: GameState) => GameState) => void }) {
  return (
    <div className="panel comic-card">
      <div className="section-head compact"><h3>4. Фокус разработки</h3><span className="muted">100% на фазу</span></div>
      {(['pre', 'production', 'post'] as const).map((phase) => <div className="focus-card" key={phase}><strong>{phase === 'pre' ? 'Идея и прототип' : phase === 'production' ? 'Сборка игры' : 'Полировка'}</strong>{phaseLabels[phase].map((label, index) => <label key={label}><span>{label}</span><input type="range" min="0" max="100" value={project.focus[phase][index]} onChange={(event) => { const value = Number(event.target.value); update((current) => { const currentProject = current.selectedProject ?? project; return { ...current, tutorialStep: current.tutorialDone ? current.tutorialStep : Math.max(current.tutorialStep, 3), selectedProject: { ...currentProject, focus: { ...currentProject.focus, [phase]: normalizeFocus(currentProject.focus[phase], index, value) } } }; }); }} /><b>{project.focus[phase][index]}%</b></label>)}</div>)}
    </div>
  );
}

function ChoiceBlock({ title, items, selected, onSelect, hint, itemHint, tutorialTarget = false }: { title: string; items: Array<{ id: string; name: string; emoji: string }>; selected: string | null; onSelect: (id: string) => void; hint?: string; itemHint?: (id: string) => string; tutorialTarget?: boolean }) {
  return (
    <div className="panel comic-card">
      <div className="section-head compact"><h3>{title}</h3>{hint && <span className="muted small">{hint}</span>}</div>
      <div className="chips">{items.map((item) => { const hintValue = itemHint?.(item.id); const iconName: IconName = title.includes('Жанр') ? 'genre' : title.includes('Сеттинг') ? 'theme' : 'platform'; return <button key={item.id} className={`${selected === item.id ? 'chip selected' : 'chip'} ${hintValue ? `combo-${hintValue.toLowerCase()}` : ''}`} onClick={() => onSelect(item.id)}><ItemIcon id={item.id} fallback={iconName} /> <span>{item.name}</span>{hintValue && <em>{hintValue}</em>}</button>; })}</div>
    </div>
  );
}

function HireScreen({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const slots = employeeSlotsForLevel(state.level);
  const [poolOffset, setPoolOffset] = useState(0);
  const hiredIds = new Set(state.employees.map((employee) => employee.id));
  const freshCandidates = employeePool.filter((candidate) => !state.hiredEmployeeIds.includes(candidate.id) && !hiredIds.has(candidate.id));
  const comebackCandidates = employeePool.filter((candidate) => !hiredIds.has(candidate.id));
  const allCandidates = freshCandidates.length ? freshCandidates : comebackCandidates;
  const available = Array.from({ length: Math.min(4, Math.max(1, allCandidates.length)) }, (_, i) => allCandidates[(poolOffset + i) % allCandidates.length]).filter(Boolean);
  const hireDiscount = state.unlockedResearchIds.includes('junior-pipeline') ? 0.9 : 1;
  const canRefresh = state.stars >= 10 && allCandidates.length > 4;
  const hire = (employee: Employee) => update((current) => {
    const currentSlots = employeeSlotsForLevel(current.level);
    const cost = Math.round(employee.cost * hireDiscount);
    if (current.coins < cost || current.employees.length >= currentSlots) return current;
    haptic('success');
    return { ...current, coins: current.coins - cost, employees: [...current.employees, employee], hiredEmployeeIds: [...current.hiredEmployeeIds, employee.id] };
  });
  const refreshPool = () => {
    if (!canRefresh) { haptic('warning'); return; }
    update((current) => ({ ...current, stars: Math.max(0, current.stars - 10) }));
    setPoolOffset((value) => value + Math.max(1, Math.floor(allCandidates.length / 2)));
    haptic('success');
  };
  return (
    <div className="stack">
      <div className="section-head hero-title"><div><p className="eyebrow">Биржа талантов</p><h2>Команда студии</h2></div><span className="pill">{state.employees.length}/{slots} слотов</span></div>
      {slots === 0 && <section className="locked-insight comic-card"><strong>🔒 Найм закрыт на ур. 1</strong><p className="muted">Прокачай студию до ур. 2 за монеты, чтобы открыть первые 3 места в команде.</p></section>}
      {state.employees.length > 0 && <section className="panel comic-card"><div className="section-head compact"><h3>Нанятые сотрудники</h3><span className="pill">можно увольнять</span></div><div className="cards-list compact-list">{state.employees.map((employee) => <article className="employee-card hired comic-card" key={employee.id}><div className="avatar"><Icon name={roleIcon(employee.role)} /></div><div><h3>{employee.name}</h3><p className="muted">{employee.role} · ур. {employee.level} · {employee.specialization}</p><p className="small employee-metrics">{employeeMetrics(employee)}</p></div><button className="danger" onClick={() => update((current) => fireEmployee(current, employee.id))}>Уволить</button></article>)}</div></section>}
      <div className="cards-list">{available.map((employee) => { const cost = Math.round(employee.cost * hireDiscount); return <article className="employee-card comic-card" key={employee.id}><div className="avatar"><Icon name={roleIcon(employee.role)} /></div><div><h3>{employee.name}</h3><p className="muted">{employee.role} · ур. {employee.level} · {employee.specialization}</p><p className="small employee-metrics">{employeeMetrics(employee)}</p></div><button disabled={state.coins < cost || state.employees.length >= slots} onClick={() => hire(employee)}>🪙 {money(cost)}</button></article>; })}</div>
      <button className="ghost wide" disabled={!canRefresh} onClick={refreshPool}>Обновить кандидатов ⭐10{canRefresh ? '' : ' · недостаточно ⭐'}</button>
    </div>
  );
}

function formatProductInstinctTime(ms: number) {
  const safe = Math.max(0, Math.floor(ms));
  const days = Math.floor(safe / 86_400_000);
  const hours = Math.floor((safe % 86_400_000) / 3_600_000);
  if (days > 0) return days + ' д. ' + hours + ' ч.';
  const minutes = Math.max(1, Math.floor((safe % 3_600_000) / 60_000));
  return hours > 0 ? hours + ' ч. ' + minutes + ' мин.' : minutes + ' мин.';
}

function ResearchScreen({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const [productPending, setProductPending] = useState(false);
  const lockedGenres = genres.filter((item) => !state.unlockedGenreIds.includes(item.id));
  const lockedThemes = themes.filter((item) => !state.unlockedThemeIds.includes(item.id));
  const productInstinct = researchNodes.find((node) => node.id === 'product-instinct')!;
  const otherResearch = researchNodes.filter((node) => node.id !== 'product-instinct');
  const productActive = isProductInstinctActive(state);
  const productRemaining = productInstinctRemainingMs(state);
  const productStarCost = 199;
  const referralTarget = 10;
  const qualifiedReferrals = state.qualifiedReferrals ?? 0;
  const canUnlockByReferrals = qualifiedReferrals >= referralTarget;
  const canActivateProduct = !productActive && !productPending;
  const activateProductByReferrals = () => update((current) => {
    if ((current.qualifiedReferrals ?? 0) < referralTarget || isProductInstinctActive(current)) return current;
    haptic('success');
    return activateProductInstinct(current);
  });
  const activateProductByPayment = async () => {
    if (!canActivateProduct) return;
    setProductPending(true);
    try {
      const next = await purchaseShopItem('product_instinct');
      if (!next) {
        haptic('warning');
        window.Telegram?.WebApp?.showPopup?.({ message: 'Не удалось активировать Продуктовое чутьё. Попробуй ещё раз.', buttons: [{ type: 'ok' }] });
        return;
      }
      haptic('success');
      update(() => activateProductInstinct(next));
    } finally {
      setProductPending(false);
    }
  };
  const unlockRandomGenre = () => update((current) => { const locked = genres.filter((item) => !current.unlockedGenreIds.includes(item.id)); if (current.rp < 24 || locked.length === 0) return current; const genre = locked[randomIndex(locked.length)]; haptic('success'); return { ...current, rp: current.rp - 24, unlockedGenreIds: [...current.unlockedGenreIds, genre.id], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 }; });
  const unlockRandomTheme = () => update((current) => { const locked = themes.filter((item) => !current.unlockedThemeIds.includes(item.id)); if (current.rp < 22 || locked.length === 0) return current; const theme = locked[randomIndex(locked.length)]; haptic('success'); return { ...current, rp: current.rp - 22, unlockedThemeIds: [...current.unlockedThemeIds, theme.id], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 }; });
  return (
    <div className="stack">
      <div className="section-head hero-title"><div><p className="eyebrow">Лаборатория идей</p><h2>Исследования</h2></div><span className="pill">{state.unlockedResearchIds.length}/{researchNodes.length}</span></div>
      <article className={productActive ? 'research-node unlocked comic-card premium-research-card timed-product-instinct' : 'research-node comic-card premium-research-card timed-product-instinct'}>
        <div>
          <p className="eyebrow">Премиальный навык · 7 дней</p>
          <strong>{productActive ? '✅ ' : ''}{productInstinct.title}</strong>
          <span>{productInstinct.description}</span>
          <em>{productActive ? 'Активно ещё ' + formatProductInstinctTime(productRemaining) : '⭐ ' + productStarCost + ' или ' + referralTarget + ' друзей с релизом 6.5+ · сейчас ' + qualifiedReferrals + '/' + referralTarget}</em>
        </div>
        {productActive ? (
          <button className="primary" disabled>Активно</button>
        ) : canUnlockByReferrals ? (
          <button className="primary" disabled={productPending} onClick={activateProductByReferrals}>Активировать за друзей</button>
        ) : (
          <button className="primary" disabled={productPending} onClick={activateProductByPayment}>{productPending ? 'Активируем…' : 'Активировать за ⭐' + productStarCost}</button>
        )}
      </article>
      <div className="unlock-grid"><button className="unlock-card comic-card" disabled={state.rp < 24 || lockedGenres.length === 0} onClick={unlockRandomGenre}><strong><Icon name="genre" /> Новый случайный жанр</strong><span>{lockedGenres.length ? 'Осталось: ' + lockedGenres.length : 'Все жанры открыты'}</span><em>🧪 24</em></button><button className="unlock-card comic-card" disabled={state.rp < 22 || lockedThemes.length === 0} onClick={unlockRandomTheme}><strong><Icon name="theme" /> Новый случайный сеттинг</strong><span>{lockedThemes.length ? 'Осталось: ' + lockedThemes.length : 'Все сеттинги открыты'}</span><em>🧪 22</em></button></div>
      <div className="research-grid">{otherResearch.map((node) => { const unlocked = state.unlockedResearchIds.includes(node.id); const lockedByRequirement = node.requires ? !state.unlockedResearchIds.includes(node.requires) : false; return <button key={node.id} className={unlocked ? 'research-node unlocked comic-card' : 'research-node comic-card'} disabled={unlocked || lockedByRequirement || state.rp < node.cost} onClick={() => update((current) => { if (current.rp < node.cost || current.unlockedResearchIds.includes(node.id)) return current; haptic('success'); return { ...current, rp: current.rp - node.cost, unlockedResearchIds: [...current.unlockedResearchIds, node.id], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 }; })}><strong>{unlocked ? '✅ ' : ''}{node.title}</strong><span>{lockedByRequirement ? 'Сначала нужно предыдущее исследование.' : node.description}</span><em>{unlocked ? node.effect : '🧪 ' + node.cost}</em></button>; })}</div>
    </div>
  );
}

function ShopScreen({ state, update, onRenameStudio }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; onRenameStudio: () => void }) {
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string>('');
  const [purchaseResult, setPurchaseResult] = useState<{ title: string; reward: string } | null>(null);
  const renameCost = 15;
  const sku = [
    { id: 'starter_pack', title: 'Стартовый набор', desc: '5 000 монет и 50 очков науки для быстрого рывка', price: 79, reward: '+5 000 🪙 и +50 🧪' },
    { id: 'coins_5k', title: 'Набор монет', desc: '+5 000 монет', price: 39, reward: '+5 000 🪙' },
    { id: 'coins_25k', title: 'Большой набор монет', desc: '+25 000 монет', price: 149, reward: '+25 000 🪙' },
    { id: 'coins_100k', title: 'Мега-набор монет', desc: '+100 000 монет', price: 399, reward: '+100 000 🪙' },
    { id: 'research_boost', title: 'Ускорение науки', desc: '+50 очков исследований', price: 69, reward: '+50 🧪' },
  ] as const;

  const statusText = (status: string) => status === 'checking_balance'
    ? 'Проверяем игровой баланс ⭐…'
    : status === 'opening_invoice'
      ? 'Открываем оплату Telegram Stars…'
      : status === 'checking_payment'
        ? 'Проверяем оплату…'
        : status === 'credited'
          ? 'Начислено!'
          : status === 'cancelled'
            ? 'Оплата закрыта.'
            : status === 'failed'
              ? 'Покупку не удалось завершить.'
              : '';

  const buy = async (item: { id: string; title: string; reward: string }, after?: () => void) => {
    if (pendingItem) return;
    setPendingItem(item.id);
    setPurchaseStatus('checking_balance');
    try {
      const next = await purchaseShopItem(item.id, setPurchaseStatus);
      if (!next) {
        haptic('warning');
        return;
      }
      haptic('success');
      update(() => next);
      if (item.id === 'rename_studio') after?.();
      else setPurchaseResult({ title: item.title, reward: item.reward });
    } finally {
      window.setTimeout(() => { setPendingItem(null); setPurchaseStatus(''); }, 450);
    }
  };

  const renameItem = { id: 'rename_studio', title: 'Смена названия', reward: 'Можно выбрать новое имя студии' };

  return <div className="stack"><div className="section-head hero-title"><div><p className="eyebrow">Звёзды</p><h2>Магазин студии</h2></div><span className="pill">полезные улучшения</span></div><section className="shop-card comic-card shop-balance-card"><div><p className="eyebrow">Баланс звёзд</p><h3>{state.stars} ⭐</h3><p>Если звёзд хватает, покупка пройдёт сразу. Если нет — Telegram предложит оплатить покупку.</p></div><b>покупки через ⭐</b></section>{pendingItem && <section className="shop-card comic-card shop-status-panel"><div><h3>{statusText(purchaseStatus) || 'Обрабатываем покупку…'}</h3><p>Завершаем покупку. Пожалуйста, не закрывай окно оплаты.</p></div><b>⏳</b></section>}<article className="shop-card comic-card"><div><h3>Переименовать студию</h3><p>Сейчас: {state.studioName || 'Без названия'}. Позволяет выбрать новое имя для студии.</p></div><button disabled={Boolean(pendingItem)} onClick={() => buy(renameItem, onRenameStudio)}>{pendingItem === 'rename_studio' ? statusText(purchaseStatus) || '…' : `⭐${renameCost}`}</button></article><div className="shop-list">{sku.map((item) => <article className="shop-card comic-card" key={item.id}><div><h3>{item.title}</h3><p>{item.desc}</p></div><button disabled={Boolean(pendingItem)} onClick={() => buy(item)}>{pendingItem === item.id ? statusText(purchaseStatus) || '…' : `⭐${item.price}`}</button></article>)}</div>{purchaseResult && <div className="modal-backdrop"><section className="release-modal offer comic-card purchase-success-modal"><span className="badge">начислено</span><h2>{purchaseResult.title}</h2><p className="muted">На баланс добавлено: {purchaseResult.reward}</p><button className="primary wide" onClick={() => setPurchaseResult(null)}>Отлично</button></section></div>}</div>;
}

function maskTonWallet(address: string) {
  const clean = address.trim();
  if (clean.length <= 12) return clean;
  return clean.slice(0, 5) + '…' + clean.slice(-5);
}

function isLikelyTonWallet(address: string) {
  const clean = address.trim().replace(/\s+/g, '');
  return /^(?:EQ|UQ)[A-Za-z0-9_-]{46}$/.test(clean) || /^-?\d:[a-fA-F0-9]{64}$/.test(clean);
}

function tonWalletMessage(error?: 'invalid' | 'auth' | 'backend' | 'unknown') {
  if (error === 'invalid') return 'Проверь формат TON-адреса и попробуй ещё раз.';
  if (error === 'auth') return 'Не удалось подтвердить Telegram-сессию. Перезапусти игру из Telegram.';
  if (error === 'backend') return 'Не удалось сохранить кошелёк. Попробуй после обновления сервера.';
  return 'Не удалось сохранить кошелёк. Попробуй ещё раз.';
}

function TonWalletPanel() {
  const [wallet, setWallet] = useState('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    getTonWallet().then((address) => {
      if (!active) return;
      setWallet(address || '');
      setStatus('idle');
    }).catch(() => {
      if (!active) return;
      setStatus('idle');
    });
    return () => { active = false; };
  }, []);

  const cleanInput = input.trim().replace(/\s+/g, '');
  const canBind = Boolean(cleanInput) && isLikelyTonWallet(cleanInput) && status !== 'saving';

  const bind = async () => {
    if (!canBind) return;
    setStatus('saving');
    setMessage('');
    const result = await saveTonWallet(cleanInput);
    if (!result.ok || !result.address) {
      haptic('warning');
      setStatus('error');
      setMessage(tonWalletMessage(result.error));
      return;
    }
    haptic('success');
    setWallet(result.address);
    setInput('');
    setStatus('saved');
    setMessage('Кошелёк привязан. Он будет использоваться для еженедельных наград.');
  };

  const unlink = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    setMessage('');
    const ok = await unlinkTonWallet();
    if (!ok) {
      haptic('warning');
      setStatus('error');
      setMessage('Не удалось отвязать кошелёк. Попробуй ещё раз.');
      return;
    }
    haptic('success');
    setWallet('');
    setInput('');
    setStatus('idle');
    setMessage('Кошелёк отвязан.');
  };

  return <section className="panel comic-card ton-wallet-card"><div className="section-head compact"><div><p className="eyebrow">TON-кошелёк</p><h3>Кошелёк для наград</h3></div><span className="pill">еженедельный топ-5</span></div><p className="muted">Привяжи TON-кошелёк, чтобы получать вознаграждения за место в еженедельном топ-5.</p>{wallet ? <div className="ton-wallet-bound"><div><span>Привязан</span><strong>{maskTonWallet(wallet)}</strong></div><button className="ghost" disabled={status === 'saving'} onClick={unlink}>{status === 'saving' ? 'Отвязываем…' : 'Отвязать'}</button></div> : <div className="ton-wallet-form"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Вставь адрес TON-кошелька" inputMode="text" autoComplete="off" /><button className="primary" disabled={!canBind} onClick={bind}>{status === 'saving' ? 'Сохраняем…' : 'Привязать'}</button></div>}{message && <p className={status === 'error' ? 'small danger-text' : 'small muted'}>{message}</p>}{!wallet && cleanInput && !isLikelyTonWallet(cleanInput) && <p className="small muted">Адрес должен быть в формате TON, например начинаться с EQ или UQ.</p>}</section>;
}

function RatingScreen({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const rating = weeklyRatingBreakdown(state);
  const [leaderboard, setLeaderboard] = useState<RealLeaderboardRow[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const myTelegramId = currentTelegramId();

  useEffect(() => {
    let cancelled = false;
    setLeaderboardLoaded(false);
    fetchRealLeaderboard().then((rows) => {
      if (cancelled) return;
      setLeaderboard(rows);
      setLeaderboardLoaded(true);
    });
    return () => { cancelled = true; };
  }, [state.gamesReleased, state.latestRelease?.createdAt]);

  const yourIndex = leaderboard.findIndex((row) => myTelegramId && String(row.telegramId) === myTelegramId);
  const yourPlace = yourIndex >= 0 ? yourIndex + 1 : null;
  const currentPrize = yourIndex >= 0 ? leaderboard[yourIndex]?.prize?.[0] ?? prizeDistribution[yourIndex]?.[0] : null;
  const directRefs = state.qualifiedReferrals ?? 0;
  const secondRefs = state.qualifiedSecondLevelReferrals ?? 0;
  const claimMilestone = (id: string) => update((current) => {
    const milestone = REFERRAL_MILESTONES.find((item) => item.id === id);
    if (!milestone || current.referralMilestoneClaims?.[id] || (current.qualifiedReferrals ?? 0) < milestone.target) return current;
    haptic('success');
    return {
      ...current,
      coins: current.coins + milestone.reward.coins,
      rp: current.rp + milestone.reward.rp,
      referralMilestoneClaims: { ...(current.referralMilestoneClaims ?? {}), [id]: true },
    };
  });
  return <div className="stack">
    <section className="rating-hero comic-panel"><p className="eyebrow">Недельный топ-10</p><h2>Рейтинг лучших игр за неделю</h2><p className="muted">В топ попадают только реальные backend-релизы из trusted_releases. Один игрок может занимать только одну позицию.</p></section>
    <div className="panel comic-card current-prize-card"><div><p className="eyebrow">Текущая награда</p><h3>{yourPlace ? `Ты на #${yourPlace}` : 'Пока вне топ-10'}</h3><p className="muted">{currentPrize ? `Если неделя закончится сейчас, твоя награда — ${currentPrize}.` : 'Выпусти сильный релиз, чтобы попасть в призовую десятку.'}</p></div><strong>{currentPrize ?? '$0'}</strong></div>
    <section className="panel comic-card rating-formula"><div className="section-head compact"><h3>Как считается рейтинг</h3><span className="pill">{money(rating.total)}</span></div><p className="muted">Локальная формула ниже показывает ориентир по твоей студии. Призовой топ берётся с backend и считается только по проверенным релизам.</p><div className="score-breakdown-list">{rating.items.map(([label, value]) => <div className={value >= 0 ? 'score-line bonus' : 'score-line penalty'} key={label}><span>{label}</span><b>{value >= 0 ? '+' : ''}{money(value)}</b></div>)}</div></section>
    <div className="panel comic-card"><div className="section-head compact"><h3>Призовой фонд $500</h3><span className="pill">только топ-10</span></div><div className="prize-grid">{prizeDistribution.map(([amount, percent], index) => <div className={yourIndex === index ? 'prize-cell current' : 'prize-cell'} key={`${amount}-${index}`}><span>#{index + 1}</span><strong>{amount}</strong><em>{percent}</em></div>)}</div></div>
    <div className="panel comic-card"><h3>Лучшие игры недели</h3>{leaderboardLoaded && leaderboard.length === 0 ? <p className="muted">Реальных релизов в рейтинге пока нет. Первые строки появятся после проверенных backend-релизов.</p> : null}{!leaderboardLoaded ? <p className="muted">Загружаем реальный рейтинг…</p> : null}{leaderboard.map((row, index) => { const isYou = myTelegramId && String(row.telegramId) === myTelegramId; return <div className={isYou ? 'leader-row you' : 'leader-row'} key={row.telegramId || row.displayName || index}><span>#{index + 1}</span><div><strong>{row.bestTitle || 'Релиз'}</strong><p>{isYou ? 'Ты' : row.displayName || 'Игрок'}</p></div><b>{money(Number(row.score || 0))}</b></div>; })}</div>
    <section className="panel comic-card referral-panel"><div className="section-head compact"><div><p className="eyebrow">Партнёрская программа</p><h3>2 уровня приглашений</h3></div><span className="pill">доход от друзей</span></div><p className="muted">Приглашай друзей и получай долю от их покупок. В зачёт идут только активные студии: друг должен пройти старт, выпустить игру и получить оценку 6.5 или выше.</p><div className="referral-grid"><article><b>1 уровень</b><strong>{directRefs}</strong><span>10% от покупок приглашённых друзей</span></article><article><b>2 уровень</b><strong>{secondRefs}</strong><span>3% от покупок друзей твоих друзей</span></article></div><div className="referral-note"><strong>Как засчитывается друг</strong><span>Нужен завершённый релиз с оценкой 6.5+ — такие друзья помогают открывать «Продуктовое чутьё» и продвигают тебя к разовым наградам.</span></div><div className="milestone-list">{REFERRAL_MILESTONES.map((item) => { const claimed = Boolean(state.referralMilestoneClaims?.[item.id]); const ready = directRefs >= item.target; return <button key={item.id} className={claimed ? 'milestone claimed' : 'milestone'} disabled={!ready || claimed} onClick={() => claimMilestone(item.id)}><span>{item.label}</span><b>{claimed ? 'Получено' : `+${money(item.reward.coins)} 🪙 +${item.reward.rp} 🧪`}</b></button>; })}</div></section>
    <button className="primary wide" onClick={() => shareRelease(`Заходи в DevStudio Tycoon и запускай свои хиты вместе со мной!`, { url: 'https://t.me/devstudio_bot?start=ref_demo', imageUrl: undefined, storyText: 'DevStudio Tycoon — приглашаю в студию!' })}>Поделиться реферальной ссылкой</button>
  </div>;
}


function formatDevChoiceEffect(choice: DevEventChoice) {
  const effect = choice.effect;
  const parts: string[] = [];
  if (effect.coins) parts.push(effect.coins < 0 ? `стоит ${money(Math.abs(effect.coins))} монет` : `+${money(effect.coins)} монет`);
  if (effect.stars) parts.push(effect.stars < 0 ? `стоит ${Math.abs(effect.stars)} ⭐` : `+${effect.stars} ⭐`);
  if (effect.rp) parts.push(effect.rp < 0 ? `-${Math.abs(effect.rp)} очков науки` : `+${effect.rp} очков науки`);
  if (effect.progress) parts.push(effect.progress < 0 ? `${effect.progress}% прогресса` : `+${effect.progress}% прогресса`);
  if (effect.score) parts.push(effect.score < 0 ? `${effect.score.toFixed(2)} к оценке` : `+${effect.score.toFixed(2)} к оценке`);
  if (effect.salesMultiplier && effect.salesMultiplier !== 1) parts.push(effect.salesMultiplier > 1 ? `доход ×${effect.salesMultiplier.toFixed(2)}` : `доход ×${effect.salesMultiplier.toFixed(2)}`);
  return parts.length ? parts.join(' · ') : 'без числового эффекта';
}

function lockedDevChoiceReason(state: GameState, choice: DevEventChoice) {
  const effect = choice.effect;
  if ((effect.stars ?? 0) < 0 && state.stars < Math.abs(effect.stars ?? 0)) return `не хватает ${Math.abs(effect.stars ?? 0)} ⭐`;
  if ((effect.rp ?? 0) < 0 && state.rp < Math.abs(effect.rp ?? 0)) return `не хватает ${Math.abs(effect.rp ?? 0)} очков науки`;
  if ((effect.coins ?? 0) < 0 && state.coins + (effect.coins ?? 0) < -50000) return 'превысит лимит долга −50 000 монет';
  return null;
}

function DevelopmentEventModal({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const pending = state.selectedProject?.pendingDevEvent;
  const scenario = pending ? getDevelopmentScenario(pending.scenarioId) : null;
  if (!pending || !scenario) return null;
  return (
    <div className="modal-backdrop dev-event-backdrop">
      <section role="dialog" aria-modal="true" aria-labelledby="dev-event-title" className={`dev-event-modal comic-card tone-${scenario.tone}`}>
        <p className="eyebrow">Событие разработки · пауза на {Math.floor(pending.triggeredAtProgress)}%</p>
        <h2 id="dev-event-title">{scenario.title}</h2>
        <p className="muted">{scenario.body}</p>
        <div className="dev-event-choices">
          {scenario.choices.map((choice, index) => {
            const rawLocks = scenario.choices.map((item) => lockedDevChoiceReason(state, item));
            const lockedReason = rawLocks.every(Boolean) && index === 0 ? null : rawLocks[index];
            return (
              <button key={choice.id} disabled={Boolean(lockedReason)} className={lockedReason ? 'choice-locked' : ''} onClick={() => update((current) => resolveDevelopmentEvent(current, choice.id))}>
                <strong>{choice.label}</strong>
                <span>{choice.result}</span>
                <em>{lockedReason ? `Заблокировано: ${lockedReason}` : formatDevChoiceEffect(choice)}</em>
              </button>
            );
          })}
        </div>
        <p className="small muted">Разработка продолжится только после выбора. Перед выбором видно, что именно изменится у проекта и ресурсов.</p>
      </section>
    </div>
  );
}

function criticToneClass(score: number) {
  if (score >= 9) return 'critic-score-luxury';
  if (score >= 6.5) return 'critic-score-good';
  if (score >= 5) return 'critic-score-mid';
  if (score >= 3.1) return 'critic-score-low';
  return 'critic-score-bad';
}

function ReleaseModal({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const result = state.latestRelease!;
  const [step, setStep] = useState(0);
  const [selectedBreakdown, setSelectedBreakdown] = useState<ScoreBreakdownItem | null>(null);
  const finalStep = result.critics.length + 2;

  useEffect(() => {
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    setStep(0);
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= finalStep) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 850);
    return () => window.clearInterval(timer);
  }, [finalStep, result.createdAt]);

  const showFinal = step >= result.critics.length + 1;
  const showMoney = step >= finalStep;

  return (
    <div className="modal-backdrop release-backdrop">
      <section className="release-modal comic-card animated-release" role="dialog" aria-modal="true" aria-labelledby="release-title">
        <p className="eyebrow">Релиз состоялся</p>
        <h2 id="release-title">{result.projectName}</h2>
        <div className={`release-score-top ${showFinal ? criticToneClass(result.score) : ''}`}>
          {showFinal ? (
            <div className="score-stage">
              <ConfettiBurst />
              <strong className="big-score">{result.score}/10</strong>
              <span className="quality">{result.qualityLabel} · Комбо: {comboLabel(result.combo)}</span>
              <span className="critic-average-note">Средняя оценка изданий: {result.criticAverage}/10. Итоговая оценка игры считается отдельно и учитывает модификаторы ниже.</span>
            </div>
          ) : (
            <div className="score-suspense">Издания готовят оценки…</div>
          )}
        </div>
        <div className="critic-grid animated-critics release-critic-grid-2x2">
          {result.critics.map((critic, index) => (
            <div className={`${step > index ? 'critic-card shown' : 'critic-card'} ${step > index ? criticToneClass(critic.score) : ''}`} key={critic.name}>
              <span>{critic.name}</span>
              <b>{step > index ? critic.score : '…'}</b>
              <em>{step > index ? critic.quote : 'читают билд'}</em>
            </div>
          ))}
        </div>

        {showMoney && (
          <>
            <div className="score-breakdown">
              <div className="section-head compact"><h3>Как сложилась итоговая оценка</h3><span className="pill">итог {result.score}/10</span></div>
              <p>Карточки изданий выше — это отдельные оценки прессы. Итоговая оценка релиза не равна их среднему арифметическому: она считается из базового качества проекта и модификаторов ниже.</p>
              <div className="score-breakdown-list">
                                {result.scoreBreakdown.map((item) => {
                  const displayLabel = item.label === `Комбо ${result.combo}` ? `Комбо: ${comboLabel(result.combo)}` : item.label;
                  const info = scoreExplanation(item);
                  const influenceLabel = info.tone === 'high' ? 'Сильное влияние игрока' : info.tone === 'medium' ? 'Косвенное влияние игрока' : 'Не зависит от игрока';
                  return (
                    <details className={`score-line-details ${item.kind}`} key={`${item.label}-${item.value}`}> 
                      <summary className={`score-line ${item.kind}`}> 
                        <span>{displayLabel}</span>
                        <b>{item.kind === 'base' ? item.value.toFixed(2) : scoreDelta(item.value)}</b>
                        <span className="score-line-info" aria-hidden="true">?</span>
                      </summary>
                      <div className="score-inline-help">
                        <strong>{info.title}</strong>
                        <p>{info.text}</p>
                        <em className={'score-help-influence influence-' + info.tone}>{influenceLabel}</em>
                        <p>{info.influence}</p>
                        <small>{info.signText}</small>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
            <div className="reward-row">
              <span>+{money(result.sales)} 🪙 сразу</span>
              <span>+{result.rp} 🧪</span>
              {Boolean(result.stars) && <span>+{result.stars} ⭐</span>}
            </div>
            <div className="life-result">
              <b>Срок жизни: {result.lifetimeDays} игровых дней</b>
              <p>Прогноз пассивного дохода: ~{money(result.passivePerDay)} 🪙/день, популярность может расти или падать событиями.</p>
            </div>
            {Boolean(result.bonusRewards?.length) && <div className="bonus-list">{result.bonusRewards?.map((item) => <span key={item}>{item}</span>)}</div>}
            <div className="inline-actions release-actions">
              {result.score >= 8.5 && <button className="primary" onClick={() => shareRelease(`Моя игра ${result.projectName} получила ${result.score}/10!`, { url: 'https://t.me/DevTycoon_bot?startapp=share_release', imageUrl: undefined, storyText: `${result.projectName}: ${result.score}/10` })}>Поделиться</button>}
              <button onClick={() => update((current) => ({ ...current, latestRelease: null, screen: 'develop', selectedProject: createProject(false) }))}>Следующая игра</button>
              <button className="ghost" onClick={() => update((current) => ({ ...current, latestRelease: null }))}>Закрыть</button>
            </div>
          </>
        )}
      </section>
        {selectedBreakdown && <ScoreExplanationModal item={selectedBreakdown} onClose={() => setSelectedBreakdown(null)} />}
    </div>
  );
}


function scoreExplanation(item: ScoreBreakdownItem) {
  const label = item.label;
  const isPositive = item.value > 0;
  const signText = item.kind === 'base'
    ? 'Это основа оценки.'
    : isPositive
      ? 'Сейчас этот фактор помогает релизу.'
      : item.value < 0
        ? 'Сейчас этот фактор снижает оценку.'
        : 'Сейчас этот фактор почти нейтрален.';

  const details: Record<string, { text: string; influence: string; tone: 'high' | 'medium' | 'none' }> = {
    'Фокус разработки': { text: 'Показывает, насколько хорошо распределён фокус между этапами разработки под выбранный проект.', influence: 'Ваши решения сильно влияют на этот модификатор.', tone: 'high' },
    'Чеклист тестирования': { text: 'Бонус за процессы контроля качества: меньше багов, стабильнее релиз.', influence: 'Вы можете влиять на него через исследования и развитие студии.', tone: 'medium' },
    'Ощущение от игры': { text: 'Отвечает за отзывчивость, темп, анимации и общее чувство управления.', influence: 'Вы можете влиять на него через исследования и фокус разработки.', tone: 'medium' },
    'Звуковая лаборатория': { text: 'Учитывает качество звука, музыки и атмосферы, которую они создают.', influence: 'Вы можете влиять на него через исследования.', tone: 'medium' },
    'Продвижение': { text: 'Показывает эффект маркетингового продвижения перед релизом.', influence: 'Ваше решение напрямую влияет на этот модификатор.', tone: 'high' },
    'Решения разработки': { text: 'Сумма последствий событий, которые случились во время разработки.', influence: 'Ваши решения во время событий напрямую влияют на этот модификатор.', tone: 'high' },
    'Импульс студии': { text: 'Отражает общий темп студии: прошлые релизы, опыт и накопленную динамику.', influence: 'Вы влияете на него постепенно через регулярные и сильные релизы.', tone: 'medium' },
    'Настроение аудитории': { text: 'Показывает, насколько текущая аудитория готова тепло принять такой проект.', influence: 'Вы можете влиять на него косвенно через выбор жанра, сеттинга и скан аудитории.', tone: 'medium' },
    'События рынка': { text: 'Внешние рыночные события, которые временно помогают или мешают релизам.', influence: 'Этот модификатор не зависит от ваших решений.', tone: 'none' },
    'Сложность технологий': { text: 'Штраф или риск за сложность выбранной платформы, жанра и технологий проекта.', influence: 'Вы влияете на него выбором проекта и подготовкой студии.', tone: 'medium' },
    'Непредсказуемость прессы': { text: 'Небольшая случайность, чтобы оценки не были полностью одинаковыми и предсказуемыми.', influence: 'Этот модификатор не зависит от ваших решений.', tone: 'none' },
  };

  if (label.startsWith('Комбо')) {
    return { title: 'Комбо жанра и сеттинга', text: 'Показывает, насколько хорошо выбранные жанр и сеттинг подходят друг другу.', influence: 'Ваш выбор напрямую влияет на этот модификатор.', tone: 'high' as const, signText };
  }

  const fallback = item.kind === 'random'
    ? { text: 'Случайная реакция мира, прессы и виртуальных игроков.', influence: 'Этот модификатор не зависит от ваших решений.', tone: 'none' as const }
    : { text: 'Один из факторов, из которых складывается итоговая оценка релиза.', influence: 'Обычно на него можно влиять через выборы, исследования или развитие студии.', tone: 'medium' as const };
  const picked = details[label] ?? fallback;
  return { title: label, ...picked, signText };
}

function ScoreExplanationModal({ item, onClose }: { item: ScoreBreakdownItem; onClose: () => void }) {
  const info = scoreExplanation(item);
  const influenceLabel = info.tone === 'high' ? 'Сильное влияние игрока' : info.tone === 'medium' ? 'Косвенное влияние игрока' : 'Не зависит от игрока';
  return (
    <div className="nested-modal-backdrop score-help-backdrop" onClick={onClose}>
      <section className="score-help-modal comic-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" type="button" onClick={onClose} aria-label="Закрыть">×</button>
        <p className="eyebrow">Детализация оценки</p>
        <h3>{info.title}</h3>
        <div className={'score-help-influence influence-' + info.tone}>{influenceLabel}</div>
        <p>{info.text}</p>
        <p className="score-help-player-note">{info.influence}</p>
        <div className="score-help-value"><span>Текущий вклад</span><b>{item.kind === 'base' ? item.value.toFixed(2) : scoreDelta(item.value)}</b></div>
        <p className="small muted">{info.signText}</p>
        <button className="primary wide" type="button" onClick={onClose}>Понятно</button>
      </section>
    </div>
  );
}

const confettiPieces = [
  [-6, -8, -92, -58, -28, 0], [10, -10, 84, -64, 34, 1], [0, -6, -18, -86, 12, 2],
  [-18, 0, -112, -18, -52, 3], [18, 1, 112, -20, 58, 4], [-12, 7, -68, 48, 92, 5],
  [12, 7, 72, 50, -86, 6], [3, 8, 24, 74, 48, 7], [-3, 6, -26, 72, -48, 8],
  [-22, -7, -128, -78, 18, 9], [22, -7, 128, -78, -18, 10], [0, -12, 0, -112, 0, 11],
  [-15, 12, -108, 86, 110, 12], [15, 12, 108, 86, -110, 13], [-6, 15, -38, 110, 36, 14],
  [6, 15, 42, 110, -36, 15], [-25, 8, -142, 28, 76, 16], [25, 8, 142, 28, -76, 17],
] as const;

function ConfettiBurst() {
  return (
    <div className="confetti-burst" aria-hidden="true">
      {confettiPieces.map(([x, y, tx, ty, rotate, index]) => (
        <span
          key={index}
          className={`confetti-piece c${index % 5}`}
          style={{
            '--x': `${x}px`,
            '--y': `${y}px`,
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            '--r': `${rotate}deg`,
            '--d': `${index * 22}ms`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function StarterOffer({ update }: { update: (fn: (state: GameState) => GameState) => void }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('');
  const statusText = status === 'checking_balance'
    ? 'Проверяем баланс ⭐…'
    : status === 'opening_invoice'
      ? 'Открываем оплату Telegram Stars…'
      : status === 'checking_payment'
        ? 'Проверяем оплату…'
        : status === 'credited'
          ? 'Начислено!'
          : status === 'cancelled'
            ? 'Оплата закрыта.'
            : status === 'failed'
              ? 'Покупку не удалось завершить.'
              : '';
  const buy = async () => {
    if (pending) return;
    setPending(true);
    setStatus('checking_balance');
    try {
      const next = await purchaseShopItem('starter_pack', setStatus);
      if (!next) {
        haptic('warning');
        return;
      }
      haptic('success');
      update(() => next);
    } finally {
      window.setTimeout(() => setPending(false), 450);
    }
  };
  return <div className="modal-backdrop"><section className="release-modal offer comic-card"><span className="badge">одноразово</span><h2>Стартовый набор для быстрого рывка</h2><p className="muted">+5 000 монет и +50 очков науки для уверенного старта. Подходит, чтобы быстрее стартовать и открыть первые улучшения.</p>{statusText && <p className="shop-payment-status">{statusText}</p>}<div className="inline-actions"><button className="primary" disabled={pending} onClick={buy}>{pending ? statusText || 'Открываем…' : 'Купить ⭐79'}</button><button className="ghost" disabled={pending} onClick={() => update((current) => ({ ...current, offerSeen: true }))}>Не сейчас</button></div></section></div>;
}

function Onboarding({ update }: { update: (fn: (state: GameState) => GameState) => void }) {
  const [slide, setSlide] = useState(0);
  const slides: Array<[IconName, string, string, string]> = [
    ['rocket', 'Сделаем первую игру за минуту', 'Ты выберешь жанр, сеттинг и платформу, запустишь разработку и выпустишь первый релиз.', 'Показать, куда нажимать'],
    ['clock', 'Зачем возвращаться', 'После релиза игра живёт несколько игровых дней, приносит пассивный доход и может ловить события популярности.', 'Начать обучение'],
  ];
  const current = slides[slide];
  const finish = () => update((currentState) => ({
    ...currentState,
    onboardingDone: true,
    tutorialDone: false,
    tutorialStep: 0,
    screen: 'develop',
    selectedProject: currentState.selectedProject ?? createProject(true),
  }));
  return (
    <div className="modal-backdrop onboarding guided-onboarding">
      <section className="onboarding-card comic-card">
        <div className="onboarding-emoji"><Icon name={current[0]} /></div>
        <p className="eyebrow">Быстрый старт</p>
        <h2>{current[1]}</h2>
        <p>{current[2]}</p>
        <div className="dots">{slides.map((_, index) => <i key={index} className={index === slide ? 'active' : ''} />)}</div>
        <button className="primary wide" onClick={() => { if (slide < slides.length - 1) setSlide(slide + 1); else finish(); }}>{current[3]}</button>
      </section>
    </div>
  );
}

function StudioNamingModal({ mode, currentName, onSubmit, onCancel }: { mode: 'initial' | 'rename'; currentName: string; onSubmit: (name: string) => void; onCancel?: () => void }) {
  const [value, setValue] = useState(currentName || '');
  const clean = value.replace(/\s+/g, ' ').trim().slice(0, 24);
  return <div className="modal-backdrop naming-backdrop"><section className="onboarding-card comic-card naming-card"><div className="onboarding-emoji"><Icon name="studio" /></div><h2>{mode === 'initial' ? 'Назови свою студию' : 'Переименовать студию'}</h2><p>{mode === 'initial' ? 'Это обязательный шаг для новых игроков. Без названия студия не сможет начать работу.' : 'Новое название сразу появится в шапке и на экране студии.'}</p><input className="project-name studio-name-input" placeholder="Например, Лунная Мастерская" value={value} maxLength={18} onChange={(event) => setValue(event.target.value)} autoFocus /><div className="inline-actions">{onCancel && <button className="ghost" onClick={onCancel}>Отмена</button>}<button className="primary" disabled={!clean} onClick={() => clean && onSubmit(clean)}>{mode === 'initial' ? 'Продолжить' : 'Сохранить'}</button></div></section></div>;
}

function PromotionBurst({ trigger }: { trigger: string }) {
  return <div key={trigger} className="promotion-burst" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>;
}

function BottomNav({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  return <nav className="bottom-nav">{navItems.map(([id, label, icon]) => <button key={id} className={`${state.screen === id ? 'active' : ''} ${id === 'studio' ? 'main-tab' : ''} ${!state.tutorialDone && state.onboardingDone && state.screen !== 'develop' && id === 'develop' ? 'tutorial-target' : ''}`.trim()} onClick={() => update((current) => ({ ...current, screen: id }))}><Icon name={icon as IconName} />{label}</button>)}</nav>;
}



function DevelopmentAmbientFx() {
  return <div className="dev-ambient" aria-hidden="true">
    <span>КОД</span><span>АРТ</span><span>ТЕСТ</span><span>ХАЙП</span><span>ФИКС</span>
  </div>;
}

const devTickerWords = ['КОД!', 'АРТ!', 'ТЕСТ!', 'ФИКС!', 'ХАЙП!', 'СБОРКА!', 'ПОЛИШ!', 'ИДЕЯ!'];

function DevelopmentTicker({ project }: { project: Project }) {
  const [pulse, setPulse] = useState({ id: 0, text: 'КОД!', x: 14 });
  const isCompleted = project.progress >= 100;

  useEffect(() => {
    if (!project.startedAt || isCompleted) return;
    setPulse({ id: Date.now(), text: devTickerWords[randomIndex(devTickerWords.length)], x: 12 + randomIndex(74) });
    const timer = window.setInterval(() => {
      setPulse({ id: Date.now(), text: devTickerWords[randomIndex(devTickerWords.length)], x: 12 + randomIndex(74) });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [project.id, project.startedAt, isCompleted]);

  if (!project.startedAt || isCompleted) return null;
  return <span key={pulse.id} className="dev-ticker-pop" style={{ left: `${pulse.x}%` } as CSSProperties}>{pulse.text}</span>;
}

function DevPop({ project }: { project: Project }) {
  if (!project.devEventId || !project.devEventText) return null;
  return <span key={project.devEventId} className={project.devEventTone === 'danger' ? 'dev-pop danger' : 'dev-pop'}>{project.devEventText}</span>;
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return <div className={label ? 'progress progress-labeled' : 'progress'}><i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />{label && <b>{label}</b>}</div>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return <div className="stat-card comic-card"><Icon name={icon} /><strong>{value}</strong><p>{label}</p></div>;
}
