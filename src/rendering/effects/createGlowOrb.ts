import { Sprite, Texture } from 'pixi.js';

const textureCache = new Map<string, Texture>();

function toCssColor(color: number, alpha: number) {
  const red = (color >> 16) & 255;
  const green = (color >> 8) & 255;
  const blue = color & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getGlowTexture(color: number, size: number) {
  const key = `${color}-${size}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return Texture.WHITE;

  const radius = size / 2;
  const gradient = context.createRadialGradient(radius, radius, 1, radius, radius, radius);
  gradient.addColorStop(0, toCssColor(color, 0.72));
  gradient.addColorStop(0.38, toCssColor(color, 0.24));
  gradient.addColorStop(1, toCssColor(color, 0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = Texture.from(canvas);
  textureCache.set(key, texture);
  return texture;
}

export function createGlowOrb(color: number, size = 128, alpha = 1) {
  const orb = new Sprite(getGlowTexture(color, size));
  orb.anchor.set(0.5);
  orb.alpha = alpha;
  orb.blendMode = 'add';
  return orb;
}
