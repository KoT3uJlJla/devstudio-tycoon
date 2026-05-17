import type { DevEventScenario, Employee, Genre, Platform, ResearchNode, Theme } from './types';

export const genres: Genre[] = [
  { id: 'arcade', name: 'Аркада', emoji: '🕹️', isBase: true, difficulty: 0.85, ideal: { pre: [35, 50, 15], production: [15, 55, 30], post: [20, 45, 35] } },
  { id: 'platformer', name: 'Платформер', emoji: '🍄', isBase: true, difficulty: 0.95, ideal: { pre: [30, 55, 15], production: [10, 65, 25], post: [20, 55, 25] } },
  { id: 'rpg', name: 'РПГ', emoji: '⚔️', isBase: true, difficulty: 1.28, ideal: { pre: [20, 30, 50], production: [45, 30, 25], post: [50, 25, 25] } },
  { id: 'strategy', name: 'Стратегия', emoji: '♟️', isBase: true, difficulty: 1.18, ideal: { pre: [40, 40, 20], production: [20, 35, 45], post: [25, 35, 40] } },
  { id: 'puzzle', name: 'Головоломка', emoji: '🧩', isBase: true, difficulty: 0.88, ideal: { pre: [25, 60, 15], production: [15, 65, 20], post: [15, 50, 35] } },
  { id: 'horror', name: 'Хоррор', emoji: '👻', difficulty: 1.05, ideal: { pre: [25, 25, 50], production: [35, 35, 30], post: [45, 25, 30] } },
  { id: 'racing', name: 'Гонки', emoji: '🏎️', difficulty: 1.03, ideal: { pre: [45, 45, 10], production: [10, 60, 30], post: [15, 45, 40] } },
  { id: 'fighting', name: 'Файтинг', emoji: '🥊', difficulty: 1.07, ideal: { pre: [30, 55, 15], production: [10, 65, 25], post: [20, 45, 35] } },
  { id: 'simulator', name: 'Симулятор', emoji: '🧪', difficulty: 1.15, ideal: { pre: [45, 35, 20], production: [20, 35, 45], post: [35, 35, 30] } },
  { id: 'visual-novel', name: 'Визуальная новелла', emoji: '💬', difficulty: 0.92, ideal: { pre: [15, 25, 60], production: [60, 25, 15], post: [35, 25, 40] } },
  { id: 'roguelike', name: 'Рогалик', emoji: '🎲', difficulty: 1.22, ideal: { pre: [35, 45, 20], production: [20, 50, 30], post: [30, 45, 25] } },
  { id: 'deckbuilder', name: 'Колодострой', emoji: '🃏', difficulty: 1.1, ideal: { pre: [30, 50, 20], production: [25, 50, 25], post: [20, 55, 25] } },
  { id: 'survival', name: 'Survival', emoji: '🏕️', difficulty: 1.24, ideal: { pre: [35, 35, 30], production: [25, 45, 30], post: [45, 30, 25] } },
  { id: 'metroidvania', name: 'Метроидвания', emoji: '🗺️', difficulty: 1.18, ideal: { pre: [35, 45, 20], production: [15, 60, 25], post: [35, 45, 20] } },
  { id: 'sandbox', name: 'Песочница', emoji: '🏗️', difficulty: 1.35, ideal: { pre: [45, 35, 20], production: [15, 45, 40], post: [50, 30, 20] } },
  { id: 'battle-royale', name: 'Королевская битва', emoji: '🪂', difficulty: 1.45, ideal: { pre: [45, 40, 15], production: [10, 45, 45], post: [25, 45, 30] } },
  { id: 'rhythm', name: 'Ритм-игра', emoji: '🎧', difficulty: 1.02, ideal: { pre: [25, 45, 30], production: [15, 55, 30], post: [15, 35, 50] } },
  { id: 'party', name: 'Вечериночная игра', emoji: '🎉', difficulty: 0.9, ideal: { pre: [25, 60, 15], production: [15, 55, 30], post: [25, 45, 30] } },
  { id: 'idle', name: 'Айдл', emoji: '⏳', difficulty: 0.86, ideal: { pre: [35, 45, 20], production: [20, 45, 35], post: [20, 55, 25] } },
  { id: 'tower-defense', name: 'Защита башни', emoji: '🏰', difficulty: 1.05, ideal: { pre: [35, 45, 20], production: [15, 45, 40], post: [25, 45, 30] } },
  { id: 'moba-lite', name: 'MOBA-lite', emoji: '🛡️', difficulty: 1.4, ideal: { pre: [40, 40, 20], production: [15, 40, 45], post: [30, 45, 25] } },
  { id: 'city-builder', name: 'Градостроитель', emoji: '🏙️', difficulty: 1.3, ideal: { pre: [45, 35, 20], production: [20, 35, 45], post: [45, 35, 20] } },
  { id: 'detective-game', name: 'Детективная', emoji: '🔎', difficulty: 1.0, ideal: { pre: [20, 35, 45], production: [45, 35, 20], post: [40, 30, 30] } },
  { id: 'sports-manager', name: 'Спорт-менеджер', emoji: '📋', difficulty: 1.17, ideal: { pre: [40, 35, 25], production: [25, 35, 40], post: [35, 35, 30] } },
  { id: 'social-sim', name: 'Соц-сим', emoji: '💞', difficulty: 1.08, ideal: { pre: [20, 35, 45], production: [50, 30, 20], post: [40, 35, 25] } },
];

export const themes: Theme[] = [
  { id: 'space', name: 'Космос', emoji: '🚀', isBase: true, focusBias: { pre: [6, 0, -6], production: [-4, 0, 4], post: [2, 4, -6] } },
  { id: 'fantasy', name: 'Фэнтези', emoji: '🐉', isBase: true, focusBias: { pre: [-4, -2, 6], production: [4, 2, -6], post: [8, -4, -4] } },
  { id: 'cyberpunk', name: 'Киберпанк', emoji: '🌆', isBase: true, focusBias: { pre: [6, 2, -8], production: [-4, 0, 4], post: [0, 10, -10] } },
  { id: 'school', name: 'Школа', emoji: '🎒', isBase: true, focusBias: { pre: [-8, 2, 6], production: [8, 2, -10], post: [2, 0, -2] } },
  { id: 'zombie', name: 'Зомби', emoji: '🧟', isBase: true, focusBias: { pre: [0, -4, 4], production: [-2, 2, 0], post: [8, -4, -4] } },
  { id: 'detective', name: 'Детектив', emoji: '🕵️', focusBias: { pre: [-6, 2, 4], production: [8, -2, -6], post: [6, -2, -4] } },
  { id: 'medieval', name: 'Средневековье', emoji: '🏰', focusBias: { pre: [-2, 0, 2], production: [4, 0, -4], post: [8, -4, -4] } },
  { id: 'sport', name: 'Спорт', emoji: '🏀', focusBias: { pre: [2, 8, -10], production: [-8, 8, 0], post: [-2, 2, 0] } },
  { id: 'postapoc', name: 'Постапокалипсис', emoji: '☢️', focusBias: { pre: [2, -2, 0], production: [-2, 4, -2], post: [10, -5, -5] } },
  { id: 'military', name: 'Военный', emoji: '🎖️', focusBias: { pre: [4, 4, -8], production: [-10, 2, 8], post: [0, 4, -4] } },
  { id: 'mythology', name: 'Мифология', emoji: '🏺', focusBias: { pre: [-6, 0, 6], production: [6, 0, -6], post: [8, -2, -6] } },
  { id: 'underwater', name: 'Подводный мир', emoji: '🐙', focusBias: { pre: [4, 0, -4], production: [-2, 2, 0], post: [8, 6, -14] } },
  { id: 'pirates', name: 'Пираты', emoji: '🏴‍☠️', focusBias: { pre: [-2, 4, -2], production: [4, 2, -6], post: [8, -2, -6] } },
  { id: 'kaiju', name: 'Кайдзю', emoji: '🦖', focusBias: { pre: [4, 4, -8], production: [-6, 6, 0], post: [0, 10, -10] } },
  { id: 'dreams', name: 'Сны', emoji: '🌙', focusBias: { pre: [-4, 0, 4], production: [4, -2, -2], post: [10, -2, -8] } },
  { id: 'office', name: 'Офис', emoji: '💼', focusBias: { pre: [-4, 4, 0], production: [6, -2, -4], post: [0, 0, 0] } },
  { id: 'food', name: 'Еда', emoji: '🍜', focusBias: { pre: [-2, 8, -6], production: [2, 8, -10], post: [0, 2, -2] } },
  { id: 'music', name: 'Музыка', emoji: '🎸', focusBias: { pre: [-2, 4, -2], production: [4, 4, -8], post: [-8, 2, 6] } },
  { id: 'ai-revolt', name: 'ИИ-бунт', emoji: '🤖', focusBias: { pre: [8, 0, -8], production: [-6, 0, 6], post: [0, 8, -8] } },
  { id: 'time-travel', name: 'Петля времени', emoji: '⌛', focusBias: { pre: [4, 0, -4], production: [2, 2, -4], post: [6, -2, -4] } },
];

