import { useState } from 'react';
import { useCourses } from './CoursesContext';
import CourseLearningPage from './CourseLearningPage';
import './Courses.css';

const getInitials = (category) => {
  return category.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
};

const MyCourses = () => {
  const { myCourses, unenrollCourse, getCourseProgress } = useCourses();
  const [learningCourse, setLearningCourse] = useState(null);

  const handleUnenroll = (e, courseId) => {
    e.stopPropagation();
    if (window.confirm('هل تريد إلغاء التسجيل من هذا الكورس؟')) {
      unenrollCourse(courseId);
      setLearningCourse(null);
    }
  };

  // ============ صفحة التعلّم الكاملة ============
  if (learningCourse) {
    return (
      <CourseLearningPage
        course={learningCourse}
        onBack={() => setLearningCourse(null)}
      />
    );
  }

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

  // ============ شبكة كورساتي ============
  return (
    <div className="courses-tab-container">
      <div className="courses-header">
        <h2>My Courses</h2>
        <span className="courses-count">{myCourses.length} enrolled courses</span>
      </div>

      <div className="courses-grid">
        {myCourses.map((course) => {
          const totalLessons = (course.modules || []).reduce(
            (sum, mod) => sum + mod.lessons.length,
            0
          );
          const progress = getCourseProgress(course.id, totalLessons);

          return (
            <div
              key={course.id}
              className="course-card"
              onClick={() => setLearningCourse(course)}
            >
              <div className="course-card-top">
                <div className="course-avatar">{getInitials(course.category)}</div>
                <button className="remove-btn" onClick={(e) => handleUnenroll(e, course.id)}>✕</button>
              </div>

              <p className="course-category">{course.category}</p>
              <h3 className="course-title">{course.title}</h3>

              <div className="progress-section small">
                <div className="progress-header">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="course-instructor">
                <span className="instructor-avatar">
                  {course.instructor.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </span>
                <span>{course.instructor}</span>
              </div>

              <button
                className="continue-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setLearningCourse(course);
                }}
              >
                ▶ Continue Learning
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyCourses;