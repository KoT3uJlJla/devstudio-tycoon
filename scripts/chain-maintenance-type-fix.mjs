import { readFileSync, writeFileSync } from 'node:fs';

const path = 'package.json';
const pkg = JSON.parse(readFileSync(path, 'utf8'));
for (const key of ['dev', 'build', 'lint']) {
  if (typeof pkg.scripts?.[key] !== 'string') continue;
  if (pkg.scripts[key].includes('fix-maintenance-types.mjs')) continue;
  pkg.scripts[key] = pkg.scripts[key].replace(
    'node scripts/apply-maintenance-ui-lite.mjs',
    'node scripts/apply-maintenance-ui-lite.mjs && node scripts/fix-maintenance-types.mjs',
  );
}
writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
console.log('chain-maintenance-type-fix: ok');
