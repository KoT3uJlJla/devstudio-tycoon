import crypto from "crypto";

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.floor(Math.min(max, Math.max(min, parsed)));
}

function invoicePublic(invoice) {
  if (!invoice) return null;
  return {
    invoiceId: invoice.invoiceId,
    itemId: invoice.itemId,
    amountStars: invoice.amountStars,
    status: invoice.status,
    createdAt: invoice.createdAt,
    paidAt: invoice.paidAt || null,
  };
}

function buildInvoicePayload(invoiceId) {
  return `ds_shop:${invoiceId}`;
}

function invoiceIdFromPayload(payload) {
  const value = String(payload || "");
  return value.startsWith("ds_shop:") ? value.slice("ds_shop:".length) : "";
}

async function botApi(botToken, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) throw new Error(json?.description || `telegram_api_failed:${method}`);
  return json.result;
}

async function createInvoiceLink(botToken, item, invoicePayload) {
  return botApi(botToken, "createInvoiceLink", {
    title: item.title,
    description: `DevStudio Tycoon: ${item.title}`,
    payload: invoicePayload,
    provider_token: "",
    currency: "XTR",
    prices: [{ label: item.title, amount: item.costStars }],
  });
}

async function answerPreCheckout(botToken, id, ok, errorMessage = "") {
  return botApi(botToken, "answerPreCheckoutQuery", ok ? { pre_checkout_query_id: id, ok: true } : { pre_checkout_query_id: id, ok: false, error_message: errorMessage || "Заказ недоступен" });
}

async function ensureWebhook(botToken, webhookUrl, secretToken) {
  if (!webhookUrl) return;
  try {
    await botApi(botToken, "setWebhook", {
      url: webhookUrl,
      allowed_updates: ["message", "pre_checkout_query"],
      ...(secretToken ? { secret_token: secretToken } : {}),
    });
    console.log(`Telegram webhook установлен: ${webhookUrl}`);
  } catch (error) {
    console.error("Не удалось установить Telegram webhook:", error.message || error);
  }
}

async function applyPaidInvoice(deps, invoice, payment) {
  const item = deps.SHOP_ITEMS[invoice.itemId];
  if (!item) return null;
  const save = await deps.getSave(invoice.telegramId);
  const economy = await deps.getOrCreateEconomy(invoice.telegramUser, save?.data);
  const nextData = deps.overlayProtectedEconomy(deps.applyRewardToSaveData(save?.data, item.reward), economy);
  await deps.writeSave(invoice.telegramId, invoice.telegramUser, nextData);
  await deps.patchEconomy(invoice.telegramId, {
    $push: {
      ledger: {
        $each: [{ id: crypto.randomUUID(), kind: "telegram_stars_payment", amount: invoice.amountStars, reason: `invoice:${invoice.itemId}`, meta: { invoiceId: invoice.invoiceId, title: item.title, telegramPaymentChargeId: payment.telegram_payment_charge_id || null }, createdAt: new Date() }],
        $slice: -80,
      },
    },
  });
  await deps.db.collection("stars_invoices").updateOne(
    { invoiceId: invoice.invoiceId, status: { $ne: "paid" } },
    { $set: { status: "paid", paidAt: new Date(), payment: { currency: payment.currency, totalAmount: payment.total_amount, telegramPaymentChargeId: payment.telegram_payment_charge_id || null, providerPaymentChargeId: payment.provider_payment_charge_id || null }, updatedAt: new Date() } },
  );
  return nextData;
}

async function handlePreCheckout(deps, query) {
  const invoiceId = invoiceIdFromPayload(query?.invoice_payload);
  const invoice = invoiceId ? await deps.db.collection("stars_invoices").findOne({ invoiceId }) : null;
  if (!invoice || invoice.status !== "pending") return answerPreCheckout(deps.botToken, query.id, false, "Этот счёт уже недоступен");
  if (String(query.from?.id || "") !== invoice.telegramId) return answerPreCheckout(deps.botToken, query.id, false, "Этот счёт создан для другого игрока");
  if (query.currency !== "XTR" || safeInt(query.total_amount, 0) !== invoice.amountStars) return answerPreCheckout(deps.botToken, query.id, false, "Сумма счёта изменилась. Создай новый счёт");
  return answerPreCheckout(deps.botToken, query.id, true);
}

async function handleSuccessfulPayment(deps, message) {
  const payment = message?.successful_payment;
  const invoiceId = invoiceIdFromPayload(payment?.invoice_payload);
  if (!invoiceId) return;
  const invoice = await deps.db.collection("stars_invoices").findOne({ invoiceId });
  if (!invoice || invoice.status === "paid" || invoice.status !== "pending") return;
  if (String(message?.from?.id || "") !== invoice.telegramId) return;
  if (payment.currency !== "XTR" || safeInt(payment.total_amount, 0) !== invoice.amountStars) {
    await deps.db.collection("stars_invoices").updateOne({ invoiceId }, { $set: { status: "mismatch", updatedAt: new Date(), payment } });
    return;
  }
  await applyPaidInvoice(deps, invoice, payment);
}

export function registerStarsPaymentRoutes(app, deps) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || "";

  app.post("/api/stars/invoice", deps.requireTelegramUser, async (req, res) => {
    try {
      const itemId = String(req.body?.itemId || "");
      const item = deps.SHOP_ITEMS[itemId];
      if (!item) return res.status(404).json({ ok: false, error: "unknown_shop_item" });
      if (!item.costStars || item.costStars <= 0) return res.status(400).json({ ok: false, error: "item_not_payable" });
      const invoiceId = crypto.randomUUID();
      const invoicePayload = buildInvoicePayload(invoiceId);
      const invoiceLink = await createInvoiceLink(deps.botToken, item, invoicePayload);
      const doc = { invoiceId, payload: invoicePayload, telegramId: req.telegramUser.id, telegramUser: req.telegramUser, itemId, itemTitle: item.title, amountStars: item.costStars, status: "pending", invoiceLink, createdAt: new Date(), updatedAt: new Date() };
      await deps.db.collection("stars_invoices").insertOne(doc);
      res.json({ ok: true, invoice: invoicePublic(doc), invoiceLink });
    } catch (error) {
      res.status(502).json({ ok: false, error: "invoice_create_failed", message: error.message || "" });
    }
  });

  app.get("/api/stars/invoice/:invoiceId", deps.requireTelegramUser, async (req, res) => {
    const invoice = await deps.db.collection("stars_invoices").findOne({ invoiceId: String(req.params.invoiceId || ""), telegramId: req.telegramUser.id });
    if (!invoice) return res.status(404).json({ ok: false, error: "invoice_not_found" });
    const save = invoice.status === "paid" ? await deps.getSave(req.telegramUser.id) : null;
    res.json({ ok: true, invoice: invoicePublic(invoice), save: save?.data ? { data: save.data, updatedAt: save.updatedAt || null } : null });
  });

  app.post("/api/telegram/webhook", async (req, res) => {
    if (webhookSecret && req.get("x-telegram-bot-api-secret-token") !== webhookSecret) return res.status(403).json({ ok: false, error: "bad_webhook_secret" });
    const update = isPlainObject(req.body) ? req.body : {};
    try {
      if (update.pre_checkout_query) await handlePreCheckout(deps, update.pre_checkout_query);
      if (update.message?.successful_payment) await handleSuccessfulPayment(deps, update.message);
      res.json({ ok: true });
    } catch (error) {
      console.error("Telegram webhook processing failed:", error);
      res.status(200).json({ ok: false });
    }
  });

  void ensureWebhook(deps.botToken, webhookUrl, webhookSecret);
}
