const DEFAULT_DURATION_SECONDS = 180;
const MAX_SERVER_ELAPSED_MS = Number(process.env.DEV_SERVER_MAX_ELAPSED_MS || 6 * 60 * 60 * 1000);

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function clampNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function safeInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(clampNumber(value, min, max));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
  return String(value || fallback).replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || fallback;
}

function sameProject(a, b) {
  return Boolean(isPlainObject(a) && isPlainObject(b) && a.id && b.id && String(a.id) === String(b.id));
}

function researchHas(data, id) {
  return safeArray(data?.unlockedResearchIds).includes(id);
}

function studioMomentumRatio(data) {
  return clampNumber((Number(data?.studioXp) || 0) / 1200, 0, 1);
}

function releaseVelocityBoost(data) {
  return Math.min(0.32, Math.log1p(Math.max(0, Number(data?.gamesReleased) || 0)) * 0.045);
}

function studioLevelSpeedBoost(data) {
  return Math.max(0, Math.floor(Number(data?.level) || 1) - 1) * 0.07;
}

function developmentSpeedMultiplier(data) {
  const employees = safeArray(data?.employees);
  const employeeBoost = employees.reduce((sum, employee) => sum + (Number(employee?.speedBoost) || 0), 0);
  const researchBoost =
    (researchHas(data, 'fast-prototype') ? 0.1 : 0) +
    (researchHas(data, 'engine-v2') ? 0.15 : 0) +
    (researchHas(data, 'ai-assist') ? 0.12 : 0);
  const synergy = researchHas(data, 'team-synergy') ? employees.length * 0.025 : 0;
  const momentum = 1 + studioMomentumRatio(data) * 0.25;
  return clampNumber((1 + employeeBoost + researchBoost + synergy + releaseVelocityBoost(data) + studioLevelSpeedBoost(data)) * momentum, 0.55, 3.75);
}

function sanitizeReleaseHistory(history) {
  return safeArray(history)
    .filter(isPlainObject)
    .map((entry) => ({
      title: safeText(entry.title || entry.projectName, 'Безымянный релиз'),
      genre: safeText(entry.genre, 'arcade'),
      theme: safeText(entry.theme, 'space'),
      score: Number(clampNumber(entry.score, 1, 10).toFixed(1)),
      day: safeInt(entry.day, 1, 999999),
    }))
    .slice(-16);
}

function sanitizeActiveGames(games) {
  return safeArray(games)
    .filter(isPlainObject)
    .map((game) => ({
      id: safeText(game.id, `game-${Date.now()}`),
      title: safeText(game.title || game.projectName, 'Живой релиз'),
      genre: safeText(game.genre, 'arcade'),
      theme: safeText(game.theme, 'space'),
      score: Number(clampNumber(game.score, 1, 10).toFixed(1)),
      popularity: Number(clampNumber(game.popularity, 0.35, 1.9).toFixed(2)),
      baseDailyIncome: safeInt(game.baseDailyIncome, 20, 1000000),
      lifeDaysRemaining: safeInt(game.lifeDaysRemaining, 0, 30),
      maxLifeDays: safeInt(game.maxLifeDays || game.lifeDaysRemaining, 1, 30),
      totalEarned: safeInt(game.totalEarned, 0, Number.MAX_SAFE_INTEGER),
      lastEvent: safeText(game.lastEvent, 'Релиз живёт своей жизнью.'),
      createdGameDay: safeInt(game.createdGameDay, 1, 999999),
    }))
    .slice(0, 12);
}

function sanitizeLedger(ledger) {
  return safeArray(ledger)
    .filter(isPlainObject)
    .map((entry) => ({
      id: safeText(entry.id, `ledger-${Date.now()}`),
      day: safeInt(entry.day, 1, 999999),
      title: safeText(entry.title, 'Событие'),
      amount: safeInt(entry.amount, -100000000, 100000000),
      kind: entry.kind === 'expense' ? 'expense' : 'income',
    }))
    .slice(-10);
}

