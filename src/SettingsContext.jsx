/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SettingsContext = createContext(null);
const STORAGE_KEY = 'compass_student_settings_v3';

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
    assignment: true, message: true, project: true, team: true,
    grade: true, course: true, browser: false,
  },
  privacy: {
    profileVisibility: 'academy',
    showActivity: true,
    showAchievements: true,
    allowInstructorMessages: true,
  },
  security: { twoFactor: false, loginAlerts: true },
  accessibility: { fontSize: 'medium', reduceMotion: false, highContrast: false },
  connectedServices: { google: true, github: false, linkedin: false },
};

export const DEFAULT_DEVICES = [
  { id: 1, name: 'Chrome on Windows', location: 'Gaza, Palestine', lastActive: 'Active now', current: true },
  { id: 2, name: 'Safari on iPhone', location: 'Gaza, Palestine', lastActive: '2 days ago', current: false },
  { id: 3, name: 'Chrome on Android', location: 'Ramallah, Palestine', lastActive: '1 week ago', current: false },
];

const safelyRead = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const mergeSettings = (value = {}) => ({
  ...DEFAULT_SETTINGS,
  ...value,
  notifications: { ...DEFAULT_SETTINGS.notifications, ...value.notifications },
  privacy: { ...DEFAULT_SETTINGS.privacy, ...value.privacy },
  security: { ...DEFAULT_SETTINGS.security, ...value.security },
  accessibility: { ...DEFAULT_SETTINGS.accessibility, ...value.accessibility },
  connectedServices: { ...DEFAULT_SETTINGS.connectedServices, ...value.connectedServices },
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => mergeSettings(safelyRead(STORAGE_KEY, DEFAULT_SETTINGS)));
  const [devices, setDevices] = useState(() => safelyRead(`${STORAGE_KEY}_devices`, DEFAULT_DEVICES));
  const [syncState, setSyncState] = useState('saved');
  const [error, setError] = useState(null);

  // FIXED: this used to also set `root.dir = next.language === 'ar' ?
  // 'rtl' : 'ltr'`. document.documentElement is the single, shared <html>
  // tag for the *entire* app — so picking "العربية" here didn't just
  // affect this settings page, it silently flipped every page in the
  // whole product (including the public marketing homepage) to RTL and
  // persisted that choice in localStorage. Since there is no actual
  // Arabic translation anywhere in the app, the visible result was
  // English text rendered in a mirrored RTL layout — exactly the
  // "flipped homepage" bug reported separately. `lang` is kept (harmless,
  // semantically correct); the direction override has been removed.
  // FIXED: `.main-viewport { zoom: var(--ui-zoom, 1); }` already existed
  // in the CSS but nothing ever set --ui-zoom, so the "Font size" setting
  // saved a value with zero visual effect. It now genuinely scales the
  // dashboard's main content area. `zoom` is Chromium/WebKit-only (not
  // Firefox) — an honest limitation worth knowing, not a bug.
  const FONT_ZOOM = { small: 0.92, medium: 1, large: 1.15 };
  const applySettings = useCallback((next) => {
    const root = document.documentElement;
    root.lang = next.language;
    root.dataset.fontSize = next.accessibility.fontSize;
    root.style.setProperty('--ui-zoom', FONT_ZOOM[next.accessibility.fontSize] ?? 1);
    root.classList.toggle('dark-theme', next.theme === 'dark');
    root.classList.toggle('high-contrast', next.accessibility.highContrast);
    root.classList.toggle('reduce-motion', next.accessibility.reduceMotion);
    root.classList.toggle('compact-ui', next.compactMode);
  }, []);

  useEffect(() => applySettings(settings), [settings, applySettings]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setSettings(mergeSettings(JSON.parse(event.newValue)));
        setSyncState('synced');
      } catch {
        setError('Settings from another session could not be synchronized.');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const saveSettings = useCallback((nextSettings) => {
    const normalized = mergeSettings(nextSettings);
    setSyncState('saving');
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      setSettings(normalized);
      applySettings(normalized);
      setSyncState('saved');
      return { ok: true };
    } catch {
      setSyncState('error');
      setError('Your settings could not be saved on this device.');
      return { ok: false };
    }
  }, [applySettings]);

  const resetSettings = useCallback(() => saveSettings(DEFAULT_SETTINGS), [saveSettings]);
  const updateSetting = useCallback((key, value) => saveSettings({ ...settings, [key]: value }), [settings, saveSettings]);

  const persistDevices = useCallback((updater) => {
    setDevices((current) => {
      const next = updater(current);
      try {
        localStorage.setItem(`${STORAGE_KEY}_devices`, JSON.stringify(next));
      } catch {
        setError('Device sessions could not be updated.');
      }
      return next;
    });
  }, []);

  const removeDevice = useCallback((id) => {
    persistDevices((current) => current.filter((device) => device.id !== id || device.current));
  }, [persistDevices]);

  const signOutOtherSessions = useCallback(() => {
    persistDevices((current) => current.filter((device) => device.current));
  }, [persistDevices]);
  const formatDate = useCallback((value, includeTime = false) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const locale = settings.language === 'ar' ? 'ar-PS' : 'en-GB';
    const options = {
      timeZone: settings.timeZone,
      day: '2-digit', month: settings.dateFormat === 'MMM D, YYYY' ? 'short' : '2-digit', year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    };
    if (settings.dateFormat === 'YYYY-MM-DD') {
      const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date);
      const part = (type) => parts.find((item) => item.type === type)?.value;
      return `${part('year')}-${part('month')}-${part('day')}`;
    }
    return new Intl.DateTimeFormat(locale, options).format(date);
  }, [settings]);

  const value = useMemo(() => ({
    settings, devices, syncState, error,
    saveSettings, resetSettings, updateSetting,
    removeDevice, signOutOtherSessions, formatDate,
    darkMode: settings.theme === 'dark',
    toggleDarkMode: () => updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark'),
    language: settings.language,
    setLanguage: (language) => updateSetting('language', language),
    fontSize: settings.accessibility.fontSize,
    setFontSize: (fontSize) => saveSettings({ ...settings, accessibility: { ...settings.accessibility, fontSize } }),
    twoFactorEnabled: settings.security.twoFactor,
    toggleTwoFactor: () => saveSettings({ ...settings, security: { ...settings.security, twoFactor: !settings.security.twoFactor } }),
  }), [settings, devices, syncState, error, saveSettings, resetSettings, updateSetting, removeDevice, signOutOtherSessions, formatDate]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}
