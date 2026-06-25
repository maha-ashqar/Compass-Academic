import './LoginPage.css';
import logo from './assets/logo.jpeg'; 

function LoginPage() {
  return (
    <div className="login-container">
      <div className="form-side">
        <img src={logo} alt="Compass Logo" className="logo" />
        
        <div className="input-group">
          <label>Email Address</label>
          <input type="email" placeholder="name@company.com" />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" />
          <a href="#" className="forgot-password">Forgot password?</a>
        </div>
        
        <button className="btn-login">Sign in</button>

        <div className="divider">OR CONTINUE WITH</div>
        
        <button className="btn-google">Follow from Google</button>
        
        <p className="signup-link">
          Don't have an account? <a href="#">Create a new account</a>
        </p>
      </div>
      
      {/* هذا هو الجانب الذي يحمل الصورة */}
      <div className="image-side"></div>
    </div>
  );
}

export default LoginPage;