import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  limit,
  documentId,
  Firestore,
  CollectionReference,
} from 'firebase/firestore';
import { GameLevel, PrepositionCategory, FirestoreQuestion } from '../types';

// Load configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

let db: Firestore | null = null;
let questionsCollection: CollectionReference | null = null;

// Initialize Firebase only if config is valid (simple check)
// We check if API Key is not the placeholder or empty
const isConfigValid = firebaseConfig.apiKey !== 'YOUR_API_KEY' && firebaseConfig.apiKey !== '';

if (isConfigValid) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    questionsCollection = collection(db, 'questions');
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.warn(
    'Firebase configuration missing or invalid. Falling back to local/Gemini only mode.'
  );
}

export const addQuestionToCache = async (
  question: Omit<FirestoreQuestion, 'createdAt' | 'id'>
): Promise<void> => {
  if (!questionsCollection) {
    return Promise.resolve();
  }

  try {
    await addDoc(questionsCollection, {
      ...question,
      createdAt: serverTimestamp(),
    });
    console.log('Question added to Firestore cache.');
  } catch (error: any) {
    console.error('Error adding question to Firestore:', error.code, error.message);
  }
};

export const getQuestionFromCache = async (
  level: GameLevel,
  category: PrepositionCategory | null,
  excludeIds: string[]
): Promise<FirestoreQuestion | null> => {
  if (!questionsCollection) {
    return Promise.resolve(null);
  }

  try {
    const constraints = [where('level', '==', level)];

    if (category) {
      constraints.push(where('category', '==', category));
    }

    // Firestore's 'not-in' query is limited to 10 items.
    // If we have more than 10 asked questions, we fetch a larger batch and filter client-side.
    const batchSize = excludeIds.length > 9 ? 30 : 10;

    if (excludeIds.length > 0 && excludeIds.length < 10) {
      constraints.push(where(documentId(), 'not-in', excludeIds));
    }

    const q = query(questionsCollection, ...constraints, limit(batchSize));

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    let docs = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as FirestoreQuestion
    );

    // Client-side filter if 'not-in' could not be used
    if (excludeIds.length >= 10) {
      docs = docs.filter((doc) => !excludeIds.includes(doc.id!));
    }

    if (docs.length === 0) {
      return null;
    }

    // Return a random document from the fetched ones
    const randomIndex = Math.floor(Math.random() * docs.length);
    return docs[randomIndex];
  } catch (error: any) {
    console.error('Error fetching question from Firestore:', error.code, error.message);
    return null;
  }
};
