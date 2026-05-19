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
  ["import { haptic, initTelegram, shareRelease } from './telegram';", "import { haptic, initTelegram, shareRelease } from './telegram';\nimport { claimBackendDailyReward, claimBackendReferralMilestone, purchaseBackendItem, runBackendDevelopmentAction } from './server-economy';"],
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
  ["<span>10% от покупок приглашённых друзей</span>", "<span>10% ⭐ от трат твоих друзей</span>"],
  ["<span>3% от покупок друзей твоих друзей</span>", "<span>3% ⭐ от трат друзей твоих друзей</span>"],
  ["Недельный топ-10", "Недельный топ-5"],
  ["Топ-10 лучших игр недели делят призовой фонд $500.", "Топ-5 лучших игр недели делят призовой фонд $200."],
  ["топ-10", "топ-5"],
  ["Топ-10", "Топ-5"],
  ["Пока вне топ-10", "Пока вне топ-5"],
  ["Призовой фонд $500", "Призовой фонд $200"],
  ["только топ-10", "только топ-5"],
  ["$500", "$200"],
  ["призовую десятку", "призовую пятёрку"],
  ["{dailyReady && <button className=\"daily-card comic-card\" onClick={() => update((current) => ({ ...current, stars: current.stars + 1, coins: current.coins + 500, dailyClaimedAt: todayKey() }))}><span>ЕЖЕДНЕВНЫЙ ВХОД</span> Забрать +1 ⭐ и +500 🪙</button>}", "{dailyReady && <button className=\"daily-card comic-card\" onClick={() => void claimBackendDailyReward()}><span>ЕЖЕДНЕВНЫЙ ВХОД</span> Забрать +1 ⭐ и +500 🪙</button>}"],
  ["<button className=\"primary\" onClick={() => update(promoteProject)} disabled={state.stars < 35 || Boolean(project.promotionUsed)}>{project.promotionUsed ? `Продвижение +${(project.promotionBoost ?? 0).toFixed(1)}` : 'Продвижение ⭐35'}</button>", "<button className=\"primary\" onClick={() => void runBackendDevelopmentAction('promote')} disabled={state.stars < 35 || Boolean(project.promotionUsed)}>{project.promotionUsed ? `Продвижение +${(project.promotionBoost ?? 0).toFixed(1)}` : 'Продвижение ⭐35'}</button>"],
  ["{project.progress < 100 && <button className=\"time-skip-button\" disabled={!canSkip} onClick={() => update(timeSkipProject)}>Ускорить на 1ч ⭐25</button>}", "{project.progress < 100 && <button className=\"time-skip-button\" disabled={!canSkip} onClick={() => void runBackendDevelopmentAction('skip')}>Ускорить на 25% ⭐25</button>}"],
  ["<button className=\"primary\" onClick={() => update((current) => ({ ...current, coins: current.coins + 5000, rp: current.rp + 50, offerSeen: true }))}>Купить ⭐100</button>", "<button className=\"primary\" onClick={() => void purchaseBackendItem('starter_pack')}>Купить ⭐100</button>"],
]);

replaceBlock(
  'src/App.tsx',
  "  useEffect(() => {\n    initTelegram();\n    loadGame().then(setState);\n  }, []);",
  "  useEffect(() => {\n    initTelegram();\n    loadGame().then(setState);\n  }, []);\n\n  useEffect(() => {\n    const onServerSave = (event: Event) => {\n      const detail = (event as CustomEvent<GameState>).detail;\n      if (detail && typeof detail === 'object') setState(detail);\n    };\n    window.addEventListener('devstudio:server-save', onServerSave);\n    return () => window.removeEventListener('devstudio:server-save', onServerSave);\n  }, []);",
);

