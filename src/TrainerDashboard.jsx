import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Courses.css';
import './Assignments.css';
import './TrainerDashboard.css';
import {
  FiBell, FiMail, FiPlus, FiBookOpen, FiUsers,
  FiSearch, FiArrowRight, FiMoreHorizontal, FiCheckCircle,
} from 'react-icons/fi';
import TrainerSidebar from './TrainerSidebar';
import { useCoursesCatalog } from './CoursesCatalogContext';
import { useProjects } from './ProjectsContext';
import { useTrainerAssignments } from './TrainerAssignmentsContext';
import { useTrainerStudents } from './TrainerStudentsContext';
import { useNotifications } from './NotificationsContext';
import TrainerMessages from './TrainerMessages';
import { useTrainerMessages } from './TrainerMessagesContext';
import TrainerStudents from './TrainerStudents';
import TrainerCourses from './TrainerCourses';
import TrainerAssignments from './TrainerAssignments';
import TrainerProjects from './TrainerProjects';
import TrainerCompetitions from './TrainerCompetitions';
import TrainerAnnouncements from './TrainerAnnouncements';
import TrainerProfile from './TrainerProfile';

const getInitials = (text) =>
  (text || '').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const TrainerDashboard = ({ trainerData, onTrainerUpdate, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.startsWith('/trainer-dashboard/profile') ? 'Profile'
      : location.pathname.startsWith('/trainer-dashboard/competitions') ? 'Competitions' : 'Home'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { courses } = useCoursesCatalog();
  const { projects } = useProjects();
  const { assignments } = useTrainerAssignments();
  const { roster } = useTrainerStudents();
  const { unreadCount } = useNotifications();
  const { conversations = [] } = useTrainerMessages();

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/trainer-login');
  };

  const handleTabSelect = (tab) => {
    if (tab === 'Competitions') navigate('/trainer-dashboard/competitions');
    else if (tab === 'Profile') navigate('/trainer-dashboard/profile');
    else if (
      location.pathname.startsWith('/trainer-dashboard/competitions')
      || location.pathname.startsWith('/trainer-dashboard/profile')
    ) navigate('/trainer-dashboard');
    setActiveTab(tab);
  };

  // ============ Derived data for the Home overview ============
  const myCourses = useMemo(
    () => courses.filter((c) => c.instructor === trainerData.displayName || c.createdByTrainer),
    [courses, trainerData.displayName]
  );

  const pendingProjectsCount = projects.filter((p) => ['pending', 'pending-review', 'resubmitted'].includes(p.status)).length;
  const ungradedCount = assignments.filter((a) => a.status !== 'graded').length;
  const messageCount = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
  const attentionStudents = roster.filter((student) => Number(student.progress) < 60).slice(0, 3);
  const recentMessages = conversations.slice(0, 3);

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

  // ============ Data-driven UI: quick actions + stat cards ============
  // Kept as plain arrays (rather than four near-identical <button>/<article>
  // blocks) so adding, reordering, or restyling a card later is a one-line
  // change instead of hunting through repeated markup.
  const quickActions = [
    { id: 'add-course', label: 'Add course', icon: FiPlus, primary: true, onClick: () => setActiveTab('Courses') },
    { id: 'create-assignment', label: 'Create assignment', onClick: () => setActiveTab('Assignments') },
    { id: 'post-update', label: 'Post update', onClick: () => setActiveTab('Announcements') },
  ];

  const statCards = [
    {
      id: 'pending-reviews', tone: 'orange', icon: FiCheckCircle,
      value: pendingProjectsCount + ungradedCount, label: 'Pending reviews',
      helper: `${ungradedCount} assignments to grade`,
    },
    {
      id: 'active-students', tone: 'blue', icon: FiUsers,
      value: roster.length, label: 'Active students',
      helper: `${attentionStudents.length} need attention`,
    },
    {
      id: 'active-courses', tone: 'green', icon: FiBookOpen,
      value: myCourses.length, label: 'Active courses',
      helper: 'Managed from your catalog',
    },
    {
      id: 'unread-messages', tone: 'red', icon: FiMail,
      value: messageCount, label: 'Unread messages',
      helper: 'Open inbox to respond',
    },
  ];

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
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search students, courses, or submissions"
            />
          </div>

          <div className="header-controls">
            <button type="button" className="icon-btn" onClick={() => setActiveTab('Announcements')}>
              <FiBell className="header-icon" />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            <button type="button" className="icon-btn" onClick={() => setActiveTab('Messages')}>
              <FiMail className="header-icon" />
              {messageCount > 0 && <span className="notif-badge">{messageCount}</span>}
            </button>
            <div className="header-user">
              <img src={trainerData.avatar} alt="Trainer Avatar" className="header-avatar" />
              <span className="user-name">{trainerData.displayName.split(' ').slice(-1)[0]}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          {/* ==================== Home ==================== */}
          {activeTab === 'Home' && (
            <div className="tab-content">
              <div className="td-home-heading">
                <div className="welcome-text">
                  <span>Trainer workspace</span>
                  <h1>Good morning, {trainerData.displayName}</h1>
                  <p>Review priority work, support students, and keep every course moving.</p>
                </div>
                <div className="td-quick-actions">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className={action.primary ? 'primary' : undefined}
                      onClick={action.onClick}
                    >
                      {action.icon && <action.icon />} {action.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="td-operations-stats">
                {statCards.map((stat) => (
                  <article key={stat.id} className={stat.tone}>
                    <stat.icon />
                    <strong>{stat.value}</strong>
                    <b>{stat.label}</b>
                    <small>{stat.helper}</small>
                  </article>
                ))}
              </div>

              <div className="td-operations-grid">
                <section className="td-panel td-review-panel">
                  <div className="td-panel-head">
                    <div><h2>Priority review queue</h2><p>Work ordered by student impact</p></div>
                    <button type="button" onClick={() => setActiveTab('Projects')}>View all <FiArrowRight /></button>
                  </div>
                  <div className="td-review-list">
                    {filteredQueue.length ? filteredQueue.map((item) => (
                      <article key={item.id}>
                        <span className={`td-type ${item.type.toLowerCase()}`}>{item.type[0]}</span>
                        <div><strong>{item.title}</strong><small>{item.type} · {item.owner}</small></div>
                        <em>{item.status}</em>
                        <button type="button" onClick={() => setActiveTab(item.target)}>Review</button>
                      </article>
                    )) : <div className="td-panel-empty">No matching reviews. Your queue is clear.</div>}
                  </div>
                </section>

                <section className="td-panel">
                  <div className="td-panel-head">
                    <div><h2>Students needing attention</h2><p>Early signals from course progress</p></div>
                    <button type="button" onClick={() => setActiveTab('Students')}>Open list <FiArrowRight /></button>
                  </div>
                  <div className="td-attention-list">
                    {attentionStudents.map((student) => (
                      <article key={student.id}>
                        <span>{getInitials(student.name)}</span>
                        <div>
                          <strong>{student.name}</strong>
                          <small>{student.progress}% progress</small>
                          <i><b style={{ width: `${student.progress}%` }} /></i>
                        </div>
                        <em>{student.progress < 45 ? 'Needs support' : 'Needs feedback'}</em>
                      </article>
                    ))}
                    {!attentionStudents.length && <div className="td-panel-empty">All students are currently on track.</div>}
                  </div>
                </section>

                <section className="td-panel">
                  <div className="td-panel-head">
                    <div><h2>Active courses</h2><p>Your current teaching workload</p></div>
                    <button type="button" onClick={() => setActiveTab('Courses')}>Manage courses <FiArrowRight /></button>
                  </div>
                  <div className="td-course-rows">
                    {myCourses.slice(0, 3).map((course) => (
                      <article key={course.id}>
                        <span>{getInitials(course.category)}</span>
                        <div>
                          <strong>{course.title}</strong>
                          <small>{course.students || 0} students · {course.lessons || 0} lessons</small>
                        </div>
                        <i><b style={{ width: `${Math.min(100, Number(course.progress) || 72)}%` }} /></i>
                        <FiMoreHorizontal />
                      </article>
                    ))}
                  </div>
                </section>

                <section className="td-panel">
                  <div className="td-panel-head">
                    <div><h2>Recent messages</h2><p>Latest student conversations</p></div>
                    <button type="button" onClick={() => setActiveTab('Messages')}>Open inbox <FiArrowRight /></button>
                  </div>
                  <div className="td-message-rows">
                    {recentMessages.map((chat) => (
                      <button key={chat.id} type="button" onClick={() => setActiveTab('Messages')}>
                        <span>{getInitials(chat.name)}</span>
                        <div>
                          <strong>{chat.name}</strong>
                          <small>{chat.messages?.at(-1)?.text || 'No messages yet'}</small>
                        </div>
                        {chat.unreadCount > 0 && <i />}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ==================== Profile ==================== */}
          {activeTab === 'Profile' && (
            <TrainerProfile trainerData={trainerData} onUpdate={onTrainerUpdate} editMode={location.pathname.endsWith('/profile/edit')} />
          )}

          {/* ==================== Course management ==================== */}
          {activeTab === 'Courses' && (
            <TrainerCourses trainerData={trainerData} onOpenMessages={() => setActiveTab('Messages')} />
          )}

          {/* ==================== Students ==================== */}
          {activeTab === 'Students' && (
            <TrainerStudents onOpenMessages={() => setActiveTab('Messages')} />
          )}

          {/* ==================== Projects ==================== */}
          {activeTab === 'Projects' && <TrainerProjects trainerData={trainerData} />}

          {/* ==================== Assignments ==================== */}
          {activeTab === 'Assignments' && <TrainerAssignments trainerData={trainerData} />}

          {/* ==================== Announcements ==================== */}
          {activeTab === 'Announcements' && <TrainerAnnouncements trainerData={trainerData} />}

          {/* ==================== Messages ==================== */}
          {activeTab === 'Messages' && <TrainerMessages />}

          {/* ==================== Competitions ==================== */}
          {activeTab === 'Competitions' && <TrainerCompetitions trainerData={trainerData} />}

          {/* ==================== Settings ==================== */}
          {activeTab === 'Settings' && (
            <div className="tab-content td-settings-card">
              <h2>Settings</h2>
              <p>Signed in as {trainerData.email}</p>
              <button type="button" className="td-submit-btn danger" onClick={handleLogoutClick}>
                Logout
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TrainerDashboard;
