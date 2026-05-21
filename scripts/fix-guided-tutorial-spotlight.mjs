import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceBetween(source, startNeedle, endNeedle, replacement) {
  const start = source.indexOf(startNeedle);
  if (start === -1) throw new Error('guided-inline-focus: start not found: ' + startNeedle);
  const end = source.indexOf(endNeedle, start);
  if (end === -1 || end <= start) throw new Error('guided-inline-focus: end not found: ' + endNeedle);
  return source.slice(0, start) + replacement.trimEnd() + '\n\n' + source.slice(end);
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error('guided-inline-focus: missing ' + label);
}

const overlayBlock = `function GuidedTutorialOverlay({ state, onSkip }: { state: GameState; onSkip: () => void }) {
  const step = getTutorialGuideStep(state);

  useEffect(() => {
    if (!step) return;
    const target = step.target ? document.querySelector<HTMLElement>('.tutorial-target') : null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    const centerTarget = () => {
      if (!target) return;
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    };

    centerTarget();
    const timers = [window.setTimeout(centerTarget, 120), window.setTimeout(centerTarget, 360), window.setTimeout(centerTarget, 720)];
    if (step.target) {
      window.setTimeout(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }, 180);
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [step?.id, step?.target]);

  if (!step) return null;
  return (
    <div className="guided-tutorial inline-focus-mode" aria-live="polite">
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
}`;

const inlineFocusCss = [
  '/* Guided first-release tutorial */',
  '.guided-tutorial {',
  '  position: fixed;',
  '  inset: 0;',
  '  z-index: 120;',
  '  pointer-events: none;',
  '}',
  '.guided-tutorial-card {',
  '  position: fixed;',
  '  left: 12px;',
  '  right: 12px;',
  '  z-index: 150;',
  '  padding: 14px;',
  '  pointer-events: auto;',
  '  box-shadow: 0 18px 0 rgba(0,0,0,.18), 0 0 0 2px rgba(40,245,255,.28);',
  '}',
  '.guided-tutorial-card.place-bottom { bottom: calc(86px + env(safe-area-inset-bottom)); }',
  '.guided-tutorial-card.place-top { top: calc(12px + env(safe-area-inset-top)); }',
  '.guided-tutorial-card h3 {',
  '  margin: 2px 0 6px;',
  '  font-size: 20px;',
  '}',
  '.guided-tutorial-card p { margin: 0; }',
  '.guided-tutorial-footer {',
  '  display: flex;',
  '  align-items: center;',
  '  justify-content: space-between;',
  '  gap: 10px;',
  '  margin-top: 10px;',
  '}',
  '.guided-tutorial-footer span { font-weight: 900; }',
  '.tutorial-target {',
  '  position: relative !important;',
  '  z-index: 20 !important;',
  '  isolation: isolate;',
  '  filter: none !important;',
  '  opacity: 1 !important;',
  '  animation: tutorialPulse 1.1s ease-in-out infinite alternate;',
  '  box-shadow: 0 0 0 4px var(--yellow), 0 0 0 9px rgba(255,255,255,.95), 0 0 32px rgba(40,245,255,.45), 0 12px 0 rgba(0,0,0,.18) !important;',
  '}',
  '.tutorial-target, .tutorial-target * { pointer-events: auto !important; }',
  '.tutorial-locked {',
  '  pointer-events: none !important;',
  '  opacity: .42 !important;',
  '  filter: grayscale(.35) brightness(.8);',
  '}',
  '.tutorial-choice-block { transform: translateZ(0); }',
  '.guided-onboarding .onboarding-card { max-width: 420px; }',
  '@keyframes tutorialPulse {',
  '  from { transform: translateY(0); }',
  '  to { transform: translateY(-2px); }',
  '}',
  '@media (max-height: 690px) {',
  '  .guided-tutorial-card { padding: 12px; }',
  '  .guided-tutorial-card h3 { font-size: 18px; }',
  '  .guided-tutorial-card p { font-size: 13px; }',
  '}',
].join('\n');

