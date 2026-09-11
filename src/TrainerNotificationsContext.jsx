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
  getTrainerNotifications,
  getTrainerToken,
  markAllTrainerNotificationsRead,
  markTrainerNotificationRead,
} from './api/trainerNotifications';

const TrainerNotificationsContext =
  createContext(null);

export function TrainerNotificationsProvider({
  children,
}) {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const lastTokenRef = useRef(
    getTrainerToken()
  );

  const refreshNotifications =
    useCallback(async () => {
      const token = getTrainerToken();

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
          await getTrainerNotifications();

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load trainer notifications.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /*
   * تحميل أول مرة + عند الرجوع للنافذة.
   */
  useEffect(() => {
    refreshNotifications();

    const handleFocus = () => {
      if (getTrainerToken()) {
        refreshNotifications();
      }
    };

    const handleChanged = () => {
      refreshNotifications();
    };

    window.addEventListener(
      'focus',
      handleFocus
    );

    window.addEventListener(
      'trainer-notifications-changed',
      handleChanged
    );

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus
      );

      window.removeEventListener(
        'trainer-notifications-changed',
        handleChanged
      );
    };
  }, [refreshNotifications]);

  /*
   * Polling بسيط.
   * بما إنه ما عملنا WebSocket هسا،
   * المدرب يحصل على التحديثات الجديدة
   * كل 20 ثانية.
   */
  useEffect(() => {
    const interval =
      window.setInterval(() => {
        if (getTrainerToken()) {
          refreshNotifications();
        }
      }, 20000);

    return () =>
      window.clearInterval(interval);
  }, [refreshNotifications]);

  /*
   * لو تغير الـTrainer token.
   */
  useEffect(() => {
    const interval =
      window.setInterval(() => {
        const currentToken =
          getTrainerToken();

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
      }, 500);

    return () =>
      window.clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead =
    useCallback(
      async (id) => {
        const current =
          notifications.find(
            (item) => item.id === id
          );

        if (!current || current.read) {
          return;
        }

        /*
         * Optimistic update
         */
        setNotifications((previous) =>
          previous.map((item) =>
            item.id === id
              ? {
                  ...item,
                  read: true,
                }
              : item
          )
        );

        try {
          const data =
            await markTrainerNotificationRead(
              id
            );

          if (data.notification) {
            setNotifications(
              (previous) =>
                previous.map((item) =>
                  item.id === id
                    ? data.notification
                    : item
                )
            );
          }
        } catch (requestError) {
          /*
           * رجعها unread لو الطلب فشل
           */
          setNotifications((previous) =>
            previous.map((item) =>
              item.id === id
                ? {
                    ...item,
                    read: false,
                  }
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

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          read: true,
        }))
      );

      try {
        await markAllTrainerNotificationsRead();
      } catch (requestError) {
        setNotifications(snapshot);

        setError(
          requestError.message ||
            'Unable to update notifications.'
        );
      }
    }, [notifications]);

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (item) => !item.read
        ).length,
      [notifications]
    );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllRead,
      refreshNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllRead,
      refreshNotifications,
    ]
  );

  return (
    <TrainerNotificationsContext.Provider
      value={value}
    >
      {children}
    </TrainerNotificationsContext.Provider>
  );
}

export function useTrainerNotifications() {
  const context = useContext(
    TrainerNotificationsContext
  );

  if (!context) {
    throw new Error(
      'useTrainerNotifications must be used within TrainerNotificationsProvider'
    );
  }

  return context;
}