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

    const waitForNextFrame = () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    async function createApplication(options: Parameters<Application['init']>[0]) {
      const app = new Application();
      try {
        await app.init(options);
        return app;
      } catch (error) {
        destroyPixiApp(app);
        throw error;
      }
    }

    async function mountPixi() {
      try {
        let app: Application;
        try {
          app = await createApplication({
            resizeTo: mountHost,
            backgroundAlpha: 0,
            antialias: false,
            autoDensity: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
          });
        } catch {
          if (cancelled) return;
          app = await createApplication({
            backgroundAlpha: 0,
            antialias: false,
            autoDensity: true,
            resolution: 1,
          });
        }

        if (cancelled) {
          destroyPixiApp(app);
          return;
        }

        app.canvas.className = 'pixi-canvas-surface';
        app.canvas.setAttribute('aria-hidden', 'true');
        mountHost.appendChild(app.canvas);
        console.info('Pixi StudioBackdrop mounted');

        if (mountHost.clientWidth === 0 || mountHost.clientHeight === 0) {
          await waitForNextFrame();
        }

        if (cancelled) {
          if (app.canvas.parentElement === mountHost) mountHost.removeChild(app.canvas);
          destroyPixiApp(app);
          return;
        }

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
        console.error('Pixi StudioBackdrop failed', error);
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
