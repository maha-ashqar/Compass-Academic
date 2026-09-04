import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiArrowLeft,
  FiFileText,
  FiGithub,
  FiImage,
  FiLink,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiVideo,
  FiX,
} from 'react-icons/fi';
import {
  createStudentProject,
  deleteStudentProject,
  deleteStudentProjectMedia,
  getStudentProjectMeta,
  submitStudentProject,
  updateStudentProject,
  uploadStudentProjectMedia,
} from './api/studentProjects';

const blankMember = {
  name: '',
  role: '',
  specialty: '',
};

const makeAsset = (url = '') => ({
  url,
  file: null,
  name: url ? 'Current file' : '',
  previewUrl: '',
});

const initialForm = (student, project) => ({
  id: project?.id || '',
  title: project?.title || '',
  courseId: project?.course?.id
    ? String(project.course.id)
    : '',
  categoryId: project?.category?.id
    ? String(project.category.id)
    : '',
  projectType:
    project?.project_type || 'individual',
  idea:
    project?.idea ||
    project?.description ||
    '',
  description: project?.description || '',
  problem: project?.problem || '',
  solution: project?.solution || '',
  techStackText:
    project?.technologies?.join(', ') || '',
  studentName:
    project?.owner?.name ||
    student?.displayName ||
    student?.fullName ||
    'Student',
  team:
    project?.members
      ?.filter(
        (member) =>
          member.membership_role !== 'owner'
      )
      .map((member) => ({
        id: member.id,
        name: member.name || '',
        role: member.role || '',
        specialty: member.specialty || '',
      })) || [],
  links: {
    github: project?.links?.github || '',
    demo: project?.links?.demo || '',
  },
  media: {
    cover: makeAsset(
      project?.media?.cover_image || ''
    ),
    logo: makeAsset(
      project?.media?.logo || ''
    ),
    video: makeAsset(
      project?.media?.intro_video || ''
    ),
    presentation: makeAsset(
      project?.media?.presentation_file || ''
    ),
    documentation: makeAsset(
      project?.media?.documentation_file || ''
    ),
  },
});

const mediaApiNames = {
  cover: 'cover_image',
  logo: 'logo',
  video: 'intro_video',
  presentation: 'presentation_file',
  documentation: 'documentation_file',
};

