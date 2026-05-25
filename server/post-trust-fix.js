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