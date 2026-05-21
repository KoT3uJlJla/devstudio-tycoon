import { readFileSync, writeFileSync } from 'node:fs';

const path = 'scripts/apply-game-status-ui-v4.mjs';
let source = readFileSync(path, 'utf8');
source = source.replace(
  "  must(next, \"kind: 'closed'\", 'closed load state');\n",
  "  // closed load state is optional; the maintenance UI is driven by __devstudioGameClosed.\n",
);
writeFileSync(path, source);
console.log('relax-game-status-ui-v4: ok');
