export type Screen = 'studio' | 'develop' | 'hire' | 'research' | 'shop' | 'menu';
export type GenreId = string;
export type ThemeId = string;
export type PlatformId = string;
export type PhaseId = 'pre' | 'production' | 'post';
export type DailyTaskId = 'release' | 'work' | 'research' | 'income';
export type ComboQuality = 'Great' | 'Good' | 'Neutral' | 'Bad';

export type FocusTriple = [number, number, number];
export type Focus = Record<PhaseId, FocusTriple>;

export type Genre = {
  id: GenreId;
  name: string;
  emoji: string;
  ideal: Focus;
  difficulty: number;
  isBase?: boolean;
};

export type Theme = {
  id: ThemeId;
  name: string;
  emoji: string;
  focusBias: Partial<Record<PhaseId, FocusTriple>>;
  isBase?: boolean;
};

export type Platform = {
  id: PlatformId;
  name: string;
  emoji: string;
  userbase: number;
  techComplexity: number;
  unlockLevel: number;
};


export type DevEventEffect = {
  coins?: number;
  progress?: number;
  score?: number;
  salesMultiplier?: number;
  rp?: number;
  stars?: number;
};

export type DevEventChoice = {
  id: 'a' | 'b';
  label: string;
  result: string;
  effect: DevEventEffect;
};

export type DevEventScenario = {
  id: string;
  title: string;
  body: string;
  tone: 'neutral' | 'risk' | 'opportunity';
  choices: [DevEventChoice, DevEventChoice];
};

export type ScheduledDevEvent = {
  instanceId: string;
  scenarioId: string;
  progressAt: number;
  triggered?: boolean;
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
  platform: PlatformId | null;
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
  devEventId?: string;
  devEventText?: string;
  devEventTone?: 'normal' | 'danger';
  devEventAt?: number;
  devEventQueue?: ScheduledDevEvent[];
  pendingDevEvent?: PendingDevEvent | null;
  devDecisionScoreBonus?: number;
  devDecisionSalesMultiplier?: number;
  devDecisionLog?: string[];
};

export type ScoreBreakdownItem = {
  label: string;
  value: number;
  kind: 'base' | 'bonus' | 'penalty' | 'random';
};

export type ReleaseResult = {
  projectName: string;
  score: number;
  critics: Array<{ name: string; score: number; quote: string }>;
  criticAverage: number;
  scoreBreakdown: ScoreBreakdownItem[];
  sales: number;
  passivePerDay: number;
  lifetimeDays: number;
  rp: number;
  stars?: number;
  bonusRewards?: string[];
  promotionBoost?: number;
  qualityLabel: string;
  combo: ComboQuality;
  createdAt: number;
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

export type Employee = {
  id: string;
  role: 'Программист' | 'Дизайнер' | 'Художник' | 'Маркетолог' | 'Продюсер' | 'Аналитик';
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

export type LedgerEntry = {
  id: string;
  day: number;
  title: string;
  amount: number;
  kind: 'income' | 'expense' | 'event';
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
  screen: Screen;
  onboardingDone: boolean;
  tutorialDone: boolean;
  tutorialStep: number;
  tutorialRewardClaimed: boolean;
  lastSavedAt: number;
  lastGameTickAt: number;
  gameDay: number;
  lastOfflineReward: number;
  selectedProject: Project | null;
  latestRelease: ReleaseResult | null;
  activeGames: ReleasedGame[];
  releaseHistory: Array<{ title: string; genre: GenreId; theme: ThemeId; score: number; day: number }>;
  employees: Employee[];
  hiredEmployeeIds: string[];
  unlockedResearchIds: string[];
  unlockedGenreIds: GenreId[];
  unlockedThemeIds: ThemeId[];
  dailyClaimedAt: string | null;
  dailyStatsDate: string;
  dailyGamesReleased: number;
  dailyWorkTaps: number;
  dailyResearchUnlocked: number;
  dailyPassiveIncome: number;
  dailyTaskClaims: Record<string, boolean>;
  studioGoalClaims: Record<string, boolean>;
  weeklyExpenseTotal: number;
  unpaidSinceMonth: number | null;
  closureWarningMonth: number | null;
  ratingResetCount: number;
  activeMarketEvents: MarketEvent[];
  marketMustRecover: boolean;
  newsFeed: NewsEntry[];
  audience: AudienceState;
  lastLedger: LedgerEntry[];
  offerSeen: boolean;
};