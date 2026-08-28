import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CompassWordmark from './CompassWordmark';
import heroImg from './assets/hero.jpg';
import { UserIcon, MailIcon, LockIcon, GoogleIcon } from './AuthIcons';
import './SignupPage.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Simulated network delay so account creation feels like a real request
// instead of an instant, jarring redirect. There is no real backend yet.
const SIMULATED_AUTH_DELAY_MS = 550;

/**
 * Live validation rules for the new password.
 * Returned as booleans so both the requirements
 * checklist and the strength bar can reuse them.
 */
function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    letters: /[A-Z]/.test(password) && /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

/* ============================================
   ONE signup page, TWO roles.
   Which role is active is decided purely by how the
   page was reached — the same pattern already used by
   ForgotPasswordPage.jsx (location.state.from === 'trainer').
   Student login's "Create account" link passes no state,
   so it defaults to student. Trainer login should pass
   { state: { from: 'trainer' } } on its own signup link.
   ============================================ */
const CONTENT_BY_ORIGIN = {
  student: {
    badge: 'Student platform',
    headingLines: ['Start building your', 'academic direction.'],
    intro:
      'Create your free account, choose your learning path, and turn every new skill into practical progress.',
    benefits: ['Free student access', 'Practical courses', 'Mentor guidance'],
    signInLabel: 'Student sign in',
    formTitle: 'Create your account',
    formIntro: 'Join Compass Academy and start building your next step.',
    emailPlaceholder: 'name@university.edu',
    submitLabel: 'Create student account',
    topActionText: 'Joining as an instructor?',
    topActionLabel: 'Trainer portal',
  },
  trainer: {
    badge: 'Trainer platform',
    headingLines: ['Share your expertise.', 'Guide what comes next.'],
    intro:
      'Create your instructor account, publish courses, and mentor students through real, practical work.',
    benefits: ['Reach motivated students', 'Build your own courses', 'Track student progress'],
    signInLabel: 'Trainer registration',
    formTitle: 'Create your instructor account',
    formIntro: 'Join Compass Academy and start guiding students.',
    emailPlaceholder: 'name@compass.edu.sa',
    submitLabel: 'Create trainer account',
    topActionText: 'Joining as a student?',
    topActionLabel: 'Student portal',
  },
};

