import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowRight,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiGithub,
  FiHeart,
  FiPlay,
  FiPlus,
  FiStar,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import ProjectWizard from './ProjectWizard';
import {
  getStudentProject,
  getStudentProjects,
  rateStudentProject,
  toggleStudentProjectLike,
} from './api/studentProjects';
import './StudentProjects.css';

const statusLabels = {
  draft: 'Draft',
  in_review: 'In review',
  revision_requested: 'Changes requested',
  published: 'Published',
  rejected: 'Rejected',
  hidden: 'Unpublished',
};

const statusClass = {
  draft: 'draft',
  in_review: 'pending-review',
  revision_requested: 'changes-requested',
  published: 'published',
  rejected: 'changes-requested',
  hidden: 'unpublished',
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function StudentProjects({ studentData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const isNew = path.endsWith('/projects/new');

  const editMatch = path.match(
    /\/projects\/([^/]+)\/edit$/
  );

  const detailMatch = path.match(
    /\/projects\/([^/]+)$/
  );

  const selectedId =
    editMatch?.[1] || detailMatch?.[1] || '';

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reactionSaving, setReactionSaving] =
    useState(false);

  const goList = () =>
    navigate('/student-dashboard/projects');

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getStudentProjects();

      setProjects(
        Array.isArray(data.projects)
          ? data.projects
          : []
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load projects.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      setError('');

      const data = await getStudentProject(
        projectId
      );

      setSelectedProject(data.project || null);
    } catch (requestError) {
      setSelectedProject(null);

      setError(
        requestError.message ||
          'Unable to load project.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isNew) {
      setSelectedProject(null);
      setLoading(false);
      return;
    }

    if (selectedId) {
      loadProject(selectedId);
      return;
    }

    setSelectedProject(null);
    loadProjects();
  }, [path]);

  const handleLike = async () => {
    if (
      !selectedProject ||
      selectedProject.status !== 'published'
    ) {
      return;
    }

    try {
      setReactionSaving(true);
      setError('');

      const data =
        await toggleStudentProjectLike(
          selectedProject.id
        );

      setSelectedProject((current) => ({
        ...current,
        reactions: {
          ...current.reactions,
          is_liked: data.is_liked,
          likes_count: data.likes_count,
        },
      }));
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to update project like.'
      );
    } finally {
      setReactionSaving(false);
    }
  };

  const handleRating = async (value) => {
    if (
      !selectedProject ||
      selectedProject.status !== 'published'
    ) {
      return;
    }

    try {
      setReactionSaving(true);
      setError('');

      const data = await rateStudentProject(
        selectedProject.id,
        value
      );

      setSelectedProject((current) => ({
        ...current,
        reactions: {
          ...current.reactions,
          my_rating: data.my_rating,
          rating_average:
            data.rating_average,
          rating_count: data.rating_count,
        },
      }));
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to rate this project.'
      );
    } finally {
      setReactionSaving(false);
    }
  };

  if (isNew) {
    return (
      <ProjectWizard
        studentData={studentData}
        initialProject={null}
        onClose={goList}
        onFinished={(id) =>
          navigate(
            `/student-dashboard/projects/${id}`
          )
        }
      />
    );
  }

  if (loading) {
    return (
      <div className="sp-empty">
        <h2>Loading projects...</h2>
      </div>
    );
  }

  if (editMatch) {
    if (
      !selectedProject ||
      !selectedProject.permissions?.is_owner ||
      !selectedProject.permissions?.can_edit
    ) {
      return (
        <div className="sp-empty">
          <h2>Editing is not available</h2>

          <p>
            This project cannot be edited right now.
          </p>

          <button onClick={goList}>
            Back to projects
          </button>
        </div>
      );
    }

    return (
      <ProjectWizard
        studentData={studentData}
        initialProject={selectedProject}
        onClose={goList}
        onFinished={(id) =>
          navigate(
            `/student-dashboard/projects/${id}`
          )
        }
      />
    );
  }

  if (detailMatch) {
    if (!selectedProject) {
      return (
        <div className="sp-empty">
          <h2>Project not found</h2>

          <p>
            {error ||
              'This project is not available to your account.'}
          </p>

          <button onClick={goList}>
            Back to projects
          </button>
        </div>
      );
    }

    const isOwner =
      Boolean(
        selectedProject.permissions?.is_owner
      );

    const team =
      selectedProject.members?.length
        ? selectedProject.members
        : [
            {
              name:
                selectedProject.owner?.name ||
                'Project owner',
              role: 'Project owner',
              specialty: '',
            },
          ];

    const media = selectedProject.media || {};
    const links = selectedProject.links || {};
    const reactions =
      selectedProject.reactions || {};
    const review =
      selectedProject.review || null;

    return (
      <div className="sp-page sp-detail-page">
        <button
          className="sp-back"
          onClick={goList}
        >
          <FiArrowLeft /> Back to my projects
        </button>

        {error && (
          <div className="sp-empty">
            <p>{error}</p>
          </div>
        )}

        <header className="sp-detail-header">
          <div className="sp-logo">
            {media.logo ? (
              <img src={media.logo} alt="" />
            ) : (
              <span>◇</span>
            )}
          </div>

          <div className="sp-detail-heading">
            <div>
              <h1>{selectedProject.title}</h1>

              <span
                className={`sp-status is-${
                  statusClass[
                    selectedProject.status
                  ] || 'draft'
                }`}
              >
                {statusLabels[
                  selectedProject.status
                ] || selectedProject.status}
              </span>
            </div>

            <p>
              {selectedProject.idea ||
                selectedProject.description}
            </p>
          </div>

          {isOwner &&
            selectedProject.permissions
              ?.can_edit && (
              <button
                className="sp-outline-btn"
                onClick={() =>
                  navigate(
                    `/student-dashboard/projects/${selectedProject.id}/edit`
                  )
                }
              >
                <FiEdit3 /> Edit project
              </button>
            )}
        </header>

        <div className="sp-detail-layout">
          <main>
            <section className="sp-panel">
              <h2>About the project</h2>

              <article>
                <h3>Project idea</h3>

                <p>
                  {selectedProject.idea ||
                    selectedProject.description ||
                    'No project idea provided.'}
                </p>
              </article>

              <article>
                <h3>Problem</h3>

                <p>
                  {selectedProject.problem ||
                    'No problem statement provided.'}
                </p>
              </article>

              <article>
                <h3>Solution</h3>

                <p>
                  {selectedProject.solution ||
                    selectedProject.description ||
                    'No solution statement provided.'}
                </p>
              </article>
            </section>

            <section className="sp-panel">
              <h2>Project media</h2>

              <div className="sp-media-cover">
                {media.cover_image ? (
                  <img
                    src={media.cover_image}
                    alt={`${selectedProject.title} cover`}
                  />
                ) : (
                  <div className="sp-cover-art">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>

              {media.intro_video && (
                <a
                  className="sp-video-row"
                  href={media.intro_video}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiPlay />

                  <b>Project introduction</b>

                  <span>
                    Watch video <FiExternalLink />
                  </span>
                </a>
              )}
            </section>

            <section className="sp-panel">
              <h2>Files & links</h2>

              {links.github && (
                <a
                  className="sp-file-row"
                  href={links.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiGithub />

                  <span>GitHub repository</span>

                  <b>
                    Open <FiExternalLink />
                  </b>
                </a>
              )}

              {links.demo && (
                <a
                  className="sp-file-row"
                  href={links.demo}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiExternalLink />

                  <span>Live project</span>

                  <b>
                    Open <FiExternalLink />
                  </b>
                </a>
              )}

              {media.presentation_file && (
                <a
                  className="sp-file-row"
                  href={media.presentation_file}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiFileText />

                  <span>Presentation file</span>

                  <b>
                    Open <FiExternalLink />
                  </b>
                </a>
              )}

              {media.documentation_file && (
                <a
                  className="sp-file-row"
                  href={media.documentation_file}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiFileText />

                  <span>Documentation / SRS</span>

                  <b>
                    Open <FiExternalLink />
                  </b>
                </a>
              )}

              {!links.github &&
                !links.demo &&
                !media.presentation_file &&
                !media.documentation_file && (
                  <p className="sp-muted">
                    No files or links were added.
                  </p>
                )}
            </section>
          </main>

          <aside>
            <section className="sp-panel">
              <h2>Project team</h2>

              {team.map((member) => (
                <div
                  className="sp-member"
                  key={
                    member.id ||
                    `${member.name}-${member.role}`
                  }
                >
                  <span>
                    {initials(member.name)}
                  </span>

                  <div>
                    <b>{member.name}</b>

                    <small>
                      {member.role ||
                        'Team member'}

                      {member.specialty
                        ? ` · ${member.specialty}`
                        : ''}
                    </small>
                  </div>
                </div>
              ))}
            </section>

            <section className="sp-panel sp-meta">
              <h2>Project details</h2>

              <dl>
                <div>
                  <dt>Course</dt>

                  <dd>
                    {selectedProject.course
                      ?.title ||
                      'Independent project'}
                  </dd>
                </div>

                <div>
                  <dt>Category</dt>

                  <dd>
                    {selectedProject.category
                      ?.name || 'Not selected'}
                  </dd>
                </div>

                <div>
                  <dt>Created</dt>

                  <dd>
                    {selectedProject.created_at
                      ? new Date(
                          selectedProject.created_at
                        ).toLocaleDateString()
                      : '-'}
                  </dd>
                </div>

                <div>
                  <dt>Last updated</dt>

                  <dd>
                    {selectedProject.updated_at
                      ? new Date(
                          selectedProject.updated_at
                        ).toLocaleDateString()
                      : '-'}
                  </dd>
                </div>
              </dl>

              <h3>Technology</h3>

              <div className="sp-tags">
                {selectedProject.technologies?.map(
                  (tag) => (
                    <span key={tag}>{tag}</span>
                  )
                )}
              </div>
            </section>

            {selectedProject.status ===
              'published' && (
              <section className="sp-panel sp-reactions">
                <h2>Rate this project</h2>

                <div className="sp-stars">
                  {[1, 2, 3, 4, 5].map(
                    (value) => (
                      <button
                        key={value}
                        className={
                          value <=
                          Number(
                            reactions.my_rating ||
                              0
                          )
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          handleRating(value)
                        }
                        disabled={reactionSaving}
                        aria-label={`Rate ${value} stars`}
                      >
                        <FiStar />
                      </button>
                    )
                  )}
                </div>

                <small>
                  {reactions.rating_count
                    ? `${Number(
                        reactions.rating_average ||
                          0
                      ).toFixed(
                        1
                      )} average from ${
                        reactions.rating_count
                      } rating(s)`
                    : 'Be the first to rate this project'}
                </small>

                <button
                  className={`sp-like ${
                    reactions.is_liked
                      ? 'active'
                      : ''
                  }`}
                  onClick={handleLike}
                  disabled={reactionSaving}
                >
                  <FiHeart />{' '}

                  {reactions.is_liked
                    ? 'Liked'
                    : 'Like project'}

                  {Number(
                    reactions.likes_count || 0
                  ) > 0
                    ? ` (${reactions.likes_count})`
                    : ''}
                </button>
              </section>
            )}

            <section
              className={`sp-review-box is-${
                statusClass[
                  selectedProject.status
                ] || 'draft'
              }`}
            >
              <h2>Review status</h2>

              <p>
                {selectedProject.status ===
                'published'
                  ? 'This project was approved and published by the trainer.'
                  : selectedProject.status ===
                      'revision_requested'
                    ? review?.feedback ||
                      'The trainer requested changes before publishing.'
                    : selectedProject.status ===
                        'draft'
                      ? 'This draft is visible only to its owner.'
                      : selectedProject.status ===
                          'rejected'
                        ? review?.feedback ||
                          'The trainer rejected this project.'
                        : 'The project is being reviewed by the trainer.'}
              </p>

              {selectedProject
                .submitted_for_review_at && (
                <small>
                  Submitted{' '}
                  {new Date(
                    selectedProject.submitted_for_review_at
                  ).toLocaleDateString()}
                </small>
              )}
            </section>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      <header className="sp-list-header">
        <div>
          <h1>My projects</h1>

          <p>
            Manage your projects, explore published
            student work, and follow trainer
            feedback.
          </p>
        </div>

        <button
          className="sp-primary-btn"
          onClick={() =>
            navigate(
              '/student-dashboard/projects/new'
            )
          }
        >
          <FiPlus /> Add project
        </button>
      </header>

      {error && (
        <div className="sp-empty">
          <h2>Unable to load projects</h2>
          <p>{error}</p>

          <button onClick={loadProjects}>
            Try again
          </button>
        </div>
      )}

      {!error && projects.length > 0 && (
        <div className="sp-grid">
          {projects.map((project, index) => {
            const isOwner =
              Boolean(
                project.permissions?.is_owner
              );

            const action =
              isOwner &&
              project.permissions?.can_edit
                ? 'Continue editing'
                : 'Open project';

            const teamNames =
              project.members
                ?.map((member) => member.name)
                .filter(Boolean)
                .join(', ') ||
              project.owner?.name ||
              'Student project';

            return (
              <article
                className={`sp-card theme-${
                  index % 4
                }`}
                key={project.id}
                onClick={() =>
                  navigate(
                    `/student-dashboard/projects/${project.id}`
                  )
                }
              >
                <div className="sp-card-cover">
                  {project.media?.cover_image ? (
                    <img
                      src={
                        project.media.cover_image
                      }
                      alt=""
                    />
                  ) : (
                    <div className="sp-card-illustration">
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                </div>

                <div className="sp-card-body">
                  <h2>{project.title}</h2>

                  <p>
                    {project.idea ||
                      project.description}
                  </p>

                  <div className="sp-tags">
                    {project.technologies
                      ?.slice(0, 3)
                      .map((tag) => (
                        <span key={tag}>
                          {tag}
                        </span>
                      ))}
                  </div>

                  <div className="sp-card-meta">
                    <span>
                      {project.project_type ===
                      'team' ? (
                        <FiUsers />
                      ) : (
                        <FiUser />
                      )}

                      {teamNames}
                    </span>

                    <i
                      className={`sp-status is-${
                        statusClass[
                          project.status
                        ] || 'draft'
                      }`}
                    >
                      {statusLabels[
                        project.status
                      ] || project.status}
                    </i>
                  </div>

                  <button>
                    {action} <FiArrowRight />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!error && projects.length === 0 && (
        <div className="sp-empty">
          <h2>No projects yet</h2>

          <p>
            Create your first project or explore
            published student work.
          </p>

          <button
            onClick={() =>
              navigate(
                '/student-dashboard/projects/new'
              )
            }
          >
            Add project
          </button>
        </div>
      )}
    </div>
  );
}

export default StudentProjects;