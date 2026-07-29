import { useState, useMemo } from 'react';
import { useCourses } from './CoursesContext';
import { useTrainerAssignments } from './TrainerAssignmentsContext';
import './Assignments.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'graded', label: 'Graded' },
];

const Assignments = () => {
  const { myCourses, isAssignmentSubmitted, toggleAssignmentSubmitted } = useCourses();
  const { assignments: trainerAssignments } = useTrainerAssignments();
  const [activeFilter, setActiveFilter] = useState('all');

  const allAssignments = useMemo(() => {
    const list = [];

    myCourses.forEach((course) => {
      const daysSinceEnrollment = course.enrolledAt
        ? Math.floor((Date.now() - new Date(course.enrolledAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // الواجبات الثابتة المرفقة أصلًا بالكورس
      (course.assignments || []).forEach((a) => {
        list.push({
          ...a,
          courseId: course.id,
          courseTitle: course.category,
          daysLeft: a.dueInDays - daysSinceEnrollment,
          submitted: isAssignmentSubmitted(a.id),
          graded: false,
          grade: null,
          feedback: '',
        });
      });

      // الواجبات يلي المدرب ضافها بعد إنشاء الكورس — بتظهر مباشرة لكل طالب مسجّل بنفس الكورس
      trainerAssignments
        .filter((ta) => ta.courseId === course.id)
        .forEach((ta) => {
          const daysLeft = Math.ceil((new Date(ta.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          list.push({
            id: ta.id,
            title: ta.title,
            description: ta.description,
            courseId: course.id,
            courseTitle: course.category,
            daysLeft,
            submitted: isAssignmentSubmitted(ta.id),
            graded: ta.status === 'graded',
            grade: ta.grade,
            feedback: ta.feedback,
          });
        });
    });

    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [myCourses, isAssignmentSubmitted, trainerAssignments]);

  const filteredAssignments = useMemo(() => {
    switch (activeFilter) {
      case 'pending':
        return allAssignments.filter((a) => !a.submitted && a.daysLeft >= 0);
      case 'overdue':
        return allAssignments.filter((a) => !a.submitted && a.daysLeft < 0);
      case 'submitted':
        return allAssignments.filter((a) => a.submitted && !a.graded);
      case 'graded':
        return allAssignments.filter((a) => a.graded);
      default:
        return allAssignments;
    }
  }, [allAssignments, activeFilter]);

  const counts = useMemo(() => ({
    all: allAssignments.length,
    pending: allAssignments.filter((a) => !a.submitted && a.daysLeft >= 0).length,
    overdue: allAssignments.filter((a) => !a.submitted && a.daysLeft < 0).length,
    submitted: allAssignments.filter((a) => a.submitted && !a.graded).length,
    graded: allAssignments.filter((a) => a.graded).length,
  }), [allAssignments]);

  if (myCourses.length === 0) {
    return (
      <div className="assignments-container">
        <div className="assignments-page-header">
          <h1>Assignments</h1>
          <p>Track everything due across your enrolled courses in one place.</p>
        </div>
        <div className="assignments-empty">
          <div className="assignments-empty-icon">📝</div>
          <h3>No assignments yet</h3>
          <p>Enroll in a course to start seeing your assignments here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assignments-container">
      <div className="assignments-page-header">
        <h1>Assignments</h1>
        <p>Track everything due across your enrolled courses in one place.</p>
      </div>

      <div className="assignments-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`assignments-filter-tab ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
            <span className="assignments-filter-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="assignments-empty">
          <div className="assignments-empty-icon">✅</div>
          <h3>Nothing here</h3>
          <p>No assignments match this filter right now.</p>
        </div>
      ) : (
        <div className="assignments-list">
          {filteredAssignments.map((a) => (
            <div key={a.id} className={`assignment-row ${a.submitted ? 'submitted' : ''}`}>
              <div className="assignment-row-main">
                <div className="assignment-row-top">
                  <span className="assignment-course-tag">{a.courseTitle}</span>
                  {a.graded ? (
                    <span className="assignment-status-badge done">✓ Graded — {a.grade}/100</span>
                  ) : a.submitted ? (
                    <span className="assignment-status-badge done">✓ Submitted</span>
                  ) : (
                    <span
                      className={`assignment-status-badge ${
                        a.daysLeft < 0 ? 'overdue' : a.daysLeft <= 2 ? 'soon' : 'upcoming'
                      }`}
                    >
                      {a.daysLeft < 0
                        ? 'Overdue'
                        : a.daysLeft === 0
                        ? 'Due today'
                        : `In ${a.daysLeft} day${a.daysLeft > 1 ? 's' : ''}`}
                    </span>
                  )}
                </div>

                <h4 className="assignment-row-title">{a.title}</h4>
                <p className="assignment-row-desc">{a.description}</p>

                {a.graded && a.feedback && (
                  <p className="assignment-row-desc" style={{ color: '#0056d2', fontWeight: 600 }}>
                    Instructor feedback: {a.feedback}
                  </p>
                )}
              </div>

              {!a.graded && (
                <button
                  className={`assignment-submit-btn ${a.submitted ? 'undo' : ''}`}
                  onClick={() => toggleAssignmentSubmitted(a.id)}
                >
                  {a.submitted ? 'Undo' : 'Mark as Submitted'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Assignments;
