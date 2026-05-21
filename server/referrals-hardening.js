import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));

function patchFile(fileName, patcher) {
  const filePath = join(dir, fileName);
  let source = "";
  try { source = readFileSync(filePath, "utf8"); } catch (error) { console.warn(`referrals-hardening: cannot read ${fileName}`, error?.message || error); return; }
  const next = patcher(source);
  if (next === source) return;
  try { writeFileSync(filePath, next); } catch (error) { console.warn(`referrals-hardening: cannot write ${fileName}`, error?.message || error); }
}

function requirePatch(source, needle, label) {
  if (!source.includes(needle)) console.warn(`referrals-hardening: patch check failed: ${label}`);
}

const referralHelpers = [
  "const REFERRAL_QUALIFY_MIN_SCORE = Number(process.env.REFERRAL_QUALIFY_MIN_SCORE || 6.5);",
  "const REFERRAL_DIRECT_PURCHASE_SHARE = Number(process.env.REFERRAL_DIRECT_PURCHASE_SHARE || 0.10);",
  "const REFERRAL_SECOND_PURCHASE_SHARE = Number(process.env.REFERRAL_SECOND_PURCHASE_SHARE || 0.03);",
  "const REFERRAL_CODE_MASK = 0x5f3759df9f4a7c15n;",
  "function referralStartParamFromTelegramId(telegramId) {",
  "  const raw = String(telegramId || \"\").replace(/\\D/g, \"\");",
  "  if (!raw) return \"\";",
  "  try { return \"r_\" + ((BigInt(raw) ^ REFERRAL_CODE_MASK).toString(36)); } catch { return \"\"; }",
  "}",
  "function referrerIdFromStartParam(startParam) {",
  "  const raw = String(startParam || \"\").trim().slice(0, 64);",
  "  if (!raw) return \"\";",
  "  const compact = raw.replace(/^ref[_-]/i, \"r_\").replace(/^invite[_-]/i, \"r_\");",
  "  if (/^u_\\d{3,32}$/i.test(compact)) return compact.slice(2);",
  "  if (/^id_\\d{3,32}$/i.test(compact)) return compact.slice(3);",
  "  if (/^\\d{3,32}$/.test(compact)) return compact;",
  "  const match = compact.match(/^r_([a-z0-9]{2,32})$/i);",
  "  if (!match) return \"\";",
  "  try { const decoded = BigInt(\"0x\" + BigInt(parseInt(match[1], 36)).toString(16)) ^ REFERRAL_CODE_MASK; return decoded > 0n ? decoded.toString(10) : \"\"; } catch {",
  "    try { const decoded = BigInt(parseInt(match[1], 36)) ^ REFERRAL_CODE_MASK; return decoded > 0n ? decoded.toString(10) : \"\"; } catch { return \"\"; }",
  "  }",
  "}",
  "function bestReferralQualifyingScore(data) {",
  "  const scores = [];",
  "  const latest = Number(data?.latestRelease?.score); if (Number.isFinite(latest)) scores.push(latest);",
  "  const best = Number(data?.bestScore); if (Number.isFinite(best)) scores.push(best);",
  "  if (Array.isArray(data?.releaseHistory)) for (const release of data.releaseHistory) { const score = Number(release?.score); if (Number.isFinite(score)) scores.push(score); }",
  "  return scores.length ? Math.max(...scores) : 0;",
  "}",
].join("\n");

