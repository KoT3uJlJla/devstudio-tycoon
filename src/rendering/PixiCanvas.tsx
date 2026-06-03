import 'pixi.js/unsafe-eval';
import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { StudioBackdropScene } from './scenes/StudioBackdropScene';
import { destroyPixiApp, isReducedMotionPreferred, observePixiVisibility } from './utils/pixiLifecycle';

type StudioBackdropMode = 'preview' | 'modal';

type PixiCanvasProps = {
  className?: string;
  mode?: StudioBackdropMode;
};

type CanvasOfficeFallbackProps = {
  mode: StudioBackdropMode;
};

const OFFICE_BASE_ASSET = '/assets/studio-office/office-base.webp';

function drawCoverImage(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const imageWidth = image.naturalWidth || image.width || 1;
  const imageHeight = image.naturalHeight || image.height || 1;
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  context.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawFallbackPolish(context: CanvasRenderingContext2D, width: number, height: number, pulse: number, mode: StudioBackdropMode) {
  context.save();
  context.globalCompositeOperation = 'lighter';

  const rimGlow = context.createRadialGradient(width * 0.5, height * 0.2, 0, width * 0.5, height * 0.2, width * 0.42);
  rimGlow.addColorStop(0, `rgba(91, 108, 255, ${0.06 + pulse * 0.025})`);
  rimGlow.addColorStop(1, 'rgba(91, 108, 255, 0)');
  context.fillStyle = rimGlow;
  context.fillRect(0, 0, width, height);

  const monitors = [
    { x: 0.3, y: 0.5, radius: 0.18, color: '29, 247, 255' },
    { x: 0.52, y: 0.48, radius: 0.2, color: '255, 59, 189' },
    { x: 0.73, y: 0.51, radius: 0.16, color: '255, 224, 78' },
  ];

  monitors.forEach((monitor, index) => {
    const glow = context.createRadialGradient(width * monitor.x, height * monitor.y, 0, width * monitor.x, height * monitor.y, width * monitor.radius);
    glow.addColorStop(0, `rgba(${monitor.color}, ${0.045 + pulse * 0.035 + index * 0.006})`);
    glow.addColorStop(1, `rgba(${monitor.color}, 0)`);
    context.fillStyle = glow;
    context.fillRect(width * (monitor.x - monitor.radius), height * (monitor.y - monitor.radius), width * monitor.radius * 2, width * monitor.radius * 2);
  });

  const moteCount = mode === 'modal' ? 8 : 3;
  context.fillStyle = 'rgba(255, 239, 184, 0.28)';
  for (let index = 0; index < moteCount; index += 1) {
    const x = ((index * 0.173 + pulse * 0.018) % 1) * width;
    const y = (0.18 + ((index * 0.119 + pulse * 0.04) % 0.42)) * height;
    context.beginPath();
    context.arc(x, y, Math.max(0.9, width * 0.0022), 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function drawMissingAssetMessage(context: CanvasRenderingContext2D, width: number, height: number) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#070812';
  context.fillRect(0, 0, width, height);
  context.fillStyle = 'rgba(255, 255, 255, 0.86)';
  context.font = '700 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Office art asset missing', width / 2, height / 2);
}

function CanvasOfficeFallback({ mode }: CanvasOfficeFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !host || !context) return;

    console.info('Studio backdrop renderer: Canvas2D asset fallback');

    const image = new Image();
    let frame = 0;
    let start = performance.now();
    let loaded = false;
    let missing = false;
    const reducedMotion = isReducedMotionPreferred();

    const prepareCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(host.clientWidth));
      const height = Math.max(1, Math.floor(host.clientHeight));
      if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      return { width, height };
    };

    const render = () => {
      const { width, height } = prepareCanvas();
      const pulse = reducedMotion ? 0.3 : (Math.sin((performance.now() - start) / 1200) + 1) / 2;
      if (loaded) {
        context.clearRect(0, 0, width, height);
        drawCoverImage(context, image, width, height);
        drawFallbackPolish(context, width, height, pulse, mode);
        return;
      }
      if (missing) drawMissingAssetMessage(context, width, height);
    };

    const tick = () => {
      render();
      if (loaded && !reducedMotion && !document.hidden) frame = window.requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
      if (!document.hidden && loaded && !reducedMotion) {
        start = performance.now();
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(tick);
      }
    };

    image.onload = () => {
      loaded = true;
      missing = false;
      tick();
    };
    image.onerror = () => {
      missing = true;
      loaded = false;
      render();
    };
    image.src = OFFICE_BASE_ASSET;

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(host);
    document.addEventListener('visibilitychange', onVisibilityChange);
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      image.onload = null;
      image.onerror = null;
    };
  }, [mode]);

  return <canvas ref={canvasRef} className="pixi-canvas-surface" aria-hidden="true" />;
}

export function PixiCanvas({ className = '', mode = 'preview' }: PixiCanvasProps) {
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

        const scene = await StudioBackdropScene.create({ reducedMotion: isReducedMotionPreferred(), mode });
        if (cancelled) {
          scene.destroy();
          if (app.canvas.parentElement === mountHost) mountHost.removeChild(app.canvas);
          destroyPixiApp(app);
          return;
        }
        app.stage.addChild(scene.view);

        const resize = () => {
          app.renderer.resize(mountHost.clientWidth, mountHost.clientHeight);
          scene.resize(mountHost.clientWidth, mountHost.clientHeight);
        };
        resize();

        const stopVisibilityObserver = observePixiVisibility(app);
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mountHost);

        app.ticker.maxFPS = mode === 'modal' ? 30 : 24;
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

    setFailed(false);
    mountPixi();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [mode]);

  return (
    <div ref={hostRef} className={`pixi-canvas-host ${failed ? 'pixi-canvas-host--fallback' : ''} ${className}`} aria-hidden="true">
      {failed && <CanvasOfficeFallback mode={mode} />}
    </div>
  );
}
