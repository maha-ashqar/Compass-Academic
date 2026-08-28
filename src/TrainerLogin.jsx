import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import CompassWordmark from './CompassWordmark';
import trainerHero from './assets/course-flutter-workshop.jpg';
import './TrainerLogin.css';

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
    <path fill="#4285f4" d="M21.8 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z" />
    <path fill="#34a853" d="M12 22c2.8 0 5.1-.9 6.8-2.4L15.5 17c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" />
    <path fill="#fbbc05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.4H3A10 10 0 0 0 2 12c0 1.7.4 3.2 1 4.6l3.4-2.7Z" />
    <path fill="#ea4335" d="M12 6c1.5 0 2.9.5 3.9 1.5l3-3A10 10 0 0 0 3 7.4l3.4 2.7A6 6 0 0 1 12 6Z" />
  </svg>
);

// Key used to persist the trainer's email locally when "remember me" is
// checked, so the field can be pre-filled the next time they visit.
const REMEMBER_EMAIL_KEY = 'compass_trainer_remember_email';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TrainerLogin = ({ onLogin }) => {
  const navigate = useNavigate();

  // FIXED: "remember me" used to only *save* the email on submit, never
  // *read* it back — so the feature had no visible effect. Lazily reading it
  // here pre-fills the field on return visits.
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    setError('');

    if (!normalizedEmail || !password) {
      setError('Please enter your work email and password.');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      // `onLogin` is awaited so this component works unchanged once a real
      // authentication request replaces today's local mock: `false` means
      // "rejected", anything else means "signed in".
      const result = await onLogin?.(normalizedEmail, password, { rememberMe });
      if (result === false) {
        setError('The email or password is incorrect.');
        return;
      }

      if (rememberMe) localStorage.setItem(REMEMBER_EMAIL_KEY, normalizedEmail);
      else localStorage.removeItem(REMEMBER_EMAIL_KEY);

      navigate('/trainer-dashboard', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Honest placeholder rather than a fake success: no Google OAuth provider
  // is connected yet, so we tell the trainer plainly instead of pretending
  // to sign them in.
  const handleGoogleClick = () => {
    if (isSubmitting) return;
    setError('Google sign-in requires connecting a Google authentication provider.');
  };

  return (
    <main className="trainer-auth-shell">
      {/* ============================================
          LEFT — VISUAL / BRAND PANEL
          ============================================ */}
      <section className="trainer-auth-story" style={{ '--trainer-hero': `url(${trainerHero})` }} aria-label="Compass Academy trainer portal">
        <button type="button" className="trainer-auth-brand" onClick={() => navigate('/')} aria-label="Return to home page">
          {/* FIXED: prop was `gold` which CompassWordmark doesn't accept
              (it takes `academyColor`), so the accent color never applied. */}
          <CompassWordmark size={28} navy="#ffffff" academyColor="#37c5f3" />
        </button>
        <div className="trainer-auth-portal-badge"><span /> TRAINER PORTAL</div>
        <div className="trainer-auth-story-copy">
          <h1>Guide learning.<br />Build meaningful impact.</h1>
          <p>Manage courses, review student work, and provide the guidance that turns learning into progress.</p>
          <div className="trainer-auth-benefits">
            <span><i /> Course management</span><span><i /> Student feedback</span><span><i /> Project reviews</span>
          </div>
        </div>
        <small>© {new Date().getFullYear()} Compass Academy · Independent learning platform</small>
      </section>

      {/* ============================================
          RIGHT — LOGIN FORM PANEL
          ============================================ */}
      <section className="trainer-auth-panel">
        <div className="trainer-auth-student-link">
          <span>Signing in as a student?</span>
          <button type="button" onClick={() => navigate('/login')}>Student login</button>
        </div>
        <div className="trainer-auth-content">
          <div className="trainer-auth-heading-badge"><span /> TRAINER SIGN IN</div>
          <h2>Welcome back</h2>
          <p className="trainer-auth-lead">Sign in to manage your courses and students.</p>

          <form className="trainer-auth-form" onSubmit={handleLogin} noValidate>
            <label htmlFor="trainer-email">Work email</label>
            <div className="trainer-auth-input">
              <FiMail />
              <input
                id="trainer-email"
                type="email"
                autoComplete="email"
                placeholder="trainer@compass.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
                required
              />
            </div>
            <div className="trainer-auth-password-label">
              <label htmlFor="trainer-password">Password</label>
              <button type="button" onClick={() => navigate('/forgot-password', { state: { from: 'trainer' } })}>
                Forgot password?
              </button>
            </div>
            <div className="trainer-auth-input">
              <FiLock />
              <input
                id="trainer-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
                required
              />
              <button
                type="button"
                className="trainer-auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <label className="trainer-auth-remember">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>{rememberMe && <FiCheck />}</span>Remember me on this device
            </label>
            {error && <p className="trainer-auth-error" role="alert">{error}</p>}
            <button type="submit" className="trainer-auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Continue to trainer dashboard'}
              {isSubmitting ? <span className="trainer-auth-spinner" aria-hidden="true" /> : <FiArrowRight />}
            </button>
          </form>

          <div className="trainer-auth-divider"><span>OR SIGN IN WITH</span></div>
          <button type="button" className="trainer-auth-google" onClick={handleGoogleClick} disabled={isSubmitting}>
            <GoogleIcon /> Continue with Google
          </button>

          <div className="trainer-auth-apply">
            <div><strong>Interested in teaching with us?</strong><span>Submit your trainer profile for review.</span></div>
            {/* FIXED: was `navigate('/signup?role=trainer')` — a query param
                the shared SignupPage never reads. It decides the role from
                `location.state.from`, exactly like the "Forgot password?"
                link above, so this now lands there as a trainer. */}
            <button type="button" onClick={() => navigate('/signup', { state: { from: 'trainer' } })}>
              Apply now <FiArrowRight />
            </button>
          </div>
          <div className="trainer-auth-secure"><span /> Secure trainer access · Protected workspace</div>
          <nav className="trainer-auth-legal" aria-label="Legal links">
            <button type="button">Privacy Policy</button><span>·</span>
            <button type="button">Terms of Use</button><span>·</span>
            <button type="button">Help Center</button>
          </nav>
        </div>
      </section>
    </main>
  );
};

export default TrainerLogin;
