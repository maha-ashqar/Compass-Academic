import { useState } from 'react';
import {
  FiArchive, FiCalendar, FiCheck, FiClock, FiCopy, FiDownload, FiEdit3,
  FiEye, FiFileText, FiMoreHorizontal, FiPlus, FiRefreshCw, FiSearch,
  FiTrash2, FiUpload, FiX,
} from 'react-icons/fi';
import { useCoursesCatalog } from './CoursesCatalogContext';
import { useNotifications } from './NotificationsContext';
import { useTrainerAssignments } from './TrainerAssignmentsContext';
import './TrainerAssignments.css';

const emptyForm = {
  courseId: '', title: '', description: '', instructions: '', maxGrade: 100,
  openAt: '', dueAt: '',
};
const formatDate = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set';
const timeLeft = (dueAt, now) => {
  const distance = new Date(dueAt).getTime() - now;
  if (distance <= 0) return 'Closed';
  const hours = Math.floor(distance / 3600000);
  const days = Math.floor(hours / 24);
  return days ? `${days}d ${hours % 24}h left` : `${hours}h left`;
};

function TrainerAssignments({ trainerData }) {
  const api = useTrainerAssignments();
  const { courses } = useCoursesCatalog();
  const { addNotification } = useNotifications();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('active');
  const [courseFilter, setCourseFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [newDate, setNewDate] = useState('');
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState('');

  const currentNow = api.serverNow();
  const activeAssignments = api.assignments.filter((item) => !['deleted', 'archived'].includes(item.status));
  const selected = activeAssignments.find((item) => String(item.id) === String(selectedId)) || activeAssignments[0] || null;
  const selectedSubmissions = selected
    ? api.getAssignmentSubmissions(selected.id, { includeDeleted: true })
    : [];
  const selectedSubmission = selectedSubmissions.find((item) => String(item.id) === String(submissionId)) || selectedSubmissions[0] || null;

  const rows = activeAssignments.filter((assignment) => {
    const state = api.getAssignmentState(assignment, currentNow);
    const tabMatch = tab === 'active' ? state === 'open' : tab === state;
    const courseMatch = courseFilter === 'all' || String(assignment.courseId) === courseFilter;
    const searchMatch = `${assignment.title} ${assignment.courseTitle}`.toLowerCase().includes(query.toLowerCase());
    return tabMatch && courseMatch && searchMatch;
  }).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  const totals = (() => {
    const allSubs = activeAssignments.flatMap((item) => api.getAssignmentSubmissions(item.id));
    return {
      active: activeAssignments.filter((item) => api.getAssignmentState(item, currentNow) === 'open').length,
      pending: allSubs.filter((item) => ['submitted', 'resubmitted'].includes(item.status)).length,
      graded: allSubs.filter((item) => item.status === 'graded').length,
      soon: activeAssignments.filter((item) => {
        const diff = new Date(item.dueAt).getTime() - currentNow;
        return diff > 0 && diff <= 48 * 3600000;
      }).length,
      average: Math.round(allSubs.filter((item) => item.grade != null).reduce((sum, item) => sum + Number(item.grade), 0) / (allSubs.filter((item) => item.grade != null).length || 1)),
    };
  })();

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };
  const openCreate = () => {
    const openAt = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    const dueAt = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16);
    setForm({ ...emptyForm, openAt, dueAt }); setEditingId(null); setFormOpen(true);
  };
  const openEdit = (assignment) => {
    setForm({ ...assignment, openAt: assignment.openAt?.slice(0, 16), dueAt: assignment.dueAt?.slice(0, 16) });
    setEditingId(assignment.id); setFormOpen(true);
  };
  const saveAssignment = (event, publish = false) => {
    event.preventDefault();
    const course = courses.find((item) => String(item.id) === String(form.courseId));
    const payload = { ...form, courseTitle: course?.category || course?.title || 'General course', maxGrade: Number(form.maxGrade) || 100 };
    if (editingId) {
      api.updateAssignment(editingId, payload);
      if (publish) api.publishAssignment(editingId);
    } else {
      const created = api.createAssignment(payload);
      if (publish) api.publishAssignment(created.id);
      setSelectedId(created.id);
    }
    setFormOpen(false);
    flash(publish ? 'Assignment published to students.' : 'Assignment saved as draft.');
  };
  const notifyDeadline = (assignment, dueAt) => addNotification({
    title: `Deadline updated: ${assignment.title}`,
    text: `The new deadline is ${formatDate(dueAt)}.`, icon: '📅', actionTab: 'Assignments',
  });
  const submitAction = () => {
    if (!selected) return;
    if (actionModal === 'extend') {
      if (!newDate) return flash('Choose the new deadline.');
      api.extendDeadline(selected.id, newDate, trainerData?.displayName);
      notifyDeadline(selected, newDate);
    }
    if (actionModal === 'reopen') {
      if (!actionReason.trim() || !newDate) return flash('Reason and new deadline are required.');
      api.reopenAssignment(selected.id, actionReason, newDate);
      notifyDeadline(selected, newDate);
    }
    if (actionModal === 'close') {
      if (!actionReason.trim()) return flash('Closing reason is required.');
      api.closeAssignmentNow(selected.id, actionReason);
    }
    if (actionModal === 'delete-assignment') {
      const result = api.deleteAssignment(selected.id, actionReason);
      if (!result.ok) return flash(result.error);
      setSelectedId(null);
    }
    if (actionModal === 'delete-submission' && selectedSubmission) {
      const result = api.deleteSubmission(selected.id, selectedSubmission.id, actionReason, trainerData?.displayName);
      if (!result.ok) return flash(result.error);
      setSubmissionId(null);
    }
    setActionModal(null); setActionReason(''); setNewDate(''); flash('Changes saved successfully.');
  };
  const openReview = (assignment) => {
    const firstSubmission = api.getAssignmentSubmissions(assignment.id, { includeDeleted: true })[0];
    setSelectedId(assignment.id);
    setReviewOpen(true);
    if (firstSubmission) chooseSubmission(firstSubmission);
    else setSubmissionId(null);
  };
  const chooseSubmission = (item) => {
    setSubmissionId(item.id); setGrade(item.grade ?? ''); setFeedback(item.feedback || ''); setPrivateNote(item.privateNote || '');
  };
  const saveGrade = () => {
    if (!selectedSubmission || grade === '') return;
    api.gradeSubmission(selected.id, selectedSubmission.id, { grade: Math.min(selected.maxGrade, Math.max(0, Number(grade))), feedback, privateNote });
    flash('Grade and feedback published.');
  };

  return (
    <div className="ta-page">
      <div className="ta-page-head">
        <div><span>ASSIGNMENT MANAGEMENT</span><h1>Assignments</h1><p>Create assignments, manage deadlines, and review student work.</p></div>
        <div className="ta-head-actions"><button className="primary" onClick={openCreate}><FiPlus /> Create assignment</button><button onClick={() => selected ? api.exportGrades(selected.id) : flash('Select an assignment first.')}><FiDownload /> Export grades</button></div>
      </div>

      <div className="ta-stats">
        <article><span className="blue"><FiFileText /></span><strong>{totals.active}</strong><b>Active assignments</b><small>Across {new Set(activeAssignments.map((item) => item.courseId)).size} courses</small></article>
        <article><span className="purple"><FiClock /></span><strong>{totals.pending}</strong><b>Pending submissions</b><small>{totals.graded} already graded</small></article>
        <article><span className="orange"><FiCalendar /></span><strong>{totals.soon}</strong><b>Closing soon</b><small>Within the next 48 hours</small></article>
      </div>

      <div className="ta-layout">
        <section className="ta-list-card">
          <h2>Assignments</h2>
          <div className="ta-toolbar"><label><FiSearch /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assignments" /></label><select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}><option value="all">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.category}</option>)}</select><select><option>Nearest deadline</option></select></div>
          <div className="ta-tabs">{['active', 'scheduled', 'closed', 'draft'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
          <div className="ta-rows">
            {rows.map((assignment) => {
              const assignmentState = api.getAssignmentState(assignment, currentNow);
              const assignmentSubmissions = api.getAssignmentSubmissions(assignment.id);
              const graded = assignmentSubmissions.filter((item) => item.status === 'graded').length;
              const progress = assignmentSubmissions.length ? Math.round((graded / assignmentSubmissions.length) * 100) : 0;
              return <article key={assignment.id} className={selected?.id === assignment.id ? 'selected' : ''} onClick={() => setSelectedId(assignment.id)}>
                <span className={`ta-row-icon ${assignmentState}`}><FiFileText /></span>
                <div className="ta-row-copy"><strong>{assignment.title}</strong><small>{assignment.courseTitle}</small><em><FiCalendar /> Opens: {formatDate(assignment.openAt)}<FiClock /> Closes: {formatDate(assignment.dueAt)}</em></div>
                <div className="ta-count"><strong>{assignmentSubmissions.length}</strong><small>submitted</small></div>
                <div className="ta-count"><strong>{graded}/{assignmentSubmissions.length || '—'}</strong><small>graded</small><i><b style={{ width: `${progress}%` }} /></i></div>
                <div className="ta-state"><span className={assignmentState}>{assignmentState}</span><small>{assignmentState === 'open' ? timeLeft(assignment.dueAt, currentNow) : assignmentState === 'scheduled' ? `Opens ${formatDate(assignment.openAt)}` : ''}</small></div>
                <button className="ta-review" onClick={(event) => { event.stopPropagation(); openReview(assignment); }}>Review submissions</button>
                <div className="ta-more"><button onClick={(event) => { event.stopPropagation(); setMenuId(menuId === assignment.id ? null : assignment.id); }}><FiMoreHorizontal /></button>{menuId === assignment.id && <div><button onClick={() => openEdit(assignment)}><FiEdit3 /> Edit</button><button onClick={() => api.duplicateAssignment(assignment.id)}><FiCopy /> Duplicate</button><button onClick={() => api.archiveAssignment(assignment.id)}><FiArchive /> Archive</button><button className="danger" onClick={() => { setSelectedId(assignment.id); setActionModal('delete-assignment'); }}><FiTrash2 /> Delete</button></div>}</div>
              </article>;
            })}
            {!rows.length && <div className="ta-empty">No assignments match this section.</div>}
          </div>
        </section>

        <aside className="ta-side">
          <section className="ta-selected">
            <span>Selected assignment</span>
            {selected ? <><h3>{selected.title}</h3><dl><div><dt>Course</dt><dd>{selected.courseTitle}</dd></div><div><dt>Opens</dt><dd>{formatDate(selected.openAt)}</dd></div><div><dt>Deadline</dt><dd>{formatDate(selected.dueAt)}</dd></div><div><dt>Time remaining</dt><dd className="orange-text">{timeLeft(selected.dueAt, currentNow)}</dd></div></dl><button className="primary" onClick={() => setReviewOpen(true)}>Review submissions</button><button onClick={() => { setActionModal('extend'); setNewDate(selected.dueAt?.slice(0,16)); }}><FiCalendar /> Extend deadline</button><button className="link" onClick={() => openEdit(selected)}><FiEdit3 /> Edit assignment</button><button className="link danger-text" onClick={() => setActionModal(api.getAssignmentState(selected, currentNow) === 'closed' ? 'reopen' : 'close')}>{api.getAssignmentState(selected, currentNow) === 'closed' ? <FiRefreshCw /> : <FiX />} {api.getAssignmentState(selected, currentNow) === 'closed' ? 'Reopen assignment' : 'Close now'}</button><p className="ta-info">Student submissions close automatically when the deadline ends.</p></> : <p>Select an assignment to see its schedule and actions.</p>}
          </section>
          <section><h3>Recent submissions</h3>{selectedSubmissions.slice(0,4).map((item) => <button className="ta-recent" key={item.id} onClick={() => { chooseSubmission(item); setReviewOpen(true); }}><span>{item.studentName.split(' ').map((part) => part[0]).slice(0,2).join('')}</span><div><strong>{item.studentName}</strong><small>{formatDate(item.submittedAt)}</small></div><em className={item.status}>{item.status}</em></button>)}{!selectedSubmissions.length && <p>No student submissions yet.</p>}</section>
          <section className="ta-grading"><h3>Grading progress</h3><div><span><strong>{totals.graded}</strong><small>Graded</small></span><span><strong>{totals.pending}</strong><small>Awaiting review</small></span><span><strong>{totals.average}</strong><small>Average grade</small></span></div></section>
        </aside>
      </div>
      <button className="ta-preview-bar" onClick={() => selected ? setPreview(true) : flash('Select an assignment first.')}><FiEye /> Changes sync automatically with the student dashboard.<span>Preview student view →</span></button>

      {formOpen && <AssignmentForm form={form} setForm={setForm} courses={courses} editing={Boolean(editingId)} onClose={() => setFormOpen(false)} onSave={saveAssignment} />}
      {reviewOpen && selected && <ReviewModal assignment={selected} submissions={selectedSubmissions} selected={selectedSubmission} onChoose={chooseSubmission} grade={grade} setGrade={setGrade} feedback={feedback} setFeedback={setFeedback} privateNote={privateNote} setPrivateNote={setPrivateNote} onGrade={saveGrade} onAccept={() => selectedSubmission && api.acceptSubmission(selected.id, selectedSubmission.id)} onResubmit={() => selectedSubmission && api.requestResubmission(selected.id, selectedSubmission.id, feedback, newDate)} onDelete={() => setActionModal('delete-submission')} onRestore={() => selectedSubmission && api.restoreSubmission(selected.id, selectedSubmission.id)} onClose={() => setReviewOpen(false)} />}
      {actionModal && <ActionModal type={actionModal} reason={actionReason} setReason={setActionReason} date={newDate} setDate={setNewDate} onClose={() => setActionModal(null)} onConfirm={submitAction} />}
      {preview && selected && <StudentPreview assignment={selected} state={api.getAssignmentState(selected, currentNow)} onClose={() => setPreview(false)} />}
      {notice && <div className="ta-toast">{notice}</div>}
    </div>
  );
}

function AssignmentForm({ form, setForm, courses, editing, onClose, onSave }) {
  return <div className="ta-modal"><form onSubmit={(event) => onSave(event, false)}><button type="button" className="ta-close" onClick={onClose}><FiX /></button><h2>{editing ? 'Edit assignment' : 'Create assignment'}</h2><p>Save it as a draft or publish it immediately to enrolled students.</p><div className="ta-two"><label>Course<select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}><option value="">Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.category}</option>)}</select></label><label>Maximum grade<input type="number" min="1" value={form.maxGrade} onChange={(e) => setForm({ ...form, maxGrade: e.target.value })} /></label></div><label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label>Submission instructions<textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></label><div className="ta-two"><label>Opens at<input required type="datetime-local" value={form.openAt} onChange={(e) => setForm({ ...form, openAt: e.target.value })} /></label><label>Deadline<input required type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></label></div><div className="ta-form-actions"><button type="submit">Save draft</button><button type="button" className="primary" onClick={(event) => onSave(event, true)}><FiUpload /> Publish assignment</button></div></form></div>;
}

