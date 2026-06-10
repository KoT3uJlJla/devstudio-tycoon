# Checkpoint — 2026-06-10 stable Telegram Analytics CSP build

Build commit SHA: `c1ec3c316c25279fb20bcbcfea3f55163f31d8f2`

Stable tag:
- `stable-telegram-analytics-csp-2026-06-10`

Purpose:
- Saved as a stable control point after allowing Telegram Analytics requests through frontend CSP.

Included build state:
- `https://tganalytics.xyz` is allowed in frontend `connect-src`.
- CSP was not weakened with `connect-src *`.
- Backend code was not changed.
- Analytics token and app name were not changed.
- Game logic was not changed.

Checks recorded before saving:
- `npm run build`
- `npx tsc --noEmit`
- Verified `connect-src` includes `https://tganalytics.xyz` in source and built frontend CSP files.
- Verified no literal `connect-src *` was added.

Notes:
- This checkpoint records the stable build commit, not local unrelated working-tree leftovers.
- Local unrelated files and the untracked nested repository copy were not included in the stable build.
