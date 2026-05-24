import crypto from "crypto";

const REFERRAL_DIRECT_PURCHASE_SHARE = Number(process.env.REFERRAL_DIRECT_PURCHASE_SHARE || 0.10);
const REFERRAL_SECOND_PURCHASE_SHARE = Number(process.env.REFERRAL_SECOND_PURCHASE_SHARE || 0.03);

function safeInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.floor(Math.min(max, Math.max(min, parsed)));
}

function referralCommissionAmount(amountStars, rate) {
  const amount = safeInt(amountStars, 0, 100000);
  const safeRate = Number.isFinite(Number(rate)) ? Math.max(0, Number(rate)) : 0;
  return Math.floor(amount * safeRate);
}

async function ensureReferralEconomy(deps, telegramId) {
  const id = String(telegramId || "");
  if (!id) return null;
  return deps.getOrCreateEconomy({ id, firstName: "", username: "", photoUrl: "", startParam: "" }, null);
}

export async function ensureReferralCommissionIndexes(db) {
  await db.collection("referral_commissions").createIndex({ invoiceId: 1, tier: 1 }, { unique: true });
}

export async function grantReferralPurchaseCommissions(deps, invoice) {
  const referral = await deps.db.collection("referrals").findOne({ invitedTelegramId: invoice.telegramId, status: "qualified" });
  if (!referral?.referrerTelegramId) return;

  const tiers = [
    { tier: "direct", telegramId: referral.referrerTelegramId, amount: referralCommissionAmount(invoice.amountStars, REFERRAL_DIRECT_PURCHASE_SHARE) },
    { tier: "second", telegramId: referral.secondLevelReferrerTelegramId, amount: referralCommissionAmount(invoice.amountStars, REFERRAL_SECOND_PURCHASE_SHARE) },
  ].filter((item) => item.telegramId && item.amount > 0);

  for (const item of tiers) {
    try {
      const inserted = await deps.db.collection("referral_commissions").insertOne({
        invoiceId: invoice.invoiceId,
        tier: item.tier,
        telegramId: String(item.telegramId),
        invitedTelegramId: invoice.telegramId,
        amountStars: item.amount,
        sourceAmountStars: invoice.amountStars,
        itemId: invoice.itemId,
        createdAt: new Date(),
      });
      if (!inserted?.acknowledged) continue;
    } catch (error) {
      if (error?.code === 11000) continue;
      throw error;
    }

    await ensureReferralEconomy(deps, item.telegramId);
    await deps.patchEconomy(String(item.telegramId), {
      $inc: { stars: item.amount },
      $push: {
        ledger: {
          $each: [{
            id: crypto.randomUUID(),
            kind: "referral_purchase",
            amount: item.amount,
            reason: "referral:" + item.tier + ":purchase",
            meta: { invoiceId: invoice.invoiceId, invitedTelegramId: invoice.telegramId, itemId: invoice.itemId, sourceAmountStars: invoice.amountStars },
            createdAt: new Date(),
          }],
          $slice: -80,
        },
      },
    });
  }
}
