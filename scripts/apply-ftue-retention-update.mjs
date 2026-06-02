import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function insertAfter(source, needle, addition, label) {
  const index = source.indexOf(needle);
  if (index === -1) throw new Error(`ftue-retention: missing ${label}`);
  return source.slice(0, index + needle.length) + addition + source.slice(index + needle.length);
}

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`ftue-retention: missing ${label}`);
  return source.replace(from, to);
}

const appHelpersBlock = `

const FIRST_SESSION_CONTRACT_ID = 'ftue-contract-v1';
const FIRST_SESSION_CONTRACT_REWARD = { coins: 2500, rp: 18 } as const;

type DailyContractDefinition = {
  id: string;
  title: string;
  desc: string;
  target: number;
  reward: { coins: number; rp: number };
  note: string;
  current: (state: GameState) => number;
};

const DAILY_CONTRACTS: DailyContractDefinition[] = [
  { id: 'release', title: 'Контракт дня: релиз', desc: 'Выпусти 1 игру сегодня.', target: 1, reward: { coins: 1200, rp: 12 }, note: 'Хорош для быстрого рывка в недельном рейтинге.', current: (state) => state.dailyGamesReleased },
  { id: 'work', title: 'Контракт дня: решение', desc: 'Прими 1 решение во время разработки.', target: 1, reward: { coins: 900, rp: 10 }, note: 'Подходит, когда хочешь быстро продвинуть проект.', current: (state) => state.dailyWorkTaps },
  { id: 'research', title: 'Контракт дня: рост студии', desc: 'Открой 1 исследование, жанр или сеттинг.', target: 1, reward: { coins: 850, rp: 14 }, note: 'Помогает подготовить сильный следующий релиз.', current: (state) => state.dailyResearchUnlocked },
  { id: 'income', title: 'Контракт дня: доход', desc: 'Получи 1200 монет пассивно от живых релизов.', target: 1200, reward: { coins: 1500, rp: 8 }, note: 'Лучше закрывать после пары живых игр.', current: (state) => state.dailyPassiveIncome },
];

function hashDailyKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function contractForDay(dayKey: string) {
  return DAILY_CONTRACTS[hashDailyKey(dayKey) % DAILY_CONTRACTS.length] ?? DAILY_CONTRACTS[0];
}

function dailyContractClaimKey(contractId: string) {
  return `${todayKey()}:contract:${contractId}`;
}

function nextDayKey() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function activeDailyContract(state: GameState) {
  void state;
  return contractForDay(todayKey());
}

function nextDailyContractPreview() {
  return contractForDay(nextDayKey());
}

function hasFirstSessionUpgrade(state: GameState) {
  const unlockedGenres = state.unlockedGenreIds.filter((id) => !genres.find((item) => item.id === id)?.isBase).length;
  const unlockedThemes = state.unlockedThemeIds.filter((id) => !themes.find((item) => item.id === id)?.isBase).length;
  return state.unlockedResearchIds.length > 0 || unlockedGenres > 0 || unlockedThemes > 0 || state.employees.length > 0 || state.level > 1;
}

function firstSessionContractClaimed(state: GameState) {
  return Boolean(state.studioGoalClaims?.[FIRST_SESSION_CONTRACT_ID]);
}

function firstSessionContractProgress(state: GameState) {
  return {
    firstRelease: state.gamesReleased >= 1,
    upgrade: hasFirstSessionUpgrade(state),
    secondRelease: state.gamesReleased >= 2,
  };
}

function firstSessionContractReady(state: GameState) {
  const progress = firstSessionContractProgress(state);
  return progress.firstRelease && progress.upgrade && progress.secondRelease;
}

function FirstSessionContractBar({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  if (!state.onboardingDone || firstSessionContractClaimed(state)) return null;
  const progress = firstSessionContractProgress(state);
  const steps = [
    ['Первый релиз', progress.firstRelease],
    ['Первое улучшение', progress.upgrade],
    ['Второй релиз', progress.secondRelease],
  ] as const;
  const ready = firstSessionContractReady(state);
  const nextAction = !progress.firstRelease
    ? { label: 'Запустить первый релиз', apply: (current: GameState) => ({ ...current, screen: 'develop', selectedProject: current.selectedProject ?? createProject(false) }) }
    : !progress.upgrade
      ? { label: 'Открыть первое улучшение', apply: (current: GameState) => ({ ...current, screen: 'research' }) }
      : !progress.secondRelease
        ? { label: 'Собрать второй релиз', apply: (current: GameState) => ({ ...current, screen: 'develop', selectedProject: current.selectedProject ?? createProject(false) }) }
        : null;
  const claim = () => update((current) => {
    if (firstSessionContractClaimed(current) || !firstSessionContractReady(current)) return current;
    haptic('success');
    return {
      ...current,
      coins: current.coins + FIRST_SESSION_CONTRACT_REWARD.coins,
      rp: current.rp + FIRST_SESSION_CONTRACT_REWARD.rp,
      studioGoalClaims: { ...(current.studioGoalClaims ?? {}), [FIRST_SESSION_CONTRACT_ID]: true },
    };
  });
  return <section className="first-session-contract comic-card">
    <div className="section-head compact"><div><p className="eyebrow">Контракт первой сессии</p><h3>Дойди до второго релиза</h3></div><span className="pill">+{money(FIRST_SESSION_CONTRACT_REWARD.coins)} 🪙 +{FIRST_SESSION_CONTRACT_REWARD.rp} 🧪</span></div>
    <p className="muted">За первые 5 минут игрок должен увидеть полный цикл студии дважды: релиз, улучшение и новый релиз уже по своей стратегии.</p>
    <div className="contract-steps">{steps.map(([label, done]) => <span key={label} className={done ? 'contract-step done' : 'contract-step'}>{done ? '✅' : '•'} {label}</span>)}</div>
    <div className="inline-actions contract-actions">
      {ready ? <button className="primary" onClick={claim}>Забрать бонус первой сессии</button> : nextAction ? <button className="primary" onClick={() => update(nextAction.apply)}>{nextAction.label}</button> : null}
      <span className="small muted">После второго релиза игрок уже видит, как студия растёт и зачем возвращаться.</span>
    </div>
  </section>;
}

function DailyContractCard({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const contract = activeDailyContract(state);
  const nextContract = nextDailyContractPreview();
  const currentValue = contract.current(state);
  const ready = currentValue >= contract.target;
  const claimKey = dailyContractClaimKey(contract.id);
  const claimed = Boolean(state.dailyTaskClaims[claimKey]);
  const progress = Math.min(100, Math.round((currentValue / contract.target) * 100));
  const claim = () => update((current) => {
    const currentContract = activeDailyContract(current);
    const key = dailyContractClaimKey(currentContract.id);
    if (current.dailyTaskClaims[key] || currentContract.current(current) < currentContract.target) return current;
    haptic('success');
    return {
      ...current,
      coins: current.coins + currentContract.reward.coins,
      rp: current.rp + currentContract.reward.rp,
      dailyTaskClaims: { ...current.dailyTaskClaims, [key]: true },
    };
  });
  return <section className="daily-contract-card comic-card">
    <div className="section-head compact"><div><p className="eyebrow">Контракт дня</p><h3>{contract.title}</h3></div><span className="pill">+{money(contract.reward.coins)} 🪙 +{contract.reward.rp} 🧪</span></div>
    <p>{contract.desc}</p>
    <ProgressBar value={progress} />
    <div className="daily-contract-footer"><span>{claimed ? 'Контракт закрыт' : ready ? 'Можно забирать награду' : `${Math.min(Math.round(currentValue), contract.target)}/${contract.target}`}</span><button className="primary" disabled={!ready || claimed} onClick={claim}>{claimed ? 'Получено' : 'Забрать награду'}</button></div>
    <div className="daily-contract-meta"><small>{contract.note}</small><small>Завтра: {nextContract.title}</small></div>
  </section>;
}
`;

