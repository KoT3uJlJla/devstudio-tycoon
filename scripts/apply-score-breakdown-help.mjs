import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

const scoreHelpBlock = String.raw`function scoreExplanation(item: ScoreBreakdownItem) {
  const label = item.label;
  const isPositive = item.value > 0;
  const signText = item.kind === 'base'
    ? 'Это основа оценки.'
    : isPositive
      ? 'Сейчас этот фактор помогает релизу.'
      : item.value < 0
        ? 'Сейчас этот фактор снижает оценку.'
        : 'Сейчас этот фактор почти нейтрален.';

  const details: Record<string, { text: string; influence: string; tone: 'high' | 'medium' | 'none' }> = {
    'Фокус разработки': { text: 'Показывает, насколько хорошо распределён фокус между этапами разработки под выбранный проект.', influence: 'Ваши решения сильно влияют на этот модификатор.', tone: 'high' },
    'Чеклист тестирования': { text: 'Бонус за процессы контроля качества: меньше багов, стабильнее релиз.', influence: 'Вы можете влиять на него через исследования и развитие студии.', tone: 'medium' },
    'Ощущение от игры': { text: 'Отвечает за отзывчивость, темп, анимации и общее чувство управления.', influence: 'Вы можете влиять на него через исследования и фокус разработки.', tone: 'medium' },
    'Звуковая лаборатория': { text: 'Учитывает качество звука, музыки и атмосферы, которую они создают.', influence: 'Вы можете влиять на него через исследования.', tone: 'medium' },
    'Продвижение': { text: 'Показывает эффект маркетингового продвижения перед релизом.', influence: 'Ваше решение напрямую влияет на этот модификатор.', tone: 'high' },
    'Решения разработки': { text: 'Сумма последствий событий, которые случились во время разработки.', influence: 'Ваши решения во время событий напрямую влияют на этот модификатор.', tone: 'high' },
    'Импульс студии': { text: 'Отражает общий темп студии: прошлые релизы, опыт и накопленную динамику.', influence: 'Вы влияете на него постепенно через регулярные и сильные релизы.', tone: 'medium' },
    'Настроение аудитории': { text: 'Показывает, насколько текущая аудитория готова тепло принять такой проект.', influence: 'Вы можете влиять на него косвенно через выбор жанра, сеттинга и скан аудитории.', tone: 'medium' },
    'События рынка': { text: 'Внешние рыночные события, которые временно помогают или мешают релизам.', influence: 'Этот модификатор не зависит от ваших решений.', tone: 'none' },
    'Сложность технологий': { text: 'Штраф или риск за сложность выбранной платформы, жанра и технологий проекта.', influence: 'Вы влияете на него выбором проекта и подготовкой студии.', tone: 'medium' },
    'Непредсказуемость прессы': { text: 'Небольшая случайность, чтобы оценки не были полностью одинаковыми и предсказуемыми.', influence: 'Этот модификатор не зависит от ваших решений.', tone: 'none' },
  };

  if (label.startsWith('Комбо')) {
    return { title: 'Комбо жанра и сеттинга', text: 'Показывает, насколько хорошо выбранные жанр и сеттинг подходят друг другу.', influence: 'Ваш выбор напрямую влияет на этот модификатор.', tone: 'high' as const, signText };
  }

  const fallback = item.kind === 'random'
    ? { text: 'Случайная реакция мира, прессы и виртуальных игроков.', influence: 'Этот модификатор не зависит от ваших решений.', tone: 'none' as const }
    : { text: 'Один из факторов, из которых складывается итоговая оценка релиза.', influence: 'Обычно на него можно влиять через выборы, исследования или развитие студии.', tone: 'medium' as const };
  const picked = details[label] ?? fallback;
  return { title: label, ...picked, signText };
}

function ScoreExplanationModal({ item, onClose }: { item: ScoreBreakdownItem; onClose: () => void }) {
  const info = scoreExplanation(item);
  const influenceLabel = info.tone === 'high' ? 'Сильное влияние игрока' : info.tone === 'medium' ? 'Косвенное влияние игрока' : 'Не зависит от игрока';
  return (
    <div className="nested-modal-backdrop score-help-backdrop" onClick={onClose}>
      <section className="score-help-modal comic-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" type="button" onClick={onClose} aria-label="Закрыть">×</button>
        <p className="eyebrow">Детализация оценки</p>
        <h3>{info.title}</h3>
        <div className={'score-help-influence influence-' + info.tone}>{influenceLabel}</div>
        <p>{info.text}</p>
        <p className="score-help-player-note">{info.influence}</p>
        <div className="score-help-value"><span>Текущий вклад</span><b>{item.kind === 'base' ? item.value.toFixed(2) : scoreDelta(item.value)}</b></div>
        <p className="small muted">{info.signText}</p>
        <button className="primary wide" type="button" onClick={onClose}>Понятно</button>
      </section>
    </div>
  );
}

`;

