import crypto from "crypto";

const EXTRA_GENRE_IDS = ["horror", "racing", "fighting", "simulator", "visual-novel", "roguelike", "deckbuilder", "survival", "metroidvania", "sandbox", "battle-royale", "rhythm", "party", "idle", "tower-defense", "moba-lite", "city-builder", "detective-game", "sports-manager", "social-sim"];
const EXTRA_THEME_IDS = ["detective", "medieval", "sport", "postapoc", "military", "mythology", "underwater", "pirates", "kaiju", "dreams", "office", "food", "music", "ai-revolt", "time-travel"];
const RESEARCH_NODE_COSTS = {
  "market-analysis": 22,
  "fast-prototype": 24,
  "budget-ops": 30,
  "pixel-polish": 32,
  "community-posts": 36,
  "pocket-play-sdk": 40,
  "qa-checklist": 42,
  "game-feel": 48,
  "micro-influencers": 52,
  "junior-pipeline": 58,
  "producer-calendar": 64,
  "service-model": 72,
  "sound-lab": 78,
  "liveops-lite": 86,
  "game-station-sdk": 96,
  "viral-hooks": 104,
  "smart-game-sdk": 116,
  "cross-platform-tools": 128,
  "seasonal-pr": 140,
  "ai-assisted-tools": 155,
  "publisher-relations": 170,
};
const RESEARCH_REQUIRES = { "pocket-play-sdk": "fast-prototype", "game-station-sdk": "pocket-play-sdk" };

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.floor(Math.min(max, Math.max(min, parsed)));
}

