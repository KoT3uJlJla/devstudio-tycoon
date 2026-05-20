import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function patchServerIndexRewards() {
  const indexPath = join(dirname(fileURLToPath(import.meta.url)), 'index.js');
  let source = '';
  try {
    source = readFileSync(indexPath, 'utf8');
  } catch {
    return;
  }

  const prizeDistribution = [
    'const PRIZE_DISTRIBUTION = [',
    '  { place: 1, amountUsd: 175, percent: 35 },',
    '  { place: 2, amountUsd: 125, percent: 25 },',
    '  { place: 3, amountUsd: 90, percent: 18 },',
    '  { place: 4, amountUsd: 60, percent: 12 },',
    '  { place: 5, amountUsd: 50, percent: 10 },',
    '];',
  ].join('\n');

  const next = source.replace(/const PRIZE_DISTRIBUTION = \[[\s\S]*?\];\n\nconst REFERRAL_MILESTONES/, `${prizeDistribution}\n\nconst REFERRAL_MILESTONES`);
  if (next === source) {
    console.warn('rewards-hardening: prize distribution patch was not applied');
    return;
  }

  try {
    writeFileSync(indexPath, next);
  } catch (error) {
    console.warn('rewards-hardening: failed to write prize distribution patch', error?.message || error);
  }
}

patchServerIndexRewards();
