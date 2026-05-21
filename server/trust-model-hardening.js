import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));

function patchFile(fileName, patcher) {
  const filePath = join(dir, fileName);
  let source = '';
  try {
    source = readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn('trust-model-hardening: cannot read ' + fileName, error?.message || error);
    return;
  }
  const next = patcher(source);
  if (next === source) return;
  try {
    writeFileSync(filePath, next);
  } catch (error) {
    console.warn('trust-model-hardening: cannot write ' + fileName, error?.message || error);
  }
}

function requirePatch(source, needle, label) {
  if (!source.includes(needle)) console.warn('trust-model-hardening: patch check failed: ' + label);
}

const gameAccessHelpers = String.raw`
const GAME_STATUS_CONFIG_ID = 'game_status';
const USER_ROLES = new Set(['dev', 'tester', 'user']);

function normalizeUserRole(value) {
  const role = String(value || 'user').toLowerCase().trim();
  return USER_ROLES.has(role) ? role : 'user';
}

function normalizeGameStatusDoc(doc) {
  const status = doc?.status === 'closed' || doc?.closed === true ? 'closed' : 'open';
  return {
    status,
    closed: status === 'closed',
    message: sanitizeText(doc?.message || 'Maintenance in progress. Please come back later.', 'Maintenance in progress. Please come back later.'),
    updatedAt: doc?.updatedAt || null,
  };
}

async function ensureUserRole(telegramUser) {
  const telegramId = String(telegramUser?.id || '');
  if (!telegramId) return 'user';
  const now = new Date();
  await db.collection('users').updateOne(
    { telegramId },
    { $set: { telegramId, telegramUser, updatedAt: now }, $setOnInsert: { role: 'user', createdAt: now } },
    { upsert: true },
  );
  const row = await db.collection('users').findOne({ telegramId });
  return normalizeUserRole(row?.role);
}

async function loadGameStatus() {
  const now = new Date();
  await db.collection('config').updateOne(
    { _id: GAME_STATUS_CONFIG_ID },
    { $setOnInsert: { _id: GAME_STATUS_CONFIG_ID, status: 'open', closed: false, message: 'Maintenance in progress. Please come back later.', createdAt: now, updatedAt: now } },
    { upsert: true },
  );
  const doc = await db.collection('config').findOne({ _id: GAME_STATUS_CONFIG_ID });
  return normalizeGameStatusDoc(doc);
}

async function requireTelegramUser(req, res, next) {
  try {
    const auth = req.get('authorization') || '';
    const initData = auth.startsWith('tma ') ? auth.slice(4) : req.get('x-telegram-init-data');
    req.telegramUser = validateTelegramInitData(initData);
    req.userRole = await ensureUserRole(req.telegramUser);
    req.gameStatus = await loadGameStatus();
    if (req.gameStatus.closed && !['dev', 'tester'].includes(req.userRole)) {
      return res.status(423).json({ ok: false, error: 'game_closed', role: req.userRole, gameStatus: req.gameStatus });
    }
    next();
  } catch (error) {
    res.status(401).json({ ok: false, error: 'telegram_auth_failed' });
  }
}
`;

