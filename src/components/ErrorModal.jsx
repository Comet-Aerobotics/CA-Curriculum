import React from 'react';

export default function ErrorModal({ errorMessage, onClose, onRetry }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content error-modal-content">
        <div className="error-icon">⚠️</div>
        <h2>Firebase Storage Error</h2>
        <p className="error-message-text">
          {errorMessage || 'Failed to connect or store progress on Firebase. Please check your connection and Firebase credentials.'}
        </p>

        <div className="modal-actions">
          {onRetry && (
            <button className="btn-blue" onClick={onRetry}>
              Retry Operation
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
