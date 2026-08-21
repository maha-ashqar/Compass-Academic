import { useMemo, useState } from 'react';
import {
  FiArrowLeft, FiAward, FiCalendar, FiCheck, FiChevronRight, FiClock,
  FiFile, FiFilter, FiInfo, FiLink, FiPlus, FiSearch, FiShield,
  FiStar, FiTarget, FiUploadCloud, FiUser, FiUsers, FiX,
} from 'react-icons/fi';
import { COMPETITION_PHASE, useCompetitions } from './CompetitionsContext';
import './Competitions.css';

const phaseMeta = {
  [COMPETITION_PHASE.DRAFT]: ['Draft', 'neutral'],
  [COMPETITION_PHASE.REGISTRATION_OPEN]: ['Registration open', 'green'],
  [COMPETITION_PHASE.REGISTRATION_CLOSED]: ['Registration closed', 'neutral'],
  [COMPETITION_PHASE.SUBMISSIONS_OPEN]: ['Submissions open', 'blue'],
  [COMPETITION_PHASE.JUDGING]: ['Judging', 'orange'],
  [COMPETITION_PHASE.RESULTS_PUBLISHED]: ['Results published', 'purple'],
  [COMPETITION_PHASE.COMPLETED]: ['Completed', 'neutral'],
};

const formatDate = (value, withTime = false) => value ? new Date(value).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
}) : 'Not announced';
const daysLeft = (value) => value ? Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000)) : null;
const iconFor = (category = '') => category.toLowerCase().includes('cyber') ? <FiShield /> : category.toLowerCase().includes('design') ? <FiAward /> : category.toLowerCase().includes('web') ? <FiTarget /> : <FiStar />;

function ApplicationForm({ competition, studentData, onBack, onSubmit }) {
  const [form, setForm] = useState({ type: competition.participationType === 'team' ? 'team' : 'individual', teamName: '', members: [] });
  const [member, setMember] = useState({ name: '', email: '', role: '' });
  const allowTeam = competition.participationType !== 'individual';
  const allowIndividual = competition.participationType !== 'team';
  const addMember = () => {
    if (!member.name.trim() || !member.email.trim()) return;
    setForm((current) => ({ ...current, members: [...current.members, { ...member, id: Date.now() }] }));
    setMember({ name: '', email: '', role: '' });
  };
  const submit = (event) => {
    event.preventDefault();
    if (form.type === 'team' && !form.teamName.trim()) return;
    onSubmit({ ...form, studentName: studentData?.displayName || studentData?.fullName || 'Student', studentEmail: studentData?.email || '', studentId: studentData?.id || 'current-student' });
  };
  return <div className="sc-page sc-form-page"><button className="sc-back" onClick={onBack}><FiArrowLeft /> Back to competition</button><header className="sc-heading"><div><span>COMPETITION APPLICATION</span><h1>Apply to {competition.title}</h1><p>Choose how you want to participate, then send your request to the trainer.</p></div></header><form className="sc-application" onSubmit={submit}>
    <section><div className="sc-step"><b>1</b><span><strong>Participation type</strong><small>Apply individually or create your team.</small></span></div><div className="sc-choice-grid">{allowIndividual && <button type="button" className={form.type === 'individual' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'individual', members: [] })}><FiUser /><strong>Individual</strong><small>Participate on your own</small></button>}{allowTeam && <button type="button" className={form.type === 'team' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'team' })}><FiUsers /><strong>Team</strong><small>Up to {competition.maxTeamMembers || 5} members</small></button>}</div></section>
    <section><div className="sc-step"><b>2</b><span><strong>Your information</strong><small>Loaded from your student profile.</small></span></div><div className="sc-form-grid"><label>Student name<input value={studentData?.displayName || studentData?.fullName || ''} readOnly /></label><label>University email<input value={studentData?.email || ''} readOnly /></label></div></section>
    {form.type === 'team' && <section><div className="sc-step"><b>3</b><span><strong>Team members</strong><small>Add members and their responsibilities.</small></span></div><div className="sc-form-grid"><label className="full">Team name *<input value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} required /></label><label>Member name<input value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} /></label><label>Email<input type="email" value={member.email} onChange={(e) => setMember({ ...member, email: e.target.value })} /></label><label>Role<input value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })} /></label><button type="button" className="sc-add-member" onClick={addMember}><FiPlus /> Add member</button></div><div className="sc-member-list">{form.members.map((item) => <div key={item.id}><span><FiUser /></span><div><b>{item.name}</b><small>{item.role || item.email}</small></div><button type="button" onClick={() => setForm({ ...form, members: form.members.filter((m) => m.id !== item.id) })}><FiX /></button></div>)}</div></section>}
    <footer><button type="button" className="sc-secondary" onClick={onBack}>Cancel</button><button className="sc-primary">Send application</button></footer>
  </form></div>;
}