const serverOwnedSaveHelpers = String.raw`
const SERVER_OWNED_SAVE_FIELDS = [
  'coins', 'rp', 'stars', 'qualifiedReferrals', 'qualifiedSecondLevelReferrals', 'referralMilestoneClaims',
  'level', 'studioXp', 'gamesReleased', 'bestScore', 'latestRelease', 'activeGames', 'releaseHistory',
  'employees', 'hiredEmployeeIds', 'unlockedResearchIds', 'unlockedGenreIds', 'unlockedThemeIds',
  'dailyClaimedAt', 'dailyStatsDate', 'dailyGamesReleased', 'dailyWorkTaps', 'dailyResearchUnlocked',
  'dailyPassiveIncome', 'dailyTaskClaims', 'weeklyExpenseTotal', 'unpaidSinceMonth', 'closureWarningMonth',
  'ratingResetCount', 'activeMarketEvents', 'newsFeed', 'audience', 'lastLedger', 'marketMustRecover',
  'tutorialDone', 'tutorialStep', 'tutorialRewardClaimed', 'gameDay', 'lastGameTickAt', 'lastOfflineReward',
  'offerSeen', 'productInstinctUntil', 'unlockedResearchMeta', 'saveSchemaVersion'
];

function initialTrustedSaveData() {
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
    unlockedGenreIds: ['arcade', 'platformer', 'puzzle', 'strategy'],
    unlockedThemeIds: ['space', 'fantasy', 'cyberpunk'],
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
  if (isPlainObject(previousProject) && (previousProject.startedAt || previousProject.pendingDevEvent || safeInt(previousProject.progress, 0, 100) > 1)) {
    return previousProject;
  }
  if (!isPlainObject(project)) return previousProject && !previousProject.startedAt ? previousProject : null;
  if (project.startedAt || project.pendingDevEvent || safeInt(project.progress, 0, 100) > 1) return null;
  return {
    id: sanitizeText(project.id || crypto.randomUUID(), crypto.randomUUID()).slice(0, 64),
    name: sanitizeText(project.name || 'New Game', 'New Game'),
    genre: sanitizeText(project.genre || '', ''),
    theme: sanitizeText(project.theme || '', ''),
    platform: sanitizeText(project.platform || 'micro_pc', 'micro_pc'),
    focus: isPlainObject(project.focus) ? project.focus : undefined,
    progress: 0,
    startedAt: null,
  };
}

function mergeServerOwnedSaveData(incomingData, previousData) {
  const incoming = isPlainObject(incomingData) ? incomingData : {};
  const trustedBase = isPlainObject(previousData) ? previousData : initialTrustedSaveData();
  const next = { ...incoming };
  for (const field of SERVER_OWNED_SAVE_FIELDS) next[field] = trustedBase[field];
  next.selectedProject = safeClientProjectDraft(incoming.selectedProject, trustedBase.selectedProject);
  next.lastSavedAt = Date.now();
  next.saveSchemaVersion = 3;
  return next;
}
`;

