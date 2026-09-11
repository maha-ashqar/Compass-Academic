import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiPlus,
  FiSearch,
  FiStar,
  FiTarget,
  FiTrash2,
  FiUsers,
  FiX,
} from 'react-icons/fi';

import './TrainerCompetitions.css';

const COMPETITION_PHASE = {
  DRAFT: 'draft',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  SUBMISSIONS_OPEN: 'submissions_open',
  JUDGING: 'judging',
  RESULTS_PUBLISHED: 'results_published',
  COMPLETED: 'completed',
};

const phaseLabels = {
  [COMPETITION_PHASE.DRAFT]:
    'Draft',

  [COMPETITION_PHASE.REGISTRATION_OPEN]:
    'Registration open',

  [COMPETITION_PHASE.REGISTRATION_CLOSED]:
    'Registration closed',

  [COMPETITION_PHASE.SUBMISSIONS_OPEN]:
    'Submissions open',

  [COMPETITION_PHASE.JUDGING]:
    'Judging',

  [COMPETITION_PHASE.RESULTS_PUBLISHED]:
    'Results published',

  [COMPETITION_PHASE.COMPLETED]:
    'Completed',
};

const filters = [
  [
    'all',
    'All competitions',
  ],
  [
    COMPETITION_PHASE.REGISTRATION_OPEN,
    'Registration',
  ],
  [
    COMPETITION_PHASE.SUBMISSIONS_OPEN,
    'Submissions',
  ],
  [
    COMPETITION_PHASE.JUDGING,
    'Judging',
  ],
  [
    COMPETITION_PHASE.COMPLETED,
    'Completed',
  ],
];

const emptyForm = {
  title: '',
  category: '',
  description: '',
  prize: '',
  participationType:
    'individual-or-team',
  maxTeamMembers: 5,
  registrationOpenAt: '',
  registrationCloseAt: '',
  submissionOpenAt: '',
  submissionCloseAt: '',
  resultsAt: '',
  requirementsText: '',
  rulesText: '',
};

const defaultEvaluationCriteria = [
  {
    title: 'Idea & impact',
    weight: 25,
  },
  {
    title: 'Technical quality',
    weight: 35,
  },
  {
    title: 'User experience',
    weight: 20,
  },
  {
    title: 'Presentation',
    weight: 20,
  },
];

const defaultSubmissionRequirements = [
  {
    title: 'Project description',
    type: 'text',
  },
  {
    title: 'Source repository',
    type: 'github',
  },
  {
    title: 'Demo or prototype link',
    type: 'demo',
  },
];

const getTrainerToken = () =>
  localStorage.getItem(
    'trainer_token'
  ) ||
  sessionStorage.getItem(
    'trainer_token'
  );

const request = async (
  endpoint,
  options = {}
) => {
  const token =
    getTrainerToken();

  if (!token) {
    throw new Error(
      'No trainer authentication token found.'
    );
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        Accept:
          'application/json',

        Authorization:
          `Bearer ${token}`,

        ...(options.body
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),

        ...(options.headers ||
          {}),
      },
    }
  );

  let data = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const validationError =
      data.errors
        ? Object.values(
            data.errors
          ).flat()[0]
        : null;

    throw new Error(
      validationError ||
        data.message ||
        'Unable to complete the request.'
    );
  }

  return data;
};

const jsonRequest = (
  method,
  payload
) => ({
  method,
  body: JSON.stringify(
    payload
  ),
});

const trainerApi = {
  competitions() {
    return request(
      '/trainer/competitions'
    );
  },

  competition(id) {
    return request(
      `/trainer/competitions/${id}`
    );
  },

  createCompetition(
    payload
  ) {
    return request(
      '/trainer/competitions',
      jsonRequest(
        'POST',
        payload
      )
    );
  },

  updateCompetition(
    id,
    payload
  ) {
    return request(
      `/trainer/competitions/${id}`,
      jsonRequest(
        'PATCH',
        payload
      )
    );
  },

  deleteCompetition(id) {
    return request(
      `/trainer/competitions/${id}`,
      {
        method: 'DELETE',
      }
    );
  },

  updateStatus(
    id,
    status
  ) {
    return request(
      `/trainer/competitions/${id}/status`,
      jsonRequest(
        'PATCH',
        {
          status,
        }
      )
    );
  },

  registrations(id) {
    return request(
      `/trainer/competitions/${id}/registrations`
    );
  },

  approveRegistration(
    competitionId,
    registrationId
  ) {
    return request(
      `/trainer/competitions/${competitionId}/registrations/${registrationId}/approve`,
      {
        method: 'PATCH',
      }
    );
  },

  rejectRegistration(
    competitionId,
    registrationId,
    reason
  ) {
    return request(
      `/trainer/competitions/${competitionId}/registrations/${registrationId}/reject`,
      jsonRequest(
        'PATCH',
        {
          reason,
        }
      )
    );
  },

  submissions(id) {
    return request(
      `/trainer/competitions/${id}/submissions`
    );
  },

  reviewSubmission(
    competitionId,
    submissionId,
    payload
  ) {
    return request(
      `/trainer/competitions/${competitionId}/submissions/${submissionId}/review`,
      jsonRequest(
        'PATCH',
        payload
      )
    );
  },

  scoreSubmission(
    competitionId,
    submissionId,
    payload
  ) {
    return request(
      `/trainer/competitions/${competitionId}/submissions/${submissionId}/score`,
      jsonRequest(
        'PUT',
        payload
      )
    );
  },

  results(id) {
    return request(
      `/trainer/competitions/${id}/results`
    );
  },

  publishResults(id) {
    return request(
      `/trainer/competitions/${id}/results/publish`,
      jsonRequest(
        'POST',
        {
          awards: [],
        }
      )
    );
  },
};

const formatDate = (
  value
) =>
  value
    ? new Date(
        value
      ).toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }
      )
    : 'Not set';

const dateInputValue = (
  value
) => {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const local =
    new Date(
      date.getTime() -
        date.getTimezoneOffset() *
          60000
    );

  return local
    .toISOString()
    .slice(0, 16);
};

const toApiParticipation = (
  value
) => {
  if (
    value ===
    'individual-or-team'
  ) {
    return 'individual_or_team';
  }

  return value;
};

