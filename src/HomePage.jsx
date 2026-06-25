import './Homepage.css';
import heroImg from './assets/hero.png';
import logoIcon from './assets/logo-icon.png';
import { useNavigate } from 'react-router-dom'; // استيراد أداة التنقل

const Homepage = () => {
  const navigate = useNavigate(); // تعريف دالة التنقل
  return (
    <div className="landing-page">
      {/* شريط التنقل */}
      <nav className="navbar">
        <div className="logo">
          <img src={logoIcon} alt="Compass Logo" className="logo-img" /> Compass Academy</div>
        <ul className="nav-links">
          <li>Home</li>
          <li>Programs</li>
          <li>Learning Paths</li>
          <li>Instructors</li>
          <li>Pricing</li>
        </ul>
        <div className="nav-btns">
          {/* إضافة حدث النقر للتنقل */}
          <span className="login" onClick={() => navigate('/login')} style={{cursor: 'pointer'}}>Login</span>
          <button className="get-started" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      {/* القسم الرئيسي */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge">🚀 Future-Ready Learning Platform</div>
          <h1>Navigate Your Future With <span className="highlight">Skills That Matter</span></h1>
          <p>Master AI, technology, business, and future skills through structured learning paths, practical projects, certifications, and expert mentorship.</p>
          
          <div className="buttons">
            {/* إضافة حدث النقر للتنقل */}
            <button className="btn-primary" onClick={() => navigate('/login')}>Start Learning Free</button>
        
<button 
  className="btn-secondary" 
  onClick={() => navigate('/trainer-login')}
>
  Be a Coach
</button>
          </div>
        </div>
        <div className="hero-image">
          <img src={heroImg} alt="Compass" />
        </div>
      </section>
      {/* قسم الميزات بتنسيق العمودين */}
          <div className="features">
            <div className="features-column">
              <span>✔️ Accredited Certificates</span>
              <span>✔️ Expert instructors</span>
            </div>
            <div className="features-column">
              <span>✔️ AI-powered learning</span>
              <span>✔️ Career-focused curriculum</span>
            </div>
          </div>

      {/* قسم الإحصائيات */}
      <section className="stats-section">
        <div className="stat-card">
          <h3>3350+</h3>
          <p>STUDENTS</p>
          <div className="stat-line"></div>
        </div>
        <div className="stat-card">
          <h3>80+</h3>
          <p>COURSES</p>
          <div className="stat-line"></div>
        </div>
        <div className="stat-card">
          <h3>23+</h3>
          <p>INSTRUCTORS</p>
          <div className="stat-line"></div>
        </div>
        <div className="stat-card">
          <h3>61%</h3>
          <p>COMPLETION RATE</p>
          <div className="stat-line"></div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;