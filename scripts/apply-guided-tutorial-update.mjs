import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceBetween(source, startNeedle, endNeedle, replacement) {
  const start = source.indexOf(startNeedle);
  if (start === -1) throw new Error('guided-tutorial: start not found: ' + startNeedle);
  const end = source.indexOf(endNeedle, start);
  if (end === -1 || end <= start) throw new Error('guided-tutorial: end not found: ' + endNeedle);
  return source.slice(0, start) + replacement.trimEnd() + '\n\n' + source.slice(end);
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error('guided-tutorial: missing ' + label);
}

const guidedTutorialBlock = `type TutorialGuideStep = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  target: boolean;
  placement?: 'top' | 'bottom';
  cta?: string;
};

const tutorialGuideCopy = {
  genre: {
    id: 'genre', eyebrow: 'Обучение · 1/5', title: 'Выбери жанр первой игры',
    body: 'Жанр задаёт сложность и ожидания игроков. Для первого релиза подойдёт любой базовый вариант — обучение безопасное.',
    target: true, placement: 'bottom', cta: 'Нажми на любой жанр',
  },
  theme: {
    id: 'theme', eyebrow: 'Обучение · 2/5', title: 'Добавь сеттинг',
    body: 'Сеттинг меняет вкус проекта. Позже «Продуктовое чутьё» покажет лучшие сочетания, а сейчас просто соберём первый релиз.',
    target: true, placement: 'bottom', cta: 'Нажми на любой сеттинг',
  },
  platform: {
    id: 'platform', eyebrow: 'Обучение · 3/5', title: 'Подтверди платформу',
    body: 'Платформа влияет на бюджет и продажи. Микро-ПК — самый спокойный старт, поэтому он уже выбран.',
    target: true, placement: 'bottom', cta: 'Нажми на платформу',
  },
  start: {
    id: 'start', eyebrow: 'Обучение · 4/5', title: 'Запусти разработку',
    body: 'Фокус можно оставить сбалансированным. Главное сейчас — увидеть полный цикл: старт, сборка, релиз и первые деньги.',
    target: true, placement: 'top', cta: 'Нажми «Начать разработку»',
  },
  wait: {
    id: 'wait', eyebrow: 'Сборка идёт', title: 'Команда делает игру',
    body: 'Туториальный проект короткий: обычно он доходит до релиза примерно за полминуты. Потом игра начнёт жить и приносить пассивный доход.',
    target: false, placement: 'top', cta: 'Дождись 100%',
  },
  release: {
    id: 'release', eyebrow: 'Обучение · 5/5', title: 'Выпусти игру',
    body: 'Релиз даёт монеты, науку и запускает срок жизни игры. После этого будет понятнее, зачем возвращаться: живые релизы продолжают зарабатывать.',
    target: true, placement: 'top', cta: 'Нажми «Релизнуть игру»',
  },
  developTab: {
    id: 'develop-tab', eyebrow: 'Вернёмся к игре', title: 'Открой разработку',
    body: 'Первый релиз начинается на экране разработки. Остальные разделы пригодятся после первой игры.',
    target: true, placement: 'bottom', cta: 'Нажми «Разработка»',
  },
} satisfies Record<string, TutorialGuideStep>;

function getTutorialGuideStep(state: GameState): TutorialGuideStep | null {
  if (!state.onboardingDone || state.tutorialDone || state.latestRelease) return null;
  if (!state.studioName.trim()) return null;
  if (state.screen !== 'develop') return tutorialGuideCopy.developTab;
  const project = state.selectedProject;
  if (!project) return tutorialGuideCopy.genre;
  if (!project.startedAt) {
    if (state.tutorialStep <= 0 || !project.genre) return tutorialGuideCopy.genre;
    if (state.tutorialStep <= 1 || !project.theme) return tutorialGuideCopy.theme;
    if (state.tutorialStep <= 2) return tutorialGuideCopy.platform;
    return tutorialGuideCopy.start;
  }
  if (project.progress >= 100) return tutorialGuideCopy.release;
  return tutorialGuideCopy.wait;
}

function GuidedTutorialOverlay({ state, onSkip }: { state: GameState; onSkip: () => void }) {
  const step = getTutorialGuideStep(state);
  if (!step) return null;
  return (
    <div className={step.target ? 'guided-tutorial active' : 'guided-tutorial passive'} aria-live="polite">
      <div className="guided-tutorial-dim" />
      <section className={\`guided-tutorial-card comic-card \${step.placement === 'top' ? 'place-top' : 'place-bottom'}\`}>
        <p className="eyebrow">{step.eyebrow}</p>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="guided-tutorial-footer">
          <span>{step.cta}</span>
          <button className="ghost" type="button" onClick={onSkip}>Пропустить</button>
        </div>
      </section>
    </div>
  );
}

function TutorialBanner({ state, onAction, onSkip }: { state: GameState; onAction: () => void; onSkip: () => void }) {
  void onAction;
  return <GuidedTutorialOverlay state={state} onSkip={onSkip} />;
}`;

