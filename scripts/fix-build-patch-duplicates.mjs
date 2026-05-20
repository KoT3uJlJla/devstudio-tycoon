import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function findFunctionEnd(source, start) {
  const open = source.indexOf('{', start);
  if (open === -1) return -1;
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        let end = index + 1;
        while (source[end] === '\r' || source[end] === '\n') end += 1;
        return end;
      }
    }
  }
  return -1;
}

function removeDuplicateFunctionBlocks(source, signature) {
  let next = source;
  let first = next.indexOf(signature);
  if (first === -1) return next;
  let searchFrom = first + signature.length;
  while (true) {
    const duplicate = next.indexOf(signature, searchFrom);
    if (duplicate === -1) break;
    const end = findFunctionEnd(next, duplicate);
    if (end === -1) break;
    next = `${next.slice(0, duplicate)}${next.slice(end)}`;
    searchFrom = first + signature.length;
  }
  return next;
}

patchFile('src/App.tsx', (source) => {
  let next = source;
  // Build patches can be run repeatedly locally. Keep only one platform lookup in AudiencePanel.
  next = next.replace(
    /\n  const platform = platforms\.find\(\(item\) => item\.id === state\.audience\.desiredPlatformId\);(?:\r?\n  const platform = platforms\.find\(\(item\) => item\.id === state\.audience\.desiredPlatformId\);)+/g,
    '\n  const platform = platforms.find((item) => item.id === state.audience.desiredPlatformId);',
  );
  return next;
});

patchFile('src/gameLogic.ts', (source) => {
  let next = source;
  next = removeDuplicateFunctionBlocks(next, 'export function projectDurationSecondsForReleaseCount(gamesReleased: number)');
  next = removeDuplicateFunctionBlocks(next, 'function developmentEventCountForReleaseCount(gamesReleased: number)');
  return next;
});
