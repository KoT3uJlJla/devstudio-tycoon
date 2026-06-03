import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { StudioBackdropScene } from './scenes/StudioBackdropScene';
import { destroyPixiApp, isReducedMotionPreferred, observePixiVisibility } from './utils/pixiLifecycle';

type PixiCanvasProps = {
  className?: string;
};

export function PixiCanvas({ className = '' }: PixiCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const currentHost = hostRef.current;
    if (!currentHost) return;
    const mountHost: HTMLDivElement = currentHost;

    let cancelled = false;
    let cleanup = () => {};

    async function mountPixi() {
      try {
        const app = new Application();
        await app.init({
          resizeTo: mountHost,
          backgroundAlpha: 0,
          antialias: false,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          preference: 'webgl',
          powerPreference: 'low-power',
        });

        if (cancelled) {
          destroyPixiApp(app);
          return;
        }

        app.canvas.className = 'pixi-canvas-surface';
        app.canvas.setAttribute('aria-hidden', 'true');
        mountHost.appendChild(app.canvas);

        const scene = new StudioBackdropScene({ reducedMotion: isReducedMotionPreferred() });
        app.stage.addChild(scene.view);

        const resize = () => scene.resize(mountHost.clientWidth, mountHost.clientHeight);
        resize();

        const stopVisibilityObserver = observePixiVisibility(app);
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mountHost);

        app.ticker.add(scene.update, scene);

        cleanup = () => {
          app.ticker.remove(scene.update, scene);
          resizeObserver.disconnect();
          stopVisibilityObserver();
          scene.destroy();
          if (app.canvas.parentElement === mountHost) mountHost.removeChild(app.canvas);
          destroyPixiApp(app);
        };
      } catch (error) {
        console.warn('Pixi studio backdrop failed to initialize. Continuing with HTML UI only.', error);
        if (!cancelled) setFailed(true);
      }
    }

    mountPixi();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={hostRef} className={`pixi-canvas-host ${failed ? 'pixi-canvas-host--fallback' : ''} ${className}`} aria-hidden="true" />;
}
