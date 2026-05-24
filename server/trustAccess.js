const GAME_STATUS_CONFIG_ID = "game_status";
const USER_ROLES = new Set(["dev", "tester", "user"]);

function cleanText(value, fallback = "") {
  return String(value || fallback).replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function normalizeUserRole(value) {
  const role = String(value || "user").toLowerCase().trim();
  return USER_ROLES.has(role) ? role : "user";
}

export function normalizeGameStatusDoc(doc) {
  const status = doc?.status === "closed" || doc?.closed === true ? "closed" : "open";
  return {
    status,
    closed: status === "closed",
    message: cleanText(doc?.message || "Service is temporarily unavailable. Please come back later.", "Service is temporarily unavailable. Please come back later."),
    updatedAt: doc?.updatedAt || null,
  };
}

export async function ensureTrustAccessIndexes(db) {
  await db.collection("users").createIndex({ telegramId: 1 }, { unique: true });
  await db.collection("users").createIndex({ role: 1 });
  const now = new Date();
  await db.collection("config").updateOne(
    { _id: GAME_STATUS_CONFIG_ID },
    { $setOnInsert: { _id: GAME_STATUS_CONFIG_ID, status: "open", closed: false, message: "Service is temporarily unavailable. Please come back later.", createdAt: now, updatedAt: now } },
    { upsert: true },
  );
}

export async function ensureUserRole(db, telegramUser) {
  const telegramId = String(telegramUser?.id || "");
  if (!telegramId) return "user";
  const now = new Date();
  await db.collection("users").updateOne(
    { telegramId },
    { $set: { telegramId, telegramUser, updatedAt: now }, $setOnInsert: { role: "user", createdAt: now } },
    { upsert: true },
  );
  const row = await db.collection("users").findOne({ telegramId });
  return normalizeUserRole(row?.role);
}

export async function loadGameStatus(db) {
  const now = new Date();
  await db.collection("config").updateOne(
    { _id: GAME_STATUS_CONFIG_ID },
    { $setOnInsert: { _id: GAME_STATUS_CONFIG_ID, status: "open", closed: false, message: "Service is temporarily unavailable. Please come back later.", createdAt: now, updatedAt: now } },
    { upsert: true },
  );
  return normalizeGameStatusDoc(await db.collection("config").findOne({ _id: GAME_STATUS_CONFIG_ID }));
}

export function canAccessGame(role, gameStatus) {
  return !gameStatus?.closed || role === "dev" || role === "tester";
}
