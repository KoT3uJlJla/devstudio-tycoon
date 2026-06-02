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
    console.warn('ftue-onboarding-hardening: cannot read ' + fileName, error?.message || error);
    return;
  }
  const next = patcher(source);
  if (next === source) return;
  try {
    writeFileSync(filePath, next);
  } catch (error) {
    console.warn('ftue-onboarding-hardening: cannot write ' + fileName, error?.message || error);
  }
}

function requirePatch(source, needle, label) {
  if (!source.includes(needle)) console.warn('ftue-onboarding-hardening: patch check failed: ' + label);
}

patchFile('index.js', (source) => {
  let next = source;

  next = next.replace(
    '  app.get("/api/economy", requireTelegramUser, async (req, res) => {',
    [
      '  app.post("/api/ftue/upgrade-rp", requireTelegramUser, async (req, res) => {',
      '    try {',
      '      const FTUE_UPGRADE_RP_CLAIM_ID = "ftue-upgrade-rp-v1";',
      '      const FTUE_UPGRADE_RP_BONUS = 24;',
      '      const save = await getSave(req.telegramUser.id);',
      '      const economy = await getOrCreateEconomy(req.telegramUser, save?.data);',
      '      const authoritative = overlayProtectedEconomy(normalizeServerDevelopment(save?.data || {}), economy);',
      '      const claims = isPlainObject(authoritative?.studioGoalClaims) ? authoritative.studioGoalClaims : {};',
      '      if (claims[FTUE_UPGRADE_RP_CLAIM_ID]) {',
      '        return res.json({ ok: true, alreadyClaimed: true, reward: { rp: 0 }, economy: publicEconomy(economy), save: { data: authoritative, updatedAt: save?.updatedAt ?? new Date() } });',
      '      }',
      '      const nextData = normalizeServerDevelopment({',
      '        ...applyRewardToSaveData(authoritative, { rp: FTUE_UPGRADE_RP_BONUS }),',
      '        studioGoalClaims: { ...claims, [FTUE_UPGRADE_RP_CLAIM_ID]: true },',
      '      });',
      '      const protectedData = overlayProtectedEconomy(nextData, economy);',
      '      await writeSave(req.telegramUser.id, req.telegramUser, protectedData);',
      '      res.json({ ok: true, alreadyClaimed: false, reward: { rp: FTUE_UPGRADE_RP_BONUS }, economy: publicEconomy(economy), save: { data: protectedData, updatedAt: new Date() } });',
      '    } catch (error) {',
      '      res.status(error.status || 500).json({ ok: false, error: error.code || error.message || "ftue_upgrade_reward_failed" });',
      '    }',
      '  });',
      '  app.get("/api/economy", requireTelegramUser, async (req, res) => {',
    ].join('\n'),
  );

  requirePatch(next, 'app.post("/api/ftue/upgrade-rp"', 'ftue upgrade rp route');
  requirePatch(next, 'FTUE_UPGRADE_RP_BONUS = 24', 'ftue rp bonus amount');
  return next;
});
