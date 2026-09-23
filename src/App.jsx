import React, { useState } from 'react';
import TitleScreen from './components/TitleScreen';
import NameInputForm from './components/NameInputForm';
import ConfirmModal from './components/ConfirmModal';
import Dashboard from './components/Dashboard';
import ModulePage from './components/ModulePage';
import LessonPage from './components/LessonPage';
import AdminPinModal from './components/AdminPinModal';
import AdminDashboard from './components/AdminDashboard';
import { modulesData } from './data/modulesData';
import {
  findUserByName,
  createAccount,
  fetchUserCompletions,
  saveLessonCompletion
} from './firebase/services';

export default function App() {
  const [view, setView] = useState('TITLE'); // 'TITLE' | 'ENTER_NAME' | 'DASHBOARD' | 'MODULE_DETAIL' | 'LESSON_DETAIL' | 'ADMIN'
  const [pendingName, setPendingName] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState({});

  const handleStartLogin = () => {
    setView('ENTER_NAME');
  };

  const handleBackToTitle = () => {
    setView('TITLE');
  };

  const handleSubmitName = async (enteredName) => {
    const existingUser = await findUserByName(enteredName);

    if (existingUser) {
      setCurrentUser(existingUser);
      // Fetch user's saved lesson completions from backend
      const userComps = await fetchUserCompletions(existingUser.name);
      setCompletedLessonIds(userComps);
      setView('DASHBOARD');
    } else {
      setPendingName(enteredName);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmCreateAccount = async () => {
    if (pendingName) {
      const newUser = await createAccount(pendingName);
      setCurrentUser(newUser);
      setCompletedLessonIds({});
      setShowConfirmModal(false);
      setPendingName(null);
      setView('DASHBOARD');
    }
  };

  const handleCancelCreateAccount = () => {
    setShowConfirmModal(false);
    setPendingName(null);
  };

  const handleSelectModule = (module) => {
    setSelectedModule(module);
    setView('MODULE_DETAIL');
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setView('LESSON_DETAIL');
  };

  const handleSubmitLessonCompletion = async (lessonId, screenshotFile, method) => {
    if (currentUser) {
      const comp = await saveLessonCompletion(
        currentUser.name,
        lessonId,
        selectedModule ? selectedModule.id : 'default_module',
        screenshotFile,
        method
      );

      setCompletedLessonIds((prev) => ({
        ...prev,
        [lessonId]: comp
      }));
    }
    setView('MODULE_DETAIL');
  };

  const handleExitLesson = () => {
    setSelectedLesson(null);
    setView('MODULE_DETAIL');
  };

  const handleBackToDashboard = () => {
    setSelectedLesson(null);
    setSelectedModule(null);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedModule(null);
    setSelectedLesson(null);
    setCompletedLessonIds({});
    setView('TITLE');
  };

  // Admin Handlers
  const handleOpenAdminPin = () => {
    setShowAdminPinModal(true);
  };

  const handleAdminPinSuccess = () => {
    setShowAdminPinModal(false);
    setView('ADMIN');
  };

  const handleExitAdmin = () => {
    setView('TITLE');
  };

  return (
    <>
      {view === 'TITLE' && (
        <TitleScreen
          onLoginRegisterClick={handleStartLogin}
          onAdminClick={handleOpenAdminPin}
        />
      )}

      {view === 'ENTER_NAME' && (
        <NameInputForm
          onSubmitName={handleSubmitName}
          onBack={handleBackToTitle}
        />
      )}

      {view === 'DASHBOARD' && currentUser && (
        <Dashboard
          user={currentUser}
          modules={modulesData}
          completedLessonIds={completedLessonIds}
          onSelectModule={handleSelectModule}
          onLogout={handleLogout}
        />
      )}

      {view === 'MODULE_DETAIL' && (
        <ModulePage
          module={selectedModule}
          completedLessonIds={completedLessonIds}
          onSelectLesson={handleSelectLesson}
          onBackToDashboard={handleBackToDashboard}
        />
      )}

      {view === 'LESSON_DETAIL' && (
        <LessonPage
          lesson={selectedLesson}
          isAlreadyCompleted={!!completedLessonIds[selectedLesson?.id]}
          onSubmitCompletion={(lessonId, file, method) =>
            handleSubmitLessonCompletion(lessonId, file, method)
          }
          onExitLesson={handleExitLesson}
          onBackToModules={handleBackToDashboard}
        />
      )}

      {view === 'ADMIN' && <AdminDashboard onExitAdmin={handleExitAdmin} />}

      {showConfirmModal && (
        <ConfirmModal
          name={pendingName}
          onConfirm={handleConfirmCreateAccount}
          onCancel={handleCancelCreateAccount}
        />
      )}

      {showAdminPinModal && (
        <AdminPinModal
          onSuccess={handleAdminPinSuccess}
          onCancel={() => setShowAdminPinModal(false)}
        />
      )}
    </>
  );
}
