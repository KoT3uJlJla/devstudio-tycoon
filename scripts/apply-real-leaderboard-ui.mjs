import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, fn) {
  const src = readFileSync(path, 'utf8');
  const out = fn(src);
  if (out !== src) writeFileSync(path, out);
}

function replaceAllLiteral(source, from, to) {
  return source.split(from).join(to);
}

function applyReplacements(source, replacements) {
  return replacements.reduce((next, [from, to]) => replaceAllLiteral(next, from, to), source);
}

function patchLegacyReleaseCompatibility(source) {
  if (source.includes('Compatibility for projects started before recent save/model updates.')) return source;

  const functionStart = source.indexOf('export function releaseProject(state: GameState): GameState {');
  if (functionStart === -1) throw new Error('apply-real-leaderboard-ui: releaseProject function not found');

  const comboLine = '  const combo = comboFor(project.genre, project.theme);';
  const comboStart = source.indexOf(comboLine, functionStart);
  if (comboStart === -1) throw new Error('apply-real-leaderboard-ui: releaseProject combo anchor not found');

  const newHeader = `export function releaseProject(state: GameState): GameState {
  const current = ensureDailyState(advanceGameTime(state, Date.now(), 3));
  const loadedProject = current.selectedProject;
  if (!loadedProject?.startedAt) return current;

  // Compatibility for projects started before recent save/model updates.
  // Some old selectedProject records can reach 100% while missing one of the
  // release fields. Do not trap the player on the completed project screen.
  const releaseGenre: GenreId = loadedProject.genre && genres.some((item) => item.id === loadedProject.genre) ? loadedProject.genre : 'arcade';
  const releaseTheme: ThemeId = loadedProject.theme && themes.some((item) => item.id === loadedProject.theme) ? loadedProject.theme : 'cyberpunk';
  const releasePlatform: PlatformId = loadedProject.platform && platforms.some((item) => item.id === loadedProject.platform) ? loadedProject.platform : 'micro_pc';
  const project = {
    ...loadedProject,
    genre: releaseGenre,
    theme: releaseTheme,
    platform: releasePlatform,
    pendingDevEvent: null,
    progress: Math.max(Number(loadedProject.progress) || 0, 100),
  } as Project & { genre: GenreId; theme: ThemeId; platform: PlatformId };
`;

  return source.slice(0, functionStart) + newHeader + source.slice(comboStart);
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
    <section className="rating-hero comic-panel"><p className="eyebrow">Недельный топ-10</p><h2>Лучшие игры недели</h2><p className="muted">В топ попадают только реальные релизы этой недели. Один игрок может занять только одно место.</p></section>
    <div className="panel comic-card current-prize-card"><div><p className="eyebrow">Текущая награда</p><h3>{yourPlace ? \`Ты на #\${yourPlace}\` : 'Пока вне топ-10'}</h3><p className="muted">{currentPrize ? \`Если неделя закончится сейчас, твоя награда — \${currentPrize}.\` : 'Выпусти сильный релиз, чтобы попасть в призовую десятку.'}</p></div><strong>{currentPrize ?? '$0'}</strong></div>
    <section className="panel comic-card rating-formula"><div className="section-head compact"><h3>Как считается рейтинг</h3><span className="pill">{money(rating.total)}</span></div><p className="muted">Ниже — ориентир по твоей студии. Призовой топ считается только по проверенным релизам.</p><div className="score-breakdown-list">{rating.items.map(([label, value]) => <div className={value >= 0 ? 'score-line bonus' : 'score-line penalty'} key={label}><span>{label}</span><b>{value >= 0 ? '+' : ''}{money(value)}</b></div>)}</div></section>
    <div className="panel comic-card"><div className="section-head compact"><h3>Призовой фонд $500</h3><span className="pill">только топ-10</span></div><div className="prize-grid">{prizeDistribution.map(([amount, percent], index) => <div className={yourIndex === index ? 'prize-cell current' : 'prize-cell'} key={\`\${amount}-\${index}\`}><span>#{index + 1}</span><strong>{amount}</strong><em>{percent}</em></div>)}</div></div>
    <div className="panel comic-card"><h3>Рейтинг недели</h3>{leaderboardLoaded && leaderboard.length === 0 ? <p className="muted">В рейтинге пока нет проверенных релизов. Первые строки появятся после новых выпусков.</p> : null}{!leaderboardLoaded ? <p className="muted">Загружаем рейтинг…</p> : null}{leaderboard.map((row, index) => { const isYou = myTelegramId && String(row.telegramId) === myTelegramId; return <div className={isYou ? 'leader-row you' : 'leader-row'} key={row.telegramId || row.displayName || index}><span>#{index + 1}</span><div><strong>{row.bestTitle || 'Релиз'}</strong><p>{isYou ? 'Ты' : row.displayName || 'Игрок'}</p></div><b>{money(Number(row.score || 0))}</b></div>; })}</div>
    <section className="panel comic-card referral-panel"><div className="section-head compact"><div><p className="eyebrow">Партнёрская программа</p><h3>2 уровня приглашений</h3></div><span className="pill">доход от друзей</span></div><p className="muted">Приглашай друзей и получай долю от их покупок. В зачёт идут активные студии: друг должен пройти старт, выпустить игру и получить оценку 6.5 или выше.</p><div className="referral-grid"><article><b>1 уровень</b><strong>{directRefs}</strong><span>10% от покупок приглашённых друзей</span></article><article><b>2 уровень</b><strong>{secondRefs}</strong><span>3% от покупок друзей твоих друзей</span></article></div><div className="referral-note"><strong>Как засчитывается друг</strong><span>Нужен завершённый релиз с оценкой 6.5+ — такие друзья помогают открывать «Продуктовое чутьё» и продвигают тебя к разовым наградам.</span></div><div className="milestone-list">{REFERRAL_MILESTONES.map((item) => { const claimed = Boolean(state.referralMilestoneClaims?.[item.id]); const ready = directRefs >= item.target; return <button key={item.id} className={claimed ? 'milestone claimed' : 'milestone'} disabled={!ready || claimed} onClick={() => claimMilestone(item.id)}><span>{item.label}</span><b>{claimed ? 'Получено' : \`+\${money(item.reward.coins)} 🪙 +\${item.reward.rp} 🧪\`}</b></button>; })}</div></section>
    <button className="primary wide" onClick={() => shareRelease(\`Заходи в DevStudio Tycoon и запускай свои хиты вместе со мной!\`, { url: 'https://t.me/devstudio_bot?start=ref_demo', imageUrl: undefined, storyText: 'DevStudio Tycoon — приглашаю в студию!' })}>Поделиться ссылкой</button>
  </div>;
}
`;

function replaceRatingScreen(source) {
  const start = source.indexOf('function RatingScreen(');
  const end = source.indexOf('function formatDevChoiceEffect', start);
  if (start === -1 || end === -1) return source;
  return source.slice(0, start) + ratingScreen + '\n\n' + source.slice(end);
}

function polishAppCopy(source) {
  return applyReplacements(source, [
    ['OFFLINE DROP', 'СТУДИЯ РАБОТАЛА'],
    ['Забери награды за активность', 'Забирай награды за активность'],
    ['сброс раз в 24 ч', 'обновляется раз в 24 ч'],
    ['Срок жизни игр', 'Активные релизы'],
    ['После релиза игры будут жить 5–30 игровых дней, приносить пассивный доход и ловить события популярности.', 'После выпуска игры живут 5–30 игровых дней, приносят пассивный доход и получают события популярности.'],
    ['Живые релизы', 'Активные релизы'],
    ['След. списание', 'Следующее списание'],
    ['Расход/нед.', 'Расход в неделю'],
    ['Ур. {state.level}/4 · слоты команды {slots}', 'Уровень {state.level}/4 · места в команде {slots}'],
    ['долгий рост', 'рост студии'],
    ['Прокачка покупается за монеты. Последний уровень рассчитан как долгий F2P-рубеж: без доната путь должен занимать около 30 реальных дней активного возврата.', 'Прокачка покупается за монеты. Последний уровень — долгий рубеж для активной игры: путь до него должен занимать около 30 дней без обязательных покупок.'],
    ['F2P', 'бесплатной игры'],
    ['доната', 'обязательных покупок'],
    ['донат', 'обязательные покупки'],
    ['Улучшить до ур. {state.level + 1}', 'Улучшить до уровня {state.level + 1}'],
    ['платный скан', 'скан рынка'],
    ['Скан показывает только текущие желания рынка, без подсказок по распределению фокуса.', 'Скан показывает текущий спрос рынка, но не раскрывает лучший фокус разработки.'],
    ['Желания месяца скрыты. Скан откроет только рекомендуемые жанр и сеттинг.', 'Желания месяца скрыты. Скан покажет рекомендуемые жанр и сеттинг.'],
    ['Long-tail доход', 'Доход релизов'],
    ['Получить 1000 монет пассивно от выпущенных игр.', 'Получи 1000 монет пассивного дохода от выпущенных игр.'],
    ['Туториал 30 сек', 'Быстрый старт'],
    ['Исследуй «Продуктовое чутьё», чтобы видеть комбо и фокус.', 'Открой «Продуктовое чутьё», чтобы видеть удачные связки и фокус.'],
    ['Лимит долга: -50 000 🪙', 'Достигнут лимит долга: -50 000 🪙'],
    ['Ускорить на 1ч ⭐25', 'Ускорить на 1 ч ⭐25'],
    ['Релизнуть игру', 'Выпустить игру'],
    ['<span>Тех</span>', '<span>Технологии</span>'],
    ['🔒 Комбо и фокус скрыты', '🔒 Подсказки закрыты'],
    ['Открой исследование «Продуктовое чутьё», чтобы видеть сочетания жанра/сеттинга и короткие приоритеты без точных процентов.', 'Открой исследование «Продуктовое чутьё», чтобы видеть удачные связки жанра и сеттинга, а также короткие приоритеты по фокусу.'],
    ['100% на фазу', 'распредели 100%'],
    ['🔒 Найм закрыт на ур. 1', '🔒 Найм откроется на уровне 2'],
    ['Прокачай студию до ур. 2 за монеты, чтобы открыть первые 3 места в команде.', 'Прокачай студию до уровня 2, чтобы открыть первые 3 места в команде.'],
    ['ур. {employee.level}', 'уровень {employee.level}'],
    ['Обновить кандидатов ⭐10', 'Обновить список ⭐10'],
    ['недостаточно ⭐', 'не хватает ⭐'],
    ['Премиальный навык', 'Ключевой навык'],
    ['Комбо и фокус открыты', 'Подсказки открыты'],
    ['Новый случайный жанр', 'Открыть случайный жанр'],
    ['Новый случайный сеттинг', 'Открыть случайный сеттинг'],
    ['Сначала нужно предыдущее исследование.', 'Сначала открой предыдущее исследование.'],
    ['5000 монет, 50 очков науки и офлайн-буст на 24 ч', '5000 монет, 50 очков исследований и доход вне игры на 24 ч'],
    ['Здесь можно обменять Звёзды на усиления для студии. Пропуск времени доступен только во время активной разработки.', 'Здесь можно обменять Звёзды на усиления для студии. Ускорение времени доступно только во время активной разработки.'],
    ['Позволяет выбрать новое имя для студии.', 'Можно выбрать новое имя для студии.'],
    ['Средняя оценка изданий', 'Средняя оценка прессы'],
    ['Итоговая оценка игры считается отдельно и учитывает модификаторы ниже.', 'Итоговая оценка игры считается отдельно и учитывает факторы ниже.'],
    ['Карточки изданий выше — это отдельные оценки прессы. Итоговая оценка релиза не равна их среднему арифметическому: она считается из базового качества проекта и модификаторов ниже.', 'Оценки прессы — отдельный взгляд. Итог релиза считается из качества проекта и факторов ниже.'],
    ['Прогноз пассивного дохода', 'Прогноз дохода'],
    ['читают билд', 'готовят обзор'],
    ['жанров/сеттингов', 'жанров и сеттингов'],
    ['QA-чеклист', 'чеклист тестирования'],
    ['виртуальных пользователей', 'игроков'],
    ['одноразово', 'разово'],
    ['Стартовый набор для быстрого рывка', 'Стартовый набор для рывка'],
    ['+5000 монет, +50 очков науки и приятный буст для уверенного рывка.', '+5000 монет, +50 очков исследований и быстрый старт для студии.'],
    ['Делай игры в стиле графического романа, лови тренды и собирай команду.', 'Выпускай игры, лови тренды и собирай команду мечты.'],
    ['Релизы живут 5–30 дней, зарабатывают пассивно и ловят события популярности.', 'Релизы живут 5–30 дней, приносят доход и получают события популярности.'],
    ['Игроки меняют настроение каждый месяц. Сканируй спрос или рискуй вслепую.', 'Аудитория меняет интересы каждый месяц. Сканируй спрос или рискуй вслепую.'],
    ['Делай хиты и попади в топ', 'Выпускай хиты и попади в топ'],
    ['Это обязательный шаг для новых игроков. Без названия студия не сможет начать работу.', 'Сначала выбери имя — с него начнётся история студии.'],
    ['Начать с 5000 🪙', 'Стартовать с 5000 🪙'],
    ['Мы обновляем игру, чтобы не ломать сохранения и экономику игроков.', 'Мы обновляем игру и бережём сохранения игроков.'],
  ]);
}

patch('src/App.tsx', (src) => {
  let s = src;
  if (!s.includes('type RealLeaderboardRow')) {
    s = s.replace('function signedPercent(value: number) {', helpers + '\nfunction signedPercent(value: number) {');
  }
  s = replaceRatingScreen(s);
  s = polishAppCopy(s);
  if (!s.includes('В рейтинге пока нет проверенных релизов')) throw new Error('apply-real-leaderboard-ui: RatingScreen was not patched');
  const leftovers = ['trusted_releases', 'OFFLINE DROP'].filter((term) => s.includes(term));
  if (leftovers.length) {
    console.warn('apply-real-leaderboard-ui: technical copy leftovers: ' + leftovers.join(', '));
  }
  return s;
});

patch('src/gameLogic.ts', (src) => patchLegacyReleaseCompatibility(applyReplacements(src, [
  ['Long-tail доход', 'Доход релизов'],
  ['Получить 1000 монет пассивно от выпущенных игр.', 'Получи 1000 монет пассивного дохода от выпущенных игр.'],
  ['виртуальных пользователей', 'игроков'],
])));

patch('src/gameData.ts', (src) => applyReplacements(src, [
  ['name: \'Survival\'', 'name: \'Выживание\''],
  ['name: \'MOBA-lite\'', 'name: \'MOBA-лайт\''],
  ['комьюнити', 'сообщество'],
  ['девлоги', 'дневники разработки'],
  ['полиш', 'полировка'],
  ['Бюджетный продакшен', 'Бюджетное производство'],
  ['Панельный полировка', 'Глянцевая полировка'],
  ['+ хайп, -полировка', '+ интерес, -полировка'],
  ['+ техдолг', '+ стабильность'],
  ['+ очки науки', '+ очки исследований'],
]));

console.log('apply-real-leaderboard-ui: ok');
