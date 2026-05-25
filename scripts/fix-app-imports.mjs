import { readFileSync, writeFileSync } from 'node:fs';

const APP_PATH = 'src/App.tsx';
const telegramImport = "import { haptic, initTelegram, shareRelease } from './telegram';";
const economyImport = "import { claimBackendDailyReward, claimBackendReferralMilestone, purchaseBackendItem, runBackendDevelopmentAction } from './server-economy';";

let content = readFileSync(APP_PATH, 'utf8');

// apply-small-update.mjs is intentionally idempotent for most replacements, but
// the old import replacement could append the same economy import on every build.
// Normalize this area before TypeScript runs.
content = content
  .split('\n')
  .filter((line) => line.trim() !== economyImport)
  .join('\n');

if (!content.includes(economyImport)) {
  if (content.includes(telegramImport)) {
    content = content.replace(telegramImport, `${telegramImport}\n${economyImport}`);
  } else {
    content = `${economyImport}\n${content}`;
  }
}

writeFileSync(APP_PATH, content);
