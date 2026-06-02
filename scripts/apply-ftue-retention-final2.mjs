import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function insertBefore(source, needle, addition, label) {
  const index = source.indexOf(needle);
  if (index === -1) throw new Error(`ftue-retention-final2: missing ${label}`);
  return source.slice(0, index) + addition + source.slice(index);
}

function replaceOnceIfFound(source, from, to) {
  return source.includes(from) ? source.replace(from, to) : source;
}

const helpers = `
const FIRST_SESSION_CONTRACT_ID = 'ftue-contract-v1';
const FIRST_SESSION_CONTRACT_REWARD = { coins: 2500, rp: 18 } as const;
const FTUE_UPGRADE_RP_CLAIM_ID = 'ftue-upgrade-rp-v1';

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
  return todayKey() + ':contract:' + contractId;
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
  return Boolean(state.dailyTaskClaims[FIRST_SESSION_CONTRACT_ID]);
}

function ftueUpgradeRewardClaimed(state: GameState) {
  return Boolean(state.studioGoalClaims?.[FTUE_UPGRADE_RP_CLAIM_ID]);
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

function mergeFtueRewardSave(current: GameState, rawSave: unknown): GameState {
  if (!rawSave || typeof rawSave !== 'object' || Array.isArray(rawSave)) return current;
  const saveData = rawSave as Record<string, unknown>;
  const studioGoalClaims = saveData.studioGoalClaims;
  const dailyTaskClaims = saveData.dailyTaskClaims;
  return {
    ...current,
    ...(Number.isFinite(Number(saveData.coins)) ? { coins: Number(saveData.coins) } : {}),
    ...(Number.isFinite(Number(saveData.rp)) ? { rp: Number(saveData.rp) } : {}),
    ...(Number.isFinite(Number(saveData.lastSavedAt)) ? { lastSavedAt: Number(saveData.lastSavedAt) } : {}),
    ...(studioGoalClaims && typeof studioGoalClaims === 'object' && !Array.isArray(studioGoalClaims)
      ? { studioGoalClaims: Object.fromEntries(Object.entries(studioGoalClaims as Record<string, unknown>).map(([key, value]) => [String(key), Boolean(value)])) }
      : {}),
    ...(dailyTaskClaims && typeof dailyTaskClaims === 'object' && !Array.isArray(dailyTaskClaims)
      ? { dailyTaskClaims: Object.fromEntries(Object.entries(dailyTaskClaims as Record<string, unknown>).map(([key, value]) => [String(key), Boolean(value)])) }
      : {}),
  };
}

async function openFirstUpgradeStep(state: GameState, update: (fn: (state: GameState) => GameState) => void) {
  const nextScreen = { latestRelease: null, screen: 'research' as GameState['screen'] };
  if (ftueUpgradeRewardClaimed(state)) {
    update((current) => ({ ...current, ...nextScreen }));
    return;
  }
  const apiUrl = import.meta.env.VITE_API_URL ?? '';
  const initData = window.Telegram?.WebApp?.initData || '';
  if (apiUrl && initData) {
    try {
      const response = await fetch(`${apiUrl}/api/ftue/upgrade-rp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `tma ${initData}`,
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

