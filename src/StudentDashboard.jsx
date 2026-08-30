import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StudentDashboard.css';
import {
  FiBookOpen, FiAward, FiFileText,
  FiSearch, FiBell, FiMessageSquare, FiBriefcase, FiTarget,
  FiBarChart2, FiCode,  FiPlay,
  FiClock, FiStar, FiChevronRight, FiChevronDown, FiPenTool,
  FiUser, FiSettings, FiLogOut, FiCheckCircle,
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import { menuItems } from './menuItems';
import StudentProfile from './StudentProfile';
import Courses from './Courses';
import MyCourses from './MyCourses';
import Assignments from './Assignments';
import { useCourses } from './CoursesContext';
import { useCoursesCatalog } from './CoursesCatalogContext';
import { useDeadlines } from './DeadlinesContext';
import Settings from './Settings';
import Messages from './Messages';
import { useStudentConversations } from './SharedConversationsContext';
import Notifications from './Notifications';
import Competitions from './Competitions';
import StudentProjects from './StudentProjects';
import StudentAnnouncement from './StudentAnnouncement';
import Achievements from './Achievements';
import { useNotifications } from './NotificationsContext';

const deadlineIconMap = {
  priority: { icon: <FiFileText />, cls: 'red-icon', label: 'Priority' },
  event: { icon: <FiTarget />, cls: 'blue-icon', label: 'Event' },
  research: { icon: <FiBookOpen />, cls: 'orange-icon', label: 'Research' },
  practical: { icon: <FiBriefcase />, cls: 'purple-icon', label: 'Practical' },
};

const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysUntil = (isoDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

// urgency -> which "opportunity" color variant to use (matches the 3 tones
// already defined in CSS: default = red/urgent, opportunity-2 = orange/soon,
// opportunity-3 = blue/relaxed)
const urgencyVariant = (days) => {
  if (days <= 2) return { cardCls: '', statusText: days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''}` };
  if (days <= 6) return { cardCls: 'opportunity-2', statusText: `${days} days` };
  return { cardCls: 'opportunity-3', statusText: `${days} days` };
};

const levelBadgeClass = (level) => `level-badge level-${(level || 'beginner').toLowerCase()}`;

const studentCountLabel = (value = 0) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(value);
};

const StudentDashboard = ({ studentData, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.startsWith('/student-dashboard/announcements/')
      ? 'Announcement detail'
      : location.pathname.startsWith('/student-dashboard/projects')
      ? 'Projects gallery'
      : location.state?.activeTab || 'Home'
  );
  const isProjectsRoute = location.pathname.startsWith('/student-dashboard/projects');

  const handleSidebarSelect = (tab) => {
    setActiveTab(tab);
    if (tab === 'Projects gallery') navigate('/student-dashboard/projects');
    else if (isProjectsRoute) navigate('/student-dashboard');
  };

  const {
    myCourses, getCourseProgress, getCompletedLessonCount, getNextLesson,
  } = useCourses();
  const { publishedCourses } = useCoursesCatalog();
  const { deadlines, removeDeadline } = useDeadlines();
  // FIXED: this used to read from a MessagesContext seeded with its own
  // fake instructor list, disconnected from whatever the trainer side saw.
  // Now it reads this student's slice of the single shared conversation
  // store, so the preview here always matches what's really in their inbox.
  const { conversations: studentConversations } = useStudentConversations(studentData);
  const conversations = useMemo(
    () => studentConversations.map((c) => ({
      id: c.id,
      name: c.contact?.name || 'Instructor',
      avatar: c.contact?.avatar || '',
      messages: c.messages,
    })),
    [studentConversations]
  );

  // ============ البحث ============
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [openCourseId, setOpenCourseId] = useState(null);
  const searchRef = useRef(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { courses: [], pages: [] };
    const q = searchQuery.toLowerCase();

    const courses = publishedCourses
      .filter((c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      .slice(0, 4);

    const pages = menuItems
      .filter((m) => m.label.toLowerCase().includes(q) && m.id !== 'Home')
      .slice(0, 3);

    return { courses, pages };
  }, [searchQuery, publishedCourses]);

  // ============ الكورسات المقترحة — من نفس كتالوج صفحة Courses ============
  const recommendedCourses = useMemo(() => {
    const enrolledIds = myCourses.map((c) => String(c.id));
    return publishedCourses.filter((c) => !enrolledIds.includes(String(c.id))).slice(0, 3);
  }, [myCourses, publishedCourses]);

  const handleSelectCourseResult = (course) => {
    setOpenCourseId(course.id);
    setActiveTab('Courses');
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSelectPageResult = (pageId) => {
    setActiveTab(pageId);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ Current learning path — كورس حقيقي من اللي مسجّلة فيه ============
  const currentLearningCourse = useMemo(() => {
    if (myCourses.length === 0) return null;
    const withProgress = myCourses.map((c) => {
      const totalLessons = (c.modules || []).reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
      return { ...c, totalLessons, progress: getCourseProgress(c.id, totalLessons) };
    });
    const inProgress = withProgress.filter((c) => c.progress < 100).sort((a, b) => b.progress - a.progress);
    return inProgress[0] || withProgress[0];
  }, [myCourses, getCourseProgress]);

  const completedLessonCount = currentLearningCourse
    ? getCompletedLessonCount(currentLearningCourse.id)
    : 0;

  // FIXED: this used to be a useMemo that always returned 0 (it ended in
  // `&& false`), and the render below had a *second*, equally broken copy of
  // the same calculation — which, because `[].every(...)` is vacuously true,
  // actually counted modules with zero lessons as "completed". Neither
  // number was real. Module-level completion isn't tracked anywhere in this
  // app yet, so rather than fake it we just show the honest lesson count
  // (completedLessonCount / totalLessons) computed from real data below.

  const nextLesson = currentLearningCourse ? getNextLesson(currentLearningCourse) : null;

  const nextMilestone = useMemo(() => {
    if (!currentLearningCourse) return null;
    const daysSinceEnrollment = currentLearningCourse.enrolledAt
      ? Math.floor((Date.now() - new Date(currentLearningCourse.enrolledAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const withStatus = (currentLearningCourse.assignments || [])
      .map((a) => ({ ...a, daysLeft: a.dueInDays - daysSinceEnrollment }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
    return withStatus.find((a) => a.daysLeft >= 0) || withStatus[0] || null;
  }, [currentLearningCourse]);

  const handleResumeCourse = () => {
    if (currentLearningCourse) handleSelectCourseResult(currentLearningCourse);
  };

  // ============ الإشعارات ============
  const { notifications, markAsRead, markAllRead, unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    if (n.actionPath) {
      navigate(n.actionPath);
      setActiveTab('Announcement detail');
      setShowNotifications(false);
    } else if (n.actionTab) {
      setActiveTab(n.actionTab);
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ معاينة الرسائل ============
  const [showMessagesPreview, setShowMessagesPreview] = useState(false);
  const mailRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mailRef.current && !mailRef.current.contains(e.target)) {
        setShowMessagesPreview(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPersonInitials = (name) =>
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const openConversationFromPreview = () => {
    setActiveTab('Messages');
    setShowMessagesPreview(false);
  };

  // ============ قائمة المستخدم ============
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FIXED (polish): none of the four header dropdowns (search results,
  // notifications, messages preview, user menu) could be dismissed with the
  // keyboard — only a mouse click outside closed them. Escape now closes
  // whichever one is open.
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      setShowSearchResults(false);
      setShowNotifications(false);
      setShowMessagesPreview(false);
      setShowUserMenu(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  // ============ المواعيد النهائية مرتبة حسب الإلحاح ============
  const sortedDeadlines = useMemo(
    () => [...deadlines].sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).slice(0, 3),
    [deadlines]
  );

  const nearestDeadlineDays = sortedDeadlines[0] ? daysUntil(sortedDeadlines[0].date) : null;

  return (
    <div className="dashboard-container">
      <Sidebar
        activeTab={activeTab}
        onSelect={handleSidebarSelect}
        onLogout={handleLogoutClick}
        studentData={studentData}
      />

      <main className="main-viewport">
        <header className="student-dashboard-header">
          {/* ============ البحث ============ */}
          <div className="dashboard-search" ref={searchRef}>
            <FiSearch className="dashboard-search-icon" />
            <input
              type="text"
              placeholder="Search your courses, tasks, or projects"
              aria-label="Search your courses, tasks, or projects"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
            />

            {showSearchResults && searchQuery.trim() && (
              <div className="dashboard-search-results">
                {searchResults.courses.length === 0 && searchResults.pages.length === 0 ? (
                  <p className="dashboard-search-empty">No results found</p>
                ) : (
                  <>
                    {searchResults.courses.length > 0 && (
                      <div className="dashboard-search-group">
                        <span className="dashboard-search-label">Courses</span>
                        {searchResults.courses.map((course) => (
                          <button
                            type="button"
                            key={course.id}
                            className="dashboard-search-item"
                            onClick={() => handleSelectCourseResult(course)}
                          >
                            <FiBookOpen />
                            <span>
                              <strong>{course.title}</strong>
                              <small>{course.category}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.pages.length > 0 && (
                      <div className="dashboard-search-group">
                        <span className="dashboard-search-label">Pages</span>
                        {searchResults.pages.map((page) => (
                          <button
                            type="button"
                            key={page.id}
                            className="dashboard-search-item"
                            onClick={() => handleSelectPageResult(page.id)}
                          >
                            <page.icon />
                            <span><strong>{page.label}</strong></span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="dashboard-header-actions">
            {/* ============ الإشعارات ============ */}
            <div className="dashboard-dropdown-wrapper" ref={notifRef}>
              <button
                type="button"
                className="dashboard-header-icon"
                onClick={() => setShowNotifications((p) => !p)}
                aria-label="Notifications"
              >
                <FiBell />
                {unreadCount > 0 && <span className="dashboard-notification-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="dashboard-search-results dashboard-dropdown-right">
                  <div className="dashboard-dropdown-head">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      // FIXED: was a <span onClick=...> — not keyboard
                      // reachable or announced as interactive. Now a real
                      // button; the shared button CSS reset keeps it looking
                      // identical.
                      <button type="button" className="dashboard-mark-all" onClick={markAllRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="dashboard-search-empty">No notifications</p>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <button
                        type="button"
                        key={n.id}
                        className="dashboard-search-item"
                        onClick={() => handleNotificationClick(n)}
                      >
                        <span>{n.icon}</span>
                        <span>
                          <strong>{n.title}</strong>
                          <small>{n.text}</small>
                        </span>
                        {!n.read && <span className="dashboard-unread-dot" />}
                      </button>
                    ))
                  )}
                  {/* FIXED: was a <div onClick=...> — same accessibility gap
                      as "Mark all as read" above. */}
                  <button
                    type="button"
                    className="dashboard-dropdown-foot"
                    onClick={() => { setActiveTab('Notifications'); setShowNotifications(false); }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            {/* ============ معاينة الرسائل ============ */}
            <div className="dashboard-dropdown-wrapper" ref={mailRef}>
              <button
                type="button"
                className="dashboard-header-icon"
                onClick={() => setShowMessagesPreview((p) => !p)}
                aria-label="Messages"
              >
                <FiMessageSquare />
              </button>

              {showMessagesPreview && (
                <div className="dashboard-search-results dashboard-dropdown-right">
                  <div className="dashboard-dropdown-head">
                    <h4>Messages</h4>
                    <button type="button" className="dashboard-mark-all" onClick={openConversationFromPreview}>
                      View all
                    </button>
                  </div>
                  {conversations.length === 0 ? (
                    <p className="dashboard-search-empty">No conversations</p>
                  ) : (
                    conversations.map((c) => {
                      const lastMsg = c.messages[c.messages.length - 1];
                      return (
                        <button
                          type="button"
                          key={c.id}
                          className="dashboard-search-item"
                          onClick={openConversationFromPreview}
                        >
                          <span className="dashboard-avatar-chip">
                            {c.avatar ? <img src={c.avatar} alt={c.name} /> : getPersonInitials(c.name)}
                          </span>
                          <span>
                            <strong>{c.name}</strong>
                            <small>{lastMsg ? lastMsg.text : 'No messages yet'}</small>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* ============ قائمة المستخدم ============ */}
            <div className="dashboard-dropdown-wrapper" ref={userMenuRef}>
              <button
                type="button"
                className="dashboard-header-user"
                onClick={() => setShowUserMenu((p) => !p)}
                aria-label="Account menu"
              >
                <img src={studentData.avatar} alt="User Avatar" />
                <strong>{studentData.displayName.split(' ')[0]}</strong>
                <FiChevronDown />
              </button>

              {showUserMenu && (
                <div className="dashboard-search-results dashboard-dropdown-right" style={{ width: 260 }}>
                  <div className="dashboard-dropdown-head">
                    <div>
                      <strong>{studentData.displayName}</strong>
                      <br />
                      <small>{studentData.email}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dashboard-search-item"
                    onClick={() => { setActiveTab('Profile'); setShowUserMenu(false); }}
                  >
                    <FiUser /> <span><strong>View profile</strong></span>
                  </button>
                  <button
                    type="button"
                    className="dashboard-search-item"
                    onClick={() => { setActiveTab('Settings'); setShowUserMenu(false); }}
                  >
                    <FiSettings /> <span><strong>Settings</strong></span>
                  </button>
                  <button
                    type="button"
                    className="dashboard-search-item dashboard-danger-item"
                    onClick={handleLogoutClick}
                  >
                    <FiLogOut /> <span><strong>Log out</strong></span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          {activeTab === 'Announcement detail' && <StudentAnnouncement studentData={studentData} />}

          {activeTab === 'Home' && (
            <div className="student-overview-page">
              <div className="dashboard-welcome">
                <div>
                  <h1>Welcome back, {studentData.displayName.split(' ')[0]}</h1>
                  <p>You're making steady progress. Here is the clearest next step for today.</p>
                </div>
                <button className="progress-report-button" onClick={() => setActiveTab('Achievements')}>
                  <FiCheckCircle /> Full progress report
                </button>
              </div>

              {/* ===== شبكة الإحصائيات ===== */}
              <div className="learning-overview">
                <p className="dashboard-eyebrow">Learning overview</p>
                <div className="overview-stats">
                  <button type="button" className="overview-stat" onClick={() => setActiveTab('MyCourses')}>
                    <span className="overview-stat-icon"><FiBookOpen /></span>
                    <span className="overview-stat-content">
                      <small>Courses in progress</small>
                      <strong>{myCourses.length}</strong>
                    </span>
                    <span className="overview-stat-helper">{myCourses.length > 0 ? 'On track' : 'Get started'}</span>
                  </button>

                  <button type="button" className="overview-stat" onClick={handleResumeCourse}>
                    <span className="overview-stat-icon"><FiBarChart2 /></span>
                    <span className="overview-stat-content">
                      <small>Project completion</small>
                      <strong>{studentData.stats.projectProgress}%</strong>
                    </span>
                    <span className="overview-stat-bar">
                      <i style={{ width: `${studentData.stats.projectProgress}%` }} />
                    </span>
                  </button>

                  <button type="button" className="overview-stat" onClick={() => setActiveTab('Assignments')}>
                    <span className="overview-stat-icon orange"><FiClock /></span>
                    <span className="overview-stat-content">
                      <small>Tasks due this week</small>
                      <strong>{sortedDeadlines.length}</strong>
                    </span>
                    <span className="overview-stat-helper orange">
                      {nearestDeadlineDays === null
                        ? 'All caught up'
                        : nearestDeadlineDays < 0
                        ? 'Overdue'
                        : nearestDeadlineDays === 0
                        ? 'Due today'
                        : `Next due in ${nearestDeadlineDays}d`}
                    </span>
                  </button>

                  <button type="button" className="overview-stat" onClick={() => setActiveTab('Achievements')}>
                    <span className="overview-stat-icon green"><FiAward /></span>
                    <span className="overview-stat-content">
                      <small>Certificates earned</small>
                      <strong>{studentData.stats.certificatesEarned}</strong>
                    </span>
                    <span className="overview-stat-helper green">
                      {studentData.stats.certificatesEarned > 0 ? 'Great progress' : 'Keep learning'}
                    </span>
                  </button>
                </div>
              </div>

              {/* ===== المتابعة + المهام القادمة ===== */}
              <div className="dashboard-main-grid">
                <div className="learning-start-card">
                  {currentLearningCourse ? (
                    <>
                      <div className="learning-start-image">
                        <span className="learning-start-badge">Current path</span>
                        {currentLearningCourse.coverImage ? (
                          <img src={currentLearningCourse.coverImage} alt={currentLearningCourse.title} />
                        ) : (
                          <div className="learning-image-placeholder"><FiCode /></div>
                        )}
                        <div className="learning-image-copy">
                          <strong>{currentLearningCourse.category || currentLearningCourse.title}</strong>
                          {/* FIXED: this used to read a "modules completed"
                              count that was always 0 (dead `&& false` logic)
                              combined with a second, differently-broken copy
                              of the same calculation. There's no real
                              module-level completion tracking in this app,
                              so instead of faking a number we show the
                              honest lesson count that's already computed
                              correctly elsewhere on this page. */}
                          <small>
                            {(currentLearningCourse.modules || []).length} modules · {completedLessonCount}/{currentLearningCourse.totalLessons} lessons complete
                          </small>
                        </div>
                      </div>

                      <div className="learning-start-content">
                        <p className="dashboard-eyebrow">Continue where you left off</p>
                        <h2>{nextLesson ? nextLesson.title : 'All lessons completed'}</h2>
                        <p>
                          {nextLesson
                            ? `${nextLesson.moduleTitle} · ${nextLesson.duration || 'a few minutes'}`
                            : "You've finished every published lesson in this course — great work."}
                        </p>

                        <div className="current-course-progress">
                          <span><i style={{ width: `${currentLearningCourse.progress}%` }} /></span>
                          <strong>{currentLearningCourse.progress}%</strong>
                        </div>

                        <div className="learning-start-actions">
                          <button className="primary-dashboard-button" onClick={handleResumeCourse}>
                            <FiPlay /> Continue lesson
                          </button>
                          <button className="secondary-dashboard-button" onClick={handleResumeCourse}>
                            Course outline
                          </button>
                        </div>

                        <div className="learning-start-details">
                          <span>
                            <small>Lessons completed</small>
                            <strong>{completedLessonCount}</strong>
                          </span>
                          <span>
                            <small>Next milestone</small>
                            <strong>{nextMilestone ? nextMilestone.title : 'All caught up'}</strong>
                          </span>
                          <span>
                            <small>Started</small>
                            <strong>
                              {currentLearningCourse.enrolledAt ? formatDate(currentLearningCourse.enrolledAt) : '—'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="learning-start-content" style={{ gridColumn: '1 / -1' }}>
                      <p className="dashboard-eyebrow">Continue where you left off</p>
                      <h2>No courses in progress yet</h2>
                      <p>Enroll in a course to start tracking your progress here.</p>
                      <div className="learning-start-actions">
                        <button className="primary-dashboard-button" onClick={() => setActiveTab('Courses')}>
                          Browse courses
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="opportunities-card">
                  <div className="dashboard-section-header">
                    <div>
                      <h2>Your next tasks</h2>
                      <p>Ordered by what needs attention first.</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('Assignments')}>See calendar</button>
                  </div>

                  {sortedDeadlines.length === 0 ? (
                    <div className="empty-opportunities">
                      <FiCheckCircle />
                      <strong>Nothing on your plate — you're all caught up!</strong>
                    </div>
                  ) : (
                    <>
                      <div className="opportunities-list">
                        {sortedDeadlines.map((d) => {
                          const meta = deadlineIconMap[d.type] || deadlineIconMap.priority;
                          const days = daysUntil(d.date);
                          const variant = urgencyVariant(days);
                          return (
                            <button
                              type="button"
                              key={d.id}
                              className={`opportunity-item ${variant.cardCls}`}
                              onClick={() => setActiveTab('Assignments')}
                            >
                              <span className="opportunity-icon">{meta.icon}</span>
                              <span className="opportunity-content">
                                <strong>{d.title}</strong>
                                <small>{meta.label} · {formatDate(d.date)}</small>
                              </span>
                              <span className="opportunity-status">{variant.statusText}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* FIXED: this footer link's label reads as an
                          informational "see more" row ("+2 more upcoming" /
                          "Nothing overdue"), but its onClick actually called
                          removeDeadline() on the nearest task — silently
                          deleting it with no confirmation. It now does what
                          the label promises: opens the full assignments view,
                          matching the "See calendar" button above. */}
                      <button
                        type="button"
                        className="opportunities-footer"
                        onClick={() => setActiveTab('Assignments')}
                      >
                        <span /> {deadlines.length > 3 ? `+${deadlines.length - 3} more upcoming` : 'Nothing overdue — you\'re on track'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ===== الكورسات المقترحة ===== */}
              <div className="dashboard-recommended">
                <div className="dashboard-section-header">
                  <div>
                    <h2>Recommended for you</h2>
                    <p>Based on your current path and saved interests.</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab('Courses')}>
                    Browse all courses <FiChevronRight />
                  </button>
                </div>

                {recommendedCourses.length > 0 ? (
                  <div className="dashboard-course-grid">
                    {recommendedCourses.map((course) => (
                      <div className="dashboard-course-card" key={course.id}>
                        <button
                          type="button"
                          className="dashboard-course-image"
                          onClick={() => handleSelectCourseResult(course)}
                        >
                          {course.coverImage ? (
                            <img src={course.coverImage} alt={course.title} />
                          ) : (
                            <span className="dashboard-course-image-fallback">
                              {course.category?.toLowerCase().includes('design') ? <FiPenTool /> : <FiCode />}
                            </span>
                          )}
                        </button>
                        <div className="dashboard-course-copy">
                          <span className="dashboard-course-category">{course.category}</span>
                          <h3>{course.title}</h3>
                          <div className="dashboard-course-details">
                            <span className={levelBadgeClass(course.level)}>{course.level}</span>
                            <span>{course.duration}</span>
                          </div>
                          <div className="dashboard-course-meta">
                            <span><FiStar /> {course.rating || '—'}</span>
                            <span>{studentCountLabel(course.students)} students</span>
                          </div>
                          <button
                            type="button"
                            className="view-course-button"
                            onClick={() => handleSelectCourseResult(course)}
                          >
                            View course
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // FIXED: previously this whole section rendered nothing
                  // once a student had enrolled in every available course —
                  // the "Recommended for you" heading was left floating with
                  // an empty gap under it. Reuses the same empty-state style
                  // already defined for the tasks card.
                  <div className="empty-opportunities">
                    <FiCheckCircle />
                    <strong>You're enrolled in everything we'd recommend right now — check back soon.</strong>
                  </div>
                )}
              </div>

              <p className="dashboard-update-note">
                Updated {formatDate(new Date().toISOString())} · Your progress is saved automatically
              </p>
            </div>
          )}

          {activeTab === 'Profile' && <StudentProfile student={studentData} />}

          {activeTab === 'Courses' && (
            <Courses
              initialCourseId={openCourseId}
              onConsumeInitial={() => setOpenCourseId(null)}
            />
          )}

          {activeTab === 'MyCourses' && (
            <MyCourses onExploreCourses={() => setActiveTab('Courses')} />
          )}
          {activeTab === 'Settings' && <Settings student={studentData} />}
          {activeTab === 'Messages' && <Messages studentData={studentData} />}
          {activeTab === 'Assignments' && <Assignments studentData={studentData} />}
          {activeTab === 'Competitions' && <Competitions studentData={studentData} />}
          {activeTab === 'Projects gallery' && <StudentProjects studentData={studentData} />}
          {activeTab === 'Achievements' && <Achievements studentData={studentData} />}
          {activeTab === 'Notifications' && <Notifications onNavigateTab={setActiveTab} studentData={studentData} />}

          {activeTab !== 'Home' &&
            activeTab !== 'Profile' &&
            activeTab !== 'Courses' &&
            activeTab !== 'MyCourses' &&
            activeTab !== 'Settings' &&
            activeTab !== 'Messages' &&
            activeTab !== 'Assignments' &&
            activeTab !== 'Notifications' &&
            activeTab !== 'Competitions' &&
            activeTab !== 'Projects gallery' &&
            activeTab !== 'Achievements' &&
            activeTab !== 'Announcement detail' && (
              <div className="tab-content" style={{ background: '#fff', padding: '30px', borderRadius: '20px' }}>
                <h2>{activeTab} Section</h2>
                <p style={{ color: 'var(--dashboard-muted)', marginTop: '10px' }}>This section is ready for integrating your sub-components.</p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
