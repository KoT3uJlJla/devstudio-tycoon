import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, replacements) {
  let content = readFileSync(path, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      changed = true;
    }
  }
  if (changed) writeFileSync(path, content);
}

const walletOverlayHelpers = [
  '',
  'type WalletOverlay = { coins?: number; rp?: number; stars?: number };',
  '',
  'function safeWalletNumber(value: unknown) {',
  '  const parsed = Number(value);',
  '  return Number.isFinite(parsed) ? parsed : undefined;',
  '}',
  '',
  'async function loadWalletOverlay(): Promise<WalletOverlay | null> {',
  '  if (!canUseServerSave()) return null;',
  '  const payload = await withTimeout(',
  "    fetch(API_URL + '/api/wallet/state', {",
  "      headers: { Authorization: 'tma ' + telegramInitData() },",
  '    })',
  '      .then((response) => (response.ok ? response.json() : null))',
  '      .catch(() => null),',
  '    null,',
  '    4200,',
  '  );',
  '  if (!payload?.ok) return null;',
  '  return {',
  '    coins: safeWalletNumber(payload?.economy?.coins ?? payload?.save?.data?.coins),',
  '    rp: safeWalletNumber(payload?.economy?.rp ?? payload?.save?.data?.rp),',
  '    stars: safeWalletNumber(payload?.economy?.stars ?? payload?.save?.data?.stars),',
  '  };',
  '}',
  '',
  'function applyWalletOverlay(state: GameState, wallet: WalletOverlay | null): GameState {',
  '  if (!wallet) return state;',
  '  return syncGlobalState(normalizeState({',
  '    ...state,',
  '    ...(wallet.coins !== undefined ? { coins: wallet.coins } : {}),',
  '    ...(wallet.rp !== undefined ? { rp: wallet.rp } : {}),',
  '    ...(wallet.stars !== undefined ? { stars: wallet.stars } : {}),',
  '  }));',
  '}',
].join('\n');

patchFile('src/App.tsx', [
  ["['menu', 'Топ', 'rating'],", "['menu', 'Награды', 'rating'],"],
  ["import { loadGame, resetGame, saveGame } from './storage';", "import { loadGame, saveGame } from './storage';"],
  ["  initialState,\n", ""],
  ["      <TutorialBanner state={state} onAction={startNewProject} onSkip={() => update((current) => ({ ...current, tutorialDone: true }))} />\n", ""],
  ["      {false && <TutorialBanner state={state} onAction={startNewProject} onSkip={() => update((current) => ({ ...current, tutorialDone: true }))} />}\n", ""],
  ["selectedProject: createProject(!current.tutorialDone), tutorialStep: current.tutorialDone ? current.tutorialStep : Math.max(current.tutorialStep, 0)", "selectedProject: createProject(false), tutorialDone: true, tutorialStep: 5"],
  ["<p className=\"eyebrow\">Недельный топ-10</p><h2>Рейтинг лучших игр за неделю</h2>", "<p className=\"eyebrow\">Еженедельные награды</p><h2>Награды за лучшие игры недели</h2>"],
  ["<p className=\"muted\">Рейтинг складывается из силы свежих релизов, среднего качества недели, дохода живых игр, ритма релизов, импульса студии и её уровня.</p>", "<p className=\"muted\">Здесь собраны призы, рейтинг недели, партнёрская программа и привязка кошелька для будущих выплат.</p>"],
  ["<button className=\"danger wide\" onClick={() => { resetGame(); update(() => initialState); }}>Сбросить прогресс</button>", ""],
  ["{project.isTutorial && <span className=\"pill hot\">Туториал 30 сек</span>}", ""],
  ["selectedProject: createProject(true)", "selectedProject: createProject(false), tutorialDone: true, tutorialStep: 5"],
  ["Ускорить на 1ч ⭐25", "Ускорить на 25% ⭐25"],
  ["https://t.me/devstudio_bot?start=share_release", "https://t.me/DevTycoon_bot?startapp=share_release"],
  ["https://t.me/devstudio_bot?start=ref_demo", "https://t.me/DevTycoon_bot?startapp=ref_demo"],
]);

patchFile('src/gameLogic.ts', [
  ["tutorialDone: false,", "tutorialDone: true,"],
  ["durationSeconds: isTutorial ? 30 : 180,", "durationSeconds: 180,"],
  ["const nextProgress = clamp(project.progress + 45, 0, 100);", "const nextProgress = clamp(project.progress + 25, 0, 100);"],
  ["}, 'ПРОПУСК +1Ч'),", "}, 'УСКОРЕНИЕ +25%'),"],
]);

patchFile('src/storage.ts', [
  ["function newestSave(...states: Array<GameState | null>) {\n  return states.filter(Boolean).sort((a, b) => saveTimestamp(b) - saveTimestamp(a))[0] ?? null;\n}\n", "function newestSave(...states: Array<GameState | null>) {\n  return states.filter(Boolean).sort((a, b) => saveTimestamp(b) - saveTimestamp(a))[0] ?? null;\n}\n" + walletOverlayHelpers],
  ["    if (preferred) {\n      const state = finalizeLoadedState(preferred);\n      writeLocalStorage(STORAGE_KEY, JSON.stringify(state));\n      if (canUseServerSave() && preferred === fromLocal) void saveServerState(state);\n      return rememberLoadedState(state);\n    }", "    if (preferred) {\n      const wallet = await loadWalletOverlay();\n      const state = applyWalletOverlay(finalizeLoadedState(preferred), wallet);\n      writeLocalStorage(STORAGE_KEY, JSON.stringify(state));\n      if (canUseServerSave() && preferred === fromLocal) void saveServerState(state);\n      return rememberLoadedState(state);\n    }"],
]);

patchFile('src/telegram.ts', [
  ["const finalText = isReferralShare ? referralShareText(shareTargetUrl) : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText().replace(/\\n\\n.*$/, '') : text.slice(0, 220);"],
  ["const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/devstudio_bot');", "const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/DevTycoon_bot');"],
]);
