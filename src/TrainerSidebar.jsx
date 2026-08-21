import { createElement } from 'react';
import { FiChevronDown, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import CompassWordmark from './CompassWordmark';
import { trainerMenuItems } from './trainerMenuItems';
import './TrainerSidebar.css';

export default function TrainerSidebar({ activeTab, onSelect, onLogout, trainerData }) {
  const name = trainerData?.displayName || trainerData?.fullName || 'Trainer';
  const avatar = trainerData?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

  return (
    <aside className="trainer-sidebar">
      <div className="trainer-sidebar-brand">
        <CompassWordmark size={23} navy="#fff" gold="#fff" />
      </div>
      <button type="button" className="trainer-sidebar-profile" onClick={() => onSelect('Profile')}>
        <img src={avatar} alt={name} />
        <span><strong>{name}</strong><small>{trainerData?.major || 'Course instructor'}</small></span>
        <FiChevronDown />
      </button>
      <nav className="trainer-sidebar-nav" aria-label="Trainer navigation">
        <ul>{trainerMenuItems.map((item) => (
          <li key={item.id}>
            <button type="button" className={`trainer-sidebar-item${activeTab === item.id ? ' active' : ''}`} onClick={() => onSelect(item.id)}>
              <span>{createElement(item.icon)}</span><b>{item.label}</b>
            </button>
          </li>
        ))}</ul>
      </nav>
      <button type="button" className="trainer-sidebar-help" onClick={() => onSelect('Help')}>
        <FiHelpCircle /><span><strong>Need help?</strong><small>Open the instructor help center</small></span>
      </button>
      <button type="button" className="trainer-sidebar-logout" onClick={onLogout}><FiLogOut /><span>Logout</span></button>
    </aside>
  );
}