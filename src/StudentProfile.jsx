import { useNavigate } from 'react-router-dom';
import {
  FiBookOpen,
  FiCalendar,
  FiEdit2,
  FiHome,
  FiMail,
  FiPhone,
  FiUser,
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import './StudentProfile.css';

const valueOrDash = (value) =>
  value && String(value).trim() ? value : '—';

function StudentProfile({ student = {} }) {
  const navigate = useNavigate();

  return (
    <div className="compass-profile-view" dir="ltr">
      <section className="cpv-hero">
        <div className="cpv-hero-person">
          <img
            src={student.avatar}
            alt={student.displayName || 'Student'}
          />
          <div>
            <h1>{valueOrDash(student.fullName || student.displayName)}</h1>
            <p>{valueOrDash(student.program || student.major)}</p>
          </div>
        </div>

        <span className="cpv-status">Active ✓</span>

        <button
          type="button"
          className="cpv-edit-button"
          onClick={() => navigate('/edit-profile')}
        >
          Edit profile <FiEdit2 />
        </button>
      </section>

      <div className="cpv-details-grid">
        <section className="cpv-card cpv-personal-card">
          <header>
            <h2>Personal Information</h2>
            <FiUser />
          </header>

          <div className="cpv-personal-grid">
            <Info label="Gender" value={student.gender} />
            <Info label="Full name" value={student.fullName || student.displayName} />
            <Info label="Date of birth" value={student.dob} />
            <Info label="Nationality" value={student.nationality} />
            <Info label="Phone" value={student.phone} />
            <Info label="Email" value={student.email} />
          </div>

          {student.overview && (
            <div className="cpv-overview">
              <span>Overview</span>
              <p>{student.overview}</p>
            </div>
          )}
        </section>

        <section className="cpv-card cpv-academic-card">
          <header>
            <h2>Academic Information</h2>
            <HiOutlineAcademicCap />
          </header>

          <AcademicRow
            icon={<FiUser />}
            label="Academic advisor"
            value={student.advisor?.name}
            detail={student.advisor?.dept}
            tone="blue"
          />
          <AcademicRow
            icon={<FiHome />}
            label="University & college"
            value={student.university || 'Al-Azhar University – Gaza'}
            detail={student.college}
            tone="orange"
          />
          <AcademicRow
            icon={<FiBookOpen />}
            label="Program"
            value={student.program || student.major}
            tone="cyan"
          />
          <AcademicRow
            icon={<FiCalendar />}
            label="Expected graduation"
            value={student.graduation}
            tone="green"
          />
        </section>
      </div>

      <section className="cpv-contact-card">
        <div><FiMail /><span>{valueOrDash(student.email)}</span></div>
        <div><FiPhone /><span>{valueOrDash(student.phone)}</span></div>
        <button type="button" onClick={() => navigate('/edit-profile')}>
          Manage profile
        </button>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="cpv-info">
      <span>{label}</span>
      <strong>{valueOrDash(value)}</strong>
    </div>
  );
}

function AcademicRow({ icon, label, value, detail, tone }) {
  return (
    <div className="cpv-academic-row">
      <span className={`cpv-academic-icon ${tone}`}>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{valueOrDash(value)}</strong>
        {detail && <p>{detail}</p>}
      </div>
    </div>
  );
}

export default StudentProfile;
