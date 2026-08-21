import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiFileText,
  FiGithub,
  FiImage,
  FiLink,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiVideo,
  FiX,
} from 'react-icons/fi';
import { PROJECT_STATUS, useProjects } from './ProjectsContext';

const blankMember = { name: '', role: '', specialty: '' };
const initialForm = (student, project) => ({
  id: project?.id || '',
  title: project?.title || '',
  courseTitle: project?.courseTitle || '',
  category: project?.category || '',
  projectType: project?.projectType || 'individual',
  idea: project?.idea || project?.description || '',
  description: project?.description || '',
  problem: project?.problem || '',
  solution: project?.solution || '',
  techStackText: project?.techStack?.join(', ') || '',
  studentName: project?.studentName || student?.displayName || 'Student',
  studentEmail: project?.studentEmail || student?.email || '',
  team: project?.team || [],
  links: { github: '', demo: '', video: '', presentation: '', documentation: '', ...(project?.links || {}) },
  media: { logo: null, cover: null, video: null, ...(project?.media || {}) },
  files: project?.files || [],
  status: project?.status || PROJECT_STATUS.DRAFT,
});

const readAsset = (file) => new Promise((resolve) => {
  if (!file) return resolve(null);
  const asset = { id: `${Date.now()}-${file.name}`, name: file.name, type: file.type, size: file.size, dataUrl: '' };
  const reader = new FileReader();

  reader.onerror = () => resolve(asset);
  reader.onload = () => {
    if (!file.type.startsWith('image/')) {
      resolve(file.size <= 1_500_000 ? { ...asset, dataUrl: reader.result } : asset);
      return;
    }

    const image = new Image();
    image.onerror = () => resolve({ ...asset, dataUrl: reader.result });
    image.onload = () => {
      const maxDimension = 1400;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve({ ...asset, dataUrl: canvas.toDataURL('image/webp', 0.82) });
    };
    image.src = reader.result;
  };

  reader.readAsDataURL(file);
});

