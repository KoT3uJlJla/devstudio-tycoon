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

const walletOverlayHelpers = `\ntype WalletOverlay = { coins?: number; rp?: number; stars?: number };\n\nfunction safeWalletNumber(value: unknown) {\n  const parsed = Number(value);\n  return Number.isFinite(parsed) ? parsed : undefined;\n}\n\nasync function loadWalletOverlay(): Promise<WalletOverlay | null> {\n  if (!canUseServerSave()) return null;\n  const payload = await withTimeout(\n    fetch(\`${API_URL}/api/wallet/state\`, {\n      headers: { Authorization: \`tma ${telegramInitData()}\` },\n    })\n      .then((response) => (response.ok ? response.json() : null))\n      .catch(() => null),\n    null,\n    4200,\n  );\n  if (!payload?.ok) return null;\n  return {\n    coins: safeWalletNumber(payload?.economy?.coins ?? payload?.save?.data?.coins),\n    rp: safeWalletNumber(payload?.economy?.rp ?? payload?.save?.data?.rp),\n    stars: safeWalletNumber(payload?.economy?.stars ?? payload?.save?.data?.stars),\n  };\n}\n\nfunction applyWalletOverlay(state: GameState, wallet: WalletOverlay | null): GameState {\n  if (!wallet) return state;\n  return syncGlobalState(normalizeState({\n    ...state,\n    ...(wallet.coins !== undefined ? { coins: wallet.coins } : {}),\n    ...(wallet.rp !== undefined ? { rp: wallet.rp } : {}),\n    ...(wallet.stars !== undefined ? { stars: wallet.stars } : {}),\n  }));\n}\n`;

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
  ["function referralShareText(referralUrl: string) {\n  return `У тебя не получится сделать игру лучше моей😼 \\nМожешь зайти и убедиться в этом сам\\n\\n${referralUrl}`;\n}", "function referralShareText() {\n  return 'У тебя не получится сделать игру лучше моей😼\\nМожешь зайти и убедиться в этом сам';\n}"],
  ["const finalText = isReferralShare ? referralShareText(shareTargetUrl) : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText() : text.slice(0, 220);"],
  ["const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/devstudio_bot');", "const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/DevTycoon_bot');"],
]);
