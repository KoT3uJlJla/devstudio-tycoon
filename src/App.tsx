import {
  useEffect,
  useMemo,
  useRef,
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
  employeeScoreBonus,
  scienceMultiplier,
  releaseVelocityBoost,
  studioLevelSpeedBoost,
  momentumRevenueMultiplier,
  momentumScoreBonus,
  momentumSpeedMultiplier,
  isAudienceRevealed,
  normalizeFocus,
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
import { haptic, initTelegram, openTelegramUrl, shareRelease } from './telegram';
import { claimBackendDailyReward, claimBackendReferralMilestone, claimBackendStudioGoalResult, clickBackendStudioGoal, purchaseBackendItem, runBackendDevelopmentAction } from './server-economy';
import { getTonWallet, purchaseShopItem, saveTonWallet, unlinkTonWallet, claimReferralMilestone, fetchTaskConfig, hasBackendSession, runDevelopmentAction } from './backendClient';
import { applyTaskReward, buildDailyTasks, buildStudioGoals, HATCH_MIND_CHANNEL_URL, rewardLabel, SUBSCRIBE_HATCH_MIND_GOAL_ID, taskProgressPercent, type DailyTaskModel, type StudioGoalModel, type TaskCatalogOverrides } from './taskCatalog';
import { getLanguage, getLocale, localizedDescription, localizedEffect, localizedName, localizedTitle, t, type TranslationKey } from './i18n';
import { PixiCanvas } from './rendering/PixiCanvas';
import type { DailyTaskId, DevEventChoice, Employee, Focus, GameState, GenreId, PhaseId, PlatformId, Project, ScoreBreakdownItem, ThemeId } from './types';

const navItems = [
  ['develop', 'nav.develop', 'develop'],
  ['research', 'nav.research', 'research'],
  ['studio', 'nav.studio', 'studio'],
  ['shop', 'nav.shop', 'shop'],
  ['menu', 'nav.rewards', 'rating'],
] as const;

const prizeDistribution = [
  ['900 ⭐', '30%'], ['600 ⭐', '20%'], ['420 ⭐', '14%'], ['300 ⭐', '10%'], ['240 ⭐', '8%'],
  ['180 ⭐', '6%'], ['135 ⭐', '4.5%'], ['105 ⭐', '3.5%'], ['75 ⭐', '2.5%'], ['45 ⭐', '1.5%'],
] as const;

const PENDING_SUBSCRIBE_GOAL_KEY = `devstudio:pending-goal:${SUBSCRIBE_HATCH_MIND_GOAL_ID}`;

type PendingSubscribeGoal = {
  goalId: string;
  clickedAt: string | null;
  eligibleAt: string | null;
};

function savePendingSubscribeGoal(goalId: string, eligibleAt: string | null, clickedAt: string | null = new Date().toISOString()) {
  if (goalId !== SUBSCRIBE_HATCH_MIND_GOAL_ID) return;
  try {
    localStorage.setItem(PENDING_SUBSCRIBE_GOAL_KEY, JSON.stringify({ goalId, clickedAt, eligibleAt }));
  } catch {
    // The backend remains the source of truth; storage is only a resume reminder.
  }
}

function readPendingSubscribeGoal(): PendingSubscribeGoal | null {
  try {
    const raw = localStorage.getItem(PENDING_SUBSCRIBE_GOAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingSubscribeGoal>;
    if (parsed?.goalId !== SUBSCRIBE_HATCH_MIND_GOAL_ID) return null;
    return {
      goalId: SUBSCRIBE_HATCH_MIND_GOAL_ID,
      clickedAt: typeof parsed.clickedAt === 'string' ? parsed.clickedAt : null,
      eligibleAt: typeof parsed.eligibleAt === 'string' ? parsed.eligibleAt : null,
    };
  } catch {
    clearPendingSubscribeGoal();
    return null;
  }
}

function clearPendingSubscribeGoal() {
  try {
    localStorage.removeItem(PENDING_SUBSCRIBE_GOAL_KEY);
  } catch {
    // best-effort cleanup
  }
}

function pendingSubscribeDelayMs(eligibleAt: string | null) {
  const timestamp = eligibleAt ? Date.parse(eligibleAt) : NaN;
  if (!Number.isFinite(timestamp)) return 1500;
  return Math.max(0, timestamp - Date.now() + 250);
}

function money(value: number) {
  return Math.round(value).toLocaleString(getLocale());
}

function scoreDelta(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function comboLabel(value: 'Great' | 'Good' | 'Neutral' | 'Bad') {
  return ({
    Great: t('combo.great'),
    Good: t('combo.good'),
    Neutral: t('combo.neutral'),
    Bad: t('combo.bad'),
  } as const)[value] ?? value;
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

function displayGameDay(day: number) {
  const safeDay = Math.max(1, Math.floor(Number(day) || 1));
  return ((safeDay - 1) % 30) + 1;
}

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
      .map((row, index) => ({ ...row, place: index + 1, score: Number(row.score || 0), prize: prizeDistribution[index] ?? null }));
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
    `${t('metric.speed')} ${signedPercent(employee.speedBoost)}`,
    `${t('metric.income')} ${signedPercent(employee.incomeBoost)}`,
    `${t('metric.science')} ${signedPercent(employee.scienceBoost ?? 0)}`,
    `${t('metric.score')} ${signedScore(employee.scoreBoost ?? 0)}`,
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
      [t('rating.bestFreshRelease'), Math.round(bestRecent * bestRecent * 930)],
      [t('rating.weekAverageScore'), Math.round(avgRecent * 1500)],
      [t('rating.liveGameIncome'), Math.round(activeRevenue)],
      [t('rating.releaseRhythm'), Math.round(releaseVolume)],
      [t('rating.studioMomentum'), Math.round(momentum)],
      [t('rating.studioLevel'), Math.round(studioLevel)],
      [t('rating.seasonalPr'), Math.round(seasonal)],
      [t('rating.resetPenalty'), -Math.round(resetPenalty)],
      [t('rating.debtPenalty'), -Math.round(debtPenalty)],
    ].filter(([, value]) => Number(value) !== 0) as [string, number][],
  };
}

const marketEventCopyEn: Record<string, { title: string; description: string }> = {
  'streamer-boom': { title: 'Streamers want indie hits', description: 'Short, bright games show up in recommendations more often.' },
  'school-holidays': { title: 'Players are on holiday', description: 'Players have more free time and more patience for experiments.' },
  'retro-wave': { title: 'Retro wave', description: 'Small studios are getting extra press attention.' },
  'ugc-trend': { title: 'User content boom', description: 'Games with a strong idea pick up organic buzz faster.' },
  'mobile-festival': { title: 'Mobile festival', description: 'Mobile releases are getting talked about more than usual.' },
  'press-week': { title: 'Games media week', description: 'Critics are hunting for new projects more actively.' },
  'meme-season': { title: 'Meme season', description: 'Unusual genre and setting combos have a better shot at taking off.' },
  'platform-grants': { title: 'Platform grants', description: 'Platforms are boosting visibility for fresh games.' },
  'market-fatigue': { title: 'Market fatigue', description: 'Players are harsher on samey releases.' },
  'server-drama': { title: 'Server drama', description: 'Audiences are suspicious of new online features.' },
  'ad-prices-up': { title: 'Ads got pricier', description: 'Organic reach is down, so launching games is harder.' },
  'big-release': { title: 'Big publisher release', description: 'A huge release has stolen attention from players and press.' },
  'review-burnout': { title: 'Critics are overloaded', description: 'Media outlets are scoring average projects more harshly.' },
  'wallet-crunch': { title: 'Players are saving money', description: 'Players buy less, especially games that miss the trend.' },
  'clone-backlash': { title: 'Clone backlash', description: 'Similar-looking games are getting rough community reactions.' },
  'platform-bugs': { title: 'Platform issues', description: 'Stores are having trouble with storefronts and recommendations.' },
};

function localizedMarketEventTitle(event: { id: string; title: string }) {
  const baseId = event.id.replace(/^global-/, '').replace(/-\d+$/, '');
  return getLanguage() === 'en' ? marketEventCopyEn[baseId]?.title ?? 'Market event' : event.title;
}

function localizedMarketEventDescription(event: { id: string; description: string }) {
  const baseId = event.id.replace(/^global-/, '').replace(/-\d+$/, '');
  return getLanguage() === 'en' ? marketEventCopyEn[baseId]?.description ?? 'The market is shifting for a short time.' : event.description;
}

function localizedSavedText(text: string) {
  if (getLanguage() === 'ru' || !/[\u0400-\u04ff]/.test(text)) return text;
  return 'Game event';
}

function localizedProjectInsightNote() {
  return getLanguage() === 'ru'
    ? null
    : 'This project has its own genre, setting, and platform pressure. Use the focus hints below as a quick production read.';
}

const REFERRAL_MILESTONES = [
  { id: 'm1', target: 1, reward: { coins: 1500, rp: 8 }, labelKey: 'referrals.m1' },
  { id: 'm3', target: 3, reward: { coins: 5000, rp: 20 }, labelKey: 'referrals.m3' },
  { id: 'm5', target: 5, reward: { coins: 11000, rp: 40 }, labelKey: 'referrals.m5' },
  { id: 'm10', target: 10, reward: { coins: 30000, rp: 90 }, labelKey: 'referrals.m10' },
  { id: 'm25', target: 25, reward: { coins: 90000, rp: 260 }, labelKey: 'referrals.m25' },
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
  return phaseLabelsForUi(phase).map((label, index) => `${label} ${focus[phase][index]}%`).join(' · ');
}

const phaseTitleKeys: Record<PhaseId, TranslationKey> = {
  pre: 'phase.pre',
  production: 'phase.production',
  post: 'phase.post',
};

const phaseLabelKeys: Record<PhaseId, TranslationKey[]> = {
  pre: ['phase.pre.tech', 'phase.pre.gameplay', 'phase.pre.story'],
  production: ['phase.production.dialogue', 'phase.production.levels', 'phase.production.ai'],
  post: ['phase.post.world', 'phase.post.visual', 'phase.post.sound'],
};

const priorityLabelKeys: Record<PhaseId, TranslationKey[]> = {
  pre: ['priority.techBase', 'priority.gameplay', 'priority.narrative'],
  production: ['priority.script', 'priority.levels', 'priority.ai'],
  post: ['priority.world', 'priority.art', 'priority.sound'],
};

function phaseTitle(phase: PhaseId) {
  return t(phaseTitleKeys[phase]);
}

function phaseLabelsForUi(phase: PhaseId) {
  return phaseLabelKeys[phase].map((key) => t(key));
}

function prioritySentence(focus: Focus, phase: PhaseId) {
  const values = focus[phase];
  const index = values.indexOf(Math.max(...values));
  const key = priorityLabelKeys[phase][index];
  if (phase === 'production' && key === 'priority.ai') return t('priority.aiHint');
  if (phase === 'pre' && key === 'priority.gameplay') return t('priority.gameplayHint');
  if (phase === 'pre' && key === 'priority.narrative') return t('priority.narrativeHint');
  if (phase === 'post' && key === 'priority.sound') return t('priority.soundHint');
  if (phase === 'post' && key === 'priority.art') return t('priority.artHint');
  return t('priority.default', { phase: phaseTitle(phase), label: t(key) });
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

const employeeRoleValues = {
  designer: '\u0414\u0438\u0437\u0430\u0439\u043d\u0435\u0440',
  artist: '\u0425\u0443\u0434\u043e\u0436\u043d\u0438\u043a',
  marketer: '\u041c\u0430\u0440\u043a\u0435\u0442\u043e\u043b\u043e\u0433',
  producer: '\u041f\u0440\u043e\u0434\u044e\u0441\u0435\u0440',
  analyst: '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a',
} as const;

function roleIcon(role: string): IconName {
  if (role === employeeRoleValues.artist) return 'paint';
  if (role === employeeRoleValues.marketer) return 'megaphone';
  if (role === employeeRoleValues.designer) return 'brain';
  if (role === employeeRoleValues.producer) return 'producer';
  if (role === employeeRoleValues.analyst) return 'analyst';
  return 'code';
}

function roleLabel(role: Employee['role']) {
  if (role === employeeRoleValues.artist) return t('role.artist');
  if (role === employeeRoleValues.marketer) return t('role.marketer');
  if (role === employeeRoleValues.designer) return t('role.designer');
  if (role === employeeRoleValues.producer) return t('role.producer');
  if (role === employeeRoleValues.analyst) return t('role.analyst');
  return t('role.programmer');
}

const employeeSpecializationEnById: Record<string, string> = {
  'dev-lena': '+ engine',
  'art-kai': '+ visuals',
  'design-mira': '+ gameplay',
  'marketing-tom': '+ hype, -polish',
  'producer-nika': '- schedule chaos',
  'analyst-zen': '+ audience',
  'dev-oleg': '+ stable builds',
  'qa-ira': '+ quality, -speed',
  'mark-roma': '+ sales, -pace',
  'prod-sasha': '+ deadlines',
  'artist-ava': '+ style',
  'designer-lev': '+ balance',
  'dev-maya': '+ tech debt',
  'monet-gleb': '+ monetization, -score',
  'ux-nora': '+ retention',
  'sci-yun': '+ science points',
  'prod-kira': '+ release rhythm',
  'sound-vik': '+ sound and vibe',
  'lead-anna': '+ big projects',
  'creative-pasha': '+ strong score, -pace',
  'biz-alisa': '+ profit, -speed',
  'lab-dan': '+ science',
  'exec-mila': '+ everything, expensive',
  'ghost-den': '+ speed, -quality',
  'trend-lika': '+ trends',
  'mentor-boris': '+ team growth',
};

function specializationLabel(employee: Employee) {
  return getLanguage() === 'en' ? employee.specializationEn ?? employeeSpecializationEnById[employee.id] ?? employee.specialization : employee.specialization;
}


const FIRST_SESSION_CONTRACT_ID = 'ftue-contract-v1';
const FIRST_SESSION_CONTRACT_REWARD = { coins: 2500, rp: 18 } as const;
const FTUE_UPGRADE_RP_CLAIM_ID = 'ftue-upgrade-rp-v1';

type DailyContractDefinition = {
  id: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  target: number;
  reward: { coins: number; rp: number };
  noteKey: TranslationKey;
  current: (state: GameState) => number;
};

const DAILY_CONTRACTS: DailyContractDefinition[] = [
  { id: 'release', titleKey: 'dailyContract.release.title', descKey: 'dailyContract.release.desc', target: 1, reward: { coins: 1200, rp: 12 }, noteKey: 'dailyContract.release.note', current: (state) => state.dailyGamesReleased },
  { id: 'work', titleKey: 'dailyContract.work.title', descKey: 'dailyContract.work.desc', target: 1, reward: { coins: 900, rp: 10 }, noteKey: 'dailyContract.work.note', current: (state) => state.dailyWorkTaps },
  { id: 'research', titleKey: 'dailyContract.research.title', descKey: 'dailyContract.research.desc', target: 1, reward: { coins: 850, rp: 14 }, noteKey: 'dailyContract.research.note', current: (state) => state.dailyResearchUnlocked },
  { id: 'income', titleKey: 'dailyContract.income.title', descKey: 'dailyContract.income.desc', target: 1200, reward: { coins: 1500, rp: 8 }, noteKey: 'dailyContract.income.note', current: (state) => state.dailyPassiveIncome },
];

function hashDailyKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function contractForDay(dayKey: string) {
  return DAILY_CONTRACTS[hashDailyKey(dayKey) % DAILY_CONTRACTS.length] ?? DAILY_CONTRACTS[0];
}

function dailyContractClaimKey(contractId: string) {
  return todayKey() + ':contract:' + contractId;
}

function nextDayKey() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function activeDailyContract(state: GameState) {
  void state;
  return contractForDay(todayKey());
}

function nextDailyContractPreview() {
  return contractForDay(nextDayKey());
}

function hasFirstSessionUpgrade(state: GameState) {
  const unlockedGenres = state.unlockedGenreIds.filter((id) => !genres.find((item) => item.id === id)?.isBase).length;
  const unlockedThemes = state.unlockedThemeIds.filter((id) => !themes.find((item) => item.id === id)?.isBase).length;
  return state.unlockedResearchIds.length > 0 || unlockedGenres > 0 || unlockedThemes > 0 || state.employees.length > 0 || state.level > 1;
}

function firstSessionContractClaimed(state: GameState) {
  return Boolean(state.dailyTaskClaims[FIRST_SESSION_CONTRACT_ID]);
}

function ftueUpgradeRewardClaimed(state: GameState) {
  return Boolean(state.studioGoalClaims?.[FTUE_UPGRADE_RP_CLAIM_ID]);
}

function firstSessionContractProgress(state: GameState) {
  return {
    firstRelease: state.gamesReleased >= 1,
    upgrade: hasFirstSessionUpgrade(state),
    secondRelease: state.gamesReleased >= 2,
  };
}

function firstSessionContractReady(state: GameState) {
  const progress = firstSessionContractProgress(state);
  return progress.firstRelease && progress.upgrade && progress.secondRelease;
}

function mergeFtueRewardSave(current: GameState, rawSave: unknown): GameState {
  if (!rawSave || typeof rawSave !== 'object' || Array.isArray(rawSave)) return current;
  const saveData = rawSave as Record<string, unknown>;
  const studioGoalClaims = saveData.studioGoalClaims;
  const dailyTaskClaims = saveData.dailyTaskClaims;
  return {
    ...current,
    ...(Number.isFinite(Number(saveData.coins)) ? { coins: Number(saveData.coins) } : {}),
    ...(Number.isFinite(Number(saveData.rp)) ? { rp: Number(saveData.rp) } : {}),
    ...(Number.isFinite(Number(saveData.lastSavedAt)) ? { lastSavedAt: Number(saveData.lastSavedAt) } : {}),
    ...(studioGoalClaims && typeof studioGoalClaims === 'object' && !Array.isArray(studioGoalClaims)
      ? { studioGoalClaims: Object.fromEntries(Object.entries(studioGoalClaims as Record<string, unknown>).map(([key, value]) => [String(key), Boolean(value)])) }
      : {}),
    ...(dailyTaskClaims && typeof dailyTaskClaims === 'object' && !Array.isArray(dailyTaskClaims)
      ? { dailyTaskClaims: Object.fromEntries(Object.entries(dailyTaskClaims as Record<string, unknown>).map(([key, value]) => [String(key), Boolean(value)])) }
      : {}),
  };
}

async function openFirstUpgradeStep(state: GameState, update: (fn: (state: GameState) => GameState) => void) {
  const nextScreen = { latestRelease: null, screen: 'research' as GameState['screen'] };
  if (ftueUpgradeRewardClaimed(state)) {
    update((current) => ({ ...current, ...nextScreen }));
    return;
  }
  const apiUrl = import.meta.env.VITE_API_URL ?? '';
  const initData = window.Telegram?.WebApp?.initData || '';
  if (apiUrl && initData) {
    try {
      const response = await fetch(apiUrl + '/api/ftue/upgrade-rp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'tma ' + initData,
        },
      });
      const payload = await response.json().catch(() => null) as { save?: { data?: unknown } | null } | null;
      if (payload?.save?.data) {
        update((current) => ({ ...mergeFtueRewardSave(current, payload.save?.data), ...nextScreen }));
        return;
      }
    } catch {
      // fall through to plain navigation when the backend is temporarily unavailable
    }
  }
  update((current) => ({ ...current, ...nextScreen }));
}

