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

function requireMatch(source, pattern, label) {
  if (!pattern.test(source)) throw new Error('calendar-economy: missing ' + label);
}

function patchOfflineRewardGuard(source) {
  if (source.includes('const hadOfflineDays = advanced.gameDay > normalized.gameDay;')) return source;

  let next = source.replace(
    /(\s+const passiveDelta = Math\.max\(0, advanced\.coins - beforeCoins\);\s*)\n(\s+const studioIdle = )advanced\.gamesReleased > 0 \? Math\.round\(\(90 \+ advanced\.level \* 28 \+ advanced\.employees\.length \* 70\) \* idleBoost\) : 0;/,
    '$1\n  const hadOfflineDays = advanced.gameDay > normalized.gameDay;\n$2hadOfflineDays && advanced.gamesReleased > 0 ? Math.round((90 + advanced.level * 28 + advanced.employees.length * 70) * idleBoost) : 0;',
  );

  if (next !== source) return next;

  next = source.replace(
    /(\s+const passiveDelta = Math\.max\(0, advanced\.coins - beforeCoins\);)/,
    '$1\n  const hadOfflineDays = advanced.gameDay > normalized.gameDay;',
  );
  next = next.replace(
    /const studioIdle = advanced\.gamesReleased > 0 \? Math\.round\(\(90 \+ advanced\.level \* 28 \+ advanced\.employees\.length \* 70\) \* idleBoost\) : 0;/,
    'const studioIdle = hadOfflineDays && advanced.gamesReleased > 0 ? Math.round((90 + advanced.level * 28 + advanced.employees.length * 70) * idleBoost) : 0;',
  );
  return next;
}

