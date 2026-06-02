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
    console.warn('ftue-starter-authority: cannot read ' + fileName, error?.message || error);
    return;
  }
  const next = patcher(source);
  if (next === source) return;
  try {
    writeFileSync(filePath, next);
  } catch (error) {
    console.warn('ftue-starter-authority: cannot write ' + fileName, error?.message || error);
  }
}

function requirePatch(source, needle, label) {
  if (!source.includes(needle)) console.warn('ftue-starter-authority: patch check failed: ' + label);
}

patchFile('index.js', (source) => {
  let next = source;

  next = next.replace(
    'async function spendActionStars(req, res, action, amount) {',
    [
      'const STARTER_LOADOUT_CLAIM_ID = "starter-loadout-v1";',
      'const STARTER_LOADOUT = { coins: 5000, rp: 50 };',
      'const FTUE_FREE_PROMOTION_CLAIM_ID = "ftue-free-promotion-v1";',
      '',
      'function applyStarterLoadout(data) {',
      '  const nextData = isPlainObject(data) ? { ...data } : {};',
      '  const claims = isPlainObject(nextData.studioGoalClaims) ? nextData.studioGoalClaims : {};',
      '  return normalizeServerDevelopment({',
      '    ...nextData,',
      '    coins: STARTER_LOADOUT.coins,',
      '    rp: STARTER_LOADOUT.rp,',
      '    studioGoalClaims: { ...claims, [STARTER_LOADOUT_CLAIM_ID]: true },',
      '    lastSavedAt: Date.now(),',
      '  });',
      '}',
      '',
      'function canUseFreeFirstPromotion(data) {',
      '  const claims = isPlainObject(data?.studioGoalClaims) ? data.studioGoalClaims : {};',
      '  return safeInt(data?.gamesReleased, 0, 999999) === 0',
      '    && Boolean(data?.selectedProject?.startedAt)',
      '    && clampNumber(data?.selectedProject?.progress, 0, 100) >= 100',
      '    && !Boolean(data?.selectedProject?.promotionUsed)',
      '    && !claims[FTUE_FREE_PROMOTION_CLAIM_ID];',
      '}',
      '',
      'async function spendActionStars(req, res, action, amount) {',
    ].join('\n'),
  );

  next = next.replace(
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
      '    const starterSyncedData = previousSave ? authoritativeData : applyStarterLoadout(authoritativeData);',
      '    const syncedEconomy = await syncEconomyFromIncomingSave(req.telegramUser, starterSyncedData, previousSave?.data);',
      '    const protectedData = overlayProtectedEconomy({ ...starterSyncedData, saveSchemaVersion: 3 }, syncedEconomy);',
      '    await writeSave(req.telegramUser.id, req.telegramUser, protectedData);',
      '    res.json({ ok: true, economy: publicEconomy(syncedEconomy), development: publicDevelopmentStatus(protectedData), save: { data: protectedData, updatedAt: new Date() } });',
      '  });',
    ].join('\n'),
  );

  next = next.replace(
    [
      'async function runDevelopmentAction(req, res, action, handler, options = {}) {',
      '  try {',
      '    let save = await getSave(req.telegramUser.id);',
      '    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);',
      '    if (options.starCost) {',
      '      const paid = await spendActionStars(req, res, action, options.starCost);',
      '      if (!paid) return;',
      '      save = paid.save;',
      '      economy = paid.economy;',
      '    }',
      '    const authoritative = overlayProtectedEconomy(normalizeServerDevelopment(save?.data || {}), economy);',
      '    let nextData = overlayProtectedEconomy(handler(authoritative), economy);',
      '    await writeSave(req.telegramUser.id, req.telegramUser, nextData);',
      '    if (action === "release" && nextData.gamesReleased > 0) {',
      '      await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);',
      '      if (typeof qualifyReferralIfEligible === "function") {',
      '        economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;',
      '        nextData = overlayProtectedEconomy(nextData, economy);',
      '        await writeSave(req.telegramUser.id, req.telegramUser, nextData);',
      '      }',
      '    }',
      '    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
      '  } catch (error) {',
      '    res.status(error.status || 500).json({ ok: false, error: error.code || error.message || "development_action_failed" });',
      '  }',
      '}',
    ].join('\n'),
    [
      'async function runDevelopmentAction(req, res, action, handler, options = {}) {',
      '  try {',
      '    let save = await getSave(req.telegramUser.id);',
      '    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);',
      '    let authoritative = overlayProtectedEconomy(normalizeServerDevelopment(save?.data || {}), economy);',
      '    const freeFirstPromotion = action === "promote" && canUseFreeFirstPromotion(authoritative);',
      '    if (options.starCost && !freeFirstPromotion) {',
      '      const paid = await spendActionStars(req, res, action, options.starCost);',
      '      if (!paid) return;',
      '      save = paid.save;',
      '      economy = paid.economy;',
      '      authoritative = overlayProtectedEconomy(normalizeServerDevelopment(save?.data || {}), economy);',
      '    }',
      '    let nextData = overlayProtectedEconomy(handler(authoritative), economy);',
      '    if (freeFirstPromotion) {',
      '      const claims = isPlainObject(nextData?.studioGoalClaims) ? nextData.studioGoalClaims : {};',
      '      nextData = overlayProtectedEconomy(normalizeServerDevelopment({ ...nextData, studioGoalClaims: { ...claims, [FTUE_FREE_PROMOTION_CLAIM_ID]: true } }), economy);',
      '    }',
      '    await writeSave(req.telegramUser.id, req.telegramUser, nextData);',
      '    if (action === "release" && nextData.gamesReleased > 0) {',
      '      await recordTrustedReleaseAndRating(req.telegramUser, authoritative, nextData);',
      '      if (typeof qualifyReferralIfEligible === "function") {',
      '        economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: "development:release" }) || economy;',
      '        nextData = overlayProtectedEconomy(nextData, economy);',
      '        await writeSave(req.telegramUser.id, req.telegramUser, nextData);',
      '      }',
      '    }',
      '    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });',
      '  } catch (error) {',
      '    res.status(error.status || 500).json({ ok: false, error: error.code || error.message || "development_action_failed" });',
      '  }',
      '}',
    ].join('\n'),
  );

  requirePatch(next, 'STARTER_LOADOUT = { coins: 5000, rp: 50 }', 'starter loadout values');
  requirePatch(next, 'starterSyncedData = previousSave ? authoritativeData : applyStarterLoadout(authoritativeData);', 'starter loadout save enforcement');
  requirePatch(next, 'FTUE_FREE_PROMOTION_CLAIM_ID', 'free promotion claim');
  requirePatch(next, 'const freeFirstPromotion = action === "promote" && canUseFreeFirstPromotion(authoritative);', 'free promotion gate');
  return next;
});
