import { db, storage, isConfigured } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// In-Memory & LocalStorage Fallback Store for seamless testing when live Firebase is not configured
const STORAGE_KEYS = {
  USERS: 'ca_curriculum_users',
  COMPLETIONS: 'ca_curriculum_completions'
};

const getLocalStore = (key, defaultVal) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocalStore = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
};

// Default seed users if empty
if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
  setLocalStore(STORAGE_KEYS.USERS, [
    { name: 'Alice', nameLower: 'alice', createdAt: new Date().toISOString() },
    { name: 'Bob', nameLower: 'bob', createdAt: new Date().toISOString() }
  ]);
}

/**
  Find existing user account by name (case-insensitive)
 */
export async function findUserByName(name) {
  const nameLower = name.trim().toLowerCase();

  if (isConfigured && db) {
    try {
      const q = query(collection(db, 'users'), where('nameLower', '==', nameLower));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (err) {
      console.warn('Firestore findUserByName fallback:', err);
    }
  }

  // Fallback
  const users = getLocalStore(STORAGE_KEYS.USERS, []);
  return users.find((u) => u.nameLower === nameLower) || null;
}

/**
  Create new user account
 */
export async function createAccount(name) {
  const trimmed = name.trim();
  const nameLower = trimmed.toLowerCase();
  const userData = {
    name: trimmed,
    nameLower,
    createdAt: new Date().toISOString()
  };

  if (isConfigured && db) {
    try {
      const userRef = doc(db, 'users', nameLower);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp()
      });
      return userData;
    } catch (err) {
      console.warn('Firestore createAccount fallback:', err);
    }
  }

  // Fallback
  const users = getLocalStore(STORAGE_KEYS.USERS, []);
  if (!users.some((u) => u.nameLower === nameLower)) {
    users.push(userData);
    setLocalStore(STORAGE_KEYS.USERS, users);
  }
  return userData;
}

/**
  Fetch lesson completions for a given user
 */
export async function fetchUserCompletions(userName) {
  const nameLower = userName.trim().toLowerCase();

  if (isConfigured && db) {
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
      console.warn('Firestore fetchUserCompletions fallback:', err);
    }
  }

  // Fallback
  const allCompletions = getLocalStore(STORAGE_KEYS.COMPLETIONS, []);
  const userCompletions = allCompletions.filter((c) => c.userNameLower === nameLower);
  const result = {};
  userCompletions.forEach((c) => {
    result[c.lessonId] = c;
  });
  return result;
}

/**
  Save a lesson completion (with optional file upload to Storage)
 */
export async function saveLessonCompletion(userName, lessonId, moduleId, file, method) {
  const trimmedName = userName.trim();
  const nameLower = trimmedName.toLowerCase();
  let screenshotUrl = null;
  let fileName = file ? file.name : null;

  // 1. Upload screenshot to Firebase Storage if file provided
  if (file) {
    if (isConfigured && storage) {
      try {
        const storageRef = ref(storage, `screenshots/${nameLower}/${lessonId}_${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        screenshotUrl = await getDownloadURL(uploadResult.ref);
      } catch (err) {
        console.warn('Firebase Storage upload fallback:', err);
        screenshotUrl = URL.createObjectURL(file);
      }
    } else {
      screenshotUrl = URL.createObjectURL(file);
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

  // 2. Save document to Firestore
  if (isConfigured && db) {
    try {
      const compRef = doc(db, 'completions', completionData.docId);
      await setDoc(compRef, {
        ...completionData,
        completedAt: serverTimestamp()
      });
      return completionData;
    } catch (err) {
      console.warn('Firestore saveLessonCompletion fallback:', err);
    }
  }

  // Fallback
  const completions = getLocalStore(STORAGE_KEYS.COMPLETIONS, []);
  const existingIdx = completions.findIndex((c) => c.docId === completionData.docId);
  if (existingIdx >= 0) {
    completions[existingIdx] = completionData;
  } else {
    completions.push(completionData);
  }
  setLocalStore(STORAGE_KEYS.COMPLETIONS, completions);

  return completionData;
}

/**
  Fetch all students and their complete progress statistics for Admin Dashboard
 */
export async function fetchAllStudentsAndProgress() {
  let usersList = [];
  let completionsList = [];

  if (isConfigured && db) {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => usersList.push(d.data()));

      const compSnap = await getDocs(collection(db, 'completions'));
      compSnap.forEach((d) => completionsList.push(d.data()));
    } catch (err) {
      console.warn('Firestore fetchAllStudentsAndProgress fallback:', err);
      usersList = getLocalStore(STORAGE_KEYS.USERS, []);
      completionsList = getLocalStore(STORAGE_KEYS.COMPLETIONS, []);
    }
  } else {
    usersList = getLocalStore(STORAGE_KEYS.USERS, []);
    completionsList = getLocalStore(STORAGE_KEYS.COMPLETIONS, []);
  }

  return usersList.map((user) => {
    const userComps = completionsList.filter((c) => c.userNameLower === user.nameLower);
    return {
      ...user,
      completions: userComps
    };
  });
}