function ensureGameClockDate(source) {
  if (/function GameClock[\s\S]*?const gameDate = gameDateParts\(state\.gameDay\);[\s\S]*?return \(/.test(source)) return source;
  const next = source.replace(
    /(function GameClock\(\{ state, expenses, nextRentDay \}: \{ state: GameState; expenses: number; nextRentDay: number \}\) \{\s*)return \(/,
    '$1const gameDate = gameDateParts(state.gameDay);\n  return (',
  );
  if (next === source) throw new Error('calendar-economy: failed to insert GameClock date');
  return next;
}

function compactTopbarBlock() {
  return [
    '<div className="topbar-meta">',
    '          <span className="badge kaboom studio-level-badge">Lvl: {state.level}</span>',
    '          <span className="badge kaboom date-badge compact-date-badge">',
    '            <span>Г:{topbarDate.year}</span>',
    '            <span>М:{topbarDate.month}</span>',
    '            <span>Д:{topbarDate.day}</span>',
    "            <span className=\"day-dial\" style={{ '--day-progress': `${dayPercent}%` } as CSSProperties}>",
    '              <b>{secondsLeft}</b>',
    '              <small>сек</small>',
    '            </span>',
    '          </span>',
    '        </div>',
    '      </div>',
  ].join('\n');
}

const calendarCss = [
  '/* Calendar + studio level header */',
  '.compact-brand-row {',
  '  display: flex;',
  '  align-items: flex-start;',
  '  justify-content: space-between;',
  '  gap: 10px;',
  '}',
  '.studio-title-block {',
  '  min-width: 0;',
  '  flex: 1 1 auto;',
  '}',
  '.studio-title-block .eyebrow {',
  '  margin-bottom: 3px;',
  '}',
  '.studio-name, .studio-title-block h1 {',
  '  margin: 0;',
  '  max-width: 176px;',
  '  font-size: clamp(28px, 7vw, 42px);',
  '  line-height: .95;',
  '  white-space: nowrap;',
  '  overflow: hidden;',
  '  text-overflow: ellipsis;',
  '}',
  '.topbar-meta {',
  '  display: flex;',
  '  align-items: center;',
  '  justify-content: flex-end;',
  '  gap: 8px;',
  '  flex: 0 0 auto;',
  '  flex-wrap: nowrap;',
  '}',
  '.studio-level-badge {',
  '  background: var(--cyan);',
  '  transform: rotate(-3deg);',
  '  white-space: nowrap;',
  '  padding: 6px 10px;',
  '  min-height: 38px;',
  '}',
  '.compact-date-badge {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: 8px;',
  '  padding: 6px 10px;',
  '  transform: rotate(3deg);',
  '  white-space: nowrap;',
  '}',
  '.compact-date-badge > span:not(.day-dial) {',
  '  white-space: nowrap;',
  '}',
  '.day-dial {',
  '  --day-progress: 0%;',
  '  width: 58px;',
  '  height: 58px;',
  '  border-radius: 50%;',
  '  border: 3px solid var(--ink);',
  '  background: conic-gradient(from -90deg, rgba(5,6,13,.22) 0 var(--day-progress), var(--cyan) var(--day-progress) 100%);',
  '  display: flex;',
  '  flex-direction: column;',
  '  align-items: center;',
  '  justify-content: center;',
  '  position: relative;',
  '  box-shadow: inset 0 0 0 3px rgba(255,255,255,.2);',
  '  flex: 0 0 auto;',
  '}',
  '.day-dial::after {',
  "  content: '';",
  '  position: absolute;',
  '  inset: 7px;',
  '  border-radius: inherit;',
  '  background: var(--paper);',
  '  border: 2px solid var(--ink);',
  '}',
  '.day-dial b, .day-dial small {',
  '  position: relative;',
  '  z-index: 1;',
  '  line-height: 1;',
  '}',
  '.day-dial b {',
  '  font-size: 14px;',
  '  font-weight: 900;',
  '}',
  '.day-dial small {',
  '  font-size: 9px;',
  '  margin-top: 2px;',
  '  position: relative;',
  '}',
  '@media (max-width: 390px) {',
  '  .compact-brand-row { gap: 8px; }',
  '  .studio-name, .studio-title-block h1 {',
  '    max-width: 128px;',
  '    font-size: clamp(24px, 6vw, 34px);',
  '  }',
  '  .topbar-meta { gap: 6px; }',
  '  .studio-level-badge { padding: 5px 8px; }',
  '  .compact-date-badge {',
  '    gap: 6px;',
  '    padding: 5px 8px;',
  '  }',
  '  .day-dial {',
  '    width: 54px;',
  '    height: 54px;',
  '  }',
  '}',
].join('\n');

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

  next = patchOfflineRewardGuard(next);

  requireContains(next, 'export function gameDateParts', 'game date parts helper');
  requireContains(next, 'const hadOfflineDays = advanced.gameDay > normalized.gameDay;', 'offline reward guard');
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;
  next = ensureImportName(next, 'gameDateParts');

  if (!next.includes('const topbarDate = gameDateParts(state.gameDay);')) {
    next = next.replace(
      '  const secondsLeft = Math.max(0, Math.ceil((GAME_DAY_MS - dayElapsed) / 1000));',
      '  const secondsLeft = Math.max(0, Math.ceil((GAME_DAY_MS - dayElapsed) / 1000));\n  const topbarDate = gameDateParts(state.gameDay);',
    );
  }

  next = next.replace(
    /<h1 title=\{state\.studioName \|\| 'Новая студия'\}>\{state\.studioName \|\| 'Новая студия'\}<\/h1>/,
    "<h1 className=\"studio-name\" title={state.studioName || 'Новая студия'}>{state.studioName || 'Новая студия'}</h1>",
  );

  if (next.includes('badge kaboom day-badge')) {
    next = next.replace(
      /<span className="badge kaboom day-badge">[\s\S]*?<\/span>\s*<\/div>/,
      compactTopbarBlock(),
    );
  } else {
    next = next.replace(
      /<div className="topbar-meta">[\s\S]*?<\/span>\s*<\/div>\s*<\/div>/,
      compactTopbarBlock(),
    );
  }

  next = ensureGameClockDate(next);
  next = next.replace(
    '<div><p className="eyebrow">Игровое время</p><h3>Месяц {gameMonthLabel(state.gameDay)} · День {state.gameDay}</h3><p className="small muted">1 игровой день ≈ 72 секунды</p></div>',
    '<div><p className="eyebrow">Игровое время</p><h3>Год {gameDate.year} · Месяц {gameDate.month} · День {gameDate.day}</h3><p className="small muted">1 игровой день ≈ 72 секунды</p></div>',
  );

  requireContains(next, 'studio-name', 'visible studio name');
  requireContains(next, 'studio-level-badge">Lvl:', 'compact studio level badge');
  requireContains(next, 'compact-date-badge', 'compact date badge');
  requireContains(next, 'day-dial', 'circular day timer');
  requireContains(next, 'topbarDate = gameDateParts(state.gameDay)', 'topbar date usage');
  requireMatch(next, /function GameClock[\s\S]*?const gameDate = gameDateParts\(state\.gameDay\);[\s\S]*?<section className="time-card/, 'GameClock date local');
  return next;
});

patchFile('src/styles.css', (source) => {
  const marker = '/* Calendar + studio level header */';
  const markerIndex = source.indexOf(marker);
  const base = markerIndex >= 0 ? source.slice(0, markerIndex).trimEnd() : source.trimEnd();
  return base + '\n\n' + calendarCss + '\n';
});
