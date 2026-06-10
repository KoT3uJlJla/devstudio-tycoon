import express from "express";

const originalListen = express.application.listen;
let registered = false;

function publicBackendUrl(req) {
  const configured = process.env.PUBLIC_BACKEND_URL || process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || "";
  if (configured) return configured.replace(/\/$/, "");
  const proto = req.get?.("x-forwarded-proto") || req.protocol || "https";
  const host = req.get?.("host") || "";
  return host ? `${proto}://${host}` : "";
}

function webAppUrl() {
  return String(process.env.WEBAPP_URL || process.env.BOT_WEBAPP_URL || process.env.APP_URL || process.env.FRONTEND_URL || "https://devstudio-tycoon-stat.pages.dev").trim().replace(/\/+$/, "");
}

function botDeepLinkFallback() {
  const username = String(process.env.BOT_USERNAME || "").replace(/^@/, "").trim();
  return username ? `https://t.me/${username}?startapp=play` : "";
}

function startPhotoUrl(req) {
  const direct = String(process.env.BOT_START_IMAGE_URL || process.env.BOT_START_PHOTO_URL || "").trim();
  if (direct) return direct;
  const appUrl = webAppUrl();
  return appUrl ? `${appUrl}/assets/bot-start-cover.png` : "";
}

function startReplyMarkup() {
  const url = webAppUrl();
  const fallback = botDeepLinkFallback();
  const button = url && /^https:\/\//i.test(url)
    ? { text: "Play Now!", web_app: { url } }
    : { text: "Play Now!", url: fallback || "https://t.me" };
  return { inline_keyboard: [[button]] };
}

async function telegramApi(method, payload) {
  const token = String(process.env.BOT_TOKEN || "").trim();
  if (!token) throw new Error("missing_bot_token");
  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(error?.message || `telegram_${method}_request_failed`);
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    const description = result?.description || `telegram_${method}_failed`;
    throw new Error(description);
  }
  return result;
}

async function sendStartMessage(chatId, req) {
  const caption = [
    "Build hit games, grow your indie studio, and climb the charts.",
    "",
    "Tap the button below to start playing.",
  ].join("\n");
  const replyMarkup = startReplyMarkup();
  const photo = startPhotoUrl(req);

  if (photo) {
    try {
      return await telegramApi("sendPhoto", {
        chat_id: chatId,
        photo,
        caption,
        reply_markup: replyMarkup,
      });
    } catch (error) {
      console.warn("bot-start: sendPhoto failed, fallback to sendMessage", error?.message || error);
    }
  }

  return telegramApi("sendMessage", {
    chat_id: chatId,
    text: caption,
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

function isStartCommand(text) {
  const command = String(text || "").trim().split(/\s+/)[0] || "";
  return command === "/start" || command.startsWith("/start@");
}

function registerBotStartRoutes(app) {
  if (registered) return;
  registered = true;

  app.get("/bot/start-banner.jpg", (req, res) => {
    const redirectUrl = String(process.env.BOT_START_PHOTO_URL || "").trim();
    if (redirectUrl) return res.redirect(302, redirectUrl);
    res.status(404).send("BOT_START_PHOTO_URL is not configured");
  });

  app.post(["/telegram/webhook", "/bot/webhook"], async (req, res) => {
    const secret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
    if (secret && req.get("x-telegram-bot-api-secret-token") !== secret) {
      return res.status(403).json({ ok: false, error: "bad_webhook_secret" });
    }

    const message = req.body?.message || req.body?.edited_message;
    const chatId = message?.chat?.id;
    const text = message?.text || "";
    if (!chatId || !isStartCommand(text)) return res.json({ ok: true, ignored: true });

    try {
      await sendStartMessage(chatId, req);
      res.json({ ok: true });
    } catch (error) {
      console.error("bot-start: failed", error?.message || error);
      res.status(200).json({ ok: true, warning: "bot_start_failed" });
    }
  });

  app.get("/bot/webhook", (req, res) => res.json({ ok: true, endpoint: "telegram-webhook" }));
}

express.application.listen = function patchedListen(...args) {
  registerBotStartRoutes(this);
  return originalListen.apply(this, args);
};
