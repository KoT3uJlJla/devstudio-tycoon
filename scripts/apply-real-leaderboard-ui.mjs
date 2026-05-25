import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, fn) {
  const src = readFileSync(path, 'utf8');
  const out = fn(src);
  if (out !== src) writeFileSync(path, out);
}

function replaceExportedFunction(source, name, beforeNextExport, replacement) {
  const start = source.indexOf(`export function ${name}(`);
  const end = source.indexOf(beforeNextExport, start);
  if (start === -1 || end === -1) throw new Error(`apply-real-leaderboard-ui: failed to find ${name}`);
  return source.slice(0, start) + replacement + '\n\n' + source.slice(end);
}

const prizeDistributionPatch = [
  'const prizeDistribution = [',
  "  ['900 ⭐', '30%'], ['600 ⭐', '20%'], ['420 ⭐', '14%'], ['300 ⭐', '10%'], ['240 ⭐', '8%'],",
  "  ['180 ⭐', '6%'], ['135 ⭐', '4.5%'], ['105 ⭐', '3.5%'], ['75 ⭐', '2.5%'], ['45 ⭐', '1.5%'],",
  '] as const;',
].join('\n');

const compactDayBadge = [
  '          <span className="badge kaboom date-badge compact-date-badge">',
  '            <span>День {displayGameDay(state.gameDay)}</span>',
  "            <span className=\"day-dial\" style={{ '--day-progress': `${dayPercent}%` } as CSSProperties}>",
  '              <b>{secondsLeft}</b>',
  '              <small>сек</small>',
  '            </span>',
  '          </span>',
].join('\n');

const estimateProjectDurationPatch = [
  'export function estimateProjectDuration(project: Project, state: GameState) {',
  '  const releaseNumber = Math.max(1, Math.floor(Number(state.gamesReleased) || 0) + 1);',
  '  if (releaseNumber <= 1) return 5;',
  '  if (releaseNumber === 2) return 30;',
  '  if (releaseNumber === 3) return 60;',
  '  const maxDurationSeconds = Math.round((20 * GAME_DAY_MS) / 1000);',
  '  const genre = genres.find((item) => item.id === project.genre);',
  '  const platform = platforms.find((item) => item.id === project.platform) ?? platforms[0];',
  '  const difficulty = genre?.difficulty ?? 1;',
  '  const baseSeconds = 130 + difficulty * 52 + platform.techComplexity * 28;',
  '  const releaseSteps = [180, 300, 600, 900, 1200, maxDurationSeconds];',
  '  const releaseTarget = releaseSteps[Math.min(releaseSteps.length - 1, releaseNumber - 4)] ?? maxDurationSeconds;',
  '  return Math.round(clamp(Math.max(baseSeconds, releaseTarget), 120, maxDurationSeconds));',
  '}',
].join('\n');

const helpers = `
type RealLeaderboardRow = {
  place?: number;
  telegramId?: string;
  displayName?: string;
  bestTitle?: string;
  score?: number;
  prize?: readonly [string, string] | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? '';

function displayGameDay(day: number) {
  const safeDay = Math.max(1, Math.floor(Number(day) || 1));
  return ((safeDay - 1) % 30) + 1;
}

function currentTelegramId() {
  const webApp = window.Telegram?.WebApp as unknown as { initDataUnsafe?: { user?: { id?: number | string } } } | undefined;
  const id = webApp?.initDataUnsafe?.user?.id;
  return id === undefined || id === null ? '' : String(id);
}

async function fetchRealLeaderboard(): Promise<RealLeaderboardRow[]> {
  const initData = window.Telegram?.WebApp?.initData || '';
  if (!API_URL || !initData) return [];
  try {
    const response = await fetch(\`\${API_URL}/api/economy\`, { headers: { Authorization: \`tma \${initData}\` } });
    const payload = await response.json().catch(() => null) as { leaderboard?: RealLeaderboardRow[] } | null;
    const rows = Array.isArray(payload?.leaderboard) ? payload.leaderboard : [];
    const seen = new Set<string>();
    return rows
      .filter((row) => row && Number.isFinite(Number(row.score)))
      .filter((row) => {
        const key = String(row.telegramId || row.displayName || row.bestTitle || '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10)
      .map((row, index) => ({ ...row, place: index + 1, score: Number(row.score || 0), prize: prizeDistribution[index] ?? null }));
  } catch {
    return [];
  }
}
`;