export const baseGenreIds = genres.filter((item) => item.isBase).map((item) => item.id);
export const baseThemeIds = themes.filter((item) => item.isBase).map((item) => item.id);

export const platforms: Platform[] = [
  { id: 'micro_pc', name: 'Микро-ПК', emoji: '💾', userbase: 1, techComplexity: 1, unlockLevel: 1 },
  { id: 'pocket_play', name: 'PocketPlay', emoji: '📱', userbase: 1.25, techComplexity: 1.08, unlockLevel: 2 },
  { id: 'game_station', name: 'GameStation', emoji: '🎮', userbase: 1.45, techComplexity: 1.22, unlockLevel: 4 },
  { id: 'smart_game', name: 'SmartGame', emoji: '📺', userbase: 1.62, techComplexity: 1.35, unlockLevel: 7 },
];

export const comboMatrix: Record<string, 'Great' | 'Good' | 'Neutral' | 'Bad'> = {
  'arcade:cyberpunk': 'Great', 'arcade:sport': 'Great', 'arcade:space': 'Good', 'arcade:zombie': 'Good', 'arcade:school': 'Bad',
  'platformer:fantasy': 'Great', 'platformer:food': 'Great', 'platformer:pirates': 'Good', 'platformer:cyberpunk': 'Good', 'platformer:space': 'Neutral',
  'rpg:fantasy': 'Great', 'rpg:cyberpunk': 'Great', 'rpg:medieval': 'Great', 'rpg:mythology': 'Great', 'rpg:school': 'Neutral',
  'strategy:space': 'Great', 'strategy:military': 'Great', 'strategy:time-travel': 'Good', 'strategy:fantasy': 'Good', 'strategy:school': 'Bad',
  'puzzle:school': 'Great', 'puzzle:detective': 'Great', 'puzzle:time-travel': 'Great', 'puzzle:space': 'Good', 'puzzle:zombie': 'Bad',
  'horror:zombie': 'Great', 'horror:space': 'Great', 'horror:school': 'Good', 'horror:detective': 'Good', 'horror:dreams': 'Great',
  'racing:sport': 'Great', 'racing:cyberpunk': 'Good', 'racing:kaiju': 'Bad',
  'fighting:school': 'Good', 'fighting:military': 'Good', 'fighting:kaiju': 'Great', 'fighting:mythology': 'Good',
  'simulator:space': 'Good', 'simulator:sport': 'Good', 'simulator:office': 'Great', 'simulator:food': 'Good',
  'visual-novel:school': 'Great', 'visual-novel:detective': 'Good', 'visual-novel:fantasy': 'Good', 'visual-novel:dreams': 'Great',
  'roguelike:postapoc': 'Great', 'roguelike:mythology': 'Good', 'roguelike:space': 'Good',
  'deckbuilder:fantasy': 'Great', 'deckbuilder:detective': 'Good', 'deckbuilder:ai-revolt': 'Good',
  'survival:zombie': 'Great', 'survival:postapoc': 'Great', 'survival:underwater': 'Good',
  'metroidvania:space': 'Great', 'metroidvania:underwater': 'Good', 'metroidvania:medieval': 'Good',
  'sandbox:space': 'Good', 'sandbox:office': 'Good', 'sandbox:kaiju': 'Great',
  'battle-royale:military': 'Great', 'battle-royale:zombie': 'Good', 'battle-royale:school': 'Bad',
  'rhythm:music': 'Great', 'rhythm:dreams': 'Good', 'rhythm:school': 'Good',
  'party:food': 'Great', 'party:school': 'Good', 'party:sport': 'Good',
  'idle:office': 'Great', 'idle:space': 'Good', 'idle:ai-revolt': 'Good',
  'tower-defense:medieval': 'Great', 'tower-defense:zombie': 'Good', 'tower-defense:kaiju': 'Great',
  'moba-lite:mythology': 'Great', 'moba-lite:cyberpunk': 'Good', 'moba-lite:school': 'Bad',
  'city-builder:postapoc': 'Good', 'city-builder:space': 'Great', 'city-builder:office': 'Good',
  'detective-game:detective': 'Great', 'detective-game:school': 'Good', 'detective-game:cyberpunk': 'Good',
  'sports-manager:sport': 'Great', 'sports-manager:school': 'Good',
  'social-sim:school': 'Great', 'social-sim:office': 'Great', 'social-sim:music': 'Good',
};

export const critics = [
  { name: 'Пиксель Сегодня', quote: 'кадр за кадром, но цепляет' },
  { name: 'Инди Радар', quote: 'у проекта есть свой голос' },
  { name: 'Отчёт об ошибках', quote: 'мы нашли баги, но нашли и душу' },
  { name: 'Игровая неделя', quote: 'комьюнити будет спорить весь вечер' },
];

export const employeePool: Employee[] = [
  { id: 'dev-lena', role: 'Программист', name: 'Лена Байт', level: 1, cost: 3000, speedBoost: 0.12, incomeBoost: 0.03, scienceBoost: 0.02, scoreBoost: 0.00, specialization: '+ движок' },
  { id: 'art-kai', role: 'Художник', name: 'Кай Неон', level: 1, cost: 3300, speedBoost: 0.08, incomeBoost: 0.08, scienceBoost: 0.00, scoreBoost: 0.03, specialization: '+ графика' },
  { id: 'design-mira', role: 'Дизайнер', name: 'Мира Петля', level: 1, cost: 3600, speedBoost: 0.10, incomeBoost: 0.05, scienceBoost: 0.01, scoreBoost: 0.04, specialization: '+ геймплей' },
  { id: 'marketing-tom', role: 'Маркетолог', name: 'Том Хайп', level: 1, cost: 4200, speedBoost: 0.04, incomeBoost: 0.16, scienceBoost: 0.00, scoreBoost: -0.02, specialization: '+ хайп, -полиш' },
  { id: 'producer-nika', role: 'Продюсер', name: 'Ника Scope', level: 1, cost: 4600, speedBoost: 0.07, incomeBoost: 0.12, scienceBoost: 0.02, scoreBoost: 0.03, specialization: '- хаос сроков' },
  { id: 'analyst-zen', role: 'Аналитик', name: 'Зен Метрика', level: 1, cost: 3900, speedBoost: 0.05, incomeBoost: 0.10, scienceBoost: 0.10, scoreBoost: 0.01, specialization: '+ аудитория' },
  { id: 'dev-oleg', role: 'Программист', name: 'Олег Шейдер', level: 2, cost: 7400, speedBoost: 0.18, incomeBoost: 0.00, scienceBoost: 0.04, scoreBoost: 0.04, specialization: '+ стабильный билд' },
  { id: 'qa-ira', role: 'Аналитик', name: 'Ира Чеклист', level: 2, cost: 8200, speedBoost: -0.04, incomeBoost: 0.03, scienceBoost: 0.08, scoreBoost: 0.12, specialization: '+ качество, -скорость' },
  { id: 'mark-roma', role: 'Маркетолог', name: 'Рома Вирус', level: 2, cost: 9100, speedBoost: -0.06, incomeBoost: 0.30, scienceBoost: 0.00, scoreBoost: -0.04, specialization: '+ продажи, -темп' },
  { id: 'prod-sasha', role: 'Продюсер', name: 'Саша Роадмап', level: 2, cost: 9800, speedBoost: 0.14, incomeBoost: 0.10, scienceBoost: 0.03, scoreBoost: 0.05, specialization: '+ дедлайны' },
  { id: 'artist-ava', role: 'Художник', name: 'Ава Панель', level: 2, cost: 8700, speedBoost: 0.02, incomeBoost: 0.12, scienceBoost: 0.00, scoreBoost: 0.10, specialization: '+ стиль' },
  { id: 'designer-lev', role: 'Дизайнер', name: 'Лев Баланс', level: 2, cost: 9300, speedBoost: 0.08, incomeBoost: 0.04, scienceBoost: 0.05, scoreBoost: 0.11, specialization: '+ баланс' },
  { id: 'dev-maya', role: 'Программист', name: 'Майя Сборка', level: 3, cost: 15800, speedBoost: 0.26, incomeBoost: 0.02, scienceBoost: 0.08, scoreBoost: 0.08, specialization: '+ техдолг' },
  { id: 'monet-gleb', role: 'Маркетолог', name: 'Глеб ARPU', level: 3, cost: 17200, speedBoost: -0.10, incomeBoost: 0.48, scienceBoost: 0.02, scoreBoost: -0.08, specialization: '+ монетизация, -оценка' },
  { id: 'ux-nora', role: 'Дизайнер', name: 'Нора UX', level: 3, cost: 18100, speedBoost: 0.04, incomeBoost: 0.12, scienceBoost: 0.08, scoreBoost: 0.18, specialization: '+ удержание' },
  { id: 'sci-yun', role: 'Аналитик', name: 'Юн Данные', level: 3, cost: 15100, speedBoost: -0.02, incomeBoost: 0.06, scienceBoost: 0.28, scoreBoost: 0.05, specialization: '+ очки науки' },
  { id: 'prod-kira', role: 'Продюсер', name: 'Кира Релиз', level: 3, cost: 19600, speedBoost: 0.16, incomeBoost: 0.18, scienceBoost: 0.07, scoreBoost: 0.12, specialization: '+ релизный ритм' },
  { id: 'sound-vik', role: 'Художник', name: 'Вик Саунд', level: 3, cost: 16300, speedBoost: 0.00, incomeBoost: 0.10, scienceBoost: 0.04, scoreBoost: 0.14, specialization: '+ звук и вайб' },
  { id: 'lead-anna', role: 'Программист', name: 'Анна Архитектор', level: 4, cost: 36000, speedBoost: 0.34, incomeBoost: 0.08, scienceBoost: 0.12, scoreBoost: 0.14, specialization: '+ большие проекты' },
  { id: 'creative-pasha', role: 'Дизайнер', name: 'Паша Директор', level: 4, cost: 42000, speedBoost: -0.05, incomeBoost: 0.14, scienceBoost: 0.10, scoreBoost: 0.32, specialization: '+ сильная оценка, -темп' },
  { id: 'biz-alisa', role: 'Маркетолог', name: 'Алиса Паблишер', level: 4, cost: 39000, speedBoost: -0.08, incomeBoost: 0.62, scienceBoost: 0.05, scoreBoost: 0.02, specialization: '+ прибыль, -скорость' },
  { id: 'lab-dan', role: 'Аналитик', name: 'Дан Лаборатория', level: 4, cost: 33500, speedBoost: 0.03, incomeBoost: 0.08, scienceBoost: 0.42, scoreBoost: 0.10, specialization: '+ наука' },
  { id: 'exec-mila', role: 'Продюсер', name: 'Мила Executive', level: 4, cost: 47000, speedBoost: 0.22, incomeBoost: 0.28, scienceBoost: 0.12, scoreBoost: 0.20, specialization: '+ всё, дорого' },
  { id: 'ghost-den', role: 'Программист', name: 'Дэн Горящий', level: 2, cost: 6200, speedBoost: 0.30, incomeBoost: -0.04, scienceBoost: -0.02, scoreBoost: -0.10, specialization: '+ скорость, -качество' },
  { id: 'trend-lika', role: 'Маркетолог', name: 'Лика Тренд', level: 2, cost: 7800, speedBoost: -0.03, incomeBoost: 0.24, scienceBoost: 0.02, scoreBoost: 0.00, specialization: '+ тренды' },
  { id: 'mentor-boris', role: 'Продюсер', name: 'Борис Ментор', level: 3, cost: 20500, speedBoost: 0.10, incomeBoost: 0.08, scienceBoost: 0.22, scoreBoost: 0.16, specialization: '+ рост команды' },
];

