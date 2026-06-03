import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { createGlowOrb } from '../effects/createGlowOrb';
import { createParticleField } from '../effects/createParticleField';

type StudioBackdropMode = 'preview' | 'modal';

type StudioBackdropSceneOptions = {
  reducedMotion?: boolean;
  mode?: StudioBackdropMode;
  baseTexture?: Texture;
  glowTexture?: Texture;
};

type Spark = {
  sprite: Sprite;
  xRatio: number;
  yRatio: number;
  phase: number;
  speed: number;
};

const OFFICE_BASE_ASSET = '/assets/studio-office/office-base.webp';
const OFFICE_GLOW_ASSET = '/assets/studio-office/office-glow.webp';

function rect(graphics: Graphics, x: number, y: number, width: number, height: number, color: number, alpha = 1, radius = 0) {
  if (radius > 0) graphics.roundRect(x, y, width, height, radius);
  else graphics.rect(x, y, width, height);
  graphics.fill({ color, alpha });
}

function strokeLine(graphics: Graphics, points: number[], color: number, alpha: number, width: number) {
  graphics.moveTo(points[0], points[1]);
  for (let index = 2; index < points.length; index += 2) graphics.lineTo(points[index], points[index + 1]);
  graphics.stroke({ color, alpha, width });
}

function makeSparkTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 36;
  canvas.height = 36;
  const context = canvas.getContext('2d');
  if (!context) return Texture.WHITE;
  const gradient = context.createRadialGradient(18, 18, 1, 18, 18, 15);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.35, color.replace('1)', '0.45)'));
  gradient.addColorStop(1, color.replace('1)', '0)'));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 36, 36);
  return Texture.from(canvas);
}