const scoreLineBlock = [
  "                {result.scoreBreakdown.map((item) => {",
  "                  const displayLabel = item.label === `Комбо ${result.combo}` ? `Комбо: ${comboLabel(result.combo)}` : item.label;",
  "                  const openScoreHelp = () => setSelectedBreakdown(item);",
  "                  return (",
  "                    <div",
  "                      className={`score-line ${item.kind}`}",
  "                      key={`${item.label}-${item.value}`}",
  "                      role=\"button\"",
  "                      tabIndex={0}",
  "                      aria-label={`Показать детализацию: ${displayLabel}`}",
  "                      onClick={openScoreHelp}",
  "                      onPointerDown={openScoreHelp}",
  "                      onTouchEnd={(event) => { event.preventDefault(); openScoreHelp(); }}",
  "                      onKeyDown={(event) => {",
  "                        if (event.key === 'Enter' || event.key === ' ') {",
  "                          event.preventDefault();",
  "                          openScoreHelp();",
  "                        }",
  "                      }}",
  "                    >",
  "                      <span>{displayLabel}</span>",
  "                      <b>{item.kind === 'base' ? item.value.toFixed(2) : scoreDelta(item.value)}</b>",
  "                      <button className=\"score-line-info\" type=\"button\" aria-label={`Пояснить модификатор: ${displayLabel}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); openScoreHelp(); }} onPointerDown={(event) => { event.stopPropagation(); openScoreHelp(); }} onTouchEnd={(event) => { event.preventDefault(); event.stopPropagation(); openScoreHelp(); }}>?</button>",
  "                    </div>",
  "                  );",
  "                })}"
].join('\n');

function replaceScoreHelpBlock(source) {
  const start = source.indexOf('function scoreExplanation(item: ScoreBreakdownItem)');
  const end = source.indexOf('const confettiPieces =', start);
  if (start === -1 || end === -1 || end <= start) return source;
  return source.slice(0, start) + scoreHelpBlock + source.slice(end);
}

function replaceScoreLines(source) {
  let next = source;
  const start = next.indexOf('{result.scoreBreakdown.map((item) => (');
  if (start !== -1) {
    const endMarker = '\n                ))}';
    const end = next.indexOf(endMarker, start);
    if (end !== -1) {
      return next.slice(0, start) + scoreLineBlock + next.slice(end + endMarker.length);
    }
  }
  return next
    .replaceAll('<i className="score-line-info" aria-hidden="true">i</i>', '<button className="score-line-info" type="button">?</button>')
    .replaceAll('<i className="score-line-info" aria-hidden="true">?</i>', '<button className="score-line-info" type="button">?</button>');
}

patchFile('src/App.tsx', (source) => {
  let next = replaceScoreHelpBlock(source);
  next = replaceScoreLines(next);

  if (!next.includes('Детализация оценки') || !next.includes('Сильное влияние игрока') || !next.includes('Не зависит от игрока')) {
    console.warn('score-breakdown-help: warning: explanation text was not inserted into App.tsx');
  }
  if (!next.includes('onPointerDown={openScoreHelp}') || !next.includes('score-line-info')) {
    console.warn('score-breakdown-help: warning: clickable modifier help button was not inserted into App.tsx');
  }

  return next;
});