patchFile('src/App.tsx', (source) => {
  let next = source.replace(
    "target: true, placement: 'bottom', cta: 'Нажми на платформу',",
    "target: true, placement: 'top', cta: 'Нажми на платформу',",
  );

  next = replaceBetween(next, 'function GuidedTutorialOverlay(', 'function TutorialBanner(', overlayBlock);

  next = next.replace(
    "function ChoiceBlock({ title, items, selected, onSelect, hint, itemHint, tutorialTarget = false }: { title: string; items: Array<{ id: string; name: string; emoji: string }>; selected: string | null; onSelect: (id: string) => void; hint?: string; itemHint?: (id: string) => string; tutorialTarget?: boolean }) {",
    "function ChoiceBlock({ title, items, selected, onSelect, hint, itemHint, tutorialTarget = false, tutorialLocked = false }: { title: string; items: Array<{ id: string; name: string; emoji: string }>; selected: string | null; onSelect: (id: string) => void; hint?: string; itemHint?: (id: string) => string; tutorialTarget?: boolean; tutorialLocked?: boolean }) {",
  );
  next = next.replace(
    "<div className={tutorialTarget ? 'panel comic-card tutorial-target tutorial-choice-block' : 'panel comic-card'}>",
    "<div className={`panel comic-card${tutorialTarget ? ' tutorial-target tutorial-choice-block' : ''}${tutorialLocked ? ' tutorial-locked' : ''}`.trim()}>",
  );

  next = next.replace(
    "<ChoiceBlock title=\"1. Жанр\" items={availableGenres} selected={project.genre} onSelect={(id) => update((current) => setProjectChoice(current, 'genre', id as GenreId))} tutorialTarget={!state.tutorialDone && state.tutorialStep <= 0} />",
    "<ChoiceBlock title=\"1. Жанр\" items={availableGenres} selected={project.genre} onSelect={(id) => update((current) => setProjectChoice(current, 'genre', id as GenreId))} tutorialTarget={!state.tutorialDone && state.tutorialStep <= 0} tutorialLocked={!state.tutorialDone && state.tutorialStep > 0} />",
  );
  next = next.replace(
    "<ChoiceBlock title=\"2. Сеттинг\" items={availableThemes} selected={project.theme} onSelect={(id) => update((current) => setProjectChoice(current, 'theme', id as ThemeId))} itemHint={hasProductInstinct && project.genre ? (id) => comboFor(project.genre!, id as ThemeId) : undefined} hint={!hasProductInstinct ? 'Исследуй «Продуктовое чутьё», чтобы видеть комбо и фокус.' : undefined} tutorialTarget={!state.tutorialDone && state.tutorialStep === 1} />",
    "<ChoiceBlock title=\"2. Сеттинг\" items={availableThemes} selected={project.theme} onSelect={(id) => update((current) => setProjectChoice(current, 'theme', id as ThemeId))} itemHint={hasProductInstinct && project.genre ? (id) => comboFor(project.genre!, id as ThemeId) : undefined} hint={!hasProductInstinct ? 'Исследуй «Продуктовое чутьё», чтобы видеть комбо и фокус.' : undefined} tutorialTarget={!state.tutorialDone && state.tutorialStep === 1} tutorialLocked={!state.tutorialDone && state.tutorialStep !== 1} />",
  );
  next = next.replace(
    "<ChoiceBlock title=\"3. Платформа\" items={platforms.filter((item) => item.unlockLevel <= state.level || item.id === 'micro_pc')} selected={project.platform} onSelect={(id) => update((current) => setProjectChoice(current, 'platform', id as PlatformId))} tutorialTarget={!state.tutorialDone && state.tutorialStep === 2} />",
    "<ChoiceBlock title=\"3. Платформа\" items={platforms.filter((item) => item.unlockLevel <= state.level || item.id === 'micro_pc')} selected={project.platform} onSelect={(id) => update((current) => setProjectChoice(current, 'platform', id as PlatformId))} tutorialTarget={!state.tutorialDone && state.tutorialStep === 2} tutorialLocked={!state.tutorialDone && state.tutorialStep !== 2} />",
  );

  requireContains(next, 'inline-focus-mode', 'inline focus overlay');
  requireContains(next, 'tutorialLocked?: boolean', 'choice lock prop');
  requireContains(next, 'tutorial-locked', 'choice lock class');
  requireContains(next, "placement: 'top', cta: 'Нажми на платформу'", 'platform top card');
  return next;
});

patchFile('src/styles.css', (source) => {
  const marker = '/* Guided first-release tutorial */';
  const markerIndex = source.indexOf(marker);
  const base = markerIndex >= 0 ? source.slice(0, markerIndex).trimEnd() : source.trimEnd();
  return base + '\n\n' + inlineFocusCss + '\n';
});
