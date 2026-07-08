import { useState, useMemo, useEffect } from 'react';
import { useCourses } from './CoursesContext';
import { coursesData } from './coursesData';
import './Courses.css';

const ITEMS_PER_PAGE = 6;

const getInitials = (category) => {
  return category
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

const Courses = ({ initialCourseId, onConsumeInitial }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { enrollCourse, isEnrolled } = useCourses();

  const totalPages = Math.ceil(coursesData.length / ITEMS_PER_PAGE);

  const currentCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return coursesData.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage]);

  // لو المستخدم اختار كورس من نتائج البحث، افتحيه مباشرة
  useEffect(() => {
    if (initialCourseId) {
      const found = coursesData.find((c) => c.id === initialCourseId);
      if (found) {
        setSelectedCourse(found);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (onConsumeInitial) onConsumeInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCourseId]);

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedCourse(null);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnrollFree = () => {
    enrollCourse(selectedCourse);
  };

  if (selectedCourse) {
    const enrolled = isEnrolled(selectedCourse.id);

    return (
      <div className="courses-tab-container">
        <button className="back-button" onClick={handleBack}>
          ‹ Back to Courses
        </button>

        <div className="course-details">
          <div className="course-details-header">
            <div className="course-avatar large">
              {getInitials(selectedCourse.category)}
            </div>

            <div className="course-details-info">
              <span className="course-level">{selectedCourse.level}</span>
              <p className="course-category">{selectedCourse.category}</p>
              <h2 className="course-details-title">{selectedCourse.title}</h2>

              <div className="course-details-meta">
                <span>⏱ {selectedCourse.duration}</span>
                <span>📚 {selectedCourse.lessons} Lessons</span>
                <span>
                  <span className="star">★</span> {selectedCourse.rating} ({selectedCourse.students} students)
                </span>
              </div>

              <div className="course-instructor">
                <span className="instructor-avatar">
                  {selectedCourse.instructor.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </span>
                <span>{selectedCourse.instructor}</span>
              </div>
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
                  <li key={i}>
                    <span className="check-icon">✓</span> {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="details-section">
              <h3>Requirements</h3>
              <ul className="details-list plain">
                {selectedCourse.requirements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="course-enroll-box">
            {enrolled ? (
              <>
                <p className="already-enrolled">✓ You are already enrolled in this course</p>
                <button className="enroll-free-btn enrolled" disabled>
                  🎓 Enrolled
                </button>
              </>
            ) : (
              <>
                <div className="original-price">
                  <span className="price-label">Course price</span>
                  <span className="price-strikethrough">${selectedCourse.price}</span>
                </div>
                <button className="enroll-free-btn" onClick={handleEnrollFree}>
                  🎓 Learn for Free
                </button>
                <p className="enroll-note">Limited time offer — enroll now at no cost</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-tab-container">
      <div className="courses-header">
        <h2>All Courses</h2>
        <span className="courses-count">{coursesData.length} courses available</span>
      </div>

      <div className="courses-grid">
        {currentCourses.map((course) => (
          <div
            key={course.id}
            className="course-card"
            onClick={() => handleCourseClick(course)}
          >
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

            <div className="course-instructor">
              <span className="instructor-avatar">
                {course.instructor.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </span>
              <span>{course.instructor}</span>
            </div>

            <div className="course-footer">
              <div className="course-rating">
                <span className="star">★</span>
                <span>{course.rating}</span>
                <span className="students-count">({course.students})</span>
              </div>
              <div className="course-price">${course.price}</div>
            </div>

            {isEnrolled(course.id) && <span className="enrolled-badge">✓ Enrolled</span>}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-arrow"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="pagination-arrow"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default Courses;