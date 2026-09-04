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
  changeStudentPassword,
  getStudentSettings,
  getStudentSettingsToken,
  resetStudentSettings,
  updateStudentSettings,
} from './api/studentSettings';
import './SettingsContext.css';

const SettingsContext = createContext(null);
const STORAGE_KEY =
  'compass_student_settings_v3';

export const DEFAULT_SETTINGS = {
  language: 'en',
  timeZone: 'Asia/Gaza',
  dateFormat: 'DD/MM/YYYY',
  weekStartsOn: 'sunday',
  showProgress: true,
  weeklySummary: true,
  deadlineCountdowns: true,
  recommendedContent: false,
  theme: 'light',
  compactMode: false,
  notifications: {
    assignment: true,
    grade: true,
    course: true,
    project: true,
    competition: true,
    message: true,
    announcement: true,
    achievement: true,
    team: true,
    browser: false,
  },
  privacy: {
    profileVisibility: 'academy',
    showActivity: true,
    showAchievements: true,
    allowInstructorMessages: true,
    portfolioVisibility: 'public',
  },
  security: {
    twoFactor: false,
    loginAlerts: true,
  },
  accessibility: {
    fontSize: 'medium',
    reduceMotion: false,
    highContrast: false,
  },
  connectedServices: {
    google: true,
    github: false,
    linkedin: false,
  },
};

export const DEFAULT_DEVICES = [
  {
    id: 1,
    name: 'Chrome on Windows',
    location: 'Gaza, Palestine',
    lastActive: 'Active now',
    current: true,
  },
  {
    id: 2,
    name: 'Safari on iPhone',
    location: 'Gaza, Palestine',
    lastActive: '2 days ago',
    current: false,
  },
  {
    id: 3,
    name: 'Chrome on Android',
    location: 'Ramallah, Palestine',
    lastActive: '1 week ago',
    current: false,
  },
];

const safelyRead = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);

    return stored
      ? JSON.parse(stored)
      : fallback;
  } catch {
    return fallback;
  }
};

const mergeSettings = (
  value = {},
  fallback = DEFAULT_SETTINGS
) => ({
  ...fallback,
  ...value,
  notifications: {
    ...fallback.notifications,
    ...(value.notifications || {}),
  },
  privacy: {
    ...fallback.privacy,
    ...(value.privacy || {}),
  },
  security: {
    ...fallback.security,
    ...(value.security || {}),
  },
  accessibility: {
    ...fallback.accessibility,
    ...(value.accessibility || {}),
  },
  connectedServices: {
    ...fallback.connectedServices,
    ...(value.connectedServices || {}),
  },
});

const serverPayload = (settings) => ({
  theme: settings.theme,
  language: settings.language,
  accessibility: {
    fontSize:
      settings.accessibility.fontSize,
  },
  notifications: {
    assignment:
      settings.notifications.assignment,
    grade:
      settings.notifications.grade,
    course:
      settings.notifications.course,
    project:
      settings.notifications.project,
    competition:
      settings.notifications.competition,
    message:
      settings.notifications.message,
    announcement:
      settings.notifications.announcement,
    achievement:
      settings.notifications.achievement,
  },
  privacy: {
    profileVisibility:
      settings.privacy.profileVisibility,
    showActivity:
      settings.privacy.showActivity,
    showAchievements:
      settings.privacy.showAchievements,
    allowInstructorMessages:
      settings.privacy.allowInstructorMessages,
    portfolioVisibility:
      settings.privacy.portfolioVisibility,
  },
});

