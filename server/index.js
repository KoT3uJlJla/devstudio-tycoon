import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { mergeServerDevelopment, normalizeServerDevelopment, publicDevelopmentStatus } from "./devAuthority.js";
import { registerStarsPaymentRoutes } from "./starsPayments.js";
import { registerTonWalletRoutes } from "./tonWalletRoutes.js";
import {
  DEVELOPMENT_ACTION_STAR_COSTS,
  promoteDevelopmentAction,
  releaseDevelopmentAction,
  resolveDevelopmentEventAction,
  skipDevelopmentAction,
  startDevelopmentAction,
} from "./devActions.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const mongoUri = process.env.MONGODB_URI;
const botToken = process.env.BOT_TOKEN;
const maxInitDataAgeSeconds = Number(process.env.MAX_INIT_DATA_AGE_SECONDS || 604800);

if (!mongoUri) {
  console.error("MONGODB_URI не указан в Environment Variables");
  process.exit(1);
}
if (!botToken) {
  console.error("BOT_TOKEN не указан в Environment Variables");
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let db;

const PRIZE_DISTRIBUTION = [
  { place: 1, amountUsd: 70, percent: 35 },
  { place: 2, amountUsd: 50, percent: 25 },
  { place: 3, amountUsd: 35, percent: 17.5 },
  { place: 4, amountUsd: 25, percent: 12.5 },
  { place: 5, amountUsd: 20, percent: 10 },
];

const REFERRAL_MILESTONES = [
  { id: "m1", target: 1, reward: { coins: 1500, rp: 8 } },
  { id: "m3", target: 3, reward: { coins: 5000, rp: 20 } },
  { id: "m5", target: 5, reward: { coins: 11000, rp: 40 } },
  { id: "m10", target: 10, reward: { coins: 28000, rp: 90 } },
  { id: "m25", target: 25, reward: { coins: 90000, rp: 260 } },
];

const SHOP_ITEMS = {
  starter_pack: { title: "Стартовый набор", costStars: 100, reward: { coins: 5000, rp: 50, offerSeen: true } },
  coins_small: { title: "Малый набор монет", costStars: 50, reward: { coins: 3000 } },
  coins_medium: { title: "Средний набор монет", costStars: 250, reward: { coins: 18000 } },
  research_boost: { title: "Ускорение науки", costStars: 75, reward: { rp: 100 } },
  rename_studio: { title: "Переименование студии", costStars: 25, reward: {} },
  refresh_hires: { title: "Обновление кандидатов", costStars: 10, reward: {} },
  time_skip: { title: "Ускорить разработку на 25%", costStars: 15, reward: {} },
  promotion: { title: "Продвижение релиза", costStars: 35, reward: {} },
  product_instinct: { title: "Продуктовое чутьё", costStars: 450, reward: { unlockResearchId: "product-instinct" } },
};

function safeTimingEqual(a, b) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validateTelegramInitData(initData) {
  if (!initData || typeof initData !== "string") throw new Error("missing_init_data");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("missing_hash");
  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate) throw new Error("missing_auth_date");
  if (Math.floor(Date.now() / 1000) - authDate > maxInitDataAgeSeconds) throw new Error("expired_init_data");

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (!safeTimingEqual(calculatedHash, hash)) throw new Error("bad_signature");

  const user = JSON.parse(params.get("user") || "null");
  if (!user?.id) throw new Error("missing_user");
  return {
    id: String(user.id),
    firstName: user.first_name || "",
    username: user.username || "",
    photoUrl: user.photo_url || "",
    startParam: params.get("start_param") || "",
  };
}

