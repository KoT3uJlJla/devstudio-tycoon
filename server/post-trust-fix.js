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

  // MongoDB already creates a unique _id index automatically. Creating it with
  // an explicit unique option fails on Atlas/Render with code 197.
  next = next.replace(
    '  await db.collection("config").createIndex({ _id: 1 }, { unique: true });\n',
    '',
  );

  // Referrals hardening runs before trust-model hardening and may already have
  // changed runDevelopmentAction. Ensure release actions still create trusted
  // release records and trusted ratings.
  next = next.replace(
    '    const nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    if (action === "release") economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" });\n    res.json({ ok: true, save: { data: overlayProtectedEconomy(nextData, economy), updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
    '    let nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (action === "release" && nextData.gamesReleased > 0) {\n      await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);\n      if (typeof qualifyReferralIfEligible === "function") {\n        economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;\n        nextData = overlayProtectedEconomy(nextData, economy);\n        await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n      }\n    }\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
  );

  // Older orderings can leave an untrusted release rating submit in place.
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
  if (next.includes('createIndex({ _id: 1 }, { unique: true })')) console.warn('post-trust-fix: stale _id index createIndex remains');
  return next;
});
