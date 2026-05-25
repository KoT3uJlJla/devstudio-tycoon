import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function ensureImport(source, importLine) {
  return source.includes(importLine) ? source : source.replace("import { haptic, initTelegram, shareRelease } from './telegram';\n", "import { haptic, initTelegram, shareRelease } from './telegram';\n" + importLine + '\n');
}

function ensureTypeImport(source, importLine) {
  if (source.includes(importLine)) return source;
  const firstImport = source.indexOf('import ');
  return firstImport === -1 ? importLine + '\n' + source : source.slice(0, firstImport) + importLine + '\n' + source.slice(firstImport);
}

function replaceBetween(source, startNeedle, endNeedle, replacement) {
  const start = source.indexOf(startNeedle);
  if (start === -1) throw new Error('studio-goals-safe: start not found: ' + startNeedle);
  const end = source.indexOf(endNeedle, start);
  if (end === -1 || end <= start) throw new Error('studio-goals-safe: end not found: ' + endNeedle);
  return source.slice(0, start) + replacement.trimEnd() + '\n\n' + source.slice(end);
}

function replaceFunction(source, signature, replacement, beforeNeedle) {
  const start = source.indexOf(signature);
  if (start === -1) return beforeNeedle ? source.replace(beforeNeedle, replacement + beforeNeedle) : source;
  const end = beforeNeedle ? source.indexOf(beforeNeedle, start) : -1;
  if (end === -1 || end <= start) return source;
  return source.slice(0, start) + replacement + source.slice(end);
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error('studio-goals-safe: missing ' + label);
}

patchFile('src/gameLogic.ts', (source) => {
  let next = source;
  if (!next.includes('  studioGoalClaims: {},')) {
    next = next.replace(/(\s+dailyTaskClaims:\s*\{\},\s*\r?\n)/, '$1  studioGoalClaims: {},\n');
  }
  if (!next.includes('studioGoalClaims: (() => {')) {
    const block = [
      '    studioGoalClaims: (() => {',
      '      const raw = (merged as unknown as { studioGoalClaims?: unknown }).studioGoalClaims;',
      "      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};",
      '      return Object.fromEntries(',
      '        Object.entries(raw as Record<string, unknown>)',
      '          .slice(0, 80)',
      '          .map(([k, v]) => [String(k).slice(0, 96), Boolean(v)]),',
      '      );',
      '    })(),',
    ].join('\n');
    next = next.replace(/(\s+dailyPassiveIncome:\s*Math\.max\(0,\s*Math\.floor\(Number\(merged\.dailyPassiveIncome\)\s*\|\|\s*0\)\),)/, block + '\n$1');
  }
  requireContains(next, 'studioGoalClaims: {},', 'initial studio goal claims');
  requireContains(next, 'studioGoalClaims: (() => {', 'normalized studio goal claims');
  return next;
});

patchFile('src/backendClient.ts', (source) => {
  let next = source;
  next = ensureTypeImport(next, "import type { TaskCatalogOverrides } from './taskCatalog';");
  if (!next.includes('const TASK_CONFIG_API_URL =')) {
    next = next.replace(
      "const API_URL = import.meta.env.VITE_API_URL ?? '';",
      "const API_URL = import.meta.env.VITE_API_URL ?? '';\nconst TASK_CONFIG_API_URL = API_URL || 'https://devstudio-tycoon-api.onrender.com';",
    );
  }
  const helper = [
    'export async function fetchTaskConfig(): Promise<TaskCatalogOverrides> {',
    "  return fetch(`${TASK_CONFIG_API_URL}/api/tasks/config?ts=${Date.now()}`, { cache: 'no-store' })",
    '    .then(async (response) => {',
    '      const data = await response.json().catch(() => null) as (BackendStatePayload & { tasksConfig?: TaskCatalogOverrides }) | null;',
    '      return response.ok && data?.ok && data.tasksConfig ? data.tasksConfig : {};',
    '    })',
    '    .catch(() => ({}));',
    '}',
    '',
  ].join('\n');
  next = replaceFunction(next, 'export async function fetchTaskConfig', helper, 'export async function getTonWallet() {');
  requireContains(next, 'TASK_CONFIG_API_URL', 'task config api url');
  requireContains(next, 'export async function fetchTaskConfig', 'task config fetcher');
  return next;
});

