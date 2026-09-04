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
import {
  deleteStudentAssignmentFile,
  getStudentAssignment,
  getStudentAssignments,
  saveStudentAssignmentDraft,
  submitStudentAssignment,
  uploadStudentAssignmentFiles,
} from './api/studentAssignments';
import './Assignments.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'graded', label: 'Graded' },
];

const normalizeSubmission = (submission) => {
  if (!submission) {
    return null;
  }

  return {
    id: submission.id,
    submissionName: submission.submission_name || '',
    note: submission.note || '',
    status: submission.status || 'draft',
    submittedAt: submission.submitted_at || null,
    grade:
      submission.grade !== null &&
      submission.grade !== undefined
        ? Number(submission.grade)
        : null,
    feedback: submission.feedback || '',
    gradedAt: submission.graded_at || null,
    files: Array.isArray(submission.files)
      ? submission.files.map((file) => ({
          id: file.id,
          name: file.name,
          type: file.type || '',
          size: Number(file.size || 0),
          url: file.url || '',
          uploaded: true,
        }))
      : [],
  };
};

const normalizeAssignment = (assignment) => ({
  id: assignment.id,
  title: assignment.title,
  description: assignment.description || '',
  submissionInstructions:
    assignment.submission_instructions || '',
  maxGrade: Number(assignment.max_grade || 0),
  opensAt: assignment.opens_at || null,
  deadlineAt: assignment.deadline_at || null,
  status: assignment.status,
  assignmentState:
    assignment.assignment_state || 'open',
  daysLeft:
    assignment.days_left === null ||
    assignment.days_left === undefined
      ? null
      : Number(assignment.days_left),
  filterStatus:
    assignment.filter_status || 'pending',
  canSubmit: Boolean(assignment.can_submit),
  courseId: assignment.course?.id,
  courseTitle:
    assignment.course?.title || 'General course',
  submission: normalizeSubmission(
    assignment.submission
  ),
});

const isSubmittedStatus = (status) =>
  ['submitted', 'late', 'resubmitted'].includes(
    status
  );