const referralAsyncHelpers = [
  "async function ensureReferralForUser(telegramUser) {",
  "  const invitedTelegramId = String(telegramUser?.id || \"\");",
  "  if (!invitedTelegramId) return null;",
  "  const referrerTelegramId = referrerIdFromStartParam(telegramUser?.startParam);",
  "  if (!referrerTelegramId || referrerTelegramId === invitedTelegramId) return null;",
  "  const existing = await db.collection(\"referrals\").findOne({ invitedTelegramId });",
  "  if (existing) return existing;",
  "  const parentReferral = await db.collection(\"referrals\").findOne({ invitedTelegramId: referrerTelegramId });",
  "  const secondLevelReferrerTelegramId = parentReferral?.referrerTelegramId && parentReferral.referrerTelegramId !== invitedTelegramId && parentReferral.referrerTelegramId !== referrerTelegramId ? String(parentReferral.referrerTelegramId) : null;",
  "  const now = new Date();",
  "  const doc = { invitedTelegramId, invitedTelegramUser: telegramUser, referrerTelegramId, secondLevelReferrerTelegramId, startParam: String(telegramUser?.startParam || \"\").slice(0, 64), status: \"pending\", qualifyingScore: 0, qualifiedAt: null, createdAt: now, updatedAt: now };",
  "  try { await db.collection(\"referrals\").insertOne(doc); return doc; } catch (error) { if (error?.code === 11000) return db.collection(\"referrals\").findOne({ invitedTelegramId }); throw error; }",
  "}",
  "async function ensureReferralEconomy(telegramId) {",
  "  const id = String(telegramId || \"\"); if (!id) return null;",
  "  return getOrCreateEconomy({ id, firstName: \"\", username: \"\", photoUrl: \"\", startParam: \"\" }, null);",
  "}",
  "async function incrementReferralCounter(telegramId, field, invitedTelegramId, score, tier) {",
  "  const id = String(telegramId || \"\"); if (!id) return;",
  "  await ensureReferralEconomy(id);",
  "  await patchEconomy(id, { $inc: { [field]: 1 }, $push: { ledger: { $each: [buildLedgerEntry(\"referral_qualified\", 0, \"referral:\" + tier, { invitedTelegramId, qualifyingScore: score })], $slice: -80 } } });",
  "}",
  "async function qualifyReferralIfEligible(telegramUser, saveData, meta = {}) {",
  "  const invitedTelegramId = String(telegramUser?.id || \"\");",
  "  if (!invitedTelegramId) return db.collection(\"economy\").findOne({ telegramId: invitedTelegramId });",
  "  await ensureReferralForUser(telegramUser);",
  "  const score = bestReferralQualifyingScore(saveData);",
  "  if (score < REFERRAL_QUALIFY_MIN_SCORE) return db.collection(\"economy\").findOne({ telegramId: invitedTelegramId });",
  "  const qualified = await db.collection(\"referrals\").findOneAndUpdate({ invitedTelegramId, status: \"pending\" }, { $set: { status: \"qualified\", qualifyingScore: score, qualifiedAt: new Date(), updatedAt: new Date(), qualifyMeta: meta } }, { returnDocument: \"after\" });",
  "  const referral = qualified?.value || qualified;",
  "  if (!referral?.referrerTelegramId) return db.collection(\"economy\").findOne({ telegramId: invitedTelegramId });",
  "  await incrementReferralCounter(referral.referrerTelegramId, \"qualifiedReferrals\", invitedTelegramId, score, \"direct\");",
  "  if (referral.secondLevelReferrerTelegramId) await incrementReferralCounter(referral.secondLevelReferrerTelegramId, \"qualifiedSecondLevelReferrals\", invitedTelegramId, score, \"second\");",
  "  return db.collection(\"economy\").findOne({ telegramId: invitedTelegramId });",
  "}",
].join("\n");

function patchIndexJs(source) {
  let next = source;
  if (!next.includes("REFERRAL_QUALIFY_MIN_SCORE")) next = next.replace("function publicEconomy(economy) {", referralHelpers + "\nfunction publicEconomy(economy) {");
  if (!next.includes("referralStartParam:")) next = next.replace("lastRating: economy?.lastRating || null,", "lastRating: economy?.lastRating || null,\n    referralStartParam: referralStartParamFromTelegramId(economy?.telegramId),");
  if (!next.includes("async function ensureReferralForUser")) next = next.replace("async function grantStars(economy, amount, reason, meta = {}) {", referralAsyncHelpers + "\nasync function grantStars(economy, amount, reason, meta = {}) {");
  if (!next.includes("await ensureReferralForUser(telegramUser);\n  if (existing) return existing;")) next = next.replace("const existing = await db.collection(\"economy\").findOne({ telegramId });\n  if (existing) return existing;", "const existing = await db.collection(\"economy\").findOne({ telegramId });\n  await ensureReferralForUser(telegramUser);\n  if (existing) return existing;");
  if (!next.includes("await ensureReferralForUser(telegramUser);\n  return doc;")) next = next.replace("await db.collection(\"economy\").insertOne(doc);\n  return doc;", "await db.collection(\"economy\").insertOne(doc);\n  await ensureReferralForUser(telegramUser);\n  return doc;");
  if (!next.includes('db.collection("referrals").createIndex({ invitedTelegramId: 1 }')) next = next.replace("await db.collection(\"economy\").createIndex({ telegramId: 1 }, { unique: true });", "await db.collection(\"economy\").createIndex({ telegramId: 1 }, { unique: true });\n  await db.collection(\"referrals\").createIndex({ invitedTelegramId: 1 }, { unique: true });\n  await db.collection(\"referrals\").createIndex({ referrerTelegramId: 1, status: 1 });\n  await db.collection(\"referrals\").createIndex({ secondLevelReferrerTelegramId: 1, status: 1 });\n  await db.collection(\"referral_commissions\").createIndex({ invoiceId: 1, tier: 1 }, { unique: true });");
  if (!next.includes('qualifyReferralIfEligible(req.telegramUser, nextData')) next = next.replace("if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });", "if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);\n    if (action === \"release\") economy = await qualifyReferralIfEligible(req.telegramUser, nextData, { source: \"development:release\" });\n    res.json({ ok: true, save: { data: overlayProtectedEconomy(nextData, economy), updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });");
  if (!next.includes('source: "save_sync"')) next = next.replace("if (incomingData?.gamesReleased > 0) {\n    await upsertRating(telegramUser, incomingData);\n    economy = await db.collection(\"economy\").findOne({ telegramId: telegramUser.id });\n  }", "if (incomingData?.gamesReleased > 0) {\n    await upsertRating(telegramUser, incomingData);\n    economy = await qualifyReferralIfEligible(telegramUser, incomingData, { source: \"save_sync\" });\n  }");
  requirePatch(next, "REFERRAL_QUALIFY_MIN_SCORE", "constants");
  requirePatch(next, "async function ensureReferralForUser", "attribution");
  requirePatch(next, "qualifyReferralIfEligible(req.telegramUser, nextData", "release qualification");
  requirePatch(next, 'source: "save_sync"', "save sync qualification");
  return next;
}

