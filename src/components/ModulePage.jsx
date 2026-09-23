import React from 'react';

export default function ModulePage({
  module,
  completedLessonIds = {},
  onSelectLesson,
  onBackToDashboard
}) {
  if (!module) {
    return (
      <div>
        <h2>Module Not Found</h2>
        <button className="btn-blue" onClick={onBackToDashboard}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const lessons = module.lessons || [];

  return (
    <div className="module-page-container">
      <h1 className="module-page-title">{module.title}</h1>
      <p className="module-page-desc">{module.description}</p>

      {/* List of Lesson Cards */}
      <div className="lessons-list">
        <h2 className="lessons-section-heading">Lessons & Websites</h2>

        {lessons.length === 0 ? (
          <p>No lessons available in this module yet.</p>
        ) : (
          lessons.map((lesson) => {
            const isCompleted = !!completedLessonIds[lesson.id];

            return (
              <div key={lesson.id} className="lesson-card">
                <div className="lesson-card-content">
                  {/* Main Title: Description of what website teaches */}
                  <h3 className="lesson-card-title">{lesson.title}</h3>
                  {/* Subtitle: Length of website */}
                  <span className="lesson-card-duration">Duration: {lesson.duration}</span>
                </div>

                <div className="lesson-card-actions">
                  {/* Green check mark if completed */}
                  {isCompleted && (
                    <span className="green-checkmark lesson-completed-badge" title="Completed">
                      ✓
                    </span>
                  )}

                  {/* Right arrow button -> open lesson page */}
                  <button
                    className="icon-btn right-arrow-btn"
                    onClick={() => onSelectLesson(lesson)}
                    title="Go to Lesson"
                    aria-label={`Go to lesson: ${lesson.title}`}
                  >
                    →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ marginTop: '32px' }}>
        <button className="btn-blue" onClick={onBackToDashboard}>
          Back to Modules
        </button>
      </div>
    </div>
  );
}
