import React from 'react';

export default function ConfirmModal({ name, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Account Not Found</h2>
        <p>
          No account was found under the name <strong>"{name}"</strong>.
        </p>
        <p>Would you like to create a new account with this name?</p>
        <div className="modal-actions">
          <button className="btn-blue" onClick={onConfirm}>
            Create Account
          </button>
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
