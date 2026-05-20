import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceBetween(source, startNeedle, endNeedle, replacement) {
  const start = source.indexOf(startNeedle);
  if (start === -1) return source;
  const end = source.indexOf(endNeedle, start);
  if (end === -1 || end <= start) return source;
  return source.slice(0, start) + replacement.trimEnd() + '\n\n' + source.slice(end);
}

const tonWalletComponent = `function maskTonWallet(address: string) {
  const clean = address.trim();
  if (clean.length <= 12) return clean;
  return clean.slice(0, 5) + '…' + clean.slice(-5);
}

function isLikelyTonWallet(address: string) {
  const clean = address.trim().replace(/\\s+/g, '');
  return /^(?:EQ|UQ)[A-Za-z0-9_-]{46}$/.test(clean) || /^-?\\d:[a-fA-F0-9]{64}$/.test(clean);
}

function TonWalletPanel() {
  const [wallet, setWallet] = useState('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    getTonWallet().then((address) => {
      if (!active) return;
      setWallet(address || '');
      setStatus('idle');
    }).catch(() => {
      if (!active) return;
      setStatus('idle');
    });
    return () => { active = false; };
  }, []);

  const cleanInput = input.trim().replace(/\\s+/g, '');
  const canBind = Boolean(cleanInput) && isLikelyTonWallet(cleanInput) && status !== 'saving';

  const bind = async () => {
    if (!canBind) return;
    setStatus('saving');
    setMessage('');
    const saved = await saveTonWallet(cleanInput);
    if (!saved) {
      haptic('warning');
      setStatus('error');
      setMessage('Проверь адрес кошелька и попробуй ещё раз.');
      return;
    }
    haptic('success');
    setWallet(saved);
    setInput('');
    setStatus('saved');
    setMessage('Кошелёк привязан. Он будет использоваться для еженедельных наград.');
  };

  const unlink = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    setMessage('');
    const ok = await unlinkTonWallet();
    if (!ok) {
      haptic('warning');
      setStatus('error');
      setMessage('Не удалось отвязать кошелёк. Попробуй ещё раз.');
      return;
    }
    haptic('success');
    setWallet('');
    setInput('');
    setStatus('idle');
    setMessage('Кошелёк отвязан.');
  };

  return <section className="panel comic-card ton-wallet-card"><div className="section-head compact"><div><p className="eyebrow">TON-кошелёк</p><h3>Кошелёк для наград</h3></div><span className="pill">еженедельный топ-5</span></div><p className="muted">Привяжи TON-кошелёк, чтобы получать вознаграждения за место в еженедельном топ-5.</p>{wallet ? <div className="ton-wallet-bound"><div><span>Привязан</span><strong>{maskTonWallet(wallet)}</strong></div><button className="ghost" disabled={status === 'saving'} onClick={unlink}>{status === 'saving' ? 'Отвязываем…' : 'Отвязать'}</button></div> : <div className="ton-wallet-form"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Вставь адрес TON-кошелька" inputMode="text" autoComplete="off" /><button className="primary" disabled={!canBind} onClick={bind}>{status === 'saving' ? 'Сохраняем…' : 'Привязать'}</button></div>}{message && <p className={status === 'error' ? 'small danger-text' : 'small muted'}>{message}</p>}{!wallet && cleanInput && !isLikelyTonWallet(cleanInput) && <p className="small muted">Адрес должен быть в формате TON, например начинаться с EQ или UQ.</p>}</section>;
}`;

patchFile('src/App.tsx', (source) => {
  let next = source;
  if (!next.includes("getTonWallet")) {
    if (next.includes("import { purchaseShopItem } from './backendClient';")) {
      next = next.replace("import { purchaseShopItem } from './backendClient';", "import { getTonWallet, purchaseShopItem, saveTonWallet, unlinkTonWallet } from './backendClient';");
    } else {
      next = next.replace("import { haptic, initTelegram, shareRelease } from './telegram';", "import { haptic, initTelegram, shareRelease } from './telegram';\nimport { getTonWallet, purchaseShopItem, saveTonWallet, unlinkTonWallet } from './backendClient';");
    }
  }

  if (!next.includes('function TonWalletPanel()')) {
    next = next.replace('function RatingScreen({ state, update }', `${tonWalletComponent}\n\nfunction RatingScreen({ state, update }`);
  }

  if (!next.includes('<TonWalletPanel />')) {
    next = next.replace(
      '<section className="rating-hero comic-panel"><p className="eyebrow">Недельный топ-5</p><h2>Рейтинг лучших игр за неделю</h2><p className="muted">Рейтинг складывается из силы свежих релизов, среднего качества недели, дохода живых игр, ритма релизов, импульса студии и её уровня.</p></section>',
      '<section className="rating-hero comic-panel"><p className="eyebrow">Недельный топ-5</p><h2>Рейтинг лучших игр за неделю</h2><p className="muted">Рейтинг складывается из силы свежих релизов, среднего качества недели, дохода живых игр, ритма релизов, импульса студии и её уровня.</p></section>\n    <TonWalletPanel />',
    );
  }

  return next;
});

patchFile('src/styles.css', (source) => {
  if (source.includes('.ton-wallet-card')) return source;
  return `${source}\n\n.ton-wallet-card {\n  display: grid;\n  gap: 14px;\n}\n.ton-wallet-form, .ton-wallet-bound {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  gap: 10px;\n  align-items: center;\n}\n.ton-wallet-form input {\n  width: 100%;\n  min-width: 0;\n  border: 2px solid rgba(255,255,255,.16);\n  border-radius: 18px;\n  background: rgba(255,255,255,.08);\n  color: #fff;\n  padding: 13px 14px;\n  font: inherit;\n  font-weight: 800;\n  outline: none;\n}\n.ton-wallet-form input:focus {\n  border-color: rgba(35, 242, 255, .85);\n  box-shadow: 0 0 0 4px rgba(35, 242, 255, .12);\n}\n.ton-wallet-bound {\n  background: rgba(255,255,255,.07);\n  border: 2px solid rgba(255,255,255,.13);\n  border-radius: 20px;\n  padding: 12px;\n}\n.ton-wallet-bound span {\n  display: block;\n  color: rgba(255,255,255,.62);\n  font-size: 12px;\n  text-transform: uppercase;\n  letter-spacing: .08em;\n}\n.ton-wallet-bound strong {\n  display: block;\n  font-size: 18px;\n  margin-top: 3px;\n}\n.danger-text {\n  color: #ff7c9d;\n}\n@media (max-width: 420px) {\n  .ton-wallet-form, .ton-wallet-bound { grid-template-columns: 1fr; }\n}\n`;
});