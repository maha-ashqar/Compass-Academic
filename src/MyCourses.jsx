import { useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiPlay,
  FiTrash2,
} from 'react-icons/fi';
import { useCourses } from './CoursesContext';
import CourseLearningPage from './CourseLearningPage';
import './MyCourses.css';

const getLessonCount = (course) =>
  (course.modules || []).reduce(
    (total, module) => total + (module.lessons || []).length,
    0
  );

const getUpcomingTasksCount = (courses, submittedAssignments) =>
  courses.reduce((total, course) => {
    const openAssignments = (course.assignments || []).filter(
      (assignment) => !submittedAssignments.includes(assignment.id)
    ).length;
    return total + openAssignments;
  }, 0);

function MyCourses({ onExploreCourses }) {
  const {
    myCourses,
    unenrollCourse,
    getCourseProgress,
    getCompletedLessonCount,
    getNextLesson,
    submittedAssignments,
  } = useCourses();

  const [learningCourse, setLearningCourse] = useState(null);

  const courseSummaries = useMemo(
    () =>
      [...myCourses]
        .sort(
          (a, b) =>
            new Date(b.lastOpenedAt || b.enrolledAt || 0) -
            new Date(a.lastOpenedAt || a.enrolledAt || 0)
        )
        .map((course) => {
          const totalLessons = getLessonCount(course);
          return {
            course,
            totalLessons,
            completedLessons: getCompletedLessonCount(course.id),
            progress: getCourseProgress(course.id, totalLessons),
            nextLesson: getNextLesson(course),
          };
        }),
    [myCourses, getCourseProgress, getCompletedLessonCount, getNextLesson]
  );

  const learningStats = useMemo(() => {
    const completed = courseSummaries.reduce(
      (total, item) => total + item.completedLessons,
      0
    );
    const average = courseSummaries.length
      ? Math.round(
          courseSummaries.reduce((total, item) => total + item.progress, 0) /
            courseSummaries.length
        )
      : 0;

    return {
      average,
      completed,
      upcoming: getUpcomingTasksCount(myCourses, submittedAssignments),
    };
  }, [courseSummaries, myCourses, submittedAssignments]);

  const openLearning = (course) => {
    setLearningCourse(course);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnenroll = (event, course) => {
    event.stopPropagation();
    const confirmed = window.confirm(
      `Remove “${course.shortTitle || course.title}” from My Learning? Your saved lesson progress for this course will be removed.`
    );

    if (confirmed) {
      unenrollCourse(course.id);
    }
  };

  if (learningCourse) {
    return (
      <CourseLearningPage
        course={learningCourse}
        onBack={() => setLearningCourse(null)}
      />
    );
  }

  if (!courseSummaries.length) {
    return (
      <main className="my-learning-page" dir="ltr">
        <header className="my-learning-header">
          <div>
            <h1>My learning</h1>
            <p>Continue your enrolled courses and keep your learning momentum.</p>
          </div>
        </header>

        <section className="my-learning-empty">
          <span><FiBookOpen /></span>
          <h2>Your learning journey starts here</h2>
          <p>Explore practical courses, enroll for free, and track every completed lesson.</p>
          <button type="button" onClick={onExploreCourses}>
            Explore courses <FiArrowRight />
          </button>
        </section>
      </main>
    );
  }

  const [featured, ...remaining] = courseSummaries;

  return (
    <main className="my-learning-page" dir="ltr">
      <header className="my-learning-header">
        <div>
          <h1>My learning</h1>
          <p>Continue your enrolled courses and keep your learning momentum.</p>
        </div>
        <button type="button" onClick={onExploreCourses}>
          Explore more courses
        </button>
      </header>

      <section className="learning-summary" aria-label="Learning summary">
        <small>Learning summary</small>
        <div className="learning-summary-grid">
          <div><strong>{courseSummaries.length}</strong><span>Enrolled courses</span></div>
          <div><strong>{learningStats.average}%</strong><span>Average progress</span></div>
          <div><strong>{learningStats.completed}</strong><span>Lessons completed</span></div>
          <div><strong>{learningStats.upcoming}</strong><span>Upcoming tasks</span></div>
        </div>
      </section>

      <section className="continue-learning-section">
        <div className="my-learning-section-heading">
          <h2>Continue learning</h2>
          <span>Sorted by recent activity</span>
        </div>

        <article className="featured-learning-card">
          <button
            type="button"
            className="featured-learning-image"
            onClick={() => openLearning(featured.course)}
            aria-label={`Continue ${featured.course.title}`}
          >
            {featured.course.coverImage ? (
              <img src={featured.course.coverImage} alt="" />
            ) : (
              <FiBookOpen />
            )}
          </button>

          <div className="featured-learning-content">
            <small>{featured.course.category}</small>
            <h3>{featured.course.shortTitle || featured.course.title}</h3>
            <p>
              {featured.nextLesson
                ? `Next: ${featured.nextLesson.title}${featured.nextLesson.duration ? ` · ${featured.nextLesson.duration}` : ''}`
                : 'All available lessons are complete.'}
            </p>

            <div className="learning-progress-label">
              <span>Course progress</span>
              <strong>{featured.progress}%</strong>
            </div>
            <div className="learning-progress-track">
              <span style={{ width: `${featured.progress}%` }} />
            </div>
          </div>

          <div className="featured-learning-actions">
            <button type="button" onClick={() => openLearning(featured.course)}>
              <FiPlay /> Continue course
            </button>
            <span>
              {featured.completedLessons} of {featured.totalLessons} lessons completed
            </span>
          </div>
        </article>

        {remaining.length > 0 && (
          <div className="learning-course-grid">
            {remaining.map((item) => (
              <article className="learning-course-card" key={item.course.id}>
                <button
                  type="button"
                  className="learning-course-image"
                  onClick={() => openLearning(item.course)}
                  aria-label={`Open ${item.course.title}`}
                >
                  {item.course.coverImage ? (
                    <img src={item.course.coverImage} alt="" />
                  ) : (
                    <FiBookOpen />
                  )}
                </button>

                <div className="learning-course-copy">
                  <div className="learning-course-title-row">
                    <small>{item.course.category}</small>
                    <button
                      type="button"
                      className="learning-remove-button"
                      onClick={(event) => handleUnenroll(event, item.course)}
                      title="Remove from My Learning"
                      aria-label={`Remove ${item.course.title} from My Learning`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <h3>{item.course.shortTitle || item.course.title}</h3>
                  <p>{item.course.instructor} · {item.course.duration}</p>

                  <div className="learning-progress-label">
                    <span>Progress</span>
                    <strong>{item.progress}%</strong>
                  </div>
                  <div className="learning-progress-track">
                    <span style={{ width: `${item.progress}%` }} />
                  </div>

                  <button
                    type="button"
                    className="learning-card-continue"
                    onClick={() => openLearning(item.course)}
                  >
                    Continue learning <FiArrowRight />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="next-study-goal">
        <span><FiCheckCircle /></span>
        <div>
          <h2>Your next study goal</h2>
          <p>
            {featured.nextLesson
              ? `Complete “${featured.nextLesson.title}” to move forward in your learning path.`
              : 'Choose another course and keep building your skills.'}
          </p>
        </div>
        <button type="button" onClick={() => openLearning(featured.course)}>
          <FiClock /> View course plan
        </button>
      </section>
    </main>
  );
}

export default MyCourses;
