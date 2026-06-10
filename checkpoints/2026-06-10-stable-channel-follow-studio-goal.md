# Checkpoint — 2026-06-10 stable channel follow Studio Goal build

Build commit SHA: `73f9a7df75e441b64a054cda1aa64b91cadff9a3`

Stable tag:
- `stable-channel-follow-studio-goal-2026-06-10`

Purpose:
- Saved as a stable control point after adding the one-time Studio Goal for following the Hatch Mind Telegram channel.

Included build state:
- Studio Goal id: `studio.subscribe_hatch_mind_channel`
- Channel link: `https://t.me/hatch_mind`
- The goal is first in Studio Goals with `order: -1000`.
- Russian and English player-facing copy is included.
- Reward is internal economy only: `+35` Stars and `+8000` coins.
- Click and claim are backend-authoritative through MongoDB, not localStorage.
- Claim waits for server-side `eligibleAt` after a 5-second delay.
- Atomic claim update prevents duplicate reward issuance.
- Telegram invoice/payment flow, shop prices, TON wallet, referrals, leaderboard, game logic, and Pixi/Studio Office were not changed.

Checks recorded before saving:
- `npm run build`
- `npx tsc --noEmit`
- `node --check server/index.js`
- `node --check server/tasks-config-hardening.js`
- Verified the built frontend bundle contains the goal id and channel link.
- `npm run smoke` was not run because no `smoke` script exists in `package.json` or `server/package.json`.

Notes:
- This checkpoint records the stable build commit, not local unrelated working-tree leftovers.
- Local unrelated files and the untracked nested repository copy were not included in the stable build.
