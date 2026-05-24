const SERVER_OWNED_SAVE_FIELDS = [
  "coins", "rp", "stars", "qualifiedReferrals", "qualifiedSecondLevelReferrals", "referralMilestoneClaims",
  "level", "studioXp", "gamesReleased", "bestScore", "latestRelease", "activeGames", "releaseHistory",
  "employees", "hiredEmployeeIds", "unlockedResearchIds", "unlockedGenreIds", "unlockedThemeIds",
  "dailyClaimedAt", "dailyStatsDate", "dailyGamesReleased", "dailyWorkTaps", "dailyResearchUnlocked",
  "dailyPassiveIncome", "dailyTaskClaims", "weeklyExpenseTotal", "unpaidSinceMonth", "closureWarningMonth",
  "ratingResetCount", "activeMarketEvents", "newsFeed", "audience", "lastLedger", "marketMustRecover",
  "tutorialDone", "tutorialStep", "tutorialRewardClaimed", "gameDay", "lastGameTickAt", "lastOfflineReward",
  "offerSeen", "productInstinctUntil", "unlockedResearchMeta", "saveSchemaVersion",
];

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.floor(Math.min(max, Math.max(min, parsed)));
}

function cleanText(value, fallback = "") {
  return String(value || fallback).replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function initialTrustedSaveData() {
  const now = Date.now();
  return {
    coins: 3000,
    rp: 0,
    stars: 0,
    qualifiedReferrals: 0,
    qualifiedSecondLevelReferrals: 0,
    referralMilestoneClaims: {},
    level: 1,
    studioXp: 0,
    gamesReleased: 0,
    bestScore: 0,
    latestRelease: null,
    activeGames: [],
    releaseHistory: [],
    employees: [],
    hiredEmployeeIds: [],
    unlockedResearchIds: [],
    unlockedGenreIds: ["arcade", "platformer", "puzzle", "strategy"],
    unlockedThemeIds: ["space", "fantasy", "cyberpunk"],
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
    newsFeed: [],
    audience: undefined,
    lastLedger: [],
    marketMustRecover: false,
    tutorialDone: false,
    tutorialStep: 0,
    tutorialRewardClaimed: false,
    gameDay: 1,
    lastGameTickAt: now,
    lastOfflineReward: 0,
    offerSeen: false,
    saveSchemaVersion: 3,
  };
}

function safeClientProjectDraft(project, previousProject) {
  if (isPlainObject(previousProject) && (previousProject.startedAt || previousProject.pendingDevEvent || safeInt(previousProject.progress, 0, 100) > 1)) return previousProject;
  if (!isPlainObject(project)) return previousProject && !previousProject.startedAt ? previousProject : null;
  if (project.startedAt || project.pendingDevEvent || safeInt(project.progress, 0, 100) > 1) return null;
  return {
    id: cleanText(project.id || "", "").slice(0, 64),
    name: cleanText(project.name || "New Game", "New Game"),
    genre: cleanText(project.genre || "", ""),
    theme: cleanText(project.theme || "", ""),
    platform: cleanText(project.platform || "micro_pc", "micro_pc"),
    focus: isPlainObject(project.focus) ? project.focus : undefined,
    progress: 0,
    startedAt: null,
  };
}

export function mergeServerOwnedSaveData(incomingData, previousData) {
  const incoming = isPlainObject(incomingData) ? incomingData : {};
  const trustedBase = isPlainObject(previousData) ? previousData : initialTrustedSaveData();
  const next = { ...incoming };
  for (const field of SERVER_OWNED_SAVE_FIELDS) next[field] = trustedBase[field];
  next.selectedProject = safeClientProjectDraft(incoming.selectedProject, trustedBase.selectedProject);
  next.lastSavedAt = Date.now();
  next.saveSchemaVersion = 3;
  return next;
}
