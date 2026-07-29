import { useState, useMemo } from 'react';
import { useNotifications } from './NotificationsContext';
import './Notifications.css';

const FILTERS = [
  { id: 'all', label: 'All Updates' },
  { id: 'academics', label: 'Academics' },
  { id: 'internships', label: 'Internships' },
  { id: 'system', label: 'System' },
];

const GROUP_ORDER = ['Today', 'Yesterday', 'Last Week'];

const Notifications = ({ onNavigateTab }) => {
  const { notifications, markAsRead, markAllRead, unreadCount } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((n) => {
      if (!map[n.group]) map[n.group] = [];
      map[n.group].push(n);
    });
    return map;
  }, [filtered]);

  const handleAction = (n) => {
    markAsRead(n.id);
    if (n.actionTab && onNavigateTab) onNavigateTab(n.actionTab);
  };

  const handleCardClick = (n) => {
    if (!n.read) markAsRead(n.id);
  };

  return (
    <div className="notif-page">
      <div className="notif-page-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with your academic progress and campus life.</p>
        </div>

        {unreadCount > 0 && (
          <button className="notif-mark-all-btn" onClick={markAllRead}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      <div className="notif-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`notif-filter-tab ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => (
        <div key={group} className="notif-group">
          <span className="notif-group-label">{group.toUpperCase()}</span>

          <div className="notif-group-grid">
            {grouped[group].map((n) =>
              n.featured ? (
                <div
                  key={n.id}
                  className={`notif-featured-card ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleCardClick(n)}
                >
                  <div className="notif-featured-visual">
                    <span className="notif-featured-tag">{n.category}</span>
                  </div>
                  <div className="notif-featured-body">
                    <div className="notif-card-top">
                      <h3>{n.title}</h3>
                      <span className="notif-time">{n.time}</span>
                    </div>
                    <p>{n.text}</p>
                    <div className="notif-featured-actions">
                      {n.actionLabel && (
                        <button
                          className="notif-primary-btn"
                          onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                        >
                          {n.actionLabel}
                        </button>
                      )}
                      {n.secondaryLabel && (
                        <button
                          className="notif-secondary-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                            if (n.secondaryTab && onNavigateTab) onNavigateTab(n.secondaryTab);
                          }}
                        >
                          {n.secondaryLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={n.id}
                  className={`notif-card ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleCardClick(n)}
                >
                  <span className="notif-icon">{n.icon}</span>
                  <div className="notif-card-body">
                    <div className="notif-card-top">
                      <h4>{n.title}</h4>
                      <span className="notif-time">{n.time}</span>
                    </div>
                    <p>{n.text}</p>
                    <div className="notif-card-footer">
                      <span className="notif-category-tag">{n.category}</span>
                      {n.actionLabel && (
                        <span
                          className="notif-inline-action"
                          onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                        >
                          {n.actionLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && <span className="notif-unread-dot" />}
                </div>
              )
            )}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="notif-empty">
          <div className="notif-empty-icon">🔔</div>
          <h3>No notifications here</h3>
          <p>Try a different filter.</p>
        </div>
      )}

      <div className="notif-end-note">
        <span className="notif-end-icon">↺</span>
        <p>You've reached the end of your recent updates.</p>
      </div>
    </div>
  );
};

export default Notifications;