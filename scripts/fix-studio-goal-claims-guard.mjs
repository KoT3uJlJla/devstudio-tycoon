import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/App.tsx';
let content = readFileSync(path, 'utf8');

content = content.replaceAll(
  'state.studioGoalClaims[goal.id]',
  '(state.studioGoalClaims ?? {})[goal.id]',
);

content = content.replaceAll(
  'current.studioGoalClaims[goal.id]',
  '(current.studioGoalClaims ?? {})[goal.id]',
);

writeFileSync(path, content);
console.log('fix-studio-goal-claims-guard: ok');