function SubmissionForm({ competition, registration, studentData, onBack, onSubmit }) {
  const [form, setForm] = useState({ title: '', description: '', demo: '', github: '', files: [] });
  const addFiles = (event) => setForm((current) => ({ ...current, files: [...current.files, ...Array.from(event.target.files).map((file) => ({ name: file.name, size: file.size, type: file.type }))] }));
  const submit = (event) => { event.preventDefault(); if (!form.title.trim()) return; onSubmit({ ...form, links: { demo: form.demo, github: form.github }, registrationId: registration.id, studentName: studentData?.displayName || studentData?.fullName || 'Student', studentEmail: studentData?.email || '', teamName: registration.teamName || '' }); };
  return <div className="sc-page sc-form-page"><button className="sc-back" onClick={onBack}><FiArrowLeft /> Back to competition</button><header className="sc-heading"><div><span>WORK SUBMISSION</span><h1>Submit your work</h1><p>{competition.title} · Your trainer will review this version.</p></div></header><form className="sc-application" onSubmit={submit}>
    <section><div className="sc-step"><b>1</b><span><strong>Project information</strong><small>Explain what you built and add its links.</small></span></div><div className="sc-form-grid"><label className="full">Submission title *<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label><label className="full">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label>Demo link<input type="url" value={form.demo} onChange={(e) => setForm({ ...form, demo: e.target.value })} /></label><label>GitHub repository<input type="url" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} /></label></div></section>
    <section><div className="sc-step"><b>2</b><span><strong>Files</strong><small>Presentation, report, ZIP, or images.</small></span></div><label className="sc-dropzone"><FiUploadCloud /><strong>Choose files to upload</strong><small>PDF, PPTX, DOCX, ZIP or images</small><input type="file" multiple onChange={addFiles} /></label><div className="sc-file-list">{form.files.map((file, index) => <div key={`${file.name}-${index}`}><FiFile /><span><b>{file.name}</b><small>{Math.max(1, Math.round(file.size / 1024))} KB</small></span><button type="button" onClick={() => setForm({ ...form, files: form.files.filter((_, i) => i !== index) })}><FiX /></button></div>)}</div></section>
    <footer><button type="button" className="sc-secondary" onClick={onBack}>Cancel</button><button className="sc-primary"><FiUploadCloud /> Submit work</button></footer>
  </form></div>;
}

