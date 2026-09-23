import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CircularProgressBar from './CircularProgressBar';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    modulesList,
    completedLessonIds,
    handleLogout,
    handleRefreshModules
  } = useApp();

  const [expandedModuleIds, setExpandedModuleIds] = useState({});

  const toggleDropdown = (moduleId) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  const modules = modulesList || [];

  return (
    <div className="dashboard-container">
      {/* Greeting at top */}
      <h1 className="welcome-header">Welcome, {currentUser?.name}!</h1>
      <p className="welcome-subtitle">Select a module below to view lessons and track your progress.</p>

      {/* Modules Section */}
      <div className="modules-section">
        {/* Left-aligned Modules heading & Refresh Modules button with speech bubble */}
        <div className="modules-header-container">
          <div className="modules-heading-row">
            <h2 className="modules-heading">Modules</h2>
            <div className="refresh-btn-wrapper">
              <button
                className="icon-btn refresh-modules-btn"
                onClick={handleRefreshModules}
                aria-label="Refresh Modules List"
              >
                🔄
              </button>
              <span className="tooltip-bubble">Refresh Modules List</span>
            </div>
          </div>
          <div className="black-horizontal-bar"></div>
        </div>

        {/* Programmatic Module List */}
        <div className="modules-list">
          {modules.map((module) => {
            const isExpanded = !!expandedModuleIds[module.id];
            const lessons = module.lessons || [];
            const totalLessons = lessons.length;
            const completedCount = lessons.filter(
              (lesson) => !!completedLessonIds[lesson.id]
            ).length;

            const percentage =
              totalLessons > 0
                ? Math.round((completedCount / totalLessons) * 100)
                : 0;

            const isAllCompleted = totalLessons > 0 && completedCount === totalLessons;

            return (
              <div key={module.id} className="module-card">
                <div className="module-row">
                  {/* Module Title */}
                  <span className="module-title">{module.title}</span>

                  {/* Action controls */}
                  <div className="module-controls">
                    {/* Green check mark when ALL lessons are complete */}
                    {isAllCompleted && (
                      <span
                        className="green-checkmark module-all-completed-badge"
                        title="All lessons in this module completed!"
                      >
                        ✓
                      </span>
                    )}

                    {/* Drop-down arrow button */}
                    <button
                      className="icon-btn dropdown-btn"
                      onClick={() => toggleDropdown(module.id)}
                      title={isExpanded ? 'Hide Completion Details' : 'Show Completion Details'}
                      aria-label="Toggle Module Details"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>

                    {/* Right arrow button → open module page */}
                    <button
                      className="icon-btn right-arrow-btn"
                      onClick={() => navigate(`/module/${module.id}`)}
                      title="Open Module Page"
                      aria-label="Open Module Page"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Expanded Details Accordion */}
                {isExpanded && (
                  <div className="module-details-accordion">
                    <p className="module-desc">{module.description}</p>
                    <p className="module-stats">
                      Completed {completedCount} of {totalLessons} lessons
                    </p>
                    <div className="completion-info">
                      <CircularProgressBar percentage={percentage} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout button at the end of the page */}
      <div className="logout-container">
        <button className="btn-blue" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}