function FirstSessionContractBar({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  if (!state.onboardingDone || !state.tutorialDone || state.screen !== 'studio' || firstSessionContractClaimed(state)) return null;
  const progress = firstSessionContractProgress(state);
  const steps = [
    [t('contract.firstRelease'), progress.firstRelease],
    [t('contract.firstUpgrade'), progress.upgrade],
    [t('contract.secondRelease'), progress.secondRelease],
  ] as const;
  const ready = firstSessionContractReady(state);
  const nextAction: { label: string; apply: (current: GameState) => GameState } | null = !progress.firstRelease
    ? { label: t('contract.startFirstRelease'), apply: (current: GameState): GameState => ({ ...current, screen: 'develop' as GameState['screen'], selectedProject: current.selectedProject ?? createProject(false) }) }
    : !progress.upgrade
      ? { label: t('contract.openFirstUpgrade'), apply: (current: GameState): GameState => ({ ...current, screen: 'research' as GameState['screen'] }) }
      : !progress.secondRelease
        ? { label: t('contract.buildSecondRelease'), apply: (current: GameState): GameState => ({ ...current, screen: 'develop' as GameState['screen'], selectedProject: current.selectedProject ?? createProject(false) }) }
        : null;
  const claim = () => update((current) => {
    if (firstSessionContractClaimed(current) || !firstSessionContractReady(current)) return current;
    haptic('success');
    return {
      ...current,
      coins: current.coins + FIRST_SESSION_CONTRACT_REWARD.coins,
      rp: current.rp + FIRST_SESSION_CONTRACT_REWARD.rp,
      dailyTaskClaims: { ...(current.dailyTaskClaims ?? {}), [FIRST_SESSION_CONTRACT_ID]: true },
    };
  });
  const handleNextAction = nextAction?.label === t('contract.openFirstUpgrade')
    ? () => { void openFirstUpgradeStep(state, update); }
    : nextAction
      ? () => update(nextAction.apply)
      : undefined;
  return <section className="first-session-contract comic-card">
    <div className="section-head compact"><div><p className="eyebrow">{t('contract.firstSession')}</p><h3>{t('contract.reachSecondRelease')}</h3></div><span className="pill">+{money(FIRST_SESSION_CONTRACT_REWARD.coins)} 🪙 +{FIRST_SESSION_CONTRACT_REWARD.rp} 🧪</span></div>
    <p className="muted">{t('contract.firstSessionDesc')}</p>
    <div className="contract-steps">{steps.map(([label, done]) => <span key={label} className={done ? 'contract-step done' : 'contract-step'}>{done ? '✅' : '•'} {label}</span>)}</div>
    <div className="inline-actions contract-actions">
      {ready ? <button className="primary" onClick={claim}>{t('contract.claimFirstSession')}</button> : handleNextAction ? <button className="primary" onClick={handleNextAction}>{nextAction?.label}</button> : null}
      <span className="small muted">{t('contract.afterSecondRelease')}</span>
    </div>
  </section>;
}

function DailyContractCard({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  if (!state.tutorialDone || state.screen !== 'studio') return null;
  const contract = activeDailyContract(state);
  const nextContract = nextDailyContractPreview();
  const currentValue = contract.current(state);
  const ready = currentValue >= contract.target;
  const claimKey = dailyContractClaimKey(contract.id);
  const claimed = Boolean(state.dailyTaskClaims[claimKey]);
  const progress = Math.min(100, Math.round((currentValue / contract.target) * 100));
  const claim = () => update((current) => {
    const currentContract = activeDailyContract(current);
    const key = dailyContractClaimKey(currentContract.id);
    if (current.dailyTaskClaims[key] || currentContract.current(current) < currentContract.target) return current;
    haptic('success');
    return {
      ...current,
      coins: current.coins + currentContract.reward.coins,
      rp: current.rp + currentContract.reward.rp,
      dailyTaskClaims: { ...current.dailyTaskClaims, [key]: true },
    };
  });
  return <section className="daily-contract-card comic-card">
    <div className="section-head compact"><div><p className="eyebrow">{t('contract.daily')}</p><h3>{t(contract.titleKey)}</h3></div><span className="pill">+{money(contract.reward.coins)} 🪙 +{contract.reward.rp} 🧪</span></div>
    <p>{t(contract.descKey)}</p>
    <ProgressBar value={progress} />
    <div className="daily-contract-footer"><span>{claimed ? t('contract.closed') : ready ? t('contract.ready') : String(Math.min(Math.round(currentValue), contract.target)) + '/' + String(contract.target)}</span><button className="primary" disabled={!ready || claimed} onClick={claim}>{claimed ? t('contract.received') : t('contract.claimReward')}</button></div>
    <div className="daily-contract-meta"><small>{t(contract.noteKey)}</small><small>{t('contract.tomorrow', { title: t(nextContract.titleKey) })}</small></div>
  </section>;
}
export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [gameClosed, setGameClosed] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(t('maintenance.default'));
  const [momentumOpen, setMomentumOpen] = useState(false);
  const [studioOfficeOpen, setStudioOfficeOpen] = useState(false);
  const [studioNamingMode, setStudioNamingMode] = useState<'initial' | 'rename' | null>(null);
  const [taskOverrides, setTaskOverrides] = useState<TaskCatalogOverrides>({});

  useInterfaceSounds();

  useEffect(() => {
    const onClosed = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setMaintenanceMessage(detail?.message || t('maintenance.default'));
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
    saveGame(state);
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
  if (!state) return <div className="loading"><span>{t('common.loadingStudio')}</span></div>;
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
      <section className={`screen-card ${state.screen === 'studio' ? 'screen-card--studio' : ''}`}>
        <div className="screen-card-content">
        {state.screen === 'studio' && <StudioScreen state={state} onNewProject={startNewProject} update={update} taskOverrides={taskOverrides} onOfficeOpen={() => setStudioOfficeOpen(true)} />}
        {state.screen === 'develop' && <DevelopScreen state={state} update={update} />}
        {state.screen === 'hire' && <HireScreen state={state} update={update} />}
        {state.screen === 'research' && <ResearchScreen state={state} update={update} />}
        {state.screen === 'shop' && <ShopScreen state={state} update={update} onRenameStudio={() => setStudioNamingMode('rename')} />}
        {state.screen === 'menu' && <RatingScreen state={state} update={update} />}
        </div>
      </section>

      <BottomNav state={state} update={update} />
      {!state.onboardingDone && <Onboarding update={update} />}
      {studioNamingMode && <StudioNamingModal mode={studioNamingMode} currentName={state.studioName} onCancel={studioNamingMode === 'rename' ? () => setStudioNamingMode(null) : undefined} onSubmit={(name) => { update((current) => ({ ...current, studioName: name })); setStudioNamingMode(null); }} />}
      {state.latestRelease && <ReleaseModal state={state} update={update} />}
      {momentumOpen && <MomentumInfoModal state={state} onClose={() => setMomentumOpen(false)} />}
      {studioOfficeOpen && <StudioOfficeModal onClose={() => setStudioOfficeOpen(false)} />}
      {state.selectedProject?.pendingDevEvent && <DevelopmentEventModal state={state} update={update} />}
      {!state.offerSeen && state.tutorialDone && state.gamesReleased >= 3 && <StarterOffer update={update} />}
    </main>
  );
}

function MaintenanceScreen({ message }: { message: string }) {
  return <main className="app-shell maintenance-shell"><section className="maintenance-card comic-card splash-panel"><div className="poster-art"><span className="burst burst-a">PATCH</span><span className="burst burst-b">DEV</span><i className="slash slash-a" /><i className="slash slash-b" /></div><div className="hero-copy"><p className="eyebrow">{t('app.name')}</p><h2>{t('maintenance.title')}</h2><p className="muted">{message || t('maintenance.backLater')}</p><p className="small muted">{t('maintenance.note')}</p></div></section></main>;
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
          <p className="eyebrow">{t('app.gameStudio')}</p>
          <h1 className="studio-name" title={state.studioName || t('studio.defaultName')}>{state.studioName || t('studio.defaultName')}</h1>
        </div>
        <div className="topbar-meta">
          <span className="badge kaboom studio-level-badge">Lvl: {state.level}</span>
          <span className="badge kaboom date-badge compact-date-badge">
            <span>{t('date.yearShort', { year: topbarDate.year })}</span>
            <span>{t('date.monthShort', { month: topbarDate.month })}</span>
            <span>{t('date.dayShort', { day: topbarDate.day })}</span>
            <span className="day-dial" style={{ '--day-progress': `${dayPercent}%` } as CSSProperties}>
              <b>{secondsLeft}</b>
              <small>{t('common.secondsShort')}</small>
            </span>
          </span>
        </div>
      </div>
      <div className="wallet compact-wallet">
        <span><Icon name="coin" /> {money(state.coins)}</span>
        <span><Icon name="rp" /> {money(state.rp)}</span>
        <span><Icon name="star" /> {state.stars}</span>
      </div>
      <button className="level-row momentum-button" type="button" onClick={onMomentumOpen} aria-label={t('studio.momentumAria')}>
        <span>{t('studio.momentum')}</span>
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
        <button className="modal-x" type="button" onClick={onClose} aria-label={t('common.close')}>×</button>
        <p className="eyebrow">{t('studio.help')}</p>
        <h2 id="momentum-title">{t('studio.momentum')}</h2>
        <div className="momentum-copy"><p className="muted">{t('studio.momentumBody1')}</p><p className="muted">{t('studio.momentumBody2')}</p></div>
        <div className="momentum-stats">
          <span><b>{t('metric.speed')}</b><strong>×{momentumSpeed.toFixed(2)}</strong><em>{t('studio.maxSpeed')}</em></span>
          <span><b>{t('metric.score')}</b><strong>+{momentumScore.toFixed(2)}</strong><em>{t('studio.maxScore')}</em></span>
          <span><b>{t('metric.income')}</b><strong>×{momentumRevenue.toFixed(2)}</strong><em>{t('studio.maxIncome')}</em></span>
        </div>
        <div className="momentum-copy compact"><p className="small muted">{t('studio.momentumNote1')}</p><p className="small muted">{t('studio.momentumNote2')}</p></div>
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
    id: 'genre', eyebrow: t('tutorial.genre.eyebrow'), title: t('tutorial.genre.title'),
    body: t('tutorial.genre.body'),
    target: true, placement: 'bottom', cta: t('tutorial.genre.cta'),
  },
  theme: {
    id: 'theme', eyebrow: t('tutorial.theme.eyebrow'), title: t('tutorial.theme.title'),
    body: t('tutorial.theme.body'),
    target: true, placement: 'bottom', cta: t('tutorial.theme.cta'),
  },
  platform: {
    id: 'platform', eyebrow: t('tutorial.platform.eyebrow'), title: t('tutorial.platform.title'),
    body: t('tutorial.platform.body'),
    target: true, placement: 'top', cta: t('tutorial.platform.cta'),
  },
  start: {
    id: 'start', eyebrow: t('tutorial.start.eyebrow'), title: t('tutorial.start.title'),
    body: t('tutorial.start.body'),
    target: true, placement: 'top', cta: t('tutorial.start.cta'),
  },
  wait: {
    id: 'wait', eyebrow: t('tutorial.wait.eyebrow'), title: t('tutorial.wait.title'),
    body: t('tutorial.wait.body'),
    target: false, placement: 'top', cta: t('tutorial.wait.cta'),
  },
  release: {
    id: 'release', eyebrow: t('tutorial.release.eyebrow'), title: t('tutorial.release.title'),
    body: t('tutorial.release.body'),
    target: true, placement: 'top', cta: t('tutorial.release.cta'),
  },
  developTab: {
    id: 'develop-tab', eyebrow: t('tutorial.developTab.eyebrow'), title: t('tutorial.developTab.title'),
    body: t('tutorial.developTab.body'),
    target: true, placement: 'bottom', cta: t('tutorial.developTab.cta'),
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
          <button className="ghost" type="button" onClick={onSkip}>{t('tutorial.skip')}</button>
        </div>
      </section>
    </div>
  );
}

function TutorialBanner({ state, onAction, onSkip }: { state: GameState; onAction: () => void; onSkip: () => void }) {
  void onAction;
  return <GuidedTutorialOverlay state={state} onSkip={onSkip} />;
}

function StudioScreen({ state, onNewProject, update, taskOverrides, onOfficeOpen }: { state: GameState; onNewProject: () => void; update: (fn: (state: GameState) => GameState) => void; taskOverrides: TaskCatalogOverrides; onOfficeOpen: () => void }) {
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
          <p className="eyebrow">{t('nav.studio')}</p>
          <h2>{state.studioName || t('studio.defaultName')}</h2>
          <p className="muted">{t('studio.summary', { speed: speed.toFixed(2), income: income.toFixed(2), count: state.gamesReleased })}</p>
        </div>
        <div className="mini-ledger"><span>{t('studio.slots')}</span><b>{state.employees.length}/{employeeSlotsForLevel(state.level)}</b><span>{t('studio.activeGames')}</span><b>{state.activeGames.length}</b></div>
      </section>

      <StudioOfficeCard onOpen={onOfficeOpen} />
      <GameClock state={state} expenses={expenses.total} nextRentDay={nextRentDay} />
      <BankruptcyNotice state={state} />
      <StudioUpgradePanel state={state} update={update} />
      {state.level > 1 && <HireEntryCard state={state} update={update} />}
      <NewsPanel state={state} />
      <AudiencePanel state={state} update={update} />

      <div className="stats-grid">
        <Stat label={t('studio.bestRating')} value={state.bestScore ? `${state.bestScore}/10` : '—'} icon="trophy" />
        <Stat label={t('studio.activeGames')} value={`${state.activeGames.length}`} icon="chart" />
        <Stat label={t('studio.content')} value={`${state.unlockedGenreIds.length}/${genres.length}`} icon="gamepad" />
      </div>

      {dailyReady && (
        <button
          type="button"
          className="daily-card comic-card daily-reward-button"
          onClick={() => void claimBackendDailyReward()}
        >
          <span>{t('studio.dailyLogin')}</span> {t('studio.dailyLoginReward')}
        </button>
      )}
      <DailyTasks state={state} update={update} taskOverrides={taskOverrides} />
      <StudioGoals state={state} update={update} taskOverrides={taskOverrides} />
      <DailyContractCard state={state} update={update} />
      <ActiveGames state={state} />
      <ReleaseArchive state={state} />
      <Ledger state={state} />
    </div>
  );
}


