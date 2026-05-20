import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

const topFivePrizeDistribution = `const prizeDistribution = [
  ['$70', '35%'], ['$50', '25%'], ['$35', '17.5%'], ['$25', '12.5%'], ['$20', '10%'],
] as const;`;

patchFile('src/App.tsx', (source) => {
  let next = source;

  next = next.replace(/const prizeDistribution = \[[\s\S]*?\] as const;/, topFivePrizeDistribution);
  next = next.replace(
    "].sort((a, b) => Number(b[2]) - Number(a[2])).slice(0, 10);",
    "].sort((a, b) => Number(b[2]) - Number(a[2])).slice(0, 5);",
  );

  const copyPairs = [
    ['Недельный топ-10', 'Недельный топ-5'],
    ['только топ-10', 'только топ-5'],
    ['Пока вне топ-10', 'Пока вне топ-5'],
    ['попасть в призовую десятку', 'попасть в призовую пятёрку'],
    ['Топ-10 лучших игр недели делят призовой фонд $500.', 'Топ-5 лучших игр недели делят призовой фонд $200.'],
    ['Топ-5 лучших игр недели делят призовой фонд $500.', 'Топ-5 лучших игр недели делят призовой фонд $200.'],
    ['Призовой фонд $500', 'Призовой фонд $200'],
    ['Если игровых звёзд хватает, покупка спишется сразу. Если нет — откроется счёт Telegram Stars. Без успешной оплаты товар не начисляется.', 'Если звёзд хватает, покупка пройдёт сразу. Если нет — Telegram предложит оплатить покупку.'],
    ['Покупки сначала используют игровой баланс ⭐. Если звёзд не хватает, откроется инвойс Telegram Stars. Товар начисляется только после успешной оплаты.', 'Сначала используются твои ⭐ в игре. Если их не хватает, Telegram предложит оплатить покупку.'],
    ['<b>без тестовой выдачи</b>', '<b>покупки через ⭐</b>'],
    ['Оплата закрыта. Товар не начислен.', 'Оплата закрыта.'],
    ['Покупка не завершена. Товар не начислен.', 'Покупку не удалось завершить.'],
    ['Оплата закрыта. Набор не начислен.', 'Оплата закрыта.'],
    ['Покупка не завершена. Набор не начислен.', 'Покупку не удалось завершить.'],
    ['Открываем счёт Telegram Stars…', 'Открываем оплату Telegram Stars…'],
    ['Кнопки временно заблокированы, чтобы покупка не продублировалась.', 'Завершаем покупку. Пожалуйста, не закрывай окно оплаты.'],
    ['Набор начисляется только после успешной оплаты.', 'Подходит, чтобы быстрее стартовать и открыть первые улучшения.'],
    ['Без успешной оплаты товар не начисляется.', ''],
    ['Товар не был начислен.', 'Баланс не изменился.'],
    ['Стартовый набор не был начислен.', 'Баланс не изменился.'],
  ];

  for (const [from, to] of copyPairs) {
    next = next.replaceAll(from, to);
  }

  if (next.includes('топ-10') || next.includes('Топ-10')) {
    console.warn('rewards-copy-polish: top-10 copy still found');
  }
  if (next.includes('призовой фонд $500') || next.includes('Призовой фонд $500')) {
    console.warn('rewards-copy-polish: old prize pool copy still found');
  }
  if (next.includes('без тестовой') || next.includes('инвойс') || next.includes('Без успешной оплаты')) {
    console.warn('rewards-copy-polish: technical shop copy still found');
  }

  return next;
});

patchFile('src/backendClient.ts', (source) => source
  .replaceAll('Не удалось открыть инвойс Telegram Stars. Попробуй ещё раз позже.', 'Не удалось открыть оплату Telegram Stars. Попробуй ещё раз позже.')
);