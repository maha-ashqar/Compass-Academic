import './StudentProfile.css';
import { FiUser, FiBookOpen, FiEdit2, FiCalendar, FiGithub, FiMail } from 'react-icons/fi';
import { FaLinkedin } from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom'

const StudentProfile = ({ student }) => {
    const navigate = useNavigate();
  return (
    <div className="profile-tab-container">

      <div className="profile-hero-card">
      
        <div className="hero-left">
          <img src={student.avatar} alt="Student Profile" className="hero-avatar" />
          <div className="hero-info">
            <div className="name-status-row">
              <h2>{student.displayName}</h2>
              <span className="status-badge">{student.status} ✓</span>
            </div>
            <p className="hero-subtext">{student.major}</p>
          </div>
        </div>
     <button
          className="edit-profile-btn"
          onClick={() => navigate('/edit-profile')}
        >
          Edit Profile <FiEdit2 className="btn-icon" />
        </button>
      </div>

      <div className="profile-details-grid">

        <div className="details-card personal-info-card">
          <div className="card-title-header">
            <h3>Personal Information</h3>
            <FiUser className="title-icon" />
          </div>

          <div className="info-data-grid">
            <div className="info-item">
              <label>GENDER</label>
              <p>{student.gender}</p>
            </div>
            <div className="info-item">
              <label>FULL NAME</label>
              <p className="truncated-text">{student.fullName}</p>
            </div>
            <div className="info-item">
              <label>DATE OF BIRTH</label>
              <p>{student.dob}</p>
            </div>
            <div className="info-item">
              <label>NATIONALITY</label>
              <p>{student.nationality}</p>
            </div>
            <div className="info-item">
              <label>PHONE</label>
              <p>{student.phone}</p>
            </div>
            <div className="info-item">
              <label>EMAIL</label>
              <p className="truncated-text">{student.email}</p>
            </div>
          </div>

          {student.overview && (
            <div className="overview-section">
              <label>OVERVIEW</label>
              <p className="overview-text">{student.overview}</p>
            </div>
          )}

          {student.skills && student.skills.length > 0 && (
            <div className="skills-section">
              <label>SKILLS</label>
              <div className="skills-display-tags">
                {student.skills.map((skill) => (
                  <span key={skill} className="skill-display-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {student.connections && (student.connections.github || student.connections.linkedin || student.connections.gmail) && (
            <div className="connections-section">
              <label>CONNECT</label>
              <div className="connections-display-list">
                {student.connections.github && (
                  <a href={student.connections.github} target="_blank" rel="noreferrer" className="connection-display-item">
                    <FiGithub /> GitHub
                  </a>
                )}
                {student.connections.linkedin && (
                  <a href={student.connections.linkedin} target="_blank" rel="noreferrer" className="connection-display-item">
                    <FaLinkedin /> LinkedIn
                  </a>
                )}
                {student.connections.gmail && (
                  <span className="connection-display-item">
                    <FiMail /> {student.connections.gmail}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="details-card academic-info-card">
          <div className="card-title-header">
            <h3>Academic Information</h3>
            <HiOutlineAcademicCap className="title-icon-cap" />
          </div>

          <div className="academic-list">
            <div className="academic-item">
              <div className="academic-icon-wrapper blue-icon-bg">
                <FiUser />
              </div>
              <div className="academic-text">
                <span className="academic-label">Academic Advisor</span>
                <h4>{student.advisor.name}</h4>
                <p className="dept-text">{student.advisor.dept}</p>
              </div>
            </div>

            <div className="academic-item">
              <div className="academic-icon-wrapper orange-icon-bg">
                <FiBookOpen />
              </div>
              <div className="academic-text">
                <span className="academic-label">The College</span>
                <h4>{student.college}</h4>
              </div>
            </div>

            <div className="academic-item">
              <div className="academic-icon-wrapper purple-icon-bg">
                <FiCalendar />
              </div>
              <div className="academic-text">
                <span className="academic-label">Expected Graduation</span>
                <h4>{student.graduation}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;