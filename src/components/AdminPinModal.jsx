import React, { useState } from 'react';

export default function AdminPinModal({ onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Default admin PIN: 1234
    if (pin.trim() === '1234') {
      onSuccess();
    } else {
      setError('Invalid Admin PIN. (Default PIN: 1234)');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '380px' }}>
        <h2>Admin Access</h2>
        <p>Please enter the Admin PIN to access the dashboard:</p>

        <form onSubmit={handleSubmit} className="input-group" style={{ margin: '0 auto' }}>
          <input
            type="password"
            className="input-field"
            placeholder="Enter PIN (Default: 1234)"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError('');
            }}
            autoFocus
          />

          {error && (
            <p style={{ color: '#d32f2f', fontSize: '0.85rem', marginTop: '8px', marginBottom: '0' }}>
              {error}
            </p>
          )}

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="submit" className="btn-blue">
              Unlock Dashboard
            </button>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
