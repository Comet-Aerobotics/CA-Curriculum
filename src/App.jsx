import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import TitleScreen from './components/TitleScreen';
import NameInputForm from './components/NameInputForm';
import Dashboard from './components/Dashboard';
import ModulePage from './components/ModulePage';
import LessonPage from './components/LessonPage';
import AdminRoute from './components/AdminRoute';
import ErrorModal from './components/ErrorModal';

/**
 * Guards a route: redirects to "/" if not logged in.
 * Shows a loading state while the session is being restored from localStorage.
 */
function ProtectedRoute({ children }) {
  const { currentUser, isLoadingSession } = useApp();
  if (isLoadingSession) return <div className="loading-screen"><p>Restoring session…</p></div>;
  if (!currentUser) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { errorMessage, setErrorMessage, isLoadingSession } = useApp();

  // Block rendering until we know whether the user is logged in
  if (isLoadingSession) {
    return <div className="loading-screen"><p>Loading…</p></div>;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/login" element={<NameInputForm />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/module/:moduleId" element={
          <ProtectedRoute><ModulePage /></ProtectedRoute>
        } />
        <Route path="/lesson/:lessonId" element={
          <ProtectedRoute><LessonPage /></ProtectedRoute>
        } />

        <Route path="/admin" element={<AdminRoute />} />

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {errorMessage && (
        <ErrorModal
          errorMessage={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </>
  );
}