function FirstSessionContractBar({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  if (!state.onboardingDone || !state.tutorialDone || state.screen !== 'studio' || firstSessionContractClaimed(state)) return null;
  const progress = firstSessionContractProgress(state);
  const steps = [
    ['Первый релиз', progress.firstRelease],
    ['Первое улучшение', progress.upgrade],
    ['Второй релиз', progress.secondRelease],
  ] as const;
  const ready = firstSessionContractReady(state);
  const nextAction: { label: string; apply: (current: GameState) => GameState } | null = !progress.firstRelease
    ? { label: 'Запустить первый релиз', apply: (current: GameState): GameState => ({ ...current, screen: 'develop' as GameState['screen'], selectedProject: current.selectedProject ?? createProject(false) }) }
    : !progress.upgrade
      ? { label: 'Открыть первое улучшение', apply: (current: GameState): GameState => ({ ...current, screen: 'research' as GameState['screen'] }) }
      : !progress.secondRelease
        ? { label: 'Собрать второй релиз', apply: (current: GameState): GameState => ({ ...current, screen: 'develop' as GameState['screen'], selectedProject: current.selectedProject ?? createProject(false) }) }
        : null;
  const claim = () => update((current) => {
    if (firstSessionContractClaimed(current) || !firstSessionContractReady(current)) return current;
    haptic('success');
    return {
      ...current,
      coins: current.coins + FIRST_SESSION_CONTRACT_REWARD.coins,
      rp: current.rp + FIRST_SESSION_CONTRACT_REWARD.rp,
      dailyTaskClaims: { ...(current.dailyTaskClaims ?? {}), [FIRST_SESSION_CONTRACT_ID]: true },
    };
  });
  const handleNextAction = nextAction?.label === 'Открыть первое улучшение'
    ? () => { void openFirstUpgradeStep(state, update); }
    : nextAction
      ? () => update(nextAction.apply)
      : undefined;
  return <section className="first-session-contract comic-card">
    <div className="section-head compact"><div><p className="eyebrow">Контракт первой сессии</p><h3>Дойди до второго релиза</h3></div><span className="pill">+{money(FIRST_SESSION_CONTRACT_REWARD.coins)} 🪙 +{FIRST_SESSION_CONTRACT_REWARD.rp} 🧪</span></div>
    <p className="muted">За первые 5 минут игрок должен увидеть полный цикл студии дважды: релиз, улучшение и новый релиз уже по своей стратегии.</p>
    <div className="contract-steps">{steps.map(([label, done]) => <span key={label} className={done ? 'contract-step done' : 'contract-step'}>{done ? '✅' : '•'} {label}</span>)}</div>
    <div className="inline-actions contract-actions">
      {ready ? <button className="primary" onClick={claim}>Забрать бонус первой сессии</button> : handleNextAction ? <button className="primary" onClick={handleNextAction}>{nextAction?.label}</button> : null}
      <span className="small muted">После второго релиза игрок уже видит, как студия растёт и зачем возвращаться.</span>
    </div>
  </section>;
}

function DailyContractCard({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  if (!state.tutorialDone || state.screen !== 'studio') return null;
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
    <div className="daily-contract-footer"><span>{claimed ? 'Контракт закрыт' : ready ? 'Можно забирать награду' : String(Math.min(Math.round(currentValue), contract.target)) + '/' + String(contract.target)}</span><button className="primary" disabled={!ready || claimed} onClick={claim}>{claimed ? 'Получено' : 'Забрать награду'}</button></div>
    <div className="daily-contract-meta"><small>{contract.note}</small><small>Завтра: {nextContract.title}</small></div>
  </section>;
}
`;

const releaseNudgeBlock = `
            {isFirstSessionPush && state.tutorialDone && (
              <section className="first-session-release-nudge comic-card">
                <p className="eyebrow">Следующий шаг</p>
                <h3>Закрой контракт первой сессии</h3>
                <p>Открой первое улучшение, а потом выпусти ещё одну игру. Мы единоразово дадим 24 🧪, чтобы можно было сразу взять первое улучшение.</p>
                <button className="primary wide" onClick={() => { void openFirstUpgradeStep(state, update); }}>Открыть первое улучшение</button>
              </section>
            )}
`;

patchFile('src/App.tsx', (source) => {
  let next = source;
  if (!next.includes('FTUE_UPGRADE_RP_CLAIM_ID')) {
    next = insertBefore(next, 'export default function App()', helpers, 'App helper insertion');
  }
  if (!next.includes('<FirstSessionContractBar state={state} update={update} />')) {
    next = replaceOnceIfFound(next, '\n      <section className="screen-card">', '\n      <FirstSessionContractBar state={state} update={update} />\n      <section className="screen-card">');
  }
  if (!next.includes('<DailyContractCard state={state} update={update} />')) {
    next = replaceOnceIfFound(next, '<ActiveGames state={state} />', '<DailyContractCard state={state} update={update} />\n      <ActiveGames state={state} />');
  }
  if (!next.includes('const isFirstSessionPush = state.gamesReleased === 1;')) {
    next = replaceOnceIfFound(next, '  const showFinal = step >= result.critics.length + 1;\n  const showMoney = step >= finalStep;', '  const showFinal = step >= result.critics.length + 1;\n  const showMoney = step >= finalStep;\n  const isFirstSessionPush = state.gamesReleased === 1;');
  }
  if (!next.includes('openFirstUpgradeStep(state, update)')) {
    next = replaceOnceIfFound(next, '            <div className="life-result">', `${releaseNudgeBlock}            <div className="life-result">`);
  }
  if (!next.includes('FirstSessionContractBar') || !next.includes('DailyContractCard')) {
    throw new Error('ftue-retention-final2: critical UI blocks were not inserted');
  }
  return next;
});

patchFile('src/styles.css', (source) => {
  let next = source;
  if (!next.includes('/* FTUE retention polish */')) {
    next += `\n\n/* FTUE retention polish */\n.first-session-contract,\n.daily-contract-card,\n.first-session-release-nudge {\n  border: 2px solid rgba(255, 220, 110, .22);\n  box-shadow: 0 8px 0 rgba(0, 0, 0, .22);\n  color: #f7f7ff !important;\n  opacity: 1;\n  position: relative;\n  z-index: 1;\n}\n.first-session-contract {\n  margin: 10px 12px 0;\n  padding: 14px;\n  background: linear-gradient(180deg, rgba(51, 40, 96, .98), rgba(12, 20, 56, .98));\n}\n.daily-contract-card {\n  margin-bottom: 14px;\n  padding: 14px;\n  background: linear-gradient(180deg, rgba(43, 36, 88, .98), rgba(10, 22, 58, .98));\n}\n.first-session-release-nudge {\n  margin: 12px 0 0;\n  padding: 14px;\n  background: linear-gradient(180deg, rgba(58, 44, 108, .98), rgba(17, 25, 63, .98));\n}\n.first-session-contract h3,\n.daily-contract-card h3,\n.first-session-release-nudge h3 {\n  margin: 0;\n  font-size: 20px;\n  line-height: 1.05;\n  letter-spacing: 0;\n  text-transform: none;\n  color: #ffffff !important;\n}\n.first-session-contract p,\n.daily-contract-card p,\n.first-session-release-nudge p,\n.first-session-contract span,\n.daily-contract-card span,\n.first-session-release-nudge span,\n.first-session-contract small,\n.daily-contract-card small,\n.first-session-release-nudge small {\n  color: inherit;\n}\n.first-session-contract .eyebrow,\n.daily-contract-card .eyebrow,\n.first-session-release-nudge .eyebrow {\n  color: #27d8ff !important;\n}\n.first-session-contract .muted,\n.daily-contract-card .muted,\n.first-session-release-nudge .muted,\n.first-session-contract .small,\n.daily-contract-card .small,\n.first-session-release-nudge .small {\n  color: rgba(244, 244, 255, .84) !important;\n}\n.first-session-contract .pill,\n.daily-contract-card .pill {\n  color: #0a1020 !important;\n}\n.contract-steps {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;\n  margin-top: 10px;\n}\n.contract-step {\n  border-radius: 14px;\n  padding: 9px 10px;\n  background: rgba(255, 255, 255, .08);\n  font-weight: 800;\n  font-size: 12px;\n}\n.contract-step.done {\n  background: rgba(65, 201, 141, .20);\n}\n.contract-actions {\n  align-items: stretch;\n  margin-top: 12px;\n}\n.contract-actions .primary {\n  width: 100%;\n}\n.daily-contract-card p,\n.first-session-release-nudge p {\n  margin: 6px 0 10px;\n}\n.daily-contract-footer,\n.daily-contract-meta {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  margin-top: 10px;\n}\n.daily-contract-meta {\n  color: rgba(244, 244, 255, .76) !important;\n  font-weight: 700;\n}\n@media (max-width: 720px) {\n  .contract-steps {\n    grid-template-columns: 1fr;\n  }\n  .daily-contract-footer,\n  .daily-contract-meta,\n  .contract-actions {\n    flex-direction: column;\n    align-items: stretch;\n  }\n  .first-session-contract h3,\n  .daily-contract-card h3,\n  .first-session-release-nudge h3 {\n    font-size: 18px;\n  }\n}\n`;
  }
  return next;
});

console.log('apply-ftue-retention-final2: ok');