export function SettingsProvider({
  children,
}) {
  const initialLocalSettings = useMemo(
    () =>
      mergeSettings(
        safelyRead(
          STORAGE_KEY,
          DEFAULT_SETTINGS
        )
      ),
    []
  );

  const [settings, setSettings] =
    useState(initialLocalSettings);

  const [devices, setDevices] = useState(
    () =>
      safelyRead(
        `${STORAGE_KEY}_devices`,
        DEFAULT_DEVICES
      )
  );

  const [syncState, setSyncState] =
    useState('saved');
  const [error, setError] = useState(null);

  const lastTokenRef = useRef(
    getStudentSettingsToken()
  );

  const applySettings = useCallback(
    (next) => {
      const root = document.documentElement;

      root.lang = next.language;
      root.dir =
        next.language === 'ar'
          ? 'rtl'
          : 'ltr';

      root.dataset.fontSize =
        next.accessibility.fontSize;

      root.classList.toggle(
        'dark-theme',
        next.theme === 'dark'
      );

      root.classList.toggle(
        'high-contrast',
        next.accessibility.highContrast
      );

      root.classList.toggle(
        'reduce-motion',
        next.accessibility.reduceMotion
      );

      root.classList.toggle(
        'compact-ui',
        next.compactMode
      );

      const zoomMap = {
        small: '0.94',
        medium: '1',
        large: '1.07',
      };

      root.style.setProperty(
        '--ui-zoom',
        zoomMap[
          next.accessibility.fontSize
        ] || '1'
      );
    },
    []
  );

  const persistLocal = useCallback(
    (next) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        setError(
          'Settings could not be saved on this device.'
        );
      }
    },
    []
  );

  const loadSettings =
    useCallback(async () => {
      if (!getStudentSettingsToken()) {
        return;
      }

      try {
        setSyncState('loading');
        setError(null);

        const data =
          await getStudentSettings();

        setSettings((current) => {
          const merged = mergeSettings(
            data.settings || {},
            current
          );

          persistLocal(merged);
          applySettings(merged);

          return merged;
        });

        setSyncState('synced');
      } catch (requestError) {
        setSyncState('error');
        setError(
          requestError.message ||
            'Unable to load settings.'
        );
      }
    }, [
      applySettings,
      persistLocal,
    ]);

  useEffect(() => {
    applySettings(settings);
  }, [settings, applySettings]);

  useEffect(() => {
    loadSettings();

    const tokenWatcher =
      window.setInterval(() => {
        const currentToken =
          getStudentSettingsToken();

        if (
          currentToken !==
          lastTokenRef.current
        ) {
          lastTokenRef.current =
            currentToken;

          if (currentToken) {
            loadSettings();
          }
        }
      }, 500);

    return () =>
      window.clearInterval(tokenWatcher);
  }, [loadSettings]);

  useEffect(() => {
    const onStorage = (event) => {
      if (
        event.key !== STORAGE_KEY ||
        !event.newValue
      ) {
        return;
      }

      try {
        const next = mergeSettings(
          JSON.parse(event.newValue)
        );

        setSettings(next);
        applySettings(next);
        setSyncState('synced');
      } catch {
        setError(
          'Settings from another session could not be synchronized.'
        );
      }
    };

    window.addEventListener(
      'storage',
      onStorage
    );

    return () =>
      window.removeEventListener(
        'storage',
        onStorage
      );
  }, [applySettings]);

  const saveSettings =
    useCallback(
      async (nextSettings) => {
        const normalized =
          mergeSettings(nextSettings);

        setSyncState('saving');
        setError(null);

        if (!getStudentSettingsToken()) {
          setSettings(normalized);
          persistLocal(normalized);
          applySettings(normalized);
          setSyncState('saved');

          return {
            ok: true,
            settings: normalized,
          };
        }

        try {
          const data =
            await updateStudentSettings(
              serverPayload(normalized)
            );

          const merged = mergeSettings(
            data.settings || {},
            normalized
          );

          setSettings(merged);
          persistLocal(merged);
          applySettings(merged);
          setSyncState('saved');

          window.dispatchEvent(
            new Event(
              'student-notifications-changed'
            )
          );

          return {
            ok: true,
            settings: merged,
          };
        } catch (requestError) {
          setSyncState('error');

          const message =
            requestError.message ||
            'Settings could not be saved.';

          setError(message);

          return {
            ok: false,
            error: message,
          };
        }
      },
      [
        applySettings,
        persistLocal,
      ]
    );

  const resetSettings =
    useCallback(async () => {
      setSyncState('saving');
      setError(null);

      if (!getStudentSettingsToken()) {
        const localDefaults =
          mergeSettings(DEFAULT_SETTINGS);

        setSettings(localDefaults);
        persistLocal(localDefaults);
        applySettings(localDefaults);
        setSyncState('saved');

        return {
          ok: true,
          settings: localDefaults,
        };
      }

      try {
        const data =
          await resetStudentSettings();

        const merged = mergeSettings(
          data.settings || {},
          DEFAULT_SETTINGS
        );

        setSettings(merged);
        persistLocal(merged);
        applySettings(merged);
        setSyncState('saved');

        window.dispatchEvent(
          new Event(
            'student-notifications-changed'
          )
        );

        return {
          ok: true,
          settings: merged,
        };
      } catch (requestError) {
        setSyncState('error');

        const message =
          requestError.message ||
          'Default settings could not be restored.';

        setError(message);

        return {
          ok: false,
          error: message,
        };
      }
    }, [
      applySettings,
      persistLocal,
    ]);

  const updateSetting = useCallback(
    (key, value) =>
      saveSettings({
        ...settings,
        [key]: value,
      }),
    [
      settings,
      saveSettings,
    ]
  );

  const changePassword =
    useCallback(async (payload) => {
      try {
        const data =
          await changeStudentPassword(
            payload
          );

        return {
          ok: true,
          message:
            data.message ||
            'Password updated successfully.',
        };
      } catch (requestError) {
        return {
          ok: false,
          error:
            requestError.message ||
            'Password could not be updated.',
        };
      }
    }, []);

  const persistDevices =
    useCallback((updater) => {
      setDevices((current) => {
        const next = updater(current);

        try {
          localStorage.setItem(
            `${STORAGE_KEY}_devices`,
            JSON.stringify(next)
          );
        } catch {
          setError(
            'Device sessions could not be updated.'
          );
        }

        return next;
      });
    }, []);

  const removeDevice = useCallback(
    (id) => {
      persistDevices((current) =>
        current.filter(
          (device) =>
            device.id !== id ||
            device.current
        )
      );
    },
    [persistDevices]
  );

  const signOutOtherSessions =
    useCallback(() => {
      persistDevices((current) =>
        current.filter(
          (device) => device.current
        )
      );
    }, [persistDevices]);

  const formatDate = useCallback(
    (
      value,
      includeTime = false
    ) => {
      const date =
        value instanceof Date
          ? value
          : new Date(value);

      if (
        Number.isNaN(date.getTime())
      ) {
        return '—';
      }

      const locale =
        settings.language === 'ar'
          ? 'ar-PS'
          : 'en-GB';

      const options = {
        timeZone: settings.timeZone,
        day: '2-digit',
        month:
          settings.dateFormat ===
          'MMM D, YYYY'
            ? 'short'
            : '2-digit',
        year: 'numeric',
        ...(includeTime
          ? {
              hour: '2-digit',
              minute: '2-digit',
            }
          : {}),
      };

      if (
        settings.dateFormat ===
        'YYYY-MM-DD'
      ) {
        const parts =
          new Intl.DateTimeFormat(
            'en-CA',
            options
          ).formatToParts(date);

        const part = (type) =>
          parts.find(
            (item) =>
              item.type === type
          )?.value;

        return `${part(
          'year'
        )}-${part('month')}-${part(
          'day'
        )}`;
      }

      return new Intl.DateTimeFormat(
        locale,
        options
      ).format(date);
    },
    [settings]
  );

  const value = useMemo(
    () => ({
      settings,
      devices,
      syncState,
      error,
      saveSettings,
      resetSettings,
      updateSetting,
      changePassword,
      refreshSettings: loadSettings,
      removeDevice,
      signOutOtherSessions,
      formatDate,
      darkMode:
        settings.theme === 'dark',
      toggleDarkMode: () =>
        updateSetting(
          'theme',
          settings.theme === 'dark'
            ? 'light'
            : 'dark'
        ),
      language: settings.language,
      setLanguage: (language) =>
        updateSetting(
          'language',
          language
        ),
      fontSize:
        settings.accessibility
          .fontSize,
      setFontSize: (fontSize) =>
        saveSettings({
          ...settings,
          accessibility: {
            ...settings.accessibility,
            fontSize,
          },
        }),
      twoFactorEnabled:
        settings.security.twoFactor,
      toggleTwoFactor: () =>
        saveSettings({
          ...settings,
          security: {
            ...settings.security,
            twoFactor:
              !settings.security
                .twoFactor,
          },
        }),
    }),
    [
      settings,
      devices,
      syncState,
      error,
      saveSettings,
      resetSettings,
      updateSetting,
      changePassword,
      loadSettings,
      removeDevice,
      signOutOtherSessions,
      formatDate,
    ]
  );

  return (
    <SettingsContext.Provider
      value={value}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(
    SettingsContext
  );

  if (!context) {
    throw new Error(
      'useSettings must be used within a SettingsProvider'
    );
  }

  return context;
}
