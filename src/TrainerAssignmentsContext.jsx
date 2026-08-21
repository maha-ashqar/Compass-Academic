/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TrainerAssignmentsContext = createContext(null);
const STORAGE_KEY = 'trainerAssignments_v1';
const SUBMISSIONS_KEY = 'assignmentSubmissions_v3';
const LEGACY_SUBMISSIONS_KEY = 'assignmentSubmissions_v2';
const SERVER_OFFSET_KEY = 'compass_server_time_offset';
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const isoNow = () => new Date().toISOString();

const load = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeAssignment = (assignment) => ({
  id: assignment.id || makeId('assignment'),
  courseId: assignment.courseId || '',
  courseTitle: assignment.courseTitle || 'General course',
  title: assignment.title || 'Untitled assignment',
  description: assignment.description || '',
  instructions: assignment.instructions || assignment.description || '',
  maxGrade: Number(assignment.maxGrade) || 100,
  openAt: assignment.openAt || assignment.createdAt || isoNow(),
  dueAt: assignment.dueAt || (assignment.dueDate ? `${assignment.dueDate}T23:59:00` : isoNow()),
  status: assignment.status === 'graded' ? 'published' : (assignment.status || 'draft'),
  createdAt: assignment.createdAt || isoNow(),
  updatedAt: assignment.updatedAt || isoNow(),
  archivedAt: assignment.archivedAt || null,
  deletedAt: assignment.deletedAt || null,
  auditLog: Array.isArray(assignment.auditLog) ? assignment.auditLog : [],
});

const normalizeSubmission = (submission, assignmentId) => ({
  id: submission.id || makeId('submission'),
  assignmentId,
  studentId: submission.studentId || 'current-student',
  studentName: submission.studentName || 'Student',
  studentEmail: submission.studentEmail || '',
  title: submission.title || '',
  text: submission.text || '',
  links: Array.isArray(submission.links) ? submission.links : [],
  files: Array.isArray(submission.files) ? submission.files : [],
  status: submission.status || 'submitted',
  submittedAt: submission.submittedAt || isoNow(),
  updatedAt: submission.updatedAt || isoNow(),
  grade: submission.grade ?? null,
  feedback: submission.feedback || '',
  privateNote: submission.privateNote || '',
  deletedAt: submission.deletedAt || null,
  deleteReason: submission.deleteReason || '',
  gradeHistory: Array.isArray(submission.gradeHistory) ? submission.gradeHistory : [],
  auditLog: Array.isArray(submission.auditLog) ? submission.auditLog : [],
});

