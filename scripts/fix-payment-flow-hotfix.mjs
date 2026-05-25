import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/backendClient.ts';
let content = readFileSync(file, 'utf8');

content = content.replace(
`  if (payload?.error === 'not_enough_stars' && invoiceItemId) {
    const invoiceId = await payWithTelegramStars(invoiceItemId);
    if (!invoiceId) return null;
    const retryPayload = await postJson(\`/api/development/\${endpoint}\`, { ...body, invoiceId });
    return stateFromPayload(retryPayload, endpoint);
  }`,
`  if (payload?.error === 'not_enough_stars' && invoiceItemId) {
    const invoiceId = await payWithTelegramStars(invoiceItemId);
    if (!invoiceId) return null;

    const invoiceState = await paidInvoiceState(invoiceId);
    if (invoiceState) {
      markDirectBackendAction(endpoint);
      return invoiceState;
    }

    const retryPayload = await postJson(\`/api/development/\${endpoint}\`, { ...body, invoiceId });
    return stateFromPayload(retryPayload, endpoint);
  }`,
);

content = content.replace(
  /showPopup\?\.\(\{ message: '[^']+', buttons: \[\{ type: 'ok' \}\] \}\);/,
  "showPopup?.({ message: 'Не удалось открыть оплату Telegram Stars. Попробуй ещё раз позже.', buttons: [{ type: 'ok' }] });",
);

writeFileSync(file, content);
console.log('fix-payment-flow-hotfix: ok');
