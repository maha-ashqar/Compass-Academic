/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getStudentNotifications,
  getStudentToken,
  markAllStudentNotificationsRead,
  markStudentNotificationRead,
} from './api/studentNotifications';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({
  children,
}) => {
  const [notifications, setNotifications] =
    useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lastTokenRef = useRef(
    getStudentToken()
  );

  const refreshNotifications =
    useCallback(async () => {
      const token = getStudentToken();

      if (!token) {
        setNotifications([]);
        setError('');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data =
          await getStudentNotifications();

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load notifications.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    refreshNotifications();

    const handleNotificationsChanged = () => {
      refreshNotifications();
    };

    const handleWindowFocus = () => {
      if (getStudentToken()) {
        refreshNotifications();
      }
    };

    window.addEventListener(
      'student-notifications-changed',
      handleNotificationsChanged
    );

    window.addEventListener(
      'focus',
      handleWindowFocus
    );

    const tokenWatcher = window.setInterval(
      () => {
        const currentToken =
          getStudentToken();

        if (
          currentToken !==
          lastTokenRef.current
        ) {
          lastTokenRef.current =
            currentToken;

          if (currentToken) {
            refreshNotifications();
          } else {
            setNotifications([]);
            setError('');
          }
        }
      },
      500
    );

    return () => {
      window.removeEventListener(
        'student-notifications-changed',
        handleNotificationsChanged
      );

      window.removeEventListener(
        'focus',
        handleWindowFocus
      );

      window.clearInterval(tokenWatcher);
    };
  }, [refreshNotifications]);

  const markAsRead = useCallback(
    async (id) => {
      const current = notifications.find(
        (item) => item.id === id
      );

      if (!current || current.read) {
        return;
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, read: true }
            : item
        )
      );

      if (
        !getStudentToken() ||
        current.localOnly
      ) {
        return;
      }

      try {
        const data =
          await markStudentNotificationRead(id);

        if (data.notification) {
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === id
                ? data.notification
                : item
            )
          );
        }
      } catch (requestError) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, read: false }
              : item
          )
        );

        setError(
          requestError.message ||
            'Unable to update notification.'
        );
      }
    },
    [notifications]
  );

  const markAllRead =
    useCallback(async () => {
      const snapshot = notifications;

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          read: true,
        }))
      );

      if (!getStudentToken()) {
        return;
      }

      try {
        await markAllStudentNotificationsRead();
      } catch (requestError) {
        setNotifications(snapshot);

        setError(
          requestError.message ||
            'Unable to update notifications.'
        );
      }
    }, [notifications]);

  const addNotification = useCallback(
    ({
      title,
      text,
      category = 'academics',
      icon = '📢',
      actionLabel = null,
      actionTab = null,
      featured = false,
      actionPath = null,
      announcementId = null,
      audienceType = 'all',
      audienceValue = '',
      secondaryLabel = null,
      secondaryTab = null,
    }) => {
      const newNotification = {
        id: `local-${Date.now()}`,
        group: 'Today',
        category,
        icon,
        title,
        text,
        time: 'Just now',
        read: false,
        featured,
        actionLabel,
        actionTab,
        actionPath,
        announcementId,
        audienceType,
        audienceValue,
        secondaryLabel,
        secondaryTab,
        localOnly: true,
      };

      setNotifications((prev) => [
        newNotification,
        ...prev,
      ]);

      return newNotification;
    },
    []
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.read
      ).length,
    [notifications]
  );

  const getVisibleNotifications =
    useCallback(
      (student) =>
        notifications.filter((item) => {
          if (
            !item.audienceType ||
            item.audienceType === 'all'
          ) {
            return true;
          }

          const expected = String(
            item.audienceValue || ''
          ).toLowerCase();

          if (
            item.audienceType === 'faculty'
          ) {
            return (
              String(
                student?.faculty || ''
              ).toLowerCase() === expected
            );
          }

          if (
            item.audienceType === 'major'
          ) {
            return (
              String(
                student?.major ||
                  student?.program ||
                  ''
              ).toLowerCase() === expected
            );
          }

          if (
            item.audienceType === 'course'
          ) {
            return (
              student?.courses || []
            ).some(
              (course) =>
                String(
                  course.id ||
                    course.title ||
                    course
                ).toLowerCase() ===
                expected
            );
          }

          if (
            item.audienceType ===
            'students'
          ) {
            return expected
              .split(',')
              .map((value) =>
                value.trim()
              )
              .includes(
                String(
                  student?.email ||
                    student?.id ||
                    ''
                ).toLowerCase()
              );
          }

          return true;
        }),
      [notifications]
    );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        getStudentNotifications:
          getVisibleNotifications,
        markAsRead,
        markAllRead,
        addNotification,
        unreadCount,
        loading,
        error,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(
    NotificationsContext
  );

  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  }

  return context;
};
