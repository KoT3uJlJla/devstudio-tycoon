import type { Application } from 'pixi.js';

export function isReducedMotionPreferred() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function observePixiVisibility(app: Application) {
  const updateTicker = () => {
    if (document.hidden) app.ticker.stop();
    else app.ticker.start();
  };

  document.addEventListener('visibilitychange', updateTicker);
  updateTicker();

  return () => document.removeEventListener('visibilitychange', updateTicker);
}

export function destroyPixiApp(app: Application) {
  app.destroy(true, { children: true, texture: true });
}
