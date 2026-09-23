import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { modulesList, completedLessonIds, handleSubmitLessonCompletion, setErrorMessage } = useApp();

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [altMarkComplete, setAltMarkComplete] = useState(false);

  // Derive moduleId from lessonId format: "{moduleId}-lesson-{n}" → e.g. "001"
  const moduleId = lessonId ? lessonId.split('-')[0] : null;

  // Find the parent module then the lesson within it
  const parentModule = modulesList.find((m) => m.id === moduleId);
  const lesson = parentModule
    ? (parentModule.lessons || []).find((l) => l.id === lessonId)
    : null;

  if (!lesson) {
    return (
      <div>
        <h2>Lesson Not Found</h2>
        <button className="btn-blue" onClick={() => navigate('/dashboard')}>
          Back to Modules
        </button>
      </div>
    );
  }

  const isAlreadyCompleted = !!completedLessonIds[lesson.id];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshotFile(e.target.files[0]);
    }
  };

  const isSubmittable = Boolean(screenshotFile || altMarkComplete);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSubmittable) return;
    try {
      const method = screenshotFile ? 'screenshot' : 'checkbox';
      await handleSubmitLessonCompletion(lesson.id, screenshotFile, method);
      navigate(`/module/${moduleId}`);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="lesson-page-container">
      {/* Description as main Page Title */}
      <h1 className="lesson-page-title">{lesson.title}</h1>
      <p className="lesson-duration-badge">Duration: {lesson.duration}</p>

      {/* Website Link */}
      <div className="website-link-box">
        <a
          href={lesson.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary website-link-btn"
        >
          🌐 Open Website / Lesson ↗
        </a>
      </div>

      {isAlreadyCompleted && (
        <div className="completed-status-banner">
          <span className="green-checkmark">✓</span> This lesson is already completed!
        </div>
      )}

      <form onSubmit={handleSubmit} className="lesson-form">
        {/* Large Upload Screenshot Button / Zone */}
        <div className="upload-section">
          <label htmlFor="screenshot-upload" className="large-upload-btn">
            📷 {screenshotFile ? `Uploaded: ${screenshotFile.name}` : 'Upload Screenshot of Completed Lesson'}
          </label>
          <input
            id="screenshot-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {screenshotFile && (
            <button
              type="button"
              className="remove-file-btn"
              onClick={() => setScreenshotFile(null)}
            >
              Remove Screenshot
            </button>
          )}
        </div>

        {/* Alternative Mark Complete Checkbox & Notice */}
        <div className="alt-complete-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={altMarkComplete}
              onChange={(e) => setAltMarkComplete(e.target.checked)}
              className="alt-checkbox"
            />
            <span>Mark Complete (Alternative Option)</span>
          </label>

          <div className="alt-notice-box">
            ⚠️ <strong>Important Note:</strong> The check mark alternative is only supposed to be used if you are unable to upload a screenshot, or if the website does not have a completed lesson page.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="lesson-actions-group">
          {/* Blue Submit button - grayed out until screenshot uploaded or checkmark selected */}
          <button
            type="submit"
            className="btn-blue"
            disabled={!isSubmittable}
          >
            Submit Completion
          </button>

          <div className="nav-buttons-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(`/module/${moduleId}`)}
            >
              Exit Lesson
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Back to Modules
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
