import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiLock, FiMonitor, FiMoon, FiGlobe, FiType,
  FiShield, FiKey, FiHelpCircle, FiMessageCircle, FiStar,
  FiChevronDown, FiChevronRight, FiEdit2
} from 'react-icons/fi';
import { useSettings } from './SettingsContext';
import './Settings.css';

const translations = {
  en: {
    theAccount: 'The Account',
    editProfile: 'Edit Profile',
    changePassword: 'change password',
    deviceManagement: 'Device Management',
    appearance: 'Appearance',
    darkMode: 'Dark mode',
    languageSelection: 'Language Selection',
    fontSize: 'Font size',
    privacySecurity: 'Privacy and Security',
    twoFactor: 'Two-factor authentication',
    permissions: 'Permissions',
    support: 'Support',
    helpCenter: 'Help Center',
    contactUs: 'Contact us',
    appRating: 'App Rating',
    logout: 'Log out',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    save: 'Save',
    cancel: 'Cancel',
    signOut: 'Sign out',
    thisDevice: 'This device',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    camera: 'Camera',
    microphone: 'Microphone',
    location: 'Location',
    passwordSuccess: 'Password changed successfully.',
    passwordMismatch: 'New passwords do not match.',
    passwordTooShort: 'New password must be at least 6 characters.',
    helpText: 'Find answers to common questions about courses, enrollment, certificates, and account management.',
    faq1: 'How do I enroll in a course?',
    faq1a: 'Go to Courses, open any course, and click "Learn for Free".',
    faq2: 'How do I track my progress?',
    faq2a: 'Visit My Courses to see your progress bar for each enrolled course.',
    contactName: 'Your name',
    contactEmail: 'Your email',
    contactMessage: 'Your message',
    send: 'Send message',
    contactSuccess: "Thanks! We'll get back to you soon.",
    sendAnother: 'Send another message',
    rateUs: 'How would you rate your experience?',
    submitRating: 'Submit rating',
    ratingThanks: 'Thank you for your feedback!',
    twoFactorOn: 'Two-factor authentication is enabled.',
    twoFactorOff: 'Two-factor authentication is disabled.',
  },
  ar: {
    theAccount: 'الحساب',
    editProfile: 'تعديل الملف الشخصي',
    changePassword: 'تغيير كلمة المرور',
    deviceManagement: 'إدارة الأجهزة',
    appearance: 'المظهر',
    darkMode: 'الوضع الليلي',
    languageSelection: 'اختيار اللغة',
    fontSize: 'حجم الخط',
    privacySecurity: 'الخصوصية والأمان',
    twoFactor: 'المصادقة الثنائية',
    permissions: 'الصلاحيات',
    support: 'الدعم',
    helpCenter: 'مركز المساعدة',
    contactUs: 'تواصل معنا',
    appRating: 'تقييم التطبيق',
    logout: 'تسجيل الخروج',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور الجديدة',
    save: 'حفظ',
    cancel: 'إلغاء',
    signOut: 'تسجيل خروج',
    thisDevice: 'هذا الجهاز',
    small: 'صغير',
    medium: 'متوسط',
    large: 'كبير',
    camera: 'الكاميرا',
    microphone: 'الميكروفون',
    location: 'الموقع',
    passwordSuccess: 'تم تغيير كلمة المرور بنجاح.',
    passwordMismatch: 'كلمتا المرور غير متطابقتين.',
    passwordTooShort: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
    helpText: 'اعثري على إجابات للأسئلة الشائعة حول الكورسات والتسجيل والشهادات وإدارة الحساب.',
    faq1: 'كيف أسجل بكورس؟',
    faq1a: 'روحي لـ Courses، افتحي أي كورس، واضغطي "Learn for Free".',
    faq2: 'كيف أتابع تقدمي؟',
    faq2a: 'روحي لـ My Courses لمشاهدة شريط التقدم لكل كورس مسجلة فيه.',
    contactName: 'اسمك',
    contactEmail: 'بريدك الإلكتروني',
    contactMessage: 'رسالتك',
    send: 'إرسال الرسالة',
    contactSuccess: 'شكراً! رح نتواصل معك قريباً.',
    sendAnother: 'إرسال رسالة أخرى',
    rateUs: 'كيف تقيّمين تجربتك؟',
    submitRating: 'إرسال التقييم',
    ratingThanks: 'شكراً على تقييمك!',
    twoFactorOn: 'المصادقة الثنائية مفعّلة.',
    twoFactorOff: 'المصادقة الثنائية غير مفعّلة.',
  },
};

const ToggleSwitch = ({ checked, onChange }) => (
  <div
    className={`toggle-switch ${checked ? 'active' : ''}`}
    onClick={(e) => {
      e.stopPropagation();
      onChange();
    }}
  >
    <span className="toggle-knob" />
  </div>
);

