import { useMemo, useState } from 'react';
import {
  FiArchive,
  FiBookOpen,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiFile,
  FiGrid,
  FiLink,
  FiList,
  FiMessageSquare,
  FiMoreHorizontal,
  FiMove,
  FiPlayCircle,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useCoursesCatalog } from './CoursesCatalogContext';
import './TrainerCourses.css';

/* ============================================
   CONSTANTS
   ============================================ */

const emptyCourse = {
  title: '',
  category: '',
  level: 'Beginner',
  duration: '4 Weeks',
  description: '',
  coverImage: '',
};

const emptyLesson = {
  title: '',
  type: 'video',
  description: '',
  url: '',
  duration: '',
};

const lessonIcons = { video: FiPlayCircle, file: FiFile, link: FiLink, practice: FiEdit3 };
const lessonLabel = { video: 'Video', file: 'File', link: 'Link', practice: 'Practice' };

/* ============================================
   HELPERS
   ============================================ */

const lessonCount = (course) =>
  course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

const allLessons = (course) => course.modules.flatMap((module) => module.lessons);

const initials = (value) =>
  (value || 'Course')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const formatUpdatedDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function TrainerCourses({ trainerData, onOpenMessages }) {
  const catalog = useCoursesCatalog();

  /* ---------- List view state (filters, view mode) ---------- */
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('updated');
  const [view, setView] = useState('list');
  const [menuId, setMenuId] = useState(null);

  /* ---------- Create / edit course modal ---------- */
  const [courseModal, setCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourse);

  /* ---------- Course builder (editing a single course) ---------- */
  const [editing, setEditing] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonModuleId, setLessonModuleId] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLesson);

  /* ---------- Shared modals ---------- */
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [notice, setNotice] = useState('');

  /* ============================================
     DERIVED DATA
     ============================================ */

  /** Courses shown in the list, after search + status filter + sort. */
  const visibleCourses = useMemo(() => {
    const filtered = catalog.courses
      .filter((course) => course.status !== 'deleted' && course.status !== 'archived')
      .filter((course) => status === 'all' || course.status === status)
      .filter((course) =>
        `${course.title} ${course.category}`.toLowerCase().includes(query.toLowerCase()),
      );

    return [...filtered].sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : new Date(b.updatedAt) - new Date(a.updatedAt),
    );
  }, [catalog.courses, query, sort, status]);

  /** Overview stats shown at the top of the page. */
  const stats = useMemo(() => {
    const active = catalog.courses.filter((course) => course.status === 'published');
    const lessons = active.reduce((sum, course) => sum + lessonCount(course), 0);
    const comments = active.flatMap(allLessons).flatMap((lesson) => lesson.comments || []);

    return {
      active: active.length,
      students: active.reduce((sum, course) => sum + Number(course.students || 0), 0),
      lessons,
      comments: comments.filter((comment) => comment.status === 'visible').length,
      awaiting: comments.filter((comment) => comment.status === 'visible' && !comment.replies?.length).length,
      drafts: catalog.courses.filter((course) => course.status === 'draft').length,
      hidden: catalog.courses.filter((course) => course.status === 'hidden').length,
    };
  }, [catalog.courses]);

  /* ============================================
     HANDLERS
     ============================================ */

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };

  const openCreate = () => {
    setCourseForm(emptyCourse);
    setEditing(null);
    setCourseModal(true);
  };

  const openEdit = (course) => {
    setCourseForm({ ...emptyCourse, ...course });
    setEditing(course);
    setCourseModal(true);
  };

  const saveCourse = (event) => {
    event.preventDefault();

    if (editing) {
      catalog.updateCourse(editing.id, courseForm);
    } else {
      catalog.createCourse({
        ...courseForm,
        instructor: trainerData?.displayName,
        instructorTitle: trainerData?.major,
      });
    }

    setCourseModal(false);
    flash(editing ? 'Course changes saved.' : 'Course created as a draft.');
  };

  const manage = (course) => {
    setEditing(course);
    setMenuId(null);
  };

  const addModule = (event) => {
    event.preventDefault();
    if (!moduleTitle.trim()) return;
    catalog.addModule(editing.id, moduleTitle.trim());
    setModuleTitle('');
  };

  const moveModule = (index, direction) => {
    const target = index + direction;
    if (target >= 0 && target < editing.modules.length) {
      catalog.reorderModules(editing.id, index, target);
    }
  };

  const addLesson = (event) => {
    event.preventDefault();
    if (!lessonForm.title.trim()) return;
    catalog.addLesson(editing.id, lessonModuleId, lessonForm);
    setLessonModuleId(null);
    setLessonForm(emptyLesson);
  };

  const confirmDelete = () => {
    const result = catalog.deleteCourse(deleteTarget.id, {
      reason: deleteReason,
      canDeleteCourses: true,
    });

    if (!result.ok) return flash(result.error);

    setDeleteTarget(null);
    setDeleteReason('');
    flash('Course moved to the deletion archive.');
  };

  /* ============================================
     VIEW: COURSE BUILDER
     (shown while `editing` is set — modules, lessons, publish status)
     ============================================ */

  // Read the live course from the catalog so edits made elsewhere (e.g. a
  // lesson added via the modal) are reflected immediately.
  const liveEditing = editing
    ? catalog.courses.find((course) => String(course.id) === String(editing.id))
    : null;

  if (editing) {
    const course = liveEditing || editing;

    return (
      <div className="tc-page">
        <button className="tc-back" onClick={() => setEditing(null)}>
          ← Back to courses
        </button>

        <div className="tc-editor-head">
          <div>
            <span>COURSE BUILDER</span>
            <h1>{course.title}</h1>
            <p>Organize modules, publish lessons, and review student engagement.</p>
          </div>

          <div className="tc-actions">
            <button onClick={() => setPreview(course)}>
              <FiEye /> Student preview
            </button>
            <button onClick={() => openEdit(course)}>
              <FiEdit3 /> Edit details
            </button>
            {course.status === 'published' ? (
              <button onClick={() => catalog.hideCourse(course.id)}>
                <FiEyeOff /> Hide
              </button>
            ) : (
              <button className="primary" onClick={() => catalog.publishCourse(course.id)}>
                <FiUploadCloud /> Publish
              </button>
            )}
          </div>
        </div>

        <div className="tc-builder-layout">
          {/* ---------- Modules & lessons ---------- */}
          <section className="tc-builder-main">
            <div className="tc-builder-card">
              <div className="tc-card-title">
                <div>
                  <h2>Course content</h2>
                  <p>Use arrows to reorder modules. Changes sync with the student course.</p>
                </div>
                <span>
                  {course.modules.length} modules · {lessonCount(course)} lessons
                </span>
              </div>

              <form className="tc-inline-form" onSubmit={addModule}>
                <input
                  value={moduleTitle}
                  onChange={(event) => setModuleTitle(event.target.value)}
                  placeholder="New module title"
                />
                <button className="primary">
                  <FiPlus /> Add module
                </button>
              </form>

              <div className="tc-modules">
                {course.modules.map((module, index) => (
                  <article className="tc-module" key={module.id}>
                    <header>
                      <FiMove />
                      <div>
                        <strong>{module.title}</strong>
                        <small>{module.lessons.length} lessons</small>
                      </div>
                      <button disabled={index === 0} onClick={() => moveModule(index, -1)}>
                        <FiChevronUp />
                      </button>
                      <button
                        disabled={index === course.modules.length - 1}
                        onClick={() => moveModule(index, 1)}
                      >
                        <FiChevronDown />
                      </button>
                      <button className="tc-add-lesson" onClick={() => setLessonModuleId(module.id)}>
                        <FiPlus /> Lesson
                      </button>
                    </header>

                    <div className="tc-lessons">
                      {module.lessons.map((lesson) => {
                        const Icon = lessonIcons[lesson.type] || FiFile;
                        const views = lesson.views?.length || 0;
                        const avg = views
                          ? Math.round(
                              lesson.views.reduce((sum, item) => sum + Number(item.percent || 0), 0) / views,
                            )
                          : 0;

                        return (
                          <div className="tc-lesson" key={lesson.id}>
                            <span>
                              <Icon />
                            </span>
                            <div>
                              <strong>{lesson.title}</strong>
                              <small>
                                {lessonLabel[lesson.type]} {lesson.duration && `· ${lesson.duration}`}
                              </small>
                            </div>
                            <em>
                              {views} views · {avg}% complete
                            </em>
                            <button onClick={() => setLessonModuleId(module.id)}>
                              <FiEdit3 />
                            </button>
                          </div>
                        );
                      })}
                      {!module.lessons.length && (
                        <p className="tc-empty-line">No lessons in this module yet.</p>
                      )}
                    </div>
                  </article>
                ))}

                {!course.modules.length && (
                  <div className="tc-empty">
                    Create the first module, then add videos, files, links, or practical training.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ---------- Sidebar: status, messaging, safe actions ---------- */}
          <aside className="tc-builder-side">
            <section>
              <h3>Course status</h3>
              <span className={`tc-status ${course.status}`}>{course.status}</span>
              <dl>
                <div>
                  <dt>Students</dt>
                  <dd>{course.students || 0}</dd>
                </div>
                <div>
                  <dt>Lessons</dt>
                  <dd>{lessonCount(course)}</dd>
                </div>
                <div>
                  <dt>Last update</dt>
                  <dd>{formatUpdatedDate(course.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3>Student communication</h3>
              <p>Open private messages to answer course or lesson questions.</p>
              <button className="tc-wide" onClick={onOpenMessages}>
                <FiMessageSquare /> Open messages
              </button>
            </section>

            <section>
              <h3>Safe course actions</h3>
              <button
                className="tc-wide"
                onClick={() => {
                  catalog.duplicateCourse(course.id);
                  flash('Editable copy created.');
                }}
              >
                <FiCopy /> Duplicate course
              </button>
              <button
                className="tc-wide"
                onClick={() => {
                  catalog.archiveCourse(course.id);
                  setEditing(null);
                }}
              >
                <FiArchive /> Archive course
              </button>
            </section>
          </aside>
        </div>

        {/* ---------- Add/edit lesson modal ---------- */}
        {lessonModuleId && (
          <div className="tc-modal">
            <form onSubmit={addLesson}>
              <button type="button" className="tc-close" onClick={() => setLessonModuleId(null)}>
                <FiX />
              </button>
              <h2>Add lesson</h2>
              <p>Add a video, downloadable file, external link, or practical activity.</p>

              <label>
                Lesson type
                <select
                  value={lessonForm.type}
                  onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                >
                  <option value="video">Video</option>
                  <option value="file">File</option>
                  <option value="link">Link</option>
                  <option value="practice">Practical training</option>
                </select>
              </label>

              <label>
                Title
                <input
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                />
              </label>

              <label>
                Description
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                />
              </label>

              <div className="tc-two">
                <label>
                  URL
                  <input
                    value={lessonForm.url}
                    onChange={(e) => setLessonForm({ ...lessonForm, url: e.target.value })}
                  />
                </label>
                <label>
                  Duration
                  <input
                    placeholder="18 min"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  />
                </label>
              </div>

              <button className="primary">Add lesson</button>
            </form>
          </div>
        )}

        {courseModal && (
          <CourseModal
            form={courseForm}
            setForm={setCourseForm}
            onSubmit={saveCourse}
            onClose={() => setCourseModal(false)}
            editing
          />
        )}
        {preview && <StudentPreview course={preview} onClose={() => setPreview(null)} />}
        {notice && <div className="tc-toast">{notice}</div>}
      </div>
    );
  }

  /* ============================================
     VIEW: COURSE LIST
     ============================================ */

  return (
    <div className="tc-page">
      <div className="tc-page-head">
        <div>
          <span>COURSE MANAGEMENT</span>
          <h1>Courses</h1>
          <p>Create, organize, and publish learning experiences.</p>
        </div>

        <div className="tc-actions">
          <button className="primary" onClick={openCreate}>
            <FiPlus /> Create course
          </button>
          <label className="tc-import">
            <FiUploadCloud /> Import content
            <input
              type="file"
              accept=".json"
              onChange={() => flash('Import file selected. Connect your backend importer when ready.')}
            />
          </label>
        </div>
      </div>

      {/* ---------- Overview stats ---------- */}
      <div className="tc-overview">
        <article>
          <span className="blue">
            <FiBookOpen />
          </span>
          <strong>{stats.active}</strong>
          <b>Active courses</b>
          <small>{stats.students} enrolled students</small>
        </article>
        <article>
          <span className="purple">
            <FiPlayCircle />
          </span>
          <strong>{stats.lessons}</strong>
          <b>Lessons published</b>
          <small>Across active courses</small>
        </article>
        <article>
          <span className="orange">
            <FiMessageSquare />
          </span>
          <strong>{stats.comments}</strong>
          <b>New comments</b>
          <small>{stats.awaiting} awaiting reply</small>
        </article>
      </div>

      <div className="tc-layout">
        {/* ---------- Course list ---------- */}
        <section className="tc-list-card">
          <div className="tc-card-title">
            <h2>My courses</h2>
          </div>

          <div className="tc-toolbar">
            <label>
              <FiSearch />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your courses"
              />
            </label>

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </select>

            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="updated">Recently updated</option>
              <option value="title">Course title</option>
            </select>

            <div className="tc-view">
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
                <FiList />
              </button>
              <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>
                <FiGrid />
              </button>
            </div>
          </div>

          <div className={`tc-course-list ${view}`}>
            {visibleCourses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                menuOpen={menuId === course.id}
                onToggleMenu={() => setMenuId(menuId === course.id ? null : course.id)}
                onManage={() => manage(course)}
                onEdit={() => openEdit(course)}
                onPreview={() => setPreview(course)}
                onDuplicate={() => catalog.duplicateCourse(course.id)}
                onPublish={() => catalog.publishCourse(course.id)}
                onHide={() => catalog.hideCourse(course.id)}
                onArchive={() => catalog.archiveCourse(course.id)}
                onDelete={() => setDeleteTarget(course)}
              />
            ))}

            {!visibleCourses.length && <div className="tc-empty">No courses match these filters.</div>}
          </div>
        </section>

        {/* ---------- Sidebar: things needing attention ---------- */}
        <aside className="tc-side">
          <section>
            <h3>Needs attention</h3>
            <button onClick={() => setStatus('all')}>
              <FiMessageSquare />
              <span>
                <strong>{stats.awaiting} comments</strong>
                <small>awaiting reply</small>
              </span>
              ›
            </button>
            <button onClick={() => setStatus('draft')}>
              <FiFile />
              <span>
                <strong>{stats.drafts} draft courses</strong>
                <small>incomplete</small>
              </span>
              ›
            </button>
            <button onClick={() => setStatus('hidden')}>
              <FiEyeOff />
              <span>
                <strong>{stats.hidden} hidden courses</strong>
                <small>not shown in catalog</small>
              </span>
              ›
            </button>
          </section>

          <section>
            <h3>Student catalog sync</h3>
            <p>Published changes appear automatically in the student course catalog.</p>
            <button className="tc-link" onClick={() => setPreview(catalog.publishedCourses[0])}>
              Preview student view →
            </button>
          </section>
        </aside>
      </div>

      {courseModal && (
        <CourseModal
          form={courseForm}
          setForm={setCourseForm}
          onSubmit={saveCourse}
          onClose={() => setCourseModal(false)}
          editing={false}
        />
      )}
      {preview && <StudentPreview course={preview} onClose={() => setPreview(null)} />}

      {deleteTarget && (
        <div className="tc-modal">
          <div className="tc-dialog">
            <button className="tc-close" onClick={() => setDeleteTarget(null)}>
              <FiX />
            </button>
            <h2>Delete course?</h2>
            <p>
              If students are enrolled, the course must be archived instead. A deletion reason is
              required and kept in the audit log.
            </p>
            <label>
              Deletion reason
              <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} />
            </label>
            <button className="danger-btn" onClick={confirmDelete}>
              Confirm restricted deletion
            </button>
          </div>
        </div>
      )}

      {notice && <div className="tc-toast">{notice}</div>}
    </div>
  );
}

