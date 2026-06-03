import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { createGlowOrb } from '../effects/createGlowOrb';
import { createParticleField } from '../effects/createParticleField';

type StudioBackdropMode = 'preview' | 'modal';

type StudioBackdropSceneOptions = {
  reducedMotion?: boolean;
  mode?: StudioBackdropMode;
};

type Spark = {
  sprite: Sprite;
  xRatio: number;
  yRatio: number;
  phase: number;
  speed: number;
};

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

export class StudioBackdropScene {
  readonly view = new Container();

  private readonly backgroundLayer = new Container();
  private readonly roomLayer = new Container();
  private readonly deskLayer = new Container();
  private readonly monitorsLayer = new Container();
  private readonly glowLayer = new Container();
  private readonly particleLayer = new Container();
  private readonly hazeLayer = new Container();
  private readonly reducedMotion: boolean;
  private readonly mode: StudioBackdropMode;
  private readonly particles;
  private readonly monitorGlows = [createGlowOrb(0x1df7ff, 180, 0.52), createGlowOrb(0xff3bbd, 160, 0.33), createGlowOrb(0xffe04e, 210, 0.22)];
  private readonly rimGlow = createGlowOrb(0x5b6cff, 420, 0.16);
  private readonly sparks: Spark[] = [];
  private elapsed = 0;
  private width = 0;
  private height = 0;

  constructor(options: StudioBackdropSceneOptions = {}) {
    this.reducedMotion = Boolean(options.reducedMotion);
    this.mode = options.mode ?? 'preview';
    this.particles = createParticleField({ reducedMotion: this.reducedMotion, mode: this.mode });

    this.view.eventMode = 'none';
    this.view.interactiveChildren = false;
    this.view.addChild(this.backgroundLayer, this.roomLayer, this.deskLayer, this.monitorsLayer, this.glowLayer, this.particleLayer, this.hazeLayer);
    this.glowLayer.addChild(this.rimGlow, ...this.monitorGlows);
    this.particleLayer.addChild(this.particles.view);
    this.createMonitorSparks();
  }

  resize(width: number, height: number) {
    const nextWidth = Math.max(1, width);
    const nextHeight = Math.max(1, height);
    if (Math.round(nextWidth) === Math.round(this.width) && Math.round(nextHeight) === Math.round(this.height)) return;
    this.width = nextWidth;
    this.height = nextHeight;
    this.drawStaticScene();
    this.particles.resize(this.width, this.height);
    this.positionAnimatedElements();
  }

  update(ticker: { elapsedMS?: number; deltaMS?: number }) {
    const elapsedSeconds = Math.min((ticker.elapsedMS ?? ticker.deltaMS ?? 16.67) / 1000, 0.05);
    this.elapsed += elapsedSeconds;

    const parallax = this.reducedMotion || this.mode === 'preview' ? 0 : Math.sin(this.elapsed * 0.18);
    this.roomLayer.x = parallax * 4;
    this.deskLayer.x = parallax * -3;
    this.monitorsLayer.x = parallax * -5;
    this.glowLayer.x = parallax * -4;

    if (!this.reducedMotion) {
      this.monitorGlows.forEach((glow, index) => {
        glow.alpha = [0.52, 0.33, 0.22][index] + Math.sin(this.elapsed * (0.8 + index * 0.18)) * 0.045;
      });
      this.sparks.forEach((spark, index) => {
        spark.phase += elapsedSeconds * spark.speed;
        spark.sprite.x = spark.xRatio * this.width + Math.sin(spark.phase + index) * 6;
        spark.sprite.y = spark.yRatio * this.height + Math.cos(spark.phase * 0.8) * 4;
        spark.sprite.alpha = 0.18 + Math.sin(spark.phase * 4) * 0.09;
      });
    }

    this.particles.update(elapsedSeconds, this.width, this.height);
  }

  destroy() {
    this.particles.destroy();
    this.view.destroy({ children: true });
  }

  private clearStaticLayers() {
    this.backgroundLayer.removeChildren().forEach((child) => child.destroy());
    this.roomLayer.removeChildren().forEach((child) => child.destroy());
    this.deskLayer.removeChildren().forEach((child) => child.destroy());
    this.monitorsLayer.removeChildren().forEach((child) => child.destroy());
    this.hazeLayer.removeChildren().forEach((child) => child.destroy());
  }

