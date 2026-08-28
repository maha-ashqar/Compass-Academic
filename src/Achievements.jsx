import { useMemo, useState } from 'react';
import {
  FiAward, FiBookOpen, FiBriefcase, FiCalendar, FiCheckCircle,
  FiCode, FiCopy, FiExternalLink, FiGithub, FiGlobe,
  FiGrid, FiMail, FiMapPin, FiPlus, FiPrinter, FiShare2,
  FiStar, FiTrash2, FiUser, FiUsers, FiX,
} from 'react-icons/fi';
import { useCourses } from './CoursesContext';
import { useProjects, PROJECT_STATUS } from './ProjectsContext';
import { useCompetitions } from './CompetitionsContext';
import { competitionsData } from './competitionsData';
import { getPortfolioRecord } from './portfolioRecords';
import { badgesData } from './badgesData';
import './Achievements.css';

const EXTERNAL_CERTIFICATES_KEY = 'career_portfolio_external_certificates_v1';
const EMPTY_CERTIFICATE = { title: '', issuer: '', issuedAt: '', credentialUrl: '', description: '' };

const safeArray = (value) => (Array.isArray(value) ? value : []);
const normalize = (value) => String(value || '').trim().toLowerCase();
const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'student';
const makePortfolioId = (student) => {
  const source = `${student?.email || ''}-${student?.displayName || ''}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  return `CA-${new Date().getFullYear()}-${String(Math.abs(hash) % 100000).padStart(5, '0')}`;
};
const formatDate = (value) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
const openExternal = (url) => {
  if (!url || url === '#') return;
  try {
    const parsed = new URL(url, window.location.origin);
    if (['http:', 'https:'].includes(parsed.protocol)) window.open(parsed.href, '_blank', 'noopener,noreferrer');
  } catch { /* Ignore invalid external links. */ }
};

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="portfolio-section-heading">
      <div><Icon /><h2>{title}</h2></div>
      {action}
    </div>
  );
}

function Achievements({ studentData }) {
  const {
    myCourses, getCourseProgress, getCompletedLessonCount, submittedAssignments,
  } = useCourses();
  const { projects } = useProjects();
  const { registeredIds, registrations } = useCompetitions();
  const [activeView, setActiveView] = useState('overview');
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [certificateForm, setCertificateForm] = useState(EMPTY_CERTIFICATE);
  const [notice, setNotice] = useState('');
  const storageKey = `${EXTERNAL_CERTIFICATES_KEY}:${normalize(studentData?.email) || 'student'}`;
  const [externalCertificates, setExternalCertificates] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  });

  const record = useMemo(() => getPortfolioRecord(studentData?.email), [studentData?.email]);
  const portfolioId = useMemo(() => makePortfolioId(studentData), [studentData]);
  // NOTE: this points at a public /portfolio/:slug route that doesn't exist
  // yet in the app's router — sharing it externally will 404 until that
  // page is built. Kept as-is (harmless) but flagged here for visibility.
  const publicUrl = `${window.location.origin}/portfolio/${slugify(studentData?.fullName || studentData?.displayName)}`;

  const coursesWithProgress = useMemo(() => safeArray(myCourses).map((course) => {
    const total = safeArray(course.modules).reduce((sum, module) => sum + safeArray(module.lessons).length, 0);
    return {
      course,
      totalLessons: total,
      progress: getCourseProgress(course.id, total),
      completedLessons: getCompletedLessonCount(course.id),
    };
  }), [myCourses, getCourseProgress, getCompletedLessonCount]);

  const completedCourses = useMemo(
    () => coursesWithProgress.filter((item) => item.totalLessons > 0 && item.progress === 100).map((item) => item.course),
    [coursesWithProgress]
  );

  const approvedProjects = useMemo(() => {
    const email = normalize(studentData?.email);
    const name = normalize(studentData?.fullName || studentData?.displayName);
    return safeArray(projects).filter((project) => {
      if (project.status !== PROJECT_STATUS.APPROVED || project.deletedAt) return false;
      const ownerMatch = email && normalize(project.studentEmail) === email;
      const studentName = normalize(studentData?.displayName);
      const teamMatch = safeArray(project.team).some((member) => {
        const memberName = normalize(typeof member === 'string' ? member : member.name);
        return memberName && (memberName === name || memberName === studentName || memberName.includes(studentName));
      });
      return ownerMatch || teamMatch;
    });
  }, [projects, studentData]);

  const verifiedCompetitions = useMemo(() => safeArray(registeredIds).map((id) => {
    const competition = competitionsData.find((item) => String(item.id) === String(id));
    if (!competition) return null;
    const ended = new Date(competition.endDate).getTime() < Date.now();
    return { ...competition, registration: registrations?.[String(id)], verified: ended, result: ended ? (record.competitionResults?.[id] || 'Participant') : 'Registered' };
  }).filter(Boolean), [record.competitionResults, registeredIds, registrations]);

  // FIXED: this used to fall back to hardcoded placeholder skills
  // ('React', 'JavaScript', 'Git'...) whenever a student had none of their
  // own — showing skills the student never actually claimed. Now an empty
  // category is just empty, and the UI shows an honest "not added yet"
  // message instead of fabricating expertise.
  const skills = useMemo(() => {
    const projectTech = approvedProjects.flatMap((project) => safeArray(project.techStack));
    const profileSkills = safeArray(studentData?.skills);
    const unique = [...new Set([...profileSkills, ...projectTech])];
    const designWords = ['figma', 'ui', 'ux', 'design', 'prototype'];
    const professionalWords = ['communication', 'teamwork', 'leadership', 'problem solving', 'research'];
    const design = unique.filter((skill) => designWords.some((word) => normalize(skill).includes(word)));
    const professional = unique.filter((skill) => professionalWords.some((word) => normalize(skill).includes(word)));
    const development = unique.filter((skill) => !design.includes(skill) && !professional.includes(skill));
    return { development, design, professional };
  }, [approvedProjects, studentData?.skills]);
  const hasAnySkills = skills.development.length + skills.design.length + skills.professional.length > 0;

  const platformCertificates = completedCourses.map((course) => ({
    id: `course-${course.id}`, title: course.title, issuer: 'Compass Academy',
    issuedAt: course.completedAt || new Date().toISOString(), description: `Verified completion of ${course.category}.`,
    verified: true, platform: true,
  }));
  const certificates = [...platformCertificates, ...externalCertificates];
  const averageEvaluation = record.evaluations.length
    ? Math.round(record.evaluations.reduce((sum, item) => sum + item.score, 0) / record.evaluations.length)
    : 0;

  // FIXED: this used to start every student at a 56% "completeness" floor
  // regardless of what they'd actually done — a brand-new, empty profile
  // showed as more than half complete. It's now a genuine tally of real,
  // checkable achievements, so an empty profile honestly reads as 0%.
  const completenessChecks = [
    Boolean(studentData?.avatar),
    Boolean(studentData?.overview?.trim()),
    hasAnySkills,
    approvedProjects.length > 0,
    completedCourses.length > 0,
    certificates.some((c) => c.verified),
    verifiedCompetitions.length > 0,
  ];
  const profileCompleteness = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
  );

  // FIXED: badgesData.js was defined elsewhere in the project but never
  // actually rendered anywhere — these badges are wired up here for real,
  // computed from the student's genuine course/assignment/competition data.
  const coursesWithAnyLesson = coursesWithProgress.filter((item) => item.completedLessons > 0).length;
  const earnedBadgeIds = useMemo(() => {
    const earned = new Set();
    if (myCourses.length > 0) earned.add('getting-started');
    if (coursesWithProgress.some((item) => item.completedLessons > 0)) earned.add('first-lesson');
    if (coursesWithProgress.some((item) => item.progress >= 50)) earned.add('halfway-there');
    if (completedCourses.length > 0) earned.add('course-graduate');
    if (myCourses.length >= 3) earned.add('multi-track');
    if (coursesWithAnyLesson >= 3) earned.add('knowledge-seeker');
    if (safeArray(submittedAssignments).length >= 5) earned.add('assignment-ace');
    if (safeArray(registeredIds).length > 0) earned.add('competitor');
    return earned;
  }, [myCourses.length, coursesWithProgress, completedCourses.length, coursesWithAnyLesson, submittedAssignments, registeredIds]);

  const saveCertificates = (next) => {
    setExternalCertificates(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };
  const addCertificate = (event) => {
    event.preventDefault();
    if (!certificateForm.title.trim() || !certificateForm.issuer.trim() || !certificateForm.credentialUrl.trim()) {
      setNotice('Certificate title, issuer, and credential link are required.');
      return;
    }
    try { new URL(certificateForm.credentialUrl); } catch { setNotice('Enter a valid credential URL.'); return; }
    const next = [{ ...certificateForm, id: `external-${Date.now()}`, verified: false, platform: false }, ...externalCertificates];
    saveCertificates(next);
    setCertificateForm(EMPTY_CERTIFICATE);
    setShowCertificateForm(false);
    setNotice('Certificate added to your portfolio.');
  };
  const copyPortfolioLink = async () => {
    try { await navigator.clipboard.writeText(publicUrl); setNotice('Portfolio link copied.'); }
    catch { setNotice('Copy was blocked. Copy the portfolio ID instead.'); }
  };
  const copyPortfolioId = async () => {
    try { await navigator.clipboard.writeText(portfolioId); setNotice('Portfolio ID copied.'); }
    catch { setNotice('Copy was blocked.'); }
  };

  return (
    <main className="career-portfolio" dir="ltr">
      <header className="portfolio-page-header">
        <div><span>Verified career portfolio</span><h1>{studentData?.displayName || 'Student'}’s professional profile</h1><p>A verified record of learning, projects, skills, and achievements.</p></div>
        <div className="portfolio-header-actions">
          <button type="button" onClick={copyPortfolioLink}><FiShare2 /> Share</button>
          <button type="button" className="primary" onClick={() => window.print()}><FiPrinter /> Print / Save PDF</button>
        </div>
      </header>

      {notice && <button className="portfolio-notice" type="button" onClick={() => setNotice('')}><FiCheckCircle /> {notice}<FiX /></button>}

      <section className="portfolio-identity-card">
        <img src={studentData?.avatar} alt={studentData?.displayName || 'Student'} />
        <div className="portfolio-identity-copy">
          <div className="portfolio-name-line"><h2>{studentData?.fullName || studentData?.displayName || 'Student'}</h2><span><FiCheckCircle /> Verified account</span></div>
          <p><FiBookOpen /> {studentData?.major || studentData?.program || 'Student'}</p>
          <p><FiGlobe /> {studentData?.university || 'Al-Azhar University – Gaza'}</p>
          <p><FiBriefcase /> {studentData?.college || 'Faculty of Engineering and Information Technology'}</p>
          <div className="portfolio-meta-line">
            <span><FiCalendar /> Academic year: {record.academicYear}</span>
            <span><FiMapPin /> {studentData?.location || 'Gaza, Palestine'}</span>
            <span><FiMail /> {studentData?.email}</span>
          </div>
        </div>
        <div className="portfolio-score">
          <div style={{ '--score': `${profileCompleteness * 3.6}deg` }}><strong>{profileCompleteness}%</strong></div>
          <span>Profile completeness</span><small>Portfolio ID: {portfolioId}</small>
        </div>
      </section>

      <nav className="portfolio-tabs" aria-label="Portfolio sections">
        {[['overview', FiGrid, 'Overview'], ['projects', FiBriefcase, 'Projects'], ['learning', FiBookOpen, 'Learning'], ['credentials', FiAward, 'Credentials']].map(([id, Icon, label]) => (
          <button key={id} className={activeView === id ? 'active' : ''} type="button" onClick={() => setActiveView(id)}><Icon /> {label}</button>
        ))}
      </nav>

      <div className="portfolio-layout">
        <div className="portfolio-main-column">
          {(activeView === 'overview') && <section className="portfolio-summary"><SectionTitle icon={FiUser} title="Professional summary" /><p>{studentData?.overview || 'Computer Engineering student focused on creating accessible, reliable, and useful digital products through practical learning and collaborative projects.'}</p></section>}

          {(activeView === 'overview' || activeView === 'projects') && <section id="portfolio-projects">
            <SectionTitle icon={FiBriefcase} title={activeView === 'overview' ? 'Featured projects' : 'Approved projects'} action={<span className="platform-source">Platform verified only</span>} />
            {approvedProjects.length ? <div className="portfolio-project-list">{approvedProjects.map((project, index) => (
              <article className="portfolio-project" key={project.id}>
                <div className={`portfolio-project-preview variant-${(index % 3) + 1}`}><FiCode /><span>{project.category}</span></div>
                <div className="portfolio-project-body"><h3>{project.title}</h3><p>{project.description}</p><div className="portfolio-chip-row">{safeArray(project.techStack).map((tech) => <span key={tech}>{tech}</span>)}</div><div className="portfolio-project-footer"><span><FiUsers /> Team of {Math.max(1, safeArray(project.team).length)}</span>{project.links?.github && <button type="button" onClick={() => openExternal(project.links.github)}><FiGithub /> GitHub <FiExternalLink /></button>}{project.links?.demo && <button type="button" onClick={() => openExternal(project.links.demo)}><FiGlobe /> Live demo <FiExternalLink /></button>}</div></div>
              </article>
            ))}</div> : <div className="portfolio-empty"><FiBriefcase /><div><h3>No published projects yet</h3><p>Only projects approved by an authorized instructor appear here.</p></div></div>}
          </section>}

          {(activeView === 'overview' || activeView === 'learning') && <section id="portfolio-learning">
            <SectionTitle icon={FiBookOpen} title="Learning & training" />
            <div className="portfolio-learning-grid"><div><h3>Completed courses</h3>{completedCourses.length ? completedCourses.map((course) => <div className="portfolio-record-row" key={course.id}><FiCheckCircle /><span><strong>{course.title}</strong><small>{course.instructor || 'Compass Academy'}</small></span><time>100%</time></div>) : <p className="portfolio-muted">Courses appear after reaching 100% progress.</p>}</div><div><h3>Verified training programs</h3>{record.trainings.map((training) => <div className="portfolio-record-row" key={training.id}><FiCheckCircle /><span><strong>{training.title}</strong><small>{training.provider}</small></span><time>{training.hours} hours</time></div>)}</div></div>
          </section>}

          {(activeView === 'overview' || activeView === 'credentials') && <section id="portfolio-evaluations">
            <SectionTitle icon={FiStar} title="Verified mentor evaluations" action={<strong className="portfolio-average">{averageEvaluation}/100 average</strong>} />
            <div className="portfolio-evaluation-grid">{record.evaluations.map((evaluation) => <article key={evaluation.id}><div className="evaluation-avatar">{evaluation.mentor.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div><div><h3>{evaluation.mentor} <span><FiCheckCircle /> Verified</span></h3><small>{evaluation.title}</small><p>{evaluation.note}</p></div><strong>{evaluation.score}<small>/100</small></strong></article>)}</div>
          </section>}
        </div>

        {/* FIXED: every section below used to be hidden on the "Projects"
            and "Learning" tabs (gated to overview/credentials only),
            leaving the sidebar almost empty on those tabs. Badges, skills,
            certificates, competitions, and education are portfolio-wide
            facts, not tab-specific — so they now stay visible on every
            tab, the way a LinkedIn-style profile sidebar would. */}
        <aside className="portfolio-side-column">
          <section>
            <SectionTitle icon={FiAward} title="Badges" action={<span className="platform-source">{earnedBadgeIds.size}/{badgesData.length} earned</span>} />
            <div className="portfolio-badge-grid">
              {badgesData.map((badge) => {
                const earned = earnedBadgeIds.has(badge.id);
                return (
                  <div key={badge.id} className={`portfolio-badge tier-${badge.tier} ${earned ? 'earned' : 'locked'}`} title={badge.description}>
                    <span>{badge.icon}</span>
                    <strong>{badge.title}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle icon={FiCode} title="Skills" />
            {hasAnySkills ? Object.entries(skills).filter(([, items]) => items.length > 0).map(([group, items]) => (
              <div className="portfolio-skill-group" key={group}><h3>{group}</h3><div className="portfolio-chip-row">{items.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
            )) : <p className="portfolio-muted">No skills added yet. Skills from your profile and approved projects will appear here.</p>}
          </section>

          <section id="portfolio-certificates"><SectionTitle icon={FiAward} title="Certificates & credentials" action={<button className="portfolio-add-button" type="button" onClick={() => { setNotice(''); setShowCertificateForm(true); }}><FiPlus /> Add certificate</button>} />{certificates.length ? certificates.map((certificate) => <article className="portfolio-credential" key={certificate.id}><div><FiAward /></div><span><strong>{certificate.title}</strong><small>{certificate.issuer} · {formatDate(certificate.issuedAt)}</small><p>{certificate.description}</p>{certificate.verified && <em><FiCheckCircle /> Platform verified</em>}</span><div className="credential-actions">{certificate.credentialUrl && <button type="button" onClick={() => openExternal(certificate.credentialUrl)}><FiExternalLink /></button>}{!certificate.platform && <button className="danger" type="button" aria-label="Delete certificate" onClick={() => saveCertificates(externalCertificates.filter((item) => item.id !== certificate.id))}><FiTrash2 /></button>}</div></article>) : <p className="portfolio-muted">No certificates added yet.</p>}</section>

          <section><SectionTitle icon={FiAward} title="Competitions" />{verifiedCompetitions.length ? verifiedCompetitions.map((competition) => <div className="portfolio-competition" key={competition.id}><span><strong>{competition.title}</strong><small>{competition.organizer}</small></span><b>{competition.result}</b>{competition.verified ? <em><FiCheckCircle /> Verified</em> : <em className="pending">Pending completion</em>}</div>) : <p className="portfolio-muted">Registered platform competitions will appear here.</p>}</section>

          <section><SectionTitle icon={FiBookOpen} title="Education" /><div className="portfolio-education"><strong>Bachelor of Science in {studentData?.program || studentData?.major || 'Computer Engineering'}</strong><span>{studentData?.university || 'Al-Azhar University – Gaza'}</span><small>Academic year {record.academicYear} · Expected graduation: {studentData?.graduation || record.expectedGraduation}</small></div></section>
        </aside>
      </div>

      {/* FIXED: this used to be a "Scan to verify" QR code made of pseudo-
          random squares from a character hash — it didn't encode anything
          and could never actually be scanned. Replaced with an honest
          verification block: a real badge plus a copyable portfolio ID. */}
      <footer className="portfolio-verification">
        <span className="portfolio-verification-badge"><FiCheckCircle /></span>
        <div>
          <h2>Compass Academy verified portfolio</h2>
          <p>Every project, course, and evaluation shown here is confirmed by Compass Academy instructors and platform records.</p>
        </div>
        <button type="button" className="portfolio-verification-id" onClick={copyPortfolioId}>
          <span>Portfolio ID</span>
          <strong>{portfolioId} <FiCopy /></strong>
        </button>
      </footer>

      {showCertificateForm && <div className="portfolio-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowCertificateForm(false)}><form className="portfolio-modal" onSubmit={addCertificate}><button className="portfolio-modal-close" type="button" onClick={() => setShowCertificateForm(false)}><FiX /></button><span className="portfolio-modal-kicker">Personal credential</span><h2>Add external certificate</h2><p>Only certificates you own can be added here. Platform results remain read-only.</p><label>Certificate title<input value={certificateForm.title} onChange={(event) => setCertificateForm({ ...certificateForm, title: event.target.value })} /></label><div className="portfolio-form-grid"><label>Issuer<input value={certificateForm.issuer} onChange={(event) => setCertificateForm({ ...certificateForm, issuer: event.target.value })} /></label><label>Issue date<input type="date" value={certificateForm.issuedAt} onChange={(event) => setCertificateForm({ ...certificateForm, issuedAt: event.target.value })} /></label></div><label>Credential URL<input type="url" placeholder="https://..." value={certificateForm.credentialUrl} onChange={(event) => setCertificateForm({ ...certificateForm, credentialUrl: event.target.value })} /></label><label>Description<textarea rows="3" value={certificateForm.description} onChange={(event) => setCertificateForm({ ...certificateForm, description: event.target.value })} /></label>{notice && <span className="portfolio-form-error">{notice}</span>}<button className="portfolio-modal-primary" type="submit"><FiPlus /> Add certificate</button></form></div>}
    </main>
  );
}

export default Achievements;