function StudioOfficeCard({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="studio-office-card comic-card">
      <div className="studio-office-copy">
        <div>
          <p className="eyebrow">{t('studio.office')}</p>
          <h2>{t('studio.office')}</h2>
          <p className="muted">{t('studio.officeDesc')}</p>
        </div>
        <button className="primary" type="button" onClick={onOpen}>{t('studio.officeOpen')}</button>
      </div>
      <div
  className="studio-office-preview"
  style={{
    display: 'block',
    position: 'relative',
    width: '100%',
    height: '220px',
    minHeight: '180px',
    overflow: 'hidden',
    borderRadius: '24px',
    background: '#070812',
  }}
>
  <PixiCanvas mode="preview" />
</div>
    </section>
  );
}

function StudioOfficeModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop studio-office-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="studio-office-modal-title" onClick={onClose}>
      <section className="release-modal comic-card studio-office-modal" onClick={(event) => event.stopPropagation()}>
        <div className="studio-office-modal-head">
          <div>
            <p className="eyebrow">{t('studio.officeEyebrow')}</p>
            <h2 id="studio-office-modal-title">{t('studio.office')}</h2>
          </div>
          <button className="ghost studio-office-close" type="button" onClick={onClose} aria-label={t('studio.officeCloseAria')}>×</button>
        </div>
        <div
  className="studio-office-modal-scene"
  style={{
    display: 'block',
    position: 'relative',
    width: '100%',
    height: 'min(56vh, 520px)',
    minHeight: '320px',
    overflow: 'hidden',
    borderRadius: '24px',
    background: '#070812',
  }}
