import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompassWordmark from './CompassWordmark';
import heroImg from './assets/hero.jpg';
import { UserIcon, MailIcon, LockIcon, GoogleIcon } from './AuthIcons';
import './SignupPage.css';

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

function SignupPage({ onSignup }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const passwordChecks = getPasswordChecks(password);
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  const handleSignup = (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please complete all required fields.');
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

    const created = onSignup ? onSignup(email) : true;
    if (created !== false) navigate('/student-dashboard');
  };

  return (
    <main className="student-signup-page">
      {/* ============================================
          LEFT — VISUAL / BRAND PANEL
          ============================================ */}
      <section className="student-signup-visual">
        <img src={heroImg} alt="Students collaborating at Compass Academy" />
        <div className="student-signup-overlay" />

        <button className="student-signup-brand" type="button" onClick={() => navigate('/')}>
          {/* was: gold="#12a7df" (invalid prop, had no effect) */}
          <CompassWordmark size={30} navy="#ffffff" academyColor="#12a7df" />
        </button>

        <span className="student-signup-badge">
          <i />
          Student platform
        </span>

        <div className="student-signup-copy">
          <h1>
            Start building your
            <br />
            academic direction.
          </h1>
          <p>
            Create your free account, choose your learning path,
            and turn every new skill into practical progress.
          </p>
          <div className="student-signup-benefits">
            <span><i />Free student access</span>
            <span><i />Practical courses</span>
            <span><i />Mentor guidance</span>
          </div>
        </div>

        <small>© 2026 Compass Academy · Independent student platform</small>
      </section>

      {/* ============================================
          RIGHT — SIGNUP FORM PANEL
          ============================================ */}
      <section className="student-signup-panel">
        <div className="student-signup-top">
          <span>Joining as an instructor?</span>
          <button type="button" onClick={() => navigate('/trainer-login')}>
            Trainer portal
          </button>
        </div>

        <div className="student-signup-content">
          <span className="student-signup-label">
            <i />
            Student registration
          </span>
          <h2>Create your account</h2>
          <p className="student-signup-intro">Join Compass Academy and start building your next step.</p>

          <form className="student-signup-form" onSubmit={handleSignup}>
            {/* --- Name + Email (side by side) --- */}
            <div className="student-signup-grid">
              <div className="student-signup-field">
                <label htmlFor="signup-name">Full name</label>
                <div className="student-signup-input">
                  <UserIcon />
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="student-signup-field">
                <label htmlFor="signup-email">University email</label>
                <div className="student-signup-input">
                  <MailIcon />
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* --- Password + live strength/requirements --- */}
            <div className="student-signup-field">
              <label htmlFor="signup-password">Create password</label>
              <div className="student-signup-input">
                <LockIcon />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="student-signup-eye"
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

              <div className="student-signup-strength">
                <i style={{ width: `${(passwordScore / 3) * 100}%` }} />
              </div>

              <div className="student-signup-requirements">
                <span className={passwordChecks.length ? 'valid' : ''}>8+ characters</span>
                <span className={passwordChecks.letters ? 'valid' : ''}>Upper & lowercase</span>
                <span className={passwordChecks.number ? 'valid' : ''}>At least one number</span>
              </div>
            </div>

            {/* --- Confirm password --- */}
            <div className="student-signup-field">
              <label htmlFor="signup-confirm">Confirm password</label>
              <div className="student-signup-input">
                <LockIcon />
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                {confirmPassword && password === confirmPassword && (
                  <span className="student-signup-match">✓</span>
                )}
              </div>
            </div>

            {/* --- Terms checkbox --- */}
            <label className="student-signup-terms">
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

            {error && <div className="student-signup-error">{error}</div>}

            <button className="student-signup-submit" type="submit">
              Create student account
              <b>›</b>
            </button>
          </form>

          <div className="student-signup-divider">
            <span>Or continue with</span>
          </div>

          <button className="student-signup-google" type="button">
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="student-signup-login">
            <span>Already have a Compass account?</span>
            <button type="button" onClick={() => navigate('/login')}>
              Sign in →
            </button>
          </div>

          <div className="student-signup-secure">
            <i />
            Secure registration · Your data is protected
          </div>
          <div className="student-signup-legal">Privacy Policy · Terms of Use · Help Center</div>
        </div>
      </section>
    </main>
  );
}

export default SignupPage;