import {
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTarget,
} from 'react-icons/fi';
import { useNotifications } from './NotificationsContext';
import './Notifications.css';

const FILTERS = [
  {
    id: 'all',
    label: 'All',
  },
  {
    id: 'unread',
    label: 'Unread',
  },
  {
    id: 'academics',
    label: 'Academics',
  },
  {
    id: 'competitions',
    label: 'Competitions',
  },
  {
    id: 'system',
    label: 'System',
  },
];

const GROUP_ORDER = [
  'Today',
  'Yesterday',
  'Last Week',
  'Earlier',
];

const categoryMeta = {
  academics: {
    label: 'Academics',
    className: 'is-academics',
    icon: FiBookOpen,
  },
  competitions: {
    label: 'Competitions',
    className: 'is-competitions',
    icon: FiTarget,
  },
  system: {
    label: 'System',
    className: 'is-system',
    icon: FiShield,
  },
};

const Notifications = ({
  onNavigateTab,
  studentData,
}) => {
  const navigate = useNavigate();

  const {
    notifications,
    getStudentNotifications,
    markAsRead,
    markAllRead,
    unreadCount,
    loading,
    error,
    refreshNotifications,
  } = useNotifications();

  const visibleNotifications =
    getStudentNotifications
      ? getStudentNotifications(studentData)
      : notifications;

  const [activeFilter, setActiveFilter] =
    useState('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    return {
      all: visibleNotifications.length,
      unread: visibleNotifications.filter(
        (notification) => !notification.read
      ).length,
      academics: visibleNotifications.filter(
        (notification) =>
          notification.category === 'academics'
      ).length,
      competitions: visibleNotifications.filter(
        (notification) =>
          notification.category === 'competitions'
      ).length,
      system: visibleNotifications.filter(
        (notification) =>
          notification.category === 'system'
      ).length,
    };
  }, [visibleNotifications]);

  const filtered = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    return visibleNotifications.filter(
      (notification) => {
        const filterMatches =
          activeFilter === 'all' ||
          (activeFilter === 'unread' &&
            !notification.read) ||
          notification.category === activeFilter;

        if (!filterMatches) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return `${notification.title || ''} ${
          notification.text || ''
        } ${notification.category || ''}`
          .toLowerCase()
          .includes(normalizedQuery);
      }
    );
  }, [
    visibleNotifications,
    activeFilter,
    query,
  ]);

  const grouped = useMemo(() => {
    const map = {};

    filtered.forEach((notification) => {
      const group =
        notification.group || 'Earlier';

      if (!map[group]) {
        map[group] = [];
      }

      map[group].push(notification);
    });

    return map;
  }, [filtered]);

  const handleAction = async (
    notification
  ) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionPath) {
      navigate(notification.actionPath);
      return;
    }

    if (
      notification.actionTab &&
      onNavigateTab
    ) {
      onNavigateTab(notification.actionTab);
    }
  };

  const handleCardClick = async (
    notification
  ) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  const handleSecondaryAction = async (
    notification
  ) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (
      notification.secondaryTab &&
      onNavigateTab
    ) {
      onNavigateTab(
        notification.secondaryTab
      );
    }
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  if (
    loading &&
    notifications.length === 0
  ) {
    return (
      <section className="notification-center-page">
        <div className="notification-center-state">
          <span className="notification-state-icon">
            <FiRefreshCw />
          </span>

          <h2>Loading notifications</h2>

          <p>
            We are getting your latest updates.
          </p>
        </div>
      </section>
    );
  }

  if (
    error &&
    notifications.length === 0
  ) {
    return (
      <section className="notification-center-page">
        <div className="notification-center-state">
          <span className="notification-state-icon is-error">
            <FiBell />
          </span>

          <h2>
            Unable to load notifications
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="notification-primary-button"
            onClick={handleRefresh}
          >
            <FiRefreshCw />
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="notification-center-page">
      <header className="notification-center-hero">
        <div className="notification-hero-copy">
          <span className="notification-eyebrow">
            <FiBell />
            Notification Center
          </span>

          <h1>Stay on top of every update.</h1>

          <p>
            Academic activity, competition
            updates, and important platform
            notices — all in one place.
          </p>
        </div>

        <div className="notification-hero-actions">
          <button
            type="button"
            className="notification-icon-button"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <FiRefreshCw
              className={
                loading ? 'is-spinning' : ''
              }
            />
          </button>

          <button
            type="button"
            className="notification-primary-button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <FiCheckCircle />
            Mark all as read
          </button>
        </div>
      </header>

      <div className="notification-summary-grid">
        <article className="notification-summary-card">
          <span className="notification-summary-icon is-all">
            <FiBell />
          </span>

          <div>
            <strong>{counts.all}</strong>
            <span>Total updates</span>
          </div>
        </article>

        <article className="notification-summary-card">
          <span className="notification-summary-icon is-unread">
            <span className="notification-summary-dot" />
          </span>

          <div>
            <strong>{counts.unread}</strong>
            <span>Unread</span>
          </div>
        </article>

        <article className="notification-summary-card">
          <span className="notification-summary-icon is-academics">
            <FiBookOpen />
          </span>

          <div>
            <strong>{counts.academics}</strong>
            <span>Academic</span>
          </div>
        </article>

        <article className="notification-summary-card">
          <span className="notification-summary-icon is-competitions">
            <FiTarget />
          </span>

          <div>
            <strong>
              {counts.competitions}
            </strong>
            <span>Competitions</span>
          </div>
        </article>
      </div>

      <div className="notification-center-toolbar">
        <nav
          className="notification-filter-tabs"
          aria-label="Notification filters"
        >
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={
                activeFilter === filter.id
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                setActiveFilter(filter.id)
              }
            >
              {filter.label}

              <span>
                {counts[filter.id] ?? 0}
              </span>
            </button>
          ))}
        </nav>

        <label className="notification-search">
          <FiSearch />

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search notifications"
            aria-label="Search notifications"
          />
        </label>
      </div>

      {error && (
        <div className="notification-inline-error">
          <span>
            Some updates could not be refreshed.
          </span>

          <button
            type="button"
            onClick={handleRefresh}
          >
            Try again
          </button>
        </div>
      )}

      <div className="notification-feed">
        {GROUP_ORDER.filter(
          (group) => grouped[group]?.length
        ).map((group) => (
          <section
            key={group}
            className="notification-feed-group"
          >
            <div className="notification-group-heading">
              <span>{group}</span>

              <small>
                {grouped[group].length}{' '}
                {grouped[group].length === 1
                  ? 'update'
                  : 'updates'}
              </small>
            </div>

            <div className="notification-list">
              {grouped[group].map(
                (notification) => {
                  const meta =
                    categoryMeta[
                      notification.category
                    ] || categoryMeta.system;

                  const CategoryIcon =
                    meta.icon;

                  return (
                    <article
                      key={notification.id}
                      className={`notification-row ${
                        !notification.read
                          ? 'is-unread'
                          : ''
                      } ${
                        notification.featured
                          ? 'is-featured'
                          : ''
                      }`}
                    >
                      <button
                        type="button"
                        className={`notification-row-icon ${meta.className}`}
                        onClick={() =>
                          handleCardClick(
                            notification
                          )
                        }
                        aria-label={`Mark ${notification.title} as read`}
                      >
                        <CategoryIcon />
                      </button>

                      <button
                        type="button"
                        className="notification-row-content"
                        onClick={() =>
                          handleCardClick(
                            notification
                          )
                        }
                      >
                        <div className="notification-row-meta">
                          <span
                            className={`notification-category ${meta.className}`}
                          >
                            {meta.label}
                          </span>

                          {notification.featured && (
                            <span className="notification-priority-label">
                              Important
                            </span>
                          )}

                          {!notification.read && (
                            <span className="notification-new-label">
                              New
                            </span>
                          )}
                        </div>

                        <h3>
                          {notification.title}
                        </h3>

                        <p>
                          {notification.text}
                        </p>
                      </button>

                      <div className="notification-row-side">
                        <time>
                          <FiClock />
                          {notification.time ||
                            'Recently'}
                        </time>

                        {notification.actionLabel ||
                        notification.secondaryLabel ? (
                          <div className="notification-row-actions">
                            {notification.actionLabel && (
                              <button
                                type="button"
                                className="notification-action-button"
                                onClick={() =>
                                  handleAction(
                                    notification
                                  )
                                }
                              >
                                {
                                  notification.actionLabel
                                }
                              </button>
                            )}

                            {notification.secondaryLabel && (
                              <button
                                type="button"
                                className="notification-secondary-action"
                                onClick={() =>
                                  handleSecondaryAction(
                                    notification
                                  )
                                }
                              >
                                {
                                  notification.secondaryLabel
                                }
                              </button>
                            )}
                          </div>
                        ) : !notification.read ? (
                          <button
                            type="button"
                            className="notification-read-button"
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                          >
                            <FiCheck />
                            Mark read
                          </button>
                        ) : (
                          <span className="notification-read-state">
                            <FiCheck />
                            Read
                          </span>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="notification-center-state is-empty">
            <span className="notification-state-icon">
              <FiCheckCircle />
            </span>

            <h2>
              {activeFilter === 'unread'
                ? "You're all caught up"
                : 'No notifications found'}
            </h2>

            <p>
              {query
                ? 'Try a different search term or filter.'
                : activeFilter === 'unread'
                  ? 'You have no unread notifications right now.'
                  : 'There are no updates in this category yet.'}
            </p>

            {(query ||
              activeFilter !== 'all') && (
              <button
                type="button"
                className="notification-secondary-button"
                onClick={() => {
                  setQuery('');
                  setActiveFilter('all');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <footer className="notification-center-footer">
          <FiCheckCircle />

          <span>
            You&apos;re viewing all recent
            notifications.
          </span>
        </footer>
      )}
    </section>
  );
};

export default Notifications;
