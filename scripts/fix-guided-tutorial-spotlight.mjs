import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceBetween(source, startNeedle, endNeedle, replacement) {
  const start = source.indexOf(startNeedle);
  if (start === -1) throw new Error('guided-focus-lock: start not found: ' + startNeedle);
  const end = source.indexOf(endNeedle, start);
  if (end === -1 || end <= start) throw new Error('guided-focus-lock: end not found: ' + endNeedle);
  return source.slice(0, start) + replacement.trimEnd() + '\n\n' + source.slice(end);
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error('guided-focus-lock: missing ' + label);
}

const overlayBlock = `function GuidedTutorialOverlay({ state, onSkip }: { state: GameState; onSkip: () => void }) {
  const step = getTutorialGuideStep(state);
  const [spotlight, setSpotlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!step) return;
    const target = step.target ? document.querySelector<HTMLElement>('.tutorial-target') : null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const disabledControls: HTMLElement[] = [];
    const scrollParents: HTMLElement[] = [];

    const findScrollParents = (node: HTMLElement | null) => {
      scrollParents.length = 0;
      let current = node?.parentElement ?? null;
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const canScroll = /(auto|scroll|overlay)/.test(style.overflowY) && current.scrollHeight > current.clientHeight;
        if (canScroll) scrollParents.push(current);
        current = current.parentElement;
      }
    };

    const centerTarget = () => {
      if (!target) return;
      findScrollParents(target);
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
      const rect = target.getBoundingClientRect();
      const desiredTop = step.placement === 'top'
        ? Math.min(window.innerHeight - rect.height - 110, Math.max(150, Math.round((window.innerHeight - rect.height) * 0.58)))
        : Math.max(92, Math.round((window.innerHeight - rect.height) * 0.28));
      const delta = rect.top - desiredTop;
      if (Math.abs(delta) > 8) {
        if (scrollParents[0]) scrollParents[0].scrollTop += delta;
        else window.scrollBy({ top: delta, behavior: 'auto' });
      }
    };

    const measure = () => {
      if (!step.target || !target) {
        setSpotlight(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const pad = 13;
      const top = Math.max(8, rect.top - pad);
      const left = Math.max(8, rect.left - pad);
      const right = Math.min(window.innerWidth - 8, rect.right + pad);
      const bottom = Math.min(window.innerHeight - 8, rect.bottom + pad);
      setSpotlight({ top, left, width: Math.max(44, right - left), height: Math.max(44, bottom - top) });
    };

    const disableOutsideControls = () => {
      if (!step.target || !target) return;
      document.body.classList.add('guided-tutorial-lock');
      document.querySelectorAll<HTMLElement>('button, a, input, select, textarea, [role="button"], .bottom-nav button').forEach((element) => {
        if (target.contains(element) || element.closest('.guided-tutorial-card')) return;
        element.classList.add('tutorial-disabled-control');
        disabledControls.push(element);
      });
    };

    const lockScroll = () => {
      if (!step.target) return;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };

    const recenter = () => { centerTarget(); measure(); };
    recenter();
    const lockTimer = window.setTimeout(() => { recenter(); disableOutsideControls(); lockScroll(); }, 140);

    const preventScroll = (event: Event) => {
      if (step.target) event.preventDefault();
    };
    document.addEventListener('wheel', preventScroll, { passive: false, capture: true });
    document.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
    window.addEventListener('resize', recenter);
    const timers = [window.setTimeout(recenter, 300), window.setTimeout(recenter, 680), window.setTimeout(recenter, 1040)];

    return () => {
      document.body.classList.remove('guided-tutorial-lock');
      disabledControls.forEach((element) => element.classList.remove('tutorial-disabled-control'));
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener('wheel', preventScroll, true);
      document.removeEventListener('touchmove', preventScroll, true);
      window.removeEventListener('resize', recenter);
      window.clearTimeout(lockTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [step?.id, step?.target, step?.placement]);

  if (!step) return null;
  return (
    <div className={step.target ? 'guided-tutorial active focus-lock-mode' : 'guided-tutorial passive'} aria-live="polite">
      {step.target && spotlight ? <span className="tutorial-spotlight-ring" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height } as CSSProperties} aria-hidden="true" /> : <div className="guided-tutorial-dim" />}
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

const focusLockCss = [
  '/* Guided first-release tutorial */',
  '.guided-tutorial {',
  '  position: fixed;',
  '  inset: 0;',
  '  z-index: 120;',
  '  pointer-events: none;',
  '}',
  '.guided-tutorial-dim {',
  '  position: absolute;',
  '  inset: 0;',
  '  background: rgba(5, 6, 13, .38);',
  '  pointer-events: none;',
  '}',
  '.guided-tutorial.passive .guided-tutorial-dim { opacity: .34; }',
  '.tutorial-spotlight-ring {',
  '  position: fixed;',
  '  z-index: 121;',
  '  border-radius: 24px;',
  '  border: 4px solid var(--yellow);',
  '  box-shadow: 0 0 0 7px rgba(255,255,255,.95), 0 0 36px rgba(40,245,255,.55);',
  '  pointer-events: none;',
  '  animation: tutorialRingPulse 1.05s ease-in-out infinite alternate;',
  '}',
  '.guided-tutorial-card {',
  '  position: fixed;',
  '  left: 12px;',
  '  right: 12px;',
  '  z-index: 150;',
  '  padding: 14px;',
  '  pointer-events: auto;',
  '  box-shadow: 0 18px 0 rgba(0,0,0,.18);',
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
  '.tutorial-disabled-control {',
  '  pointer-events: none !important;',
  '}',
  '.tutorial-target {',
  '  position: relative !important;',
  '  z-index: 140 !important;',
  '  isolation: isolate;',
  '  filter: none !important;',
  '  opacity: 1 !important;',
  '  animation: tutorialPulse 1.1s ease-in-out infinite alternate;',
  '  box-shadow: 0 0 0 4px var(--yellow), 0 0 0 9px rgba(255,255,255,.95), 0 12px 0 rgba(0,0,0,.18) !important;',
  '}',
  '.tutorial-target, .tutorial-target * {',
  '  pointer-events: auto !important;',
  '}',
  '.tutorial-choice-block { transform: translateZ(0); }',
  '.guided-onboarding .onboarding-card { max-width: 420px; }',
  '@keyframes tutorialPulse {',
  '  from { transform: translateY(0); }',
  '  to { transform: translateY(-2px); }',
  '}',
  '@keyframes tutorialRingPulse {',
  '  from { opacity: .86; transform: scale(.995); }',
  '  to { opacity: 1; transform: scale(1.01); }',
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
  requireContains(next, 'tutorial-disabled-control', 'outside control lock');
  requireContains(next, 'centerTarget', 'target centering');
  requireContains(next, "placement: 'top', cta: 'Нажми на платформу'", 'platform top card');
  return next;
});

patchFile('src/styles.css', (source) => {
  const marker = '/* Guided first-release tutorial */';
  const markerIndex = source.indexOf(marker);
  const base = markerIndex >= 0 ? source.slice(0, markerIndex).trimEnd() : source.trimEnd();
  return base + '\n\n' + focusLockCss + '\n';
});
