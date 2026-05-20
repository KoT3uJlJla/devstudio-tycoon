export type PressCommentTone = 'furious' | 'negative' | 'mixed' | 'positive' | 'praise';

export type PressComment = {
  minScore: number;
  maxScore: number;
  tone: PressCommentTone;
  text: string;
};

export const criticOutlets = [
  "Пиксель Сегодня",
  "Инди Радар",
  "Игровая Неделя",
  "Byte Tribune",
  "Joystick Journal",
  "Le Monde Pixel",
  "Revista Ludica",
  "Tokyo Playlog",
  "Berlin Spielblatt",
  "Nordic Gamepost",
  "ИгроМаяк",
  "LevelUp Gazette",
  "La Manette Libre",
  "Pixel Herald",
  "Ludus Review",
  "Press Start Daily",
  "Киберспорт Кофе",
  "Arcade Observer",
  "DevCritique",
  "GameKurier",
  "Playtest Weekly",
  "Мир Билдов",
  "The Save Point",
  "Retro Futuro",
  "Bits & Bosses",
  "El Pixelero",
  "Joystick Hoje",
  "Сцена Инди",
  "Patch Notes Review",
  "Questione Giochi",
  "Pixelna Pravda",
  "GameScope Korea",
  "Ludoteca Digital",
  "D-Pad Digest",
  "Виртуальный Обзор",
  "Checkpoint Magazine",
  "Neon Arcade",
  "Кнопка А",
  "Mana & Metrics",
  "Gamelogía",
  "Ctrl Alt Critic",
  "Polski Pad",
  "Nordlicht Spiele",
  "Pixel & Papier",
  "RPG Watchtower",
  "Arcade Afrique",
  "Ludo Presse",
  "GameTea Review",
  "Press X Times",
  "Звёздный Геймпад"
] as const;

