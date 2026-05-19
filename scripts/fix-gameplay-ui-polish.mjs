import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/gameplay-ui-polish.ts';
let content = readFileSync(path, 'utf8');

content = content.replace(
  "    button.textContent = 'Готово';\n    window.setTimeout(() => window.location.reload(), 180);",
  "    button.textContent = 'Готово';\n    window.setTimeout(() => {\n      button.textContent = originalText;\n      button.disabled = false;\n      delete button.dataset.secureStarAction;\n    }, 700);",
);

writeFileSync(path, content);
