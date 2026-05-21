import { readFileSync, writeFileSync } from 'node:fs';

const path = 'scripts/apply-game-status-ui-v4.mjs';
let source = readFileSync(path, 'utf8');
const before = source;

source = source.replace(
  /^\s*must\(next,\s*[`'"]kind:\s*['"]closed['"][`'"]\s*,\s*[`'"]closed load state[`'"]\s*\);\s*$/gm,
  '  // closed load state is optional; the maintenance UI is driven by __devstudioGameClosed.',
);
source = source.replace(
  /^\s*must\(next,\s*"kind: 'closed'"\s*,\s*'closed load state'\s*\);\s*$/gm,
  '  // closed load state is optional; the maintenance UI is driven by __devstudioGameClosed.',
);
source = source.replace(
  /^\s*must\(next,\s*'kind: \\\'closed\\\''\s*,\s*'closed load state'\s*\);\s*$/gm,
  '  // closed load state is optional; the maintenance UI is driven by __devstudioGameClosed.',
);

if (source.includes('closed load state') && source.includes("must(next")) {
  source = source.split('\n').filter((line) => !(line.includes('closed load state') && line.includes('must(next'))).join('\n');
}

writeFileSync(path, source);
console.log(before === source ? 'relax-game-status-ui-v4: no-op' : 'relax-game-status-ui-v4: ok');
