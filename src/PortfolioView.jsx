import { useState } from 'react';
import {
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCode,
  FiCopy,
  FiExternalLink,
  FiGithub,
  FiGlobe,
  FiGrid,
  FiMail,
  FiMapPin,
  FiPlus,
  FiPrinter,
  FiShare2,
  FiStar,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import './Achievements.css';

const EMPTY_CREDENTIAL = {
  title: '',
  issuer: '',
  issue_date: '',
  credential_id: '',
  credential_url: '',
  description: '',
  file: null,
};

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const formatDate = (value) => {
  if (!value) {
    return 'Not specified';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

const formatEducation = (education) => {
  if (!education) {
    return {
      degree: 'Education information not added yet',
      university: 'University not specified',
      meta: 'Academic details will appear here',
    };
  }

  const degree = [
    education.degree,
    education.major
      ? `in ${education.major}`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const graduation = education.expected_graduation_date
    ? formatDate(
        education.expected_graduation_date
      )
    : 'Not specified';

  return {
    degree:
      degree ||
      education.major ||
      'Current student',
    university:
      education.university ||
      'University not specified',
    meta: `Academic year ${
      education.academic_year || 'Not specified'
    } · Expected graduation: ${graduation}`,
  };
};

const initials = (name = 'Student') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const openExternal = (url) => {
  if (!url) {
    return;
  }

  try {
    const parsed = new URL(
      url,
      window.location.origin
    );

    if (
      ['http:', 'https:'].includes(
        parsed.protocol
      )
    ) {
      window.open(
        parsed.href,
        '_blank',
        'noopener,noreferrer'
      );
    }
  } catch {
    return;
  }
};

function SectionTitle({
  icon: Icon,
  title,
  action,
}) {
  return (
    <div className="portfolio-section-heading">
      <div>
        <Icon />
        <h2>{title}</h2>
      </div>

      {action}
    </div>
  );
}

function CredentialModal({
  onClose,
  onSubmit,
  saving,
  error,
}) {
  const [form, setForm] = useState(
    EMPTY_CREDENTIAL
  );

  const submit = (event) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.issuer.trim() ||
      !form.credential_url.trim()
    ) {
      return;
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      issuer: form.issuer.trim(),
      credential_id:
        form.credential_id.trim(),
      credential_url:
        form.credential_url.trim(),
      description: form.description.trim(),
    });
  };

  return (
    <div
      className="portfolio-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <form
        className="portfolio-modal"
        onSubmit={submit}
      >
        <button
          className="portfolio-modal-close"
          type="button"
          onClick={onClose}
          disabled={saving}
        >
          <FiX />
        </button>

        <span className="portfolio-modal-kicker">
          Personal credential
        </span>

        <h2>Add external certificate</h2>

        <p>
          Student-added credentials remain
          unverified until approved by the
          platform.
        </p>

        <label>
          Certificate title
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

        <div className="portfolio-form-grid">
          <label>
            Issuer
            <input
              value={form.issuer}
              onChange={(event) =>
                setForm({
                  ...form,
                  issuer: event.target.value,
                })
              }
              required
              disabled={saving}
            />
          </label>

          <label>
            Issue date
            <input
              type="date"
              value={form.issue_date}
              onChange={(event) =>
                setForm({
                  ...form,
                  issue_date:
                    event.target.value,
                })
              }
              disabled={saving}
            />
          </label>
        </div>

        <label>
          Credential ID
          <input
            value={form.credential_id}
            onChange={(event) =>
              setForm({
                ...form,
                credential_id:
                  event.target.value,
              })
            }
            disabled={saving}
          />
        </label>

        <label>
          Credential URL
          <input
            type="url"
            placeholder="https://..."
            value={form.credential_url}
            onChange={(event) =>
              setForm({
                ...form,
                credential_url:
                  event.target.value,
              })
            }
            required
            disabled={saving}
          />
        </label>

        <label>
          Certificate file
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(event) =>
              setForm({
                ...form,
                file:
                  event.target.files?.[0] ||
                  null,
              })
            }
            disabled={saving}
          />
        </label>

        <label>
          Description
          <textarea
            rows="3"
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

        {error && (
          <span className="portfolio-form-error">
            {error}
          </span>
        )}

        <button
          className="portfolio-modal-primary"
          type="submit"
          disabled={saving}
        >
          <FiPlus />
          {saving
            ? 'Adding...'
            : 'Add certificate'}
        </button>
      </form>
    </div>
  );
}

