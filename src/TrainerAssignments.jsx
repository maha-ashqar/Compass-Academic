import { useEffect, useMemo, useState } from 'react';
import {
  FiArchive,
  FiCalendar,
  FiClock,
  FiCopy,
  FiDownload,
  FiEdit3,
  FiEye,
  FiFileText,
  FiMoreHorizontal,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import {
  archiveTrainerAssignment,
  closeTrainerAssignment,
  createTrainerAssignment,
  deleteTrainerAssignment,
  deleteTrainerSubmission,
  duplicateTrainerAssignment,
  extendTrainerAssignmentDeadline,
  getTrainerAssignmentSubmissions,
  getTrainerAssignments,
  gradeTrainerSubmission,
  publishTrainerAssignment,
  reopenTrainerAssignment,
  requestTrainerResubmission,
  updateTrainerAssignment,
} from './api/trainerAssignments';
import './TrainerAssignments.css';

const emptyForm = {
  courseId: '',
  title: '',
  description: '',
  instructions: '',
  maxGrade: 100,
  openAt: '',
  dueAt: '',
};

const emptyStats = {
  active: 0,
  pending: 0,
  graded: 0,
  closingSoon: 0,
  averageGrade: 0,
};

const formatDate = (value) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const toInputDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }

  const pad = (number) =>
    String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const timeLeft = (dueAt, now) => {
  if (!dueAt) {
    return 'No deadline';
  }

  const distance =
    new Date(dueAt).getTime() - now;

  if (Number.isNaN(distance)) {
    return 'Not set';
  }

  if (distance <= 0) {
    return 'Closed';
  }

  const hours = Math.floor(
    distance / 3600000
  );

  const days = Math.floor(
    hours / 24
  );

  return days
    ? `${days}d ${hours % 24}h left`
    : `${hours}h left`;
};

const capitalize = (word) =>
  word.charAt(0).toUpperCase() +
  word.slice(1);

const courseName = (course) =>
  course?.title || 'General course';

const assignmentState = (
  assignment
) => assignment?.state || 'draft';

