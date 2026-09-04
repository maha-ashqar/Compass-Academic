import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CompassWordmark from './CompassWordmark';
import heroImg from './assets/hero.jpg';
import trainerHero from './assets/course-flutter-workshop.jpg';
import { MailIcon, LockIcon, CheckIcon } from './AuthIcons';
import {
  requestStudentPasswordReset,
  verifyStudentPasswordResetCode,
  resetStudentPassword,
} from './api/studentAuth';
import './ForgotPasswordPage.css';

const VISUAL_CONTENT_BY_ROLE = {
  student: {
    image: heroImg,
    imageAlt: 'Students collaborating on their academic projects',
    badgeLabel: 'Student platform',
    steps: {
      1: {
        title: 'Your learning progress\nis always protected.',
        text:
          'Recover your account securely and return to your courses, projects, and academic goals.',
        points: [
          'Secure recovery',
          'Protected account',
          'Student support',
        ],
      },
      2: {
        title: 'Your learning progress\nis always protected.',
        text:
          'Recover your account securely and return to your courses, projects, and academic goals.',
        points: ['Secure recovery', 'Protected account'],
      },
      3: {
        title: 'Choose a strong password.\nKeep your journey secure.',
        text:
          'A secure password helps protect your courses, projects, certificates, and personal academic information.',
        points: [
          '8+ characters',
          'Upper & lowercase',
          'Number or symbol',
        ],
      },
      4: {
        title: 'You’re ready to continue.\nYour progress is waiting.',
        text:
          'Return securely to your dashboard and continue from exactly where you stopped.',
        points: [],
      },
    },
  },

  trainer: {
    image: trainerHero,
    imageAlt: 'A trainer preparing course material for students',
    badgeLabel: 'Trainer platform',
    steps: {
      1: {
        title: 'Your courses and students\nstay safely in your hands.',
        text:
          'Recover your trainer account securely and get back to managing courses, feedback, and student progress.',
        points: [
          'Secure recovery',
          'Protected workspace',
          'Trainer support',
        ],
      },
      2: {
        title: 'Your courses and students\nstay safely in your hands.',
        text:
          'Recover your trainer account securely and get back to managing courses, feedback, and student progress.',
        points: ['Secure recovery', 'Protected workspace'],
      },
      3: {
        title: 'Choose a strong password.\nKeep your workspace secure.',
        text:
          'A secure password helps protect your courses, student records, and review history.',
        points: [
          '8+ characters',
          'Upper & lowercase',
          'Number or symbol',
        ],
      },
      4: {
        title: 'You’re ready to continue.\nYour dashboard is waiting.',
        text:
          'Return securely to your trainer dashboard and continue right where you left off.',
        points: [],
      },
    },
  },
};

const RESEND_COOLDOWN_SECONDS = 45;
const DUMMY_CODE = '123456';