>
  <PixiCanvas mode="modal" />
</div>
      </section>
    </div>
  );
}

function HireEntryCard({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const slots = employeeSlotsForLevel(state.level);
  return (
    <section className="hire-entry-card comic-card">
      <div>
        <p className="eyebrow">{t('studio.team')}</p>
        <h3>{t('studio.hiring')}</h3>
        <p className="muted">{t('studio.hireDesc', { used: state.employees.length, slots })}</p>
      </div>
      <button className="primary" onClick={() => update((current) => ({ ...current, screen: 'hire' }))}>{t('studio.openHiring')}</button>
    </section>
  );
}

function GameClock({ state, expenses, nextRentDay }: { state: GameState; expenses: number; nextRentDay: number }) {
  const gameDate = gameDateParts(state.gameDay);
  return (
    <section className="time-card comic-card">
      <div><p className="eyebrow">{t('studio.gameTime')}</p><h3>{t('common.day', { day: displayGameDay(state.gameDay) })}</h3></div>
      <div className="mini-ledger"><span>{t('studio.nextWriteOff')}</span><b>{nextRentDay === 0 ? t('common.today') : t('common.daysShort', { days: nextRentDay })}</b><span>{t('studio.weeklyCost')}</span><b>🪙 {money(expenses)}</b></div>
    </section>
  );
}


function BankruptcyNotice({ state }: { state: GameState }) {
  if (state.coins >= 0 && state.unpaidSinceMonth === null && state.closureWarningMonth === null) return null;
  const stage = state.closureWarningMonth !== null
    ? t('studio.debtStageClosed')
    : state.unpaidSinceMonth !== null
      ? t('studio.debtStageUnpaid')
      : t('studio.debtStageNegative');
  return <section className="bankruptcy-card comic-card"><p className="eyebrow">{t('studio.financeAlarm')}</p><h3>{t('studio.debtTitle', { coins: money(state.coins) })}</h3><p>{stage}</p></section>;
}

function StudioUpgradePanel({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const slots = employeeSlotsForLevel(state.level);
  const nextCost = nextStudioUpgradeCost(state.level);
  const nextSlots = employeeSlotsForLevel(state.level + 1);
  const canUpgrade = Boolean(nextCost && state.coins - nextCost >= -50000);
  return (
    <section className="studio-upgrade comic-card">
      <div className="section-head compact">
        <div><p className="eyebrow">{t('studio.levelTitle')}</p><h3>{t('studio.levelLine', { level: state.level, slots })}</h3></div>
        <span className="pill">{t('studio.longGrowth')}</span>
      </div>
      <p className="muted">{t('studio.upgradeDesc')}</p>
      {nextCost ? <button className="primary wide" disabled={!canUpgrade} onClick={() => update(upgradeStudio)}>{t('studio.upgradeButton', { level: state.level + 1, slots: nextSlots - slots, cost: money(nextCost) })}</button> : <button className="ghost wide" disabled>{t('studio.maxLevel')}</button>}
    </section>
  );
}

function NewsPanel({ state }: { state: GameState }) {
  return (
    <section className="news-panel comic-card">
      <div className="section-head compact"><div><p className="eyebrow">{t('studio.market')}</p><h3>{t('studio.activeEvents')}</h3></div><span className="pill">{t('studio.affectsNow')}</span></div>
      {state.activeMarketEvents.length ? (
        <div className="market-events">
          {state.activeMarketEvents.map((event) => <article key={event.id} className={`market-event ${event.tone}`}><strong>{localizedMarketEventTitle(event)}</strong><p>{localizedMarketEventDescription(event)}</p><small>{t('studio.marketEventMeta', { days: event.daysRemaining, sales: event.salesMultiplier.toFixed(2), score: `${event.scoreModifier > 0 ? '+' : ''}${event.scoreModifier.toFixed(2)}` })}</small></article>)}
        </div>
      ) : <p className="muted">{t('studio.noMarketEvents')}</p>}
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
        <div><p className="eyebrow">{t('studio.audienceInterests')}</p><h3>{t('studio.audienceInterests')}</h3></div>
        <span className="pill">{t('studio.paidScan')}</span>
      </div>
      {revealed ? (
        <div className="audience-reveal">
          <p className="muted">{t('studio.scanDesc')}</p>
          <div className="insight-tags"><span>{genre?.emoji} {t('studio.genreLabel')}: {localizedName(genre)}</span><span>{theme?.emoji} {t('studio.themeLabel')}: {localizedName(theme)}</span><span>{platform?.emoji} {t('studio.platformLabel')}: {localizedName(platform)}</span></div>
        </div>
      ) : (
        <div className="hidden-audience"><p className="muted">{t('studio.hiddenAudience')}</p><button disabled={state.coins < scanCost} onClick={() => update(revealAudience)}>{t('studio.openForCoins', { cost: scanCost })}</button></div>
      )}
    </section>
  );
}


function ReleaseArchive({ state }: { state: GameState }) {
  if (!state.releaseHistory.length) return <section className="panel comic-card empty-panel"><h3>{t('studio.releaseArchive')}</h3><p className="muted">{t('studio.releaseArchiveEmpty')}</p></section>;
  return <section className="panel comic-card"><div className="section-head compact"><h3>{t('studio.releaseArchive')}</h3><span className="pill">{t('studio.allStudioScores')}</span></div><div className="release-archive-list">{[...state.releaseHistory].reverse().map((entry, index) => <article className="release-archive-row" key={`${entry.title}-${entry.day}-${index}`}><div><strong>{entry.title}</strong><p>{localizedName(genres.find((genre) => genre.id === entry.genre))} · {localizedName(themes.find((theme) => theme.id === entry.theme))}</p></div><div className="archive-score-box"><b>{entry.score.toFixed(1)}</b><span>{t('studio.dayLower', { day: entry.day })}</span></div></article>)}</div></section>;
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
      <div className="section-head"><div><p className="eyebrow">{t('studio.dailyTasks')}</p><h3>{t('studio.dailyTasksTitle')}</h3></div><span className="pill">{t('studio.dailyReset')}</span></div>
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
  const [subscribePending, setSubscribePending] = useState(false);
  const subscribeRetryTimer = useRef<number | null>(null);
  const subscribeClaimInFlight = useRef(false);
  const goals = buildStudioGoals(state, taskOverrides);
  const visibleGoals = open ? goals : goals.slice(0, 3);
  const completed = goals.filter((goal) => state.studioGoalClaims[goal.id]).length;
  const subscribeClaimed = Boolean(state.studioGoalClaims[SUBSCRIBE_HATCH_MIND_GOAL_ID]);
  const claim = (goal: StudioGoalModel) => update((current) => {
    if (current.studioGoalClaims[goal.id] || goal.current < goal.target) return current;
    haptic('success');
    return applyTaskReward({ ...current, studioGoalClaims: { ...current.studioGoalClaims, [goal.id]: true } }, goal.reward);
  });

  const clearSubscribeRetryTimer = () => {
    if (subscribeRetryTimer.current === null) return;
    window.clearTimeout(subscribeRetryTimer.current);
    subscribeRetryTimer.current = null;
  };

  const scheduleSubscribeClaimRetry = (eligibleAt: string | null) => {
    clearSubscribeRetryTimer();
    subscribeRetryTimer.current = window.setTimeout(() => {
      void tryClaimSubscribeGoal('timer');
    }, pendingSubscribeDelayMs(eligibleAt));
  };

  const tryClaimSubscribeGoal = async (reason: 'timer' | 'focus' | 'resume' | 'manual') => {
    void reason;
    if (state.studioGoalClaims[SUBSCRIBE_HATCH_MIND_GOAL_ID]) {
      clearPendingSubscribeGoal();
      clearSubscribeRetryTimer();
      setSubscribePending(false);
      return;
    }

    const pending = readPendingSubscribeGoal();
    if (!pending || subscribeClaimInFlight.current) return;
    setSubscribePending(true);
    subscribeClaimInFlight.current = true;
    try {
      const result = await claimBackendStudioGoalResult(SUBSCRIBE_HATCH_MIND_GOAL_ID);
      const claimedState = result.state;
      if (claimedState) {
        update(() => claimedState);
        clearPendingSubscribeGoal();
        clearSubscribeRetryTimer();
        setSubscribePending(false);
        haptic('success');
        return;
      }

      if (result.claimed || result.error === 'studio_goal_already_claimed') {
        clearPendingSubscribeGoal();
        clearSubscribeRetryTimer();
        setSubscribePending(false);
        return;
      }

      if (result.error === 'studio_goal_click_required') {
        const clicked = await clickBackendStudioGoal(SUBSCRIBE_HATCH_MIND_GOAL_ID);
        const clickedState = clicked?.state ?? null;
        if (clickedState?.studioGoalClaims[SUBSCRIBE_HATCH_MIND_GOAL_ID]) {
          update(() => clickedState);
          clearPendingSubscribeGoal();
          clearSubscribeRetryTimer();
          setSubscribePending(false);
          haptic('success');
          return;
        }
        const nextEligibleAt = clicked?.eligibleAt ?? pending.eligibleAt;
        savePendingSubscribeGoal(SUBSCRIBE_HATCH_MIND_GOAL_ID, nextEligibleAt, clicked?.clickedAt ?? pending.clickedAt);
        scheduleSubscribeClaimRetry(nextEligibleAt);
        return;
      }

      const nextEligibleAt = result.eligibleAt ?? pending.eligibleAt;
      savePendingSubscribeGoal(SUBSCRIBE_HATCH_MIND_GOAL_ID, nextEligibleAt, pending.clickedAt);
      scheduleSubscribeClaimRetry(nextEligibleAt);
    } finally {
      subscribeClaimInFlight.current = false;
    }
  };

  const startSubscribeGoal = async (goal: StudioGoalModel) => {
    if (subscribePending || state.studioGoalClaims[goal.id]) return;
    haptic('tap');
    setSubscribePending(true);
    const targetUrl = goal.action?.type === 'telegram_url' ? goal.action.url : HATCH_MIND_CHANNEL_URL;
    savePendingSubscribeGoal(goal.id, null);
    const clickPromise = clickBackendStudioGoal(goal.id);
    openTelegramUrl(targetUrl);
    const clicked = await clickPromise;
    if (!clicked) {
      haptic('warning');
      scheduleSubscribeClaimRetry(null);
      return;
    }
    const clickedState = clicked.state;
    if (clickedState) {
      update(() => clickedState);
      if (clickedState.studioGoalClaims[goal.id]) {
        clearPendingSubscribeGoal();
        clearSubscribeRetryTimer();
        setSubscribePending(false);
        return;
      }
    }
    savePendingSubscribeGoal(goal.id, clicked.eligibleAt, clicked.clickedAt);
    scheduleSubscribeClaimRetry(clicked.eligibleAt);
  };

  useEffect(() => {
    if (subscribeClaimed) {
      clearPendingSubscribeGoal();
      clearSubscribeRetryTimer();
      setSubscribePending(false);
      return;
    }

    const claimOnResume = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return;
      const pending = readPendingSubscribeGoal();
      if (!pending) return;
      setSubscribePending(true);
      const delay = pendingSubscribeDelayMs(pending.eligibleAt);
      if (delay > 500) {
        scheduleSubscribeClaimRetry(pending.eligibleAt);
        return;
      }
      void tryClaimSubscribeGoal('resume');
    };

    claimOnResume();
    window.addEventListener('focus', claimOnResume);
    window.addEventListener('pageshow', claimOnResume);
    document.addEventListener('visibilitychange', claimOnResume);

    const webApp = window.Telegram?.WebApp as unknown as {
      onEvent?: (event: string, callback: () => void) => void;
      offEvent?: (event: string, callback: () => void) => void;
    } | undefined;
    try {
      webApp?.onEvent?.('viewportChanged', claimOnResume);
      webApp?.onEvent?.('activated', claimOnResume);
    } catch {
      // Telegram event bindings are best-effort across WebApp versions.
    }

    return () => {
      window.removeEventListener('focus', claimOnResume);
      window.removeEventListener('pageshow', claimOnResume);
      document.removeEventListener('visibilitychange', claimOnResume);
      try {
        webApp?.offEvent?.('viewportChanged', claimOnResume);
        webApp?.offEvent?.('activated', claimOnResume);
      } catch {
        // best-effort cleanup
      }
      clearSubscribeRetryTimer();
    };
  }, [subscribeClaimed]);

  if (!goals.length) return null;
  return (
    <section className="panel daily-tasks comic-card">
      <div className="section-head"><div><p className="eyebrow">{t('studio.studioGoals')}</p><h3>{t('studio.studioGoalsTitle')}</h3></div><button className="ghost" type="button" onClick={() => setOpen((value) => !value)}>{open ? t('studio.collapse') : t('studio.showAll')}</button></div>
      {visibleGoals.map((goal) => {
        const isSubscribeGoal = goal.id === SUBSCRIBE_HATCH_MIND_GOAL_ID;
        const claimed = Boolean(state.studioGoalClaims[goal.id]);
        const ready = goal.current >= goal.target && !claimed;
        const progress = subscribePending && isSubscribeGoal ? 50 : taskProgressPercent(goal.current, goal.target);
        const buttonText = isSubscribeGoal
          ? (claimed ? '✅' : subscribePending ? t('goals.subscribeHatchMind.checking') : goal.buttonLabel ?? t('goals.subscribeHatchMind.button'))
          : (claimed ? '✅' : ready ? rewardLabel(goal.reward) : Math.min(Math.round(goal.current), goal.target) + '/' + goal.target);
        const disabled = isSubscribeGoal ? claimed || subscribePending : !ready;
        const onClick = isSubscribeGoal ? () => void startSubscribeGoal(goal) : () => claim(goal);
        return <article className="task-card" key={goal.id}><div><strong>{goal.title}</strong><p>{goal.desc}</p><ProgressBar value={progress} /></div><button disabled={disabled} onClick={onClick}>{buttonText}</button></article>;
      })}
      <p className="small muted">{t('studio.completed', { done: completed, total: goals.length })}</p>
    </section>
  );
}

function ActiveGames({ state }: { state: GameState }) {
  if (!state.activeGames.length) return <section className="panel comic-card empty-panel"><h3>{t('studio.gameLifetime')}</h3><p className="muted">{t('studio.gameLifetimeEmpty')}</p></section>;
  return (
    <section className="panel comic-card">
      <div className="section-head compact"><h3>{t('studio.liveReleases')}</h3><span className="pill">{t('studio.passiveIncome')}</span></div>
      <div className="live-games">
        {state.activeGames.slice(0, 5).map((game) => (
          <article className="live-game" key={game.id}>
            <div><strong>{game.title}</strong><p>{t('studio.lifeAndPopularity', { left: game.lifeDaysRemaining, max: game.maxLifeDays, popularity: game.popularity.toFixed(2) })}</p><small>{localizedSavedText(game.lastEvent)}</small></div>
            <b>{t('studio.perDay', { coins: money(game.baseDailyIncome * game.popularity) })}</b>
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
      <div className="section-head compact"><h3>{t('studio.ledger')}</h3><span className="pill">{t('studio.latestEvents')}</span></div>
      {state.lastLedger.slice(-4).reverse().map((entry) => <div className={entry.kind === 'expense' ? 'ledger-row expense' : 'ledger-row'} key={entry.id}><span>{t('studio.ledgerRow', { day: entry.day, title: localizedSavedText(entry.title) })}</span><b>{entry.amount > 0 ? '+' : ''}{money(entry.amount)} 🪙</b></div>)}
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
      <div className="section-head hero-title"><div><p className="eyebrow">{t('develop.newGame')}</p><input className="project-name" value={project.name} maxLength={28} onChange={(event) => update((current) => ({ ...current, selectedProject: { ...(current.selectedProject ?? project), name: sanitizeProjectName(event.target.value) } }))} /></div></div>

      <ChoiceBlock kind="genre" title={t('develop.genreStep')} items={availableGenres} selected={project.genre} onSelect={(id) => update((current) => setProjectChoice(current, 'genre', id as GenreId))} tutorialTarget={!state.tutorialDone && state.tutorialStep <= 0} />
      <ChoiceBlock kind="theme" title={t('develop.themeStep')} items={availableThemes} selected={project.theme} onSelect={(id) => update((current) => setProjectChoice(current, 'theme', id as ThemeId))} itemHint={hasProductInstinct && project.genre ? (id) => comboFor(project.genre!, id as ThemeId) : undefined} hint={!hasProductInstinct ? t('develop.lockedInsightHint') : undefined} tutorialTarget={!state.tutorialDone && state.tutorialStep === 1} />
      <ChoiceBlock kind="platform" title={t('develop.platformStep')} items={platforms.filter((item) => item.unlockLevel <= state.level || item.id === 'micro_pc')} selected={project.platform} onSelect={(id) => update((current) => setProjectChoice(current, 'platform', id as PlatformId))} tutorialTarget={!state.tutorialDone && state.tutorialStep === 2} />

      {hasChoices && <EconomyPreview state={state} project={project} devCost={devCost} duration={duration} />}
      {hasProductInstinct && insight ? <ProductInstinctPanel insight={insight} /> : <LockedInsight />}
      <AudiencePanel state={state} update={update} />
      <FocusEditor project={project} update={update} />

      <button className={!state.tutorialDone && state.tutorialStep >= 3 ? "release-button tutorial-target" : "release-button"} disabled={!hasChoices || state.coins - devCost < -50000} onClick={() => update(startProject)}>{state.coins - devCost < -50000 ? t('develop.debtLimit') : t('develop.startDevelopmentCost', { cost: money(devCost) })}</button>
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
      const actionCost = action === 'skip' ? 15 : 35;
      const invoiceItemId = action === 'skip' ? 'time_skip' : 'promotion';
      if (backendReady) {
        const nextState = await runDevelopmentAction(action, {}, invoiceItemId);
        if (nextState) {
          update(() => nextState);
          haptic('success');
          return;
        }
        haptic('warning');
        return;
      }

      if (state.stars < actionCost) {
        haptic('warning');
        window.Telegram?.WebApp?.showPopup?.({
          message: t('shop.failed'),
          buttons: [{ type: 'ok' }],
        });
        return;
      }

      if (action === 'skip') update(timeSkipProject);
      if (action === 'promote') update(promoteProject);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="panel active-dev comic-card solo-dev-card">
      <div className="section-head compact"><div><p className="eyebrow">{t('develop.activeDevelopment')}</p><h3>{project.name}</h3></div></div>
      <div className="progress-fx active-progress-fx"><ProgressBar value={project.progress} label={`${Math.floor(project.progress)}%`} />{project.progress < 100 && <DevelopmentAmbientFx />}{project.progress < 100 && <DevelopmentTicker project={project} />}<DevPop project={project} />{project.devEventText?.startsWith('\u041f\u0420\u041e\u041c\u041e') && <PromotionBurst trigger={project.devEventId ?? 'promo'} />}</div>
      <div className="dev-tools-row">
        {project.progress >= 100 ? (
          <button className="primary" onClick={() => runBackendOrLocal('promote')} disabled={!canTryPromote || busyAction === 'promote'}>{project.promotionUsed ? t('develop.promotionBoost', { boost: (project.promotionBoost ?? 0).toFixed(1) }) : busyAction === 'promote' ? t('common.opening') : t('develop.promotionStars')}</button>
        ) : (
          <span className="dev-status-pill">{t('develop.inProgress')}</span>
        )}
        {project.progress < 100 && <button className="time-skip-button" disabled={!canTrySkip || busyAction === 'skip'} onClick={() => runBackendOrLocal('skip')}>{busyAction === 'skip' ? t('common.opening') : t('develop.speedUpQuarter')}</button>}
      </div>
      {project.devDecisionLog?.length ? <div className="decision-log">{project.devDecisionLog.map((item) => <span key={item}>{item}</span>)}</div> : null}
      {project.progress >= 100 && <button className={!state.tutorialDone && project.isTutorial ? 'release-button tutorial-target' : 'release-button'} onClick={() => update(releaseProject)}>{t('develop.releaseGameShort')}</button>}
    </div>
  );
}

function EconomyPreview({ state, project, devCost, duration }: { state: GameState; project: Project; devCost: number; duration: number }) {
  const platform = platforms.find((item) => item.id === project.platform);
  const genre = genres.find((item) => item.id === project.genre);
  return (
    <section className="economy-preview comic-card">
      <div><p className="eyebrow">{t('develop.projectBudget')}</p><h3>{t('develop.budgetMeta', { cost: money(devCost), minutes: Math.ceil(duration / 60) })}</h3><p className="muted">{t('develop.budgetDesc')}</p></div>
      <div className="mini-ledger"><span>{t('studio.genreLabel')}</span><b>×{(genre?.difficulty ?? 1).toFixed(2)}</b><span>{t('develop.tech')}</span><b>×{(platform?.techComplexity ?? 1).toFixed(2)}</b></div>
    </section>
  );
}

function ProductInstinctPanel({ insight }: { insight: NonNullable<ReturnType<typeof projectInsight>> }) {
  return (
    <section className={`product-instinct comic-card combo-${insight.combo.toLowerCase()}`}>
      <div className="section-head compact"><div><p className="eyebrow">{t('develop.productInstinct')}</p><h3>{t('develop.combo', { combo: comboLabel(insight.combo) })}</h3></div><span className="pill">{t('develop.unlocked')}</span></div>
      <p className="muted">{localizedProjectInsightNote() ?? insight.note}</p>
      {(['pre', 'production', 'post'] as const).map((phase) => <div className="focus-hint" key={phase}><strong>{phaseTitle(phase)}</strong><span>{prioritySentence(insight.recommendedFocus, phase)}</span></div>)}
    </section>
  );
}

function LockedInsight() {
  return <section className="locked-insight comic-card"><strong>{t('develop.comboLockedTitle')}</strong><p className="muted">{t('develop.comboLockedDesc')}</p></section>;
}

function FocusEditor({ project, update }: { project: Project; update: (fn: (state: GameState) => GameState) => void }) {
  return (
    <div className="panel comic-card">
      <div className="section-head compact"><h3>{t('develop.focusStep')}</h3><span className="muted">{t('develop.focusPercent')}</span></div>
      {(['pre', 'production', 'post'] as const).map((phase) => <div className="focus-card" key={phase}><strong>{phaseTitle(phase)}</strong>{phaseLabelsForUi(phase).map((label, index) => <label key={label}><span>{label}</span><input type="range" min="0" max="100" value={project.focus[phase][index]} onChange={(event) => { const value = Number(event.target.value); update((current) => { const currentProject = current.selectedProject ?? project; return { ...current, tutorialStep: current.tutorialDone ? current.tutorialStep : Math.max(current.tutorialStep, 3), selectedProject: { ...currentProject, focus: { ...currentProject.focus, [phase]: normalizeFocus(currentProject.focus[phase], index, value) } } }; }); }} /><b>{project.focus[phase][index]}%</b></label>)}</div>)}
    </div>
  );
}

function ChoiceBlock({ kind, title, items, selected, onSelect, hint, itemHint, tutorialTarget = false }: { kind: 'genre' | 'theme' | 'platform'; title: string; items: Array<{ id: string; name: string; nameEn?: string; emoji: string }>; selected: string | null; onSelect: (id: string) => void; hint?: string; itemHint?: (id: string) => string; tutorialTarget?: boolean }) {
  return (
    <div className="panel comic-card">
      <div className="section-head compact"><h3>{title}</h3>{hint && <span className="muted small">{hint}</span>}</div>
      <div className="chips">{items.map((item) => { const hintValue = itemHint?.(item.id); const iconName: IconName = kind; return <button key={item.id} className={`${selected === item.id ? 'chip selected' : 'chip'} ${hintValue ? `combo-${hintValue.toLowerCase()}` : ''}`} onClick={() => onSelect(item.id)}><ItemIcon id={item.id} fallback={iconName} /> <span>{localizedName(item)}</span>{hintValue && <em>{comboLabel(hintValue as 'Great' | 'Good' | 'Neutral' | 'Bad')}</em>}</button>; })}</div>
    </div>
  );
}

function HireScreen({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const slots = employeeSlotsForLevel(state.level);
  const [poolOffset, setPoolOffset] = useState(0);
  const [refreshPending, setRefreshPending] = useState(false);
  const hiredIds = new Set(state.employees.map((employee) => employee.id));
  const freshCandidates = employeePool.filter((candidate) => !state.hiredEmployeeIds.includes(candidate.id) && !hiredIds.has(candidate.id));
  const comebackCandidates = employeePool.filter((candidate) => !hiredIds.has(candidate.id));
  const allCandidates = freshCandidates.length ? freshCandidates : comebackCandidates;
  const available = Array.from({ length: Math.min(4, Math.max(1, allCandidates.length)) }, (_, i) => allCandidates[(poolOffset + i) % allCandidates.length]).filter(Boolean);
  const hireDiscount = state.unlockedResearchIds.includes('junior-pipeline') ? 0.9 : 1;
  const canRefresh = allCandidates.length > 4;
  const hire = (employee: Employee) => update((current) => {
    const currentSlots = employeeSlotsForLevel(current.level);
    const cost = Math.round(employee.cost * hireDiscount);
    if (current.coins < cost || current.employees.length >= currentSlots) return current;
    haptic('success');
    return { ...current, coins: current.coins - cost, employees: [...current.employees, employee], hiredEmployeeIds: [...current.hiredEmployeeIds, employee.id] };
  });
  const refreshPool = () => {
    if (!canRefresh || refreshPending) { haptic('warning'); return; }
    setRefreshPending(true);
    void purchaseBackendItem('refresh_hires').then((next) => {
      if (!next) {
        haptic('warning');
        return;
      }
      update(() => next);
      setPoolOffset((value) => value + Math.max(1, Math.floor(allCandidates.length / 2)));
      haptic('success');
    }).finally(() => {
      setRefreshPending(false);
    });
  };
  return (
    <div className="stack">
      <div className="section-head hero-title"><div><p className="eyebrow">{t('hire.market')}</p><h2>{t('hire.team')}</h2></div><span className="pill">{t('hire.slots', { used: state.employees.length, slots })}</span></div>
      {slots === 0 && <section className="locked-insight comic-card"><strong>{t('hire.lockedTitle')}</strong><p className="muted">{t('hire.lockedDesc')}</p></section>}
      {state.employees.length > 0 && <section className="panel comic-card"><div className="section-head compact"><h3>{t('hire.hired')}</h3><span className="pill">{t('hire.canFire')}</span></div><div className="cards-list compact-list">{state.employees.map((employee) => <article className="employee-card hired comic-card" key={employee.id}><div className="avatar"><Icon name={roleIcon(employee.role)} /></div><div><h3>{employee.name}</h3><p className="muted">{roleLabel(employee.role)} · {t('hire.levelShort', { level: employee.level })} · {specializationLabel(employee)}</p><p className="small employee-metrics">{employeeMetrics(employee)}</p></div><button className="danger" onClick={() => update((current) => fireEmployee(current, employee.id))}>{t('hire.fire')}</button></article>)}</div></section>}
      <div className="cards-list">{available.map((employee) => { const cost = Math.round(employee.cost * hireDiscount); return <article className="employee-card comic-card" key={employee.id}><div className="avatar"><Icon name={roleIcon(employee.role)} /></div><div><h3>{employee.name}</h3><p className="muted">{roleLabel(employee.role)} · {t('hire.levelShort', { level: employee.level })} · {specializationLabel(employee)}</p><p className="small employee-metrics">{employeeMetrics(employee)}</p></div><button disabled={state.coins < cost || state.employees.length >= slots} onClick={() => hire(employee)}>🪙 {money(cost)}</button></article>; })}</div>
      <button className="ghost wide" disabled={!canRefresh || refreshPending} onClick={refreshPool}>{refreshPending ? t('common.opening') : t('hire.refresh')}</button>
    </div>
  );
}

function formatProductInstinctTime(ms: number) {
  const safe = Math.max(0, Math.floor(ms));
  const days = Math.floor(safe / 86_400_000);
  const hours = Math.floor((safe % 86_400_000) / 3_600_000);
  if (days > 0) return t('common.daysHoursShort', { days, hours });
  const minutes = Math.max(1, Math.floor((safe % 3_600_000) / 60_000));
  return hours > 0 ? t('common.hoursMinutesShort', { hours, minutes }) : t('common.minutesShort', { minutes });
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
        window.Telegram?.WebApp?.showPopup?.({ message: t('research.activateFailed'), buttons: [{ type: 'ok' }] });
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
      <div className="section-head hero-title"><div><p className="eyebrow">{t('research.lab')}</p><h2>{t('research.title')}</h2></div><span className="pill">{state.unlockedResearchIds.length}/{researchNodes.length}</span></div>
      <article className={productActive ? 'research-node unlocked comic-card premium-research-card timed-product-instinct' : 'research-node comic-card premium-research-card timed-product-instinct'}>
        <div>
          <p className="eyebrow">{t('research.premiumSkill')}</p>
          <strong>{productActive ? '✅ ' : ''}{localizedTitle(productInstinct)}</strong>
          <span>{localizedDescription(productInstinct)}</span>
          <em>{productActive ? t('research.activeFor', { time: formatProductInstinctTime(productRemaining) }) : t('research.productCost', { stars: productStarCost, target: referralTarget, current: qualifiedReferrals })}</em>
        </div>
        {productActive ? (
          <button className="primary" disabled>{t('button.active')}</button>
        ) : canUnlockByReferrals ? (
          <button className="primary" disabled={productPending} onClick={activateProductByReferrals}>{t('research.activateFriends')}</button>
        ) : (
          <button className="primary" disabled={productPending} onClick={activateProductByPayment}>{productPending ? t('research.activating') : t('research.activateStars', { stars: productStarCost })}</button>
        )}
      </article>
      <div className="unlock-grid"><button className="unlock-card comic-card" disabled={state.rp < 24 || lockedGenres.length === 0} onClick={unlockRandomGenre}><strong><Icon name="genre" /> {t('research.randomGenre')}</strong><span>{lockedGenres.length ? t('research.left', { count: lockedGenres.length }) : t('research.allGenresOpen')}</span><em>🧪 24</em></button><button className="unlock-card comic-card" disabled={state.rp < 22 || lockedThemes.length === 0} onClick={unlockRandomTheme}><strong><Icon name="theme" /> {t('research.randomTheme')}</strong><span>{lockedThemes.length ? t('research.left', { count: lockedThemes.length }) : t('research.allThemesOpen')}</span><em>🧪 22</em></button></div>
      <div className="research-grid">{otherResearch.map((node) => { const unlocked = state.unlockedResearchIds.includes(node.id); const lockedByRequirement = node.requires ? !state.unlockedResearchIds.includes(node.requires) : false; return <button key={node.id} className={unlocked ? 'research-node unlocked comic-card' : 'research-node comic-card'} disabled={unlocked || lockedByRequirement || state.rp < node.cost} onClick={() => update((current) => { if (current.rp < node.cost || current.unlockedResearchIds.includes(node.id)) return current; haptic('success'); return { ...current, rp: current.rp - node.cost, unlockedResearchIds: [...current.unlockedResearchIds, node.id], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 }; })}><strong>{unlocked ? '✅ ' : ''}{localizedTitle(node)}</strong><span>{lockedByRequirement ? t('research.requiresPrevious') : localizedDescription(node)}</span><em>{unlocked ? localizedEffect(node) : '🧪 ' + node.cost}</em></button>; })}</div>
    </div>
  );
}

function ShopScreen({ state, update, onRenameStudio }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; onRenameStudio: () => void }) {
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string>('');
  const [purchaseResult, setPurchaseResult] = useState<{ title: string; reward: string } | null>(null);
  const renameCost = 15;
  const sku = [
    { id: 'starter_pack', title: t('shop.starterPack'), desc: t('shop.starterPackDesc'), price: 79, reward: `+${money(5000)} 🪙 +50 🧪` },
    { id: 'coins_5k', title: t('shop.coinsPack'), desc: t('shop.coinsPackDesc'), price: 39, reward: `+${money(5000)} 🪙` },
    { id: 'coins_25k', title: t('shop.bigCoinsPack'), desc: t('shop.bigCoinsPackDesc'), price: 149, reward: `+${money(25000)} 🪙` },
    { id: 'coins_100k', title: t('shop.megaCoinsPack'), desc: t('shop.megaCoinsPackDesc'), price: 399, reward: `+${money(100000)} 🪙` },
    { id: 'research_boost', title: t('shop.researchBoost'), desc: t('shop.researchBoostDesc'), price: 69, reward: '+50 🧪' },
  ] as const;

  const statusText = (status: string) => status === 'checking_balance'
    ? t('shop.checkingBalance')
    : status === 'opening_invoice'
      ? t('shop.openingInvoice')
      : status === 'checking_payment'
        ? t('shop.checkingPayment')
        : status === 'credited'
          ? t('shop.credited')
          : status === 'cancelled'
            ? t('shop.cancelled')
            : status === 'failed'
              ? t('shop.failed')
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

  const renameItem = { id: 'rename_studio', title: t('shop.renameTitle'), reward: t('shop.renameReward') };

  return <div className="stack"><div className="section-head hero-title"><div><p className="eyebrow">{t('shop.stars')}</p><h2>{t('shop.title')}</h2></div><span className="pill">{t('shop.usefulUpgrades')}</span></div><section className="shop-card comic-card shop-balance-card"><div><p className="eyebrow">{t('shop.starBalance')}</p><h3>{state.stars} ⭐</h3><p>{t('shop.balanceDesc')}</p></div><b>{t('shop.starPurchases')}</b></section>{pendingItem && <section className="shop-card comic-card shop-status-panel"><div><h3>{statusText(purchaseStatus) || t('shop.processingPurchase')}</h3><p>{t('shop.processingDesc')}</p></div><b>⏳</b></section>}<article className="shop-card comic-card"><div><h3>{t('shop.renameStudio')}</h3><p>{t('shop.currentName', { name: state.studioName || t('shop.noName') })}</p></div><button disabled={Boolean(pendingItem)} onClick={() => buy(renameItem, onRenameStudio)}>{pendingItem === 'rename_studio' ? statusText(purchaseStatus) || '…' : `⭐${renameCost}`}</button></article><div className="shop-list">{sku.map((item) => <article className="shop-card comic-card" key={item.id}><div><h3>{item.title}</h3><p>{item.desc}</p></div><button disabled={Boolean(pendingItem)} onClick={() => buy(item)}>{pendingItem === item.id ? statusText(purchaseStatus) || '…' : `⭐${item.price}`}</button></article>)}</div>{purchaseResult && <div className="modal-backdrop"><section className="release-modal offer comic-card purchase-success-modal"><span className="badge">{t('shop.credited')}</span><h2>{purchaseResult.title}</h2><p className="muted">{t('shop.purchaseAdded', { reward: purchaseResult.reward })}</p><button className="primary wide" onClick={() => setPurchaseResult(null)}>{t('shop.excellent')}</button></section></div>}</div>;
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
  if (error === 'invalid') return t('wallet.invalid');
  if (error === 'auth') return t('wallet.auth');
  if (error === 'backend') return t('wallet.backend');
  return t('wallet.saveFailed');
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
    setMessage(t('wallet.boundMessage'));
  };

  const unlink = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    setMessage('');
    const ok = await unlinkTonWallet();
    if (!ok) {
      haptic('warning');
      setStatus('error');
      setMessage(t('wallet.unlinkFailed'));
      return;
    }
    haptic('success');
    setWallet('');
    setInput('');
    setStatus('idle');
    setMessage(t('wallet.unboundMessage'));
  };

  return <section className="panel comic-card ton-wallet-card"><div className="section-head compact"><div><p className="eyebrow">{t('wallet.eyebrow')}</p><h3>{t('wallet.title')}</h3></div><span className="pill">{t('wallet.weeklyTop')}</span></div><p className="muted">{t('wallet.desc')}</p>{wallet ? <div className="ton-wallet-bound"><div><span>{t('wallet.bound')}</span><strong>{maskTonWallet(wallet)}</strong></div><button className="ghost" disabled={status === 'saving'} onClick={unlink}>{status === 'saving' ? t('wallet.unbinding') : t('button.unbind')}</button></div> : <div className="ton-wallet-form"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t('wallet.placeholder')} inputMode="text" autoComplete="off" /><button className="primary" disabled={!canBind} onClick={bind}>{status === 'saving' ? t('wallet.saving') : t('button.bind')}</button></div>}{message && <p className={status === 'error' ? 'small danger-text' : 'small muted'}>{message}</p>}{!wallet && cleanInput && !isLikelyTonWallet(cleanInput) && <p className="small muted">{t('wallet.formatHint')}</p>}</section>;
}

