import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPasswordPage.css';

function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: reset password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  // لاحقًا هيكون فيه كود حقيقي مرسل من الباك اند
  const DUMMY_CODE = '123456';

  const handleSendCode = (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('من فضلك أدخل بريدك الإلكتروني');
      return;
    }

    // لاحقًا: هنا هتبعتي طلب فعلي للباك اند لإرسال كود التحقق
    setSuccess('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    setStep(2);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code) {
      setError('من فضلك أدخل رمز التحقق');
      return;
    }

    // لاحقًا: هنا هتبعتي الكود للباك اند للتحقق منه
    if (code !== DUMMY_CODE) {
      setError('رمز التحقق غير صحيح');
      return;
    }

    setStep(3);
  };

  const handleResendCode = () => {
    setError('');
    setSuccess('تم إعادة إرسال رمز التحقق');
    // لاحقًا: هنا هتبعتي طلب فعلي لإعادة إرسال الكود
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 أحرف');
      return;
    }

    // لاحقًا: هنا هتبعتي طلب فعلي لتحديث كلمة المرور في الباك اند
    navigate('/login');
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        {/* الخطوة 1: إدخال الإيميل */}
        {step === 1 && (
          <>
            <h1 className="fp-title">Forgot Password?</h1>
            <p className="fp-subtitle">
              أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق لاسترجاع حسابك
            </p>

            <form onSubmit={handleSendCode} className="fp-form">
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

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn-fp">
                Send Reset Code
              </button>
            </form>
          </>
        )}

        {/* الخطوة 2: إدخال رمز التحقق */}
        {step === 2 && (
          <>
            <h1 className="fp-title">Enter Verification Code</h1>
            <p className="fp-subtitle">
              {success && <span className="fp-success">{success}</span>}
              <br />
              أدخل رمز التحقق المرسل إلى <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyCode} className="fp-form">
              <div className="input-group">
                <label htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  placeholder="------"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="code-input"
                  required
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn-fp">
                Verify Code
              </button>

              <span className="resend-code" onClick={handleResendCode}>
                لم يصلك الرمز؟ إعادة الإرسال
              </span>
            </form>
          </>
        )}

        {/* الخطوة 3: تعيين كلمة مرور جديدة */}
        {step === 3 && (
          <>
            <h1 className="fp-title">Reset Password</h1>
            <p className="fp-subtitle">
              أدخل كلمة المرور الجديدة الخاصة بحسابك
            </p>

            <form onSubmit={handleResetPassword} className="fp-form">
              <div className="input-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
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
                      newPassword === confirmPassword ? 'match-ok' : 'match-bad'
                    }`}
                  >
                    {newPassword === confirmPassword
                      ? '✓ Passwords match'
                      : '✕ Passwords do not match'}
                  </span>
                )}
              </div>

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn-fp">
                Reset Password
              </button>
            </form>
          </>
        )}

        <p className="back-to-login">
          <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
            ← Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;