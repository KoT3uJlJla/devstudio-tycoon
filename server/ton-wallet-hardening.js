import Module from 'node:module';

function sanitizeTonAddress(value) {
  return String(value || '').trim().replace(/\s+/g, '');
}

function isValidTonAddress(value) {
  const address = sanitizeTonAddress(value);
  // Supports common user-friendly TON addresses and raw workchain:hash form.
  return /^(?:EQ|UQ)[A-Za-z0-9_-]{46}$/.test(address) || /^-?\d:[a-fA-F0-9]{64}$/.test(address);
}

function publicWalletEconomy(economy) {
  return {
    stars: Number.isFinite(Number(economy?.stars)) ? Math.max(0, Math.floor(Number(economy.stars))) : 0,
    qualifiedReferrals: Number.isFinite(Number(economy?.qualifiedReferrals)) ? Math.max(0, Math.floor(Number(economy.qualifiedReferrals))) : 0,
    qualifiedSecondLevelReferrals: Number.isFinite(Number(economy?.qualifiedSecondLevelReferrals)) ? Math.max(0, Math.floor(Number(economy.qualifiedSecondLevelReferrals))) : 0,
    referralMilestoneClaims: economy?.referralMilestoneClaims && typeof economy.referralMilestoneClaims === 'object' ? economy.referralMilestoneClaims : {},
    dailyClaimedAt: economy?.dailyClaimedAt || null,
    tonWalletAddress: typeof economy?.tonWalletAddress === 'string' ? economy.tonWalletAddress : '',
  };
}

function installTonWalletRoutes(app) {
  if (app.__devstudioTonWalletRoutesInstalled) return;
  app.__devstudioTonWalletRoutesInstalled = true;

  app.use('/api/economy/ton-wallet', async (req, res, next) => {
    try {
      if (!req.telegramUser?.id) return res.status(401).json({ ok: false, error: 'telegram_auth_failed' });
      const db = req.app?.locals?.db || globalThis.__devstudioDb;
      if (!db) return res.status(503).json({ ok: false, error: 'database_not_ready' });
      const economy = await db.collection('economy').findOne({ telegramId: req.telegramUser.id }) || {
        telegramId: req.telegramUser.id,
        telegramUser: req.telegramUser,
        stars: 0,
        qualifiedReferrals: 0,
        qualifiedSecondLevelReferrals: 0,
        referralMilestoneClaims: {},
        dailyClaimedAt: null,
        dailyTaskStarClaims: {},
        tutorialStarClaimed: false,
        prizeClaims: {},
        ledger: [],
        createdAt: new Date(),
      };

      if (req.method === 'GET') {
        return res.json({ ok: true, economy: publicWalletEconomy(economy) });
      }

      if (req.method === 'POST') {
        const address = sanitizeTonAddress(req.body?.address);
        if (!isValidTonAddress(address)) return res.status(400).json({ ok: false, error: 'invalid_ton_address', economy: publicWalletEconomy(economy) });
        await db.collection('economy').updateOne(
          { telegramId: req.telegramUser.id },
          { $set: { telegramId: req.telegramUser.id, telegramUser: req.telegramUser, tonWalletAddress: address, tonWalletUpdatedAt: new Date(), updatedAt: new Date() }, $setOnInsert: { stars: 0, qualifiedReferrals: 0, qualifiedSecondLevelReferrals: 0, referralMilestoneClaims: {}, dailyClaimedAt: null, dailyTaskStarClaims: {}, tutorialStarClaimed: false, prizeClaims: {}, ledger: [], createdAt: new Date() } },
          { upsert: true },
        );
        const nextEconomy = await db.collection('economy').findOne({ telegramId: req.telegramUser.id });
        return res.json({ ok: true, economy: publicWalletEconomy(nextEconomy) });
      }

      if (req.method === 'DELETE') {
        await db.collection('economy').updateOne({ telegramId: req.telegramUser.id }, { $unset: { tonWalletAddress: '', tonWalletUpdatedAt: '' }, $set: { updatedAt: new Date() } });
        const nextEconomy = await db.collection('economy').findOne({ telegramId: req.telegramUser.id });
        return res.json({ ok: true, economy: publicWalletEconomy(nextEconomy) });
      }

      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    } catch (error) {
      return res.status(500).json({ ok: false, error: 'ton_wallet_failed' });
    }
  });
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  const loaded = originalLoad.call(this, request, parent, isMain);
  if (request === 'mongodb' && loaded?.MongoClient && !loaded.MongoClient.__devstudioTonWalletPatched) {
    const OriginalMongoClient = loaded.MongoClient;
    class PatchedMongoClient extends OriginalMongoClient {
      db(...args) {
        const database = super.db(...args);
        globalThis.__devstudioDb = database;
        return database;
      }
    }
    Object.setPrototypeOf(PatchedMongoClient, OriginalMongoClient);
    Object.defineProperty(PatchedMongoClient, '__devstudioTonWalletPatched', { value: true });
    return { ...loaded, MongoClient: PatchedMongoClient };
  }
  if (request === 'express' && typeof loaded === 'function' && !loaded.__devstudioTonWalletPatched) {
    function wrappedExpress(...args) {
      const app = loaded(...args);
      const originalUse = app.use.bind(app);
      app.use = (...useArgs) => {
        const result = originalUse(...useArgs);
        installTonWalletRoutes(app);
        return result;
      };
      const originalGet = app.get.bind(app);
      app.get = (...getArgs) => {
        const result = originalGet(...getArgs);
        installTonWalletRoutes(app);
        return result;
      };
      return app;
    }
    Object.assign(wrappedExpress, loaded);
    Object.defineProperty(wrappedExpress, '__devstudioTonWalletPatched', { value: true });
    return wrappedExpress;
  }
  return loaded;
};