const dailyTasksBlock = `function DailyTasks({ state, update, taskOverrides }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; taskOverrides: TaskCatalogOverrides }) {
  const tasks = buildDailyTasks(state, taskOverrides);
  const claim = (task: DailyTaskModel) => update((current) => {
    const key = getTaskKey(task.id);
    if (current.dailyTaskClaims[key] || task.current < task.target) return current;
    haptic('success');
    return applyTaskReward({ ...current, dailyTaskClaims: { ...current.dailyTaskClaims, [key]: true } }, task.reward);
  });
  return (
    <section className="panel daily-tasks comic-card">
      <div className="section-head"><div><p className="eyebrow">Ежедневные задачи</p><h3>Забери награды за активность</h3></div><span className="pill">сброс раз в 24 ч</span></div>
      {tasks.map((task) => {
        const key = getTaskKey(task.id);
        const claimed = Boolean(state.dailyTaskClaims[key]);
        const ready = task.current >= task.target && !claimed;
        const progress = taskProgressPercent(task.current, task.target);
        return <article className="task-card" key={task.id}><div><strong>{task.title}</strong><p>{task.desc}</p><ProgressBar value={progress} /></div><button disabled={!ready} onClick={() => claim(task)}>{claimed ? '✅' : ready ? rewardLabel(task.reward) : Math.min(Math.round(task.current), task.target) + '/' + task.target}</button></article>;
      })}
    </section>
  );
}

function StudioGoals({ state, update, taskOverrides }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; taskOverrides: TaskCatalogOverrides }) {
  const [open, setOpen] = useState(false);
  const goals = buildStudioGoals(state, taskOverrides);
  const visibleGoals = open ? goals : goals.slice(0, 3);
  const completed = goals.filter((goal) => state.studioGoalClaims[goal.id]).length;
  const claim = (goal: StudioGoalModel) => update((current) => {
    if (current.studioGoalClaims[goal.id] || goal.current < goal.target) return current;
    haptic('success');
    return applyTaskReward({ ...current, studioGoalClaims: { ...current.studioGoalClaims, [goal.id]: true } }, goal.reward);
  });
  if (!goals.length) return null;
  return (
    <section className="panel daily-tasks comic-card">
      <div className="section-head"><div><p className="eyebrow">Цели студии</p><h3>Долгий путь инди-команды</h3></div><button className="ghost" type="button" onClick={() => setOpen((value) => !value)}>{open ? 'Свернуть' : 'Показать все'}</button></div>
      {visibleGoals.map((goal) => {
        const claimed = Boolean(state.studioGoalClaims[goal.id]);
        const ready = goal.current >= goal.target && !claimed;
        const progress = taskProgressPercent(goal.current, goal.target);
        return <article className="task-card" key={goal.id}><div><strong>{goal.title}</strong><p>{goal.desc}</p><ProgressBar value={progress} /></div><button disabled={!ready} onClick={() => claim(goal)}>{claimed ? '✅' : ready ? rewardLabel(goal.reward) : Math.min(Math.round(goal.current), goal.target) + '/' + goal.target}</button></article>;
      })}
      <p className="small muted">Готово: {completed}/{goals.length}</p>
    </section>
  );
}`;

const refreshBlock = "  useInterfaceSounds();\n\n  const refreshTaskOverrides = () => fetchTaskConfig().then(setTaskOverrides).catch(() => undefined);\n\n  useEffect(() => {\n    initTelegram();\n    loadGame().then(setState);\n    refreshTaskOverrides();\n    const onVisibility = () => { if (!document.hidden) refreshTaskOverrides(); };\n    document.addEventListener('visibilitychange', onVisibility);\n    const timer = window.setInterval(refreshTaskOverrides, 60000);\n    return () => { document.removeEventListener('visibilitychange', onVisibility); window.clearInterval(timer); };\n  }, []);";

patchFile('src/App.tsx', (source) => {
  let next = source;
  next = ensureImport(next, "import { fetchTaskConfig } from './backendClient';");
  next = ensureImport(next, "import { applyTaskReward, buildDailyTasks, buildStudioGoals, rewardLabel, taskProgressPercent, type DailyTaskModel, type StudioGoalModel, type TaskCatalogOverrides } from './taskCatalog';");
  if (!next.includes('const [taskOverrides, setTaskOverrides] = useState<TaskCatalogOverrides>({});')) {
    next = next.replace("  const [studioNamingMode, setStudioNamingMode] = useState<'initial' | 'rename' | null>(null);", "  const [studioNamingMode, setStudioNamingMode] = useState<'initial' | 'rename' | null>(null);\n  const [taskOverrides, setTaskOverrides] = useState<TaskCatalogOverrides>({});");
  }
  if (!next.includes('const refreshTaskOverrides = () =>')) {
    const before = next;
    next = next.replace(/  useInterfaceSounds\(\);\s*\r?\n\s*useEffect\(\(\) => \{\s*\r?\n\s*initTelegram\(\);\s*\r?\n\s*loadGame\(\)\.then\(setState\);\s*\r?\n\s*\}, \[\]\);/, refreshBlock);
    if (next === before) throw new Error('studio-goals-safe: failed to insert task config refresh');
  }
  next = next.replace("{state.screen === 'studio' && <StudioScreen state={state} onNewProject={startNewProject} update={update} />}", "{state.screen === 'studio' && <StudioScreen state={state} onNewProject={startNewProject} update={update} taskOverrides={taskOverrides} />}");
  next = next.replace('function StudioScreen({ state, onNewProject, update }: { state: GameState; onNewProject: () => void; update: (fn: (state: GameState) => GameState) => void }) {', 'function StudioScreen({ state, onNewProject, update, taskOverrides }: { state: GameState; onNewProject: () => void; update: (fn: (state: GameState) => GameState) => void; taskOverrides: TaskCatalogOverrides }) {');
  next = next.replace('<DailyTasks state={state} update={update} />', '<DailyTasks state={state} update={update} taskOverrides={taskOverrides} />\n      <StudioGoals state={state} update={update} taskOverrides={taskOverrides} />');
  next = replaceBetween(next, 'function DailyTasks(', 'function ActiveGames(', dailyTasksBlock);
  requireContains(next, 'refreshTaskOverrides', 'task config refresh in App');
  requireContains(next, 'taskOverrides={taskOverrides}', 'task overrides props');
  requireContains(next, 'function StudioGoals(', 'studio goals component');
  return next;
});
