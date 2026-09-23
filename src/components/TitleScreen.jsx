import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TitleScreen() {
  const navigate = useNavigate();

  return (
    <div className="title-screen-container">
      <h1>Welcome</h1>
      <p>Click below to log in or register your account.</p>

      <div>
        <button className="btn-blue" onClick={() => navigate('/login')}>
          Login / Register
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <button className="admin-access-link" onClick={() => navigate('/admin')}>
          🔒 Admin Access
        </button>
      </div>
    </div>
  );
}
