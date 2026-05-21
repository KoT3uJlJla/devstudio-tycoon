import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, fn) {
  const src = readFileSync(path, 'utf8');
  const out = fn(src);
  if (out !== src) writeFileSync(path, out);
}

patch('src/storage.ts', (src) => {
  let s = src;
  if (!s.includes('error?: string;')) {
    s = s.replace('type BackendSavePayload = {\n  ok?: boolean;\n', 'type BackendSavePayload = {\n  ok?: boolean;\n  error?: string;\n  role?: string;\n  gameStatus?: { status?: string; closed?: boolean; message?: string } | null;\n');
  }
  if (!s.includes('__devstudioGameClosed')) {
    const helper = `\nfunction markGameClosed(payload: BackendSavePayload | null) {\n  const status = isPlainObject(payload?.gameStatus) ? payload?.gameStatus : null;\n  const message = typeof status?.message === 'string' && status.message.trim() ? status.message : 'Ведутся технические работы. Возвращайтесь позже';\n  try {\n    (window as unknown as { __devstudioGameClosed?: boolean }).__devstudioGameClosed = true;\n    window.dispatchEvent(new CustomEvent('devstudio:game-closed', { detail: { message, role: payload?.role || 'user', status } }));\n  } catch { }\n}\n\nfunction isGameClosedPayload(payload: BackendSavePayload | null) {\n  return Boolean(payload && payload.error === 'game_closed');\n}\n\nasync function backendJsonOrNull(response: globalThis.Response): Promise<BackendSavePayload | null> {\n  const data = await response.json().catch(() => null) as BackendSavePayload | null;\n  if (!response.ok && isGameClosedPayload(data)) return data;\n  return response.ok ? data : null;\n}\n`;
    s = s.replace('\nfunction telegramInitData(): string {', helper + '\nfunction telegramInitData(): string {');
  }
  s = s.replaceAll('.then((response) => (response.ok ? response.json() : null))', '.then(backendJsonOrNull)');
  s = s.replace('  if (!payload?.ok || !rawSave || !isPlainObject(rawSave)) return null;', '  if (isGameClosedPayload(payload)) { markGameClosed(payload); return null; }\n  if (!payload?.ok || !rawSave || !isPlainObject(rawSave)) return null;');
  s = s.replace('  const authoritativeState = stateFromBackendPayload(payload);\n  if (authoritativeState) rememberAuthoritativeState(authoritativeState);', '  if (isGameClosedPayload(payload)) { markGameClosed(payload); return; }\n  const authoritativeState = stateFromBackendPayload(payload);\n  if (authoritativeState) rememberAuthoritativeState(authoritativeState);');
  s = s.replace('  const normalized = stateFromBackendPayload(payload as BackendSavePayload | null);\n  if (normalized) rememberAuthoritativeState(normalized);', '  if (isGameClosedPayload(payload as BackendSavePayload | null)) { markGameClosed(payload as BackendSavePayload | null); return; }\n  const normalized = stateFromBackendPayload(payload as BackendSavePayload | null);\n  if (normalized) rememberAuthoritativeState(normalized);');
  return s;
});

patch('src/App.tsx', (src) => {
  let s = src;
  if (!s.includes('const [gameClosed, setGameClosed]')) {
    s = s.replace('  const [state, setState] = useState<GameState | null>(null);', "  const [state, setState] = useState<GameState | null>(null);\n  const [gameClosed, setGameClosed] = useState(false);\n  const [maintenanceMessage, setMaintenanceMessage] = useState('Ведутся технические работы. Возвращайтесь позже');");
  }
  if (!s.includes("devstudio:game-closed")) {
    const effect = `\n  useEffect(() => {\n    const onClosed = (event: Event) => {\n      const detail = (event as CustomEvent<{ message?: string }>).detail;\n      setMaintenanceMessage(detail?.message || 'Ведутся технические работы. Возвращайтесь позже');\n      setGameClosed(true);\n    };\n    window.addEventListener('devstudio:game-closed', onClosed);\n    return () => window.removeEventListener('devstudio:game-closed', onClosed);\n  }, []);\n`;
    s = s.replace('  useInterfaceSounds();\n', '  useInterfaceSounds();\n' + effect);
  }
  if (!s.includes('if (gameClosed) return <MaintenanceScreen')) {
    s = s.replace('  if (!state) return <div className="loading"><span>Загружаем студию…</span></div>;', '  if (gameClosed) return <MaintenanceScreen message={maintenanceMessage} />;\n  if (!state) return <div className="loading"><span>Загружаем студию…</span></div>;');
  }
  if (!s.includes('function MaintenanceScreen')) {
    const component = `function MaintenanceScreen({ message }: { message: string }) {\n  return <main className="app-shell maintenance-shell"><section className="maintenance-card comic-card splash-panel"><div className="poster-art"><span className="burst burst-a">PATCH</span><span className="burst burst-b">DEV</span><i className="slash slash-a" /><i className="slash slash-b" /></div><div className="hero-copy"><p className="eyebrow">DevStudio Tycoon</p><h2>Ведутся технические работы</h2><p className="muted">{message || 'Возвращайтесь позже'}</p><p className="small muted">Мы обновляем игру, чтобы не ломать сохранения и экономику игроков.</p></div></section></main>;\n}\n\n`;
    s = s.replace('function TopBar({ state, onMomentumOpen }: { state: GameState; onMomentumOpen: () => void }) {', component + 'function TopBar({ state, onMomentumOpen }: { state: GameState; onMomentumOpen: () => void }) {');
  }
  return s;
});

patch('src/styles.css', (src) => src.includes('.maintenance-shell') ? src : src + '\n\n.maintenance-shell{min-height:100vh;display:grid;place-items:center;padding-bottom:max(24px,env(safe-area-inset-bottom));}.maintenance-card{width:min(100%,430px);min-height:360px;padding:24px;display:grid;align-items:end;overflow:hidden}.maintenance-card h2{font-size:clamp(32px,10vw,48px)}.maintenance-card .hero-copy{gap:14px}\n');

console.log('apply-maintenance-ui-lite: ok');
