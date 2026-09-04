import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiUsers,
} from 'react-icons/fi';
import { useCourses } from './CoursesContext';
import CourseLearningPage from './CourseLearningPage';
import {
  enrollStudentCourse,
  getStudentCourse,
  getStudentCourses,
} from './api/studentCourses';
import './CoursesCatalog.css';
import './CourseDetails.css';

const studentCount = (value = 0) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(value);
};

const formatCourse = (course) => ({
  id: course.id,
  title: course.title,
  shortTitle: course.title,
  slug: course.slug,
  description: course.description || '',
  tagline: course.description || '',
  heroTitle: course.title,
  category: course.category?.name || 'General',
  categorySlug: course.category?.slug || '',
  instructor: course.instructor?.name || 'Compass Academy instructor',
  instructorTitle: course.instructor?.title || 'Instructor',
  instructorBio: course.instructor?.bio || '',
  level: course.level || 'beginner',
  duration: `${course.duration_weeks || 0} weeks`,
  durationWeeks: Number(course.duration_weeks || 0),
  coverImage: course.cover_image || '',
  rating: Number(course.rating || 0),
  reviews: Number(course.reviews || 0),
  students: Number(course.students || 0),
  lessons: Number(course.lessons || 0),
  assignmentsCount: Number(course.assignments || 0),
  isEnrolled: Boolean(course.is_enrolled),
  enrollmentStatus: course.enrollment_status || null,
  enrolledAt: course.enrolled_at || null,
  whatYouWillLearn: Array.isArray(course.learning_outcomes)
    ? course.learning_outcomes
    : [],
  requirements: Array.isArray(course.requirements)
    ? course.requirements
    : [],
  modules: Array.isArray(course.modules)
    ? course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        position: module.position,
        lessons: Array.isArray(module.lessons)
          ? module.lessons.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description || '',
              content: lesson.description || '',
              type: lesson.type || 'video',
              duration: lesson.duration_minutes
                ? `${lesson.duration_minutes} min`
                : '',
              position: lesson.position,
            }))
          : [],
      }))
    : [],
  resources: Array.isArray(course.resources)
    ? course.resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        url: resource.url || resource.file_url || '',
      }))
    : [],
  assignments: [],
});

