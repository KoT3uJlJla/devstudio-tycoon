const baseUrl = String(process.env.SMOKE_BASE_URL || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 5000);

function withTimeout(promise, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label}: timeout after ${timeoutMs}ms`)), timeoutMs);
  return Promise.resolve(promise(controller.signal)).finally(() => clearTimeout(timer));
}

async function request(path, options = {}) {
  return withTimeout(async (signal) => {
    const response = await fetch(`${baseUrl}${path}`, { ...options, signal });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: response.status, ok: response.ok, body };
  }, path);
}

function assert(condition, message, details = null) {
  if (!condition) {
    const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : '';
    throw new Error(`${message}${suffix}`);
  }
}

async function main() {
  console.log(`Smoke target: ${baseUrl}`);

  const health = await request('/health');
  assert(health.status === 200 && health.body?.ok === true, 'Health check failed', health);
  console.log('OK /health');

  const me = await request('/api/me');
  assert(me.status === 401 && me.body?.error === 'telegram_auth_failed', 'Expected /api/me to reject missing Telegram auth', me);
  console.log('OK /api/me rejects missing auth');

  const save = await request('/api/save');
  assert(save.status === 401 && save.body?.error === 'telegram_auth_failed', 'Expected /api/save to reject missing Telegram auth', save);
  console.log('OK /api/save rejects missing auth');

  const economy = await request('/api/economy');
  assert(economy.status === 401 && economy.body?.error === 'telegram_auth_failed', 'Expected /api/economy to reject missing Telegram auth', economy);
  console.log('OK /api/economy rejects missing auth');

  const webhook = await request('/api/telegram/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert([403, 503].includes(webhook.status), 'Expected webhook to require/validate secret token', webhook);
  console.log('OK /api/telegram/webhook is protected');

  console.log('Smoke test passed');
}

main().catch((error) => {
  console.error('Smoke test failed:', error.message || error);
  process.exit(1);
});
