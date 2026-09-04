import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  updateStudentProfile,
  uploadStudentAvatar,
} from './api/studentProfile';
import {
  FiBell,
  FiCamera,
  FiCheck,
  FiGithub,
  FiInfo,
  FiLink,
  FiMail,
  FiPlus,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import './EditProfile.css';

/* ============================================
   CONSTANTS
   ============================================ */

const MAX_AVATAR_SIZE = 1.5 * 1024 * 1024; // 1.5 MB

/**
 * Common skills shown as one-click chips under the skill input.
 * Feel free to extend this list — it's just plain strings, no wiring
 * needed elsewhere. Chips already added to the student's profile are
 * hidden automatically (see `availableSuggestions` below).
 */
const SUGGESTED_SKILLS = [
  'React',
  'JavaScript',
  'HTML & CSS',
  'Python',
  'UI/UX Design',
  'Figma',
  'Node.js',
  'SQL',
  'Git & GitHub',
  'Data Structures',
  'Project Management',
  'Problem Solving',
  'Public Speaking',
  'Team Leadership',
];

/* ============================================
   HELPERS
   ============================================ */

/** Splits a student's full/display name into first + last name for the form fields. */
const splitName = (student) => {
  const name = (student?.fullName || student?.displayName || '').trim();
  const [firstName = '', ...rest] = name.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
};

/** Case-insensitive check for whether a skill is already in a list. */
const hasSkill = (list, skill) =>
  list.some((item) => item.toLowerCase() === skill.toLowerCase());

function EditProfile({ student = {}, onSave }) {
  const navigate = useNavigate();
  const initialName = useMemo(() => splitName(student), [student]);

 /* ---------- Avatar ---------- */
const [avatar, setAvatar] = useState(student.avatar || '');
const [avatarFile, setAvatarFile] = useState(null);
const [error, setError] = useState('');
const [isSaving, setIsSaving] = useState(false);

/* ---------- Skills ---------- */
  /* ---------- Skills ---------- */
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(Array.isArray(student.skills) ? student.skills : []);

  /* ---------- Form fields ---------- */
  const [form, setForm] = useState({
    ...initialName,
    phone: student.phone || '',
    email: student.email || '',
    specialty: student.program || student.major || '',
    overview: student.overview || '',
    github: student.connections?.github || '',
    linkedin: student.connections?.linkedin || '',
    gmail: student.connections?.gmail || student.email || '',
  });

  /** Suggested chips that aren't already on the student's skill list. */
  const availableSuggestions = useMemo(
    () => SUGGESTED_SKILLS.filter((skill) => !hasSkill(skills, skill)),
    [skills],
  );

  /* ============================================
     HANDLERS
     ============================================ */

  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const changeAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError('The image must be smaller than 1.5 MB.');
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setAvatar(String(reader.result));
      setError('');
    };

    reader.readAsDataURL(file);
  };

  /**
   * Adds a skill to the list. Used both by the free-text input (Enter /
   * "+" button) and by clicking a suggested chip — `skillText` lets a
   * chip pass its own label directly instead of relying on the input.
   */
  const addSkill = (skillText = skillInput) => {
    const skill = skillText.trim();
    if (skill && !hasSkill(skills, skill)) {
      setSkills((current) => [...current, skill]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setSkills((current) => current.filter((item) => item !== skill));
  };

  const backToProfile = () =>
    navigate('/student-dashboard', { state: { activeTab: 'Profile' } });

  const save = async (event) => {
    event.preventDefault();

    if (isSaving) return;

    const fullName = `${form.firstName} ${form.lastName}`.trim();

    try {
      setIsSaving(true);
      setError('');

      const data = await updateStudentProfile({
        name: fullName,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        professional_summary: form.overview.trim() || null,
        github_url: form.github.trim() || null,
        linkedin_url: form.linkedin.trim() || null,
        education: {
          major: form.specialty.trim() || null,
        },
        skills,
      });

      const profile = data.profile;
      const education = profile.education;

      let savedAvatar = profile.avatar || student.avatar || '';

      if (avatarFile) {
        const avatarData = await uploadStudentAvatar(avatarFile);
        savedAvatar = avatarData.avatar;
      }

      onSave?.({
        ...student,
        fullName: profile.name,
        displayName: profile.name,
        phone: profile.phone || '',
        email: profile.email,
        gender: profile.gender || student.gender || '',
        dob: profile.date_of_birth || student.dob || '',
        nationality: profile.nationality || student.nationality || '',
        major: education?.major || '',
        program: education?.major || '',
        university: education?.university || student.university || '',
        college: education?.faculty || student.college || '',
        graduation:
          education?.expected_graduation_date ||
          student.graduation ||
          '',
        overview: profile.professional_summary || '',
        avatar: savedAvatar,
        skills: profile.skills?.map((skill) => skill.name) || [],
        connections: {
          ...student.connections,
          github: profile.github_url || '',
          linkedin: profile.linkedin_url || '',
          gmail: profile.email,
        },
      });

      backToProfile();
    } catch (error) {
      setError(
        error.message ||
        'Unable to update your profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ============================================
     RENDER
     ============================================ */

  return (
    <div className="compass-edit-layout" dir="ltr">
      <Sidebar
        activeTab="Profile"
        studentData={{ ...student, avatar }}
        onSelect={(activeTab) => navigate('/student-dashboard', { state: { activeTab } })}
        onLogout={() => navigate('/login')}
      />

      <main className="cep-main">
        {/* ---------- Top bar ---------- */}
        <header className="cep-topbar">
          <div className="cep-search">
            <FiSearch />
            <span>Search research, courses, or events...</span>
          </div>
          <FiBell />
          <FiMail />
          <strong>{form.firstName || 'Student'}</strong>
          <img src={avatar} alt="" />
        </header>

        <div className="cep-page">
          {/* ---------- Avatar + name hero ---------- */}
          <section className="cep-hero">
            <div className="cep-avatar">
              <img src={avatar} alt={student.displayName || 'Student'} />
              <label htmlFor="cep-photo">
                <FiCamera />
              </label>
              <input id="cep-photo" type="file" accept="image/*" onChange={changeAvatar} />
            </div>
            <div>
              <h1>{`${form.firstName} ${form.lastName}`.trim() || 'Student'}</h1>
              <p>{form.specialty || 'Student'}</p>
            </div>
            <span className="cep-status">Active ✓</span>
          </section>

          {error && <p className="cep-error">{error}</p>}

          <form className="cep-form-card" onSubmit={save}>
            {/* ---------- Personal information ---------- */}
            <header className="cep-form-heading">
              <div>
                <h2>Personal Information</h2>
                <p>Update your personal and professional profile details.</p>
              </div>
              <FiInfo />
            </header>

            <EditField label="First name" value={form.firstName} onChange={change('firstName')} required />
            <EditField label="Last name" value={form.lastName} onChange={change('lastName')} required />
            <EditField label="Phone" value={form.phone} onChange={change('phone')} />
            <EditField label="Email" type="email" value={form.email} onChange={change('email')} required />
            <EditField label="Specialty" value={form.specialty} onChange={change('specialty')} />

            <label className="cep-field">
              Overview
              <textarea rows="5" maxLength="300" value={form.overview} onChange={change('overview')} />
              <small>{form.overview.length} / 300</small>
            </label>

            {/* ---------- Connect (social links) ---------- */}
            <section className="cep-subcard">
              <h3>Connect</h3>
              <LinkField icon={<FiGithub />} label="GitHub" value={form.github} onChange={change('github')} />
              <LinkField icon={<FiLink />} label="LinkedIn" value={form.linkedin} onChange={change('linkedin')} />
              <LinkField icon={<FiMail />} label="Gmail" value={form.gmail} onChange={change('gmail')} type="email" />
            </section>

            {/* ---------- Skills ---------- */}
            <section className="cep-subcard">
              <h3>Skills</h3>

              {/* Free-text entry: type anything and press Enter or the + button */}
              <div className="cep-skill-input">
                <input
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add a skill"
                />
                <button type="button" onClick={() => addSkill()} aria-label="Add skill">
                  <FiPlus />
                </button>
              </div>

              {/* One-click suggestions — clicking adds the skill immediately,
                  and the chip disappears from this list since it's now
                  filtered out by `availableSuggestions`. */}
              {availableSuggestions.length > 0 && (
                <div className="cep-suggested-skills">
                  <small>Suggested</small>
                  <div className="cep-suggested-skills-list">
                    {availableSuggestions.map((skill) => (
                      <button
                        type="button"
                        key={skill}
                        className="cep-suggested-skill"
                        onClick={() => addSkill(skill)}
                      >
                        <FiPlus /> {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills already added to the profile — click to remove */}
              {skills.length > 0 && (
                <div className="cep-tags">
                  {skills.map((skill) => (
                    <button type="button" key={skill} onClick={() => removeSkill(skill)}>
                      {skill} <FiX />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <footer className="cep-actions">
              <button type="button" onClick={backToProfile}>
                Cancel
              </button>
              <button type="submit" disabled={isSaving}>
                <FiCheck />
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </footer>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ============================================
   SMALL FIELD COMPONENTS
   ============================================ */

function EditField({ label, type = 'text', ...props }) {
  return (
    <label className="cep-field">
      {label}
      <input type={type} {...props} />
    </label>
  );
}

function LinkField({ icon, label, type = 'text', ...props }) {
  return (
    <label className="cep-link-field">
      <span>
        {icon}
        <strong>{label}</strong>
      </span>
      <input type={type} {...props} />
    </label>
  );
}

export default EditProfile;
