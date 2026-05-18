const STORAGE_KEY = 'devstudio_tycoon_mvp_save_v2';
const API_URL = 'https://devstudio-tycoon-api.onrender.com';

const releaseCommentPool = [
  'Смелая идея, и она почти сработала.',
  'Есть шероховатости, но характер чувствуется.',
  'Не всё идеально, зато запоминается.',
  'Проект спорный, но точно не бездушный.',
  'Игре не хватает полировки, но цепляет.',
  'Видно амбицию, и это подкупает.',
  'Не каждый элемент на месте, но общее впечатление хорошее.',
  'Работает лучше, чем кажется на первый взгляд.',
  'Есть удачные находки, которые хочется хвалить.',
  'Не без компромиссов, но с понятным лицом.',
  'Чувствуется направление и уверенная рука.',
  'Фундамент хороший, осталось нарастить мясо.',
  'Порог входа низкий, а удовольствие — выше ожиданий.',
  'Не без огрехов, зато с настроением.',
  'Местами сыровато, но очень симпатично.',
  'Собрано неровно, но с душой.',
  'Есть идеи, ради которых стоит зайти.',
  'У проекта слышен собственный голос.',
  'Не хит, но и мимо пройти сложно.',
  'Сначала сомневаешься, потом втягиваешься.',
  'Интереснее, чем подсказывает первое впечатление.',
  'В проекте есть внутренний ритм.',
  'Не всё совпало, но многое получилось.',
  'Амбиции немного опережают исполнение.',
  'Формула не новая, но подана уверенно.',
  'Потенциал читается в каждой детали.',
  'Не каждый риск оправдан, но рисковать стоило.',
  'Есть ощущение роста команды.',
  'Проекту идёт его собственная странность.',
  'Работа не без ошибок, но не без магии.',
  'У игры есть лицо — это уже немало.',
  'Не шедевр, но сильная попытка.',
  'За видимой простотой скрывается характер.',
  'Технически неровно, эмоционально — попадание.',
  'Есть за что придраться, но и похвалить есть что.',
  'Пульс проекта чувствуется сразу.',
  'Некоторые решения спорные, но не случайные.',
  'Команда явно понимала, что хотела сказать.',
  'Есть удачные моменты, которые вытягивают всё остальное.',
  'Не хватает лоска, зато хватает энергии.',
  'Сырая форма не скрывает хорошее ядро.',
  'Хочется большего, и это хороший знак.',
  'Механики не всегда точны, но настроение работает.',
  'Иногда буксует, но быстро возвращает интерес.',
  'Внутри больше жизни, чем можно было ожидать.',
  'Скромнее по масштабу, чем по эмоции.',
  'Не всё дожали, но почти дотянули.',
  'Проект располагает к себе не сразу, зато честно.',
  'Есть что дорабатывать, но есть и что любить.',
  'Не без сбоев, но с правильным вектором.',
  'Некоторые углы остались острыми, и это даже идёт игре.',
  'Сильнее всего тут работает настроение.',
  'Есть чувство, что команда нащупала своё.',
  'Местами грубовато, зато не стерильно.',
  'Игре идёт её несовершенство.',
  'Не каждый элемент сияет, но общее полотно смотрится.',
  'Это не прорыв, но заметная заявка.',
  'Проект оставляет тёплое послевкусие.',
  'Есть ощущение ручной работы в хорошем смысле.',
  'Важнее всего — игре не всё равно.',
  'Неровный, но любопытный результат.',
  'Работа местами спотыкается, но не падает.',
  'Пусть и не без шума, зато с искрой.',
  'Чувствуется старание, и оно не пропадает зря.',
  'В проекте много симпатичных решений.',
  'Даже в слабых местах виден потенциал.',
  'Не всё отполировано, но и не пусто.',
  'Сильная база для будущего роста.',
  'Есть сцены и моменты, которые останутся в памяти.',
  'Проект не играет безопасно — и это плюс.',
  'Работа не идеальна, но живая.',
  'Видно, что команда набирает форму.',
  'Смесь идей получилась любопытной.',
  'Есть удачный баланс между дерзостью и понятностью.',
  'Проект умеет удивлять в мелочах.',
  'Не каждая деталь точна, но общий тон выдержан.',
  'Игра предлагает больше, чем обещает на входе.',
  'Хороший пример того, как стиль поддерживает содержание.',
  'Не хватает пары итераций до блеска.',
  'Даже когда ошибается, делает это интересно.',
  'Не весь замах реализован, но многое попало в цель.',
  'Здесь есть что обсуждать — и это уже достижение.',
  'Игра не боится быть собой.',
  'Местами проседает, но быстро отыгрывается.',
  'Чувствуется авторское отношение.',
  'Работа искренняя — и это видно.',
  'Проект строится на хороших интонациях.',
  'Есть слабые места, но нет равнодушия.',
  'Не без шероховатостей, зато с ясным темпераментом.',
  'Местами хочется больше глубины, но база крепкая.',
  'Проект приятно удивляет после пары минут.',
  'Есть ощущение, что команда нашла нужный тон.',
  'Не всё сбалансировано, но многое увлекает.',
  'Фокус временами плавает, интерес — нет.',
  'Есть индивидуальность, которой многим не хватает.',
  'Релиз не без странностей, но они работают на образ.',
  'Не финальная форма, но очень хороший шаг.',
  'Тут есть та самая искра, ради которой хочется ждать продолжения.',
  'Игру хочется обсуждать, а не просто закрыть.',
  'Есть задел на что-то по-настоящему сильное.',
  'Пускай местами грубо, зато не безлико.',
  'Проект оставляет ощущение движения вперёд.',
];

