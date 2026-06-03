import { Container, Sprite, Texture } from 'pixi.js';

type Particle = {
  sprite: Sprite;
  baseX: number;
  baseY: number;
  speed: number;
  drift: number;
  phase: number;
  size: number;
};

type ParticleFieldMode = 'preview' | 'modal';

type ParticleFieldOptions = {
  reducedMotion?: boolean;
  mode?: ParticleFieldMode;
};

function makeDustTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) return Texture.WHITE;

  const gradient = context.createRadialGradient(16, 16, 1, 16, 16, 7);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.55, color.replace('1)', '0.25)'));
  gradient.addColorStop(1, color.replace('1)', '0)'));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(16, 16, 7, 0, Math.PI * 2);
  context.fill();

  return Texture.from(canvas);
}

export function createParticleField(options: ParticleFieldOptions = {}) {
  const container = new Container();
  const particles: Particle[] = [];
  const reducedMotion = Boolean(options.reducedMotion);
  const mode = options.mode ?? 'preview';
  const targetCount = reducedMotion ? (mode === 'modal' ? 5 : 2) : mode === 'modal' ? 14 : 4;
  const texture = makeDustTexture('rgba(255, 239, 184, 1)');

  for (let index = 0; index < targetCount; index += 1) {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.alpha = 0.12;
    sprite.blendMode = 'add';
    container.addChild(sprite);

    particles.push({
      sprite,
      baseX: Math.random(),
      baseY: Math.random(),
      speed: 0.006 + Math.random() * 0.014,
      drift: 0.004 + Math.random() * 0.012,
      phase: Math.random() * Math.PI * 2,
      size: 0.08 + Math.random() * 0.13,
    });
  }

  return {
    view: container,
    resize(width: number, height: number) {
      particles.forEach((particle) => {
        particle.sprite.x = particle.baseX * width;
        particle.sprite.y = particle.baseY * height;
        particle.sprite.scale.set(particle.size);
      });
    },
    update(elapsedSeconds: number, width: number, height: number) {
      if (reducedMotion) return;
      const cappedElapsed = Math.min(elapsedSeconds, 0.05);
      particles.forEach((particle, index) => {
        particle.phase += cappedElapsed * particle.speed;
        particle.sprite.x = ((particle.baseX + Math.sin(particle.phase + index) * particle.drift + 1) % 1) * width;
        particle.sprite.y = ((particle.baseY - particle.phase * 0.012 + 1) % 1) * height;
        particle.sprite.alpha = 0.08 + Math.sin(particle.phase * 5) * 0.035;
        particle.sprite.rotation += cappedElapsed * 0.015;
      });
    },
    destroy() {
      container.destroy({ children: true });
    },
  };
}