const ratingScreen = `function RatingScreen({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const rating = weeklyRatingBreakdown(state);
  const [leaderboard, setLeaderboard] = useState<RealLeaderboardRow[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const myTelegramId = currentTelegramId();

  useEffect(() => {
    let cancelled = false;
    setLeaderboardLoaded(false);
    fetchRealLeaderboard().then((rows) => {
      if (cancelled) return;
      setLeaderboard(rows);
      setLeaderboardLoaded(true);
    });
    return () => { cancelled = true; };
  }, [state.gamesReleased, state.latestRelease?.createdAt]);

  const yourIndex = leaderboard.findIndex((row) => myTelegramId && String(row.telegramId) === myTelegramId);
  const yourPlace = yourIndex >= 0 ? yourIndex + 1 : null;
  const currentPrize = yourIndex >= 0 ? prizeDistribution[yourIndex]?.[0] : null;
  const directRefs = state.qualifiedReferrals ?? 0;
  const secondRefs = state.qualifiedSecondLevelReferrals ?? 0;
  const claimMilestone = (id: string) => update((current) => {
    const milestone = REFERRAL_MILESTONES.find((item) => item.id === id);
    if (!milestone || current.referralMilestoneClaims?.[id] || (current.qualifiedReferrals ?? 0) < milestone.target) return current;
    haptic('success');
    return {
      ...current,
      coins: current.coins + milestone.reward.coins,
      rp: current.rp + milestone.reward.rp,
      referralMilestoneClaims: { ...(current.referralMilestoneClaims ?? {}), [id]: true },
    };
  });
  return <div className="stack">
    <section className="rating-hero comic-panel"><p className="eyebrow">Недельный топ-10</p><h2>Рейтинг лучших игр за неделю</h2><p className="muted">В топ попадают только проверенные релизы недели. Один игрок может занимать только одну позицию.</p></section>
    <div className="panel comic-card current-prize-card"><div><p className="eyebrow">Текущая награда</p><h3>{yourPlace ? \`Ты на #\${yourPlace}\` : 'Пока вне топ-10'}</h3><p className="muted">{currentPrize ? \`Если неделя закончится сейчас, твоя награда — \${currentPrize}.\` : 'Выпусти сильный релиз, чтобы попасть в призовую десятку.'}</p></div><strong>{currentPrize ?? '0 ⭐'}</strong></div>
    <section className="panel comic-card rating-formula"><div className="section-head compact"><h3>Как считается рейтинг</h3><span className="pill">{money(rating.total)}</span></div><p className="muted">Формула ниже показывает ориентир по твоей студии. Призовой топ считается только по проверенным релизам.</p><div className="score-breakdown-list">{rating.items.map(([label, value]) => <div className={value >= 0 ? 'score-line bonus' : 'score-line penalty'} key={label}><span>{label}</span><b>{value >= 0 ? '+' : ''}{money(value)}</b></div>)}</div></section>
    <div className="panel comic-card"><div className="section-head compact"><h3>Призовой фонд 3000 ⭐</h3><span className="pill">топ-10</span></div><div className="prize-grid">{prizeDistribution.map(([amount, percent], index) => <div className={yourIndex === index ? 'prize-cell current' : 'prize-cell'} key={\`\${amount}-\${index}\`}><span>#{index + 1}</span><strong>{amount}</strong><em>{percent}</em></div>)}</div></div>
    <div className="panel comic-card"><h3>Лучшие игры недели</h3>{leaderboardLoaded && leaderboard.length === 0 ? <p className="muted">Реальных релизов в рейтинге пока нет. Первые строки появятся после проверенных релизов.</p> : null}{!leaderboardLoaded ? <p className="muted">Загружаем рейтинг…</p> : null}{leaderboard.map((row, index) => { const isYou = myTelegramId && String(row.telegramId) === myTelegramId; return <div className={isYou ? 'leader-row you' : 'leader-row'} key={row.telegramId || row.displayName || index}><span>#{index + 1}</span><div><strong>{row.bestTitle || 'Релиз'}</strong><p>{isYou ? 'Ты' : row.displayName || 'Игрок'}</p></div><b>{money(Number(row.score || 0))}</b></div>; })}</div>
    <section className="panel comic-card referral-panel"><div className="section-head compact"><div><p className="eyebrow">Партнёрская программа</p><h3>2 уровня приглашений</h3></div><span className="pill">доход от друзей</span></div><p className="muted">Приглашай друзей и получай долю от их покупок. В зачёт идут только активные студии: друг должен пройти старт, выпустить игру и получить оценку 6.5 или выше.</p><div className="referral-grid"><article><b>1 уровень</b><strong>{directRefs}</strong><span>10% от покупок приглашённых друзей</span></article><article><b>2 уровень</b><strong>{secondRefs}</strong><span>3% от покупок друзей твоих друзей</span></article></div><div className="referral-note"><strong>Как засчитывается друг</strong><span>Нужен завершённый релиз с оценкой 6.5+ — такие друзья помогают открывать «Продуктовое чутьё» и продвигают тебя к разовым наградам.</span></div><div className="milestone-list">{REFERRAL_MILESTONES.map((item) => { const claimed = Boolean(state.referralMilestoneClaims?.[item.id]); const ready = directRefs >= item.target; return <button key={item.id} className={claimed ? 'milestone claimed' : 'milestone'} disabled={!ready || claimed} onClick={() => claimMilestone(item.id)}><span>{item.label}</span><b>{claimed ? 'Получено' : \`+\${money(item.reward.coins)} 🪙 +\${item.reward.rp} 🧪\`}</b></button>; })}</div></section>
    <button className="primary wide" onClick={() => shareRelease(\`Заходи в DevStudio Tycoon и запускай свои хиты вместе со мной!\`, { url: 'https://t.me/devstudio_bot?start=ref_demo', imageUrl: undefined, storyText: 'DevStudio Tycoon — приглашаю в студию!' })}>Поделиться реферальной ссылкой</button>
  </div>;
}
`;

