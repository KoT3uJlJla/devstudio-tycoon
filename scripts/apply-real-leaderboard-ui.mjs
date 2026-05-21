import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, fn) {
  const src = readFileSync(path, 'utf8');
  const out = fn(src);
  if (out !== src) writeFileSync(path, out);
}

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
      .map((row, index) => ({ ...row, place: index + 1, score: Number(row.score || 0), prize: row.prize ?? prizeDistribution[index] ?? null }));
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
  const currentPrize = yourIndex >= 0 ? leaderboard[yourIndex]?.prize?.[0] ?? prizeDistribution[yourIndex]?.[0] : null;
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
    <section className="rating-hero comic-panel"><p className="eyebrow">Недельный топ-10</p><h2>Рейтинг лучших игр за неделю</h2><p className="muted">В топ попадают только реальные backend-релизы из trusted_releases. Один игрок может занимать только одну позицию.</p></section>
    <div className="panel comic-card current-prize-card"><div><p className="eyebrow">Текущая награда</p><h3>{yourPlace ? \`Ты на #\${yourPlace}\` : 'Пока вне топ-10'}</h3><p className="muted">{currentPrize ? \`Если неделя закончится сейчас, твоя награда — \${currentPrize}.\` : 'Выпусти сильный релиз, чтобы попасть в призовую десятку.'}</p></div><strong>{currentPrize ?? '$0'}</strong></div>
    <section className="panel comic-card rating-formula"><div className="section-head compact"><h3>Как считается рейтинг</h3><span className="pill">{money(rating.total)}</span></div><p className="muted">Локальная формула ниже показывает ориентир по твоей студии. Призовой топ берётся с backend и считается только по проверенным релизам.</p><div className="score-breakdown-list">{rating.items.map(([label, value]) => <div className={value >= 0 ? 'score-line bonus' : 'score-line penalty'} key={label}><span>{label}</span><b>{value >= 0 ? '+' : ''}{money(value)}</b></div>)}</div></section>
    <div className="panel comic-card"><div className="section-head compact"><h3>Призовой фонд $500</h3><span className="pill">только топ-10</span></div><div className="prize-grid">{prizeDistribution.map(([amount, percent], index) => <div className={yourIndex === index ? 'prize-cell current' : 'prize-cell'} key={\`\${amount}-\${index}\`}><span>#{index + 1}</span><strong>{amount}</strong><em>{percent}</em></div>)}</div></div>
    <div className="panel comic-card"><h3>Лучшие игры недели</h3>{leaderboardLoaded && leaderboard.length === 0 ? <p className="muted">Реальных релизов в рейтинге пока нет. Первые строки появятся после проверенных backend-релизов.</p> : null}{!leaderboardLoaded ? <p className="muted">Загружаем реальный рейтинг…</p> : null}{leaderboard.map((row, index) => { const isYou = myTelegramId && String(row.telegramId) === myTelegramId; return <div className={isYou ? 'leader-row you' : 'leader-row'} key={row.telegramId || row.displayName || index}><span>#{index + 1}</span><div><strong>{row.bestTitle || 'Релиз'}</strong><p>{isYou ? 'Ты' : row.displayName || 'Игрок'}</p></div><b>{money(Number(row.score || 0))}</b></div>; })}</div>
    <section className="panel comic-card referral-panel"><div className="section-head compact"><div><p className="eyebrow">Партнёрская программа</p><h3>2 уровня приглашений</h3></div><span className="pill">доход от друзей</span></div><p className="muted">Приглашай друзей и получай долю от их покупок. В зачёт идут только активные студии: друг должен пройти старт, выпустить игру и получить оценку 6.5 или выше.</p><div className="referral-grid"><article><b>1 уровень</b><strong>{directRefs}</strong><span>10% от покупок приглашённых друзей</span></article><article><b>2 уровень</b><strong>{secondRefs}</strong><span>3% от покупок друзей твоих друзей</span></article></div><div className="referral-note"><strong>Как засчитывается друг</strong><span>Нужен завершённый релиз с оценкой 6.5+ — такие друзья помогают открывать «Продуктовое чутьё» и продвигают тебя к разовым наградам.</span></div><div className="milestone-list">{REFERRAL_MILESTONES.map((item) => { const claimed = Boolean(state.referralMilestoneClaims?.[item.id]); const ready = directRefs >= item.target; return <button key={item.id} className={claimed ? 'milestone claimed' : 'milestone'} disabled={!ready || claimed} onClick={() => claimMilestone(item.id)}><span>{item.label}</span><b>{claimed ? 'Получено' : \`+\${money(item.reward.coins)} 🪙 +\${item.reward.rp} 🧪\`}</b></button>; })}</div></section>
    <button className="primary wide" onClick={() => shareRelease(\`Заходи в DevStudio Tycoon и запускай свои хиты вместе со мной!\`, { url: 'https://t.me/devstudio_bot?start=ref_demo', imageUrl: undefined, storyText: 'DevStudio Tycoon — приглашаю в студию!' })}>Поделиться реферальной ссылкой</button>
    <button className="danger wide" onClick={() => { resetGame(); update(() => initialState); }}>Сбросить прогресс</button>
  </div>;
}
`;

patch('src/App.tsx', (src) => {
  let s = src;
  if (!s.includes('type RealLeaderboardRow')) {
    s = s.replace('function signedPercent(value: number) {', helpers + '\nfunction signedPercent(value: number) {');
  }
  s = s.replace(/function RatingScreen\(\{ state, update \}: \{ state: GameState; update: \(fn: \(state: GameState\) => GameState\) => void \}\) \{[\s\S]*?\n\}\n\n\nfunction formatDevChoiceEffect/, ratingScreen + '\n\nfunction formatDevChoiceEffect');
  if (!s.includes('Реальных релизов в рейтинге пока нет')) throw new Error('apply-real-leaderboard-ui: RatingScreen was not patched');
  return s;
});

console.log('apply-real-leaderboard-ui: ok');
