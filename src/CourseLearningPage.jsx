import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FiBookmark,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiFileText,
  FiLink,
  FiLock,
  FiPlay,
  FiShare2,
} from 'react-icons/fi';
import {
  getStudentLearningCourse,
  updateStudentLessonBookmark,
  updateStudentLessonProgress,
} from './api/studentLearning';
import './CourseLearningPage.css';

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatLesson = (lesson) => ({
  id: lesson.id,
  title: lesson.title,
  description: lesson.description || '',
  content: lesson.description || '',
  type: lesson.type || 'video',
  contentUrl: lesson.content_url || '',
  durationMinutes: Number(
    lesson.duration_minutes || 0
  ),
  duration: lesson.duration_minutes
    ? `${lesson.duration_minutes} min`
    : '',
  position: lesson.position,
  progressPercentage: Number(
    lesson.progress_percentage || 0
  ),
  isCompleted: Boolean(lesson.is_completed),
  isBookmarked: Boolean(lesson.is_bookmarked),
  startedAt: lesson.started_at || null,
  lastViewedAt: lesson.last_viewed_at || null,
  completedAt: lesson.completed_at || null,
});

const formatLearningCourse = (course) => ({
  id: course.id,
  title: course.title,
  shortTitle: course.title,
  slug: course.slug,
  description: course.description || '',
  level: course.level || 'beginner',
  duration: `${course.duration_weeks || 0} weeks`,
  coverImage: course.cover_image || '',
  category: course.category?.name || 'General',
  instructor:
    course.instructor?.name ||
    'Compass Academy instructor',
  instructorTitle:
    course.instructor?.title || 'Instructor',
  instructorBio: course.instructor?.bio || '',
  enrollment: course.enrollment || null,
  enrolledAt: course.enrollment?.enrolled_at || null,
  progress: Number(course.progress || 0),
  completedLessons: Number(
    course.completed_lessons || 0
  ),
  totalLessons: Number(course.total_lessons || 0),
  nextLesson: course.next_lesson || null,
  whatYouWillLearn: Array.isArray(
    course.learning_outcomes
  )
    ? course.learning_outcomes
    : [],
  requirements: Array.isArray(course.requirements)
    ? course.requirements
    : [],
  resources: Array.isArray(course.resources)
    ? course.resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        url: resource.url || '',
        position: resource.position,
      }))
    : [],
  assignments: Array.isArray(course.assignments)
    ? course.assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || '',
        submissionInstructions:
          assignment.submission_instructions || '',
        maxGrade: assignment.max_grade,
        opensAt: assignment.opens_at || null,
        deadlineAt: assignment.deadline_at || null,
        status: assignment.status,
        submission: assignment.submission || null,
      }))
    : [],
  modules: Array.isArray(course.modules)
    ? course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        position: module.position,
        lessons: Array.isArray(module.lessons)
          ? module.lessons.map(formatLesson)
          : [],
      }))
    : [],
});

const getDaysLeft = (deadlineAt) => {
  if (!deadlineAt) {
    return null;
  }

  const deadline = new Date(deadlineAt);

  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  const difference =
    deadline.getTime() - Date.now();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );
};

