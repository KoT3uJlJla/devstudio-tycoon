import Module from 'node:module';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://devstudio-tycoon-stat.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const API_RATE_LIMIT_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000);
const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX || 180);
const INVOICE_RATE_LIMIT_MAX = Number(process.env.INVOICE_RATE_LIMIT_MAX || 12);
const SAVE_RATE_LIMIT_MAX = Number(process.env.SAVE_RATE_LIMIT_MAX || 60);
const MAX_JSON_DEPTH = Number(process.env.MAX_JSON_DEPTH || 18);
const MAX_JSON_KEYS = Number(process.env.MAX_JSON_KEYS || 4500);
const MAX_INIT_FUTURE_SKEW_SECONDS = Number(process.env.MAX_INIT_FUTURE_SKEW_SECONDS || 300);

if (!process.env.MAX_INIT_DATA_AGE_SECONDS) {
  process.env.MAX_INIT_DATA_AGE_SECONDS = '86400';
}

const maxInitDataAgeSeconds = Number(process.env.MAX_INIT_DATA_AGE_SECONDS || 86400);
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(',');
const allowedOrigins = new Set(
  rawAllowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const require = createRequire(import.meta.url);
const originalCors = require('cors');
const originalExpress = require('express');
const originalExpressJson = originalExpress.json.bind(originalExpress);
const rateBuckets = new Map();
const requestQueues = new Map();

function patchServerIndexForDevelopmentInvoices() {
  const indexPath = join(dirname(fileURLToPath(import.meta.url)), 'index.js');
  let source = '';
  try {
    source = readFileSync(indexPath, 'utf8');
  } catch {
    return;
  }
  if (source.includes('consumeDevelopmentInvoice')) return;

  const next = source.replace(
    /async function spendActionStars\(req, res, action, amount\) \{[\s\S]*?\n\}\nasync function runDevelopmentAction/,
    `function developmentInvoiceItemId(action) {
  if (action === "skip") return "time_skip";
  if (action === "promote") return "promotion";
  return "";
}
async function consumeDevelopmentInvoice(req, action, amount) {
  const invoiceId = sanitizeText(req.body?.invoiceId || "", "");
  const itemId = developmentInvoiceItemId(action);
  if (!invoiceId || !itemId) return false;
  const consumed = await db.collection("stars_invoices").findOneAndUpdate(
    {
      invoiceId,
      telegramId: req.telegramUser.id,
      itemId,
      amountStars: safeInt(amount, 1, 100000),
      status: "paid",
      actionConsumedAt: { $exists: false },
    },
    { $set: { actionConsumedAt: new Date(), actionConsumedFor: \\`development:\\${action}\\`, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!consumed) return false;
  await patchEconomy(req.telegramUser.id, {
    $push: { ledger: { $each: [buildLedgerEntry("telegram_stars_action", -safeInt(amount, 1, 100000), \\`development:\\${action}\\`, { action, invoiceId, itemId })], $slice: -80 } },
  });
  return true;
}
async function spendActionStars(req, res, action, amount) {
  const save = await getSave(req.telegramUser.id);
  const economy = await getOrCreateEconomy(req.telegramUser, save?.data);
  const updated = await spendStars(economy, amount, \\`development:\\${action}\\`, { action });
  if (updated) return { save, economy: updated };
  if (await consumeDevelopmentInvoice(req, action, amount)) {
    const refreshedEconomy = await getOrCreateEconomy(req.telegramUser, save?.data);
    return { save, economy: refreshedEconomy };
  }
  res.status(402).json({ ok: false, error: "not_enough_stars", economy: publicEconomy(economy) });
  return null;
}
async function runDevelopmentAction`
  );

  if (next === source) {
    console.warn('server-hardening: development invoice patch was not applied');
    return;
  }
  try {
    writeFileSync(indexPath, next);
  } catch (error) {
    console.warn('server-hardening: failed to write development invoice patch', error?.message || error);
  }
}

patchServerIndexForDevelopmentInvoices();

function stableHash(value) {
  return createHash('sha256').update(String(value || '')).digest('hex').slice(0, 24);
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function rateLimitForPath(req) {
  if (req.method === 'OPTIONS' || req.path === '/health') return null;
  if (req.path === '/api/stars/invoice' && req.method === 'POST') return INVOICE_RATE_LIMIT_MAX;
  if (req.path === '/api/save' && req.method === 'POST') return SAVE_RATE_LIMIT_MAX;
  if (req.path.startsWith('/api/')) return API_RATE_LIMIT_MAX;
  return null;
}

function rateLimitMiddleware(req, res, next) {
  const limit = rateLimitForPath(req);
  if (!limit) return next();

  const now = Date.now();
  const identity = req.get('authorization') || req.get('x-telegram-init-data') || clientIp(req);
  const key = `${req.method}:${req.path}:${stableHash(identity)}`;
  const current = rateBuckets.get(key);
  const bucket = current && current.resetAt > now ? current : { count: 0, resetAt: now + API_RATE_LIMIT_WINDOW_MS };
  bucket.count += 1;
  rateBuckets.set(key, bucket);

  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > limit) {
    return res.status(429).json({ ok: false, error: 'rate_limited' });
  }
  return next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}, Math.max(30_000, API_RATE_LIMIT_WINDOW_MS)).unref?.();

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  }
  next();
}

