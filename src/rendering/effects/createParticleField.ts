import { Container, Sprite, Texture } from 'pixi.js';

type ParticleKind = 'dust' | 'code' | 'coin';

type Particle = {
  sprite: Sprite;
  baseX: number;
  baseY: number;
  speed: number;
  drift: number;
  phase: number;
  size: number;
  kind: ParticleKind;
};

type ParticleFieldOptions = {
  reducedMotion?: boolean;
};

const codeGlyphs = ['{ }', '</>', '01', 'fn', '++', '#'];

function makeParticleTexture(kind: ParticleKind, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const context = canvas.getContext('2d');
  if (!context) return Texture.WHITE;

  context.clearRect(0, 0, 48, 48);
  if (kind === 'code') {
    context.font = '900 15px ui-monospace, SFMono-Regular, Menlo, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = color;
    context.shadowBlur = 8;
    context.fillStyle = color;
    context.fillText(codeGlyphs[Math.floor(Math.random() * codeGlyphs.length)], 24, 24);
  } else {
    const gradient = context.createRadialGradient(24, 24, 1, 24, 24, kind === 'coin' ? 10 : 7);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.55, color.replace('1)', '0.34)'));
    gradient.addColorStop(1, color.replace('1)', '0)'));
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(24, 24, kind === 'coin' ? 10 : 7, 0, Math.PI * 2);
    context.fill();
  }

  return Texture.from(canvas);
}

export function createParticleField(options: ParticleFieldOptions = {}) {
  const container = new Container();
  const particles: Particle[] = [];
  const reducedMotion = Boolean(options.reducedMotion);
  const targetCount = reducedMotion ? 14 : 42;
  const textures = {
    dust: makeParticleTexture('dust', 'rgba(255, 239, 184, 1)'),
    code: makeParticleTexture('code', 'rgba(29, 247, 255, 1)'),
    coin: makeParticleTexture('coin', 'rgba(255, 224, 78, 1)'),
  };

  for (let index = 0; index < targetCount; index += 1) {
    const kind: ParticleKind = index % 7 === 0 ? 'code' : index % 11 === 0 ? 'coin' : 'dust';
    const sprite = new Sprite(textures[kind]);
    sprite.anchor.set(0.5);
    sprite.alpha = kind === 'dust' ? 0.18 : 0.26;
    sprite.blendMode = 'add';
    container.addChild(sprite);

    particles.push({
      sprite,
      baseX: Math.random(),
      baseY: Math.random(),
      speed: 0.008 + Math.random() * 0.022,
      drift: 0.006 + Math.random() * 0.018,
      phase: Math.random() * Math.PI * 2,
      size: kind === 'code' ? 0.38 + Math.random() * 0.24 : 0.1 + Math.random() * 0.18,
      kind,
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
      particles.forEach((particle, index) => {
        particle.phase += elapsedSeconds * particle.speed;
        particle.sprite.x = ((particle.baseX + Math.sin(particle.phase + index) * particle.drift + 1) % 1) * width;
        particle.sprite.y = ((particle.baseY - particle.phase * 0.018 + 1) % 1) * height;
        particle.sprite.alpha = (particle.kind === 'dust' ? 0.13 : 0.2) + Math.sin(particle.phase * 6) * 0.06;
        particle.sprite.rotation += elapsedSeconds * (particle.kind === 'code' ? 0.08 : 0.02);
      });
    },
    destroy() {
      container.destroy({ children: true });
    },
  };
}
