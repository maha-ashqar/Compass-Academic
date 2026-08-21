/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAward, FiBookOpen, FiBriefcase, FiCheckCircle, FiEdit2, FiExternalLink,
  FiFileText, FiGithub, FiLinkedin, FiLock, FiMail, FiMapPin, FiPhone,
  FiPlus, FiSave, FiTrash2, FiUpload, FiUser, FiX,
} from 'react-icons/fi';
import './TrainerProfile.css';

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const maskNationalId = (value = '') => value ? `${'•'.repeat(Math.max(6, String(value).length - 3))}${String(value).slice(-3)}` : 'Not available';
const list = (value, fallback) => Array.isArray(value) && value.length ? value : fallback;
const avatar = (name) => `https://api.dicebear.com/7.x/initials/svg?backgroundColor=deebf1&seed=${encodeURIComponent(name)}`;

const createProfile = (trainer = {}) => ({
  ...trainer,
  fullName: trainer.fullName || String(trainer.displayName || 'Ahmad Khalil').replace(/^Eng\.\s*/, ''),
  email: trainer.email || 'ahmad.khalil@compass.edu', phone: trainer.phone || '+970 59 234 6781', avatar: trainer.avatar || '',
  jobTitle: trainer.jobTitle || trainer.major || 'Senior Software Engineering Lecturer',
  university: trainer.university || 'Al-Azhar University — Gaza', faculty: trainer.faculty || 'Engineering and Information Technology',
  department: trainer.department || 'Software Engineering', office: trainer.office || 'Engineering Building, Room 305',
  officeHours: trainer.officeHours || 'Sun – Thu: 10:00 AM – 2:00 PM', extension: trainer.extension || 'Ext. 2315',
  employmentStatus: trainer.employmentStatus || 'Full-time', yearsOfExperience: trainer.yearsOfExperience || '10+ years',
  employeeId: trainer.employeeId || 'AZU-ENG-1042', nationalId: trainer.nationalId || '408123482',
  academicDegree: trainer.academicDegree || 'Bachelor of Science', degreeSpecialization: trainer.degreeSpecialization || 'Software Engineering',
  graduationYear: trainer.graduationYear || '2016', degreeCertificateNumber: trainer.degreeCertificateNumber || 'AZU-BSC-SE-2016-1042',
  degreeCertificate: trainer.degreeCertificate || { name: 'University_Degree_Certificate.pdf', size: '1.2 MB', verified: true },
  bio: trainer.bio || 'Senior lecturer with extensive experience in software engineering education, curriculum development, and mentoring student projects.',
  github: trainer.github || 'https://github.com/', linkedin: trainer.linkedin || 'https://www.linkedin.com/',
  specializations: list(trainer.specializations, [{ id: 's1', name: 'Software Architecture' }, { id: 's2', name: 'Full-Stack Development' }, { id: 's3', name: 'Cloud Systems' }]),
  experiences: list(trainer.experiences, [
    { id: 'e1', role: 'Senior Software Engineering Lecturer', organization: 'Al-Azhar University — Gaza', from: '2021', to: 'Present', description: 'Teaching software engineering courses, supervising projects, and developing curricula.' },
    { id: 'e2', role: 'Software Architect', organization: 'Compass Technology Lab', from: '2017', to: '2021', description: 'Designed scalable systems and mentored engineering teams.' },
  ]),
  certificates: list(trainer.certificates, [{ id: 'c1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2024', verificationUrl: 'https://aws.amazon.com/verification', verified: true }]),
});

