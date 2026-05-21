import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  let source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function requirePatch(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`apply-game-status-ui failed: ${label}`);
}

patchFile('src/storage.ts', (source) => {
  let next = source;

  if (!next.includes('__devstudioGameClosed')) {
    next = next.replace(
      "type BackendSavePayload = {\n  ok?: boolean;\n  save?: { data?: unknown } | null;\n  economy?: { stars?: unknown } | null;\n};",
      "type BackendSavePayload = {\n  ok?: boolean;\n  error?: string;\n  role?: string;\n  gameStatus?: { status?: string; closed?: boolean; message?: string } | null;\n  save?: { data?: unknown } | null;\n  economy?: { stars?: unknown } | null;\n};",
    );

    next = next.replace(
      "type ServerLoadResult =\n  | { kind: 'loaded'; state: GameState }\n  | { kind: 'empty' }\n  | { kind: 'unavailable' };",
      "type ServerLoadResult =\n  | { kind: 'loaded'; state: GameState }\n  | { kind: 'empty' }\n  | { kind: 'closed' }\n  | { kind: 'unavailable' };",
    );

    next = next.replace(
      "function isPlainObject(value: unknown): value is Record<string, unknown> {\n  return typeof value === 'object' && value !== null && !Array.isArray(value);\n}",
      "function isPlainObject(value: unknown): value is Record<string, unknown> {\n  return typeof value === 'object' && value !== null && !Array.isArray(value);\n}\n\nfunction markGameClosed(payload: BackendSavePayload | null) {\n  const status = isPlainObject(payload?.gameStatus) ? payload?.gameStatus : null;\n  const message = typeof status?.message === 'string' && status.message.trim()\n    ? status.message\n    : 'Ведутся технические работы. Возвращайтесь позже';\n  try {\n    (window as unknown as { __devstudioGameClosed?: boolean }).__devstudioGameClosed = true;\n    window.dispatchEvent(new CustomEvent('devstudio:game-closed', { detail: { message, role: payload?.role || 'user', status } }));\n  } catch {\n    // ignore\n  }\n}\n\nfunction isGameClosedPayload(payload: BackendSavePayload | null) {\n  return Boolean(payload && payload.error === 'game_closed');\n}",
    );

    next = next.replace(
      "if (!payload?.ok || !rawSave || !isPlainObject(rawSave)) return null;",
      "if (isGameClosedPayload(payload)) { markGameClosed(payload); return null; }\n  if (!payload?.ok || !rawSave || !isPlainObject(rawSave)) return null;",
    );

    next = next.replace(
      "      .then((response) => (response.ok ? response.json() : null))\n      .catch(() => null),",
      "      .then(async (response) => {\n        const data = await response.json().catch(() => null);\n        if (!response.ok && isGameClosedPayload(data as BackendSavePayload | null)) return data;\n        return response.ok ? data : null;\n      })\n      .catch(() => null),",
    );

    next = next.replace(
      "  if (!payload) return { kind: 'unavailable' };\n\n  const state = stateFromBackendPayload(payload);",
      "  if (!payload) return { kind: 'unavailable' };\n  if (isGameClosedPayload(payload)) { markGameClosed(payload); return { kind: 'closed' }; }\n\n  const state = stateFromBackendPayload(payload);",
    );

    next = next.replace(
      "    if (server.kind === 'empty' && canUseServerSave()) {",
      "    if (server.kind === 'closed') return rememberLoadedState(syncGlobalState(initialState));\n\n    if (server.kind === 'empty' && canUseServerSave()) {",
    );

    next = next.replace(
      "    .then((response) => (response.ok ? response.json() : null))\n    .catch(() => null) as BackendSavePayload | null;",
      "    .then(async (response) => {\n      const data = await response.json().catch(() => null);\n      if (!response.ok && isGameClosedPayload(data as BackendSavePayload | null)) return data;\n      return response.ok ? data : null;\n    })\n    .catch(() => null) as BackendSavePayload | null;",
    );

    next = next.replace(
      "  const authoritativeState = stateFromBackendPayload(payload);\n  if (authoritativeState) rememberAuthoritativeState(authoritativeState);",
      "  if (isGameClosedPayload(payload)) { markGameClosed(payload); return; }\n  const authoritativeState = stateFromBackendPayload(payload);\n  if (authoritativeState) rememberAuthoritativeState(authoritativeState);",
    );

    next = next.replace(
      "      .then((response) => (response.ok ? response.json() : null))\n      .catch(() => null),\n    null,\n    4500,",
      "      .then(async (response) => {\n        const data = await response.json().catch(() => null);\n        if (!response.ok && isGameClosedPayload(data as BackendSavePayload | null)) return data;\n        return response.ok ? data : null;\n      })\n      .catch(() => null),\n    null,\n    4500,",
    );

    next = next.replace(
      "  const normalized = stateFromBackendPayload(payload as BackendSavePayload | null);\n  if (normalized) rememberAuthoritativeState(normalized);",
      "  if (isGameClosedPayload(payload as BackendSavePayload | null)) { markGameClosed(payload as BackendSavePayload | null); return; }\n  const normalized = stateFromBackendPayload(payload as BackendSavePayload | null);\n  if (normalized) rememberAuthoritativeState(normalized);",
    );
  }

  requirePatch(next, '__devstudioGameClosed', 'storage closed flag');
  requirePatch(next, "kind: 'closed'", 'closed server load result');
  requirePatch(next, 'isGameClosedPayload', 'game closed detector');
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;

  if (!next.includes('MaintenanceScreen')) {
    next = next.replace(
      "  const [state, setState] = useState<GameState | null>(null);\n  const [momentumOpen, setMomentumOpen] = useState(false);",
      "  const [state, setState] = useState<GameState | null>(null);\n  const [gameClosed, setGameClosed] = useState(false);\n  const [maintenanceMessage, setMaintenanceMessage] = useState('Ведутся технические работы. Возвращайтесь позже');\n  const [momentumOpen, setMomentumOpen] = useState(false);",
    );

    next = next.replace(
      "  useEffect(() => {\n    initTelegram();\n    loadGame().then(setState);\n  }, []);",
      "  useEffect(() => {\n    initTelegram();\n    const onClosed = (event: Event) => {\n      const detail = (event as CustomEvent<{ message?: string }>).detail;\n      setMaintenanceMessage(detail?.message || 'Ведутся технические работы. Возвращайтесь позже');\n      setGameClosed(true);\n    };\n    window.addEventListener('devstudio:game-closed', onClosed);\n    loadGame().then((loaded) => {\n      if ((window as unknown as { __devstudioGameClosed?: boolean }).__devstudioGameClosed) {\n        setGameClosed(true);\n      }\n      setState(loaded);\n    });\n    return () => window.removeEventListener('devstudio:game-closed', onClosed);\n  }, []);",
    );

    next = next.replace(
      "  if (!state) return <div className=\"loading\"><span>Загружаем студию…</span></div>;",
      "  if (gameClosed) return <MaintenanceScreen message={maintenanceMessage} />;\n  if (!state) return <div className=\"loading\"><span>Загружаем студию…</span></div>;",
    );

    next = next.replace(
      "function TopBar({ state, onMomentumOpen }: { state: GameState; onMomentumOpen: () => void }) {",
      "function MaintenanceScreen({ message }: { message: string }) {\n  return (\n    <main className=\"app-shell maintenance-shell\">\n      <section className=\"maintenance-card comic-card splash-panel\">\n        <div className=\"poster-art\"><span className=\"burst burst-a\">PATCH</span><span className=\"burst burst-b\">DEV</span><i className=\"slash slash-a\" /><i className=\"slash slash-b\" /></div>\n        <div className=\"hero-copy\">\n          <p className=\"eyebrow\">DevStudio Tycoon</p>\n          <h2>Ведутся технические работы</h2>\n          <p className=\"muted\">{message || 'Возвращайтесь позже'}</p>\n          <p className=\"small muted\">Мы обновляем игру, чтобы не ломать сохранения и экономику игроков.</p>\n        </div>\n      </section>\n    </main>\n  );\n}\n\nfunction TopBar({ state, onMomentumOpen }: { state: GameState; onMomentumOpen: () => void }) {",
    );
  }

  requirePatch(next, 'MaintenanceScreen', 'maintenance component');
  requirePatch(next, 'devstudio:game-closed', 'game closed event');
  requirePatch(next, 'maintenance-shell', 'maintenance shell');
  return next;
});

patchFile('src/styles.css', (source) => {
  let next = source;
  if (!next.includes('.maintenance-shell')) {
    next += `\n\n/* Game closed / maintenance screen */\n.maintenance-shell {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  padding-bottom: max(24px, env(safe-area-inset-bottom));\n}\n.maintenance-card {\n  width: min(100%, 430px);\n  min-height: 360px;\n  padding: 24px;\n  display: grid;\n  align-items: end;\n  overflow: hidden;\n}\n.maintenance-card h2 {\n  font-size: clamp(32px, 10vw, 48px);\n}\n.maintenance-card .hero-copy {\n  gap: 14px;\n}\n`;
  }
  requirePatch(next, '.maintenance-shell', 'maintenance styles');
  return next;
});

console.log('apply-game-status-ui: ok');
