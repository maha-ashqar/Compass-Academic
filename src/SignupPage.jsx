import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';
import CompassWordmark from './CompassWordmark';

function SignupPage({ onSignup }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('من فضلك عبّي كل الحقول');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 أحرف');
      return;
    }

    if (onSignup) onSignup(email);
    navigate('/student-dashboard');
  };

  return (
    <div className="signup-page">
      <div className="signup-bg" aria-hidden="true">
        <div className="signup-bg-radar"></div>

        <svg className="signup-bg-ring signup-bg-ring-1" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="10"
              x2="100"
              y2="22"
              stroke="currentColor"
              strokeWidth="2"
              transform={`rotate(${i * 30} 100 100)`}
            />
          ))}
        </svg>

        <svg className="signup-bg-ring signup-bg-ring-2" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 8" />
        </svg>

        <span className="signup-bg-dot dot-1"></span>
        <span className="signup-bg-dot dot-2"></span>
        <span className="signup-bg-dot dot-3"></span>
        <span className="signup-bg-dot dot-4"></span>
        <span className="signup-bg-dot dot-5"></span>
      </div>

      <div className="signup-card">
        <div className="signup-card-accent"></div>

        <div
          className="signup-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <CompassWordmark size={26} navy="#000a33" gold="#cca43b" />
        </div>

        <h1 className="signup-title">Create Your Account</h1>

        <form onSubmit={handleSignup} className="signup-form">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="اسمك الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword.length > 0 && (
              <span
                className={`match-hint ${
                  password === confirmPassword ? 'match-ok' : 'match-bad'
                }`}
              >
                {password === confirmPassword
                  ? '✓ Passwords match'
                  : '✕ Passwords do not match'}
              </span>
            )}
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-signup">
            Create Account
          </button>
        </form>

        <p className="login-link">
          Already have an account?{' '}
          <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;