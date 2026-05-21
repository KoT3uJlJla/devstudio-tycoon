import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/App.tsx';
let source = readFileSync(path, 'utf8');
const signature = 'function formatProductInstinctTime(ms: number)';

function findFunctionEnd(text, start) {
  const open = text.indexOf('{', start);
  if (open === -1) return -1;
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        let end = index + 1;
        while (text[end] === '\r' || text[end] === '\n') end += 1;
        return end;
      }
    }
  }
  return -1;
}

const first = source.indexOf(signature);
if (first !== -1) {
  let searchFrom = first + signature.length;
  while (true) {
    const duplicate = source.indexOf(signature, searchFrom);
    if (duplicate === -1) break;
    const end = findFunctionEnd(source, duplicate);
    if (end === -1) throw new Error('fix-product-instinct-duplicates: cannot find duplicate function end');
    source = source.slice(0, duplicate) + source.slice(end);
    searchFrom = first + signature.length;
  }
}

writeFileSync(path, source);
console.log('fix-product-instinct-duplicates: ok');
