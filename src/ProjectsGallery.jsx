import { useState, useMemo } from 'react';
import { FiPlus, FiBriefcase } from 'react-icons/fi';
import { useProjects } from './ProjectsContext';
import { useCoursesCatalog } from './CoursesCatalogContext';
import './TrainerDashboard.css';
import './Courses.css';

const emptyForm = { courseId: '', title: '', description: '', fileUrl: '' };

const ProjectsGallery = ({ studentData }) => {
  const { projects, submitProject } = useProjects();
  const { courses } = useCoursesCatalog();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const myProjects = useMemo(
    () => projects.filter((p) => p.studentEmail === studentData.email),
    [projects, studentData.email]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const course = courses.find((c) => String(c.id) === String(form.courseId));
    if (!course || !form.title.trim()) return;

    submitProject({
      courseId: course.id,
      courseTitle: course.category,
      studentName: studentData.displayName,
      studentEmail: studentData.email,
      title: form.title.trim(),
      description: form.description.trim(),
      fileUrl: form.fileUrl.trim() || '#',
    });
    setForm(emptyForm);
    setShowForm(false);
  };

  return (
    <div className="courses-tab-container">
      <div className="courses-page-header">
        <h1 className="courses-page-title">Projects Gallery</h1>
        <p className="courses-page-subtitle">
          Submit your project work for instructor review, and track approval status here.
        </p>
      </div>

      <div className="td-section-toggle">
        <button className="td-toggle-btn" onClick={() => setShowForm((p) => !p)}>
          <FiPlus style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {showForm ? 'Cancel' : 'Submit New Project'}
        </button>
      </div>

      {showForm && (
        <form className="td-form-card" onSubmit={handleSubmit}>
          <h3>New Project Submission</h3>
          <div className="td-form-grid">
            <div className="td-form-field full">
              <label>Course</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                required
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.category}</option>
                ))}
              </select>
            </div>
            <div className="td-form-field full">
              <label>Project Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. E-Commerce Recommendation Engine"
                required
              />
            </div>
            <div className="td-form-field full">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what you built and how it meets the assignment goals..."
              />
            </div>
            <div className="td-form-field full">
              <label>Link (repo, demo, or file URL)</label>
              <input
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="td-form-actions">
            <button type="submit" className="td-submit-btn">Submit for Review</button>
          </div>
        </form>
      )}

      {myProjects.length === 0 ? (
        <div className="td-empty">
          <div className="td-empty-icon"><FiBriefcase /></div>
          <h3>No projects submitted yet</h3>
          <p>Submit your first project above to get instructor feedback.</p>
        </div>
      ) : (
        <div className="td-projects-list">
          {myProjects.map((p) => (
            <div key={p.id} className="td-project-card">
              <div className="td-project-top">
                <span className="td-project-student">{p.courseTitle}</span>
                <span className={`td-project-status ${p.status}`}>{p.status}</span>
              </div>
              <h4 className="td-project-title">{p.title}</h4>
              <p className="td-project-desc">{p.description}</p>
              {p.fileUrl && p.fileUrl !== '#' && (
                <a href={p.fileUrl} target="_blank" rel="noreferrer" className="notif-inline-action">
                  View submission ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsGallery;
