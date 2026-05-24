function cleanTonWalletAddress(value) {
  return String(value || "").trim().replace(/\s+/g, "").slice(0, 128);
}

function publicTonWalletEconomy(economy) {
  return {
    stars: Math.max(0, Math.floor(Number(economy?.stars) || 0)),
    qualifiedReferrals: Math.max(0, Math.floor(Number(economy?.qualifiedReferrals) || 0)),
    qualifiedSecondLevelReferrals: Math.max(0, Math.floor(Number(economy?.qualifiedSecondLevelReferrals) || 0)),
    referralMilestoneClaims: economy?.referralMilestoneClaims && typeof economy.referralMilestoneClaims === "object" && !Array.isArray(economy.referralMilestoneClaims)
      ? economy.referralMilestoneClaims
      : {},
    dailyClaimedAt: economy?.dailyClaimedAt || null,
    lastRating: economy?.lastRating || null,
    tonWalletAddress: typeof economy?.tonWalletAddress === "string" ? economy.tonWalletAddress : "",
  };
}

function isValidTonWalletAddress(value) {
  return cleanTonWalletAddress(value).length > 0;
}

export function registerTonWalletRoutes(app, deps) {
  const { requireTelegramUser, getSave, getOrCreateEconomy, patchEconomy } = deps;

  app.get("/api/economy/ton-wallet", requireTelegramUser, async (req, res) => {
    const save = await getSave(req.telegramUser.id);
    const economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    res.json({ ok: true, economy: publicTonWalletEconomy(economy) });
  });

  app.post("/api/economy/ton-wallet", requireTelegramUser, async (req, res) => {
    const address = cleanTonWalletAddress(req.body?.address);
    if (!isValidTonWalletAddress(address)) return res.status(400).json({ ok: false, error: "empty_ton_wallet" });
    const save = await getSave(req.telegramUser.id);
    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    economy = await patchEconomy(economy.telegramId, { $set: { tonWalletAddress: address, tonWalletUpdatedAt: new Date() } });
    res.json({ ok: true, economy: publicTonWalletEconomy(economy) });
  });

  app.delete("/api/economy/ton-wallet", requireTelegramUser, async (req, res) => {
    const save = await getSave(req.telegramUser.id);
    let economy = await getOrCreateEconomy(req.telegramUser, save?.data);
    economy = await patchEconomy(economy.telegramId, { $unset: { tonWalletAddress: "", tonWalletUpdatedAt: "" } });
    res.json({ ok: true, economy: publicTonWalletEconomy(economy) });
  });
}
