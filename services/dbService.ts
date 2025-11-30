import { UserProgress, QuestionResult, GameLevel, Preposition, CachedQuestion } from '../types';

export interface VideoCacheItem {
  id: string; // prompt + aspectRatio
  prompt: string;
  aspectRatio: string;
  blob: Blob;
  timestamp: number;
}

export interface AudioCacheItem {
  id: string; // text + voice
  text: string;
  voice: string;
  base64Data: string;
  timestamp: number;
}

const DB_NAME = 'PrepositionPalContentDB';
const DB_VERSION = 3;
const USER_PROGRESS_KEY = 'user_main_progress';

const INITIAL_PROGRESS: UserProgress = {
  totalXP: 0,
  level: 1,
  questionsAnswered: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayed: Date.now(),
  levelStats: {},
  categoryStats: {},
};

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('audio')) {
        db.createObjectStore('audio', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('user_progress')) {
        db.createObjectStore('user_progress', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('question_history')) {
        db.createObjectStore('question_history', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('question_cache')) {
        const qStore = db.createObjectStore('question_cache', { keyPath: 'id' });
        qStore.createIndex('level_preposition', ['level', 'preposition'], { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (_event) => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
};

// --- Question Caching ---

export const cacheGeneratedQuestion = async (question: CachedQuestion) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['question_cache'], 'readwrite');
    const store = transaction.objectStore('question_cache');
    const request = store.put(question);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const findCachedQuestion = async (
  level: GameLevel,
  preposition: Preposition,
  excludeIds: string[]
): Promise<CachedQuestion | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['question_cache'], 'readonly');
    const store = transaction.objectStore('question_cache');
    const index = store.index('level_preposition');
    const range = IDBKeyRange.only([level, preposition]);

    const request = index.openCursor(range);
    const candidates: CachedQuestion[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const q = cursor.value as CachedQuestion;
        if (!excludeIds.includes(q.id)) {
          candidates.push(q);
        }
        cursor.continue();
      } else {
        if (candidates.length > 0) {
          const randomIdx = Math.floor(Math.random() * candidates.length);
          resolve(candidates[randomIdx]);
        } else {
          resolve(null);
        }
      }
    };
    request.onerror = () => reject(request.error);
  });
};

// --- Media Caching ---

export const cacheVideo = async (prompt: string, aspectRatio: string, blob: Blob) => {
  const db = await initDB();
  const id = `${prompt}_${aspectRatio}`;
  const item: VideoCacheItem = {
    id,
    prompt,
    aspectRatio,
    blob,
    timestamp: Date.now(),
  };

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['videos'], 'readwrite');
    const store = transaction.objectStore('videos');
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getCachedVideo = async (prompt: string, aspectRatio: string): Promise<Blob | null> => {
  const db = await initDB();
  const id = `${prompt}_${aspectRatio}`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['videos'], 'readonly');
    const store = transaction.objectStore('videos');
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result as VideoCacheItem | undefined;
      resolve(result ? result.blob : null);
    };
    request.onerror = () => reject(request.error);
  });
};

export const cacheAudio = async (text: string, voice: string, base64Data: string) => {
  const db = await initDB();
  const id = `${text}_${voice}`;
  const item: AudioCacheItem = {
    id,
    text,
    voice,
    base64Data,
    timestamp: Date.now(),
  };

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['audio'], 'readwrite');
    const store = transaction.objectStore('audio');
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getCachedAudio = async (text: string, voice: string): Promise<string | null> => {
  const db = await initDB();
  const id = `${text}_${voice}`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['audio'], 'readonly');
    const store = transaction.objectStore('audio');
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result as AudioCacheItem | undefined;
      resolve(result ? result.base64Data : null);
    };
    request.onerror = () => reject(request.error);
  });
};

// --- User Progress Functions ---

export const getUserProgress = async (): Promise<UserProgress> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['user_progress'], 'readonly');
    const store = transaction.objectStore('user_progress');
    const request = store.get(USER_PROGRESS_KEY);

    request.onsuccess = () => {
      resolve(request.result?.data || INITIAL_PROGRESS);
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveQuestionResult = async (result: QuestionResult): Promise<void> => {
  const db = await initDB();
  const progress = await getUserProgress();

  const newProgress = { ...progress };
  newProgress.lastPlayed = Date.now();
  newProgress.questionsAnswered += 1;
  newProgress.totalXP += result.xpEarned;

  // Level Calculation: Simple sqrt curve
  newProgress.level = Math.floor(Math.sqrt(newProgress.totalXP / 50)) + 1;

  if (result.isCorrect) {
    newProgress.correctAnswers += 1;
    newProgress.currentStreak += 1;
    if (newProgress.currentStreak > newProgress.bestStreak) {
      newProgress.bestStreak = newProgress.currentStreak;
    }
  } else {
    newProgress.currentStreak = 0;
  }

  // Update Level Stats
  const levelKey = result.gameLevel;
  if (!newProgress.levelStats[levelKey]) {
    newProgress.levelStats[levelKey] = { correct: 0, total: 0 };
  }
  newProgress.levelStats[levelKey].total += 1;
  if (result.isCorrect) {
    newProgress.levelStats[levelKey].correct += 1;
  }

  // Update Category Stats
  if (result.category) {
    const catKey = result.category;
    if (!newProgress.categoryStats[catKey]) {
      newProgress.categoryStats[catKey] = { correct: 0, total: 0 };
    }
    newProgress.categoryStats[catKey].total += 1;
    if (result.isCorrect) {
      newProgress.categoryStats[catKey].correct += 1;
    }
  }

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['user_progress'], 'readwrite');
    const store = transaction.objectStore('user_progress');
    const request = store.put({ id: USER_PROGRESS_KEY, data: newProgress });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['question_history'], 'readwrite');
    const store = transaction.objectStore('question_history');
    const request = store.add({ ...result, timestamp: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