function sanitizeMarketEvents(events) {
  return safeArray(events)
    .filter(isPlainObject)
    .map((event) => ({
      ...event,
      id: safeText(event.id, `event-${Date.now()}`),
      title: safeText(event.title, 'Событие рынка'),
      description: safeText(event.description, 'Рынок меняется.'),
      daysRemaining: safeInt(event.daysRemaining, 0, 31),
      salesMultiplier: Number(clampNumber(event.salesMultiplier, 0.1, 5).toFixed(2)),
      scoreModifier: Number(clampNumber(event.scoreModifier, -5, 5).toFixed(2)),
      tone: ['boom', 'risk', 'neutral'].includes(event.tone) ? event.tone : 'neutral',
    }))
    .slice(0, 4);
}

function sanitizePersistentCollections(data) {
  if (!isPlainObject(data)) return data;
  return {
    ...data,
    releaseHistory: sanitizeReleaseHistory(data.releaseHistory),
    activeGames: sanitizeActiveGames(data.activeGames),
    lastLedger: sanitizeLedger(data.lastLedger),
    activeMarketEvents: sanitizeMarketEvents(data.activeMarketEvents),
  };
}

function earliestStartedAt(currentProject, previousProject) {
  const currentStartedAt = Number(currentProject?.startedAt) || 0;
  const previousStartedAt = Number(previousProject?.startedAt) || 0;
  if (currentStartedAt && previousStartedAt) return Math.min(currentStartedAt, previousStartedAt);
  return currentStartedAt || previousStartedAt || 0;
}

export function mergeServerDevelopment(incomingData, previousData) {
  if (!isPlainObject(incomingData)) return incomingData;
  const incomingProject = incomingData.selectedProject;
  const previousProject = previousData?.selectedProject;

  if (!sameProject(incomingProject, previousProject)) return sanitizePersistentCollections(incomingData);

  const incomingProgress = clampNumber(incomingProject.progress, 0, 100);
  const previousProgress = clampNumber(previousProject.progress, 0, 100);
  const progress = Number(Math.max(incomingProgress, previousProgress).toFixed(2));
  const startedAt = earliestStartedAt(incomingProject, previousProject);

  return sanitizePersistentCollections({
    ...incomingData,
    selectedProject: {
      ...incomingProject,
      startedAt,
      progress,
      durationSeconds: clampNumber(incomingProject.durationSeconds || previousProject.durationSeconds, 1, 900),
    },
  });
}

export function normalizeServerDevelopment(data, previousData = null) {
  if (!isPlainObject(data)) return data;
  const baseData = sanitizePersistentCollections(data);
  const project = baseData.selectedProject;
  if (!isPlainObject(project)) return baseData;

  const previousProject = sameProject(project, previousData?.selectedProject) ? previousData.selectedProject : null;
  const startedAt = earliestStartedAt(project, previousProject);
  const durationSeconds = clampNumber(project.durationSeconds, 1, 900) || DEFAULT_DURATION_SECONDS;
  const clientProgress = clampNumber(project.progress, 0, 100);
  const previousProgress = previousProject ? clampNumber(previousProject.progress, 0, 100) : 0;

  if (!startedAt || project.pendingDevEvent || clientProgress >= 100) {
    return {
      ...baseData,
      selectedProject: {
        ...project,
        startedAt: startedAt || project.startedAt,
        progress: Number(Math.max(clientProgress, previousProgress).toFixed(2)),
        serverProgressAt: Date.now(),
      },
    };
  }

  const now = Date.now();
  const elapsedMs = clampNumber(now - startedAt, 0, MAX_SERVER_ELAPSED_MS);
  const serverProgress = clampNumber((elapsedMs / (durationSeconds * 1000)) * 100 * developmentSpeedMultiplier(baseData), 0, 100);
  const progress = Number(Math.max(clientProgress, previousProgress, serverProgress).toFixed(2));

  return {
    ...baseData,
    selectedProject: {
      ...project,
      startedAt,
      durationSeconds,
      progress,
      serverProgressAt: now,
    },
    lastSavedAt: now,
  };
}

export function publicDevelopmentStatus(data) {
  const normalized = normalizeServerDevelopment(data);
  const project = normalized?.selectedProject;
  return {
    serverNow: Date.now(),
    active: isPlainObject(project),
    project: isPlainObject(project) ? {
      id: project.id || null,
      name: project.name || '',
      progress: clampNumber(project.progress, 0, 100),
      durationSeconds: clampNumber(project.durationSeconds, 1, 900),
      startedAt: Number(project.startedAt) || null,
      paused: Boolean(project.pendingDevEvent),
      serverProgressAt: Number(project.serverProgressAt) || null,
    } : null,
  };
}
