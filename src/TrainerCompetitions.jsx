import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiCalendar, FiCheck, FiDownload, FiEdit3, FiFileText,
  FiPlus, FiSearch, FiStar, FiTarget, FiTrash2, FiUsers, FiX,
} from 'react-icons/fi';
import { COMPETITION_PHASE, useCompetitions } from './CompetitionsContext';
import './TrainerCompetitions.css';

const phaseLabels = {
  [COMPETITION_PHASE.DRAFT]: 'Draft', [COMPETITION_PHASE.REGISTRATION_OPEN]: 'Registration open',
  [COMPETITION_PHASE.REGISTRATION_CLOSED]: 'Registration closed', [COMPETITION_PHASE.SUBMISSIONS_OPEN]: 'Submissions open',
  [COMPETITION_PHASE.JUDGING]: 'Judging', [COMPETITION_PHASE.RESULTS_PUBLISHED]: 'Results published',
  [COMPETITION_PHASE.COMPLETED]: 'Completed',
};
const filters = [
  ['all', 'All competitions'], [COMPETITION_PHASE.REGISTRATION_OPEN, 'Registration'],
  [COMPETITION_PHASE.SUBMISSIONS_OPEN, 'Submissions'], [COMPETITION_PHASE.JUDGING, 'Judging'],
  [COMPETITION_PHASE.COMPLETED, 'Completed'],
];
const emptyForm = { title: '', category: '', description: '', prize: '', participationType: 'individual-or-team', maxTeamMembers: 5, registrationOpenAt: '', registrationCloseAt: '', submissionOpenAt: '', submissionCloseAt: '', resultsAt: '', requirementsText: '', rulesText: '' };
const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';

function CompetitionForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(() => initial ? {
    ...emptyForm, ...initial,
    requirementsText: (initial.requirements || []).join('\n'), rulesText: (initial.rules || []).join('\n'),
  } : emptyForm);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.registrationCloseAt || !form.submissionCloseAt) return;
    onSave({ ...form, requirements: form.requirementsText.split('\n').filter(Boolean), rules: form.rulesText.split('\n').filter(Boolean), registrationDeadline: form.registrationCloseAt, startDate: form.submissionOpenAt, endDate: form.submissionCloseAt });
  };
  return <div className="tc-page"><button className="tc-back" onClick={onCancel}><FiArrowLeft /> Back to competitions</button><header className="tc-title"><div><span>COMPETITION MANAGEMENT</span><h1>{initial ? 'Edit competition' : 'Create competition'}</h1><p>Define participation, registration, submission, and judging details.</p></div></header><form className="tc-form" onSubmit={submit}>
    <section><h2>Competition information</h2><div className="tc-form-grid"><label>Competition title *<input value={form.title} onChange={(e) => update('title', e.target.value)} required /></label><label>Category<input value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="AI, Web, Design..." /></label><label className="full">Description<textarea value={form.description} onChange={(e) => update('description', e.target.value)} /></label><label>Prize<input value={form.prize} onChange={(e) => update('prize', e.target.value)} placeholder="$5,000" /></label><label>Participation<select value={form.participationType} onChange={(e) => update('participationType', e.target.value)}><option value="individual">Individual only</option><option value="team">Team only</option><option value="individual-or-team">Individual or team</option></select></label><label>Maximum team members<input type="number" min="1" max="20" value={form.maxTeamMembers} onChange={(e) => update('maxTeamMembers', Number(e.target.value))} /></label></div></section>
    <section><h2>Timeline</h2><div className="tc-form-grid"><label>Registration opens<input type="datetime-local" value={form.registrationOpenAt} onChange={(e) => update('registrationOpenAt', e.target.value)} /></label><label>Registration closes *<input type="datetime-local" value={form.registrationCloseAt} onChange={(e) => update('registrationCloseAt', e.target.value)} required /></label><label>Submissions open<input type="datetime-local" value={form.submissionOpenAt} onChange={(e) => update('submissionOpenAt', e.target.value)} /></label><label>Submission deadline *<input type="datetime-local" value={form.submissionCloseAt} onChange={(e) => update('submissionCloseAt', e.target.value)} required /></label><label>Results date<input type="datetime-local" value={form.resultsAt} onChange={(e) => update('resultsAt', e.target.value)} /></label></div></section>
    <section><h2>Requirements & rules</h2><div className="tc-form-grid"><label>Requirements, one per line<textarea value={form.requirementsText} onChange={(e) => update('requirementsText', e.target.value)} /></label><label>Rules, one per line<textarea value={form.rulesText} onChange={(e) => update('rulesText', e.target.value)} /></label></div></section>
    <footer><button type="button" className="tc-secondary" onClick={onCancel}>Cancel</button><button className="tc-primary">{initial ? 'Save changes' : 'Create & publish'}</button></footer>
  </form></div>;
}