function replaceRatingScreen(source) {
  const start = source.indexOf('function RatingScreen(');
  const end = source.indexOf('function formatDevChoiceEffect', start);
  if (start === -1 || end === -1) return source;
  return source.slice(0, start) + ratingScreen + '\n\n' + source.slice(end);
}

patch('src/App.tsx', (src) => {
  let s = src;
  if (!s.includes('type RealLeaderboardRow')) {
    s = s.replace('function signedPercent(value: number) {', helpers + '\nfunction signedPercent(value: number) {');
  }
  if (!s.includes('function displayGameDay(day: number)')) {
    s = s.replace('function signedPercent(value: number) {', 'function displayGameDay(day: number) {\n  const safeDay = Math.max(1, Math.floor(Number(day) || 1));\n  return ((safeDay - 1) % 30) + 1;\n}\n\nfunction signedPercent(value: number) {');
  }
  s = s.replace(/const prizeDistribution = \[[\s\S]*?\] as const;/, prizeDistributionPatch);
  s = replaceRatingScreen(s);
  s = s.replace(
    /<span className="badge kaboom date-badge compact-date-badge">[\s\S]*?<span className="day-dial" style=\{\{ '--day-progress': `\$\{dayPercent\}%` \} as CSSProperties\}>[\s\S]*?<\/span>\s*<\/span>/,
    compactDayBadge,
  );
  s = s.replace(
    /<span className="badge kaboom day-badge">[\s\S]*?<span className="day-mini" style=\{\{ '--day-progress': `\$\{dayPercent\}%` \} as CSSProperties\}>[\s\S]*?<\/span>\s*<\/span>/,
    compactDayBadge,
  );
  s = s.replace(
    /<div><p className="eyebrow">Игровое время<\/p><h3>[\s\S]*?<\/h3><p className="small muted">1 игровой день ≈ 72 секунды<\/p><\/div>/,
    '<div><p className="eyebrow">Игровое время</p><h3>День {displayGameDay(state.gameDay)}</h3></div>',
  );
  s = s.replace(
    /<div><p className="eyebrow">Игровое время<\/p><h3>День \{state\.gameDay\}<\/h3><p className="small muted">1 игровой день ≈ 72 секунды<\/p><\/div>/,
    '<div><p className="eyebrow">Игровое время</p><h3>День {displayGameDay(state.gameDay)}</h3></div>',
  );
  s = s.replace(
    /const month = gameMonthLabel\(state\.gameDay\);\s*const stage = state\.closureWarningMonth !== null/,
    'const stage = state.closureWarningMonth !== null',
  );
  s = s.replace(
    /`Зарплата не выплачивается с месяца \$\{state\.unpaidSinceMonth \+ 1\}\. Текущий месяц: \$\{month\}\.`/,
    "'Зарплата не выплачивается уже несколько игровых дней. Верни баланс в плюс, чтобы не потерять команду.'",
  );
  s = s.replaceAll('Топ-5', 'Топ-10').replaceAll('топ-5', 'топ-10');
  s = s.replaceAll('Ок для MVP', 'Ок для старта');
  s = s.replaceAll('Long-tail доход', 'Доход релизов');
  s = s.replaceAll('Желания месяца', 'Интересы аудитории');
  s = s.replaceAll('Рекомендация аудитории', 'Текущий спрос');
  s = s.replaceAll('Скан показывает только текущие желания рынка, без подсказок по распределению фокуса.', 'Скан показывает текущий интерес игроков без подсказок по распределению фокуса.');
  s = s.replaceAll('Желания месяца скрыты. Скан откроет только рекомендуемые жанр и сеттинг.', 'Интересы аудитории скрыты. Скан откроет рекомендуемые жанр и сеттинг.');
  s = s.replaceAll('Все списания проходят через сервер и сразу синхронизируют save/economy.', 'Покупки применяются сразу после успешной оплаты.');
  if (!s.includes('Призовой фонд 3000 ⭐')) throw new Error('apply-real-leaderboard-ui: prize pool text was not patched');
  if (!s.includes('День {displayGameDay(state.gameDay)}')) throw new Error('apply-real-leaderboard-ui: monthly display day was not patched');
  if (s.includes('72 сек/день')) throw new Error('apply-real-leaderboard-ui: redundant day duration text still present');
  if (s.includes('backend-релиз') || s.includes('trusted_releases') || s.includes('save/economy')) throw new Error('apply-real-leaderboard-ui: technical UI copy still present');
  return s;
});

