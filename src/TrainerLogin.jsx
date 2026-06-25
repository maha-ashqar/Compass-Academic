import './TrainerLogin.css';
import logo from './assets/logo.jpeg'; 
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";

const TrainerLogin = () => {
  return (
    <div className="login-container">
      {/* القسم الأيسر: النموذج */}
      <div className="form-section">
        <div className="form-content">
          <img src={logo} alt="Compass Logo" className="logo-img" />
          <h2 className="title">Trainer Portal</h2>
          <p className="subtitle">Manage training and track student progress easily and conveniently from one place</p>
          
          <form>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input type="email" placeholder="name@company.com" />
                <HiOutlineMail className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input type="password" placeholder="••••••••" />
                <HiOutlineLockClosed className="input-icon" />
              </div>
            </div>

            <div className="forgot-password"><a href="#">Forgot password?</a></div>
            <button type="submit" className="login-btn">Log in</button>
          </form>

          <div className="divider"><span>OR JOIN WITH</span></div>
          <button className="google-btn">Follow from Google</button>
          <p className="footer-text">Don't have an account? <a href="#">Create a new account</a></p>
        </div>
      </div>

      {/* القسم الأيمن: الصورة */}
      <div className="image-section">
         <div className="overlay-text">
            <h2>Trainer Portal</h2>
            <p>Manage training and track student progress easily and conveniently from one place</p>
         </div>
      </div>
    </div>
  );
};

export default TrainerLogin;