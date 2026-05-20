import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

patchFile('src/App.tsx', (source) => {
  let next = source.replace(
    /\n\s*\{state\.lastOfflineReward\s*>\s*0\s*&&\s*\(\s*\n\s*<button\s+className="offline-toast"[\s\S]*?<\/button>\s*\n\s*\)\}\s*\n/g,
    '\n'
  );

  if (next.includes('offline-toast') || next.includes('OFFLINE DROP')) {
    throw new Error('release-results-update: failed to remove offline drop button from src/App.tsx');
  }

  if (!next.includes('function criticToneClass(score: number)')) {
    next = next.replace('\nfunction ReleaseModal(', '\n' + "function criticToneClass(score: number) {\n  if (score >= 9) return 'critic-score-luxury';\n  if (score >= 6.5) return 'critic-score-good';\n  if (score >= 5) return 'critic-score-mid';\n  if (score >= 3.1) return 'critic-score-low';\n  return 'critic-score-bad';\n}\n\n" + 'function ReleaseModal(');
  }

  if (!next.includes('release-score-top')) {
    next = next.replace(/\n\s*<div className="cover-art">[\s\S]*?<\/div>\s*\n/, '\n');

    const finalScoreBlock = /\n\s*\{showFinal\s*\?\s*\(\s*\n\s*<div className="score-stage">[\s\S]*?\n\s*<\/div>\s*\n\s*\)\s*:\s*\(\s*\n\s*<div className="score-suspense">Издания готовят оценки…<\/div>\s*\n\s*\)\}/;
    if (!finalScoreBlock.test(next)) {
      throw new Error('release-results-update: failed to locate final score block in src/App.tsx');
    }
    next = next.replace(finalScoreBlock, '\n');

    const scoreTop = `
        <div className="release-score-top">
          {showFinal ? (
            <div className="score-stage">
              <ConfettiBurst />
              <strong className="big-score">{result.score}/10</strong>
              <span className="quality">{result.qualityLabel} · Комбо: {comboLabel(result.combo)}</span>
              <span className="critic-average-note">Средняя оценка изданий: {result.criticAverage}/10. Итоговая оценка игры считается отдельно и учитывает модификаторы ниже.</span>
            </div>
          ) : (
            <div className="score-suspense">Издания готовят оценки…</div>
          )}
        </div>`;

    next = next.replace(
      /\n\s*<h2 id="release-title">\{result\.projectName\}<\/h2>/,
      (match) => `${match}${scoreTop}`
    );
  }

  next = next.replace(
    /className="critic-grid animated-critics"/g,
    'className="critic-grid animated-critics release-critic-grid-2x2"'
  );

  next = next.replace(
    /<div className=\{step > index \? 'critic-card shown' : 'critic-card'\} key=\{critic\.name\}>/g,
    "<div className={`${step > index ? 'critic-card shown' : 'critic-card'} ${step > index ? criticToneClass(critic.score) : ''}`} key={critic.name}>"
  );

  if (next.includes('cover-art')) {
    throw new Error('release-results-update: failed to remove cover art from release modal in src/App.tsx');
  }

  if (!next.includes('release-score-top') || !next.includes('release-critic-grid-2x2') || !next.includes('criticToneClass(critic.score)')) {
    throw new Error('release-results-update: failed to patch release modal layout in src/App.tsx');
  }

  return next;
});

patchFile('src/gameLogic.ts', (source) => {
  let next = source.replace(/import \{([^}]+)\} from '\.\/gameData';/, (match, names) => {
    const cleaned = names
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name && name !== 'critics')
      .join(', ');
    return `import { ${cleaned} } from './gameData';`;
  });

  if (!next.includes("from './pressData'")) {
    next = next.replace("import type { AudienceState", "import { criticOutlets, getPressComment } from './pressData';\nimport type { AudienceState");
  }

  const criticNew = "  const shuffledCritics = [...criticOutlets].sort(() => Math.random() - 0.5).slice(0, 4);\n  const criticResults = shuffledCritics.map((criticName) => {\n    const criticScore = Number(clamp(score + Math.random() * 2.2 - 1.1 + audienceScore * 0.18 + marketScore * 0.15, 1, 10).toFixed(1));\n    return {\n      name: `«${criticName}»`,\n      quote: getPressComment(criticScore),\n      score: criticScore,\n    };\n  });";

  const criticBlockPattern = /  const criticResults = critics\.map\(\(critic\) => \(\{[\s\S]*?\n  \}\)\);/;
  if (criticBlockPattern.test(next)) {
    next = next.replace(criticBlockPattern, criticNew);
  }

  if (next.includes('critics.map')) {
    throw new Error('release-results-update: failed to replace old critics.map block in src/gameLogic.ts');
  }

  return next;
});
