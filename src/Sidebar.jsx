import { createElement } from 'react';
import { FiChevronDown, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import CompassWordmark from './CompassWordmark';
import { menuItems as defaultMenuItems } from './menuItems';
import './Sidebar.css';

function Sidebar({
  activeTab,
  onSelect,
  onLogout,
  studentData,
  menuItems = defaultMenuItems,
}) {
  return (
    <aside className="student-sidebar" dir="ltr">
      {/* ---------- Brand ---------- */}
      {/* Reuses the shared CompassWordmark component instead of a hand-rolled
          SVG, so the logo only ever needs to be edited in one place. */}
      <div className="student-sidebar-brand">
        <CompassWordmark size={19} navy="#ffffff" academyColor="#24b8ec" />
      </div>

      {/* ---------- Student profile shortcut ---------- */}
      {studentData && (
        <button
          type="button"
          className="student-sidebar-profile"
          onClick={() => onSelect?.('Profile')}
        >
          <img
            src={studentData.avatar}
            alt={studentData.displayName || 'Student'}
          />
          <span className="student-sidebar-profile-copy">
            <strong>{studentData.displayName || 'Student'}</strong>
            <small>{studentData.program || studentData.major || 'Student account'}</small>
          </span>
          <FiChevronDown className="student-sidebar-chevron" />
        </button>
      )}

      {/* ---------- Navigation ---------- */}
      <nav className="student-sidebar-nav" aria-label="Student navigation">
        <ul>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`student-sidebar-item${isActive ? ' is-active' : ''}`}
                  onClick={() => onSelect?.(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                >
                  <span className="student-sidebar-icon">
                    {createElement(item.icon)}
                  </span>
                  <span className="student-sidebar-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---------- Help + logout ---------- */}
      <button className="student-sidebar-help" type="button">
        <FiHelpCircle />
        <span>
          <strong>Need help?</strong>
          <small>Visit the student help center</small>
        </span>
      </button>

      <button className="student-sidebar-logout" type="button" onClick={onLogout}>
        <FiLogOut />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