function SignupPage({ onStudentSignup, onTrainerSignup }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isTrainer = location.state?.from === 'trainer';
  const origin = isTrainer ? 'trainer' : 'student';
  const content = CONTENT_BY_ORIGIN[origin];
  const loginPath = isTrainer ? '/trainer-login' : '/login';
  const dashboardPath = isTrainer ? '/trainer-dashboard' : '/student-dashboard';
  const topActionPath = isTrainer ? '/login' : '/trainer-login';

  const passwordChecks = getPasswordChecks(password);
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  const completeSignup = (signupEmail) => {
    setIsSubmitting(true);
    window.setTimeout(() => {
      const signupHandler = isTrainer ? onTrainerSignup : onStudentSignup;
      const created = signupHandler ? signupHandler(signupEmail) : true;

      if (created === false) {
        setIsSubmitting(false);
        setError('We could not create your account. Please try again.');
        return;
      }
      navigate(dashboardPath);
    }, SIMULATED_AUTH_DELAY_MS);
  };

  const handleSignup = (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please complete all required fields.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms of Use and Privacy Policy.');
      return;
    }

    completeSignup(email.trim());
  };

  // FIXED: this button previously had no onClick at all and did nothing.
  const handleGoogleSignup = () => {
    if (isSubmitting) return;
    setError('');
    completeSignup(isTrainer ? 'google.trainer@compass.edu.sa' : 'google.student@compass.edu.sa');
  };

  return (
    <main className="signup-page">
      {/* ============================================
          LEFT — VISUAL / BRAND PANEL
          ============================================ */}
      <section className="signup-visual">
        <img src={heroImg} alt="Students collaborating at Compass Academy" />
        <div className="signup-overlay" />

        <button className="signup-brand" type="button" onClick={() => navigate('/')}>
          <CompassWordmark size={30} navy="#ffffff" academyColor="#12a7df" />
        </button>

        <span className="signup-badge">
          <i />
          {content.badge}
        </span>

        <div className="signup-copy">
          <h1>
            {content.headingLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p>{content.intro}</p>
          <div className="signup-benefits">
            {content.benefits.map((benefit) => (
              <span key={benefit}>
                <i />
                {benefit}
              </span>
            ))}
          </div>
        </div>

        <small>© {new Date().getFullYear()} Compass Academy · Independent student platform</small>
      </section>

      {/* ============================================
          RIGHT — SIGNUP FORM PANEL
          ============================================ */}
      <section className="signup-panel">
        <div className="signup-top">
          <span>{content.topActionText}</span>
          <button type="button" onClick={() => navigate(topActionPath)}>
            {content.topActionLabel}
          </button>
        </div>

        <div className="signup-content">
          <span className="signup-label">
            <i />
            {isTrainer ? 'Trainer registration' : 'Student registration'}
          </span>
          <h2>{content.formTitle}</h2>
          <p className="signup-intro">{content.formIntro}</p>

          <form className="signup-form" onSubmit={handleSignup} noValidate>
            {/* --- Name + Email (side by side) --- */}
            <div className="signup-grid">
              <div className="signup-field">
                <label htmlFor="signup-name">Full name</label>
                <div className="signup-input">
                  <UserIcon />
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(error)}
                    required
                  />
                </div>
              </div>

              <div className="signup-field">
                <label htmlFor="signup-email">{isTrainer ? 'Work email' : 'University email'}</label>
                <div className="signup-input">
                  <MailIcon />
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder={content.emailPlaceholder}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(error)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* --- Password + live strength/requirements --- */}
            <div className="signup-field">
              <label htmlFor="signup-password">Create password</label>
              <div className="signup-input">
                <LockIcon />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                  required
                />
                <button
                  className="signup-eye"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </button>
              </div>

              <div className="signup-strength">
                <i style={{ width: `${(passwordScore / 3) * 100}%` }} />
              </div>

              <div className="signup-requirements">
                <span className={passwordChecks.length ? 'valid' : ''}>8+ characters</span>
                <span className={passwordChecks.letters ? 'valid' : ''}>Upper & lowercase</span>
                <span className={passwordChecks.number ? 'valid' : ''}>At least one number</span>
              </div>
            </div>

            {/* --- Confirm password --- */}
            <div className="signup-field">
              <label htmlFor="signup-confirm">Confirm password</label>
              <div className="signup-input">
                <LockIcon />
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                  required
                />
                {confirmPassword && password === confirmPassword && (
                  <span className="signup-match">✓</span>
                )}
              </div>
            </div>

            {/* --- Terms checkbox --- */}
            <label className="signup-terms">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
              <span />
              <b>
                I agree to the <button type="button">Terms of Use</button> and{' '}
                <button type="button">Privacy Policy</button>.
              </b>
            </label>

            {error && (
              <div className="signup-error" role="alert">
                {error}
              </div>
            )}

            <button className="signup-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : content.submitLabel}
              {isSubmitting ? <span className="signup-spinner" aria-hidden="true" /> : <b>›</b>}
            </button>
          </form>

          <div className="signup-divider">
            <span>Or continue with</span>
          </div>

          <button
            className="signup-google"
            type="button"
            onClick={handleGoogleSignup}
            disabled={isSubmitting}
          >
            <GoogleIcon />
            {isSubmitting ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div className="signup-login">
            <span>Already have a Compass account?</span>
            <button type="button" onClick={() => navigate(loginPath)}>
              Sign in →
            </button>
          </div>

          <div className="signup-secure">
            <i />
            Secure registration · Your data is protected
          </div>
          <div className="signup-legal">Privacy Policy · Terms of Use · Help Center</div>
        </div>
      </section>
    </main>
  );
}

export default SignupPage;
