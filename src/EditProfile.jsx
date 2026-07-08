import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';
import mdiCompass from './assets/mdi-compass.png';
import {
  FiHome, FiUser, FiBookOpen, FiAward, FiFileText,
  FiMessageSquare, FiSettings, FiLogOut, FiSearch,
  FiBell, FiMail, FiInfo, FiGithub, FiX, FiPlus
} from 'react-icons/fi';
import { FaLinkedin } from 'react-icons/fa';

const EditProfile = ({ student, onSave }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: student?.displayName?.split(' ')[0] || '',
    lastName: student?.displayName?.split(' ')[1] || '',
    phone: student?.phone || '',
    email: student?.email || '',
    specialty: student?.major || '',
    overview: student?.overview || '',
  });

  const [skills, setSkills] = useState(student?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState(
    ['React', 'JavaScript', 'Python', 'UI/UX Design', 'Figma',
      'Node.js', 'SQL', 'Project Management', 'Communication', 'Java']
      .filter((s) => !(student?.skills || []).includes(s))
  );

  const [githubLinked, setGithubLinked] = useState(!!student?.connections?.github);
  const [githubUrl, setGithubUrl] = useState(student?.connections?.github || '');
  const [githubEditing, setGithubEditing] = useState(false);
  const [githubInput, setGithubInput] = useState('');

  const [linkedinLinked, setLinkedinLinked] = useState(!!student?.connections?.linkedin);
  const [linkedinUrl, setLinkedinUrl] = useState(student?.connections?.linkedin || '');
  const [linkedinEditing, setLinkedinEditing] = useState(false);
  const [linkedinInput, setLinkedinInput] = useState('');

  const [gmailLinked, setGmailLinked] = useState(!!student?.connections?.gmail);
  const [gmailUrl, setGmailUrl] = useState(student?.connections?.gmail || '');
  const [gmailEditing, setGmailEditing] = useState(false);
  const [gmailInput, setGmailInput] = useState('');

  const menuItems = [
    { id: 'Home', label: 'Home', icon: <FiHome /> },
    { id: 'Profile', label: 'Profile', icon: <FiUser /> },
    { id: 'Courses', label: 'Courses', icon: <FiBookOpen /> },
    { id: 'Competitions', label: 'Competitions', icon: <FiAward /> },
    { id: 'Assignments', label: 'Assignments', icon: <FiFileText /> },
    { id: 'Messages', label: 'Messages', icon: <FiMessageSquare /> },
    { id: 'Settings', label: 'Settings', icon: <FiSettings /> },
  ];

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSuggestedSkills((prev) => prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()));
    }
    setSkillInput('');
  };

  const addSuggestedSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
    setSuggestedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
    setSuggestedSkills((prev) => [...prev, skill]);
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const saveGithub = () => {
    const trimmed = githubInput.trim();
    setGithubUrl(trimmed);
    setGithubLinked(trimmed.length > 0);
    setGithubEditing(false);
  };

  const removeGithub = () => {
    setGithubUrl('');
    setGithubLinked(false);
    setGithubEditing(false);
    setGithubInput('');
  };

  const saveLinkedin = () => {
    const trimmed = linkedinInput.trim();
    setLinkedinUrl(trimmed);
    setLinkedinLinked(trimmed.length > 0);
    setLinkedinEditing(false);
  };

  const removeLinkedin = () => {
    setLinkedinUrl('');
    setLinkedinLinked(false);
    setLinkedinEditing(false);
    setLinkedinInput('');
  };

  const saveGmail = () => {
    const trimmed = gmailInput.trim();
    setGmailUrl(trimmed);
    setGmailLinked(trimmed.length > 0);
    setGmailEditing(false);
  };

  const removeGmail = () => {
    setGmailUrl('');
    setGmailLinked(false);
    setGmailEditing(false);
    setGmailInput('');
  };

  const handleSave = () => {
    const updatedStudent = {
      ...student,
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName: `${formData.firstName} ${formData.lastName}`.trim() || student?.displayName,
      fullName: `${formData.firstName} ${formData.lastName}`.trim() || student?.fullName,
      phone: formData.phone,
      email: formData.email,
      major: formData.specialty || student?.major,
      overview: formData.overview,
      skills,
      connections: {
        github: githubLinked ? githubUrl : '',
        linkedin: linkedinLinked ? linkedinUrl : '',
        gmail: gmailLinked ? gmailUrl : '',
      },
    };

    if (onSave) {
      onSave(updatedStudent);
    }

    navigate('/student-dashboard', { state: { activeTab: 'Profile' } });
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={mdiCompass} alt="Compass Logo" className="brand-logo" />
          <h2>Compaass <span className="brand-highlight">Academic</span></h2>
        </div>

        <div className="sidebar-profile">
          <img src={student?.avatar} alt={student?.displayName} className="profile-img" />
          <h3 className="profile-name">{student?.displayName || 'mohammed ali'}</h3>
          <p className="profile-major">{student?.major || 'MIS — Active Student'}</p>
        </div>

        <nav className="sidebar-menu">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.id}
                className={`menu-item ${item.id === 'Profile' ? 'active' : ''}`}
                onClick={() => navigate('/student-dashboard')}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer" onClick={() => navigate('/login')}>
          <FiLogOut className="menu-icon" />
          <span>Logout</span>
        </div>
      </aside>

      <main className="main-viewport">
        <header className="main-header">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search research, courses, or events..." />
          </div>
          <div className="header-controls">
            <FiBell className="header-icon" />
            <FiMail className="header-icon" />
            <div className="header-user">
              <span className="user-name">{student?.displayName?.split(' ')[0] || 'mohammed'}</span>
              <img src={student?.avatar} alt="User Avatar" className="header-avatar" />
            </div>
          </div>
        </header>

        <section className="edit-profile-content">
          <div className="profile-hero-card">
            <div className="hero-left">
              <img src={student?.avatar} alt="Student" className="hero-avatar" />
              <div className="hero-info">
                <h2>{student?.displayName || 'Mohammed Ali'}</h2>
                <p className="hero-subtext">{student?.major || 'MIS — Active Student'}</p>
              </div>
            </div>
            <span className="status-badge">active ✓</span>
          </div>

          <div className="edit-form-card">
            <div className="form-card-header">
              <h3>Personal Information</h3>
              <FiInfo className="info-icon" />
            </div>

            <div className="form-field">
              <label>First Name</label>
              <input type="text" value={formData.firstName} onChange={handleChange('firstName')} />
            </div>

            <div className="form-field">
              <label>last name</label>
              <input type="text" value={formData.lastName} onChange={handleChange('lastName')} />
            </div>

            <div className="form-field">
              <label>phone</label>
              <input type="text" value={formData.phone} onChange={handleChange('phone')} />
            </div>

            <div className="form-field">
              <label>email</label>
              <input type="email" value={formData.email} onChange={handleChange('email')} />
            </div>

            <div className="form-field">
              <label>specialty</label>
              <input type="text" value={formData.specialty} onChange={handleChange('specialty')} />
            </div>

            <div className="form-field">
              <label>Overview</label>
              <textarea
                rows="4"
                value={formData.overview}
                onChange={handleChange('overview')}
                placeholder="Write a short overview about yourself..."
              />
            </div>

            <div className="sub-card connect-card">
              <h3>Connect</h3>

              <div className="connect-row">
                <div className="connect-item">
                  <div className="connect-icon dark-icon"><FiGithub /></div>
                  <span>GitHub</span>
                  {githubLinked && !githubEditing ? (
                    <a href={githubUrl} target="_blank" rel="noreferrer" className="connected-link">
                      {githubUrl}
                    </a>
                  ) : null}
                </div>

                {githubEditing ? (
                  <div className="link-input-row">
                    <input
                      type="text"
                      className="link-input"
                      placeholder="https://github.com/username"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      autoFocus
                    />
                    <button type="button" className="link-save-btn" onClick={saveGithub}>Save</button>
                  </div>
                ) : (
                  <div className="connect-actions">
                    {githubLinked ? (
                      <>
                        <button type="button" className="link-edit-btn" onClick={() => { setGithubInput(githubUrl); setGithubEditing(true); }}>Edit</button>
                        <button type="button" className="link-remove-btn" onClick={removeGithub}><FiX /></button>
                      </>
                    ) : (
                      <button type="button" className="add-link-btn" onClick={() => setGithubEditing(true)}>
                        <FiPlus /> Add link
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="connect-row">
                <div className="connect-item">
                  <div className="connect-icon blue-icon"><FaLinkedin /></div>
                  <span>LinkedIn</span>
                  {linkedinLinked && !linkedinEditing ? (
                    <a href={linkedinUrl} target="_blank" rel="noreferrer" className="connected-link">
                      {linkedinUrl}
                    </a>
                  ) : null}
                </div>

                {linkedinEditing ? (
                  <div className="link-input-row">
                    <input
                      type="text"
                      className="link-input"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinInput}
                      onChange={(e) => setLinkedinInput(e.target.value)}
                      autoFocus
                    />
                    <button type="button" className="link-save-btn" onClick={saveLinkedin}>Save</button>
                  </div>
                ) : (
                  <div className="connect-actions">
                    {linkedinLinked ? (
                      <>
                        <button type="button" className="link-edit-btn" onClick={() => { setLinkedinInput(linkedinUrl); setLinkedinEditing(true); }}>Edit</button>
                        <button type="button" className="link-remove-btn" onClick={removeLinkedin}><FiX /></button>
                      </>
                    ) : (
                      <button type="button" className="add-link-btn" onClick={() => setLinkedinEditing(true)}>
                        <FiPlus /> Add link
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="connect-row">
                <div className="connect-item">
                  <div className="connect-icon red-icon"><FiMail /></div>
                  <span>Gmail</span>
                  {gmailLinked && !gmailEditing ? (
                    <span className="connected-link">{gmailUrl}</span>
                  ) : null}
                </div>

                {gmailEditing ? (
                  <div className="link-input-row">
                    <input
                      type="email"
                      className="link-input"
                      placeholder="name@gmail.com"
                      value={gmailInput}
                      onChange={(e) => setGmailInput(e.target.value)}
                      autoFocus
                    />
                    <button type="button" className="link-save-btn" onClick={saveGmail}>Save</button>
                  </div>
                ) : (
                  <div className="connect-actions">
                    {gmailLinked ? (
                      <>
                        <button type="button" className="link-edit-btn" onClick={() => { setGmailInput(gmailUrl); setGmailEditing(true); }}>Edit</button>
                        <button type="button" className="link-remove-btn" onClick={removeGmail}><FiX /></button>
                      </>
                    ) : (
                      <button type="button" className="add-link-btn" onClick={() => setGmailEditing(true)}>
                        <FiPlus /> Add link
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="sub-card skills-card">
              <h3>Skills</h3>

              <div className="skills-input-row">
                <input
                  type="text"
                  className="skill-input"
                  placeholder="Add a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
                <button type="button" className="add-skill-btn" onClick={addSkill}>
                  <FiPlus />
                </button>
              </div>

              <div className="skills-tags">
                {skills.map((skill) => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    <FiX className="remove-skill" onClick={() => removeSkill(skill)} />
                  </span>
                ))}
              </div>

              {suggestedSkills.length > 0 && (
                <div className="suggested-skills-section">
                  <p className="suggested-skills-label">Suggested skills</p>
                  <div className="suggested-skills-tags">
                    {suggestedSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className="suggested-skill-tag"
                        onClick={() => addSuggestedSkill(skill)}
                      >
                        <FiPlus className="suggested-skill-icon" />
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={handleSave}>Save changes</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EditProfile;