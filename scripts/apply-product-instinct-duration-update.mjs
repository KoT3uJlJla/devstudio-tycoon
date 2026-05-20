import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function replaceBetween(source, startNeedle, endNeedle, replacement) {
  const start = source.indexOf(startNeedle);
  if (start === -1) throw new Error(`product-instinct-duration: failed to find ${startNeedle}`);
  const end = source.indexOf(endNeedle, start);
  if (end === -1 || end <= start) throw new Error(`product-instinct-duration: failed to find ${endNeedle}`);
  return source.slice(0, start) + replacement.trimEnd() + '\n\n' + source.slice(end);
}

patchFile('src/types.ts', (source) => {
  let next = source;
  if (!next.includes('productInstinctExpiresAt: number | null;')) {
    next = next.replace('  unlockedResearchIds: string[];\n  unlockedGenreIds:', '  unlockedResearchIds: string[];\n  productInstinctExpiresAt: number | null;\n  unlockedGenreIds:');
  }
  return next;
});

patchFile('src/gameData.ts', (source) => source.replace(
  "{ id: 'product-instinct', title: 'Продуктовое чутьё', description: 'Показывает силу жанр × сеттинг и рекомендуемый фокус по фазам.', cost: 18, effect: 'Комбо + фокус' }",
  "{ id: 'product-instinct', title: 'Продуктовое чутьё', description: 'На 7 дней показывает силу жанр × сеттинг и мягкие подсказки по фокусу разработки.', cost: 0, effect: '7 дней подсказок' }",
));

patchFile('src/gameLogic.ts', (source) => {
  let next = source;
  if (!next.includes('PRODUCT_INSTINCT_DURATION_MS')) {
    next = next.replace(
      'export const GAME_DAY_MS = 72_000;\n',
      "export const GAME_DAY_MS = 72_000;\nexport const PRODUCT_INSTINCT_ID = 'product-instinct';\nexport const PRODUCT_INSTINCT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;\nexport const PRODUCT_INSTINCT_PATCH_STARTED_AT = Date.parse('2026-05-21T00:00:00.000Z');\n",
    );
  }
  if (!next.includes('productInstinctExpiresAt: null,')) {
    next = next.replace('  unlockedResearchIds: [],\n  unlockedGenreIds:', '  unlockedResearchIds: [],\n  productInstinctExpiresAt: null,\n  unlockedGenreIds:');
  }
  if (!next.includes('export function isProductInstinctActive')) {
    const helpers = `export function productInstinctExpiresAtFrom(startedAt = Date.now()) {
  return startedAt + PRODUCT_INSTINCT_DURATION_MS;
}

export function productInstinctRemainingMs(state: Pick<GameState, 'productInstinctExpiresAt'>, now = Date.now()) {
  return Math.max(0, Number(state.productInstinctExpiresAt || 0) - now);
}

export function isProductInstinctActive(state: Pick<GameState, 'productInstinctExpiresAt'>, now = Date.now()) {
  return productInstinctRemainingMs(state, now) > 0;
}

export function activateProductInstinct(state: GameState, startedAt = Date.now()): GameState {
  const alreadyActive = isProductInstinctActive(state, startedAt);
  const ids = state.unlockedResearchIds.filter((id) => id !== PRODUCT_INSTINCT_ID);
  return {
    ...state,
    productInstinctExpiresAt: productInstinctExpiresAtFrom(startedAt),
    unlockedResearchIds: [PRODUCT_INSTINCT_ID, ...ids],
    dailyResearchUnlocked: state.dailyResearchUnlocked + (alreadyActive ? 0 : 1),
  };
}

`;
    next = next.replace('export function ensureDailyState(state: GameState): GameState {', `${helpers}export function ensureDailyState(state: GameState): GameState {`);
  }
  if (!next.includes('const legacyProductInstinctUnlocked')) {
    next = next.replace(
      '  const unlockedResearchIds = safeArray<string>(merged.unlockedResearchIds).filter((id) => typeof id === \'string\').slice(0, 100);\n',
      "  const unlockedResearchIds = safeArray<string>(merged.unlockedResearchIds).filter((id) => typeof id === 'string').slice(0, 100);\n  const legacyProductInstinctUnlocked = unlockedResearchIds.includes(PRODUCT_INSTINCT_ID);\n  const rawProductInstinctExpiresAt = Number((merged as unknown as { productInstinctExpiresAt?: unknown }).productInstinctExpiresAt);\n  const migratedProductInstinctExpiresAt = rawProductInstinctExpiresAt > 0 ? rawProductInstinctExpiresAt : legacyProductInstinctUnlocked ? productInstinctExpiresAtFrom(PRODUCT_INSTINCT_PATCH_STARTED_AT) : null;\n  const productInstinctActive = Boolean(migratedProductInstinctExpiresAt && migratedProductInstinctExpiresAt > Date.now());\n  const researchIdsWithoutProductInstinct = unlockedResearchIds.filter((id) => id !== PRODUCT_INSTINCT_ID);\n  const normalizedResearchIds = productInstinctActive ? [PRODUCT_INSTINCT_ID, ...researchIdsWithoutProductInstinct] : researchIdsWithoutProductInstinct;\n",
    );
  }
  next = next.replace('    unlockedResearchIds,\n    unlockedGenreIds:', '    unlockedResearchIds: Array.from(new Set(normalizedResearchIds)),\n    productInstinctExpiresAt: productInstinctActive ? migratedProductInstinctExpiresAt : null,\n    unlockedGenreIds:');
  return next;
});

