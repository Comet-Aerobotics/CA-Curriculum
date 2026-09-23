import { db, isConfigured } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { compressImageToBase64 } from '../utils/imageCompressor';
import { modulesData as defaultModulesData } from '../data/modulesData';

function assertFirebaseConfigured() {
  if (!isConfigured || !db) {
    throw new Error(
      'Firebase is not configured yet. Please set your VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY environment variables in your .env or deployment configuration.'
    );
  }
}

/**
 * Fetch dynamic modules and lessons array from Firestore database (doc: curriculum/main)
 * If uninitialized, seeds default modules and returns them.
 */
export async function fetchModulesFromDatabase() {
  assertFirebaseConfigured();
  try {
    const docRef = doc(db, 'curriculum', 'main');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data() && docSnap.data().modules) {
      return docSnap.data().modules;
    } else {
      // Seed default modules into Firestore
      await setDoc(docRef, { modules: defaultModulesData });
      return defaultModulesData;
    }
  } catch (err) {
    console.error('Firestore fetchModulesFromDatabase error:', err);
    throw new Error(`Failed to load modules from Firebase: ${err.message}`);
  }
}

/**
 * Save updated modules and lessons array to Firestore database (doc: curriculum/main)
 */
export async function saveModulesToDatabase(modulesArray) {
  assertFirebaseConfigured();
  try {
    const docRef = doc(db, 'curriculum', 'main');
    await setDoc(docRef, { modules: modulesArray });
    return modulesArray;
  } catch (err) {
    console.error('Firestore saveModulesToDatabase error:', err);
    throw new Error(
      `Failed to save modules to Firebase: ${err.message}. Please update your Firestore Security Rules in the Firebase Console to allow access to match /{document=**}.`
    );
  }
}

/**
 * Find existing user account in Firebase Firestore
 */
export async function findUserByName(name) {
  assertFirebaseConfigured();
  const nameLower = name.trim().toLowerCase();

  try {
    const q = query(collection(db, 'users'), where('nameLower', '==', nameLower));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return null;
  } catch (err) {
    console.error('Firestore findUserByName error:', err);
    throw new Error(`Failed to query account on Firebase: ${err.message}`);
  }
}

/**
 * Create new user account in Firebase Firestore
 */
export async function createAccount(name) {
  assertFirebaseConfigured();
  const trimmed = name.trim();
  const nameLower = trimmed.toLowerCase();
  const userData = {
    name: trimmed,
    nameLower
  };

  try {
    const userRef = doc(db, 'users', nameLower);
    await setDoc(userRef, userData);
    return userData;
  } catch (err) {
    console.error('Firestore createAccount error:', err);
    throw new Error(`Failed to create account on Firebase: ${err.message}`);
  }
}

/**
 * Fetch lesson completions from Firebase Firestore
 */
export async function fetchUserCompletions(userName) {
  assertFirebaseConfigured();
  const nameLower = userName.trim().toLowerCase();

  try {
    const q = query(collection(db, 'completions'), where('userNameLower', '==', nameLower));
    const snapshot = await getDocs(q);
    const completions = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      completions[data.lessonId] = data;
    });
    return completions;
  } catch (err) {
    console.error('Firestore fetchUserCompletions error:', err);
    throw new Error(`Failed to load progress from Firebase: ${err.message}`);
  }
}

/**
 * Save lesson completion to Firestore (compressing screenshot to Base64 data URL if file provided)
 */
export async function saveLessonCompletion(userName, lessonId, moduleId, file, method) {
  assertFirebaseConfigured();
  const trimmedName = userName.trim();
  const nameLower = trimmedName.toLowerCase();
  let screenshotUrl = null;
  let fileName = file ? file.name : null;

  if (file) {
    try {
      screenshotUrl = await compressImageToBase64(file);
    } catch (err) {
      console.error('Image compression error:', err);
      throw new Error(`Failed to process screenshot image: ${err.message}`);
    }
  }

  const completionData = {
    docId: `${nameLower}_${lessonId}`,
    userName: trimmedName,
    userNameLower: nameLower,
    lessonId,
    moduleId,
    method, // 'screenshot' | 'checkbox'
    screenshotUrl,
    fileName,
    completedAt: new Date().toISOString()
  };

  try {
    const compRef = doc(db, 'completions', completionData.docId);
    await setDoc(compRef, completionData);
    return completionData;
  } catch (err) {
    console.error('Firestore saveLessonCompletion error:', err);
    throw new Error(`Failed to store progress on Firebase: ${err.message}`);
  }
}

/**
 * Fetch all students and progress for Admin Dashboard
 */
export async function fetchAllStudentsAndProgress() {
  assertFirebaseConfigured();

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersList = [];
    usersSnap.forEach((d) => usersList.push(d.data()));

    const compSnap = await getDocs(collection(db, 'completions'));
    const completionsList = [];
    compSnap.forEach((d) => completionsList.push(d.data()));

    return usersList.map((user) => {
      const userComps = completionsList.filter((c) => c.userNameLower === user.nameLower);
      return {
        ...user,
        completions: userComps
      };
    });
  } catch (err) {
    console.error('Firestore fetchAllStudentsAndProgress error:', err);
    throw new Error(`Failed to load admin student roster from Firebase: ${err.message}`);
  }
}
