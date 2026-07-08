import { NavLink } from 'react-router-dom';
import { FiHome, FiUser, FiBookOpen, FiAward, FiFileText, FiMessageSquare, FiSettings, FiLogOut } from 'react-icons/fi';
import mdiCompass from './assets/mdi-compass.png'; 

const Sidebar = () => {
  // بيانات القائمة
  const menuItems = [
    { id: 'Home', label: 'Home', icon: <FiHome />, path: '/student-dashboard' },
    { id: 'Profile', label: 'Profile', icon: <FiUser />, path: '/student-profile' },
    { id: 'Courses', label: 'Courses', icon: <FiBookOpen />, path: '/courses' },
    { id: 'Competitions', label: 'Competitions', icon: <FiAward />, path: '/competitions' },
    { id: 'Assignments', label: 'Assignments', icon: <FiFileText />, path: '/assignments' },
    { id: 'Messages', label: 'Messages', icon: <FiMessageSquare />, path: '/messages' },
    { id: 'Settings', label: 'Settings', icon: <FiSettings />, path: '/settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={mdiCompass} alt="Logo" className="brand-logo" />
        <h2>Compass <span>Academic</span></h2>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink 
            key={item.id} 
            to={item.path} 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" onClick={() => window.location.href = '/login'}>
        <FiLogOut className="menu-icon" />
        <span>Logout</span>
      </div>
    </aside>
  );
};

export default Sidebar;