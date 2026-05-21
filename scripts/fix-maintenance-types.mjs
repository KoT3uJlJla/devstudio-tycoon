import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/storage.ts';
let source = readFileSync(path, 'utf8');

function patchBackendSavePayload(text) {
  return text.replace(/type\s+BackendSavePayload\s*=\s*\{([\s\S]*?)\n\};/, (match, body) => {
    let nextBody = body;
    const insertAfterOk = (line) => {
      if (nextBody.includes(line.trim())) return;
      nextBody = nextBody.replace(/\n\s*ok\?:\s*boolean;?/, (okLine) => okLine + '\n  ' + line);
    };
    insertAfterOk('error?: string;');
    insertAfterOk('role?: string;');
    insertAfterOk('gameStatus?: { status?: string; closed?: boolean; message?: string } | null;');
    return 'type BackendSavePayload = {' + nextBody + '\n};';
  });
}

function patchServerLoadResult(text) {
  return text.replace(/type\s+ServerLoadResult\s*=([\s\S]*?)\n\s*\|\s*\{\s*kind:\s*'unavailable'\s*\};/, (match, body) => {
    if (match.includes("kind: 'closed'")) return match;
    return 'type ServerLoadResult =' + body + "\n  | { kind: 'closed' }\n  | { kind: 'unavailable' };";
  });
}

source = patchBackendSavePayload(source);
source = patchServerLoadResult(source);

if (!source.includes('error?: string;') || !source.includes('gameStatus?:') || !source.includes("kind: 'closed'")) {
  throw new Error('fix-maintenance-types: failed to patch storage types');
}

writeFileSync(path, source);
console.log('fix-maintenance-types: ok');
