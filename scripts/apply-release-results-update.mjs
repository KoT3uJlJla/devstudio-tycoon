import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

patchFile('src/App.tsx', (source) => {
  let next = source.replace(
    /\n\s*\{state\.lastOfflineReward\s*>\s*0\s*&&\s*\(\s*\n\s*<button\s+className="offline-toast"[\s\S]*?<\/button>\s*\n\s*\)\}\s*\n/g,
    '\n'
  );

  if (next.includes('offline-toast') || next.includes('OFFLINE DROP')) {
    throw new Error('release-results-update: failed to remove offline drop button from src/App.tsx');
  }

  if (!next.includes("from './backendClient'")) {
    next = next.replace("import { haptic, initTelegram, shareRelease } from './telegram';", "import { haptic, initTelegram, shareRelease } from './telegram';\nimport { hasBackendSession, runDevelopmentAction } from './backendClient';");
  }

  if (!next.includes('function criticToneClass(score: number)')) {
    next = next.replace('\nfunction ReleaseModal(', '\n' + "function criticToneClass(score: number) {\n  if (score >= 9) return 'critic-score-luxury';\n  if (score >= 6.5) return 'critic-score-good';\n  if (score >= 5) return 'critic-score-mid';\n  if (score >= 3.1) return 'critic-score-low';\n  return 'critic-score-bad';\n}\n\n" + 'function ReleaseModal(');
  }

  if (!next.includes('release-score-top')) {
    next = next.replace(/\n\s*<div className="cover-art">[\s\S]*?<\/div>\s*\n/, '\n');

    const finalScoreBlock = /\n\s*\{showFinal\s*\?\s*\(\s*\n\s*<div className="score-stage">[\s\S]*?\n\s*<\/div>\s*\n\s*\)\s*:\s*\(\s*\n\s*<div className="score-suspense">Издания готовят оценки…<\/div>\s*\n\s*\)\}/;
    if (!finalScoreBlock.test(next)) {
      throw new Error('release-results-update: failed to locate final score block in src/App.tsx');
    }
    next = next.replace(finalScoreBlock, '\n');

    const scoreTop = `
        <div className={\`release-score-top \${showFinal ? criticToneClass(result.score) : ''}\`}>
          {showFinal ? (
            <div className="score-stage">
              <ConfettiBurst />
              <strong className="big-score">{result.score}/10</strong>
              <span className="quality">{result.qualityLabel} · Комбо: {comboLabel(result.combo)}</span>
              <span className="critic-average-note">Средняя оценка изданий: {result.criticAverage}/10. Итоговая оценка игры считается отдельно и учитывает модификаторы ниже.</span>
            </div>
          ) : (
            <div className="score-suspense">Издания готовят оценки…</div>
          )}
        </div>`;

    next = next.replace(
      /\n\s*<h2 id="release-title">\{result\.projectName\}<\/h2>/,
      (match) => `${match}${scoreTop}`
    );
  } else {
    next = next.replace(/<div className="release-score-top">/g, "<div className={`release-score-top ${showFinal ? criticToneClass(result.score) : ''}`}>");
  }

  next = next.replace(
    /className="critic-grid animated-critics"/g,
    'className="critic-grid animated-critics release-critic-grid-2x2"'
  );

  next = next.replace(
    /<div className=\{step > index \? 'critic-card shown' : 'critic-card'\} key=\{critic\.name\}>/g,
    "<div className={`${step > index ? 'critic-card shown' : 'critic-card'} ${step > index ? criticToneClass(critic.score) : ''}`} key={critic.name}>"
  );

  if (!next.includes('saveGame(nextState);')) {
    next = next.replace(
      "  const update = (recipe: (current: GameState) => GameState) => setState((current) => (current ? recipe(ensureDailyState(current)) : current));",
      `  const update = (recipe: (current: GameState) => GameState) => setState((current) => {
    if (!current) return current;
    const nextState = recipe(ensureDailyState(current));
    window.setTimeout(() => saveGame(nextState), 0);
    return nextState;
  });`
    );
  }

  const activePanelPattern = /function ActiveDevelopmentPanel\([\s\S]*?\nfunction EconomyPreview/;
  const activePanelNew = `function ActiveDevelopmentPanel({ project, state, update }: { project: Project; state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const [busyAction, setBusyAction] = useState<'skip' | 'promote' | null>(null);
  const backendReady = hasBackendSession();
  const canTrySkip = project.progress < 100 && !project.pendingDevEvent;
  const canTryPromote = project.progress >= 100 && !project.promotionUsed;

  const runBackendOrLocal = async (action: 'skip' | 'promote') => {
    if (busyAction) return;
    setBusyAction(action);
    try {
      if (backendReady) {
        const nextState = await runDevelopmentAction(action, {}, action === 'skip' ? 'time_skip' : 'promotion');
        if (nextState) {
          update(() => nextState);
          haptic('success');
          return;
        }
        haptic('warning');
      }

      if (action === 'skip') update(timeSkipProject);
      if (action === 'promote') update(promoteProject);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="panel active-dev comic-card solo-dev-card">
      <div className="section-head compact"><div><p className="eyebrow">Активная разработка</p><h3>{project.name}</h3></div></div>
      <div className="progress-fx active-progress-fx"><ProgressBar value={project.progress} label={\`\${Math.floor(project.progress)}%\`} />{project.progress < 100 && <DevelopmentAmbientFx />}{project.progress < 100 && <DevelopmentTicker project={project} />}<DevPop project={project} />{project.devEventText?.startsWith('ПРОМО') && <PromotionBurst trigger={project.devEventId ?? 'promo'} />}</div>
      <div className="dev-tools-row">
        {project.progress >= 100 ? (
          <button className="primary" onClick={() => runBackendOrLocal('promote')} disabled={!canTryPromote || busyAction === 'promote' || (!backendReady && state.stars < 35)}>{project.promotionUsed ? \`Продвижение +\${(project.promotionBoost ?? 0).toFixed(1)}\` : busyAction === 'promote' ? 'Открываем…' : 'Продвижение ⭐35'}</button>
        ) : (
          <span className="dev-status-pill">Идёт разработка</span>
        )}
        {project.progress < 100 && <button className="time-skip-button" disabled={!canTrySkip || busyAction === 'skip' || (!backendReady && state.stars < 25)} onClick={() => runBackendOrLocal('skip')}>{busyAction === 'skip' ? 'Открываем…' : backendReady && state.stars < 25 ? 'Ускорить через Telegram ⭐25' : 'Ускорить на 1ч ⭐25'}</button>}
      </div>
      <p className="small muted">Прогресс разработки синхронизируется с backend при действиях и сохранении. Если backend недоступен, игра использует локальный режим разработки.</p>
      {project.devDecisionLog?.length ? <div className="decision-log">{project.devDecisionLog.map((item) => <span key={item}>{item}</span>)}</div> : null}
      {project.progress >= 100 && <button className="release-button" onClick={() => update(releaseProject)}>Релизнуть игру</button>}
    </div>
  );
}

function EconomyPreview`;
  if (!activePanelPattern.test(next)) {
    throw new Error('release-results-update: failed to locate ActiveDevelopmentPanel in src/App.tsx');
  }
  next = next.replace(activePanelPattern, activePanelNew);

  if (next.includes('cover-art')) {
    throw new Error('release-results-update: failed to remove cover art from release modal in src/App.tsx');
  }

  if (!next.includes('release-score-top') || !next.includes('release-critic-grid-2x2') || !next.includes('criticToneClass(critic.score)')) {
    throw new Error('release-results-update: failed to patch release modal layout in src/App.tsx');
  }

  if (!next.includes('runDevelopmentAction') || !next.includes('Ускорить через Telegram')) {
    throw new Error('release-results-update: failed to patch backend development actions in src/App.tsx');
  }

  if (!next.includes('saveGame(nextState);')) {
    throw new Error('release-results-update: failed to patch immediate update saves in src/App.tsx');
  }

  return next;
});

patchFile('src/gameLogic.ts', (source) => {
  let next = source.replace(/import \{([^}]+)\} from '\.\/gameData';/, (match, names) => {
    const cleaned = names
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name && name !== 'critics')
      .join(', ');
    return `import { ${cleaned} } from './gameData';`;
  });

  if (!next.includes("from './pressData'")) {
    next = next.replace("import type { AudienceState", "import { criticOutlets, getPressComment } from './pressData';\nimport type { AudienceState");
  }

  const criticNew = "  const shuffledCritics = [...criticOutlets].sort(() => Math.random() - 0.5).slice(0, 4);\n  const criticResults = shuffledCritics.map((criticName) => {\n    const criticScore = Number(clamp(score + Math.random() * 2.2 - 1.1 + audienceScore * 0.18 + marketScore * 0.15, 1, 10).toFixed(1));\n    return {\n      name: `«${criticName}»`,\n      quote: getPressComment(criticScore),\n      score: criticScore,\n    };\n  });";

  const criticBlockPattern = /  const criticResults = critics\.map\(\(critic\) => \(\{[\s\S]*?\n  \}\)\);/;
  if (criticBlockPattern.test(next)) {
    next = next.replace(criticBlockPattern, criticNew);
  }

  if (next.includes('critics.map')) {
    throw new Error('release-results-update: failed to replace old critics.map block in src/gameLogic.ts');
  }

  return next;
});

