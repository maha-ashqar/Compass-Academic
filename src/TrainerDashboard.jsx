import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import './Courses.css';
import './Assignments.css';
import './TrainerDashboard.css';
import {
  FiBell, FiMail, FiPlus, FiTrash2, FiBookOpen, FiUsers,
  FiBriefcase, FiFileText, FiTarget, FiAward
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import { trainerMenuItems } from './trainerMenuItems';
import { useCoursesCatalog } from './CoursesCatalogContext';
import { useProjects } from './ProjectsContext';
import { useTrainerAssignments } from './TrainerAssignmentsContext';
import { useTrainerStudents } from './TrainerStudentsContext';
import { useNotifications } from './NotificationsContext';
import TrainerMessages from './TrainerMessages';

const getInitials = (text) =>
  (text || '').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const emptyCourseForm = {
  category: '', title: '', level: 'Beginner', duration: '4 Weeks',
  lessons: '', price: '', description: '',
};

const emptyAssignmentForm = { courseId: '', title: '', description: '', dueDate: '' };

const TrainerDashboard = ({ trainerData, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Home');

  const { courses, addCourse, deleteCourse } = useCoursesCatalog();
  const { projects, approveProject, rejectProject, deleteProject } = useProjects();
  const { assignments, addAssignment, deleteAssignment, gradeAssignment } = useTrainerAssignments();
  const { roster, rateStudent } = useTrainerStudents();
  const { unreadCount } = useNotifications();

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/trainer-login');
  };

  // ============ إدارة الكورسات ============
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);

  const myCourses = useMemo(
    () => courses.filter((c) => c.instructor === trainerData.displayName || c.createdByTrainer),
    [courses, trainerData.displayName]
  );

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!courseForm.category.trim() || !courseForm.title.trim()) return;
    addCourse({ ...courseForm, instructor: trainerData.displayName });
    setCourseForm(emptyCourseForm);
    setShowCourseForm(false);
  };

  // ============ إدارة الواجبات ============
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [gradeDrafts, setGradeDrafts] = useState({});

  const handleAddAssignment = (e) => {
    e.preventDefault();
    const course = courses.find((c) => String(c.id) === String(assignmentForm.courseId));
    if (!course || !assignmentForm.title.trim() || !assignmentForm.dueDate) return;
    addAssignment({
      courseId: course.id,
      courseTitle: course.category,
      title: assignmentForm.title,
      description: assignmentForm.description,
      dueDate: assignmentForm.dueDate,
    });
    setAssignmentForm(emptyAssignmentForm);
    setShowAssignmentForm(false);
  };

  const handleGradeSubmit = (assignmentId) => {
    const draft = gradeDrafts[assignmentId];
    if (!draft || draft.grade === undefined || draft.grade === '') return;
    gradeAssignment(assignmentId, { grade: Number(draft.grade), feedback: draft.feedback || '' });
  };

  // ============ تقييم الطلاب ============
  const [ratingDrafts, setRatingDrafts] = useState({});

  const handleSaveRating = (studentId) => {
    const draft = ratingDrafts[studentId];
    const student = roster.find((s) => s.id === studentId);
    rateStudent(studentId, {
      rating: draft?.rating ?? student.rating,
      feedback: draft?.feedback ?? student.feedback,
    });
  };

  // ============ التوجيهات (Guidance) ============
  const { addNotification } = useNotifications();
  const [guidanceText, setGuidanceText] = useState('');
  const [guidanceSent, setGuidanceSent] = useState(false);

  const handleSendGuidance = () => {
    if (!guidanceText.trim()) return;
    addNotification({
      title: `Guidance from ${trainerData.displayName}`,
      text: guidanceText.trim(),
      category: 'academics',
      icon: '📢',
    });
    setGuidanceText('');
    setGuidanceSent(true);
    setTimeout(() => setGuidanceSent(false), 2500);
  };

  const pendingProjectsCount = projects.filter((p) => p.status === 'pending').length;
  const ungradedCount = assignments.filter((a) => a.status !== 'graded').length;

  return (
    <div className="dashboard-container">
      <Sidebar
        activeTab={activeTab}
        onSelect={setActiveTab}
        onLogout={handleLogoutClick}
        studentData={trainerData}
        menuItems={trainerMenuItems}
      />

      <main className="main-viewport">
        <header className="main-header">
          <div className="search-box">
            <FiUsers className="search-icon" />
            <input type="text" placeholder="Search students, courses, or projects..." disabled />
          </div>

          <div className="header-controls">
            <div className="icon-btn">
              <FiBell className="header-icon" />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </div>
            <div className="icon-btn" onClick={() => setActiveTab('Messages')}>
              <FiMail className="header-icon" />
            </div>
            <div className="header-user">
              <span className="user-name">{trainerData.displayName.split(' ').slice(-1)[0]}</span>
              <img src={trainerData.avatar} alt="Trainer Avatar" className="header-avatar" />
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          {/* ==================== الرئيسية ==================== */}
          {activeTab === 'Home' && (
            <div className="tab-content">
              <div className="welcome-section">
                <div className="welcome-text">
                  <h1>Welcome back, {trainerData.displayName} 👋</h1>
                  <p>Here's what's happening with your courses and students today.</p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-box">
                  <div className="icon-wrapper blue-bg"><FiBookOpen /></div>
                  <div className="stat-info">
                    <span className="stat-label">COURSES TEACHING</span>
                    <span className="stat-number">{myCourses.length}</span>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="icon-wrapper blue-bg"><FiUsers /></div>
                  <div className="stat-info">
                    <span className="stat-label">STUDENTS</span>
                    <span className="stat-number">{roster.length}</span>
                  </div>
                </div>
                <div className="stat-box gold-bg">
                  <div className="icon-wrapper dark-bg"><FiBriefcase /></div>
                  <div className="stat-info">
                    <span className="stat-label">PROJECTS PENDING</span>
                    <span className="stat-number">{pendingProjectsCount}</span>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="icon-wrapper blue-bg"><FiFileText /></div>
                  <div className="stat-info">
                    <span className="stat-label">TO GRADE</span>
                    <span className="stat-number">{ungradedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== الملف الشخصي ==================== */}
          {activeTab === 'Profile' && (
            <div className="tab-content" style={{ background: '#fff', padding: '30px', borderRadius: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
              <img src={trainerData.avatar} alt="" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h2 style={{ margin: 0, color: '#000a33' }}>{trainerData.displayName}</h2>
                <p style={{ color: '#7e84a3', margin: '6px 0' }}>{trainerData.major}</p>
                <p style={{ color: '#383e5c', fontSize: 13.5, maxWidth: 480 }}>{trainerData.bio}</p>
              </div>
            </div>
          )}

          {/* ==================== إدارة الكورسات ==================== */}
          {activeTab === 'Courses' && (
            <div className="courses-tab-container">
              <div className="courses-page-header">
                <h1 className="courses-page-title">My Courses</h1>
                <p className="courses-page-subtitle">Add new courses for students to enroll in, or remove ones you no longer teach.</p>
              </div>

              <div className="td-section-toggle">
                <button className="td-toggle-btn" onClick={() => setShowCourseForm((p) => !p)}>
                  <FiPlus style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {showCourseForm ? 'Cancel' : 'Add New Course'}
                </button>
              </div>

              {showCourseForm && (
                <form className="td-form-card" onSubmit={handleAddCourse}>
                  <h3>New Course Details</h3>
                  <div className="td-form-grid">
                    <div className="td-form-field">
                      <label>Category</label>
                      <input value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} placeholder="e.g. Data Engineering" required />
                    </div>
                    <div className="td-form-field">
                      <label>Level</label>
                      <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                    <div className="td-form-field full">
                      <label>Title</label>
                      <input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Course headline" required />
                    </div>
                    <div className="td-form-field">
                      <label>Duration</label>
                      <input value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} placeholder="e.g. 6 Weeks" />
                    </div>
                    <div className="td-form-field">
                      <label>Lessons Count</label>
                      <input type="number" value={courseForm.lessons} onChange={(e) => setCourseForm({ ...courseForm, lessons: e.target.value })} placeholder="e.g. 12" />
                    </div>
                    <div className="td-form-field">
                      <label>Price ($)</label>
                      <input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} placeholder="e.g. 99" />
                    </div>
                    <div className="td-form-field full">
                      <label>Description</label>
                      <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="What will students learn in this course?" />
                    </div>
                  </div>
                  <div className="td-form-actions">
                    <button type="submit" className="td-submit-btn">Publish Course</button>
                  </div>
                </form>
              )}

              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course.id} className="course-card td-manage-course-card">
                    <button
                      className="td-delete-course-btn"
                      title="Delete course"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this course? This cannot be undone.')) {
                          deleteCourse(course.id);
                        }
                      }}
                    >
                      <FiTrash2 />
                    </button>

                    <div className="course-card-top">
                      <div className="course-avatar">{getInitials(course.category)}</div>
                      <span className="course-level">{course.level}</span>
                    </div>

                    <p className="course-category">{course.category}</p>
                    <h3 className="course-title">{course.title}</h3>

                    <div className="course-meta">
                      <span>⏱ {course.duration}</span>
                      <span>📚 {course.lessons} Lessons</span>
                    </div>

                    <div className="course-footer">
                      <div className="course-rating">
                        <span className="star">★</span>
                        <span>{course.rating || 0}</span>
                        <span className="students-count">({course.students || 0})</span>
                      </div>
                      <div className="course-price">${course.price}</div>
                    </div>
                  </div>
                ))}
              </div>

              {courses.length === 0 && (
                <div className="td-empty">
                  <div className="td-empty-icon">📚</div>
                  <h3>No courses yet</h3>
                  <p>Add your first course to start enrolling students.</p>
                </div>
              )}
            </div>
          )}

          {/* ==================== الطلاب ==================== */}
          {activeTab === 'Students' && (
            <div className="tab-content">
              <div className="courses-page-header">
                <h1 className="courses-page-title">Students</h1>
                <p className="courses-page-subtitle">Track progress and leave a rating & feedback for each student.</p>
              </div>

              <div className="td-students-grid">
                {roster.map((s) => {
                  const draft = ratingDrafts[s.id] || { rating: s.rating, feedback: s.feedback };
                  return (
                    <div key={s.id} className="td-student-card">
                      <div className="td-student-top">
                        <img src={s.avatar} alt={s.name} className="td-student-avatar" />
                        <div>
                          <h4 className="td-student-name">{s.name}</h4>
                          <p className="td-student-course">{s.courseTitle}</p>
                        </div>
                      </div>

                      <div>
                        <div className="td-student-progress-row">
                          <span>Progress</span>
                          <span>{s.progress}%</span>
                        </div>
                        <div className="td-student-progress-bar">
                          <div className="td-student-progress-fill" style={{ width: `${s.progress}%` }} />
                        </div>
                      </div>

                      <div className="td-rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`td-star-btn ${star <= draft.rating ? 'filled' : ''}`}
                            onClick={() => setRatingDrafts((prev) => ({ ...prev, [s.id]: { ...draft, rating: star } }))}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="td-feedback-input"
                        placeholder="Write feedback for this student..."
                        value={draft.feedback}
                        onChange={(e) => setRatingDrafts((prev) => ({ ...prev, [s.id]: { ...draft, feedback: e.target.value } }))}
                      />

                      <button className="td-save-rating-btn" onClick={() => handleSaveRating(s.id)}>
                        Save Evaluation
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== المشاريع ==================== */}
          {activeTab === 'Projects' && (
            <div className="tab-content">
              <div className="courses-page-header">
                <h1 className="courses-page-title">Student Projects</h1>
                <p className="courses-page-subtitle">Review, approve, or reject submitted projects. Approved projects can't be deleted.</p>
              </div>

              {projects.length === 0 ? (
                <div className="td-empty">
                  <div className="td-empty-icon"><FiBriefcase /></div>
                  <h3>No projects submitted yet</h3>
                  <p>Student project submissions will show up here.</p>
                </div>
              ) : (
                <div className="td-projects-list">
                  {projects.map((p) => (
                    <div key={p.id} className="td-project-card">
                      <div className="td-project-top">
                        <span className="td-project-student">{p.studentName} · {p.courseTitle}</span>
                        <span className={`td-project-status ${p.status}`}>{p.status}</span>
                      </div>
                      <h4 className="td-project-title">{p.title}</h4>
                      <p className="td-project-desc">{p.description}</p>

                      <div className="td-project-actions">
                        {p.status !== 'approved' && (
                          <button className="td-approve-btn" onClick={() => approveProject(p.id)}>
                            ✓ Approve
                          </button>
                        )}
                        {p.status !== 'rejected' && (
                          <button className="td-reject-btn" onClick={() => rejectProject(p.id)}>
                            Reject
                          </button>
                        )}
                        <button
                          className="td-delete-btn"
                          disabled={p.status === 'approved'}
                          title={p.status === 'approved' ? "Can't delete an approved project" : 'Delete project'}
                          onClick={() => {
                            if (window.confirm('Delete this project submission?')) deleteProject(p.id);
                          }}
                        >
                          <FiTrash2 style={{ verticalAlign: 'middle', marginRight: 4 }} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== الواجبات ==================== */}
          {activeTab === 'Assignments' && (
            <div className="assignments-container">
              <div className="assignments-page-header">
                <h1>Assignments</h1>
                <p>Create assignments for your courses and grade student submissions.</p>
              </div>

              <div className="td-section-toggle">
                <button className="td-toggle-btn" onClick={() => setShowAssignmentForm((p) => !p)}>
                  <FiPlus style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {showAssignmentForm ? 'Cancel' : 'New Assignment'}
                </button>
              </div>

              {showAssignmentForm && (
                <form className="td-form-card" onSubmit={handleAddAssignment}>
                  <h3>New Assignment</h3>
                  <div className="td-form-grid">
                    <div className="td-form-field">
                      <label>Course</label>
                      <select
                        value={assignmentForm.courseId}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })}
                        required
                      >
                        <option value="">Select a course</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.category}</option>
                        ))}
                      </select>
                    </div>
                    <div className="td-form-field">
                      <label>Due Date</label>
                      <input type="date" value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} required />
                    </div>
                    <div className="td-form-field full">
                      <label>Title</label>
                      <input value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} placeholder="Assignment title" required />
                    </div>
                    <div className="td-form-field full">
                      <label>Description</label>
                      <textarea value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} placeholder="What should students submit?" />
                    </div>
                  </div>
                  <div className="td-form-actions">
                    <button type="submit" className="td-submit-btn">Publish Assignment</button>
                  </div>
                </form>
              )}

              {assignments.length === 0 ? (
                <div className="td-empty">
                  <div className="td-empty-icon"><FiFileText /></div>
                  <h3>No assignments created yet</h3>
                  <p>Assignments you create will appear here and instantly show up for enrolled students.</p>
                </div>
              ) : (
                <div className="td-assignments-list">
                  {assignments.map((a) => {
                    const draft = gradeDrafts[a.id] || { grade: a.grade ?? '', feedback: a.feedback || '' };
                    return (
                      <div key={a.id} className="assignment-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div className="assignment-row-top">
                          <span className="assignment-course-tag">{a.courseTitle}</span>
                          <span className={`assignment-status-badge ${a.status === 'graded' ? 'done' : 'upcoming'}`}>
                            {a.status === 'graded' ? '✓ Graded' : 'Open'}
                          </span>
                        </div>
                        <h4 className="assignment-row-title">{a.title}</h4>
                        <p className="assignment-row-desc">{a.description}</p>
                        <p className="assignment-row-desc">Due: {a.dueDate}</p>

                        {a.status === 'graded' ? (
                          <p className="td-graded-summary">Grade: {a.grade}/100 — {a.feedback}</p>
                        ) : (
                          <div className="td-grade-form">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Grade"
                              value={draft.grade}
                              onChange={(e) => setGradeDrafts((prev) => ({ ...prev, [a.id]: { ...draft, grade: e.target.value } }))}
                            />
                            <input
                              type="text"
                              className="feedback"
                              placeholder="Feedback for the student..."
                              value={draft.feedback}
                              onChange={(e) => setGradeDrafts((prev) => ({ ...prev, [a.id]: { ...draft, feedback: e.target.value } }))}
                            />
                            <button type="button" onClick={() => handleGradeSubmit(a.id)}>Submit Grade</button>
                            <button
                              type="button"
                              style={{ background: '#fff1f1', color: '#ea4335' }}
                              onClick={() => {
                                if (window.confirm('Delete this assignment?')) deleteAssignment(a.id);
                              }}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== التوجيهات ==================== */}
          {activeTab === 'Guidance' && (
            <div className="tab-content">
              <div className="courses-page-header">
                <h1 className="courses-page-title">Send Guidance</h1>
                <p className="courses-page-subtitle">Broadcast an announcement or direction — it will appear instantly in every student's notifications.</p>
              </div>

              <div className="td-guidance-card">
                <textarea
                  placeholder="Write your guidance or announcement here..."
                  value={guidanceText}
                  onChange={(e) => setGuidanceText(e.target.value)}
                />
                <div className="td-form-actions">
                  <button className="td-submit-btn" onClick={handleSendGuidance}>
                    <FiTarget style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Send to All Students
                  </button>
                </div>
                {guidanceSent && <span className="td-guidance-sent">✓ Sent to all students</span>}
              </div>
            </div>
          )}

          {/* ==================== الرسائل ==================== */}
          {activeTab === 'Messages' && <TrainerMessages />}

          {/* ==================== الإعدادات ==================== */}
          {activeTab === 'Settings' && (
            <div className="tab-content" style={{ background: '#fff', padding: '30px', borderRadius: '20px' }}>
              <h2 style={{ color: '#000a33', marginBottom: 12 }}>Settings</h2>
              <p style={{ color: '#7e84a3', marginBottom: 20 }}>Signed in as {trainerData.email}</p>
              <button className="td-submit-btn" style={{ background: '#ea4335' }} onClick={handleLogoutClick}>
                <FiAward style={{ display: 'none' }} />
                Logout
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TrainerDashboard;
