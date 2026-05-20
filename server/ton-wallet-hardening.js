import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function patchServerIndexTonWallet() {
  const indexPath = join(dirname(fileURLToPath(import.meta.url)), 'index.js');
  let source = '';
  try {
    source = readFileSync(indexPath, 'utf8');
  } catch {
    return;
  }

  let next = source;

  if (!next.includes('tonWalletAddress: typeof economy?.tonWalletAddress')) {
    next = next.replace(
      '    dailyClaimedAt: economy?.dailyClaimedAt || null,\n  };',
      '    dailyClaimedAt: economy?.dailyClaimedAt || null,\n    tonWalletAddress: typeof economy?.tonWalletAddress === "string" ? economy.tonWalletAddress : "",\n  };',
    );
  }

  if (!next.includes('tonWalletAddress: ""')) {
    next = next.replace(
      '    prizeClaims: {},\n    ledger: [],',
      '    prizeClaims: {},\n    tonWalletAddress: "",\n    ledger: [],',
    );
  }

  if (!next.includes('function sanitizeTonWalletAddress')) {
    const helpers = [
      'function sanitizeTonWalletAddress(value) {',
      '  return String(value || "").trim().replace(/\\s+/g, "").slice(0, 128);',
      '}',
      'function isValidTonWalletAddress(value) {',
      '  return sanitizeTonWalletAddress(value).length > 0;',
      '}',
      '',
    ].join('\n');
    next = next.replace('async function start() {', `${helpers}async function start() {`);
  } else {
    next = next.replace(
      /function isValidTonWalletAddress\(value\) \{[\s\S]*?\n\}/,
      'function isValidTonWalletAddress(value) {\n  return sanitizeTonWalletAddress(value).length > 0;\n}',
    );
    next = next.replace(
      'return String(value || "").trim().replace(/\\s+/g, "").slice(0, 96);',
      'return String(value || "").trim().replace(/\\s+/g, "").slice(0, 128);',
    );
  }

  if (!next.includes('/api/economy/ton-wallet')) {
    const routes = [
      '  app.get("/api/economy/ton-wallet", requireTelegramUser, async (req, res) => {',
      '    const save = await getSave(req.telegramUser.id);',
      '    const economy = await getOrCreateEconomy(req.telegramUser, save?.data);',
      '    res.json({ ok: true, economy: publicEconomy(economy) });',
      '  });',
      '',
      '  app.post("/api/economy/ton-wallet", requireTelegramUser, async (req, res) => {',
      '    const address = sanitizeTonWalletAddress(req.body?.address);',
      '    if (!isValidTonWalletAddress(address)) return res.status(400).json({ ok: false, error: "empty_ton_wallet" });',
      '    const save = await getSave(req.telegramUser.id);',
      '    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);',
      '    economy = await patchEconomy(economy.telegramId, { $set: { tonWalletAddress: address, tonWalletUpdatedAt: new Date() } });',
      '    res.json({ ok: true, economy: publicEconomy(economy) });',
      '  });',
      '',
      '  app.delete("/api/economy/ton-wallet", requireTelegramUser, async (req, res) => {',
      '    const save = await getSave(req.telegramUser.id);',
      '    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);',
      '    economy = await patchEconomy(economy.telegramId, { $unset: { tonWalletAddress: "", tonWalletUpdatedAt: "" } });',
      '    res.json({ ok: true, economy: publicEconomy(economy) });',
      '  });',
      '',
    ].join('\n');
    next = next.replace('  app.get("/api/economy", requireTelegramUser, async (req, res) => {', `${routes}  app.get("/api/economy", requireTelegramUser, async (req, res) => {`);
  } else {
    next = next.replace('error: "invalid_ton_wallet"', 'error: "empty_ton_wallet"');
  }

  if (next === source) return;
  try {
    writeFileSync(indexPath, next);
  } catch (error) {
    console.warn('ton-wallet-hardening: failed to patch TON wallet support', error?.message || error);
  }
}

patchServerIndexTonWallet();
