import React, { useState } from 'react';

export default function NameInputForm({ onSubmitName, onBack }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    onSubmitName(trimmedName);
  };

  return (
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
        />
        {error && <p style={{ color: '#d32f2f', fontSize: '0.875rem', marginTop: '8px', marginBottom: '0' }}>{error}</p>}
        
        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn-blue">
            Continue
          </button>
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
