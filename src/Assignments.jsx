import { useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiImage,
  FiFileText,
  FiPaperclip,
  FiSave,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi';
import { useCourses } from './CoursesContext';
import { useTrainerAssignments } from './TrainerAssignmentsContext';
import './Assignments.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'graded', label: 'Graded' },
];

const DAY = 1000 * 60 * 60 * 24;

const Assignments = ({ studentData }) => {
  const { myCourses, isAssignmentSubmitted, toggleAssignmentSubmitted } = useCourses();
  const {
    publishedAssignments = [],
    getAssignmentState,
    getSubmission,
    saveSubmissionDraft,
    submitAssignmentFinal,
    serverNow,
  } = useTrainerAssignments();

  const [activeFilter, setActiveFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(() => serverNow());
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionNotice, setSubmissionNotice] = useState('');
  const studentIdentity = studentData?.email || studentData?.id || 'current-student';

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(serverNow()), 60000);
    return () => window.clearInterval(timer);
  }, [serverNow]);

  const allAssignments = useMemo(() => {
    const list = [];

    myCourses.forEach((course) => {
      const daysSinceEnrollment = course.enrolledAt
        ? Math.floor((currentTime - new Date(course.enrolledAt).getTime()) / DAY)
        : 0;

      (course.assignments || []).forEach((assignment) => {
        list.push({
          ...assignment,
          courseId: course.id,
          courseTitle: course.category || course.title,
          daysLeft: Number(assignment.dueInDays || 0) - daysSinceEnrollment,
          submitted: isAssignmentSubmitted(assignment.id),
          graded: false,
          grade: null,
          feedback: '',
          assignmentState: 'open',
          trainerManaged: false,
        });
      });

      publishedAssignments
        .filter((assignment) => String(assignment.courseId) === String(course.id))
        .forEach((assignment) => {
          const assignmentState = getAssignmentState(assignment, currentTime);
          const submission = getSubmission(assignment.id, studentIdentity);
          const dueTime = new Date(assignment.dueAt || assignment.dueDate).getTime();
          const daysLeft = Number.isFinite(dueTime)
            ? Math.ceil((dueTime - currentTime) / DAY)
            : 0;

          list.push({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description || assignment.instructions || 'No description provided.',
            courseId: course.id,
            courseTitle: course.category || course.title,
            dueAt: assignment.dueAt || assignment.dueDate,
            daysLeft,
            assignmentState,
            trainerManaged: true,
            submitted: Boolean(submission && submission.status !== 'draft'),
            graded: submission?.status === 'graded',
            grade: submission?.grade,
            feedback: submission?.feedback || '',
          });
        });
    });

    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [
    currentTime,
    getAssignmentState,
    getSubmission,
    isAssignmentSubmitted,
    myCourses,
    publishedAssignments,
    studentIdentity,
  ]);

  const counts = useMemo(
    () => ({
      all: allAssignments.length,
      pending: allAssignments.filter((item) => !item.submitted && item.daysLeft >= 0).length,
      overdue: allAssignments.filter((item) => !item.submitted && item.daysLeft < 0).length,
      submitted: allAssignments.filter((item) => item.submitted && !item.graded).length,
      graded: allAssignments.filter((item) => item.graded).length,
    }),
    [allAssignments]
  );

  const filteredAssignments = useMemo(() => {
    if (activeFilter === 'pending') {
      return allAssignments.filter((item) => !item.submitted && item.daysLeft >= 0);
    }
    if (activeFilter === 'overdue') {
      return allAssignments.filter((item) => !item.submitted && item.daysLeft < 0);
    }
    if (activeFilter === 'submitted') {
      return allAssignments.filter((item) => item.submitted && !item.graded);
    }
    if (activeFilter === 'graded') {
      return allAssignments.filter((item) => item.graded);
    }
    return allAssignments;
  }, [activeFilter, allAssignments]);

  const openSubmissionPage = (assignment) => {
    const saved = getSubmission(assignment.id, studentIdentity);
    setSelectedAssignment(assignment);
    setSubmissionTitle(saved?.title || `${assignment.title} submission`);
    setSubmissionNote(saved?.text || '');
    setSubmissionFiles(saved?.files || []);
    setSubmissionError('');
    setSubmissionNotice('');
  };

  const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      dataUrl: reader.result,
    });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const handleFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    setSubmissionError('');

    if (submissionFiles.length + selected.length > 3) {
      setSubmissionError('You can attach up to 3 files.');
      event.target.value = '';
      return;
    }

    const oversized = selected.find((file) => file.size > 1024 * 1024);
    if (oversized) {
      setSubmissionError(`${oversized.name} is larger than 1 MB.`);
      event.target.value = '';
      return;
    }

    try {
      const uploaded = await Promise.all(selected.map(readFile));
      setSubmissionFiles((current) => [...current, ...uploaded]);
    } catch (error) {
      setSubmissionError(error.message);
    }

    event.target.value = '';
  };

  const buildSubmissionPayload = () => ({
    studentId: studentIdentity,
    studentName: studentData?.displayName || studentData?.fullName || studentData?.name || 'Student',
    studentEmail: studentData?.email || '',
    title: submissionTitle.trim(),
    text: submissionNote.trim(),
    files: submissionFiles,
  });

  const handleSaveDraft = () => {
    if (!submissionTitle.trim()) {
      setSubmissionError('Please enter a submission name.');
      return;
    }
    saveSubmissionDraft(selectedAssignment.id, buildSubmissionPayload());
    setSubmissionError('');
    setSubmissionNotice('Draft saved successfully. You can return and finish it later.');
  };

  const handleFinalSubmission = () => {
    if (!submissionTitle.trim()) {
      setSubmissionError('Please enter a submission name.');
      return;
    }
    if (!submissionFiles.length) {
      setSubmissionError('Please add at least one file or image before submitting.');
      return;
    }
    if (selectedAssignment.assignmentState !== 'open') {
      setSubmissionError('This assignment is not open for submission.');
      return;
    }

    submitAssignmentFinal(selectedAssignment.id, buildSubmissionPayload());
    if (!selectedAssignment.trainerManaged && !isAssignmentSubmitted(selectedAssignment.id)) {
      toggleAssignmentSubmitted(selectedAssignment.id);
    }
    setSubmissionError('');
    setSubmissionNotice('Your assignment was submitted successfully.');
    window.setTimeout(() => setSelectedAssignment(null), 900);
  };

  const getStatus = (assignment) => {
    if (assignment.graded) return { label: `Graded · ${assignment.grade}/100`, type: 'graded' };
    if (assignment.submitted) return { label: 'Submitted', type: 'submitted' };
    if (assignment.assignmentState === 'scheduled') return { label: 'Scheduled', type: 'scheduled' };
    if (assignment.assignmentState === 'closed' || assignment.daysLeft < 0) {
      return { label: 'Overdue', type: 'overdue' };
    }
    if (assignment.daysLeft === 0) return { label: 'Due today', type: 'soon' };
    if (assignment.daysLeft <= 2) return { label: `${assignment.daysLeft} days left`, type: 'soon' };
    return { label: `${assignment.daysLeft} days left`, type: 'open' };
  };

  if (selectedAssignment) {
    const existingSubmission = getSubmission(selectedAssignment.id, studentIdentity);
    const isLocked = Boolean(existingSubmission && existingSubmission.status !== 'draft');

    return (
      <section className="student-submission-page">
        <button
          type="button"
          className="student-submission-back"
          onClick={() => setSelectedAssignment(null)}
        >
          <FiArrowLeft /> Back to assignments
        </button>

        <header className="student-submission-header">
          <div>
            <span>ASSIGNMENT SUBMISSION</span>
            <h1>{selectedAssignment.title}</h1>
            <p>{selectedAssignment.courseTitle}</p>
          </div>
          <span className={`student-submission-state is-${selectedAssignment.assignmentState}`}>
            {isLocked ? 'Submitted' : selectedAssignment.assignmentState}
          </span>
        </header>

        <div className="student-submission-layout">
          <main className="student-submission-form-card">
            <div className="student-submission-section-title">
              <FiFileText />
              <div>
                <h2>Prepare your submission</h2>
                <p>Add a clear name, your file or image, then save the submission.</p>
              </div>
            </div>

            <label className="student-submission-field">
              <span>Submission name *</span>
              <input
                type="text"
                value={submissionTitle}
                onChange={(event) => setSubmissionTitle(event.target.value)}
                placeholder="Example: Responsive design final solution"
                disabled={isLocked}
              />
            </label>

            <label className="student-submission-field">
              <span>Note to your instructor</span>
              <textarea
                value={submissionNote}
                onChange={(event) => setSubmissionNote(event.target.value)}
                placeholder="Write a short note about your work..."
                disabled={isLocked}
              />
            </label>

            <div className="student-upload-area">
              <FiUploadCloud />
              <h3>Add file or image</h3>
              <p>PDF, DOCX, ZIP, PPTX, PNG or JPG · up to 3 files, 1 MB each</p>
              <label className={isLocked ? 'is-disabled' : ''}>
                <FiPaperclip /> Choose files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.zip,.ppt,.pptx,image/png,image/jpeg,image/webp"
                  onChange={handleFiles}
                  disabled={isLocked}
                />
              </label>
            </div>

            {submissionFiles.length > 0 && (
              <div className="student-uploaded-files">
                <h3>Attached files <span>{submissionFiles.length}</span></h3>
                {submissionFiles.map((file) => (
                  <article key={file.id || file.name}>
                    <span>{file.type?.startsWith('image/') ? <FiImage /> : <FiFileText />}</span>
                    <div>
                      <strong>{file.name}</strong>
                      <small>{Math.max(1, Math.round((file.size || 0) / 1024))} KB</small>
                    </div>
                    {file.type?.startsWith('image/') && file.dataUrl && (
                      <img src={file.dataUrl} alt={file.name} />
                    )}
                    {!isLocked && (
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => setSubmissionFiles((current) => current.filter((item) => item.id !== file.id))}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}

            {submissionError && <p className="student-submission-message is-error">{submissionError}</p>}
            {submissionNotice && <p className="student-submission-message is-success">{submissionNotice}</p>}

            {!isLocked && (
              <div className="student-submission-actions">
                <button type="button" className="secondary" onClick={handleSaveDraft}>
                  <FiSave /> Save draft
                </button>
                <button type="button" className="primary" onClick={handleFinalSubmission}>
                  <FiCheckCircle /> Save submission
                </button>
              </div>
            )}
          </main>

          <aside className="student-submission-brief">
            <h2>Assignment details</h2>
            <dl>
              <div><dt>Course</dt><dd>{selectedAssignment.courseTitle}</dd></div>
              <div><dt>Status</dt><dd>{selectedAssignment.assignmentState}</dd></div>
              <div><dt>Deadline</dt><dd>{selectedAssignment.dueAt ? new Date(selectedAssignment.dueAt).toLocaleString() : 'Course schedule'}</dd></div>
            </dl>
            <h3>Instructions</h3>
            <p>{selectedAssignment.description}</p>
            <div className="student-submission-policy">
              <FiAlertCircle />
              <span>After final submission, the files are locked until the instructor requests a resubmission.</span>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="student-assignments-page">
      <header className="student-assignments-header">
        <div>
          <span>ASSIGNMENTS</span>
          <h1>Assignments</h1>
          <p>Track everything due across your enrolled courses in one place.</p>
        </div>
        <div className="student-assignments-summary">
          <FiFileText />
          <strong>{counts.pending + counts.overdue}</strong>
          <span>Tasks to complete</span>
        </div>
      </header>

      <nav className="student-assignments-filters" aria-label="Assignment filters">
        {FILTERS.map((filter) => (
          <button
            type="button"
            key={filter.id}
            className={activeFilter === filter.id ? 'is-active' : ''}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
            <span>{counts[filter.id]}</span>
          </button>
        ))}
      </nav>

      {filteredAssignments.length === 0 ? (
        <div className="student-assignments-empty">
          <FiCheckCircle />
          <h2>{myCourses.length ? 'Nothing here' : 'No assignments yet'}</h2>
          <p>
            {myCourses.length
              ? 'No assignments match this filter right now.'
              : 'Enroll in a course to start seeing your assignments here.'}
          </p>
        </div>
      ) : (
        <div className="student-assignments-list">
          {filteredAssignments.map((assignment) => {
            const status = getStatus(assignment);
            const actionDisabled =
              assignment.trainerManaged &&
              (assignment.assignmentState !== 'open' || assignment.submitted);

            return (
              <article
                key={`${assignment.trainerManaged ? 'trainer' : 'course'}-${assignment.id}`}
                className={`student-assignment-card is-${status.type}`}
              >
                <div className="student-assignment-icon">
                  {status.type === 'overdue' ? <FiAlertCircle /> : <FiFileText />}
                </div>

                <div className="student-assignment-content">
                  <div className="student-assignment-topline">
                    <span className="student-assignment-course">{assignment.courseTitle}</span>
                    <span className={`student-assignment-status is-${status.type}`}>
                      {status.label}
                    </span>
                  </div>
                  <h2>{assignment.title}</h2>
                  <p>{assignment.description}</p>
                  <div className="student-assignment-meta">
                    <span><FiCalendar /> {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'Course schedule'}</span>
                    <span><FiClock /> {assignment.assignmentState === 'closed' ? 'Submission closed' : 'Online submission'}</span>
                  </div>
                  {assignment.graded && assignment.feedback && (
                    <div className="student-assignment-feedback">
                      <strong>Instructor feedback</strong>
                      <p>{assignment.feedback}</p>
                    </div>
                  )}
                </div>

                {!assignment.graded && (
                  <button
                    type="button"
                    className="student-assignment-action"
                    disabled={actionDisabled}
                    onClick={() => openSubmissionPage(assignment)}
                  >
                    {assignment.submitted
                      ? 'Submitted'
                      : assignment.assignmentState === 'scheduled'
                        ? 'Not open yet'
                        : assignment.assignmentState === 'closed'
                          ? 'Submission closed'
                          : 'Submit assignment'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Assignments;
