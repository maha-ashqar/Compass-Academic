import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CompassWordmark from './CompassWordmark';
import heroImg from './assets/hero.jpg';
import { UserIcon, MailIcon, LockIcon, GoogleIcon } from './AuthIcons';
import { studentRegister } from './api/studentAuth';
import './SignupPage.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    letters: /[A-Z]/.test(password) && /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

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
    benefits: [
      'Reach motivated students',
      'Build your own courses',
      'Track student progress',
    ],
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
  const dashboardPath = isTrainer
    ? '/trainer-dashboard'
    : '/student-dashboard';

  const topActionPath = isTrainer ? '/login' : '/trainer-login';

  const passwordChecks = getPasswordChecks(password);
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  const handleSignup = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError('Please complete all required fields.');
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
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

    if (isTrainer) {
      const created = onTrainerSignup
        ? onTrainerSignup(cleanEmail)
        : true;

      if (created === false) {
        setError('We could not create your account. Please try again.');
        return;
      }

      navigate(dashboardPath);
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await studentRegister({
        name: cleanName,
        email: cleanEmail,
        password,
        passwordConfirmation: confirmPassword,
      });

      localStorage.removeItem('student_token');
      sessionStorage.removeItem('student_token');

      sessionStorage.setItem('student_token', data.token);

      if (onStudentSignup) {
        await onStudentSignup(data.user.email);
      }

      navigate('/student-dashboard', {
        replace: true,
      });
    } catch (error) {
      setError(
        error.message ||
          'We could not create your account. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    if (isSubmitting) return;

    setError('Google sign-in will be connected next.');
  };

  return (
    <main className="signup-page">
      <section className="signup-visual">
        <img
          src={heroImg}
          alt="Students collaborating at Compass Academy"
        />

        <div className="signup-overlay" />

        <button
          className="signup-brand"
          type="button"
          onClick={() => navigate('/')}
        >
          <CompassWordmark
            size={30}
            navy="#ffffff"
            academyColor="#12a7df"
          />
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

        <small>
          © {new Date().getFullYear()} Compass Academy · Independent
          student platform
        </small>
      </section>

      <section className="signup-panel">
        <div className="signup-top">
          <span>{content.topActionText}</span>

          <button
            type="button"
            onClick={() => navigate(topActionPath)}
          >
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

          <form
            className="signup-form"
            onSubmit={handleSignup}
            noValidate
          >
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
                    onChange={(event) => {
                      setName(event.target.value);

                      if (error) {
                        setError('');
                      }
                    }}
                    aria-invalid={Boolean(error)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="signup-field">
                <label htmlFor="signup-email">
                  {isTrainer ? 'Work email' : 'University email'}
                </label>

                <div className="signup-input">
                  <MailIcon />

                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder={content.emailPlaceholder}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);

                      if (error) {
                        setError('');
                      }
                    }}
                    aria-invalid={Boolean(error)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-password">
                Create password
              </label>

              <div className="signup-input">
                <LockIcon />

                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);

                    if (error) {
                      setError('');
                    }
                  }}
                  aria-invalid={Boolean(error)}
                  disabled={isSubmitting}
                  required
                />

                <button
                  className="signup-eye"
                  type="button"
                  onClick={() =>
                    setShowPassword((visible) => !visible)
                  }
                  disabled={isSubmitting}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </button>
              </div>

              <div className="signup-strength">
                <i
                  style={{
                    width: `${(passwordScore / 3) * 100}%`,
                  }}
                />
              </div>

              <div className="signup-requirements">
                <span className={passwordChecks.length ? 'valid' : ''}>
                  8+ characters
                </span>

                <span className={passwordChecks.letters ? 'valid' : ''}>
                  Upper & lowercase
                </span>

                <span className={passwordChecks.number ? 'valid' : ''}>
                  At least one number
                </span>
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-confirm">
                Confirm password
              </label>

              <div className="signup-input">
                <LockIcon />

                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);

                    if (error) {
                      setError('');
                    }
                  }}
                  aria-invalid={Boolean(error)}
                  disabled={isSubmitting}
                  required
                />

                {confirmPassword &&
                  password === confirmPassword && (
                    <span className="signup-match">✓</span>
                  )}
              </div>
            </div>

            <label className="signup-terms">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  setAcceptedTerms(event.target.checked);

                  if (error) {
                    setError('');
                  }
                }}
                disabled={isSubmitting}
              />

              <span />

              <b>
                I agree to the{' '}
                <button type="button">Terms of Use</button> and{' '}
                <button type="button">Privacy Policy</button>.
              </b>
            </label>

            {error && (
              <div
                className="signup-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              className="signup-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Creating account…'
                : content.submitLabel}

              {isSubmitting ? (
                <span
                  className="signup-spinner"
                  aria-hidden="true"
                />
              ) : (
                <b>›</b>
              )}
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
            Continue with Google
          </button>

          <div className="signup-login">
            <span>Already have a Compass account?</span>

            <button
              type="button"
              onClick={() => navigate(loginPath)}
            >
              Sign in →
            </button>
          </div>

          <div className="signup-secure">
            <i />
            Secure registration · Your data is protected
          </div>

          <div className="signup-legal">
            Privacy Policy · Terms of Use · Help Center
          </div>
        </div>
      </section>
    </main>
  );
}

export default SignupPage;