function PortfolioView({
  portfolio,
  isPublic = false,
  onAddCredential,
  onDeleteCredential,
  credentialSaving = false,
  actionError = '',
}) {
  const [activeView, setActiveView] =
    useState('overview');
  const [showCredentialForm, setShowCredentialForm] =
    useState(false);
  const [notice, setNotice] = useState('');

  const identity = portfolio?.identity || {};
  const education = formatEducation(
    identity.education
  );
  const projects = safeArray(
    portfolio?.projects
  );
  const completedCourses = safeArray(
    portfolio?.completed_courses
  );
  const trainingPrograms = safeArray(
    portfolio?.training_programs
  );
  const evaluations = safeArray(
    portfolio?.mentor_evaluations
  );
  const certificates = safeArray(
    portfolio?.certificates
  );
  const credentials = safeArray(
    portfolio?.credentials
  );
  const competitions = safeArray(
    portfolio?.competitions
  );
  const badges = safeArray(portfolio?.badges);
  const skills = portfolio?.skills || {
    development: [],
    design: [],
    professional: [],
  };
  const allCredentials = [
    ...certificates,
    ...credentials,
  ];
  const stats = portfolio?.stats || {};
  const profileCompleteness =
    Number(portfolio?.profile_completeness) || 0;
  const portfolioCode =
    portfolio?.portfolio_code || '';

  const publicUrl = `${window.location.origin}/portfolio/${encodeURIComponent(
    portfolioCode
  )}`;

  const copyPortfolioLink = async () => {
    try {
      await navigator.clipboard.writeText(
        publicUrl
      );
      setNotice('Portfolio link copied.');
    } catch {
      setNotice('Copy was blocked.');
    }
  };

  const copyPortfolioId = async () => {
    try {
      await navigator.clipboard.writeText(
        portfolioCode
      );
      setNotice('Portfolio ID copied.');
    } catch {
      setNotice('Copy was blocked.');
    }
  };

  const submitCredential = async (payload) => {
    try {
      await onAddCredential(payload);
      setShowCredentialForm(false);
      setNotice(
        'Certificate added to your portfolio.'
      );
    } catch {
      return;
    }
  };

  const deleteCredential = async (
    credentialId
  ) => {
    try {
      await onDeleteCredential(
        credentialId
      );
      setNotice('Certificate deleted.');
    } catch {
      return;
    }
  };

  const hasAnySkills =
    safeArray(skills.development).length +
      safeArray(skills.design).length +
      safeArray(skills.professional).length >
    0;

  return (
    <main className="career-portfolio" dir="ltr">
      <header className="portfolio-page-header">
        <div>
          <span>
            Verified career portfolio
          </span>

          <h1>
            {identity.name || 'Student'}’s
            professional profile
          </h1>

          <p>
            A verified record of learning,
            projects, skills, and achievements.
          </p>
        </div>

        <div className="portfolio-header-actions">
          <button
            type="button"
            onClick={copyPortfolioLink}
          >
            <FiShare2 /> Share
          </button>

          <button
            type="button"
            className="primary"
            onClick={() => window.print()}
          >
            <FiPrinter /> Print / Save PDF
          </button>
        </div>
      </header>

      {notice && (
        <button
          className="portfolio-notice"
          type="button"
          onClick={() => setNotice('')}
        >
          <FiCheckCircle />
          {notice}
          <FiX />
        </button>
      )}

      <section className="portfolio-identity-card">
        {identity.avatar ? (
          <img
            src={identity.avatar}
            alt={identity.name || 'Student'}
          />
        ) : (
          <div
            className="evaluation-avatar"
            style={{
              width: 120,
              height: 120,
              fontSize: 28,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 14,
            }}
          >
            {initials(identity.name)}
          </div>
        )}

        <div className="portfolio-identity-copy">
          <div className="portfolio-name-line">
            <h2>
              {identity.name || 'Student'}
            </h2>

            {identity.is_verified && (
              <span>
                <FiCheckCircle />
                Verified account
              </span>
            )}
          </div>

          <p>
            <FiBookOpen />
            {identity.education?.major ||
              identity.education?.degree ||
              'Student'}
          </p>

          <p>
            <FiGlobe />
            {identity.education?.university ||
              'University not specified'}
          </p>

          <p>
            <FiBriefcase />
            {identity.education?.faculty ||
              identity.education?.department ||
              'Academic profile'}
          </p>

          <div className="portfolio-meta-line">
            <span>
              <FiCalendar />
              Academic year:{' '}
              {identity.education
                ?.academic_year ||
                'Not specified'}
            </span>

            <span>
              <FiMapPin />
              {identity.education?.location ||
                'Location not specified'}
            </span>

            <span>
              <FiMail />
              {identity.email}
            </span>
          </div>
        </div>

        <div className="portfolio-score">
          <div
            style={{
              '--score': `${
                profileCompleteness * 3.6
              }deg`,
            }}
          >
            <strong>
              {profileCompleteness}%
            </strong>
          </div>

          <span>Profile completeness</span>

          <small>
            Portfolio ID: {portfolioCode}
          </small>
        </div>
      </section>

      <nav
        className="portfolio-tabs"
        aria-label="Portfolio sections"
      >
        {[
          ['overview', FiGrid, 'Overview'],
          ['projects', FiBriefcase, 'Projects'],
          ['learning', FiBookOpen, 'Learning'],
          ['credentials', FiAward, 'Credentials'],
        ].map(([id, Icon, label]) => (
          <button
            key={id}
            className={
              activeView === id ? 'active' : ''
            }
            type="button"
            onClick={() => setActiveView(id)}
          >
            <Icon /> {label}
          </button>
        ))}
      </nav>

      <div className="portfolio-layout">
        <div className="portfolio-main-column">
          {activeView === 'overview' && (
            <section className="portfolio-summary">
              <SectionTitle
                icon={FiUser}
                title="Professional summary"
              />

              <p>
                {identity.professional_summary ||
                  'Professional summary not added yet.'}
              </p>
            </section>
          )}

          {(activeView === 'overview' ||
            activeView === 'projects') && (
            <section id="portfolio-projects">
              <SectionTitle
                icon={FiBriefcase}
                title={
                  activeView === 'overview'
                    ? 'Featured projects'
                    : 'Published projects'
                }
                action={
                  <span className="platform-source">
                    Platform verified only
                  </span>
                }
              />

              {projects.length ? (
                <div className="portfolio-project-list">
                  {projects.map(
                    (project, index) => (
                      <article
                        className="portfolio-project"
                        key={project.id}
                      >
                        {project.cover_image ? (
                          <img
                            className={`portfolio-project-preview variant-${
                              (index % 3) + 1
                            }`}
                            src={project.cover_image}
                            alt={project.title}
                            style={{
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            className={`portfolio-project-preview variant-${
                              (index % 3) + 1
                            }`}
                          >
                            <FiCode />
                            <span>
                              {project.category ||
                                'Project'}
                            </span>
                          </div>
                        )}

                        <div className="portfolio-project-body">
                          <h3>
                            {project.title}
                          </h3>

                          <p>
                            {project.description}
                          </p>

                          <div className="portfolio-chip-row">
                            {safeArray(
                              project.technologies
                            ).map((tech) => (
                              <span key={tech}>
                                {tech}
                              </span>
                            ))}
                          </div>

                          <div className="portfolio-project-footer">
                            <span>
                              <FiUsers />
                              Team of{' '}
                              {project.team_count ||
                                1}
                            </span>

                            {project.links
                              ?.github && (
                              <button
                                type="button"
                                onClick={() =>
                                  openExternal(
                                    project.links
                                      .github
                                  )
                                }
                              >
                                <FiGithub />
                                GitHub
                                <FiExternalLink />
                              </button>
                            )}

                            {project.links?.demo && (
                              <button
                                type="button"
                                onClick={() =>
                                  openExternal(
                                    project.links
                                      .demo
                                  )
                                }
                              >
                                <FiGlobe />
                                Live demo
                                <FiExternalLink />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="portfolio-empty">
                  <FiBriefcase />
                  <div>
                    <h3>
                      No published projects yet
                    </h3>
                    <p>
                      Published platform projects
                      will appear here.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {(activeView === 'overview' ||
            activeView === 'learning') && (
            <section id="portfolio-learning">
              <SectionTitle
                icon={FiBookOpen}
                title="Learning & training"
              />

              <div className="portfolio-learning-grid">
                <div>
                  <h3>Completed courses</h3>

                  {completedCourses.length ? (
                    completedCourses.map(
                      (course) => (
                        <div
                          className="portfolio-record-row"
                          key={course.id}
                        >
                          <FiCheckCircle />

                          <span>
                            <strong>
                              {course.title}
                            </strong>

                            <small>
                              {course.instructor ||
                                'Compass Academy'}
                            </small>
                          </span>

                          <time>100%</time>
                        </div>
                      )
                    )
                  ) : (
                    <p className="portfolio-muted">
                      Courses appear after
                      completion.
                    </p>
                  )}
                </div>

                <div>
                  <h3>
                    Verified training programs
                  </h3>

                  {trainingPrograms.length ? (
                    trainingPrograms.map(
                      (training) => (
                        <div
                          className="portfolio-record-row"
                          key={training.id}
                        >
                          <FiCheckCircle />

                          <span>
                            <strong>
                              {training.title}
                            </strong>

                            <small>
                              {training.provider}
                            </small>
                          </span>

                          <time>
                            {training.hours || 0}{' '}
                            hours
                          </time>
                        </div>
                      )
                    )
                  ) : (
                    <p className="portfolio-muted">
                      No verified training
                      programs yet.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {(activeView === 'overview' ||
            activeView === 'credentials') && (
            <section id="portfolio-evaluations">
              <SectionTitle
                icon={FiStar}
                title="Verified mentor evaluations"
                action={
                  <strong className="portfolio-average">
                    {stats.mentor_evaluation_average ||
                      0}
                    /100 average
                  </strong>
                }
              />

              {evaluations.length ? (
                <div className="portfolio-evaluation-grid">
                  {evaluations.map(
                    (evaluation) => (
                      <article
                        key={evaluation.id}
                      >
                        <div className="evaluation-avatar">
                          {initials(
                            evaluation.mentor
                          )}
                        </div>

                        <div>
                          <h3>
                            {evaluation.mentor}{' '}
                            <span>
                              <FiCheckCircle />
                              Verified
                            </span>
                          </h3>

                          <small>
                            {evaluation.title}
                          </small>

                          <p>
                            {evaluation.note}
                          </p>
                        </div>

                        <strong>
                          {evaluation.score}
                          <small>/100</small>
                        </strong>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="portfolio-empty">
                  <FiStar />
                  <div>
                    <h3>
                      No mentor evaluations yet
                    </h3>
                    <p>
                      Verified trainer evaluations
                      will appear here.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="portfolio-side-column">
          <section>
            <SectionTitle
              icon={FiAward}
              title="Badges"
              action={
                <span className="platform-source">
                  {stats.badges_earned || 0}/
                  {stats.badges_total ||
                    badges.length}{' '}
                  earned
                </span>
              }
            />

            <div className="portfolio-badge-grid">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`portfolio-badge tier-${
                    badge.tier || 'bronze'
                  } ${
                    badge.earned
                      ? 'earned'
                      : 'locked'
                  }`}
                  title={badge.description}
                >
                  <span>
                    {badge.icon || '🏅'}
                  </span>

                  <strong>
                    {badge.name}
                  </strong>
                </div>
              ))}
            </div>

            {!badges.length && (
              <p className="portfolio-muted">
                Badges will appear here.
              </p>
            )}
          </section>

          <section>
            <SectionTitle
              icon={FiCode}
              title="Skills"
            />

            {hasAnySkills ? (
              Object.entries(skills)
                .filter(
                  ([, items]) =>
                    safeArray(items).length > 0
                )
                .map(([group, items]) => (
                  <div
                    className="portfolio-skill-group"
                    key={group}
                  >
                    <h3>{group}</h3>

                    <div className="portfolio-chip-row">
                      {safeArray(items).map(
                        (skill) => (
                          <span key={skill}>
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <p className="portfolio-muted">
                No skills added yet.
              </p>
            )}
          </section>

          <section id="portfolio-certificates">
            <SectionTitle
              icon={FiAward}
              title="Certificates & credentials"
              action={
                !isPublic ? (
                  <button
                    className="portfolio-add-button"
                    type="button"
                    onClick={() =>
                      setShowCredentialForm(true)
                    }
                  >
                    <FiPlus />
                    Add certificate
                  </button>
                ) : null
              }
            />

            {allCredentials.length ? (
              allCredentials.map(
                (credential) => (
                  <article
                    className="portfolio-credential"
                    key={`${credential.platform ? 'p' : 'e'}-${credential.id}`}
                  >
                    <div>
                      <FiAward />
                    </div>

                    <span>
                      <strong>
                        {credential.title}
                      </strong>

                      <small>
                        {credential.issuer} ·{' '}
                        {formatDate(
                          credential.issued_at
                        )}
                      </small>

                      <p>
                        {credential.description}
                      </p>

                      {credential.is_verified && (
                        <em>
                          <FiCheckCircle />
                          Platform verified
                        </em>
                      )}
                    </span>

                    <div className="credential-actions">
                      {credential.credential_url && (
                        <button
                          type="button"
                          onClick={() =>
                            openExternal(
                              credential.credential_url
                            )
                          }
                        >
                          <FiExternalLink />
                        </button>
                      )}

                      {credential.file_url && (
                        <button
                          type="button"
                          onClick={() =>
                            openExternal(
                              credential.file_url
                            )
                          }
                        >
                          <FiGlobe />
                        </button>
                      )}

                      {!isPublic &&
                        !credential.platform &&
                        !credential.is_verified && (
                          <button
                            className="danger"
                            type="button"
                            aria-label="Delete certificate"
                            disabled={
                              credentialSaving
                            }
                            onClick={() =>
                              deleteCredential(
                                credential.id
                              )
                            }
                          >
                            <FiTrash2 />
                          </button>
                        )}
                    </div>
                  </article>
                )
              )
            ) : (
              <p className="portfolio-muted">
                No certificates added yet.
              </p>
            )}
          </section>

          <section>
            <SectionTitle
              icon={FiAward}
              title="Competitions"
            />

            {competitions.length ? (
              competitions.map(
                (competition) => (
                  <div
                    className="portfolio-competition"
                    key={competition.id}
                  >
                    <span>
                      <strong>
                        {competition.title}
                      </strong>

                      <small>
                        {competition.organizer}
                      </small>
                    </span>

                    <b>
                      {competition.result}
                    </b>

                    {competition.verified ? (
                      <em>
                        <FiCheckCircle />
                        Verified
                      </em>
                    ) : (
                      <em className="pending">
                        Pending completion
                      </em>
                    )}
                  </div>
                )
              )
            ) : (
              <p className="portfolio-muted">
                Competition participation will
                appear here.
              </p>
            )}
          </section>

          <section>
            <SectionTitle
              icon={FiBookOpen}
              title="Education"
            />

            <div className="portfolio-education">
              <strong>{education.degree}</strong>
              <span>
                {education.university}
              </span>
              <small>{education.meta}</small>
            </div>
          </section>
        </aside>
      </div>

      <footer className="portfolio-verification">
        <span className="portfolio-verification-badge">
          <FiCheckCircle />
        </span>

        <div>
          <h2>
            Compass Academy verified portfolio
          </h2>

          <p>
            Platform projects, courses,
            evaluations, training records, and
            verified credentials are backed by
            Compass Academy records.
          </p>
        </div>

        <button
          type="button"
          className="portfolio-verification-id"
          onClick={copyPortfolioId}
        >
          <span>Portfolio ID</span>

          <strong>
            {portfolioCode} <FiCopy />
          </strong>
        </button>
      </footer>

      {showCredentialForm && !isPublic && (
        <CredentialModal
          onClose={() =>
            setShowCredentialForm(false)
          }
          onSubmit={submitCredential}
          saving={credentialSaving}
          error={actionError}
        />
      )}
    </main>
  );
}

export default PortfolioView;