/* ============================================
   ROW: SINGLE COURSE (used in both list and grid view)
   ============================================ */

function CourseRow({
  course, menuOpen, onToggleMenu,
  onManage, onEdit, onPreview, onDuplicate, onPublish, onHide, onArchive, onDelete,
}) {
  return (
    <article className="tc-course-row">
      <div className="tc-cover">
        {course.coverImage ? <img src={course.coverImage} alt="" /> : initials(course.category)}
      </div>

      <div className="tc-course-copy">
        <div className="tc-course-title-row">
          <strong title={course.title}>{course.title}</strong>
          <span className={`tc-status ${course.status}`}>{course.status}</span>
        </div>

        <small className="tc-course-meta">
          <span><FiUsers /> {course.students || 0} students</span>
          <span><FiBookOpen /> {lessonCount(course)} lessons</span>
        </small>

        <em>Updated {formatUpdatedDate(course.updatedAt)}</em>
      </div>

      <button className="tc-manage" onClick={onManage}>
        Manage course
      </button>

      <div className="tc-more">
        <button onClick={onToggleMenu} aria-label="Course actions">
          <FiMoreHorizontal />
        </button>

        {menuOpen && (
          <div>
            <button onClick={onEdit}>
              <FiEdit3 /> Edit
            </button>
            <button onClick={onPreview}>
              <FiEye /> Preview
            </button>
            <button onClick={onDuplicate}>
              <FiCopy /> Duplicate
            </button>
            {course.status === 'published' ? (
              <button onClick={onHide}>
                <FiEyeOff /> Hide
              </button>
            ) : (
              <button onClick={onPublish}>
                <FiUploadCloud /> Publish
              </button>
            )}
            <button onClick={onArchive}>
              <FiArchive /> Archive
            </button>
            <button className="danger" onClick={onDelete}>
              <FiTrash2 /> Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================
   MODAL: CREATE / EDIT COURSE DETAILS
   ============================================ */

function CourseModal({ form, setForm, onSubmit, onClose, editing }) {
  return (
    <div className="tc-modal">
      <form onSubmit={onSubmit}>
        <button type="button" className="tc-close" onClick={onClose}>
          <FiX />
        </button>
        <h2>{editing ? 'Edit course details' : 'Create a new course'}</h2>
        <p>New courses are saved as drafts until you publish them.</p>

        <div className="tc-two">
          <label>
            Course title
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label>
            Category
            <input
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
        </div>

        <div className="tc-two">
          <label>
            Level
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label>
            Duration
            <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </label>
        </div>

        <label>
          Cover image URL
          <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <button className="primary">{editing ? 'Save changes' : 'Create draft'}</button>
      </form>
    </div>
  );
}

/* ============================================
   MODAL: STUDENT-VIEW PREVIEW
   ============================================ */

function StudentPreview({ course, onClose }) {
  if (!course) return null;

  return (
    <div className="tc-modal">
      <div className="tc-preview">
        <button className="tc-close" onClick={onClose}>
          <FiX />
        </button>
        <span>STUDENT PREVIEW</span>

        <div className="tc-preview-hero">
          <div>{course.coverImage ? <img src={course.coverImage} alt="" /> : initials(course.category)}</div>
          <section>
            <i>{course.level}</i>
            <small>{course.category}</small>
            <h2>{course.title}</h2>
            <p>{course.description || 'Course description will appear here.'}</p>
            <b>
              {lessonCount(course)} lessons · {course.duration}
            </b>
          </section>
        </div>

        <h3>Course curriculum</h3>
        {course.modules.map((module) => (
          <article key={module.id}>
            <strong>{module.title}</strong>
            <small>{module.lessons.filter((lesson) => lesson.published).length} available lessons</small>
          </article>
        ))}
      </div>
    </div>
  );
}

export default TrainerCourses;
