import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { modulesData as defaultModulesData } from '../data/modulesData';
import {
  findUserByName,
  createAccount,
  fetchUserCompletions,
  saveLessonCompletion,
  fetchModulesFromDatabase
} from '../firebase/services';

const AppContext = createContext(null);

// Key used for localStorage persistence
const STORAGE_KEY = 'ca_username';

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [modulesList, setModulesList] = useState(defaultModulesData);
  const [completedLessonIds, setCompletedLessonIds] = useState({});
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // On mount: restore session from localStorage if a username is saved
  useEffect(() => {
    async function restoreSession() {
      const savedName = localStorage.getItem(STORAGE_KEY);
      if (!savedName) {
        setIsLoadingSession(false);
        return;
      }
      try {
        const [dbModules, existingUser] = await Promise.all([
          fetchModulesFromDatabase(),
          findUserByName(savedName)
        ]);
        if (dbModules && dbModules.length > 0) setModulesList(dbModules);
        if (existingUser) {
          setCurrentUser(existingUser);
          const comps = await fetchUserCompletions(existingUser.name);
          setCompletedLessonIds(comps);
        } else {
          // Username no longer in Firebase — clear stale storage
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn('Session restore failed:', err.message);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoadingSession(false);
      }
    }
    restoreSession();
  }, []);

  /**
   * Attempt to log in with a name. Returns { isNew: true } if no account found,
   * or resolves the user into state and returns { isNew: false }.
   */
  const handleLoginUser = useCallback(async (enteredName) => {
    const [dbModules, existingUser] = await Promise.all([
      fetchModulesFromDatabase(),
      findUserByName(enteredName)
    ]);
    if (dbModules && dbModules.length > 0) setModulesList(dbModules);
    if (existingUser) {
      localStorage.setItem(STORAGE_KEY, existingUser.name);
      setCurrentUser(existingUser);
      const comps = await fetchUserCompletions(existingUser.name);
      setCompletedLessonIds(comps);
      return { isNew: false };
    }
    return { isNew: true };
  }, []);

  /**
   * Create a new account and log the user in.
   */
  const handleCreateAccount = useCallback(async (name) => {
    const newUser = await createAccount(name);
    localStorage.setItem(STORAGE_KEY, newUser.name);
    setCurrentUser(newUser);
    setCompletedLessonIds({});
  }, []);

  /**
   * Log out the current user and clear localStorage.
   */
  const handleLogout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setCompletedLessonIds({});
  }, []);

  /**
   * Re-fetch modules list from Firebase.
   */
  const handleRefreshModules = useCallback(async () => {
    try {
      const dbModules = await fetchModulesFromDatabase();
      if (dbModules && dbModules.length > 0) setModulesList(dbModules);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }, []);

  /**
   * Save a lesson completion to Firebase and update local state.
   * moduleId is derived from lessonId (format: "{moduleId}-lesson-{n}").
   */
  const handleSubmitLessonCompletion = useCallback(async (lessonId, screenshotFile, method) => {
    if (!currentUser) return;
    const moduleId = lessonId.split('-')[0]; // e.g. "001-lesson-1" → "001"
    const comp = await saveLessonCompletion(
      currentUser.name,
      lessonId,
      moduleId,
      screenshotFile,
      method
    );
    setCompletedLessonIds((prev) => ({ ...prev, [lessonId]: comp }));
  }, [currentUser]);

  return (
    <AppContext.Provider value={{
      currentUser,
      modulesList,
      completedLessonIds,
      isLoadingSession,
      errorMessage,
      setErrorMessage,
      handleLoginUser,
      handleCreateAccount,
      handleLogout,
      handleRefreshModules,
      handleSubmitLessonCompletion
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
