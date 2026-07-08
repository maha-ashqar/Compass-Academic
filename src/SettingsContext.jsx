/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

const defaultDevices = [
  { id: 1, name: 'Chrome on Windows', location: 'Nablus, Palestine', lastActive: 'Active now', current: true },
  { id: 2, name: 'Safari on iPhone', location: 'Nablus, Palestine', lastActive: '2 days ago', current: false },
  { id: 3, name: 'Chrome on Android', location: 'Ramallah, Palestine', lastActive: '1 week ago', current: false },
];

const loadFromStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key} from storage:`, error);
    return fallback;
  }
};

export const SettingsProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => loadFromStorage('settings_darkMode', false));
  const [language, setLanguageState] = useState(() => loadFromStorage('settings_language', 'en'));
  const [fontSize, setFontSizeState] = useState(() => loadFromStorage('settings_fontSize', 'medium'));
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => loadFromStorage('settings_twoFactor', false));
  const [permissions, setPermissions] = useState(() =>
    loadFromStorage('settings_permissions', { camera: false, microphone: false, location: true })
  );
  const [devices, setDevices] = useState(() => loadFromStorage('settings_devices', defaultDevices));

  // تطبيق الوضع الليلي على مستوى التطبيق كامل
  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', darkMode);
    localStorage.setItem('settings_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // تطبيق اللغة واتجاه الصفحة
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('settings_language', JSON.stringify(language));
  }, [language]);

  // تطبيق حجم واجهة لوحة التحكم (تكبير/تصغير)
  useEffect(() => {
    const zoomMap = { small: '0.92', medium: '1', large: '1.12' };
    document.documentElement.style.setProperty('--ui-zoom', zoomMap[fontSize] || '1');
    localStorage.setItem('settings_fontSize', JSON.stringify(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('settings_twoFactor', JSON.stringify(twoFactorEnabled));
  }, [twoFactorEnabled]);

  useEffect(() => {
    localStorage.setItem('settings_permissions', JSON.stringify(permissions));
  }, [permissions]);

  useEffect(() => {
    localStorage.setItem('settings_devices', JSON.stringify(devices));
  }, [devices]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const setLanguage = (lang) => setLanguageState(lang);
  const setFontSize = (size) => setFontSizeState(size);
  const toggleTwoFactor = () => setTwoFactorEnabled((prev) => !prev);

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const removeDevice = (id) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <SettingsContext.Provider
      value={{
        darkMode, toggleDarkMode,
        language, setLanguage,
        fontSize, setFontSize,
        twoFactorEnabled, toggleTwoFactor,
        permissions, togglePermission,
        devices, removeDevice,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};