const fromApiParticipation = (
  value
) => {
  if (
    value ===
    'individual_or_team'
  ) {
    return 'individual-or-team';
  }

  return value;
};

const effectivePhase = (
  competition
) => {
  if (
    [
      COMPETITION_PHASE.RESULTS_PUBLISHED,
      COMPETITION_PHASE.COMPLETED,
    ].includes(
      competition.status
    )
  ) {
    return competition.status;
  }

  const now =
    Date.now();

  const submissionDeadline =
    competition
      .submission_deadline_at
      ? new Date(
          competition.submission_deadline_at
        ).getTime()
      : null;

  const registrationEnd =
    competition
      .registration_end_at
      ? new Date(
          competition.registration_end_at
        ).getTime()
      : null;

  if (
    submissionDeadline &&
    submissionDeadline <
      now &&
    [
      COMPETITION_PHASE.SUBMISSIONS_OPEN,
      COMPETITION_PHASE.REGISTRATION_CLOSED,
    ].includes(
      competition.status
    )
  ) {
    return COMPETITION_PHASE.JUDGING;
  }

  if (
    registrationEnd &&
    registrationEnd <
      now &&
    competition.status ===
      COMPETITION_PHASE.REGISTRATION_OPEN
  ) {
    return COMPETITION_PHASE.REGISTRATION_CLOSED;
  }

  return (
    competition.status ||
    COMPETITION_PHASE.DRAFT
  );
};

const normalizeCompetition = (
  competition
) => ({
  ...competition,

  id: Number(
    competition.id
  ),

  status:
    competition.status,

  phase:
    competition.status ||
    COMPETITION_PHASE.DRAFT,

  participationType:
    fromApiParticipation(
      competition.participation_type
    ),

  maxTeamMembers:
    Number(
      competition.max_team_members ||
        1
    ),

  registrationOpenAt:
    competition.registration_start_at,

  registrationCloseAt:
    competition.registration_end_at,

  submissionOpenAt:
    competition.work_start_at,

  submissionCloseAt:
    competition.submission_deadline_at,

  resultsAt:
    competition.results_at,

  requirements:
    (
      competition.requirements ||
      []
    ).map(
      (item) =>
        typeof item ===
        'string'
          ? item
          : item.requirement
    ),

  rules:
    (
      competition.rules ||
      []
    ).map(
      (item) =>
        typeof item ===
        'string'
          ? item
          : item.rule
    ),

  evaluationCriteria:
    competition.evaluation_criteria ||
    [],
});

const normalizeRegistration = (
  registration
) => {
  const leader =
    registration.members?.find(
      (member) =>
        member.membership_role ===
        'leader'
    ) ||
    registration.members?.[0];

  return {
    ...registration,

    id:
      Number(
        registration.id
      ),

    studentName:
      leader?.name ||
      'Participant',

    studentEmail:
      leader?.email || '',

    type:
      registration.participation_type ||
      (registration.team_name
        ? 'team'
        : 'individual'),

    teamName:
      registration.team_name,
  };
};

const normalizeSubmission = (
  submission
) => {
  const registration =
    submission.registration;

  const leader =
    registration?.members?.find(
      (member) =>
        member.membership_role ===
        'leader'
    ) ||
    registration?.members?.[0];

  const rubricScores = {};

  (
    submission.scores ||
    []
  ).forEach((score) => {
    rubricScores[
      score.criterion_id
    ] =
      Number(
        score.score
      );
  });

  return {
    ...submission,

    id:
      Number(
        submission.id
      ),

    studentName:
      leader?.name ||
      'Participant',

    studentEmail:
      leader?.email || '',

    teamName:
      registration?.team_name ||
      null,

    finalScore:
      submission.calculated_score !==
        null &&
      submission.calculated_score !==
        undefined
        ? Number(
            submission.calculated_score
          )
        : null,

    rubricScores,
  };
};

const normalizeResult = (
  result
) => {
  const registration =
    result.registration;

  const leader =
    registration?.members?.find(
      (member) =>
        member.membership_role ===
        'leader'
    ) ||
    registration?.members?.[0];

  return {
    ...result,

    studentName:
      leader?.name ||
      'Participant',

    teamName:
      registration?.team_name ||
      null,

    finalScore:
      result.final_score !==
        null &&
      result.final_score !==
        undefined
        ? Number(
            result.final_score
          )
        : null,
  };
};

const formFromCompetition = (
  competition
) => ({
  ...emptyForm,

  title:
    competition.title ||
    '',

  category:
    competition.category ||
    '',

  description:
    competition.description ||
    '',

  prize:
    competition.prize || '',

  participationType:
    competition.participationType ||
    'individual-or-team',

  maxTeamMembers:
    competition.maxTeamMembers ||
    1,

  registrationOpenAt:
    dateInputValue(
      competition.registrationOpenAt
    ),

  registrationCloseAt:
    dateInputValue(
      competition.registrationCloseAt
    ),

  submissionOpenAt:
    dateInputValue(
      competition.submissionOpenAt
    ),

  submissionCloseAt:
    dateInputValue(
      competition.submissionCloseAt
    ),

  resultsAt:
    dateInputValue(
      competition.resultsAt
    ),

  requirementsText:
    (
      competition.requirements ||
      []
    ).join('\n'),

  rulesText:
    (
      competition.rules ||
      []
    ).join('\n'),
});

const formToPayload = (
  form
) => ({
  title:
    form.title.trim(),

  category:
    form.category.trim() ||
    null,

  description:
    form.description.trim() ||
    null,

  prize:
    form.prize.trim() ||
    null,

  participation_type:
    toApiParticipation(
      form.participationType
    ),

  max_team_members:
    form.participationType ===
    'individual'
      ? 1
      : Number(
          form.maxTeamMembers
        ),

  registration_start_at:
    form.registrationOpenAt ||
    null,

  registration_end_at:
    form.registrationCloseAt ||
    null,

  work_start_at:
    form.submissionOpenAt ||
    null,

  work_end_at:
    form.submissionCloseAt ||
    null,

  submission_deadline_at:
    form.submissionCloseAt ||
    null,

  results_at:
    form.resultsAt ||
    null,

  requirements:
    form.requirementsText
      .split('\n')
      .map((item) =>
        item.trim()
      )
      .filter(Boolean),

  rules:
    form.rulesText
      .split('\n')
      .map((item) =>
        item.trim()
      )
      .filter(Boolean),
});

