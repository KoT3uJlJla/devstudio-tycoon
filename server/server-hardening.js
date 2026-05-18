import Module from 'node:module';
import { createRequire } from 'node:module';

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

const require = createRequire(import.meta.url);
const originalCors = require('cors');

function restrictedCors(options = {}) {
  return originalCors({
    ...options,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin blocked: ${origin}`));
    },
    credentials: false,
  });
}

Object.assign(restrictedCors, originalCors);

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'cors') return restrictedCors;
  return originalLoad.call(this, request, parent, isMain);
};
