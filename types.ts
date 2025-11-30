export enum PrepositionCategory {
  LOCATION = 'Location',
  DIRECTION = 'Direction',
  TIME = 'Time',
  MANNER = 'Manner',
  CAUSE = 'Cause',
  POSSESSION = 'Possession',
  AGENT = 'Agent',
  FREQUENCY = 'Frequency',
  INSTRUMENT = 'Instrument',
  PURPOSE = 'Purpose',
}

export enum Preposition {
  IN = 'in',
  INTO = 'into',
  TO = 'to',
  TOWARDS = 'towards',
  THROUGH = 'through',
  OUT_OF = 'out of',
  FROM = 'from',
  AWAY_FROM = 'away from',
  ON = 'on',
  AT = 'at',
  AGAINST = 'against',
  NEAR = 'near',
  BETWEEN = 'between',
  AMONG = 'among',
  UNDER = 'under',
  BELOW = 'below',
  BY = 'by',
  AROUND = 'around',
  PAST = 'past',
  ACROSS = 'across',
  ALONG = 'along',
  UP = 'up',
  ABOVE = 'above',
  OVER = 'over',
  AFTER = 'after',
  WITHIN = 'within',
  INSIDE = 'inside',
  OFF = 'off',
  BEHIND = 'behind',
  BEFORE = 'before',
  BENEATH = 'beneath',
  BESIDE = 'beside',
  WITH = 'with',
  BEYOND = 'beyond',
  UPON = 'upon',
  PER = 'per',
  FOR = 'for',
}

export interface PrepositionItem {
  preposition: Preposition;
  category: PrepositionCategory;
  description: string;
  exampleSentence: string;
}

// The 10 specific levels requested
export enum GameLevel {
  Level_1 = 'A1',
  Level_2 = 'A1.5',
  Level_3 = 'A2',
  Level_4 = 'A2.5',
  Level_5 = 'B1',
  Level_6 = 'B1.5',
  Level_7 = 'B2',
  Level_8 = 'B2.5',
  Level_9 = 'C1',
  Level_10 = 'C1.5',
}

export enum AppMode {
  GAME = 'game',
}

// Data structure for a question as it is played in the game
export interface Question {
  id?: string;
  sentence: string;
  correctAnswer: Preposition;
  options: Preposition[];
  imageId?: string; // ID to look up the image from the non-reactive store
  videoUrl?: string; // Blob URL for the generated video (if this is a video round)
}

// Data structure for Firestore
export interface FirestoreQuestion {
  id?: string;
  level: GameLevel;
  category: PrepositionCategory | null;
  sentence: string;
  correctAnswer: Preposition;
  options: Preposition[];
  imageId?: string;
  createdAt?: any;
}

// Cached question structure for IndexedDB
export interface CachedQuestion {
  id: string;
  level: GameLevel;
  preposition: Preposition;
  sentence: string;
  options: Preposition[];
  visualPrompt: string; // We store the prompt so we can re-fetch/regenerate the image if needed
  timestamp: number;
}

// --- Persistent User Progress ---

export interface LevelStats {
  correct: number;
  total: number;
}

export interface CategoryStats {
  correct: number;
  total: number;
}

export interface UserProgress {
  totalXP: number;
  level: number; // Derived from XP (e.g. sqrt(XP))
  questionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayed: number; // Timestamp
  levelStats: Record<string, LevelStats>;
  categoryStats: Record<string, CategoryStats>;
}

export interface QuestionResult {
  gameLevel: GameLevel;
  category: PrepositionCategory | null;
  isCorrect: boolean;
  xpEarned: number;
}
