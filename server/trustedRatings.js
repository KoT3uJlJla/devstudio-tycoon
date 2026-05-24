function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clampNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function safeInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(clampNumber(value, min, max));
}

function cleanText(value, fallback = "") {
  return String(value || fallback).replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function weekKey(date = new Date()) {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
  return `${current.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function ensureTrustedRatingIndexes(db) {
  await db.collection("trusted_releases").createIndex({ releaseKey: 1 }, { unique: true });
  await db.collection("trusted_releases").createIndex({ telegramId: 1, weekKey: 1, createdAt: -1 });
  await db.collection("ratings").createIndex({ weekKey: 1, trusted: 1, score: -1 });
}

export function trustedReleaseRecordFromState(telegramUser, beforeData, afterData) {
  const release = isPlainObject(afterData?.latestRelease) ? afterData.latestRelease : null;
  if (!release) return null;
  const releaseCreatedAt = safeInt(release.createdAt, 0, Number.MAX_SAFE_INTEGER) || Date.now();
  const releaseIndex = safeInt(afterData?.gamesReleased, 0, 999999999);
  const score = Number(clampNumber(release.score, 1, 10).toFixed(1));
  const title = cleanText(release.projectName || release.title || "Release", "Release");
  const displayName = cleanText(afterData?.studioName || telegramUser?.username || telegramUser?.firstName || "Player " + telegramUser.id, "Player");
  const releaseKey = String(telegramUser.id) + ":" + String(releaseCreatedAt) + ":" + String(releaseIndex);
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
    combo: cleanText(release.combo || "", ""),
    projectId: cleanText(beforeData?.selectedProject?.id || "", ""),
    createdAt: new Date(releaseCreatedAt),
    updatedAt: new Date(),
  };
}

function trustedRatingBreakdownFromReleases(releases) {
  const recent = Array.isArray(releases) ? releases.slice(0, 5) : [];
  const bestRecent = recent.reduce((best, entry) => Math.max(best, clampNumber(entry?.score, 0, 10)), 0);
  const avgRecent = recent.length ? recent.reduce((sum, entry) => sum + clampNumber(entry?.score, 0, 10), 0) / recent.length : 0;
  const releaseVolume = Math.min(3600, recent.length * 900);
  const trustedRevenue = Math.min(9000, recent.reduce((sum, entry) => sum + safeInt(entry?.sales, 0) / 16 + safeInt(entry?.passivePerDay, 0) * 0.5, 0));
  const total = Math.max(0, Math.round(bestRecent * bestRecent * 930 + avgRecent * 1500 + trustedRevenue + releaseVolume));
  return {
    total,
    items: [
      ["Best trusted release", Math.round(bestRecent * bestRecent * 930)],
      ["Weekly average quality", Math.round(avgRecent * 1500)],
      ["Verified release revenue", Math.round(trustedRevenue)],
      ["Release rhythm", Math.round(releaseVolume)],
    ].filter(([, value]) => Number(value) !== 0),
  };
}

export async function upsertTrustedRating(db, telegramUser) {
  const currentWeek = weekKey();
  const releases = await db.collection("trusted_releases")
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
    displayName: cleanText(latestRelease?.displayName || telegramUser.username || telegramUser.firstName || "Player " + telegramUser.id, "Player"),
    bestTitle: cleanText(bestRelease?.title || "Best game", "Best game"),
    score: breakdown.total,
    breakdown: breakdown.items,
    trusted: true,
    trustedReleaseCount: releases.length,
    updatedAt: new Date(),
  };
  await db.collection("ratings").updateOne(
    { telegramId: String(telegramUser.id), weekKey: currentWeek },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  await db.collection("economy").updateOne(
    { telegramId: String(telegramUser.id) },
    { $set: { lastRating: { weekKey: currentWeek, score: breakdown.total, trusted: true, updatedAt: new Date() } } },
  );
  return doc;
}

export async function recordTrustedReleaseAndRating(db, telegramUser, beforeData, afterData) {
  const record = trustedReleaseRecordFromState(telegramUser, beforeData, afterData);
  if (!record) return upsertTrustedRating(db, telegramUser);
  await db.collection("trusted_releases").updateOne(
    { releaseKey: record.releaseKey },
    { $setOnInsert: { ...record, createdAt: record.createdAt }, $set: { updatedAt: new Date() } },
    { upsert: true },
  );
  return upsertTrustedRating(db, telegramUser);
}
