import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

patchFile('src/types.ts', (source) => {
  let next = source;
  next = next.replace('  desiredThemeId: ThemeId;\n  vibe: string;', '  desiredThemeId: ThemeId;\n  desiredPlatformId: PlatformId;\n  vibe: string;');
  return next;
});

patchFile('src/gameLogic.ts', (source) => {
  let next = source;

  next = next.replace(
    "    desiredThemeId: 'cyberpunk',\n    vibe: 'Ждут быстрые, яркие игры с понятным вау-моментом.',",
    "    desiredThemeId: 'cyberpunk',\n    desiredPlatformId: 'micro_pc',\n    vibe: 'Ждут быстрые, яркие игры с понятным вау-моментом.',",
  );

  next = next.replace(
    '    durationSeconds: clamp(Number(project.durationSeconds) || 180, 20, 900),',
    '    durationSeconds: clamp(Number(project.durationSeconds) || 180, 5, 7200),',
  );

  next = next.replace(
    /function normalizeAudience\(value: unknown, stateMonth: number\): AudienceState \{[\s\S]*?\n\}\n\n\nfunction normalizeMarketEvent/,
    `function normalizeAudience(value: unknown, stateMonth: number): AudienceState {
  const raw = value && typeof value === 'object' ? value as Partial<AudienceState> : {};
  const genre = raw.desiredGenreId && genres.some((item) => item.id === raw.desiredGenreId) ? raw.desiredGenreId : 'arcade';
  const theme = raw.desiredThemeId && themes.some((item) => item.id === raw.desiredThemeId) ? raw.desiredThemeId : 'cyberpunk';
  const platform = raw.desiredPlatformId && platforms.some((item) => item.id === raw.desiredPlatformId) ? raw.desiredPlatformId : 'micro_pc';
  return {
    mood: clamp(Number.isFinite(Number(raw.mood)) ? Number(raw.mood) : 0.66, 0.1, 1),
    desiredGenreId: genre,
    desiredThemeId: theme,
    desiredPlatformId: platform,
    vibe: String(raw.vibe || 'Ждут быстрые, яркие игры с понятным вау-моментом.').slice(0, 140),
    lastUpdatedMonth: Math.max(0, Math.floor(Number.isFinite(Number(raw.lastUpdatedMonth)) ? Number(raw.lastUpdatedMonth) : stateMonth)),
    revealedUntilMonth: Math.floor(Number.isFinite(Number(raw.revealedUntilMonth)) ? Number(raw.revealedUntilMonth) : -1),
    learnedFrom: safeArray<string>(raw.learnedFrom).slice(0, 4).map((item) => String(item).slice(0, 32)),
  };
}


function normalizeMarketEvent`,
  );

  next = next.replace(
    "    durationSeconds: isTutorial ? 30 : 180,",
    "    durationSeconds: isTutorial ? 5 : 30,",
  );

  next = next.replace(
    /export function estimateProjectDuration\(project: Project, state: GameState\) \{[\s\S]*?\n\}\n\nexport function estimateDevelopmentCost/,
    `export function projectDurationSecondsForReleaseCount(gamesReleased: number) {
  const releaseNumber = Math.max(1, Math.floor(gamesReleased) + 1);
  if (releaseNumber === 1) return 5;
  if (releaseNumber === 2) return 30;
  if (releaseNumber === 3) return 60;
  const steps = [180, 300, 600, 900, 1800, 2700, 3600, 5400, 7200];
  return steps[Math.min(steps.length - 1, releaseNumber - 4)] ?? 7200;
}

export function estimateProjectDuration(project: Project, state: GameState) {
  return projectDurationSecondsForReleaseCount(state.gamesReleased);
}

export function estimateDevelopmentCost`,
  );

  next = next.replace(
    /function updateAudience\(state: GameState, newMonth: number\): AudienceState \{[\s\S]*?\n\}\n\n\nfunction makeMarketEvent/,
    `function updateAudience(state: GameState, newMonth: number): AudienceState {
  const recent = state.releaseHistory.slice(-8);
  const top = [...recent].sort((a, b) => b.score - a.score)[0];
  // Интересы месяца берутся из полного каталога игры, а не из открытого контента игрока.
  // Индексы детерминированы от игрового месяца, поэтому у всех игроков с одним месяцем одинаковые интересы аудитории.
  const desiredGenreId = genres[seededIndex(newMonth, genres.length, 7)]?.id ?? 'arcade';
  const desiredThemeId = themes[seededIndex(newMonth, themes.length, 19)]?.id ?? 'cyberpunk';
  const desiredPlatformId = platforms[seededIndex(newMonth, platforms.length, 31)]?.id ?? 'micro_pc';
  const avgScore = recent.length ? recent.reduce((acc, item) => acc + item.score, 0) / recent.length : 6.4;
  const marketMood = state.activeMarketEvents.reduce((acc, event) => acc + (event.tone === 'positive' ? 0.03 : -0.04), 0);
  const mood = clamp(0.31 + avgScore / 17 + marketMood + Math.random() * 0.16 - 0.08, 0.1, 1);
  const genre = genres.find((item) => item.id === desiredGenreId)?.name ?? 'Аркада';
  const theme = themes.find((item) => item.id === desiredThemeId)?.name ?? 'Киберпанк';
  const platform = platforms.find((item) => item.id === desiredPlatformId)?.name ?? 'Микро-ПК';
  const vibe = mood >= 0.75
    ? \`Глобальная аудитория в хайпе: просит \${genre}, сеттинг «\${theme}» и платформу \${platform}.\`
    : mood >= 0.48
      ? \`Глобальный спрос ровный: хотят \${genre} + «\${theme}» на \${platform}, но ждут качества.\`
      : \`Глобальная аудитория устала от однотипных релизов: \${genre} + «\${theme}» на \${platform} может вернуть интерес.\`;
  return {
    mood,
    desiredGenreId,
    desiredThemeId,
    desiredPlatformId,
    vibe,
    lastUpdatedMonth: newMonth,
    revealedUntilMonth: state.audience.revealedUntilMonth,
    learnedFrom: top ? [top.title, ...state.audience.learnedFrom.filter((item) => item !== top.title)].slice(0, 4) : state.audience.learnedFrom,
  };
}


function makeMarketEvent`,
  );

  next = next.replace(
    '      devEventQueue: makeDevelopmentEventQueue(project.isTutorial),',
    '      devEventQueue: makeDevelopmentEventQueue(current.gamesReleased),',
  );

  next = next.replace(
    /function makeDevelopmentEventQueue\(isTutorial: boolean\): ScheduledDevEvent\[] \{[\s\S]*?\n\}\n\nexport function getDevelopmentScenario/,
    `function developmentEventCountForReleaseCount(gamesReleased: number) {
  const releaseNumber = Math.max(1, Math.floor(gamesReleased) + 1);
  if (releaseNumber === 1) return 0;
  if (releaseNumber === 2) return 1;
  if (releaseNumber === 3) return 3;
  if (releaseNumber <= 5) return 2;
  if (releaseNumber <= 7) return 3;
  if (releaseNumber <= 9) return 4;
  return randomInt(1, 5);
}

function makeDevelopmentEventQueue(gamesReleased: number): ScheduledDevEvent[] {
  const count = developmentEventCountForReleaseCount(gamesReleased);
  if (count <= 0) return [];
  // Fisher-Yates shuffle avoids the infinite-loop risk of rejection sampling.
  const indices = developmentEventScenarios.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
  }
  const queue: ScheduledDevEvent[] = [];
  const safeCount = Math.min(count, indices.length);
  for (let index = 0; index < safeCount; index += 1) {
    const min = 16 + Math.floor((index * 70) / safeCount);
    const max = Math.min(90, min + Math.max(10, Math.floor(58 / safeCount)));
    const progressAt = clamp(randomInt(min, max), 12, 92);
    queue.push({ instanceId: nowId(), scenarioId: developmentEventScenarios[indices[index]].id, progressAt, triggered: false });
  }
  return queue.sort((a, b) => a.progressAt - b.progressAt);
}

export function getDevelopmentScenario`,
  );

  next = next.replace(
    /function audienceDemandMultiplier\(state: GameState, genre: GenreId, theme: ThemeId\) \{[\s\S]*?\n\}\n\nfunction audienceScoreModifier/,
    `function audienceDemandMultiplier(state: GameState, genre: GenreId, theme: ThemeId, platform: PlatformId) {
  const genreHit = state.audience.desiredGenreId === genre;
  const themeHit = state.audience.desiredThemeId === theme;
  const platformHit = state.audience.desiredPlatformId === platform;
  const matchBonus = (genreHit ? 0.34 : -0.13) + (themeHit ? 0.28 : -0.1) + (platformHit ? 0.22 : -0.08);
  const moodSwing = (state.audience.mood - 0.52) * 0.95;
  return clamp(0.92 + moodSwing + matchBonus, 0.48, 1.95);
}

function audienceScoreModifier`,
  );

  next = next.replace(
    /function audienceScoreModifier\(state: GameState, genre: GenreId, theme: ThemeId\) \{[\s\S]*?\n\}\n\nexport function releaseProject/,
    `function audienceScoreModifier(state: GameState, genre: GenreId, theme: ThemeId, platform: PlatformId) {
  const genreHit = state.audience.desiredGenreId === genre;
  const themeHit = state.audience.desiredThemeId === theme;
  const platformHit = state.audience.desiredPlatformId === platform;
  const match = (genreHit ? 0.44 : -0.27) + (themeHit ? 0.36 : -0.22) + (platformHit ? 0.28 : -0.16);
  const mood = (state.audience.mood - 0.55) * 1.15;
  return clamp(match + mood, -1.35, 1.25);
}

export function releaseProject`,
  );

  next = next.replace(
    '  const audienceScore = audienceScoreModifier(current, project.genre, project.theme);',
    '  const audienceScore = audienceScoreModifier(current, project.genre, project.theme, project.platform);',
  );
  next = next.replace(
    '  const demand = audienceDemandMultiplier(current, project.genre, project.theme);',
    '  const demand = audienceDemandMultiplier(current, project.genre, project.theme, project.platform);',
  );

  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;
  next = next.replace('<div><p className="eyebrow">Желания месяца</p><h3>Рекомендация аудитории</h3></div>', '<div><p className="eyebrow">Желания месяца</p><h3>Интересы аудитории</h3></div>');
  next = next.replace('const theme = themes.find((item) => item.id === state.audience.desiredThemeId);', 'const theme = themes.find((item) => item.id === state.audience.desiredThemeId);\n  const platform = platforms.find((item) => item.id === state.audience.desiredPlatformId);');
  next = next.replace('<div className="insight-tags"><span>{genre?.emoji} Жанр: {genre?.name}</span><span>{theme?.emoji} Сеттинг: {theme?.name}</span></div>', '<div className="insight-tags"><span>{genre?.emoji} Жанр: {genre?.name}</span><span>{theme?.emoji} Сеттинг: {theme?.name}</span><span>{platform?.emoji} Платформа: {platform?.name}</span></div>');
  next = next.replace('Скан показывает только текущие желания рынка, без подсказок по распределению фокуса.', 'Скан показывает текущие интересы рынка: жанр, сеттинг и платформу.');
  next = next.replace('Желания месяца скрыты. Скан откроет только рекомендуемые жанр и сеттинг.', 'Интересы аудитории скрыты. Скан откроет жанр, сеттинг и платформу, которые сейчас сильнее интересуют игроков.');
  return next;
});