patch('src/gameLogic.ts', (src) => {
  let s = replaceExportedFunction(src, 'estimateProjectDuration', 'export function estimateDevelopmentCost', estimateProjectDurationPatch);
  s = s.replace(
    'durationSeconds: clamp(Number(project.durationSeconds) || 180, 20, 900),',
    'durationSeconds: clamp(Number(project.durationSeconds) || 180, 20, Math.round((20 * GAME_DAY_MS) / 1000)),',
  );
  s = s.replaceAll('Ок для MVP', 'Ок для старта');
  s = s.replaceAll('Long-tail доход', 'Доход релизов');
  s = s.replaceAll('Желания месяца', 'Интересы аудитории');
  s = s.replaceAll('Рекомендация аудитории', 'Текущий спрос');
  return s;
});

patch('src/styles.css', (src) => {
  let s = src.replace(
    /background: conic-gradient\(from [^,]+, rgba\(5,6,13,\.22\) 0 var\(--day-progress\), var\(--cyan\) var\(--day-progress\) 100%\);/g,
    'background: conic-gradient(from 0deg, rgba(5,6,13,.22) 0 var(--day-progress), var(--cyan) var(--day-progress) 100%);',
  );
  if (!s.includes('/* Soft launch polish */')) {
    s += '\n\n/* Soft launch polish */\n.compact-date-badge { gap: 7px; }\n';
  }
  return s;
});

console.log('apply-real-leaderboard-ui: ok');
