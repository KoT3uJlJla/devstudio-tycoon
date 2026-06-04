# Frontend build-chain audit

This audit captures the historical frontend patch chain that used to run before `tsc` / Vite. The patch chain was executed once before this cleanup so the current generated result is now committed as normal source code under `src/`.

## Scripts that applied frontend UI or logic patches

These scripts changed player-facing frontend source, styles, or frontend-facing game state and have been removed from the build chain and from `scripts/` after their final result was moved into `src/`:

- `apply-small-update.mjs`
- `apply-release-results-update.mjs`
- `apply-development-skip-update.mjs`
- `apply-score-breakdown-help.mjs`
- `apply-player-facing-copy-fix.mjs`
- `apply-audience-development-update.mjs`
- `apply-rewards-copy-polish.mjs`
- `apply-ton-wallet-update.mjs`
- `apply-product-instinct-duration-update.mjs`
- `apply-studio-goals-safe-update.mjs`
- `apply-calendar-economy-update.mjs`
- `apply-guided-tutorial-update.mjs`
- `apply-referrals-release-update.mjs`
- `apply-maintenance-ui-lite.mjs`
- `apply-real-leaderboard-ui.mjs`
- `apply-ftue-retention-final.mjs` / `apply-ftue-retention-final2.mjs`
- `apply-ftue-starter-pack-update-v5.mjs`

## Scripts that only repaired duplicate patch output or idempotency

These scripts existed to make repeated string patches survivable. They are obsolete now that production UI is built directly from source files:

- `fix-app-imports.mjs`
- `fix-gameplay-ui-polish.mjs`
- `fix-guided-tutorial-spotlight.mjs`
- `fix-build-patch-duplicates.mjs`
- `fix-product-instinct-duplicates.mjs`
- `fix-maintenance-types.mjs`
- `chain-maintenance-type-fix.mjs`

## Already obsolete patch generations

These were older generations or one-off relax/update scripts that were not part of the active package build chain. They are removed with the rest of the patch system to avoid accidental future reuse:

- `apply-ftue-retention-update.mjs`
- `apply-ftue-retention-polish.mjs`
- `apply-ftue-starter-pack-update.mjs`
- `apply-ftue-starter-pack-update-v2.mjs`
- `apply-ftue-starter-pack-update-v3.mjs`
- `apply-ftue-starter-pack-update-v4.mjs`
- `apply-game-status-ui.mjs`
- `apply-game-status-ui-v2.mjs`
- `apply-game-status-ui-v3.mjs`
- `apply-game-status-ui-v4.mjs`
- `relax-game-status-ui-v4.mjs`
- `apply-shop-purchases-update.mjs`
- `apply-telegram-story-share.mjs`

## What remains

No frontend patch scripts remain in `scripts/`, and `package.json` now builds with `tsc && vite build`. The remaining technical debt is incremental React decomposition inside `src/app/AppShell.tsx`; this PR creates the new structure and moves the root entry, navigation, shared formatting, progress UI, and CSS import layer out of the previous monolithic `src/App.tsx`.
