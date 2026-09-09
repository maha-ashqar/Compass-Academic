import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FiAward,
  FiBriefcase,
  FiDownload,
  FiFileText,
  FiMail,
  FiSearch,
  FiTrendingUp,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import {
  getTrainerStudent,
  getTrainerStudents,
} from './api/trainerStudents';
import './TrainerStudents.css';

const PAGE_SIZE = 8;

const statusLabels = {
  'on-track': 'On track',
  'needs-feedback': 'Needs feedback',
  inactive: 'Inactive',
};

const initialsAvatar = (name) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name || 'Student'
  )}`;

const daysSince = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() - date.getTime()) /
        86400000
    )
  );
};

const formatLastActive = (value) => {
  const days = daysSince(value);

  if (days === null) {
    return 'No activity yet';
  }

  if (days === 0) {
    return 'Today';
  }

  if (days === 1) {
    return 'Yesterday';
  }

  return `${days} days ago`;
};

const normalizeStudent = (student) => ({
  ...student,
  avatar:
    student.avatar ||
    initialsAvatar(student.name),
  assignmentsSubmitted: Number(
    student.assignmentsSubmitted || 0
  ),
  assignmentsGraded: Number(
    student.assignmentsGraded || 0
  ),
  assignmentsPending: Number(
    student.assignmentsPending || 0
  ),
  competitionsEntered: Number(
    student.competitionsEntered || 0
  ),
  projectsSubmitted: Number(
    student.projectsSubmitted || 0
  ),
  progress: Number(
    student.progress || 0
  ),
  courses: Array.isArray(
    student.courses
  )
    ? student.courses
    : [],
});

export default function TrainerStudents({
  onOpenMessages,
}) {
  const [roster, setRoster] =
    useState([]);

  const [stats, setStats] =
    useState({
      total_students: 0,
      on_track: 0,
      needs_feedback: 0,
      inactive: 0,
      awaiting_grading: 0,
      competition_entries: 0,
      projects: 0,
    });

  const [query, setQuery] =
    useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all');

  const [page, setPage] =
    useState(1);

  const [selected, setSelected] =
    useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const data =
        await getTrainerStudents();

      setRoster(
        Array.isArray(data.students)
          ? data.students.map(
              normalizeStudent
            )
          : []
      );

      setStats({
        total_students: Number(
          data.stats
            ?.total_students || 0
        ),
        on_track: Number(
          data.stats?.on_track || 0
        ),
        needs_feedback: Number(
          data.stats
            ?.needs_feedback || 0
        ),
        inactive: Number(
          data.stats?.inactive || 0
        ),
        awaiting_grading: Number(
          data.stats
            ?.awaiting_grading || 0
        ),
        competition_entries: Number(
          data.stats
            ?.competition_entries || 0
        ),
        projects: Number(
          data.stats?.projects || 0
        ),
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load students.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const needsAttention =
    useMemo(
      () =>
        roster.filter(
          (student) =>
            student.status ===
            'needs-feedback'
        ),
      [roster]
    );

  const filtered = useMemo(
    () =>
      roster.filter((student) => {
        const text =
          `${student.name} ${student.email} ${student.studentId || ''} ${student.courseTitle || ''}`.toLowerCase();

        const matchesQuery =
          text.includes(
            query
              .trim()
              .toLowerCase()
          );

        const matchesStatus =
          statusFilter === 'all' ||
          student.status ===
            statusFilter;

        return (
          matchesQuery &&
          matchesStatus
        );
      }),
    [
      roster,
      query,
      statusFilter,
    ]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filtered.length /
        PAGE_SIZE
    )
  );

  const shown = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetPage = (
    setter,
    value
  ) => {
    setter(value);
    setPage(1);
  };

  const openStudent = async (
    student
  ) => {
    try {
      setSelected(student);
      setProfileLoading(true);

      const data =
        await getTrainerStudent(
          student.id
        );

      if (data.student) {
        setSelected(
          normalizeStudent(
            data.student
          )
        );
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load student details.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const exportRoster = () => {
    const rows = [
      [
        'Student ID',
        'Name',
        'Email',
        'Courses',
        'Progress',
        'Assignments submitted',
        'Assignments graded',
        'Awaiting grading',
        'Competitions entered',
        'Projects submitted',
        'Last active',
        'Status',
      ],
      ...filtered.map(
        (student) => [
          student.studentId ||
            '',
          student.name,
          student.email,
          student.courseTitle ||
            '',
          `${student.progress}%`,
          student.assignmentsSubmitted,
          student.assignmentsGraded,
          student.assignmentsPending,
          student.competitionsEntered,
          student.projectsSubmitted,
          formatLastActive(
            student.lastActive
          ),
          statusLabels[
            student.status
          ] ||
            student.status,
        ]
      ),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(
                cell ?? ''
              ).replaceAll(
                '"',
                '""'
              )}"`
          )
          .join(',')
      )
      .join('\n');

    const url =
      URL.createObjectURL(
        new Blob([csv], {
          type: 'text/csv;charset=utf-8',
        })
      );

    const link =
      document.createElement(
        'a'
      );

    link.href = url;
    link.download =
      'compass-students.csv';

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="trainer-students-page">
      <header className="ts-title-row">
        <div>
          <span>
            STUDENT MANAGEMENT
          </span>

          <h1>Students</h1>

          <p>
            Students connected to
            your courses,
            assignments, projects,
            and competitions.
          </p>
        </div>

        <div>
          <button
            onClick={
              exportRoster
            }
            disabled={
              !roster.length
            }
          >
            <FiDownload />
            Export roster
          </button>
        </div>
      </header>

      <section className="ts-stats">
        <article>
          <FiUsers />

          <div>
            <strong>
              {
                stats.total_students
              }
            </strong>

            <b>
              Total students
            </b>

            <small>
              Connected to your
              work
            </small>
          </div>
        </article>

        <article className="green">
          <FiTrendingUp />

          <div>
            <strong>
              {
                stats.on_track
              }
            </strong>

            <b>On track</b>

            <small>
              {stats.total_students
                ? Math.round(
                    (stats.on_track /
                      stats.total_students) *
                      100
                  )
                : 0}
              % of students
            </small>
          </div>
        </article>

        <article className="orange">
          <FiFileText />

          <div>
            <strong>
              {
                stats.awaiting_grading
              }
            </strong>

            <b>
              Awaiting grading
            </b>

            <small>
              Across{' '}
              {
                stats.needs_feedback
              }{' '}
              students
            </small>
          </div>
        </article>

        <article>
          <FiAward />

          <div>
            <strong>
              {
                stats.competition_entries
              }
            </strong>

            <b>
              Competition entries
            </b>

            <small>
              Total registrations
            </small>
          </div>
        </article>
      </section>

      {error && (
        <div className="ts-empty">
          {error}
        </div>
      )}

      <div className="ts-layout">
        <section className="ts-table-card">
          <div className="ts-filters">
            <label>
              <FiSearch />

              <input
                value={query}
                onChange={(event) =>
                  resetPage(
                    setQuery,
                    event.target
                      .value
                  )
                }
                placeholder="Search by name, email, ID, or course"
              />
            </label>
          </div>

          <div className="ts-tabs">
            {[
              [
                'all',
                'All students',
              ],
              [
                'needs-feedback',
                'Needs grading',
              ],
              [
                'on-track',
                'On track',
              ],
              [
                'inactive',
                'Inactive',
              ],
            ].map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={value}
                  className={
                    statusFilter ===
                    value
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    resetPage(
                      setStatusFilter,
                      value
                    )
                  }
                >
                  {label}
                </button>
              )
            )}
          </div>

          <div className="ts-table-scroll">
            <div className="ts-table-head">
              <span>
                Student
              </span>

              <span>
                Activity
              </span>

              <span>
                Last active
              </span>

              <span>
                Status
              </span>

              <span>
                Actions
              </span>
            </div>

            {shown.map(
              (student) => (
                <article
                  className="ts-student-row"
                  key={
                    student.id
                  }
                >
                  <div className="ts-person">
                    <img
                      src={
                        student.avatar
                      }
                      alt={
                        student.name
                      }
                    />

                    <span>
                      <strong>
                        {
                          student.name
                        }
                      </strong>

                      <small>
                        {
                          student.email
                        }
                      </small>
                    </span>
                  </div>

                  <div className="ts-activity">
                    <span title="Assignments graded / submitted">
                      <FiFileText />
                      {
                        student.assignmentsGraded
                      }
                      /
                      {
                        student.assignmentsSubmitted
                      }
                    </span>

                    <span title="Competitions entered">
                      <FiAward />
                      {
                        student.competitionsEntered
                      }
                    </span>

                    <span title="Projects submitted">
                      <FiBriefcase />
                      {
                        student.projectsSubmitted
                      }
                    </span>
                  </div>

                  <span className="ts-last-active">
                    {formatLastActive(
                      student.lastActive
                    )}
                  </span>

                  <b
                    className={`ts-status ${student.status}`}
                  >
                    {statusLabels[
                      student.status
                    ] ||
                      student.status}
                  </b>

                  <div className="ts-actions">
                    <button
                      onClick={() =>
                        openStudent(
                          student
                        )
                      }
                    >
                      View profile
                    </button>

                    <button
                      aria-label="Message student"
                      onClick={
                        onOpenMessages
                      }
                    >
                      <FiMail />
                    </button>
                  </div>
                </article>
              )
            )}

            {loading && (
              <div className="ts-empty">
                Loading
                students...
              </div>
            )}

            {!loading &&
              !shown.length && (
                <div className="ts-empty">
                  {roster.length
                    ? 'No students match these filters.'
                    : 'No students are connected to your courses or activities yet.'}
                </div>
              )}
          </div>

          <footer className="ts-pagination">
            <span>
              Showing{' '}
              {shown.length
                ? (page - 1) *
                    PAGE_SIZE +
                  1
                : 0}
              –
              {Math.min(
                page *
                  PAGE_SIZE,
                filtered.length
              )}{' '}
              of{' '}
              {
                filtered.length
              }{' '}
              students
            </span>

            <div>
              <button
                disabled={
                  page === 1
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current - 1
                  )
                }
              >
                ‹
              </button>

              {Array.from(
                {
                  length:
                    totalPages,
                },
                (_, index) =>
                  index + 1
              )
                .slice(
                  Math.max(
                    0,
                    Math.min(
                      page - 3,
                      totalPages - 5
                    )
                  ),
                  Math.max(
                    0,
                    Math.min(
                      page - 3,
                      totalPages - 5
                    )
                  ) + 5
                )
                .map(
                  (number) => (
                    <button
                      className={
                        page ===
                        number
                          ? 'active'
                          : ''
                      }
                      key={
                        number
                      }
                      onClick={() =>
                        setPage(
                          number
                        )
                      }
                    >
                      {number}
                    </button>
                  )
                )}

              <button
                disabled={
                  page ===
                  totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1
                  )
                }
              >
                ›
              </button>
            </div>
          </footer>
        </section>

        <aside className="ts-side">
          <section>
            <header>
              <h2>
                Needs grading
              </h2>

              <button
                onClick={() =>
                  resetPage(
                    setStatusFilter,
                    'needs-feedback'
                  )
                }
              >
                Review list →
              </button>
            </header>

            {needsAttention
              .slice(0, 4)
              .map(
                (student) => (
                  <article
                    key={
                      student.id
                    }
                  >
                    <span>
                      {student.name
                        .split(' ')
                        .map(
                          (word) =>
                            word[0]
                        )
                        .slice(0, 2)
                        .join('')}
                    </span>

                    <div>
                      <strong>
                        {
                          student.name
                        }
                      </strong>

                      <small>
                        {
                          student.assignmentsPending
                        }{' '}
                        submission
                        {student.assignmentsPending ===
                        1
                          ? ''
                          : 's'}{' '}
                        awaiting
                        grading
                      </small>
                    </div>

                    <b>
                      {
                        statusLabels[
                          student
                            .status
                        ]
                      }
                    </b>
                  </article>
                )
              )}

            {!needsAttention.length && (
              <p className="ts-side-empty">
                Nothing waiting on
                you right now.
              </p>
            )}
          </section>
        </aside>
      </div>

      {selected && (
        <div
          className="ts-modal"
          onMouseDown={() =>
            setSelected(null)
          }
        >
          <section
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <button
              className="ts-close"
              onClick={() =>
                setSelected(
                  null
                )
              }
            >
              <FiX />
            </button>

            <img
              src={
                selected.avatar
              }
              alt={
                selected.name
              }
            />

            <h2>
              {selected.name}
            </h2>

            <p>
              {selected.email}
            </p>

            {profileLoading ? (
              <div className="ts-empty">
                Loading student
                profile...
              </div>
            ) : (
              <dl>
                {selected.studentId && (
                  <div>
                    <dt>
                      Student ID
                    </dt>

                    <dd>
                      {
                        selected.studentId
                      }
                    </dd>
                  </div>
                )}

                {selected.major && (
                  <div>
                    <dt>
                      Major
                    </dt>

                    <dd>
                      {
                        selected.major
                      }
                    </dd>
                  </div>
                )}

                {selected.university && (
                  <div>
                    <dt>
                      University
                    </dt>

                    <dd>
                      {
                        selected.university
                      }
                    </dd>
                  </div>
                )}

                <div>
                  <dt>
                    <FiTrendingUp />
                    Progress
                  </dt>

                  <dd>
                    {
                      selected.progress
                    }
                    %
                  </dd>
                </div>

                <div>
                  <dt>
                    <FiFileText />
                    Assignments
                  </dt>

                  <dd>
                    {
                      selected.assignmentsGraded
                    }
                    /
                    {
                      selected.assignmentsSubmitted
                    }{' '}
                    graded (
                    {
                      selected.assignmentsPending
                    }{' '}
                    pending)
                  </dd>
                </div>

                <div>
                  <dt>
                    <FiAward />
                    Competitions
                  </dt>

                  <dd>
                    {
                      selected.competitionsEntered
                    }{' '}
                    entered
                  </dd>
                </div>

                <div>
                  <dt>
                    <FiBriefcase />
                    Projects
                  </dt>

                  <dd>
                    {
                      selected.projectsSubmitted
                    }{' '}
                    submitted
                  </dd>
                </div>

                <div>
                  <dt>
                    Courses
                  </dt>

                  <dd>
                    {selected.courseTitle ||
                      '—'}
                  </dd>
                </div>

                <div>
                  <dt>
                    Last active
                  </dt>

                  <dd>
                    {formatLastActive(
                      selected.lastActive
                    )}
                  </dd>
                </div>
              </dl>
            )}

            <button
              className="ts-primary"
              onClick={
                onOpenMessages
              }
            >
              <FiMail />
              Send message
            </button>
          </section>
        </div>
      )}
    </div>
  );
}