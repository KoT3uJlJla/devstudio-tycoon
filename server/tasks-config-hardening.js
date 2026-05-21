import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const helperBlock = String.raw`
const DEFAULT_TASK_CONFIG_ROWS = [
  { group: "daily", id: "release", enabled: true, visible: true, hidden: false, status: "active", title: "Релизный спринт", desc: "Выпусти 3 игры за день.", target: 3, reward: { coins: 1800, rp: 12 }, order: 10 },
  { group: "daily", id: "work", enabled: true, visible: true, hidden: false, status: "active", title: "Продюсерская смена", desc: "Прими 2 решения во время разработки.", target: 2, reward: { coins: 1200, stars: 1 }, order: 20 },
  { group: "daily", id: "research", enabled: true, visible: true, hidden: false, status: "active", title: "День лаборатории", desc: "Открой 2 исследования, жанра или сеттинга.", target: 2, reward: { coins: 700, rp: 16 }, order: 30 },
  { group: "daily", id: "income", enabled: true, visible: true, hidden: false, status: "active", title: "Long-tail доход", desc: "Получи 2 500 монет пассивно от выпущенных игр.", target: 2500, reward: { coins: 1400 }, order: 40 },
  { group: "studio", id: "first-release", enabled: true, visible: true, hidden: false, status: "active", title: "Первый релиз", desc: "Выпусти первую игру студии.", target: 1, reward: { coins: 2000, rp: 5 }, order: 10 },
  { group: "studio", id: "score-7", enabled: true, visible: true, hidden: false, status: "active", title: "Крепкий релиз", desc: "Получи оценку 7.0 или выше.", target: 7, reward: { coins: 3500, rp: 10 }, order: 20 },
  { group: "studio", id: "coins-10000", enabled: true, visible: true, hidden: false, status: "active", title: "Финансовая подушка", desc: "Накопи 10 000 монет на балансе студии.", target: 10000, reward: { coins: 1500, rp: 6 }, order: 30 },
  { group: "studio", id: "studio-level-2", enabled: true, visible: true, hidden: false, status: "active", title: "Первое расширение", desc: "Улучши студию до 2 уровня.", target: 2, reward: { coins: 3000, rp: 10 }, order: 40 },
  { group: "studio", id: "first-employee", enabled: true, visible: true, hidden: false, status: "active", title: "Первый сотрудник", desc: "Найми первого человека в команду.", target: 1, reward: { coins: 2500, rp: 8 }, order: 50 },
  { group: "studio", id: "content-explorer", enabled: true, visible: true, hidden: false, status: "active", title: "Свежие идеи", desc: "Открой 3 новых жанра или сеттинга.", target: 3, reward: { coins: 4000, rp: 18 }, order: 60 },
  { group: "studio", id: "release-10", enabled: true, visible: true, hidden: false, status: "active", title: "Производственный ритм", desc: "Выпусти 10 игр за карьеру студии.", target: 10, reward: { coins: 9000, rp: 30 }, order: 70 },
  { group: "studio", id: "score-9", enabled: true, visible: true, hidden: false, status: "active", title: "Настоящий хит", desc: "Получи оценку 9.0 или выше.", target: 9, reward: { coins: 12000, rp: 45, stars: 1 }, order: 80 },
  { group: "studio", id: "product-instinct-active", enabled: true, visible: true, hidden: false, status: "active", title: "Работа по чутью", desc: "Активируй «Продуктовое чутьё».", target: 1, reward: { coins: 3000, rp: 12 }, order: 90 },
  { group: "studio", id: "studio-level-3", enabled: true, visible: true, hidden: false, status: "active", title: "Студия растёт", desc: "Улучши студию до 3 уровня.", target: 3, reward: { coins: 18000, rp: 60, stars: 2 }, order: 100 },
  { group: "studio", id: "release-50", enabled: true, visible: true, hidden: false, status: "active", title: "Каталог студии", desc: "Выпусти 50 игр за карьеру студии.", target: 50, reward: { coins: 50000, rp: 160, stars: 3 }, order: 110 },
];

function cleanTaskText(value, fallback = "") {
  return String(value || fallback).replace(/[<>"']/g, "").replace(/\u0060/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
}
function cleanTaskReward(value) {
  const raw = isPlainObject(value) ? value : {};
  const reward = {};
  const coins = safeInt(raw.coins, 0, 9999999);
  const rp = safeInt(raw.rp, 0, 999999);
  const stars = safeInt(raw.stars, 0, 999);
  if (coins) reward.coins = coins;
  if (rp) reward.rp = rp;
  if (stars) reward.stars = stars;
  return reward;
}
function cleanTaskConfigRow(row) {
  const id = cleanTaskText(row?.id || row?.taskId || "", "").slice(0, 96);
  const group = String(row?.group || row?.type || "").toLowerCase();
  if (!id || !["daily", "studio"].includes(group)) return null;
  return {
    group,
    id,
    enabled: row.enabled !== false,
    visible: row.visible !== false,
    hidden: row.hidden === true,
    status: cleanTaskText(row.status || "active", "active").slice(0, 24),
    title: cleanTaskText(row.title || "", ""),
    desc: cleanTaskText(row.desc || row.description || "", ""),
    target: safeInt(row.target, 0, 999999999),
    reward: cleanTaskReward(row.reward),
    order: safeInt(row.order, 0, 9999),
  };
}
async function ensureDefaultTaskConfigs() {
  const collection = db.collection("task_configs");
  await collection.createIndex({ group: 1, id: 1 }, { unique: true });
  const now = new Date();
  for (const row of DEFAULT_TASK_CONFIG_ROWS) {
    await collection.updateOne(
      { group: row.group, id: row.id },
      { $setOnInsert: { ...row, createdAt: now }, $set: { seededAt: now } },
      { upsert: true },
    );
  }
}
async function loadTasksConfig() {
  const rows = await db.collection("task_configs").find({}).limit(200).toArray();
  const tasksConfig = { daily: {}, studio: {} };
  for (const row of rows) {
    const clean = cleanTaskConfigRow(row);
    if (!clean) continue;
    const { group, id, ...config } = clean;
    tasksConfig[group][id] = config;
  }
  return tasksConfig;
}
`;

