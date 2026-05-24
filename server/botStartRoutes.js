function publicBackendUrl(req) {
  const configured = process.env.PUBLIC_BACKEND_URL || process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || "";
  if (configured) return configured.replace(/\/$/, "");
  const proto = req.get?.("x-forwarded-proto") || req.protocol || "https";
  const host = req.get?.("host") || "";
  return host ? `${proto}://${host}` : "";
}

function webAppUrl() {
  return String(process.env.BOT_WEBAPP_URL || process.env.WEBAPP_URL || process.env.APP_URL || process.env.FRONTEND_URL || "").trim();
}

function botDeepLinkFallback() {
  const username = String(process.env.BOT_USERNAME || "").replace(/^@/, "").trim();
  return username ? `https://t.me/${username}?startapp=play` : "";
}

function startPhotoUrl(req) {
  const direct = String(process.env.BOT_START_PHOTO_URL || "").trim();
  if (direct) return direct;
  const base = publicBackendUrl(req);
  return base ? `${base}/bot/start-banner.jpg` : "";
}

function startReplyMarkup() {
  const url = webAppUrl();
  const fallback = botDeepLinkFallback();
  const button = url && /^https:\/\//i.test(url)
    ? { text: "Играть!", web_app: { url } }
    : { text: "Играть!", url: fallback || "https://t.me" };
  return { inline_keyboard: [[button]] };
}

async function telegramApi(method, payload) {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("missing_bot_token");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    const description = result?.description || `telegram_${method}_failed`;
    throw new Error(description);
  }
  return result;
}

async function sendStartMessage(chatId, req) {
  const caption = [
    "🎮 <b>DevStudio Tycoon</b>",
    "",
    "Сделай игру лучше моей: выбирай жанр, сеттинг и платформу, выпускай релизы, собирай рейтинг студии и докажи, что твоя инди-команда умеет делать хиты.",
  ].join("\n");
  const replyMarkup = startReplyMarkup();
  const photo = startPhotoUrl(req);

  if (photo) {
    try {
      return await telegramApi("sendPhoto", {
        chat_id: chatId,
        photo,
        caption,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      });
    } catch (error) {
      console.warn("bot-start: sendPhoto failed, fallback to sendMessage", error?.message || error);
    }
  }

  return telegramApi("sendMessage", {
    chat_id: chatId,
    text: caption,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

function isStartCommand(text) {
  const command = String(text || "").trim().split(/\s+/)[0] || "";
  return command === "/start" || command.startsWith("/start@");
}

export function registerBotStartRoutes(app) {
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
      res.status(500).json({ ok: false, error: "bot_start_failed" });
    }
  });

  app.get("/bot/webhook", (req, res) => res.json({ ok: true, endpoint: "telegram-webhook" }));
}
