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
  ["coins: 3000,", "coins: 2500,"],
  ["tutorialDone: false,", "tutorialDone: true,"],
  ["tutorialStep: 0,", "tutorialStep: 5,"],
  ["durationSeconds: isTutorial ? 30 : 180,", "durationSeconds: 180,"],
  ["isTutorial,", "isTutorial: false,"],
  ["const nextProgress = clamp(project.progress + 45, 0, 100);", "const nextProgress = clamp(project.progress + 25, 0, 100);"],
  ["}, 'ПРОПУСК +1Ч'),", "}, 'УСКОРЕНИЕ +25%'),"],
]);

patchFile('src/telegram.ts', [
  ["const finalText = isReferralShare ? referralShareText(shareTargetUrl) : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(shareTargetUrl).replace(/\\n\\n.*$/, '') : text.slice(0, 220);"],
  ["const finalText = isReferralShare ? referralShareText().replace(/\\n\\n.*$/, '') : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(shareTargetUrl).replace(/\\n\\n.*$/, '') : text.slice(0, 220);"],
  ["const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/devstudio_bot');", "const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/DevTycoon_bot');"],
]);