const researchScreenBlock = `function formatProductInstinctTime(ms: number) {
  const safe = Math.max(0, Math.floor(ms));
  const days = Math.floor(safe / 86_400_000);
  const hours = Math.floor((safe % 86_400_000) / 3_600_000);
  if (days > 0) return \`${days} д. ${hours} ч.\`;
  const minutes = Math.max(1, Math.floor((safe % 3_600_000) / 60_000));
  return hours > 0 ? \`${hours} ч. ${minutes} мин.\` : \`${minutes} мин.\`;
}

function ResearchScreen({ state, update }: { state: GameState; update: (fn: (state: GameState) => GameState) => void }) {
  const [productPending, setProductPending] = useState(false);
  const lockedGenres = genres.filter((item) => !state.unlockedGenreIds.includes(item.id));
  const lockedThemes = themes.filter((item) => !state.unlockedThemeIds.includes(item.id));
  const productInstinct = researchNodes.find((node) => node.id === 'product-instinct')!;
  const otherResearch = researchNodes.filter((node) => node.id !== 'product-instinct');
  const productActive = isProductInstinctActive(state);
  const productRemaining = productInstinctRemainingMs(state);
  const productStarCost = 199;
  const referralTarget = 10;
  const qualifiedReferrals = state.qualifiedReferrals ?? 0;
  const canUnlockByReferrals = qualifiedReferrals >= referralTarget;
  const canActivateProduct = !productActive && !productPending;
  const activateProductByReferrals = () => update((current) => {
    if ((current.qualifiedReferrals ?? 0) < referralTarget || isProductInstinctActive(current)) return current;
    haptic('success');
    return activateProductInstinct(current);
  });
  const activateProductByPayment = async () => {
    if (!canActivateProduct) return;
    setProductPending(true);
    try {
      const next = await purchaseShopItem('product_instinct');
      if (!next) {
        haptic('warning');
        window.Telegram?.WebApp?.showPopup?.({ message: 'Не удалось активировать Продуктовое чутьё. Попробуй ещё раз.', buttons: [{ type: 'ok' }] });
        return;
      }
      haptic('success');
      update(() => activateProductInstinct(next));
    } finally {
      setProductPending(false);
    }
  };
  const unlockRandomGenre = () => update((current) => { const locked = genres.filter((item) => !current.unlockedGenreIds.includes(item.id)); if (current.rp < 24 || locked.length === 0) return current; const genre = locked[randomIndex(locked.length)]; haptic('success'); return { ...current, rp: current.rp - 24, unlockedGenreIds: [...current.unlockedGenreIds, genre.id], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 }; });
  const unlockRandomTheme = () => update((current) => { const locked = themes.filter((item) => !current.unlockedThemeIds.includes(item.id)); if (current.rp < 22 || locked.length === 0) return current; const theme = locked[randomIndex(locked.length)]; haptic('success'); return { ...current, rp: current.rp - 22, unlockedThemeIds: [...current.unlockedThemeIds, theme.id], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 }; });
  return (
    <div className="stack">
      <div className="section-head hero-title"><div><p className="eyebrow">Лаборатория идей</p><h2>Исследования</h2></div><span className="pill">{state.unlockedResearchIds.length}/{researchNodes.length}</span></div>
      <article className={productActive ? 'research-node unlocked comic-card premium-research-card timed-product-instinct' : 'research-node comic-card premium-research-card timed-product-instinct'}>
        <div>
          <p className="eyebrow">Премиальный навык · 7 дней</p>
          <strong>{productActive ? '✅ ' : ''}{productInstinct.title}</strong>
          <span>{productInstinct.description}</span>
          <em>{productActive ? \`Активно ещё ${formatProductInstinctTime(productRemaining)}\` : \`⭐ ${productStarCost} или ${referralTarget} друзей с релизом 6.5+ · сейчас ${qualifiedReferrals}/${referralTarget}\`}</em>
        </div>
        {productActive ? (
          <button className="primary" disabled>Активно</button>
        ) : canUnlockByReferrals ? (
          <button className="primary" disabled={productPending} onClick={activateProductByReferrals}>Активировать за друзей</button>
        ) : (
          <button className="primary" disabled={productPending} onClick={activateProductByPayment}>{productPending ? 'Активируем…' : \`Активировать за ⭐${productStarCost}\`}</button>
        )}
      </article>
      <div className="unlock-grid"><button className="unlock-card comic-card" disabled={state.rp < 24 || lockedGenres.length === 0} onClick={unlockRandomGenre}><strong><Icon name="genre" /> Новый случайный жанр</strong><span>{lockedGenres.length ? \`Осталось: ${lockedGenres.length}\` : 'Все жанры открыты'}</span><em>🧪 24</em></button><button className="unlock-card comic-card" disabled={state.rp < 22 || lockedThemes.length === 0} onClick={unlockRandomTheme}><strong><Icon name="theme" /> Новый случайный сеттинг</strong><span>{lockedThemes.length ? \`Осталось: ${lockedThemes.length}\` : 'Все сеттинги открыты'}</span><em>🧪 22</em></button></div>
      <div className="research-grid">{otherResearch.map((node) => { const unlocked = state.unlockedResearchIds.includes(node.id); const lockedByRequirement = node.requires ? !state.unlockedResearchIds.includes(node.requires) : false; return <button key={node.id} className={unlocked ? 'research-node unlocked comic-card' : 'research-node comic-card'} disabled={unlocked || lockedByRequirement || state.rp < node.cost} onClick={() => update((current) => { if (current.rp < node.cost || current.unlockedResearchIds.includes(node.id)) return current; haptic('success'); return { ...current, rp: current.rp - node.cost, unlockedResearchIds: [...current.unlockedResearchIds, node.id], dailyResearchUnlocked: current.dailyResearchUnlocked + 1 }; })}><strong>{unlocked ? '✅ ' : ''}{node.title}</strong><span>{lockedByRequirement ? 'Сначала нужно предыдущее исследование.' : node.description}</span><em>{unlocked ? node.effect : \`🧪 ${node.cost}\`}</em></button>; })}</div>
    </div>
  );
}`;

