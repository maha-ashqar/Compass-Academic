import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle, FiBell, FiChevronLeft, FiChevronRight,
  FiEye, FiGlobe, FiKey, FiLock, FiLogOut, FiMail, FiMessageSquare,
  FiMonitor, FiMoon, FiSend, FiShield, FiStar, FiType, FiUser,
  FiVolume2,
} from 'react-icons/fi';
import { useSettings } from './SettingsContext';
import { useCoursesCatalog } from './CoursesCatalogContext';
import { useTrainerAssignments } from './TrainerAssignmentsContext';
import { useProjects } from './ProjectsContext';
import { useCompetitions } from './CompetitionsContext';
import { useAnnouncements } from './AnnouncementsContext';
import './TrainerSettings.css';

const PREFS_KEY = 'compass_trainer_notification_preferences';
const PRIVACY_KEY = 'compass_trainer_privacy_preferences';
const TICKETS_KEY = 'compass_trainer_support_tickets';
const RATING_KEY = 'compass_trainer_platform_rating';

const readStored = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === 'object' ? { ...fallback, ...value } : fallback;
  } catch { return fallback; }
};

const notificationDefaults = {
  inApp: true, email: true, announcements: true, assignments: true,
  projects: true, competitions: true, messages: true,
};

const privacyDefaults = {
  visibility: 'university-members', showEmail: true, showPhone: false,
  loginAlerts: true,
};

const sectionFromPath = (pathname) => {
  if (pathname.endsWith('/password')) return 'password';
  if (pathname.endsWith('/devices')) return 'devices';
  if (pathname.endsWith('/notifications')) return 'notifications';
  if (pathname.endsWith('/privacy')) return 'privacy';
  if (pathname.endsWith('/login-activity')) return 'login-activity';
  if (pathname.endsWith('/support/report')) return 'report';
  if (pathname.endsWith('/support/complaint')) return 'complaint';
  if (pathname.endsWith('/support/contact')) return 'contact';
  if (pathname.endsWith('/support/rating')) return 'rating';
  return 'overview';
};

const Toggle = ({ checked, onChange, label }) => (
  <button type="button" className={`trainer-settings-toggle${checked ? ' active' : ''}`} onClick={() => onChange(!checked)} aria-label={label} aria-pressed={checked}>
    <span />
  </button>
);

const Row = ({ icon, label, value, onClick, toggle, checked, onToggle }) => (
  <div
    className="trainer-settings-row"
    role={toggle ? undefined : 'button'}
    tabIndex={toggle ? undefined : 0}
    onClick={toggle ? undefined : onClick}
    onKeyDown={toggle ? undefined : (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.();
      }
    }}
  >
    <span className="trainer-settings-row-icon">{icon}</span>
    <span className="trainer-settings-row-label">{label}</span>
    {value && <small>{value}</small>}
    {toggle
      ? <Toggle checked={checked} onChange={onToggle} label={label} />
      : <FiChevronRight className="trainer-settings-chevron" />}
  </div>
);

const Group = ({ title, children }) => (
  <section className="trainer-settings-group">
    <h2>{title}</h2>
    {children}
  </section>
);

