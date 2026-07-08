import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StudentDashboard.css';
import {
  FiHome, FiUser, FiBookOpen, FiAward, FiFileText,
  FiMessageSquare, FiSettings, FiLogOut, FiSearch,
  FiBell, FiMail, FiBriefcase, FiTarget,  FiPlus, FiTrash2
} from 'react-icons/fi';
import mdiCompass from './assets/mdi-compass.png';
import StudentProfile from './StudentProfile';
import Courses from './Courses';
import MyCourses from './MyCourses';
import { useCourses } from './CoursesContext';
import { useDeadlines } from './DeadlinesContext';
import { coursesData } from './coursesData';
import Settings from './Settings';

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

const StudentDashboard = ({ studentData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Home');

  const { myCourses } = useCourses();
  const { deadlines, addDeadline, removeDeadline } = useDeadlines();

  // ============ البحث ============
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [openCourseId, setOpenCourseId] = useState(null);
  const searchRef = useRef(null);

  const menuItems = [
    { id: 'Home', label: 'Home', icon: <FiHome /> },
    { id: 'Profile', label: 'Profile', icon: <FiUser /> },
    { id: 'Courses', label: 'Courses', icon: <FiBookOpen /> },
    { id: 'MyCourses', label: 'My Courses', icon: <FiBookOpen /> },
    { id: 'Competitions', label: 'Competitions', icon: <FiTarget/> },
    { id: 'Assignments', label: 'Assignments', icon: <FiFileText /> },
    { id: 'Projects gallery', label: 'Projects gallery', icon: <FiBriefcase /> },
    { id: 'Messages', label: 'Messages', icon: <FiMessageSquare /> },
    { id: 'Achievements', label: 'My Achievements', icon: <FiAward /> },
    { id: 'Settings', label: 'Settings', icon: <FiSettings /> }
  ];

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

  // ============ الإشعارات ============
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your assignment "Database Systems ERD" is due tomorrow.', read: false },
    { id: 2, text: 'You have been enrolled in a new competition.', read: false },
    { id: 3, text: 'New message from Dr. Sarah Al-Mansour.', read: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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

  // ============ الرسائل ============
  const [messages] = useState([
    { id: 1, from: 'Dr. Sarah Al-Mansour', text: 'Please review the graduation project proposal.', unread: true },
    { id: 2, from: 'Eng. Ahmad Khalil', text: 'Great progress on the last assignment!', unread: false },
  ]);
  const [showMessages, setShowMessages] = useState(false);
  const mailRef = useRef(null);
  const unreadMessagesCount = messages.filter((m) => m.unread).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mailRef.current && !mailRef.current.contains(e.target)) {
        setShowMessages(false);
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

  return (
    <div className="dashboard-container">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={mdiCompass} alt="Compass Logo" className="brand-logo" />
          <h2>Compass <span className="brand-highlight">Academic</span></h2>
        </div>

        <div className="sidebar-profile">
          <img src={studentData.avatar} alt={studentData.displayName} className="profile-img" />
          <h3 className="profile-name">{studentData.displayName}</h3>
          <p className="profile-major">{studentData.major}</p>
        </div>

        <nav className="sidebar-menu">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.id}
                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer" onClick={() => navigate('/login')}>
          <FiLogOut className="menu-icon" />
          <span>Logout</span>
        </div>
      </aside>

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
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${!n.read ? 'unread' : ''}`}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          {!n.read && <span className="unread-dot" />}
                          <p>{n.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ============ الرسائل ============ */}
            <div className="header-dropdown-wrapper" ref={mailRef}>
              <div className="icon-btn" onClick={() => setShowMessages((p) => !p)}>
                <FiMail className="header-icon" />
                {unreadMessagesCount > 0 && <span className="notif-badge">{unreadMessagesCount}</span>}
              </div>

              {showMessages && (
                <div className="dropdown-panel">
                  <div className="dropdown-header">
                    <h4>Messages</h4>
                  </div>
                  <div className="dropdown-list">
                    {messages.map((m) => (
                      <div key={m.id} className={`notif-item ${m.unread ? 'unread' : ''}`}>
                        {m.unread && <span className="unread-dot" />}
                        <div>
                          <p className="message-from">{m.from}</p>
                          <span className="message-text">{m.text}</span>
                        </div>
                      </div>
                    ))}
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

          {activeTab !== 'Home' && activeTab !== 'Profile' && activeTab !== 'Courses' && activeTab !== 'MyCourses' && (
            <div className="tab-content" style={{ background: '#fff', padding: '30px', borderRadius: '20px' }}>
              <h2>{activeTab} Section</h2>
              <p style={{ color: '#a3aed0', marginTop: '10px' }}>This section is ready for integrating your sub-components.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;