import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StudentDashboard.css';
import {
  FiBookOpen, FiAward, FiFileText,
  FiSearch, FiBell, FiMessageSquare, FiBriefcase, FiTarget,
  FiBarChart2, FiCalendar, FiCode, FiFlag, FiPlay,
  FiLayers, FiClock, FiStar, FiChevronRight, FiChevronDown, FiPenTool,
  FiPlus, FiX, FiUser, FiSettings, FiLogOut,
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import { menuItems } from './menuItems';
import StudentProfile from './StudentProfile';
import Courses from './Courses';
import MyCourses from './MyCourses';
import Assignments from './Assignments';
import { useCourses } from './CoursesContext';
import { useDeadlines } from './DeadlinesContext';
import { coursesData } from './coursesData';
import Settings from './Settings';
import Messages from './Messages';
import { useMessages } from './MessagesContext';
import Notifications from './Notifications';
import Competitions from './Competitions';
import StudentProjects from './StudentProjects';
import StudentAnnouncement from './StudentAnnouncement';
import Achievements from './Achievements';
import { useNotifications } from './NotificationsContext';

const deadlineIconMap = {
  priority: { icon: <FiFileText />, cls: 'red-icon', tagCls: 'priority-tag', label: 'Priority' },
  event: { icon: <FiTarget />, cls: 'blue-icon', tagCls: 'event-tag', label: 'Event' },
  research: { icon: <FiBookOpen />, cls: 'orange-icon', tagCls: 'research-tag', label: 'Research' },
  practical: { icon: <FiBriefcase />, cls: 'purple-icon', tagCls: 'practical-tag', label: 'Practical' },
};

const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Turns an ISO date into a short, human "time left" label so the
// deadline badge tells you something useful at a glance instead of
// just repeating the category tag.
const daysUntil = (isoDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const urgencyLabel = (days) => {
  if (days < 0) return { text: 'Overdue', cls: 'urgency-overdue' };
  if (days === 0) return { text: 'Due today', cls: 'urgency-today' };
  if (days <= 3) return { text: `In ${days}d`, cls: 'urgency-soon' };
  return { text: `In ${days}d`, cls: 'urgency-normal' };
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

  const { myCourses } = useCourses();
  const { deadlines, addDeadline, removeDeadline } = useDeadlines();
  const { conversations } = useMessages();

  // ============ البحث ============
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [openCourseId, setOpenCourseId] = useState(null);
  const searchRef = useRef(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { courses: [], pages: [] };
    const q = searchQuery.toLowerCase();

    const courses = coursesData
      .filter((c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      .slice(0, 4);

    const pages = menuItems
      .filter((m) => m.label.toLowerCase().includes(q) && m.id !== 'Home')
      .slice(0, 3);

    return { courses, pages };
  }, [searchQuery]);

  // ============ الكورسات المقترحة ============
  const recommendedCourses = useMemo(() => {
    const enrolledIds = myCourses.map((c) => c.id);
    return coursesData.filter((c) => !enrolledIds.includes(c.id)).slice(0, 3);
  }, [myCourses]);

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

  // إغلاق نتائج البحث عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ الإشعارات (من الـ Context الحقيقي) ============
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

  // ============ معاينة الرسائل بالهيدر ============
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

  // ============ قائمة المستخدم في الهيدر ============
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

  // ============ المواعيد النهائية (Deadlines) ============
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: '', date: '', type: 'priority' });

  const handleAddDeadline = (e) => {
    e.preventDefault();
    if (!newDeadline.title.trim() || !newDeadline.date) return;
    addDeadline(newDeadline);
    setNewDeadline({ title: '', date: '', type: 'priority' });
    setShowAddDeadline(false);
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Section — مكوّن مستقل، محكوم بنفس activeTab */}
      <Sidebar
        activeTab={activeTab}
        onSelect={handleSidebarSelect}
        onLogout={handleLogoutClick}
        studentData={studentData}
      />

      {/* Main Viewport Content */}
      <main className="main-viewport">
        <header className="main-header">
          {/* ============ البحث ============ */}
          <div className="search-box" ref={searchRef}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search research, courses, or events..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
            />

            {showSearchResults && searchQuery.trim() && (
              <div className="search-results-dropdown">
                {searchResults.courses.length === 0 && searchResults.pages.length === 0 ? (
                  <p className="search-empty">No results found</p>
                ) : (
                  <>
                    {searchResults.courses.length > 0 && (
                      <div className="search-results-group">
                        <span className="search-group-label">Courses</span>
                        {searchResults.courses.map((course) => (
                          <div
                            key={course.id}
                            className="search-result-item"
                            onClick={() => handleSelectCourseResult(course)}
                          >
                            <FiBookOpen className="search-result-icon" />
                            <div>
                              <p className="search-result-title">{course.title}</p>
                              <span className="search-result-sub">{course.category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.pages.length > 0 && (
                      <div className="search-results-group">
                        <span className="search-group-label">Pages</span>
                        {searchResults.pages.map((page) => (
                          <div
                            key={page.id}
                            className="search-result-item"
                            onClick={() => handleSelectPageResult(page.id)}
                          >
                            <span className="search-result-icon">{page.icon}</span>
                            <p className="search-result-title">{page.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="header-controls">
            {/* ============ الإشعارات ============ */}
            <div className="header-dropdown-wrapper" ref={notifRef}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowNotifications((p) => !p)}
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <FiBell className="header-icon" />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="dropdown-panel">
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="mark-all-read" onClick={markAllRead}>Mark all as read</span>
                    )}
                  </div>
                  <div className="dropdown-list">
                    {notifications.length === 0 ? (
                      <p className="dropdown-empty">No notifications</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${!n.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          {!n.read && <span className="unread-dot" />}
                          <span className="preview-avatar">{n.icon}</span>
                          <div>
                            <p className="message-from">{n.title}</p>
                            <span className="message-text">{n.text}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div
                    className="dropdown-footer"
                    onClick={() => {
                      setActiveTab('Notifications');
                      setShowNotifications(false);
                    }}
                  >
                    View all notifications
                  </div>
                </div>
              )}
            </div>

            {/* ============ معاينة الرسائل ============ */}
            <div className="header-dropdown-wrapper" ref={mailRef}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowMessagesPreview((p) => !p)}
                aria-label="Messages"
                aria-expanded={showMessagesPreview}
              >
                <FiMessageSquare className="header-icon" />
              </button>

              {showMessagesPreview && (
                <div className="dropdown-panel">
                  <div className="dropdown-header">
                    <h4>Messages</h4>
                    <span className="mark-all-read" onClick={openConversationFromPreview}>
                      View all
                    </span>
                  </div>
                  <div className="dropdown-list">
                    {conversations.length === 0 ? (
                      <p className="dropdown-empty">No conversations</p>
                    ) : (
                      conversations.map((c) => {
                        const lastMsg = c.messages[c.messages.length - 1];
                        return (
                          <div
                            key={c.id}
                            className="notif-item"
                            onClick={openConversationFromPreview}
                          >
                            <div className="preview-avatar">
                              {c.avatar ? <img src={c.avatar} alt={c.name} /> : getPersonInitials(c.name)}
                            </div>
                            <div>
                              <p className="message-from">{c.name}</p>
                              <span className="message-text">
                                {lastMsg ? lastMsg.text : 'No messages yet'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ============ قائمة المستخدم ============ */}
            <div className="header-dropdown-wrapper" ref={userMenuRef}>
              <button
                type="button"
                className="header-user"
                onClick={() => setShowUserMenu((p) => !p)}
                aria-label="Account menu"
                aria-expanded={showUserMenu}
              >
                <img src={studentData.avatar} alt="User Avatar" className="header-avatar" />
                <span className="user-name">{studentData.displayName.split(' ')[0]}</span>
                <FiChevronDown className="header-user-chevron" />
              </button>

              {showUserMenu && (
                <div className="dropdown-panel user-menu-panel">
                  <div className="user-menu-identity">
                    <img src={studentData.avatar} alt="" className="user-menu-avatar" />
                    <div>
                      <p className="message-from">{studentData.displayName}</p>
                      <span className="message-text">{studentData.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-list">
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => { setActiveTab('Profile'); setShowUserMenu(false); }}
                    >
                      <FiUser /> View profile
                    </button>
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => { setActiveTab('Settings'); setShowUserMenu(false); }}
                    >
                      <FiSettings /> Settings
                    </button>
                    <button
                      type="button"
                      className="user-menu-item danger"
                      onClick={handleLogoutClick}
                    >
                      <FiLogOut /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          {activeTab === 'Announcement detail' && <StudentAnnouncement studentData={studentData} />}
          {activeTab === 'Home' && (
            <div className="tab-content">
              <div className="welcome-section">
                <div className="welcome-text">
                  <h1>Welcome back, {studentData.displayName.split(' ')[0]}</h1>
                  <p>Continue your academic journey and stay on track.</p>
                  <button
                    className="view-report-btn"
                    onClick={() => setActiveTab('Achievements')}
                  >
                    <FiBarChart2 /> View progress report
                  </button>
                </div>
              </div>

              {/* شبكة الإحصائيات */}
              <div className="stats-grid">
                <button
                  type="button"
                  className="stat-box"
                  onClick={() => setActiveTab('MyCourses')}
                >
                  <div className="icon-wrapper blue-bg">
                    <FiBookOpen />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">{myCourses.length}</span>
                    <span className="stat-label">Enrolled courses</span>
                    <span className="stat-status blue-status">On track</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="stat-box"
                  onClick={() => setActiveTab('Competitions')}
                >
                  <div className="icon-wrapper blue-bg">
                    <FiAward />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">{studentData.stats.activeCompetitions}</span>
                    <span className="stat-label">Active competitions</span>
                    <span className="stat-status blue-status">Active</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="stat-box"
                  onClick={() => setActiveTab('Projects gallery')}
                >
                  <div className="icon-wrapper blue-bg">
                    <FiBarChart2 />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">{studentData.stats.projectProgress}%</span>
                    <span className="stat-label">Project progress</span>
                    <span className="stat-mini-progress"><i style={{ width: `${studentData.stats.projectProgress}%` }} /></span>
                  </div>
                </button>

                <button
                  type="button"
                  className="stat-box"
                  onClick={() => setActiveTab('Achievements')}
                >
                  <div className="icon-wrapper blue-bg">
                    <FiAward />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">{studentData.stats.certificatesEarned}</span>
                    <span className="stat-label">Certificates earned</span>
                    <span className="stat-status green-status">Completed</span>
                  </div>
                </button>
              </div>

              {/* القسم السفلي: التقدم + المواعيد النهائية */}
              <div className="bottom-grid">
                <div className="progress-card">
                  <div className="progress-header">
                    <h3>Current learning path</h3>
                  </div>
                  <div className="learning-path">
                    <div className="learning-visual"><FiCode /></div>
                    <div className="learning-content">
                      <h4>Front-End Development Fundamentals</h4>
                      <div className="learning-progress-row">
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: '64%' }} />
                        </div>
                        <span>64%</span>
                      </div>
                      <div className="progress-details">
                        <div><span className="detail-label"><FiClock /> Lesson time</span><h4>2h 15m</h4><small>of 3h 20m</small></div>
                        <div><span className="detail-label"><FiLayers /> Modules</span><h4>8 / 12</h4><small>Completed</small></div>
                        <div><span className="detail-label"><FiFlag /> Next milestone</span><h4>Final Project</h4><small>Due in 7 days</small></div>
                      </div>
                    </div>
                  </div>
                  <div className="progress-actions">
                    <button className="resume-btn" onClick={() => setActiveTab('MyCourses')}>
                      <FiPlay /> Resume lesson
                    </button>
                    <button className="learning-path-link" onClick={() => setActiveTab('MyCourses')}>
                      View learning path <FiChevronRight />
                    </button>
                  </div>
                </div>

                <div className="deadlines-card">
                  <div className="deadlines-header">
                    <h3>Upcoming deadlines</h3>
                    <button
                      type="button"
                      className="icon-add-btn"
                      onClick={() => setShowAddDeadline((p) => !p)}
                      aria-expanded={showAddDeadline}
                    >
                      {showAddDeadline ? <><FiX /> Close</> : <><FiPlus /> Add</>}
                    </button>
                  </div>

                  {showAddDeadline && (
                    <form className="add-deadline-form" onSubmit={handleAddDeadline}>
                      <input
                        type="text"
                        placeholder="Deadline title"
                        value={newDeadline.title}
                        onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                        required
                      />
                      <input
                        type="date"
                        value={newDeadline.date}
                        onChange={(e) => setNewDeadline({ ...newDeadline, date: e.target.value })}
                        required
                      />
                      <select
                        value={newDeadline.type}
                        onChange={(e) => setNewDeadline({ ...newDeadline, type: e.target.value })}
                      >
                        <option value="priority">Priority</option>
                        <option value="event">Event</option>
                        <option value="research">Research</option>
                        <option value="practical">Practical</option>
                      </select>
                      <div className="add-deadline-actions">
                        <button type="submit" className="save-deadline-btn">Add</button>
                        <button
                          type="button"
                          className="cancel-deadline-btn"
                          onClick={() => setShowAddDeadline(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="deadline-list">
                    {deadlines.length === 0 ? (
                      <p className="dropdown-empty">No upcoming deadlines</p>
                    ) : (
                      deadlines.map((d) => {
                        const meta = deadlineIconMap[d.type] || deadlineIconMap.priority;
                        const urgency = urgencyLabel(daysUntil(d.date));
                        return (
                          <div className="deadline-item" key={d.id}>
                            <div className="deadline-main-info">
                              <div className={`deadline-icon ${meta.cls}`}>{meta.icon}</div>
                              <div className="deadline-info">
                                <h4>{d.title}</h4>
                                <p>{meta.label} · {formatDate(d.date)}</p>
                              </div>
                            </div>
                            <span className={`deadline-days ${urgency.cls}`}>{urgency.text}</span>
                            <button
                              type="button"
                              className="deadline-remove"
                              onClick={() => removeDeadline(d.id)}
                              aria-label={`Remove ${d.title}`}
                            >
                              <FiX />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* الكورسات المقترحة */}
              {recommendedCourses.length > 0 && (
                <div className="recommended-section">
                  <div className="recommended-header">
                    <h3>Recommended for you</h3>
                    <span className="view-all-link" onClick={() => setActiveTab('Courses')}>
                      Explore all courses <FiChevronRight />
                    </span>
                  </div>

                  <div className="recommended-grid">
                    {recommendedCourses.map((course) => (
                      <div
                        key={course.id}
                        className="recommended-card"
                        onClick={() => handleSelectCourseResult(course)}
                      >
                        <div className="recommended-avatar">
                          {course.category.toLowerCase().includes('design') ? <FiPenTool /> : course.title.toLowerCase().includes('react') ? <span>{'{}'}</span> : <FiCode />}
                        </div>
                        <div className="recommended-content">
                          <h4 className="recommended-title">{course.title}</h4>
                          <p className="recommended-description">{course.description || `Build a strong foundation in ${course.category} through practical lessons.`}</p>
                        </div>
                        <div className="recommended-meta">
                          <span><FiBarChart2 /> {course.level}</span>
                          <span><FiClock /> {course.duration || '16h'}</span>
                          <span className="recommended-rating">{course.rating} <FiStar /></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Profile' && <StudentProfile student={studentData} />}

          {activeTab === 'Courses' && (
            <Courses
              initialCourseId={openCourseId}
              onConsumeInitial={() => setOpenCourseId(null)}
            />
          )}

          {activeTab === 'MyCourses' && <MyCourses />}
          {activeTab === 'Settings' && <Settings student={studentData} />}
          {activeTab === 'Messages' && <Messages />}
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
                <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>This section is ready for integrating your sub-components.</p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
