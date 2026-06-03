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

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function fillRoundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fillStyle: string) {
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
}

function drawFallbackOffice(context: CanvasRenderingContext2D, width: number, height: number, pulse: number, mode: StudioBackdropMode) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#070812';
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#10122a';
  context.fillRect(0, 0, width, height * 0.58);
  context.fillStyle = '#0b0b16';
  context.fillRect(0, height * 0.58, width, height * 0.42);

  context.strokeStyle = 'rgba(89, 100, 168, 0.34)';
  context.lineWidth = Math.max(2, width * 0.004);
  context.beginPath();
  context.moveTo(width * 0.08, height * 0.58);
  context.lineTo(width * 0.24, height * 0.26);
  context.lineTo(width * 0.76, height * 0.26);
  context.lineTo(width * 0.92, height * 0.58);
  context.stroke();

  fillRoundRect(context, width * 0.1, height * 0.11, width * 0.15, height * 0.13, 12, 'rgba(18, 20, 43, 0.78)');
  fillRoundRect(context, width * 0.7, height * 0.12, width * 0.2, height * 0.045, 8, 'rgba(7, 8, 18, 0.88)');
  ['#ffe04e', '#1df7ff', '#ff3bbd'].forEach((color, index) => {
    fillRoundRect(context, width * (0.71 + index * 0.06), height * (0.2 - index * 0.012), width * 0.036, height * 0.06, 6, `${color}66`);
  });

  const rimGlow = context.createRadialGradient(width * 0.5, height * 0.2, 0, width * 0.5, height * 0.2, width * 0.46);
  rimGlow.addColorStop(0, `rgba(91, 108, 255, ${0.13 + pulse * 0.04})`);
  rimGlow.addColorStop(1, 'rgba(91, 108, 255, 0)');
  context.fillStyle = rimGlow;
  context.fillRect(0, 0, width, height);

  const monitors = [
    { x: 0.18, y: 0.43, w: 0.2, h: 0.16, color: '#1df7ff' },
    { x: 0.4, y: 0.36, w: 0.25, h: 0.21, color: '#ff3bbd' },
    { x: 0.67, y: 0.44, w: 0.18, h: 0.145, color: '#ffe04e' },
  ];

  monitors.forEach((monitor) => {
    const glow = context.createRadialGradient(width * (monitor.x + monitor.w / 2), height * (monitor.y + monitor.h / 2), 0, width * (monitor.x + monitor.w / 2), height * (monitor.y + monitor.h / 2), width * monitor.w);
    glow.addColorStop(0, `${monitor.color}${Math.round(70 + pulse * 30).toString(16).padStart(2, '0')}`);
    glow.addColorStop(1, `${monitor.color}00`);
    context.fillStyle = glow;
    context.fillRect(width * (monitor.x - 0.05), height * (monitor.y - 0.1), width * (monitor.w + 0.1), height * (monitor.h + 0.2));

    fillRoundRect(context, width * monitor.x - 8, height * monitor.y - 8, width * monitor.w + 16, height * monitor.h + 16, 18, '#060711');
    fillRoundRect(context, width * monitor.x, height * monitor.y, width * monitor.w, height * monitor.h, 12, '#101939');
    fillRoundRect(context, width * (monitor.x + monitor.w * 0.06), height * (monitor.y + monitor.h * 0.12), width * monitor.w * 0.88, height * monitor.h * 0.12, 4, `${monitor.color}55`);
    fillRoundRect(context, width * (monitor.x + monitor.w * 0.08), height * (monitor.y + monitor.h * 0.36), width * monitor.w * 0.42, height * monitor.h * 0.055, 3, 'rgba(109, 255, 133, 0.42)');
    fillRoundRect(context, width * (monitor.x + monitor.w * 0.08), height * (monitor.y + monitor.h * 0.52), width * monitor.w * 0.66, height * monitor.h * 0.05, 3, 'rgba(255, 255, 255, 0.22)');
    fillRoundRect(context, width * (monitor.x + monitor.w * 0.08), height * (monitor.y + monitor.h * 0.68), width * monitor.w * 0.5, height * monitor.h * 0.05, 3, 'rgba(255, 224, 78, 0.34)');
  });

  fillRoundRect(context, width * 0.05, height * 0.67, width * 0.9, height * 0.11, 18, '#211421');
  fillRoundRect(context, width * 0.08, height * 0.65, width * 0.84, height * 0.065, 18, '#3c2333');
  fillRoundRect(context, width * 0.14, height * 0.74, width * 0.05, height * 0.2, 10, '#11111f');
  fillRoundRect(context, width * 0.78, height * 0.74, width * 0.05, height * 0.2, 10, '#11111f');
  fillRoundRect(context, width * 0.33, height * 0.7, width * 0.26, height * 0.03, 8, '#080a14');

  const moteCount = mode === 'modal' ? 10 : 4;
  context.fillStyle = 'rgba(255, 239, 184, 0.42)';
  for (let index = 0; index < moteCount; index += 1) {
    const x = ((index * 0.173 + pulse * 0.018) % 1) * width;
    const y = (0.18 + ((index * 0.119 + pulse * 0.04) % 0.42)) * height;
    context.beginPath();
    context.arc(x, y, Math.max(1.2, width * 0.003), 0, Math.PI * 2);
    context.fill();
  }
}

function CanvasOfficeFallback({ mode }: CanvasOfficeFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !host || !context) return;

    console.info('Studio backdrop renderer: Canvas2D fallback');

    let frame = 0;
    let start = performance.now();
    const reducedMotion = isReducedMotionPreferred();

    const render = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(host.clientWidth));
      const height = Math.max(1, Math.floor(host.clientHeight));
      if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }
      const pulse = reducedMotion ? 0.3 : (Math.sin((performance.now() - start) / 1200) + 1) / 2;
      drawFallbackOffice(context, width, height, pulse, mode);
    };

    const tick = () => {
      render();
      if (!reducedMotion && !document.hidden) frame = window.requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
      if (!document.hidden && !reducedMotion) {
        start = performance.now();
        frame = window.requestAnimationFrame(tick);
      }
    };

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(host);
    document.addEventListener('visibilitychange', onVisibilityChange);
    tick();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
        console.info('Studio backdrop renderer: Pixi');

        if (mountHost.clientWidth === 0 || mountHost.clientHeight === 0) {
          await waitForNextFrame();
        }

        if (cancelled) {
          if (app.canvas.parentElement === mountHost) mountHost.removeChild(app.canvas);
          destroyPixiApp(app);
          return;
        }

        const scene = new StudioBackdropScene({ reducedMotion: isReducedMotionPreferred(), mode });
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