function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(
    RESEND_COOLDOWN_SECONDS
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const origin =
    location.state?.from === 'trainer'
      ? 'trainer'
      : 'student';

  const loginPath =
    origin === 'trainer'
      ? '/trainer-login'
      : '/login';

  const roleContent = VISUAL_CONTENT_BY_ROLE[origin];
  const visualContent = roleContent.steps[step];
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const resetEmail =
      params.get('email')?.trim().toLowerCase() || '';

    const resetCode =
      params.get('code')?.trim() || '';

    if (!resetEmail || !/^\d{6}$/.test(resetCode)) {
      return;
    }

    let cancelled = false;

    const verifyLinkCode = async () => {
      setEmail(resetEmail);
      setCode(resetCode);
      setError('');
      setStep(2);
      setIsSubmitting(true);

      try {
        await verifyStudentPasswordResetCode(
          resetEmail,
          resetCode
        );

        if (cancelled) return;

        setStep(3);

        navigate('/forgot-password', {
          replace: true,
        });
      } catch (error) {
        if (cancelled) return;

        setStep(2);

        setError(
          error.message ||
          'The verification code is invalid or expired.'
        );
      } finally {
        if (!cancelled) {
          setIsSubmitting(false);
        }
      }
    };

    verifyLinkCode();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate]);
  useEffect(() => {
    if (step !== 2 || countdown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdown((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, countdown]);

  const handleSendCode = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (origin === 'trainer') {
      setEmail(cleanEmail);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setStep(2);
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await requestStudentPasswordReset(cleanEmail);

      setEmail(cleanEmail);
      setCountdown(RESEND_COOLDOWN_SECONDS);

      if (data.debug_code) {
        console.log('Reset code:', data.debug_code);
      }

      setStep(2);
    } catch (error) {
      setError(
        error.message ||
        'Unable to send the reset code. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSubmitting) return;

    setError('');

    if (origin === 'trainer') {
      setCountdown(RESEND_COOLDOWN_SECONDS);
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await requestStudentPasswordReset(email);

      if (data.debug_code) {
        console.log('Reset code:', data.debug_code);
      }

      setCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setError(
        error.message ||
        'Unable to resend the code. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    const cleanCode = code.trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (origin === 'trainer') {
      if (cleanCode !== DUMMY_CODE) {
        setError('Incorrect verification code.');
        return;
      }

      setStep(3);
      return;
    }

    try {
      setIsSubmitting(true);

      await verifyStudentPasswordResetCode(
        email,
        cleanCode
      );

      setStep(3);
    } catch (error) {
      setError(
        error.message ||
        'The verification code is invalid or expired.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    if (newPassword.length < 8) {
      setError(
        'Password must contain at least 8 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (origin === 'trainer') {
      setStep(4);
      return;
    }

    try {
      setIsSubmitting(true);

      await resetStudentPassword({
        email,
        code: code.trim(),
        password: newPassword,
        passwordConfirmation: confirmPassword,
      });

      localStorage.removeItem('student_token');
      sessionStorage.removeItem('student_token');

      setStep(4);
    } catch (error) {
      setError(
        error.message ||
        'Unable to update your password. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordScore = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword),
    /\d/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ].filter(Boolean).length;

  return (
    <main className="fp-page">
      <section className="fp-visual">
        <img
          src={roleContent.image}
          alt={roleContent.imageAlt}
        />

        <div className="fp-visual-overlay" />

        <button
          className="fp-brand"
          type="button"
          onClick={() => navigate('/')}
        >
          <CompassWordmark
            size={30}
            navy="#ffffff"
            academyColor="#12a7df"
          />
        </button>

        {step === 1 && (
          <span className="fp-platform-badge">
            <i />
            {roleContent.badgeLabel}
          </span>
        )}

        <div className="fp-visual-copy">
          <h1>
            {visualContent.title.split('\n').map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>

          <p>{visualContent.text}</p>

          {visualContent.points.length > 0 && (
            <div className="fp-visual-points">
              {visualContent.points.map((point) => (
                <span key={point}>
                  <i />
                  {point}
                </span>
              ))}
            </div>
          )}
        </div>

        <small>
          © {new Date().getFullYear()} Compass Academy · Independent
          learning platform
        </small>
      </section>

      <section className="fp-panel">
        <div className="fp-top-action">
          <span>
            {step === 1
              ? 'Remembered your password?'
              : 'Need help?'}
          </span>

          <button
            type="button"
            onClick={() => navigate(loginPath)}
          >
            {step === 1 ? 'Sign in' : 'Support'}
          </button>
        </div>

        <div className={`fp-content fp-step-${step}`}>
          {step === 1 && (
            <>
              <button
                className="fp-back-link"
                type="button"
                onClick={() => navigate(loginPath)}
              >
                <b>‹</b> Back to sign in
              </button>

              <div className="fp-icon">
                <LockIcon />
              </div>

              <h2>Forgot your password?</h2>

              <p className="fp-intro">
                No problem. Enter the email connected to your
                account and we'll send you a verification code.
              </p>

              <form
                className="fp-form"
                onSubmit={handleSendCode}
              >
                <label htmlFor="fp-email">
                  Email address
                </label>

                <div className="fp-input">
                  <MailIcon />

                  <input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);

                      if (error) {
                        setError('');
                      }
                    }}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {error && (
                  <div className="fp-error">
                    {error}
                  </div>
                )}

                <button
                  className="fp-primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Sending…'
                    : 'Send reset code'}{' '}
                  <b>›</b>
                </button>
              </form>

              <div className="fp-info">
                <i>i</i>

                <div>
                  <strong>What happens next?</strong>

                  <span>
                    We'll email a 6-digit verification code.
                  </span>

                  <span>
                    For security, the code expires after 15 minutes.
                  </span>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="fp-icon fp-mail-success">
                <MailIcon />

                <i>
                  <CheckIcon />
                </i>
              </div>

              <h2>Enter verification code</h2>

              <p className="fp-intro fp-email-sent">
                We sent a 6-digit code to
                <br />
                <strong>{email}</strong>
              </p>

              <form
                className="fp-form"
                onSubmit={handleVerifyCode}
              >
                <label htmlFor="fp-code">
                  Verification code
                </label>

                <div className="fp-input">
                  <LockIcon />

                  <input
                    id="fp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="------"
                    value={code}
                    onChange={(event) => {
                      const value = event.target.value.replace(
                        /\D/g,
                        ''
                      );

                      setCode(value);

                      if (error) {
                        setError('');
                      }
                    }}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {error && (
                  <div className="fp-error">
                    {error}
                  </div>
                )}

                <button
                  className="fp-primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Verifying…'
                    : 'Verify code'}{' '}
                  <b>›</b>
                </button>
              </form>

              <div className="fp-resend">
                <span>Didn't receive the code?</span>

                <button
                  type="button"
                  disabled={
                    countdown > 0 || isSubmitting
                  }
                  onClick={handleResend}
                >
                  {countdown > 0
                    ? `Resend code in 00:${String(
                      countdown
                    ).padStart(2, '0')}`
                    : 'Resend code'}
                </button>
              </div>

              <button
                className="fp-bottom-link"
                type="button"
                onClick={() => navigate(loginPath)}
              >
                ← Back to sign in
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="fp-icon">
                <LockIcon />
              </div>

              <h2>Create a new password</h2>

              <p className="fp-intro">
                Choose a password you haven't used before.
              </p>

              <form
                className="fp-form fp-password-form"
                onSubmit={handleResetPassword}
              >
                <label htmlFor="new-password">
                  New password
                </label>

                <div className="fp-input">
                  <LockIcon />

                  <input
                    id="new-password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);

                      if (error) {
                        setError('');
                      }
                    }}
                    disabled={isSubmitting}
                    required
                  />

                  <button
                    type="button"
                    className="fp-eye"
                    onClick={() =>
                      setShowPassword(
                        (visible) => !visible
                      )
                    }
                    disabled={isSubmitting}
                  >
                    ◉
                  </button>
                </div>

                <div className="fp-strength">
                  <i
                    style={{
                      width: `${passwordScore * 25}%`,
                    }}
                  />
                </div>

                <small>
                  {passwordScore >= 3
                    ? 'Strong password'
                    : 'Use a stronger password'}
                </small>

                <label htmlFor="confirm-password">
                  Confirm new password
                </label>

                <div className="fp-input">
                  <LockIcon />

                  <input
                    id="confirm-password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(
                        event.target.value
                      );

                      if (error) {
                        setError('');
                      }
                    }}
                    disabled={isSubmitting}
                    required
                  />

                  {confirmPassword &&
                    newPassword === confirmPassword && (
                      <i className="fp-match">
                        <CheckIcon />
                      </i>
                    )}
                </div>

                <div className="fp-requirements">
                  <strong>
                    Password requirements
                  </strong>

                  <div>
                    <span
                      className={
                        newPassword.length >= 8
                          ? 'valid'
                          : ''
                      }
                    >
                      At least 8 characters
                    </span>

                    <span
                      className={
                        /[A-Z]/.test(newPassword) &&
                          /[a-z]/.test(newPassword)
                          ? 'valid'
                          : ''
                      }
                    >
                      Upper and lowercase letters
                    </span>

                    <span
                      className={
                        /\d/.test(newPassword)
                          ? 'valid'
                          : ''
                      }
                    >
                      At least one number
                    </span>

                    <span
                      className={
                        /[^A-Za-z0-9]/.test(newPassword)
                          ? 'valid'
                          : ''
                      }
                    >
                      One symbol recommended
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="fp-error">
                    {error}
                  </div>
                )}

                <button
                  className="fp-primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Updating…'
                    : 'Update password'}{' '}
                  <b>›</b>
                </button>

                <button
                  className="fp-cancel"
                  type="button"
                  onClick={() => navigate(loginPath)}
                  disabled={isSubmitting}
                >
                  Cancel and return to sign in
                </button>
              </form>
            </>
          )}

          {step === 4 && (
            <>
              <div className="fp-success-icon">
                <CheckIcon />
              </div>

              <h2>Password updated</h2>

              <p className="fp-intro fp-centered">
                Your new password has been saved successfully.
                <br />
                You can now sign in securely to Compass Academy.
              </p>

              <button
                className="fp-primary"
                type="button"
                onClick={() =>
                  navigate(loginPath, {
                    replace: true,
                  })
                }
              >
                Return to sign in <b>›</b>
              </button>

              <div className="fp-info">
                <i>
                  <CheckIcon />
                </i>

                <div>
                  <strong>
                    Account security updated
                  </strong>

                  <span>
                    All previous codes are now invalid.
                  </span>

                  <span>
                    Sign in using your new password.
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="fp-secure">
            <i />
            {step === 4
              ? 'Password changed securely'
              : 'Secure recovery · Your account data remains protected'}
          </div>

          <div className="fp-legal">
            Privacy Policy · Terms of Use · Help Center
          </div>
        </div>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;