const CourseLearningPage = ({ course, onBack }) => {
  const [learningCourse, setLearningCourse] =
    useState(null);
  const [activeTab, setActiveTab] =
    useState('Overview');
  const [activeLessonId, setActiveLessonId] =
    useState(null);
  const [showFullBio, setShowFullBio] =
    useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingLessonId, setSavingLessonId] =
    useState(null);
  const [savingBookmarkId, setSavingBookmarkId] =
    useState(null);
  const [error, setError] = useState('');

  const loadCourse = async () => {
    if (!course?.id) {
      setError('Course not found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getStudentLearningCourse(
        course.id
      );

      const formattedCourse = formatLearningCourse(
        data.course
      );

      setLearningCourse(formattedCourse);

      const firstLesson =
        formattedCourse.modules
          .flatMap((module) => module.lessons)
          .find(
            (lesson) =>
              String(lesson.id) ===
              String(
                formattedCourse.nextLesson?.id
              )
          ) ||
        formattedCourse.modules.flatMap(
          (module) => module.lessons
        )[0] ||
        null;

      setActiveLessonId(firstLesson?.id || null);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load course learning data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [course?.id]);

  const modules = Array.isArray(
    learningCourse?.modules
  )
    ? learningCourse.modules
    : [];

  const assignments = Array.isArray(
    learningCourse?.assignments
  )
    ? learningCourse.assignments
    : [];

  const resources = Array.isArray(
    learningCourse?.resources
  )
    ? learningCourse.resources
    : [];

  const learningOutcomes = Array.isArray(
    learningCourse?.whatYouWillLearn
  )
    ? learningCourse.whatYouWillLearn
    : [];

  const requirements = Array.isArray(
    learningCourse?.requirements
  )
    ? learningCourse.requirements
    : [];

  const flatLessons = useMemo(() => {
    const list = [];

    modules.forEach((module) => {
      (module.lessons || []).forEach((lesson) => {
        list.push({
          ...lesson,
          moduleId: module.id,
          moduleTitle: module.title,
        });
      });
    });

    return list;
  }, [modules]);

  const activeIndex = flatLessons.findIndex(
    (lesson) =>
      String(lesson.id) === String(activeLessonId)
  );

  const activeLesson =
    activeIndex >= 0
      ? flatLessons[activeIndex]
      : null;

  const totalLessons =
    learningCourse?.totalLessons ??
    flatLessons.length;

  const completedCount =
    learningCourse?.completedLessons ??
    flatLessons.filter(
      (lesson) => lesson.isCompleted
    ).length;

  const progress =
    learningCourse?.progress || 0;

  const isUnlocked = (index) => {
    if (
      index < 0 ||
      index >= flatLessons.length
    ) {
      return false;
    }

    if (index === 0) {
      return true;
    }

    return Boolean(
      flatLessons[index - 1].isCompleted
    );
  };

  const handleSelectLesson = (
    lessonId,
    index
  ) => {
    if (!isUnlocked(index)) {
      return;
    }

    setActiveLessonId(lessonId);
    setActiveTab('Lessons');
  };

  const updateLessonLocally = (
    lessonId,
    updates
  ) => {
    setLearningCourse((current) => ({
      ...current,
      modules: current.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) =>
          String(lesson.id) ===
          String(lessonId)
            ? {
                ...lesson,
                ...updates,
              }
            : lesson
        ),
      })),
    }));
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || !learningCourse) {
      return;
    }

    const nextCompletedState =
      !activeLesson.isCompleted;

    try {
      setSavingLessonId(activeLesson.id);
      setError('');

      const data =
        await updateStudentLessonProgress(
          learningCourse.id,
          activeLesson.id,
          nextCompletedState
        );

      updateLessonLocally(activeLesson.id, {
        isCompleted:
          data.lesson_progress.is_completed,
        progressPercentage:
          data.lesson_progress.progress_percentage,
        startedAt:
          data.lesson_progress.started_at,
        lastViewedAt:
          data.lesson_progress.last_viewed_at,
        completedAt:
          data.lesson_progress.completed_at,
      });

      setLearningCourse((current) => ({
        ...current,
        progress:
          data.course_progress.percentage,
        completedLessons:
          data.course_progress.completed_lessons,
        totalLessons:
          data.course_progress.total_lessons,
        nextLesson: data.next_lesson,
      }));
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to update lesson progress.'
      );
    } finally {
      setSavingLessonId(null);
    }
  };

  const handleBookmark = async () => {
    if (!activeLesson || !learningCourse) {
      return;
    }

    const nextBookmarkedState =
      !activeLesson.isBookmarked;

    try {
      setSavingBookmarkId(activeLesson.id);
      setError('');

      const data =
        await updateStudentLessonBookmark(
          learningCourse.id,
          activeLesson.id,
          nextBookmarkedState
        );

      updateLessonLocally(activeLesson.id, {
        isBookmarked: data.is_bookmarked,
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to update bookmark.'
      );
    } finally {
      setSavingBookmarkId(null);
    }
  };

  const goToLesson = (offset) => {
    const nextIndex = activeIndex + offset;

    if (
      nextIndex < 0 ||
      nextIndex >= flatLessons.length
    ) {
      return;
    }

    if (!isUnlocked(nextIndex)) {
      return;
    }

    setActiveLessonId(
      flatLessons[nextIndex].id
    );
  };

  const handleShare = async () => {
    const shareText = `${
      learningCourse?.title || ''
    } — ${activeLesson?.title || ''}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          shareText
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1600);
      }
    } catch {
      setCopied(false);
    }
  };

  const assignmentsWithStatus = useMemo(
    () =>
      assignments
        .map((assignment) => ({
          ...assignment,
          daysLeft: getDaysLeft(
            assignment.deadlineAt
          ),
        }))
        .sort((a, b) => {
          if (a.daysLeft === null) return 1;
          if (b.daysLeft === null) return -1;
          return a.daysLeft - b.daysLeft;
        }),
    [assignments]
  );

  const nextDeadline =
    assignmentsWithStatus.find(
      (assignment) =>
        assignment.daysLeft !== null &&
        assignment.daysLeft >= 0
    ) ||
    assignmentsWithStatus.find(
      (assignment) =>
        assignment.daysLeft !== null
    ) ||
    null;

  const tabs = [
    'Overview',
    'Lessons',
    'Assignments',
    'Resources',
  ];

  if (loading) {
    return (
      <div className="clp-container">
        <div className="clp-content-empty">
          <span className="clp-content-empty-icon">
            <FiFileText />
          </span>

          <h2>Loading course...</h2>
        </div>
      </div>
    );
  }

  if (!learningCourse) {
    return (
      <div className="clp-container">
        <div className="clp-content-empty">
          <span className="clp-content-empty-icon">
            <FiFileText />
          </span>

          <h2>Unable to open this course</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={onBack}
          >
            Back to My Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="clp-container">
      <div className="clp-breadcrumb">
        <button
          type="button"
          className="clp-breadcrumb-link"
          onClick={onBack}
        >
          Courses
        </button>

        <span className="clp-breadcrumb-sep">
          ›
        </span>

        <span>
          {learningCourse.title.length > 40
            ? learningCourse.category
            : learningCourse.title}
        </span>
      </div>

      <div className="clp-header">
        <div>
          <h1 className="clp-title">
            {learningCourse.title.length > 40
              ? learningCourse.category
              : learningCourse.title}
          </h1>

          <p className="clp-subtitle">
            {learningCourse.description}
          </p>
        </div>

        <div className="clp-progress-block">
          <div className="clp-progress-labels">
            <span>Course Progress</span>

            <span className="clp-progress-value">
              {progress}%
            </span>
          </div>

          <div className="clp-progress-bar-bg">
            <div
              className="clp-progress-bar-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="clp-content-empty">
          <p>{error}</p>
        </div>
      )}

      <div className="clp-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            className={`clp-tab ${
              activeTab === tab ? 'active' : ''
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="clp-body">
        <div className="clp-main">
          {activeTab === 'Overview' && (
            <div className="clp-overview">
              <section className="clp-section">
                <h3>About this course</h3>

                <p>
                  {learningCourse.description}
                </p>
              </section>

              <section className="clp-section">
                <h3>What you will learn</h3>

                {learningOutcomes.length > 0 ? (
                  <ul className="clp-check-list">
                    {learningOutcomes.map(
                      (item, index) => (
                        <li key={index}>
                          <span className="clp-check">
                            <FiCheck />
                          </span>{' '}
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    Learning outcomes will be added
                    soon.
                  </p>
                )}
              </section>

              <section className="clp-section">
                <h3>Requirements</h3>

                {requirements.length > 0 ? (
                  <ul className="clp-plain-list">
                    {requirements.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>No special requirements.</p>
                )}
              </section>

              <div className="clp-instructor-card">
                <div className="clp-instructor-avatar">
                  {getInitials(
                    learningCourse.instructor
                  )}
                </div>

                <div className="clp-instructor-info">
                  <span className="clp-instructor-label">
                    INSTRUCTOR
                  </span>

                  <h4>
                    {learningCourse.instructor}
                  </h4>

                  <p>
                    {
                      learningCourse.instructorTitle
                    }
                  </p>

                  {showFullBio &&
                    learningCourse.instructorBio && (
                      <p className="clp-instructor-bio">
                        {
                          learningCourse.instructorBio
                        }
                      </p>
                    )}

                  {learningCourse.instructorBio && (
                    <button
                      type="button"
                      className="clp-view-profile-btn"
                      onClick={() =>
                        setShowFullBio(
                          (current) => !current
                        )
                      }
                    >
                      {showFullBio
                        ? 'Hide Bio'
                        : 'View Profile'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Lessons' &&
            activeLesson && (
              <div className="clp-lesson">
                <div className="clp-lesson-badge">
                  {activeLesson.moduleTitle} ·
                  Lesson {activeIndex + 1}
                </div>

                <div className="clp-lesson-title-row">
                  <h2>{activeLesson.title}</h2>

                  <div className="clp-lesson-actions">
                    <button
                      type="button"
                      className={`clp-icon-btn ${
                        activeLesson.isBookmarked
                          ? 'active'
                          : ''
                      }`}
                      onClick={handleBookmark}
                      disabled={
                        String(savingBookmarkId) ===
                        String(activeLesson.id)
                      }
                      title="Bookmark"
                      aria-label="Bookmark this lesson"
                    >
                      <FiBookmark />
                    </button>

                    <button
                      type="button"
                      className="clp-icon-btn"
                      onClick={handleShare}
                      title="Share"
                      aria-label="Share this lesson"
                    >
                      {copied ? (
                        <FiCheck />
                      ) : (
                        <FiShare2 />
                      )}
                    </button>
                  </div>
                </div>

                {activeLesson.duration && (
                  <span className="clp-lesson-duration">
                    <FiClock />{' '}
                    {activeLesson.duration}
                  </span>
                )}

                <p className="clp-lesson-content">
                  {activeLesson.content ||
                    'Lesson content will be added soon.'}
                </p>

                {activeLesson.contentUrl && (
                  <button
                    type="button"
                    className="clp-view-profile-btn"
                    onClick={() =>
                      window.open(
                        activeLesson.contentUrl,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    Open lesson content
                  </button>
                )}

                <div className="clp-instructor-card small">
                  <div className="clp-instructor-avatar">
                    {getInitials(
                      learningCourse.instructor
                    )}
                  </div>

                  <div className="clp-instructor-info">
                    <span className="clp-instructor-label">
                      INSTRUCTOR
                    </span>

                    <h4>
                      {learningCourse.instructor}
                    </h4>

                    <p>
                      {
                        learningCourse.instructorTitle
                      }
                    </p>
                  </div>
                </div>

                <div className="clp-lesson-nav">
                  <button
                    type="button"
                    className="clp-nav-btn"
                    onClick={() => goToLesson(-1)}
                    disabled={activeIndex === 0}
                  >
                    <FiChevronLeft /> Previous
                  </button>

                  <button
                    type="button"
                    className={`clp-complete-btn ${
                      activeLesson.isCompleted
                        ? 'done'
                        : ''
                    }`}
                    onClick={handleMarkComplete}
                    disabled={
                      String(savingLessonId) ===
                      String(activeLesson.id)
                    }
                  >
                    {String(savingLessonId) ===
                    String(activeLesson.id) ? (
                      'Saving...'
                    ) : activeLesson.isCompleted ? (
                      <>
                        <FiCheck /> Completed
                      </>
                    ) : (
                      'Mark as Complete'
                    )}
                  </button>

                  <button
                    type="button"
                    className="clp-nav-btn"
                    onClick={() => goToLesson(1)}
                    disabled={
                      activeIndex ===
                        flatLessons.length - 1 ||
                      !isUnlocked(activeIndex + 1)
                    }
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              </div>
            )}

          {activeTab === 'Lessons' &&
            !activeLesson && (
              <div className="clp-content-empty">
                <span className="clp-content-empty-icon">
                  <FiFileText />
                </span>

                <h2>
                  Course content is being prepared
                </h2>

                <p>
                  This course is enrolled successfully,
                  but no lessons have been published
                  yet.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab('Overview')
                  }
                >
                  View course overview
                </button>
              </div>
            )}

          {activeTab === 'Assignments' && (
            <div className="clp-assignments">
              {assignmentsWithStatus.map(
                (assignment) => (
                  <div
                    key={assignment.id}
                    className="clp-assignment-card"
                  >
                    <div className="clp-assignment-top">
                      <h4>{assignment.title}</h4>

                      <span
                        className={`clp-assignment-badge ${
                          assignment.daysLeft ===
                          null
                            ? 'upcoming'
                            : assignment.daysLeft < 0
                              ? 'overdue'
                              : assignment.daysLeft <=
                                  2
                                ? 'soon'
                                : 'upcoming'
                        }`}
                      >
                        {assignment.daysLeft ===
                        null
                          ? 'No deadline'
                          : assignment.daysLeft < 0
                            ? 'Overdue'
                            : assignment.daysLeft === 0
                              ? 'Due today'
                              : `In ${assignment.daysLeft} day${
                                  assignment.daysLeft >
                                  1
                                    ? 's'
                                    : ''
                                }`}
                      </span>
                    </div>

                    <p>
                      {assignment.description ||
                        'No description.'}
                    </p>

                    {assignment.submission && (
                      <p>
                        Submission:{' '}
                        {
                          assignment.submission
                            .status
                        }
                      </p>
                    )}
                  </div>
                )
              )}

              {assignmentsWithStatus.length ===
                0 && (
                <p className="clp-empty-note">
                  No assignments for this course yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'Resources' && (
            <div className="clp-resources">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="clp-resource-card"
                >
                  <span className="clp-resource-icon">
                    {resource.type === 'document' ||
                    resource.type === 'file' ? (
                      <FiFileText />
                    ) : (
                      <FiLink />
                    )}
                  </span>

                  <span className="clp-resource-title">
                    {resource.title}
                  </span>

                  <button
                    type="button"
                    className="clp-resource-open"
                    onClick={() =>
                      resource.url &&
                      window.open(
                        resource.url,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                    disabled={!resource.url}
                  >
                    Open
                  </button>
                </div>
              ))}

              {resources.length === 0 && (
                <p className="clp-empty-note">
                  No resources added for this course
                  yet.
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="clp-aside">
          <div className="clp-modules-card">
            <div className="clp-modules-header">
              <span>COURSE MODULES</span>

              <span className="clp-modules-count">
                {completedCount} / {totalLessons}{' '}
                Complete
              </span>
            </div>

            <div className="clp-modules-list">
              {modules.map(
                (module, moduleIndex) => {
                  const moduleLessons =
                    module.lessons || [];

                  const moduleDoneCount =
                    moduleLessons.filter(
                      (lesson) =>
                        lesson.isCompleted
                    ).length;

                  const moduleComplete =
                    moduleLessons.length > 0 &&
                    moduleDoneCount ===
                      moduleLessons.length;

                  return (
                    <div
                      key={module.id}
                      className="clp-module-block"
                    >
                      <div
                        className={`clp-module-title-row ${
                          moduleComplete
                            ? 'complete'
                            : ''
                        }`}
                      >
                        <span className="clp-module-number">
                          {moduleComplete ? (
                            <FiCheck />
                          ) : (
                            moduleIndex + 1
                          )}
                        </span>

                        <span>{module.title}</span>
                      </div>

                      <div className="clp-module-lessons">
                        {moduleLessons.map(
                          (lesson) => {
                            const flatIndex =
                              flatLessons.findIndex(
                                (item) =>
                                  String(
                                    item.id
                                  ) ===
                                  String(
                                    lesson.id
                                  )
                              );

                            const done =
                              lesson.isCompleted;

                            const unlocked =
                              isUnlocked(flatIndex);

                            const current =
                              String(lesson.id) ===
                              String(
                                activeLessonId
                              );

                            return (
                              <button
                                type="button"
                                key={lesson.id}
                                className={`clp-module-lesson ${
                                  done
                                    ? 'done'
                                    : ''
                                } ${
                                  current
                                    ? 'current'
                                    : ''
                                } ${
                                  !unlocked
                                    ? 'locked'
                                    : ''
                                }`}
                                onClick={() =>
                                  handleSelectLesson(
                                    lesson.id,
                                    flatIndex
                                  )
                                }
                                disabled={!unlocked}
                              >
                                <span>
                                  {lesson.title}
                                </span>

                                <span className="clp-lesson-status-icon">
                                  {done ? (
                                    <FiCheck />
                                  ) : current ? (
                                    <FiPlay />
                                  ) : unlocked ? (
                                    ''
                                  ) : (
                                    <FiLock />
                                  )}
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              {modules.length === 0 && (
                <p className="clp-empty-note">
                  Course lessons are being prepared.
                </p>
              )}
            </div>
          </div>

          {nextDeadline && (
            <div className="clp-deadline-card">
              <span className="clp-deadline-label">
                <FiClipboard /> NEXT DEADLINE
              </span>

              <h4>{nextDeadline.title}</h4>

              <div className="clp-deadline-footer">
                <span>
                  {nextDeadline.daysLeft === null
                    ? 'No deadline'
                    : nextDeadline.daysLeft < 0
                      ? 'Overdue'
                      : nextDeadline.daysLeft === 0
                        ? 'Due today'
                        : `In ${
                            nextDeadline.daysLeft
                          } day${
                            nextDeadline.daysLeft >
                            1
                              ? 's'
                              : ''
                          }`}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab('Assignments')
                  }
                >
                  View
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CourseLearningPage;