const releaseNudgeBlock = `
            {isFirstSessionPush && (
              <section className="first-session-release-nudge comic-card">
                <p className="eyebrow">Следующий шаг</p>
                <h3>Закрой контракт первой сессии</h3>
                <p>Открой первое улучшение, а потом выпусти ещё одну игру. Так игрок быстрее чувствует рост студии и понимает, зачем возвращаться.</p>
                <button className="primary wide" onClick={() => update((current) => ({ ...current, latestRelease: null, screen: 'research' }))}>Открыть первое улучшение</button>
              </section>
            )}
`;

patchFile('src/gameLogic.ts', (source) => {
  let next = source;
  if (!next.includes('studioGoalClaims: {},')) {
    next = replaceOnce(next, "  dailyTaskClaims: {},\n  weeklyExpenseTotal: 0,", "  dailyTaskClaims: {},\n  studioGoalClaims: {},\n  weeklyExpenseTotal: 0,", 'initial studioGoalClaims');
  }
  if (!next.includes('studioGoalClaims: (() => {')) {
    next = replaceOnce(
      next,
      "    dailyTaskClaims: (() => {\n      const raw = merged.dailyTaskClaims;\n      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};\n      return Object.fromEntries(\n        Object.entries(raw as Record<string, unknown>)\n          .slice(0, 32)\n          .map(([k, v]) => [String(k).slice(0, 64), Boolean(v)]),\n      );\n    })(),\n    dailyPassiveIncome: Math.max(0, Math.floor(Number(merged.dailyPassiveIncome) || 0)),",
      "    dailyTaskClaims: (() => {\n      const raw = merged.dailyTaskClaims;\n      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};\n      return Object.fromEntries(\n        Object.entries(raw as Record<string, unknown>)\n          .slice(0, 32)\n          .map(([k, v]) => [String(k).slice(0, 64), Boolean(v)]),\n      );\n    })(),\n    studioGoalClaims: (() => {\n      const raw = merged.studioGoalClaims;\n      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};\n      return Object.fromEntries(\n        Object.entries(raw as Record<string, unknown>)\n          .slice(0, 32)\n          .map(([k, v]) => [String(k).slice(0, 64), Boolean(v)]),\n      );\n    })(),\n    dailyPassiveIncome: Math.max(0, Math.floor(Number(merged.dailyPassiveIncome) || 0)),",
      'normalize studioGoalClaims',
    );
  }
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;
  if (!next.includes('FIRST_SESSION_CONTRACT_ID')) {
    next = insertAfter(next, "function getTaskKey(id: DailyTaskId) {\n  return `\${todayKey()}:\${id}`;\n}\n", appHelpersBlock, 'App helper insertion');
  }
  if (!next.includes('<FirstSessionContractBar state={state} update={update} />')) {
    next = replaceOnce(next, "\n      <section className=\"screen-card\">", "\n      <FirstSessionContractBar state={state} update={update} />\n      <section className=\"screen-card\">", 'first session bar mount');
  }
  if (!next.includes('<DailyContractCard state={state} update={update} />')) {
    next = replaceOnce(next, "      {dailyReady && <button className=\"daily-card comic-card\" onClick={() => update((current) => ({ ...current, stars: current.stars + 1, coins: current.coins + 500, dailyClaimedAt: todayKey() }))}><span>ЕЖЕДНЕВНЫЙ ВХОД</span> Забрать +1 ⭐ и +500 🪙</button>}\n      <DailyTasks state={state} update={update} />", "      {dailyReady && <button className=\"daily-card comic-card\" onClick={() => update((current) => ({ ...current, stars: current.stars + 1, coins: current.coins + 500, dailyClaimedAt: todayKey() }))}><span>ЕЖЕДНЕВНЫЙ ВХОД</span> Забрать +1 ⭐ и +500 🪙</button>}\n      <DailyContractCard state={state} update={update} />\n      <DailyTasks state={state} update={update} />", 'daily contract mount');
  }
  if (!next.includes('const isFirstSessionPush = state.gamesReleased === 1;')) {
    next = replaceOnce(next, "  const showFinal = step >= result.critics.length + 1;\n  const showMoney = step >= finalStep;", "  const showFinal = step >= result.critics.length + 1;\n  const showMoney = step >= finalStep;\n  const isFirstSessionPush = state.gamesReleased === 1;", 'release modal ftue flag');
  }
  if (!next.includes('first-session-release-nudge')) {
    next = replaceOnce(next, "            <div className=\"life-result\">", `${releaseNudgeBlock}            <div className=\"life-result\">`, 'release modal nudge');
  }
  return next;
});

