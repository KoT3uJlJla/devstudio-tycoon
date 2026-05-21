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

  next = next.replace(
    'await db.collection("stars_invoices").createIndex({ telegramId: 1, createdAt: -1 });',
    'await db.collection("stars_invoices").createIndex({ telegramId: 1, createdAt: -1 });\n  await db.collection("trusted_releases").createIndex({ releaseKey: 1 }, { unique: true });\n  await db.collection("trusted_releases").createIndex({ telegramId: 1, weekKey: 1, createdAt: -1 });\n  await db.collection("ratings").createIndex({ weekKey: 1, trusted: 1, score: -1 });',
  );

  next = next.replace(
    'const rows = await db.collection("ratings").find({ weekKey: currentWeek }).sort({ score: -1, updatedAt: 1 }).limit(5).toArray();',
    'const rows = await db.collection("ratings").find({ weekKey: currentWeek, trusted: true }).sort({ score: -1, updatedAt: 1 }).limit(5).toArray();',
  );

  next = next.replace(
    'if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
    'if (action === "release" && nextData.gamesReleased > 0) await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
  );

  next = next.replace(
    'if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    if (action === "release") economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" });\n    res.json({ ok: true, save: { data: overlayProtectedEconomy(nextData, economy), updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
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

  requirePatch(next, 'function trustedReleaseRecordFromState', 'trusted release helpers');
  requirePatch(next, 'Client saves are not allowed to mint daily Stars', 'daily star source lock');
  requirePatch(next, 'find({ weekKey: currentWeek, trusted: true })', 'trusted leaderboard filter');
  requirePatch(next, 'recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData)', 'trusted release action');
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

patchFile('index.js', patchIndex);
patchFile('devAuthority.js', patchDevAuthority);
