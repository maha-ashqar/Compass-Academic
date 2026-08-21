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

const TrainerLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Please enter your work email and password.');
      return;
    }
    setError('');
    const result = await onLogin?.(normalizedEmail, password, { rememberMe });
    if (result === false) {
      setError('The email or password is incorrect.');
      return;
    }
    if (rememberMe) localStorage.setItem('compass_trainer_remember_email', normalizedEmail);
    else localStorage.removeItem('compass_trainer_remember_email');
    navigate('/trainer-dashboard', { replace: true });
  };

  return (
    <main className="trainer-auth-shell">
      <section className="trainer-auth-story" style={{ '--trainer-hero': `url(${trainerHero})` }} aria-label="Compass Academy trainer portal">
        <button type="button" className="trainer-auth-brand" onClick={() => navigate('/')} aria-label="Return to home page">
          <CompassWordmark size={28} navy="#ffffff" gold="#37c5f3" />
        </button>
        <div className="trainer-auth-portal-badge"><span /> TRAINER PORTAL</div>
        <div className="trainer-auth-story-copy">
          <h1>Guide learning.<br />Build meaningful impact.</h1>
          <p>Manage courses, review student work, and provide the guidance that turns learning into progress.</p>
          <div className="trainer-auth-benefits">
            <span><i /> Course management</span><span><i /> Student feedback</span><span><i /> Project reviews</span>
          </div>
        </div>
        <small>© 2026 Compass Academy · Independent learning platform</small>
      </section>

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
              <input id="trainer-email" type="email" autoComplete="email" placeholder="trainer@compass.edu" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="trainer-auth-password-label">
              <label htmlFor="trainer-password">Password</label>
              <button type="button" onClick={() => navigate('/forgot-password', { state: { from: 'trainer' } })}>Forgot password?</button>
            </div>
            <div className="trainer-auth-input">
              <FiLock />
              <input id="trainer-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" className="trainer-auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <label className="trainer-auth-remember">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>{rememberMe && <FiCheck />}</span>Remember me on this device
            </label>
            {error && <p className="trainer-auth-error" role="alert">{error}</p>}
            <button type="submit" className="trainer-auth-submit">Continue to trainer dashboard <FiArrowRight /></button>
          </form>

          <div className="trainer-auth-divider"><span>OR SIGN IN WITH</span></div>
          <button type="button" className="trainer-auth-google" onClick={() => setError('Google sign-in requires connecting a Google authentication provider.')}><GoogleIcon /> Continue with Google</button>
          <div className="trainer-auth-apply">
            <div><strong>Interested in teaching with us?</strong><span>Submit your trainer profile for review.</span></div>
            <button type="button" onClick={() => navigate('/signup?role=trainer')}>Apply now <FiArrowRight /></button>
          </div>
          <div className="trainer-auth-secure"><span /> Secure trainer access · Protected workspace</div>
          <nav className="trainer-auth-legal" aria-label="Legal links"><button type="button">Privacy Policy</button><span>·</span><button type="button">Terms of Use</button><span>·</span><button type="button">Help Center</button></nav>
        </div>
      </section>
    </main>
  );
};

export default TrainerLogin;