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

function replaceBlock(path, from, to) {
  let content = readFileSync(path, 'utf8');
  if (!content.includes(from) || content.includes(to)) return;
  content = content.replace(from, to);
  writeFileSync(path, content);
}

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
  ["createProject(!state.tutorialDone)", "createProject(false)"],
  ["createProject(!current.tutorialDone)", "createProject(false)"],
  ["Начать с 5000 🪙", "Начать с 2500 🪙"],
  ["Ускорить на 1ч ⭐25", "Ускорить на 25% ⭐25"],
  ["https://t.me/devstudio_bot?start=share_release", "https://t.me/DevTycoon_bot?startapp=share_release"],
  ["https://t.me/devstudio_bot?start=ref_demo", "https://t.me/DevTycoon_bot?startapp=ref_demo"],
]);

replaceBlock(
  'src/App.tsx',
  "  useEffect(() => {\n    if (!state) return;\n    const timer = window.setTimeout(() => saveGame(state), 1200);\n    return () => window.clearTimeout(timer);\n  }, [state]);",
  "  useEffect(() => {\n    if (!state) return;\n    saveGame(state);\n  }, [state]);",
);

patchFile('src/gameLogic.ts', [
  ["project.isTutorial: false", "project.isTutorial"],
  ["coins: 3000,", "coins: 2500,"],
  ["tutorialDone: false,", "tutorialDone: true,"],
  ["tutorialStep: 0,", "tutorialStep: 5,"],
  ["durationSeconds: isTutorial ? 30 : 180,", "durationSeconds: 180,"],
  ["    isTutorial,\n", "    isTutorial: false,\n"],
  ["const nextProgress = clamp(project.progress + 45, 0, 100);", "const nextProgress = clamp(project.progress + 25, 0, 100);"],
  ["}, 'ПРОПУСК +1Ч'),", "}, 'УСКОРЕНИЕ +25%'),"],
]);

replaceBlock(
  'src/gameLogic.ts',
  "export function estimateProjectDuration(project: Project, state: GameState) {\n  if (project.isTutorial) return 30;\n  const genre = genres.find((item) => item.id === project.genre);",
  "export function estimateProjectDuration(project: Project, state: GameState) {\n  const releases = Math.max(0, Math.floor(Number(state.gamesReleased) || 0));\n  if (releases === 0) return 5;\n  if (releases === 1) return 30;\n  if (releases === 2) return 60;\n  const genre = genres.find((item) => item.id === project.genre);",
);

replaceBlock(
  'src/gameplay-ui-polish.ts',
  "async function loadBackendTonWallet() {",
  "async function syncTonWalletUnbindBackend() {\n  backendTonAddress = '';\n  lastSyncedTonAddress = '';\n  writeStoredTonAddress('');\n  setTonUiState('отвязан', '', false);\n  if (!canSyncTonWallet()) return;\n  if (tonSyncInFlight) await tonSyncInFlight.catch(() => undefined);\n  tonSyncInFlight = fetch(`${API_URL}/api/wallet/ton`, {\n    method: 'DELETE',\n    headers: { Authorization: `tma ${telegramInitData()}` },\n  })\n    .then(async (response) => {\n      const payload = await response.json().catch(() => null);\n      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'ton_wallet_unbind_failed');\n      backendTonAddress = '';\n      lastSyncedTonAddress = '';\n      writeStoredTonAddress('');\n      setTonUiState('не привязан', '', false);\n    })\n    .catch(() => {\n      setTonUiState('ошибка', '', false);\n    })\n    .finally(() => {\n      tonSyncInFlight = null;\n    });\n  await tonSyncInFlight;\n}\n\nasync function loadBackendTonWallet() {",
);

patchFile('src/gameplay-ui-polish.ts', [
  ["      const address = currentTonAddress(wallet);\n      updateTonStatus(wallet);\n      if (address) void syncTonWalletToBackend(address);\n      else if (backendTonAddress) { backendTonAddress = ''; writeStoredTonAddress(''); updateTonStatus(); }\n      scheduleTonStatusRefresh();", "      const liveAddress = walletAddress(wallet) || walletAddress(tonConnectUi?.wallet) || walletAddress(tonConnectUi?.account);\n      updateTonStatus(wallet);\n      if (liveAddress) void syncTonWalletToBackend(liveAddress);\n      else void syncTonWalletUnbindBackend();\n      scheduleTonStatusRefresh();"],
]);

patchFile('src/telegram.ts', [
  ["const finalText = isReferralShare ? referralShareText(shareTargetUrl) : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(shareTargetUrl).replace(/\\n\\n.*$/, '') : text.slice(0, 220);"],
  ["const finalText = isReferralShare ? referralShareText().replace(/\\n\\n.*$/, '') : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(shareTargetUrl).replace(/\\n\\n.*$/, '') : text.slice(0, 220);"],
  ["const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/devstudio_bot');", "const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/DevTycoon_bot');"],
]);