function loadImageAsset(assetPath: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      console.info('Studio office asset check', {
        url: assetPath,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Studio office image failed to load: ${assetPath}`));
    image.src = assetPath;
  });
}

async function loadTexture(assetPath: string) {
  const image = await loadImageAsset(assetPath);
  const texture = Texture.from(image);
  if (!texture) throw new Error(`Studio office texture failed to create: ${assetPath}`);
  return texture;
}

export class StudioBackdropScene {
  readonly view = new Container();

  private readonly artLayer = new Container();
  private readonly fallbackLayer = new Container();
  private readonly glowLayer = new Container();
  private readonly screenFlickerLayer = new Container();
  private readonly particleLayer = new Container();
  private readonly reducedMotion: boolean;
  private readonly mode: StudioBackdropMode;
  private readonly particles;
  private readonly baseSprite?: Sprite;
  private readonly glowSprite?: Sprite;
  private readonly monitorGlows = [createGlowOrb(0x1df7ff, 180, 0.3), createGlowOrb(0xff3bbd, 160, 0.22), createGlowOrb(0xffe04e, 210, 0.16)];
  private readonly rimGlow = createGlowOrb(0x5b6cff, 420, 0.08);
  private readonly sparks: Spark[] = [];
  private readonly screenFlickers: Graphics[] = [];
  private elapsed = 0;
  private width = 0;
  private height = 0;

  static async create(options: Omit<StudioBackdropSceneOptions, 'baseTexture' | 'glowTexture'> = {}) {
    try {
      const [baseTexture, glowTexture] = await Promise.all([
        loadTexture(OFFICE_BASE_ASSET),
        loadTexture(OFFICE_GLOW_ASSET).catch(() => undefined),
      ]);
      return new StudioBackdropScene({ ...options, baseTexture, glowTexture });
    } catch (error) {
      console.warn('Studio office Pixi assets failed; using emergency procedural fallback', error);
      return new StudioBackdropScene(options);
    }
  }

  constructor(options: StudioBackdropSceneOptions = {}) {
    this.reducedMotion = Boolean(options.reducedMotion);
    this.mode = options.mode ?? 'preview';
    this.particles = createParticleField({ reducedMotion: this.reducedMotion, mode: this.mode });

    this.view.eventMode = 'none';
    this.view.interactiveChildren = false;
    this.view.addChild(this.artLayer, this.fallbackLayer, this.glowLayer, this.screenFlickerLayer, this.particleLayer);

    if (options.baseTexture) {
      this.baseSprite = new Sprite(options.baseTexture);
      this.baseSprite.anchor.set(0.5);
      this.artLayer.addChild(this.baseSprite);

      if (options.glowTexture) {
        this.glowSprite = new Sprite(options.glowTexture);
        this.glowSprite.anchor.set(0.5);
        this.glowSprite.alpha = this.mode === 'modal' ? 0.48 : 0.38;
        this.glowSprite.blendMode = 'add';
        this.artLayer.addChild(this.glowSprite);
      }

      console.info('Studio backdrop renderer: Pixi asset scene');
    }

    this.glowLayer.addChild(this.rimGlow, ...this.monitorGlows);
    this.particleLayer.addChild(this.particles.view);
    this.createMonitorSparks();
    this.createScreenFlickers();
  }

  resize(width: number, height: number) {
    const nextWidth = Math.max(1, width);
    const nextHeight = Math.max(1, height);
    if (Math.round(nextWidth) === Math.round(this.width) && Math.round(nextHeight) === Math.round(this.height)) return;
    this.width = nextWidth;
    this.height = nextHeight;
    this.layoutOfficeArt();
    if (!this.baseSprite) this.drawEmergencyFallbackScene();
    this.particles.resize(this.width, this.height);
    this.positionAnimatedElements();
  }

  update(ticker: { elapsedMS?: number; deltaMS?: number }) {
    const elapsedSeconds = Math.min((ticker.elapsedMS ?? ticker.deltaMS ?? 16.67) / 1000, 0.05);
    this.elapsed += elapsedSeconds;

    const parallax = this.reducedMotion || this.mode === 'preview' ? 0 : Math.sin(this.elapsed * 0.18);
    this.artLayer.x = parallax * 4;
    this.glowLayer.x = parallax * -4;
    this.screenFlickerLayer.x = parallax * -3;

    if (!this.reducedMotion) {
      if (this.glowSprite) this.glowSprite.alpha = (this.mode === 'modal' ? 0.48 : 0.38) + Math.sin(this.elapsed * 0.75) * 0.08;
      this.monitorGlows.forEach((glow, index) => {
        glow.alpha = [0.3, 0.22, 0.16][index] + Math.sin(this.elapsed * (0.8 + index * 0.18)) * 0.025;
      });
      this.screenFlickers.forEach((flicker, index) => {
        flicker.alpha = 0.025 + Math.max(0, Math.sin(this.elapsed * (2.1 + index * 0.45) + index * 1.7)) * 0.045;
      });
      this.sparks.forEach((spark, index) => {
        spark.phase += elapsedSeconds * spark.speed;
        spark.sprite.x = spark.xRatio * this.width + Math.sin(spark.phase + index) * 4;
        spark.sprite.y = spark.yRatio * this.height + Math.cos(spark.phase * 0.8) * 3;
        spark.sprite.alpha = 0.1 + Math.sin(spark.phase * 4) * 0.055;
      });
    }

    this.particles.update(elapsedSeconds, this.width, this.height);
  }

  destroy() {
    this.particles.destroy();
    this.view.destroy({ children: true });
  }

  private layoutOfficeArt() {
    if (!this.baseSprite) return;
    const textureWidth = this.baseSprite.texture.width || 1;
    const textureHeight = this.baseSprite.texture.height || 1;
    const coverScale = Math.max(this.width / textureWidth, this.height / textureHeight);
    const overscan = this.mode === 'modal' && !this.reducedMotion ? 1.015 : 1;
    const scale = coverScale * overscan;

    [this.baseSprite, this.glowSprite].forEach((sprite) => {
      if (!sprite) return;
      sprite.position.set(this.width / 2, this.height / 2);
      sprite.scale.set(scale);
    });
  }

  private clearFallbackLayer() {
    this.fallbackLayer.removeChildren().forEach((child) => child.destroy());
  }

  private drawEmergencyFallbackScene() {
    this.clearFallbackLayer();
    const width = this.width;
    const height = this.height;
    const horizon = height * 0.57;

    const background = new Graphics();
    rect(background, 0, 0, width, height, 0x070812);
    rect(background, 0, height * 0.58, width, height * 0.42, 0x0b0b16, 0.9);
    rect(background, 0, 0, width, height * 0.55, 0x10122a, 0.78);
    this.fallbackLayer.addChild(background);

    const room = new Graphics();
    rect(room, width * 0.08, height * 0.08, width * 0.84, height * 0.46, 0x171936, 0.5, 26);
    strokeLine(room, [width * 0.09, horizon, width * 0.24, height * 0.28, width * 0.76, height * 0.28, width * 0.91, horizon], 0x5964a8, 0.22, 2);
    strokeLine(room, [width * 0.5, height * 0.08, width * 0.5, horizon], 0x1df7ff, 0.08, 2);
    rect(room, width * 0.12, height * 0.24, width * 0.16, height * 0.13, 0x12142b, 0.72, 12);
    rect(room, width * 0.68, height * 0.22, width * 0.2, height * 0.035, 0x070812, 0.82, 6);
    this.fallbackLayer.addChild(room);

    const desk = new Graphics();
    rect(desk, width * 0.05, height * 0.67, width * 0.9, height * 0.11, 0x211421, 0.98, 18);
    rect(desk, width * 0.08, height * 0.65, width * 0.84, height * 0.065, 0x3c2333, 1, 18);
    this.fallbackLayer.addChild(desk);

    const monitors = new Graphics();
    this.drawMonitor(monitors, width * 0.18, height * 0.43, width * 0.2, height * 0.16, 0x1df7ff);
    this.drawMonitor(monitors, width * 0.4, height * 0.36, width * 0.25, height * 0.21, 0xff3bbd);
    this.drawMonitor(monitors, width * 0.67, height * 0.44, width * 0.18, height * 0.145, 0xffe04e);
    this.fallbackLayer.addChild(monitors);

    const haze = new Graphics();
    rect(haze, 0, 0, width, height, 0x000000, 0.06);
    rect(haze, 0, height * 0.78, width, height * 0.22, 0xff8c2e, 0.055);
    rect(haze, 0, 0, width, height * 0.18, 0x1df7ff, 0.035);
    this.fallbackLayer.addChild(haze);
  }

  private drawMonitor(graphics: Graphics, x: number, y: number, width: number, height: number, accent: number) {
    rect(graphics, x - 8, y - 8, width + 16, height + 16, 0x060711, 0.96, 18);
    rect(graphics, x, y, width, height, 0x101939, 1, 12);
    rect(graphics, x + width * 0.06, y + height * 0.12, width * 0.88, height * 0.12, accent, 0.28, 4);
    rect(graphics, x + width * 0.08, y + height * 0.34, width * 0.42, height * 0.05, 0x6dff85, 0.34, 3);
    rect(graphics, x + width * 0.08, y + height * 0.48, width * 0.66, height * 0.045, 0xffffff, 0.16, 3);
    rect(graphics, x + width * 0.08, y + height * 0.62, width * 0.5, height * 0.045, 0xffe04e, 0.24, 3);
    rect(graphics, x + width * 0.68, y + height * 0.32, width * 0.18, height * 0.38, accent, 0.16, 8);
  }

  private createMonitorSparks() {
    const cyan = makeSparkTexture('rgba(29, 247, 255, 1)');
    const pink = makeSparkTexture('rgba(255, 59, 189, 1)');
    const count = this.reducedMotion ? (this.mode === 'modal' ? 2 : 0) : this.mode === 'modal' ? 5 : 2;
    for (let index = 0; index < count; index += 1) {
      const sprite = new Sprite(index % 2 ? pink : cyan);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      sprite.scale.set(0.12 + Math.random() * 0.1);
      this.glowLayer.addChild(sprite);
      this.sparks.push({
        sprite,
        xRatio: 0.28 + Math.random() * 0.44,
        yRatio: 0.34 + Math.random() * 0.26,
        phase: Math.random() * Math.PI * 2,
        speed: this.mode === 'modal' ? 0.2 + Math.random() * 0.26 : 0.12 + Math.random() * 0.12,
      });
    }
  }

  private createScreenFlickers() {
    const screens = [
      { x: 0.23, y: 0.48, w: 0.16, h: 0.12, color: 0x1df7ff },
      { x: 0.48, y: 0.46, w: 0.2, h: 0.16, color: 0xff3bbd },
      { x: 0.74, y: 0.5, w: 0.14, h: 0.11, color: 0xffe04e },
    ];

    screens.forEach(({ color }) => {
      const flicker = new Graphics();
      flicker.blendMode = 'add';
      flicker.alpha = this.reducedMotion || this.mode === 'preview' ? 0.018 : 0.035;
      rect(flicker, -0.5, -0.5, 1, 1, color, 1, 0.08);
      this.screenFlickerLayer.addChild(flicker);
      this.screenFlickers.push(flicker);
    });
  }

  private positionAnimatedElements() {
    this.rimGlow.position.set(this.width * 0.5, this.height * 0.22);
    this.rimGlow.scale.set(Math.max(this.width, this.height) / 300);
    this.monitorGlows[0].position.set(this.width * 0.3, this.height * 0.5);
    this.monitorGlows[0].scale.set(this.width / 520, this.height / 680);
    this.monitorGlows[1].position.set(this.width * 0.52, this.height * 0.48);
    this.monitorGlows[1].scale.set(this.width / 520, this.height / 680);
    this.monitorGlows[2].position.set(this.width * 0.73, this.height * 0.51);
    this.monitorGlows[2].scale.set(this.width / 520, this.height / 720);
    this.sparks.forEach((spark) => {
      spark.sprite.x = spark.xRatio * this.width;
      spark.sprite.y = spark.yRatio * this.height;
    });

    const screens = [
      { x: 0.23, y: 0.48, w: 0.16, h: 0.12 },
      { x: 0.48, y: 0.46, w: 0.2, h: 0.16 },
      { x: 0.74, y: 0.5, w: 0.14, h: 0.11 },
    ];
    this.screenFlickers.forEach((flicker, index) => {
      const screen = screens[index];
      flicker.position.set(this.width * screen.x, this.height * screen.y);
      flicker.scale.set(this.width * screen.w, this.height * screen.h);
    });
  }
}
