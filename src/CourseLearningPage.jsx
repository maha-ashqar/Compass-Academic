import { useState, useMemo } from 'react';
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
import { useCourses } from './CoursesContext';
import './CourseLearningPage.css';

const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const CourseLearningPage = ({ course, onBack }) => {
  const {
    isLessonComplete,
    toggleLessonComplete,
    getCourseProgress,
    isBookmarked,
    toggleBookmark,
  } = useCourses();

  // افتح النظرة العامة أولاً حتى لا تظهر صفحة فارغة للكورسات الجديدة
  // التي لم يضف المدرب دروسها بعد.
  const [activeTab, setActiveTab] = useState('Overview');
  const [showFullBio, setShowFullBio] = useState(false);
  const [copied, setCopied] = useState(false);

  const modules = Array.isArray(course?.modules) ? course.modules : [];
  const assignments = Array.isArray(course?.assignments) ? course.assignments : [];
  const resources = Array.isArray(course?.resources) ? course.resources : [];
  const learningOutcomes = Array.isArray(course?.whatYouWillLearn)
    ? course.whatYouWillLearn
    : [];
  const requirements = Array.isArray(course?.requirements) ? course.requirements : [];

  // تسطيح كل الدروس بترتيبها عبر الموديولات، عشان نعرف أي درس "قبل" أي درس
  const flatLessons = useMemo(() => {
    const list = [];
    modules.forEach((mod) => {
      (mod.lessons || []).forEach((lesson) => list.push({ ...lesson, moduleId: mod.id, moduleTitle: mod.title }));
    });
    return list;
  }, [modules]);

  const [activeLessonId, setActiveLessonId] = useState(flatLessons[0]?.id);

  const totalLessons = flatLessons.length;
  const progress = getCourseProgress(course.id, totalLessons);
  const completedCount = flatLessons.filter((l) => isLessonComplete(course.id, l.id)).length;

  const activeIndex = flatLessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = flatLessons[activeIndex];

  const isUnlocked = (index) => {
    if (index < 0 || index >= flatLessons.length) return false;
    if (index === 0) return true;
    return isLessonComplete(course.id, flatLessons[index - 1].id);
  };

  const handleSelectLesson = (lessonId, index) => {
    if (!isUnlocked(index)) return;
    setActiveLessonId(lessonId);
    setActiveTab('Lessons');
  };

  const handleMarkComplete = () => {
    if (!activeLesson) return;
    toggleLessonComplete(course.id, activeLesson.id);
  };

  const goToLesson = (offset) => {
    const nextIndex = activeIndex + offset;
    if (nextIndex < 0 || nextIndex >= flatLessons.length) return;
    if (!isUnlocked(nextIndex)) return;
    setActiveLessonId(flatLessons[nextIndex].id);
  };

  const handleShare = () => {
    const shareText = `${course.title} — ${activeLesson?.title || ''}`;
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  const daysSinceEnrollment = course.enrolledAt
    ? Math.floor((Date.now() - new Date(course.enrolledAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const assignmentsWithStatus = assignments
    .map((a) => ({ ...a, daysLeft: a.dueInDays - daysSinceEnrollment }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const nextDeadline = assignmentsWithStatus.find((a) => a.daysLeft >= 0) || assignmentsWithStatus[0];

  const tabs = ['Overview', 'Lessons', 'Assignments', 'Resources'];

  return (
    <div className="clp-container">
      {/* ===== Breadcrumb + عنوان + تقدم ===== */}
      <div className="clp-breadcrumb">
        {/* FIXED: was a <span onClick=...>, not reachable by keyboard or
            announced as interactive to screen readers. */}
        <button type="button" className="clp-breadcrumb-link" onClick={onBack}>
          Courses
        </button>
        <span className="clp-breadcrumb-sep">›</span>
        <span>{course.title.length > 40 ? course.category : course.title}</span>
      </div>

      <div className="clp-header">
        <div>
          <h1 className="clp-title">{course.title.length > 40 ? course.category : course.title}</h1>
          <p className="clp-subtitle">{course.description}</p>
        </div>

        <div className="clp-progress-block">
          <div className="clp-progress-labels">
            <span>Course Progress</span>
            <span className="clp-progress-value">{progress}%</span>
          </div>
          <div className="clp-progress-bar-bg">
            <div className="clp-progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ===== التبويبات ===== */}
      <div className="clp-tabs">
        {tabs.map((tab) => (
          // FIXED: was a <span onClick=...> per tab — same accessibility gap
          // as the breadcrumb above.
          <button
            type="button"
            key={tab}
            className={`clp-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="clp-body">
        {/* ===== المحتوى الرئيسي ===== */}
        <div className="clp-main">
          {activeTab === 'Overview' && (
            <div className="clp-overview">
              <section className="clp-section">
                <h3>About this course</h3>
                <p>{course.description}</p>
              </section>

              <section className="clp-section">
                <h3>What you will learn</h3>
                <ul className="clp-check-list">
                  {learningOutcomes.map((item, i) => (
                    <li key={i}><span className="clp-check"><FiCheck /></span> {item}</li>
                  ))}
                </ul>
              </section>

              <section className="clp-section">
                <h3>Requirements</h3>
                <ul className="clp-plain-list">
                  {requirements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <div className="clp-instructor-card">
                <div className="clp-instructor-avatar">{getInitials(course.instructor)}</div>
                <div className="clp-instructor-info">
                  <span className="clp-instructor-label">INSTRUCTOR</span>
                  <h4>{course.instructor}</h4>
                  <p>{course.instructorTitle}</p>
                  {showFullBio && <p className="clp-instructor-bio">{course.instructorBio}</p>}
                  <button className="clp-view-profile-btn" onClick={() => setShowFullBio((p) => !p)}>
                    {showFullBio ? 'Hide Bio' : 'View Profile'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Lessons' && activeLesson && (
            <div className="clp-lesson">
              <div className="clp-lesson-badge">
                {activeLesson.moduleTitle} · Lesson {activeIndex + 1}
              </div>

              <div className="clp-lesson-title-row">
                <h2>{activeLesson.title}</h2>
                <div className="clp-lesson-actions">
                  <button
                    className={`clp-icon-btn ${isBookmarked(course.id, activeLesson.id) ? 'active' : ''}`}
                    onClick={() => toggleBookmark(course.id, activeLesson.id)}
                    title="Bookmark"
                    aria-label="Bookmark this lesson"
                  >
                    <FiBookmark />
                  </button>
                  <button className="clp-icon-btn" onClick={handleShare} title="Share" aria-label="Share this lesson">
                    {copied ? <FiCheck /> : <FiShare2 />}
                  </button>
                </div>
              </div>

              <span className="clp-lesson-duration"><FiClock /> {activeLesson.duration}</span>

              <p className="clp-lesson-content">{activeLesson.content}</p>

              {activeLesson.keyPoints?.length > 0 && (
                <div className="clp-keypoints">
                  <h4>Key concepts we cover today</h4>
                  <ul>
                    {(activeLesson.keyPoints || []).map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="clp-instructor-card small">
                <div className="clp-instructor-avatar">{getInitials(course.instructor)}</div>
                <div className="clp-instructor-info">
                  <span className="clp-instructor-label">INSTRUCTOR</span>
                  <h4>{course.instructor}</h4>
                  <p>{course.instructorTitle}</p>
                </div>
              </div>

              <div className="clp-lesson-nav">
                <button
                  className="clp-nav-btn"
                  onClick={() => goToLesson(-1)}
                  disabled={activeIndex === 0}
                >
                  <FiChevronLeft /> Previous
                </button>

                <button
                  className={`clp-complete-btn ${isLessonComplete(course.id, activeLesson.id) ? 'done' : ''}`}
                  onClick={handleMarkComplete}
                >
                  {isLessonComplete(course.id, activeLesson.id) ? (
                    <>
                      <FiCheck /> Completed
                    </>
                  ) : (
                    'Mark as Complete'
                  )}
                </button>

                <button
                  className="clp-nav-btn"
                  onClick={() => goToLesson(1)}
                  disabled={activeIndex === flatLessons.length - 1 || !isUnlocked(activeIndex + 1)}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Lessons' && !activeLesson && (
            <div className="clp-content-empty">
              <span className="clp-content-empty-icon"><FiFileText /></span>
              <h2>Course content is being prepared</h2>
              <p>This course is enrolled successfully, but no lessons have been published yet.</p>
              <button type="button" onClick={() => setActiveTab('Overview')}>
                View course overview
              </button>
            </div>
          )}

          {activeTab === 'Assignments' && (
            <div className="clp-assignments">
              {assignmentsWithStatus.map((a) => (
                <div key={a.id} className="clp-assignment-card">
                  <div className="clp-assignment-top">
                    <h4>{a.title}</h4>
                    <span
                      className={`clp-assignment-badge ${
                        a.daysLeft < 0 ? 'overdue' : a.daysLeft <= 2 ? 'soon' : 'upcoming'
                      }`}
                    >
                      {a.daysLeft < 0
                        ? 'Overdue'
                        : a.daysLeft === 0
                        ? 'Due today'
                        : `In ${a.daysLeft} day${a.daysLeft > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p>{a.description}</p>
                </div>
              ))}
              {assignmentsWithStatus.length === 0 && (
                <p className="clp-empty-note">No assignments for this course yet.</p>
              )}
            </div>
          )}

          {activeTab === 'Resources' && (
            <div className="clp-resources">
              {resources.map((r) => (
                <div key={r.id} className="clp-resource-card">
                  <span className="clp-resource-icon">{r.type === 'pdf' ? <FiFileText /> : <FiLink />}</span>
                  <span className="clp-resource-title">{r.title}</span>
                  <button className="clp-resource-open" onClick={() => window.open(r.url, '_blank')}>
                    Open
                  </button>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="clp-empty-note">No resources added for this course yet.</p>
              )}
            </div>
          )}
        </div>

        {/* ===== الشريط الجانبي: الموديولات + الموعد النهائي ===== */}
        <aside className="clp-aside">
          <div className="clp-modules-card">
            <div className="clp-modules-header">
              <span>COURSE MODULES</span>
              <span className="clp-modules-count">{completedCount} / {totalLessons} Complete</span>
            </div>

            <div className="clp-modules-list">
              {modules.map((mod, modIndex) => {
                const modLessons = mod.lessons || [];
                const modDoneCount = modLessons.filter((l) => isLessonComplete(course.id, l.id)).length;
                const modComplete = modLessons.length > 0 && modDoneCount === modLessons.length;

                return (
                  <div key={mod.id} className="clp-module-block">
                    <div className={`clp-module-title-row ${modComplete ? 'complete' : ''}`}>
                      <span className="clp-module-number">
                        {modComplete ? <FiCheck /> : modIndex + 1}
                      </span>
                      <span>{mod.title}</span>
                    </div>

                    <div className="clp-module-lessons">
                      {modLessons.map((lesson) => {
                        const flatIndex = flatLessons.findIndex((l) => l.id === lesson.id);
                        const done = isLessonComplete(course.id, lesson.id);
                        const unlocked = isUnlocked(flatIndex);
                        const current = lesson.id === activeLessonId;

                        return (
                          // FIXED: was a <div onClick=...> — not focusable or
                          // keyboard-operable. Locked lessons now also expose
                          // that state via `disabled` instead of only color.
                          <button
                            type="button"
                            key={lesson.id}
                            className={`clp-module-lesson ${done ? 'done' : ''} ${current ? 'current' : ''} ${!unlocked ? 'locked' : ''}`}
                            onClick={() => handleSelectLesson(lesson.id, flatIndex)}
                            disabled={!unlocked}
                          >
                            <span>{lesson.title}</span>
                            <span className="clp-lesson-status-icon">
                              {done ? <FiCheck /> : current ? <FiPlay /> : unlocked ? '' : <FiLock />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {modules.length === 0 && (
                <p className="clp-empty-note">Course lessons are being prepared.</p>
              )}
            </div>
          </div>

          {nextDeadline && (
            <div className="clp-deadline-card">
              <span className="clp-deadline-label"><FiClipboard /> NEXT DEADLINE</span>
              <h4>{nextDeadline.title}</h4>
              <div className="clp-deadline-footer">
                <span>
                  {nextDeadline.daysLeft < 0
                    ? 'Overdue'
                    : nextDeadline.daysLeft === 0
                    ? 'Due today'
                    : `In ${nextDeadline.daysLeft} day${nextDeadline.daysLeft > 1 ? 's' : ''}`}
                </span>
                <button onClick={() => setActiveTab('Assignments')}>View</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CourseLearningPage;