function CompetitionForm({
  initial,
  onCancel,
  onSave,
}) {
  const [form, setForm] =
    useState(() =>
      initial
        ? formFromCompetition(
            initial
          )
        : emptyForm
    );

  const [saving, setSaving] =
    useState(false);

  const update = (
    key,
    value
  ) =>
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

  const submit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.registrationCloseAt ||
      !form.submissionCloseAt
    ) {
      return;
    }

    try {
      setSaving(true);

      await onSave(form);
    } catch (error) {
      window.alert(
        error.message ||
          'Unable to save competition.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tc-page">
      <button
        className="tc-back"
        onClick={onCancel}
        type="button"
      >
        <FiArrowLeft />
        Back to competitions
      </button>

      <header className="tc-title">
        <div>
          <span>
            COMPETITION MANAGEMENT
          </span>

          <h1>
            {initial
              ? 'Edit competition'
              : 'Create competition'}
          </h1>

          <p>
            Define participation,
            registration, submission,
            and judging details.
          </p>
        </div>
      </header>

      <form
        className="tc-form"
        onSubmit={submit}
      >
        <section>
          <h2>
            Competition information
          </h2>

          <div className="tc-form-grid">
            <label>
              Competition title *

              <input
                value={form.title}
                onChange={(e) =>
                  update(
                    'title',
                    e.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Category

              <input
                value={
                  form.category
                }
                onChange={(e) =>
                  update(
                    'category',
                    e.target.value
                  )
                }
                placeholder="AI, Web, Design..."
              />
            </label>

            <label className="full">
              Description

              <textarea
                value={
                  form.description
                }
                onChange={(e) =>
                  update(
                    'description',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Prize

              <input
                value={form.prize}
                onChange={(e) =>
                  update(
                    'prize',
                    e.target.value
                  )
                }
                placeholder="$5,000"
              />
            </label>

            <label>
              Participation

              <select
                value={
                  form.participationType
                }
                onChange={(e) =>
                  update(
                    'participationType',
                    e.target.value
                  )
                }
              >
                <option value="individual">
                  Individual only
                </option>

                <option value="team">
                  Team only
                </option>

                <option value="individual-or-team">
                  Individual or team
                </option>
              </select>
            </label>

            <label>
              Maximum team members

              <input
                type="number"
                min="1"
                max="20"
                disabled={
                  form.participationType ===
                  'individual'
                }
                value={
                  form.participationType ===
                  'individual'
                    ? 1
                    : form.maxTeamMembers
                }
                onChange={(e) =>
                  update(
                    'maxTeamMembers',
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </label>
          </div>
        </section>

        <section>
          <h2>Timeline</h2>

          <div className="tc-form-grid">
            <label>
              Registration opens

              <input
                type="datetime-local"
                value={
                  form.registrationOpenAt
                }
                onChange={(e) =>
                  update(
                    'registrationOpenAt',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Registration closes *

              <input
                type="datetime-local"
                value={
                  form.registrationCloseAt
                }
                onChange={(e) =>
                  update(
                    'registrationCloseAt',
                    e.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Submissions open

              <input
                type="datetime-local"
                value={
                  form.submissionOpenAt
                }
                onChange={(e) =>
                  update(
                    'submissionOpenAt',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Submission deadline *

              <input
                type="datetime-local"
                value={
                  form.submissionCloseAt
                }
                onChange={(e) =>
                  update(
                    'submissionCloseAt',
                    e.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Results date

              <input
                type="datetime-local"
                value={
                  form.resultsAt
                }
                onChange={(e) =>
                  update(
                    'resultsAt',
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </section>

        <section>
          <h2>
            Requirements & rules
          </h2>

          <div className="tc-form-grid">
            <label>
              Requirements, one per
              line

              <textarea
                value={
                  form.requirementsText
                }
                onChange={(e) =>
                  update(
                    'requirementsText',
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Rules, one per line

              <textarea
                value={
                  form.rulesText
                }
                onChange={(e) =>
                  update(
                    'rulesText',
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </section>

        <footer>
          <button
            type="button"
            className="tc-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="tc-primary"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : initial
                ? 'Save changes'
                : 'Create & publish'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function TrainerCompetitions() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    competitions,
    setCompetitions,
  ] = useState([]);

  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    registrations,
    setRegistrations,
  ] = useState([]);

  const [
    submissions,
    setSubmissions,
  ] = useState([]);

  const [
    publishedResults,
    setPublishedResults,
  ] = useState([]);

  const [
    attention,
    setAttention,
  ] = useState({});

  const [
    query,
    setQuery,
  ] = useState('');

  const [
    filter,
    setFilter,
  ] = useState('all');

  const [
    category,
    setCategory,
  ] = useState('all');

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    scoreDrafts,
    setScoreDrafts,
  ] = useState({});

  const [
    feedbackDrafts,
    setFeedbackDrafts,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const path =
    location.pathname;

  const isNew =
    path.endsWith(
      '/competitions/new'
    );

  const routeMatch =
    path.match(
      /\/competitions\/([^/]+)(?:\/(registrations|submissions|results))?$/
    );

  const selectedId =
    routeMatch?.[1];

  const section =
    routeMatch?.[2] ||
    'overview';

  const goList = () =>
    navigate(
      '/trainer-dashboard/competitions'
    );

  const loadAttention =
    async (items) => {
      const rows =
        await Promise.all(
          items.map(
            async (
              competition
            ) => {
              try {
                const [
                  registrationData,
                  submissionData,
                ] =
                  await Promise.all([
                    trainerApi.registrations(
                      competition.id
                    ),

                    trainerApi.submissions(
                      competition.id
                    ),
                  ]);

                return [
                  competition.id,
                  {
                    registrations:
                      (
                        registrationData.registrations ||
                        []
                      ).map(
                        normalizeRegistration
                      ),

                    submissions:
                      (
                        submissionData.submissions ||
                        []
                      ).map(
                        normalizeSubmission
                      ),
                  },
                ];
              } catch {
                return [
                  competition.id,
                  {
                    registrations:
                      [],
                    submissions: [],
                  },
                ];
              }
            }
          )
        );

      setAttention(
        Object.fromEntries(
          rows
        )
      );
    };

  const loadCompetitions =
    async () => {
      try {
        setError('');

        const data =
          await trainerApi.competitions();

        const items =
          (
            data.competitions ||
            []
          ).map(
            normalizeCompetition
          );

        setCompetitions(
          items
        );

        await loadAttention(
          items
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
            'Unable to load competitions.'
        );
      }
    };

  const loadSelected =
    async () => {
      if (
        !selectedId ||
        selectedId === 'new'
      ) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data =
          await trainerApi.competition(
            selectedId
          );

        const competition =
          normalizeCompetition(
            data.competition
          );

        setSelected(
          competition
        );

        if (
          section ===
          'registrations'
        ) {
          const registrationData =
            await trainerApi.registrations(
              selectedId
            );

          setRegistrations(
            (
              registrationData.registrations ||
              []
            ).map(
              normalizeRegistration
            )
          );
        }

        if (
          section ===
          'submissions'
        ) {
          const submissionData =
            await trainerApi.submissions(
              selectedId
            );

          const items =
            (
              submissionData.submissions ||
              []
            ).map(
              normalizeSubmission
            );

          setSubmissions(
            items
          );

          const nextFeedback = {};

          items.forEach(
            (item) => {
              nextFeedback[
                item.id
              ] =
                item.feedback ||
                '';
            }
          );

          setFeedbackDrafts(
            nextFeedback
          );
        }

        if (
          section ===
          'results'
        ) {
          const [
            submissionData,
            resultData,
          ] =
            await Promise.all([
              trainerApi.submissions(
                selectedId
              ),

              trainerApi.results(
                selectedId
              ),
            ]);

          setSubmissions(
            (
              submissionData.submissions ||
              []
            ).map(
              normalizeSubmission
            )
          );

          setPublishedResults(
            (
              resultData.results ||
              []
            ).map(
              normalizeResult
            )
          );
        }
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
            'Unable to load competition.'
        );
      } finally {
        setLoading(false);
      }
    };

  const refreshSelected =
    async () => {
      if (
        !selected?.id
      ) {
        return null;
      }

      const data =
        await trainerApi.competition(
          selected.id
        );

      const item =
        normalizeCompetition(
          data.competition
        );

      setSelected(
        item
      );

      return item;
    };

  const refreshRegistrations =
    async () => {
      if (
        !selected?.id
      ) {
        return;
      }

      const data =
        await trainerApi.registrations(
          selected.id
        );

      setRegistrations(
        (
          data.registrations ||
          []
        ).map(
          normalizeRegistration
        )
      );
    };

  const refreshSubmissions =
    async () => {
      if (
        !selected?.id
      ) {
        return;
      }

      const data =
        await trainerApi.submissions(
          selected.id
        );

      setSubmissions(
        (
          data.submissions ||
          []
        ).map(
          normalizeSubmission
        )
      );
    };

  useEffect(() => {
    const start =
      async () => {
        try {
          setLoading(true);

          await loadCompetitions();
        } finally {
          setLoading(false);
        }
      };

    start();
  }, []);

  useEffect(() => {
    if (
      selectedId &&
      selectedId !== 'new'
    ) {
      loadSelected();
    } else {
      setSelected(null);
    }
  }, [
    selectedId,
    section,
  ]);

  const filtered =
    useMemo(
      () =>
        competitions.filter(
          (item) =>
            (
              filter ===
                'all' ||
              item.phase ===
                filter
            ) &&
            (
              category ===
                'all' ||
              item.category ===
                category
            ) &&
            `${
              item.title || ''
            } ${
              item.category || ''
            }`
              .toLowerCase()
              .includes(
                query.toLowerCase()
              )
        ),
      [
        competitions,
        filter,
        category,
        query,
      ]
    );

  const categories =
    useMemo(
      () => [
        ...new Set(
          competitions
            .map(
              (item) =>
                item.category
            )
            .filter(Boolean)
        ),
      ],
      [competitions]
    );

  const allRegistrations =
    useMemo(
      () =>
        Object.values(
          attention
        ).flatMap(
          (item) =>
            item.registrations ||
            []
        ),
      [attention]
    );

  const allSubmissions =
    useMemo(
      () =>
        Object.values(
          attention
        ).flatMap(
          (item) =>
            item.submissions ||
            []
        ),
      [attention]
    );

  const pendingRegistrations =
    allRegistrations.filter(
      (item) =>
        item.status ===
        'pending'
    );

  const newSubmissions =
    allSubmissions.filter(
      (item) =>
        item.status ===
        'submitted'
    );

  const pendingScores =
    allSubmissions.filter(
      (item) =>
        item.finalScore ===
          null &&
        [
          'submitted',
          'under_review',
          'approved',
        ].includes(
          item.status
        )
    );

  const firstPendingRegistrationCompetition =
    competitions.find(
      (item) =>
        (
          attention[
            item.id
          ]?.registrations ||
          []
        ).some(
          (registration) =>
            registration.status ===
            'pending'
        )
    );

  const firstNewSubmissionCompetition =
    competitions.find(
      (item) =>
        (
          attention[
            item.id
          ]?.submissions ||
          []
        ).some(
          (submission) =>
            submission.status ===
            'submitted'
        )
    );

  const firstPendingScoreCompetition =
    competitions.find(
      (item) =>
        (
          attention[
            item.id
          ]?.submissions ||
          []
        ).some(
          (submission) =>
            submission.finalScore ===
              null &&
            [
              'submitted',
              'under_review',
              'approved',
            ].includes(
              submission.status
            )
        )
    );

  const ranking =
    useMemo(() => {
      if (
        publishedResults.length
      ) {
        return [
          ...publishedResults,
        ].sort(
          (a, b) =>
            Number(
              a.rank || 9999
            ) -
            Number(
              b.rank || 9999
            )
        );
      }

      return submissions
        .filter(
          (item) =>
            item.finalScore !==
              null &&
            item.finalScore !==
              undefined
        )
        .sort(
          (a, b) =>
            b.finalScore -
            a.finalScore
        )
        .map(
          (item, index) => ({
            ...item,
            rank: index + 1,
          })
        );
    }, [
      submissions,
      publishedResults,
    ]);

  const updatePhase =
    async (status) => {
      try {
        setError('');

        const data =
          await trainerApi.updateStatus(
            selected.id,
            status
          );

        setSelected(
          normalizeCompetition(
            data.competition
          )
        );

        await loadCompetitions();
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      }
    };

  const handleCreate =
    async (form) => {
      const payload =
        formToPayload(form);

      payload.status =
        COMPETITION_PHASE.REGISTRATION_OPEN;

      payload.evaluation_criteria =
        defaultEvaluationCriteria;

      payload.submission_requirements =
        defaultSubmissionRequirements;

      const data =
        await trainerApi.createCompetition(
          payload
        );

      const item =
        normalizeCompetition(
          data.competition
        );

      await loadCompetitions();

      navigate(
        `/trainer-dashboard/competitions/${item.id}`
      );
    };

  const handleUpdate =
    async (form) => {
      const data =
        await trainerApi.updateCompetition(
          selected.id,
          formToPayload(form)
        );

      setSelected(
        normalizeCompetition(
          data.competition
        )
      );

      setEditing(false);

      await loadCompetitions();
    };

  const approveRegistration =
    async (
      registrationId
    ) => {
      try {
        setError('');

        await trainerApi.approveRegistration(
          selected.id,
          registrationId
        );

        await Promise.all([
          refreshRegistrations(),
          refreshSelected(),
          loadCompetitions(),
        ]);
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      }
    };

  const rejectRegistration =
    async (
      registrationId
    ) => {
      const reason =
        window.prompt(
          'Rejection reason'
        );

      if (!reason?.trim()) {
        return;
      }

      try {
        setError('');

        await trainerApi.rejectRegistration(
          selected.id,
          registrationId,
          reason.trim()
        );

        await Promise.all([
          refreshRegistrations(),
          refreshSelected(),
          loadCompetitions(),
        ]);
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      }
    };

  const saveSubmissionScore =
    async (
      submission,
      draft
    ) => {
      const criteria =
        selected.evaluationCriteria ||
        [];

      if (
        !criteria.length
      ) {
        window.alert(
          'This competition has no evaluation criteria.'
        );

        return;
      }

      const scores =
        [];

      for (
        const criterion
        of criteria
      ) {
        const value =
          draft[
            criterion.id
          ];

        if (
          value === '' ||
          value ===
            undefined ||
          value === null
        ) {
          window.alert(
            `Enter a score for ${criterion.title}.`
          );

          return;
        }

        scores.push({
          criterion_id:
            criterion.id,

          score:
            Number(value),

          feedback:
            null,
        });
      }

      try {
        setError('');

        await trainerApi.scoreSubmission(
          selected.id,
          submission.id,
          {
            scores,

            feedback:
              feedbackDrafts[
                submission.id
              ]?.trim() ||
              null,
          }
        );

        await Promise.all([
          refreshSubmissions(),
          refreshSelected(),
          loadCompetitions(),
        ]);
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      }
    };

  const approveSubmission =
    async (submission) => {
      try {
        setError('');

        await trainerApi.reviewSubmission(
          selected.id,
          submission.id,
          {
            status:
              'approved',

            feedback:
              feedbackDrafts[
                submission.id
              ]?.trim() ||
              submission.feedback ||
              null,
          }
        );

        await Promise.all([
          refreshSubmissions(),
          refreshSelected(),
          loadCompetitions(),
        ]);
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      }
    };

  const requestSubmissionChanges =
    async (submission) => {
      const feedback =
        window.prompt(
          'Required changes'
        );

      if (
        !feedback?.trim()
      ) {
        return;
      }

      try {
        setError('');

        await trainerApi.reviewSubmission(
          selected.id,
          submission.id,
          {
            status:
              'changes_requested',

            feedback:
              feedback.trim(),
          }
        );

        await Promise.all([
          refreshSubmissions(),
          refreshSelected(),
          loadCompetitions(),
        ]);
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      }
    };

  const publishResults =
    async () => {
      try {
        setError('');

        const data =
          await trainerApi.publishResults(
            selected.id
          );

        setPublishedResults(
          (
            data.results ||
            []
          ).map(
            normalizeResult
          )
        );

        await Promise.all([
          refreshSelected(),
          loadCompetitions(),
        ]);
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      }
    };

  const exportResults =
    () => {
      if (
        !ranking.length
      ) {
        return;
      }

      const rows = [
        [
          'Rank',
          'Participant',
          'Submission',
          'Score',
        ],

        ...ranking.map(
          (item) => [
            item.rank,
            item.teamName ||
              item.studentName ||
              '',
            item.title || '',
            item.finalScore ??
              '',
          ]
        ),
      ];

      const csv =
        rows
          .map((row) =>
            row
              .map(
                (value) =>
                  `"${String(
                    value
                  ).replaceAll(
                    '"',
                    '""'
                  )}"`
              )
              .join(',')
          )
          .join('\n');

      const blob =
        new Blob(
          [csv],
          {
            type:
              'text/csv;charset=utf-8;',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          'a'
        );

      link.href = url;

      link.download =
        `${selected.title
          .replaceAll(
            ' ',
            '-'
          )
          .toLowerCase()}-results.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        url
      );
    };

  if (isNew) {
    return (
      <CompetitionForm
        onCancel={goList}
        onSave={
          handleCreate
        }
      />
    );
  }

  if (
    selected &&
    editing
  ) {
    return (
      <CompetitionForm
        initial={selected}
        onCancel={() =>
          setEditing(false)
        }
        onSave={
          handleUpdate
        }
      />
    );
  }

  if (
    selectedId &&
    selectedId !== 'new' &&
    loading &&
    !selected
  ) {
    return (
      <div className="tc-page">
        <div className="tc-empty">
          Loading competition...
        </div>
      </div>
    );
  }

  if (
    selectedId &&
    selectedId !== 'new' &&
    !loading &&
    !selected
  ) {
    return (
      <div className="tc-page">
        <button
          className="tc-back"
          onClick={goList}
        >
          <FiArrowLeft />
          Back to competitions
        </button>

        <div className="tc-empty">
          {error ||
            'Competition not found.'}
        </div>
      </div>
    );
  }

  if (selected) {
    const nav = (
      target
    ) =>
      navigate(
        `/trainer-dashboard/competitions/${selected.id}${
          target ===
          'overview'
            ? ''
            : `/${target}`
        }`
      );

    return (
      <div className="tc-page">
        <button
          className="tc-back"
          onClick={goList}
        >
          <FiArrowLeft />
          Back to competitions
        </button>

        <header className="tc-workspace-head">
          <div>
            <span
              className={`tc-phase is-${selected.phase}`}
            >
              {
                phaseLabels[
                  selected.phase
                ]
              }
            </span>

            <h1>
              {selected.title}
            </h1>

            <p>
              {selected.description}
            </p>
          </div>

          <div>
            <button
              className="tc-secondary"
              onClick={() =>
                setEditing(true)
              }
            >
              <FiEdit3 />
              Edit
            </button>

            {selected.status ===
            'draft' ? (
              <button
                className="tc-primary"
                onClick={() =>
                  updatePhase(
                    COMPETITION_PHASE.REGISTRATION_OPEN
                  )
                }
              >
                Publish
              </button>
            ) : (
              <button
                className="tc-danger-text"
                onClick={async () => {
                  if (
                    !window.confirm(
                      'Delete this competition?'
                    )
                  ) {
                    return;
                  }

                  try {
                    await trainerApi.deleteCompetition(
                      selected.id
                    );

                    await loadCompetitions();

                    goList();
                  } catch (
                    requestError
                  ) {
                    setError(
                      requestError.message
                    );
                  }
                }}
              >
                <FiTrash2 />
                Delete
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="tc-empty">
            {error}
          </div>
        )}

        <nav className="tc-workspace-tabs">
          {[
            [
              'overview',
              'Overview',
            ],
            [
              'registrations',
              `Registrations (${
                selected.registrations_count ??
                registrations.length
              })`,
            ],
            [
              'submissions',
              `Submissions (${
                selected.submissions_count ??
                submissions.length
              })`,
            ],
            [
              'results',
              'Results',
            ],
          ].map(
            ([id, label]) => (
              <button
                className={
                  section === id
                    ? 'active'
                    : ''
                }
                key={id}
                onClick={() =>
                  nav(id)
                }
              >
                {label}
              </button>
            )
          )}
        </nav>

        {section ===
          'overview' && (
          <div className="tc-workspace-grid">
            <main>
              <section className="tc-panel">
                <h2>
                  Competition details
                </h2>

                <p>
                  {selected.description ||
                    'No description was added.'}
                </p>

                <dl className="tc-detail-list">
                  <div>
                    <dt>
                      Participation
                    </dt>

                    <dd>
                      {
                        selected.participationType
                      }{' '}
                      · up to{' '}
                      {
                        selected.maxTeamMembers
                      }{' '}
                      members
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Registration
                    </dt>

                    <dd>
                      {formatDate(
                        selected.registrationOpenAt
                      )}{' '}
                      –{' '}
                      {formatDate(
                        selected.registrationCloseAt
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Submission period
                    </dt>

                    <dd>
                      {formatDate(
                        selected.submissionOpenAt
                      )}{' '}
                      –{' '}
                      {formatDate(
                        selected.submissionCloseAt
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Prize
                    </dt>

                    <dd>
                      {selected.prize ||
                        'Recognition award'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="tc-panel">
                <h2>
                  Requirements
                </h2>

                <ul>
                  {(
                    selected.requirements ||
                    []
                  ).map(
                    (
                      item,
                      index
                    ) => (
                      <li
                        key={`${item}-${index}`}
                      >
                        {item}
                      </li>
                    )
                  )}
                </ul>

                <h2>
                  Rules
                </h2>

                <ul>
                  {(
                    selected.rules ||
                    []
                  ).map(
                    (
                      item,
                      index
                    ) => (
                      <li
                        key={`${item}-${index}`}
                      >
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </section>
            </main>

            <aside>
              <section className="tc-panel">
                <h2>
                  Stage control
                </h2>

                <div className="tc-stage-actions">
                  <button
                    onClick={() =>
                      updatePhase(
                        COMPETITION_PHASE.REGISTRATION_OPEN
                      )
                    }
                  >
                    Open registration
                  </button>

                  <button
                    onClick={() =>
                      updatePhase(
                        COMPETITION_PHASE.REGISTRATION_CLOSED
                      )
                    }
                  >
                    Close registration
                  </button>

                  <button
                    onClick={() =>
                      updatePhase(
                        COMPETITION_PHASE.SUBMISSIONS_OPEN
                      )
                    }
                  >
                    Open submissions
                  </button>

                  <button
                    onClick={() =>
                      updatePhase(
                        COMPETITION_PHASE.JUDGING
                      )
                    }
                  >
                    Start judging
                  </button>

                  <button
                    onClick={
                      publishResults
                    }
                  >
                    Publish results
                  </button>

                  <button
                    onClick={() =>
                      updatePhase(
                        COMPETITION_PHASE.COMPLETED
                      )
                    }
                  >
                    Complete
                  </button>
                </div>
              </section>

              <section className="tc-panel">
                <h2>
                  Extend submission
                  deadline
                </h2>

                <input
                  type="datetime-local"
                  onChange={async (
                    e
                  ) => {
                    if (
                      !e.target
                        .value
                    ) {
                      return;
                    }

                    try {
                      const data =
                        await trainerApi.updateCompetition(
                          selected.id,
                          {
                            submission_deadline_at:
                              e
                                .target
                                .value,
                          }
                        );

                      setSelected(
                        normalizeCompetition(
                          data.competition
                        )
                      );

                      await loadCompetitions();
                    } catch (
                      requestError
                    ) {
                      setError(
                        requestError.message
                      );
                    }
                  }}
                />
              </section>
            </aside>
          </div>
        )}

        {section ===
          'registrations' && (
          <section className="tc-panel">
            <div className="tc-panel-head">
              <div>
                <h2>
                  Registration
                  requests
                </h2>

                <p>
                  Students cannot
                  submit work until
                  their request is
                  approved.
                </p>
              </div>
            </div>

            <div className="tc-table">
              <div className="tc-table-head">
                <span>
                  Participant
                </span>

                <span>
                  Type
                </span>

                <span>
                  Team
                </span>

                <span>
                  Status
                </span>

                <span>
                  Action
                </span>
              </div>

              {registrations.map(
                (item) => (
                  <article
                    key={
                      item.id
                    }
                  >
                    <span>
                      <b>
                        {
                          item.studentName
                        }
                      </b>

                      <small>
                        {
                          item.studentEmail
                        }
                      </small>
                    </span>

                    <span>
                      {item.type}
                    </span>

                    <span>
                      {item.members
                        ?.length ||
                        1}{' '}
                      member(s)
                    </span>

                    <span>
                      <i
                        className={`tc-request-status is-${item.status}`}
                      >
                        {
                          item.status
                        }
                      </i>
                    </span>

                    <span className="tc-row-actions">
                      {item.status ===
                        'pending' && (
                        <>
                          <button
                            onClick={() =>
                              approveRegistration(
                                item.id
                              )
                            }
                          >
                            <FiCheck />
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              rejectRegistration(
                                item.id
                              )
                            }
                          >
                            <FiX />
                            Reject
                          </button>
                        </>
                      )}
                    </span>
                  </article>
                )
              )}
            </div>

            {!registrations.length && (
              <div className="tc-empty">
                No registration
                requests yet.
              </div>
            )}
          </section>
        )}

        {section ===
          'submissions' && (
          <section className="tc-panel">
            <div className="tc-panel-head">
              <div>
                <h2>
                  Competition
                  submissions
                </h2>

                <p>
                  Review files,
                  provide feedback,
                  and calculate a
                  score from 100.
                </p>
              </div>
            </div>

            <div className="tc-submission-list">
              {submissions.map(
                (item) => {
                  const draft =
                    scoreDrafts[
                      item.id
                    ] ||
                    item.rubricScores ||
                    {};

                  return (
                    <article
                      key={
                        item.id
                      }
                    >
                      <div className="tc-submission-title">
                        <span>
                          <FiFileText />
                        </span>

                        <div>
                          <h3>
                            {
                              item.title
                            }
                          </h3>

                          <p>
                            {item.teamName ||
                              item.studentName}{' '}
                            ·{' '}
                            {
                              item.status
                            }
                          </p>
                        </div>

                        <strong>
                          {item.finalScore ??
                            0}
                          /100
                        </strong>
                      </div>

                      <div className="tc-rubric">
                        {(
                          selected.evaluationCriteria ||
                          []
                        ).map(
                          (
                            criterion
                          ) => (
                            <label
                              key={
                                criterion.id
                              }
                            >
                              {
                                criterion.title
                              }

                              <span>
                                <input
                                  type="number"
                                  min="0"
                                  max={
                                    criterion.weight
                                  }
                                  value={
                                    draft[
                                      criterion
                                        .id
                                    ] ??
                                    ''
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setScoreDrafts(
                                      (
                                        current
                                      ) => ({
                                        ...current,

                                        [item.id]:
                                          {
                                            ...draft,

                                            [criterion.id]:
                                              Math.min(
                                                Number(
                                                  criterion.weight
                                                ),
                                                Math.max(
                                                  0,
                                                  Number(
                                                    e
                                                      .target
                                                      .value
                                                  ) ||
                                                    0
                                                )
                                              ),
                                          },
                                      })
                                    )
                                  }
                                />{' '}
                                /{' '}
                                {
                                  criterion.weight
                                }
                              </span>
                            </label>
                          )
                        )}
                      </div>

                      <textarea
                        placeholder="Feedback for participant"
                        value={
                          feedbackDrafts[
                            item.id
                          ] ??
                          item.feedback ??
                          ''
                        }
                        onChange={(
                          e
                        ) =>
                          setFeedbackDrafts(
                            (
                              current
                            ) => ({
                              ...current,

                              [item.id]:
                                e
                                  .target
                                  .value,
                            })
                          )
                        }
                      />

                      <div className="tc-row-actions">
                        <button
                          onClick={() =>
                            saveSubmissionScore(
                              item,
                              draft
                            )
                          }
                        >
                          <FiStar />
                          Save score
                        </button>

                        <button
                          onClick={() =>
                            approveSubmission(
                              item
                            )
                          }
                        >
                          <FiCheck />
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            requestSubmissionChanges(
                              item
                            )
                          }
                        >
                          Request changes
                        </button>

                        <button
                          className="danger"
                          disabled
                          title="Submission deletion is not enabled in the current trainer API"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            {!submissions.length && (
              <div className="tc-empty">
                No submissions yet.
              </div>
            )}
          </section>
        )}

        {section ===
          'results' && (
          <section className="tc-panel">
            <div className="tc-panel-head">
              <div>
                <h2>
                  Ranking & results
                </h2>

                <p>
                  Ranking is
                  calculated
                  automatically from
                  final scores.
                </p>
              </div>

              <div>
                <button
                  className="tc-secondary"
                  onClick={
                    exportResults
                  }
                >
                  <FiDownload />
                  Export CSV
                </button>

                <button
                  className="tc-primary"
                  onClick={
                    publishResults
                  }
                >
                  Publish results
                </button>
              </div>
            </div>

            <div className="tc-ranking">
              {ranking.map(
                (item) => (
                  <article
                    key={
                      item.id ||
                      `${item.rank}-${item.studentName}`
                    }
                  >
                    <strong>
                      #{item.rank}
                    </strong>

                    <div>
                      <b>
                        {item.teamName ||
                          item.studentName}
                      </b>

                      <small>
                        {item.title ||
                          selected.title}
                      </small>
                    </div>

                    <span>
                      {
                        item.finalScore
                      }
                      /100
                    </span>
                  </article>
                )
              )}
            </div>

            {!ranking.length && (
              <div className="tc-empty">
                Score submissions
                to generate the
                ranking.
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="tc-page">
      <header className="tc-title">
        <div>
          <span>
            COMPETITION MANAGEMENT
          </span>

          <h1>
            Competitions
          </h1>

          <p>
            Publish competitions,
            review participants,
            and manage results.
          </p>
        </div>

        <button
          className="tc-primary"
          onClick={() =>
            navigate(
              '/trainer-dashboard/competitions/new'
            )
          }
        >
          <FiPlus />
          Create competition
        </button>
      </header>

      <div className="tc-toolbar">
        <nav className="tc-filter-tabs">
          {filters.map(
            ([id, label]) => (
              <button
                key={id}
                className={
                  filter === id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setFilter(id)
                }
              >
                {label}
              </button>
            )
          )}
        </nav>

        <div className="tc-toolbar-controls">
          <label>
            <FiSearch />

            <input
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value
                )
              }
              placeholder="Search competitions"
            />
          </label>

          <select
            className="tc-category-select"
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
          >
            <option value="all">
              All categories
            </option>

            {categories.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {error && (
        <div className="tc-empty">
          {error}
        </div>
      )}

      {loading ? (
        <div className="tc-empty">
          Loading competitions...
        </div>
      ) : (
        <div className="tc-list-layout">
          <main className="tc-panel">
            <h2>
              Competitions
            </h2>

            <div className="tc-competition-list">
              {filtered.map(
                (item) => {
                  const regs =
                    attention[
                      item.id
                    ]
                      ?.registrations ||
                    [];

                  const subs =
                    attention[
                      item.id
                    ]
                      ?.submissions ||
                    [];

                  return (
                    <article
                      key={
                        item.id
                      }
                      onClick={() =>
                        navigate(
                          `/trainer-dashboard/competitions/${item.id}`
                        )
                      }
                    >
                      <span className="tc-comp-icon">
                        <FiTarget />
                      </span>

                      <div className="tc-comp-main">
                        <div>
                          <h3>
                            {
                              item.title
                            }
                          </h3>

                          <i
                            className={`tc-phase is-${item.phase}`}
                          >
                            {
                              phaseLabels[
                                item
                                  .phase
                              ]
                            }
                          </i>
                        </div>

                        <p>
                          {
                            item.description
                          }
                        </p>

                        <footer>
                          <span>
                            <FiCalendar />

                            {item.phase ===
                            COMPETITION_PHASE.REGISTRATION_OPEN
                              ? 'Registration closes'
                              : item.phase ===
                                  COMPETITION_PHASE.SUBMISSIONS_OPEN
                                ? 'Submission closes'
                                : 'Results'}

                            <b>
                              {formatDate(
                                item.phase ===
                                  COMPETITION_PHASE.REGISTRATION_OPEN
                                  ? item.registrationCloseAt
                                  : item.submissionCloseAt
                              )}
                            </b>
                          </span>

                          <span>
                            <FiUsers />

                            {
                              item.participationType
                            }

                            <b>
                              Up to{' '}
                              {
                                item.maxTeamMembers
                              }{' '}
                              members
                            </b>
                          </span>

                          <span>
                            <FiFileText />

                            {item.phase ===
                            COMPETITION_PHASE.REGISTRATION_OPEN
                              ? regs.length
                              : subs.length}

                            <b>
                              {item.phase ===
                              COMPETITION_PHASE.REGISTRATION_OPEN
                                ? 'applications'
                                : 'submissions'}
                            </b>
                          </span>
                        </footer>
                      </div>

                      <button className="tc-manage">
                        {item.phase ===
                        COMPETITION_PHASE.COMPLETED
                          ? 'View results'
                          : 'Manage'}
                      </button>
                    </article>
                  );
                }
              )}

              {!filtered.length && (
                <div className="tc-empty">
                  No competitions
                  match these filters.
                </div>
              )}
            </div>
          </main>

          <aside>
            <section className="tc-panel tc-attention">
              <h2>
                Needs your attention
              </h2>

              <button
                disabled={
                  !firstPendingRegistrationCompetition
                }
                onClick={() =>
                  firstPendingRegistrationCompetition &&
                  navigate(
                    `/trainer-dashboard/competitions/${firstPendingRegistrationCompetition.id}/registrations`
                  )
                }
              >
                <FiUsers />

                <span>
                  <b>
                    {
                      pendingRegistrations.length
                    }{' '}
                    registration
                    requests
                  </b>

                  <small>
                    awaiting approval
                  </small>
                </span>
              </button>

              <button
                disabled={
                  !firstNewSubmissionCompetition
                }
                onClick={() =>
                  firstNewSubmissionCompetition &&
                  navigate(
                    `/trainer-dashboard/competitions/${firstNewSubmissionCompetition.id}/submissions`
                  )
                }
              >
                <FiFileText />

                <span>
                  <b>
                    {
                      newSubmissions.length
                    }{' '}
                    new submissions
                  </b>

                  <small>
                    ready to review
                  </small>
                </span>
              </button>

              <button
                disabled={
                  !firstPendingScoreCompetition
                }
                onClick={() =>
                  firstPendingScoreCompetition &&
                  navigate(
                    `/trainer-dashboard/competitions/${firstPendingScoreCompetition.id}/submissions`
                  )
                }
              >
                <FiStar />

                <span>
                  <b>
                    {
                      pendingScores.length
                    }{' '}
                    works awaiting
                    scores
                  </b>

                  <small>
                    need evaluation
                  </small>
                </span>
              </button>
            </section>

            {filtered[0] && (
              <section className="tc-panel tc-selected">
                <h2>
                  Selected competition
                </h2>

                <h3>
                  {
                    filtered[0]
                      .title
                  }
                </h3>

                <ol>
                  {[
                    [
                      'Registration',
                      filtered[0]
                        .registrationCloseAt,
                    ],
                    [
                      'Work period',
                      filtered[0]
                        .submissionOpenAt,
                    ],
                    [
                      'Submission deadline',
                      filtered[0]
                        .submissionCloseAt,
                    ],
                    [
                      'Results',
                      filtered[0]
                        .resultsAt,
                    ],
                  ].map(
                    ([
                      label,
                      date,
                    ]) => (
                      <li
                        key={
                          label
                        }
                      >
                        <i
                          className={
                            date &&
                            new Date(
                              date
                            ).getTime() <=
                              Date.now()
                              ? 'done'
                              : ''
                          }
                        />

                        {label}

                        <span>
                          {formatDate(
                            date
                          )}
                        </span>
                      </li>
                    )
                  )}
                </ol>

                <button
                  onClick={() =>
                    navigate(
                      `/trainer-dashboard/competitions/${filtered[0].id}`
                    )
                  }
                >
                  Open competition
                  workspace
                </button>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default TrainerCompetitions;