function ProjectWizard({
  studentData,
  initialProject,
  onClose,
  onFinished,
}) {
  const [form, setForm] = useState(() =>
    initialForm(studentData, initialProject)
  );
  const [member, setMember] =
    useState(blankMember);
  const [categories, setCategories] =
    useState([]);
  const [courses, setCourses] = useState([]);
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState({});
  const [projectId, setProjectId] = useState(
    initialProject?.id || ''
  );
  const [saving, setSaving] = useState(false);
  const projectIdRef = useRef(
    initialProject?.id || ''
  );
  const autoSavingRef = useRef(false);
  const mountedRef = useRef(false);

  const update = (key, value) =>
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

  const updateLink = (key, value) =>
    setForm((current) => ({
      ...current,
      links: {
        ...current.links,
        [key]: value,
      },
    }));

  const payload = useMemo(
    () => ({
      title: form.title.trim(),
      course_id: form.courseId
        ? Number(form.courseId)
        : null,
      category_id: form.categoryId
        ? Number(form.categoryId)
        : null,
      project_type: form.projectType,
      idea: form.idea.trim() || null,
      description:
        form.description.trim() ||
        form.idea.trim() ||
        null,
      problem: form.problem.trim() || null,
      solution: form.solution.trim() || null,
      github_url:
        form.links.github.trim() || null,
      live_url: form.links.demo.trim() || null,
      technologies: form.techStackText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      members:
        form.projectType === 'team'
          ? form.team.map((item) => ({
              name: item.name.trim(),
              role: item.role.trim() || null,
              specialty:
                item.specialty.trim() || null,
            }))
          : [],
    }),
    [form]
  );

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const data =
          await getStudentProjectMeta();

        setCategories(
          Array.isArray(data.categories)
            ? data.categories
            : []
        );

        setCourses(
          Array.isArray(data.courses)
            ? data.courses
            : []
        );
      } catch (requestError) {
        setNotice(
          requestError.message ||
            'Unable to load project options.'
        );
      }
    };

    loadMeta();
  }, []);

  const saveCore = async () => {
    let id = projectIdRef.current;

    if (id) {
      const data = await updateStudentProject(
        id,
        payload
      );

      return data.project;
    }

    const data = await createStudentProject(
      payload
    );

    id = data.project.id;
    projectIdRef.current = id;
    setProjectId(id);
    setForm((current) => ({
      ...current,
      id,
    }));

    return data.project;
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return undefined;
    }

    if (!form.title.trim() && !form.idea.trim()) {
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      if (
        autoSavingRef.current ||
        saving
      ) {
        return;
      }

      try {
        autoSavingRef.current = true;
        await saveCore();
        setNotice('Draft saved automatically');
      } catch {
        setNotice(
          'Automatic save failed. Use Save draft.'
        );
      } finally {
        autoSavingRef.current = false;
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [payload]);

  const validate = () => {
    const next = {};

    if (!form.title.trim()) {
      next.title =
        'Project title is required.';
    }

    if (!form.categoryId) {
      next.category =
        'Choose a category.';
    }

    if (!form.idea.trim()) {
      next.idea =
        'Project idea is required.';
    }

    if (
      form.projectType === 'team' &&
      !form.team.length
    ) {
      next.team =
        'Add at least one team member.';
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const uploadPendingMedia = async (id) => {
    const pending = {};

    Object.entries(form.media).forEach(
      ([key, asset]) => {
        if (asset?.file) {
          pending[mediaApiNames[key]] =
            asset.file;
        }
      }
    );

    if (!Object.keys(pending).length) {
      return null;
    }

    const data =
      await uploadStudentProjectMedia(
        id,
        pending
      );

    const project = data.project;

    setForm((current) => ({
      ...current,
      media: {
        cover: makeAsset(
          project.media?.cover_image || ''
        ),
        logo: makeAsset(
          project.media?.logo || ''
        ),
        video: makeAsset(
          project.media?.intro_video || ''
        ),
        presentation: makeAsset(
          project.media
            ?.presentation_file || ''
        ),
        documentation: makeAsset(
          project.media
            ?.documentation_file || ''
        ),
      },
    }));

    return project;
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      setNotice('');
      setErrors({});

      const project = await saveCore();
      const id = project.id;

      await uploadPendingMedia(id);

      setNotice(
        'Draft saved successfully.'
      );

      return id;
    } catch (requestError) {
      setNotice(
        requestError.message ||
          'Unable to save project draft.'
      );

      return null;
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      setNotice('');

      const project = await saveCore();
      const id = project.id;

      await uploadPendingMedia(id);
      await submitStudentProject(id);

      onFinished(id);
    } catch (requestError) {
      setNotice(
        requestError.message ||
          'Unable to submit project.'
      );
    } finally {
      setSaving(false);
    }
  };

  const addMember = () => {
    if (
      !member.name.trim() ||
      !member.role.trim()
    ) {
      return;
    }

    update('team', [
      ...form.team,
      {
        ...member,
        id: `member-${Date.now()}`,
      },
    ]);

    setMember(blankMember);
  };

  const setMedia = (key) => (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const previewUrl =
      file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : '';

    setForm((current) => ({
      ...current,
      media: {
        ...current.media,
        [key]: {
          url: current.media[key]?.url || '',
          file,
          name: file.name,
          previewUrl,
        },
      },
    }));

    event.target.value = '';
  };

  const removeMedia = async (key) => {
    const currentAsset = form.media[key];

    if (currentAsset?.previewUrl) {
      URL.revokeObjectURL(
        currentAsset.previewUrl
      );
    }

    if (
      currentAsset?.url &&
      projectIdRef.current
    ) {
      try {
        setSaving(true);

        await deleteStudentProjectMedia(
          projectIdRef.current,
          mediaApiNames[key]
        );
      } catch (requestError) {
        setNotice(
          requestError.message ||
            'Unable to remove project media.'
        );
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    setForm((current) => ({
      ...current,
      media: {
        ...current.media,
        [key]: makeAsset(),
      },
    }));
  };

  const deleteDraft = async () => {
    const id = projectIdRef.current;

    if (
      !id ||
      !window.confirm(
        'Delete this draft project?'
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setNotice('');

      await deleteStudentProject(id);
      onClose();
    } catch (requestError) {
      setNotice(
        requestError.message ||
          'Unable to delete project.'
      );
    } finally {
      setSaving(false);
    }
  };

  const mediaSource = (key) =>
    form.media[key]?.previewUrl ||
    form.media[key]?.url ||
    '';

  return (
    <div className="sp-page sp-wizard">
      <header className="sp-wizard-header">
        <div>
          <button
            className="sp-back"
            onClick={onClose}
            disabled={saving}
          >
            <FiArrowLeft /> Back to my projects
          </button>

          <h1>
            {initialProject
              ? 'Edit project'
              : 'Add new project'}
          </h1>

          <p>
            Add the project information, team,
            media, and links.
          </p>
        </div>

        <span>
          {saving
            ? 'Saving...'
            : notice ||
              'Draft saves automatically'}
        </span>
      </header>

      <section className="sp-form-section">
        <h2>1. Project information</h2>

        <div className="sp-form-grid">
          <label>
            Project title *
            <input
              value={form.title}
              onChange={(event) =>
                update(
                  'title',
                  event.target.value
                )
              }
              placeholder="Enter project title"
              disabled={saving}
            />
            {errors.title && (
              <small>{errors.title}</small>
            )}
          </label>

          <label>
            Course
            <select
              value={form.courseId}
              onChange={(event) =>
                update(
                  'courseId',
                  event.target.value
                )
              }
              disabled={saving}
            >
              <option value="">
                Independent project
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Category *
            <select
              value={form.categoryId}
              onChange={(event) =>
                update(
                  'categoryId',
                  event.target.value
                )
              }
              disabled={saving}
            >
              <option value="">
                Select category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>

            {errors.category && (
              <small>
                {errors.category}
              </small>
            )}
          </label>

          <label>
            Project type
            <div className="sp-segment">
              <button
                type="button"
                className={
                  form.projectType ===
                  'individual'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  update(
                    'projectType',
                    'individual'
                  )
                }
                disabled={saving}
              >
                Individual
              </button>

              <button
                type="button"
                className={
                  form.projectType === 'team'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  update(
                    'projectType',
                    'team'
                  )
                }
                disabled={saving}
              >
                Team
              </button>
            </div>
          </label>

          <label className="full">
            Project idea *
            <textarea
              value={form.idea}
              onChange={(event) =>
                update(
                  'idea',
                  event.target.value
                )
              }
              placeholder="Describe the idea and what makes it useful..."
              disabled={saving}
            />
            {errors.idea && (
              <small>{errors.idea}</small>
            )}
          </label>

          <label>
            Problem
            <textarea
              value={form.problem}
              onChange={(event) =>
                update(
                  'problem',
                  event.target.value
                )
              }
              placeholder="What problem does your project solve?"
              disabled={saving}
            />
          </label>

          <label>
            Solution
            <textarea
              value={form.solution}
              onChange={(event) =>
                update(
                  'solution',
                  event.target.value
                )
              }
              placeholder="How does your project solve this problem?"
              disabled={saving}
            />
          </label>

          <label className="full">
            Technologies
            <input
              value={form.techStackText}
              onChange={(event) =>
                update(
                  'techStackText',
                  event.target.value
                )
              }
              placeholder="React, Laravel, MySQL"
              disabled={saving}
            />
          </label>
        </div>
      </section>

      <section className="sp-form-section sp-media-section">
        <div className="sp-section-heading">
          <span>02</span>

          <div>
            <h2>Project image & media</h2>
            <p>
              Add a clear image that will appear
              on the project card.
            </p>
          </div>
        </div>

        <div className="sp-media-editor">
          <div className="sp-project-image-card">
            <div className="sp-project-image-preview">
              {mediaSource('cover') ? (
                <img
                  src={mediaSource('cover')}
                  alt="Project preview"
                />
              ) : (
                <div className="sp-project-image-placeholder">
                  <FiImage />
                  <strong>Project image</strong>
                  <span>
                    Recommended size: 1200 × 700 px
                  </span>
                </div>
              )}
            </div>

            <div className="sp-project-image-copy">
              <div>
                <strong>
                  Project cover image
                </strong>
                <small>
                  PNG, JPG or WEBP · Max 5 MB
                </small>
              </div>

              <div className="sp-media-actions">
                <label className="sp-upload-action">
                  <FiUpload />{' '}
                  {mediaSource('cover')
                    ? 'Change image'
                    : 'Add image'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={setMedia('cover')}
                    disabled={saving}
                  />
                </label>

                {mediaSource('cover') && (
                  <button
                    type="button"
                    onClick={() =>
                      removeMedia('cover')
                    }
                    disabled={saving}
                  >
                    <FiX /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="sp-secondary-media">
            <label className="sp-media-tile">
              <span className="sp-media-tile-icon">
                <FiImage />
              </span>

              <span>
                <strong>
                  {form.media.logo?.name ||
                    (form.media.logo?.url
                      ? 'Current project logo'
                      : 'Project logo')}
                </strong>
                <small>
                  Square PNG or JPG · Max 2 MB
                </small>
              </span>

              <b>
                <FiUpload />{' '}
                {mediaSource('logo')
                  ? 'Replace'
                  : 'Upload logo'}
              </b>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={setMedia('logo')}
                disabled={saving}
              />
            </label>

            <label className="sp-media-tile">
              <span className="sp-media-tile-icon">
                <FiVideo />
              </span>

              <span>
                <strong>
                  {form.media.video?.name ||
                    (form.media.video?.url
                      ? 'Current introduction video'
                      : 'Short introduction video')}
                </strong>
                <small>
                  MP4 or WebM · Max 20 MB
                </small>
              </span>

              <b>
                <FiUpload />{' '}
                {mediaSource('video')
                  ? 'Replace'
                  : 'Upload video'}
              </b>

              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={setMedia('video')}
                disabled={saving}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="sp-form-section">
        <h2>3. Team members</h2>

        {form.projectType ===
        'individual' ? (
          <div className="sp-owner-row">
            <span>{form.studentName}</span>
            <b>Project owner</b>
            <small>
              {studentData?.major ||
                studentData?.program ||
                'Student'}
            </small>
          </div>
        ) : (
          <>
            <div className="sp-member-inputs">
              <input
                value={member.name}
                onChange={(event) =>
                  setMember({
                    ...member,
                    name: event.target.value,
                  })
                }
                placeholder="Name"
                disabled={saving}
              />

              <input
                value={member.role}
                onChange={(event) =>
                  setMember({
                    ...member,
                    role: event.target.value,
                  })
                }
                placeholder="Role"
                disabled={saving}
              />

              <input
                value={member.specialty}
                onChange={(event) =>
                  setMember({
                    ...member,
                    specialty:
                      event.target.value,
                  })
                }
                placeholder="Specialization"
                disabled={saving}
              />

              <button
                type="button"
                onClick={addMember}
                disabled={saving}
              >
                <FiPlus /> Add member
              </button>
            </div>

            {form.team.map((item) => (
              <div
                className="sp-team-edit-row"
                key={item.id}
              >
                <span>{item.name}</span>
                <span>{item.role}</span>
                <span>{item.specialty}</span>

                <button
                  type="button"
                  onClick={() =>
                    update(
                      'team',
                      form.team.filter(
                        (entry) =>
                          entry.id !== item.id
                      )
                    )
                  }
                  disabled={saving}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}

            {errors.team && (
              <p className="sp-form-error">
                {errors.team}
              </p>
            )}
          </>
        )}
      </section>

      <section className="sp-form-section">
        <h2>4. Files & links</h2>

        <div className="sp-form-grid">
          <label>
            <FiGithub /> GitHub repository URL
            <input
              type="url"
              value={form.links.github}
              onChange={(event) =>
                updateLink(
                  'github',
                  event.target.value
                )
              }
              placeholder="https://github.com/username/repository"
              disabled={saving}
            />
          </label>

          <label>
            <FiLink /> Live project URL
            <input
              type="url"
              value={form.links.demo}
              onChange={(event) =>
                updateLink(
                  'demo',
                  event.target.value
                )
              }
              placeholder="https://your-project.com"
              disabled={saving}
            />
          </label>

          <label>
            <FiFileText /> Presentation file
            <input
              type="file"
              accept=".pdf,.ppt,.pptx"
              onChange={setMedia(
                'presentation'
              )}
              disabled={saving}
            />

            {(form.media.presentation?.name ||
              form.media.presentation?.url) && (
              <small>
                {form.media.presentation
                  ?.name ||
                  'Current presentation file'}
              </small>
            )}
          </label>

          <label>
            <FiFileText /> Documentation / SRS
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={setMedia(
                'documentation'
              )}
              disabled={saving}
            />

            {(form.media.documentation?.name ||
              form.media.documentation?.url) && (
              <small>
                {form.media.documentation
                  ?.name ||
                  'Current documentation file'}
              </small>
            )}
          </label>
        </div>
      </section>

      <footer className="sp-wizard-footer">
        <div>
          {projectId &&
            initialProject?.status ===
              'draft' && (
              <button
                className="sp-danger-link"
                onClick={deleteDraft}
                disabled={saving}
              >
                Delete draft
              </button>
            )}
        </div>

        <div>
          <button
            className="sp-outline-btn"
            onClick={saveDraft}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save draft'}
          </button>

          <button
            className="sp-primary-btn"
            onClick={submit}
            disabled={saving}
          >
            {initialProject?.status ===
            'revision_requested'
              ? 'Resubmit for review'
              : 'Submit for review'}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default ProjectWizard;
