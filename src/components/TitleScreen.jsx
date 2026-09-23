import React from 'react';

export default function TitleScreen({ onLoginRegisterClick, onAdminClick }) {
  return (
    <div className="title-screen-container">
      <h1>Welcome</h1>
      <p>Click below to log in or register your account.</p>
      
      <div>
        <button className="btn-blue" onClick={onLoginRegisterClick}>
          Login / Register
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <button className="admin-access-link" onClick={onAdminClick}>
          🔒 Admin Access
        </button>
      </div>
    </div>
  );
}
