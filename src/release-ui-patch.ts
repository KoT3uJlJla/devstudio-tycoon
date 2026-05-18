function parseNumber(value: string | null | undefined) {
  const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

function textOf(element: Element | null) {
  return element?.textContent?.trim() ?? '';
}

function patchReleaseModal() {
  const modal = document.querySelector<HTMLElement>('.release-modal.animated-release');
  if (!modal) return;
  modal.classList.add('release-modal-v8');

  const scoreStage = modal.querySelector<HTMLElement>('.score-stage');
  const criticGrid = modal.querySelector<HTMLElement>('.critic-grid');
  if (scoreStage && criticGrid && scoreStage.compareDocumentPosition(criticGrid) & Node.DOCUMENT_POSITION_PRECEDING) {
    modal.insertBefore(scoreStage, criticGrid);
  }

  const bigScore = scoreStage?.querySelector<HTMLElement>('.big-score');
  const score = parseNumber(textOf(bigScore));
  if (scoreStage && Number.isFinite(score)) {
    scoreStage.classList.toggle('score-over-five', score > 5);
    scoreStage.classList.toggle('score-over-nine', score > 9);

    const burst = scoreStage.querySelector<HTMLElement>('.confetti-burst');
    if (burst) {
      burst.style.display = score > 5 ? '' : 'none';
      if (score > 9 && !burst.dataset.tripled) {
        const originalPieces = Array.from(burst.querySelectorAll<HTMLElement>('.confetti-piece'));
        for (let copy = 0; copy < 2; copy += 1) {
          originalPieces.forEach((piece, index) => {
            const clone = piece.cloneNode(true) as HTMLElement;
            clone.style.setProperty('--d', `${80 + copy * 120 + index * 18}ms`);
            clone.style.transform = `scale(${0.85 + copy * 0.18})`;
            burst.appendChild(clone);
          });
        }
        burst.dataset.tripled = 'true';
      }
    }
  }

  modal.querySelectorAll<HTMLElement>('.critic-card.shown').forEach((card) => {
    const scoreValue = parseNumber(textOf(card.querySelector('b')));
    card.classList.remove('critic-score-low', 'critic-score-mid', 'critic-score-good', 'critic-score-high');
    if (!Number.isFinite(scoreValue)) return;
    if (scoreValue <= 3) card.classList.add('critic-score-low');
    else if (scoreValue <= 4.9) card.classList.add('critic-score-mid');
    else if (scoreValue <= 7.9) card.classList.add('critic-score-good');
    else card.classList.add('critic-score-high');
  });
}

function patchStudioUpgradeVisibility() {
  const summary = document.querySelector<HTMLElement>('.studio-summary');
  const upgrade = document.querySelector<HTMLElement>('.studio-upgrade');
  if (!summary || !upgrade) return;
  const releases = parseNumber(textOf(summary).match(/Релизов:\s*\d+/)?.[0]);
  upgrade.style.display = Number.isFinite(releases) && releases >= 2 ? '' : 'none';
}

function patchStudioExpensesInSummary() {
  const summary = document.querySelector<HTMLElement>('.studio-summary');
  const summaryLedger = summary?.querySelector<HTMLElement>('.mini-ledger');
  const timeLedger = document.querySelector<HTMLElement>('.time-card .mini-ledger');
  if (!summaryLedger || !timeLedger || summaryLedger.dataset.expensePatched === 'true') return;

  const rows = Array.from(timeLedger.children).map((item) => item.textContent?.trim() ?? '');
  const nextWriteOff = rows[1] || '—';
  const weeklyExpense = rows[3] || '—';
  summaryLedger.insertAdjacentHTML('beforeend', `<span>Расход/нед.</span><b>${weeklyExpense}</b><span>Списание</span><b>${nextWriteOff}</b>`);
  summaryLedger.dataset.expensePatched = 'true';
}

function patchReleaseArchive() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.panel.comic-card'));
  const archive = sections.find((section) => textOf(section.querySelector('h3')).includes('Архив релизов'));
  if (!archive) return;
  const rows = Array.from(archive.querySelectorAll<HTMLElement>('.release-archive-row'));
  if (rows.length <= 5) return;

  const scored = rows.map((row, index) => ({ row, index, score: parseNumber(textOf(row.querySelector('.archive-score-box b'))) }));
  const best = scored.reduce((top, item) => Number.isFinite(item.score) && item.score > top.score ? item : top, scored[0]);
  const visible = new Set<number>([0, 1, 2, 3, best.index]);

  scored.forEach((item) => {
    item.row.style.display = visible.has(item.index) ? '' : 'none';
    item.row.classList.toggle('archive-best-release', item.index === best.index);
  });

  const pill = archive.querySelector<HTMLElement>('.pill');
  if (pill) pill.textContent = 'лучший + 4 последних';
}

function applyPatch() {
  patchReleaseModal();
  patchStudioUpgradeVisibility();
  patchStudioExpensesInSummary();
  patchReleaseArchive();
}

export function installReleaseUiPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyPatch();
  const observer = new MutationObserver(() => applyPatch());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
