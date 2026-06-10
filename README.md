# DevStudio Tycoon MVP v0.7.6

Telegram Mini App prototype: React + Vite + TypeScript, Cloudflare Pages frontend, Render backend, MongoDB Atlas storage.

## Current deployment

- Frontend: Cloudflare Pages — https://devstudio-tycoon-stat.pages.dev
- Backend: Render — https://devstudio-tycoon-api.onrender.com
- Cloud save/auth: Telegram Mini App `initData`, validated on the backend.
- Backend env: `BOT_TOKEN`, `MONGODB_URI`, `PORT`, `WEBAPP_URL`, `PUBLIC_BACKEND_URL`, `TELEGRAM_WEBHOOK_SECRET`; optional `BOT_START_IMAGE_URL`, `APP_URL`, `ALLOWED_ORIGINS`/`CORS_ORIGINS`, `MAX_INIT_DATA_AGE_SECONDS`.

## Security / hardening notes in v0.7.6

- App shell now has a Content-Security-Policy in both `index.html` and `dist/index.html`.
- Frontend and backend package manifests pin runtime with `"engines": { "node": ">=20" }`.
- Backend startup preloads `server/server-hardening.js`, which defaults Telegram `initData` max age to 24 hours and restricts CORS origins.
- Default allowed CORS origins are:
  - `https://devstudio-tycoon-stat.pages.dev`
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
- Override CORS allowlist through `ALLOWED_ORIGINS` or `CORS_ORIGINS` as a comma-separated list.
- Telegram `initData` is validated server-side with HMAC-SHA256 derived from `BOT_TOKEN`; stale `auth_date` is rejected.
- Protected economy lives on backend for game stars, shop purchases, research unlocks, development skips/promotions and wallet reconciliation.
- Client saves are normalized and clamped before use. Client-side state is never a secret; important economy state must be authoritative on the backend.

## Deployment workflow

### Frontend / Cloudflare Pages

Cloudflare Pages is currently updated from `dist`, so every frontend source change must be followed by a fresh build and `dist` upload.

```bash
npm install
npm run build
```

Then upload the fresh `dist/` folder to Cloudflare Pages.

Telegram Analytics env:

- `VITE_TG_ANALYTICS_TOKEN`
- `VITE_TG_ANALYTICS_APP_NAME=dst_open_beta`

For a local production build with analytics enabled:

```powershell
$env:VITE_API_URL="https://devstudio-tycoon-api.onrender.com"
$env:VITE_TG_ANALYTICS_TOKEN="<real token from owner>"
$env:VITE_TG_ANALYTICS_APP_NAME="dst_open_beta"
npm run build
```

For Cloudflare Pages, add `VITE_TG_ANALYTICS_TOKEN` and `VITE_TG_ANALYTICS_APP_NAME=dst_open_beta` to both Production and Preview environment variables, then rebuild the frontend.

### Backend / Render

Render runs the backend from `server/`:

```bash
cd server
npm install
npm start
```

Use Render Manual Deploy after backend changes. The start command runs:

```bash
node --import ./server-hardening.js index.js
```

### Telegram Bot `/start` Setup

The bot webhook must point to the Render backend, not the Cloudflare frontend:

```powershell
$botToken = "<BOT_TOKEN>"
$secret = "<TELEGRAM_WEBHOOK_SECRET>"
$body = @{
  url = "https://<render-service>.onrender.com/api/telegram/webhook"
  secret_token = $secret
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook" -Method Post -ContentType "application/json" -Body $body
```

Check the active webhook:

```powershell
Invoke-RestMethod "https://api.telegram.org/bot$botToken/getWebhookInfo"
```

Required backend variables:

- `WEBAPP_URL=https://devstudio-tycoon-stat.pages.dev`
- `PUBLIC_BACKEND_URL=https://your-render-service.onrender.com`
- `TELEGRAM_WEBHOOK_SECRET=<random_secret>`
- `BOT_START_IMAGE_URL=https://devstudio-tycoon-stat.pages.dev/assets/bot-start-cover.png`

The promo image is served by the Cloudflare frontend at:

```text
https://devstudio-tycoon-stat.pages.dev/assets/bot-start-cover.png
```

After changing the image or frontend assets, deploy the frontend. After changing the webhook route, deploy the backend and call `setWebhook` again.

## Local development

```bash
npm install
npm run dev
```

The frontend opens on `http://localhost:5173`.

For backend development:

```bash
cd server
npm install
npm start
```

## Checks

```bash
npm run lint
npm run build
npm audit --omit=dev
cd server && npm audit --omit=dev
```

## Notes for future audits

- `dist/` is intentionally present while Cloudflare Pages is deployed by manual upload. Do not change frontend source without rebuilding `dist`.
- The minified frontend bundle is not a security boundary. Game logic, endpoint names and constants are visible to users.
- If Cloudflare build-from-source is enabled later, move `dist/` into `.gitignore` and remove it from version control.
- Render free plan cold starts can delay backend responses; save conflict handling should continue to prefer backend-authoritative wallet/economy state.