export default function TrainerProfile({ trainerData, onUpdate, editMode = false }) {
  const navigate = useNavigate();
  const profile = useMemo(() => createProfile(trainerData), [trainerData]);
  const [draft, setDraft] = useState(profile);
  const [photo, setPhoto] = useState(profile.avatar);
  const [skill, setSkill] = useState('');
  const [error, setError] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile) || photo !== profile.avatar;

  useEffect(() => {
    if (!editMode || !dirty) return undefined;
    const stop = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', stop);
    return () => window.removeEventListener('beforeunload', stop);
  }, [dirty, editMode]);

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const readPhoto = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return setError('Photo must be JPG, PNG, or WebP and smaller than 5 MB.');
    const reader = new FileReader(); reader.onload = () => { setPhoto(String(reader.result || '')); setError(''); }; reader.readAsDataURL(file);
  };
  const readDegree = (file) => {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 20 * 1024 * 1024) return setError('Certificate must be PDF, JPG, or PNG and smaller than 20 MB.');
    set('degreeCertificate', { name: file.name, size: `${Math.ceil(file.size / 1024)} KB`, verified: false }); setError('');
  };
  const save = () => {
    if (!draft.fullName.trim() || !draft.email.trim() || !draft.jobTitle.trim()) return setError('Full name, email, and job title are required.');
    onUpdate?.({ ...draft, avatar: photo, displayName: `Eng. ${draft.fullName.trim()}`, major: draft.jobTitle, employeeId: profile.employeeId, nationalId: profile.nationalId });
    navigate('/trainer-dashboard/profile');
  };
  const cancel = () => { if (!dirty || window.confirm('Discard unsaved changes?')) navigate('/trainer-dashboard/profile'); };

  if (editMode) return <div className="trainer-profile-page trainer-profile-edit">
    <ProfileHero profile={{ ...draft, avatar: photo }} editing />
    <section className="trainer-editor">
      <header className="trainer-editor-head"><div><span>PROFILE SETTINGS</span><h1>Edit trainer profile</h1><p>Update your personal, professional, and academic information.</p></div><div><button className="tp-secondary" onClick={cancel}>Cancel</button><button className="tp-primary" onClick={save}><FiSave /> Save changes</button></div></header>
      {error && <div className="trainer-profile-error">{error}</div>}
      <FormSection number="1" title="Personal information" subtitle="Public account and contact information.">
        <div className="trainer-photo-edit"><img src={photo || avatar(draft.fullName)} alt="" /><div><label className="tp-secondary"><FiUpload /> Change photo<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => readPhoto(e.target.files?.[0])} /></label><button className="tp-danger-link" onClick={() => setPhoto('')}>Remove photo</button><small>JPG, PNG or WebP · Max 5 MB</small></div></div>
        <div className="trainer-fields"><Field label="Full name" value={draft.fullName} change={(v) => set('fullName', v)} /><Field label="University email" type="email" value={draft.email} change={(v) => set('email', v)} /><Field label="Phone number" value={draft.phone} change={(v) => set('phone', v)} /><Field label="Job title" value={draft.jobTitle} change={(v) => set('jobTitle', v)} /><Field full area label="Professional summary" value={draft.bio} change={(v) => set('bio', v)} /><Field label="GitHub profile" value={draft.github} change={(v) => set('github', v)} /><Field label="LinkedIn profile" value={draft.linkedin} change={(v) => set('linkedin', v)} /></div>
      </FormSection>
      <FormSection number="2" title="Academic information" subtitle="University degree, work location, and protected records.">
        <div className="trainer-fields"><Field label="University" value={draft.university} change={(v) => set('university', v)} /><Field label="Faculty" value={draft.faculty} change={(v) => set('faculty', v)} /><Field label="Department" value={draft.department} change={(v) => set('department', v)} /><Field label="Degree" value={draft.academicDegree} change={(v) => set('academicDegree', v)} /><Field label="Degree specialization" value={draft.degreeSpecialization} change={(v) => set('degreeSpecialization', v)} /><Field type="number" label="Graduation year" value={draft.graduationYear} change={(v) => set('graduationYear', v)} /><Field label="Certificate number" value={draft.degreeCertificateNumber} change={(v) => set('degreeCertificateNumber', v)} /><Field label="Years of experience" value={draft.yearsOfExperience} change={(v) => set('yearsOfExperience', v)} /><Field label="Office" value={draft.office} change={(v) => set('office', v)} /><Field label="Office hours" value={draft.officeHours} change={(v) => set('officeHours', v)} /><Field label="University extension" value={draft.extension} change={(v) => set('extension', v)} /><Field label="Employment status" value={draft.employmentStatus} change={(v) => set('employmentStatus', v)} /></div>
        <div className="trainer-file-row"><FiFileText /><div><b>University degree certificate</b><small>{draft.degreeCertificate?.name || 'No certificate'} · {draft.degreeCertificate?.size || ''}</small></div><label className="tp-secondary"><FiUpload /> Replace<input hidden type="file" accept=".pdf,image/png,image/jpeg" onChange={(e) => readDegree(e.target.files?.[0])} /></label></div>
        <div className="trainer-protected"><FiLock /><div><small>Employee ID</small><b>{profile.employeeId}</b></div><div><small>National ID</small><b>{maskNationalId(profile.nationalId)}</b></div><p>Protected data can only be changed by university administration.</p></div>
      </FormSection>
      <FormSection number="3" title="Specializations & experience" subtitle="Add skills and employment history.">
        <div className="trainer-skill-edit">{draft.specializations.map((item) => <span key={item.id}>{item.name}<button onClick={() => set('specializations', draft.specializations.filter((x) => x.id !== item.id))}><FiX /></button></span>)}<input value={skill} placeholder="Add specialization" onChange={(e) => setSkill(e.target.value)} /><button onClick={() => { if (skill.trim()) { set('specializations', [...draft.specializations, { id: id(), name: skill.trim() }]); setSkill(''); } }}><FiPlus /></button></div>
        <RepeatEditor kind="experience" items={draft.experiences} onChange={(value) => set('experiences', value)} />
      </FormSection>
      <FormSection number="4" title="Professional certificates" subtitle="Add certificates and verification links."><RepeatEditor kind="certificate" items={draft.certificates} onChange={(value) => set('certificates', value)} /></FormSection>
      <footer className="trainer-editor-footer"><button className="tp-secondary" onClick={cancel}>Discard changes</button><button className="tp-primary" onClick={save}><FiSave /> Save changes</button></footer>
    </section>
  </div>;

  return <div className="trainer-profile-page">
    <header className="trainer-profile-title"><div><span>TRAINER PROFILE</span><h1>Profile</h1><p>Personal, professional, and university information.</p></div><button className="tp-primary" onClick={() => navigate('/trainer-dashboard/profile/edit')}><FiEdit2 /> Edit profile</button></header>
    <ProfileHero profile={profile} />
    <div className="trainer-profile-grid"><main>
      <Card title="Personal & professional information" icon={FiUser}><div className="trainer-data-grid"><Data label="Full name" value={`Eng. ${profile.fullName}`} /><Data label="Job title" value={profile.jobTitle} /><Data label="Email" value={profile.email} /><Data label="Phone" value={profile.phone} /><Data label="Employee ID" value={profile.employeeId} /><Data label="National ID" value={maskNationalId(profile.nationalId)} /><Data label="Experience" value={profile.yearsOfExperience} /><Data label="Employment" value={profile.employmentStatus} /></div><div className="trainer-summary"><h3>Professional summary</h3><p>{profile.bio}</p><h3>Specializations</h3><div className="trainer-tags">{profile.specializations.map((item) => <span key={item.id}>{item.name}</span>)}</div></div></Card>
      <Card title="Professional experience" icon={FiBriefcase}><div className="trainer-timeline">{profile.experiences.map((item) => <article key={item.id}><i /><div><h3>{item.role}</h3><b>{item.organization}</b><small>{item.from} — {item.to}</small><p>{item.description}</p></div></article>)}</div></Card>
      <Card title="Professional certificates" icon={FiAward}><div className="trainer-certificates">{profile.certificates.map((item) => <article key={item.id}><FiAward /><div><h3>{item.name}</h3><p>{item.issuer} · {item.year}</p></div>{item.verified && <span><FiCheckCircle /> Verified</span>}{item.verificationUrl && <a href={item.verificationUrl} target="_blank" rel="noreferrer"><FiExternalLink /></a>}</article>)}</div></Card>
    </main><aside>
      <Card title="Academic information" icon={FiBookOpen}><Academic icon={FiBookOpen} label="University" value={profile.university} /><Academic icon={FiAward} label="Faculty" value={profile.faculty} /><Academic icon={FiBriefcase} label="Department" value={profile.department} /><Academic icon={FiAward} label="University degree" value={`${profile.academicDegree} in ${profile.degreeSpecialization}`} /><Academic icon={FiFileText} label="Certificate number" value={profile.degreeCertificateNumber} /><Academic icon={FiAward} label="Graduation year" value={profile.graduationYear} /></Card>
      <section className="trainer-degree"><FiFileText /><div><small>UNIVERSITY CERTIFICATE</small><h3>{profile.degreeCertificate?.name}</h3><p>{profile.degreeCertificate?.size}</p></div>{profile.degreeCertificate?.verified && <b><FiCheckCircle /> Verified</b>}</section>
      <Card title="Contact & office" icon={FiMapPin}><Academic icon={FiMapPin} label="Office" value={profile.office} /><Academic icon={FiBriefcase} label="Office hours" value={profile.officeHours} /><Academic icon={FiPhone} label="Extension" value={profile.extension} /><div className="trainer-links"><a href={`mailto:${profile.email}`}><FiMail /> Email</a><a href={profile.github} target="_blank" rel="noreferrer"><FiGithub /> GitHub</a><a href={profile.linkedin} target="_blank" rel="noreferrer"><FiLinkedin /> LinkedIn</a></div></Card>
    </aside></div>
  </div>;
}

