import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StudentDashboard.css';
import {
  FiBookOpen, FiAward, FiFileText,
  FiSearch, FiBell, FiMail, FiBriefcase, FiTarget, FiPlus, FiTrash2, FiArrowRight
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
import Projects from './Projects';
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

const getInitials = (category) =>
  category.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const StudentDashboard = ({ studentData, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Home');

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
    if (n.actionTab) {
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
        onSelect={setActiveTab}
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
              <div className="icon-btn" onClick={() => setShowNotifications((p) => !p)}>
                <FiBell className="header-icon" />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </div>

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
              <div className="icon-btn" onClick={() => setShowMessagesPreview((p) => !p)}>
                <FiMail className="header-icon" />
              </div>

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

            <div className="header-user">
              <span className="user-name">{studentData.displayName.split(' ')[0]}</span>
              <img src={studentData.avatar} alt="User Avatar" className="header-avatar" />
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          {activeTab === 'Home' && (
            <div className="tab-content">
              <div className="welcome-section">
                <div className="welcome-text">
                  <h1>Welcome back, {studentData.displayName.split(' ')[0]} 👋</h1>
                  <p>Continue your academic journey and track your progress through the university ecosystem.</p>
                </div>
                <button className="view-report-btn">View Report</button>
              </div>

              {/* شبكة الإحصائيات */}
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="icon-wrapper blue-bg">
                    <FiBookOpen />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">ENROLLED COURSES</span>
                    <span className="stat-number">{myCourses.length}</span>
                  </div>
                </div>

                <div className="stat-box gold-bg">
                  <div className="icon-wrapper dark-bg">
                    <FiTarget />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">ACTIVE COMPETITIONS</span>
                    <span className="stat-number">{studentData.stats.activeCompetitions}</span>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="icon-wrapper blue-bg">
                    <FiBriefcase />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">PROJECT PROGRESS</span>
                    <span className="stat-number">{studentData.stats.projectProgress}%</span>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="icon-wrapper blue-bg">
                    <FiAward />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">CERTIFICATES EARNED</span>
                    <span className="stat-number">{studentData.stats.certificatesEarned}</span>
                  </div>
                </div>
              </div>

              {/* القسم السفلي: التقدم + المواعيد النهائية */}
              <div className="bottom-grid">
                <div className="progress-card">
                  <div className="progress-header">
                    <h3>Current Progress</h3>
                    <span className="progress-percentage">64%</span>
                  </div>

                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: '64%' }}></div>
                  </div>

                  <div className="progress-details">
                    <div>
                      <span className="detail-label">Modules</span>
                      <h4>8/12</h4>
                    </div>
                    <div>
                      <span className="detail-label">Next Milestone</span>
                      <h4>Final Project</h4>
                    </div>
                  </div>

                  <div className="progress-actions">
                    <button className="resume-btn">Resume Lecture</button>
                    <button className="bookmark-btn">🔖</button>
                  </div>
                </div>

                <div className="deadlines-card">
                  <div className="deadlines-header">
                    <h3>Upcoming Deadlines</h3>
                    <span className="view-all-link" onClick={() => setShowAddDeadline((p) => !p)}>
                      <FiPlus style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Add
                    </span>
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
                        return (
                          <div className="deadline-item" key={d.id}>
                            <div className="deadline-main-info">
                              <div className={`deadline-icon ${meta.cls}`}>{meta.icon}</div>
                              <div className="deadline-info">
                                <h4>{d.title}</h4>
                                <p>
                                  {formatDate(d.date)} · <span className={meta.tagCls}>{meta.label}</span>
                                </p>
                              </div>
                            </div>
                            <button
                              className="delete-deadline-btn"
                              onClick={() => removeDeadline(d.id)}
                              title="Remove"
                            >
                              <FiTrash2 />
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
                    <h3>Recommended For You</h3>
                    <span className="view-all-link" onClick={() => setActiveTab('Courses')}>
                      Browse all <FiArrowRight style={{ verticalAlign: 'middle' }} />
                    </span>
                  </div>

                  <div className="recommended-grid">
                    {recommendedCourses.map((course) => (
                      <div
                        key={course.id}
                        className="recommended-card"
                        onClick={() => handleSelectCourseResult(course)}
                      >
                        <div className="recommended-top">
                          <span className="recommended-avatar">{getInitials(course.category)}</span>
                          <span className="recommended-level">{course.level}</span>
                        </div>
                        <p className="recommended-category">{course.category}</p>
                        <h4 className="recommended-title">{course.title}</h4>
                        <div className="recommended-footer">
                          <span className="recommended-instructor">{course.instructor}</span>
                          <span className="recommended-rating">★ {course.rating}</span>
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
          {activeTab === 'Assignments' && <Assignments />}
          {activeTab === 'Competitions' && <Competitions />}
          {activeTab === 'Projects gallery' && <Projects />}
          {activeTab === 'Achievements' && <Achievements studentData={studentData} />}
          {activeTab === 'Notifications' && <Notifications onNavigate={setActiveTab} />}

          {activeTab !== 'Home' &&
            activeTab !== 'Profile' &&
            activeTab !== 'Courses' &&
            activeTab !== 'MyCourses' &&
            activeTab !== 'Settings' &&
            activeTab !== 'Messages' &&
            activeTab !== 'Assignments' &&
            activeTab !== 'Notifications' && (
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
