import cors from 'cors';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://devstudio-tycoon-stat.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

if (!process.env.MAX_INIT_DATA_AGE_SECONDS) {
  process.env.MAX_INIT_DATA_AGE_SECONDS = '86400';
}

const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(',');
const allowedOrigins = new Set(
  rawAllowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const originalCors = cors.default || cors;

function buildRestrictedCorsOptions(options = {}) {
  return {
    ...options,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin blocked: ${origin}`));
    },
    credentials: false,
  };
}

function restrictedCors(options) {
  return originalCors(buildRestrictedCorsOptions(options));
}

Object.assign(restrictedCors, originalCors);

try {
  cors.default = restrictedCors;
} catch {
  // Some module namespace objects are read-only. The CommonJS default export
  // used by Node's ESM bridge is mutable in production, so this is best-effort.
}