const onboardingBlock = `function Onboarding({ update }: { update: (fn: (state: GameState) => GameState) => void }) {
  const [slide, setSlide] = useState(0);
  const slides: Array<[IconName, string, string, string]> = [
    ['rocket', 'Сделаем первую игру за минуту', 'Ты выберешь жанр, сеттинг и платформу, запустишь разработку и выпустишь первый релиз.', 'Показать, куда нажимать'],
    ['clock', 'Зачем возвращаться', 'После релиза игра живёт несколько игровых дней, приносит пассивный доход и может ловить события популярности.', 'Начать обучение'],
  ];
  const current = slides[slide];
  const finish = () => update((currentState) => ({
    ...currentState,
    onboardingDone: true,
    tutorialDone: false,
    tutorialStep: 0,
    screen: 'develop',
    selectedProject: currentState.selectedProject ?? createProject(true),
  }));
  return (
    <div className="modal-backdrop onboarding guided-onboarding">
      <section className="onboarding-card comic-card">
        <div className="onboarding-emoji"><Icon name={current[0]} /></div>
        <p className="eyebrow">Быстрый старт</p>
        <h2>{current[1]}</h2>
        <p>{current[2]}</p>
        <div className="dots">{slides.map((_, index) => <i key={index} className={index === slide ? 'active' : ''} />)}</div>
        <button className="primary wide" onClick={() => { if (slide < slides.length - 1) setSlide(slide + 1); else finish(); }}>{current[3]}</button>
      </section>
    </div>
  );
}`;

const guidedTutorialCss = [
  '/* Guided first-release tutorial */',
  '.guided-tutorial {',
  '  position: fixed;',
  '  inset: 0;',
  '  z-index: 60;',
  '  pointer-events: none;',
  '}',
  '.guided-tutorial.active .guided-tutorial-dim {',
  '  pointer-events: auto;',
  '}',
  '.guided-tutorial.passive .guided-tutorial-dim {',
  '  opacity: .38;',
  '}',
  '.guided-tutorial-dim {',
  '  position: absolute;',
  '  inset: 0;',
  '  background: rgba(5, 6, 13, .68);',
  '  backdrop-filter: blur(2px);',
  '}',
  '.guided-tutorial-card {',
  '  position: fixed;',
  '  left: 12px;',
  '  right: 12px;',
  '  z-index: 95;',
  '  padding: 14px;',
  '  pointer-events: auto;',
  '  box-shadow: 0 18px 0 rgba(0,0,0,.18), 0 0 0 999px rgba(0,0,0,0);',
  '}',
  '.guided-tutorial-card.place-bottom {',
  '  bottom: calc(86px + env(safe-area-inset-bottom));',
  '}',
  '.guided-tutorial-card.place-top {',
  '  top: calc(12px + env(safe-area-inset-top));',
  '}',
  '.guided-tutorial-card h3 {',
  '  margin: 2px 0 6px;',
  '  font-size: 20px;',
  '}',
  '.guided-tutorial-card p {',
  '  margin: 0;',
  '}',
  '.guided-tutorial-footer {',
  '  display: flex;',
  '  align-items: center;',
  '  justify-content: space-between;',
  '  gap: 10px;',
  '  margin-top: 10px;',
  '}',
  '.guided-tutorial-footer span {',
  '  font-weight: 900;',
  '}',
  '.tutorial-target {',
  '  position: relative !important;',
  '  z-index: 90 !important;',
  '  isolation: isolate;',
  '  animation: tutorialPulse 1.1s ease-in-out infinite alternate;',
  '  box-shadow: 0 0 0 4px var(--yellow), 0 0 0 9px rgba(255,255,255,.95), 0 12px 0 rgba(0,0,0,.2) !important;',
  '}',
  '.tutorial-choice-block {',
  '  transform: translateZ(0);',
  '}',
  '.guided-onboarding .onboarding-card {',
  '  max-width: 420px;',
  '}',
  '@keyframes tutorialPulse {',
  '  from { filter: saturate(1); transform: translateY(0); }',
  '  to { filter: saturate(1.16); transform: translateY(-2px); }',
  '}',
  '@media (max-height: 690px) {',
  '  .guided-tutorial-card { padding: 12px; }',
  '  .guided-tutorial-card h3 { font-size: 18px; }',
  '  .guided-tutorial-card p { font-size: 13px; }',
  '}',
].join('\n');

