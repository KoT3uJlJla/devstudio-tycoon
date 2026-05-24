const REFERRAL_QUALIFY_MIN_SCORE = Number(process.env.REFERRAL_QUALIFY_MIN_SCORE || 6.5);
const REFERRAL_CODE_MASK = 0x5f3759df9f4a7c15n;

function referralBase36ToBigInt(value) {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = 0n;
  for (const char of String(value || "").toLowerCase()) {
    const index = alphabet.indexOf(char);
    if (index < 0) return null;
    result = result * 36n + BigInt(index);
  }
  return result;
}

export function referralStartParamFromTelegramId(telegramId) {
  const raw = String(telegramId || "").replace(/\D/g, "");
  if (!raw) return "";
  try {
    return "r_" + ((BigInt(raw) ^ REFERRAL_CODE_MASK).toString(36));
  } catch {
    return "";
  }
}

export function referrerIdFromStartParam(startParam) {
  const raw = String(startParam || "").trim().slice(0, 64);
  if (!raw) return "";
  const compact = raw.replace(/^ref[_-]/i, "r_").replace(/^invite[_-]/i, "r_");
  if (/^u_\d{3,32}$/i.test(compact)) return compact.slice(2);
  if (/^id_\d{3,32}$/i.test(compact)) return compact.slice(3);
  if (/^\d{3,32}$/.test(compact)) return compact;
  const match = compact.match(/^r_([a-z0-9]{2,32})$/i);
  if (!match) return "";
  try {
    const mixed = referralBase36ToBigInt(match[1]);
    if (mixed === null) return "";
    const decoded = mixed ^ REFERRAL_CODE_MASK;
    return decoded > 0n ? decoded.toString(10) : "";
  } catch {
    return "";
  }
}

function bestReferralQualifyingScore(data) {
  const scores = [];
  const latest = Number(data?.latestRelease?.score);
  if (Number.isFinite(latest)) scores.push(latest);
  const best = Number(data?.bestScore);
  if (Number.isFinite(best)) scores.push(best);
  if (Array.isArray(data?.releaseHistory)) {
    for (const release of data.releaseHistory) {
      const score = Number(release?.score);
      if (Number.isFinite(score)) scores.push(score);
    }
  }
  return scores.length ? Math.max(...scores) : 0;
}

export async function ensureReferralIndexes(db) {
  await db.collection("referrals").createIndex({ invitedTelegramId: 1 }, { unique: true });
  await db.collection("referrals").createIndex({ referrerTelegramId: 1, status: 1 });
  await db.collection("referrals").createIndex({ secondLevelReferrerTelegramId: 1, status: 1 });
}

export async function ensureReferralForUser(db, telegramUser) {
  const invitedTelegramId = String(telegramUser?.id || "");
  if (!invitedTelegramId) return null;
  const referrerTelegramId = referrerIdFromStartParam(telegramUser?.startParam);
  if (!referrerTelegramId || referrerTelegramId === invitedTelegramId) return null;

  const existing = await db.collection("referrals").findOne({ invitedTelegramId });
  if (existing) return existing;

  const parentReferral = await db.collection("referrals").findOne({ invitedTelegramId: referrerTelegramId });
  const secondLevelReferrerTelegramId = parentReferral?.referrerTelegramId
    && parentReferral.referrerTelegramId !== invitedTelegramId
    && parentReferral.referrerTelegramId !== referrerTelegramId
    ? String(parentReferral.referrerTelegramId)
    : null;
  const now = new Date();
  const doc = {
    invitedTelegramId,
    invitedTelegramUser: telegramUser,
    referrerTelegramId,
    secondLevelReferrerTelegramId,
    startParam: String(telegramUser?.startParam || "").slice(0, 64),
    status: "pending",
    qualifyingScore: 0,
    qualifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.collection("referrals").insertOne(doc);
    return doc;
  } catch (error) {
    if (error?.code === 11000) return db.collection("referrals").findOne({ invitedTelegramId });
    throw error;
  }
}

async function ensureReferralEconomy(deps, telegramId) {
  const id = String(telegramId || "");
  if (!id) return null;
  return deps.getOrCreateEconomy({ id, firstName: "", username: "", photoUrl: "", startParam: "" }, null);
}

async function incrementReferralCounter(deps, telegramId, field, invitedTelegramId, score, tier) {
  const id = String(telegramId || "");
  if (!id) return;
  await ensureReferralEconomy(deps, id);
  await deps.patchEconomy(id, {
    $inc: { [field]: 1 },
    $push: {
      ledger: {
        $each: [deps.buildLedgerEntry("referral_qualified", 0, "referral:" + tier, { invitedTelegramId, qualifyingScore: score })],
        $slice: -80,
      },
    },
  });
}

export async function qualifyReferralIfEligible(deps, telegramUser, saveData, meta = {}) {
  const invitedTelegramId = String(telegramUser?.id || "");
  if (!invitedTelegramId) return deps.db.collection("economy").findOne({ telegramId: invitedTelegramId });
  await ensureReferralForUser(deps.db, telegramUser);
  const score = bestReferralQualifyingScore(saveData);
  if (score < REFERRAL_QUALIFY_MIN_SCORE) return deps.db.collection("economy").findOne({ telegramId: invitedTelegramId });

  const qualified = await deps.db.collection("referrals").findOneAndUpdate(
    { invitedTelegramId, status: "pending" },
    { $set: { status: "qualified", qualifyingScore: score, qualifiedAt: new Date(), updatedAt: new Date(), qualifyMeta: meta } },
    { returnDocument: "after" },
  );
  const referral = qualified?.value || qualified;
  if (!referral?.referrerTelegramId) return deps.db.collection("economy").findOne({ telegramId: invitedTelegramId });

  await incrementReferralCounter(deps, referral.referrerTelegramId, "qualifiedReferrals", invitedTelegramId, score, "direct");
  if (referral.secondLevelReferrerTelegramId) {
    await incrementReferralCounter(deps, referral.secondLevelReferrerTelegramId, "qualifiedSecondLevelReferrals", invitedTelegramId, score, "second");
  }
  return deps.db.collection("economy").findOne({ telegramId: invitedTelegramId });
}
