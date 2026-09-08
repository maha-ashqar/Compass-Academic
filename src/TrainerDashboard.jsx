import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiLogOut,
  FiMail,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiSettings,
  FiTarget,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

import './Assignments.css';
import './TrainerDashboard.css';

import TrainerSidebar from './TrainerSidebar';
import TrainerMessages from './TrainerMessages';
import TrainerStudents from './TrainerStudents';
import TrainerCourses from './TrainerCourses';
import TrainerAssignments from './TrainerAssignments';
import TrainerProjects from './TrainerProjects';
import TrainerCompetitions from './TrainerCompetitions';
import TrainerAnnouncements from './TrainerAnnouncements';
import TrainerProfile from './TrainerProfile';
import TrainerSettings from './TrainerSettings';
import { getTrainerDashboard } from './api/trainerDashboard';

const getInitials = (text) =>
  (text || '')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

const TrainerDashboard = ({
  trainerData,
  onTrainerUpdate,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.pathname.startsWith(
      '/trainer-dashboard/profile'
    )
      ? 'Profile'
      : location.pathname.startsWith(
            '/trainer-dashboard/competitions'
          )
        ? 'Competitions'
        : location.pathname.startsWith(
              '/trainer-dashboard/settings'
            ) ||
            location.pathname.startsWith(
              '/trainer-dashboard/support'
            )
          ? 'Settings'
          : location.pathname.startsWith(
                '/trainer-dashboard/announcements'
              )
            ? 'Announcements'
            : 'Home'
  );

  const [dashboardData, setDashboardData] =
    useState(null);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState('');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showUserMenu, setShowUserMenu] =
    useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const displayName =
    trainerData?.displayName ||
    trainerData?.fullName ||
    dashboardData?.trainer?.name ||
    'Trainer';

  const trainerAvatar =
    trainerData?.avatar ||
    dashboardData?.trainer?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      displayName
    )}`;

  const loadDashboard = async () => {
    try {
      setDashboardError('');

      const data = await getTrainerDashboard();

      setDashboardData(data);
    } catch (error) {
      setDashboardError(
        error.message ||
          'Unable to load trainer dashboard.'
      );
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'Home') {
      loadDashboard();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === 'Home') {
        loadDashboard();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () =>
      window.removeEventListener(
        'focus',
        handleFocus
      );
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, []);

  const handleLogoutClick = async () => {
    if (onLogout) {
      await onLogout();
    }

    navigate('/trainer-login', {
      replace: true,
    });
  };

  const handleTabSelect = (tab) => {
    if (tab === 'Competitions') {
      navigate(
        '/trainer-dashboard/competitions'
      );
    } else if (tab === 'Profile') {
      navigate('/trainer-dashboard/profile');
    } else if (tab === 'Settings') {
      navigate('/trainer-dashboard/settings');
    } else if (tab === 'Announcements') {
      navigate(
        '/trainer-dashboard/announcements'
      );
    } else if (
      location.pathname.startsWith(
        '/trainer-dashboard/competitions'
      ) ||
      location.pathname.startsWith(
        '/trainer-dashboard/profile'
      ) ||
      location.pathname.startsWith(
        '/trainer-dashboard/settings'
      ) ||
      location.pathname.startsWith(
        '/trainer-dashboard/support'
      ) ||
      location.pathname.startsWith(
        '/trainer-dashboard/announcements'
      )
    ) {
      navigate('/trainer-dashboard');
    }

    setActiveTab(tab);
  };

  const stats = dashboardData?.stats || {
    pending_reviews: 0,
    ungraded_assignments: 0,
    pending_projects: 0,
    active_students: 0,
    active_courses: 0,
    unread_messages: 0,
    pending_competition_registrations: 0,
  };

  const reviewQueue =
    dashboardData?.review_queue || [];

  const attentionStudents =
    dashboardData?.attention_students || [];

  const activeCourses =
    dashboardData?.active_courses || [];

  const recentMessages =
    dashboardData?.recent_messages || [];

  const filteredQueue = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return reviewQueue;
    }

    return reviewQueue.filter((item) =>
      `${item.title || ''} ${item.owner || ''} ${
        item.type || ''
      }`
        .toLowerCase()
        .includes(query)
    );
  }, [reviewQueue, searchQuery]);

  const trainerAlerts = useMemo(
    () =>
      [
        stats.ungraded_assignments > 0 && {
          id: 'assignments',
          icon: <FiFileText />,
          text: `${
            stats.ungraded_assignments
          } submission${
            stats.ungraded_assignments === 1
              ? ''
              : 's'
          } awaiting grading`,
          tab: 'Assignments',
        },

        stats.pending_projects > 0 && {
          id: 'projects',
          icon: <FiBriefcase />,
          text: `${
            stats.pending_projects
          } project${
            stats.pending_projects === 1
              ? ''
              : 's'
          } awaiting review`,
          tab: 'Projects',
        },

        stats
          .pending_competition_registrations >
          0 && {
          id: 'competitions',
          icon: <FiTarget />,
          text: `${
            stats
              .pending_competition_registrations
          } competition registration request${
            stats
              .pending_competition_registrations ===
            1
              ? ''
              : 's'
          }`,
          tab: 'Competitions',
        },

        stats.unread_messages > 0 && {
          id: 'messages',
          icon: <FiMail />,
          text: `${
            stats.unread_messages
          } unread message${
            stats.unread_messages === 1
              ? ''
              : 's'
          }`,
          tab: 'Messages',
        },
      ].filter(Boolean),
    [stats]
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

            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search students, courses, or submissions"
            />
          </div>

          <div className="header-controls">
            <div
              className="notif-dropdown-wrap"
              ref={notifRef}
            >
              <button
                type="button"
                className="icon-btn"
                onClick={() =>
                  setShowNotifications(
                    (current) => !current
                  )
                }
              >
                <FiBell className="header-icon" />

                {trainerAlerts.length > 0 && (
                  <span className="notif-badge">
                    {trainerAlerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-head">
                    <h4>Notifications</h4>
                  </div>

                  {trainerAlerts.length ? (
                    trainerAlerts.map(
                      (alert) => (
                        <button
                          type="button"
                          key={alert.id}
                          className="notif-dropdown-item"
                          onClick={() => {
                            handleTabSelect(
                              alert.tab
                            );

                            setShowNotifications(
                              false
                            );
                          }}
                        >
                          <span className="notif-dropdown-icon">
                            {alert.icon}
                          </span>

                          <span>
                            {alert.text}
                          </span>
                        </button>
                      )
                    )
                  ) : (
                    <p className="notif-dropdown-empty">
                      You're all caught up.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={() =>
                handleTabSelect('Messages')
              }
            >
              <FiMail className="header-icon" />

              {stats.unread_messages > 0 && (
                <span className="notif-badge">
                  {stats.unread_messages}
                </span>
              )}
            </button>

            <div
              className="header-user-wrap"
              ref={userMenuRef}
            >
              <button
                type="button"
                className="header-user"
                onClick={() =>
                  setShowUserMenu(
                    (current) => !current
                  )
                }
              >
                <span className="user-name">
                  {displayName
                    .split(' ')
                    .slice(-1)[0]}
                </span>

                <img
                  src={trainerAvatar}
                  alt="Trainer Avatar"
                  className="header-avatar"
                />
              </button>

              {showUserMenu && (
                <div className="header-user-menu">
                  <div className="header-user-menu-head">
                    <img
                      src={trainerAvatar}
                      alt={displayName}
                    />

                    <div>
                      <strong>
                        {displayName}
                      </strong>

                      <small>
                        {trainerData?.email ||
                          dashboardData
                            ?.trainer
                            ?.email}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleTabSelect(
                        'Profile'
                      );

                      setShowUserMenu(false);
                    }}
                  >
                    <FiUser />
                    View profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleTabSelect(
                        'Settings'
                      );

                      setShowUserMenu(false);
                    }}
                  >
                    <FiSettings />
                    Settings
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={
                      handleLogoutClick
                    }
                  >
                    <FiLogOut />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          {activeTab === 'Home' && (
            <div className="tab-content">
              <div className="td-home-heading">
                <div className="welcome-text">
                  <span>
                    TRAINER WORKSPACE
                  </span>

                  <h1>
                    Good morning,{' '}
                    {displayName}
                  </h1>

                  <p>
                    Review priority work,
                    support students, and keep
                    every course moving.
                  </p>
                </div>

                <div className="td-quick-actions">
                  <button
                    className="primary"
                    onClick={() =>
                      handleTabSelect(
                        'Courses'
                      )
                    }
                  >
                    <FiPlus />
                    Add course
                  </button>

                  <button
                    onClick={() =>
                      handleTabSelect(
                        'Assignments'
                      )
                    }
                  >
                    Create assignment
                  </button>

                  <button
                    onClick={() =>
                      handleTabSelect(
                        'Announcements'
                      )
                    }
                  >
                    Post update
                  </button>
                </div>
              </div>

              {dashboardLoading &&
              !dashboardData ? (
                <div className="td-panel-empty">
                  Loading trainer
                  dashboard...
                </div>
              ) : dashboardError &&
                !dashboardData ? (
                <div className="td-panel-empty">
                  {dashboardError}
                </div>
              ) : (
                <>
                  <div className="td-operations-stats">
                    <article className="orange">
                      <FiCheckCircle />

                      <strong>
                        {
                          stats.pending_reviews
                        }
                      </strong>

                      <b>
                        Pending reviews
                      </b>

                      <small>
                        {
                          stats.ungraded_assignments
                        }{' '}
                        assignments to grade
                      </small>
                    </article>

                    <article className="blue">
                      <FiUsers />

                      <strong>
                        {
                          stats.active_students
                        }
                      </strong>

                      <b>
                        Active students
                      </b>

                      <small>
                        {
                          attentionStudents.length
                        }{' '}
                        need attention
                      </small>
                    </article>

                    <article className="green">
                      <FiBookOpen />

                      <strong>
                        {
                          stats.active_courses
                        }
                      </strong>

                      <b>
                        Active courses
                      </b>

                      <small>
                        Managed from your
                        catalog
                      </small>
                    </article>

                    <article className="red">
                      <FiMail />

                      <strong>
                        {
                          stats.unread_messages
                        }
                      </strong>

                      <b>
                        Unread messages
                      </b>

                      <small>
                        Open inbox to respond
                      </small>
                    </article>
                  </div>

                  <div className="td-operations-grid">
                    <section className="td-panel td-review-panel">
                      <div className="td-panel-head">
                        <div>
                          <h2>
                            Priority review
                            queue
                          </h2>

                          <p>
                            Assignments and
                            projects waiting for
                            your review
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleTabSelect(
                              'Projects'
                            )
                          }
                        >
                          View all
                          <FiArrowRight />
                        </button>
                      </div>

                      <div className="td-review-list">
                        {filteredQueue.length ? (
                          filteredQueue.map(
                            (item) => (
                              <article
                                key={item.id}
                              >
                                <span
                                  className={`td-type ${item.type.toLowerCase()}`}
                                >
                                  {
                                    item.type[0]
                                  }
                                </span>

                                <div>
                                  <strong>
                                    {
                                      item.title
                                    }
                                  </strong>

                                  <small>
                                    {item.type} ·{' '}
                                    {
                                      item.owner
                                    }
                                  </small>
                                </div>

                                <em>
                                  {
                                    item.status
                                  }
                                </em>

                                <button
                                  onClick={() =>
                                    handleTabSelect(
                                      item.target
                                    )
                                  }
                                >
                                  Review
                                </button>
                              </article>
                            )
                          )
                        ) : (
                          <div className="td-panel-empty">
                            No matching reviews.
                            Your queue is clear.
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="td-panel">
                      <div className="td-panel-head">
                        <div>
                          <h2>
                            Students needing
                            attention
                          </h2>

                          <p>
                            Early signals from
                            course progress
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleTabSelect(
                              'Students'
                            )
                          }
                        >
                          Open list
                          <FiArrowRight />
                        </button>
                      </div>

                      <div className="td-attention-list">
                        {attentionStudents.map(
                          (student) => (
                            <article
                              key={student.id}
                            >
                              <span>
                                {getInitials(
                                  student.name
                                )}
                              </span>

                              <div>
                                <strong>
                                  {
                                    student.name
                                  }
                                </strong>

                                <small>
                                  {
                                    student.progress
                                  }
                                  % progress
                                </small>

                                <i>
                                  <b
                                    style={{
                                      width: `${student.progress}%`,
                                    }}
                                  />
                                </i>
                              </div>

                              <em>
                                {student.progress <
                                45
                                  ? 'Needs support'
                                  : 'Needs feedback'}
                              </em>
                            </article>
                          )
                        )}

                        {!attentionStudents.length && (
                          <div className="td-panel-empty">
                            All students are
                            currently on track.
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="td-panel">
                      <div className="td-panel-head">
                        <div>
                          <h2>
                            Active courses
                          </h2>

                          <p>
                            Your current teaching
                            workload
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleTabSelect(
                              'Courses'
                            )
                          }
                        >
                          Manage courses
                          <FiArrowRight />
                        </button>
                      </div>

                      <div className="td-course-rows">
                        {activeCourses.map(
                          (course) => (
                            <article
                              key={course.id}
                            >
                              <span>
                                {getInitials(
                                  course.category
                                )}
                              </span>

                              <div>
                                <strong>
                                  {
                                    course.title
                                  }
                                </strong>

                                <small>
                                  {
                                    course.students
                                  }{' '}
                                  students ·{' '}
                                  {
                                    course.lessons
                                  }{' '}
                                  lessons
                                </small>
                              </div>

                              <i>
                                <b
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Number(
                                        course.progress
                                      ) || 0
                                    )}%`,
                                  }}
                                />
                              </i>

                              <FiMoreHorizontal />
                            </article>
                          )
                        )}

                        {!activeCourses.length && (
                          <div className="td-panel-empty">
                            No active courses yet.
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="td-panel">
                      <div className="td-panel-head">
                        <div>
                          <h2>
                            Recent messages
                          </h2>

                          <p>
                            Latest student
                            conversations
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleTabSelect(
                              'Messages'
                            )
                          }
                        >
                          Open inbox
                          <FiArrowRight />
                        </button>
                      </div>

                      <div className="td-message-rows">
                        {recentMessages.map(
                          (chat) => (
                            <button
                              key={chat.id}
                              onClick={() =>
                                handleTabSelect(
                                  'Messages'
                                )
                              }
                            >
                              <span>
                                {getInitials(
                                  chat.name
                                )}
                              </span>

                              <div>
                                <strong>
                                  {chat.name}
                                </strong>

                                <small>
                                  {chat.message ||
                                    'No messages yet'}
                                </small>
                              </div>

                              {chat.unread_count >
                                0 && <i />}
                            </button>
                          )
                        )}

                        {!recentMessages.length && (
                          <div className="td-panel-empty">
                            No recent messages.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'Profile' && (
            <TrainerProfile
              trainerData={trainerData}
              onUpdate={onTrainerUpdate}
              editMode={location.pathname.endsWith(
                '/profile/edit'
              )}
            />
          )}

          {activeTab === 'Courses' && (
            <TrainerCourses
              trainerData={trainerData}
              onOpenMessages={() =>
                handleTabSelect(
                  'Messages'
                )
              }
            />
          )}

          {activeTab === 'Students' && (
            <TrainerStudents
              onOpenMessages={() =>
                handleTabSelect(
                  'Messages'
                )
              }
            />
          )}

          {activeTab === 'Projects' && (
            <TrainerProjects
              trainerData={trainerData}
            />
          )}

          {activeTab === 'Assignments' && (
            <TrainerAssignments
              trainerData={trainerData}
            />
          )}

          {activeTab ===
            'Announcements' && (
            <TrainerAnnouncements
              trainerData={trainerData}
            />
          )}

          {activeTab === 'Messages' && (
            <TrainerMessages
              trainerData={trainerData}
            />
          )}

          {activeTab ===
            'Competitions' && (
            <TrainerCompetitions
              trainerData={trainerData}
            />
          )}

          {activeTab === 'Settings' && (
            <TrainerSettings
              trainerData={trainerData}
              onLogout={onLogout}
              onSelectTab={
                handleTabSelect
              }
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default TrainerDashboard;