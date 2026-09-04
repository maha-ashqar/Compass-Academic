import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiAward,
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiFile,
  FiInfo,
  FiLink,
  FiPlus,
  FiSearch,
  FiShield,
  FiStar,
  FiTarget,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import {
  deleteStudentCompetitionFile,
  getStudentCompetition,
  getStudentCompetitions,
  registerStudentCompetition,
  saveStudentCompetitionSubmission,
  submitStudentCompetitionWork,
  uploadStudentCompetitionFiles,
} from './api/studentCompetitions';
import './Competitions.css';

const phaseMeta = {
  registration_open: ['Registration open', 'green'],
  registration_closed: ['Registration closed', 'neutral'],
  submissions_open: ['Submissions open', 'blue'],
  judging: ['Judging', 'orange'],
  results_published: ['Results published', 'purple'],
  completed: ['Completed', 'neutral'],
};

const formatDate = (value, withTime = false) =>
  value
    ? new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(withTime
          ? {
              hour: 'numeric',
              minute: '2-digit',
            }
          : {}),
      })
    : 'Not announced';

const daysLeft = (value) =>
  value
    ? Math.max(
        0,
        Math.ceil(
          (new Date(value).getTime() -
            Date.now()) /
            86400000
        )
      )
    : null;

const iconFor = (category = '') =>
  category.toLowerCase().includes('cyber') ? (
    <FiShield />
  ) : category.toLowerCase().includes('design') ? (
    <FiAward />
  ) : category.toLowerCase().includes('web') ? (
    <FiTarget />
  ) : (
    <FiStar />
  );

const participationLabel = (value = '') =>
  value.replaceAll('_', ' ');