function TrainerAssignments() {
  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [courses, setCourses] =
    useState([]);

  const [stats, setStats] =
    useState(emptyStats);

  const [
    serverTime,
    setServerTime,
  ] = useState(null);

  const [query, setQuery] =
    useState('');

  const [tab, setTab] =
    useState('active');

  const [
    courseFilter,
    setCourseFilter,
  ] = useState('all');

  const [
    selectedId,
    setSelectedId,
  ] = useState(null);

  const [
    selectedSubmissions,
    setSelectedSubmissions,
  ] = useState([]);

  const [menuId, setMenuId] =
    useState(null);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [
    reviewOpen,
    setReviewOpen,
  ] = useState(false);

  const [
    submissionId,
    setSubmissionId,
  ] = useState(null);

  const [grade, setGrade] =
    useState('');

  const [
    feedback,
    setFeedback,
  ] = useState('');

  const [
    privateNote,
    setPrivateNote,
  ] = useState('');

  const [
    resubmitDate,
    setResubmitDate,
  ] = useState('');

  const [
    actionModal,
    setActionModal,
  ] = useState(null);

  const [
    actionReason,
    setActionReason,
  ] = useState('');

  const [newDate, setNewDate] =
    useState('');

  const [
    preview,
    setPreview,
  ] = useState(false);

  const [notice, setNotice] =
    useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    working,
    setWorking,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const currentNow = serverTime
    ? new Date(serverTime).getTime()
    : Date.now();

  const activeAssignments =
    useMemo(
      () =>
        assignments.filter(
          (item) =>
            item.status !==
            'archived'
        ),
      [assignments]
    );

  const selected = useMemo(
    () =>
      activeAssignments.find(
        (item) =>
          String(item.id) ===
          String(selectedId)
      ) ||
      activeAssignments[0] ||
      null,
    [
      activeAssignments,
      selectedId,
    ]
  );

  const selectedSubmission =
    selectedSubmissions.find(
      (item) =>
        String(item.id) ===
        String(submissionId)
    ) ||
    selectedSubmissions[0] ||
    null;

  const rows = useMemo(
    () =>
      activeAssignments
        .filter(
          (assignment) => {
            const state =
              assignmentState(
                assignment
              );

            const tabMatch =
              tab === 'active'
                ? state === 'open'
                : tab === state;

            const courseMatch =
              courseFilter ===
                'all' ||
              String(
                assignment.courseId
              ) ===
                courseFilter;

            const searchMatch =
              `${assignment.title} ${assignment.courseTitle}`
                .toLowerCase()
                .includes(
                  query
                    .trim()
                    .toLowerCase()
                );

            return (
              tabMatch &&
              courseMatch &&
              searchMatch
            );
          }
        )
        .sort((a, b) => {
          if (
            !a.dueAt &&
            !b.dueAt
          ) {
            return 0;
          }

          if (!a.dueAt) {
            return 1;
          }

          if (!b.dueAt) {
            return -1;
          }

          return (
            new Date(a.dueAt) -
            new Date(b.dueAt)
          );
        }),
    [
      activeAssignments,
      courseFilter,
      query,
      tab,
    ]
  );

  const flash = (message) => {
    setNotice(message);

    window.setTimeout(
      () => setNotice(''),
      2400
    );
  };

  const loadAssignments = async (
    preferredId = null
  ) => {
    try {
      setLoading(true);
      setError('');

      const data =
        await getTrainerAssignments();

      const nextAssignments =
        Array.isArray(
          data.assignments
        )
          ? data.assignments
          : [];

      setAssignments(
        nextAssignments
      );

      setCourses(
        Array.isArray(
          data.courses
        )
          ? data.courses
          : []
      );

      setStats({
        ...emptyStats,
        ...(data.stats || {}),
      });

      setServerTime(
        data.serverTime || null
      );

      const visible =
        nextAssignments.filter(
          (item) =>
            item.status !==
            'archived'
        );

      const wantedId =
        preferredId ??
        selectedId;

      const stillExists =
        visible.some(
          (item) =>
            String(item.id) ===
            String(wantedId)
        );

      setSelectedId(
        stillExists
          ? wantedId
          : visible[0]?.id ??
              null
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load assignments.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions =
    async (
      assignmentId,
      preferredSubmissionId = null
    ) => {
      if (!assignmentId) {
        setSelectedSubmissions(
          []
        );

        setSubmissionId(null);

        return [];
      }

      try {
        setError('');

        const data =
          await getTrainerAssignmentSubmissions(
            assignmentId
          );

        const list =
          Array.isArray(
            data.submissions
          )
            ? data.submissions
            : [];

        setSelectedSubmissions(
          list
        );

        const wantedId =
          preferredSubmissionId ??
          submissionId;

        const stillExists =
          list.some(
            (item) =>
              String(item.id) ===
              String(wantedId)
          );

        setSubmissionId(
          stillExists
            ? wantedId
            : list[0]?.id ??
                null
        );

        return list;
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
            'Unable to load submissions.'
        );

        setSelectedSubmissions(
          []
        );

        setSubmissionId(null);

        return [];
      }
    };

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (selected?.id) {
      loadSubmissions(
        selected.id
      );
    } else {
      setSelectedSubmissions(
        []
      );

      setSubmissionId(null);
    }
  }, [selected?.id]);

  useEffect(() => {
    if (
      selectedSubmission
    ) {
      setGrade(
        selectedSubmission.grade ??
          ''
      );

      setFeedback(
        selectedSubmission
          .feedback || ''
      );

      setPrivateNote(
        selectedSubmission
          .privateNote || ''
      );

      setResubmitDate(
        toInputDate(
          selectedSubmission
            .resubmissionDueAt
        )
      );
    } else {
      setGrade('');
      setFeedback('');
      setPrivateNote('');
      setResubmitDate('');
    }
  }, [selectedSubmission]);

  const openCreate = () => {
    const openAt =
      toInputDate(
        new Date(
          Date.now() +
            3600000
        )
      );

    const dueAt =
      toInputDate(
        new Date(
          Date.now() +
            8 * 86400000
        )
      );

    setForm({
      ...emptyForm,
      openAt,
      dueAt,
    });

    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (
    assignment
  ) => {
    setForm({
      courseId:
        assignment.courseId,
      title:
        assignment.title ||
        '',
      description:
        assignment.description ||
        '',
      instructions:
        assignment.instructions ||
        '',
      maxGrade:
        assignment.maxGrade ||
        100,
      openAt: toInputDate(
        assignment.openAt
      ),
      dueAt: toInputDate(
        assignment.dueAt
      ),
    });

    setEditingId(
      assignment.id
    );

    setFormOpen(true);
    setMenuId(null);
  };

  const assignmentPayload =
    () => ({
      course_id: Number(
        form.courseId
      ),
      title:
        form.title.trim(),
      description:
        form.description.trim() ||
        null,
      submission_instructions:
        form.instructions.trim() ||
        null,
      max_grade:
        Number(
          form.maxGrade
        ) || 100,
      opens_at:
        form.openAt || null,
      deadline_at:
        form.dueAt || null,
    });

  const saveAssignment =
    async (
      event,
      publish = false
    ) => {
      event.preventDefault();

      if (working) {
        return;
      }

      try {
        setWorking(true);
        setError('');

        let assignmentId =
          editingId;

        if (editingId) {
          await updateTrainerAssignment(
            editingId,
            assignmentPayload()
          );
        } else {
          const data =
            await createTrainerAssignment(
              assignmentPayload()
            );

          assignmentId =
            data.assignment?.id;
        }

        if (
          publish &&
          assignmentId
        ) {
          await publishTrainerAssignment(
            assignmentId
          );
        }

        setFormOpen(false);
        setEditingId(null);

        await loadAssignments(
          assignmentId
        );

        flash(
          publish
            ? 'Assignment published to students.'
            : editingId
              ? 'Assignment updated successfully.'
              : 'Assignment saved as draft.'
        );
      } catch (
        requestError
      ) {
        flash(
          requestError.message ||
            'Unable to save assignment.'
        );
      } finally {
        setWorking(false);
      }
    };

  const handleDuplicate =
    async (assignment) => {
      if (working) {
        return;
      }

      try {
        setWorking(true);
        setMenuId(null);

        const data =
          await duplicateTrainerAssignment(
            assignment.id
          );

        const copyId =
          data.assignment?.id;

        setTab('draft');

        await loadAssignments(
          copyId
        );

        flash(
          'Duplicated as a new draft.'
        );
      } catch (
        requestError
      ) {
        flash(
          requestError.message ||
            'Unable to duplicate assignment.'
        );
      } finally {
        setWorking(false);
      }
    };

  const handleArchive =
    async (assignment) => {
      if (working) {
        return;
      }

      try {
        setWorking(true);
        setMenuId(null);

        await archiveTrainerAssignment(
          assignment.id
        );

        await loadAssignments();

        flash(
          'Assignment archived.'
        );
      } catch (
        requestError
      ) {
        flash(
          requestError.message ||
            'Unable to archive assignment.'
        );
      } finally {
        setWorking(false);
      }
    };

  const submitAction =
    async () => {
      if (
        !selected ||
        working
      ) {
        return;
      }

      try {
        setWorking(true);
        setError('');

        if (
          actionModal ===
          'extend'
        ) {
          if (!newDate) {
            flash(
              'Choose the new deadline.'
            );

            return;
          }

          await extendTrainerAssignmentDeadline(
            selected.id,
            newDate
          );
        }

        if (
          actionModal ===
          'reopen'
        ) {
          if (
            !actionReason.trim() ||
            !newDate
          ) {
            flash(
              'Reason and new deadline are required.'
            );

            return;
          }

          await reopenTrainerAssignment(
            selected.id,
            actionReason.trim(),
            newDate
          );
        }

        if (
          actionModal ===
          'close'
        ) {
          if (
            !actionReason.trim()
          ) {
            flash(
              'Closing reason is required.'
            );

            return;
          }

          await closeTrainerAssignment(
            selected.id,
            actionReason.trim()
          );
        }

        if (
          actionModal ===
          'delete-assignment'
        ) {
          if (
            !actionReason.trim()
          ) {
            flash(
              'Deletion reason is required.'
            );

            return;
          }

          await deleteTrainerAssignment(
            selected.id,
            actionReason.trim()
          );
        }

        if (
          actionModal ===
            'delete-submission' &&
          selectedSubmission
        ) {
          if (
            !actionReason.trim()
          ) {
            flash(
              'Deletion reason is required.'
            );

            return;
          }

          await deleteTrainerSubmission(
            selected.id,
            selectedSubmission.id,
            actionReason.trim()
          );

          setSubmissionId(
            null
          );
        }

        const currentAssignmentId =
          selected.id;

        setActionModal(null);
        setActionReason('');
        setNewDate('');

        await loadAssignments(
          currentAssignmentId
        );

        await loadSubmissions(
          currentAssignmentId
        );

        flash(
          'Changes saved successfully.'
        );
      } catch (
        requestError
      ) {
        flash(
          requestError.message ||
            'Unable to complete the action.'
        );
      } finally {
        setWorking(false);
      }
    };

  const openReview =
    async (assignment) => {
      setSelectedId(
        assignment.id
      );

      setMenuId(null);

      const list =
        await loadSubmissions(
          assignment.id
        );

      setReviewOpen(true);

      if (list[0]) {
        setSubmissionId(
          list[0].id
        );
      }
    };

  const chooseSubmission = (
    item
  ) => {
    setSubmissionId(
      item.id
    );

    setGrade(
      item.grade ?? ''
    );

    setFeedback(
      item.feedback || ''
    );

    setPrivateNote(
      item.privateNote || ''
    );

    setResubmitDate(
      toInputDate(
        item.resubmissionDueAt
      )
    );
  };

  const saveGrade =
    async () => {
      if (
        !selected ||
        !selectedSubmission ||
        grade === '' ||
        working
      ) {
        return;
      }

      const numericGrade =
        Number(grade);

      if (
        Number.isNaN(
          numericGrade
        )
      ) {
        flash(
          'Enter a valid numeric grade.'
        );

        return;
      }

      try {
        setWorking(true);

        await gradeTrainerSubmission(
          selected.id,
          selectedSubmission.id,
          {
            grade: Math.min(
              selected.maxGrade,
              Math.max(
                0,
                numericGrade
              )
            ),
            feedback:
              feedback.trim() ||
              null,
            private_note:
              privateNote.trim() ||
              null,
          }
        );

        await loadAssignments(
          selected.id
        );

        await loadSubmissions(
          selected.id,
          selectedSubmission.id
        );

        flash(
          'Grade and feedback published.'
        );
      } catch (
        requestError
      ) {
        flash(
          requestError.message ||
            'Unable to publish grade.'
        );
      } finally {
        setWorking(false);
      }
    };

  const handleRequestResubmission =
    async () => {
      if (
        !selected ||
        !selectedSubmission ||
        working
      ) {
        return;
      }

      if (
        !feedback.trim()
      ) {
        flash(
          'Feedback is required for a resubmission request.'
        );

        return;
      }

      try {
        setWorking(true);

        await requestTrainerResubmission(
          selected.id,
          selectedSubmission.id,
          {
            feedback:
              feedback.trim(),
            deadline_at:
              resubmitDate ||
              null,
          }
        );

        await loadAssignments(
          selected.id
        );

        await loadSubmissions(
          selected.id,
          selectedSubmission.id
        );

        flash(
          'Resubmission requested.'
        );
      } catch (
        requestError
      ) {
        flash(
          requestError.message ||
            'Unable to request resubmission.'
        );
      } finally {
        setWorking(false);
      }
    };

  const exportGrades =
    async () => {
      if (!selected) {
        flash(
          'Select an assignment first.'
        );

        return;
      }

      try {
        const data =
          await getTrainerAssignmentSubmissions(
            selected.id
          );

        const submissions =
          Array.isArray(
            data.submissions
          )
            ? data.submissions
            : [];

        const escape = (
          value
        ) =>
          `"${String(
            value ?? ''
          ).replaceAll(
            '"',
            '""'
          )}"`;

        const csv = [
          [
            'Student ID',
            'Student',
            'Email',
            'Status',
            'Grade',
            'Maximum',
            'Feedback',
          ],
          ...submissions.map(
            (item) => [
              item.studentId,
              item.studentName,
              item.studentEmail,
              item.status,
              item.grade ?? '',
              selected.maxGrade,
              item.feedback || '',
            ]
          ),
        ]
          .map((row) =>
            row
              .map(escape)
              .join(',')
          )
          .join('\n');

        const url =
          URL.createObjectURL(
            new Blob(
              [
                `\uFEFF${csv}`,
              ],
              {
                type: 'text/csv;charset=utf-8',
              }
            )
          );

        const anchor =
          document.createElement(
            'a'
          );

        anchor.href = url;

        anchor.download =
          `${
            selected.title ||
            'assignment'
          }-grades.csv`;

        document.body.appendChild(
          anchor
        );

        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(
          url
        );
      } catch (
        requestError
      ) {
        flash(
          requestError.message ||
            'Unable to export grades.'
        );
      }
    };

  return (
    <div className="ta-page">
      <div className="ta-page-head">
        <div>
          <span>
            ASSIGNMENT MANAGEMENT
          </span>

          <h1>
            Assignments
          </h1>

          <p>
            Create assignments,
            manage deadlines, and
            review student work.
          </p>
        </div>

        <div className="ta-head-actions">
          <button
            className="primary"
            onClick={
              openCreate
            }
            disabled={
              working
            }
          >
            <FiPlus />
            Create assignment
          </button>

          <button
            onClick={
              exportGrades
            }
            disabled={
              working
            }
          >
            <FiDownload />
            Export grades
          </button>
        </div>
      </div>

      <div className="ta-stats">
        <article>
          <span className="blue">
            <FiFileText />
          </span>

          <strong>
            {stats.active}
          </strong>

          <b>
            Active assignments
          </b>

          <small>
            Across{' '}
            {
              new Set(
                activeAssignments.map(
                  (item) =>
                    item.courseId
                )
              ).size
            }{' '}
            courses
          </small>
        </article>

        <article>
          <span className="purple">
            <FiClock />
          </span>

          <strong>
            {stats.pending}
          </strong>

          <b>
            Pending submissions
          </b>

          <small>
            {stats.graded}{' '}
            already graded
          </small>
        </article>

        <article>
          <span className="orange">
            <FiCalendar />
          </span>

          <strong>
            {
              stats.closingSoon
            }
          </strong>

          <b>
            Closing soon
          </b>

          <small>
            Within the next 48
            hours
          </small>
        </article>
      </div>

      {error && (
        <div className="ta-empty">
          {error}
        </div>
      )}

      <div className="ta-layout">
        <section className="ta-list-card">
          <h2>
            Assignments
          </h2>

          <div className="ta-toolbar">
            <label>
              <FiSearch />

              <input
                value={query}
                onChange={(
                  event
                ) =>
                  setQuery(
                    event.target
                      .value
                  )
                }
                placeholder="Search assignments"
              />
            </label>

            <select
              value={
                courseFilter
              }
              onChange={(
                event
              ) =>
                setCourseFilter(
                  event.target
                    .value
                )
              }
            >
              <option value="all">
                All courses
              </option>

              {courses.map(
                (course) => (
                  <option
                    key={
                      course.id
                    }
                    value={
                      course.id
                    }
                  >
                    {courseName(
                      course
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <p className="ta-sort-note">
            Sorted by nearest
            deadline
          </p>

          <div className="ta-tabs">
            {[
              'active',
              'scheduled',
              'closed',
              'draft',
            ].map(
              (item) => (
                <button
                  key={
                    item
                  }
                  className={
                    tab ===
                    item
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setTab(
                      item
                    )
                  }
                >
                  {capitalize(
                    item
                  )}
                </button>
              )
            )}
          </div>

          <div className="ta-rows">
            {rows.map(
              (
                assignment
              ) => {
                const state =
                  assignmentState(
                    assignment
                  );

                const submitted =
                  Number(
                    assignment.submissionCount ||
                      0
                  );

                const graded =
                  Number(
                    assignment.gradedSubmissions ||
                      0
                  );

                const progress =
                  submitted
                    ? Math.round(
                        (graded /
                          submitted) *
                          100
                      )
                    : 0;

                return (
                  <article
                    key={
                      assignment.id
                    }
                    className={
                      selected?.id ===
                      assignment.id
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      setSelectedId(
                        assignment.id
                      )
                    }
                  >
                    <span
                      className={`ta-row-icon ${state}`}
                    >
                      <FiFileText />
                    </span>

                    <div className="ta-row-copy">
                      <strong>
                        {
                          assignment.title
                        }
                      </strong>

                      <small>
                        {
                          assignment.courseTitle
                        }
                      </small>

                      <em>
                        <FiCalendar />
                        Opens:{' '}
                        {formatDate(
                          assignment.openAt
                        )}

                        <FiClock />
                        Closes:{' '}
                        {formatDate(
                          assignment.dueAt
                        )}
                      </em>
                    </div>

                    <div className="ta-count">
                      <strong>
                        {
                          submitted
                        }
                      </strong>

                      <small>
                        submitted
                      </small>
                    </div>

                    <div className="ta-count">
                      <strong>
                        {graded}/
                        {submitted ||
                          '—'}
                      </strong>

                      <small>
                        graded
                      </small>

                      <i>
                        <b
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </i>
                    </div>

                    <div className="ta-state">
                      <span
                        className={
                          state
                        }
                      >
                        {state}
                      </span>

                      <small>
                        {state ===
                        'open'
                          ? timeLeft(
                              assignment.dueAt,
                              currentNow
                            )
                          : state ===
                              'scheduled'
                            ? `Opens ${formatDate(
                                assignment.openAt
                              )}`
                            : ''}
                      </small>
                    </div>

                    <button
                      className="ta-review"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        openReview(
                          assignment
                        );
                      }}
                    >
                      Review
                      submissions
                    </button>

                    <div className="ta-more">
                      <button
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          setMenuId(
                            menuId ===
                              assignment.id
                              ? null
                              : assignment.id
                          );
                        }}
                      >
                        <FiMoreHorizontal />
                      </button>

                      {menuId ===
                        assignment.id && (
                        <div>
                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              openEdit(
                                assignment
                              );
                            }}
                          >
                            <FiEdit3 />
                            Edit
                          </button>

                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleDuplicate(
                                assignment
                              );
                            }}
                          >
                            <FiCopy />
                            Duplicate
                          </button>

                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleArchive(
                                assignment
                              );
                            }}
                          >
                            <FiArchive />
                            Archive
                          </button>

                          <button
                            className="danger"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              setSelectedId(
                                assignment.id
                              );

                              setActionModal(
                                'delete-assignment'
                              );

                              setMenuId(
                                null
                              );
                            }}
                          >
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              }
            )}

            {loading && (
              <div className="ta-empty">
                Loading
                assignments...
              </div>
            )}

            {!loading &&
              !rows.length && (
                <div className="ta-empty">
                  No assignments
                  match this
                  section.
                </div>
              )}
          </div>
        </section>

        <aside className="ta-side">
          <section className="ta-selected">
            <span>
              Selected assignment
            </span>

            {selected ? (
              <>
                <h3>
                  {
                    selected.title
                  }
                </h3>

                <dl>
                  <div>
                    <dt>
                      Course
                    </dt>

                    <dd>
                      {
                        selected.courseTitle
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Opens
                    </dt>

                    <dd>
                      {formatDate(
                        selected.openAt
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Deadline
                    </dt>

                    <dd>
                      {formatDate(
                        selected.dueAt
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Time remaining
                    </dt>

                    <dd className="orange-text">
                      {timeLeft(
                        selected.dueAt,
                        currentNow
                      )}
                    </dd>
                  </div>
                </dl>

                <button
                  className="primary"
                  onClick={() =>
                    openReview(
                      selected
                    )
                  }
                >
                  Review submissions
                </button>

                <button
                  onClick={() => {
                    setActionModal(
                      'extend'
                    );

                    setNewDate(
                      toInputDate(
                        selected.dueAt
                      )
                    );
                  }}
                >
                  <FiCalendar />
                  Extend deadline
                </button>

                <button
                  className="link"
                  onClick={() =>
                    openEdit(
                      selected
                    )
                  }
                >
                  <FiEdit3 />
                  Edit assignment
                </button>

                <button
                  className="link danger-text"
                  onClick={() => {
                    const state =
                      assignmentState(
                        selected
                      );

                    setActionModal(
                      state ===
                        'closed'
                        ? 'reopen'
                        : 'close'
                    );

                    setNewDate(
                      state ===
                        'closed'
                        ? toInputDate(
                            selected.dueAt
                          )
                        : ''
                    );
                  }}
                >
                  {assignmentState(
                    selected
                  ) === 'closed' ? (
                    <FiRefreshCw />
                  ) : (
                    <FiX />
                  )}

                  {assignmentState(
                    selected
                  ) === 'closed'
                    ? ' Reopen assignment'
                    : ' Close now'}
                </button>

                <p className="ta-info">
                  Student
                  submissions close
                  automatically when
                  the deadline ends.
                </p>
              </>
            ) : (
              <p>
                Select an
                assignment to see
                its schedule and
                actions.
              </p>
            )}
          </section>

          <section>
            <h3>
              Recent submissions
            </h3>

            {selectedSubmissions
              .slice(0, 4)
              .map(
                (item) => (
                  <button
                    className="ta-recent"
                    key={
                      item.id
                    }
                    onClick={() => {
                      chooseSubmission(
                        item
                      );

                      setReviewOpen(
                        true
                      );
                    }}
                  >
                    <span>
                      {(item.studentName ||
                        'Student')
                        .split(' ')
                        .map(
                          (
                            part
                          ) =>
                            part[0]
                        )
                        .slice(
                          0,
                          2
                        )
                        .join('')}
                    </span>

                    <div>
                      <strong>
                        {
                          item.studentName
                        }
                      </strong>

                      <small>
                        {formatDate(
                          item.submittedAt
                        )}
                      </small>
                    </div>

                    <em
                      className={
                        item.status
                      }
                    >
                      {
                        item.status
                      }
                    </em>
                  </button>
                )
              )}

            {!selectedSubmissions.length && (
              <p>
                No student
                submissions yet.
              </p>
            )}
          </section>

          <section className="ta-grading">
            <h3>
              Grading progress
            </h3>

            <div>
              <span>
                <strong>
                  {
                    stats.graded
                  }
                </strong>

                <small>
                  Graded
                </small>
              </span>

              <span>
                <strong>
                  {
                    stats.pending
                  }
                </strong>

                <small>
                  Awaiting review
                </small>
              </span>

              <span>
                <strong>
                  {
                    stats.averageGrade
                  }
                </strong>

                <small>
                  Average grade
                </small>
              </span>
            </div>
          </section>
        </aside>
      </div>

      <button
        className="ta-preview-bar"
        onClick={() =>
          selected
            ? setPreview(
                true
              )
            : flash(
                'Select an assignment first.'
              )
        }
      >
        <FiEye />
        Changes sync
        automatically with the
        student dashboard.

        <span>
          Preview student view →
        </span>
      </button>

      {formOpen && (
        <AssignmentForm
          form={form}
          setForm={setForm}
          courses={courses}
          editing={Boolean(
            editingId
          )}
          working={working}
          onClose={() =>
            setFormOpen(false)
          }
          onSave={
            saveAssignment
          }
        />
      )}

      {reviewOpen &&
        selected && (
          <ReviewModal
            assignment={
              selected
            }
            submissions={
              selectedSubmissions
            }
            selected={
              selectedSubmission
            }
            onChoose={
              chooseSubmission
            }
            grade={grade}
            setGrade={
              setGrade
            }
            feedback={
              feedback
            }
            setFeedback={
              setFeedback
            }
            privateNote={
              privateNote
            }
            setPrivateNote={
              setPrivateNote
            }
            resubmitDate={
              resubmitDate
            }
            setResubmitDate={
              setResubmitDate
            }
            onGrade={
              saveGrade
            }
            onResubmit={
              handleRequestResubmission
            }
            onDelete={() =>
              setActionModal(
                'delete-submission'
              )
            }
            onClose={() =>
              setReviewOpen(
                false
              )
            }
            working={
              working
            }
          />
        )}

      {actionModal && (
        <ActionModal
          type={
            actionModal
          }
          reason={
            actionReason
          }
          setReason={
            setActionReason
          }
          date={newDate}
          setDate={
            setNewDate
          }
          onClose={() =>
            setActionModal(
              null
            )
          }
          onConfirm={
            submitAction
          }
          working={
            working
          }
        />
      )}

      {preview &&
        selected && (
          <StudentPreview
            assignment={
              selected
            }
            state={assignmentState(
              selected
            )}
            onClose={() =>
              setPreview(
                false
              )
            }
          />
        )}

      {notice && (
        <div className="ta-toast">
          {notice}
        </div>
      )}
    </div>
  );
}

function AssignmentForm({
  form,
  setForm,
  courses,
  editing,
  working,
  onClose,
  onSave,
}) {
  return (
    <div className="ta-modal">
      <form
        onSubmit={(
          event
        ) =>
          onSave(
            event,
            false
          )
        }
      >
        <button
          type="button"
          className="ta-close"
          onClick={
            onClose
          }
        >
          <FiX />
        </button>

        <h2>
          {editing
            ? 'Edit assignment'
            : 'Create assignment'}
        </h2>

        <p>
          Save it as a draft or
          publish it immediately
          to enrolled students.
        </p>

        <div className="ta-two">
          <label>
            Course

            <select
              required
              value={
                form.courseId
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  courseId:
                    event.target
                      .value,
                })
              }
            >
              <option value="">
                Select course
              </option>

              {courses.map(
                (course) => (
                  <option
                    key={
                      course.id
                    }
                    value={
                      course.id
                    }
                  >
                    {courseName(
                      course
                    )}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Maximum grade

            <input
              type="number"
              min="1"
              value={
                form.maxGrade
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  maxGrade:
                    event.target
                      .value,
                })
              }
            />
          </label>
        </div>

        <label>
          Title

          <input
            required
            value={
              form.title
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,
                title:
                  event.target
                    .value,
              })
            }
          />
        </label>

        <label>
          Description

          <textarea
            value={
              form.description
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,
                description:
                  event.target
                    .value,
              })
            }
          />
        </label>

        <label>
          Submission instructions

          <textarea
            value={
              form.instructions
            }
            onChange={(
              event
            ) =>
              setForm({
                ...form,
                instructions:
                  event.target
                    .value,
              })
            }
          />
        </label>

        <div className="ta-two">
          <label>
            Opens at

            <input
              type="datetime-local"
              value={
                form.openAt
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  openAt:
                    event.target
                      .value,
                })
              }
            />
          </label>

          <label>
            Deadline

            <input
              type="datetime-local"
              value={
                form.dueAt
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  dueAt:
                    event.target
                      .value,
                })
              }
            />
          </label>
        </div>

        <div className="ta-form-actions">
          <button
            type="submit"
            disabled={
              working
            }
          >
            {editing
              ? 'Save changes'
              : 'Save draft'}
          </button>

          <button
            type="button"
            className="primary"
            disabled={
              working
            }
            onClick={(
              event
            ) =>
              onSave(
                event,
                true
              )
            }
          >
            <FiUpload />
            Publish assignment
          </button>
        </div>
      </form>
    </div>
  );
}

