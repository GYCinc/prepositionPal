

export enum PrepositionCategory {
  LOCATION = 'Location',
  DIRECTION = 'Direction',
  TIME = 'Time',
  MANNER = 'Manner',
  CAUSE = 'Cause',
  POSSESSION = 'Possession',
  ACTION_BY = 'By (Who/What)',
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
}

export interface PrepositionItem {
  preposition: Preposition;
  category: PrepositionCategory;
  description: string;
  exampleSentence: string;
}

export enum GameLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export enum AppMode {
  GAME = 'game',
}

// Data structure for a question as it is played in the game
export interface Question {
  id?: string; // Optional Firestore document ID
  sentence: string;
  correctAnswer: Preposition;
  options: Preposition[];
  imageId?: string; // ID to look up the image from the non-reactive store
}

// Data structure for a question as it is stored in Firestore
export interface FirestoreQuestion {
  id?: string;
  level: GameLevel;
  category: PrepositionCategory;
  sentence: string;
  correctAnswer: Preposition;
  imageUrl: string;
  createdAt: any; // Firestore Timestamp
}