function ApplicationForm({
  competition,
  studentData,
  onBack,
  onSubmit,
  saving,
  error,
}) {
  const initialType =
    competition.participation_type === 'team'
      ? 'team'
      : 'individual';

  const [form, setForm] = useState({
    type: initialType,
    teamName: '',
    members: [],
  });

  const [member, setMember] = useState({
    name: '',
    email: '',
    role: '',
  });

  const allowTeam =
    competition.participation_type !==
    'individual';

  const allowIndividual =
    competition.participation_type !== 'team';

  const maxExtraMembers = Math.max(
    0,
    Number(competition.max_team_members || 1) -
      1
  );

  const addMember = () => {
    if (
      !member.name.trim() ||
      !member.email.trim() ||
      form.members.length >= maxExtraMembers
    ) {
      return;
    }

    setForm((current) => ({
      ...current,
      members: [
        ...current.members,
        {
          ...member,
          id: Date.now(),
        },
      ],
    }));

    setMember({
      name: '',
      email: '',
      role: '',
    });
  };

  const submit = (event) => {
    event.preventDefault();

    if (
      form.type === 'team' &&
      (!form.teamName.trim() ||
        !form.members.length)
    ) {
      return;
    }

    onSubmit({
      participation_type: form.type,
      team_name:
        form.type === 'team'
          ? form.teamName.trim()
          : null,
      members:
        form.type === 'team'
          ? form.members.map((item) => ({
              name: item.name.trim(),
              email: item.email.trim(),
              role: item.role.trim() || null,
            }))
          : [],
    });
  };

  return (
    <div className="sc-page sc-form-page">
      <button
        className="sc-back"
        onClick={onBack}
        disabled={saving}
      >
        <FiArrowLeft /> Back to competition
      </button>

      <header className="sc-heading">
        <div>
          <span>COMPETITION APPLICATION</span>
          <h1>Apply to {competition.title}</h1>
          <p>
            Choose how you want to participate,
            then send your request to the trainer.
          </p>
        </div>
      </header>

      {error && (
        <div className="sc-changes-banner">
          <FiInfo />
          <div>
            <strong>Unable to send application</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form
        className="sc-application"
        onSubmit={submit}
      >
        <section>
          <div className="sc-step">
            <b>1</b>
            <span>
              <strong>Participation type</strong>
              <small>
                Apply individually or create your
                team.
              </small>
            </span>
          </div>

          <div className="sc-choice-grid">
            {allowIndividual && (
              <button
                type="button"
                className={
                  form.type === 'individual'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setForm({
                    ...form,
                    type: 'individual',
                    members: [],
                    teamName: '',
                  })
                }
                disabled={saving}
              >
                <FiUser />
                <strong>Individual</strong>
                <small>
                  Participate on your own
                </small>
              </button>
            )}

            {allowTeam && (
              <button
                type="button"
                className={
                  form.type === 'team'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setForm({
                    ...form,
                    type: 'team',
                  })
                }
                disabled={saving}
              >
                <FiUsers />
                <strong>Team</strong>
                <small>
                  Up to{' '}
                  {competition.max_team_members ||
                    1}{' '}
                  members
                </small>
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="sc-step">
            <b>2</b>
            <span>
              <strong>Your information</strong>
              <small>
                Loaded from your student profile.
              </small>
            </span>
          </div>

          <div className="sc-form-grid">
            <label>
              Student name
              <input
                value={
                  studentData?.displayName ||
                  studentData?.fullName ||
                  studentData?.name ||
                  ''
                }
                readOnly
              />
            </label>

            <label>
              University email
              <input
                value={studentData?.email || ''}
                readOnly
              />
            </label>
          </div>
        </section>

        {form.type === 'team' && (
          <section>
            <div className="sc-step">
              <b>3</b>
              <span>
                <strong>Team members</strong>
                <small>
                  Add members and their
                  responsibilities.
                </small>
              </span>
            </div>

            <div className="sc-form-grid">
              <label className="full">
                Team name *
                <input
                  value={form.teamName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      teamName:
                        event.target.value,
                    })
                  }
                  required
                  disabled={saving}
                />
              </label>

              <label>
                Member name
                <input
                  value={member.name}
                  onChange={(event) =>
                    setMember({
                      ...member,
                      name: event.target.value,
                    })
                  }
                  disabled={saving}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={member.email}
                  onChange={(event) =>
                    setMember({
                      ...member,
                      email: event.target.value,
                    })
                  }
                  disabled={saving}
                />
              </label>

              <label>
                Role
                <input
                  value={member.role}
                  onChange={(event) =>
                    setMember({
                      ...member,
                      role: event.target.value,
                    })
                  }
                  disabled={saving}
                />
              </label>

              <button
                type="button"
                className="sc-add-member"
                onClick={addMember}
                disabled={
                  saving ||
                  form.members.length >=
                    maxExtraMembers
                }
              >
                <FiPlus /> Add member
              </button>
            </div>

            <div className="sc-member-list">
              {form.members.map((item) => (
                <div key={item.id}>
                  <span>
                    <FiUser />
                  </span>

                  <div>
                    <b>{item.name}</b>
                    <small>
                      {item.role || item.email}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        members:
                          form.members.filter(
                            (current) =>
                              current.id !==
                              item.id
                          ),
                      })
                    }
                    disabled={saving}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer>
          <button
            type="button"
            className="sc-secondary"
            onClick={onBack}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="sc-primary"
            disabled={saving}
          >
            {saving
              ? 'Sending...'
              : 'Send application'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function SubmissionForm({
  competition,
  initialSubmission,
  onBack,
  onFinished,
}) {
  const [form, setForm] = useState({
    title: initialSubmission?.title || '',
    description:
      initialSubmission?.description || '',
    demo: initialSubmission?.demo_url || '',
    github: initialSubmission?.github_url || '',
  });

  const [existingFiles, setExistingFiles] =
    useState(initialSubmission?.files || []);

  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isResubmit =
    initialSubmission?.status ===
    'changes_requested';

  const addFiles = (event) => {
    const chosen = Array.from(
      event.target.files || []
    );

    const available = Math.max(
      0,
      5 -
        existingFiles.length -
        newFiles.length
    );

    setNewFiles((current) => [
      ...current,
      ...chosen.slice(0, available),
    ]);

    event.target.value = '';
  };

  const removeExistingFile = async (
    fileId
  ) => {
    try {
      setSaving(true);
      setError('');

      await deleteStudentCompetitionFile(
        competition.id,
        fileId
      );

      setExistingFiles((current) =>
        current.filter(
          (file) => file.id !== fileId
        )
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to remove file.'
      );
    } finally {
      setSaving(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      await saveStudentCompetitionSubmission(
        competition.id,
        {
          title: form.title.trim(),
          description:
            form.description.trim() || null,
          demo_url: form.demo.trim() || null,
          github_url:
            form.github.trim() || null,
        }
      );

      if (newFiles.length) {
        await uploadStudentCompetitionFiles(
          competition.id,
          newFiles
        );
      }

      await submitStudentCompetitionWork(
        competition.id
      );

      onFinished();
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to submit competition work.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sc-page sc-form-page">
      <button
        className="sc-back"
        onClick={onBack}
        disabled={saving}
      >
        <FiArrowLeft /> Back to competition
      </button>

      <header className="sc-heading">
        <div>
          <span>
            {isResubmit
              ? 'UPDATE SUBMISSION'
              : 'WORK SUBMISSION'}
          </span>

          <h1>
            {isResubmit
              ? 'Update your submission'
              : 'Submit your work'}
          </h1>

          <p>
            {competition.title} · Your trainer
            will review this version.
          </p>
        </div>
      </header>

      {isResubmit &&
        initialSubmission?.feedback && (
          <div className="sc-changes-banner">
            <FiInfo />
            <div>
              <strong>
                Trainer feedback from your last
                submission
              </strong>
              <p>
                {initialSubmission.feedback}
              </p>
            </div>
          </div>
        )}

      {error && (
        <div className="sc-changes-banner">
          <FiInfo />
          <div>
            <strong>
              Unable to submit work
            </strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form
        className="sc-application"
        onSubmit={submit}
      >
        <section>
          <div className="sc-step">
            <b>1</b>
            <span>
              <strong>
                Project information
              </strong>
              <small>
                Explain what you built and add
                its links.
              </small>
            </span>
          </div>

          <div className="sc-form-grid">
            <label className="full">
              Submission title *
              <input
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                required
                disabled={saving}
              />
            </label>

            <label className="full">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                disabled={saving}
              />
            </label>

            <label>
              Demo link
              <input
                type="url"
                value={form.demo}
                onChange={(event) =>
                  setForm({
                    ...form,
                    demo: event.target.value,
                  })
                }
                disabled={saving}
              />
            </label>

            <label>
              GitHub repository
              <input
                type="url"
                value={form.github}
                onChange={(event) =>
                  setForm({
                    ...form,
                    github: event.target.value,
                  })
                }
                disabled={saving}
              />
            </label>
          </div>
        </section>

        <section>
          <div className="sc-step">
            <b>2</b>
            <span>
              <strong>Files</strong>
              <small>
                Presentation, report, ZIP, or
                images.
              </small>
            </span>
          </div>

          <label className="sc-dropzone">
            <FiUploadCloud />
            <strong>
              Choose files to upload
            </strong>
            <small>
              PDF, PPTX, DOCX, ZIP or images ·
              Up to 5 files
            </small>
            <input
              type="file"
              multiple
              accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.png,.jpg,.jpeg,.webp"
              onChange={addFiles}
              disabled={
                saving ||
                existingFiles.length +
                  newFiles.length >=
                  5
              }
            />
          </label>

          <div className="sc-file-list">
            {existingFiles.map((file) => (
              <div key={file.id}>
                <FiFile />

                <span>
                  <b>{file.name}</b>
                  <small>
                    {Math.max(
                      1,
                      Math.round(
                        Number(file.size || 0) /
                          1024
                      )
                    )}{' '}
                    KB
                  </small>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    removeExistingFile(file.id)
                  }
                  disabled={saving}
                >
                  <FiX />
                </button>
              </div>
            ))}

            {newFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
              >
                <FiFile />

                <span>
                  <b>{file.name}</b>
                  <small>
                    {Math.max(
                      1,
                      Math.round(file.size / 1024)
                    )}{' '}
                    KB
                  </small>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setNewFiles((current) =>
                      current.filter(
                        (_, fileIndex) =>
                          fileIndex !== index
                      )
                    )
                  }
                  disabled={saving}
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </section>

        <footer>
          <button
            type="button"
            className="sc-secondary"
            onClick={onBack}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="sc-primary"
            disabled={saving}
          >
            <FiUploadCloud />{' '}
            {saving
              ? 'Submitting...'
              : isResubmit
                ? 'Resubmit work'
                : 'Submit work'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Competitions({ studentData }) {
  const [competitions, setCompetitions] =
    useState([]);
  const [categories, setCategories] =
    useState([]);
  const [selected, setSelected] =
    useState(null);
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('explore');
  const [query, setQuery] = useState('');
  const [category, setCategory] =
    useState('all');
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] = useState('');

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      setError('');

      const data =
        await getStudentCompetitions();

      setCompetitions(
        Array.isArray(data.competitions)
          ? data.competitions
          : []
      );

      setCategories(
        Array.isArray(data.categories)
          ? data.categories
          : []
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load competitions.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCompetition = async (
    competitionId
  ) => {
    try {
      setLoading(true);
      setError('');

      const data =
        await getStudentCompetition(
          competitionId
        );

      setSelected(data.competition || null);
    } catch (requestError) {
      setSelected(null);
      setError(
        requestError.message ||
          'Unable to load competition.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitions();
  }, []);

  const openCompetition = async (
    competitionId
  ) => {
    await loadCompetition(competitionId);
    setView('details');
  };

  const goList = async () => {
    setSelected(null);
    setView('list');
    await loadCompetitions();
  };

  const refreshSelected = async () => {
    if (!selected?.id) {
      return;
    }

    await loadCompetition(selected.id);
    setView('details');
  };

  const apply = async (payload) => {
    try {
      setSaving(true);
      setError('');

      await registerStudentCompetition(
        selected.id,
        payload
      );

      await refreshSelected();
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to send application.'
      );
    } finally {
      setSaving(false);
    }
  };

  const list = useMemo(() => {
    return competitions.filter((item) => {
      const mine = Boolean(item.registration);

      const isResult = [
        'results_published',
        'completed',
      ].includes(item.phase);

      const tabMatches =
  (tab === 'explore' && !mine) ||
  (tab === 'mine' && mine) ||
  (tab === 'results' && isResult);

      const categoryMatches =
        category === 'all' ||
        item.category === category;

      const searchMatches = `${
        item.title || ''
      } ${item.category || ''} ${
        item.description || ''
      }`
        .toLowerCase()
        .includes(query.toLowerCase());

      return (
        tabMatches &&
        categoryMatches &&
        searchMatches
      );
    });
  }, [
    competitions,
    query,
    category,
    tab,
  ]);

  if (view === 'apply' && selected) {
    return (
      <ApplicationForm
        competition={selected}
        studentData={studentData}
        onBack={() => {
          setError('');
          setView('details');
        }}
        onSubmit={apply}
        saving={saving}
        error={error}
      />
    );
  }

  if (view === 'submit' && selected) {
    return (
      <SubmissionForm
        competition={selected}
        initialSubmission={
          selected.submission
        }
        onBack={() => setView('details')}
        onFinished={refreshSelected}
      />
    );
  }

  if (view === 'details' && selected) {
    const [phaseLabel, color] =
      phaseMeta[selected.phase] || [
        'Competition',
        'neutral',
      ];

    const registration =
      selected.registration;

    const submission = selected.submission;
    const result = selected.result;

    const pending =
      registration?.status === 'pending';

    const approved =
      registration?.status === 'approved';

    const rejected =
      registration?.status === 'rejected';

    const needsChanges =
      submission?.status ===
      'changes_requested';

    const canApply =
      Boolean(
        selected.permissions?.can_register
      );

    const canSubmit =
      Boolean(
        selected.permissions?.can_submit
      );

    const closedMessage = () => {
      switch (selected.phase) {
        case 'registration_closed':
          return 'Registration is closed. Submissions have not opened yet.';
        case 'submissions_open':
          return 'Registration is closed for this competition.';
        case 'judging':
          return 'Submissions are closed — entries are currently being judged.';
        case 'results_published':
          return 'This competition has ended. Results are published below.';
        case 'completed':
          return 'This competition has ended.';
        default:
          return 'This competition is not accepting applications right now.';
      }
    };

    return (
      <div className="sc-page">
        <button
          className="sc-back"
          onClick={goList}
        >
          <FiArrowLeft /> Back to competitions
        </button>

        {error && (
          <div className="sc-changes-banner">
            <FiInfo />
            <div>
              <strong>
                Competition action failed
              </strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <header className="sc-detail-head">
          <span
            className={`sc-hero-icon ${color}`}
          >
            {iconFor(selected.category)}
          </span>

          <div>
            <div>
              <h1>{selected.title}</h1>
              <i
                className={`sc-phase ${color}`}
              >
                {phaseLabel}
              </i>
            </div>

            <p>{selected.description}</p>
          </div>

          <aside>
            {canApply && (
              <button
                className="sc-primary"
                onClick={() => {
                  setError('');
                  setView('apply');
                }}
              >
                Apply now
              </button>
            )}

            {pending && (
              <>
                <span className="sc-wait">
                  <FiClock /> Awaiting trainer
                  approval
                </span>
                <small>
                  Your application was sent
                  successfully.
                </small>
              </>
            )}

            {approved && canSubmit && (
              <button
                className="sc-primary"
                onClick={() =>
                  setView('submit')
                }
              >
                {needsChanges
                  ? 'Update submission'
                  : submission?.status === 'draft'
                    ? 'Continue submission'
                    : 'Upload submission'}
              </button>
            )}

            {approved &&
              !canSubmit &&
              !submission &&
              selected.phase !==
                'results_published' && (
                <span className="sc-wait">
                  Application approved
                </span>
              )}

            {submission &&
              !needsChanges &&
              !result && (
                <span
                  className={`sc-wait ${
                    [
                      'approved',
                      'scored',
                    ].includes(
                      submission.status
                    )
                      ? 'success'
                      : ''
                  }`}
                >
                  <FiCheck />{' '}
                  {[
                    'approved',
                    'scored',
                  ].includes(
                    submission.status
                  )
                    ? 'Evaluation available'
                    : 'Submission under review'}
                </span>
              )}

            {result && (
              <span className="sc-wait success">
                <FiAward /> Result available
              </span>
            )}

            {rejected && canApply && (
              <small>
                You may submit a new
                application.
              </small>
            )}

            {!canApply &&
              !registration &&
              !submission && (
                <span className="sc-wait neutral">
                  <FiInfo /> {closedMessage()}
                </span>
              )}
          </aside>
        </header>

        <div className="sc-process">
          {[
            [
              'Registration',
              selected.registration_start_at,
              selected.registration_end_at,
              FiCalendar,
            ],
            [
              'Work period',
              selected.submission_open_at,
              selected.submission_deadline_at,
              FiTarget,
            ],
            [
              'Submission deadline',
              selected.submission_deadline_at,
              '',
              FiClock,
            ],
            [
              'Results',
              selected.results_at,
              '',
              FiAward,
            ],
          ].map(
            ([label, from, to, Icon], index) => (
              <div
                key={label}
                className={
                  index === 0 ? 'active' : ''
                }
              >
                <span>
                  <Icon />
                </span>

                <p>
                  <b>{label}</b>
                  <small>
                    {formatDate(from)}
                    {to
                      ? ` – ${formatDate(to)}`
                      : ''}
                  </small>
                </p>
              </div>
            )
          )}
        </div>

        <div className="sc-detail-layout">
          <main>
            <section className="sc-panel">
              <h2>
                <FiInfo /> About the competition
              </h2>

              <p>{selected.description}</p>

              <h3>Objective</h3>

              <p>
                {selected.objective ||
                  'No objective provided.'}
              </p>
            </section>

            <section className="sc-panel">
              <h2>
                <FiFile /> Requirements
              </h2>

              <ul>
                {(selected.requirements || []).map(
                  (item) => (
                    <li key={item}>
                      <FiCheck /> {item}
                    </li>
                  )
                )}
              </ul>
            </section>

            <section className="sc-panel">
              <h2>
                <FiShield /> Rules
              </h2>

              <ul>
                {(selected.rules || []).map(
                  (item) => (
                    <li key={item}>
                      <FiCheck /> {item}
                    </li>
                  )
                )}
              </ul>
            </section>

            <div className="sc-split">
              <section className="sc-panel">
                <h2>
                  <FiUploadCloud /> What to
                  submit
                </h2>

                <ul>
                  {(
                    selected.submission_requirements ||
                    []
                  ).map((item) => (
                    <li key={item.id}>
                      <FiFile /> {item.title}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="sc-panel">
                <h2>
                  <FiStar /> Evaluation criteria
                </h2>

                <dl>
                  {(
                    selected.evaluation_criteria ||
                    []
                  ).map((item) => (
                    <div key={item.id}>
                      <dt>{item.title}</dt>
                      <dd>{item.weight}%</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>

            {result && (
              <section className="sc-panel">
                <h2>
                  <FiAward /> Your result
                </h2>

                <div className="sc-result">
                  <b>
                    {result.award ||
                      `Rank #${result.rank}`}
                  </b>

                  <span>
                    {result.final_score ?? 0}
                    /100
                  </span>

                  <p>
                    Final rank: #{result.rank}
                  </p>
                </div>

                {submission?.scores?.length >
                  0 && (
                  <dl>
                    {submission.scores.map(
                      (score) => (
                        <div
                          key={
                            score.criterion_id
                          }
                        >
                          <dt>
                            {score.title}
                          </dt>
                          <dd>
                            {score.score} /{' '}
                            {score.weight}
                          </dd>
                        </div>
                      )
                    )}
                  </dl>
                )}
              </section>
            )}
          </main>

          <aside>
            <section className="sc-panel">
              <h2>
                <FiInfo /> Key information
              </h2>

              <dl>
                <div>
                  <dt>Registration closes</dt>
                  <dd>
                    {formatDate(
                      selected.registration_end_at
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Submission deadline
                  </dt>
                  <dd>
                    {formatDate(
                      selected.submission_deadline_at,
                      true
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Participation</dt>
                  <dd>
                    {participationLabel(
                      selected.participation_type
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Team size</dt>
                  <dd>
                    Up to{' '}
                    {selected.max_team_members ||
                      1}
                  </dd>
                </div>

                <div>
                  <dt>Prize</dt>
                  <dd>
                    {selected.prize ||
                      'Recognition award'}
                  </dd>
                </div>

                <div>
                  <dt>Organizer</dt>
                  <dd>
                    {selected.organizer?.name ||
                      'Compass Academy'}
                  </dd>
                </div>
              </dl>
            </section>

            {registration ? (
              <section className="sc-status-panel">
                <h2>Your participation</h2>

                <div className="sc-status-line">
                  <span
                    className={
                      registration.status
                    }
                  >
                    <FiCheck />
                  </span>

                  <div>
                    <b>
                      Application{' '}
                      {registration.status}
                    </b>

                    <small>
                      {pending
                        ? 'The trainer will review your request.'
                        : approved
                          ? 'Your application is approved.'
                          : registration.rejection_reason ||
                            'Check your application status.'}
                    </small>
                  </div>
                </div>

                {registration.team_name && (
                  <div className="sc-result">
                    <b>
                      {registration.team_name}
                    </b>
                    <span>
                      {
                        registration.members
                          ?.length
                      }{' '}
                      member(s)
                    </span>
                  </div>
                )}

                {submission && (
                  <div
                    className={`sc-result ${
                      needsChanges
                        ? 'needs-changes'
                        : ''
                    }`}
                  >
                    <b>{submission.title}</b>

                    <span>
                      {result
                        ? `${
                            result.final_score ??
                            0
                          }/100`
                        : needsChanges
                          ? 'Changes requested'
                          : submission.status.replaceAll(
                              '_',
                              ' '
                            )}
                    </span>

                    <p>
                      {submission.feedback ||
                        'Your work is currently being reviewed.'}
                    </p>
                  </div>
                )}

                {canSubmit && (
                  <button
                    className="sc-primary"
                    onClick={() =>
                      setView('submit')
                    }
                  >
                    {needsChanges
                      ? 'Update submission'
                      : submission?.status ===
                          'draft'
                        ? 'Continue submission'
                        : 'Upload and submit work'}
                  </button>
                )}
              </section>
            ) : canApply ? (
              <section className="sc-info-box">
                <FiInfo />
                <h3>Before you apply</h3>
                <p>
                  Choose whether you are applying
                  individually or with a team.
                </p>

                <button
                  className="sc-primary"
                  onClick={() =>
                    setView('apply')
                  }
                >
                  Apply now
                </button>
              </section>
            ) : (
              <section className="sc-info-box closed">
                <FiInfo />
                <h3>
                  Applications are closed
                </h3>
                <p>{closedMessage()}</p>
              </section>
            )}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-page">
      <header className="sc-heading">
        <div>
          <h1>Competitions</h1>
          <p>
            Discover challenges, apply, and track
            your participation.
          </p>
        </div>
      </header>

      <div className="sc-toolbar">
        <nav>
          {[
            ['explore', 'Explore'],
            ['mine', 'My competitions'],
            ['results', 'Results'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={
                tab === id ? 'active' : ''
              }
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <label>
          <FiSearch />
          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search competitions"
          />
        </label>

        <select
          className="sc-category-select"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        >
          <option value="all">
            All categories
          </option>

          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="sc-empty">
          <FiClock />
          <h3>Loading competitions...</h3>
        </div>
      ) : error ? (
        <div className="sc-empty">
          <FiInfo />
          <h3>
            Unable to load competitions
          </h3>
          <p>{error}</p>
          <button
            className="sc-primary"
            onClick={loadCompetitions}
          >
            Try again
          </button>
        </div>
      ) : (
        <section className="sc-list-panel">
          <h2>
            {tab === 'explore'
              ? 'Available competitions'
              : tab === 'mine'
                ? 'My competitions'
                : 'Competition results'}
          </h2>

          <div className="sc-list">
            {list.map((item) => {
              const registration =
                item.registration;

              const submission =
                item.submission;

              const result = item.result;

              const [label, color] =
                phaseMeta[item.phase] || [
                  'Competition',
                  'neutral',
                ];

              const deadline =
                item.phase ===
                'registration_open'
                  ? item.registration_end_at
                  : item.submission_deadline_at;

              const action = result
                ? 'View result'
                : submission
                  ? submission.status ===
                    'changes_requested'
                    ? 'Update submission'
                    : 'View submission'
                  : registration?.status ===
                      'approved'
                    ? 'Continue'
                    : 'View details';

              return (
                <article
                  key={item.id}
                  onClick={() =>
                    openCompetition(item.id)
                  }
                >
                  <span
                    className={`sc-list-icon ${color}`}
                  >
                    {iconFor(item.category)}
                  </span>

                  <div className="sc-list-title">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>

                  <div className="sc-list-meta">
                    <span>
                      <FiCalendar />
                      <b>
                        {item.phase ===
                        'registration_open'
                          ? 'Registration closes'
                          : 'Submission closes'}
                      </b>

                      <small>
                        {formatDate(deadline)}
                        {daysLeft(deadline) !==
                        null
                          ? ` · ${daysLeft(
                              deadline
                            )} days left`
                          : ''}
                      </small>
                    </span>

                    <span>
                      <FiUsers />
                      <b>
                        {participationLabel(
                          item.participation_type
                        )}
                      </b>
                      <small>
                        Up to{' '}
                        {item.max_team_members ||
                          1}{' '}
                        members
                      </small>
                    </span>
                  </div>

                  <div className="sc-list-state">
                    <i
                      className={`sc-phase ${color}`}
                    >
                      {label}
                    </i>

                    {registration && (
                      <small
                        className={
                          registration.status
                        }
                      >
                        <FiCheck />{' '}
                        {registration.status ===
                        'approved'
                          ? 'Your application is approved'
                          : `Application ${registration.status}`}
                      </small>
                    )}

                    {submission && (
                      <small
                        className={
                          submission.status ===
                          'changes_requested'
                            ? 'changes'
                            : ''
                        }
                      >
                        <FiClock />{' '}
                        {result
                          ? `${
                              result.final_score ??
                              0
                            }/100 · Rank #${
                              result.rank
                            }`
                          : submission.status ===
                              'changes_requested'
                            ? 'Changes requested'
                            : submission.status ===
                                'submitted'
                              ? 'Submission under review'
                              : submission.status.replaceAll(
                                  '_',
                                  ' '
                                )}
                      </small>
                    )}
                  </div>

                  <button>{action}</button>
                  <FiChevronRight className="sc-chevron" />
                </article>
              );
            })}

            {!list.length && (
              <div className="sc-empty">
                <FiAward />
                <h3>
                  No competitions found
                </h3>
                <p>
                  Published competitions and your
                  participation will appear here.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="sc-sync">
        <FiInfo /> New competitions published by
        trainers will appear here automatically.
      </footer>
    </div>
  );
}

export default Competitions;