function ReviewModal({ assignment, submissions, selected, onChoose, grade, setGrade, feedback, setFeedback, privateNote, setPrivateNote, onGrade, onAccept, onResubmit, onDelete, onRestore, onClose }) {
  return <div className="ta-modal"><div className="ta-review-modal"><button className="ta-close" onClick={onClose}><FiX /></button><div className="ta-review-head"><span>SUBMISSION REVIEW</span><h2>{assignment.title}</h2><p>{submissions.filter((item) => item.status !== 'deleted').length} submissions · maximum grade {assignment.maxGrade}</p></div><div className="ta-review-layout"><aside>{submissions.map((item) => <button key={item.id} className={selected?.id === item.id ? 'active' : ''} onClick={() => onChoose(item)}><span>{item.studentName.split(' ').map((part) => part[0]).slice(0,2).join('')}</span><div><strong>{item.studentName}</strong><small>{item.status}</small></div></button>)}{!submissions.length && <p>No submissions yet.</p>}</aside><main>{selected ? <><div className="ta-submission-meta"><div><span>Student</span><strong>{selected.studentName}</strong></div><div><span>Submitted</span><strong>{formatDate(selected.submittedAt)}</strong></div><div><span>Status</span><strong>{selected.status}</strong></div></div><section><h3>{selected.title || 'Student submission'}</h3><p>{selected.text || 'No written description was included.'}</p>{selected.links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer">{link}</a>)}{selected.files.map((file) => <a key={file.id || file.name} href={file.dataUrl || file.url} download={file.name} target="_blank" rel="noreferrer"><FiFileText /> {file.name}</a>)}</section><div className="ta-two"><label>Grade / {assignment.maxGrade}<input type="number" min="0" max={assignment.maxGrade} value={grade} onChange={(e) => setGrade(e.target.value)} /></label><label>Private trainer note<textarea value={privateNote} onChange={(e) => setPrivateNote(e.target.value)} /></label></div><label>Feedback visible to student<textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} /></label><div className="ta-review-actions"><button onClick={onAccept}><FiCheck /> Accept</button><button onClick={onResubmit}><FiRefreshCw /> Request resubmission</button><button className="primary" onClick={onGrade}>Publish grade</button>{selected.status === 'deleted' ? <button onClick={onRestore}>Restore</button> : <button className="danger-text" onClick={onDelete}><FiTrash2 /> Soft delete</button>}</div></> : <div className="ta-empty">Choose a student submission.</div>}</main></div></div></div>;
}

function ActionModal({ type, reason, setReason, date, setDate, onClose, onConfirm }) {
  const needsDate = ['extend', 'reopen'].includes(type);
  const needsReason = ['reopen', 'close', 'delete-assignment', 'delete-submission'].includes(type);
  return <div className="ta-modal"><div className="ta-action-dialog"><button className="ta-close" onClick={onClose}><FiX /></button><h2>{type.replaceAll('-', ' ')}</h2><p>This action is recorded in the audit history.</p>{needsDate && <label>New deadline<input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></label>}{needsReason && <label>Reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="A clear reason is required" /></label>}<button className="primary" onClick={onConfirm}>Confirm action</button></div></div>;
}

function StudentPreview({ assignment, state, onClose }) {
  return <div className="ta-modal"><div className="ta-student-preview"><button className="ta-close" onClick={onClose}><FiX /></button><span>STUDENT PREVIEW</span><h2>{assignment.title}</h2><p>{assignment.courseTitle}</p><i className={state}>{state}</i><dl><div><dt>Available from</dt><dd>{formatDate(assignment.openAt)}</dd></div><div><dt>Deadline</dt><dd>{formatDate(assignment.dueAt)}</dd></div><div><dt>Maximum grade</dt><dd>{assignment.maxGrade}</dd></div></dl><section><h3>Description</h3><p>{assignment.description}</p><h3>Submission instructions</h3><p>{assignment.instructions}</p></section><button className="primary" disabled={state !== 'open'}>{state === 'open' ? 'Submit assignment' : 'Submission is closed'}</button></div></div>;
}

export default TrainerAssignments;