const Settings = ({ student }) => {
  const navigate = useNavigate();
  const {
    darkMode, toggleDarkMode,
    language, setLanguage,
    fontSize, setFontSize,
    twoFactorEnabled, toggleTwoFactor,
    permissions, togglePermission,
    devices, removeDevice,
  } = useSettings();

  const t = translations[language] || translations.en;
  const [expanded, setExpanded] = useState(null);

  const toggleExpand = (key) => {
    setExpanded((prev) => (prev === key ? null : key));
  };

  // ===== تغيير كلمة المرور =====
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.next.length < 6) {
      setPasswordMsg({ type: 'error', text: t.passwordTooShort });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: t.passwordMismatch });
      return;
    }
    setPasswordMsg({ type: 'success', text: t.passwordSuccess });
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  // ===== تواصل معنا =====
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
  };

  const resetContact = () => {
    setContactSent(false);
    setContactForm({ name: '', email: '', message: '' });
  };

  // ===== تقييم التطبيق =====
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleSubmitRating = () => {
    if (rating > 0) setRatingSubmitted(true);
  };

  // ===== تسجيل الخروج =====
  const handleLogout = () => {
    const confirmed = window.confirm(
      language === 'ar' ? 'هل تريدين تسجيل الخروج؟' : 'Are you sure you want to log out?'
    );
    if (confirmed) navigate('/login');
  };

  return (
    <div className="settings-container">
      {/* كرت البروفايل العلوي */}
      <div className="settings-hero-card">
        <div className="settings-hero-left">
          <img src={student.avatar} alt={student.displayName} className="settings-hero-avatar" />
          <div>
            <div className="settings-hero-name-row">
              <h2>{student.displayName}</h2>
              <span className="settings-status-badge">{student.status} ✓</span>
            </div>
            <p className="settings-hero-major">{student.major}</p>
          </div>
        </div>
        <button className="settings-edit-btn" onClick={() => navigate('/edit-profile')}>
          {t.editProfile} <FiEdit2 />
        </button>
      </div>

      {/* ============ قسم الحساب ============ */}
      <div className="settings-section">
        <div className="settings-section-header">{t.theAccount}</div>

        <div className="settings-row" onClick={() => navigate('/edit-profile')}>
          <div className="settings-row-left">
            <FiUser className="settings-row-icon" />
            <span>{t.editProfile}</span>
          </div>
          <FiChevronRight className="chevron" />
        </div>

        <div className="settings-row" onClick={() => toggleExpand('password')}>
          <div className="settings-row-left">
            <FiLock className="settings-row-icon" />
            <span>{t.changePassword}</span>
          </div>
          {expanded === 'password' ? <FiChevronDown className="chevron" /> : <FiChevronRight className="chevron" />}
        </div>
        {expanded === 'password' && (
          <div className="settings-expand-panel">
            <form className="settings-form" onSubmit={handleChangePassword}>
              <input
                type="password"
                placeholder={t.currentPassword}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder={t.newPassword}
                value={passwordForm.next}
                onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder={t.confirmPassword}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
              />
              <button type="submit" className="settings-save-btn">{t.save}</button>
              {passwordMsg && (
                <p className={passwordMsg.type === 'success' ? 'settings-success-msg' : 'settings-error-msg'}>
                  {passwordMsg.text}
                </p>
              )}
            </form>
          </div>
        )}

        <div className="settings-row" onClick={() => toggleExpand('devices')}>
          <div className="settings-row-left">
            <FiMonitor className="settings-row-icon" />
            <span>{t.deviceManagement}</span>
          </div>
          {expanded === 'devices' ? <FiChevronDown className="chevron" /> : <FiChevronRight className="chevron" />}
        </div>
        {expanded === 'devices' && (
          <div className="settings-expand-panel">
            {devices.map((d) => (
              <div className="device-item" key={d.id}>
                <div className="device-info">
                  <h4>{d.name}</h4>
                  <p>{d.location} · {d.lastActive}</p>
                </div>
                {d.current ? (
                  <span className="device-current-badge">{t.thisDevice}</span>
                ) : (
                  <button className="device-signout-btn" onClick={() => removeDevice(d.id)}>
                    {t.signOut}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ قسم المظهر ============ */}
      <div className="settings-section">
        <div className="settings-section-header">{t.appearance}</div>

        <div className="settings-row">
          <div className="settings-row-left">
            <FiMoon className="settings-row-icon" />
            <span>{t.darkMode}</span>
          </div>
          <ToggleSwitch checked={darkMode} onChange={toggleDarkMode} />
        </div>

        <div className="settings-row" onClick={() => toggleExpand('language')}>
          <div className="settings-row-left">
            <FiGlobe className="settings-row-icon" />
            <span>{t.languageSelection}</span>
          </div>
          <div className="settings-row-right">
            <span>{language === 'ar' ? 'العربية' : 'English'}</span>
            {expanded === 'language' ? <FiChevronDown className="chevron" /> : <FiChevronRight className="chevron" />}
          </div>
        </div>
        {expanded === 'language' && (
          <div className="settings-expand-panel">
            <div
              className={`lang-option ${language === 'en' ? 'active' : ''}`}
              onClick={() => { setLanguage('en'); setExpanded(null); }}
            >
              English
            </div>
            <div
              className={`lang-option ${language === 'ar' ? 'active' : ''}`}
              onClick={() => { setLanguage('ar'); setExpanded(null); }}
            >
              العربية
            </div>
          </div>
        )}

        <div className="settings-row" onClick={() => toggleExpand('fontSize')}>
          <div className="settings-row-left">
            <FiType className="settings-row-icon" />
            <span>{t.fontSize}</span>
          </div>
          {expanded === 'fontSize' ? <FiChevronDown className="chevron" /> : <FiChevronRight className="chevron" />}
        </div>
        {expanded === 'fontSize' && (
          <div className="settings-expand-panel">
            <div className="fontsize-options">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  className={`fontsize-btn ${fontSize === size ? 'active' : ''}`}
                  onClick={() => setFontSize(size)}
                >
                  {t[size]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ قسم الخصوصية والأمان ============ */}
      <div className="settings-section">
        <div className="settings-section-header">{t.privacySecurity}</div>

        <div className="settings-row">
          <div className="settings-row-left">
            <FiShield className="settings-row-icon" />
            <span>{t.twoFactor}</span>
          </div>
          <ToggleSwitch checked={twoFactorEnabled} onChange={toggleTwoFactor} />
        </div>
        {twoFactorEnabled !== undefined && (
          <p className="settings-inline-note">
            {twoFactorEnabled ? t.twoFactorOn : t.twoFactorOff}
          </p>
        )}

        <div className="settings-row" onClick={() => toggleExpand('permissions')}>
          <div className="settings-row-left">
            <FiKey className="settings-row-icon" />
            <span>{t.permissions}</span>
          </div>
          {expanded === 'permissions' ? <FiChevronDown className="chevron" /> : <FiChevronRight className="chevron" />}
        </div>
        {expanded === 'permissions' && (
          <div className="settings-expand-panel">
            {['camera', 'microphone', 'location'].map((key) => (
              <div className="settings-row nested" key={key}>
                <span>{t[key]}</span>
                <ToggleSwitch checked={permissions[key]} onChange={() => togglePermission(key)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ قسم الدعم ============ */}
      <div className="settings-section">
        <div className="settings-section-header">{t.support}</div>

        <div className="settings-row" onClick={() => toggleExpand('help')}>
          <div className="settings-row-left">
            <FiHelpCircle className="settings-row-icon" />
            <span>{t.helpCenter}</span>
          </div>
          {expanded === 'help' ? <FiChevronDown className="chevron" /> : <FiChevronRight className="chevron" />}
        </div>
        {expanded === 'help' && (
          <div className="settings-expand-panel">
            <p className="help-text">{t.helpText}</p>
            <div className="faq-item">
              <h4>{t.faq1}</h4>
              <p>{t.faq1a}</p>
            </div>
            <div className="faq-item">
              <h4>{t.faq2}</h4>
              <p>{t.faq2a}</p>
            </div>
          </div>
        )}

        <div className="settings-row" onClick={() => toggleExpand('contact')}>
          <div className="settings-row-left">
            <FiMessageCircle className="settings-row-icon" />
            <span>{t.contactUs}</span>
          </div>
          {expanded === 'contact' ? <FiChevronDown className="chevron" /> : <FiChevronRight className="chevron" />}
        </div>
        {expanded === 'contact' && (
          <div className="settings-expand-panel">
            {contactSent ? (
              <div>
                <p className="settings-success-msg">{t.contactSuccess}</p>
                <button className="settings-save-btn" onClick={resetContact} style={{ marginTop: 10 }}>
                  {t.sendAnother}
                </button>
              </div>
            ) : (
              <form className="settings-form" onSubmit={handleContactSubmit}>
                <input
                  type="text"
                  placeholder={t.contactName}
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder={t.contactEmail}
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder={t.contactMessage}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
                <button type="submit" className="settings-save-btn">{t.send}</button>
              </form>
            )}
          </div>
        )}

        <div className="settings-row" onClick={() => toggleExpand('rating')}>
          <div className="settings-row-left">
            <FiStar className="settings-row-icon" />
            <span>{t.appRating}</span>
          </div>
          {expanded === 'rating' ? <FiChevronDown className="chevron" /> : <FiChevronRight className="chevron" />}
        </div>
        {expanded === 'rating' && (
          <div className="settings-expand-panel">
            {ratingSubmitted ? (
              <p className="settings-success-msg">{t.ratingThanks}</p>
            ) : (
              <>
                <p className="help-text">{t.rateUs}</p>
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= rating ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <button
                  className="settings-save-btn"
                  style={{ marginTop: 14 }}
                  onClick={handleSubmitRating}
                >
                  {t.submitRating}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <button className="logout-btn-settings" onClick={handleLogout}>
        {t.logout}
      </button>
    </div>
  );
};

export default Settings;