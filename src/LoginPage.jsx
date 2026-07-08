import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from './assets/logo.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // عند الضغط على تسجيل الدخول، ينقله مباشرة للوحة التحكم
    navigate('/student-dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img
          src={logo}
          alt="Compass Logo"
          className="logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />

        <form onSubmit={handleLogin} className="login-form">
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
              onClick={() => navigate('/forgot-password')}
              style={{ cursor: 'pointer' }}
            >
              Forgot password?
            </span>
          </div>

          <button type="submit" className="btn-login">
            Sign in
          </button>
        </form>

        <div className="divider">OR JOIN WITH</div>

        <button
          type="button"
          className="btn-google"
          onClick={() => {
            /* لاحقًا: تفعيل تسجيل الدخول بجوجل */
          }}
        >
          Follow from Google
        </button>

        <p className="signup-link">
          Don't have an account?{' '}
          <a onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>
            Create a new account
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