function ProfileHero({ profile, editing }) { return <section className="trainer-profile-hero"><img src={profile.avatar || avatar(profile.fullName)} alt={profile.fullName} /><div><h2>Eng. {profile.fullName}</h2><span><FiCheckCircle /> Active · Verified</span><p>{profile.jobTitle}</p><small>{profile.department} · {profile.university}</small></div>{editing && <b><FiEdit2 /> Editing profile</b>}</section>; }
function Card({ title, icon: Icon, children }) { return <section className="trainer-profile-card"><header><h2>{title}</h2><Icon /></header>{children}</section>; }
function Data({ label, value }) { return <div className="trainer-data"><small>{label}</small><b>{value || '—'}</b></div>; }
function Academic({ icon: Icon, label, value }) { return <div className="trainer-academic"><span><Icon /></span><div><small>{label}</small><b>{value || '—'}</b></div></div>; }
function Field({ label, value, change, area, type = 'text', full }) { return <label className={`trainer-field ${full ? 'full' : ''}`}><span>{label}</span>{area ? <textarea value={value || ''} onChange={(e) => change(e.target.value)} /> : <input type={type} value={value || ''} onChange={(e) => change(e.target.value)} />}</label>; }
function FormSection({ number, title, subtitle, children }) { return <section className="trainer-form-section"><header><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></header>{children}</section>; }
function RepeatEditor({ kind, items, onChange }) {
  const exp = kind === 'experience';
  const update = (itemId, data) => onChange(items.map((item) => item.id === itemId ? { ...item, ...data } : item));
  const add = () => onChange([...items, exp ? { id: id(), role: '', organization: '', from: '', to: '', description: '' } : { id: id(), name: '', issuer: '', year: '', verificationUrl: '', verified: false }]);
  return <div className="trainer-repeat"><button className="trainer-add" onClick={add}><FiPlus /> Add {kind}</button>{items.map((item) => <article key={item.id}><div className="trainer-fields">{exp ? <><Field label="Role" value={item.role} change={(v) => update(item.id, { role: v })} /><Field label="Organization" value={item.organization} change={(v) => update(item.id, { organization: v })} /><Field label="From" value={item.from} change={(v) => update(item.id, { from: v })} /><Field label="To" value={item.to} change={(v) => update(item.id, { to: v })} /><Field full area label="Description" value={item.description} change={(v) => update(item.id, { description: v })} /></> : <><Field label="Certificate" value={item.name} change={(v) => update(item.id, { name: v })} /><Field label="Issuer" value={item.issuer} change={(v) => update(item.id, { issuer: v })} /><Field label="Year" value={item.year} change={(v) => update(item.id, { year: v })} /><Field label="Verification URL" value={item.verificationUrl} change={(v) => update(item.id, { verificationUrl: v })} /></>}</div><button className="trainer-delete" onClick={() => window.confirm(`Delete this ${kind}?`) && onChange(items.filter((x) => x.id !== item.id))}><FiTrash2 /></button></article>)}</div>;
}
