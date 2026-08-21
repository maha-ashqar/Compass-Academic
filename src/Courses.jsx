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
import { useCoursesCatalog } from './CoursesCatalogContext';
import CourseLearningPage from './CourseLearningPage';
import './Courses.css';
import './CoursesCatalog.css';

const CATEGORIES = [
  { id: 'all', label: 'All courses' },
  { id: 'software', label: 'Software' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'ai', label: 'AI & Data' },
  { id: 'uiux', label: 'UI/UX' },
  { id: 'web', label: 'Web' },
];

const categoryMatches = (course, category) => {
  if (category === 'all') return true;
  const text = `${course.category} ${course.title}`.toLowerCase();
  if (category === 'software') return text.includes('software');
  if (category === 'mobile') return text.includes('flutter') || text.includes('mobile');
  if (category === 'ai') return text.includes('ai') || text.includes('machine');
  if (category === 'uiux') return text.includes('ui/ux') || text.includes('design');
  if (category === 'web') return text.includes('web') || text.includes('full-stack') || text.includes('front-end');
  return true;
};

const studentCount = (value = 0) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(value);
};

function Courses({ initialCourseId, onConsumeInitial }) {
  const { publishedCourses: courses } = useCoursesCatalog();
  const { enrollCourse, isEnrolled } = useCourses();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [learningCourse, setLearningCourse] = useState(null);

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = courses.filter((course) => {
      const searchable = `${course.title} ${course.category} ${course.instructor}`.toLowerCase();
      const weeks = Number.parseInt(course.duration, 10) || 0;
      const matchesDuration =
        durationFilter === 'all' ||
        (durationFilter === 'short' && weeks <= 6) ||
        (durationFilter === 'medium' && weeks > 6 && weeks <= 8) ||
        (durationFilter === 'long' && weeks > 8);

      return (
        categoryMatches(course, activeCategory) &&
        (levelFilter === 'all' ||
          course.level?.toLowerCase() === levelFilter) &&
        matchesDuration &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'rating') return Number(b.rating) - Number(a.rating);
      if (sortBy === 'popular') return Number(b.students) - Number(a.students);
      if (sortBy === 'newest') return Number(b.id) - Number(a.id);
      return Number(b.rating) - Number(a.rating);
    });
  }, [courses, query, activeCategory, sortBy, levelFilter, durationFilter]);

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

  useEffect(() => {
    if (!initialCourseId) return;
    const timer = window.setTimeout(() => {
      const course = courses.find((item) => String(item.id) === String(initialCourseId));
      if (course) {
        isEnrolled(course.id) ? setLearningCourse(course) : setSelectedCourse(course);
      }
      onConsumeInitial?.();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialCourseId, courses, isEnrolled, onConsumeInitial]);

  const openCourse = (course) => {
    isEnrolled(course.id)
      ? setLearningCourse(course)
      : setSelectedCourse(course);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (learningCourse) {
    return (
      <CourseLearningPage
        course={learningCourse}
        onBack={() => setLearningCourse(null)}
      />
    );
  }

  if (selectedCourse) {
    const enrolled = isEnrolled(selectedCourse.id);
    const instructorInitials = selectedCourse.instructor
      ?.split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(-2)
      .toUpperCase();

    const beginLearning = () => {
      if (!enrolled) enrollCourse(selectedCourse);
      setLearningCourse(selectedCourse);
      setSelectedCourse(null);
    };

    return (
      <main className="course-details-page" dir="ltr">
        <header className="course-details-header">
          <div className="course-details-breadcrumb">
            <button type="button" onClick={() => setSelectedCourse(null)}>
              <FiArrowLeft />
              Explore courses
            </button>
            <span>/ {selectedCourse.category}</span>
          </div>

          <h1>{selectedCourse.shortTitle || selectedCourse.title}</h1>
          <p>{selectedCourse.tagline || selectedCourse.description}</p>
        </header>

        <section className="course-details-hero">
          <div className="course-details-image">
            {selectedCourse.coverImage ? (
              <img
                src={selectedCourse.coverImage}
                alt={selectedCourse.shortTitle || selectedCourse.title}
              />
            ) : (
              <FiBookOpen />
            )}
          </div>

          <div className="course-details-summary">
            <span className="course-details-level">{selectedCourse.level}</span>
            <h2>{selectedCourse.heroTitle || selectedCourse.shortTitle || selectedCourse.title}</h2>

            <div className="course-details-meta">
              <span><FiClock /> {selectedCourse.duration}</span>
              <span><FiBookOpen /> {selectedCourse.lessons} lessons</span>
              <span>Self-paced</span>
            </div>

            <div className="course-details-rating">
              <span><FiStar /> {selectedCourse.rating}</span>
              <span><FiUsers /> {studentCount(selectedCourse.students)} students</span>
            </div>

            <div className="course-details-instructor">
              <i>{instructorInitials || 'CA'}</i>
              <div>
                <strong>{selectedCourse.instructor}</strong>
                <small>
                  {selectedCourse.instructorTitle || 'Compass Academy instructor'}
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
              <ul className="course-details-outcomes">
                {(selectedCourse.whatYouWillLearn || []).map((item) => (
                  <li key={item}>
                    <span><FiCheck /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Requirements</h2>
              <ul className="course-details-requirements">
                {(selectedCourse.requirements || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="course-details-aside">
            <section className="course-enrollment-card">
              <small>Student access</small>
              <h2>
                Free <span>for Compass students</span>
              </h2>

              <button type="button" onClick={beginLearning}>
                {enrolled ? 'Continue learning' : 'Enroll and start learning'}
              </button>

              <p>No payment required · Learn at your pace</p>
              <ul>
                <li><FiCheck /> Full course access</li>
                <li><FiCheck /> Assignments and resources</li>
              </ul>
            </section>

            <section className="course-includes-card">
              <h2>Course includes</h2>
              <div>
                <span>{selectedCourse.lessons} focused lessons</span>
                <span>{selectedCourse.assignments?.length || 0} assignments</span>
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
      <header className="courses-catalog-heading">
        <div>
          <h1>Explore courses</h1>
          <p>Discover practical courses built around real skills, projects, and your academic goals.</p>
        </div>
        <span>{courses.length} learning opportunities available</span>
      </header>

      <div className="courses-catalog-tools">
        <label className="courses-search">
          <FiSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by skill, course, or instructor"
          />
        </label>
        <button
          type="button"
          className={`courses-filter-button ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters((current) => !current)}
          aria-expanded={showFilters}
          aria-controls="course-filters"
        >
          <FiFilter /> Filters <FiChevronDown />
        </button>
        <label className="courses-sort">
          Sort by:
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="rating">Top rated</option>
            <option value="popular">Most popular</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>

      {showFilters && (
        <section className="courses-filter-panel" id="course-filters">
          <label>
            <span>Course level</span>
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <option value="all">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>

          <label>
            <span>Course length</span>
            <select
              value={durationFilter}
              onChange={(event) => setDurationFilter(event.target.value)}
            >
              <option value="all">Any duration</option>
              <option value="short">Up to 6 weeks</option>
              <option value="medium">7–8 weeks</option>
              <option value="long">9+ weeks</option>
            </select>
          </label>

          <button type="button" onClick={clearFilters} disabled={!hasActiveFilters}>
            <FiRefreshCw /> Reset filters
          </button>
        </section>
      )}

      <nav className="courses-category-tabs">
        <div>
          {CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.id}
              className={activeCategory === category.id ? 'active' : ''}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
        <span>● <b>Free access for students</b></span>
      </nav>

      {visibleCourses.length ? (
        <div className="courses-catalog-grid">
          {visibleCourses.map((course, index) => (
            <article className="catalog-course-card" key={course.id}>
              <button type="button" className="catalog-course-image" onClick={() => openCourse(course)}>
                {course.coverImage ? (
                  <img src={course.coverImage} alt={course.title} />
                ) : (
                  <span><FiBookOpen /></span>
                )}
                <em>{course.level}</em>
                {index < 2 && <strong>{index === 0 ? 'Popular' : 'New'}</strong>}
              </button>

              <div className="catalog-course-body">
                <small>{course.category}</small>
                <h2>{course.title}</h2>
                <p>{course.instructor}</p>
                <div className="catalog-course-stats">
                  <span>{course.duration}</span>
                  <span>{course.lessons} lessons</span>
                  <span><FiStar /> {course.rating}</span>
                  <span>{studentCount(course.students)} students</span>
                </div>
                <button type="button" className="catalog-view-course" onClick={() => openCourse(course)}>
                  View course <FiArrowRight />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="courses-empty">
          <FiBookOpen />
          <h2>No courses found</h2>
          <p>Try another category, level, or search term.</p>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters}>Clear all filters</button>
          )}
        </div>
      )}

      <footer className="courses-catalog-footer">
        <b>1</b>
        <span>Showing all {visibleCourses.length} courses</span>
      </footer>
    </div>
  );
}

export default Courses;
