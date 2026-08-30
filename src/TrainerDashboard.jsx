import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Assignments.css';
import './TrainerDashboard.css';
import {
  FiBell, FiMail, FiPlus, FiBookOpen, FiUsers, FiBriefcase, FiTarget,
  FiSearch, FiUser, FiSettings, FiLogOut,
  FiArrowRight, FiMoreHorizontal, FiCheckCircle, FiFileText,
} from 'react-icons/fi';
import TrainerSidebar from './TrainerSidebar';
import { useCoursesCatalog } from './CoursesCatalogContext';
import { useProjects } from './ProjectsContext';
import { useTrainerAssignments } from './TrainerAssignmentsContext';
import { useTrainerStudents } from './TrainerStudentsContext';
import { useCompetitions } from './CompetitionsContext';
import TrainerMessages from './TrainerMessages';
import { useTrainerConversations } from './SharedConversationsContext';
import TrainerStudents from './TrainerStudents';
import TrainerCourses from './TrainerCourses';
import TrainerAssignments from './TrainerAssignments';
import TrainerProjects from './TrainerProjects';
import TrainerCompetitions from './TrainerCompetitions';
import TrainerAnnouncements from './TrainerAnnouncements';
import TrainerProfile from './TrainerProfile';
import TrainerSettings from './TrainerSettings';

