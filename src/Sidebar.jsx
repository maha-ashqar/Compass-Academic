import { FiLogOut } from 'react-icons/fi';
import CompassWordmark from './CompassWordmark';
import { menuItems as defaultMenuItems } from './menuItems';
import './Sidebar.css';

const Sidebar = ({ activeTab, onSelect, onLogout, studentData, menuItems = defaultMenuItems }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <CompassWordmark size={22} navy="#ffffff" gold="#cca43b" />
      </div>

      {studentData && (
        <div className="sidebar-profile">
          <img src={studentData.avatar} alt={studentData.displayName} className="profile-img" />
          <h3 className="profile-name">{studentData.displayName}</h3>
          <p className="profile-major">{studentData.major}</p>
        </div>
      )}

      <nav className="sidebar-menu">
        <ul>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li
                key={item.id}
                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onSelect(item.id)}
              >
                <span className="menu-icon">
                  <IconComponent />
                </span>
                <span className="menu-text">{item.label}</span>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer" onClick={onLogout}>
        <FiLogOut className="menu-icon" />
        <span>Logout</span>
      </div>
    </aside>
  );
};

export default Sidebar;