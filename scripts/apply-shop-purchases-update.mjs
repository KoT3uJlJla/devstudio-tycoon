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

const shopScreenBlock = `function ShopScreen({ state, update, onRenameStudio }: { state: GameState; update: (fn: (state: GameState) => GameState) => void; onRenameStudio: () => void }) {
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const renameCost = 15;
  const sku = [
    { id: 'starter_pack', title: 'Стартовый набор', desc: '5 000 монет и 50 очков науки для быстрого рывка', price: 79 },
    { id: 'coins_5k', title: 'Набор монет', desc: '+5 000 монет', price: 39 },
    { id: 'coins_25k', title: 'Большой набор монет', desc: '+25 000 монет', price: 149 },
    { id: 'coins_100k', title: 'Мега-набор монет', desc: '+100 000 монет', price: 399 },
    { id: 'research_boost', title: 'Ускорение науки', desc: '+50 очков исследований', price: 69 },
  ] as const;

  const buy = async (itemId: string, after?: () => void) => {
    if (pendingItem) return;
    setPendingItem(itemId);
    try {
      const next = await purchaseShopItem(itemId);
      if (!next) {
        haptic('warning');
        window.Telegram?.WebApp?.showPopup?.({ message: 'Покупка не завершена. Товар не был начислен.', buttons: [{ type: 'ok' }] });
        return;
      }
      haptic('success');
      update(() => next);
      after?.();
    } finally {
      setPendingItem(null);
    }
  };

  return <div className="stack"><div className="section-head hero-title"><div><p className="eyebrow">Звёзды</p><h2>Магазин студии</h2></div><span className="pill">полезные улучшения</span></div><p className="muted">Покупки сначала используют игровой баланс ⭐. Если звёзд не хватает, откроется инвойс Telegram Stars. Товар начисляется только после успешной оплаты.</p><article className="shop-card comic-card"><div><h3>Переименовать студию</h3><p>Сейчас: {state.studioName || 'Без названия'}. Позволяет выбрать новое имя для студии.</p></div><button disabled={Boolean(pendingItem)} onClick={() => buy('rename_studio', onRenameStudio)}>{pendingItem === 'rename_studio' ? '…' : \`⭐\${renameCost}\`}</button></article><div className="shop-list">{sku.map((item) => <article className="shop-card comic-card" key={item.id}><div><h3>{item.title}</h3><p>{item.desc}</p></div><button disabled={Boolean(pendingItem)} onClick={() => buy(item.id)}>{pendingItem === item.id ? '…' : \`⭐\${item.price}\`}</button></article>)}</div></div>;
}`;

const starterOfferBlock = `function StarterOffer({ update }: { update: (fn: (state: GameState) => GameState) => void }) {
  const [pending, setPending] = useState(false);
  const buy = async () => {
    if (pending) return;
    setPending(true);
    try {
      const next = await purchaseShopItem('starter_pack');
      if (!next) {
        haptic('warning');
        window.Telegram?.WebApp?.showPopup?.({ message: 'Покупка не завершена. Стартовый набор не был начислен.', buttons: [{ type: 'ok' }] });
        return;
      }
      haptic('success');
      update(() => next);
    } finally {
      setPending(false);
    }
  };
  return <div className="modal-backdrop"><section className="release-modal offer comic-card"><span className="badge">одноразово</span><h2>Стартовый набор для быстрого рывка</h2><p className="muted">+5 000 монет и +50 очков науки для уверенного старта.</p><div className="inline-actions"><button className="primary" disabled={pending} onClick={buy}>{pending ? 'Открываем…' : 'Купить ⭐79'}</button><button className="ghost" disabled={pending} onClick={() => update((current) => ({ ...current, offerSeen: true }))}>Не сейчас</button></div></section></div>;
}`;

patchFile('src/App.tsx', (source) => {
  let next = source;
  if (!next.includes("import { purchaseShopItem } from './backendClient';")) {
    next = next.replace("import { haptic, initTelegram, shareRelease } from './telegram';", "import { haptic, initTelegram, shareRelease } from './telegram';\nimport { purchaseShopItem } from './backendClient';");
  }
  next = replaceBetween(next, 'function ShopScreen(', 'function RatingScreen', shopScreenBlock);
  next = replaceBetween(next, 'function StarterOffer(', 'function Onboarding', starterOfferBlock);
  return next;
});