function RatingScreen({ state }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
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
  const currentPrize = yourIndex >= 0 ? prizeDistribution[yourIndex]?.[0] : null;
  const directRefs = state.qualifiedReferrals ?? 0;
  const secondRefs = state.qualifiedSecondLevelReferrals ?? 0;
  const claimMilestone = (id: string) => {
    void claimBackendReferralMilestone(id).then((next) => {
      haptic(next ? 'success' : 'warning');
    });
  };
  return <div className="stack">
    <section className="rating-hero comic-panel"><p className="eyebrow">{t('rating.weeklyTop')}</p><h2>{t('rating.title')}</h2><p className="muted">{t('rating.desc')}</p></section>
    <TonWalletPanel />
    <div className="panel comic-card current-prize-card"><div><p className="eyebrow">{t('rating.currentPrize')}</p><h3>{yourPlace ? t('rating.youAt', { place: yourPlace }) : t('rating.outsideTop')}</h3><p className="muted">{currentPrize ? t('rating.prizeIfNow', { prize: currentPrize }) : t('rating.makeStrongRelease')}</p></div><strong>{currentPrize ?? '0 ⭐'}</strong></div>
    <section className="panel comic-card rating-formula"><div className="section-head compact"><h3>{t('rating.formulaTitle')}</h3><span className="pill">{money(rating.total)}</span></div><p className="muted">{t('rating.formulaDesc')}</p><div className="score-breakdown-list">{rating.items.map(([label, value]) => <div className={value >= 0 ? 'score-line bonus' : 'score-line penalty'} key={label}><span>{label}</span><b>{value >= 0 ? '+' : ''}{money(value)}</b></div>)}</div></section>
    <div className="panel comic-card"><div className="section-head compact"><h3>{t('rating.prizePool')}</h3><span className="pill">{t('rating.top10')}</span></div><div className="prize-grid">{prizeDistribution.map(([amount, percent], index) => <div className={yourIndex === index ? 'prize-cell current' : 'prize-cell'} key={`${amount}-${index}`}><span>#{index + 1}</span><strong>{amount}</strong><em>{percent}</em></div>)}</div></div>
    <div className="panel comic-card"><h3>{t('rating.bestGames')}</h3>{leaderboardLoaded && leaderboard.length === 0 ? <p className="muted">{t('rating.empty')}</p> : null}{!leaderboardLoaded ? <p className="muted">{t('rating.loading')}</p> : null}{leaderboard.map((row, index) => { const isYou = myTelegramId && String(row.telegramId) === myTelegramId; return <div className={isYou ? 'leader-row you' : 'leader-row'} key={row.telegramId || row.displayName || index}><span>#{index + 1}</span><div><strong>{row.bestTitle || t('rating.releaseFallback')}</strong><p>{isYou ? t('rating.you') : row.displayName || t('rating.player')}</p></div><b>{money(Number(row.score || 0))}</b></div>; })}</div>
    <section className="panel comic-card referral-panel"><div className="section-head compact"><div><p className="eyebrow">{t('rating.referralProgram')}</p><h3>{t('rating.inviteLevels')}</h3></div><span className="pill">{t('rating.friendIncome')}</span></div><p className="muted">{t('rating.referralDesc')}</p><div className="referral-grid"><article><b>{t('rating.level1')}</b><strong>{directRefs}</strong><span>{t('rating.level1Desc')}</span></article><article><b>{t('rating.level2')}</b><strong>{secondRefs}</strong><span>{t('rating.level2Desc')}</span></article></div><div className="referral-note"><strong>{t('rating.friendCreditTitle')}</strong><span>{t('rating.friendCreditDesc')}</span></div><div className="milestone-list">{REFERRAL_MILESTONES.map((item) => { const claimed = Boolean(state.referralMilestoneClaims?.[item.id]); const ready = directRefs >= item.target; return <button key={item.id} className={claimed ? 'milestone claimed' : 'milestone'} disabled={!ready || claimed} onClick={() => claimMilestone(item.id)}><span>{t(item.labelKey)}</span><b>{claimed ? t('contract.received') : `+${money(item.reward.coins)} 🪙 +${item.reward.rp} 🧪`}</b></button>; })}</div></section>
    <button className="primary wide" onClick={() => shareRelease(t('rating.referralShareText'), { url: 'https://t.me/DevTycoon_bot?startapp=ref_demo', imageUrl: undefined, storyText: t('rating.referralStoryText') })}>{t('rating.shareReferral')}</button>
  </div>;
}


function formatDevChoiceEffect(choice: DevEventChoice) {
  const effect = choice.effect;
  const parts: string[] = [];
  if (effect.coins) parts.push(effect.coins < 0 ? t('devEvent.effectCoinsCost', { value: money(Math.abs(effect.coins)) }) : t('devEvent.effectCoinsGain', { value: money(effect.coins) }));
  if (effect.stars) parts.push(effect.stars < 0 ? t('devEvent.effectStarsCost', { value: Math.abs(effect.stars) }) : t('devEvent.effectStarsGain', { value: effect.stars }));
  if (effect.rp) parts.push(effect.rp < 0 ? t('devEvent.effectScienceCost', { value: Math.abs(effect.rp) }) : t('devEvent.effectScienceGain', { value: effect.rp }));
  if (effect.progress) parts.push(effect.progress < 0 ? t('devEvent.effectProgressLoss', { value: effect.progress }) : t('devEvent.effectProgressGain', { value: effect.progress }));
  if (effect.score) parts.push(effect.score < 0 ? t('devEvent.effectScoreLoss', { value: effect.score.toFixed(2) }) : t('devEvent.effectScoreGain', { value: effect.score.toFixed(2) }));
  if (effect.salesMultiplier && effect.salesMultiplier !== 1) parts.push(t('devEvent.effectIncome', { value: effect.salesMultiplier.toFixed(2) }));
  return parts.length ? parts.join(' · ') : t('devEvent.noNumericEffect');
}

function lockedDevChoiceReason(state: GameState, choice: DevEventChoice) {
  const effect = choice.effect;
  if ((effect.stars ?? 0) < 0 && state.stars < Math.abs(effect.stars ?? 0)) return t('devEvent.notEnoughStars', { value: Math.abs(effect.stars ?? 0) });
  if ((effect.rp ?? 0) < 0 && state.rp < Math.abs(effect.rp ?? 0)) return t('devEvent.notEnoughScience', { value: Math.abs(effect.rp ?? 0) });
  if ((effect.coins ?? 0) < 0 && state.coins + (effect.coins ?? 0) < -50000) return t('devEvent.debtLimit');
  return null;
}

function localizedDevScenarioTitle(scenario: { title: string; titleEn?: string }) {
  return getLanguage() === 'en' ? scenario.titleEn ?? t('devEvent.genericTitle') : scenario.title;
}

function localizedDevScenarioBody(scenario: { body: string; bodyEn?: string }) {
  return getLanguage() === 'en' ? scenario.bodyEn ?? t('devEvent.genericBody') : scenario.body;
}

function localizedDevChoiceLabel(choice: DevEventChoice) {
  if (getLanguage() === 'ru') return choice.label;
  return choice.labelEn ?? (choice.id === 'a' ? t('devEvent.choiceA') : t('devEvent.choiceB'));
}

function localizedDevChoiceResult(choice: DevEventChoice) {
  if (getLanguage() === 'ru') return choice.result;
  return choice.resultEn ?? (choice.id === 'a' ? t('devEvent.resultA') : t('devEvent.resultB'));
}

function DevelopmentEventModal({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const pending = state.selectedProject?.pendingDevEvent;
  const scenario = pending ? getDevelopmentScenario(pending.scenarioId) : null;
  if (!pending || !scenario) return null;
  return (
    <div className="modal-backdrop dev-event-backdrop">
      <section role="dialog" aria-modal="true" aria-labelledby="dev-event-title" className={`dev-event-modal comic-card tone-${scenario.tone}`}>
        <p className="eyebrow">{t('devEvent.eyebrow', { progress: Math.floor(pending.triggeredAtProgress) })}</p>
        <h2 id="dev-event-title">{localizedDevScenarioTitle(scenario)}</h2>
        <p className="muted">{localizedDevScenarioBody(scenario)}</p>
        <div className="dev-event-choices">
          {scenario.choices.map((choice, index) => {
            const rawLocks = scenario.choices.map((item) => lockedDevChoiceReason(state, item));
            const lockedReason = rawLocks.every(Boolean) && index === 0 ? null : rawLocks[index];
            return (
              <button key={choice.id} disabled={Boolean(lockedReason)} className={lockedReason ? 'choice-locked' : ''} onClick={() => update((current) => resolveDevelopmentEvent(current, choice.id))}>
                <strong>{localizedDevChoiceLabel(choice)}</strong>
                <span>{localizedDevChoiceResult(choice)}</span>
                <em>{lockedReason ? t('devEvent.locked', { reason: lockedReason }) : formatDevChoiceEffect(choice)}</em>
              </button>
            );
          })}
        </div>
        <p className="small muted">{t('devEvent.continueHint')}</p>
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

function localizedQualityLabel(label: string, score: number) {
  if (getLanguage() === 'ru') return label;
  if (score >= 9) return 'Hit!';
  if (score >= 7.5) return 'Strong release';
  if (score >= 6) return 'Good start';
  return 'Needs polish';
}

function localizedCriticName(name: string, index: number) {
  if (getLanguage() === 'ru') return name;
  return ['Pixel Today', 'Indie Radar', 'Game Week', 'Build Report'][index % 4] ?? 'Game Press';
}

function localizedCriticQuote(score: number, quote: string) {
  if (getLanguage() === 'ru') return quote;
  if (score >= 9) return 'A confident, memorable release with real spark.';
  if (score >= 7.5) return 'A strong game that knows what players came for.';
  if (score >= 6) return 'A solid release with a few rough edges.';
  if (score >= 4) return 'Good ideas are here, but the build needs more polish.';
  return 'The project needed more time before release.';
}

function localizedScoreBreakdownLabel(item: ScoreBreakdownItem, combo: string) {
  if (item.label.startsWith('\u041a\u043e\u043c\u0431\u043e')) return t('release.comboLabel', { combo: comboLabel(combo as 'Great' | 'Good' | 'Neutral' | 'Bad') });
  if (getLanguage() === 'ru') return item.label;
  if (item.kind === 'base') return t('develop.focusStep').replace(/^4\.\s*/, '');
  if (item.kind === 'random') return t('scoreHelp.randomTitle');
  return item.value >= 0 ? 'Release bonus' : 'Release penalty';
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
  const isFirstSessionPush = state.gamesReleased === 1;

  return (
    <div className="modal-backdrop release-backdrop">
      <section className="release-modal comic-card animated-release" role="dialog" aria-modal="true" aria-labelledby="release-title">
        <p className="eyebrow">{t('release.eyebrow')}</p>
        <h2 id="release-title">{result.projectName}</h2>
        <div className={`release-score-top ${showFinal ? criticToneClass(result.score) : ''}`}>
          {showFinal ? (
            <div className="score-stage">
              <ConfettiBurst />
              <strong className="big-score">{result.score}/10</strong>
              <span className="quality">{t('release.qualityLine', { quality: localizedQualityLabel(result.qualityLabel, result.score), combo: comboLabel(result.combo) })}</span>
              <span className="critic-average-note">{t('release.criticAverage', { average: result.criticAverage })}</span>
            </div>
          ) : (
            <div className="score-suspense">{t('release.suspense')}</div>
          )}
        </div>
        <div className="critic-grid animated-critics release-critic-grid-2x2">
          {result.critics.map((critic, index) => (
            <div className={`${step > index ? 'critic-card shown' : 'critic-card'} ${step > index ? criticToneClass(critic.score) : ''}`} key={critic.name}>
              <span>{localizedCriticName(critic.name, index)}</span>
              <b>{step > index ? critic.score : '…'}</b>
              <em>{step > index ? localizedCriticQuote(critic.score, critic.quote) : t('release.readingBuild')}</em>
            </div>
          ))}
        </div>

        {showMoney && (
          <>
            <div className="score-breakdown">
              <div className="section-head compact"><h3>{t('release.scoreBreakdown')}</h3><span className="pill">{t('release.finalScore', { score: result.score })}</span></div>
              <p>{t('release.breakdownDesc')}</p>
              <div className="score-breakdown-list">
                                                                                                                                                                {result.scoreBreakdown.map((item) => {
                  const displayLabel = localizedScoreBreakdownLabel(item, result.combo);
                  const info = scoreExplanation(item);
                  const influenceLabel = info.tone === 'high' ? t('release.influenceHigh') : info.tone === 'medium' ? t('release.influenceMedium') : t('release.influenceNone');
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
              <span>{t('release.salesNow', { sales: money(result.sales) })}</span>
              <span>+{result.rp} 🧪</span>
              {Boolean(result.stars) && <span>+{result.stars} ⭐</span>}
            </div>
            <div className="life-result">
              <b>{t('release.lifetime', { days: result.lifetimeDays })}</b>
              <p>{t('release.passiveForecast', { income: money(result.passivePerDay) })}</p>
            </div>
            {Boolean(result.bonusRewards?.length) && <div className="bonus-list">{result.bonusRewards?.map((item) => <span key={item}>{localizedSavedText(item)}</span>)}</div>}
            <div className="inline-actions release-actions">
              {result.score >= 8.5 && <button className="primary" onClick={() => shareRelease(t('release.shareText', { name: result.projectName, score: result.score }), { url: 'https://t.me/DevTycoon_bot?startapp=share_release', imageUrl: undefined, storyText: `${result.projectName}: ${result.score}/10` })}>{t('release.share')}</button>}
              <button onClick={() => update((current) => ({ ...current, latestRelease: null, screen: 'develop', selectedProject: createProject(false) }))}>{t('release.nextGame')}</button>
              <button className="ghost" onClick={() => update((current) => ({ ...current, latestRelease: null }))}>{t('common.close')}</button>
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
    ? t('scoreHelp.base')
    : isPositive
      ? t('scoreHelp.positive')
      : item.value < 0
        ? t('scoreHelp.negative')
        : t('scoreHelp.neutral');

  if (label.startsWith('\u041a\u043e\u043c\u0431\u043e')) {
    return { title: t('scoreHelp.comboTitle'), text: t('scoreHelp.comboText'), influence: t('scoreHelp.comboInfluence'), tone: 'high' as const, signText };
  }

  const fallback = item.kind === 'random'
    ? { title: t('scoreHelp.randomTitle'), text: t('scoreHelp.randomText'), influence: t('scoreHelp.randomInfluence'), tone: 'none' as const }
    : { title: getLanguage() === 'ru' ? label : t('scoreHelp.factorTitle'), text: t('scoreHelp.factorText'), influence: t('scoreHelp.factorInfluence'), tone: 'medium' as const };
  return { ...fallback, signText };
}

function ScoreExplanationModal({ item, onClose }: { item: ScoreBreakdownItem; onClose: () => void }) {
  const info = scoreExplanation(item);
  const influenceLabel = info.tone === 'high' ? t('release.influenceHigh') : info.tone === 'medium' ? t('release.influenceMedium') : t('release.influenceNone');
  return (
    <div className="nested-modal-backdrop score-help-backdrop" onClick={onClose}>
      <section className="score-help-modal comic-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" type="button" onClick={onClose} aria-label={t('common.close')}>×</button>
        <p className="eyebrow">{t('release.scoreHelpTitle')}</p>
        <h3>{info.title}</h3>
        <div className={'score-help-influence influence-' + info.tone}>{influenceLabel}</div>
        <p>{info.text}</p>
        <p className="score-help-player-note">{info.influence}</p>
        <div className="score-help-value"><span>{t('release.currentImpact')}</span><b>{item.kind === 'base' ? item.value.toFixed(2) : scoreDelta(item.value)}</b></div>
        <p className="small muted">{info.signText}</p>
        <button className="primary wide" type="button" onClick={onClose}>{t('button.gotIt')}</button>
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
    ? t('starter.checkingBalance')
    : status === 'opening_invoice'
      ? t('starter.openingInvoice')
      : status === 'checking_payment'
        ? t('starter.checkingPayment')
        : status === 'credited'
          ? t('starter.credited')
          : status === 'cancelled'
            ? t('starter.cancelled')
            : status === 'failed'
              ? t('starter.failed')
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
  return <div className="modal-backdrop"><section className="release-modal offer comic-card"><span className="badge">{t('starter.oneTime')}</span><h2>{t('starter.title')}</h2><p className="muted">{t('starter.desc')}</p>{statusText && <p className="shop-payment-status">{statusText}</p>}<div className="inline-actions"><button className="primary" disabled={pending} onClick={buy}>{pending ? statusText || t('starter.opening') : t('starter.buy')}</button><button className="ghost" disabled={pending} onClick={() => update((current) => ({ ...current, offerSeen: true }))}>{t('starter.notNow')}</button></div></section></div>;
}

function Onboarding({ update }: { update: (fn: (state: GameState) => GameState) => void }) {
  const [slide, setSlide] = useState(0);
  const slides: Array<[IconName, string, string, string]> = [
    ['rocket', t('onboarding.slide1Title'), t('onboarding.slide1Body'), t('onboarding.slide1Button')],
    ['clock', t('onboarding.slide2Title'), t('onboarding.slide2Body'), t('onboarding.slide2Button')],
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
        <p className="eyebrow">{t('onboarding.quickStart')}</p>
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
  return <div className="modal-backdrop naming-backdrop"><section className="onboarding-card comic-card naming-card"><div className="onboarding-emoji"><Icon name="studio" /></div><h2>{mode === 'initial' ? t('naming.initialTitle') : t('naming.renameTitle')}</h2><p>{mode === 'initial' ? t('naming.initialBody') : t('naming.renameBody')}</p><input className="project-name studio-name-input" placeholder={t('naming.placeholder')} value={value} maxLength={18} onChange={(event) => setValue(event.target.value)} autoFocus /><div className="inline-actions">{onCancel && <button className="ghost" onClick={onCancel}>{t('common.cancel')}</button>}<button className="primary" disabled={!clean} onClick={() => clean && onSubmit(clean)}>{mode === 'initial' ? t('common.continue') : t('common.save')}</button></div></section></div>;
}

function PromotionBurst({ trigger }: { trigger: string }) {
  return <div key={trigger} className="promotion-burst" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>;
}

function BottomNav({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  return <nav className="bottom-nav">{navItems.map(([id, labelKey, icon]) => <button key={id} className={`${state.screen === id ? 'active' : ''} ${id === 'studio' ? 'main-tab' : ''} ${!state.tutorialDone && state.onboardingDone && state.screen !== 'develop' && id === 'develop' ? 'tutorial-target' : ''}`.trim()} onClick={() => update((current) => ({ ...current, screen: id }))}><Icon name={icon as IconName} />{t(labelKey)}</button>)}</nav>;
}



function DevelopmentAmbientFx() {
  return <div className="dev-ambient" aria-hidden="true">
    <span>CODE</span><span>ART</span><span>TEST</span><span>HYPE</span><span>FIX</span>
  </div>;
}

const devTickerWords = ['CODE!', 'ART!', 'TEST!', 'FIX!', 'HYPE!', 'BUILD!', 'POLISH!', 'IDEA!'];

function DevelopmentTicker({ project }: { project: Project }) {
  const [pulse, setPulse] = useState({ id: 0, text: 'CODE!', x: 14 });
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
  return <span key={project.devEventId} className={project.devEventTone === 'danger' ? 'dev-pop danger' : 'dev-pop'}>{localizedSavedText(project.devEventText)}</span>;
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return <div className={label ? 'progress progress-labeled' : 'progress'}><i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />{label && <b>{label}</b>}</div>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return <div className="stat-card comic-card"><Icon name={icon} /><strong>{value}</strong><p>{label}</p></div>;
}
