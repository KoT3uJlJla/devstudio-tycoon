import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const helperBlock = String.raw`
const GAME_DAY_MS = 72_000;
const MIN_COINS = -50_000;
const MAX_ECONOMY_OFFLINE_DAYS = Number(process.env.ECONOMY_SERVER_MAX_OFFLINE_DAYS || 45);

function estimateServerWeeklyExpenses(data) {
  const level = safeInt(data?.level, 1, 4);
  const employees = safeArray(data?.employees);
  const activeGames = safeArray(data?.activeGames);
  const rent = 300 + level * 55 + Math.max(0, employees.length - 1) * 65;
  const team = employees.reduce((sum, employee) => {
    const cost = safeInt(employee?.cost, 0, 10000000);
    const employeeLevel = safeInt(employee?.level, 1, 99);
    const scorePremium = Math.max(0, Number(employee?.scoreBoost) || 0) * 8200;
    const sciencePremium = Math.max(0, Number(employee?.scienceBoost) || 0) * 1350;
    const tradeoffDiscount = Math.max(0, -(Number(employee?.speedBoost) || 0)) * 650;
    return sum + Math.round(cost * 0.045 + employeeLevel * 35 + scorePremium + sciencePremium - tradeoffDiscount);
  }, 0);
  const infrastructure = 80 + activeGames.length * 22 + (researchHas(data, 'engine-v2') ? 110 : 0) + (researchHas(data, 'ai-assist') ? 90 : 0);
  return Math.max(0, Math.round(rent + team + infrastructure));
}

function serverLedgerEntry(day, title, amount, kind) {
  return { id: 'server-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8), day, title, amount, kind };
}

function advanceServerEconomy(data) {
  if (!isPlainObject(data)) return data;
  const lastGameTickAt = Number(data.lastGameTickAt) || Date.now();
  const elapsed = Math.max(0, Date.now() - lastGameTickAt);
  const days = Math.min(MAX_ECONOMY_OFFLINE_DAYS, Math.floor(elapsed / GAME_DAY_MS));
  if (days <= 0) return data;

  let coins = safeInt(data.coins, MIN_COINS, Number.MAX_SAFE_INTEGER);
  let gameDay = safeInt(data.gameDay, 1, 999999999);
  let dailyPassiveIncome = safeInt(data.dailyPassiveIncome, 0, Number.MAX_SAFE_INTEGER);
  let weeklyExpenseTotal = safeInt(data.weeklyExpenseTotal, 0, Number.MAX_SAFE_INTEGER);
  let activeGames = sanitizeActiveGames(data.activeGames).map((game) => ({ ...game }));
  let lastLedger = sanitizeLedger(data.lastLedger);

  for (let index = 0; index < days; index += 1) {
    gameDay += 1;
    activeGames = activeGames.map((game) => {
      if (game.lifeDaysRemaining <= 0) return game;
      const earned = Math.max(0, Math.round(safeInt(game.baseDailyIncome, 0, 1000000) * clampNumber(game.popularity, 0.14, 2.6)));
      coins = Math.min(Number.MAX_SAFE_INTEGER, Math.max(MIN_COINS, coins + earned));
      dailyPassiveIncome += earned;
      return {
        ...game,
        totalEarned: safeInt(game.totalEarned, 0, Number.MAX_SAFE_INTEGER) + earned,
        lifeDaysRemaining: Math.max(0, safeInt(game.lifeDaysRemaining, 0, 30) - 1),
      };
    }).filter((game) => game.lifeDaysRemaining > 0);

    if (gameDay % 7 === 0) {
      const expenses = estimateServerWeeklyExpenses({ ...data, gameDay, activeGames, coins });
      coins = Math.min(Number.MAX_SAFE_INTEGER, Math.max(MIN_COINS, coins - expenses));
      weeklyExpenseTotal = expenses;
      lastLedger = [...lastLedger, serverLedgerEntry(gameDay, 'Аренда + команда + инфраструктура', -expenses, 'expense')].slice(-10);
    }
  }

  return {
    ...data,
    coins,
    gameDay,
    activeGames,
    dailyPassiveIncome,
    weeklyExpenseTotal,
    lastLedger,
    lastGameTickAt: lastGameTickAt + days * GAME_DAY_MS,
    lastSavedAt: Date.now(),
  };
}
`;

function patchDevAuthorityForEconomyClock() {
  const filePath = join(dirname(fileURLToPath(import.meta.url)), 'devAuthority.js');
  let source = '';
  try {
    source = readFileSync(filePath, 'utf8');
  } catch {
    return;
  }
  let next = source;

  if (!next.includes('function advanceServerEconomy')) {
    next = next.replace('export function normalizeServerDevelopment', helperBlock + '\nexport function normalizeServerDevelopment');
  }

  if (!next.includes('const economyAdvancedData = advanceServerEconomy(data);')) {
    next = next.replace(
      'export function normalizeServerDevelopment(data, previousData = null) {\n  if (!isPlainObject(data)) return data;\n  const baseData = sanitizePersistentCollections(data);',
      'export function normalizeServerDevelopment(data, previousData = null) {\n  if (!isPlainObject(data)) return data;\n  const economyAdvancedData = advanceServerEconomy(data);\n  const baseData = sanitizePersistentCollections(economyAdvancedData);',
    );
  }

  try {
    writeFileSync(filePath, next);
  } catch (error) {
    console.warn('economy-clock-hardening: failed to patch devAuthority.js', error?.message || error);
  }
}

patchDevAuthorityForEconomyClock();