export const pressComments: PressComment[] = [
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Проект выглядит так, будто релизный поезд ушёл без разработчиков."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Тут слишком много острых углов и почти нет причин терпеть боль."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Игра борется с игроком чаще, чем развлекает его."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Даже хорошие идеи тонут под слоями сырости и хаоса."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Это не смелый эксперимент, а тревожный сигнал для продюсера."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Сборка разваливается на глазах и просит ещё месяц полировки."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Мы видим амбицию, но финальный билд почти не держится вместе."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Баги здесь звучат громче, чем любая авторская задумка."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Релиз ощущается преждевременным и раздражающе неготовым."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Игровой цикл ломается раньше, чем успевает стать привычкой."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "В этой версии слишком мало удовольствия и слишком много компромиссов."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Проекту нужна не рекламная кампания, а спасательная операция."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Каждый сильный момент сразу перечёркивается новой проблемой."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Играть можно, но желание закрыть окно появляется быстрее."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Это тот случай, когда патч первого дня нужен вчера."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Сложно хвалить игру, которая спорит с базовым удобством."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Идея заметна, но исполнение откровенно не выдерживает давления."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Релиз похож на черновик, случайно отправленный в магазин."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Баланс, интерфейс и темп будто не встречались друг с другом."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Мы злились чаще, чем удивлялись, и это плохой знак."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Вместо драмы получился технический пожар в декорациях."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Проект не провален полностью, но близко подошёл к краю."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "У игры есть сердце, но оно стучит под грудой ошибок."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Даже терпеливые фанаты жанра будут ругаться в голос."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Релизу остро не хватает ясности, стабильности и уважения к игроку."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Самые интересные решения спрятаны за стеной недоработок."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Игра постоянно обещает зацепить, но каждый раз срывается."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Техническое состояние мешает оценить задумку по достоинству."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Это болезненный релиз, который хочется отправить обратно в разработку."
  },
  {
    "minScore": 0.1,
    "maxScore": 3,
    "tone": "furious",
    "text": "Гнев комьюнити после такого старта будет трудно назвать несправедливым."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Есть отдельные удачные моменты, но общий результат слишком неровный."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Проект старается быть большим, однако спотыкается о базовые вещи."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Не катастрофа, но и не релиз, который хочется советовать."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Игра иногда оживает, а затем снова теряет темп и фокус."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Задумка симпатичная, исполнение пока заметно отстаёт."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Поклонники жанра найдут пару причин задержаться, остальные быстро уйдут."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Билду нужна полировка, потому что хорошие сцены тонут в шероховатостях."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Слишком много мелких проблем складываются в усталость."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "В игре есть потенциал, но сейчас он больше обещание, чем факт."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Отдельные системы работают, но вместе они спорят друг с другом."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Релиз можно пройти мимо, не испытывая сильной потери."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Сырость уже не критическая, но всё ещё слишком заметная."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Хорошие идеи требуют терпения, а игра не всегда его заслуживает."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Проект не лишён харизмы, но ей трудно пробиться через шум."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Это приемлемый прототип, которому рано на большую сцену."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Местами интересно, местами скучно, местами просто странно."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Игра держится на нескольких находках, но фундамент пока слабый."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Видно, что команда старалась, однако релизу не хватает уверенности."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Проблемы баланса мешают насладиться даже сильными эпизодами."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Проект вызывает осторожный интерес и столько же осторожных сомнений."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Пока это скорее заметка в блокноте, чем законченная история."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Игровой ритм часто провисает и тянет оценку вниз."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Механики знакомые, но не всегда собраны в убедительный цикл."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Слишком мало моментов, ради которых хочется возвращаться."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Игра не злит, но и не убеждает открыть следующий уровень."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Патчи могут помочь, но первый контакт выходит прохладным."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Команда поймала идею, но не поймала стабильный темп."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Проект держится на энтузиазме, а не на качественной сборке."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Релиз оставляет чувство недосказанности и лёгкого разочарования."
  },
  {
    "minScore": 3.1,
    "maxScore": 4.9,
    "tone": "negative",
    "text": "Нужен ещё один сильный проход по UX, балансу и темпу."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Нормальный релиз с ясной идеей и заметными ограничениями."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Игра делает своё дело, хотя редко выходит за рамки ожидаемого."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Это уверенный середняк, который понравится терпеливой аудитории."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Проект не хватает звёзд с неба, но предлагает честный игровой цикл."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "В лучших моментах игра показывает характер, в слабых — бюджет."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Релиз достаточно собранный, чтобы провести в нём вечер."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Не хит, но приятная работа с несколькими удачными решениями."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Проект балансирует между аккуратностью и нехваткой смелости."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Команда сделала понятную игру, которой не хватает яркого крючка."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Играть приятно, если не ждать революции в жанре."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Оценка держится на стабильности, а не на вау-эффекте."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Есть шероховатости, но общий ритм уже работает."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Игра не удивляет, зато редко откровенно раздражает."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Это добротный релиз для своей ниши, без громких побед."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Некоторые решения спорные, но фундамент достаточно крепкий."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Проект честно развлекает и не притворяется большим блокбастером."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Нам не хватило риска, но базовое качество на месте."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Игра уверенно проходит проверку первым вечером."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Системы понятны, прогрессия читается, эмоций могло быть больше."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Это спокойный релиз, который не стыдно поставить в библиотеку."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Команда нашла рабочий тон, хотя не всегда удерживает темп."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Пресса будет спорить, но аудитория ниши найдёт свои плюсы."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "В игре достаточно достоинств, чтобы закрыть глаза на часть проблем."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Хорошая основа, которой не хватает фирменного удара."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Проект показывает рост студии и оставляет осторожный оптимизм."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Местами видно будущее серии, местами — границы текущего бюджета."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Релиз не шумный, зато достаточно аккуратный и играбельный."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Игровой цикл цепляет не сразу, но со временем раскрывается."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Это ровный результат: без провала, без триумфа, с потенциалом."
  },
  {
    "minScore": 5,
    "maxScore": 6.4,
    "tone": "mixed",
    "text": "Команда выпустила рабочую игру, которой нужен более сильный голос."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Сильный релиз с уверенным темпом и узнаваемым характером."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Игра быстро объясняет, зачем в неё возвращаться."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Здесь есть стиль, ритм и редкое чувство законченности."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Команда заметно выросла: проект звучит гораздо увереннее прежнего."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Несколько шероховатостей не мешают получать удовольствие."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Это тот случай, когда идеи и исполнение наконец встретились."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Релиз цепляет с первых минут и держит интерес до финала."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Игра не идеальна, но её сильные стороны легко запоминаются."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Перед нами яркая работа, которая понимает свою аудиторию."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Проект уверенно занимает место в жанре и не теряется."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Игровой цикл собран плотно, награды приходят вовремя."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Команда нашла хороший баланс между доступностью и глубиной."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Этот релиз хочется обсуждать, а не просто закрыть после обзора."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Игра умеет удивлять без лишнего шума и надрыва."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Почти каждый элемент работает на общее впечатление."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "У проекта есть собственный почерк и крепкая производственная дисциплина."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Это качественный шаг вперёд для студии."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Релиз демонстрирует вкус, контроль и понимание жанра."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Некоторые идеи могли быть смелее, но результат всё равно радует."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Аудитория получит именно то, за чем пришла, и немного больше."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Игра оставляет приятное послевкусие и желание увидеть продолжение."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Системы хорошо дружат друг с другом и поддерживают темп."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Это релиз, который способен собрать лояльное комьюнити."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Команда попала в настроение рынка и не забыла про качество."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Проект выглядит дороже и увереннее, чем ожидалось."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "В нём много маленьких решений, которые складываются в сильный опыт."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Игра почти без лишнего веса: темп держится, петля работает."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Хорошая постановка, понятный фокус и честная реиграбельность."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Релиз уверенно доказывает, что у студии есть свой голос."
  },
  {
    "minScore": 6.5,
    "maxScore": 8.9,
    "tone": "positive",
    "text": "Это одна из тех игр, которые приятно рекомендовать друзьям."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Блестящий релиз: уверенный, щедрый и удивительно цельный."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Игра выглядит как момент, когда студия вышла на новый уровень."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Редкое сочетание стиля, глубины и почти безупречного темпа."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Этот проект будут цитировать как пример умного инди-дизайна."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Релиз ощущается роскошно: каждая система работает на восторг."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Перед нами хит, которому не нужно долго объяснять свою силу."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Игра сияет идеями и превращает их в чистое удовольствие."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Это не просто хороший релиз, а заявка на культовый статус."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Команда попала в десятку и по форме, и по содержанию."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Проект играет мускулами, но не забывает про душу."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Каждая минута здесь подкрепляет ощущение большого события."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Игра уверенно держит планку премиального инди-хита."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Такой релиз меняет ожидания от следующего проекта студии."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Мы редко видим настолько собранный и харизматичный финальный билд."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Проект почти мгновенно превращает скепсис в восторг."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Это игра, о которой хочется писать длинные тексты и спорить неделями."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Механики, темп и атмосфера соединяются в великолепный сплав."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Релиз звучит как громкая победа команды и жанра."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Здесь есть магия, которую невозможно свести к таблице параметров."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Игра оставляет ощущение праздника и высокой производственной культуры."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Это золотой стандарт для маленькой студии с большими амбициями."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Проект сияет редкой уверенностью и не боится быть запоминающимся."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Каждый спорный риск здесь окупается эмоцией и стилем."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Игра заслуживает места в списках лучших релизов сезона."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Команда создала не просто продукт, а настоящий повод для хайпа."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Релиз выглядит дорого, звучит уверенно и играется безотказно."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Мы получили почти идеальный пример жанровой концентрации."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Проект превращает ожидание в восторг и держит его до титров."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Это победный круг для студии: смело, ярко и очень убедительно."
  },
  {
    "minScore": 9,
    "maxScore": 10,
    "tone": "praise",
    "text": "Игровая пресса будет помнить этот релиз дольше обычного новостного цикла."
  }
];

export function getPressComment(score: number) {
  const pool = pressComments.filter((item) => score >= item.minScore && score <= item.maxScore);
  const safePool = pool.length ? pool : pressComments;
  return safePool[Math.floor(Math.random() * safePool.length)]?.text ?? 'Редакция готовит полный обзор после релиза.';
}