patchFile('src/App.tsx', (source) => {
  let next = source;
  const newImports = ['activateProductInstinct', 'isProductInstinctActive', 'productInstinctRemainingMs'];
  for (const name of newImports) {
    if (!next.includes(`${name},`)) {
      next = next.replace('  nextStudioUpgradeCost,\n} from \'./gameLogic\';', `  nextStudioUpgradeCost,\n  ${name},\n} from './gameLogic';`);
    }
  }
  if (!next.includes("purchaseShopItem")) {
    next = next.replace("import { haptic, initTelegram, shareRelease } from './telegram';", "import { haptic, initTelegram, shareRelease } from './telegram';\nimport { purchaseShopItem } from './backendClient';");
  }
  next = next.replace('  const hasProductInstinct = state.unlockedResearchIds.includes(\'product-instinct\');', '  const hasProductInstinct = isProductInstinctActive(state);');
  next = replaceBetween(next, 'function ResearchScreen(', 'function ShopScreen(', researchScreenBlock);
  return next;
});

patchFile('src/styles.css', (source) => {
  if (source.includes('.timed-product-instinct')) return source;
  return `${source}\n\n.timed-product-instinct em {\n  color: rgba(255,255,255,.78);\n}\n.timed-product-instinct.unlocked em {\n  color: #95ffd6;\n}\n`;
});