function ReviewModal({
  assignment,
  submissions,
  selected,
  onChoose,
  grade,
  setGrade,
  feedback,
  setFeedback,
  privateNote,
  setPrivateNote,
  resubmitDate,
  setResubmitDate,
  onGrade,
  onResubmit,
  onDelete,
  onClose,
  working,
}) {
  return (
    <div className="ta-modal">
      <div className="ta-review-modal">
        <button
          className="ta-close"
          onClick={
            onClose
          }
        >
          <FiX />
        </button>

        <div className="ta-review-head">
          <span>
            SUBMISSION REVIEW
          </span>

          <h2>
            {
              assignment.title
            }
          </h2>

          <p>
            {
              submissions.length
            }{' '}
            submissions · maximum
            grade{' '}
            {
              assignment.maxGrade
            }
          </p>
        </div>

        <div className="ta-review-layout">
          <aside>
            {submissions.map(
              (item) => (
                <button
                  key={
                    item.id
                  }
                  className={
                    selected?.id ===
                    item.id
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    onChoose(
                      item
                    )
                  }
                >
                  <span>
                    {(item.studentName ||
                      'Student')
                      .split(' ')
                      .map(
                        (
                          part
                        ) =>
                          part[0]
                      )
                      .slice(
                        0,
                        2
                      )
                      .join('')}
                  </span>

                  <div>
                    <strong>
                      {
                        item.studentName
                      }
                    </strong>

                    <small>
                      {
                        item.status
                      }
                    </small>
                  </div>
                </button>
              )
            )}

            {!submissions.length && (
              <p>
                No submissions yet.
              </p>
            )}
          </aside>

          <main>
            {selected ? (
              <>
                <div className="ta-submission-meta">
                  <div>
                    <span>
                      Student
                    </span>

                    <strong>
                      {
                        selected.studentName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Submitted
                    </span>

                    <strong>
                      {formatDate(
                        selected.submittedAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {
                        selected.status
                      }
                    </strong>
                  </div>
                </div>

                <section>
                  <h3>
                    {selected.title ||
                      'Student submission'}
                  </h3>

                  <p>
                    {selected.text ||
                      'No written description was included.'}
                  </p>

                  {(selected.files ||
                    []).map(
                    (file) => (
                      <a
                        key={
                          file.id ||
                          file.name
                        }
                        href={
                          file.url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FiFileText />
                        {
                          file.name
                        }
                      </a>
                    )
                  )}
                </section>

                <div className="ta-two">
                  <label>
                    Grade /{' '}
                    {
                      assignment.maxGrade
                    }

                    <input
                      type="number"
                      min="0"
                      max={
                        assignment.maxGrade
                      }
                      value={
                        grade
                      }
                      onChange={(
                        event
                      ) =>
                        setGrade(
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </label>

                  <label>
                    Private trainer
                    note

                    <textarea
                      value={
                        privateNote
                      }
                      onChange={(
                        event
                      ) =>
                        setPrivateNote(
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </label>
                </div>

                <label>
                  Feedback visible
                  to student

                  <textarea
                    value={
                      feedback
                    }
                    onChange={(
                      event
                    ) =>
                      setFeedback(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  New deadline if
                  requesting
                  resubmission
                  (optional)

                  <input
                    type="datetime-local"
                    value={
                      resubmitDate
                    }
                    onChange={(
                      event
                    ) =>
                      setResubmitDate(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <div className="ta-review-actions">
                  <button
                    disabled={
                      working
                    }
                    onClick={
                      onResubmit
                    }
                  >
                    <FiRefreshCw />
                    Request
                    resubmission
                  </button>

                  <button
                    className="primary"
                    disabled={
                      working
                    }
                    onClick={
                      onGrade
                    }
                  >
                    Publish grade
                  </button>

                  <button
                    className="danger-text"
                    disabled={
                      working
                    }
                    onClick={
                      onDelete
                    }
                  >
                    <FiTrash2 />
                    Delete submission
                  </button>
                </div>
              </>
            ) : (
              <div className="ta-empty">
                Choose a student
                submission.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ActionModal({
  type,
  reason,
  setReason,
  date,
  setDate,
  onClose,
  onConfirm,
  working,
}) {
  const needsDate = [
    'extend',
    'reopen',
  ].includes(type);

  const needsReason = [
    'reopen',
    'close',
    'delete-assignment',
    'delete-submission',
  ].includes(type);

  return (
    <div className="ta-modal">
      <div className="ta-action-dialog">
        <button
          className="ta-close"
          onClick={
            onClose
          }
        >
          <FiX />
        </button>

        <h2>
          {type.replaceAll(
            '-',
            ' '
          )}
        </h2>

        <p>
          Confirm this action
          before continuing.
        </p>

        {needsDate && (
          <label>
            New deadline

            <input
              type="datetime-local"
              value={
                date
              }
              onChange={(
                event
              ) =>
                setDate(
                  event.target
                    .value
                )
              }
            />
          </label>
        )}

        {needsReason && (
          <label>
            Reason

            <textarea
              value={
                reason
              }
              onChange={(
                event
              ) =>
                setReason(
                  event.target
                    .value
                )
              }
              placeholder="A clear reason is required"
            />
          </label>
        )}

        <button
          className="primary"
          disabled={
            working
          }
          onClick={
            onConfirm
          }
        >
          Confirm action
        </button>
      </div>
    </div>
  );
}

function StudentPreview({
  assignment,
  state,
  onClose,
}) {
  return (
    <div className="ta-modal">
      <div className="ta-student-preview">
        <button
          className="ta-close"
          onClick={
            onClose
          }
        >
          <FiX />
        </button>

        <span>
          STUDENT PREVIEW
        </span>

        <h2>
          {
            assignment.title
          }
        </h2>

        <p>
          {
            assignment.courseTitle
          }
        </p>

        <i
          className={
            state
          }
        >
          {state}
        </i>

        <dl>
          <div>
            <dt>
              Available from
            </dt>

            <dd>
              {formatDate(
                assignment.openAt
              )}
            </dd>
          </div>

          <div>
            <dt>
              Deadline
            </dt>

            <dd>
              {formatDate(
                assignment.dueAt
              )}
            </dd>
          </div>

          <div>
            <dt>
              Maximum grade
            </dt>

            <dd>
              {
                assignment.maxGrade
              }
            </dd>
          </div>
        </dl>

        <section>
          <h3>
            Description
          </h3>

          <p>
            {assignment.description ||
              'No description provided.'}
          </p>

          <h3>
            Submission
            instructions
          </h3>

          <p>
            {assignment.instructions ||
              'No submission instructions provided.'}
          </p>
        </section>

        <button
          className="primary"
          disabled={
            state !== 'open'
          }
        >
          {state === 'open'
            ? 'Submit assignment'
            : 'Submission is closed'}
        </button>
      </div>
    </div>
  );
}

export default TrainerAssignments;