function requireTelegramUser(req, res, next) {
  try {
    const auth = req.get("authorization") || "";
    const initData = auth.startsWith("tma ") ? auth.slice(4) : req.get("x-telegram-init-data");
    req.telegramUser = validateTelegramInitData(initData);
    next();
  } catch {
    res.status(401).json({ ok: false, error: "telegram_auth_failed" });
  }
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function clampNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}
function safeInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(clampNumber(value, min, max));
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function weekKey(date = new Date()) {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
  return `${current.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
function sanitizeText(value, fallback = "") {
  return String(value || fallback).replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function publicEconomy(economy) {
  return {
    stars: safeInt(economy?.stars, 0, 9999999),
    qualifiedReferrals: safeInt(economy?.qualifiedReferrals, 0, 999999),
    qualifiedSecondLevelReferrals: safeInt(economy?.qualifiedSecondLevelReferrals, 0, 999999),
    referralMilestoneClaims: isPlainObject(economy?.referralMilestoneClaims) ? economy.referralMilestoneClaims : {},
    dailyClaimedAt: economy?.dailyClaimedAt || null,
    lastRating: economy?.lastRating || null,
    tonWalletAddress: typeof economy?.tonWalletAddress === "string" ? economy.tonWalletAddress : "",
  };
}

function overlayProtectedEconomy(data, economy) {
  if (!isPlainObject(data)) return data;
  const protectedEconomy = publicEconomy(economy);
  return {
    ...data,
    stars: protectedEconomy.stars,
    qualifiedReferrals: protectedEconomy.qualifiedReferrals,
    qualifiedSecondLevelReferrals: protectedEconomy.qualifiedSecondLevelReferrals,
    referralMilestoneClaims: protectedEconomy.referralMilestoneClaims,
    dailyClaimedAt: protectedEconomy.dailyClaimedAt,
  };
}

async function getSave(telegramId) {
  return db.collection("saves").findOne({ telegramId });
}
async function writeSave(telegramId, telegramUser, data) {
  await db.collection("saves").updateOne(
    { telegramId },
    { $set: { telegramId, telegramUser, data, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
}
async function getAuthoritativeSave(telegramUser, save, economy) {
  if (!save) return null;
  const normalizedData = overlayProtectedEconomy(normalizeServerDevelopment(save.data), economy);
  if (JSON.stringify(normalizedData) !== JSON.stringify(save.data)) {
    await writeSave(telegramUser.id, telegramUser, normalizedData);
  }
  return { data: normalizedData, updatedAt: save.updatedAt ?? null };
}

async function getOrCreateEconomy(telegramUser, saveData = null) {
  const telegramId = telegramUser.id;
  const existing = await db.collection("economy").findOne({ telegramId });
  if (existing) return existing;
  const now = new Date();
  const doc = {
    telegramId,
    telegramUser,
    // Stars are authoritative and may only be created by server grants,
    // Telegram invoice payments, or explicit server-side spend/grant ledgers.
    // Never resurrect star balance from client saveData.
    stars: 0,
    qualifiedReferrals: 0,
    qualifiedSecondLevelReferrals: 0,
    referralMilestoneClaims: {},
    dailyClaimedAt: null,
    dailyTaskStarClaims: {},
    tutorialStarClaimed: false,
    prizeClaims: {},
    tonWalletAddress: "",
    ledger: [],
    migratedFromSave: Boolean(saveData),
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("economy").insertOne(doc);
  return doc;
}
async function patchEconomy(telegramId, patch) {
  await db.collection("economy").updateOne({ telegramId }, { ...patch, $set: { ...(patch.$set || {}), updatedAt: new Date() } });
  return db.collection("economy").findOne({ telegramId });
}
function buildLedgerEntry(kind, amount, reason, meta = {}) {
  return { id: crypto.randomUUID(), kind, amount, reason, meta, createdAt: new Date() };
}
async function grantStars(economy, amount, reason, meta = {}) {
  const safeAmount = safeInt(amount, 0, 100000);
  if (!safeAmount) return economy;
  return patchEconomy(economy.telegramId, {
    $inc: { stars: safeAmount },
    $push: { ledger: { $each: [buildLedgerEntry("star_grant", safeAmount, reason, meta)], $slice: -80 } },
  });
}
async function spendStars(economy, amount, reason, meta = {}) {
  const safeAmount = safeInt(amount, 1, 100000);
  return db.collection("economy").findOneAndUpdate(
    { telegramId: economy.telegramId, stars: { $gte: safeAmount } },
    { $inc: { stars: -safeAmount }, $push: { ledger: { $each: [buildLedgerEntry("star_spend", -safeAmount, reason, meta)], $slice: -80 } }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

function ratingBreakdownFromSave(data) {
  const currentDay = safeInt(data?.gameDay, 1, 999999);
  const releaseHistory = Array.isArray(data?.releaseHistory) ? data.releaseHistory : [];
  const activeGames = Array.isArray(data?.activeGames) ? data.activeGames : [];
  const recent = releaseHistory.filter((entry) => currentDay - safeInt(entry?.day, 0, 999999) <= 7).slice(-5);
  const bestRecent = recent.reduce((best, entry) => Math.max(best, clampNumber(entry?.score, 0, 10)), 0);
  const avgRecent = recent.length ? recent.reduce((sum, entry) => sum + clampNumber(entry?.score, 0, 10), 0) / recent.length : 0;
  const activeRevenue = Math.min(9000, activeGames.reduce((sum, game) => sum + safeInt(game?.totalEarned, 0), 0) / 16);
  const total = Math.max(0, Math.round(bestRecent * bestRecent * 930 + avgRecent * 1500 + activeRevenue + recent.length * 900 + safeInt(data?.studioXp, 0) / 2.4));
  return { total, items: [["Лучший свежий релиз", Math.round(bestRecent * bestRecent * 930)], ["Среднее качество недели", Math.round(avgRecent * 1500)], ["Доход живых игр", Math.round(activeRevenue)]].filter(([, value]) => Number(value) !== 0) };
}
async function upsertRating(telegramUser, saveData) {
  const currentWeek = weekKey();
  const breakdown = ratingBreakdownFromSave(saveData);
  const displayName = sanitizeText(saveData?.studioName || telegramUser.username || telegramUser.firstName || `Игрок ${telegramUser.id}`, "Игрок");
  const bestTitle = sanitizeText(saveData?.latestRelease?.projectName || saveData?.releaseHistory?.slice?.(-1)?.[0]?.title || "Твоя лучшая игра", "Твоя лучшая игра");
  const doc = { telegramId: telegramUser.id, telegramUser, weekKey: currentWeek, displayName, bestTitle, score: breakdown.total, breakdown: breakdown.items, updatedAt: new Date() };
  await db.collection("ratings").updateOne({ telegramId: telegramUser.id, weekKey: currentWeek }, { $set: doc, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  await db.collection("economy").updateOne({ telegramId: telegramUser.id }, { $set: { lastRating: { weekKey: currentWeek, score: breakdown.total, updatedAt: new Date() } } });
  return doc;
}
async function leaderboardForCurrentWeek() {
  const currentWeek = weekKey();
  const rows = await db.collection("ratings").find({ weekKey: currentWeek }).sort({ score: -1, updatedAt: 1 }).limit(5).toArray();
  return rows.map((row, index) => ({ place: index + 1, telegramId: row.telegramId, displayName: row.displayName, bestTitle: row.bestTitle, score: row.score, prize: PRIZE_DISTRIBUTION[index] || null }));
}

async function syncEconomyFromIncomingSave(telegramUser, incomingData, previousData) {
  let economy = await getOrCreateEconomy(telegramUser, previousData || incomingData);
  const today = todayKey();
  if (incomingData?.dailyClaimedAt === today && economy.dailyClaimedAt !== today) {
    economy = await grantStars(economy, 1, "daily_login", { day: today });
    economy = await patchEconomy(economy.telegramId, { $set: { dailyClaimedAt: today } });
  }
  if (incomingData?.gamesReleased > 0) {
    await upsertRating(telegramUser, incomingData);
    economy = await db.collection("economy").findOne({ telegramId: telegramUser.id });
  }
  return economy;
}
function applyRewardToSaveData(data, reward) {
  const next = isPlainObject(data) ? { ...data } : {};
  if (reward.coins) next.coins = safeInt(next.coins, -50000) + reward.coins;
  if (reward.rp) next.rp = safeInt(next.rp, 0) + reward.rp;
  if (reward.offerSeen) next.offerSeen = true;
  if (reward.unlockResearchId) {
    const ids = Array.isArray(next.unlockedResearchIds) ? next.unlockedResearchIds : [];
    next.unlockedResearchIds = ids.includes(reward.unlockResearchId) ? ids : [reward.unlockResearchId, ...ids];
    next.dailyResearchUnlocked = safeInt(next.dailyResearchUnlocked, 0) + 1;
  }
  next.lastSavedAt = Date.now();
  return normalizeServerDevelopment(next);
}
async function spendActionStars(req, res, action, amount) {
  const save = await getSave(req.telegramUser.id);
  const economy = await getOrCreateEconomy(req.telegramUser, save?.data);
  const updated = await spendStars(economy, amount, `development:${action}`, { action });
  if (!updated) {
    res.status(402).json({ ok: false, error: "not_enough_stars", economy: publicEconomy(economy) });
    return null;
  }
  return { save, economy: updated };
}
async function runDevelopmentAction(req, res, action, handler, options = {}) {
  try {
    let save = await getSave(req.telegramUser.id);
    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    if (options.starCost) {
      const paid = await spendActionStars(req, res, action, options.starCost);
      if (!paid) return;
      save = paid.save;
      economy = paid.economy;
    }
    const authoritative = overlayProtectedEconomy(normalizeServerDevelopment(save?.data || {}), economy);
    const nextData = overlayProtectedEconomy(handler(authoritative), economy);
    await writeSave(req.telegramUser.id, req.telegramUser, nextData);
    if (nextData.gamesReleased > 0) await upsertRating(req.telegramUser, nextData);
    res.json({ ok: true, save: { data: nextData, updatedAt: new Date() }, economy: publicEconomy(economy), development: publicDevelopmentStatus(nextData) });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.code || error.message || "development_action_failed" });
  }
}

async function start() {
  await client.connect();
  db = client.db("devstudio_tycoon");
  await db.collection("saves").createIndex({ telegramId: 1 }, { unique: true });
  await db.collection("economy").createIndex({ telegramId: 1 }, { unique: true });
  await db.collection("ratings").createIndex({ weekKey: 1, score: -1 });
  await db.collection("ratings").createIndex({ telegramId: 1, weekKey: 1 }, { unique: true });
  await db.collection("stars_invoices").createIndex({ invoiceId: 1 }, { unique: true });
  await db.collection("stars_invoices").createIndex({ telegramId: 1, createdAt: -1 });

  app.get("/health", (req, res) => res.json({ ok: true }));
  app.get("/api/me", requireTelegramUser, (req, res) => res.json({ ok: true, user: req.telegramUser }));

  app.get("/api/save", requireTelegramUser, async (req, res) => {
    const save = await getSave(req.telegramUser.id);
    const economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    res.json({ ok: true, save: await getAuthoritativeSave(req.telegramUser, save, economy), economy: publicEconomy(economy), development: save?.data ? publicDevelopmentStatus(save.data) : null });
  });

  app.post("/api/save", requireTelegramUser, async (req, res) => {
    const data = req.body;
    if (!isPlainObject(data)) return res.status(400).json({ ok: false, error: "invalid_save_payload" });
    const previousSave = await getSave(req.telegramUser.id);
    if (!previousSave && data?.saveSchemaVersion !== 3) return res.status(409).json({ ok: false, error: "stale_client_save" });
    const mergedDevelopment = mergeServerDevelopment(data, previousSave?.data);
    const authoritativeData = normalizeServerDevelopment(mergedDevelopment, previousSave?.data);
    const economy = await syncEconomyFromIncomingSave(req.telegramUser, authoritativeData, previousSave?.data);
    const protectedData = overlayProtectedEconomy({ ...authoritativeData, saveSchemaVersion: 3 }, economy);
    await writeSave(req.telegramUser.id, req.telegramUser, protectedData);
    res.json({ ok: true, economy: publicEconomy(economy), development: publicDevelopmentStatus(protectedData), save: { data: protectedData, updatedAt: new Date() } });
  });

  app.get("/api/development/status", requireTelegramUser, async (req, res) => {
    const save = await getSave(req.telegramUser.id);
    if (!save?.data) return res.json({ ok: true, development: publicDevelopmentStatus(null) });
    const economy = await getOrCreateEconomy(req.telegramUser, save.data);
    const authoritative = overlayProtectedEconomy(normalizeServerDevelopment(save.data), economy);
    await writeSave(req.telegramUser.id, req.telegramUser, authoritative);
    res.json({ ok: true, development: publicDevelopmentStatus(authoritative), save: { data: authoritative, updatedAt: new Date() } });
  });

  app.post("/api/development/start", requireTelegramUser, async (req, res) => runDevelopmentAction(req, res, "start", (data) => startDevelopmentAction(data, req.body?.project)));
  app.post("/api/development/skip", requireTelegramUser, async (req, res) => runDevelopmentAction(req, res, "skip", skipDevelopmentAction, { starCost: DEVELOPMENT_ACTION_STAR_COSTS.skip }));
  app.post("/api/development/promote", requireTelegramUser, async (req, res) => runDevelopmentAction(req, res, "promote", promoteDevelopmentAction, { starCost: DEVELOPMENT_ACTION_STAR_COSTS.promote }));
  app.post("/api/development/resolve-event", requireTelegramUser, async (req, res) => runDevelopmentAction(req, res, "resolve-event", (data) => resolveDevelopmentEventAction(data, req.body?.choiceId)));
  app.post("/api/development/release", requireTelegramUser, async (req, res) => runDevelopmentAction(req, res, "release", releaseDevelopmentAction));

  app.delete("/api/save", requireTelegramUser, async (req, res) => {
    await db.collection("saves").deleteOne({ telegramId: req.telegramUser.id });
    await db.collection("economy").deleteOne({ telegramId: req.telegramUser.id });
    await db.collection("ratings").deleteMany({ telegramId: req.telegramUser.id });
    await db.collection("user_resets").updateOne({ telegramId: req.telegramUser.id }, { $set: { telegramId: req.telegramUser.id, resetAt: new Date() } }, { upsert: true });
    res.json({ ok: true });
  });

  registerTonWalletRoutes(app, { requireTelegramUser, getSave, getOrCreateEconomy, patchEconomy });

  app.get("/api/economy", requireTelegramUser, async (req, res) => {
    const save = await getSave(req.telegramUser.id);
    const economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    res.json({ ok: true, economy: publicEconomy(economy), leaderboard: await leaderboardForCurrentWeek(), weekKey: weekKey(), prizes: PRIZE_DISTRIBUTION, shop: SHOP_ITEMS });
  });
  app.post("/api/economy/daily", requireTelegramUser, async (req, res) => {
    const save = await getSave(req.telegramUser.id);
    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    const today = todayKey();
    if (economy.dailyClaimedAt === today) return res.status(409).json({ ok: false, error: "daily_already_claimed", economy: publicEconomy(economy) });
    economy = await grantStars(economy, 1, "daily_login", { day: today });
    economy = await patchEconomy(economy.telegramId, { $set: { dailyClaimedAt: today } });
    const nextData = overlayProtectedEconomy(applyRewardToSaveData(save?.data, { coins: 500 }), economy);
    await writeSave(req.telegramUser.id, req.telegramUser, nextData);
    res.json({ ok: true, economy: publicEconomy(economy), reward: { stars: 1, coins: 500 }, save: { data: nextData, updatedAt: new Date() } });
  });
  app.post("/api/economy/shop/purchase", requireTelegramUser, async (req, res) => {
    const itemId = String(req.body?.itemId || "");
    const item = SHOP_ITEMS[itemId];
    if (!item) return res.status(404).json({ ok: false, error: "unknown_shop_item" });
    const save = await getSave(req.telegramUser.id);
    const economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    const updated = await spendStars(economy, item.costStars, `shop:${itemId}`, { itemId, title: item.title });
    if (!updated) return res.status(402).json({ ok: false, error: "not_enough_stars", economy: publicEconomy(economy) });
    const nextData = overlayProtectedEconomy(applyRewardToSaveData(save?.data, item.reward), updated);
    await writeSave(req.telegramUser.id, req.telegramUser, nextData);
    res.json({ ok: true, economy: publicEconomy(updated), item: { id: itemId, title: item.title, costStars: item.costStars, reward: item.reward }, save: { data: nextData, updatedAt: new Date() } });
  });
  app.post("/api/economy/referral/claim", requireTelegramUser, async (req, res) => {
    const milestone = REFERRAL_MILESTONES.find((item) => item.id === String(req.body?.milestoneId || ""));
    if (!milestone) return res.status(404).json({ ok: false, error: "unknown_milestone" });
    const save = await getSave(req.telegramUser.id);
    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    const claims = isPlainObject(economy.referralMilestoneClaims) ? economy.referralMilestoneClaims : {};
    if (claims[milestone.id]) return res.status(409).json({ ok: false, error: "milestone_already_claimed", economy: publicEconomy(economy) });
    if (safeInt(economy.qualifiedReferrals, 0) < milestone.target) return res.status(403).json({ ok: false, error: "milestone_not_ready", economy: publicEconomy(economy) });
    economy = await patchEconomy(economy.telegramId, { $set: { [`referralMilestoneClaims.${milestone.id}`]: true } });
    const nextData = overlayProtectedEconomy(applyRewardToSaveData(save?.data, milestone.reward), economy);
    await writeSave(req.telegramUser.id, req.telegramUser, nextData);
    res.json({ ok: true, economy: publicEconomy(economy), reward: milestone.reward, save: { data: nextData, updatedAt: new Date() } });
  });
  app.post("/api/economy/rating/submit", requireTelegramUser, async (req, res) => {
    const save = await getSave(req.telegramUser.id);
    const data = normalizeServerDevelopment(isPlainObject(req.body?.state) ? req.body.state : save?.data);
    if (!data) return res.status(400).json({ ok: false, error: "missing_state" });
    res.json({ ok: true, rating: await upsertRating(req.telegramUser, data), leaderboard: await leaderboardForCurrentWeek(), weekKey: weekKey() });
  });
  registerStarsPaymentRoutes(app, { db, botToken, requireTelegramUser, SHOP_ITEMS, getSave, getOrCreateEconomy, overlayProtectedEconomy, applyRewardToSaveData, writeSave, patchEconomy });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Backend запущен: http://localhost:${port}`));
}

start().catch((error) => {
  console.error("Ошибка запуска backend:", error);
  process.exit(1);
});