const getInitials = (text) =>
  (text || '').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const TrainerDashboard = ({ trainerData, onTrainerUpdate, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.startsWith('/trainer-dashboard/profile') ? 'Profile'
      : location.pathname.startsWith('/trainer-dashboard/competitions') ? 'Competitions'
        : location.pathname.startsWith('/trainer-dashboard/settings')
          || location.pathname.startsWith('/trainer-dashboard/support') ? 'Settings'
          : location.pathname.startsWith('/trainer-dashboard/announcements') ? 'Announcements'
            : 'Home'
  );

  const { courses } = useCoursesCatalog();
  const { projects } = useProjects();
  const { assignments } = useTrainerAssignments();
  const { roster } = useTrainerStudents();
  const { registrations } = useCompetitions();
  // FIXED: this used to read from TrainerMessagesContext, a completely
  // separate mock dataset from whatever the student side saw. It now reads
  // this trainer's slice of the single shared conversation store (the same
  // one Messages.jsx reads on the student side), mapped into the
  // {id, name, avatar, messages, unreadCount} shape this file already
  // expects so nothing else below needs to change.
  const { conversations: trainerConversations } = useTrainerConversations(trainerData);
  const conversations = useMemo(
    () => trainerConversations.map((c) => ({
      id: c.id,
      name: c.studentName,
      avatar: c.studentAvatar,
      messages: c.messages,
      unreadCount: c.unreadForTrainer,
    })),
    [trainerConversations]
  );
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/trainer-login');
  };

  const handleTabSelect = (tab) => {
    if (tab === 'Competitions') navigate('/trainer-dashboard/competitions');
    else if (tab === 'Profile') navigate('/trainer-dashboard/profile');
    else if (tab === 'Settings') navigate('/trainer-dashboard/settings');
    else if (tab === 'Announcements') navigate('/trainer-dashboard/announcements');
    else if (
      location.pathname.startsWith('/trainer-dashboard/competitions')
      || location.pathname.startsWith('/trainer-dashboard/profile')
      || location.pathname.startsWith('/trainer-dashboard/settings')
      || location.pathname.startsWith('/trainer-dashboard/support')
      || location.pathname.startsWith('/trainer-dashboard/announcements')
    ) navigate('/trainer-dashboard');
    setActiveTab(tab);
  };

  const myCourses = useMemo(
    () => courses.filter((c) => c.instructor === trainerData.displayName || c.createdByTrainer),
    [courses, trainerData.displayName]
  );

  const pendingProjectsCount = projects.filter((p) => ['pending', 'pending-review', 'resubmitted'].includes(p.status)).length;
  const ungradedCount = assignments.filter((a) => a.status !== 'graded').length;
  const messageCount = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
  const pendingRegistrationsCount = registrations.filter((r) => r.status === 'pending').length;

  // FIXED: the bell used to show a count from the *student*-facing
  // notifications system, then clicking it navigated to Announcements —
  // a page for *composing* announcements, unrelated to whatever that
  // count meant. It now shows real, trainer-relevant alerts built from
  // the same pending-work data already used elsewhere on this page, and
  // each one navigates to where it can actually be acted on.
  const trainerAlerts = [
    ungradedCount > 0 && { id: 'assignments', icon: <FiFileText />, text: `${ungradedCount} submission${ungradedCount === 1 ? '' : 's'} awaiting grading`, tab: 'Assignments' },
    pendingProjectsCount > 0 && { id: 'projects', icon: <FiBriefcase />, text: `${pendingProjectsCount} project${pendingProjectsCount === 1 ? '' : 's'} awaiting review`, tab: 'Projects' },
    pendingRegistrationsCount > 0 && { id: 'competitions', icon: <FiTarget />, text: `${pendingRegistrationsCount} competition registration request${pendingRegistrationsCount === 1 ? '' : 's'}`, tab: 'Competitions' },
    messageCount > 0 && { id: 'messages', icon: <FiMail />, text: `${messageCount} unread message${messageCount === 1 ? '' : 's'}`, tab: 'Messages' },
  ].filter(Boolean);

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FIXED: the avatar/name in the header used to be a plain <div> with no
  // onClick at all — clicking it did nothing. It's now a real dropdown
  // with profile, settings, and logout, matching the pattern already used
  // by the notification bell above and the student dashboard's own
  // account menu.
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // FIXED: `attentionStudents` below is capped with .slice(0, 3) so the
  // list only shows 3 cards — but the stat card was reusing that same
  // sliced array's .length, so it silently capped the real count at 3
  // too. A trainer with 7 students needing attention would only ever see
  // "3 need attention". This now counts the real, unsliced total.
  const studentsNeedingAttention = roster.filter((student) => Number(student.progress) < 60);
  const attentionStudents = studentsNeedingAttention.slice(0, 3);
  // FIXED: was just `conversations.slice(0, 3)` — whatever order the
  // context happened to return conversations in, not actually sorted by
  // recency, despite the panel being labeled "Recent messages" / "Latest
  // student conversations".
  const recentMessages = [...conversations]
    .sort((a, b) => new Date(b.messages?.at(-1)?.time || 0) - new Date(a.messages?.at(-1)?.time || 0))
    .slice(0, 3);
  const reviewQueue = [
    ...assignments.filter((item) => item.status !== 'graded').map((item) => ({
      id: `assignment-${item.id}`, type: 'Assignment', title: item.title,
      owner: item.studentName || 'Student submission', status: 'Pending review', target: 'Assignments',
    })),
    ...projects.filter((item) => ['pending', 'pending-review', 'resubmitted'].includes(item.status)).map((item) => ({
      id: `project-${item.id}`, type: 'Project', title: item.title,
      owner: item.studentName || item.student || 'Student project', status: 'Waiting', target: 'Projects',
    })),
  ].slice(0, 4);

  const filteredQueue = reviewQueue.filter((item) =>
    `${item.title} ${item.owner} ${item.type}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <TrainerSidebar
        activeTab={activeTab}
        onSelect={handleTabSelect}
        onLogout={handleLogoutClick}
        trainerData={trainerData}
      />

      <main className="main-viewport">
        <header className="main-header">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search students, courses, or submissions" />
          </div>

          <div className="header-controls">
            <div className="notif-dropdown-wrap" ref={notifRef}>
              <button type="button" className="icon-btn" onClick={() => setShowNotifications((v) => !v)}>
                <FiBell className="header-icon" />
                {trainerAlerts.length > 0 && <span className="notif-badge">{trainerAlerts.length}</span>}
              </button>
              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-head"><h4>Notifications</h4></div>
                  {trainerAlerts.length ? trainerAlerts.map((alert) => (
                    <button
                      type="button"
                      key={alert.id}
                      className="notif-dropdown-item"
                      onClick={() => { setActiveTab(alert.tab); setShowNotifications(false); }}
                    >
                      <span className="notif-dropdown-icon">{alert.icon}</span>
                      <span>{alert.text}</span>
                    </button>
                  )) : <p className="notif-dropdown-empty">You're all caught up.</p>}
                </div>
              )}
            </div>
            <button type="button" className="icon-btn" onClick={() => setActiveTab('Messages')}>
              <FiMail className="header-icon" />
              {messageCount > 0 && <span className="notif-badge">{messageCount}</span>}
            </button>
            <div className="header-user-wrap" ref={userMenuRef}>
              <button type="button" className="header-user" onClick={() => setShowUserMenu((v) => !v)}>
                <span className="user-name">{trainerData.displayName.split(' ').slice(-1)[0]}</span>
                <img src={trainerData.avatar} alt="Trainer Avatar" className="header-avatar" />
              </button>
              {showUserMenu && (
                <div className="header-user-menu">
                  <div className="header-user-menu-head">
                    <img src={trainerData.avatar} alt={trainerData.displayName} />
                    <div><strong>{trainerData.displayName}</strong><small>{trainerData.email}</small></div>
                  </div>
                  <button type="button" onClick={() => { setActiveTab('Profile'); setShowUserMenu(false); }}>
                    <FiUser /> View profile
                  </button>
                  <button type="button" onClick={() => { setActiveTab('Settings'); setShowUserMenu(false); }}>
                    <FiSettings /> Settings
                  </button>
                  <button type="button" className="danger" onClick={handleLogoutClick}>
                    <FiLogOut /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          {/* ==================== الرئيسية ==================== */}
          {activeTab === 'Home' && (
            <div className="tab-content">
              <div className="td-home-heading">
                <div className="welcome-text">
                  <span>TRAINER WORKSPACE</span>
                  <h1>Good morning, {trainerData.displayName}</h1>
                  <p>Review priority work, support students, and keep every course moving.</p>
                </div>
                <div className="td-quick-actions">
                  <button className="primary" onClick={() => setActiveTab('Courses')}><FiPlus /> Add course</button>
                  <button onClick={() => setActiveTab('Assignments')}>Create assignment</button>
                  <button onClick={() => setActiveTab('Announcements')}>Post update</button>
                </div>
              </div>

              <div className="td-operations-stats">
                <article className="orange"><FiCheckCircle /><strong>{pendingProjectsCount + ungradedCount}</strong><b>Pending reviews</b><small>{ungradedCount} assignments to grade</small></article>
                <article className="blue"><FiUsers /><strong>{roster.length}</strong><b>Active students</b><small>{studentsNeedingAttention.length} need attention</small></article>
                <article className="green"><FiBookOpen /><strong>{myCourses.length}</strong><b>Active courses</b><small>Managed from your catalog</small></article>
                <article className="red"><FiMail /><strong>{messageCount}</strong><b>Unread messages</b><small>Open inbox to respond</small></article>
              </div>

              <div className="td-operations-grid">
                <section className="td-panel td-review-panel">
                  <div className="td-panel-head"><div><h2>Priority review queue</h2><p>Assignments and projects waiting for your review</p></div><button onClick={() => setActiveTab('Projects')}>View all <FiArrowRight /></button></div>
                  <div className="td-review-list">
                    {filteredQueue.length ? filteredQueue.map((item) => (
                      <article key={item.id}><span className={`td-type ${item.type.toLowerCase()}`}>{item.type[0]}</span><div><strong>{item.title}</strong><small>{item.type} · {item.owner}</small></div><em>{item.status}</em><button onClick={() => setActiveTab(item.target)}>Review</button></article>
                    )) : <div className="td-panel-empty">No matching reviews. Your queue is clear.</div>}
                  </div>
                </section>

                <section className="td-panel">
                  <div className="td-panel-head"><div><h2>Students needing attention</h2><p>Early signals from course progress</p></div><button onClick={() => setActiveTab('Students')}>Open list <FiArrowRight /></button></div>
                  <div className="td-attention-list">
                    {attentionStudents.map((student) => <article key={student.id}><span>{getInitials(student.name)}</span><div><strong>{student.name}</strong><small>{student.progress}% progress</small><i><b style={{ width: `${student.progress}%` }} /></i></div><em>{student.progress < 45 ? 'Needs support' : 'Needs feedback'}</em></article>)}
                    {!attentionStudents.length && <div className="td-panel-empty">All students are currently on track.</div>}
                  </div>
                </section>

                <section className="td-panel">
                  <div className="td-panel-head"><div><h2>Active courses</h2><p>Your current teaching workload</p></div><button onClick={() => setActiveTab('Courses')}>Manage courses <FiArrowRight /></button></div>
                  <div className="td-course-rows">{myCourses.slice(0, 3).map((course) => <article key={course.id}><span>{getInitials(course.category)}</span><div><strong>{course.title}</strong><small>{course.students || 0} students · {course.lessons || 0} lessons</small></div><i><b style={{ width: `${Math.min(100, Number(course.progress) || 0)}%` }} /></i><FiMoreHorizontal /></article>)}</div>
                </section>

                <section className="td-panel">
                  <div className="td-panel-head"><div><h2>Recent messages</h2><p>Latest student conversations</p></div><button onClick={() => setActiveTab('Messages')}>Open inbox <FiArrowRight /></button></div>
                  <div className="td-message-rows">{recentMessages.map((chat) => <button key={chat.id} onClick={() => setActiveTab('Messages')}><span>{getInitials(chat.name)}</span><div><strong>{chat.name}</strong><small>{chat.messages?.at(-1)?.text || 'No messages yet'}</small></div>{chat.unreadCount > 0 && <i />}</button>)}</div>
                </section>
              </div>
            </div>
          )}

          {/* ==================== الملف الشخصي ==================== */}
          {activeTab === 'Profile' && (
            <TrainerProfile trainerData={trainerData} onUpdate={onTrainerUpdate} editMode={location.pathname.endsWith('/profile/edit')} />
          )}

          {/* ==================== إدارة الكورسات ==================== */}
          {activeTab === 'Courses' && (
            <TrainerCourses
              trainerData={trainerData}
              onOpenMessages={() => setActiveTab('Messages')}
            />
          )}

          {/* ==================== الطلاب ==================== */}
          {activeTab === 'Students' && (
            <TrainerStudents onOpenMessages={() => setActiveTab('Messages')} />
          )}

          {/* ==================== المشاريع ==================== */}
          {activeTab === 'Projects' && (
            <TrainerProjects trainerData={trainerData} />
          )}

          {/* ==================== الواجبات ==================== */}
          {activeTab === 'Assignments' && (
            <TrainerAssignments trainerData={trainerData} />
          )}

          {/* ==================== التوجيهات ==================== */}
          {activeTab === 'Announcements' && (
            <TrainerAnnouncements trainerData={trainerData} />
          )}

          {/* ==================== الرسائل ====================
              FIXED: was <TrainerMessages /> with no identity at all — the
              component had no way to know which trainer was logged in.
              Now it receives trainerData exactly like TrainerProjects and
              TrainerCourses already do above. */}
          {activeTab === 'Messages' && <TrainerMessages trainerData={trainerData} />}

          {activeTab === 'Competitions' && (
            <TrainerCompetitions trainerData={trainerData} />
          )}

          {/* ==================== الإعدادات ==================== */}
          {activeTab === 'Settings' && (
            <TrainerSettings
              trainerData={trainerData}
              onLogout={onLogout}
              onSelectTab={handleTabSelect}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default TrainerDashboard;
