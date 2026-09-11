import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FiAlertTriangle,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiGlobe,
  FiKey,
  FiLock,
  FiLogOut,
  FiMail,
  FiMessageSquare,
  FiMonitor,
  FiMoon,
  FiShield,
  FiStar,
  FiType,
  FiUser,
  FiVolume2,
} from 'react-icons/fi';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  useCoursesCatalog,
} from './CoursesCatalogContext';

import {
  useTrainerAssignments,
} from './TrainerAssignmentsContext';

import {
  useProjects,
} from './ProjectsContext';

import {
  useCompetitions,
} from './CompetitionsContext';

import {
  changeTrainerPassword,
} from './api/trainerSettings';

import './TrainerSettings.css';

const APPEARANCE_KEY =
  'compass_trainer_appearance_v1';

const appearanceDefaults = {
  darkMode: false,
  fontSize: 'medium',
};

const readStored = (
  key,
  fallback
) => {
  try {
    const value =
      JSON.parse(
        localStorage.getItem(key)
      );

    return value &&
      typeof value === 'object'
      ? {
          ...fallback,
          ...value,
        }
      : fallback;
  } catch {
    return fallback;
  }
};

const sectionFromPath = (
  pathname
) => {
  if (
    pathname.endsWith(
      '/password'
    )
  ) {
    return 'password';
  }

  if (
    pathname.endsWith(
      '/devices'
    )
  ) {
    return 'devices';
  }

  if (
    pathname.endsWith(
      '/notifications'
    )
  ) {
    return 'notifications';
  }

  if (
    pathname.endsWith(
      '/privacy'
    )
  ) {
    return 'privacy';
  }

  if (
    pathname.endsWith(
      '/login-activity'
    )
  ) {
    return 'login-activity';
  }

  if (
    pathname.endsWith(
      '/support/report'
    )
  ) {
    return 'report';
  }

  if (
    pathname.endsWith(
      '/support/complaint'
    )
  ) {
    return 'complaint';
  }

  if (
    pathname.endsWith(
      '/support/contact'
    )
  ) {
    return 'contact';
  }

  if (
    pathname.endsWith(
      '/support/rating'
    )
  ) {
    return 'rating';
  }

  return 'overview';
};

const Toggle = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    className={`trainer-settings-toggle${
      checked ? ' active' : ''
    }`}
    onClick={() =>
      onChange(!checked)
    }
    aria-label={label}
    aria-pressed={checked}
  >
    <span />
  </button>
);

