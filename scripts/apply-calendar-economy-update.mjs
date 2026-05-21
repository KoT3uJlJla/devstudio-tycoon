import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function ensureImportName(source, name) {
  const importRegex = /import \{([\s\S]*?)\} from '\.\/gameLogic';/;
  const match = source.match(importRegex);
  if (!match) throw new Error('calendar-economy: gameLogic import not found');
  const names = match[1].split(',').map((item) => item.trim()).filter(Boolean);
  if (!names.includes(name)) names.push(name);
  const replacement = 'import {\n' + names.map((item) => '  ' + item + ',').join('\n') + "\n} from './gameLogic';";
  return source.replace(importRegex, replacement);
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error('calendar-economy: missing ' + label);
}

patchFile('src/gameLogic.ts', (source) => {
  let next = source;
  if (!next.includes('export function gameDateParts')) {
    const helpers = [
      'export function gameDateParts(day: number) {',
      '  const normalized = Math.max(1, Math.floor(Number(day) || 1));',
      '  const daysPerYear = DAYS_PER_MONTH * 12;',
      '  const year = Math.floor((normalized - 1) / daysPerYear) + 1;',
      '  const dayOfYear = (normalized - 1) % daysPerYear;',
      '  const month = Math.floor(dayOfYear / DAYS_PER_MONTH) + 1;',
      '  const dayOfMonth = (dayOfYear % DAYS_PER_MONTH) + 1;',
      '  return { year, month, day: dayOfMonth };',
      '}',
      '',
      'export function gameDateLabel(day: number) {',
      '  const date = gameDateParts(day);',
      "  return `Год ${date.year} · Месяц ${date.month} · День ${date.day}`;",
      '}',
      '',
    ].join('\n');
    next = next.replace('export function todayKey() {', helpers + 'export function todayKey() {');
  }

  if (!next.includes('const hadOfflineDays = advanced.gameDay > normalized.gameDay;')) {
    next = next.replace(
      "  const idleBoost = researchHas(advanced, 'async-standups') ? 1.2 : 1;\n  const passiveDelta = Math.max(0, advanced.coins - beforeCoins);\n  const studioIdle = advanced.gamesReleased > 0 ? Math.round((90 + advanced.level * 28 + advanced.employees.length * 70) * idleBoost) : 0;",
      "  const idleBoost = researchHas(advanced, 'async-standups') ? 1.2 : 1;\n  const passiveDelta = Math.max(0, advanced.coins - beforeCoins);\n  const hadOfflineDays = advanced.gameDay > normalized.gameDay;\n  const studioIdle = hadOfflineDays && advanced.gamesReleased > 0 ? Math.round((90 + advanced.level * 28 + advanced.employees.length * 70) * idleBoost) : 0;",
    );
  }

  requireContains(next, 'export function gameDateParts', 'game date parts helper');
  requireContains(next, 'const hadOfflineDays = advanced.gameDay > normalized.gameDay;', 'offline reward guard');
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;
  next = ensureImportName(next, 'gameDateParts');

  if (!next.includes('const gameDate = gameDateParts(state.gameDay);')) {
    next = next.replace(
      '  const secondsLeft = Math.max(0, Math.ceil((GAME_DAY_MS - dayElapsed) / 1000));',
      '  const secondsLeft = Math.max(0, Math.ceil((GAME_DAY_MS - dayElapsed) / 1000));\n  const dayRemainingPercent = Math.round(100 - dayPercent);\n  const gameDate = gameDateParts(state.gameDay);',
    );
  }

  next = next.replace(
    /<span className="badge kaboom day-badge">[\s\S]*?<\/span>\s*<\/div>/,
    [
      '<div className="topbar-meta">',
      '          <span className="badge kaboom studio-level-badge">УРОВЕНЬ {state.level}</span>',
      '          <span className="badge kaboom date-badge">',
      '            <span>ГОД {gameDate.year}</span>',
      '            <span>МЕСЯЦ {gameDate.month}</span>',
      '            <span>ДЕНЬ {gameDate.day}</span>',
      "            <span className=\"day-dial\" style={{ '--day-progress': `${dayRemainingPercent}%` } as CSSProperties}><b>{secondsLeft}</b><small>сек</small></span>",
      '          </span>',
      '        </div>',
    ].join('\n'),
  );

  if (!next.includes('const gameDate = gameDateParts(state.gameDay);\n  return (\n    <section className="time-card')) {
    next = next.replace(
      'function GameClock({ state, expenses, nextRentDay }: { state: GameState; expenses: number; nextRentDay: number }) {\n  return (',
      'function GameClock({ state, expenses, nextRentDay }: { state: GameState; expenses: number; nextRentDay: number }) {\n  const gameDate = gameDateParts(state.gameDay);\n  return (',
    );
  }
  next = next.replace(
    '<div><p className="eyebrow">Игровое время</p><h3>Месяц {gameMonthLabel(state.gameDay)} · День {state.gameDay}</h3><p className="small muted">1 игровой день ≈ 72 секунды</p></div>',
    '<div><p className="eyebrow">Игровое время</p><h3>Год {gameDate.year} · Месяц {gameDate.month} · День {gameDate.day}</h3><p className="small muted">1 игровой день ≈ 72 секунды</p></div>',
  );

  requireContains(next, 'studio-level-badge', 'studio level badge');
  requireContains(next, 'day-dial', 'circular day timer');
  requireContains(next, 'gameDateParts(state.gameDay)', 'game date usage');
  return next;
});

patchFile('src/styles.css', (source) => {
  if (source.includes('.day-dial')) return source;
  return source + [
    '',
    '/* Calendar + studio level header */',
    '.topbar-meta {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: flex-end;',
    '  gap: 8px;',
    '  flex-wrap: wrap;',
    '}',
    '.studio-level-badge {',
    '  background: var(--cyan);',
    '  transform: rotate(-3deg);',
    '  white-space: nowrap;',
    '}',
    '.date-badge {',
    '  display: grid;',
    '  grid-template-columns: auto auto auto auto;',
    '  align-items: center;',
    '  gap: 6px;',
    '  padding: 6px 8px;',
    '  transform: rotate(3deg);',
    '}',
    '.date-badge > span:not(.day-dial) {',
    '  white-space: nowrap;',
    '}',
    '.day-dial {',
    '  --day-progress: 100%;',
    '  width: 42px;',
    '  height: 42px;',
    '  border-radius: 50%;',
    '  border: 3px solid var(--ink);',
    '  background: conic-gradient(var(--cyan) var(--day-progress), rgba(5,6,13,.28) 0);',
    '  display: grid;',
    '  place-items: center;',
    '  position: relative;',
    '  box-shadow: inset 0 0 0 3px rgba(255,255,255,.2);',
    '}',
    '.day-dial::after {',
    "  content: '';",
    '  position: absolute;',
    '  inset: 6px;',
    '  border-radius: inherit;',
    '  background: var(--paper);',
    '  border: 2px solid var(--ink);',
    '}',
    '.day-dial b, .day-dial small {',
    '  position: relative;',
    '  z-index: 1;',
    '  line-height: 1;',
    '}',
    '.day-dial b { font-size: 12px; }',
    '.day-dial small { font-size: 8px; margin-top: 12px; position: absolute; }',
    '@media (max-width: 390px) {',
    '  .topbar-meta { justify-content: flex-start; }',
    '  .date-badge { grid-template-columns: auto auto auto; }',
    '  .day-dial { grid-column: 1 / -1; justify-self: end; width: 38px; height: 38px; }',
    '}',
  ].join('\n') + '\n';
});
