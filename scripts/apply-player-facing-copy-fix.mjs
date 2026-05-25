import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

patchFile('src/App.tsx', (source) => {
  let next = source;

  next = next.replace(
    "      <p className=\"muted\">Прокачка покупается за монеты. Последний уровень рассчитан как долгий F2P-рубеж: без доната путь должен занимать около 30 реальных дней активного возврата.</p>",
    "      <p className=\"muted\">Прокачка покупается за монеты. Улучшение студии открывает новые слоты команды. Больше сотрудников повышают эффективность разработки и релизов, но расходы на студию тоже вырастут.</p>",
  );

  next = next.replace(
    /\s*<p className=\"small muted\">Прогресс разработки синхронизируется с backend при действиях и сохранении\. Если backend недоступен, игра использует локальный режим разработки\.<\/p>/g,
    '',
  );

  next = next.replace(
    /\s*<p className=\"muted\">Прогресс разработки синхронизируется с backend при действиях и сохранении\. Если backend недоступен, игра использует локальный режим разработки\.<\/p>/g,
    '',
  );

  if (next.includes('Последний уровень рассчитан как долгий F2P-рубеж')) {
    console.warn('player-facing-copy-fix: studio technical copy still found');
  }
  if (next.includes('Прогресс разработки синхронизируется с backend')) {
    console.warn('player-facing-copy-fix: backend technical copy still found');
  }

  return next;
});
