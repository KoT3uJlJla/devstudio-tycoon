export type PhaseId = 'pre' | 'production' | 'post';
export type FocusTriple = [number, number, number];
export type Focus = Record<PhaseId, FocusTriple>;

export type GenreId =
  | 'arcade'
  | 'platformer'
  | 'rpg'
  | 'strategy'
  | 'puzzle'
  | 'horror'
  | 'racing'
  | 'fighting'
  | 'simulator'
  | 'visual-novel'
  | 'roguelike'
  | 'deckbuilder'
  | 'survival'
  | 'metroidvania'
  | 'sandbox'
  | 'battle-royale'
  | 'rhythm'
  | 'party'
  | 'idle'
  | 'tower-defense'
  | 'moba-lite'
  | 'city-builder'
  | 'detective-game'
  | 'sports-manager'
  | 'social-sim';

export type ThemeId =
  | 'space'
  | 'fantasy'
  | 'cyberpunk'
  | 'school'
  | 'zombie'
  | 'detective'
  | 'medieval'
  | 'sport'
  | 'postapoc'
  | 'military'
  | 'mythology'
  | 'underwater'
  | 'pirates'
  | 'kaiju'
  | 'dreams'
  | 'office'
  | 'food'
  | 'music'
  | 'ai-revolt'
  | 'time-travel';

export type PlatformId = 'micro_pc' | 'pocket_play' | 'game_station' | 'smart_game';

export type ComboQuality = 'Great' | 'Good' | 'Neutral' | 'Bad';

export type Genre = {
  id: GenreId;
  name: string;
  emoji: string;
  isBase?: boolean;
  difficulty: number;
  ideal: Focus;
};

export type Theme = {
  id: ThemeId;
  name: string;
  emoji: string;
  isBase?: boolean;
  focusBias: Focus;
};

export type Platform = {
  id: PlatformId;
  name: string;
  emoji: string;
  userbase: number;
  techComplexity: number;
  unlockLevel: number;
};

export type Employee = {
  id: string;
  role: 'Программист' | 'Художник' | 'Маркетолог' | 'Дизайнер' | 'Продюсер' | 'Аналитик';
  name: string;
  level: number;
  cost: number;
  speedBoost: number;
  incomeBoost: number;
  scienceBoost?: number;
  scoreBoost?: number;
  specialization: string;
};

export type ResearchNode = {
  id: string;
  title: string;
  description: string;
  cost: number;
  effect: string;
  requires?: string;
};

export type DevEventChoice = {
  id: 'a' | 'b';
  label: string;
  result: string;
  effect: {
    coins?: number;
    progress?: number;
    score?: number;
    salesMultiplier?: number;
    rp?: number;
    stars?: number;
  };
};

export type DevEventScenario = {
  id: string;
  title: string;
  body: string;
  tone: 'risk' | 'opportunity' | 'neutral';
  choices: DevEventChoice[];
};

export type ScheduledDevEvent = {
  instanceId: string;
  scenarioId: string;
  progressAt: number;
  triggered: boolean;
};

export type PendingDevEvent = {
  instanceId: string;
  scenarioId: string;
  triggeredAtProgress: number;
};

export type Project = {
  id: string;
  name: string;
  genre: GenreId | null;
  theme: ThemeId | null;
  platform: PlatformId;
  focus: Focus;
  progress: number;
  durationSeconds: number;
  devCost: number;
  techComplexity: number;
  startedAt: number | null;
  isTutorial: boolean;
  promotionUsed?: boolean;
  promotionBoost?: number;
  devGlitchTriggered?: boolean;
  devEventQueue?: ScheduledDevEvent[];
  pendingDevEvent?: PendingDevEvent | null;
  devDecisionScoreBonus?: number;
  devDecisionSalesMultiplier?: number;
  devDecisionLog?: string[];
  devEventId?: string;
  devEventText?: string;
  devEventTone?: 'normal' | 'danger';
  devEventAt?: number;
};

export type ReleasedGame = {
  id: string;
  title: string;
  genre: GenreId;
  theme: ThemeId;
  score: number;
  popularity: number;
  baseDailyIncome: number;
  lifeDaysRemaining: number;
  maxLifeDays: number;
  totalEarned: number;
  lastEvent: string;
  createdGameDay: number;
};

export type ScoreBreakdownItem = {
  label: string;
  value: number;
  kind: 'base' | 'bonus' | 'penalty' | 'random';
};

export type ReleaseResult = {
  projectName: string;
  score: number;
  critics: { name: string; score: number; quote: string }[];
  criticAverage: number;
  scoreBreakdown: ScoreBreakdownItem[];
  sales: number;
  passivePerDay: number;
  lifetimeDays: number;
  rp: number;
  stars: number;
  bonusRewards: string[];
  promotionBoost: number;
  qualityLabel: string;
  combo: ComboQuality;
  createdAt: number;
};

export type MarketEvent = {
  id: string;
  title: string;
  description: string;
  tone: 'positive' | 'negative';
  daysRemaining: number;
  salesMultiplier: number;
  scoreModifier: number;
  startedDay: number;
};

export type NewsEntry = {
  id: string;
  day: number;
  title: string;
  body: string;
  tone: 'positive' | 'negative' | 'neutral';
};

export type AudienceState = {
  mood: number;
  desiredGenreId: GenreId;
  desiredThemeId: ThemeId;
  desiredPlatformId: PlatformId;
  vibe: string;
  lastUpdatedMonth: number;
  revealedUntilMonth: number;
  learnedFrom: string[];
};

export type GameState = {
  coins: number;
  rp: number;
  stars: number;
  studioName: string;
  qualifiedReferrals: number;
  qualifiedSecondLevelReferrals: number;
  referralMilestoneClaims: Record<string, boolean>;
  level: number;
  studioXp: number;
  gamesReleased: number;
  bestScore: number;
  screen: 'home' | 'develop' | 'team' | 'research' | 'stats';
  tutorialStep: number;
  tutorialDone: boolean;
  tutorialRewardClaimed: boolean;
  selectedProject: Project | null;
  latestRelease: ReleaseResult | null;
  activeGames: ReleasedGame[];
  releaseHistory: { title: string; genre: GenreId; theme: ThemeId; score: number; day: number }[];
  employees: Employee[];
  hiredEmployeeIds: string[];
  unlockedResearchIds: string[];
  unlockedGenreIds: GenreId[];
  unlockedThemeIds: ThemeId[];
  dailyWorkTaps: number;
  dailyGamesReleased: number;
  dailyTaskClaims: Record<string, boolean>;
  dailyPassiveIncome: number;
  weeklyExpenseTotal: number;
  unpaidSinceMonth: number | null;
  closureWarningMonth: number | null;
  ratingResetCount: number;
  activeMarketEvents: MarketEvent[];
  marketMustRecover: boolean;
  newsFeed: NewsEntry[];
  gameDay: number;
  audience: AudienceState;
  lastLedger: LedgerEntry[];
  lastSavedAt: number;
  lastGameTickAt: number;
};

export type LedgerEntry = {
  id: string;
  day: number;
  title: string;
  amount: number;
  kind: 'income' | 'expense' | 'event';
};
