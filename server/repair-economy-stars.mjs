import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const dryRun = process.env.REPAIR_DRY_RUN === '1';
const telegramId = process.env.REPAIR_TELEGRAM_ID ? String(process.env.REPAIR_TELEGRAM_ID) : '';
const client = new MongoClient(mongoUri);

function toSafeInt(value, min = 0, max = 9999999) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function main() {
  await client.connect();
  const db = client.db('devstudio_tycoon');
  const filter = telegramId ? { telegramId } : {};
  const economyRows = await db.collection('economy').find(filter).toArray();
  console.log(`Found economy rows: ${economyRows.length}${telegramId ? ` for ${telegramId}` : ''}`);

  let checked = 0;
  let changed = 0;
  for (const economy of economyRows) {
    checked += 1;
    const save = await db.collection('saves').findOne({ telegramId: economy.telegramId });
    const saveData = plainObject(save?.data) ? save.data : {};

    const currentStars = toSafeInt(economy.stars);
    const saveStars = toSafeInt(saveData.stars);
    const nextStars = Math.max(currentStars, saveStars);

    const set = {};
    if (economy.stars !== currentStars || currentStars !== nextStars) set.stars = nextStars;
    if (economy.qualifiedReferrals !== toSafeInt(economy.qualifiedReferrals, 0, 999999)) set.qualifiedReferrals = toSafeInt(economy.qualifiedReferrals, 0, 999999);
    if (economy.qualifiedSecondLevelReferrals !== toSafeInt(economy.qualifiedSecondLevelReferrals, 0, 999999)) set.qualifiedSecondLevelReferrals = toSafeInt(economy.qualifiedSecondLevelReferrals, 0, 999999);
    if (!plainObject(economy.referralMilestoneClaims)) set.referralMilestoneClaims = plainObject(saveData.referralMilestoneClaims) ? saveData.referralMilestoneClaims : {};
    if (!('migratedFromSave' in economy) && save) set.migratedFromSave = true;

    if (!Object.keys(set).length) {
      console.log(`OK ${economy.telegramId}: stars=${currentStars} (${typeof economy.stars})`);
      continue;
    }

    changed += 1;
    console.log(`${dryRun ? 'DRY ' : ''}REPAIR ${economy.telegramId}: economy.stars=${economy.stars} (${typeof economy.stars}), save.stars=${saveData.stars} (${typeof saveData.stars}), next=${nextStars}`);
    if (!dryRun) {
      await db.collection('economy').updateOne(
        { telegramId: economy.telegramId },
        {
          $set: { ...set, updatedAt: new Date() },
          $push: {
            ledger: {
              $each: [{ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, kind: 'economy_repair', amount: 0, reason: 'normalize_stars_type', meta: { previousStars: economy.stars, saveStars }, createdAt: new Date() }],
              $slice: -80,
            },
          },
        },
      );
    }
  }

  console.log(`Checked: ${checked}; changed: ${changed}; dryRun=${dryRun}`);
}

main()
  .catch((error) => {
    console.error('Repair failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
