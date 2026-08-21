/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ProjectsContext = createContext(null);
const STORAGE_KEY = 'trainerProjects_v2';
const LEGACY_KEY = 'trainerProjects_v1';
const LIKES_KEY = 'galleryLikedProjects_v1';
const RATINGS_KEY = 'galleryProjectRatings_v1';
const now = () => new Date().toISOString();
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending-review',
  CHANGES: 'changes-requested',
  RESUBMITTED: 'resubmitted',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  DELETED: 'deleted',
};

export const PROJECT_RUBRIC = [
  { id: 'impact', label: 'Idea & impact', max: 25 },
  { id: 'quality', label: 'Technical quality', max: 30 },
  { id: 'experience', label: 'User experience', max: 20 },
  { id: 'documentation', label: 'Documentation', max: 15 },
  { id: 'presentation', label: 'Presentation & delivery', max: 10 },
];

const seedProjects = [
  {
    id: 1, courseId: 1, courseTitle: 'Software Engineering', category: 'Web Development',
    studentName: 'Mohammed Ali', studentEmail: 'mohammed@university.edu.sa',
    title: 'E-Commerce Microservices Architecture',
    description: 'A scalable commerce platform with service boundaries, API gateway design, and deployment documentation.',
    techStack: ['React', 'Node.js', 'Docker'], team: [{ name: 'Mohammed Ali', role: 'Developer' }],
    links: { github: 'https://github.com/', demo: 'https://example.com', presentation: '', documentation: '' },
    files: [{ id: 'f-1', name: 'architecture-documentation.pdf', type: 'application/pdf', size: 840000 }],
    status: PROJECT_STATUS.PENDING, submittedAt: '2026-08-09T09:00:00', createdAt: '2026-08-09T09:00:00',
  },
  {
    id: 2, courseId: 4, courseTitle: 'Advanced UI/UX Design', category: 'UI/UX Design',
    studentName: 'Maha Khaled', studentEmail: 'maha@university.edu.sa',
    title: 'Mobile Banking App Redesign',
    description: 'A complete UX case study with research, prototypes, testing results, and a polished presentation.',
    techStack: ['Figma', 'Research'], team: [{ name: 'Maha Khaled', role: 'UX Designer' }],
    links: { github: '', demo: 'https://example.com', presentation: 'https://example.com', documentation: '' },
    files: [], status: PROJECT_STATUS.CHANGES, feedback: 'Add usability test evidence and update the final prototype.',
    submittedAt: '2026-08-07T14:30:00', createdAt: '2026-08-07T14:30:00',
  },
  {
    id: 3, courseId: 5, courseTitle: 'Full-Stack Web Development', category: 'Web Development',
    studentName: 'Omar Fares', studentEmail: 'omar@university.edu.sa', title: 'Task Management Platform',
    description: 'A deployed task management platform with authentication and documented APIs.',
    techStack: ['React', 'Express', 'MongoDB'], team: [{ name: 'Omar Fares', role: 'Full-stack Developer' }],
    links: { github: 'https://github.com/', demo: 'https://example.com', presentation: '', documentation: '' },
    files: [], status: PROJECT_STATUS.PUBLISHED, publishedAt: '2026-08-06T11:00:00',
    submittedAt: '2026-08-04T11:00:00', createdAt: '2026-08-04T11:00:00',
    evaluation: { scores: { quality: 23, innovation: 21, experience: 22, documentation: 20 }, total: 86, draft: false },
  },
];