const trustedReleaseHelpers = String.raw`
function trustedReleaseRecordFromState(telegramUser, beforeData, afterData) {
  const release = isPlainObject(afterData?.latestRelease) ? afterData.latestRelease : null;
  if (!release) return null;
  const releaseCreatedAt = safeInt(release.createdAt, 0, Number.MAX_SAFE_INTEGER) || Date.now();
  const releaseIndex = safeInt(afterData?.gamesReleased, 0, 999999999);
  const score = Number(clampNumber(release.score, 1, 10).toFixed(1));
  const title = sanitizeText(release.projectName || release.title || 'Release', 'Release');
  const displayName = sanitizeText(afterData?.studioName || telegramUser?.username || telegramUser?.firstName || 'Player ' + telegramUser.id, 'Player');
  const releaseKey = String(telegramUser.id) + ':' + String(releaseCreatedAt) + ':' + String(releaseIndex);
  return {
    releaseKey,
    telegramId: String(telegramUser.id),
    telegramUser,
    weekKey: weekKey(new Date(releaseCreatedAt)),
    gameDay: safeInt(afterData?.gameDay, 1, 999999999),
    releaseIndex,
    title,
    displayName,
    score,
    criticAverage: Number(clampNumber(release.criticAverage, 1, 10).toFixed(1)),
    sales: safeInt(release.sales, 0, Number.MAX_SAFE_INTEGER),
    passivePerDay: safeInt(release.passivePerDay, 0, Number.MAX_SAFE_INTEGER),
    rp: safeInt(release.rp, 0, Number.MAX_SAFE_INTEGER),
    combo: sanitizeText(release.combo || '', ''),
    projectId: sanitizeText(beforeData?.selectedProject?.id || '', ''),
    createdAt: new Date(releaseCreatedAt),
    updatedAt: new Date(),
  };
}

function trustedRatingBreakdownFromReleases(releases) {
  const rows = Array.isArray(releases) ? releases : [];
  const recent = rows.slice(0, 5);
  const bestRecent = recent.reduce((best, entry) => Math.max(best, clampNumber(entry?.score, 0, 10)), 0);
  const avgRecent = recent.length ? recent.reduce((sum, entry) => sum + clampNumber(entry?.score, 0, 10), 0) / recent.length : 0;
  const releaseVolume = Math.min(3600, recent.length * 900);
  const trustedRevenue = Math.min(9000, recent.reduce((sum, entry) => sum + safeInt(entry?.sales, 0) / 16 + safeInt(entry?.passivePerDay, 0) * 0.5, 0));
  const total = Math.max(0, Math.round(bestRecent * bestRecent * 930 + avgRecent * 1500 + trustedRevenue + releaseVolume));
  return {
    total,
    items: [
      ['Best trusted release', Math.round(bestRecent * bestRecent * 930)],
      ['Weekly average quality', Math.round(avgRecent * 1500)],
      ['Verified release revenue', Math.round(trustedRevenue)],
      ['Release rhythm', Math.round(releaseVolume)],
    ].filter(([, value]) => Number(value) !== 0),
  };
}

async function upsertTrustedRating(telegramUser) {
  const currentWeek = weekKey();
  const releases = await db.collection('trusted_releases')
    .find({ telegramId: String(telegramUser.id), weekKey: currentWeek })
    .sort({ gameDay: -1, createdAt: -1 })
    .limit(50)
    .toArray();
  if (!releases.length) return null;
  const breakdown = trustedRatingBreakdownFromReleases(releases);
  const bestRelease = [...releases].sort((a, b) => clampNumber(b?.score, 0, 10) - clampNumber(a?.score, 0, 10))[0] || releases[0];
  const latestRelease = releases[0];
  const doc = {
    telegramId: String(telegramUser.id),
    telegramUser,
    weekKey: currentWeek,
    displayName: sanitizeText(latestRelease?.displayName || telegramUser.username || telegramUser.firstName || 'Player ' + telegramUser.id, 'Player'),
    bestTitle: sanitizeText(bestRelease?.title || 'Best game', 'Best game'),
    score: breakdown.total,
    breakdown: breakdown.items,
    trusted: true,
    trustedReleaseCount: releases.length,
    updatedAt: new Date(),
  };
  await db.collection('ratings').updateOne(
    { telegramId: String(telegramUser.id), weekKey: currentWeek },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  await db.collection('economy').updateOne(
    { telegramId: String(telegramUser.id) },
    { $set: { lastRating: { weekKey: currentWeek, score: breakdown.total, trusted: true, updatedAt: new Date() } } },
  );
  return doc;
}

async function recordTrustedReleaseAndRating(telegramUser, beforeData, afterData) {
  const record = trustedReleaseRecordFromState(telegramUser, beforeData, afterData);
  if (!record) return upsertTrustedRating(telegramUser);
  await db.collection('trusted_releases').updateOne(
    { releaseKey: record.releaseKey },
    { $setOnInsert: { ...record, createdAt: record.createdAt }, $set: { updatedAt: new Date() } },
    { upsert: true },
  );
  return upsertTrustedRating(telegramUser);
}
`;

