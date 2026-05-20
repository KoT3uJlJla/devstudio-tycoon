import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

if (!existsSync('public')) mkdirSync('public', { recursive: true });
copyFileSync('public/share-release-story.png', 'public/share-release-story.png');

patchFile('src/telegram.ts', (source) => {
  let next = source;

  next = next.replace(
    "const SHARE_RELEASE_STORY_IMAGE = '/share-release-story.svg';",
    "const SHARE_RELEASE_STORY_IMAGE = '/share-release-story.png';",
  );

  if (!next.includes('isVersionAtLeast?: (version: string) => boolean;')) {
    next = next.replace(
      "shareToStory?: (mediaUrl: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;",
      "shareToStory?: (mediaUrl: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;\n        isVersionAtLeast?: (version: string) => boolean;",
    );
  }

  if (!next.includes('function canShareToStory()')) {
    next = next.replace(
      "function showStoryPlaceholder(text: string, refUrl: string) {",
      "function canShareToStory() {\n  const webApp = window.Telegram?.WebApp;\n  if (!webApp?.shareToStory) return false;\n  if (typeof webApp.isVersionAtLeast === 'function') return webApp.isVersionAtLeast('7.8');\n  return true;\n}\n\nfunction showStoryPlaceholder(text: string, refUrl: string) {",
    );
  }

  next = next.replace(
    "if (window.Telegram?.WebApp?.shareToStory) {",
    "if (canShareToStory()) {",
  );

  next = next.replace(
    "text: payload.storyText ?? text.slice(0, 180),",
    "text: (payload.storyText ?? text).slice(0, 200),",
  );

  return next;
});

console.log('Telegram story share patch applied.');
console.log('Added public/share-release-story.png and switched shareToStory to PNG asset.');