export const researchNodes: ResearchNode[] = [
  { id: 'product-instinct', title: 'Продуктовое чутьё', description: 'Показывает силу жанр × сеттинг и рекомендуемый фокус по фазам.', cost: 18, effect: 'Комбо + фокус' },
  { id: 'market-analysis', title: 'Маркетинговый анализ', description: 'Дешевле раскрывать настроение живой аудитории.', cost: 22, effect: '-35% цена скана' },
  { id: 'fast-prototype', title: 'Быстрый прототип', description: 'Команда быстрее доводит проект до играбельного прототипа.', cost: 24, effect: '+10% скорость' },
  { id: 'budget-ops', title: 'Бюджетный продакшен', description: 'Сокращает стоимость разработки без потери качества.', cost: 30, effect: '-10% стоимость разработки' },
  { id: 'pixel-polish', title: 'Панельный полиш', description: 'Игры лучше выглядят на карточках и в публикациях.', cost: 32, effect: '+5% продажи' },
  { id: 'community-posts', title: 'Посты в комьюнити', description: 'Мемы и девлоги повышают интерес.', cost: 36, effect: '+7% доход' },
  { id: 'pocket-play-sdk', title: 'Набор PocketPlay', description: 'Открывает мобильную платформу PocketPlay.', cost: 40, effect: 'Открывает платформу', requires: 'fast-prototype' },
  { id: 'qa-checklist', title: 'Чеклист тестирования', description: 'Меньше багов перед релизом.', cost: 42, effect: '+0.3 оценка' },
  { id: 'game-feel', title: 'Ощущение от игры', description: 'Тапы и анимации ощущаются сочнее.', cost: 48, effect: '+0.4 оценка' },
  { id: 'micro-influencers', title: 'Микро-инфлюенсеры', description: 'Больше продаж на релизе.', cost: 52, effect: '+10% продажи' },
  { id: 'junior-pipeline', title: 'Поток джунов', description: 'Найм становится дешевле.', cost: 58, effect: '-10% цена найма' },
  { id: 'producer-calendar', title: 'Продюсерский календарь', description: 'Снижает риск провалов популярности в первые дни.', cost: 64, effect: 'стабильнее жизненный цикл' },
  { id: 'service-model', title: 'Сервисная модель', description: 'Игры дольше зарабатывают после релиза.', cost: 72, effect: '+15% пассивный доход' },
  { id: 'sound-lab', title: 'Звуковая лаборатория', description: 'Звук помогает отзывам.', cost: 78, effect: '+0.2 оценка' },
  { id: 'liveops-lite', title: 'Поддержка релизов', description: 'Случайные события чаще повышают популярность, чем ломают её.', cost: 86, effect: '+события жизни игры' },
  { id: 'game-station-sdk', title: 'Набор GameStation', description: 'Открывает консольную платформу.', cost: 96, effect: 'Платформа 3', requires: 'pocket-play-sdk' },
  { id: 'viral-hooks', title: 'Вирусные крючки', description: 'Хиты чаще получают органический всплеск.', cost: 104, effect: '+15% доход хитов' },
  { id: 'async-standups', title: 'Асинхронные стендапы', description: 'Студия лучше работает офлайн.', cost: 112, effect: '+20% офлайн-доход' },
  { id: 'reusable-tech', title: 'Переиспользуемые технологии', description: 'Сложные технологии дешевле повторно использовать.', cost: 120, effect: '-8% стоимость разработки' },
  { id: 'engine-v2', title: 'Движок 2.0', description: 'База для больших проектов.', cost: 138, effect: '+15% скорость', requires: 'reusable-tech' },
  { id: 'ai-assist', title: 'ИИ-помощник', description: 'Ускоряет рутину, но повышает технологическую сложность.', cost: 156, effect: '+12% скорость' },
  { id: 'team-synergy', title: 'Синергия команды', description: 'Каждый сотрудник чуть сильнее ускоряет разработку.', cost: 168, effect: '+командный буст' },
  { id: 'smart-game-sdk', title: 'Набор SmartGame', description: 'Открывает ТВ/облачную платформу.', cost: 185, effect: 'Платформа 4', requires: 'game-station-sdk' },
  { id: 'data-warehouse', title: 'Хранилище данных', description: 'Живая аудитория обучается быстрее и точнее показывает спрос.', cost: 205, effect: '+точность аудитории' },
  { id: 'seasonal-pr', title: 'Сезонный PR', description: 'Недельный рейтинг получает дополнительный скоринг за свежие хиты.', cost: 230, effect: '+рейтинг' },
];

export const gameNameParts = {
  prefix: ['Неон', 'Микро', 'Космо', 'Пиксель', 'Гипер', 'Турбо', 'Луна', 'Кибер', 'Дикий', 'Нова', 'Странный', 'Мега', 'Радио', 'Лазер', 'Улица'],
  suffix: ['Квест', 'Рывок', 'Сага', 'Петля', 'Тактика', 'Сон', 'Арена', 'Лаборатория', 'Джем', 'Мир', 'Сдвиг', 'Панк', 'Колода', 'Сигнал', 'Пульс'],
};