function patchIndex(source) {
  let next = source;

  if (!next.includes('const GAME_STATUS_CONFIG_ID')) {
    next = next.replace(/function requireTelegramUser\(req, res, next\) \{[\s\S]*?\n\}\n\nfunction isPlainObject/, gameAccessHelpers + '\nfunction isPlainObject');
  }

  if (!next.includes('const SERVER_OWNED_SAVE_FIELDS')) {
    next = next.replace('async function syncEconomyFromIncomingSave', serverOwnedSaveHelpers + '\nasync function syncEconomyFromIncomingSave');
  }

  if (!next.includes('function trustedReleaseRecordFromState')) {
    next = next.replace('async function syncEconomyFromIncomingSave', trustedReleaseHelpers + '\nasync function syncEconomyFromIncomingSave');
  }

  next = next.replace(
    /  const today = todayKey\(\);\n  if \(incomingData\?\.dailyClaimedAt === today && economy\.dailyClaimedAt !== today\) \{\n    economy = await grantStars\(economy, 1, "daily_login", \{ day: today \}\);\n    economy = await patchEconomy\(economy\.telegramId, \{ \$set: \{ dailyClaimedAt: today \} \}\);\n  \}\n/g,
    '  // Client saves are not allowed to mint daily Stars. Use POST /api/economy/daily.\n',
  );

  next = next.replace(
    /  if \(incomingData\?\.gamesReleased > 0\) \{\n    await upsertRating\(telegramUser, incomingData\);\n    economy = await db\.collection\("economy"\)\.findOne\(\{ telegramId: telegramUser\.id \}\);\n  \}/g,
    '  if (incomingData?.gamesReleased > 0) {\n    // Client saves may update the personal save, but never leaderboard or referrals.\n    economy = await db.collection("economy").findOne({ telegramId: telegramUser.id }) || economy;\n  }',
  );

  next = next.replace(
    /  if \(incomingData\?\.gamesReleased > 0\) \{\n    await upsertRating\(telegramUser, incomingData\);\n    economy = await qualifyReferralIfEligible\(telegramUser, incomingData, \{ source: "save_sync" \}\);\n  \}/g,
    '  if (incomingData?.gamesReleased > 0) {\n    // Client saves may update the personal save, but never leaderboard or referrals.\n    economy = await db.collection("economy").findOne({ telegramId: telegramUser.id }) || economy;\n  }',
  );

  if (!next.includes('await db.collection("users").createIndex')) {
    next = next.replace(
      '  await db.collection("economy").createIndex({ telegramId: 1 }, { unique: true });',
      '  await db.collection("economy").createIndex({ telegramId: 1 }, { unique: true });\n  await db.collection("users").createIndex({ telegramId: 1 }, { unique: true });\n  await db.collection("users").createIndex({ role: 1 });\n  await db.collection("config").createIndex({ _id: 1 }, { unique: true });\n  await db.collection("config").updateOne({ _id: GAME_STATUS_CONFIG_ID }, { $setOnInsert: { _id: GAME_STATUS_CONFIG_ID, status: "open", closed: false, message: "Maintenance in progress. Please come back later.", createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });',
    );
  }

  next = next.replace(
    'await db.collection("stars_invoices").createIndex({ telegramId: 1, createdAt: -1 });',
    'await db.collection("stars_invoices").createIndex({ telegramId: 1, createdAt: -1 });\n  await db.collection("trusted_releases").createIndex({ releaseKey: 1 }, { unique: true });\n  await db.collection("trusted_releases").createIndex({ telegramId: 1, weekKey: 1, createdAt: -1 });\n  await db.collection("ratings").createIndex({ weekKey: 1, trusted: 1, score: -1 });',
  );

  next = next.replace(
    'const rows = await db.collection("ratings").find({ weekKey: currentWeek }).sort({ score: -1, updatedAt: 1 }).limit(5).toArray();',
    'const rows = await db.collection("ratings").find({ weekKey: currentWeek, trusted: true }).sort({ score: -1, updatedAt: 1 }).limit(5).toArray();',
  );

  next = next.replace(
    '    const mergedDevelopment = mergeServerDevelopment(data, previousSave?.data);\n    const authoritativeData = normalizeServerDevelopment(mergedDevelopment, previousSave?.data);',
    '    const trustedClientData = mergeServerOwnedSaveData(data, previousSave?.data);\n    const mergedDevelopment = mergeServerDevelopment(trustedClientData, previousSave?.data);\n    const authoritativeData = normalizeServerDevelopment(mergedDevelopment, previousSave?.data);',
  );

  next = next.replace(
    '    const nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
    '    let nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (action === "release" && nextData.gamesReleased > 0) {\n      await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);\n      if (typeof qualifyReferralIfEligible === "function") {\n        economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;\n        nextData = overlayProtectedEconomy(nextData, economy);\n        await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n      }\n    }\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
  );

  next = next.replace(
    'if (action === "release" && nextData.gamesReleased > 0) await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);\n    if (action === "release") economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" });\n    res.json({ ok: true, save: { data: overlayProtectedEconomy(nextData, economy), updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
    'if (action === "release" && nextData.gamesReleased > 0) await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);\n    if (action === "release") economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" });\n    res.json({ ok: true, save: { data: overlayProtectedEconomy(nextData, economy), updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
  );

  next = next.replace(
    /  app\.post\("\/api\/economy\/rating\/submit", requireTelegramUser, async \(req, res\) => \{[\s\S]*?  \}\);\n  registerStarsPaymentRoutes/,
    [
      '  app.post("/api/economy/rating/submit", requireTelegramUser, async (req, res) => {',
      '    const rating = await upsertTrustedRating(req.telegramUser);',
      '    res.json({ ok: true, rating, leaderboard: await leaderboardForCurrentWeek(), weekKey: weekKey(), trusted: true });',
      '  });',
      '  registerStarsPaymentRoutes',
    ].join('\n'),
  );

  requirePatch(next, 'const GAME_STATUS_CONFIG_ID', 'game access role helpers');
  requirePatch(next, 'const SERVER_OWNED_SAVE_FIELDS', 'server-owned save helpers');
  requirePatch(next, 'function trustedReleaseRecordFromState', 'trusted release helpers');
  requirePatch(next, 'mergeServerOwnedSaveData(data, previousSave?.data)', 'server-owned save merge');
  requirePatch(next, 'find({ weekKey: currentWeek, trusted: true })', 'trusted leaderboard filter');
  requirePatch(next, 'recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData)', 'trusted release action');
  requirePatch(next, 'error: \'game_closed\'', 'game closed response');
  requirePatch(next, 'trusted: true });', 'trusted rating submit');
  return next;
}