function uniqueStrings(values) {
  return Array.from(new Set(Array.isArray(values) ? values.filter(Boolean).map(String) : []));
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

function publicWalletEconomy(economy) {
  return {
    coins: safeInt(economy?.coins, 0, 999999999),
    rp: safeInt(economy?.rp, 0, 999999999),
    stars: safeInt(economy?.stars, 0, 9999999),
    qualifiedReferrals: safeInt(economy?.qualifiedReferrals, 0, 999999),
    qualifiedSecondLevelReferrals: safeInt(economy?.qualifiedSecondLevelReferrals, 0, 999999),
    referralMilestoneClaims: isPlainObject(economy?.referralMilestoneClaims) ? economy.referralMilestoneClaims : {},
    dailyClaimedAt: economy?.dailyClaimedAt || null,
    lastRating: economy?.lastRating || null,
  };
}

function overlayWallet(data, economy) {
  const wallet = publicWalletEconomy(economy);
  return {
    ...(isPlainObject(data) ? data : {}),
    coins: wallet.coins,
    rp: wallet.rp,
    stars: wallet.stars,
    qualifiedReferrals: wallet.qualifiedReferrals,
    qualifiedSecondLevelReferrals: wallet.qualifiedSecondLevelReferrals,
    referralMilestoneClaims: wallet.referralMilestoneClaims,
    dailyClaimedAt: wallet.dailyClaimedAt,
  };
}

async function ensureAuthoritativeWallet(deps, telegramUser, saveData = null) {
  const telegramId = telegramUser.id;
  const save = saveData ? { data: saveData } : await deps.getSave(telegramId);
  let economy = await deps.getOrCreateEconomy(telegramUser, save?.data);

  const saveObject = isPlainObject(save?.data) ? save.data : {};
  const alreadyAuthoritative = economy?.walletAuthoritative === true;

  const nextCoins = alreadyAuthoritative
    ? safeInt(saveObject.coins, safeInt(economy?.coins, 0), 999999999)
    : Math.max(safeInt(saveObject.coins, 0), safeInt(economy?.coins, 0));
  const nextRp = alreadyAuthoritative
    ? safeInt(saveObject.rp, safeInt(economy?.rp, 0), 999999999)
    : Math.max(safeInt(saveObject.rp, 0), safeInt(economy?.rp, 0));

  const setPatch = { walletAuthoritative: true, coins: nextCoins, rp: nextRp };
  if (!isPlainObject(economy?.paidInvoiceClaims)) setPatch.paidInvoiceClaims = economy?.paidInvoiceClaims || {};

  economy = await deps.patchEconomy(telegramId, { $set: setPatch });

  const protectedData = overlayWallet(saveObject, economy);
  if (save?.data) await deps.writeSave(telegramId, telegramUser, protectedData);
  return {
    data: protectedData,
    economy,
    diagnostics: {
      saveCoins: safeInt(saveObject.coins, 0),
      saveRp: safeInt(saveObject.rp, 0),
      economyCoins: safeInt(economy?.coins, 0),
      economyRp: safeInt(economy?.rp, 0),
      walletAuthoritative: economy?.walletAuthoritative === true,
    },
  };
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

function invoiceClaim(data, invoiceId) {
  return isPlainObject(data?.paidInvoiceClaims) && isPlainObject(data.paidInvoiceClaims[invoiceId])
    ? data.paidInvoiceClaims[invoiceId]
    : null;
}

function markInvoiceApplied(data, invoice, reward) {
  const next = isPlainObject(data) ? { ...data } : {};
  next.paidInvoiceClaims = {
    ...(isPlainObject(next.paidInvoiceClaims) ? next.paidInvoiceClaims : {}),
    [invoice.invoiceId]: {
      itemId: invoice.itemId,
      amountStars: invoice.amountStars,
      coinsAfter: safeInt(next.coins, -50000),
      rpAfter: safeInt(next.rp, 0),
      appliedAt: Date.now(),
    },
  };
  next.lastSavedAt = Date.now();
  return next;
}

async function applyInvoiceRewardIfNeeded(deps, invoice) {
  const item = deps.SHOP_ITEMS[invoice.itemId];
  if (!item) return null;
  const save = await deps.getSave(invoice.telegramId);
  const currentData = save?.data || {};
  const claim = invoiceClaim(currentData, invoice.invoiceId);
  if (claim) return (await ensureAuthoritativeWallet(deps, invoice.telegramUser, currentData)).data;

  const economy = await deps.getOrCreateEconomy(invoice.telegramUser, currentData);
  const rewarded = deps.applyRewardToSaveData(currentData, item.reward || {});
  const marked = markInvoiceApplied(rewarded, invoice, item.reward || {});
  const nextData = deps.overlayProtectedEconomy(marked, economy);
  await deps.writeSave(invoice.telegramId, invoice.telegramUser, nextData);
  await deps.db.collection("stars_invoices").updateOne(
    { invoiceId: invoice.invoiceId },
    { $set: { appliedRewardAt: new Date(), updatedAt: new Date() } },
  );
  return (await ensureAuthoritativeWallet(deps, invoice.telegramUser, nextData)).data;
}

export async function reconcilePaidInvoiceRewards(deps, telegramUser) {
  const invoices = await deps.db.collection("stars_invoices")
    .find({ telegramId: telegramUser.id, status: "paid" })
    .sort({ paidAt: 1, createdAt: 1 })
    .limit(200)
    .toArray();

  let latestData = null;
  for (const invoice of invoices) {
    const data = await applyInvoiceRewardIfNeeded(deps, invoice);
    if (data) latestData = data;
  }

  return (await ensureAuthoritativeWallet(deps, telegramUser, latestData)).data;
}

async function applyPaidInvoice(deps, invoice, payment) {
  const item = deps.SHOP_ITEMS[invoice.itemId];
  if (!item) return null;
  const nextData = await applyInvoiceRewardIfNeeded(deps, invoice);
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

async function spendResearchRp(deps, telegramUser, amount, reason, meta) {
  await ensureAuthoritativeWallet(deps, telegramUser);
  return deps.db.collection("economy").findOneAndUpdate(
    { telegramId: telegramUser.id, rp: { $gte: amount } },
    {
      $inc: { rp: -amount },
      $set: { walletAuthoritative: true, updatedAt: new Date() },
      $push: { ledger: { $each: [{ id: crypto.randomUUID(), kind: "rp_spend", amount: -amount, reason, meta, createdAt: new Date() }], $slice: -100 } },
    },
    { returnDocument: "after" },
  );
}

async function handleResearchUnlock(deps, req, res) {
  const action = String(req.body?.action || "");
  const nodeId = String(req.body?.nodeId || "");
  const save = await deps.getSave(req.telegramUser.id);
  const ensured = await ensureAuthoritativeWallet(deps, req.telegramUser, save?.data || {});
  const data = isPlainObject(ensured.data) ? { ...ensured.data } : {};
  const researchIds = uniqueStrings(data.unlockedResearchIds);
  const genreIds = uniqueStrings(data.unlockedGenreIds);
  const themeIds = uniqueStrings(data.unlockedThemeIds);
  let cost = 0;
  let nextData = data;
  let result = {};

  if (action === "random_genre") {
    const locked = EXTRA_GENRE_IDS.filter((id) => !genreIds.includes(id));
    if (!locked.length) return res.status(409).json({ ok: false, error: "all_genres_unlocked" });
    const id = locked[crypto.randomInt(0, locked.length)];
    cost = 24;
    nextData = { ...data, unlockedGenreIds: [...genreIds, id], dailyResearchUnlocked: safeInt(data.dailyResearchUnlocked, 0) + 1 };
    result = { kind: "genre", id };
  } else if (action === "random_theme") {
    const locked = EXTRA_THEME_IDS.filter((id) => !themeIds.includes(id));
    if (!locked.length) return res.status(409).json({ ok: false, error: "all_themes_unlocked" });
    const id = locked[crypto.randomInt(0, locked.length)];
    cost = 22;
    nextData = { ...data, unlockedThemeIds: [...themeIds, id], dailyResearchUnlocked: safeInt(data.dailyResearchUnlocked, 0) + 1 };
    result = { kind: "theme", id };
  } else if (action === "node") {
    cost = RESEARCH_NODE_COSTS[nodeId] || 0;
    if (!cost) return res.status(404).json({ ok: false, error: "unknown_research_node" });
    if (researchIds.includes(nodeId)) return res.status(409).json({ ok: false, error: "research_already_unlocked" });
    const required = RESEARCH_REQUIRES[nodeId];
    if (required && !researchIds.includes(required)) return res.status(403).json({ ok: false, error: "research_requirement_locked" });
    nextData = { ...data, unlockedResearchIds: [...researchIds, nodeId], dailyResearchUnlocked: safeInt(data.dailyResearchUnlocked, 0) + 1 };
    result = { kind: "node", id: nodeId };
  } else {
    return res.status(400).json({ ok: false, error: "unknown_research_action" });
  }

  const economy = await spendResearchRp(deps, req.telegramUser, cost, `research:${action}`, result);
  if (!economy) {
    const current = await ensureAuthoritativeWallet(deps, req.telegramUser, data);
    return res.status(402).json({ ok: false, error: "not_enough_rp", economy: publicWalletEconomy(current.economy) });
  }

  const protectedData = overlayWallet(nextData, economy);
  await deps.writeSave(req.telegramUser.id, req.telegramUser, protectedData);
  res.json({ ok: true, save: { data: protectedData, updatedAt: new Date() }, economy: publicWalletEconomy(economy), research: result, cost });
}

async function walletStateResponse(deps, telegramUser) {
  const { data, economy, diagnostics } = await ensureAuthoritativeWallet(deps, telegramUser);
  return {
    ok: true,
    save: data ? { data, updatedAt: new Date() } : null,
    economy: publicWalletEconomy(economy),
    diagnostics,
  };
}

export function registerStarsPaymentRoutes(app, deps) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || "";

  app.get("/api/wallet/state", deps.requireTelegramUser, async (req, res) => {
    try {
      res.json(await walletStateResponse(deps, req.telegramUser));
    } catch (error) {
      console.error("Wallet state failed:", error);
      res.status(500).json({ ok: false, error: "wallet_state_failed" });
    }
  });

  app.get("/api/debug/wallet", deps.requireTelegramUser, async (req, res) => {
    try {
      res.json(await walletStateResponse(deps, req.telegramUser));
    } catch (error) {
      res.status(500).json({ ok: false, error: "wallet_debug_failed", message: error.message || "" });
    }
  });

  app.post("/api/research/unlock", deps.requireTelegramUser, async (req, res) => {
    try {
      await handleResearchUnlock(deps, req, res);
    } catch (error) {
      console.error("Research unlock failed:", error);
      res.status(500).json({ ok: false, error: "research_unlock_failed" });
    }
  });

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

  app.get("/api/stars/reconcile", deps.requireTelegramUser, async (req, res) => {
    try {
      const data = await reconcilePaidInvoiceRewards(deps, req.telegramUser);
      const { economy, diagnostics } = await ensureAuthoritativeWallet(deps, req.telegramUser, data);
      res.json({ ok: true, save: data ? { data: overlayWallet(data, economy), updatedAt: new Date() } : null, economy: publicWalletEconomy(economy), diagnostics });
    } catch (error) {
      console.error("Stars reconcile failed:", error);
      res.status(500).json({ ok: false, error: "stars_reconcile_failed" });
    }
  });

  app.get("/api/stars/invoice/:invoiceId", deps.requireTelegramUser, async (req, res) => {
    const invoice = await deps.db.collection("stars_invoices").findOne({ invoiceId: String(req.params.invoiceId || ""), telegramId: req.telegramUser.id });
    if (!invoice) return res.status(404).json({ ok: false, error: "invoice_not_found" });
    const fixedData = invoice.status === "paid" ? await applyInvoiceRewardIfNeeded(deps, invoice) : null;
    const save = fixedData ? { data: fixedData, updatedAt: new Date() } : invoice.status === "paid" ? await deps.getSave(req.telegramUser.id) : null;
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