function Competitions({ studentData }) {
  const api = useCompetitions();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('explore');
  const [query, setQuery] = useState('');
  const email = studentData?.email || '';
  const registrations = useMemo(
    () => Array.isArray(api.registrations) ? api.registrations : [],
    [api.registrations]
  );
  const submissions = Array.isArray(api.submissions) ? api.submissions : [];
  const publishedCompetitions = useMemo(
    () => Array.isArray(api.publishedCompetitions) ? api.publishedCompetitions : [],
    [api.publishedCompetitions]
  );
  const findStudentSubmission = (competitionId) => submissions.find((item) =>
    String(item.competitionId) === String(competitionId)
    && item.status !== 'deleted'
    && (!email || item.studentEmail?.toLowerCase() === email.toLowerCase())
  ) || null;
  const selected = typeof api.getCompetitionById === 'function'
    ? api.getCompetitionById(selectedId)
    : publishedCompetitions.find((item) => String(item.id) === String(selectedId)) || null;
  const registration = selected ? registrations.find((item) => String(item.competitionId) === String(selected.id) && (!email || item.studentEmail?.toLowerCase() === email.toLowerCase())) : null;
  const submission = selected ? findStudentSubmission(selected.id) : null;
  const list = useMemo(() => publishedCompetitions.filter((item) => {
    const mine = registrations.some((reg) => String(reg.competitionId) === String(item.id) && (!email || reg.studentEmail?.toLowerCase() === email.toLowerCase()));
    const result = [COMPETITION_PHASE.RESULTS_PUBLISHED, COMPETITION_PHASE.COMPLETED].includes(item.phase);
    return (tab === 'explore' || (tab === 'mine' && mine) || (tab === 'results' && result)) && `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(query.toLowerCase());
  }), [publishedCompetitions, registrations, email, query, tab]);

  const goList = () => { setView('list'); setSelectedId(null); };
  if (selected && view === 'apply') return <ApplicationForm competition={selected} studentData={studentData} onBack={() => setView('details')} onSubmit={(data) => { api.registerForCompetition(selected.id, data); setView('details'); }} />;
  if (selected && view === 'submit') return <SubmissionForm competition={selected} registration={registration} studentData={studentData} onBack={() => setView('details')} onSubmit={(data) => {
    if (typeof api.submitCompetitionWork !== 'function') {
      window.alert('Replace CompetitionsContext.jsx with the updated version to enable submissions.');
      return;
    }
    api.submitCompetitionWork(selected.id, data);
    setView('details');
  }} />;

  if (selected && view === 'details') {
    const [phaseLabel, color] = phaseMeta[selected.phase] || ['Competition', 'neutral'];
    const pending = registration?.status === 'pending';
    const approved = registration?.status === 'approved';
    const canApply = selected.phase === COMPETITION_PHASE.REGISTRATION_OPEN && !registration;
    const canSubmit = approved && selected.phase === COMPETITION_PHASE.SUBMISSIONS_OPEN && !submission;
    return <div className="sc-page"><button className="sc-back" onClick={goList}><FiArrowLeft /> Back to competitions</button><header className="sc-detail-head"><span className={`sc-hero-icon ${color}`}>{iconFor(selected.category)}</span><div><div><h1>{selected.title}</h1><i className={`sc-phase ${color}`}>{phaseLabel}</i></div><p>{selected.description}</p></div><aside>{canApply && <button className="sc-primary" onClick={() => setView('apply')}>Apply now</button>}{pending && <><span className="sc-wait"><FiClock /> Awaiting trainer approval</span><small>Your application was sent successfully.</small></>}{approved && !submission && <button className="sc-primary" disabled={!canSubmit} onClick={() => canSubmit && setView('submit')}>{canSubmit ? 'Upload submission' : 'Application approved'}</button>}{submission && <span className={`sc-wait ${submission.status === 'approved' ? 'success' : ''}`}><FiCheck /> {['scored','approved'].includes(submission.status) ? 'Evaluation available' : 'Submission under review'}</span>}</aside></header>
      <div className="sc-process">{[['Registration', selected.registrationOpenAt, selected.registrationCloseAt, FiCalendar], ['Work period', selected.submissionOpenAt, selected.submissionCloseAt, FiTarget], ['Submission deadline', selected.submissionCloseAt, '', FiClock], ['Results', selected.resultsAt, '', FiAward]].map(([label, from, to, Icon], index) => <div key={label} className={index === 0 ? 'active' : ''}><span><Icon /></span><p><b>{label}</b><small>{formatDate(from)}{to ? ` – ${formatDate(to)}` : ''}</small></p></div>)}</div>
      <div className="sc-detail-layout"><main><section className="sc-panel"><h2><FiInfo /> About the competition</h2><p>{selected.description}</p><h3>Objective</h3><p>Build an original solution with clear impact and a polished final presentation.</p></section><section className="sc-panel"><h2><FiFile /> Requirements</h2><ul>{(selected.requirements || []).map((item) => <li key={item}><FiCheck /> {item}</li>)}</ul></section><div className="sc-split"><section className="sc-panel"><h2><FiUploadCloud /> What to submit</h2><ul><li><FiFile /> Project description</li><li><FiLink /> Demo or prototype link</li><li><FiFile /> Presentation and documentation</li><li><FiUploadCloud /> Supporting files</li></ul></section><section className="sc-panel"><h2><FiStar /> Evaluation criteria</h2><dl><div><dt>Innovation</dt><dd>25%</dd></div><div><dt>Technical quality</dt><dd>35%</dd></div><div><dt>Impact</dt><dd>20%</dd></div><div><dt>Presentation</dt><dd>20%</dd></div></dl></section></div></main><aside><section className="sc-panel"><h2><FiInfo /> Key information</h2><dl><div><dt>Registration closes</dt><dd>{formatDate(selected.registrationCloseAt)}</dd></div><div><dt>Submission deadline</dt><dd>{formatDate(selected.submissionCloseAt, true)}</dd></div><div><dt>Participation</dt><dd>{selected.participationType?.replaceAll('-', ' ')}</dd></div><div><dt>Team size</dt><dd>Up to {selected.maxTeamMembers || 1}</dd></div><div><dt>Prize</dt><dd>{selected.prize || 'Recognition award'}</dd></div></dl></section>{registration ? <section className="sc-status-panel"><h2>Your participation</h2><div className="sc-status-line"><span className={registration.status}><FiCheck /></span><div><b>Application {registration.status}</b><small>{pending ? 'The trainer will review your request.' : 'You can continue to the submission stage.'}</small></div></div>{submission && <div className="sc-result"><b>{submission.title}</b><span>{submission.finalScore || 0}/100</span><p>{submission.feedback || 'Your work is currently being reviewed.'}</p></div>}{canSubmit && <button className="sc-primary" onClick={() => setView('submit')}>Upload and submit work</button>}</section> : <section className="sc-info-box"><FiInfo /><h3>Before you apply</h3><p>Choose whether you are applying individually or with a team.</p>{canApply && <button className="sc-primary" onClick={() => setView('apply')}>Apply now</button>}</section>}</aside></div></div>;
  }

  return <div className="sc-page"><header className="sc-heading"><div><h1>Competitions</h1><p>Discover challenges, apply, and track your participation.</p></div></header><div className="sc-toolbar"><nav>{[['explore','Explore'],['mine','My competitions'],['results','Results']].map(([id,label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav><label><FiSearch /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search competitions" /></label><button className="sc-filter"><FiFilter /> Filters</button></div><section className="sc-list-panel"><h2>{tab === 'explore' ? 'Available competitions' : tab === 'mine' ? 'My competitions' : 'Competition results'}</h2><div className="sc-list">{list.map((item) => {
    const reg = registrations.find((r) => String(r.competitionId) === String(item.id) && (!email || r.studentEmail?.toLowerCase() === email.toLowerCase()));
    const sub = findStudentSubmission(item.id);
    const [label, color] = phaseMeta[item.phase] || ['Competition', 'neutral'];
    const deadline = item.phase === COMPETITION_PHASE.REGISTRATION_OPEN ? item.registrationCloseAt : item.submissionCloseAt;
    const action = sub ? (['scored','approved'].includes(sub.status) ? 'View result' : 'View submission') : reg?.status === 'approved' ? 'Continue' : 'View details';
    return <article key={item.id} onClick={() => { setSelectedId(item.id); setView('details'); }}><span className={`sc-list-icon ${color}`}>{iconFor(item.category)}</span><div className="sc-list-title"><h3>{item.title}</h3><p>{item.description}</p></div><div className="sc-list-meta"><span><FiCalendar /><b>{item.phase === COMPETITION_PHASE.REGISTRATION_OPEN ? 'Registration closes' : 'Submission closes'}</b><small>{formatDate(deadline)}{daysLeft(deadline) !== null ? ` · ${daysLeft(deadline)} days left` : ''}</small></span><span><FiUsers /><b>{item.participationType?.replaceAll('-', ' ')}</b><small>Up to {item.maxTeamMembers || 1} members</small></span></div><div className="sc-list-state"><i className={`sc-phase ${color}`}>{label}</i>{reg && <small className={reg.status}><FiCheck /> {reg.status === 'approved' ? 'Your application is approved' : `Application ${reg.status}`}</small>}{sub && <small><FiClock /> {sub.status === 'scored' ? `${sub.finalScore}/100` : 'Submission under review'}</small>}</div><button>{action}</button><FiChevronRight className="sc-chevron" /></article>;
  })}{!list.length && <div className="sc-empty"><FiAward /><h3>No competitions found</h3><p>Published competitions and your participation will appear here.</p></div>}</div></section><footer className="sc-sync"><FiInfo /> New competitions published by trainers will appear here automatically.</footer></div>;
}

export default Competitions;