function parseNumber(value: string | null | undefined) {
  const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

function textOf(element: Element | null | undefined) {
  return element?.textContent?.trim() ?? '';
}

function randomIndex(length: number) {
  if (length <= 0) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] % length;
  }
  return Math.floor(Math.random() * length);
}

function randomReleaseComment() {
  return releaseCommentPool[randomIndex(releaseCommentPool.length)] ?? releaseCommentPool[0];
}

function telegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

function updateWalletCoins(value: number) {
  const walletCoins = document.querySelector<HTMLElement>('.wallet span:first-child');
  if (!walletCoins) return;
  const textNode = Array.from(walletCoins.childNodes).reverse().find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.textContent = ` ${Math.round(value).toLocaleString('ru-RU')}`;
}

function readLocalSave(): Record<string, unknown> | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function persistClaimedOfflineReward(amount: number) {
  const save = readLocalSave();
  if (!save) return null;
  const currentCoins = Number(save.coins) || 0;
  const pendingReward = Math.max(0, Number(save.lastOfflineReward) || amount);
  const reward = Math.max(0, pendingReward || amount);
  const nextSave = {
    ...save,
    coins: currentCoins + reward,
    lastOfflineReward: 0,
    lastSavedAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSave));
  } catch {
    return nextSave;
  }

  const initData = telegramInitData();
  if (initData) {
    void fetch(`${API_URL}/api/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `tma ${initData}`,
      },
      body: JSON.stringify(nextSave),
    }).catch(() => undefined);
  }

  return nextSave;
}

function patchOfflineRewardClaim() {
  document.querySelectorAll<HTMLElement>('.offline-toast').forEach((toast) => {
    if (toast.dataset.offlineClaimPatched === 'true') return;
    toast.dataset.offlineClaimPatched = 'true';
    toast.addEventListener('click', (event) => {
      const amount = parseNumber(textOf(toast));
      if (!Number.isFinite(amount) || amount <= 0) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const nextSave = persistClaimedOfflineReward(amount);
      const nextCoins = Number(nextSave?.coins);
      if (Number.isFinite(nextCoins)) updateWalletCoins(nextCoins);
      toast.classList.add('offline-toast-claimed');
      toast.textContent = `Зачислено +${Math.round(amount).toLocaleString('ru-RU')} 🪙`;
      window.setTimeout(() => window.location.reload(), 240);
    }, { capture: true });
  });
}

function patchReleaseModal() {
  const modal = document.querySelector<HTMLElement>('.release-modal.animated-release');
  if (!modal) return;
  modal.classList.add('release-modal-v8');

  const coverArt = modal.querySelector<HTMLElement>('.cover-art');
  coverArt?.classList.add('pixel-cat-cover');

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
    const quote = card.querySelector<HTMLElement>('em');
    if (quote && card.dataset.releaseCommentPatched !== 'true') {
      quote.textContent = randomReleaseComment();
      card.dataset.releaseCommentPatched = 'true';
    }
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
  patchOfflineRewardClaim();
}

export function installReleaseUiPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  applyPatch();
  const observer = new MutationObserver(() => applyPatch());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}