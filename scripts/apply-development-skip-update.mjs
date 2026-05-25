import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

patchFile('src/App.tsx', (source) => source
  .replaceAll('state.stars < 25', 'state.stars < 15')
  .replaceAll('Ускорить через Telegram ⭐25', 'Ускорить через Telegram ⭐15')
  .replaceAll('Ускорить на 1ч ⭐25', 'Ускорить на 25% ⭐15')
);

patchFile('src/gameLogic.ts', (source) => source
  .replace(/const cost = 25;\s*if \(!project\?\.startedAt \|\| project\.progress >= 100 \|\| project\.pendingDevEvent \|\| current\.stars < cost\) return current;\s*const nextProgress = clamp\(project\.progress \+ 45, 0, 100\);/, 'const cost = 15;\n  if (!project?.startedAt || project.progress >= 100 || project.pendingDevEvent || current.stars < cost) return current;\n  const nextProgress = clamp(project.progress + 25, 0, 100);')
  .replaceAll("'ПРОПУСК +1Ч'", "'УСКОРЕНИЕ +25%'")
);

patchFile('server/devActions.js', (source) => source
  .replace('const STAR_COSTS = { skip:25, promote:35 };', 'const STAR_COSTS = { skip:15, promote:35 };')
  .replace('const progress=n((Number(p.progress)||0)+45,0,100);', 'const progress=n((Number(p.progress)||0)+25,0,100);')
  .replace('devEventText:"ПРОПУСК +1Ч"', 'devEventText:"УСКОРЕНИЕ +25%"')
);

patchFile('server/index.js', (source) => source
  .replace('time_skip: { title: "Ускорение разработки", costStars: 25, reward: {} }', 'time_skip: { title: "Ускорить разработку на 25%", costStars: 15, reward: {} }')
);