export const developmentEventScenarios: DevEventScenario[] = [
  {
    id: 'server-spike', title: 'Серверный пик', tone: 'risk',
    body: 'Тестовый билд внезапно собрал толпу. Серверы трещат, команда ждёт решения.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'artist-block', title: 'Арт-директор застрял', tone: 'opportunity',
    body: 'Ключевой экран выглядит скучно, но дедлайн рядом.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'viral-demo', title: 'Виральный демо-клип', tone: 'neutral',
    body: 'Короткий ролик с билдом может залететь, но требует времени.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'broken-save', title: 'Сейвы ломаются', tone: 'risk',
    body: 'Тестирование нашло редкий баг сохранений.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'funny-bug', title: 'Смешной баг', tone: 'opportunity',
    body: 'Персонаж смешно улетает за экран. Команда спорит: баг или фича?',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'scope-creep', title: 'Раздувание фич', tone: 'neutral',
    body: 'Дизайнер предлагает добавить ещё одну большую механику.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'sound-hook', title: 'Звуковой хук', tone: 'risk',
    body: 'Композитор нашёл цепляющий мотив, но нужна лицензия.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'angry-thread', title: 'Злой тред', tone: 'opportunity',
    body: 'В чате появилась критика раннего билда.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'intern-idea', title: 'Идея джуна', tone: 'neutral',
    body: 'Младший разработчик предлагает упростить onboarding.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'asset-leak', title: 'Утечка ассета', tone: 'risk',
    body: 'Черновой арт попал в маленький канал.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'engine-warning', title: 'Движок ругается', tone: 'opportunity',
    body: 'Профайлер показывает просадки FPS на слабых телефонах.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'platform-feature', title: 'Фича платформы', tone: 'neutral',
    body: 'Платформа предлагает экспериментальный API для видимости.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'review-build', title: 'Запрос превью', tone: 'risk',
    body: 'Небольшое медиа просит ранний билд.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'team-burnout', title: 'Команда устала', tone: 'opportunity',
    body: 'После серии фиксов у команды просела концентрация.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'ui-contrast', title: 'Проблема контраста', tone: 'neutral',
    body: 'На части экранов текст читается хуже, чем хотелось бы.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'microtransaction-idea', title: 'Идея монетизации', tone: 'risk',
    body: 'Маркетолог предлагает жёсткий платный буст.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'community-poll', title: 'Опрос комьюнити', tone: 'opportunity',
    body: 'Можно спросить игроков, какую фичу полировать первой.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'localization-gap', title: 'Пробел в локализации', tone: 'neutral',
    body: 'Часть строк осталась сухой и машинной.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'balance-drama', title: 'Спор о балансе', tone: 'risk',
    body: 'Одна стратегия явно сильнее остальных.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'boss-cameo', title: 'Камео босса', tone: 'opportunity',
    body: 'Есть шанс добавить забавное камео в игру.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'testers-love', title: 'Тестеры в восторге', tone: 'neutral',
    body: 'Плейтестеры просят усилить самую удачную механику.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'legal-name', title: 'Юридический риск названия', tone: 'risk',
    body: 'Название слишком похоже на чужой бренд.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'publisher-call', title: 'Звонок издателя', tone: 'opportunity',
    body: 'Издатель обещает промо, но просит изменить фичу под тренд.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'crash-on-ios', title: 'Краш на iOS', tone: 'neutral',
    body: 'Билд падает на части устройств.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'meme-title', title: 'Мемное название', tone: 'risk',
    body: 'Команда придумала смешное название для внутриигровой фичи.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'feature-flag', title: 'Фича под флагом', tone: 'opportunity',
    body: 'Можно спрятать спорную механику за переключателем.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'data-loss-rumor', title: 'Слух о потере данных', tone: 'neutral',
    body: 'В тестовом чате обсуждают возможный баг с прогрессом.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'speedrun-scene', title: 'Спидранеры нашли маршрут', tone: 'risk',
    body: 'Тестеры случайно открыли быстрый способ проходить игру.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'tutorial-skip', title: 'Кнопка skip', tone: 'opportunity',
    body: 'Есть спор: добавить ли пропуск обучения.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'boss-fight', title: 'Финальный момент слабый', tone: 'neutral',
    body: 'Кульминация не дотягивает до обещаний.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'store-art', title: 'Обложка в магазине', tone: 'risk',
    body: 'Обложка выглядит слишком обычной.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'qa-night', title: 'Ночная QA-смена', tone: 'opportunity',
    body: 'Можно оплатить дополнительную QA-сессию.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'trend-shift', title: 'Тренд меняется', tone: 'neutral',
    body: 'В чатах внезапно обсуждают другой тон игр.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'designer-duel', title: 'Спор дизайнеров', tone: 'risk',
    body: 'Два дизайнера предлагают противоположные решения.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'analytics-ping', title: 'Метрики теста', tone: 'opportunity',
    body: 'Аналитик заметил, что игроки бросают на третьей минуте.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'combat-juice', title: 'Сочность действий', tone: 'neutral',
    body: 'Анимации не дают достаточного ощущения удара.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'chat-stickers', title: 'Стикеры для шеринга', tone: 'risk',
    body: 'Можно сделать набор простых стикеров для релиза.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'database-cleanup', title: 'Чистка данных', tone: 'opportunity',
    body: 'В проекте накопился технический долг.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'streamer-feedback', title: 'Фидбек стримера', tone: 'neutral',
    body: 'Маленький стример дал точный совет по темпу игры.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'pricing-debate', title: 'Спор о цене', tone: 'risk',
    body: 'Команда сомневается, насколько агрессивно продавать игру.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'ai-voice', title: 'ИИ-озвучка', tone: 'opportunity',
    body: 'Можно быстро добавить синтетические реплики.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'festival-slot', title: 'Слот на фестивале', tone: 'neutral',
    body: 'Организаторы предлагают место в подборке, нужен демо-билд сегодня.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'achievement-bug', title: 'Ачивки глючат', tone: 'risk',
    body: 'Ачивки срабатывают слишком часто.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'modding-request', title: 'Просьба о моддинге', tone: 'opportunity',
    body: 'Ядро аудитории просит поддержку модов.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'accessibility', title: 'Доступность', tone: 'neutral',
    body: 'Тестеры просят настройки размера текста и эффектов.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'boss-micromanage', title: 'Микроменеджмент', tone: 'risk',
    body: 'Основатель хочет лично утвердить каждую мелочь.',
    choices: [
      { id: 'a', label: 'Исправить сейчас', result: 'Решение снизило риск и улучшило качество.', effect: { progress: -4, score: 0.24 } },
      { id: 'b', label: 'Отложить до патча', result: 'Темп выше, но качество просело.', effect: { progress: 2, score: -0.2 } },
    ],
  },
  {
    id: 'mystery-influencer', title: 'Таинственный инфлюенсер', tone: 'opportunity',
    body: 'Крупный канал просит эксклюзивный скриншот.',
    choices: [
      { id: 'a', label: 'Сделать мягкий PR', result: 'Аудитория получила понятный сигнал.', effect: { coins: -350, salesMultiplier: 1.1 } },
      { id: 'b', label: 'Не отвлекать команду', result: 'Бюджет цел, но шанс хайпа упущен.', effect: { progress: 2, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'economy-exploit', title: 'Экономический эксплойт', tone: 'neutral',
    body: 'Плейтестер нашёл способ бесконечно фармить валюту.',
    choices: [
      { id: 'a', label: 'Пойти на риск', result: 'Решение добавило яркости, но ударило по стабильности.', effect: { salesMultiplier: 1.14, score: -0.1 } },
      { id: 'b', label: 'Выбрать стабильность', result: 'Игра стала ровнее и надёжнее.', effect: { score: 0.14 } },
    ],
  },
  {
    id: 'mobile-heat', title: 'Телефон греется', tone: 'risk',
    body: 'На старых устройствах игра быстро нагружает батарею.',
    choices: [
      { id: 'a', label: 'Инвестировать ресурсы', result: 'Вложение окупилось качеством.', effect: { coins: -650, score: 0.22, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Сэкономить бюджет', result: 'Сэкономили монеты, но результат слабее.', effect: { coins: 250, score: -0.12 } },
    ],
  },
  {
    id: 'npc-dialogue', title: 'Диалоги NPC', tone: 'opportunity',
    body: 'Сценарист предлагает добавить больше живых реплик.',
    choices: [
      { id: 'a', label: 'Сфокусироваться на ядре', result: 'Команда быстрее дошла до сильного решения.', effect: { progress: 3, score: 0.08 } },
      { id: 'b', label: 'Добавить фичу', result: 'Фича дала глубину, но отняла время.', effect: { progress: -5, score: 0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-001', title: 'Тестеры спорят о первом боссе', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-002', title: 'Билд тормозит на старом телефоне', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-003', title: 'Внутренний чат загорелся идеей', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-004', title: 'Комьюнити просит демоверсию', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-005', title: 'Новый туториал слишком длинный', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-006', title: 'Художник предлагает сменить палитру', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-007', title: 'Саундтрек звучит слишком спокойно', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-008', title: 'Баланс экономики просел', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-009', title: 'Система достижений ломает темп', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-010', title: 'Первый уровень кажется пустым', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-011', title: 'Игровой цикл затягивает', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-012', title: 'Баг смешит всю команду', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-013', title: 'Интерфейс перегружен кнопками', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-014', title: 'Платформа прислала чеклист', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-015', title: 'Стример хочет ранний ключ', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-016', title: 'Плейтестеры не понимают цель', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-017', title: 'Персонаж получился харизматичным', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-018', title: 'Финальный экран выглядит бедно', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-019', title: 'Локализация не влезает в кнопки', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-020', title: 'Анимация победы не цепляет', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-021', title: 'Слишком много подсказок', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-022', title: 'Мало обратной связи от кликов', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-023', title: 'Редкий краш после паузы', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-024', title: 'Появился фанатский мем', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-025', title: 'Продюсер просит сократить объём', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-026', title: 'Дизайнер защищает сложную механику', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-027', title: 'Аналитик нашёл сильный сегмент', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-028', title: 'Сборка стала стабильнее', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-029', title: 'Магазин внутри игры спорный', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-030', title: 'Игроки любят быстрые сессии', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-031', title: 'Идея с сезонным событием', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-032', title: 'Сложность резко растёт', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-033', title: 'Визуал стал однообразным', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-034', title: 'Звук клика раздражает', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-035', title: 'Пресса просит пресс-кит', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-036', title: 'Старый прототип внезапно пригодился', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-037', title: 'Нужен экран настроек', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-038', title: 'Тестовый турнир пошёл не так', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-039', title: 'Команда устала от правок', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-040', title: 'Появился шанс на коллаборацию', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-041', title: 'Реферальный экран выглядит скучно', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-042', title: 'Игровой день слишком незаметен', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-043', title: 'Босс просит добавить шутку', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-044', title: 'Монетизация выглядит жёстко', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-045', title: 'Уровни проходятся слишком быстро', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-046', title: 'Игроки хвалят атмосферу', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-047', title: 'Система сохранений шумит', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-048', title: 'Нужна оптимизация загрузки', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-049', title: 'Витрина просит новый баннер', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-050', title: 'Комьюнити нашло короткий путь', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-051', title: 'Тестеры спорят о первом боссе', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-052', title: 'Билд тормозит на старом телефоне', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-053', title: 'Внутренний чат загорелся идеей', tone: 'opportunity',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-054', title: 'Комьюнити просит демоверсию', tone: 'neutral',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-055', title: 'Новый туториал слишком длинный', tone: 'risk',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-056', title: 'Художник предлагает сменить палитру', tone: 'opportunity',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-057', title: 'Саундтрек звучит слишком спокойно', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-058', title: 'Баланс экономики просел', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-059', title: 'Система достижений ломает темп', tone: 'opportunity',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-060', title: 'Первый уровень кажется пустым', tone: 'neutral',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-061', title: 'Игровой цикл затягивает', tone: 'risk',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-062', title: 'Баг смешит всю команду', tone: 'opportunity',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-063', title: 'Интерфейс перегружен кнопками', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-064', title: 'Платформа прислала чеклист', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-065', title: 'Стример хочет ранний ключ', tone: 'opportunity',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-066', title: 'Плейтестеры не понимают цель', tone: 'neutral',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-067', title: 'Персонаж получился харизматичным', tone: 'risk',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-068', title: 'Финальный экран выглядит бедно', tone: 'opportunity',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-069', title: 'Локализация не влезает в кнопки', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-070', title: 'Анимация победы не цепляет', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-071', title: 'Слишком много подсказок', tone: 'opportunity',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-072', title: 'Мало обратной связи от кликов', tone: 'neutral',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-073', title: 'Редкий краш после паузы', tone: 'risk',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-074', title: 'Появился фанатский мем', tone: 'opportunity',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-075', title: 'Продюсер просит сократить объём', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-076', title: 'Дизайнер защищает сложную механику', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-077', title: 'Аналитик нашёл сильный сегмент', tone: 'opportunity',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-078', title: 'Сборка стала стабильнее', tone: 'neutral',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-079', title: 'Магазин внутри игры спорный', tone: 'risk',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-080', title: 'Игроки любят быстрые сессии', tone: 'opportunity',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-081', title: 'Идея с сезонным событием', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-082', title: 'Сложность резко растёт', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-083', title: 'Визуал стал однообразным', tone: 'opportunity',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-084', title: 'Звук клика раздражает', tone: 'neutral',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-085', title: 'Пресса просит пресс-кит', tone: 'risk',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-086', title: 'Старый прототип внезапно пригодился', tone: 'opportunity',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-087', title: 'Нужен экран настроек', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-088', title: 'Тестовый турнир пошёл не так', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-089', title: 'Команда устала от правок', tone: 'opportunity',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-090', title: 'Появился шанс на коллаборацию', tone: 'neutral',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-091', title: 'Реферальный экран выглядит скучно', tone: 'risk',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-092', title: 'Игровой день слишком незаметен', tone: 'opportunity',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-093', title: 'Босс просит добавить шутку', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-094', title: 'Монетизация выглядит жёстко', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-095', title: 'Уровни проходятся слишком быстро', tone: 'opportunity',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-096', title: 'Игроки хвалят атмосферу', tone: 'neutral',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-097', title: 'Система сохранений шумит', tone: 'risk',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-098', title: 'Нужна оптимизация загрузки', tone: 'opportunity',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-099', title: 'Витрина просит новый баннер', tone: 'neutral',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-100', title: 'Комьюнити нашло короткий путь', tone: 'risk',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-101', title: 'Тестеры спорят о первом боссе', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-102', title: 'Билд тормозит на старом телефоне', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-103', title: 'Внутренний чат загорелся идеей', tone: 'risk',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-104', title: 'Комьюнити просит демоверсию', tone: 'opportunity',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-105', title: 'Новый туториал слишком длинный', tone: 'neutral',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-106', title: 'Художник предлагает сменить палитру', tone: 'risk',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-107', title: 'Саундтрек звучит слишком спокойно', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-108', title: 'Баланс экономики просел', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-109', title: 'Система достижений ломает темп', tone: 'risk',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-110', title: 'Первый уровень кажется пустым', tone: 'opportunity',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-111', title: 'Игровой цикл затягивает', tone: 'neutral',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-112', title: 'Баг смешит всю команду', tone: 'risk',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-113', title: 'Интерфейс перегружен кнопками', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-114', title: 'Платформа прислала чеклист', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-115', title: 'Стример хочет ранний ключ', tone: 'risk',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-116', title: 'Плейтестеры не понимают цель', tone: 'opportunity',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-117', title: 'Персонаж получился харизматичным', tone: 'neutral',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-118', title: 'Финальный экран выглядит бедно', tone: 'risk',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-119', title: 'Локализация не влезает в кнопки', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-120', title: 'Анимация победы не цепляет', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-121', title: 'Слишком много подсказок', tone: 'risk',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-122', title: 'Мало обратной связи от кликов', tone: 'opportunity',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-123', title: 'Редкий краш после паузы', tone: 'neutral',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-124', title: 'Появился фанатский мем', tone: 'risk',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-125', title: 'Продюсер просит сократить объём', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-126', title: 'Дизайнер защищает сложную механику', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-127', title: 'Аналитик нашёл сильный сегмент', tone: 'risk',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-128', title: 'Сборка стала стабильнее', tone: 'opportunity',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-129', title: 'Магазин внутри игры спорный', tone: 'neutral',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-130', title: 'Игроки любят быстрые сессии', tone: 'risk',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-131', title: 'Идея с сезонным событием', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-132', title: 'Сложность резко растёт', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-133', title: 'Визуал стал однообразным', tone: 'risk',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-134', title: 'Звук клика раздражает', tone: 'opportunity',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-135', title: 'Пресса просит пресс-кит', tone: 'neutral',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-136', title: 'Старый прототип внезапно пригодился', tone: 'risk',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-137', title: 'Нужен экран настроек', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-138', title: 'Тестовый турнир пошёл не так', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-139', title: 'Команда устала от правок', tone: 'risk',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-140', title: 'Появился шанс на коллаборацию', tone: 'opportunity',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-141', title: 'Реферальный экран выглядит скучно', tone: 'neutral',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-142', title: 'Игровой день слишком незаметен', tone: 'risk',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-143', title: 'Босс просит добавить шутку', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-144', title: 'Монетизация выглядит жёстко', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-145', title: 'Уровни проходятся слишком быстро', tone: 'risk',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-146', title: 'Игроки хвалят атмосферу', tone: 'opportunity',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-147', title: 'Система сохранений шумит', tone: 'neutral',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-148', title: 'Нужна оптимизация загрузки', tone: 'risk',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-149', title: 'Витрина просит новый баннер', tone: 'opportunity',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-150', title: 'Комьюнити нашло короткий путь', tone: 'neutral',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-151', title: 'Тестеры спорят о первом боссе', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-152', title: 'Билд тормозит на старом телефоне', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-153', title: 'Внутренний чат загорелся идеей', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Разобраться глубоко', result: 'Команда потратила время, но качество выросло.', effect: { progress: -3, score: 0.18, rp: 4 } },
      { id: 'b', label: 'Сделать быстрый фикс', result: 'Темп сохранился, но часть риска осталась.', effect: { progress: 3, score: -0.08, coins: 150 } },
    ],
  },
  {
    id: 'extra-dev-event-154', title: 'Комьюнити просит демоверсию', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Вложить бюджет', result: 'Дополнительные расходы усилили релиз.', effect: { coins: -550, score: 0.2, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сэкономить', result: 'Бюджет цел, но проект стал менее уверенным.', effect: { coins: 350, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-155', title: 'Новый туториал слишком длинный', tone: 'opportunity',
    body: 'Ситуация не критичная, но может повлиять на восприятие релиза.',
    choices: [
      { id: 'a', label: 'Позвать аудиторию', result: 'Ранний фидбек дал команде новые идеи.', effect: { rp: 8, salesMultiplier: 1.04, progress: -2 } },
      { id: 'b', label: 'Решить внутри', result: 'Команда быстрее вернулась к работе.', effect: { progress: 4, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-156', title: 'Художник предлагает сменить палитру', tone: 'neutral',
    body: 'Решение сейчас определит, куда пойдёт текущий билд.',
    choices: [
      { id: 'a', label: 'Сделать вау-момент', result: 'Проект стал заметнее, но сборка усложнилась.', effect: { salesMultiplier: 1.1, progress: -4, score: 0.06 } },
      { id: 'b', label: 'Оставить проще', result: 'Игра стала понятнее и быстрее в разработке.', effect: { progress: 5, salesMultiplier: 0.97 } },
    ],
  },
  {
    id: 'extra-dev-event-157', title: 'Саундтрек звучит слишком спокойно', tone: 'risk',
    body: 'Есть шанс усилить проект, но это может ударить по срокам.',
    choices: [
      { id: 'a', label: 'Попросить поддержку платформы', result: 'Платформа помогла с видимостью.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.05 } },
      { id: 'b', label: 'Не тратить звёзды', result: 'Ресурсы сохранены, но шанс промо потерян.', effect: { stars: 1, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'extra-dev-event-158', title: 'Баланс экономики просел', tone: 'opportunity',
    body: 'Игроки могут заметить это уже в первые минуты после релиза.',
    choices: [
      { id: 'a', label: 'Наградить команду', result: 'Мотивация выросла, билд ожил.', effect: { coins: -400, progress: 4, score: 0.08 } },
      { id: 'b', label: 'Прижать дедлайн', result: 'Сроки лучше, но команда пропустила шероховатости.', effect: { progress: 6, score: -0.16 } },
    ],
  },
  {
    id: 'extra-dev-event-159', title: 'Система достижений ломает темп', tone: 'neutral',
    body: 'Команда предлагает два разных подхода и просит выбрать один.',
    choices: [
      { id: 'a', label: 'Устроить мини-полиш', result: 'Мелочи стали приятнее.', effect: { progress: -2, score: 0.13, rp: 3 } },
      { id: 'b', label: 'Не трогать', result: 'Риск не вырос, но и потенциал не раскрыт.', effect: { progress: 2, score: -0.04 } },
    ],
  },
  {
    id: 'extra-dev-event-160', title: 'Первый уровень кажется пустым', tone: 'risk',
    body: 'Во время спринта команда останавливается и ждёт решения.',
    choices: [
      { id: 'a', label: 'Сделать маленький подарок', result: 'Игроки оценят жест.', effect: { coins: -250, stars: 1, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Монетизировать жёстче', result: 'Касса может вырасти, но оценки под угрозой.', effect: { salesMultiplier: 1.12, score: -0.22 } },
    ],
  },
  {
    id: 'extra-dev-event-161', title: 'Плейтестеры спорят о сложности', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-162', title: 'Обложка теряет читаемость', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-163', title: 'Первые минуты провисают', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-164', title: 'Игроки просят кооператив', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-165', title: 'Новый враг ломает баланс', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-166', title: 'Меню выглядит перегруженным', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-167', title: 'Стример просит билд', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-168', title: 'Звук клика раздражает', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-169', title: 'Сцена стала мемной', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-170', title: 'Туториал слишком мягкий', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-171', title: 'Экономика выдаёт лишнее', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-172', title: 'Сцена босса не работает', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-173', title: 'Платформа просит фичу', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-174', title: 'Команда нашла shortcut', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-175', title: 'Анимация стала хитом', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-176', title: 'Локализация буксует', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-177', title: 'Тестеры нашли эксплойт', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-178', title: 'Комьюнити хочет челлендж', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-179', title: 'Старый ассет выбивается', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-180', title: 'Продюсер предлагает срезать фичу', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-181', title: 'Геймпад плохо ощущается', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-182', title: 'Сюжетный твист не читается', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-183', title: 'Мобильный билд тормозит', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-184', title: 'Художник просит день тишины', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-185', title: 'Аналитика показывает отвал', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-186', title: 'Первый экран не цепляет', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-187', title: 'ИИ ведёт себя странно', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-188', title: 'Сохранения работают медленно', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-189', title: 'Магазинная карточка скучная', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-190', title: 'Сборка падает на слабых устройствах', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-191', title: 'Пользователи требуют настройки', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-192', title: 'Сцена обучения перегружена', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-193', title: 'Звезда жанра заметила проект', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-194', title: 'Комьюнити просит режим арены', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-195', title: 'Визуал не бьётся с жанром', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-196', title: 'Звук даёт вау-эффект', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-197', title: 'Один уровень слишком длинный', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-198', title: 'Критики просят ранний билд', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-199', title: 'Система наград не мотивирует', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-200', title: 'Новый прототип внезапно хорош', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-201', title: 'Плейтестеры спорят о сложности', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-202', title: 'Обложка теряет читаемость', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-203', title: 'Первые минуты провисают', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-204', title: 'Игроки просят кооператив', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-205', title: 'Новый враг ломает баланс', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-206', title: 'Меню выглядит перегруженным', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-207', title: 'Стример просит билд', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-208', title: 'Звук клика раздражает', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-209', title: 'Сцена стала мемной', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-210', title: 'Туториал слишком мягкий', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-211', title: 'Экономика выдаёт лишнее', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-212', title: 'Сцена босса не работает', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-213', title: 'Платформа просит фичу', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-214', title: 'Команда нашла shortcut', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-215', title: 'Анимация стала хитом', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-216', title: 'Локализация буксует', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-217', title: 'Тестеры нашли эксплойт', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-218', title: 'Комьюнити хочет челлендж', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-219', title: 'Старый ассет выбивается', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-220', title: 'Продюсер предлагает срезать фичу', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-221', title: 'Геймпад плохо ощущается', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-222', title: 'Сюжетный твист не читается', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-223', title: 'Мобильный билд тормозит', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-224', title: 'Художник просит день тишины', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-225', title: 'Аналитика показывает отвал', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-226', title: 'Первый экран не цепляет', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-227', title: 'ИИ ведёт себя странно', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-228', title: 'Сохранения работают медленно', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-229', title: 'Магазинная карточка скучная', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-230', title: 'Сборка падает на слабых устройствах', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-231', title: 'Пользователи требуют настройки', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-232', title: 'Сцена обучения перегружена', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-233', title: 'Звезда жанра заметила проект', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-234', title: 'Комьюнити просит режим арены', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-235', title: 'Визуал не бьётся с жанром', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-236', title: 'Звук даёт вау-эффект', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-237', title: 'Один уровень слишком длинный', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-238', title: 'Критики просят ранний билд', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-239', title: 'Система наград не мотивирует', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-240', title: 'Новый прототип внезапно хорош', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-241', title: 'Плейтестеры спорят о сложности', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-242', title: 'Обложка теряет читаемость', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-243', title: 'Первые минуты провисают', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-244', title: 'Игроки просят кооператив', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-245', title: 'Новый враг ломает баланс', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-246', title: 'Меню выглядит перегруженным', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-247', title: 'Стример просит билд', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-248', title: 'Звук клика раздражает', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-249', title: 'Сцена стала мемной', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-250', title: 'Туториал слишком мягкий', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-251', title: 'Экономика выдаёт лишнее', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-252', title: 'Сцена босса не работает', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-253', title: 'Платформа просит фичу', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-254', title: 'Команда нашла shortcut', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-255', title: 'Анимация стала хитом', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-256', title: 'Локализация буксует', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-257', title: 'Тестеры нашли эксплойт', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-258', title: 'Комьюнити хочет челлендж', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-259', title: 'Старый ассет выбивается', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-260', title: 'Продюсер предлагает срезать фичу', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-261', title: 'Геймпад плохо ощущается', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-262', title: 'Сюжетный твист не читается', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-263', title: 'Мобильный билд тормозит', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-264', title: 'Художник просит день тишины', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-265', title: 'Аналитика показывает отвал', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-266', title: 'Первый экран не цепляет', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-267', title: 'ИИ ведёт себя странно', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-268', title: 'Сохранения работают медленно', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-269', title: 'Магазинная карточка скучная', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-270', title: 'Сборка падает на слабых устройствах', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-271', title: 'Пользователи требуют настройки', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-272', title: 'Сцена обучения перегружена', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-273', title: 'Звезда жанра заметила проект', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-274', title: 'Комьюнити просит режим арены', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-275', title: 'Визуал не бьётся с жанром', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-276', title: 'Звук даёт вау-эффект', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-277', title: 'Один уровень слишком длинный', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-278', title: 'Критики просят ранний билд', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-279', title: 'Система наград не мотивирует', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-280', title: 'Новый прототип внезапно хорош', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-281', title: 'Плейтестеры спорят о сложности', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-282', title: 'Обложка теряет читаемость', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-283', title: 'Первые минуты провисают', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-284', title: 'Игроки просят кооператив', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-285', title: 'Новый враг ломает баланс', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-286', title: 'Меню выглядит перегруженным', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-287', title: 'Стример просит билд', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-288', title: 'Звук клика раздражает', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-289', title: 'Сцена стала мемной', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-290', title: 'Туториал слишком мягкий', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-291', title: 'Экономика выдаёт лишнее', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-292', title: 'Сцена босса не работает', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-293', title: 'Платформа просит фичу', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-294', title: 'Команда нашла shortcut', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-295', title: 'Анимация стала хитом', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-296', title: 'Локализация буксует', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-297', title: 'Тестеры нашли эксплойт', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-298', title: 'Комьюнити хочет челлендж', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-299', title: 'Старый ассет выбивается', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-300', title: 'Продюсер предлагает срезать фичу', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-301', title: 'Геймпад плохо ощущается', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-302', title: 'Сюжетный твист не читается', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-303', title: 'Мобильный билд тормозит', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-304', title: 'Художник просит день тишины', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-305', title: 'Аналитика показывает отвал', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-306', title: 'Первый экран не цепляет', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-307', title: 'ИИ ведёт себя странно', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-308', title: 'Сохранения работают медленно', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-309', title: 'Магазинная карточка скучная', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-310', title: 'Сборка падает на слабых устройствах', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-311', title: 'Пользователи требуют настройки', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-312', title: 'Сцена обучения перегружена', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  },
  {
    id: 'extra-dev-event-313', title: 'Звезда жанра заметила проект', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Оплатить полиш', result: 'Тратим бюджет, зато релиз становится качественнее.', effect: { coins: -520, score: 0.18, salesMultiplier: 1.04 } },
      { id: 'b', label: 'Срезать углы', result: 'Сроки лучше, но игроки заметят шероховатости.', effect: { progress: 5, score: -0.12 } },
    ],
  },
  {
    id: 'extra-dev-event-314', title: 'Комьюнити просит режим арены', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Потратить звёзды на промо', result: 'Небольшое промо повышает видимость.', effect: { stars: -2, salesMultiplier: 1.08, score: 0.04 } },
      { id: 'b', label: 'Оставить органику', result: 'Ресурсы целы, но охват ниже.', effect: { stars: 1, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'extra-dev-event-315', title: 'Визуал не бьётся с жанром', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Заказать быстрый тест', result: 'Фидбек помогает поймать проблему раньше.', effect: { coins: -360, rp: 5, score: 0.1 } },
      { id: 'b', label: 'Довериться команде', result: 'Команда экономит время, но риск остаётся.', effect: { progress: 4, score: -0.06 } },
    ],
  },
  {
    id: 'extra-dev-event-316', title: 'Звук даёт вау-эффект', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Углубить механику', result: 'Игра становится богаче, но разработка замедляется.', effect: { progress: -4, score: 0.16, rp: 3 } },
      { id: 'b', label: 'Упростить механику', result: 'Проект быстрее собирается, но глубина ниже.', effect: { progress: 6, score: -0.08 } },
    ],
  },
  {
    id: 'extra-dev-event-317', title: 'Один уровень слишком длинный', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Попросить помощь платформы', result: 'Поддержка платформы даёт витринный шанс.', effect: { stars: -3, salesMultiplier: 1.12 } },
      { id: 'b', label: 'Сохранить звёзды', result: 'Звёзды сохранены, шанс витрины потерян.', effect: { stars: 1, salesMultiplier: 0.94 } },
    ],
  },
  {
    id: 'extra-dev-event-318', title: 'Критики просят ранний билд', tone: 'opportunity',
    body: 'Ситуация не критична, но может изменить реакцию игроков на релиз.',
    choices: [
      { id: 'a', label: 'Вложиться в контент', result: 'Больше контента повышает удержание.', effect: { coins: -700, progress: -3, score: 0.22 } },
      { id: 'b', label: 'Оставить MVP', result: 'MVP быстрее готов, но оценка ниже.', effect: { progress: 7, score: -0.14 } },
    ],
  },
  {
    id: 'extra-dev-event-319', title: 'Система наград не мотивирует', tone: 'neutral',
    body: 'Текущая сборка дала неожиданный сигнал, нужно выбрать направление.',
    choices: [
      { id: 'a', label: 'Разобрать метрики', result: 'Команда получает инсайт для релиза.', effect: { rp: 7, score: 0.08, salesMultiplier: 1.03 } },
      { id: 'b', label: 'Не отвлекаться', result: 'Темп выше, но решение менее точное.', effect: { progress: 3, rp: -2 } },
    ],
  },
  {
    id: 'extra-dev-event-320', title: 'Новый прототип внезапно хорош', tone: 'risk',
    body: 'Команда остановила спринт: решение повлияет на сроки и восприятие игры.',
    choices: [
      { id: 'a', label: 'Сделать рискованный ход', result: 'Проект становится заметнее, но часть аудитории спорит.', effect: { salesMultiplier: 1.14, score: -0.05 } },
      { id: 'b', label: 'Сыграть безопасно', result: 'Игра стабильнее, но без яркого инфоповода.', effect: { score: 0.07, salesMultiplier: 0.98 } },
    ],
  }
];

// high-stakes-events-v73: редкие жёсткие события. В каждом есть минимум один вариант без ресурсной блокировки.
developmentEventScenarios.push(
  {
    id: 'hard-dev-corrupt-build', title: 'Сборка полностью сломалась', tone: 'risk',
    body: 'Последний билд повреждён. Можно откатиться к старому сохранению или собрать всё заново.',
    choices: [
      { id: 'a', label: 'Собрать заново', result: 'Проект почти обнулился, зато критическая ошибка исчезла.', effect: { progress: -120, score: 0.32, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сделать временный фикс', result: 'Разработка продолжилась, но игроки могут заметить компромисс.', effect: { progress: -8, score: -0.18, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'hard-dev-payment-fire', title: 'Срочный счёт от подрядчика', tone: 'neutral',
    body: 'Подрядчик выставил крупный счёт за критичную часть проекта.',
    choices: [
      { id: 'a', label: 'Оплатить полностью', result: 'Кризис закрыт дорогим, но качественным решением.', effect: { coins: -4200, score: 0.28, salesMultiplier: 1.07 } },
      { id: 'b', label: 'Резать объём', result: 'Бюджет спасён, но часть потенциала потеряна.', effect: { progress: -14, score: -0.16, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'hard-dev-engine-collapse', title: 'Движок не выдержал', tone: 'risk',
    body: 'После интеграции новой системы проект начал сыпаться на старте.',
    choices: [
      { id: 'a', label: 'Нанять внешнего эксперта', result: 'Эксперт ускорил спасение проекта, но стоил дорого.', effect: { coins: -6500, progress: 6, score: 0.24 } },
      { id: 'b', label: 'Переписать своими силами', result: 'Команда потеряла много прогресса, но сохранила контроль.', effect: { progress: -80, score: 0.10, rp: 4 } },
    ],
  },
  {
    id: 'hard-dev-platform-cert-fail', title: 'Платформа отклонила билд', tone: 'neutral',
    body: 'Платформенная проверка нашла серьёзные нарушения требований.',
    choices: [
      { id: 'a', label: 'Срочный антикризис', result: 'Дорогая реакция удержала репутацию проекта.', effect: { coins: -3000, stars: -5, salesMultiplier: 1.12, score: 0.18 } },
      { id: 'b', label: 'Тихо отложить', result: 'Команда избежала затрат, но релиз станет заметно слабее.', effect: { progress: -35, score: -0.30, salesMultiplier: 0.90 } },
    ],
  },
  {
    id: 'hard-dev-core-loop-broken', title: 'Основной цикл не работает', tone: 'risk',
    body: 'Плейтест показал: игроки не понимают, зачем возвращаться в игру.',
    choices: [
      { id: 'a', label: 'Собрать заново', result: 'Проект почти обнулился, зато критическая ошибка исчезла.', effect: { progress: -120, score: 0.32, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сделать временный фикс', result: 'Разработка продолжилась, но игроки могут заметить компромисс.', effect: { progress: -8, score: -0.18, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'hard-dev-legal-claim', title: 'Претензия по ассетам', tone: 'neutral',
    body: 'Появился риск, что часть ассетов нельзя использовать в релизе.',
    choices: [
      { id: 'a', label: 'Оплатить полностью', result: 'Кризис закрыт дорогим, но качественным решением.', effect: { coins: -4200, score: 0.28, salesMultiplier: 1.07 } },
      { id: 'b', label: 'Резать объём', result: 'Бюджет спасён, но часть потенциала потеряна.', effect: { progress: -14, score: -0.16, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'hard-dev-hard-balance-reset', title: 'Баланс ушёл в хаос', tone: 'risk',
    body: 'Экономика проекта сломалась после серии быстрых правок.',
    choices: [
      { id: 'a', label: 'Нанять внешнего эксперта', result: 'Эксперт ускорил спасение проекта, но стоил дорого.', effect: { coins: -6500, progress: 6, score: 0.24 } },
      { id: 'b', label: 'Переписать своими силами', result: 'Команда потеряла много прогресса, но сохранила контроль.', effect: { progress: -80, score: 0.10, rp: 4 } },
    ],
  },
  {
    id: 'hard-dev-save-wipe-threat', title: 'Риск потери прогресса', tone: 'neutral',
    body: 'QA нашла баг, который может уничтожать прогресс игроков.',
    choices: [
      { id: 'a', label: 'Срочный антикризис', result: 'Дорогая реакция удержала репутацию проекта.', effect: { coins: -3000, stars: -5, salesMultiplier: 1.12, score: 0.18 } },
      { id: 'b', label: 'Тихо отложить', result: 'Команда избежала затрат, но релиз станет заметно слабее.', effect: { progress: -35, score: -0.30, salesMultiplier: 0.90 } },
    ],
  },
  {
    id: 'hard-dev-viral-backlash', title: 'Демо вызвало бэклаш', tone: 'risk',
    body: 'Ролик собрал просмотры, но комментарии резко негативные.',
    choices: [
      { id: 'a', label: 'Собрать заново', result: 'Проект почти обнулился, зато критическая ошибка исчезла.', effect: { progress: -120, score: 0.32, salesMultiplier: 1.05 } },
      { id: 'b', label: 'Сделать временный фикс', result: 'Разработка продолжилась, но игроки могут заметить компромисс.', effect: { progress: -8, score: -0.18, salesMultiplier: 0.96 } },
    ],
  },
  {
    id: 'hard-dev-senior-bug-hunt', title: 'Нужна дорогая экспертиза', tone: 'neutral',
    body: 'Проблема слишком глубокая для быстрой правки внутри команды.',
    choices: [
      { id: 'a', label: 'Оплатить полностью', result: 'Кризис закрыт дорогим, но качественным решением.', effect: { coins: -4200, score: 0.28, salesMultiplier: 1.07 } },
      { id: 'b', label: 'Резать объём', result: 'Бюджет спасён, но часть потенциала потеряна.', effect: { progress: -14, score: -0.16, salesMultiplier: 0.95 } },
    ],
  },
  {
    id: 'hard-dev-feature-debt', title: 'Долг фич стал критичным', tone: 'risk',
    body: 'Слишком много временных решений мешают собрать стабильную версию.',
    choices: [
      { id: 'a', label: 'Нанять внешнего эксперта', result: 'Эксперт ускорил спасение проекта, но стоил дорого.', effect: { coins: -6500, progress: 6, score: 0.24 } },
      { id: 'b', label: 'Переписать своими силами', result: 'Команда потеряла много прогресса, но сохранила контроль.', effect: { progress: -80, score: 0.10, rp: 4 } },
    ],
  },
  {
    id: 'hard-dev-store-ban-risk', title: 'Риск скрытия в магазине', tone: 'neutral',
    body: 'Магазин предупредил о возможном скрытии страницы до исправлений.',
    choices: [
      { id: 'a', label: 'Срочный антикризис', result: 'Дорогая реакция удержала репутацию проекта.', effect: { coins: -3000, stars: -5, salesMultiplier: 1.12, score: 0.18 } },
      { id: 'b', label: 'Тихо отложить', result: 'Команда избежала затрат, но релиз станет заметно слабее.', effect: { progress: -35, score: -0.30, salesMultiplier: 0.90 } },
    ],
  }
);

export const positiveMarketEvents = [
  { id: 'streamer-boom', title: 'Стримеры ищут инди-хиты', description: 'Короткие яркие игры чаще попадают в рекомендации.', salesMultiplier: 1.18, scoreModifier: 0.18 },
  { id: 'school-holidays', title: 'Каникулы у аудитории', description: 'У игроков больше свободного времени и выше терпимость к экспериментам.', salesMultiplier: 1.14, scoreModifier: 0.12 },
  { id: 'retro-wave', title: 'Ретро-волна', description: 'Маленькие студии получают больше внимания прессы.', salesMultiplier: 1.12, scoreModifier: 0.16 },
  { id: 'ugc-trend', title: 'Бум пользовательского контента', description: 'Игры с сильной идеей быстрее набирают органику.', salesMultiplier: 1.16, scoreModifier: 0.1 },
  { id: 'mobile-festival', title: 'Мобильный фестиваль', description: 'Мобильные релизы обсуждают чаще обычного.', salesMultiplier: 1.13, scoreModifier: 0.08 },
  { id: 'press-week', title: 'Неделя игровых медиа', description: 'Критики активнее ищут новые проекты.', salesMultiplier: 1.08, scoreModifier: 0.22 },
  { id: 'meme-season', title: 'Сезон мемов', description: 'Необычные сочетания жанра и сеттинга получают шанс взлететь.', salesMultiplier: 1.17, scoreModifier: 0.06 },
  { id: 'platform-grants', title: 'Гранты платформ', description: 'Платформы субсидируют видимость свежих игр.', salesMultiplier: 1.2, scoreModifier: 0.05 },
];

export const negativeMarketEvents = [
  { id: 'market-fatigue', title: 'Усталость рынка', description: 'Игроки стали строже к однотипным релизам.', salesMultiplier: 0.78, scoreModifier: -0.25 },
  { id: 'server-drama', title: 'Скандал с серверами', description: 'Аудитория подозрительно относится к новым онлайн-фичам.', salesMultiplier: 0.82, scoreModifier: -0.16 },
  { id: 'ad-prices-up', title: 'Подорожала реклама', description: 'Органический охват просел, запускать игры сложнее.', salesMultiplier: 0.76, scoreModifier: -0.08 },
  { id: 'big-release', title: 'Релиз большого издателя', description: 'Большой релиз забрал внимание игроков и прессы.', salesMultiplier: 0.7, scoreModifier: -0.18 },
  { id: 'review-burnout', title: 'Критики перегружены', description: 'Медиа чаще занижают оценки средним проектам.', salesMultiplier: 0.86, scoreModifier: -0.3 },
  { id: 'wallet-crunch', title: 'Игроки экономят', description: 'Покупают меньше, особенно игры без попадания в тренд.', salesMultiplier: 0.74, scoreModifier: -0.06 },
  { id: 'clone-backlash', title: 'Бэклаш против клонов', description: 'Похожие игры получают жёсткую реакцию сообщества.', salesMultiplier: 0.8, scoreModifier: -0.22 },
  { id: 'platform-bugs', title: 'Сбои платформ', description: 'У платформ проблемы с витринами и рекомендациями.', salesMultiplier: 0.72, scoreModifier: -0.12 },
];