const Row = ({
  icon,
  label,
  value,
  onClick,
  toggle,
  checked,
  onToggle,
  disabled = false,
}) => {
  const clickable =
    Boolean(onClick) &&
    !disabled &&
    !toggle;

  return (
    <div
      className="trainer-settings-row"
      role={
        clickable
          ? 'button'
          : undefined
      }
      tabIndex={
        clickable ? 0 : undefined
      }
      aria-disabled={
        disabled || undefined
      }
      onClick={
        clickable
          ? onClick
          : undefined
      }
      onKeyDown={
        clickable
          ? (event) => {
              if (
                event.key ===
                  'Enter' ||
                event.key === ' '
              ) {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={
        disabled
          ? {
              opacity: 0.55,
              cursor:
                'not-allowed',
            }
          : undefined
      }
    >
      <span className="trainer-settings-row-icon">
        {icon}
      </span>

      <span className="trainer-settings-row-label">
        {label}
      </span>

      {disabled ? (
        <small>
          Coming soon
        </small>
      ) : value ? (
        <small>{value}</small>
      ) : null}

      {toggle &&
      !disabled ? (
        <Toggle
          checked={checked}
          onChange={onToggle}
          label={label}
        />
      ) : clickable ? (
        <FiChevronRight className="trainer-settings-chevron" />
      ) : null}
    </div>
  );
};

const Group = ({
  title,
  children,
}) => (
  <section className="trainer-settings-group">
    <h2>{title}</h2>
    {children}
  </section>
);

const ComingSoon = ({
  title,
  description,
}) => (
  <div className="trainer-settings-form-card">
    <FiLock
      style={{
        fontSize: 30,
      }}
    />

    <h2>
      {title}
    </h2>

    <p>
      {description}
    </p>

    <strong>
      Coming soon
    </strong>
  </div>
);

export default function TrainerSettings({
  trainerData,
  onLogout,
  onSelectTab,
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const section =
    sectionFromPath(
      location.pathname
    );

  const { courses = [] } =
    useCoursesCatalog();

  const {
    assignments = [],
  } =
    useTrainerAssignments();

  const { projects = [] } =
    useProjects();

  const competitionApi =
    useCompetitions();

  const [
    appearance,
    setAppearance,
  ] = useState(() =>
    readStored(
      APPEARANCE_KEY,
      appearanceDefaults
    )
  );

  const [
    password,
    setPassword,
  ] = useState({
    current: '',
    next: '',
    confirm: '',
    logoutOthers: true,
  });

  const [
    passwordSaving,
    setPasswordSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState('');

  const firstName =
    trainerData?.displayName ||
    trainerData?.fullName ||
    'Trainer';

  const avatar =
    trainerData?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      firstName
    )}`;

  const competitions =
    competitionApi
      ?.competitions ||
    competitionApi
      ?.getTrainerCompetitions?.() ||
    [];

  const trainerCourses =
    courses.filter(
      (course) =>
        course.createdByTrainer ||
        course.instructor ===
          trainerData?.displayName
    );

  const openAssignments =
    assignments.filter(
      (assignment) =>
        assignment.status !==
        'graded'
    ).length;

  const pendingProjects =
    projects.filter(
      (project) =>
        [
          'submitted',
          'pending',
          'pending-review',
          'resubmitted',
        ].includes(
          project.status
        )
    ).length;

  const sectionTitle =
    useMemo(
      () =>
        ({
          password:
            'Change password',

          devices:
            'Devices & login sessions',

          notifications:
            'Notification preferences',

          privacy:
            'Privacy & security',

          'login-activity':
            'Login activity',

          report:
            'Report a problem',

          complaint:
            'Submit a complaint',

          contact:
            'Contact support',

          rating:
            'Rate Compass Academy',
        })[section] ||
        'Settings',
      [section]
    );

  useEffect(() => {
    const root =
      document.documentElement;

    root.classList.toggle(
      'dark-theme',
      appearance.darkMode
    );

    root.dataset.fontSize =
      appearance.fontSize;

    const zoomMap = {
      small: '0.94',
      medium: '1',
      large: '1.07',
    };

    root.style.setProperty(
      '--ui-zoom',
      zoomMap[
        appearance.fontSize
      ] || '1'
    );
  }, [appearance]);

  const updateAppearance = (
    next
  ) => {
    const value = {
      ...appearance,
      ...next,
    };

    setAppearance(value);

    localStorage.setItem(
      APPEARANCE_KEY,
      JSON.stringify(value)
    );
  };

  const openDashboardTab = (
    tab,
    path
  ) => {
    if (onSelectTab) {
      onSelectTab(tab);
      return;
    }

    navigate(path);
  };

  const back = () =>
    navigate(
      '/trainer-dashboard/settings'
    );

  const submitPassword =
    async (event) => {
      event.preventDefault();

      if (
        !password.current
      ) {
        setMessage(
          'Enter your current password.'
        );

        return;
      }

      if (
        password.next.length <
        8
      ) {
        setMessage(
          'The new password must contain at least 8 characters.'
        );

        return;
      }

      if (
        password.next !==
        password.confirm
      ) {
        setMessage(
          'The new passwords do not match.'
        );

        return;
      }

      try {
        setPasswordSaving(true);
        setMessage('');

        const response =
          await changeTrainerPassword(
            {
              current_password:
                password.current,

              password:
                password.next,

              password_confirmation:
                password.confirm,

              logout_others:
                password.logoutOthers,
            }
          );

        setPassword({
          current: '',
          next: '',
          confirm: '',
          logoutOthers: true,
        });

        setMessage(
          response.message ||
            'Password updated successfully.'
        );
      } catch (
        error
      ) {
        setMessage(
          error.message ||
            'Password could not be updated.'
        );
      } finally {
        setPasswordSaving(
          false
        );
      }
    };

  const openSupportEmail = (
    subject = ''
  ) => {
    const url =
      `mailto:support@compass.academy` +
      (subject
        ? `?subject=${encodeURIComponent(
            subject
          )}`
        : '');

    window.location.href =
      url;
  };

  const logout = () => {
    onLogout?.();

    localStorage.removeItem(
      'trainer_token'
    );

    sessionStorage.removeItem(
      'trainer_token'
    );

    navigate(
      '/trainer-login',
      {
        replace: true,
      }
    );
  };

  if (
    section !==
    'overview'
  ) {
    return (
      <div className="trainer-settings-page">
        <button
          type="button"
          className="trainer-settings-back"
          onClick={back}
        >
          <FiChevronLeft />

          Back to settings
        </button>

        <header className="trainer-settings-title">
          <div>
            <span>
              TRAINER SETTINGS
            </span>

            <h1>
              {sectionTitle}
            </h1>

            <p>
              Manage this
              setting for your
              instructor account.
            </p>
          </div>
        </header>

        {message && (
          <div className="trainer-settings-message">
            {message}
          </div>
        )}

        {section ===
          'password' && (
          <form
            className="trainer-settings-form-card"
            onSubmit={
              submitPassword
            }
          >
            <label>
              Current password

              <input
                type="password"
                value={
                  password.current
                }
                onChange={(
                  event
                ) =>
                  setPassword({
                    ...password,
                    current:
                      event.target
                        .value,
                  })
                }
                autoComplete="current-password"
              />
            </label>

            <label>
              New password

              <input
                type="password"
                value={
                  password.next
                }
                onChange={(
                  event
                ) =>
                  setPassword({
                    ...password,
                    next:
                      event.target
                        .value,
                  })
                }
                autoComplete="new-password"
              />
            </label>

            <label>
              Confirm new
              password

              <input
                type="password"
                value={
                  password.confirm
                }
                onChange={(
                  event
                ) =>
                  setPassword({
                    ...password,
                    confirm:
                      event.target
                        .value,
                  })
                }
                autoComplete="new-password"
              />
            </label>

            <label className="trainer-settings-check">
              <input
                type="checkbox"
                checked={
                  password.logoutOthers
                }
                onChange={(
                  event
                ) =>
                  setPassword({
                    ...password,
                    logoutOthers:
                      event.target
                        .checked,
                  })
                }
              />

              Sign out all other
              sessions
            </label>

            <button
              className="trainer-settings-primary"
              disabled={
                passwordSaving
              }
            >
              {passwordSaving
                ? 'Updating...'
                : 'Update password'}
            </button>
          </form>
        )}

        {section ===
          'devices' && (
          <ComingSoon
            title="Device management"
            description="Secure device and session management will be added with full session tracking."
          />
        )}

        {section ===
          'login-activity' && (
          <ComingSoon
            title="Login activity"
            description="Login history, device details, IP information, and security activity will be available later."
          />
        )}

        {section ===
          'notifications' && (
          <ComingSoon
            title="Trainer notifications"
            description="Trainer-specific notification preferences will be connected after the complete trainer notification system is available."
          />
        )}

        {section ===
          'privacy' && (
          <ComingSoon
            title="Privacy & security"
            description="Profile visibility, two-factor authentication, and advanced account security are coming soon."
          />
        )}

        {section ===
          'rating' && (
          <ComingSoon
            title="Platform rating"
            description="Platform ratings and feedback will be connected to the academy feedback system later."
          />
        )}

        {[
          'report',
          'complaint',
          'contact',
        ].includes(
          section
        ) && (
          <div className="trainer-settings-form-card">
            <FiMail
              style={{
                fontSize: 30,
              }}
            />

            <h2>
              Contact Compass
              Academy
            </h2>

            <p>
              Your email
              application will
              open with the
              appropriate support
              subject.
            </p>

            <button
              type="button"
              className="trainer-settings-primary"
              onClick={() =>
                openSupportEmail(
                  section ===
                    'report'
                    ? 'Report a problem'
                    : section ===
                        'complaint'
                      ? 'Trainer complaint'
                      : 'Trainer support request'
                )
              }
            >
              <FiMail />

              Open email
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="trainer-settings-page">
      <header className="trainer-settings-title">
        <div>
          <span>
            ACCOUNT MANAGEMENT
          </span>

          <h1>
            Settings
          </h1>

          <p>
            Manage your account,
            preferences, privacy,
            and support requests.
          </p>
        </div>
      </header>

      <section className="trainer-settings-profile">
        <img
          src={avatar}
          alt={firstName}
        />

        <div>
          <h2>
            {firstName}
          </h2>

          <p>
            {trainerData?.major ||
              'Course instructor'}
          </p>
        </div>

        <span>
          Active
        </span>

        <button
          onClick={() =>
            openDashboardTab(
              'Profile',
              '/trainer-dashboard/profile'
            )
          }
        >
          <FiUser />

          View profile
        </button>
      </section>

      <Group title="Account">
        <Row
          icon={<FiUser />}
          label="View & edit profile"
          onClick={() =>
            openDashboardTab(
              'Profile',
              '/trainer-dashboard/profile'
            )
          }
        />

        <Row
          icon={<FiLock />}
          label="Change password"
          onClick={() =>
            navigate(
              '/trainer-dashboard/settings/password'
            )
          }
        />

        <Row
          icon={<FiMonitor />}
          label="Devices & login sessions"
          disabled
        />
      </Group>

      <Group title="Content & notifications">
        <Row
          icon={<FiVolume2 />}
          label="Manage announcements"
          value="Published, scheduled, archived"
          onClick={() =>
            openDashboardTab(
              'Announcements',
              '/trainer-dashboard/announcements'
            )
          }
        />

        <Row
          icon={<FiBell />}
          label="Notification preferences"
          disabled
        />

        <Row
          icon={<FiMail />}
          label="Email notifications"
          disabled
        />
      </Group>

      <Group title="Teaching management">
        <Row
          icon={<FiVolume2 />}
          label="Courses: add, edit, archive or delete"
          value={`${trainerCourses.length} courses`}
          onClick={() =>
            openDashboardTab(
              'Courses',
              '/trainer-dashboard'
            )
          }
        />

        <Row
          icon={<FiLock />}
          label="Assignments and student submissions"
          value={`${openAssignments} awaiting review`}
          onClick={() =>
            openDashboardTab(
              'Assignments',
              '/trainer-dashboard'
            )
          }
        />

        <Row
          icon={<FiEye />}
          label="Project review queue"
          value={`${pendingProjects} pending`}
          onClick={() =>
            openDashboardTab(
              'Projects',
              '/trainer-dashboard'
            )
          }
        />

        <Row
          icon={<FiStar />}
          label="Competitions management"
          value={`${competitions.length} competitions`}
          onClick={() =>
            openDashboardTab(
              'Competitions',
              '/trainer-dashboard/competitions'
            )
          }
        />

        <Row
          icon={<FiBell />}
          label="Announcement tracking"
          onClick={() =>
            openDashboardTab(
              'Announcements',
              '/trainer-dashboard/announcements'
            )
          }
        />
      </Group>

      <Group title="Appearance">
        <Row
          icon={<FiMoon />}
          label="Dark mode"
          toggle
          checked={
            appearance.darkMode
          }
          onToggle={(
            value
          ) =>
            updateAppearance({
              darkMode: value,
            })
          }
        />

        <Row
          icon={<FiGlobe />}
          label="Language"
          disabled
        />

        <Row
          icon={<FiType />}
          label="Font size"
          value={
            appearance.fontSize ===
            'large'
              ? 'Large'
              : appearance.fontSize ===
                  'small'
                ? 'Small'
                : 'Default'
          }
          onClick={() =>
            updateAppearance({
              fontSize:
                appearance.fontSize ===
                'medium'
                  ? 'large'
                  : appearance.fontSize ===
                      'large'
                    ? 'small'
                    : 'medium',
            })
          }
        />
      </Group>

      <Group title="Privacy & security">
        <Row
          icon={<FiShield />}
          label="Two-factor authentication"
          disabled
        />

        <Row
          icon={<FiEye />}
          label="Profile visibility"
          disabled
        />

        <Row
          icon={<FiKey />}
          label="Login activity"
          disabled
        />
      </Group>

      <Group title="Support">
        <Row
          icon={
            <FiAlertTriangle />
          }
          label="Report a problem"
          onClick={() =>
            openSupportEmail(
              'Report a problem'
            )
          }
        />

        <Row
          icon={
            <FiMessageSquare />
          }
          label="Submit a complaint"
          onClick={() =>
            openSupportEmail(
              'Trainer complaint'
            )
          }
        />

        <Row
          icon={<FiMail />}
          label="Contact support"
          onClick={() =>
            openSupportEmail(
              'Trainer support request'
            )
          }
        />

        <Row
          icon={<FiStar />}
          label="Rate Compass Academy"
          disabled
        />
      </Group>

      <button
        className="trainer-settings-logout"
        onClick={logout}
      >
        <FiLogOut />

        Log out
      </button>
    </div>
  );
}