const commissionHelpers = [
  "function referralCommissionAmount(amountStars, rate) { const amount = safeInt(amountStars, 0, 100000); const safeRate = Number.isFinite(Number(rate)) ? Math.max(0, Number(rate)) : 0; return Math.floor(amount * safeRate); }",
  "async function ensureReferralEconomyForCommission(deps, telegramId) { const id = String(telegramId || \"\"); if (!id) return null; return deps.getOrCreateEconomy({ id, firstName: \"\", username: \"\", photoUrl: \"\", startParam: \"\" }, null); }",
  "async function grantReferralPurchaseCommissions(deps, invoice) {",
  "  const referral = await deps.db.collection(\"referrals\").findOne({ invitedTelegramId: invoice.telegramId, status: \"qualified\" });",
  "  if (!referral?.referrerTelegramId) return;",
  "  const tiers = [{ tier: \"direct\", telegramId: referral.referrerTelegramId, amount: referralCommissionAmount(invoice.amountStars, Number(process.env.REFERRAL_DIRECT_PURCHASE_SHARE || 0.10)) }, { tier: \"second\", telegramId: referral.secondLevelReferrerTelegramId, amount: referralCommissionAmount(invoice.amountStars, Number(process.env.REFERRAL_SECOND_PURCHASE_SHARE || 0.03)) }].filter((item) => item.telegramId && item.amount > 0);",
  "  for (const item of tiers) {",
  "    try { const inserted = await deps.db.collection(\"referral_commissions\").insertOne({ invoiceId: invoice.invoiceId, tier: item.tier, telegramId: String(item.telegramId), invitedTelegramId: invoice.telegramId, amountStars: item.amount, sourceAmountStars: invoice.amountStars, itemId: invoice.itemId, createdAt: new Date() }); if (!inserted?.acknowledged) continue; } catch (error) { if (error?.code === 11000) continue; throw error; }",
  "    await ensureReferralEconomyForCommission(deps, item.telegramId);",
  "    await deps.patchEconomy(String(item.telegramId), { $inc: { stars: item.amount }, $push: { ledger: { $each: [{ id: crypto.randomUUID(), kind: \"referral_purchase\", amount: item.amount, reason: \"referral:\" + item.tier + \":purchase\", meta: { invoiceId: invoice.invoiceId, invitedTelegramId: invoice.telegramId, itemId: invoice.itemId, sourceAmountStars: invoice.amountStars }, createdAt: new Date() }], $slice: -80 } } });",
  "  }",
  "}",
].join("\n");

function patchStarsPayments(source) {
  let next = source;
  if (!next.includes("function referralCommissionAmount")) next = next.replace("async function applyPaidInvoice(deps, invoice, payment) {", commissionHelpers + "\nasync function applyPaidInvoice(deps, invoice, payment) {");
  if (!next.includes("await grantReferralPurchaseCommissions(deps, invoice);")) next = next.replace("await deps.db.collection(\"stars_invoices\").updateOne(\n    { invoiceId: invoice.invoiceId, status: { $ne: \"paid\" } },", "await grantReferralPurchaseCommissions(deps, invoice);\n  await deps.db.collection(\"stars_invoices\").updateOne(\n    { invoiceId: invoice.invoiceId, status: { $ne: \"paid\" } },");
  requirePatch(next, "function referralCommissionAmount", "commission helpers");
  requirePatch(next, "grantReferralPurchaseCommissions(deps, invoice)", "commission call");
  return next;
}

patchFile("index.js", patchIndexJs);
patchFile("starsPayments.js", patchStarsPayments);
