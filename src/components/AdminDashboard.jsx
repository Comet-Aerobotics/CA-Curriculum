import React, { useState, useEffect } from 'react';
import { fetchAllStudentsAndProgress } from '../firebase/services';
import { modulesData } from '../data/modulesData';
import CircularProgressBar from './CircularProgressBar';

export default function AdminDashboard({ onExitAdmin }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudentNames, setExpandedStudentNames] = useState({});
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  // Total lessons across all modules
  const totalAvailableLessons = modulesData.reduce(
    (acc, m) => acc + (m.lessons ? m.lessons.length : 0),
    0
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchAllStudentsAndProgress();
      setStudents(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const toggleStudentDetails = (nameLower) => {
    setExpandedStudentNames((prev) => ({
      ...prev,
      [nameLower]: !prev[nameLower]
    }));
  };

  // Helper map to locate lesson title from lessonId
  const getLessonTitle = (lessonId) => {
    for (const mod of modulesData) {
      const match = (mod.lessons || []).find((l) => l.id === lessonId);
      if (match) return match.title;
    }
    return lessonId;
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Analytics
  const totalStudentsCount = students.length;
  const totalCompletionsCount = students.reduce(
    (acc, s) => acc + (s.completions ? s.completions.length : 0),
    0
  );
  const totalScreenshotsCount = students.reduce(
    (acc, s) =>
      acc +
      (s.completions
        ? s.completions.filter((c) => c.method === 'screenshot').length
        : 0),
    0
  );

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Monitor student accounts, lesson progress, and screenshot proof.</p>
        </div>
        <button className="btn-blue" onClick={onExitAdmin}>
          Exit Admin View
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="admin-metrics-grid">
        <div className="metric-card">
          <span className="metric-value">{totalStudentsCount}</span>
          <span className="metric-label">Registered Students</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{totalCompletionsCount}</span>
          <span className="metric-label">Lessons Completed</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{totalScreenshotsCount}</span>
          <span className="metric-label">Screenshots Uploaded</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="admin-search-container">
        <input
          type="text"
          className="input-field admin-search-input"
          placeholder="Search student by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Student Roster */}
      <div className="admin-roster-section">
        <h2 className="admin-section-heading">Student Progress Roster</h2>
        <div className="black-horizontal-bar"></div>

        {loading ? (
          <p style={{ padding: '20px' }}>Loading student records...</p>
        ) : filteredStudents.length === 0 ? (
          <p style={{ padding: '20px' }}>No student records found.</p>
        ) : (
          <div className="student-cards-list">
            {filteredStudents.map((student) => {
              const completions = student.completions || [];
              const completedCount = completions.length;
              const percentage =
                totalAvailableLessons > 0
                  ? Math.round((completedCount / totalAvailableLessons) * 100)
                  : 0;
              const isExpanded = !!expandedStudentNames[student.nameLower];

              return (
                <div key={student.nameLower} className="admin-student-card">
                  <div className="admin-student-header">
                    <div className="student-info">
                      <h3 className="student-name">{student.name}</h3>
                      <span className="student-meta">
                        Joined: {new Date(student.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="student-progress-badge">
                      <CircularProgressBar percentage={percentage} size={64} strokeWidth={6} />
                    </div>

                    <button
                      className="btn-secondary toggle-details-btn"
                      onClick={() => toggleStudentDetails(student.nameLower)}
                    >
                      {isExpanded ? 'Hide Details ▲' : 'View Submissions ▼'}
                    </button>
                  </div>

                  {/* Expanded Submissions Breakdown */}
                  {isExpanded && (
                    <div className="admin-submissions-accordion">
                      <h4 className="submissions-heading">Completed Lessons Breakdown ({completedCount}):</h4>
                      {completions.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: '#777' }}>
                          No lessons completed yet.
                        </p>
                      ) : (
                        <div className="submissions-list">
                          {completions.map((comp, idx) => (
                            <div key={idx} className="submission-item-row">
                              <div className="submission-title-group">
                                <strong>{getLessonTitle(comp.lessonId)}</strong>
                                <span className="submission-date">
                                  {new Date(comp.completedAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="submission-method-tag">
                                {comp.method === 'screenshot' ? (
                                  <span className="badge-screenshot">📷 Screenshot Proof</span>
                                ) : (
                                  <span className="badge-alt">⚠️ Checkmark Alt</span>
                                )}

                                {comp.screenshotUrl && (
                                  <button
                                    className="btn-blue view-proof-btn"
                                    onClick={() =>
                                      setPreviewScreenshot({
                                        studentName: student.name,
                                        lessonTitle: getLessonTitle(comp.lessonId),
                                        url: comp.screenshotUrl,
                                        fileName: comp.fileName
                                      })
                                    }
                                  >
                                    View Proof Image
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Screenshot Proof Preview Modal */}
      {previewScreenshot && (
        <div className="modal-overlay" onClick={() => setPreviewScreenshot(null)}>
          <div className="modal-content proof-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Screenshot Proof</h2>
            <p style={{ marginBottom: '8px' }}>
              <strong>Student:</strong> {previewScreenshot.studentName}
            </p>
            <p style={{ marginBottom: '16px' }}>
              <strong>Lesson:</strong> {previewScreenshot.lessonTitle}
            </p>

            <div className="screenshot-preview-wrapper">
              <img
                src={previewScreenshot.url}
                alt="Lesson Screenshot Proof"
                className="proof-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="proof-fallback-box" style={{ display: 'none' }}>
                📷 Screenshot File: <strong>{previewScreenshot.fileName || 'Uploaded Screenshot'}</strong>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-blue" onClick={() => setPreviewScreenshot(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
