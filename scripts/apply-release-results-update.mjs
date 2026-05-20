import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

patchFile('src/App.tsx', (source) => {
  let next = source.replace(/\n      \{state\.lastOfflineReward > 0 && \(\n        <button className="offline-toast"[\s\S]*?\n        <\/button>\n      \)\}\n/g, '\n');

  if (!next.includes('function criticToneClass(score: number)')) {
    next = next.replace('\nfunction ReleaseModal(', '\n' + "function criticToneClass(score: number) {\n  if (score >= 9) return 'critic-score-luxury';\n  if (score >= 6.5) return 'critic-score-good';\n  if (score >= 5) return 'critic-score-mid';\n  if (score >= 3.1) return 'critic-score-low';\n  return 'critic-score-bad';\n}\n\n" + 'function ReleaseModal(');
  }

  const releaseOld = "        <div className=\"cover-art\"><Icon name=\"rocket\" /><i /></div>\n        <p className=\"eyebrow\">Релиз состоялся</p>\n        <h2 id=\"release-title\">{result.projectName}</h2>\n        <div className=\"critic-grid animated-critics\">\n          {result.critics.map((critic, index) => (\n            <div className={step > index ? 'critic-card shown' : 'critic-card'} key={critic.name}>\n              <span>{critic.name}</span>\n              <b>{step > index ? critic.score : '…'}</b>\n              <em>{step > index ? critic.quote : 'читают билд'}</em>\n            </div>\n          ))}\n        </div>\n        {showFinal ? (\n          <div className=\"score-stage\">\n            <ConfettiBurst />\n            <strong className=\"big-score\">{result.score}/10</strong>\n            <span className=\"quality\">{result.qualityLabel} · Комбо: {comboLabel(result.combo)}</span>\n            <span className=\"critic-average-note\">Средняя оценка изданий: {result.criticAverage}/10. Итоговая оценка игры считается отдельно и учитывает модификаторы ниже.</span>\n          </div>\n        ) : (\n          <div className=\"score-suspense\">Издания готовят оценки…</div>\n        )}";
  const releaseNew = "        <p className=\"eyebrow\">Релиз состоялся</p>\n        <h2 id=\"release-title\">{result.projectName}</h2>\n        <div className=\"release-score-top\">\n          {showFinal ? (\n            <div className=\"score-stage\">\n              <ConfettiBurst />\n              <strong className=\"big-score\">{result.score}/10</strong>\n              <span className=\"quality\">{result.qualityLabel} · Комбо: {comboLabel(result.combo)}</span>\n              <span className=\"critic-average-note\">Средняя оценка изданий: {result.criticAverage}/10. Итоговая оценка игры считается отдельно и учитывает модификаторы ниже.</span>\n            </div>\n          ) : (\n            <div className=\"score-suspense\">Издания готовят оценки…</div>\n          )}\n        </div>\n        <div className=\"critic-grid animated-critics release-critic-grid-2x2\">\n          {result.critics.map((critic, index) => (\n            <div className={`${step > index ? 'critic-card shown' : 'critic-card'} ${step > index ? criticToneClass(critic.score) : ''}`} key={critic.name}>\n              <span>{critic.name}</span>\n              <b>{step > index ? critic.score : '…'}</b>\n              <em>{step > index ? critic.quote : 'читают билд'}</em>\n            </div>\n          ))}\n        </div>";
  if (next.includes(releaseOld)) {
    next = next.replace(releaseOld, releaseNew);
  }

  return next;
});

patchFile('src/gameLogic.ts', (source) => {
  let next = source.replace(
    "import { baseGenreIds, baseThemeIds, comboMatrix, critics, developmentEventScenarios, gameNameParts, genres, negativeMarketEvents, platforms, positiveMarketEvents, themes } from './gameData';",
    "import { baseGenreIds, baseThemeIds, comboMatrix, developmentEventScenarios, gameNameParts, genres, negativeMarketEvents, platforms, positiveMarketEvents, themes } from './gameData';\nimport { criticOutlets, getPressComment } from './pressData';"
  );

  const criticOld = "  const criticResults = critics.map((critic) => ({\n    name: critic.name,\n    quote: critic.quote,\n    score: Number(clamp(score + Math.random() * 2.2 - 1.1 + audienceScore * 0.18 + marketScore * 0.15, 1, 10).toFixed(1)),\n  }));";
  const criticNew = "  const shuffledCritics = [...criticOutlets].sort(() => Math.random() - 0.5).slice(0, 4);\n  const criticResults = shuffledCritics.map((criticName) => {\n    const criticScore = Number(clamp(score + Math.random() * 2.2 - 1.1 + audienceScore * 0.18 + marketScore * 0.15, 1, 10).toFixed(1));\n    return {\n      name: `«${criticName}»`,\n      quote: getPressComment(criticScore),\n      score: criticScore,\n    };\n  });";
  if (next.includes(criticOld)) {
    next = next.replace(criticOld, criticNew);
  }

  return next;
});
