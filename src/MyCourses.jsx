import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiPlay,
  FiTrash2,
} from 'react-icons/fi';
import {
  getStudentMyCourses,
  removeStudentCourse,
} from './api/studentLearning';
import CourseLearningPage from './CourseLearningPage';
import './MyCourses.css';

const formatCourse = (course) => ({
  id: course.id,
  title: course.title,
  shortTitle: course.title,
  slug: course.slug,
  description: course.description || '',
  level: course.level || 'beginner',
  duration: `${course.duration_weeks || 0} weeks`,
  durationWeeks: Number(course.duration_weeks || 0),
  coverImage: course.cover_image || '',
  category: course.category?.name || 'General',
  categorySlug: course.category?.slug || '',
  instructor:
    course.instructor?.name || 'Compass Academy instructor',
  instructorTitle:
    course.instructor?.title || 'Instructor',
  enrollment: course.enrollment || null,
  enrolledAt: course.enrollment?.enrolled_at || null,
  completedAt: course.enrollment?.completed_at || null,
  enrollmentStatus:
    course.enrollment?.status || 'active',
  progress: Number(course.progress || 0),
  completedLessons: Number(
    course.completed_lessons || 0
  ),
  totalLessons: Number(course.total_lessons || 0),
  nextLesson: course.next_lesson
    ? {
        id: course.next_lesson.id,
        title: course.next_lesson.title,
        type: course.next_lesson.type,
        duration: course.next_lesson.duration_minutes
          ? `${course.next_lesson.duration_minutes} min`
          : '',
        module: course.next_lesson.module || null,
      }
    : null,
  upcomingAssignments: Array.isArray(
    course.upcoming_assignments
  )
    ? course.upcoming_assignments
    : [],
});

