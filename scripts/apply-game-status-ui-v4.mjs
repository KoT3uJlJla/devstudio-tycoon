import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function must(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`apply-game-status-ui-v4 failed: ${label}`);
}

const storageHelper = `
function markGameClosed(payload: BackendSavePayload | null) {
  const status = isPlainObject(payload?.gameStatus) ? payload?.gameStatus : null;
  const message = typeof status?.message === 'string' && status.message.trim() ? status.message : 'Ведутся технические работы. Возвращайтесь позже';
  try {
    (window as unknown as { __devstudioGameClosed?: boolean }).__devstudioGameClosed = true;
    window.dispatchEvent(new CustomEvent('devstudio:game-closed', { detail: { message, role: payload?.role || 'user', status } }));
  } catch {
    // ignore
  }
}

function isGameClosedPayload(payload: BackendSavePayload | null) {
  return Boolean(payload && payload.error === 'game_closed');
}

async function backendJsonOrNull(response: globalThis.Response): Promise<BackendSavePayload | null> {
  const data = await response.json().catch(() => null) as BackendSavePayload | null;
  if (!response.ok && isGameClosedPayload(data)) return data;
  return response.ok ? data : null;
}
`;

patchFile('src/storage.ts', (source) => {
  let next = source;

  if (!next.includes('error?: string;')) {
    next = next.replace('type BackendSavePayload = {\n  ok?: boolean;\n', 'type BackendSavePayload = {\n  ok?: boolean;\n  error?: string;\n  role?: string;\n  gameStatus?: { status?: string; closed?: boolean; message?: string } | null;\n');
  }

  if (!next.includes("| { kind: 'closed' }")) {
    next = next.replace("  | { kind: 'empty' }\n  | { kind: 'unavailable' };", "  | { kind: 'empty' }\n  | { kind: 'closed' }\n  | { kind: 'unavailable' };");
  }

  if (!next.includes('__devstudioGameClosed')) {
    next = next.replace('\nfunction telegramInitData(): string {', storageHelper + '\nfunction telegramInitData(): string {');
  }

  next = next.replaceAll('.then((response) => (response.ok ? response.json() : null))', '.then(backendJsonOrNull)');

  if (!next.includes('if (isGameClosedPayload(payload)) { markGameClosed(payload); return null; }')) {
    next = next.replace('  if (!payload?.ok || !rawSave || !isPlainObject(rawSave)) return null;', '  if (isGameClosedPayload(payload)) { markGameClosed(payload); return null; }\n  if (!payload?.ok || !rawSave || !isPlainObject(rawSave)) return null;');
  }

  if (!next.includes("return { kind: 'closed' };")) {
    next = next.replace("  if (!payload) return { kind: 'unavailable' };\n\n  const state = stateFromBackendPayload(payload);", "  if (!payload) return { kind: 'unavailable' };\n  if (isGameClosedPayload(payload)) { markGameClosed(payload); return { kind: 'closed' }; }\n\n  const state = stateFromBackendPayload(payload);");
  }

  if (!next.includes("server.kind === 'closed'")) {
    next = next.replace("    if (server.kind === 'empty' && canUseServerSave()) {", "    if (server.kind === 'closed') return rememberLoadedState(syncGlobalState(initialState));\n\n    if (server.kind === 'empty' && canUseServerSave()) {");
  }

  if (!next.includes('if (isGameClosedPayload(payload)) { markGameClosed(payload); return; }\n  const authoritativeState = stateFromBackendPayload(payload);')) {
    next = next.replace('  const authoritativeState = stateFromBackendPayload(payload);\n  if (authoritativeState) rememberAuthoritativeState(authoritativeState);', '  if (isGameClosedPayload(payload)) { markGameClosed(payload); return; }\n  const authoritativeState = stateFromBackendPayload(payload);\n  if (authoritativeState) rememberAuthoritativeState(authoritativeState);');
  }

  if (!next.includes('if (isGameClosedPayload(payload as BackendSavePayload | null)) { markGameClosed(payload as BackendSavePayload | null); return; }')) {
    next = next.replace('  const normalized = stateFromBackendPayload(payload as BackendSavePayload | null);\n  if (normalized) rememberAuthoritativeState(normalized);', '  if (isGameClosedPayload(payload as BackendSavePayload | null)) { markGameClosed(payload as BackendSavePayload | null); return; }\n  const normalized = stateFromBackendPayload(payload as BackendSavePayload | null);\n  if (normalized) rememberAuthoritativeState(normalized);');
  }

  must(next, '__devstudioGameClosed', 'closed flag');
  must(next, 'backendJsonOrNull', 'json helper');
  must(next, "kind: 'closed'", 'closed load state');
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;

  if (!next.includes('const [gameClosed, setGameClosed]')) {
    next = next.replace('  const [state, setState] = useState<GameState | null>(null);\n  const [momentumOpen, setMomentumOpen] = useState(false);', "  const [state, setState] = useState<GameState | null>(null);\n  const [gameClosed, setGameClosed] = useState(false);\n  const [maintenanceMessage, setMaintenanceMessage] = useState('Ведутся технические работы. Возвращайтесь позже');\n  const [momentumOpen, setMomentumOpen] = useState(false);");
  }

  if (!next.includes("window.addEventListener('devstudio:game-closed'")) {
    next = next.replace('  useEffect(() => {\n    initTelegram();\n    loadGame().then(setState);\n  }, []);', "  useEffect(() => {\n    initTelegram();\n    const onClosed = (event: Event) => {\n      const detail = (event as CustomEvent<{ message?: string }>).detail;\n      setMaintenanceMessage(detail?.message || 'Ведутся технические работы. Возвращайтесь позже');\n      setGameClosed(true);\n    };\n    window.addEventListener('devstudio:game-closed', onClosed);\n    loadGame().then((loaded) => {\n      if ((window as unknown as { __devstudioGameClosed?: boolean }).__devstudioGameClosed) setGameClosed(true);\n      setState(loaded);\n    });\n    return () => window.removeEventListener('devstudio:game-closed', onClosed);\n  }, []);");
  }

  if (!next.includes('if (gameClosed) return <MaintenanceScreen')) {
    next = next.replace('  if (!state) return <div className="loading"><span>Загружаем студию…</span></div>;', '  if (gameClosed) return <MaintenanceScreen message={maintenanceMessage} />;\n  if (!state) return <div className="loading"><span>Загружаем студию…</span></div>;');
  }

  if (!next.includes('function MaintenanceScreen')) {
    next = next.replace('function TopBar({ state, onMomentumOpen }: { state: GameState; onMomentumOpen: () => void }) {', "function MaintenanceScreen({ message }: { message: string }) {\n  return <main className=\"app-shell maintenance-shell\"><section className=\"maintenance-card comic-card splash-panel\"><div className=\"poster-art\"><span className=\"burst burst-a\">PATCH</span><span className=\"burst burst-b\">DEV</span><i className=\"slash slash-a\" /><i className=\"slash slash-b\" /></div><div className=\"hero-copy\"><p className=\"eyebrow\">DevStudio Tycoon</p><h2>Ведутся технические работы</h2><p className=\"muted\">{message || 'Возвращайтесь позже'}</p><p className=\"small muted\">Мы обновляем игру, чтобы не ломать сохранения и экономику игроков.</p></div></section></main>;\n}\n\nfunction TopBar({ state, onMomentumOpen }: { state: GameState; onMomentumOpen: () => void }) {");
  }

  must(next, 'MaintenanceScreen', 'maintenance component');
  must(next, 'devstudio:game-closed', 'closed event');
  return next;
});

patchFile('src/styles.css', (source) => {
  let next = source;
  if (!next.includes('.maintenance-shell')) next += `\n\n.maintenance-shell{min-height:100vh;display:grid;place-items:center;padding-bottom:max(24px,env(safe-area-inset-bottom));}.maintenance-card{width:min(100%,430px);min-height:360px;padding:24px;display:grid;align-items:end;overflow:hidden}.maintenance-card h2{font-size:clamp(32px,10vw,48px)}.maintenance-card .hero-copy{gap:14px}\n`;
  must(next, '.maintenance-shell', 'maintenance styles');
  return next;
});

console.log('apply-game-status-ui-v4: ok');