const normalize = (project) => {
  const legacyStatus = { pending: PROJECT_STATUS.PENDING, approved: PROJECT_STATUS.PUBLISHED, rejected: PROJECT_STATUS.CHANGES };
  const legacyScores = project.evaluation?.scores || {};
  const normalizedScores = legacyScores.impact === undefined && legacyScores.innovation !== undefined
    ? {
        impact: legacyScores.innovation,
        quality: Math.min(30, Number(legacyScores.quality) || 0),
        experience: Math.min(20, Number(legacyScores.experience) || 0),
        documentation: Math.min(15, Number(legacyScores.documentation) || 0),
        presentation: 0,
      }
    : legacyScores;
  return {
    id: project.id || uid('project'),
    courseId: project.courseId || '', courseTitle: project.courseTitle || project.course || 'General',
    category: project.category || 'Web Development', studentName: project.studentName || 'Compass Academy',
    studentEmail: project.studentEmail || '', title: project.title || 'Untitled project',
    description: project.description || '', problem: project.problem || '', solution: project.solution || '',
    idea: project.idea || project.description || '', projectType: project.projectType || (project.team?.length > 1 ? 'team' : 'individual'),
    version: Number(project.version) || 1, techStack: Array.isArray(project.techStack) ? project.techStack : [],
    team: Array.isArray(project.team) ? project.team.map((member) => typeof member === 'string' ? { name: member, role: 'Team member' } : member) : [],
    links: { github: '', demo: project.fileUrl || '', presentation: '', documentation: '', ...(project.links || {}) },
    files: Array.isArray(project.files) ? project.files : [],
    media: { logo: null, cover: null, video: null, ...(project.media || {}) },
    likes: Number(project.likes) || 0,
    status: legacyStatus[project.status] || project.status || PROJECT_STATUS.PENDING,
    evaluation: project.evaluation
      ? { ...project.evaluation, scores: normalizedScores }
      : { scores: {}, notes: {}, total: 0, draft: true },
    feedback: project.feedback || '', privateNote: project.privateNote || '', notifyTeam: Boolean(project.notifyTeam),
    submittedAt: project.submittedAt || now(), createdAt: project.createdAt || project.submittedAt || now(),
    updatedAt: project.updatedAt || project.submittedAt || now(), publishedAt: project.publishedAt || null,
    deletedAt: project.deletedAt || null, deleteReason: project.deleteReason || '',
    auditLog: Array.isArray(project.auditLog) ? project.auditLog : [{ id: uid('activity'), action: 'Project submitted', at: project.submittedAt || now(), actor: project.studentName || 'Student' }],
  };
};

