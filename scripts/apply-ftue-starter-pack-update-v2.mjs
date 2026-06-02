import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceRegex(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`ftue-starter-pack-v2: missing ${label}`);
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

function replaceRangeByMarkers(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`ftue-starter-pack-v2: missing ${label}`);
  const end = source.indexOf(endMarker, start);
  if (end === -1) throw new Error(`ftue-starter-pack-v2: missing ${label} end`);
  return source.slice(0, start) + replacement + source.slice(end + endMarker.length);
}

patchFile('src/gameLogic.ts', (source) => {
  let next = source;
  if (!next.includes('coins: 5000,')) {
    next = replaceRegex(next, /(export const initialState: GameState = \{[\s\S]*?\n\s*coins:\s*)\d+(,)/, '$15000$2', 'initial coins');
  }
  if (!next.includes('rp: 50,')) {
    next = replaceRegex(next, /(export const initialState: GameState = \{[\s\S]*?\n\s*rp:\s*)\d+(,)/, '$150$2', 'initial rp');
  }
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;
  if (!next.includes("function openFirstUpgradeStep(state: GameState, update: (fn: (state: GameState) => GameState) => void) {\n  void state;")) {
    next = replaceRegex(
      next,
      /async function openFirstUpgradeStep\(state: GameState, update: \(fn: \(state: GameState\) => GameState\) => void\) \{[\s\S]*?\n\}/,
      `function openFirstUpgradeStep(state: GameState, update: (fn: (state: GameState) => GameState) => void) {\n  void state;\n  update((current) => ({ ...current, latestRelease: null, screen: 'research' as GameState['screen'] }));\n}`,
      'open first upgrade step',
    );
  }
  next = next.replace('Мы единоразово дадим 24 🧪, чтобы можно было сразу взять первое улучшение.', 'У тебя уже есть стартовые очки науки, так что можно сразу открыть первое улучшение.');
  if (!next.includes('Продвижение бесплатно')) {
    next = replaceRangeByMarkers(
      next,
      '<button className="primary" onClick={() => update(promoteProject)}',
      '</button>',
      '<button className="primary" onClick={() => update(promoteProject)} disabled={Boolean(project.promotionUsed) || (!(project.progress >= 100 && state.gamesReleased === 0 && !Boolean(state.studioGoalClaims?.[\'ftue-free-promotion-v1\'])) && state.stars < 35)}>{project.promotionUsed ? `Продвижение +${(project.promotionBoost ?? 0).toFixed(1)}` : project.progress >= 100 && state.gamesReleased === 0 && !Boolean(state.studioGoalClaims?.[\'ftue-free-promotion-v1\']) ? \'Продвижение бесплатно\' : \'Продвижение ⭐35\'}</button>',
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

console.log('apply-ftue-starter-pack-update-v2: ok');