const Assignments = () => {
  const [activeFilter, setActiveFilter] =
    useState('all');
  const [assignments, setAssignments] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    overdue: 0,
    submitted: 0,
    graded: 0,
  });
  const [selectedAssignment, setSelectedAssignment] =
    useState(null);
  const [submissionTitle, setSubmissionTitle] =
    useState('');
  const [submissionNote, setSubmissionNote] =
    useState('');
  const [submissionFiles, setSubmissionFiles] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submissionError, setSubmissionError] =
    useState('');
  const [submissionNotice, setSubmissionNotice] =
    useState('');
  const [pageError, setPageError] = useState('');

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setPageError('');

      const data = await getStudentAssignments();

      setAssignments(
        Array.isArray(data.assignments)
          ? data.assignments.map(
              normalizeAssignment
            )
          : []
      );

      setCounts({
        all: Number(data.counts?.all || 0),
        pending: Number(
          data.counts?.pending || 0
        ),
        overdue: Number(
          data.counts?.overdue || 0
        ),
        submitted: Number(
          data.counts?.submitted || 0
        ),
        graded: Number(
          data.counts?.graded || 0
        ),
      });
    } catch (error) {
      setPageError(
        error.message ||
          'Unable to load assignments.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    return () => {
      submissionFiles.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [submissionFiles]);

  const filteredAssignments = useMemo(() => {
    if (activeFilter === 'all') {
      return assignments;
    }

    return assignments.filter(
      (assignment) =>
        assignment.filterStatus === activeFilter
    );
  }, [activeFilter, assignments]);

  const openSubmissionPage = async (
    assignment
  ) => {
    try {
      setOpeningId(assignment.id);
      setPageError('');

      const data = await getStudentAssignment(
        assignment.id
      );

      const detailedAssignment =
        normalizeAssignment(data.assignment);

      setSelectedAssignment(detailedAssignment);
      setSubmissionTitle(
        detailedAssignment.submission
          ?.submissionName ||
          `${detailedAssignment.title} submission`
      );
      setSubmissionNote(
        detailedAssignment.submission?.note || ''
      );
      setSubmissionFiles(
        detailedAssignment.submission?.files || []
      );
      setSubmissionError('');
      setSubmissionNotice('');
    } catch (error) {
      setPageError(
        error.message ||
          'Unable to open assignment.'
      );
    } finally {
      setOpeningId(null);
    }
  };

  const handleFiles = (event) => {
    const selected = Array.from(
      event.target.files || []
    );

    setSubmissionError('');

    if (
      submissionFiles.length + selected.length >
      3
    ) {
      setSubmissionError(
        'You can attach up to 3 files.'
      );
      event.target.value = '';
      return;
    }

    const oversized = selected.find(
      (file) => file.size > 1024 * 1024
    );

    if (oversized) {
      setSubmissionError(
        `${oversized.name} is larger than 1 MB.`
      );
      event.target.value = '';
      return;
    }

    const preparedFiles = selected.map(
      (file, index) => ({
        id: `local-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type:
          file.type ||
          'application/octet-stream',
        file,
        previewUrl: file.type.startsWith(
          'image/'
        )
          ? URL.createObjectURL(file)
          : '',
        uploaded: false,
      })
    );

    setSubmissionFiles((current) => [
      ...current,
      ...preparedFiles,
    ]);

    event.target.value = '';
  };

  const refreshSelectedAssignment =
    async () => {
      if (!selectedAssignment) {
        return null;
      }

      const data = await getStudentAssignment(
        selectedAssignment.id
      );

      const refreshed = normalizeAssignment(
        data.assignment
      );

      setSelectedAssignment(refreshed);
      setSubmissionTitle(
        refreshed.submission?.submissionName ||
          `${refreshed.title} submission`
      );
      setSubmissionNote(
        refreshed.submission?.note || ''
      );
      setSubmissionFiles(
        refreshed.submission?.files || []
      );

      return refreshed;
    };

  const saveDraftAndPendingFiles =
    async () => {
      const cleanTitle = submissionTitle.trim();

      if (!cleanTitle) {
        throw new Error(
          'Please enter a submission name.'
        );
      }

      await saveStudentAssignmentDraft(
        selectedAssignment.id,
        {
          submission_name: cleanTitle,
          note: submissionNote.trim(),
        }
      );

      const pendingFiles = submissionFiles
        .filter((file) => !file.uploaded)
        .map((file) => file.file);

      if (pendingFiles.length > 0) {
        await uploadStudentAssignmentFiles(
          selectedAssignment.id,
          pendingFiles
        );
      }

      return refreshSelectedAssignment();
    };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setSubmissionError('');
      setSubmissionNotice('');

      await saveDraftAndPendingFiles();

      setSubmissionNotice(
        'Draft saved successfully. You can return and finish it later.'
      );
    } catch (error) {
      setSubmissionError(
        error.message ||
          'Unable to save submission draft.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSubmission = async () => {
    if (!submissionTitle.trim()) {
      setSubmissionError(
        'Please enter a submission name.'
      );
      return;
    }

    if (!submissionFiles.length) {
      setSubmissionError(
        'Please add at least one file or image before submitting.'
      );
      return;
    }

    if (!selectedAssignment.canSubmit) {
      setSubmissionError(
        'This assignment is not open for submission.'
      );
      return;
    }

    try {
      setSaving(true);
      setSubmissionError('');
      setSubmissionNotice('');

      const refreshed =
        await saveDraftAndPendingFiles();

      if (
        !refreshed?.submission?.files?.length
      ) {
        throw new Error(
          'Please add at least one file or image before submitting.'
        );
      }

      await submitStudentAssignment(
        selectedAssignment.id,
        {
          submission_name:
            submissionTitle.trim(),
          note: submissionNote.trim(),
        }
      );

      setSubmissionNotice(
        'Your assignment was submitted successfully.'
      );

      await loadAssignments();

      window.setTimeout(() => {
        setSelectedAssignment(null);
        setSubmissionNotice('');
      }, 900);
    } catch (error) {
      setSubmissionError(
        error.message ||
          'Unable to submit assignment.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFile = async (file) => {
    if (!file.uploaded) {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }

      setSubmissionFiles((current) =>
        current.filter(
          (item) => item.id !== file.id
        )
      );

      return;
    }

    try {
      setSaving(true);
      setSubmissionError('');
      setSubmissionNotice('');

      await deleteStudentAssignmentFile(
        selectedAssignment.id,
        file.id
      );

      setSubmissionFiles((current) =>
        current.filter(
          (item) => item.id !== file.id
        )
      );
    } catch (error) {
      setSubmissionError(
        error.message ||
          'Unable to remove file.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatus = (assignment) => {
    if (
      assignment.submission?.status === 'graded'
    ) {
      return {
        label: `Graded · ${
          assignment.submission.grade ?? 0
        }/${assignment.maxGrade}`,
        type: 'graded',
      };
    }

    if (
      isSubmittedStatus(
        assignment.submission?.status
      )
    ) {
      return {
        label: 'Submitted',
        type: 'submitted',
      };
    }

    if (
      assignment.assignmentState ===
      'scheduled'
    ) {
      return {
        label: 'Scheduled',
        type: 'scheduled',
      };
    }

    if (
      assignment.assignmentState ===
        'closed' ||
      (assignment.daysLeft !== null &&
        assignment.daysLeft < 0)
    ) {
      return {
        label: 'Overdue',
        type: 'overdue',
      };
    }

    if (assignment.daysLeft === null) {
      return {
        label: 'Open',
        type: 'open',
      };
    }

    if (assignment.daysLeft === 0) {
      return {
        label: 'Due today',
        type: 'soon',
      };
    }

    if (assignment.daysLeft <= 2) {
      return {
        label: `${assignment.daysLeft} days left`,
        type: 'soon',
      };
    }

    return {
      label: `${assignment.daysLeft} days left`,
      type: 'open',
    };
  };

  if (selectedAssignment) {
    const submissionStatus =
      selectedAssignment.submission?.status;

    const isLocked =
      Boolean(submissionStatus) &&
      !['draft', 'revision_requested'].includes(
        submissionStatus
      );

    return (
      <section className="student-submission-page">
        <button
          type="button"
          className="student-submission-back"
          onClick={() =>
            setSelectedAssignment(null)
          }
          disabled={saving}
        >
          <FiArrowLeft /> Back to assignments
        </button>

        <header className="student-submission-header">
          <div>
            <span>ASSIGNMENT SUBMISSION</span>
            <h1>
              {selectedAssignment.title}
            </h1>
            <p>
              {selectedAssignment.courseTitle}
            </p>
          </div>

          <span
            className={`student-submission-state is-${selectedAssignment.assignmentState}`}
          >
            {isLocked
              ? submissionStatus
              : selectedAssignment.assignmentState}
          </span>
        </header>

        <div className="student-submission-layout">
          <main className="student-submission-form-card">
            <div className="student-submission-section-title">
              <FiFileText />

              <div>
                <h2>
                  Prepare your submission
                </h2>

                <p>
                  Add a clear name, your file or
                  image, then save the submission.
                </p>
              </div>
            </div>

            <label className="student-submission-field">
              <span>Submission name *</span>

              <input
                type="text"
                value={submissionTitle}
                onChange={(event) =>
                  setSubmissionTitle(
                    event.target.value
                  )
                }
                placeholder="Example: Responsive design final solution"
                disabled={isLocked || saving}
              />
            </label>

            <label className="student-submission-field">
              <span>Note to your instructor</span>

              <textarea
                value={submissionNote}
                onChange={(event) =>
                  setSubmissionNote(
                    event.target.value
                  )
                }
                placeholder="Write a short note about your work..."
                disabled={isLocked || saving}
              />
            </label>

            <div className="student-upload-area">
              <FiUploadCloud />
              <h3>Add file or image</h3>

              <p>
                PDF, DOCX, ZIP, PPTX, PNG or JPG ·
                up to 3 files, 1 MB each
              </p>

              <label
                className={
                  isLocked || saving
                    ? 'is-disabled'
                    : ''
                }
              >
                <FiPaperclip /> Choose files

                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.zip,.ppt,.pptx,image/png,image/jpeg,image/webp"
                  onChange={handleFiles}
                  disabled={isLocked || saving}
                />
              </label>
            </div>

            {submissionFiles.length > 0 && (
              <div className="student-uploaded-files">
                <h3>
                  Attached files{' '}
                  <span>
                    {submissionFiles.length}
                  </span>
                </h3>

                {submissionFiles.map((file) => (
                  <article
                    key={file.id || file.name}
                  >
                    <span>
                      {file.type?.startsWith(
                        'image/'
                      ) ? (
                        <FiImage />
                      ) : (
                        <FiFileText />
                      )}
                    </span>

                    <div>
                      <strong>{file.name}</strong>

                      <small>
                        {Math.max(
                          1,
                          Math.round(
                            (file.size || 0) /
                              1024
                          )
                        )}{' '}
                        KB
                      </small>
                    </div>

                    {file.type?.startsWith(
                      'image/'
                    ) &&
                      (file.previewUrl ||
                        file.url) && (
                        <img
                          src={
                            file.previewUrl ||
                            file.url
                          }
                          alt={file.name}
                        />
                      )}

                    {!isLocked && (
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() =>
                          handleRemoveFile(file)
                        }
                        disabled={saving}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}

            {submissionError && (
              <p className="student-submission-message is-error">
                {submissionError}
              </p>
            )}

            {submissionNotice && (
              <p className="student-submission-message is-success">
                {submissionNotice}
              </p>
            )}

            {!isLocked && (
              <div className="student-submission-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  <FiSave />{' '}
                  {saving
                    ? 'Saving...'
                    : 'Save draft'}
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={
                    handleFinalSubmission
                  }
                  disabled={
                    saving ||
                    !selectedAssignment.canSubmit
                  }
                >
                  <FiCheckCircle />{' '}
                  {saving
                    ? 'Saving...'
                    : submissionStatus ===
                        'revision_requested'
                      ? 'Resubmit assignment'
                      : 'Save submission'}
                </button>
              </div>
            )}
          </main>

          <aside className="student-submission-brief">
            <h2>Assignment details</h2>

            <dl>
              <div>
                <dt>Course</dt>
                <dd>
                  {selectedAssignment.courseTitle}
                </dd>
              </div>

              <div>
                <dt>Status</dt>
                <dd>
                  {
                    selectedAssignment.assignmentState
                  }
                </dd>
              </div>

              <div>
                <dt>Deadline</dt>

                <dd>
                  {selectedAssignment.deadlineAt
                    ? new Date(
                        selectedAssignment.deadlineAt
                      ).toLocaleString()
                    : 'Course schedule'}
                </dd>
              </div>

              <div>
                <dt>Max grade</dt>
                <dd>
                  {selectedAssignment.maxGrade}
                </dd>
              </div>
            </dl>

            <h3>Instructions</h3>

            <p>
              {selectedAssignment
                .submissionInstructions ||
                selectedAssignment.description ||
                'No instructions provided.'}
            </p>

            <div className="student-submission-policy">
              <FiAlertCircle />

              <span>
                After final submission, the files
                are locked until the instructor
                requests a resubmission.
              </span>
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

          <p>
            Track everything due across your
            enrolled courses in one place.
          </p>
        </div>

        <div className="student-assignments-summary">
          <FiFileText />
          <strong>
            {counts.pending + counts.overdue}
          </strong>
          <span>Tasks to complete</span>
        </div>
      </header>

      <nav
        className="student-assignments-filters"
        aria-label="Assignment filters"
      >
        {FILTERS.map((filter) => (
          <button
            type="button"
            key={filter.id}
            className={
              activeFilter === filter.id
                ? 'is-active'
                : ''
            }
            onClick={() =>
              setActiveFilter(filter.id)
            }
          >
            {filter.label}
            <span>{counts[filter.id]}</span>
          </button>
        ))}
      </nav>

      {pageError && (
        <div className="student-assignments-empty">
          <FiAlertCircle />
          <h2>Unable to load assignments</h2>
          <p>{pageError}</p>

          <button
            type="button"
            className="student-assignment-action"
            onClick={loadAssignments}
          >
            Try again
          </button>
        </div>
      )}

      {!pageError && loading && (
        <div className="student-assignments-empty">
          <FiClock />
          <h2>Loading assignments...</h2>
        </div>
      )}

      {!pageError &&
        !loading &&
        filteredAssignments.length === 0 && (
          <div className="student-assignments-empty">
            <FiCheckCircle />

            <h2>
              {assignments.length
                ? 'Nothing here'
                : 'No assignments yet'}
            </h2>

            <p>
              {assignments.length
                ? 'No assignments match this filter right now.'
                : 'Enroll in a course to start seeing your assignments here.'}
            </p>
          </div>
        )}

      {!pageError &&
        !loading &&
        filteredAssignments.length > 0 && (
          <div className="student-assignments-list">
            {filteredAssignments.map(
              (assignment) => {
                const status =
                  getStatus(assignment);

                const submissionStatus =
                  assignment.submission?.status;

                const graded =
                  submissionStatus === 'graded';

                const submitted =
                  isSubmittedStatus(
                    submissionStatus
                  );

                const actionDisabled =
                  !assignment.canSubmit;

                return (
                  <article
                    key={assignment.id}
                    className={`student-assignment-card is-${status.type}`}
                  >
                    <div className="student-assignment-icon">
                      {status.type ===
                      'overdue' ? (
                        <FiAlertCircle />
                      ) : (
                        <FiFileText />
                      )}
                    </div>

                    <div className="student-assignment-content">
                      <div className="student-assignment-topline">
                        <span
                          className="student-assignment-course"
                          title={
                            assignment.courseTitle
                          }
                        >
                          {
                            assignment.courseTitle
                          }
                        </span>

                        <span
                          className={`student-assignment-status is-${status.type}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <h2>{assignment.title}</h2>

                      <p>
                        {assignment.description}
                      </p>

                      <div className="student-assignment-meta">
                        <span>
                          <FiCalendar />{' '}
                          {assignment.deadlineAt
                            ? new Date(
                                assignment.deadlineAt
                              ).toLocaleDateString()
                            : 'Course schedule'}
                        </span>

                        <span>
                          <FiClock />{' '}
                          {assignment.assignmentState ===
                          'closed'
                            ? 'Submission closed'
                            : 'Online submission'}
                        </span>
                      </div>

                      {graded &&
                        assignment.submission
                          ?.feedback && (
                          <div className="student-assignment-feedback">
                            <strong>
                              Instructor feedback
                            </strong>

                            <p>
                              {
                                assignment
                                  .submission
                                  .feedback
                              }
                            </p>
                          </div>
                        )}
                    </div>

                    {!graded && (
                      <button
                        type="button"
                        className="student-assignment-action"
                        disabled={
                          actionDisabled ||
                          String(openingId) ===
                            String(
                              assignment.id
                            )
                        }
                        onClick={() =>
                          openSubmissionPage(
                            assignment
                          )
                        }
                      >
                        {String(openingId) ===
                        String(assignment.id)
                          ? 'Opening...'
                          : submitted
                            ? 'Submitted'
                            : submissionStatus ===
                                'draft'
                              ? 'Continue submission'
                              : submissionStatus ===
                                  'revision_requested'
                                ? 'Resubmit assignment'
                                : assignment.assignmentState ===
                                    'scheduled'
                                  ? 'Not open yet'
                                  : assignment.assignmentState ===
                                      'closed'
                                    ? 'Submission closed'
                                    : 'Submit assignment'}
                      </button>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
    </section>
  );
};

export default Assignments;