  private drawStaticScene() {
    this.clearStaticLayers();
    const width = this.width;
    const height = this.height;
    const horizon = height * 0.57;

    const background = new Graphics();
    rect(background, 0, 0, width, height, 0x070812);
    rect(background, 0, height * 0.58, width, height * 0.42, 0x0b0b16, 0.9);
    rect(background, 0, 0, width, height * 0.55, 0x10122a, 0.78);
    this.backgroundLayer.addChild(background);

    const room = new Graphics();
    rect(room, width * 0.08, height * 0.08, width * 0.84, height * 0.46, 0x171936, 0.5, 26);
    strokeLine(room, [width * 0.09, horizon, width * 0.24, height * 0.28, width * 0.76, height * 0.28, width * 0.91, horizon], 0x5964a8, 0.22, 2);
    strokeLine(room, [width * 0.5, height * 0.08, width * 0.5, horizon], 0x1df7ff, 0.08, 2);
    for (let index = 0; index < 5; index += 1) {
      const x = width * (0.15 + index * 0.17);
      rect(room, x, height * 0.13, width * 0.095, height * 0.085, index % 2 ? 0x20234d : 0x21172f, 0.68, 8);
      strokeLine(room, [x + 8, height * 0.16, x + width * 0.095 - 8, height * 0.16], index % 2 ? 0xff3bbd : 0x1df7ff, 0.22, 2);
    }
    rect(room, width * 0.12, height * 0.24, width * 0.16, height * 0.13, 0x12142b, 0.72, 12);
    rect(room, width * 0.14, height * 0.26, width * 0.04, height * 0.035, 0xffe04e, 0.42, 5);
    rect(room, width * 0.19, height * 0.26, width * 0.055, height * 0.035, 0x1df7ff, 0.3, 5);
    rect(room, width * 0.14, height * 0.31, width * 0.11, height * 0.018, 0xff3bbd, 0.24, 4);
    rect(room, width * 0.68, height * 0.22, width * 0.2, height * 0.035, 0x070812, 0.82, 6);
    rect(room, width * 0.7, height * 0.17, width * 0.04, height * 0.05, 0xffe04e, 0.5, 5);
    rect(room, width * 0.77, height * 0.16, width * 0.036, height * 0.06, 0x6dff85, 0.3, 5);
    rect(room, width * 0.83, height * 0.18, width * 0.03, height * 0.04, 0xff3bbd, 0.35, 5);
    this.roomLayer.addChild(room);

    const desk = new Graphics();
    rect(desk, width * 0.05, height * 0.67, width * 0.9, height * 0.11, 0x211421, 0.98, 18);
    rect(desk, width * 0.08, height * 0.65, width * 0.84, height * 0.065, 0x3c2333, 1, 18);
    rect(desk, width * 0.14, height * 0.74, width * 0.05, height * 0.2, 0x11111f, 0.9, 10);
    rect(desk, width * 0.78, height * 0.74, width * 0.05, height * 0.2, 0x11111f, 0.9, 10);
    rect(desk, width * 0.33, height * 0.7, width * 0.26, height * 0.028, 0x080a14, 0.92, 8);
    for (let index = 0; index < 10; index += 1) rect(desk, width * (0.35 + index * 0.022), height * 0.706, width * 0.012, height * 0.006, 0x9befff, 0.5, 2);
    strokeLine(desk, [width * 0.43, height * 0.67, width * 0.38, height * 0.74, width * 0.3, height * 0.76], 0x1df7ff, 0.17, 3);
    strokeLine(desk, [width * 0.56, height * 0.67, width * 0.62, height * 0.73, width * 0.69, height * 0.75], 0xff3bbd, 0.16, 3);
    rect(desk, width * 0.66, height * 0.61, width * 0.06, height * 0.04, 0xffe04e, 0.52, 8);
    rect(desk, width * 0.72, height * 0.6, width * 0.026, height * 0.055, 0x1df7ff, 0.32, 7);
    this.deskLayer.addChild(desk);

    const monitors = new Graphics();
    this.drawMonitor(monitors, width * 0.18, height * 0.43, width * 0.2, height * 0.16, 0x1df7ff);
    this.drawMonitor(monitors, width * 0.4, height * 0.36, width * 0.25, height * 0.21, 0xff3bbd);
    this.drawMonitor(monitors, width * 0.67, height * 0.44, width * 0.18, height * 0.145, 0xffe04e);
    rect(monitors, width * 0.27, height * 0.59, width * 0.045, height * 0.06, 0x080a14, 0.9, 6);
    rect(monitors, width * 0.5, height * 0.58, width * 0.055, height * 0.07, 0x080a14, 0.9, 6);
    rect(monitors, width * 0.745, height * 0.59, width * 0.042, height * 0.06, 0x080a14, 0.9, 6);
    rect(monitors, width * 0.2, height * 0.64, width * 0.17, height * 0.022, 0x070812, 0.94, 7);
    rect(monitors, width * 0.44, height * 0.64, width * 0.17, height * 0.022, 0x070812, 0.94, 7);
    rect(monitors, width * 0.68, height * 0.64, width * 0.16, height * 0.022, 0x070812, 0.94, 7);
    this.monitorsLayer.addChild(monitors);

    const haze = new Graphics();
    rect(haze, 0, 0, width, height, 0x000000, 0.06);
    rect(haze, 0, height * 0.78, width, height * 0.22, 0xff8c2e, 0.055);
    rect(haze, 0, 0, width, height * 0.18, 0x1df7ff, 0.035);
    this.hazeLayer.addChild(haze);
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
    const count = this.reducedMotion ? (this.mode === 'modal' ? 3 : 1) : this.mode === 'modal' ? 7 : 3;
    for (let index = 0; index < count; index += 1) {
      const sprite = new Sprite(index % 2 ? pink : cyan);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      sprite.scale.set(0.18 + Math.random() * 0.16);
      this.glowLayer.addChild(sprite);
      this.sparks.push({
        sprite,
        xRatio: 0.28 + Math.random() * 0.44,
        yRatio: 0.34 + Math.random() * 0.26,
        phase: Math.random() * Math.PI * 2,
        speed: this.mode === 'modal' ? 0.28 + Math.random() * 0.34 : 0.16 + Math.random() * 0.18,
      });
    }
  }

  private positionAnimatedElements() {
    this.rimGlow.position.set(this.width * 0.5, this.height * 0.22);
    this.rimGlow.scale.set(Math.max(this.width, this.height) / 300);
    this.monitorGlows[0].position.set(this.width * 0.28, this.height * 0.5);
    this.monitorGlows[0].scale.set(this.width / 360, this.height / 460);
    this.monitorGlows[1].position.set(this.width * 0.53, this.height * 0.48);
    this.monitorGlows[1].scale.set(this.width / 360, this.height / 460);
    this.monitorGlows[2].position.set(this.width * 0.76, this.height * 0.51);
    this.monitorGlows[2].scale.set(this.width / 340, this.height / 520);
    this.sparks.forEach((spark) => {
      spark.sprite.x = spark.xRatio * this.width;
      spark.sprite.y = spark.yRatio * this.height;
    });
  }
}