function ProjectWizard({ studentData, initialProject, onClose, onFinished }) {
  const { saveProjectDraft, submitProjectForReview, deleteDraftProject } = useProjects();
  const [form, setForm] = useState(() => initialForm(studentData, initialProject));
  const [member, setMember] = useState(blankMember);
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState({});
  const [projectId, setProjectId] = useState(initialProject?.id || '');

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateLink = (key, value) => setForm((current) => ({ ...current, links: { ...current.links, [key]: value } }));
  const payload = useMemo(() => ({
    ...form,
    id: projectId || form.id,
    description: form.description || form.idea,
    techStack: form.techStackText.split(',').map((item) => item.trim()).filter(Boolean),
    team: form.projectType === 'individual'
      ? [{ id: 'owner', name: form.studentName, role: 'Project owner', specialty: studentData?.major || 'Student' }]
      : form.team,
  }), [form, projectId, studentData?.major]);

  useEffect(() => {
    if (!form.title && !form.idea) return undefined;
    const timer = window.setTimeout(() => {
      const id = saveProjectDraft(payload);
      setProjectId(id);
      if (!form.id) setForm((current) => ({ ...current, id }));
      setNotice('Draft saved automatically');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [form, payload, saveProjectDraft]);

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Project title is required.';
    if (!form.category) next.category = 'Choose a category.';
    if (!form.idea.trim()) next.idea = 'Project idea is required.';
    if (form.projectType === 'team' && !form.team.length) next.team = 'Add at least one team member.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveDraft = () => {
    const id = saveProjectDraft(payload);
    setProjectId(id);
    setNotice('Draft saved successfully.');
    return id;
  };

  const submit = () => {
    if (!validate()) return;
    const id = saveDraft();
    const result = submitProjectForReview(id, studentData?.email);
    if (result.ok) onFinished(id);
    else setNotice(result.error);
  };

  const addMember = () => {
    if (!member.name.trim() || !member.role.trim()) return;
    update('team', [...form.team, { ...member, id: `member-${Date.now()}` }]);
    setMember(blankMember);
  };

  const setMedia = (key) => async (event) => {
    const asset = await readAsset(event.target.files?.[0]);
    if (asset) setForm((current) => ({ ...current, media: { ...current.media, [key]: asset } }));
  };

  const removeMedia = (key) => {
    setForm((current) => ({
      ...current,
      media: { ...current.media, [key]: null },
    }));
  };

  const addFile = (kind) => async (event) => {
    const asset = await readAsset(event.target.files?.[0]);
    if (asset) setForm((current) => ({ ...current, files: [...current.files.filter((file) => file.kind !== kind), { ...asset, kind }] }));
  };

  const deleteDraft = () => {
    if (!projectId || !window.confirm('Delete this draft project?')) return;
    const result = deleteDraftProject(projectId, studentData?.email);
    if (result.ok) onClose(); else setNotice(result.error);
  };

  return (
    <div className="sp-page sp-wizard">
      <header className="sp-wizard-header"><div><button className="sp-back" onClick={onClose}><FiArrowLeft /> Back to my projects</button><h1>{initialProject ? 'Edit project' : 'Add new project'}</h1><p>Add the project information, team, media, and links.</p></div><span>{notice || 'Draft saved automatically'}</span></header>

      <section className="sp-form-section"><h2>1. Project information</h2><div className="sp-form-grid">
        <label>Project title *<input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Enter project title" />{errors.title && <small>{errors.title}</small>}</label>
        <label>Course<input value={form.courseTitle} onChange={(event) => update('courseTitle', event.target.value)} placeholder="Course or learning path" /></label>
        <label>Category *<select value={form.category} onChange={(event) => update('category', event.target.value)}><option value="">Select category</option><option>Web Development</option><option>Mobile Development</option><option>Artificial Intelligence</option><option>Cyber Security</option><option>Data Science</option><option>UI/UX Design</option></select>{errors.category && <small>{errors.category}</small>}</label>
        <label>Project type<div className="sp-segment"><button type="button" className={form.projectType === 'individual' ? 'active' : ''} onClick={() => update('projectType', 'individual')}>Individual</button><button type="button" className={form.projectType === 'team' ? 'active' : ''} onClick={() => update('projectType', 'team')}>Team</button></div></label>
        <label className="full">Project idea *<textarea value={form.idea} onChange={(event) => update('idea', event.target.value)} placeholder="Describe the idea and what makes it useful..." />{errors.idea && <small>{errors.idea}</small>}</label>
        <label>Problem<textarea value={form.problem} onChange={(event) => update('problem', event.target.value)} placeholder="What problem does your project solve?" /></label>
        <label>Solution<textarea value={form.solution} onChange={(event) => update('solution', event.target.value)} placeholder="How does your project solve this problem?" /></label>
        <label className="full">Technologies<input value={form.techStackText} onChange={(event) => update('techStackText', event.target.value)} placeholder="React, Node.js, PostgreSQL" /></label>
      </div></section>

      <section className="sp-form-section sp-media-section">
        <div className="sp-section-heading">
          <span>02</span>
          <div><h2>Project image & media</h2><p>Add a clear image that will appear on the project card.</p></div>
        </div>

        <div className="sp-media-editor">
          <div className="sp-project-image-card">
            <div className="sp-project-image-preview">
              {form.media.cover?.dataUrl ? (
                <img src={form.media.cover.dataUrl} alt="Project preview" />
              ) : (
                <div className="sp-project-image-placeholder">
                  <FiImage />
                  <strong>Project image</strong>
                  <span>Recommended size: 1200 × 700 px</span>
                </div>
              )}
            </div>
            <div className="sp-project-image-copy">
              <div><strong>Project cover image</strong><small>PNG, JPG or WEBP · Max 5 MB</small></div>
              <div className="sp-media-actions">
                <label className="sp-upload-action"><FiUpload /> {form.media.cover ? 'Change image' : 'Add image'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={setMedia('cover')} /></label>
                {form.media.cover && <button type="button" onClick={() => removeMedia('cover')}><FiX /> Remove</button>}
              </div>
            </div>
          </div>

          <div className="sp-secondary-media">
            <label className="sp-media-tile">
              <span className="sp-media-tile-icon"><FiImage /></span>
              <span><strong>{form.media.logo?.name || 'Project logo'}</strong><small>Square PNG or JPG · Max 2 MB</small></span>
              <b><FiUpload /> {form.media.logo ? 'Replace' : 'Upload logo'}</b>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={setMedia('logo')} />
            </label>
            <label className="sp-media-tile">
              <span className="sp-media-tile-icon"><FiVideo /></span>
              <span><strong>{form.media.video?.name || 'Short introduction video'}</strong><small>MP4 or WebM · 60–120 seconds</small></span>
              <b><FiUpload /> {form.media.video ? 'Replace' : 'Upload video'}</b>
              <input type="file" accept="video/mp4,video/webm" onChange={setMedia('video')} />
            </label>
          </div>
        </div>
      </section>

      <section className="sp-form-section"><h2>3. Team members</h2>{form.projectType === 'individual' ? <div className="sp-owner-row"><span>{form.studentName}</span><b>Project owner</b><small>{studentData?.major || 'Student'}</small></div> : <><div className="sp-member-inputs"><input value={member.name} onChange={(event) => setMember({ ...member, name: event.target.value })} placeholder="Name" /><input value={member.role} onChange={(event) => setMember({ ...member, role: event.target.value })} placeholder="Role" /><input value={member.specialty} onChange={(event) => setMember({ ...member, specialty: event.target.value })} placeholder="Specialization" /><button type="button" onClick={addMember}><FiPlus /> Add member</button></div>{form.team.map((item) => <div className="sp-team-edit-row" key={item.id}><span>{item.name}</span><span>{item.role}</span><span>{item.specialty}</span><button type="button" onClick={() => update('team', form.team.filter((entry) => entry.id !== item.id))}><FiTrash2 /></button></div>)}{errors.team && <p className="sp-form-error">{errors.team}</p>}</>}</section>

      <section className="sp-form-section"><h2>4. Files & links</h2><div className="sp-form-grid">
        <label><FiGithub /> GitHub repository URL<input type="url" value={form.links.github} onChange={(event) => updateLink('github', event.target.value)} placeholder="https://github.com/username/repository" /></label>
        <label><FiLink /> Live project URL<input type="url" value={form.links.demo} onChange={(event) => updateLink('demo', event.target.value)} placeholder="https://your-project.com" /></label>
        <label><FiFileText /> Presentation file<input type="file" accept=".pdf,.ppt,.pptx" onChange={addFile('presentation')} />{form.files.find((file) => file.kind === 'presentation') && <small>{form.files.find((file) => file.kind === 'presentation').name}</small>}</label>
        <label><FiFileText /> Documentation / SRS<input type="file" accept=".pdf,.doc,.docx" onChange={addFile('documentation')} />{form.files.find((file) => file.kind === 'documentation') && <small>{form.files.find((file) => file.kind === 'documentation').name}</small>}</label>
      </div></section>

      <footer className="sp-wizard-footer"><div>{initialProject?.status === PROJECT_STATUS.DRAFT && <button className="sp-danger-link" onClick={deleteDraft}>Delete draft</button>}</div><div><button className="sp-outline-btn" onClick={saveDraft}>Save draft</button><button className="sp-primary-btn" onClick={submit}>Submit for review</button></div></footer>
    </div>
  );
}

export default ProjectWizard;
