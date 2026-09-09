import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiCheck,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiGithub,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import {
  approveTrainerProject,
  createTrainerProject,
  deleteTrainerProject,
  getTrainerProject,
  getTrainerProjects,
  requestTrainerProjectChanges,
  saveTrainerProjectReview,
  unpublishTrainerProject,
} from './api/trainerProjects';
import './TrainerProjects.css';
import './TrainerProjectsDetail.css';

const labels = {
  'pending-review': 'Awaiting review',
  'changes-requested': 'Changes requested',
  resubmitted: 'Resubmitted',
  published: 'Published',
  unpublished: 'Unpublished',
  draft: 'Draft',
  rejected: 'Rejected',
};

const defaultRubric = [
  { id: 'impact', label: 'Idea & impact', max: 25 },
  { id: 'quality', label: 'Technical quality', max: 30 },
  { id: 'experience', label: 'User experience', max: 20 },
  { id: 'documentation', label: 'Documentation', max: 15 },
  { id: 'presentation', label: 'Presentation & delivery', max: 10 },
];

const emptyProject = {
  title: '',
  courseId: '',
  studentId: '',
  description: '',
  problem: '',
  solution: '',
  projectType: 'individual',
  techStack: '',
  demo: '',
  github: '',
  publishNow: true,
};

const toInputDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (number) => String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDate = (value, withTime = false) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return withTime
    ? date.toLocaleString()
    : date.toLocaleDateString();
};