patchFile('src/App.tsx', (source) => {
  let next = source;

  next = next.replace(
    '<TutorialBanner state={state} onAction={startNewProject} onSkip={() => update((current) => ({ ...current, tutorialDone: true }))} />',
    '<GuidedTutorialOverlay state={state} onSkip={() => update((current) => ({ ...current, tutorialDone: true }))} />',
  );

  next = replaceBetween(next, 'function TutorialBanner(', 'function StudioScreen(', guidedTutorialBlock + '\n\nfunction StudioScreen(');
  next = replaceBetween(next, 'function Onboarding(', 'function StudioNamingModal(', onboardingBlock + '\n\nfunction StudioNamingModal(');

  if (!next.includes('tutorialTarget?: boolean')) {
    next = next.replace(
      "function ChoiceBlock({ title, items, selected, onSelect, hint, itemHint }: { title: string; items: Array<{ id: string; name: string; emoji: string }>; selected: string | null; onSelect: (id: string) => void; hint?: string; itemHint?: (id: string) => string }) {",
      "function ChoiceBlock({ title, items, selected, onSelect, hint, itemHint, tutorialTarget = false }: { title: string; items: Array<{ id: string; name: string; emoji: string }>; selected: string | null; onSelect: (id: string) => void; hint?: string; itemHint?: (id: string) => string; tutorialTarget?: boolean }) {",
    );
    next = next.replace(
      "    <div className=\"panel comic-card\">\n      <div className=\"section-head compact\"><h3>{title}</h3>{hint && <span className=\"muted small\">{hint}</span>}</div>",
      "    <div className={tutorialTarget ? 'panel comic-card tutorial-target tutorial-choice-block' : 'panel comic-card'}>\n      <div className=\"section-head compact\"><h3>{title}</h3>{hint && <span className=\"muted small\">{hint}</span>}</div>",
    );
  }

  next = next.replace(
    "<ChoiceBlock title=\"1. Жанр\" items={availableGenres} selected={project.genre} onSelect={(id) => update((current) => setProjectChoice(current, 'genre', id as GenreId))} />",
    "<ChoiceBlock title=\"1. Жанр\" items={availableGenres} selected={project.genre} onSelect={(id) => update((current) => setProjectChoice(current, 'genre', id as GenreId))} tutorialTarget={!state.tutorialDone && state.tutorialStep <= 0} />",
  );
  next = next.replace(
    "<ChoiceBlock title=\"2. Сеттинг\" items={availableThemes} selected={project.theme} onSelect={(id) => update((current) => setProjectChoice(current, 'theme', id as ThemeId))} itemHint={hasProductInstinct && project.genre ? (id) => comboFor(project.genre!, id as ThemeId) : undefined} hint={!hasProductInstinct ? 'Исследуй «Продуктовое чутьё», чтобы видеть комбо и фокус.' : undefined} />",
    "<ChoiceBlock title=\"2. Сеттинг\" items={availableThemes} selected={project.theme} onSelect={(id) => update((current) => setProjectChoice(current, 'theme', id as ThemeId))} itemHint={hasProductInstinct && project.genre ? (id) => comboFor(project.genre!, id as ThemeId) : undefined} hint={!hasProductInstinct ? 'Исследуй «Продуктовое чутьё», чтобы видеть комбо и фокус.' : undefined} tutorialTarget={!state.tutorialDone && state.tutorialStep === 1} />",
  );
  next = next.replace(
    "<ChoiceBlock title=\"3. Платформа\" items={platforms.filter((item) => item.unlockLevel <= state.level || item.id === 'micro_pc')} selected={project.platform} onSelect={(id) => update((current) => setProjectChoice(current, 'platform', id as PlatformId))} />",
    "<ChoiceBlock title=\"3. Платформа\" items={platforms.filter((item) => item.unlockLevel <= state.level || item.id === 'micro_pc')} selected={project.platform} onSelect={(id) => update((current) => setProjectChoice(current, 'platform', id as PlatformId))} tutorialTarget={!state.tutorialDone && state.tutorialStep === 2} />",
  );

  next = next.replace(
    '<button className="release-button" disabled={!hasChoices || state.coins - devCost < -50000} onClick={() => update(startProject)}>',
    '<button className={!state.tutorialDone && state.tutorialStep >= 3 ? "release-button tutorial-target" : "release-button"} disabled={!hasChoices || state.coins - devCost < -50000} onClick={() => update(startProject)}>',
  );
  next = next.replace(
    "{project.progress >= 100 && <button className=\"release-button\" onClick={() => update(releaseProject)}>Релизнуть игру</button>}",
    "{project.progress >= 100 && <button className={!state.tutorialDone && project.isTutorial ? 'release-button tutorial-target' : 'release-button'} onClick={() => update(releaseProject)}>Релизнуть игру</button>}",
  );
  next = next.replace(
    "className={`${state.screen === id ? 'active' : ''} ${id === 'studio' ? 'main-tab' : ''}`.trim()}",
    "className={`${state.screen === id ? 'active' : ''} ${id === 'studio' ? 'main-tab' : ''} ${!state.tutorialDone && state.onboardingDone && state.screen !== 'develop' && id === 'develop' ? 'tutorial-target' : ''}`.trim()}",
  );

  requireContains(next, 'function GuidedTutorialOverlay', 'guided overlay component');
  requireContains(next, 'tutorialGuideCopy', 'tutorial step copy');
  requireContains(next, 'tutorialTarget={!state.tutorialDone && state.tutorialStep <= 0}', 'genre target');
  requireContains(next, 'release-button tutorial-target', 'release target');
  requireContains(next, 'guided-onboarding', 'short onboarding');
  return next;
});

patchFile('src/styles.css', (source) => {
  const marker = '/* Guided first-release tutorial */';
  const markerIndex = source.indexOf(marker);
  const base = markerIndex >= 0 ? source.slice(0, markerIndex).trimEnd() : source.trimEnd();
  return base + '\n\n' + guidedTutorialCss + '\n';
});