export const TrainerAssignmentsProvider = ({ children }) => {
  const [assignments, setAssignments] = useState(() => load(STORAGE_KEY, []).map(normalizeAssignment));
  const [submissions, setSubmissions] = useState(() => {
    const saved = load(SUBMISSIONS_KEY, null) || load(LEGACY_SUBMISSIONS_KEY, {});
    return Object.fromEntries(Object.entries(saved).map(([assignmentId, value]) => {
      const list = Array.isArray(value) ? value : value ? [value] : [];
      return [assignmentId, list.map((item) => normalizeSubmission(item, assignmentId))];
    }));
  });
  const [serverOffset, setServerOffset] = useState(() => Number(localStorage.getItem(SERVER_OFFSET_KEY)) || 0);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments)), [assignments]);
  useEffect(() => localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions)), [submissions]);
  useEffect(() => localStorage.setItem(SERVER_OFFSET_KEY, String(serverOffset)), [serverOffset]);

  const serverNow = useCallback(() => Date.now() + serverOffset, [serverOffset]);
  const syncServerTime = useCallback((serverIsoTime) => setServerOffset(new Date(serverIsoTime).getTime() - Date.now()), []);
  const getAssignmentState = useCallback((assignment, timestamp = serverNow()) => {
    if (assignment.status === 'draft') return 'draft';
    if (assignment.status === 'archived') return 'archived';
    if (assignment.status === 'deleted') return 'deleted';
    if (assignment.closedManually) return 'closed';
    if (timestamp < new Date(assignment.openAt).getTime()) return 'scheduled';
    if (timestamp > new Date(assignment.dueAt).getTime()) return 'closed';
    return 'open';
  }, [serverNow]);

  const mutateAssignment = useCallback((id, updater) => {
    setAssignments((current) => current.map((assignment) => String(assignment.id) === String(id)
      ? { ...updater(assignment), updatedAt: isoNow() } : assignment));
  }, []);

  const createAssignment = useCallback((data = {}) => {
    const assignment = normalizeAssignment({
      ...data,
      id: makeId('assignment'),
      status: data.status || 'draft',
      createdAt: isoNow(),
      auditLog: [{ id: makeId('audit'), action: 'Assignment created as draft', at: isoNow() }],
    });
    setAssignments((current) => [assignment, ...current]);
    return assignment;
  }, []);
  const addAssignment = useCallback((data) => createAssignment({
    ...data,
    openAt: data.openAt || isoNow(),
    dueAt: data.dueAt || (data.dueDate ? `${data.dueDate}T23:59:00` : isoNow()),
    status: 'published',
  }), [createAssignment]);
  const updateAssignment = useCallback((id, changes) => mutateAssignment(id, (item) => ({ ...item, ...changes })), [mutateAssignment]);
  const publishAssignment = useCallback((id) => mutateAssignment(id, (item) => ({
    ...item, status: 'published',
    auditLog: [...item.auditLog, { id: makeId('audit'), action: 'Assignment published', at: isoNow() }],
  })), [mutateAssignment]);
  const scheduleAssignment = useCallback((id, openAt, dueAt) => mutateAssignment(id, (item) => ({
    ...item, openAt, dueAt, closedManually: false,
    auditLog: [...item.auditLog, { id: makeId('audit'), action: `Schedule updated: ${openAt} → ${dueAt}`, at: isoNow() }],
  })), [mutateAssignment]);
  const closeAssignmentAutomatically = useCallback(() => {
    const timestamp = serverNow();
    setAssignments((current) => current.map((item) => (
      item.status === 'published' && timestamp > new Date(item.dueAt).getTime() && !item.autoClosedAt
        ? { ...item, autoClosedAt: isoNow(), auditLog: [...item.auditLog, { id: makeId('audit'), action: 'Assignment closed automatically', at: isoNow() }] }
        : item
    )));
  }, [serverNow]);
  useEffect(() => {
    const timer = window.setInterval(closeAssignmentAutomatically, 60000);
    return () => window.clearInterval(timer);
  }, [closeAssignmentAutomatically]);
  const extendDeadline = useCallback((id, dueAt, actor = 'Trainer') => mutateAssignment(id, (item) => ({
    ...item, dueAt, closedManually: false, autoClosedAt: null,
    auditLog: [...item.auditLog, { id: makeId('audit'), action: `Deadline extended by ${actor} to ${dueAt}`, at: isoNow() }],
  })), [mutateAssignment]);
  const closeAssignmentNow = useCallback((id, reason) => mutateAssignment(id, (item) => ({
    ...item, closedManually: true, closeReason: reason,
    auditLog: [...item.auditLog, { id: makeId('audit'), action: `Closed early: ${reason}`, at: isoNow() }],
  })), [mutateAssignment]);
  const reopenAssignment = useCallback((id, reason = 'Reopened by trainer', newDueAt) => mutateAssignment(id, (item) => ({
    ...item, status: 'published', closedManually: false, autoClosedAt: null,
    dueAt: newDueAt || item.dueAt,
    auditLog: [...item.auditLog, { id: makeId('audit'), action: `${reason}${newDueAt ? `; new deadline ${newDueAt}` : ''}`, at: isoNow() }],
  })), [mutateAssignment]);
  const duplicateAssignment = useCallback((id) => {
    const source = assignments.find((item) => String(item.id) === String(id));
    if (!source) return null;
    return createAssignment({ ...source, title: `${source.title} (Copy)`, status: 'draft', auditLog: [] });
  }, [assignments, createAssignment]);
  const archiveAssignment = useCallback((id) => mutateAssignment(id, (item) => ({
    ...item, status: 'archived', archivedAt: isoNow(),
    auditLog: [...item.auditLog, { id: makeId('audit'), action: 'Assignment archived', at: isoNow() }],
  })), [mutateAssignment]);
  const deleteAssignment = useCallback((id, reason = '') => {
    if (!reason.trim()) return { ok: false, error: 'Deletion reason is required.' };
    mutateAssignment(id, (item) => ({
      ...item, status: 'deleted', deletedAt: isoNow(), deleteReason: reason,
      auditLog: [...item.auditLog, { id: makeId('audit'), action: `Assignment deleted: ${reason}`, at: isoNow() }],
    }));
    return { ok: true };
  }, [mutateAssignment]);

  const getAssignmentSubmissions = useCallback((assignmentId, { includeDeleted = false } = {}) => {
    const list = submissions[String(assignmentId)] || [];
    return includeDeleted ? list : list.filter((item) => item.status !== 'deleted');
  }, [submissions]);
  const getSubmission = useCallback((assignmentId, studentId = 'current-student') =>
    (submissions[String(assignmentId)] || []).find((item) => (
      String(item.studentId) === String(studentId) ||
      (item.studentEmail && String(item.studentEmail).toLowerCase() === String(studentId).toLowerCase())
    )) || null, [submissions]);
  const saveSubmissionDraft = useCallback((assignmentId, draft) => {
    const key = String(assignmentId);
    const studentId = draft.studentId || 'current-student';
    setSubmissions((current) => {
      const list = current[key] || [];
      const found = list.find((item) => String(item.studentId) === String(studentId));
      const next = found
        ? list.map((item) => item.id === found.id ? { ...item, ...draft, status: 'draft', updatedAt: isoNow() } : item)
        : [...list, normalizeSubmission({ ...draft, status: 'draft' }, assignmentId)];
      return { ...current, [key]: next };
    });
  }, []);
  const submitAssignmentFinal = useCallback((assignmentId, payload) => {
    const key = String(assignmentId);
    const studentId = payload.studentId || 'current-student';
    setSubmissions((current) => {
      const list = current[key] || [];
      const found = list.find((item) => String(item.studentId) === String(studentId));
      const submitted = normalizeSubmission({ ...found, ...payload, studentId, status: found?.status === 'changes-requested' ? 'resubmitted' : 'submitted', submittedAt: isoNow() }, assignmentId);
      return { ...current, [key]: found ? list.map((item) => item.id === found.id ? submitted : item) : [...list, submitted] };
    });
  }, []);
  const mutateSubmission = useCallback((assignmentId, submissionId, updater) => {
    const key = String(assignmentId);
    setSubmissions((current) => ({ ...current, [key]: (current[key] || []).map((item) => String(item.id) === String(submissionId) ? { ...updater(item), updatedAt: isoNow() } : item) }));
  }, []);
  const openSubmission = useCallback((assignmentId, submissionId) => getAssignmentSubmissions(assignmentId, { includeDeleted: true }).find((item) => String(item.id) === String(submissionId)) || null, [getAssignmentSubmissions]);
  const acceptSubmission = useCallback((assignmentId, submissionId) => mutateSubmission(assignmentId, submissionId, (item) => ({ ...item, status: 'accepted', acceptedAt: isoNow() })), [mutateSubmission]);
  const requestResubmission = useCallback((assignmentId, submissionId, feedback, newDueAt) => {
    mutateSubmission(assignmentId, submissionId, (item) => ({ ...item, status: 'changes-requested', feedback, resubmissionDueAt: newDueAt }));
  }, [mutateSubmission]);
  const gradeSubmission = useCallback((assignmentId, submissionIdOrPayload, maybePayload) => {
    const list = getAssignmentSubmissions(assignmentId);
    const submissionId = typeof submissionIdOrPayload === 'object' ? list[0]?.id : submissionIdOrPayload;
    const payload = typeof submissionIdOrPayload === 'object' ? submissionIdOrPayload : maybePayload;
    if (!submissionId || !payload) return;
    mutateSubmission(assignmentId, submissionId, (item) => ({
      ...item, status: 'graded', grade: Number(payload.grade), feedback: payload.feedback ?? item.feedback,
      privateNote: payload.privateNote ?? item.privateNote, gradedAt: isoNow(),
      gradeHistory: [...item.gradeHistory, { id: makeId('grade'), grade: Number(payload.grade), changedAt: isoNow(), reason: payload.reason || 'Initial grade' }],
    }));
  }, [getAssignmentSubmissions, mutateSubmission]);
  const addSubmissionFeedback = useCallback((assignmentId, submissionId, feedback, privateNote = '') => mutateSubmission(assignmentId, submissionId, (item) => ({ ...item, feedback, privateNote })), [mutateSubmission]);
  const updateGrade = useCallback((assignmentId, submissionId, grade, reason) => gradeSubmission(assignmentId, submissionId, { grade, reason }), [gradeSubmission]);
  const deleteSubmission = useCallback((assignmentId, submissionId, reason, actor = 'Trainer') => {
    if (!reason?.trim()) return { ok: false, error: 'Deletion reason is required.' };
    mutateSubmission(assignmentId, submissionId, (item) => ({ ...item, status: 'deleted', deletedAt: isoNow(), deleteReason: reason, auditLog: [...item.auditLog, { id: makeId('audit'), action: `Soft deleted by ${actor}: ${reason}`, at: isoNow() }] }));
    return { ok: true };
  }, [mutateSubmission]);
  const restoreSubmission = useCallback((assignmentId, submissionId) => mutateSubmission(assignmentId, submissionId, (item) => ({ ...item, status: 'submitted', deletedAt: null, deleteReason: '', auditLog: [...item.auditLog, { id: makeId('audit'), action: 'Submission restored', at: isoNow() }] })), [mutateSubmission]);
  const instructorDeleteSubmission = useCallback((assignmentId, reason = 'Removed by instructor') => {
    const item = getAssignmentSubmissions(assignmentId)[0];
    return item ? deleteSubmission(assignmentId, item.id, reason) : { ok: false };
  }, [deleteSubmission, getAssignmentSubmissions]);
  const instructorReopenSubmission = useCallback((assignmentId) => {
    const item = getAssignmentSubmissions(assignmentId)[0];
    if (item) requestResubmission(assignmentId, item.id, 'Please update and resubmit your work.');
  }, [getAssignmentSubmissions, requestResubmission]);
  const gradeAssignment = useCallback((assignmentId, payload) => gradeSubmission(assignmentId, payload), [gradeSubmission]);

  const exportGrades = useCallback((assignmentId) => {
    const assignment = assignments.find((item) => String(item.id) === String(assignmentId));
    const rows = getAssignmentSubmissions(assignmentId, { includeDeleted: true });
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [['Student ID', 'Student', 'Email', 'Status', 'Grade', 'Maximum', 'Feedback'], ...rows.map((item) => [item.studentId, item.studentName, item.studentEmail, item.status, item.grade ?? '', assignment?.maxGrade || 100, item.feedback])].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${assignment?.title || 'assignment'}-grades.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [assignments, getAssignmentSubmissions]);

  const publishedAssignments = useMemo(() => assignments.filter((item) => item.status === 'published'), [assignments]);
  const value = { assignments, publishedAssignments, submissions, serverNow, syncServerTime, getAssignmentState, createAssignment, addAssignment, updateAssignment, publishAssignment, scheduleAssignment, closeAssignmentAutomatically, extendDeadline, closeAssignmentNow, reopenAssignment, duplicateAssignment, archiveAssignment, deleteAssignment, getAssignmentSubmissions, getSubmission, saveSubmissionDraft, submitAssignmentFinal, openSubmission, acceptSubmission, requestResubmission, gradeSubmission, addSubmissionFeedback, updateGrade, deleteSubmission, restoreSubmission, instructorDeleteSubmission, instructorReopenSubmission, gradeAssignment, exportGrades };
  return <TrainerAssignmentsContext.Provider value={value}>{children}</TrainerAssignmentsContext.Provider>;
};

export const useTrainerAssignments = () => {
  const context = useContext(TrainerAssignmentsContext);
  if (!context) throw new Error('useTrainerAssignments must be used within a TrainerAssignmentsProvider');
  return context;
};
