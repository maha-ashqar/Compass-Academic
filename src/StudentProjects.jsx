import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiArrowRight, FiEdit3, FiExternalLink, FiFileText,
  FiGithub, FiHeart, FiPlay, FiPlus, FiStar, FiUser, FiUsers,
} from 'react-icons/fi';
import { PROJECT_STATUS, useProjects } from './ProjectsContext';
import ProjectWizard from './ProjectWizard';
import './StudentProjects.css';

const statusLabels = {
  [PROJECT_STATUS.DRAFT]: 'Draft',
  [PROJECT_STATUS.PENDING]: 'In review',
  [PROJECT_STATUS.CHANGES]: 'Changes requested',
  [PROJECT_STATUS.RESUBMITTED]: 'Resubmitted',
  [PROJECT_STATUS.PUBLISHED]: 'Published',
  [PROJECT_STATUS.UNPUBLISHED]: 'Unpublished',
};

const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const projectKey = (value) => String(value).replace(/^trainer-/, '');

function StudentProjects({ studentData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    getStudentProjects, getProjectById, isLiked, toggleLike,
    rateProject, getProjectRating,
  } = useProjects();

  const email = studentData?.email || '';
  const path = location.pathname;
  const isNew = path.endsWith('/projects/new');
  const editMatch = path.match(/\/projects\/([^/]+)\/edit$/);
  const detailMatch = path.match(/\/projects\/([^/]+)$/);
  const selectedId = projectKey(editMatch?.[1] || detailMatch?.[1] || '');
  const selectedProject = selectedId ? getProjectById(selectedId) : null;
  const isOwner = Boolean(selectedProject && selectedProject.studentEmail?.toLowerCase() === email.toLowerCase());

  const projects = useMemo(() => getStudentProjects(email).sort((a, b) => {
    const ownerA = a.studentEmail?.toLowerCase() === email.toLowerCase() ? 1 : 0;
    const ownerB = b.studentEmail?.toLowerCase() === email.toLowerCase() ? 1 : 0;
    return ownerB - ownerA || new Date(b.updatedAt) - new Date(a.updatedAt);
  }), [email, getStudentProjects]);

  const goList = () => navigate('/student-dashboard/projects');

  if (isNew || editMatch) {
    if (editMatch && (!selectedProject || !isOwner)) {
      return <div className="sp-empty"><h2>Editing is not available</h2><p>Only the student who created this project can edit it.</p><button onClick={goList}>Back to projects</button></div>;
    }
    return <ProjectWizard studentData={studentData} initialProject={editMatch ? selectedProject : null} onClose={goList} onFinished={(id) => navigate(`/student-dashboard/projects/${id}`)} />;
  }

  if (detailMatch) {
    if (!selectedProject || (selectedProject.status !== PROJECT_STATUS.PUBLISHED && !isOwner)) {
      return <div className="sp-empty"><h2>Project not found</h2><p>This project is not available to your account.</p><button onClick={goList}>Back to projects</button></div>;
    }

    const liked = isLiked(selectedProject.id);
    const rating = getProjectRating(selectedProject.id, email);
    const team = selectedProject.team?.length ? selectedProject.team : [{ name: selectedProject.studentName, role: 'Project owner', specialty: '' }];
    const files = selectedProject.files || [];
    const media = selectedProject.media || {};

    return (
      <div className="sp-page sp-detail-page">
        <button className="sp-back" onClick={goList}><FiArrowLeft /> Back to my projects</button>
        <header className="sp-detail-header">
          <div className="sp-logo">{media.logo?.dataUrl ? <img src={media.logo.dataUrl} alt="" /> : <span>◇</span>}</div>
          <div className="sp-detail-heading"><div><h1>{selectedProject.title}</h1><span className={`sp-status is-${selectedProject.status}`}>{statusLabels[selectedProject.status]}</span></div><p>{selectedProject.idea || selectedProject.description}</p></div>
          {isOwner && <button className="sp-outline-btn" onClick={() => navigate(`/student-dashboard/projects/${selectedProject.id}/edit`)}><FiEdit3 /> Edit project</button>}
        </header>

        <div className="sp-detail-layout">
          <main>
            <section className="sp-panel"><h2>About the project</h2><article><h3>Project idea</h3><p>{selectedProject.idea || selectedProject.description || 'No project idea provided.'}</p></article><article><h3>Problem</h3><p>{selectedProject.problem || 'No problem statement provided.'}</p></article><article><h3>Solution</h3><p>{selectedProject.solution || selectedProject.description || 'No solution statement provided.'}</p></article></section>

            <section className="sp-panel"><h2>Project media</h2>
              <div className="sp-media-cover">{media.cover?.dataUrl ? <img src={media.cover.dataUrl} alt={`${selectedProject.title} cover`} /> : <div className="sp-cover-art"><span /><span /><span /></div>}</div>
              {(media.video?.dataUrl || selectedProject.links?.video) && <a className="sp-video-row" href={media.video?.dataUrl || selectedProject.links.video} target="_blank" rel="noreferrer"><FiPlay /> <b>{media.video?.name || 'Project introduction'}</b><span>Watch video <FiExternalLink /></span></a>}
            </section>

            <section className="sp-panel"><h2>Files & links</h2>
              {selectedProject.links?.github && <a className="sp-file-row" href={selectedProject.links.github} target="_blank" rel="noreferrer"><FiGithub /><span>GitHub repository</span><b>Open <FiExternalLink /></b></a>}
              {selectedProject.links?.demo && <a className="sp-file-row" href={selectedProject.links.demo} target="_blank" rel="noreferrer"><FiExternalLink /><span>Live project</span><b>Open <FiExternalLink /></b></a>}
              {files.map((file) => <a className="sp-file-row" key={file.id || file.name} href={file.dataUrl || '#'} download={file.name}><FiFileText /><span>{file.name}</span><b>{file.dataUrl ? 'Download' : 'Attached'}</b></a>)}
              {!selectedProject.links?.github && !selectedProject.links?.demo && !files.length && <p className="sp-muted">No files or links were added.</p>}
            </section>
          </main>

          <aside>
            <section className="sp-panel"><h2>Project team</h2>{team.map((member) => <div className="sp-member" key={member.id || `${member.name}-${member.role}`}><span>{initials(member.name)}</span><div><b>{member.name}</b><small>{member.role || 'Team member'}{member.specialty ? ` · ${member.specialty}` : ''}</small></div></div>)}</section>
            <section className="sp-panel sp-meta"><h2>Project details</h2><dl><div><dt>Course</dt><dd>{selectedProject.courseTitle || 'Independent project'}</dd></div><div><dt>Category</dt><dd>{selectedProject.category}</dd></div><div><dt>Created</dt><dd>{new Date(selectedProject.createdAt).toLocaleDateString()}</dd></div><div><dt>Last updated</dt><dd>{new Date(selectedProject.updatedAt).toLocaleDateString()}</dd></div></dl><h3>Technology</h3><div className="sp-tags">{selectedProject.techStack?.map((tag) => <span key={tag}>{tag}</span>)}</div></section>
            <section className="sp-panel sp-reactions"><h2>Rate this project</h2><div className="sp-stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={value <= rating.mine ? 'active' : ''} onClick={() => rateProject(selectedProject.id, email, value)} aria-label={`Rate ${value} stars`}><FiStar /></button>)}</div><small>{rating.count ? `${rating.average.toFixed(1)} average from ${rating.count} rating(s)` : 'Be the first to rate this project'}</small><button className={`sp-like ${liked ? 'active' : ''}`} onClick={() => toggleLike(selectedProject.id)}><FiHeart /> {liked ? 'Liked' : 'Like project'}</button></section>
            <section className={`sp-review-box is-${selectedProject.status}`}><h2>Review status</h2><p>{selectedProject.status === PROJECT_STATUS.PUBLISHED ? 'This project was approved and published by the trainer.' : selectedProject.status === PROJECT_STATUS.CHANGES ? selectedProject.feedback || 'The trainer requested changes before publishing.' : selectedProject.status === PROJECT_STATUS.DRAFT ? 'This draft is visible only to its owner.' : 'The project is being reviewed by the trainer.'}</p>{selectedProject.submittedAt && <small>Submitted {new Date(selectedProject.submittedAt).toLocaleDateString()}</small>}</section>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      <header className="sp-list-header"><div><h1>My projects</h1><p>Manage your projects, explore published student work, and follow trainer feedback.</p></div><button className="sp-primary-btn" onClick={() => navigate('/student-dashboard/projects/new')}><FiPlus /> Add project</button></header>
      <div className="sp-grid">
        {projects.map((project, index) => {
          const owner = project.studentEmail?.toLowerCase() === email.toLowerCase();
          const action = owner && [PROJECT_STATUS.DRAFT, PROJECT_STATUS.CHANGES].includes(project.status) ? 'Continue editing' : 'Open project';
          return <article className={`sp-card theme-${index % 4}`} key={project.id} onClick={() => navigate(`/student-dashboard/projects/${project.id}`)}>
            <div className="sp-card-cover">{project.media?.cover?.dataUrl ? <img src={project.media.cover.dataUrl} alt="" /> : <div className="sp-card-illustration"><span /><span /><span /></div>}</div>
            <div className="sp-card-body"><h2>{project.title}</h2><p>{project.idea || project.description}</p><div className="sp-tags">{project.techStack?.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><div className="sp-card-meta"><span>{project.projectType === 'team' ? <FiUsers /> : <FiUser />}{project.team?.map((member) => member.name || member).join(', ') || project.studentName}</span><i className={`sp-status is-${project.status}`}>{statusLabels[project.status]}</i></div><button>{action} <FiArrowRight /></button></div>
          </article>;
        })}
      </div>
      {!projects.length && <div className="sp-empty"><h2>No projects yet</h2><p>Add your first project and submit it to the trainer for review.</p><button onClick={() => navigate('/student-dashboard/projects/new')}>Add project</button></div>}
    </div>
  );
}

export default StudentProjects;
