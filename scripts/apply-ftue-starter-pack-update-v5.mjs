import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceRegex(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`ftue-starter-pack-v5: missing ${label}`);
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
  next = next.replace('Мы единоразово дадим 24 🧪, чтобы можно было сразу взять первое улучшение.', 'У тебя уже есть стартовые очки науки, так что можно сразу открыть первое улучшение.');
  if (!next.includes('Продвижение бесплатно')) {
    next = replaceRegex(
      next,
      /function ActiveDevelopmentPanel\(\{ project, state, update \}: \{ project: Project; state: GameState; update: \(fn: \(state: GameState\) => GameState\) => void \}\) \{[\s\S]*?\n\}\n\nfunction EconomyPreview/,
      `function ActiveDevelopmentPanel({ project, state, update }: { project: Project; state: GameState; update: (fn: (state: GameState) => GameState) => void }) {\n  const canSkip = project.progress < 100 && !project.pendingDevEvent && state.stars >= 25;\n  const canUseFreeFirstPromotion = project.progress >= 100 && state.gamesReleased === 0 && !Boolean(project.promotionUsed) && !Boolean(state.studioGoalClaims?.['ftue-free-promotion-v1']);\n  const canPromote = !project.promotionUsed && (canUseFreeFirstPromotion || state.stars >= 35);\n  const promotionLabel = project.promotionUsed\n    ? \`Продвижение +\${(project.promotionBoost ?? 0).toFixed(1)}\`\n    : canUseFreeFirstPromotion\n      ? 'Продвижение бесплатно'\n      : 'Продвижение ⭐35';\n  return (\n    <div className="panel active-dev comic-card solo-dev-card">\n      <div className="section-head compact"><div><p className="eyebrow">Активная разработка</p><h3>{project.name}</h3></div></div>\n      <div className="progress-fx active-progress-fx"><ProgressBar value={project.progress} label={\`\${Math.floor(project.progress)}%\`} />{project.progress < 100 && <DevelopmentAmbientFx />}{project.progress < 100 && <DevelopmentTicker project={project} />}<DevPop project={project} />{project.devEventText?.startsWith('ПРОМО') && <PromotionBurst trigger={project.devEventId ?? 'promo'} />}</div>\n      <div className="dev-tools-row">\n        {project.progress >= 100 ? (\n          <button className="primary" onClick={() => update(promoteProject)} disabled={!canPromote}>{promotionLabel}</button>\n        ) : (\n          <span className="dev-status-pill">Идёт разработка</span>\n        )}\n        {project.progress < 100 && <button className="time-skip-button" disabled={!canSkip} onClick={() => update(timeSkipProject)}>Ускорить на 1ч ⭐25</button>}\n      </div>\n      <p className="small muted">События ставят разработку на паузу. Если появилась карточка события — выбери решение, чтобы продолжить.</p>\n      {project.devDecisionLog?.length ? <div className="decision-log">{project.devDecisionLog.map((item) => <span key={item}>{item}</span>)}</div> : null}\n      {project.progress >= 100 && <button className="release-button" onClick={() => update(releaseProject)}>Релизнуть игру</button>}\n    </div>\n  );\n}\n\nfunction EconomyPreview`,
      'ActiveDevelopmentPanel block',
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

console.log('apply-ftue-starter-pack-update-v5: ok');
