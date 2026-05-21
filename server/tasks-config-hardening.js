import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function patchServerIndexForTasksConfig() {
  const indexPath = join(dirname(fileURLToPath(import.meta.url)), 'index.js');
  let source = '';
  try {
    source = readFileSync(indexPath, 'utf8');
  } catch {
    return;
  }
  if (source.includes('/api/tasks/config')) return;

  const helper = [
    'function cleanTaskText(value, fallback = "") {',
    '  return String(value || fallback).replace(/[<>"\'`]/g, "").replace(/\\s+/g, " ").trim().slice(0, 160);',
    '}',
    'function cleanTaskReward(value) {',
    '  const raw = isPlainObject(value) ? value : {};',
    '  const reward = {};',
    '  const coins = safeInt(raw.coins, 0, 9999999);',
    '  const rp = safeInt(raw.rp, 0, 999999);',
    '  const stars = safeInt(raw.stars, 0, 999);',
    '  if (coins) reward.coins = coins;',
    '  if (rp) reward.rp = rp;',
    '  if (stars) reward.stars = stars;',
    '  return reward;',
    '}',
    'function cleanTaskConfigRow(row) {',
    '  const id = cleanTaskText(row?.id || row?.taskId || "", "").slice(0, 96);',
    '  const group = String(row?.group || row?.type || "").toLowerCase();',
    '  if (!id || !["daily", "studio"].includes(group)) return null;',
    '  return {',
    '    group,',
    '    id,',
    '    enabled: row.enabled !== false,',
    '    visible: row.visible !== false,',
    '    hidden: row.hidden === true,',
    '    status: cleanTaskText(row.status || "active", "active").slice(0, 24),',
    '    title: cleanTaskText(row.title || "", ""),',
    '    desc: cleanTaskText(row.desc || row.description || "", ""),',
    '    target: safeInt(row.target, 0, 999999999),',
    '    reward: cleanTaskReward(row.reward),',
    '    order: safeInt(row.order, 0, 9999),',
    '  };',
    '}',
    'async function loadTasksConfig() {',
    '  const rows = await db.collection("task_configs").find({}).limit(200).toArray();',
    '  const tasksConfig = { daily: {}, studio: {} };',
    '  for (const row of rows) {',
    '    const clean = cleanTaskConfigRow(row);',
    '    if (!clean) continue;',
    '    const { group, id, ...config } = clean;',
    '    tasksConfig[group][id] = config;',
    '  }',
    '  return tasksConfig;',
    '}',
    '',
  ].join('\n');

  let next = source.replace('async function syncEconomyFromIncomingSave', helper + 'async function syncEconomyFromIncomingSave');
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

  try {
    writeFileSync(indexPath, next);
  } catch (error) {
    console.warn('tasks-config-hardening: failed to patch index.js', error?.message || error);
  }
}

patchServerIndexForTasksConfig();
