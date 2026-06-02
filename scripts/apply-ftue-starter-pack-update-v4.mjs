import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceText(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`ftue-starter-pack-v4: missing ${label}`);
  return source.replace(from, to);
}

function replaceRegex(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`ftue-starter-pack-v4: missing ${label}`);
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

patchFile('src/gameLogic.ts', (source) => {
  let next = source;
  if (!next.includes('coins: 5000,')) {
    next = replaceRegex(next, /(export const initialState: GameState = \{[\s\S]*?\n\s*coins:\s*)\d+(,)/, '$15000$2', 'initial coins');
  }
  if (!next.includes('rp: 50,')) {
    next = replaceRegex(next, /(export const initialState: GameState = \{[\s\S]*?\n\s*rp:\s*)\d+(,)/, '$150$2', 'initial rp');
  }
  if (!next.includes('const freeFirstPromotion = current.gamesReleased === 0')) {
    next = replaceRegex(
      next,
      /export function promoteProject\(state: GameState\): GameState \{[\s\S]*?\n\}/,
      `export function promoteProject(state: GameState): GameState {\n  const current = ensureDailyState(state);\n  const project = current.selectedProject;\n  const cost = 35;\n  const freeFirstPromotion = current.gamesReleased === 0\n    && Boolean(project?.startedAt)\n    && (project?.progress ?? 0) >= 100\n    && !project?.promotionUsed\n    && !Boolean(current.studioGoalClaims?.['ftue-free-promotion-v1']);\n  if (!project?.startedAt || project.progress < 100 || project.promotionUsed || (!freeFirstPromotion && current.stars < cost)) return current;\n  const boost = Number((0.1 + Math.random() * 1.1).toFixed(1));\n  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');\n  return {\n    ...current,\n    stars: freeFirstPromotion ? current.stars : current.stars - cost,\n    studioGoalClaims: freeFirstPromotion ? { ...(current.studioGoalClaims ?? {}), ['ftue-free-promotion-v1']: true } : current.studioGoalClaims,\n    selectedProject: {\n      ...project,\n      promotionUsed: true,\n      promotionBoost: boost,\n      devEventId: nowId(),\n      devEventText: \`ПРОМО +\${boost.toFixed(1)}\`,\n      devEventTone: 'normal',\n    },\n  };\n}`,
      'promoteProject function',
    );
  }
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;
  if (!next.includes("Продвижение бесплатно")) {
    next = replaceText(
      next,
      "          <button className=\"primary\" onClick={() => update(promoteProject)} disabled={state.stars < 35 || Boolean(project.promotionUsed)}>{project.promotionUsed ? `Продвижение +${(project.promotionBoost ?? 0).toFixed(1)}` : 'Продвижение ⭐35'}</button>",
      "          <button className=\"primary\" onClick={() => update(promoteProject)} disabled={Boolean(project.promotionUsed) || (!(project.progress >= 100 && state.gamesReleased === 0 && !Boolean(state.studioGoalClaims?.['ftue-free-promotion-v1'])) && state.stars < 35)}>{project.promotionUsed ? `Продвижение +${(project.promotionBoost ?? 0).toFixed(1)}` : project.progress >= 100 && state.gamesReleased === 0 && !Boolean(state.studioGoalClaims?.['ftue-free-promotion-v1']) ? 'Продвижение бесплатно' : 'Продвижение ⭐35'}</button>",
      'promotion button',
    );
  }
  return next;
});

patchFile('src/styles.css', (source) => {
  let next = source;
  if (!next.includes('/* FTUE starter pack polish */')) {
    next += `\n\n/* FTUE starter pack polish */\n.contract-actions .primary,\n.first-session-release-nudge .primary.wide {\n  width: auto;\n  max-width: 100%;\n  min-width: 220px;\n  align-self: flex-start;\n}\n@media (max-width: 720px) {\n  .contract-actions .primary,\n  .first-session-release-nudge .primary.wide {\n    width: auto;\n    min-width: 0;\n    padding-inline: 18px;\n    align-self: flex-start;\n  }\n}\n`;
  }
  return next;
});

console.log('apply-ftue-starter-pack-update-v4: ok');