patchFile('src/styles.css', (source) => {
  let next = source;
  if (!next.includes('/* FTUE retention polish */')) {
    next += `\n\n/* FTUE retention polish */\n.first-session-contract,\n.daily-contract-card,\n.first-session-release-nudge {\n  border: 3px solid rgba(5, 6, 13, .12);\n  box-shadow: 0 10px 0 rgba(0,0,0,.10);\n}\n.first-session-contract {\n  margin: 10px 12px 0;\n  background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(244,255,250,.96));\n}\n.contract-steps {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;\n  margin-top: 10px;\n}\n.contract-step {\n  border-radius: 14px;\n  padding: 9px 10px;\n  background: rgba(5,6,13,.06);\n  font-weight: 800;\n  font-size: 12px;\n}\n.contract-step.done {\n  background: rgba(47, 182, 109, .16);\n}\n.contract-actions {\n  align-items: center;\n  margin-top: 10px;\n}\n.daily-contract-card p {\n  margin: 6px 0 10px;\n}\n.daily-contract-footer,\n.daily-contract-meta {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  margin-top: 10px;\n}\n.daily-contract-meta {\n  color: rgba(5,6,13,.68);\n  font-weight: 700;\n}\n.first-session-release-nudge {\n  margin: 12px 0 0;\n  background: rgba(255, 245, 183, .55);\n}\n@media (max-width: 720px) {\n  .contract-steps {\n    grid-template-columns: 1fr;\n  }\n  .daily-contract-footer,\n  .daily-contract-meta,\n  .contract-actions {\n    flex-direction: column;\n    align-items: stretch;\n  }\n}\n`;
  }
  return next;
});

console.log('apply-ftue-retention-update: ok');