function TrainerCompetitions() {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useCompetitions();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState(false);
  const [scoreDrafts, setScoreDrafts] = useState({});
  const path = location.pathname;
  const isNew = path.endsWith('/competitions/new');
  const routeMatch = path.match(/\/competitions\/([^/]+)(?:\/(registrations|submissions|results))?$/);
  const selectedId = routeMatch?.[1];
  const section = routeMatch?.[2] || 'overview';
  const selected = selectedId ? api.getCompetitionById(selectedId) : null;
  const competitions = api.getTrainerCompetitions();
  const goList = () => navigate('/trainer-dashboard/competitions');

  const filtered = useMemo(() => competitions.filter((item) => (filter === 'all' || item.phase === filter) && (category === 'all' || item.category === category) && `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [competitions, filter, category, query]);
  const categories = useMemo(() => [...new Set(competitions.map((item) => item.category).filter(Boolean))], [competitions]);
  const allRegistrations = api.registrations;
  const allSubmissions = api.submissions.filter((item) => item.status !== 'deleted');
  const pendingRegistrations = allRegistrations.filter((item) => item.status === 'pending');
  const pendingScores = allSubmissions.filter((item) => !['scored', 'approved'].includes(item.status));

  // FIXED: these three cards used to be <button>s with no onClick at all —
  // clicking "3 registration requests" did nothing. Each now jumps straight
  // to the first competition that actually has that kind of pending work.
  const firstPendingRegistrationCompetition = competitions.find((item) =>
    api.getRegistrationRequests(item.id).some((reg) => reg.status === 'pending'));
  const firstNewSubmissionCompetition = competitions.find((item) =>
    api.getCompetitionSubmissions(item.id).some((sub) => sub.status === 'submitted'));
  const firstPendingScoreCompetition = competitions.find((item) =>
    api.getCompetitionSubmissions(item.id).some((sub) => !['scored', 'approved'].includes(sub.status)));

  if (isNew) return <CompetitionForm onCancel={goList} onSave={(data) => {
    const item = api.createCompetition(data);
    api.publishCompetition(item.id);
    navigate(`/trainer-dashboard/competitions/${item.id}`);
  }} />;
  if (selected && editing) return <CompetitionForm initial={selected} onCancel={() => setEditing(false)} onSave={(data) => { api.updateCompetition(selected.id, data); setEditing(false); }} />;

  if (selected) {
    const registrations = api.getRegistrationRequests(selected.id);
    const submissions = api.getCompetitionSubmissions(selected.id);
    const ranking = api.calculateCompetitionRanking(selected.id);
    const nav = (target) => navigate(`/trainer-dashboard/competitions/${selected.id}${target === 'overview' ? '' : `/${target}`}`);
    return <div className="tc-page"><button className="tc-back" onClick={goList}><FiArrowLeft /> Back to competitions</button><header className="tc-workspace-head"><div><span className={`tc-phase is-${selected.phase}`}>{phaseLabels[selected.phase]}</span><h1>{selected.title}</h1><p>{selected.description}</p></div><div><button className="tc-secondary" onClick={() => setEditing(true)}><FiEdit3 /> Edit</button>{selected.status === 'draft' ? <button className="tc-primary" onClick={() => api.publishCompetition(selected.id)}>Publish</button> : <button className="tc-danger-text" onClick={() => { if (window.confirm('Delete this competition?')) { api.deleteCompetition(selected.id); goList(); } }}><FiTrash2 /> Delete</button>}</div></header>
      <nav className="tc-workspace-tabs">{[['overview','Overview'],['registrations',`Registrations (${registrations.length})`],['submissions',`Submissions (${submissions.length})`],['results','Results']].map(([id,label]) => <button className={section === id ? 'active' : ''} key={id} onClick={() => nav(id)}>{label}</button>)}</nav>
      {section === 'overview' && <div className="tc-workspace-grid"><main><section className="tc-panel"><h2>Competition details</h2><p>{selected.description || 'No description was added.'}</p><dl className="tc-detail-list"><div><dt>Participation</dt><dd>{selected.participationType} · up to {selected.maxTeamMembers} members</dd></div><div><dt>Registration</dt><dd>{formatDate(selected.registrationOpenAt)} – {formatDate(selected.registrationCloseAt)}</dd></div><div><dt>Submission period</dt><dd>{formatDate(selected.submissionOpenAt)} – {formatDate(selected.submissionCloseAt)}</dd></div><div><dt>Prize</dt><dd>{selected.prize || 'Recognition award'}</dd></div></dl></section><section className="tc-panel"><h2>Requirements</h2><ul>{(selected.requirements || []).map((item) => <li key={item}>{item}</li>)}</ul><h2>Rules</h2><ul>{(selected.rules || []).map((item) => <li key={item}>{item}</li>)}</ul></section></main><aside><section className="tc-panel"><h2>Stage control</h2><div className="tc-stage-actions"><button onClick={() => api.openRegistration(selected.id)}>Open registration</button><button onClick={() => api.closeRegistrationAutomatically(selected.id)}>Close registration</button><button onClick={() => api.openSubmissionPeriod(selected.id)}>Open submissions</button><button onClick={() => api.closeSubmissionsAutomatically(selected.id)}>Start judging</button><button onClick={() => api.publishCompetitionResults(selected.id)}>Publish results</button><button onClick={() => api.closeCompetition(selected.id)}>Complete</button></div></section><section className="tc-panel"><h2>Extend submission deadline</h2><input type="datetime-local" onChange={(e) => e.target.value && api.extendCompetitionDeadline(selected.id, e.target.value)} /></section></aside></div>}
      {section === 'registrations' && <section className="tc-panel"><div className="tc-panel-head"><div><h2>Registration requests</h2><p>Students cannot submit work until their request is approved.</p></div></div><div className="tc-table"><div className="tc-table-head"><span>Participant</span><span>Type</span><span>Team</span><span>Status</span><span>Action</span></div>{registrations.map((item) => <article key={item.id}><span><b>{item.studentName}</b><small>{item.studentEmail}</small></span><span>{item.type}</span><span>{item.members?.length || 1} member(s)</span><span><i className={`tc-request-status is-${item.status}`}>{item.status}</i></span><span className="tc-row-actions"><button onClick={() => api.approveRegistration(item.id)}><FiCheck /> Approve</button><button onClick={() => { const reason = window.prompt('Rejection reason'); if (reason) api.rejectRegistration(item.id, reason); }}><FiX /> Reject</button></span></article>)}</div>{!registrations.length && <div className="tc-empty">No registration requests yet.</div>}</section>}
      {section === 'submissions' && <section className="tc-panel"><div className="tc-panel-head"><div><h2>Competition submissions</h2><p>Review files, provide feedback, and calculate a score from 100.</p></div></div><div className="tc-submission-list">{submissions.map((item) => { const draft = scoreDrafts[item.id] || item.rubricScores || {}; return <article key={item.id}><div className="tc-submission-title"><span><FiFileText /></span><div><h3>{item.title}</h3><p>{item.teamName || item.studentName} · {item.status}</p></div><strong>{item.finalScore || 0}/100</strong></div><div className="tc-rubric">{[['idea','Idea & impact',25],['technical','Technical quality',35],['experience','User experience',20],['presentation','Presentation',20]].map(([key,label,max]) => <label key={key}>{label}<span><input type="number" min="0" max={max} value={draft[key] ?? ''} onChange={(e) => setScoreDrafts((current) => ({ ...current, [item.id]: { ...draft, [key]: Math.min(max, Math.max(0, Number(e.target.value) || 0)) } }))} /> / {max}</span></label>)}</div><textarea placeholder="Feedback for participant" value={item.feedback || ''} onChange={(e) => api.addSubmissionFeedback(item.id, e.target.value)} /><div className="tc-row-actions"><button onClick={() => api.saveSubmissionScore(item.id, draft)}><FiStar /> Save score</button><button onClick={() => api.approveSubmission(item.id)}><FiCheck /> Approve</button><button onClick={() => { const feedback = window.prompt('Required changes'); if (feedback) api.requestSubmissionChanges(item.id, feedback); }}>Request changes</button><button className="danger" onClick={() => { const reason = window.prompt('Deletion reason'); if (reason) api.deleteSubmission(item.id, reason); }}><FiTrash2 /></button></div></article>; })}</div>{!submissions.length && <div className="tc-empty">No submissions yet.</div>}</section>}
      {section === 'results' && <section className="tc-panel"><div className="tc-panel-head"><div><h2>Ranking & results</h2><p>Ranking is calculated automatically from final scores.</p></div><div><button className="tc-secondary" onClick={() => api.exportCompetitionResults(selected.id)}><FiDownload /> Export CSV</button><button className="tc-primary" onClick={() => api.publishCompetitionResults(selected.id)}>Publish results</button></div></div><div className="tc-ranking">{ranking.map((item) => <article key={item.id}><strong>#{item.rank}</strong><div><b>{item.teamName || item.studentName}</b><small>{item.title}</small></div><span>{item.finalScore}/100</span></article>)}</div>{!ranking.length && <div className="tc-empty">Score submissions to generate the ranking.</div>}</section>}
    </div>;
  }

  return <div className="tc-page"><header className="tc-title"><div><span>COMPETITION MANAGEMENT</span><h1>Competitions</h1><p>Publish competitions, review participants, and manage results.</p></div><button className="tc-primary" onClick={() => navigate('/trainer-dashboard/competitions/new')}><FiPlus /> Create competition</button></header><div className="tc-toolbar"><nav className="tc-filter-tabs">{filters.map(([id,label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}</nav><div className="tc-toolbar-controls"><label><FiSearch /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search competitions" /></label><select className="tc-category-select" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div><div className="tc-list-layout"><main className="tc-panel"><h2>Competitions</h2><div className="tc-competition-list">{filtered.map((item) => { const regs = api.getRegistrationRequests(item.id); const subs = api.getCompetitionSubmissions(item.id); return <article key={item.id} onClick={() => navigate(`/trainer-dashboard/competitions/${item.id}`)}><span className="tc-comp-icon"><FiTarget /></span><div className="tc-comp-main"><div><h3>{item.title}</h3><i className={`tc-phase is-${item.phase}`}>{phaseLabels[item.phase]}</i></div><p>{item.description}</p><footer><span><FiCalendar /> {item.phase === COMPETITION_PHASE.REGISTRATION_OPEN ? 'Registration closes' : item.phase === COMPETITION_PHASE.SUBMISSIONS_OPEN ? 'Submission closes' : 'Results'}<b>{formatDate(item.phase === COMPETITION_PHASE.REGISTRATION_OPEN ? item.registrationCloseAt : item.submissionCloseAt)}</b></span><span><FiUsers /> {item.participationType}<b>Up to {item.maxTeamMembers} members</b></span><span><FiFileText /> {item.phase === COMPETITION_PHASE.REGISTRATION_OPEN ? regs.length : subs.length}<b>{item.phase === COMPETITION_PHASE.REGISTRATION_OPEN ? 'applications' : 'submissions'}</b></span></footer></div><button className="tc-manage">{item.phase === COMPETITION_PHASE.COMPLETED ? 'View results' : 'Manage'}</button></article>; })}{!filtered.length && <div className="tc-empty">No competitions match these filters.</div>}</div></main><aside><section className="tc-panel tc-attention"><h2>Needs your attention</h2>
    <button
      disabled={!firstPendingRegistrationCompetition}
      onClick={() => firstPendingRegistrationCompetition && navigate(`/trainer-dashboard/competitions/${firstPendingRegistrationCompetition.id}/registrations`)}
    ><FiUsers /><span><b>{pendingRegistrations.length} registration requests</b><small>awaiting approval</small></span></button>
    <button
      disabled={!firstNewSubmissionCompetition}
      onClick={() => firstNewSubmissionCompetition && navigate(`/trainer-dashboard/competitions/${firstNewSubmissionCompetition.id}/submissions`)}
    ><FiFileText /><span><b>{allSubmissions.filter((item) => item.status === 'submitted').length} new submissions</b><small>ready to review</small></span></button>
    <button
      disabled={!firstPendingScoreCompetition}
      onClick={() => firstPendingScoreCompetition && navigate(`/trainer-dashboard/competitions/${firstPendingScoreCompetition.id}/submissions`)}
    ><FiStar /><span><b>{pendingScores.length} works awaiting scores</b><small>need evaluation</small></span></button>
  </section>{filtered[0] && <section className="tc-panel tc-selected"><h2>Selected competition</h2><h3>{filtered[0].title}</h3><ol>{[['Registration', filtered[0].registrationCloseAt], ['Work period', filtered[0].submissionOpenAt], ['Submission deadline', filtered[0].submissionCloseAt], ['Results', filtered[0].resultsAt]].map(([label, date]) => <li key={label}><i className={date && new Date(date).getTime() <= Date.now() ? 'done' : ''} />{label} <span>{formatDate(date)}</span></li>)}</ol><button onClick={() => navigate(`/trainer-dashboard/competitions/${filtered[0].id}`)}>Open competition workspace</button></section>}</aside></div></div>;
}

export default TrainerCompetitions;
