import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const mongoUri = process.env.MONGODB_URI;
const botToken = process.env.BOT_TOKEN;
const maxInitDataAgeSeconds = Number(process.env.MAX_INIT_DATA_AGE_SECONDS || 604800);

if (!mongoUri) {
  console.error("MONGODB_URI не указан в .env / Environment Variables");
  process.exit(1);
}

if (!botToken) {
  console.error("BOT_TOKEN не указан в .env / Environment Variables");
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let db;

function safeTimingEqual(a, b) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validateTelegramInitData(initData) {
  if (!initData || typeof initData !== "string") {
    throw new Error("Нет Telegram initData");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("В initData нет hash");

  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate) throw new Error("В initData нет auth_date");

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > maxInitDataAgeSeconds) {
    throw new Error("Telegram initData устарел");
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeTimingEqual(calculatedHash, hash)) {
    throw new Error("Неверная подпись Telegram initData");
  }

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("В initData нет user");

  const user = JSON.parse(userRaw);
  if (!user?.id) throw new Error("В initData нет user.id");

  return {
    id: String(user.id),
    firstName: user.first_name || "",
    username: user.username || "",
    photoUrl: user.photo_url || "",
  };
}

function requireTelegramUser(req, res, next) {
  try {
    const auth = req.get("authorization") || "";
    const initData = auth.startsWith("tma ")
      ? auth.slice(4)
      : req.get("x-telegram-init-data");

    req.telegramUser = validateTelegramInitData(initData);
    next();
  } catch (error) {
    res.status(401).json({ ok: false, error: "telegram_auth_failed" });
  }
}

function publicSave(save) {
  if (!save) return null;
  return {
    data: save.data ?? null,
    updatedAt: save.updatedAt ?? null,
  };
}

async function start() {
  await client.connect();
  db = client.db("devstudio_tycoon");
  await db.collection("saves").createIndex({ telegramId: 1 }, { unique: true });

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/me", requireTelegramUser, (req, res) => {
    res.json({ ok: true, user: req.telegramUser });
  });

  app.get("/api/save", requireTelegramUser, async (req, res) => {
    const telegramId = req.telegramUser.id;
    const save = await db.collection("saves").findOne({ telegramId });
    res.json({ ok: true, save: publicSave(save) });
  });

  app.post("/api/save", requireTelegramUser, async (req, res) => {
    const telegramId = req.telegramUser.id;
    const data = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({ ok: false, error: "invalid_save_payload" });
    }

    await db.collection("saves").updateOne(
      { telegramId },
      {
        $set: {
          telegramId,
          telegramUser: req.telegramUser,
          data,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ ok: true });
  });

  app.delete("/api/save", requireTelegramUser, async (req, res) => {
    const telegramId = req.telegramUser.id;
    await db.collection("saves").deleteOne({ telegramId });
    res.json({ ok: true });
  });

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Backend запущен: http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Ошибка запуска backend:", error);
  process.exit(1);
});
