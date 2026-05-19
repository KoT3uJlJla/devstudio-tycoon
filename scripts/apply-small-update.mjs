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

function appendOnce(path, marker, addition) {
  const content = readFileSync(path, 'utf8');
  if (content.includes(marker)) return;
  writeFileSync(path, `${content.trimEnd()}\n\n${addition.trim()}\n`);
}

patchFile('src/App.tsx', [
  ["['menu', 'Топ', 'rating'],", "['menu', 'Награды', 'rating'],"],
  ["import { loadGame, resetGame, saveGame } from './storage';", "import { loadGame, saveGame } from './storage';"],
  ["  initialState,\n", ""],
  ["      <TutorialBanner state={state} onAction={startNewProject} onSkip={() => update((current) => ({ ...current, tutorialDone: true }))} />\n", ""],
  ["      {false && <TutorialBanner state={state} onAction={startNewProject} onSkip={() => update((current) => ({ ...current, tutorialDone: true }))} />}\n", ""],
  ["        <div className=\"cover-art\"><Icon name=\"rocket\" /><i /></div>\n", ""],
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
  ["['$125', '25%'], ['$85', '17%'], ['$65', '13%'], ['$50', '10%'], ['$40', '8%'],\n  ['$35', '7%'], ['$30', '6%'], ['$25', '5%'], ['$25', '5%'], ['$20', '4%'],", "['$70', '35%'], ['$50', '25%'], ['$35', '17.5%'], ['$25', '12.5%'], ['$20', '10%'],"],
  [".sort((a, b) => Number(b[2]) - Number(a[2])).slice(0, 10);", ".sort((a, b) => Number(b[2]) - Number(a[2])).slice(0, 5);"],
  ["Недельный топ-10", "Недельный топ-5"],
  ["Топ-10 лучших игр недели делят призовой фонд $500.", "Топ-5 лучших игр недели делят призовой фонд $200."],
  ["топ-10", "топ-5"],
  ["Топ-10", "Топ-5"],
  ["Пока вне топ-10", "Пока вне топ-5"],
  ["Призовой фонд $500", "Призовой фонд $200"],
  ["только топ-10", "только топ-5"],
  ["$500", "$200"],
  ["призовую десятку", "призовую пятёрку"],
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

patchFile('src/telegram.ts', [
  ["const finalText = isReferralShare ? referralShareText(shareTargetUrl) : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(shareTargetUrl).replace(/\\n\\n.*$/, '') : text.slice(0, 220);"],
  ["const finalText = isReferralShare ? referralShareText().replace(/\\n\\n.*$/, '') : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(shareTargetUrl).replace(/\\n\\n.*$/, '') : text.slice(0, 220);"],
  ["const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/devstudio_bot');", "const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/DevTycoon_bot');"],
]);

appendOnce('src/styles.css', 'v7.8 — restored manual wallet and referral polish', `
/* v7.8 — restored manual wallet and referral polish */
.focus-card label { display: grid; grid-template-columns: 92px 1fr 42px; gap: 10px; align-items: center; color: var(--muted); font-size: 13px; }
button:not(:disabled), [role="button"]:not([aria-disabled="true"]), input[type="range"] { transition: transform .16s ease, box-shadow .16s ease, filter .16s ease, border-color .16s ease, background .16s ease; }
button:hover:not(:disabled), [role="button"]:hover:not([aria-disabled="true"]) { filter: brightness(1.035) saturate(1.025); }
.employee-metrics { line-height: 1.45; color: rgba(236,239,255,.88); }
.employee-card.hired .employee-metrics { color: rgba(5,6,13,.72); }
.premium-research-card { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; border-color: rgba(255,224,78,.7) !important; background: linear-gradient(135deg, rgba(255,224,78,.22), rgba(255,58,190,.13), rgba(29,247,255,.10)) !important; }
.premium-research-card > div { display: grid; gap: 6px; }
.premium-research-card strong { font-size: 21px; }
.premium-research-card button { min-width: 132px; }
.rating-formula .muted { margin-bottom: 12px; }
.rating-formula .score-breakdown-list { margin-top: 10px; gap: 9px; }
.rating-formula .score-line { padding-inline: 14px; cursor: default; }
.rating-formula .score-line::after { display: none; }
.referral-panel { display: grid; gap: 14px; }
.referral-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.referral-grid article { padding: 14px; border: 2px solid rgba(255,255,255,.12); border-radius: 18px; background: rgba(255,255,255,.06); display: grid; gap: 6px; }
.referral-grid b { color: var(--cyan); text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
.referral-grid strong { color: var(--yellow); font-size: 34px; line-height: 1; }
.referral-grid span { color: var(--muted); font-size: 13px; line-height: 1.35; }
.referral-note { display: grid; gap: 6px; padding: 12px 14px; border-radius: 16px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); }
.referral-note strong { color: var(--paper); }
.referral-note span { color: rgba(236,239,255,.78); font-size: 14px; line-height: 1.45; }
.milestone-list { display: grid; gap: 8px; }
.milestone { min-height: 54px; padding: 10px 12px; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 10px; text-align: left; border-radius: 18px; background: rgba(255,255,255,.06); color: var(--paper); }
.milestone b { justify-self: end; color: var(--yellow); }
.milestone.claimed { opacity: .72; }
.modal-x { position: absolute; top: 12px; right: 12px; width: 44px; height: 44px; min-height: 44px; padding: 0; border-radius: 999px; display: grid; place-items: center; font-size: 30px; line-height: 1; color: var(--paper); background: rgba(255,255,255,.08); box-shadow: none; }
.momentum-full-modal { position: relative; width: min(100%, 440px); max-height: 90vh; overflow: auto; padding: 26px 22px 24px; }
.momentum-copy { display: grid; gap: 12px; margin: 12px 0 18px; }
.momentum-copy p { margin: 0; line-height: 1.55; }
@media (max-width: 430px) {
  .premium-research-card, .referral-grid, .milestone { grid-template-columns: 1fr; }
  .premium-research-card button { width: 100%; }
  .milestone b { justify-self: start; }
}
`);