export default function TrainerSettings({ trainerData, onLogout, onSelectTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const section = sectionFromPath(location.pathname);
  const {
    darkMode, toggleDarkMode, language, setLanguage, fontSize, setFontSize,
    twoFactorEnabled, toggleTwoFactor, devices = [], removeDevice,
  } = useSettings();
  const { courses = [] } = useCoursesCatalog();
  const { assignments = [] } = useTrainerAssignments();
  const { projects = [] } = useProjects();
  const competitionApi = useCompetitions();
  const { announcements = [] } = useAnnouncements();
  const [notifications, setNotifications] = useState(() => readStored(PREFS_KEY, notificationDefaults));
  const [privacy, setPrivacy] = useState(() => readStored(PRIVACY_KEY, privacyDefaults));
  const [password, setPassword] = useState({ current: '', next: '', confirm: '', logoutOthers: true });
  const [ticket, setTicket] = useState({ category: 'Technical issue', title: '', description: '', confidential: false });
  const [rating, setRating] = useState(() => readStored(RATING_KEY, { score: 0, comment: '', submitted: false }));
  const [message, setMessage] = useState('');

  const firstName = trainerData?.displayName || trainerData?.fullName || 'Trainer';
  const avatar = trainerData?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName)}`;
  const competitions = competitionApi?.competitions || competitionApi?.getTrainerCompetitions?.() || [];
  const trainerCourses = courses.filter((course) =>
    course.createdByTrainer || course.instructor === trainerData?.displayName
  );
  const openAssignments = assignments.filter((assignment) => assignment.status !== 'graded').length;
  const pendingProjects = projects.filter((project) =>
    ['submitted', 'pending', 'pending-review', 'resubmitted'].includes(project.status)
  ).length;
  const sectionTitle = useMemo(() => ({
    password: 'Change password', devices: 'Devices & login sessions',
    notifications: 'Notification preferences', privacy: 'Privacy & security',
    'login-activity': 'Login activity', report: 'Report a problem',
    complaint: 'Submit a complaint', contact: 'Contact support', rating: 'Rate Compass Academy',
  }[section] || 'Settings'), [section]);

  const go = (path) => navigate(path);
  const openDashboardTab = (tab, path) => {
    if (onSelectTab) onSelectTab(tab);
    else navigate(path);
  };
  const back = () => navigate('/trainer-dashboard/settings');
  const saveObject = (key, value, setter) => {
    localStorage.setItem(key, JSON.stringify(value));
    setter(value);
    setMessage('Changes saved successfully.');
  };

  const submitPassword = (event) => {
    event.preventDefault();
    if (!password.current) return setMessage('Enter your current password.');
    if (password.next.length < 8) return setMessage('The new password must contain at least 8 characters.');
    if (password.next !== password.confirm) return setMessage('The new passwords do not match.');
    if (password.logoutOthers) devices.filter((item) => !item.current).forEach((item) => removeDevice(item.id));
    localStorage.setItem('compass_trainer_password_changed_at', new Date().toISOString());
    setPassword({ current: '', next: '', confirm: '', logoutOthers: true });
    setMessage('Password updated. A security notification was recorded.');
  };

  const submitTicket = (event) => {
    event.preventDefault();
    if (!ticket.title.trim() || !ticket.description.trim()) return setMessage('Complete the subject and description.');
    const id = `CMP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const stored = readStored(TICKETS_KEY, { items: [] });
    localStorage.setItem(TICKETS_KEY, JSON.stringify({ items: [{ ...ticket, id, type: section, status: 'Submitted', createdAt: new Date().toISOString() }, ...(stored.items || [])] }));
    setTicket({ category: 'Technical issue', title: '', description: '', confidential: false });
    setMessage(`Submitted successfully. Ticket ID: ${id}`);
  };

  const logout = () => {
    onLogout?.();
    localStorage.removeItem('trainerToken');
    localStorage.removeItem('trainerData');
    sessionStorage.clear();
    navigate('/trainer-login', { replace: true });
  };

  if (section !== 'overview') {
    return (
      <div className="trainer-settings-page">
        <button type="button" className="trainer-settings-back" onClick={back}><FiChevronLeft /> Back to settings</button>
        <header className="trainer-settings-title"><div><span>TRAINER SETTINGS</span><h1>{sectionTitle}</h1><p>Manage this setting for your instructor account.</p></div></header>
        {message && <div className="trainer-settings-message">{message}</div>}

        {section === 'password' && <form className="trainer-settings-form-card" onSubmit={submitPassword}>
          <label>Current password<input type="password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} /></label>
          <label>New password<input type="password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} /></label>
          <label>Confirm new password<input type="password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} /></label>
          <label className="trainer-settings-check"><input type="checkbox" checked={password.logoutOthers} onChange={(e) => setPassword({ ...password, logoutOthers: e.target.checked })} /> Sign out all other devices</label>
          <button className="trainer-settings-primary">Update password</button>
        </form>}

        {(section === 'devices' || section === 'login-activity') && <div className="trainer-settings-form-card">
          {devices.map((device) => <article className="trainer-device" key={device.id}><FiMonitor /><div><strong>{device.name}</strong><small>{device.location} · {device.lastActive}</small></div>{device.current ? <b>Current device</b> : <button onClick={() => removeDevice(device.id)}>Sign out</button>}</article>)}
          {!devices.length && <p>No active devices.</p>}
        </div>}

        {section === 'notifications' && <div className="trainer-settings-form-card trainer-preferences">
          {Object.entries({ inApp: 'In-app notifications', email: 'Email notifications', announcements: 'Announcements', assignments: 'Assignment submissions', projects: 'Project reviews', competitions: 'Competitions', messages: 'Messages' }).map(([key, label]) => <div key={key}><span>{label}</span><Toggle checked={notifications[key]} onChange={(value) => saveObject(PREFS_KEY, { ...notifications, [key]: value }, setNotifications)} label={label} /></div>)}
        </div>}

        {section === 'privacy' && <div className="trainer-settings-form-card trainer-preferences">
          <label>Profile visibility<select value={privacy.visibility} onChange={(e) => saveObject(PRIVACY_KEY, { ...privacy, visibility: e.target.value }, setPrivacy)}><option value="university-members">University members</option><option value="students-only">My students only</option><option value="private">Private</option></select></label>
          {Object.entries({ showEmail: 'Show university email', showPhone: 'Show phone number', loginAlerts: 'Security login alerts' }).map(([key, label]) => <div key={key}><span>{label}</span><Toggle checked={privacy[key]} onChange={(value) => saveObject(PRIVACY_KEY, { ...privacy, [key]: value }, setPrivacy)} label={label} /></div>)}
          <div><span>Two-factor authentication</span><Toggle checked={twoFactorEnabled} onChange={toggleTwoFactor} label="Two-factor authentication" /></div>
        </div>}

        {['report', 'complaint', 'contact'].includes(section) && <form className="trainer-settings-form-card" onSubmit={submitTicket}>
          <label>Category<select value={ticket.category} onChange={(e) => setTicket({ ...ticket, category: e.target.value })}><option>Technical issue</option><option>Account & security</option><option>Content</option><option>Other</option></select></label>
          <label>Subject<input value={ticket.title} onChange={(e) => setTicket({ ...ticket, title: e.target.value })} /></label>
          <label>Description<textarea rows="6" value={ticket.description} onChange={(e) => setTicket({ ...ticket, description: e.target.value })} /></label>
          {section === 'complaint' && <label className="trainer-settings-check"><input type="checkbox" checked={ticket.confidential} onChange={(e) => setTicket({ ...ticket, confidential: e.target.checked })} /> Keep this complaint confidential</label>}
          <button className="trainer-settings-primary"><FiSend /> Submit request</button>
        </form>}

        {section === 'rating' && <form className="trainer-settings-form-card" onSubmit={(e) => { e.preventDefault(); if (!rating.score || rating.submitted) return; const next = { ...rating, submitted: true, submittedAt: new Date().toISOString() }; saveObject(RATING_KEY, next, setRating); }}>
          <div className="trainer-rating">{[1,2,3,4,5].map((score) => <button type="button" key={score} className={score <= rating.score ? 'active' : ''} onClick={() => setRating({ ...rating, score })}><FiStar /></button>)}</div>
          <label>Comment<textarea rows="5" value={rating.comment} disabled={rating.submitted} onChange={(e) => setRating({ ...rating, comment: e.target.value })} /></label>
          <button className="trainer-settings-primary" disabled={rating.submitted || !rating.score}>{rating.submitted ? 'Rating submitted' : 'Submit rating'}</button>
        </form>}
      </div>
    );
  }

  return (
    <div className="trainer-settings-page">
      <header className="trainer-settings-title"><div><span>ACCOUNT MANAGEMENT</span><h1>Settings</h1><p>Manage your account, preferences, privacy, and support requests.</p></div></header>
      <section className="trainer-settings-profile">
        <img src={avatar} alt={firstName} />
        <div><h2>{firstName}</h2><p>{trainerData?.major || 'Course instructor'}</p></div>
        <span>Active</span>
        <button onClick={() => openDashboardTab('Profile', '/trainer-dashboard/profile')}><FiUser /> View profile</button>
      </section>

      <Group title="Account">
        <Row icon={<FiUser />} label="View & edit profile" onClick={() => openDashboardTab('Profile', '/trainer-dashboard/profile')} />
        <Row icon={<FiLock />} label="Change password" onClick={() => go('/trainer-dashboard/settings/password')} />
        <Row icon={<FiMonitor />} label="Devices & login sessions" value={`${devices.length} devices`} onClick={() => go('/trainer-dashboard/settings/devices')} />
      </Group>
      <Group title="Content & notifications">
        <Row icon={<FiVolume2 />} label="Manage announcements" value="Published, scheduled, archived" onClick={() => openDashboardTab('Announcements', '/trainer-dashboard/announcements')} />
        <Row icon={<FiBell />} label="Notification preferences" onClick={() => go('/trainer-dashboard/settings/notifications')} />
        <Row icon={<FiMail />} label="Email notifications" toggle checked={notifications.email} onToggle={(value) => saveObject(PREFS_KEY, { ...notifications, email: value }, setNotifications)} />
      </Group>
      <Group title="Teaching management">
        <Row icon={<FiVolume2 />} label="Courses: add, edit, archive or delete" value={`${trainerCourses.length} courses`} onClick={() => openDashboardTab('Courses', '/trainer-dashboard')} />
        <Row icon={<FiLock />} label="Assignments and student submissions" value={`${openAssignments} awaiting review`} onClick={() => openDashboardTab('Assignments', '/trainer-dashboard')} />
        <Row icon={<FiEye />} label="Project review queue" value={`${pendingProjects} pending`} onClick={() => openDashboardTab('Projects', '/trainer-dashboard')} />
        <Row icon={<FiStar />} label="Competitions management" value={`${competitions.length} competitions`} onClick={() => openDashboardTab('Competitions', '/trainer-dashboard/competitions')} />
        <Row icon={<FiBell />} label="Guidance and announcement tracking" value={`${announcements.length} announcements`} onClick={() => openDashboardTab('Announcements', '/trainer-dashboard/announcements')} />
      </Group>
      <Group title="Appearance">
        <Row icon={<FiMoon />} label="Dark mode" toggle checked={darkMode} onToggle={toggleDarkMode} />
        <Row icon={<FiGlobe />} label="Language" value={language === 'ar' ? 'العربية' : 'English'} onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} />
        <Row icon={<FiType />} label="Font size" value={fontSize === 'large' ? 'Large' : fontSize === 'small' ? 'Small' : 'Default'} onClick={() => setFontSize(fontSize === 'medium' ? 'large' : fontSize === 'large' ? 'small' : 'medium')} />
      </Group>
      <Group title="Privacy & security">
        <Row icon={<FiShield />} label="Two-factor authentication" value={twoFactorEnabled ? 'Enabled' : 'Recommended'} onClick={() => go('/trainer-dashboard/settings/privacy')} />
        <Row icon={<FiEye />} label="Profile visibility" value="University members" onClick={() => go('/trainer-dashboard/settings/privacy')} />
        <Row icon={<FiKey />} label="Login activity" onClick={() => go('/trainer-dashboard/settings/login-activity')} />
      </Group>
      <Group title="Support">
        <Row icon={<FiAlertTriangle />} label="Report a problem" onClick={() => go('/trainer-dashboard/support/report')} />
        <Row icon={<FiMessageSquare />} label="Submit a complaint" onClick={() => go('/trainer-dashboard/support/complaint')} />
        <Row icon={<FiMail />} label="Contact support" onClick={() => go('/trainer-dashboard/support/contact')} />
        <Row icon={<FiStar />} label="Rate Compass Academy" onClick={() => go('/trainer-dashboard/support/rating')} />
      </Group>
      <button className="trainer-settings-logout" onClick={logout}><FiLogOut /> Log out</button>
    </div>
  );
}
