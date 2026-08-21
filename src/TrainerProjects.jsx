import { useMemo, useState } from 'react';
import {
  FiArrowLeft, FiCheck, FiDownload, FiExternalLink, FiFileText, FiGithub,
  FiMoreHorizontal, FiPlus, FiSearch, FiTrash2, FiUsers, FiX,
} from 'react-icons/fi';
import { PROJECT_RUBRIC, PROJECT_STATUS, useProjects } from './ProjectsContext';
import './TrainerProjects.css';
import './TrainerProjectsDetail.css';

const labels = {
  [PROJECT_STATUS.PENDING]: 'Awaiting review',
  [PROJECT_STATUS.CHANGES]: 'Changes requested',
  [PROJECT_STATUS.RESUBMITTED]: 'Resubmitted',
  [PROJECT_STATUS.PUBLISHED]: 'Published',
  [PROJECT_STATUS.UNPUBLISHED]: 'Unpublished',
};

const emptyProject = {
  title: '', courseTitle: '', category: 'Web Development', description: '',
  problem: '', solution: '', techStack: '', studentName: 'Compass Academy', demo: '', github: '',
  presentation: '', documentation: '', publishNow: true,
};

const TrainerProjects = ({ trainerData }) => {
  const {
    getTrainerProjects, filterProjects, getProjectDetails, calculateProjectScore,
    saveProjectReview, requestProjectChanges, approveAndPublishProject,
    unpublishProject, deleteProject, exportProjectsReport, addTrainerProject,
  } = useProjects();
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [course, setCourse] = useState('all');
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [feedback, setFeedback] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [notifyTeam, setNotifyTeam] = useState(false);
  const [changesDueAt, setChangesDueAt] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProject);

  const projects = getTrainerProjects();
  const courses = useMemo(() => [...new Map(projects.map((item) => [String(item.courseId || item.courseTitle), { id: item.courseId || item.courseTitle, title: item.courseTitle }])).values()], [projects]);
  const filtered = filterProjects({ query, course, status });
  const selected = selectedId ? getProjectDetails(selectedId) : null;
  const total = calculateProjectScore(scores);
  const actor = trainerData?.displayName || 'Trainer';

  const counts = {
    pending: projects.filter((item) => [PROJECT_STATUS.PENDING, PROJECT_STATUS.RESUBMITTED].includes(item.status)).length,
    changes: projects.filter((item) => item.status === PROJECT_STATUS.CHANGES).length,
    published: projects.filter((item) => item.status === PROJECT_STATUS.PUBLISHED).length,
  };

  const openProject = (project) => {
    setSelectedId(project.id);
    setScores(project.evaluation?.scores || {});
    setNotes(project.evaluation?.notes || {});
    setFeedback(project.feedback || '');
    setPrivateNote(project.privateNote || '');
    setNotifyTeam(Boolean(project.notifyTeam));
    setChangesDueAt(project.changesDueAt || '');
    setNotice('');
  };

  const review = () => ({ scores, notes, feedback, privateNote, notifyTeam });
  const saveDraft = () => {
    saveProjectReview(selected.id, review(), actor);
    setNotice('Evaluation draft saved.');
  };
  const approve = () => {
    approveAndPublishProject(selected.id, review(), actor);
    setNotice('Project approved and published in the student gallery.');
  };
  const requestChanges = () => {
    if (!feedback.trim()) { setNotice('Write feedback before requesting changes.'); return; }
    requestProjectChanges(selected.id, feedback.trim(), changesDueAt, actor);
    setNotice('Changes requested and returned to the student team.');
  };
  const createProject = (event) => {
    event.preventDefault();
    addTrainerProject({
      ...projectForm,
      links: { demo: projectForm.demo, github: projectForm.github, presentation: projectForm.presentation, documentation: projectForm.documentation },
      team: [{ name: projectForm.studentName, role: 'Platform contributor' }],
      techStack: projectForm.techStack.split(',').map((item) => item.trim()).filter(Boolean),
      status: projectForm.publishNow ? PROJECT_STATUS.PUBLISHED : PROJECT_STATUS.UNPUBLISHED,
    }, actor);
    setProjectForm(emptyProject);
    setCreateOpen(false);
  };

  if (selected) {
    const materials = [
      ['Live demo', selected.links?.demo, <FiExternalLink key="demo" />],
      ['GitHub repository', selected.links?.github, <FiGithub key="github" />],
      ['Presentation', selected.links?.presentation, <FiFileText key="presentation" />],
      ['Documentation', selected.links?.documentation, <FiFileText key="docs" />],
    ].filter((item) => item[1]);

    return (
      <div className="trainer-projects-page trainer-project-detail">
        <button type="button" className="tp-back" onClick={() => setSelectedId(null)}><FiArrowLeft /> Back to projects</button>
        <header className="tp-detail-header">
          <div><h1>{selected.title}</h1><p>Submitted by <b>{selected.studentName}</b> · {selected.courseTitle}</p></div>
          <span className={`tp-status is-${selected.status}`}>{labels[selected.status] || selected.status}</span>
          {selected.links?.demo && <a href={selected.links.demo} target="_blank" rel="noreferrer">Open live demo <FiExternalLink /></a>}
        </header>

        <div className="tp-summary-bar">
          <span>Submitted {new Date(selected.submittedAt).toLocaleDateString()}</span>
          <span><FiUsers /> {selected.team.length || 1} team member(s)</span>
          <span>Version {selected.version || 1}</span>
          <span>Last updated {new Date(selected.updatedAt).toLocaleDateString()}</span>
        </div>

        <div className="tp-detail-grid">
          <main className="tp-detail-main">
            <section><h2>Project overview</h2><p>{selected.description || 'No description provided.'}</p>
              <div className="tp-overview-columns"><div><h3>Problem</h3><p>{selected.problem || 'No problem statement provided.'}</p></div><div><h3>Solution</h3><p>{selected.solution || selected.description || 'No solution statement provided.'}</p></div></div>
              <div className="tp-tags">{selected.techStack.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </section>
            <section><h2>Team members</h2>{selected.team.length ? selected.team.map((member) => <div className="tp-team-row" key={member.name}><span>{member.name.slice(0, 1)}</span><b>{member.name}</b><small>{member.role}</small></div>) : <p>No team information.</p>}</section>
            <section><h2>Files & links</h2>
              {materials.map(([name, url, icon]) => <a className="tp-material" href={url} target="_blank" rel="noreferrer" key={name}>{icon}<span><b>{name}</b><small>{url}</small></span>Open <FiExternalLink /></a>)}
              {selected.files.map((file) => <a className="tp-material" href={file.dataUrl || '#'} download={file.name} key={file.id || file.name}><FiFileText /><span><b>{file.name}</b><small>{Math.round((file.size || 0) / 1024)} KB</small></span>Download <FiDownload /></a>)}
              {!materials.length && !selected.files.length && <p>No files or links attached.</p>}
            </section>
            <section><h2>Review history</h2>{selected.auditLog.slice().reverse().map((item) => <div className="tp-history" key={item.id}><i /><div><b>{item.action}</b><small>{item.actor} · {new Date(item.at).toLocaleString()}</small></div></div>)}</section>
          </main>

          <aside className="tp-evaluation">
            <section><div className="tp-score-title"><h2>Project evaluation</h2><strong>{total}<small>/100</small></strong></div>
              {PROJECT_RUBRIC.map((row) => <div className="tp-rubric" key={row.id}><label>{row.label}<span>/ {row.max}</span></label><div><input type="number" min="0" max={row.max} value={scores[row.id] ?? ''} onChange={(event) => setScores((current) => ({ ...current, [row.id]: Math.min(row.max, Math.max(0, Number(event.target.value))) }))} /><input value={notes[row.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))} placeholder="Criterion note" /></div></div>)}
            </section>
            <section><h2>Feedback to team</h2><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Write clear, actionable feedback..." /><label className="tp-check"><input type="checkbox" checked={notifyTeam} onChange={(event) => setNotifyTeam(event.target.checked)} /> Notify all team members</label><label>Changes deadline<input type="date" value={changesDueAt} onChange={(event) => setChangesDueAt(event.target.value)} /></label><label>Private trainer note<textarea value={privateNote} onChange={(event) => setPrivateNote(event.target.value)} placeholder="Only trainers can see this note." /></label></section>
            <section className="tp-decisions"><h2>Review decision</h2>{notice && <p>{notice}</p>}<div><button className="approve" onClick={approve}><FiCheck /> Approve & publish</button><button className="changes" onClick={requestChanges}>Request changes</button><button onClick={saveDraft}>Save draft</button></div>{selected.status === PROJECT_STATUS.PUBLISHED && <button className="tp-unpublish" onClick={() => { unpublishProject(selected.id, actor); setNotice('Project removed from the student gallery.'); }}>Unpublish project</button>}<button className="tp-delete-link" onClick={() => setDeleteOpen(true)}><FiTrash2 /> Delete project</button><small>Deletion is temporary and requires a reason.</small></section>
          </aside>
        </div>

        {deleteOpen && <div className="tp-modal"><form onSubmit={(event) => { event.preventDefault(); const result = deleteProject(selected.id, deleteReason, actor); if (result.ok) { setDeleteOpen(false); setSelectedId(null); } }}><button type="button" className="tp-modal-x" onClick={() => setDeleteOpen(false)}><FiX /></button><h2>Delete project?</h2><p>This is a soft delete. The audit history and evaluation remain available to administrators.</p><label>Deletion reason *<textarea required value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} /></label><div><button type="button" onClick={() => setDeleteOpen(false)}>Cancel</button><button className="danger">Confirm delete</button></div></form></div>}
      </div>
    );
  }

  return (
    <div className="trainer-projects-page">
      <header className="tp-page-header"><div><span>PROJECT MANAGEMENT</span><h1>Projects</h1><p>Review submissions, guide teams, and publish outstanding work.</p></div><div><button className="primary" onClick={() => setCreateOpen(true)}><FiPlus /> Add project</button><button onClick={exportProjectsReport}><FiDownload /> Export report</button></div></header>
      <div className="tp-stats"><article><strong>{counts.pending}</strong><span>Awaiting review</span></article><article><strong>{counts.changes}</strong><span>Need changes</span></article><article><strong>{counts.published}</strong><span>Published</span></article></div>
      <section className="tp-list-card">
        <div className="tp-toolbar"><label><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project or student" /></label><select value={course} onChange={(event) => setCourse(event.target.value)}><option value="all">All courses</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
        <div className="tp-table-head"><span>Project</span><span>Student / team</span><span>Course</span><span>Status</span><span>Score</span><span>Action</span></div>
        {filtered.map((project) => <button className="tp-project-row" type="button" key={project.id} onClick={() => openProject(project)}><span><b>{project.title}</b><small>{new Date(project.submittedAt).toLocaleDateString()}</small></span><span>{project.studentName}</span><span>{project.courseTitle}</span><span><i className={`tp-status is-${project.status}`}>{labels[project.status] || project.status}</i></span><span>{project.evaluation?.draft === false ? `${project.evaluation.total}/100` : '—'}</span><span>View details <FiMoreHorizontal /></span></button>)}
        {!filtered.length && <div className="tp-empty">No projects match these filters.</div>}
      </section>

      {createOpen && <div className="tp-modal"><form onSubmit={createProject}><button type="button" className="tp-modal-x" onClick={() => setCreateOpen(false)}><FiX /></button><h2>Add project to platform</h2><p>Create a complete project record, then publish it now or keep it unpublished.</p><div className="tp-form-grid"><label>Project title *<input required value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} /></label><label>Course *<input required value={projectForm.courseTitle} onChange={(event) => setProjectForm({ ...projectForm, courseTitle: event.target.value })} /></label><label>Category<select value={projectForm.category} onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })}><option>Web Development</option><option>Mobile Development</option><option>Artificial Intelligence</option><option>Cyber Security</option><option>Data Science</option><option>UI/UX Design</option></select></label><label>Author / team<input value={projectForm.studentName} onChange={(event) => setProjectForm({ ...projectForm, studentName: event.target.value })} /></label><label className="full">Description *<textarea required value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} /></label><label>Problem<input value={projectForm.problem} onChange={(event) => setProjectForm({ ...projectForm, problem: event.target.value })} /></label><label>Solution<input value={projectForm.solution} onChange={(event) => setProjectForm({ ...projectForm, solution: event.target.value })} /></label><label className="full">Technologies (comma separated)<input value={projectForm.techStack} onChange={(event) => setProjectForm({ ...projectForm, techStack: event.target.value })} placeholder="React, Node.js, PostgreSQL" /></label><label>Live demo<input type="url" value={projectForm.demo} onChange={(event) => setProjectForm({ ...projectForm, demo: event.target.value })} /></label><label>GitHub<input type="url" value={projectForm.github} onChange={(event) => setProjectForm({ ...projectForm, github: event.target.value })} /></label><label>Presentation<input type="url" value={projectForm.presentation} onChange={(event) => setProjectForm({ ...projectForm, presentation: event.target.value })} /></label><label>Documentation<input type="url" value={projectForm.documentation} onChange={(event) => setProjectForm({ ...projectForm, documentation: event.target.value })} /></label><label className="full tp-check"><input type="checkbox" checked={projectForm.publishNow} onChange={(event) => setProjectForm({ ...projectForm, publishNow: event.target.checked })} /> Publish immediately in the student gallery</label></div><div><button type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primary">{projectForm.publishNow ? 'Add & publish' : 'Save unpublished'}</button></div></form></div>}
    </div>
  );
};

export default TrainerProjects;