function Courses({ initialCourseId, onConsumeInitial }) {
  const { enrollCourse } = useCourses();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [learningCourse, setLearningCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getStudentCourses();

      setCourses(
        Array.isArray(data.courses)
          ? data.courses.map(formatCourse)
          : []
      );

      setCategories(
        Array.isArray(data.categories)
          ? data.categories
          : []
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        'Unable to load courses.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const averageRating = useMemo(() => {
    if (!courses.length) return 0;

    const total = courses.reduce(
      (sum, course) => sum + Number(course.rating || 0),
      0
    );

    return (total / courses.length).toFixed(1);
  }, [courses]);

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = courses.filter((course) => {
      const searchable =
        `${course.title} ${course.category} ${course.instructor}`.toLowerCase();

      const weeks = course.durationWeeks;

      const matchesDuration =
        durationFilter === 'all' ||
        (durationFilter === 'short' && weeks <= 6) ||
        (durationFilter === 'medium' && weeks > 6 && weeks <= 8) ||
        (durationFilter === 'long' && weeks > 8);

      return (
        (activeCategory === 'all' ||
          course.categorySlug === activeCategory) &&
        (levelFilter === 'all' ||
          course.level?.toLowerCase() === levelFilter) &&
        matchesDuration &&
        (!normalizedQuery ||
          searchable.includes(normalizedQuery))
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'rating') {
        return Number(b.rating) - Number(a.rating);
      }

      if (sortBy === 'popular') {
        return Number(b.students) - Number(a.students);
      }

      if (sortBy === 'newest') {
        return Number(b.id) - Number(a.id);
      }

      if (a.isEnrolled !== b.isEnrolled) {
        return a.isEnrolled ? -1 : 1;
      }

      return Number(b.rating) - Number(a.rating);
    });
  }, [
    courses,
    query,
    activeCategory,
    sortBy,
    levelFilter,
    durationFilter,
  ]);

  const hasActiveFilters =
    activeCategory !== 'all' ||
    levelFilter !== 'all' ||
    durationFilter !== 'all' ||
    query.trim().length > 0;

  const clearFilters = () => {
    setQuery('');
    setActiveCategory('all');
    setLevelFilter('all');
    setDurationFilter('all');
  };

  const openCourse = async (course) => {
    try {
      setLoadingCourse(true);
      setError('');

      const data = await getStudentCourse(course.id);
      setSelectedCourse(formatCourse(data.course));

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (requestError) {
      setError(
        requestError.message ||
        'Unable to load course details.'
      );
    } finally {
      setLoadingCourse(false);
    }
  };

  useEffect(() => {
    if (!initialCourseId || loading) return;

    const course = courses.find(
      (item) =>
        String(item.id) === String(initialCourseId)
    );

    if (course) {
      openCourse(course);
    }

    onConsumeInitial?.();
  }, [
    initialCourseId,
    courses,
    loading,
    onConsumeInitial,
  ]);

  if (learningCourse) {
    return (
      <CourseLearningPage
        course={learningCourse}
        onBack={() => setLearningCourse(null)}
      />
    );
  }

  if (selectedCourse) {
    const instructorInitials = selectedCourse.instructor
      ?.split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(-2)
      .toUpperCase();

    const beginLearning = async () => {
      if (selectedCourse.isEnrolled) {
        setLearningCourse(selectedCourse);
        return;
      }

      try {
        setEnrolling(true);
        setError('');

        await enrollStudentCourse(selectedCourse.id);

        const updatedCourse = {
          ...selectedCourse,
          isEnrolled: true,
          enrollmentStatus: 'active',
          enrolledAt: new Date().toISOString(),
        };

        setSelectedCourse(updatedCourse);

        setCourses((current) =>
          current.map((course) =>
            String(course.id) === String(updatedCourse.id)
              ? {
                  ...course,
                  isEnrolled: true,
                  enrollmentStatus: 'active',
                  enrolledAt: updatedCourse.enrolledAt,
                }
              : course
          )
        );

        enrollCourse(updatedCourse);
        setLearningCourse(updatedCourse);
      } catch (requestError) {
        setError(
          requestError.message ||
          'Unable to enroll in this course.'
        );
      } finally {
        setEnrolling(false);
      }
    };

    return (
      <main className="course-details-page" dir="ltr">
        <header className="course-details-header">
          <div className="course-details-breadcrumb">
            <button
              type="button"
              onClick={() => setSelectedCourse(null)}
            >
              <FiArrowLeft />
              Explore courses
            </button>

            <span>/ {selectedCourse.category}</span>
          </div>

          <h1>
            {selectedCourse.shortTitle ||
              selectedCourse.title}
          </h1>

          <p>
            {selectedCourse.tagline ||
              selectedCourse.description}
          </p>
        </header>

        {error && (
          <div className="courses-empty">
            <p>{error}</p>
          </div>
        )}

        <section className="course-details-hero">
          <div className="course-details-image">
            {selectedCourse.coverImage ? (
              <img
                src={selectedCourse.coverImage}
                alt={
                  selectedCourse.shortTitle ||
                  selectedCourse.title
                }
              />
            ) : (
              <FiBookOpen />
            )}
          </div>

          <div className="course-details-summary">
            <span className="course-details-level">
              {selectedCourse.level}
            </span>

            <h2>
              {selectedCourse.heroTitle ||
                selectedCourse.shortTitle ||
                selectedCourse.title}
            </h2>

            <div className="course-details-meta">
              <span>
                <FiClock /> {selectedCourse.duration}
              </span>

              <span>
                <FiBookOpen /> {selectedCourse.lessons} lessons
              </span>

              <span>Self-paced</span>
            </div>

            <div className="course-details-rating">
              <span>
                <FiStar /> {selectedCourse.rating}
              </span>

              <span>
                <FiUsers />{' '}
                {studentCount(selectedCourse.students)} students
              </span>
            </div>

            <div className="course-details-instructor">
              <i>{instructorInitials || 'CA'}</i>

              <div>
                <strong>
                  {selectedCourse.instructor}
                </strong>

                <small>
                  {selectedCourse.instructorTitle ||
                    'Compass Academy instructor'}
                </small>
              </div>
            </div>
          </div>
        </section>

        <div className="course-details-layout">
          <div className="course-details-main">
            <section>
              <h2>About this course</h2>
              <p>{selectedCourse.description}</p>
            </section>

            <section>
              <h2>What you will learn</h2>

              {selectedCourse.whatYouWillLearn.length ? (
                <ul className="course-details-outcomes">
                  {selectedCourse.whatYouWillLearn.map(
                    (item) => (
                      <li key={item}>
                        <span>
                          <FiCheck />
                        </span>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>
                  Learning outcomes will be added soon.
                </p>
              )}
            </section>

            <section>
              <h2>Requirements</h2>

              {selectedCourse.requirements.length ? (
                <ul className="course-details-requirements">
                  {selectedCourse.requirements.map(
                    (item) => (
                      <li key={item}>{item}</li>
                    )
                  )}
                </ul>
              ) : (
                <p>No special requirements.</p>
              )}
            </section>
          </div>

          <aside className="course-details-aside">
            <section className="course-enrollment-card">
              <small>Student access</small>

              <h2>
                Free <span>for Compass students</span>
              </h2>

              <button
                type="button"
                onClick={beginLearning}
                disabled={enrolling}
              >
                {enrolling
                  ? 'Enrolling...'
                  : selectedCourse.isEnrolled
                    ? 'Continue learning'
                    : 'Enroll and start learning'}
              </button>

              <p>
                No payment required · Learn at your pace
              </p>

              <ul>
                <li>
                  <FiCheck /> Full course access
                </li>
                <li>
                  <FiCheck /> Assignments and resources
                </li>
              </ul>
            </section>

            <section className="course-includes-card">
              <h2>Course includes</h2>

              <div>
                <span>
                  {selectedCourse.lessons} focused lessons
                </span>

                <span>
                  {selectedCourse.assignmentsCount} assignments
                </span>

                <span>Downloadable resources</span>
                <span>Certificate</span>
              </div>
            </section>
          </aside>
        </div>

        <button
          type="button"
          className="course-details-back"
          onClick={() => setSelectedCourse(null)}
        >
          <FiArrowLeft />
          Back to all courses
        </button>
      </main>
    );
  }

  return (
    <div className="courses-catalog-page" dir="ltr">
      {/* ============================================
          HERO — replaces the old plain heading row.
          Search now lives inside the hero where it's
          the obvious first action, and the course
          count/rating become real stat chips instead
          of a lone floating <span>.
          ============================================ */}
      <header className="courses-hero">
        <div className="courses-hero-text">
          <span className="courses-hero-eyebrow">
            Course catalog
          </span>

          <h1>Explore courses</h1>

          <p>
            Discover practical courses built around real
            skills, projects, and your academic goals.
          </p>
        </div>

        <label className="courses-hero-search">
          <FiSearch />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search by skill, course, or instructor"
          />
        </label>

        <div className="courses-hero-stats">
          <div>
            <strong>{courses.length}</strong>
            <span>Courses available</span>
          </div>

          <div>
            <strong>
              <FiStar /> {averageRating}
            </strong>
            <span>Average rating</span>
          </div>

          <div className="courses-hero-free">
            <strong>Free</strong>
            <span>For every student</span>
          </div>
        </div>
      </header>

      {/* ============================================
          TOOLBAR — category pills + filter/sort in a
          single row instead of a separate bordered box
          stacked under its own bordered box.
          ============================================ */}
      <div className="courses-toolbar">
        <nav
          className="courses-category-pills"
          aria-label="Course categories"
        >
          <button
            type="button"
            className={
              activeCategory === 'all' ? 'active' : ''
            }
            onClick={() => setActiveCategory('all')}
          >
            All courses
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={
                activeCategory === category.slug
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveCategory(category.slug)
              }
            >
              {category.name}
            </button>
          ))}
        </nav>

        <div className="courses-toolbar-actions">
          <button
            type="button"
            className={`courses-filter-button ${
              showFilters ? 'active' : ''
            }`}
            onClick={() =>
              setShowFilters((current) => !current)
            }
            aria-expanded={showFilters}
            aria-controls="course-filters"
          >
            <FiFilter /> Filters <FiChevronDown />
          </button>

          <label className="courses-sort">
            Sort by:

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
            >
              <option value="recommended">
                Recommended
              </option>
              <option value="rating">
                Top rated
              </option>
              <option value="popular">
                Most popular
              </option>
              <option value="newest">
                Newest
              </option>
            </select>
          </label>
        </div>
      </div>

      {showFilters && (
        <section
          className="courses-filter-panel"
          id="course-filters"
        >
          <label>
            <span>Course level</span>

            <select
              value={levelFilter}
              onChange={(event) =>
                setLevelFilter(event.target.value)
              }
            >
              <option value="all">All levels</option>
              <option value="beginner">
                Beginner
              </option>
              <option value="intermediate">
                Intermediate
              </option>
              <option value="advanced">
                Advanced
              </option>
            </select>
          </label>

          <label>
            <span>Course length</span>

            <select
              value={durationFilter}
              onChange={(event) =>
                setDurationFilter(event.target.value)
              }
            >
              <option value="all">
                Any duration
              </option>
              <option value="short">
                Up to 6 weeks
              </option>
              <option value="medium">
                7–8 weeks
              </option>
              <option value="long">
                9+ weeks
              </option>
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            <FiRefreshCw /> Reset filters
          </button>
        </section>
      )}

      {error && !selectedCourse && (
        <div className="courses-empty">
          <FiBookOpen />
          <h2>Unable to load courses</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={loadCourses}
          >
            Try again
          </button>
        </div>
      )}

      {!error && loading && (
        <div className="courses-empty">
          <FiRefreshCw />
          <h2>Loading courses...</h2>
        </div>
      )}

      {!error &&
        !loading &&
        visibleCourses.length > 0 && (
          <div className="courses-catalog-grid">
            {visibleCourses.map((course, index) => (
              <article
                className="catalog-course-card"
                key={course.id}
              >
                <button
                  type="button"
                  className="catalog-course-image"
                  onClick={() => openCourse(course)}
                  disabled={loadingCourse}
                >
                  {course.coverImage ? (
                    <img
                      src={course.coverImage}
                      alt={course.title}
                    />
                  ) : (
                    <span>
                      <FiBookOpen />
                    </span>
                  )}

                  <em>{course.level}</em>

                  {course.isEnrolled ? (
                    <strong>Enrolled</strong>
                  ) : (
                    index < 2 && (
                      <strong>
                        {index === 0 ? 'Popular' : 'New'}
                      </strong>
                    )
                  )}
                </button>

                <div className="catalog-course-body">
                  <small>{course.category}</small>

                  <h2>{course.title}</h2>

                  <p>{course.instructor}</p>

                  <div className="catalog-course-stats">
                    <span>{course.duration}</span>
                    <span>{course.lessons} lessons</span>

                    <span>
                      <FiStar /> {course.rating}
                    </span>

                    <span>
                      {studentCount(course.students)} students
                    </span>
                  </div>

                  <button
                    type="button"
                    className="catalog-view-course"
                    onClick={() => openCourse(course)}
                    disabled={loadingCourse}
                  >
                    {loadingCourse
                      ? 'Loading...'
                      : 'View course'}{' '}
                    <FiArrowRight />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

      {!error &&
        !loading &&
        visibleCourses.length === 0 && (
          <div className="courses-empty">
            <FiBookOpen />
            <h2>No courses found</h2>

            <p>
              Try another category, level, or search term.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

      {!loading && !error && (
        <footer className="courses-catalog-footer">
          <b>1</b>
          <span>
            Showing all {visibleCourses.length} courses
          </span>
        </footer>
      )}
    </div>
  );
}

export default Courses;
