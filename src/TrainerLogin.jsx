import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import './TrainerLogin.css';
import logo from './assets/logo.png';

const TrainerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/trainer-dashboard');
  };

  return (
    <div className="trainer-login-page">
      <div className="trainer-login-card">
        <img
          src={logo}
          alt="Compass Logo"
          className="logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />

        <p className="subtitle">
          Manage training and track student progress easily and
          conveniently from one place
        </p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <HiOutlineMail className="input-icon" />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <HiOutlineLockClosed className="input-icon" />
            </div>
          </div>

          <div className="forgot-password">
            <a href="#">Forgot password?</a>
          </div>

          <button type="submit" className="login-btn">
            Sign in
          </button>
        </form>

        <div className="divider">OR JOIN WITH</div>

        <button type="button" className="google-btn">
          Follow from Google
        </button>

        <p className="footer-text">
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
