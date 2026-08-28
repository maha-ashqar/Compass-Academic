import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompassWordmark from './CompassWordmark';
import heroImg from './assets/hero.jpg';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, GoogleIcon } from './AuthIcons';
import './LoginPage.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Simulated network delay so sign-in feels like a real request instead of an
// instant, jarring redirect. There is no real backend behind this yet.
const SIMULATED_AUTH_DELAY_MS = 550;

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const completeLogin = (loginEmail) => {
    setIsSubmitting(true);
    window.setTimeout(() => {
      if (onLogin) onLogin(loginEmail);
      navigate('/student-dashboard');
    }, SIMULATED_AUTH_DELAY_MS);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    completeLogin(email.trim());
  };

  // FIXED: this button previously had no onClick at all and did nothing.
  // Mirrors the same (currently backend-less) sign-in flow as the email form.
  const handleGoogleLogin = () => {
    if (isSubmitting) return;
    setError('');
    completeLogin('google.student@compass.edu.sa');
  };

  return (
    <main className="student-login-page">
      {/* ============================================
          LEFT — VISUAL / BRAND PANEL
          ============================================ */}
      <section className="student-login-visual">
        <img src={heroImg} alt="Students collaborating on their academic projects" />
        <div className="student-login-overlay" />

        <button
          type="button"
          className="student-login-brand"
          onClick={() => navigate('/')}
          aria-label="Back to Compass Academy home"
        >
          <CompassWordmark size={30} navy="#ffffff" academyColor="#12a7df" />
        </button>

        <span className="student-platform-badge">
          <i />
          Student platform
        </span>

        <div className="student-visual-copy">
          <h1>
            One place for your
            <br />
            academic journey.
          </h1>
          <p>
            Continue learning, follow deadlines, build projects,
            and keep every opportunity within reach.
          </p>

          <div className="student-visual-features">
            <span><i />Guided courses</span>
            <span><i />Practical projects</span>
            <span><i />Mentor support</span>
          </div>
        </div>

        <small className="student-login-copyright">
          © {new Date().getFullYear()} Compass Academy · Independent student platform
        </small>
      </section>

      {/* ============================================
          RIGHT — LOGIN FORM PANEL
          ============================================ */}
      <section className="student-login-panel">
        <div className="trainer-access">
          <span>Joining as an instructor?</span>
          <button type="button" onClick={() => navigate('/trainer-login')}>
            Trainer portal
          </button>
        </div>

        <div className="student-login-content">
          <span className="student-signin-label">
            <i />
            Student sign in
          </span>
          <h2>Welcome back</h2>
          <p className="student-login-intro">Enter your details to continue to your dashboard.</p>

          <form className="student-login-form" onSubmit={handleLogin} noValidate>
            {/* --- Email field --- */}
            <div className="student-field">
              <label htmlFor="student-email">University email</label>
              <div className="student-input">
                <MailIcon />
                <input
                  id="student-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                  required
                />
              </div>
            </div>

            {/* --- Password field --- */}
            <div className="student-field">
              <div className="student-password-row">
                <label htmlFor="student-password">Password</label>
                <button type="button" onClick={() => navigate('/forgot-password')}>
                  Forgot password?
                </button>
              </div>
              <div className="student-input">
                <LockIcon />
                <input
                  id="student-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                  required
                />
                <button
                  type="button"
                  className="student-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* --- Remember me --- */}
            <label className="student-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span />
              Remember me on this device
            </label>

            {error && (
              <div className="student-login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="student-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Continue to dashboard'}
              {isSubmitting ? (
                <span className="student-spinner" aria-hidden="true" />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              )}
            </button>
          </form>

          <div className="student-divider">
            <span>Or sign in with</span>
          </div>

          <button
            type="button"
            className="student-google"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <GoogleIcon />
            {isSubmitting ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div className="student-create-account">
            <div>
              <strong>New to Compass Academy?</strong>
              <span>Create a free account and start exploring.</span>
            </div>
            <button type="button" onClick={() => navigate('/signup')}>
              Create account →
            </button>
          </div>

          <div className="student-secure-note">
            <i />
            Secure access · Your data is protected
          </div>
          <div className="student-legal-links">Privacy Policy · Terms of Use · Help Center</div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