function authDateFromRequest(req) {
  const auth = req.get('authorization') || '';
  const initData = auth.startsWith('tma ') ? auth.slice(4) : req.get('x-telegram-init-data');
  if (!initData || typeof initData !== 'string') return null;
  try {
    const params = new URLSearchParams(initData);
    return Number(params.get('auth_date') || 0) || null;
  } catch {
    return null;
  }
}

function initDataFreshnessGuard(req, res, next) {
  if (!req.path.startsWith('/api/') || req.path === '/api/telegram/webhook') return next();
  const authDate = authDateFromRequest(req);
  if (!authDate) return next();
  const now = Math.floor(Date.now() / 1000);
  if (authDate - now > MAX_INIT_FUTURE_SKEW_SECONDS) {
    return res.status(401).json({ ok: false, error: 'future_init_data' });
  }
  if (now - authDate > maxInitDataAgeSeconds) {
    return res.status(401).json({ ok: false, error: 'expired_init_data' });
  }
  return next();
}

function webhookSecretGuard(req, res, next) {
  if (req.method !== 'POST' || req.path !== '/api/telegram/webhook') return next();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
  if (!secret) return res.status(503).json({ ok: false, error: 'webhook_secret_required' });
  if (req.get('x-telegram-bot-api-secret-token') !== secret) {
    return res.status(403).json({ ok: false, error: 'bad_webhook_secret' });
  }
  return next();
}

function debugRouteGuard(req, res, next) {
  if (req.path !== '/api/debug/wallet') return next();
  if (process.env.DEBUG_WALLET_ENABLED === '1') return next();
  return res.status(404).json({ ok: false, error: 'not_found' });
}

function isDangerousKey(key) {
  return key === '__proto__' || key === 'prototype' || key === 'constructor' || key.startsWith('$') || key.includes('.');
}

function hasDangerousKeys(value, depth = 0, budget = { keys: 0 }) {
  if (!value || typeof value !== 'object') return false;
  if (depth > MAX_JSON_DEPTH) return true;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasDangerousKeys(item, depth + 1, budget)) return true;
    }
    return false;
  }
  for (const key of Object.keys(value)) {
    budget.keys += 1;
    if (budget.keys > MAX_JSON_KEYS || isDangerousKey(key)) return true;
    if (hasDangerousKeys(value[key], depth + 1, budget)) return true;
  }
  return false;
}

function extractInvoiceIdFromPayload(payload) {
  const value = String(payload || '');
  return value.startsWith('ds_shop:') ? value.slice('ds_shop:'.length) : '';
}

function queueKeyForRequest(req) {
  if (!req.path.startsWith('/api/')) return null;
  if (req.method === 'OPTIONS' || req.path === '/health') return null;

  const invoiceStatusMatch = req.method === 'GET' && req.path.match(/^\/api\/stars\/invoice\/([^/]+)$/);
  if (invoiceStatusMatch) return `invoice:${invoiceStatusMatch[1]}`;

  if (req.path === '/api/telegram/webhook') {
    const invoiceId = extractInvoiceIdFromPayload(req.body?.pre_checkout_query?.invoice_payload || req.body?.message?.successful_payment?.invoice_payload);
    return invoiceId ? `invoice:${invoiceId}` : `webhook:${stableHash(clientIp(req))}`;
  }

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE' || req.path === '/api/stars/reconcile') {
    const identity = req.get('authorization') || req.get('x-telegram-init-data') || clientIp(req);
    return `user:${stableHash(identity)}`;
  }

  return null;
}

function serializeSensitiveRequests(req, res, next) {
  const key = queueKeyForRequest(req);
  if (!key) return next();
  if (req.__devstudioSerialized) return next();
  req.__devstudioSerialized = true;

  const previous = requestQueues.get(key) || Promise.resolve();
  let release;
  let released = false;
  const current = previous.catch(() => undefined).then(() => new Promise((resolve) => {
    release = resolve;
    next();
  }));

  requestQueues.set(key, current);

  const done = () => {
    if (released) return;
    released = true;
    if (release) release();
    current.finally(() => {
      if (requestQueues.get(key) === current) requestQueues.delete(key);
    });
  };

  res.once('finish', done);
  res.once('close', done);
}

function serializeBodylessSensitiveRequests(req, res, next) {
  if (req.method === 'GET' || req.method === 'DELETE') return serializeSensitiveRequests(req, res, next);
  return next();
}

function restrictedCors(options = {}) {
  return originalCors({
    ...options,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: false,
  });
}

Object.assign(restrictedCors, originalCors);

function hardenedJson(...args) {
  const jsonMiddleware = originalExpressJson(...args);
  return (req, res, next) => jsonMiddleware(req, res, (error) => {
    if (error) return next(error);
    if (hasDangerousKeys(req.body)) {
      return res.status(400).json({ ok: false, error: 'invalid_json_shape' });
    }
    return serializeSensitiveRequests(req, res, next);
  });
}

function hardenedExpress(...args) {
  const app = originalExpress(...args);
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders);
  app.use(webhookSecretGuard);
  app.use(debugRouteGuard);
  app.use(rateLimitMiddleware);
  app.use(initDataFreshnessGuard);
  app.use(serializeBodylessSensitiveRequests);
  return app;
}

Object.assign(hardenedExpress, originalExpress);
hardenedExpress.json = hardenedJson;

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'cors') return restrictedCors;
  if (request === 'express') return hardenedExpress;
  return originalLoad.call(this, request, parent, isMain);
};