function patchServerIndexForTasksConfig() {
  const indexPath = join(dirname(fileURLToPath(import.meta.url)), 'index.js');
  let source = '';
  try {
    source = readFileSync(indexPath, 'utf8');
  } catch {
    return;
  }

  let next = source;

  if (!next.includes('DEFAULT_TASK_CONFIG_ROWS')) {
    next = next.replace('async function syncEconomyFromIncomingSave', helperBlock + '\nasync function syncEconomyFromIncomingSave');
  }

  if (!next.includes('await ensureDefaultTaskConfigs();')) {
    next = next.replace(
      '  await db.collection("stars_invoices").createIndex({ telegramId: 1, createdAt: -1 });',
      '  await db.collection("stars_invoices").createIndex({ telegramId: 1, createdAt: -1 });\n  await ensureDefaultTaskConfigs();',
    );
  }

  if (!next.includes('/api/tasks/config')) {
    next = next.replace(
      '  app.get("/api/me", requireTelegramUser, (req, res) => res.json({ ok: true, user: req.telegramUser }));',
      [
        '  app.get("/api/me", requireTelegramUser, (req, res) => res.json({ ok: true, user: req.telegramUser }));',
        '  app.get("/api/tasks/config", requireTelegramUser, async (req, res) => {',
        '    try {',
        '      res.json({ ok: true, tasksConfig: await loadTasksConfig() });',
        '    } catch (error) {',
        '      console.error("Tasks config failed:", error);',
        '      res.status(500).json({ ok: false, error: "tasks_config_failed" });',
        '    }',
        '  });',
      ].join('\n'),
    );
  }

  try {
    writeFileSync(indexPath, next);
  } catch (error) {
    console.warn('tasks-config-hardening: failed to patch index.js', error?.message || error);
  }
}

patchServerIndexForTasksConfig();
