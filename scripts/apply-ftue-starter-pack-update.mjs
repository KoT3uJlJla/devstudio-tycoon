import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`ftue-starter-pack: missing ${label}`);
  return source.replace(from, to);
}

patchFile('src/gameLogic.ts', (source) => {
  let next = source;
  next = replaceOnce(next, '  coins: 3000,', '  coins: 5000,', 'initial coins');
  next = replaceOnce(next, '  rp: 0,', '  rp: 50,', 'initial rp');
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;
  next = replaceOnce(
    next,
    `async function openFirstUpgradeStep(state: GameState, update: (fn: (state: GameState) => GameState) => void) {
  const nextScreen = { latestRelease: null, screen: 'research' as GameState['screen'] };
  if (ftueUpgradeRewardClaimed(state)) {
    update((current) => ({ ...current, ...nextScreen }));
    return;
  }
  const apiUrl = import.meta.env.VITE_API_URL ?? '';
  const initData = window.Telegram?.WebApp?.initData || '';
  if (apiUrl && initData) {
    try {
      const response = await fetch(apiUrl + '/api/ftue/upgrade-rp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'tma ' + initData,
        },
      });
      const payload = await response.json().catch(() => null) as { save?: { data?: unknown } | null } | null;
      if (payload?.save?.data) {
        update((current) => ({ ...mergeFtueRewardSave(current, payload.save?.data), ...nextScreen }));
        return;
      }
    } catch {
      // fall through to plain navigation when the backend is temporarily unavailable
    }
  }
  update((current) => ({ ...current, ...nextScreen }));
}
`,
    `function openFirstUpgradeStep(state: GameState, update: (fn: (state: GameState) => GameState) => void) {
  void state;
  update((current) => ({ ...current, latestRelease: null, screen: 'research' as GameState['screen'] }));
}
`,
    'open first upgrade step',
  );
  next = next.replace('Мы единоразово дадим 24 🧪, чтобы можно было сразу взять первое улучшение.', 'У тебя уже есть стартовые очки науки, так что можно сразу открыть первое улучшение.');
  next = replaceOnce(
    next,
    `  const canSkip = project.progress < 100 && !project.pendingDevEvent && state.stars >= 25;
`,
    `  const canSkip = project.progress < 100 && !project.pendingDevEvent && state.stars >= 25;
  const canUseFreeFirstPromotion = project.progress >= 100 && state.gamesReleased === 0 && !project.promotionUsed && !Boolean(state.studioGoalClaims?.['ftue-free-promotion-v1']);
  const canPromote = !project.promotionUsed && (canUseFreeFirstPromotion || state.stars >= 35);
  const promotionLabel = project.promotionUsed ? \`Продвижение +\${(project.promotionBoost ?? 0).toFixed(1)}\` : canUseFreeFirstPromotion ? 'Продвижение бесплатно' : 'Продвижение ⭐35';
`,
    'promotion helpers',
  );
  next = replaceOnce(
    next,
    `<button className="primary" onClick={() => update(promoteProject)} disabled={state.stars < 35 || Boolean(project.promotionUsed)}>{project.promotionUsed ? \`Продвижение +\${(project.promotionBoost ?? 0).toFixed(1)}\` : 'Продвижение ⭐35'}</button>`,
    `<button className="primary" onClick={() => update(promoteProject)} disabled={!canPromote}>{promotionLabel}</button>`,
    'promotion button',
  );
  return next;
});

patchFile('src/styles.css', (source) => {
  let next = source;
  if (!next.includes('/* FTUE starter pack polish */')) {
    next += `\n\n/* FTUE starter pack polish */\n.contract-actions .primary,\n.first-session-release-nudge .primary.wide {\n  width: auto;\n  max-width: 100%;\n  min-width: 220px;\n  align-self: flex-start;\n}\n@media (max-width: 720px) {\n  .contract-actions .primary,\n  .first-session-release-nudge .primary.wide {\n    width: auto;\n    min-width: 0;\n    padding-inline: 18px;\n    align-self: flex-start;\n  }\n}\n`;
  }
  return next;
});

console.log('apply-ftue-starter-pack-update: ok');