const TrainerProjects = () => {
  const [projects, setProjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [rubric, setRubric] = useState(defaultRubric);
  const [stats, setStats] = useState({
    pending: 0,
    changes: 0,
    published: 0,
  });
  const [selected, setSelected] = useState(null);
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
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const total = useMemo(
    () =>
      rubric.reduce(
        (sum, row) => sum + Number(scores[row.id] || 0),
        0
      ),
    [rubric, scores]
  );

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const searchMatch = `${project.title} ${project.studentName} ${project.courseTitle}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      const courseMatch =
        course === 'all' || String(project.courseId) === String(course);

      const statusMatch =
        status === 'all' || project.status === status;

      return searchMatch && courseMatch && statusMatch;
    });
  }, [projects, query, course, status]);

  const flash = (message) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice('');
    }, 2600);
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getTrainerProjects();

      setProjects(
        Array.isArray(data.projects)
          ? data.projects
          : []
      );

      setCourses(
        Array.isArray(data.courses)
          ? data.courses
          : []
      );

      setStudents(
        Array.isArray(data.students)
          ? data.students
          : []
      );

      setRubric(
        Array.isArray(data.rubric) && data.rubric.length
          ? data.rubric
          : defaultRubric
      );

      setStats({
        pending: Number(data.stats?.pending || 0),
        changes: Number(data.stats?.changes || 0),
        published: Number(data.stats?.published || 0),
      });
    } catch (requestError) {
      setError(
        requestError.message ||
        'Unable to load projects.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProject = async (projectId) => {
    try {
      setWorking(true);
      setError('');

      const data = await getTrainerProject(projectId);
      const project = data.project;

      if (!project) {
        return;
      }

      setSelected(project);
      setScores(project.evaluation?.scores || {});
      setNotes(project.evaluation?.notes || {});
      setFeedback(project.feedback || '');
      setPrivateNote(project.privateNote || '');
      setNotifyTeam(Boolean(project.notifyTeam));
      setChangesDueAt(toInputDate(project.changesDueAt));
      setNotice('');
    } catch (requestError) {
      setError(
        requestError.message ||
        'Unable to load project details.'
      );
    } finally {
      setWorking(false);
    }
  };

  const refreshSelected = async () => {
    const projectId = selected?.id;

    await loadProjects();

    if (projectId) {
      await loadProject(projectId);
    }
  };

  const reviewPayload = () => ({
    scores,
    notes,
    feedback: feedback.trim() || null,
    private_note: privateNote.trim() || null,
    notify_team: notifyTeam,
    changes_due_at: changesDueAt || null,
  });

  const saveDraft = async () => {
    if (!selected || working) {
      return;
    }

    try {
      setWorking(true);

      await saveTrainerProjectReview(
        selected.id,
        reviewPayload()
      );

      await refreshSelected();

      flash('Evaluation draft saved.');
    } catch (requestError) {
      flash(
        requestError.message ||
        'Unable to save evaluation.'
      );
    } finally {
      setWorking(false);
    }
  };

  const approve = async () => {
    if (!selected || working) {
      return;
    }

    try {
      setWorking(true);

      await approveTrainerProject(
        selected.id,
        reviewPayload()
      );

      await refreshSelected();

      flash(
        'Project approved and published in the student gallery.'
      );
    } catch (requestError) {
      flash(
        requestError.message ||
        'Unable to approve project.'
      );
    } finally {
      setWorking(false);
    }
  };

  const requestChanges = async () => {
    if (!selected || working) {
      return;
    }

    if (!feedback.trim()) {
      flash(
        'Write feedback before requesting changes.'
      );

      return;
    }

    try {
      setWorking(true);

      await requestTrainerProjectChanges(
        selected.id,
        reviewPayload()
      );

      await refreshSelected();

      flash(
        'Changes requested and returned to the student.'
      );
    } catch (requestError) {
      flash(
        requestError.message ||
        'Unable to request changes.'
      );
    } finally {
      setWorking(false);
    }
  };

  const unpublish = async () => {
    if (!selected || working) {
      return;
    }

    try {
      setWorking(true);

      await unpublishTrainerProject(
        selected.id
      );

      await refreshSelected();

      flash(
        'Project removed from the student gallery.'
      );
    } catch (requestError) {
      flash(
        requestError.message ||
        'Unable to unpublish project.'
      );
    } finally {
      setWorking(false);
    }
  };

  const removeProject = async (event) => {
    event.preventDefault();

    if (
      !selected ||
      !deleteReason.trim() ||
      working
    ) {
      return;
    }

    try {
      setWorking(true);

      await deleteTrainerProject(
        selected.id,
        deleteReason.trim()
      );

      setDeleteOpen(false);
      setDeleteReason('');
      setSelected(null);

      await loadProjects();

      flash('Project deleted successfully.');
    } catch (requestError) {
      flash(
        requestError.message ||
        'Unable to delete project.'
      );
    } finally {
      setWorking(false);
    }
  };

  const createProject = async (event) => {
    event.preventDefault();

    if (working) {
      return;
    }

    try {
      setWorking(true);

      const data = await createTrainerProject({
        student_id: Number(projectForm.studentId),
        course_id: Number(projectForm.courseId),
        title: projectForm.title.trim(),
        description:
          projectForm.description.trim() || null,
        idea:
          projectForm.description.trim() || null,
        problem:
          projectForm.problem.trim() || null,
        solution:
          projectForm.solution.trim() || null,
        project_type:
          projectForm.projectType,
        github_url:
          projectForm.github.trim() || null,
        live_url:
          projectForm.demo.trim() || null,
        technologies: projectForm.techStack
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        publish_now:
          projectForm.publishNow,
      });

      setCreateOpen(false);
      setProjectForm(emptyProject);

      await loadProjects();

      if (data.project?.id) {
        await loadProject(
          data.project.id
        );
      }

      flash(
        projectForm.publishNow
          ? 'Project added and published.'
          : 'Project saved unpublished.'
      );
    } catch (requestError) {
      flash(
        requestError.message ||
        'Unable to create project.'
      );
    } finally {
      setWorking(false);
    }
  };

  const exportProjectsReport = () => {
    const rows = [
      [
        'Project',
        'Student',
        'Course',
        'Status',
        'Score',
        'Submitted',
      ],
      ...filtered.map((project) => [
        project.title,
        project.studentName,
        project.courseTitle,
        labels[project.status] || project.status,
        project.evaluation?.draft === false
          ? project.evaluation.total
          : '',
        project.submittedAt || '',
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? '').replaceAll('"', '""')}"`
          )
          .join(',')
      )
      .join('\n');

    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8',
      })
    );

    const link = document.createElement('a');

    link.href = url;
    link.download = 'compass-projects-report.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  if (selected) {
    const team = Array.isArray(selected.team)
      ? selected.team
      : [];

    const techStack = Array.isArray(
      selected.techStack
    )
      ? selected.techStack
      : [];

    const files = Array.isArray(selected.files)
      ? selected.files
      : [];

    const auditLog = Array.isArray(
      selected.auditLog
    )
      ? selected.auditLog
      : [];

    const materials = [
      [
        'Live demo',
        selected.links?.demo,
        <FiExternalLink key="demo" />,
      ],
      [
        'GitHub repository',
        selected.links?.github,
        <FiGithub key="github" />,
      ],
      [
        'Presentation',
        selected.links?.presentation,
        <FiFileText key="presentation" />,
      ],
      [
        'Documentation',
        selected.links?.documentation,
        <FiFileText key="documentation" />,
      ],
    ].filter((item) => item[1]);

    return (
      <div className="trainer-projects-page trainer-project-detail">
        <button
          type="button"
          className="tp-back"
          onClick={() => setSelected(null)}
        >
          <FiArrowLeft />
          Back to projects
        </button>

        <header className="tp-detail-header">
          <div>
            <h1>{selected.title}</h1>

            <p>
              Submitted by <b>{selected.studentName}</b> ·{' '}
              {selected.courseTitle}
            </p>
          </div>

          <span
            className={`tp-status is-${selected.status}`}
          >
            {labels[selected.status] || selected.status}
          </span>

          {selected.links?.demo && (
            <a
              href={selected.links.demo}
              target="_blank"
              rel="noreferrer"
            >
              Open live demo
              <FiExternalLink />
            </a>
          )}
        </header>

        <div className="tp-summary-bar">
          <span>
            Submitted {formatDate(selected.submittedAt)}
          </span>

          <span>
            <FiUsers />
            {team.length || 1} team member(s)
          </span>

          <span>
            Status {labels[selected.status] || selected.status}
          </span>

          <span>
            Last updated {formatDate(selected.updatedAt)}
          </span>
        </div>

        <div className="tp-detail-grid">
          <main className="tp-detail-main">
            <section>
              <h2>Project overview</h2>

              <p>
                {selected.description ||
                  'No description provided.'}
              </p>

              <div className="tp-overview-columns">
                <div>
                  <h3>Problem</h3>

                  <p>
                    {selected.problem ||
                      'No problem statement provided.'}
                  </p>
                </div>

                <div>
                  <h3>Solution</h3>

                  <p>
                    {selected.solution ||
                      selected.description ||
                      'No solution statement provided.'}
                  </p>
                </div>
              </div>

              <div className="tp-tags">
                {techStack.map((tag) => (
                  <span key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2>Team members</h2>

              {team.length ? (
                team.map((member) => (
                  <div
                    className="tp-team-row"
                    key={member.id || member.name}
                  >
                    <span>
                      {(member.name || 'S').slice(0, 1)}
                    </span>

                    <b>{member.name}</b>

                    <small>
                      {member.role}
                      {member.specialty
                        ? ` · ${member.specialty}`
                        : ''}
                    </small>
                  </div>
                ))
              ) : (
                <p>No team information.</p>
              )}
            </section>

            <section>
              <h2>Files & links</h2>

              {materials.map(
                ([name, url, icon]) => (
                  <a
                    className="tp-material"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    key={name}
                  >
                    {icon}

                    <span>
                      <b>{name}</b>
                      <small>{url}</small>
                    </span>

                    Open
                    <FiExternalLink />
                  </a>
                )
              )}

              {files.map((file) => (
                <a
                  className="tp-material"
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  key={file.id || file.name}
                >
                  <FiFileText />

                  <span>
                    <b>{file.name}</b>
                    <small>Project attachment</small>
                  </span>

                  Open
                  <FiExternalLink />
                </a>
              ))}

              {!materials.length && !files.length && (
                <p>No files or links attached.</p>
              )}
            </section>

            <section>
              <h2>Review history</h2>

              {auditLog
                .slice()
                .reverse()
                .map((item) => (
                  <div
                    className="tp-history"
                    key={item.id}
                  >
                    <i />

                    <div>
                      <b>{item.action}</b>

                      <small>
                        {item.actor} · {formatDate(item.at, true)}
                      </small>

                      {item.details && (
                        <p>{item.details}</p>
                      )}
                    </div>
                  </div>
                ))}

              {!auditLog.length && (
                <p>No review history yet.</p>
              )}
            </section>
          </main>

          <aside className="tp-evaluation">
            <section>
              <div className="tp-score-title">
                <h2>Project evaluation</h2>

                <strong>
                  {total}
                  <small>/100</small>
                </strong>
              </div>

              {rubric.map((row) => (
                <div
                  className="tp-rubric"
                  key={row.id}
                >
                  <label>
                    {row.label}
                    <span>/ {row.max}</span>
                  </label>

                  <div>
                    <input
                      type="number"
                      min="0"
                      max={row.max}
                      value={scores[row.id] ?? ''}
                      onChange={(event) =>
                        setScores((current) => ({
                          ...current,
                          [row.id]: Math.min(
                            row.max,
                            Math.max(
                              0,
                              Number(event.target.value)
                            )
                          ),
                        }))
                      }
                    />

                    <input
                      value={notes[row.id] || ''}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [row.id]: event.target.value,
                        }))
                      }
                      placeholder="Criterion note"
                    />
                  </div>
                </div>
              ))}
            </section>

            <section>
              <h2>Feedback to team</h2>

              <textarea
                value={feedback}
                onChange={(event) =>
                  setFeedback(event.target.value)
                }
                placeholder="Write clear, actionable feedback..."
              />

              <label className="tp-check">
                <input
                  type="checkbox"
                  checked={notifyTeam}
                  onChange={(event) =>
                    setNotifyTeam(event.target.checked)
                  }
                />
                Notify all team members
              </label>

              <label>
                Changes deadline

                <input
                  type="datetime-local"
                  value={changesDueAt}
                  onChange={(event) =>
                    setChangesDueAt(event.target.value)
                  }
                />
              </label>

              <label>
                Private trainer note

                <textarea
                  value={privateNote}
                  onChange={(event) =>
                    setPrivateNote(event.target.value)
                  }
                  placeholder="Only trainers can see this note."
                />
              </label>
            </section>

            <section className="tp-decisions">
              <h2>Review decision</h2>

              {notice && <p>{notice}</p>}

              <div>
                <button
                  className="approve"
                  onClick={approve}
                  disabled={working}
                >
                  <FiCheck />
                  Approve & publish
                </button>

                <button
                  className="changes"
                  onClick={requestChanges}
                  disabled={working}
                >
                  Request changes
                </button>

                <button
                  onClick={saveDraft}
                  disabled={working}
                >
                  Save draft
                </button>
              </div>

              {selected.status === 'published' && (
                <button
                  className="tp-unpublish"
                  onClick={unpublish}
                  disabled={working}
                >
                  Unpublish project
                </button>
              )}

              <button
                className="tp-delete-link"
                onClick={() => setDeleteOpen(true)}
                disabled={working}
              >
                <FiTrash2 />
                Delete project
              </button>

              <small>
                Deletion is temporary and requires a reason.
              </small>
            </section>
          </aside>
        </div>

        {deleteOpen && (
          <div className="tp-modal">
            <form onSubmit={removeProject}>
              <button
                type="button"
                className="tp-modal-x"
                onClick={() => setDeleteOpen(false)}
              >
                <FiX />
              </button>

              <h2>Delete project?</h2>

              <p>
                This is a soft delete. The audit history and
                evaluation remain available.
              </p>

              <label>
                Deletion reason *

                <textarea
                  required
                  value={deleteReason}
                  onChange={(event) =>
                    setDeleteReason(event.target.value)
                  }
                />
              </label>

              <div>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="danger"
                  disabled={working}
                >
                  Confirm delete
                </button>
              </div>
            </form>
          </div>
        )}

        {notice && (
          <div className="ta-toast">
            {notice}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="trainer-projects-page">
      <header className="tp-page-header">
        <div>
          <span>PROJECT MANAGEMENT</span>

          <h1>Projects</h1>

          <p>
            Review submissions, guide teams, and publish
            outstanding work.
          </p>
        </div>

        <div>
          <button
            className="primary"
            onClick={() => setCreateOpen(true)}
          >
            <FiPlus />
            Add project
          </button>

          <button onClick={exportProjectsReport}>
            <FiDownload />
            Export report
          </button>
        </div>
      </header>

      <div className="tp-stats">
        <article>
          <strong>{stats.pending}</strong>
          <span>Awaiting review</span>
        </article>

        <article>
          <strong>{stats.changes}</strong>
          <span>Need changes</span>
        </article>

        <article>
          <strong>{stats.published}</strong>
          <span>Published</span>
        </article>
      </div>

      {error && (
        <div className="tp-empty">
          {error}
        </div>
      )}

      <section className="tp-list-card">
        <div className="tp-toolbar">
          <label>
            <FiSearch />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search project or student"
            />
          </label>

          <select
            value={course}
            onChange={(event) =>
              setCourse(event.target.value)
            }
          >
            <option value="all">
              All courses
            </option>

            {courses.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.title}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="all">
              All statuses
            </option>

            {Object.entries(labels).map(
              ([value, label]) => (
                <option
                  value={value}
                  key={value}
                >
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="tp-table-head">
          <span>Project</span>
          <span>Student / team</span>
          <span>Course</span>
          <span>Status</span>
          <span>Score</span>
          <span>Action</span>
        </div>

        {filtered.map((project) => (
          <button
            className="tp-project-row"
            type="button"
            key={project.id}
            onClick={() =>
              loadProject(project.id)
            }
          >
            <span>
              <b>{project.title}</b>

              <small>
                {formatDate(project.submittedAt)}
              </small>
            </span>

            <span>
              {project.studentName}
            </span>

            <span>
              {project.courseTitle}
            </span>

            <span>
              <i
                className={`tp-status is-${project.status}`}
              >
                {labels[project.status] || project.status}
              </i>
            </span>

            <span>
              {project.evaluation?.draft === false
                ? `${project.evaluation.total}/100`
                : '—'}
            </span>

            <span>
              View details
              <FiMoreHorizontal />
            </span>
          </button>
        ))}

        {loading && (
          <div className="tp-empty">
            Loading projects...
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="tp-empty">
            No projects match these filters.
          </div>
        )}
      </section>

      {createOpen && (
        <div className="tp-modal">
          <form onSubmit={createProject}>
            <button
              type="button"
              className="tp-modal-x"
              onClick={() => setCreateOpen(false)}
            >
              <FiX />
            </button>

            <h2>Add project to platform</h2>

            <p>
              Create a project record and publish it now or
              keep it unpublished.
            </p>

            <div className="tp-form-grid">
              <label>
                Project title *

                <input
                  required
                  value={projectForm.title}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Course *

                <select
                  required
                  value={projectForm.courseId}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      courseId: event.target.value,
                    })
                  }
                >
                  <option value="">
                    Select course
                  </option>

                  {courses.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Student *

                <select
                  required
                  value={projectForm.studentId}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      studentId: event.target.value,
                    })
                  }
                >
                  <option value="">
                    Select student
                  </option>

                  {students.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.name}
                      {student.studentCode
                        ? ` · ${student.studentCode}`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Project type

                <select
                  value={projectForm.projectType}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      projectType: event.target.value,
                    })
                  }
                >
                  <option value="individual">
                    Individual
                  </option>

                  <option value="team">
                    Team
                  </option>
                </select>
              </label>

              <label className="full">
                Description *

                <textarea
                  required
                  value={projectForm.description}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      description: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Problem

                <textarea
                  value={projectForm.problem}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      problem: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Solution

                <textarea
                  value={projectForm.solution}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      solution: event.target.value,
                    })
                  }
                />
              </label>

              <label className="full">
                Technologies

                <input
                  value={projectForm.techStack}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      techStack: event.target.value,
                    })
                  }
                  placeholder="Laravel, React, MySQL"
                />
              </label>

              <label>
                Live demo

                <input
                  type="url"
                  value={projectForm.demo}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      demo: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                GitHub

                <input
                  type="url"
                  value={projectForm.github}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      github: event.target.value,
                    })
                  }
                />
              </label>

              <label className="full tp-check">
                <input
                  type="checkbox"
                  checked={projectForm.publishNow}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      publishNow: event.target.checked,
                    })
                  }
                />

                Publish immediately in the student gallery
              </label>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>

              <button
                className="primary"
                disabled={working}
              >
                {projectForm.publishNow
                  ? 'Add & publish'
                  : 'Save unpublished'}
              </button>
            </div>
          </form>
        </div>
      )}

      {notice && (
        <div className="ta-toast">
          {notice}
        </div>
      )}
    </div>
  );
};

export default TrainerProjects;