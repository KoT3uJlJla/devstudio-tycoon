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
    console.warn('recovery-trust-fix: cannot read ' + fileName, error?.message || error);
    return;
  }
  const next = patcher(source);
  if (next === source) return;
  try {
    writeFileSync(filePath, next);
  } catch (error) {
    console.warn('recovery-trust-fix: cannot write ' + fileName, error?.message || error);
  }
}

const trustedReleaseRoute = `  app.post("/api/development/release", requireTelegramUser, async (req, res) => {
    try {
      let save = await getSave(req.telegramUser.id);
      let economy = await getOrCreateEconomy(req.telegramUser, save?.data);
      const authoritative = overlayProtectedEconomy(normalizeServerDevelopment(save?.data || {}), economy);
      const beforeGamesReleased = safeInt(authoritative?.gamesReleased, 0);
      let nextData = overlayProtectedEconomy(releaseDevelopmentAction(authoritative), economy);
      await writeSave(req.telegramUser.id, req.telegramUser, nextData);
      if (safeInt(nextData?.gamesReleased, 0) > beforeGamesReleased) {
        await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);
        if (typeof qualifyReferralIfEligible === "function") {
          economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;
          nextData = overlayProtectedEconomy(nextData, economy);
          await writeSave(req.telegramUser.id, req.telegramUser, nextData);
        }
      }
      res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData), trustedReleaseRecorded: safeInt(nextData?.gamesReleased, 0) > beforeGamesReleased });
    } catch (error) {
      res.status(error.status || 500).json({ ok: false, error: error.code || error.message || "development_action_failed" });
    }
  });`;

patchFile('index.js', (source) => {
  let next = source;

  // Roll back only the over-aggressive /api/save merge. This keeps active
  // development visible after refresh while syncEconomyFromIncomingSave and
  // rating submit remain hardened by earlier patches.
  next = next.replace(
    '    const trustedClientData = mergeServerOwnedSaveData(data, previousSave?.data);\n    const mergedDevelopment = mergeServerDevelopment(trustedClientData, previousSave?.data);',
    '    const mergedDevelopment = mergeServerDevelopment(data, previousSave?.data);',
  );

  // The generic runDevelopmentAction can be modified by several hardening layers.
  // Patch the release route itself so trusted_releases are always written after
  // a real backend release, regardless of the generic action body shape.
  next = next.replace(
    '  app.post("/api/development/release", requireTelegramUser, async (req, res) => runDevelopmentAction(req, res, "release", releaseDevelopmentAction));',
    trustedReleaseRoute,
  );

  // If older layers left one of these exact bodies in place, keep them safe too.
  next = next.replace(
    '    const nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
    '    let nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (action === "release" && nextData.gamesReleased > safeInt(authoritative?.gamesReleased, 0)) {\n      await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);\n      if (typeof qualifyReferralIfEligible === "function") {\n        economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;\n        nextData = overlayProtectedEconomy(nextData, economy);\n        await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n      }\n    }\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
  );

  next = next.replace(
    '    const nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    if (action === "release") economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" });\n    res.json({ ok: true, save: { data: overlayProtectedEconomy(nextData, economy), updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
    '    let nextData = overlayProtectedEconomy(handler(authoritative), economy);\n    await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n    if (action === "release" && nextData.gamesReleased > safeInt(authoritative?.gamesReleased, 0)) {\n      await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);\n      if (typeof qualifyReferralIfEligible === "function") {\n        economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;\n        nextData = overlayProtectedEconomy(nextData, economy);\n        await writeSave(req.telegramUser.id, req.telegramUser, nextData);\n      }\n    }\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
  );

  if (next.includes('mergeServerOwnedSaveData(data, previousSave?.data)')) {
    console.warn('recovery-trust-fix: aggressive save merge still present');
  }
  if (!next.includes('trustedReleaseRecorded')) {
    console.warn('recovery-trust-fix: direct trusted release route not installed');
  }
  return next;
});

patchFile('devAuthority.js', (source) => {
  let next = source;

  // Restore non-destructive selectedProject merge so in-progress projects do not
  // disappear on refresh. Rating/referral trust remains protected in index.js.
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
