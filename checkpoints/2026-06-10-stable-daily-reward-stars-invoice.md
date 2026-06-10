# Checkpoint — 2026-06-10 stable daily reward / Stars invoice build

Build commit SHA: `7b1db7f236146086cf82def8907745af3936e73e`

Stable tag:
- `stable-daily-reward-stars-invoice-2026-06-10`

Purpose:
- Saved as a stable control point after the daily reward UI fix and Stars invoice fallback patch.

Included build state:
- Daily reward button has a dedicated readable golden style.
- Paid Stars actions remain clickable at low internal Stars balance when backend invoice flow is available.
- Internal Stars balance is still spent first.
- Telegram invoice retry is supported for development skip and promotion.
- Backend shop item ids/prices are synchronized with frontend.
- Paid development invoices are single-use and validated by owner, status, item id, and amount.

Checks recorded before saving:
- `npm run build`
- `npx tsc --noEmit`
- `node --check server/index.js`
- `node --check server/starsPayments.js`
- `node --check server/devActions.js`
- `node --check server/server-hardening.js`
- `git diff --check`

Notes:
- This checkpoint records the stable build commit, not the local untracked nested repository copy.
- Local unrelated working-tree leftovers were not included in the stable build.
