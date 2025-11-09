// FIX: Comment out Firebase imports because the related functionality is disabled
// and the imports are causing compilation errors, likely due to a version mismatch.
/*
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
} from 'firebase/firestore';
*/
import { GameLevel, PrepositionCategory, FirestoreQuestion, Question } from '../types';

// --- IMPORTANT ---
// The current Firebase configuration is using placeholder values.
// This is causing a "circular structure to JSON" error deep inside the
// Firebase SDK when it tries to operate without a valid project connection.
// To resolve the crash, Firebase functionality is being temporarily disabled.
//
// TO RE-ENABLE:
// 1. Replace this with your own Firebase project configuration.
// 2. You can find this in your Firebase project settings.
// 3. Uncomment the initialization code below.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// --- Firebase functionality is currently disabled due to invalid configuration ---
// Uncomment the following lines after providing a valid firebaseConfig above.
/*
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const questionsCollection = collection(db, 'questions');
*/

// The function is now a no-op to prevent crashes.
export const addQuestionToCache = async (question: Omit<FirestoreQuestion, 'createdAt' | 'id'>): Promise<void> => {
  console.warn('Firebase is not configured. Skipping question cache.');
  return Promise.resolve();
  /* --- Original implementation ---
  try {
    await addDoc(questionsCollection, {
      ...question,
      createdAt: serverTimestamp(),
    });
    console.log('Question added to Firestore cache.');
  } catch (error: any) {
    console.error('Error adding question to Firestore:', error.code, error.message);
  }
  */
};

// The function now always returns null to prevent crashes, forcing Gemini generation.
export const getQuestionFromCache = async (
  level: GameLevel,
  category: PrepositionCategory | null,
  excludeIds: string[]
): Promise<FirestoreQuestion | null> => {
  console.warn('Firebase is not configured. Skipping question cache check.');
  return Promise.resolve(null);
  /* --- Original implementation ---
  try {
    const constraints = [
        where('level', '==', level)
    ];

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
    
    let docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreQuestion));

    // Client-side filter if 'not-in' could not be used
    if (excludeIds.length >= 10) {
        docs = docs.filter(doc => !excludeIds.includes(doc.id!));
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
  */
};