function patchDevAuthority(source) {
  let next = source;

  next = next.replace(
    '  if (!sameProject(incomingProject, previousProject)) return sanitizePersistentCollections(incomingData);',
    [
      '  if (!sameProject(incomingProject, previousProject)) {',
      '    const sanitized = sanitizePersistentCollections(incomingData);',
      '    // Authenticated /api/save cannot create or replace server-owned development.',
      '    return { ...sanitized, selectedProject: previousProject || null };',
      '  }',
    ].join('\n'),
  );

  next = next.replace(
    '  const incomingProgress = clampNumber(incomingProject.progress, 0, 100);\n  const previousProgress = clampNumber(previousProject.progress, 0, 100);\n  const progress = Number(Math.max(incomingProgress, previousProgress).toFixed(2));',
    '  const incomingProgress = clampNumber(incomingProject.progress, 0, 100);\n  const previousProgress = clampNumber(previousProject.progress, 0, 100);\n  const progress = Number(previousProgress.toFixed(2));',
  );

  next = next.replace(
    '  if (!startedAt || project.pendingDevEvent || clientProgress >= 100) {\n    return {\n      ...baseData,\n      selectedProject: {\n        ...project,\n        startedAt: startedAt || project.startedAt,\n        progress: Number(Math.max(clientProgress, previousProgress).toFixed(2)),\n        serverProgressAt: Date.now(),\n      },\n    };\n  }',
    '  const trustedStoredProgress = previousProject ? previousProgress : clientProgress;\n\n  if (!startedAt || project.pendingDevEvent || trustedStoredProgress >= 100) {\n    return {\n      ...baseData,\n      selectedProject: {\n        ...project,\n        startedAt: startedAt || project.startedAt,\n        progress: Number(Math.max(trustedStoredProgress, previousProgress).toFixed(2)),\n        serverProgressAt: Date.now(),\n      },\n    };\n  }',
  );

  next = next.replace(
    '  const progress = Number(Math.max(clientProgress, previousProgress, serverProgress).toFixed(2));',
    '  const progress = Number(Math.max(trustedStoredProgress, serverProgress).toFixed(2));',
  );

  requirePatch(next, 'cannot create or replace server-owned development', 'project ownership lock');
  requirePatch(next, 'const progress = Number(previousProgress.toFixed(2));', 'merge progress lock');
  requirePatch(next, 'const progress = Number(Math.max(trustedStoredProgress, serverProgress).toFixed(2));', 'server progress lock');
  return next;
}

function patchDevActions(source) {
  let next = source;
  next = next.replace(
    'isTutorial:Boolean(src.isTutorial&&!data.tutorialDone)',
    'isTutorial:Boolean(src.isTutorial&&!data.tutorialDone&&!data.tutorialRewardClaimed&&i(data.gamesReleased,0)===0)',
  );
  next = next.replace(
    'startedAt:now,progress:Math.max(1,Number(p.progress)||0),promotionUsed:false',
    'startedAt:now,progress:1,promotionUsed:false',
  );
  requirePatch(next, 'startedAt:now,progress:1,promotionUsed:false', 'server start progress');
  return next;
}

patchFile('index.js', patchIndex);
patchFile('devAuthority.js', patchDevAuthority);
patchFile('devActions.js', patchDevActions);
