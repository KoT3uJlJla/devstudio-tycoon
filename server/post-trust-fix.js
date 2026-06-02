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
    console.warn('post-trust-fix: cannot read ' + fileName, error?.message || error);
    return;
  }
  const next = patcher(source);
  if (next === source) return;
  try {
    writeFileSync(filePath, next);
  } catch (error) {
    console.warn('post-trust-fix: cannot write ' + fileName, error?.message || error);
  }
}

function requirePatch(source, needle, label) {
  if (!source.includes(needle)) console.warn('post-trust-fix: patch check failed: ' + label);
}

patchFile('index.js', (source) => {
  let next = source;

  next = next.replace(
    '  await db.collection("config").createIndex({ _id: 1 }, { unique: true });\n',
    '',
  );

  next = next.replace(
    'function sanitizeText(value, fallback = "") {\n  return String(value || fallback).replace(/[<>"\'`]/g, "").replace(/\\s+/g, " ").trim().slice(0, 80);\n}\n',
    [
      'function sanitizeText(value, fallback = "") {',
      '  return String(value || fallback).replace(/[<>"\'`]/g, "").replace(/\\s+/g, " ").trim().slice(0, 80);',
      '}',
      '',
      'const ADMIN_TELEGRAM_IDS = new Set(String(process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((item) => item.trim()).filter(Boolean));',
      '',
      'function isAdminTelegramUser(telegramUser) {',
      '  return Boolean(telegramUser?.id && ADMIN_TELEGRAM_IDS.has(String(telegramUser.id)));',
      '}',
      '',
      'function requireAdminTelegramUser(req, res, next) {',
      '  if (!isAdminTelegramUser(req.telegramUser)) {',
      '    res.status(403).json({ ok: false, error: "admin_access_required" });',
      '    return;',
      '  }',
      '  next();',
      '}',
      '',
      'function stableStringify(value) {',
      '  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;',
      '  if (value && typeof value === "object") {',
      '    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;',
      '  }',
      '  return JSON.stringify(value ?? null);',
      '}',
      '',
      'function stripSaveSyncToken(data) {',
      '  if (!isPlainObject(data)) return data;',
      '  const nextData = { ...data };',
      '  delete nextData.saveSyncToken;',
      '  return nextData;',
      '}',
      '',
      'function saveSyncTokenFor(data) {',
      '  return crypto.createHash("sha256").update(stableStringify(stripSaveSyncToken(data))).digest("hex").slice(0, 24);',
      '}',
      '',
      'function attachSaveSyncToken(data) {',
      '  if (!isPlainObject(data)) return data;',
      '  const withoutToken = stripSaveSyncToken(data);',
      '  return { ...withoutToken, saveSyncToken: saveSyncTokenFor(withoutToken) };',
      '}',
      '',
    ].join('\n'),
  );

  next = next.replace(
    'async function writeSave(telegramId, telegramUser, data) {\n  await db.collection("saves").updateOne(\n    { telegramId },\n    { $set: { telegramId, telegramUser, data, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },\n    { upsert: true },\n  );\n}',
    [
      'async function writeSave(telegramId, telegramUser, data) {',
      '  const authoritativeData = attachSaveSyncToken(data);',
      '  if (isPlainObject(data)) {',
      '    delete data.saveSyncToken;',
      '    Object.assign(data, authoritativeData);',
      '  }',
      '  await db.collection("saves").updateOne(',
      '    { telegramId },',
      '    { $set: { telegramId, telegramUser, data: authoritativeData, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },',
      '    { upsert: true },',
      '  );',
      '  return authoritativeData;',
      '}',
    ].join('\n'),
  );

  next = next.replace(
    'async function getAuthoritativeSave(telegramUser, save, economy) {\n  if (!save) return null;\n  const normalizedData = overlayProtectedEconomy(normalizeServerDevelopment(save.data), economy);\n  if (JSON.stringify(normalizedData) !== JSON.stringify(save.data)) {\n    await writeSave(telegramUser.id, telegramUser, normalizedData);\n  }\n  return { data: normalizedData, updatedAt: save.updatedAt ?? null };\n}',
    [
      'async function getAuthoritativeSave(telegramUser, save, economy) {',
      '  if (!save) return null;',
      '  const normalizedData = attachSaveSyncToken(overlayProtectedEconomy(normalizeServerDevelopment(save.data), economy));',
      '  if (JSON.stringify(normalizedData) !== JSON.stringify(save.data)) {',
      '    await writeSave(telegramUser.id, telegramUser, normalizedData);',
      '  }',
      '  return { data: normalizedData, updatedAt: save.updatedAt ?? null };',
      '}',
    ].join('\n'),
  );

  next = next.replace(
    '  app.post("/api/save", requireTelegramUser, async (req, res) => {\n    const data = req.body;\n    if (!isPlainObject(data)) return res.status(400).json({ ok: false, error: "invalid_save_payload" });\n    const previousSave = await getSave(req.telegramUser.id);\n    if (!previousSave && data?.saveSchemaVersion !== 3) return res.status(409).json({ ok: false, error: "stale_client_save" });\n    const mergedDevelopment = mergeServerDevelopment(data, previousSave?.data);\n    const authoritativeData = normalizeServerDevelopment(mergedDevelopment, previousSave?.data);\n    const economy = await syncEconomyFromIncomingSave(req.telegramUser, authoritativeData, previousSave?.data);\n    const protectedData = overlayProtectedEconomy({ ...authoritativeData, saveSchemaVersion: 3 }, economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, protectedData);\n    res.json({ ok: true, economy: publicEconomy(economy), development: publicDevelopmentStatus(protectedData), save: { data: protectedData, updatedAt: new Date() } });\n  });',
    [
      '  app.post("/api/save", requireTelegramUser, async (req, res) => {',
      '    const data = req.body;',
      '    if (!isPlainObject(data)) return res.status(400).json({ ok: false, error: "invalid_save_payload" });',
      '    const previousSave = await getSave(req.telegramUser.id);',
      '    const economy = await getOrCreateEconomy(req.telegramUser, previousSave?.data);',
      '    if (!previousSave && data?.saveSchemaVersion !== 3) return res.status(409).json({ ok: false, error: "stale_client_save" });',
      '    const incomingSyncToken = typeof data.saveSyncToken === "string" ? data.saveSyncToken : "";',
      '    const previousAuthoritativeData = previousSave?.data ? attachSaveSyncToken(overlayProtectedEconomy(normalizeServerDevelopment(previousSave.data), economy)) : null;',
      '    if (previousSave && incomingSyncToken !== String(previousAuthoritativeData?.saveSyncToken || "")) {',
      '      return res.status(409).json({ ok: false, error: "stale_server_save", economy: publicEconomy(economy), development: publicDevelopmentStatus(previousAuthoritativeData), save: { data: previousAuthoritativeData, updatedAt: previousSave.updatedAt ?? new Date() } });',
      '    }',
      '    const sanitizedIncoming = { ...data };',
      '    delete sanitizedIncoming.saveSyncToken;',
      '    const mergedDevelopment = mergeServerDevelopment(sanitizedIncoming, previousSave?.data);',
      '    const authoritativeData = normalizeServerDevelopment(mergedDevelopment, previousSave?.data);',
      '    const syncedEconomy = await syncEconomyFromIncomingSave(req.telegramUser, authoritativeData, previousSave?.data);',
      '    const protectedData = overlayProtectedEconomy({ ...authoritativeData, saveSchemaVersion: 3 }, syncedEconomy);',
      '    await writeSave(req.telegramUser.id, req.telegramUser, protectedData);',
      '    res.json({ ok: true, economy: publicEconomy(syncedEconomy), development: publicDevelopmentStatus(protectedData), save: { data: protectedData, updatedAt: new Date() } });',
      '  });',
    ].join('\n'),
  );

  next = next.replace(
    'function applyRewardToSaveData(data, reward) {\n  const next = isPlainObject(data) ? { ...data } : {};\n  if (reward.coins) next.coins = safeInt(next.coins, -50000) + reward.coins;\n  if (reward.rp) next.rp = safeInt(next.rp, 0) + reward.rp;\n  if (reward.offerSeen) next.offerSeen = true;\n  if (reward.unlockResearchId) {\n    const ids = Array.isArray(next.unlockedResearchIds) ? next.unlockedResearchIds : [];\n    next.unlockedResearchIds = ids.includes(reward.unlockResearchId) ? ids : [reward.unlockResearchId, ...ids];\n    next.dailyResearchUnlocked = safeInt(next.dailyResearchUnlocked, 0) + 1;\n  }\n  next.lastSavedAt = Date.now();\n  return normalizeServerDevelopment(next);\n}',
    [
      'function applyRewardToSaveData(data, reward) {',
      '  const next = isPlainObject(data) ? { ...data } : {};',
      '  if (reward.coins) next.coins = safeInt(next.coins, -50000) + reward.coins;',
      '  if (reward.rp) next.rp = safeInt(next.rp, 0) + reward.rp;',
      '  if (reward.offerSeen) next.offerSeen = true;',
      '  if (reward.unlockResearchId) {',
      '    const ids = Array.isArray(next.unlockedResearchIds) ? next.unlockedResearchIds : [];',
      '    next.unlockedResearchIds = ids.includes(reward.unlockResearchId) ? ids : [reward.unlockResearchId, ...ids];',
      '    next.dailyResearchUnlocked = safeInt(next.dailyResearchUnlocked, 0) + 1;',
      '  }',
      '  next.lastSavedAt = Date.now();',
      '  return normalizeServerDevelopment(next);',
      '}',
      '',
      'function sanitizeAdminRewardDelta(reward = {}) {',
      '  return {',
      '    coins: safeInt(reward.coins, -100000000, 100000000),',
      '    rp: safeInt(reward.rp, -1000000, 1000000),',
      '    stars: safeInt(reward.stars, -100000, 100000),',
      '  };',
      '}',
      '',
      'function applyAdminRewardToSaveData(data, reward) {',
      '  const next = isPlainObject(data) ? { ...data } : {};',
      '  const delta = sanitizeAdminRewardDelta(reward);',
      '  if (delta.coins) next.coins = Math.max(-50000, safeInt(next.coins, -50000, Number.MAX_SAFE_INTEGER) + delta.coins);',
      '  if (delta.rp) next.rp = Math.max(0, safeInt(next.rp, 0, Number.MAX_SAFE_INTEGER) + delta.rp);',
      '  next.lastSavedAt = Date.now();',
      '  return normalizeServerDevelopment(next);',
      '}',
      '',
      'async function recordAdminRewardGrant(adminTelegramUser, targetTelegramUser, reward, reason, beforeState, afterState, beforeEconomy, afterEconomy) {',
      '  await db.collection("admin_reward_grants").insertOne({',
      '    adminTelegramId: String(adminTelegramUser.id),',
      '    adminTelegramUser,',
      '    targetTelegramId: String(targetTelegramUser.id),',
      '    targetTelegramUser,',
      '    reward: sanitizeAdminRewardDelta(reward),',
      '    reason: sanitizeText(reason, "manual_admin_reward").slice(0, 120),',
      '    before: {',
      '      coins: safeInt(beforeState?.coins, -50000, Number.MAX_SAFE_INTEGER),',
      '      rp: safeInt(beforeState?.rp, 0, Number.MAX_SAFE_INTEGER),',
      '      stars: safeInt(beforeEconomy?.stars, 0, Number.MAX_SAFE_INTEGER),',
      '    },',
      '    after: {',
      '      coins: safeInt(afterState?.coins, -50000, Number.MAX_SAFE_INTEGER),',
      '      rp: safeInt(afterState?.rp, 0, Number.MAX_SAFE_INTEGER),',
      '      stars: safeInt(afterEconomy?.stars, 0, Number.MAX_SAFE_INTEGER),',
      '    },',
      '    createdAt: new Date(),',
      '  });',
      '}',
      '',
      'async function grantAdminReward(adminTelegramUser, targetTelegramId, reward, reason) {',
      '  const cleanTargetTelegramId = String(targetTelegramId || "").trim();',
      '  if (!cleanTargetTelegramId) throw Object.assign(new Error("invalid_target_telegram_id"), { status: 400, code: "invalid_target_telegram_id" });',
      '  const rewardDelta = sanitizeAdminRewardDelta(reward);',
      '  if (!rewardDelta.coins && !rewardDelta.rp && !rewardDelta.stars) throw Object.assign(new Error("no_reward_delta"), { status: 400, code: "no_reward_delta" });',
      '  const save = await getSave(cleanTargetTelegramId);',
      '  const targetTelegramUser = save?.telegramUser || { id: cleanTargetTelegramId, firstName: "", username: "", photoUrl: "", startParam: "" };',
      '  const beforeState = normalizeServerDevelopment(save?.data || {});',
      '  const beforeEconomy = await getOrCreateEconomy(targetTelegramUser, beforeState);',
      '  let afterEconomy = beforeEconomy;',
      '  if (rewardDelta.stars > 0) {',
      '    afterEconomy = await grantStars(beforeEconomy, rewardDelta.stars, "admin_reward", { adminTelegramId: String(adminTelegramUser.id), reason: sanitizeText(reason, "manual_admin_reward").slice(0, 120) });',
      '  } else if (rewardDelta.stars < 0) {',
      '    const spent = await spendStars(beforeEconomy, Math.abs(rewardDelta.stars), "admin_reward_rollback", { adminTelegramId: String(adminTelegramUser.id), reason: sanitizeText(reason, "manual_admin_reward").slice(0, 120) });',
      '    if (!spent) throw Object.assign(new Error("not_enough_stars_for_admin_deduct"), { status: 409, code: "not_enough_stars_for_admin_deduct" });',
      '    afterEconomy = spent;',
      '  }',
      '  const saveReward = { coins: rewardDelta.coins, rp: rewardDelta.rp };',
      '  const nextData = overlayProtectedEconomy(applyAdminRewardToSaveData(beforeState, saveReward), afterEconomy);',
      '  await writeSave(cleanTargetTelegramId, targetTelegramUser, nextData);',
      '  await recordAdminRewardGrant(adminTelegramUser, targetTelegramUser, rewardDelta, reason, beforeState, nextData, beforeEconomy, afterEconomy);',
      '  return {',
      '    telegramId: cleanTargetTelegramId,',
      '    save: { data: nextData, updatedAt: new Date() },',
      '    economy: publicEconomy(afterEconomy),',
      '    reward: rewardDelta,',
      '  };',
      '}',
      '',
      'async function adminPlayerSnapshot(targetTelegramId) {',
      '  const cleanTargetTelegramId = String(targetTelegramId || "").trim();',
      '  if (!cleanTargetTelegramId) throw Object.assign(new Error("invalid_target_telegram_id"), { status: 400, code: "invalid_target_telegram_id" });',
      '  const save = await getSave(cleanTargetTelegramId);',
      '  const targetTelegramUser = save?.telegramUser || { id: cleanTargetTelegramId, firstName: "", username: "", photoUrl: "", startParam: "" };',
      '  const economy = await getOrCreateEconomy(targetTelegramUser, save?.data);',
      '  const saveData = overlayProtectedEconomy(normalizeServerDevelopment(save?.data || {}), economy);',
      '  const recentAdminRewards = await db.collection("admin_reward_grants").find({ targetTelegramId: cleanTargetTelegramId }).sort({ createdAt: -1 }).limit(10).toArray();',
      '  return {',
      '    telegramId: cleanTargetTelegramId,',
      '    telegramUser: targetTelegramUser,',
      '    studioName: saveData?.studioName || "",',
      '    coins: safeInt(saveData?.coins, -50000, Number.MAX_SAFE_INTEGER),',
      '    rp: safeInt(saveData?.rp, 0, Number.MAX_SAFE_INTEGER),',
      '    stars: safeInt(economy?.stars, 0, Number.MAX_SAFE_INTEGER),',
      '    lastSavedAt: saveData?.lastSavedAt || null,',
      '    saveUpdatedAt: save?.updatedAt || null,',
      '    saveLedger: Array.isArray(saveData?.lastLedger) ? saveData.lastLedger.slice(-10) : [],',
      '    starLedger: Array.isArray(economy?.ledger) ? economy.ledger.slice(-20) : [],',
      '    recentAdminRewards: recentAdminRewards.map((entry) => ({',
      '      id: entry._id,',
      '      reward: entry.reward,',
      '      reason: entry.reason,',
      '      before: entry.before,',
      '      after: entry.after,',
      '      createdAt: entry.createdAt,',
      '      adminTelegramId: entry.adminTelegramId,',
      '    })),',
      '  };',
      '}',
    ].join('\n'),
  );

  next = next.replace(
    '    const nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    if (action === "release") economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" });\n    res.json({ ok: true, save: { data: overlayProtectedEconomy(nextData, economy), updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
    '    let nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (action === "release" && nextData.gamesReleased > 0) {\n      await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);\n      if (typeof qualifyReferralIfEligible === "function") {\n        economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;\n        nextData = overlayProtectedEconomy(nextData, economy);\n        await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n      }\n    }\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
  );

  next = next.replace(
    /const PRIZE_DISTRIBUTION = \[[\s\S]*?\];/,
    'const PRIZE_DISTRIBUTION = [\n  { place: 1, amountStars: 900, percent: 30, label: "900 ⭐" },\n  { place: 2, amountStars: 600, percent: 20, label: "600 ⭐" },\n  { place: 3, amountStars: 420, percent: 14, label: "420 ⭐" },\n  { place: 4, amountStars: 300, percent: 10, label: "300 ⭐" },\n  { place: 5, amountStars: 240, percent: 8, label: "240 ⭐" },\n  { place: 6, amountStars: 180, percent: 6, label: "180 ⭐" },\n  { place: 7, amountStars: 135, percent: 4.5, label: "135 ⭐" },\n  { place: 8, amountStars: 105, percent: 3.5, label: "105 ⭐" },\n  { place: 9, amountStars: 75, percent: 2.5, label: "75 ⭐" },\n  { place: 10, amountStars: 45, percent: 1.5, label: "45 ⭐" },\n];',
  );
  next = next.replace('.limit(5).toArray();', '.limit(10).toArray();');
  next = next.replace(
    'prize: PRIZE_DISTRIBUTION[index] || null',
    'prize: PRIZE_DISTRIBUTION[index] ? [PRIZE_DISTRIBUTION[index].label, String(PRIZE_DISTRIBUTION[index].percent) + "%"] : null',
  );

  next = next.replace(
    '  app.get("/api/economy", requireTelegramUser, async (req, res) => {',
    [
      '  app.post("/api/admin/reward/grant", requireTelegramUser, requireAdminTelegramUser, async (req, res) => {',
      '    try {',
      '      const result = await grantAdminReward(req.telegramUser, req.body?.telegramId, { coins: req.body?.coins, rp: req.body?.rp, stars: req.body?.stars }, req.body?.reason || req.body?.note || "manual_admin_reward");',
      '      res.json({ ok: true, ...result });',
      '    } catch (error) {',
      '      res.status(error.status || 500).json({ ok: false, error: error.code || error.message || "admin_reward_failed" });',
      '    }',
      '  });',
      '  app.post("/api/admin/player/state", requireTelegramUser, requireAdminTelegramUser, async (req, res) => {',
      '    try {',
      '      const snapshot = await adminPlayerSnapshot(req.body?.telegramId);',
      '      res.json({ ok: true, player: snapshot });',
      '    } catch (error) {',
      '      res.status(error.status || 500).json({ ok: false, error: error.code || error.message || "admin_player_state_failed" });',
      '    }',
      '  });',
      '  app.get("/api/economy", requireTelegramUser, async (req, res) => {',
    ].join('\n'),
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

  requirePatch(next, 'ADMIN_TELEGRAM_IDS', 'admin allowlist');
  requirePatch(next, 'app.post("/api/admin/reward/grant"', 'admin reward route');
  requirePatch(next, 'app.post("/api/admin/player/state"', 'admin player state route');
  requirePatch(next, 'admin_reward_grants', 'admin reward audit log');
  requirePatch(next, 'saveSyncTokenFor', 'save sync token helpers');
  requirePatch(next, 'stale_server_save', 'stale server save conflict');
  requirePatch(next, 'await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);', 'trusted release action');
  requirePatch(next, 'find({ weekKey: currentWeek, trusted: true })', 'trusted leaderboard filter');
  requirePatch(next, '.limit(10).toArray();', 'top-10 leaderboard limit');
  requirePatch(next, 'amountStars: 900', 'stars prize distribution');
  if (next.includes('createIndex({ _id: 1 }, { unique: true })')) console.warn('post-trust-fix: stale _id index createIndex remains');
  return next;
});

patchFile('devActions.js', (source) => source
  .replaceAll('Серверное качество', 'Качество релиза')
  .replaceAll('Серверное решение', 'Решение разработки')
  .replaceAll('Ок для MVP', 'Ок для старта')
);

patchFile('devAuthority.js', (source) => source
  .replaceAll('clampNumber(incomingProject.durationSeconds || previousProject.durationSeconds, 1, 900)', 'clampNumber(incomingProject.durationSeconds || previousProject.durationSeconds, 1, 1440)')
  .replaceAll('clampNumber(project.durationSeconds, 1, 900)', 'clampNumber(project.durationSeconds, 1, 1440)')
);
