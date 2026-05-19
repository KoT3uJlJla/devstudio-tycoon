import { normalizeState } from './gameLogic';
import { syncGlobalState } from './globalWorld';
import type { GameState } from './types';

const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = import.meta.env.VITE_API_URL ?? '';

type BackendPayload = {
  ok?: boolean;
  save?: { data?: unknown } | null;
  economy?: { stars?: unknown } | null;
  error?: string;
};

type DevelopmentEndpoint = 'skip' | 'promote' | 'start' | 'release' | 'resolve-event';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function telegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

function canUseBackend() {
  return Boolean(API_URL && telegramInitData());
}

function persistState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // local cache is best-effort
  }
  try {
    window.dispatchEvent(new CustomEvent('devstudio:server-save', { detail: state }));
  } catch {
    // best-effort live sync hook
  }
}

function normalizePayloadState(payload: BackendPayload | null): GameState | null {
  const data = payload?.save?.data;
  if (!payload?.ok || !isPlainObject(data)) return null;
  try {
    const economyStars = Number(payload.economy?.stars);
    const withEconomy = Number.isFinite(economyStars) ? { ...data, stars: economyStars } : data;
    const state = syncGlobalState(normalizeState(withEconomy as Partial<GameState>));
    persistState(state);
    return state;
  } catch {
    return null;
  }
}

async function postJson(path: string, body: Record<string, unknown> = {}): Promise<GameState | null> {
  if (!canUseBackend()) return null;
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${telegramInitData()}`,
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!response) return null;
  const payload = await response.json().catch(() => null) as BackendPayload | null;
  if (!response.ok || !payload?.ok) return null;
  return normalizePayloadState(payload);
}

export function purchaseBackendItem(itemId: string) {
  return postJson('/api/economy/shop/purchase', { itemId });
}

export function claimBackendDailyReward() {
  return postJson('/api/economy/daily');
}

export function claimBackendDailyTask(taskId: string) {
  return postJson('/api/economy/daily-task/claim', { taskId });
}

export function claimBackendReferralMilestone(milestoneId: string) {
  return postJson('/api/economy/referral/claim', { milestoneId });
}

export function runBackendDevelopmentAction(endpoint: DevelopmentEndpoint, body: Record<string, unknown> = {}) {
  return postJson(`/api/development/${endpoint}`, body);
}