patchFile('src/storage.ts', (source) => {
  let next = source;

  if (!next.includes('localActiveSave?.selectedProject?.startedAt')) {
    next = next.replace(
      /if \(server\.kind === 'loaded'\) \{\s*const state = finalizeLoadedState\(server\.state\);\s*writeLocalStorage\(STORAGE_KEY, JSON\.stringify\(state\)\);\s*return rememberLoadedState\(state\);\s*\}/,
      `if (server.kind === 'loaded') {
      const localActiveSave = parseSave(readLocalStorage(STORAGE_KEY));
      if (localActiveSave?.selectedProject?.startedAt && saveTimestamp(localActiveSave) >= saveTimestamp(server.state)) {
        const localState = finalizeLoadedState(localActiveSave);
        writeLocalStorage(STORAGE_KEY, JSON.stringify(localState));
        void saveServerState(localState);
        return rememberLoadedState(localState);
      }

      const state = finalizeLoadedState(server.state);
      writeLocalStorage(STORAGE_KEY, JSON.stringify(state));
      return rememberLoadedState(state);
    }`
    );
  }

  if (!next.includes('scheduleServerWrite(state: GameState, immediate = false)')) {
    next = next.replace('function scheduleServerWrite(state: GameState) {', 'function scheduleServerWrite(state: GameState, immediate = false) {');
    next = next.replace(
      /pendingServerState = state;\s*const throttleMs = isActiveDevelopmentSave\(state\) \? ACTIVE_DEVELOPMENT_SERVER_THROTTLE_MS : SERVER_SAVE_THROTTLE_MS;/,
      `pendingServerState = state;
  if (immediate) {
    flushServer();
    return;
  }
  const throttleMs = isActiveDevelopmentSave(state) ? ACTIVE_DEVELOPMENT_SERVER_THROTTLE_MS : SERVER_SAVE_THROTTLE_MS;`
    );
  }

  if (!next.includes('scheduleServerWrite(safeState, actionHandled || isActiveDevelopmentSave(safeState));')) {
    next = next.replace(
      /const actionHandled = scheduleDevelopmentAction\(previousSnapshot, safeState\);\s*if \(!actionHandled\) scheduleServerWrite\(safeState\);/,
      `const actionHandled = scheduleDevelopmentAction(previousSnapshot, safeState);
  scheduleServerWrite(safeState, actionHandled || isActiveDevelopmentSave(safeState));`
    );
  }

  if (!next.includes('localActiveSave?.selectedProject?.startedAt')) {
    console.warn('release-results-update: warning: active development load reconciliation was not inserted');
  }
  if (!next.includes('scheduleServerWrite(safeState, actionHandled || isActiveDevelopmentSave(safeState));')) {
    console.warn('release-results-update: warning: active development backend save forcing was not inserted');
  }

  return next;
});
