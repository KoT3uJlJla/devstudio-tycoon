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

const saveTransitionBlock = `    await writeSave(req.telegramUser.id, req.telegramUser, protectedData);
    const previousGamesReleased = safeInt(previousSave?.data?.gamesReleased, 0);
    const currentGamesReleased = safeInt(protectedData?.gamesReleased, 0);
    const releaseAdvanced = currentGamesReleased > previousGamesReleased;
    let trustedReleaseRecorded = false;
    if (releaseAdvanced) {
      const history = Array.isArray(protectedData?.releaseHistory) ? protectedData.releaseHistory : [];
      const activeGames = Array.isArray(protectedData?.activeGames) ? protectedData.activeGames : [];
      const lastHistory = history[history.length - 1] || null;
      const latestActive = [...activeGames].sort((a, b) => safeInt(b?.createdGameDay, 0) - safeInt(a?.createdGameDay, 0))[0] || null;
      const fallbackLatestRelease = protectedData?.latestRelease || (lastHistory ? {
        projectName: lastHistory.title || latestActive?.title || 'Release',
        title: lastHistory.title || latestActive?.title || 'Release',
        genre: lastHistory.genre || latestActive?.genre,
        theme: lastHistory.theme || latestActive?.theme,
        score: Number(lastHistory.score || latestActive?.score || 1),
        criticAverage: Number(lastHistory.score || latestActive?.score || 1),
        sales: safeInt(latestActive?.totalEarned, 0),
        passivePerDay: safeInt(latestActive?.baseDailyIncome, 0),
        rp: safeInt(protectedData?.rp, 0),
        createdAt: Date.now(),
      } : null);
      if (fallbackLatestRelease) {
        const trustedData = { ...protectedData, latestRelease: fallbackLatestRelease };
        await recordTrustedReleaseAndRating(req.telegramUser, previousSave?.data || {}, trustedData);
        trustedReleaseRecorded = true;
      }
      console.log('trusted release save transition', { telegramId: req.telegramUser.id, previousGamesReleased, currentGamesReleased, hasLatestRelease: Boolean(protectedData?.latestRelease), hasHistory: history.length > 0, trustedReleaseRecorded });
    }
    res.json({ ok: true, economy: publicEconomy(economy), development: publicDevelopmentStatus(protectedData), save: { data: protectedData, updatedAt: new Date() }, trustedReleaseRecorded });`;

patchFile('index.js', (source) => {
  let next = source;

  // Roll back only the over-aggressive /api/save merge. This keeps active
  // development visible after refresh while syncEconomyFromIncomingSave and
  // rating submit remain hardened by earlier patches.
  next = next.replace(
    '    const trustedClientData = mergeServerOwnedSaveData(data, previousSave?.data);\n    const mergedDevelopment = mergeServerDevelopment(trustedClientData, previousSave?.data);',
    '    const mergedDevelopment = mergeServerDevelopment(data, previousSave?.data);',
  );

  // Record trusted releases from the actual current frontend flow: local release
  // -> /api/save. This catches cases where latestRelease was already dismissed
  // by the user and reconstructs a release from releaseHistory/activeGames.
  next = next.replace(
    '    await writeSave(req.telegramUser.id, req.telegramUser, protectedData);\n    res.json({ ok: true, economy: publicEconomy(economy), development: publicDevelopmentStatus(protectedData), save: { data: protectedData, updatedAt: new Date() } });',
    saveTransitionBlock,
  );

  next = next.replace(
    '    await writeSave(req.telegramUser.id, req.telegramUser, protectedData);\n    const hadActiveProject = Boolean(previousSave?.data?.selectedProject?.startedAt);\n    const releaseAdvanced = safeInt(protectedData?.gamesReleased, 0) > safeInt(previousSave?.data?.gamesReleased, 0);\n    const hasNewRelease = Boolean(protectedData?.latestRelease && protectedData.latestRelease?.createdAt !== previousSave?.data?.latestRelease?.createdAt);\n    let trustedReleaseRecorded = false;\n    if (hadActiveProject && releaseAdvanced && hasNewRelease) {\n      await recordTrustedReleaseAndRating(req.telegramUser, previousSave.data, protectedData);\n      trustedReleaseRecorded = true;\n    }\n    res.json({ ok: true, economy: publicEconomy(economy), development: publicDevelopmentStatus(protectedData), save: { data: protectedData, updatedAt: new Date() }, trustedReleaseRecorded });',
    saveTransitionBlock,
  );

  // Keep direct backend release protected too.
  next = next.replace(
    '  app.post("/api/development/release", requireTelegramUser, async (req, res) => runDevelopmentAction(req, res, "release", releaseDevelopmentAction));',
    trustedReleaseRoute,
  );

  if (next.includes('mergeServerOwnedSaveData(data, previousSave?.data)')) {
    console.warn('recovery-trust-fix: aggressive save merge still present');
  }
  if (!next.includes('trusted release save transition')) {
    console.warn('recovery-trust-fix: save transition trusted release recording not installed');
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