replaceBlock(
  'src/App.tsx',
  "  const unlockProductInstinct = () => update((current) => {\n    if (current.unlockedResearchIds.includes('product-instinct')) return current;\n    if ((current.qualifiedReferrals ?? 0) >= referralTarget) {\n      haptic('success');\n      return { ...current, unlockedResearchIds: ['product-instinct', ...current.unlockedResearchIds], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 };\n    }\n    if (current.stars < productStarCost) return current;\n    haptic('success');\n    return { ...current, stars: current.stars - productStarCost, unlockedResearchIds: ['product-instinct', ...current.unlockedResearchIds], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 };\n  });",
  "  const unlockProductInstinct = () => {\n    if (productUnlocked) return;\n    if (qualifiedReferrals >= referralTarget) {\n      update((current) => {\n        if (current.unlockedResearchIds.includes('product-instinct')) return current;\n        haptic('success');\n        return { ...current, unlockedResearchIds: ['product-instinct', ...current.unlockedResearchIds], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 };\n      });\n      return;\n    }\n    if (state.stars < productStarCost) return;\n    haptic('success');\n    void purchaseBackendItem('product_instinct');\n  };",
);

replaceBlock(
  'src/App.tsx',
  "function ShopScreen({ state, update, onRenameStudio }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; onRenameStudio: () => void }) {\n  const renameCost = 25;\n  const sku = [\n    ['Стартовый набор', '5000 монет, 50 очков науки и офлайн-буст на 24 ч', '⭐100', () => update((current) => ({ ...current, coins: current.coins + 5000, rp: current.rp + 50, offerSeen: true }))],\n    ['Малый набор монет', '+3000 монет', '⭐50', () => update((current) => ({ ...current, coins: current.coins + 3000 }))],\n    ['Средний набор монет', '+18000 монет', '⭐250', () => update((current) => ({ ...current, coins: current.coins + 18000 }))],\n    ['Ускорение науки', '+100 очков исследований', '⭐75', () => update((current) => ({ ...current, rp: current.rp + 100 }))],\n  ] as const;\n  return <div className=\"stack\"><div className=\"section-head hero-title\"><div><p className=\"eyebrow\">Звёзды</p><h2>Магазин студии</h2></div><span className=\"pill\">полезные улучшения</span></div><p className=\"muted\">Здесь можно обменять Звёзды на усиления для студии. Пропуск времени доступен только во время активной разработки.</p><article className=\"shop-card comic-card\"><div><h3>Переименовать студию</h3><p>Сейчас: {state.studioName || 'Без названия'}. Позволяет выбрать новое имя для студии.</p></div><button disabled={state.stars < renameCost} onClick={() => { update((current) => { if (current.stars < renameCost) return current; return { ...current, stars: current.stars - renameCost }; }); onRenameStudio(); }}>⭐{renameCost}</button></article><div className=\"shop-list\">{sku.map(([title, desc, price, action]) => <article className=\"shop-card comic-card\" key={title}><div><h3>{title}</h3><p>{desc}</p></div><button onClick={action}>{price}</button></article>)}</div></div>;\n}",
  "function ShopScreen({ state, onRenameStudio }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; onRenameStudio: () => void }) {\n  const renameCost = 25;\n  const sku = [\n    ['starter_pack', 'Стартовый набор', '5000 монет, 50 очков науки и офлайн-буст на 24 ч', '⭐100'],\n    ['coins_small', 'Малый набор монет', '+3000 монет', '⭐50'],\n    ['coins_medium', 'Средний набор монет', '+18000 монет', '⭐250'],\n    ['research_boost', 'Ускорение науки', '+100 очков исследований', '⭐75'],\n  ] as const;\n  return <div className=\"stack\"><div className=\"section-head hero-title\"><div><p className=\"eyebrow\">Звёзды</p><h2>Магазин студии</h2></div><span className=\"pill\">полезные улучшения</span></div><p className=\"muted\">Здесь можно обменять Звёзды на усиления для студии. Все списания проходят через сервер и сразу синхронизируют save/economy.</p><article className=\"shop-card comic-card\"><div><h3>Переименовать студию</h3><p>Сейчас: {state.studioName || 'Без названия'}. Позволяет выбрать новое имя для студии.</p></div><button disabled={state.stars < renameCost} onClick={() => { void purchaseBackendItem('rename_studio').then((next) => { if (next) onRenameStudio(); }); }}>⭐{renameCost}</button></article><div className=\"shop-list\">{sku.map(([id, title, desc, price]) => <article className=\"shop-card comic-card\" key={title}><div><h3>{title}</h3><p>{desc}</p></div><button onClick={() => void purchaseBackendItem(id)}>{price}</button></article>)}</div></div>;\n}",
);

