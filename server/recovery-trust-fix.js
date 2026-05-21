import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));

function patchFile(fileName, patcher) {
  const filePath = join(dir, fileName);
  let source = '';
  try { source = readFileSync(filePath, 'utf8'); } catch (error) { console.warn('recovery-trust-fix: cannot read ' + fileName, error?.message || error); return; }
  const next = patcher(source);
  if (next === source) return;
  try { writeFileSync(filePath, next); } catch (error) { console.warn('recovery-trust-fix: cannot write ' + fileName, error?.message || error); }
}

function findFunctionEnd(source, start) {
  const open = source.indexOf('{', start);
  if (open === -1) return -1;
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function replaceFunction(source, signature, replacement) {
  const start = source.indexOf(signature);
  if (start === -1) return source;
  const end = findFunctionEnd(source, start);
  if (end === -1) return source;
  return source.slice(0, start) + replacement.trimEnd() + source.slice(end);
}

const runDevelopmentAction = `async function runDevelopmentAction(req, res, action, handler, options = {}) {
  try {
    let save = await getSave(req.telegramUser.id);
    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    if (options.starCost) {
      const paid = await spendActionStars(req, res, action, options.starCost);
      if (!paid) return;
      save = paid.save;
      economy = paid.economy;
    }
    const beforeData = overlayProtectedEconomy(normalizeServerDevelopment(save?.data || {}), economy);
    let nextData = overlayProtectedEconomy(handler(beforeData), economy);
    await writeSave(req.telegramUser.id, req.telegramUser, nextData);
    if (action === "release" && nextData.gamesReleased > safeInt(beforeData?.gamesReleased, 0)) {
      if (typeof recordTrustedReleaseAndRating === "function") await recordTrustedReleaseAndRating(req.telegramUser, beforeData, nextData);
      if (typeof qualifyReferralIfEligible === "function") {
        economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;
        nextData = overlayProtectedEconomy(nextData, economy);
        await writeSave(req.telegramUser.id, req.telegramUser, nextData);
      }
    }
    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.code || error.message || "development_action_failed" });
  }
}`;

const syncEconomyFromIncomingSave = `async function syncEconomyFromIncomingSave(telegramUser, incomingData, previousData) {
  // Client /api/save may persist gameplay UX state, but it must not mint Stars,
  // update the prize leaderboard, or qualify referrals.
  return getOrCreateEconomy(telegramUser, previousData || incomingData);
}`;

patchFile('index.js', (source) => {
  let next = source;

  // Keep the save UX stable. The earlier hardening layer was too aggressive and
  // stripped active selectedProject fields, making in-progress development vanish
  // after refresh for some users.
  next = next.replace(
    '    const trustedClientData = mergeServerOwnedSaveData(data, previousSave?.data);\n    const mergedDevelopment = mergeServerDevelopment(trustedClientData, previousSave?.data);',
    '    const mergedDevelopment = mergeServerDevelopment(data, previousSave?.data);',
  );

  next = replaceFunction(next, 'async function syncEconomyFromIncomingSave', syncEconomyFromIncomingSave);
  next = replaceFunction(next, 'async function runDevelopmentAction', runDevelopmentAction);

  next = next.replace(
    'const rows = await db.collection("ratings").find({ weekKey: currentWeek }).sort({ score: -1, updatedAt: 1 }).limit(5).toArray();',
    'const rows = await db.collection("ratings").find({ weekKey: currentWeek, trusted: true }).sort({ score: -1, updatedAt: 1 }).limit(5).toArray();',
  );

  next = next.replace(
    /  app\.post\("\/api\/economy\/rating\/submit", requireTelegramUser, async \(req, res\) => \{[\s\S]*?  \}\);\n  registerStarsPaymentRoutes/,
    [
      '  app.post("/api/economy/rating/submit", requireTelegramUser, async (req, res) => {',
      '    const rating = typeof upsertTrustedRating === "function" ? await upsertTrustedRating(req.telegramUser) : null;',
      '    res.json({ ok: true, rating, leaderboard: await leaderboardForCurrentWeek(), weekKey: weekKey(), trusted: true });',
      '  });',
      '  registerStarsPaymentRoutes',
    ].join('\n'),
  );

  if (!next.includes('await recordTrustedReleaseAndRating(req.telegramUser, beforeData, nextData)')) console.warn('recovery-trust-fix: trusted release write not installed');
  if (next.includes('mergeServerOwnedSaveData(data, previousSave?.data)')) console.warn('recovery-trust-fix: aggressive save merge still present');
  return next;
});

patchFile('devAuthority.js', (source) => {
  let next = source;
  next = next.replace(
    [
      '  if (!sameProject(incomingProject, previousProject)) {',
      '    const sanitized = sanitizePersistentCollections(incomingData);',
      '    // Authenticated /api/save cannot create or replace server-owned development.',
      '    return { ...sanitized, selectedProject: previousProject || null };',
      '  }',
    ].join('\n'),
    '  if (!sameProject(incomingProject, previousProject)) return sanitizePersistentCollections(incomingData);',
  );
  next = next.replace(
    '  const progress = Number(previousProgress.toFixed(2));',
    '  const progress = Number(Math.max(incomingProgress, previousProgress).toFixed(2));',
  );
  next = next.replace(
    '  const trustedStoredProgress = previousProject ? previousProgress : clientProgress;\n\n  if (!startedAt || project.pendingDevEvent || trustedStoredProgress >= 100) {',
    '  if (!startedAt || project.pendingDevEvent || clientProgress >= 100) {',
  );
  next = next.replace(
    'progress: Number(Math.max(trustedStoredProgress, previousProgress).toFixed(2)),',
    'progress: Number(Math.max(clientProgress, previousProgress).toFixed(2)),',
  );
  next = next.replace(
    '  const progress = Number(Math.max(trustedStoredProgress, serverProgress).toFixed(2));',
    '  const progress = Number(Math.max(clientProgress, previousProgress, serverProgress).toFixed(2));',
  );
  return next;
});
