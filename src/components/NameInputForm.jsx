import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ConfirmModal from './ConfirmModal';

export default function NameInputForm() {
  const navigate = useNavigate();
  const { handleLoginUser, handleCreateAccount, setErrorMessage } = useApp();

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingName, setPendingName] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await handleLoginUser(trimmedName);
      if (result.isNew) {
        // No account found — ask to confirm creation
        setPendingName(trimmedName);
      } else {
        // Existing user — go to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCreate = async () => {
    if (!pendingName) return;
    try {
      await handleCreateAccount(pendingName);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleCancelCreate = () => {
    setPendingName(null);
  };

  return (
    <>
      <div>
        <h2>Login / Register</h2>
        <p>Enter your name to continue:</p>

        <form onSubmit={handleSubmit} className="input-group">
          <input
            type="text"
            className="input-field"
            placeholder="Type your name..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            autoFocus
            disabled={submitting}
          />
          {error && (
            <p style={{ color: '#d32f2f', fontSize: '0.875rem', marginTop: '8px', marginBottom: '0' }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn-blue" disabled={submitting}>
              {submitting ? 'Checking…' : 'Continue'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              Back
            </button>
          </div>
        </form>
      </div>

      {pendingName && (
        <ConfirmModal
          name={pendingName}
          onConfirm={handleConfirmCreate}
          onCancel={handleCancelCreate}
        />
      )}
    </>
  );
}