replaceBlock(
  'src/App.tsx',
  "  const refreshPool = () => {\n    if (!canRefresh) { haptic('warning'); return; }\n    update((current) => ({ ...current, stars: Math.max(0, current.stars - 10) }));\n    setPoolOffset((value) => value + Math.max(1, Math.floor(allCandidates.length / 2)));\n    haptic('success');\n  };",
  "  const refreshPool = () => {\n    if (!canRefresh) { haptic('warning'); return; }\n    void purchaseBackendItem('refresh_hires').then((next) => {\n      if (!next) return;\n      setPoolOffset((value) => value + Math.max(1, Math.floor(allCandidates.length / 2)));\n      haptic('success');\n    });\n  };",
);

replaceBlock(
  'src/App.tsx',
  "  const claimMilestone = (id: string) => update((current) => {\n    const milestone = REFERRAL_MILESTONES.find((item) => item.id === id);\n    if (!milestone || current.referralMilestoneClaims?.[id] || (current.qualifiedReferrals ?? 0) < milestone.target) return current;\n    haptic('success');\n    return {\n      ...current,\n      coins: current.coins + milestone.reward.coins,\n            rp: current.rp + milestone.reward.rp,\n      referralMilestoneClaims: { ...(current.referralMilestoneClaims ?? {}), [id]: true },\n    };\n  });",
  "  const claimMilestone = (id: string) => {\n    haptic('success');\n    void claimBackendReferralMilestone(id);\n  };",
);

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
  ["function referralPreviewUrl() {\n  const code = encodeURIComponent(maskedReferralCode());\n  // Telegram does not attach arbitrary images to t.me/share/url messages.\n  // It renders link previews from Open Graph tags, so we share our own preview\n  // page that has og:image and redirects real users to the bot.\n  return `${window.location.origin}/ref.html?r=${code}&v=2`;\n}\n\n", ""],
  ["function referralShareText() {\n  return 'У тебя не получится сделать игру лучше моей😼\\nМожешь зайти и убедиться в этом сам';\n}", "function referralShareText(refUrl: string) {\n  return `У тебя не получится сделать игру лучше моей😼\\nМожешь зайти и убедиться в этом сам\\n\\n${refUrl}`;\n}"],
  ["const shareTargetUrl = isReferralShare ? referralPreviewUrl() : (payload.url ?? OFFICIAL_BOT_URL);", "const shareTargetUrl = isReferralShare ? refUrl : (payload.url ?? OFFICIAL_BOT_URL);"],
  ["const finalText = isReferralShare ? referralShareText() : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(refUrl) : text.slice(0, 220);"],
  ["const finalText = isReferralShare ? referralShareText(shareTargetUrl) : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(refUrl) : text.slice(0, 220);"],
  ["const finalText = isReferralShare ? referralShareText(shareTargetUrl).replace(/\\n\\n.*$/, '') : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(refUrl) : text.slice(0, 220);"],
  ["const finalText = isReferralShare ? referralShareText().replace(/\\n\\n.*$/, '') : text.slice(0, 220);", "const finalText = isReferralShare ? referralShareText(refUrl) : text.slice(0, 220);"],
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

appendOnce('src/styles.css', 'v7.9 — wallet controls and prize pool polish', `
/* v7.9 — wallet controls and prize pool polish */
.ton-wallet-input {
  width: 100%;
  min-height: 62px;
  padding: 0 18px;
  border: 3px solid var(--ink);
  border-radius: 22px;
  color: var(--ink);
  background: #f5f6fb;
  box-shadow: 4px 4px 0 rgba(0,0,0,.25);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(16px, 4.3vw, 20px);
  font-weight: 1000;
  letter-spacing: -.03em;
  text-transform: none;
}
.ton-wallet-input::placeholder { color: rgba(5,6,13,.48); }
.ton-wallet-actions { display: grid; grid-template-columns: 1fr; gap: 14px; }
.ton-wallet-address { display: none !important; }
.prize-grid[data-prize-pool="200"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.prize-grid[data-prize-pool="200"] .prize-cell { min-height: 96px; display: grid; place-items: center; gap: 4px; }
.referral-grid span { font-weight: 850; }
@media (min-width: 431px) { .ton-wallet-actions { grid-template-columns: 1fr auto; } }
`);
