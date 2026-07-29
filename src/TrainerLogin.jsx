import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TrainerLogin.css';
import CompassWordmark from './CompassWordmark';

const TrainerLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (onLogin) onLogin(email);
    navigate('/trainer-dashboard');
  };

  return (
    <div className="trainer-login-page">
      {/* ==== خلفية متحركة: حلقة بوصلة + رادار + نقاط عائمة (نفس هوية صفحة تسجيل دخول الطالب) ==== */}
      <div className="trainer-bg" aria-hidden="true">
        <div className="trainer-bg-radar"></div>

        <svg className="trainer-bg-ring trainer-bg-ring-1" viewBox="0 0 200 200">
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

        <svg className="trainer-bg-ring trainer-bg-ring-2" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 8" />
        </svg>

        <span className="trainer-bg-dot dot-1"></span>
        <span className="trainer-bg-dot dot-2"></span>
        <span className="trainer-bg-dot dot-3"></span>
        <span className="trainer-bg-dot dot-4"></span>
        <span className="trainer-bg-dot dot-5"></span>
      </div>

      {/* ==== كارد تسجيل دخول المدرب ==== */}
      <div className="trainer-login-card">
        <div className="trainer-card-accent"></div>

        <div
          className="trainer-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <CompassWordmark size={26} navy="#000a33" gold="#cca43b" spin />
        </div>

        <span className="trainer-badge">TRAINER PORTAL</span>

        <p className="trainer-subtitle">
          تابعي تقدّم طلابك وأدارة برامجك التدريبية بكل سهولة من مكان واحد
        </p>

        <form onSubmit={handleLogin} className="trainer-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6.5C3 5.67 3.67 5 4.5 5h15c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="m4 6.5 8 6.5 8-6.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="10.5"
                    width="16"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
            </div>
            <span
              className="forgot-password"
              onClick={() => navigate('/forgot-password', { state: { from: 'trainer' } })}
              style={{ cursor: 'pointer' }}
            >
              Forgot password?
            </span>
          </div>

          <button type="submit" className="btn-trainer-login">
            Sign in
          </button>
        </form>

        <div className="divider">OR CONTINUE WITH</div>

        <button
          type="button"
          className="btn-google"
          onClick={() => {
            /* لاحقًا: تفعيل تسجيل الدخول بجوجل */
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.08 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.11C3.24 21.3 7.28 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.77c1.77 0 3.35.6 4.6 1.8l3.45-3.45C17.95 1.19 15.23 0 12 0 7.28 0 3.24 2.7 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="trainer-footer-text">
          Don't have an account?{' '}
          <a onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>
            Create a new account
          </a>
        </p>
      </div>
    </div>
  );
};

export default TrainerLogin;
