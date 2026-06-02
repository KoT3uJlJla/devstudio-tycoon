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
    /  app\.post\("\/api\/economy\/rating\/submit", requireTelegramUser, async \(req, res\) => \{[\s\S]*?  \}\);\n  registerStarsPaymentRoutes/,
    [
      '  app.post("/api/economy/rating/submit", requireTelegramUser, async (req, res) => {',
      '    const rating = await upsertTrustedRating(req.telegramUser);',
      '    res.json({ ok: true, rating, leaderboard: await leaderboardForCurrentWeek(), weekKey: weekKey(), trusted: true });',
      '  });',
      '  registerStarsPaymentRoutes',
    ].join('\n'),
  );

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
