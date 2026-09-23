import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AdminPinModal from './AdminPinModal';
import AdminDashboard from './AdminDashboard';

/**
 * Route wrapper for /admin.
 * Shows the PIN modal first; PIN state is session-only (not persisted across refreshes,
 * by design, for security).
 */
export default function AdminRoute() {
  const [pinPassed, setPinPassed] = useState(false);
  const navigate = useNavigate();
  const { setErrorMessage } = useApp();

  const handleExitAdmin = () => {
    navigate('/');
  };

  if (!pinPassed) {
    return (
      <AdminPinModal
        onSuccess={() => setPinPassed(true)}
        onCancel={() => navigate('/')}
      />
    );
  }

  return (
    <AdminDashboard
      onExitAdmin={handleExitAdmin}
      onError={setErrorMessage}
    />
  );
}
