import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheck, FiChevronDown, FiChevronRight, FiEdit2, FiEye,
  FiHelpCircle, FiKey, FiLock, FiLogOut, FiMail, FiMonitor,
  FiMoon, FiShield, FiStar, FiType, FiUser, FiX,
} from 'react-icons/fi';
import { DEFAULT_SETTINGS, useSettings } from './SettingsContext';
import { clearCurrentUser } from './studentsData';
import './Settings.css';

const clone = (value) => JSON.parse(JSON.stringify(value));

// FIXED: the language buttons used to be disabled with a "coming soon"
// label. This is a real, working translation — scoped to this page only,
// since translating every other page in the app is a much larger,
// separate project (see the note under Language selection below).
// Switching language here never touches text *direction*
// (see SettingsContext.jsx) — only the words themselves change.
const STRINGS = {
  eyebrow: { en: 'Account preferences', ar: 'إعدادات الحساب' },
  title: { en: 'Settings', ar: 'الإعدادات' },
  subtitle: { en: 'Manage your account, appearance, privacy, and support preferences.', ar: 'إدارة حسابك ومظهر الواجهة والخصوصية وتفضيلات الدعم.' },
  save: { en: 'Save changes', ar: 'حفظ التغييرات' },
  activeAccount: { en: 'Active account', ar: 'حساب نشط' },
  editProfile: { en: 'Edit profile', ar: 'تعديل الملف الشخصي' },
  groupAccount: { en: 'The Account', ar: 'الحساب' },
  changePassword: { en: 'Change password', ar: 'تغيير كلمة السر' },
  currentPassword: { en: 'Current password', ar: 'كلمة السر الحالية' },
  newPassword: { en: 'New password', ar: 'كلمة السر الجديدة' },
  confirmPassword: { en: 'Confirm new password', ar: 'تأكيد كلمة السر الجديدة' },
  updatePassword: { en: 'Update password', ar: 'تحديث كلمة السر' },
  deviceManagement: { en: 'Device management', ar: 'إدارة الأجهزة' },
  sessions: { en: 'sessions', ar: 'جلسات' },
  current: { en: 'Current', ar: 'الجهاز الحالي' },
  signOut: { en: 'Sign out', ar: 'تسجيل الخروج' },
  signOutOthers: { en: 'Sign out other devices', ar: 'تسجيل الخروج من باقي الأجهزة' },
  groupAppearance: { en: 'Appearance', ar: 'المظهر' },
  darkMode: { en: 'Dark mode', ar: 'الوضع الليلي' },
  language: { en: 'Language selection', ar: 'اختيار اللغة' },
  english: { en: 'English', ar: 'الإنجليزية' },
  arabic: { en: 'العربية', ar: 'العربية' },
  languageNote: { en: 'Only this Settings page is translated so far — the rest of the platform is being translated gradually.', ar: 'اترجمت صفحة الإعدادات دي بس لحد دلوقتي — باقي المنصة بتتترجم تدريجيًا.' },
  fontSize: { en: 'Font size', ar: 'حجم الخط' },
  small: { en: 'small', ar: 'صغير' },
  medium: { en: 'medium', ar: 'متوسط' },
  large: { en: 'large', ar: 'كبير' },
  groupPrivacy: { en: 'Privacy and Security', ar: 'الخصوصية والأمان' },
  twoFactor: { en: 'Two-factor authentication', ar: 'التحقق بخطوتين' },
  permissions: { en: 'Permissions', ar: 'الصلاحيات' },
  profileVisibility: { en: 'Profile visibility', ar: 'ظهور الملف الشخصي' },
  visAcademy: { en: 'Academy members', ar: 'أعضاء الأكاديمية' },
  visInstructors: { en: 'My instructors', ar: 'المدرّبين بتوعي' },
  visPrivate: { en: 'Only me', ar: 'أنا بس' },
  showActivity: { en: 'Show learning activity', ar: 'إظهار نشاط التعلّم' },
  showActivityDesc: { en: 'Allow approved users to see your progress.', ar: 'السماح للمستخدمين المعتمدين برؤية تقدّمك.' },
  showAchievements: { en: 'Show achievements', ar: 'إظهار الإنجازات' },
  showAchievementsDesc: { en: 'Display certificates and awards on your profile.', ar: 'عرض الشهادات والجوائز في ملفك الشخصي.' },
  instructorMessages: { en: 'Instructor messages', ar: 'رسائل المدرّبين' },
  instructorMessagesDesc: { en: 'Allow course instructors to contact you.', ar: 'السماح لمدرّبي الكورسات بالتواصل معاكِ.' },
  groupSupport: { en: 'Support', ar: 'الدعم' },
  helpCenter: { en: 'Help center', ar: 'مركز المساعدة' },
  contactUs: { en: 'Contact us', ar: 'تواصلي معنا' },
  appRating: { en: 'App rating', ar: 'تقييم التطبيق' },
  restoreDefaults: { en: 'Restore defaults', ar: 'استرجاع الإعدادات الافتراضية' },
  unsaved: { en: 'Unsaved changes', ar: 'تغييرات غير محفوظة' },
  synced: { en: 'Settings synchronized', ar: 'الإعدادات متزامنة' },
  allSaved: { en: 'All changes saved', ar: 'كل التغييرات محفوظة' },
  logout: { en: 'Log out', ar: 'تسجيل الخروج' },
};

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`student-settings-toggle ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function SettingsRow({ icon: Icon, title, value, open, onClick, children, control }) {
  return (
    <div className={`student-settings-row-wrap ${open ? 'is-open' : ''}`}>
      <button type="button" className="student-settings-row" onClick={onClick} aria-expanded={open}>
        <span className="student-settings-row-icon"><Icon /></span>
        <span className="student-settings-row-title">{title}</span>
        {control ? (
          <span className="student-settings-row-control" onClick={(event) => event.stopPropagation()}>{control}</span>
        ) : value ? (
          <span className="student-settings-row-value">{value}</span>
        ) : null}
        {onClick && (open ? <FiChevronDown className="student-settings-chevron" /> : <FiChevronRight className="student-settings-chevron" />)}
      </button>
      {open && children && <div className="student-settings-expanded">{children}</div>}
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <section className="student-settings-group">
      <header>{title}</header>
      <div>{children}</div>
    </section>
  );
}

function Settings({ student, onLogout }) {
  const navigate = useNavigate();
  const {
    settings, devices, saveSettings, resetSettings,
    removeDevice, signOutOtherSessions, syncState,
  } = useSettings();
  const [draft, setDraft] = useState(() => clone(settings));
  const [openRow, setOpenRow] = useState(null);
  const [notice, setNotice] = useState(null);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [rating, setRating] = useState(0);

  // Language switches instantly (not gated behind "Save changes"), which
  // matches how language pickers normally behave — reads from the saved
  // `settings`, not the unsaved `draft`.
  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const t = (key) => STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key;

  // FIXED: this used to unconditionally overwrite the *entire* unsaved
  // draft every time `settings` changed. Dark mode / font size / language
  // now apply instantly via saveSettings() — which updates `settings` —
  // so this was silently discarding any *other* unsaved change (e.g. a
  // toggled permission) the moment the user touched the theme or font
  // size, making "Save changes" appear to do nothing for those fields. It
  // now only resyncs when the draft had no pending local edits.
  const lastSyncedSettings = useRef(settings);
  useEffect(() => {
    setDraft((current) => {
      const wasInSync = JSON.stringify(current) === JSON.stringify(lastSyncedSettings.current);
      lastSyncedSettings.current = settings;
      return wasInSync ? clone(settings) : current;
    });
  }, [settings]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings],
  );

  useEffect(() => {
    const warn = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const patch = (next) => {
    setDraft((current) => ({ ...current, ...next }));
    setNotice(null);
  };

  const patchGroup = (group, next) => {
    setDraft((current) => ({
      ...current,
      [group]: { ...current[group], ...next },
    }));
    setNotice(null);
  };

  const toggleRow = (id) => setOpenRow((current) => (current === id ? null : id));

  const save = () => {
    const result = saveSettings(draft);
    setNotice(result.ok
      ? { type: 'success', text: 'Your settings were saved successfully.' }
      : { type: 'error', text: 'Settings could not be saved. Please try again.' });
  };
  const reset = () => {
    if (!window.confirm('Restore all settings to their default values?')) return;
    const result = resetSettings();
    if (result?.ok !== false) {
      setDraft(clone(DEFAULT_SETTINGS));
      setNotice({ type: 'success', text: 'Default settings were restored.' });
    }
  };

  // Applies immediately, independent of the draft/Save flow — this is
  // the "instant switch" behavior a language picker should have.
  const setLanguage = (value) => saveSettings({ ...settings, language: value });

  // FIXED: these two used to only update `draft`, requiring a separate
  // "Save changes" click before the theme/font size actually applied —
  // so toggling dark mode off (without also clicking Save) silently did
  // nothing, and font size looked entirely non-functional. Both now apply
  // immediately, the same way the language switch already does.
  const setDarkMode = (isDark) => saveSettings({ ...settings, theme: isDark ? 'dark' : 'light' });
  const setFontSize = (size) => saveSettings({ ...settings, accessibility: { ...settings.accessibility, fontSize: size } });

  const changePassword = (event) => {
    event.preventDefault();
    if (!passwords.current || passwords.next.length < 8) {
      setNotice({ type: 'error', text: 'Enter your current password and a new password of at least 8 characters.' });
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setNotice({ type: 'error', text: 'The new password and confirmation do not match.' });
      return;
    }
    setPasswords({ current: '', next: '', confirm: '' });
    setOpenRow(null);
    setNotice({ type: 'success', text: 'Your password was updated successfully.' });
  };

  const logout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    onLogout?.();
    if (!onLogout) clearCurrentUser();
    navigate('/login', { replace: true });
  };

  const logoutOtherDevices = () => {
    if (!window.confirm('Sign out from all other devices?')) return;
    signOutOtherSessions();
    setNotice({ type: 'success', text: 'Other sessions were signed out.' });
  };

  const name = student?.displayName || student?.fullName || 'Student';
  const subtitle = student?.program || student?.major || 'Active Student';
  const avatar = student?.avatar;

  return (
    <main className="student-settings-page" dir="ltr">
      <div className="student-settings-title-row">
        <div>
          <span>{t('eyebrow')}</span>
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
        <button type="button" className="student-settings-save-top" disabled={!dirty} onClick={save}>
          <FiCheck /> {t('save')}
        </button>
      </div>

      {notice && (
        <div className={`student-settings-notice ${notice.type}`} role="status">
          {notice.type === 'success' ? <FiCheck /> : <FiShield />}
          <span>{notice.text}</span>
          <button type="button" aria-label="Close" onClick={() => setNotice(null)}><FiX /></button>
        </div>
      )}

      <section className="student-settings-profile-card">
        <div className="student-settings-profile-main">
          <div className="student-settings-avatar">
            {avatar ? <img src={avatar} alt={name} /> : <FiUser />}
          </div>
          <div className="student-settings-profile-copy">
            <div>
              <h2>{name}</h2>
              <span className="student-settings-active"><FiCheck /> {t('activeAccount')}</span>
            </div>
            <p>{subtitle}</p>
            <small>{student?.email || 'student@university.edu'}</small>
          </div>
        </div>
        <button type="button" className="student-settings-edit" onClick={() => navigate('/edit-profile')}>
          <FiEdit2 /> {t('editProfile')}
        </button>
      </section>

      <div className="student-settings-groups">
        <SettingsGroup title={t('groupAccount')}>
          <SettingsRow icon={FiUser} title={t('editProfile')} onClick={() => navigate('/edit-profile')} />
          <SettingsRow icon={FiLock} title={t('changePassword')} open={openRow === 'password'} onClick={() => toggleRow('password')}>
            <form className="student-settings-form" onSubmit={changePassword}>
              <label>{t('currentPassword')}<input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} /></label>
              <label>{t('newPassword')}<input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} /></label>
              <label>{t('confirmPassword')}<input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} /></label>
              <button type="submit">{t('updatePassword')}</button>
            </form>
          </SettingsRow>
          <SettingsRow icon={FiMonitor} title={t('deviceManagement')} value={`${devices.length} ${t('sessions')}`} open={openRow === 'devices'} onClick={() => toggleRow('devices')}>
            <div className="student-settings-device-list">
              {devices.map((device) => (
                <div key={device.id} className="student-settings-device">
                  <FiMonitor />
                  <div><strong>{device.name}</strong><small>{device.location} · {device.lastActive}</small></div>
                  {device.current ? <span>{t('current')}</span> : <button type="button" onClick={() => removeDevice(device.id)}>{t('signOut')}</button>}
                </div>
              ))}
              {devices.some((device) => !device.current) && <button type="button" className="student-settings-outline" onClick={logoutOtherDevices}>{t('signOutOthers')}</button>}
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title={t('groupAppearance')}>
          <SettingsRow
            icon={FiMoon}
            title={t('darkMode')}
            control={<Toggle checked={settings.theme === 'dark'} label={t('darkMode')} onChange={setDarkMode} />}
          />
          <SettingsRow icon={FiEye} title={t('language')} value={lang === 'ar' ? t('arabic') : t('english')} open={openRow === 'language'} onClick={() => toggleRow('language')}>
            <div className="student-settings-options">
              <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>{t('english')}</button>
              <button type="button" className={lang === 'ar' ? 'active' : ''} onClick={() => setLanguage('ar')}>{t('arabic')}</button>
            </div>
            <p className="student-settings-hint">{t('languageNote')}</p>
          </SettingsRow>
          <SettingsRow icon={FiType} title={t('fontSize')} value={t(settings.accessibility.fontSize)} open={openRow === 'font'} onClick={() => toggleRow('font')}>
            <div className="student-settings-options">
              {['small', 'medium', 'large'].map((size) => (
                <button type="button" key={size} className={settings.accessibility.fontSize === size ? 'active' : ''} onClick={() => setFontSize(size)}>{t(size)}</button>
              ))}
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title={t('groupPrivacy')}>
          <SettingsRow
            icon={FiShield}
            title={t('twoFactor')}
            control={<Toggle checked={draft.security.twoFactor} label={t('twoFactor')} onChange={(checked) => patchGroup('security', { twoFactor: checked })} />}
          />
          <SettingsRow icon={FiKey} title={t('permissions')} open={openRow === 'permissions'} onClick={() => toggleRow('permissions')}>
            <div className="student-settings-permissions">
              <label>
                <span>{t('profileVisibility')}</span>
                <select value={draft.privacy.profileVisibility} onChange={(e) => patchGroup('privacy', { profileVisibility: e.target.value })}>
                  <option value="academy">{t('visAcademy')}</option>
                  <option value="instructors">{t('visInstructors')}</option>
                  <option value="private">{t('visPrivate')}</option>
                </select>
              </label>
              <div><span><strong>{t('showActivity')}</strong><small>{t('showActivityDesc')}</small></span><Toggle checked={draft.privacy.showActivity} label={t('showActivity')} onChange={(checked) => patchGroup('privacy', { showActivity: checked })} /></div>
              <div><span><strong>{t('showAchievements')}</strong><small>{t('showAchievementsDesc')}</small></span><Toggle checked={draft.privacy.showAchievements} label={t('showAchievements')} onChange={(checked) => patchGroup('privacy', { showAchievements: checked })} /></div>
              <div><span><strong>{t('instructorMessages')}</strong><small>{t('instructorMessagesDesc')}</small></span><Toggle checked={draft.privacy.allowInstructorMessages} label={t('instructorMessages')} onChange={(checked) => patchGroup('privacy', { allowInstructorMessages: checked })} /></div>
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title={t('groupSupport')}>
          <SettingsRow icon={FiHelpCircle} title={t('helpCenter')} onClick={() => window.open('mailto:support@compass.academy?subject=Help%20center', '_self')} />
          <SettingsRow icon={FiMail} title={t('contactUs')} onClick={() => window.open('mailto:support@compass.academy', '_self')} />
          <SettingsRow icon={FiStar} title={t('appRating')} value={rating ? `${rating}/5` : ''} open={openRow === 'rating'} onClick={() => toggleRow('rating')}>
            <div className="student-settings-rating" aria-label="Rate Compass Academy">
              {[1, 2, 3, 4, 5].map((value) => (
                <button type="button" key={value} className={value <= rating ? 'active' : ''} onClick={() => { setRating(value); setNotice({ type: 'success', text: `Thank you for rating Compass Academy ${value} out of 5.` }); }}><FiStar /></button>
              ))}
            </div>
          </SettingsRow>
        </SettingsGroup>
      </div>

      <footer className="student-settings-footer">
        <div>
          <button type="button" className="student-settings-reset" onClick={reset}>{t('restoreDefaults')}</button>
          <span className={dirty ? 'pending' : ''}>{dirty ? t('unsaved') : syncState === 'synced' ? t('synced') : t('allSaved')}</span>
        </div>
        <button type="button" className="student-settings-logout" onClick={logout}><FiLogOut /> {t('logout')}</button>
      </footer>
    </main>
  );
}

export default Settings;
