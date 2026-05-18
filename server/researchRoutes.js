const GENRES = ['horror','racing','fighting','simulator','visual-novel','roguelike','deckbuilder','survival','metroidvania','sandbox','battle-royale','rhythm','party','idle','tower-defense','moba-lite','city-builder','detective-game','sports-manager','social-sim'];
const THEMES = ['detective','medieval','sport','postapoc','military','mythology','underwater','pirates','kaiju','dreams','office','food','music','ai-revolt','time-travel'];
const COST = {'market-analysis':22,'fast-prototype':24,'budget-ops':30,'pixel-polish':32,'community-posts':36,'pocket-play-sdk':40,'qa-checklist':42,'game-feel':48,'micro-influencers':52,'junior-pipeline':58,'producer-calendar':64,'service-model':72,'sound-lab':78,'liveops-lite':86,'game-station-sdk':96,'viral-hooks':104,'smart-game-sdk':116,'cross-platform-tools':128,'seasonal-pr':140,'ai-assisted-tools':155,'publisher-relations':170};
const REQ = {'pocket-play-sdk':'fast-prototype','game-station-sdk':'pocket-play-sdk'};

const obj = (v) => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const num = (v) => Number.isFinite(Number(v)) ? Math.floor(Number(v)) : 0;
const uniq = (v) => Array.from(new Set(Array.isArray(v) ? v.filter(Boolean).map(String) : []));
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function pub(e) {
  return {
    coins: num(e?.coins), rp: num(e?.rp), stars: num(e?.stars),
    qualifiedReferrals: num(e?.qualifiedReferrals),
    qualifiedSecondLevelReferrals: num(e?.qualifiedSecondLevelReferrals),
    referralMilestoneClaims: obj(e?.referralMilestoneClaims) ? e.referralMilestoneClaims : {},
    dailyClaimedAt: e?.dailyClaimedAt || null,
    lastRating: e?.lastRating || null,
  };
}
function overlay(data, economy) { return { ...(obj(data) ? data : {}), ...pub(economy) }; }
async function ensureEconomyWallet(deps, user, saveData) {
  let economy = await deps.getOrCreateEconomy(user, saveData);
  if (economy.walletAuthoritative !== true) {
    economy = await deps.patchEconomy(user.id, { $set: { walletAuthoritative: true, coins: Math.max(num(economy.coins), num(saveData?.coins)), rp: Math.max(num(economy.rp), num(saveData?.rp)) } });
  }
  return economy;
}
async function spendRp(deps, user, amount, saveData) {
  await ensureEconomyWallet(deps, user, saveData);
  return deps.db.collection('economy').findOneAndUpdate(
    { telegramId: user.id, rp: { $gte: amount } },
    { $inc: { rp: -amount }, $set: { walletAuthoritative: true, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
}

async function unlock(deps, req, res) {
  const save = await deps.getSave(req.telegramUser.id);
  const data = obj(save?.data) ? { ...save.data } : {};
  const researches = uniq(data.unlockedResearchIds);
  const genres = uniq(data.unlockedGenreIds);
  const themes = uniq(data.unlockedThemeIds);
  const action = String(req.body?.action || '');
  const nodeId = String(req.body?.nodeId || '');
  let cost = 0;
  let next = data;
  let result = {};

  if (action === 'random_genre') {
    const locked = GENRES.filter((id) => !genres.includes(id));
    if (!locked.length) return res.status(409).json({ ok: false, error: 'all_genres_unlocked' });
    const id = pick(locked);
    cost = 24;
    next = { ...data, unlockedGenreIds: [...genres, id], dailyResearchUnlocked: num(data.dailyResearchUnlocked) + 1 };
    result = { kind: 'genre', id };
  } else if (action === 'random_theme') {
    const locked = THEMES.filter((id) => !themes.includes(id));
    if (!locked.length) return res.status(409).json({ ok: false, error: 'all_themes_unlocked' });
    const id = pick(locked);
    cost = 22;
    next = { ...data, unlockedThemeIds: [...themes, id], dailyResearchUnlocked: num(data.dailyResearchUnlocked) + 1 };
    result = { kind: 'theme', id };
  } else if (action === 'node') {
    cost = COST[nodeId] || 0;
    if (!cost) return res.status(404).json({ ok: false, error: 'unknown_research_node' });
    if (researches.includes(nodeId)) return res.status(409).json({ ok: false, error: 'research_already_unlocked' });
    if (REQ[nodeId] && !researches.includes(REQ[nodeId])) return res.status(403).json({ ok: false, error: 'research_requirement_locked' });
    next = { ...data, unlockedResearchIds: [...researches, nodeId], dailyResearchUnlocked: num(data.dailyResearchUnlocked) + 1 };
    result = { kind: 'node', id: nodeId };
  } else {
    return res.status(400).json({ ok: false, error: 'unknown_research_action' });
  }

  const economy = await spendRp(deps, req.telegramUser, cost, data);
  if (!economy) return res.status(402).json({ ok: false, error: 'not_enough_rp' });
  const protectedData = overlay(next, economy);
  await deps.writeSave(req.telegramUser.id, req.telegramUser, protectedData);
  res.json({ ok: true, save: { data: protectedData, updatedAt: new Date() }, economy: pub(economy), research: result, cost });
}

export function registerResearchRoutes(app, deps) {
  app.post('/api/research/unlock', deps.requireTelegramUser, async (req, res) => {
    try { await unlock(deps, req, res); }
    catch (error) { console.error('Research unlock failed:', error); res.status(500).json({ ok: false, error: 'research_unlock_failed' }); }
  });
}