function MyCourses({ onExploreCourses }) {
  const [myCourses, setMyCourses] = useState([]);
  const [learningCourse, setLearningCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removingCourseId, setRemovingCourseId] =
    useState(null);
  const [error, setError] = useState('');

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getStudentMyCourses();

      setMyCourses(
        Array.isArray(data.courses)
          ? data.courses.map(formatCourse)
          : []
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load your courses.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyCourses();
  }, []);

  const courseSummaries = useMemo(
    () =>
      [...myCourses].sort(
        (a, b) =>
          new Date(b.enrolledAt || 0) -
          new Date(a.enrolledAt || 0)
      ),
    [myCourses]
  );

  const learningStats = useMemo(() => {
    const completed = courseSummaries.reduce(
      (total, course) =>
        total + course.completedLessons,
      0
    );

    const average = courseSummaries.length
      ? Math.round(
          courseSummaries.reduce(
            (total, course) =>
              total + course.progress,
            0
          ) / courseSummaries.length
        )
      : 0;

    const upcoming = courseSummaries.reduce(
      (total, course) =>
        total + course.upcomingAssignments.length,
      0
    );

    return {
      average,
      completed,
      upcoming,
    };
  }, [courseSummaries]);

  const openLearning = (course) => {
    setLearningCourse(course);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const closeLearning = async () => {
    setLearningCourse(null);
    await loadMyCourses();
  };

  const handleUnenroll = async (event, course) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Remove “${course.shortTitle || course.title}” from My Learning?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingCourseId(course.id);
      setError('');

      await removeStudentCourse(course.id);

      setMyCourses((current) =>
        current.filter(
          (item) =>
            String(item.id) !== String(course.id)
        )
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to remove this course.'
      );
    } finally {
      setRemovingCourseId(null);
    }
  };

  if (learningCourse) {
    return (
      <CourseLearningPage
        course={learningCourse}
        onBack={closeLearning}
      />
    );
  }

  if (loading) {
    return (
      <main className="my-learning-page" dir="ltr">
        <section className="my-learning-empty">
          <span>
            <FiBookOpen />
          </span>
          <h2>Loading your courses...</h2>
        </section>
      </main>
    );
  }

  if (!courseSummaries.length && !error) {
    return (
      <main className="my-learning-page" dir="ltr">
        <header className="my-learning-header">
          <div>
            <h1>My learning</h1>
            <p>
              Continue your enrolled courses and keep
              your learning momentum.
            </p>
          </div>
        </header>

        <section className="my-learning-empty">
          <span>
            <FiBookOpen />
          </span>

          <h2>Your learning journey starts here</h2>

          <p>
            Explore practical courses, enroll for free,
            and track every completed lesson.
          </p>

          <button
            type="button"
            onClick={onExploreCourses}
          >
            Explore courses <FiArrowRight />
          </button>
        </section>
      </main>
    );
  }

  const [featured, ...remaining] = courseSummaries;

  const summaryCards = [
    {
      icon: <FiBookOpen />,
      value: courseSummaries.length,
      label: 'Enrolled courses',
    },
    {
      icon: <FiBarChart2 />,
      value: `${learningStats.average}%`,
      label: 'Average progress',
    },
    {
      icon: <FiCheckCircle />,
      value: learningStats.completed,
      label: 'Lessons completed',
    },
    {
      icon: <FiClock />,
      value: learningStats.upcoming,
      label: 'Upcoming tasks',
    },
  ];

  return (
    <main className="my-learning-page" dir="ltr">
      <header className="my-learning-header">
        <div>
          <h1>My learning</h1>

          <p>
            Continue your enrolled courses and keep your
            learning momentum.
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreCourses}
        >
          Explore more courses
        </button>
      </header>

      {error && (
        <section className="my-learning-empty">
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={loadMyCourses}
          >
            Try again
          </button>
        </section>
      )}

      <section
        className="learning-summary-grid"
        aria-label="Learning summary"
      >
        {summaryCards.map((card) => (
          <div
            className="learning-summary-card"
            key={card.label}
          >
            <span className="learning-summary-icon">
              {card.icon}
            </span>

            <div>
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="continue-learning-section">
        <div className="my-learning-section-heading">
          <h2>Continue learning</h2>
          <span>Sorted by enrollment date</span>
        </div>

        <article className="featured-learning-card">
          <button
            type="button"
            className="featured-learning-image"
            onClick={() => openLearning(featured)}
            aria-label={`Continue ${featured.title}`}
          >
            {featured.coverImage ? (
              <img src={featured.coverImage} alt="" />
            ) : (
              <FiBookOpen />
            )}

            <span className="featured-learning-badge">
              Continue where you left off
            </span>
          </button>

          <div className="featured-learning-content">
            <small>{featured.category}</small>

            <h3>
              {featured.shortTitle || featured.title}
            </h3>

            <p>
              {featured.nextLesson
                ? `Next: ${featured.nextLesson.title}${
                    featured.nextLesson.duration
                      ? ` · ${featured.nextLesson.duration}`
                      : ''
                  }`
                : 'All available lessons are complete.'}
            </p>

            <div className="learning-progress-label">
              <span>Course progress</span>
              <strong>{featured.progress}%</strong>
            </div>

            <div className="learning-progress-track">
              <span
                style={{
                  width: `${featured.progress}%`,
                }}
              />
            </div>

            <div className="featured-learning-actions">
              <button
                type="button"
                onClick={() => openLearning(featured)}
              >
                <FiPlay /> Continue course
              </button>

              <span>
                {featured.completedLessons} of{' '}
                {featured.totalLessons} lessons completed
              </span>
            </div>
          </div>
        </article>

        {remaining.length > 0 && (
          <div className="learning-course-grid">
            {remaining.map((course) => (
              <article
                className="learning-course-card"
                key={course.id}
              >
                <button
                  type="button"
                  className="learning-course-image"
                  onClick={() => openLearning(course)}
                  aria-label={`Open ${course.title}`}
                >
                  {course.coverImage ? (
                    <img
                      src={course.coverImage}
                      alt=""
                    />
                  ) : (
                    <FiBookOpen />
                  )}
                </button>

                <div className="learning-course-copy">
                  <div className="learning-course-title-row">
                    <small>{course.category}</small>

                    <button
                      type="button"
                      className="learning-remove-button"
                      onClick={(event) =>
                        handleUnenroll(event, course)
                      }
                      disabled={
                        String(removingCourseId) ===
                        String(course.id)
                      }
                      title="Remove from My Learning"
                      aria-label={`Remove ${course.title} from My Learning`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <h3>
                    {course.shortTitle || course.title}
                  </h3>

                  <p>
                    {course.instructor} · {course.duration}
                  </p>

                  <div className="learning-progress-label">
                    <span>Progress</span>
                    <strong>{course.progress}%</strong>
                  </div>

                  <div className="learning-progress-track">
                    <span
                      style={{
                        width: `${course.progress}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="learning-card-continue"
                    onClick={() => openLearning(course)}
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
        <span>
          <FiCheckCircle />
        </span>

        <div>
          <h2>Your next study goal</h2>

          <p>
            {featured.nextLesson
              ? `Complete “${featured.nextLesson.title}” to move forward in your learning path.`
              : 'Choose another course and keep building your skills.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openLearning(featured)}
        >
          <FiClock /> View course plan
        </button>
      </section>
    </main>
  );
}

export default MyCourses;
