import { useState } from 'react';
import { useCourses } from './CoursesContext';
import './Courses.css';

const getInitials = (category) => {
  return category.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
};

const MyCourses = () => {
  const { myCourses, unenrollCourse } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleBack = () => setSelectedCourse(null);

  const handleUnenroll = (e, courseId) => {
    e.stopPropagation();
    if (window.confirm('هل تريد إلغاء التسجيل من هذا الكورس؟')) {
      unenrollCourse(courseId);
      setSelectedCourse(null);
    }
  };

  // ============ حالة عدم وجود كورسات ============
  if (myCourses.length === 0) {
    return (
      <div className="courses-tab-container">
        <div className="courses-header">
          <h2>My Courses</h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>You haven't enrolled in any course yet</h3>
          <p>Browse our courses and start learning for free today.</p>
        </div>
      </div>
    );
  }

  // ============ عرض تفاصيل كورس مسجل بيه ============
  if (selectedCourse) {
    return (
      <div className="courses-tab-container">
        <button className="back-button" onClick={handleBack}>‹ Back to My Courses</button>

        <div className="course-details">
          <div className="course-details-header">
            <div className="course-avatar large">{getInitials(selectedCourse.category)}</div>
            <div className="course-details-info">
              <span className="course-level">{selectedCourse.level}</span>
              <p className="course-category">{selectedCourse.category}</p>
              <h2 className="course-details-title">{selectedCourse.title}</h2>
              <div className="course-details-meta">
                <span>⏱ {selectedCourse.duration}</span>
                <span>📚 {selectedCourse.lessons} Lessons</span>
                <span><span className="star">★</span> {selectedCourse.rating} ({selectedCourse.students} students)</span>
              </div>
              <div className="course-instructor">
                <span className="instructor-avatar">
                  {selectedCourse.instructor.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </span>
                <span>{selectedCourse.instructor}</span>
              </div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <span>Your Progress</span>
              <span>{selectedCourse.progress || 0}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${selectedCourse.progress || 0}%` }} />
            </div>
          </div>

          <div className="course-details-body">
            <section className="details-section">
              <h3>About this course</h3>
              <p>{selectedCourse.description}</p>
            </section>
            <section className="details-section">
              <h3>What you will learn</h3>
              <ul className="details-list">
                {selectedCourse.whatYouWillLearn.map((item, i) => (
                  <li key={i}><span className="check-icon">✓</span> {item}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="course-enroll-box">
            <button className="enroll-free-btn">▶ Continue Learning</button>
            <button
              className="unenroll-btn"
              onClick={(e) => handleUnenroll(e, selectedCourse.id)}
            >
              Unenroll from this course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ شبكة كورساتي ============
  return (
    <div className="courses-tab-container">
      <div className="courses-header">
        <h2>My Courses</h2>
        <span className="courses-count">{myCourses.length} enrolled courses</span>
      </div>

      <div className="courses-grid">
        {myCourses.map((course) => (
          <div key={course.id} className="course-card" onClick={() => setSelectedCourse(course)}>
            <div className="course-card-top">
              <div className="course-avatar">{getInitials(course.category)}</div>
              <button className="remove-btn" onClick={(e) => handleUnenroll(e, course.id)}>✕</button>
            </div>

            <p className="course-category">{course.category}</p>
            <h3 className="course-title">{course.title}</h3>

            <div className="progress-section small">
              <div className="progress-header">
                <span>Progress</span>
                <span>{course.progress || 0}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${course.progress || 0}%` }} />
              </div>
            </div>

            <div className="course-instructor">
              <span className="instructor-avatar">
                {course.instructor.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </span>
              <span>{course.instructor}</span>
            </div>

            <button className="continue-btn">▶ Continue Learning</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;