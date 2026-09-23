import React, { useState, useEffect } from 'react';
import CircularProgressBar from './CircularProgressBar';
import {
  fetchAllStudentsAndProgress,
  fetchModulesFromDatabase,
  saveModulesToDatabase
} from '../firebase/services';

function formatCompletionDate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'object' && dateVal !== null && typeof dateVal.seconds === 'number') {
    const d = new Date(dateVal.seconds * 1000);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  }
  if (typeof dateVal === 'object' && dateVal !== null && typeof dateVal.toDate === 'function') {
    return dateVal.toDate().toLocaleString();
  }
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    return d.toLocaleString();
  }
  return '';
}

export default function AdminDashboard({ onExitAdmin, onError }) {
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'MODULES'
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingModules, setSavingModules] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudentNames, setExpandedStudentNames] = useState({});
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [studentsData, modulesData] = await Promise.all([
          fetchAllStudentsAndProgress(),
          fetchModulesFromDatabase()
        ]);
        setStudents(studentsData);
        setModules(modulesData);
      } catch (err) {
        if (onError) onError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [onError]);

  // Total lessons across all modules
  const totalAvailableLessons = modules.reduce(
    (acc, m) => acc + (m.lessons ? m.lessons.length : 0),
    0
  );

  const toggleStudentDetails = (nameLower) => {
    setExpandedStudentNames((prev) => ({
      ...prev,
      [nameLower]: !prev[nameLower]
    }));
  };

  const getLessonTitle = (lessonId) => {
    for (const mod of modules) {
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

  // Module Editor Handlers
  const handleUpdateModule = (modIdx, field, value) => {
    setModules((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[modIdx][field] = value;
      return updated;
    });
  };

  const handleAddModule = () => {
    setModules((prev) => {
      // Auto-generate next 3-digit ID (e.g., '001', '002', '003', '004')
      const nextNum = prev.length + 1;
      const next3DigitId = String(nextNum).padStart(3, '0');
      const newModule = {
        id: next3DigitId,
        title: `Module ${nextNum}: New Module`,
        description: 'Module description goes here.',
        lessons: [
          {
            id: `${next3DigitId}-lesson-1`,
            title: 'New Lesson Description',
            duration: '10 mins',
            websiteUrl: 'https://example.com'
          }
        ]
      };
      return [...prev, newModule];
    });
  };

  const handleDeleteModule = (modIdx) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      setModules((prev) => prev.filter((_, idx) => idx !== modIdx));
    }
  };

  const handleUpdateLesson = (modIdx, lessonIdx, field, value) => {
    setModules((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[modIdx].lessons[lessonIdx][field] = value;
      return updated;
    });
  };

  const handleAddLesson = (modIdx) => {
    setModules((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const mod = updated[modIdx];
      const lessonCount = (mod.lessons || []).length + 1;
      const newLesson = {
        id: `${mod.id}-lesson-${lessonCount}`,
        title: 'New Lesson Title / Description',
        duration: '15 mins',
        websiteUrl: 'https://example.com'
      };
      if (!mod.lessons) mod.lessons = [];
      mod.lessons.push(newLesson);
      return updated;
    });
  };

  const handleDeleteLesson = (modIdx, lessonIdx) => {
    setModules((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[modIdx].lessons = updated[modIdx].lessons.filter(
        (_, idx) => idx !== lessonIdx
      );
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    setSavingModules(true);
    setSaveSuccessMsg('');
    try {
      await saveModulesToDatabase(modules);
      setSaveSuccessMsg('✓ Modules and lessons saved successfully to database!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      if (onError) onError(err.message);
    } finally {
      setSavingModules(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Monitor student progress and manage module & lesson content.</p>
        </div>
        <button className="btn-blue" onClick={onExitAdmin}>
          Exit Admin View
        </button>
      </div>

      {/* Admin Tab Navigation */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          📊 Student Overview
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'MODULES' ? 'active' : ''}`}
          onClick={() => setActiveTab('MODULES')}
        >
          📚 Modules & Lessons Editor
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <>
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
                          <h4 className="submissions-heading">
                            Completed Lessons Breakdown ({completedCount}):
                          </h4>
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
                                      {formatCompletionDate(comp.completedAt)}
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
        </>
      )}

      {/* MODULES EDITOR TAB */}
      {activeTab === 'MODULES' && (
        <div className="admin-modules-editor-section">
          <div className="editor-top-bar">
            <div>
              <h2 className="admin-section-heading">Curriculum & Module Editor</h2>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                Edit module and lesson details below. Lesson titles edit here as the single source of truth.
              </p>
            </div>
            <div className="editor-actions">
              <button className="btn-secondary" onClick={handleAddModule}>
                + Add Module
              </button>
              <button
                className="btn-blue"
                onClick={handleSaveChanges}
                disabled={savingModules}
              >
                {savingModules ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="save-success-banner">{saveSuccessMsg}</div>
          )}

          <div className="black-horizontal-bar"></div>

          {/* List of Module Editors */}
          <div className="module-editors-list">
            {modules.map((mod, modIdx) => (
              <div key={mod.id || modIdx} className="module-editor-card">
                <div className="module-editor-header">
                  <span className="module-id-badge">Module ID: <strong>{mod.id}</strong></span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteModule(modIdx)}
                  >
                    🗑️ Delete Module
                  </button>
                </div>

                <div className="editor-field-group">
                  <label className="editor-label">Module Title:</label>
                  <input
                    type="text"
                    className="input-field editor-input"
                    value={mod.title || ''}
                    onChange={(e) => handleUpdateModule(modIdx, 'title', e.target.value)}
                  />
                </div>

                <div className="editor-field-group">
                  <label className="editor-label">Module Description:</label>
                  <textarea
                    className="input-field editor-textarea"
                    value={mod.description || ''}
                    onChange={(e) => handleUpdateModule(modIdx, 'description', e.target.value)}
                  />
                </div>

                {/* Lessons Section */}
                <div className="lessons-editor-section">
                  <div className="lessons-editor-header">
                    <h4>Lessons in Module {mod.id}</h4>
                    <button
                      className="btn-secondary add-lesson-btn"
                      onClick={() => handleAddLesson(modIdx)}
                    >
                      + Add Lesson
                    </button>
                  </div>

                  {(mod.lessons || []).map((lesson, lessonIdx) => (
                    <div key={lesson.id || lessonIdx} className="lesson-editor-card">
                      <div className="lesson-editor-header">
                        <span className="lesson-id-label">Lesson #{lessonIdx + 1}</span>
                        <button
                          className="delete-btn-sm"
                          onClick={() => handleDeleteLesson(modIdx, lessonIdx)}
                        >
                          Delete Lesson
                        </button>
                      </div>

                      <div className="editor-field-group">
                        <label className="editor-label">Lesson Title (Website Teaching Description):</label>
                        <input
                          type="text"
                          className="input-field editor-input"
                          value={lesson.title || ''}
                          onChange={(e) =>
                            handleUpdateLesson(modIdx, lessonIdx, 'title', e.target.value)
                          }
                        />
                      </div>

                      <div className="editor-field-row">
                        <div className="editor-field-group" style={{ flex: 1 }}>
                          <label className="editor-label">Duration Subtitle:</label>
                          <input
                            type="text"
                            className="input-field editor-input"
                            value={lesson.duration || ''}
                            onChange={(e) =>
                              handleUpdateLesson(modIdx, lessonIdx, 'duration', e.target.value)
                            }
                          />
                        </div>

                        <div className="editor-field-group" style={{ flex: 2 }}>
                          <label className="editor-label">Website URL:</label>
                          <input
                            type="text"
                            className="input-field editor-input"
                            value={lesson.websiteUrl || ''}
                            onChange={(e) =>
                              handleUpdateLesson(modIdx, lessonIdx, 'websiteUrl', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="editor-bottom-bar" style={{ marginTop: '24px' }}>
            <button
              className="btn-blue"
              onClick={handleSaveChanges}
              disabled={savingModules}
              style={{ padding: '14px 32px', fontSize: '1.05rem' }}
            >
              {savingModules ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

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