const loadProjects = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    return (saved ? JSON.parse(saved) : seedProjects).map(normalize);
  } catch { return seedProjects.map(normalize); }
};

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState(loadProjects);
  const [likedIds, setLikedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LIKES_KEY) || '[]'); } catch { return []; }
  });
  const [ratings, setRatings] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}'); } catch { return {}; }
  });

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem(LIKES_KEY, JSON.stringify(likedIds)), [likedIds]);
  useEffect(() => localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings)), [ratings]);

  const mutate = useCallback((id, updater) => setProjects((current) => current.map((item) =>
    String(item.id) === String(id) ? { ...updater(item), updatedAt: now() } : item)), []);
  const activity = (item, action, actor = 'Trainer') => ({
    ...item, auditLog: [...item.auditLog, { id: uid('activity'), action, actor, at: now() }],
  });

  const getTrainerProjects = useCallback(() => projects.filter((item) => item.status !== PROJECT_STATUS.DELETED), [projects]);
  const getStudentProjects = useCallback((studentEmail = '') => {
    const email = studentEmail.trim().toLowerCase();
    return projects.filter((item) => item.status !== PROJECT_STATUS.DELETED && (
      item.status === PROJECT_STATUS.PUBLISHED || item.studentEmail?.toLowerCase() === email
    ));
  }, [projects]);
  const filterProjects = useCallback(({ query = '', course = 'all', status = 'all' } = {}) => {
    const needle = query.trim().toLowerCase();
    return getTrainerProjects().filter((item) =>
      (!needle || `${item.title} ${item.studentName} ${item.courseTitle}`.toLowerCase().includes(needle)) &&
      (course === 'all' || String(item.courseId) === String(course)) &&
      (status === 'all' || item.status === status));
  }, [getTrainerProjects]);
  const getProjectDetails = useCallback((id) => projects.find((item) => String(item.id) === String(id)) || null, [projects]);
  const getProjectById = getProjectDetails;
  const calculateProjectScore = useCallback((scores = {}) => PROJECT_RUBRIC.reduce((sum, row) => sum + Math.min(row.max, Math.max(0, Number(scores[row.id]) || 0)), 0), []);
  const saveProjectReview = useCallback((id, review, actor = 'Trainer') => mutate(id, (item) => activity({
    ...item, evaluation: { scores: review.scores || {}, notes: review.notes || {}, total: calculateProjectScore(review.scores), draft: true },
    feedback: review.feedback ?? item.feedback, privateNote: review.privateNote ?? item.privateNote,
    notifyTeam: review.notifyTeam ?? item.notifyTeam,
  }, 'Evaluation saved as draft', actor)), [calculateProjectScore, mutate]);
  const requestProjectChanges = useCallback((id, feedback, dueAt, actor = 'Trainer') => mutate(id, (item) => activity({
    ...item, status: PROJECT_STATUS.CHANGES, feedback, changesDueAt: dueAt || null,
  }, `Changes requested${dueAt ? ` · due ${dueAt}` : ''}`, actor)), [mutate]);
  const approveAndPublishProject = useCallback((id, review = {}, actor = 'Trainer') => mutate(id, (item) => activity({
    ...item, status: PROJECT_STATUS.PUBLISHED, publishedAt: now(), feedback: review.feedback ?? item.feedback,
    privateNote: review.privateNote ?? item.privateNote, notifyTeam: review.notifyTeam ?? item.notifyTeam,
    evaluation: { ...(item.evaluation || {}), scores: review.scores || item.evaluation?.scores || {}, notes: review.notes || item.evaluation?.notes || {}, total: calculateProjectScore(review.scores || item.evaluation?.scores), draft: false },
  }, 'Project approved and published to student gallery', actor)), [calculateProjectScore, mutate]);
  const unpublishProject = useCallback((id, actor = 'Trainer') => mutate(id, (item) => activity({ ...item, status: PROJECT_STATUS.UNPUBLISHED, publishedAt: null }, 'Project removed from public gallery', actor)), [mutate]);
  const deleteProject = useCallback((id, reason = '', actor = 'Trainer') => {
    if (!reason.trim()) return { ok: false, error: 'Deletion reason is required.' };
    mutate(id, (item) => activity({ ...item, status: PROJECT_STATUS.DELETED, deletedAt: now(), deleteReason: reason }, `Project soft deleted · ${reason}`, actor));
    return { ok: true };
  }, [mutate]);
  const getProjectActivity = useCallback((id) => getProjectDetails(id)?.auditLog || [], [getProjectDetails]);
  const addTrainerProject = useCallback((data, actor = 'Trainer') => {
    const item = normalize({ ...data, id: uid('project'), studentName: data.studentName || 'Compass Academy', status: data.status || PROJECT_STATUS.PUBLISHED, submittedAt: now(), createdAt: now() });
    item.auditLog = [{ id: uid('activity'), action: item.status === PROJECT_STATUS.PUBLISHED ? 'Project added and published by trainer' : 'Project created by trainer', actor, at: now() }];
    setProjects((current) => [item, ...current]); return item;
  }, []);
  const createProject = useCallback((data) => {
    const item = normalize({ ...data, id: data.id || uid('project'), status: PROJECT_STATUS.DRAFT, createdAt: now(), submittedAt: null });
    item.auditLog = [{ id: uid('activity'), action: 'Draft created', actor: item.studentName, at: now() }];
    setProjects((current) => [item, ...current]);
    return item.id;
  }, []);
  const updateProject = useCallback((id, data, actorEmail = '') => {
    const current = projects.find((item) => String(item.id) === String(id));
    if (!current) return { ok: false, error: 'Project not found.' };
    if (actorEmail && current.studentEmail?.toLowerCase() !== actorEmail.toLowerCase()) return { ok: false, error: 'Only the project owner can edit this project.' };
    mutate(id, (item) => activity({ ...item, ...data, id: item.id, version: (item.version || 1) + 1 }, 'Project details updated', item.studentName));
    return { ok: true, id };
  }, [mutate, projects]);
  const saveProjectDraft = useCallback((data) => {
    const existing = data.id
      ? projects.find((item) => String(item.id) === String(data.id))
      : null;
    if (existing) {
      const draftStatus = existing.status === PROJECT_STATUS.CHANGES
        ? PROJECT_STATUS.CHANGES
        : PROJECT_STATUS.DRAFT;
      updateProject(data.id, { ...data, status: draftStatus }, data.studentEmail);
      return data.id;
    }
    return createProject(data);
  }, [createProject, projects, updateProject]);
  const submitProjectForReview = useCallback((id, actorEmail = '') => {
    const current = projects.find((item) => String(item.id) === String(id));
    if (!current) return { ok: false, error: 'Project not found.' };
    if (actorEmail && current.studentEmail?.toLowerCase() !== actorEmail.toLowerCase()) return { ok: false, error: 'Only the project owner can submit this project.' };
    mutate(id, (item) => activity({ ...item, status: item.status === PROJECT_STATUS.CHANGES ? PROJECT_STATUS.RESUBMITTED : PROJECT_STATUS.PENDING, submittedAt: now() }, 'Project submitted for trainer review', item.studentName));
    return { ok: true, id };
  }, [mutate, projects]);
  const deleteDraftProject = useCallback((id, actorEmail = '') => {
    const current = projects.find((item) => String(item.id) === String(id));
    if (!current || current.status !== PROJECT_STATUS.DRAFT) return { ok: false, error: 'Only draft projects can be deleted.' };
    if (actorEmail && current.studentEmail?.toLowerCase() !== actorEmail.toLowerCase()) return { ok: false, error: 'Only the project owner can delete this draft.' };
    setProjects((items) => items.filter((item) => String(item.id) !== String(id)));
    return { ok: true };
  }, [projects]);
  const submitProject = useCallback((data) => {
    const item = normalize({ ...data, id: uid('project'), status: PROJECT_STATUS.PENDING, submittedAt: now() });
    setProjects((current) => [item, ...current]); return item;
  }, []);
  const resubmitProject = useCallback((id, changes = {}) => mutate(id, (item) => activity({ ...item, ...changes, status: PROJECT_STATUS.RESUBMITTED, submittedAt: now() }, 'Project resubmitted', item.studentName)), [mutate]);
  const exportProjectsReport = useCallback(() => {
    const rows = [['Project', 'Student', 'Course', 'Status', 'Score', 'Submitted'], ...getTrainerProjects().map((item) => [item.title, item.studentName, item.courseTitle, item.status, item.evaluation?.total ?? '', item.submittedAt])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'projects-report.csv'; link.click(); URL.revokeObjectURL(url);
  }, [getTrainerProjects]);

  const publishedProjects = useMemo(() => projects.filter((item) => item.status === PROJECT_STATUS.PUBLISHED), [projects]);
  const isLiked = useCallback((id) => likedIds.includes(id), [likedIds]);
  const toggleLike = useCallback((id) => setLikedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]), []);
  const rateProject = useCallback((id, viewerEmail, value) => {
    const viewer = viewerEmail || 'guest';
    const safeValue = Math.min(5, Math.max(1, Number(value) || 1));
    setRatings((current) => ({ ...current, [id]: { ...(current[id] || {}), [viewer]: safeValue } }));
  }, []);
  const getProjectRating = useCallback((id, viewerEmail = 'guest') => {
    const projectRatings = ratings[id] || {};
    const values = Object.values(projectRatings).map(Number).filter(Boolean);
    return {
      mine: Number(projectRatings[viewerEmail] || 0),
      average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
      count: values.length,
    };
  }, [ratings]);

  const value = {
    projects, publishedProjects, getTrainerProjects, getStudentProjects, filterProjects, getProjectDetails, getProjectById,
    saveProjectReview, calculateProjectScore, requestProjectChanges, approveAndPublishProject,
    unpublishProject, deleteProject, getProjectActivity, exportProjectsReport, addTrainerProject,
    createProject, saveProjectDraft, updateProject, submitProjectForReview, deleteDraftProject,
    submitProject, resubmitProject, isLiked, toggleLike, rateProject, getProjectRating,
    saveDraft: saveProjectDraft,
    approveProject: approveAndPublishProject,
    rejectProject: (id) => requestProjectChanges(id, 'Please revise the project and resubmit.'),
  };
  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error('useProjects must be used within a ProjectsProvider');
  return context;
};
