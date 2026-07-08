import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    // عند نجاح إنشاء الحساب (تطابق كلمتي المرور)، ينقل المستخدم إلى تسجيل الدخول
    navigate('/login');
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h1 className="signup-title">Create a new account</h1>

        <form onSubmit={handleSignup} className="signup-form">
          <div className="input-group">
            <label htmlFor="fullName">full name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">e-mail</label>
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
            <label htmlFor="password">password</label>
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
            <label htmlFor="confirmPassword">confirm password</label>
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
            Create an account
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
