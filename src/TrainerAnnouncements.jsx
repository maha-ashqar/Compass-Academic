import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FiArchive,
  FiAward,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCopy,
  FiEdit2,
  FiFileText,
  FiPlus,
  FiSearch,
  FiUsers,
  FiX,
} from 'react-icons/fi';

import {
  ANNOUNCEMENT_TYPES,
} from './AnnouncementsContext';

import {
  useTrainerStudents,
} from './TrainerStudentsContext';

import {
  useCoursesCatalog,
} from './CoursesCatalogContext';

import {
  archiveTrainerAnnouncement,
  createTrainerAnnouncement,
  duplicateTrainerAnnouncement,
  getTrainerAnnouncements,
  publishDueTrainerAnnouncements,
  publishTrainerAnnouncement,
  scheduleTrainerAnnouncement,
  updateTrainerAnnouncement,
} from './api/trainerAnnouncements';

import './TrainerAnnouncements.css';

const emptyForm = {
  title: '',
  content: '',
  type: 'General',
  audienceType: 'all',
  audienceValue: '',
  link: '',
  attachment: null,
  publishAt: '',
};

const labels = {
  published: 'Published',
  scheduled: 'Scheduled',
  draft: 'Draft',
};

const TYPE_ICONS = {
  Policy: FiFileText,
  Competition: FiAward,
  'Faculty instructions':
    FiBriefcase,
  General: FiBell,
};

const fileSizeLabel = (
  bytes
) => {
  if (
    bytes >=
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024 /
      1024
    ).toFixed(1)} MB`;
  }

  return `${Math.ceil(
    bytes / 1024
  )} KB`;
};

export default function TrainerAnnouncements({
  trainerData,
}) {
  const { roster } =
    useTrainerStudents();

  const { courses } =
    useCoursesCatalog();

  const [
    announcements,
    setAnnouncements,
  ] = useState([]);

  const [
    selectedId,
    setSelectedId,
  ] = useState(null);

  const [filter, setFilter] =
    useState('all');

  const [type, setType] =
    useState('all');

  const [query, setQuery] =
    useState('');

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [
    selectedStudentIds,
    setSelectedStudentIds,
  ] = useState([]);

  const [
    studentQuery,
    setStudentQuery,
  ] = useState('');

  const [
    formError,
    setFormError,
  ] = useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const myCourses =
    useMemo(
      () =>
        courses.filter(
          (course) =>
            course.instructor ===
              trainerData?.displayName ||
            course.createdByTrainer
        ),
      [
        courses,
        trainerData?.displayName,
      ]
    );

  const loadAnnouncements =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getTrainerAnnouncements();

        const items =
          Array.isArray(
            response.announcements
          )
            ? response.announcements
            : [];

        setAnnouncements(items);

        setSelectedId(
          (current) => {
            if (
              current &&
              items.some(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    current
                  )
              )
            ) {
              return current;
            }

            return (
              items[0]?.id ??
              null
            );
          }
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    const timer =
      window.setInterval(
        async () => {
          try {
            const response =
              await publishDueTrainerAnnouncements();

            if (
              Number(
                response.published_count
              ) > 0
            ) {
              await loadAnnouncements();
            }
          } catch {
            return;
          }
        },
        30000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [loadAnnouncements]);

  const upsertAnnouncement =
    useCallback(
      (announcement) => {
        if (!announcement) {
          return;
        }

        setAnnouncements(
          (current) => {
            const exists =
              current.some(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    announcement.id
                  )
              );

            if (!exists) {
              return [
                announcement,
                ...current,
              ];
            }

            return current.map(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  announcement.id
                )
                  ? announcement
                  : item
            );
          }
        );
      },
      []
    );

  const list = useMemo(
    () =>
      announcements.filter(
        (item) => {
          if (
            item.status ===
            'archived'
          ) {
            return false;
          }

          const matchesStatus =
            filter === 'all' ||
            item.status ===
              filter;

          const matchesType =
            type === 'all' ||
            item.type ===
              type;

          const haystack =
            `${item.title || ''} ${
              item.content || ''
            } ${
              item.audienceLabel ||
              ''
            }`.toLowerCase();

          return (
            matchesStatus &&
            matchesType &&
            haystack.includes(
              query.toLowerCase()
            )
          );
        }
      ),
    [
      announcements,
      filter,
      query,
      type,
    ]
  );

  const selected =
    list.find(
      (item) =>
        String(item.id) ===
        String(selectedId)
    ) ||
    list[0] ||
    null;

  const stats = selected
    ? {
        recipients:
          Number(
            selected.recipients
          ) || 0,

        views:
          Array.isArray(
            selected.readBy
          )
            ? selected.readBy
                .length
            : 0,
      }
    : {
        recipients: 0,
        views: 0,
      };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedStudentIds([]);
    setStudentQuery('');
    setFormError('');
    setEditorOpen(true);
  };

  const openEdit = (
    item
  ) => {
    setEditingId(item.id);

    setForm({
      ...emptyForm,
      ...item,

      publishAt:
        item.publishAt
          ? new Date(
              item.publishAt
            )
              .toISOString()
              .slice(0, 16)
          : '',
    });

    setSelectedStudentIds(
      Array.isArray(
        item.audienceStudentIds
      )
        ? item.audienceStudentIds.map(
            Number
          )
        : []
    );

    setStudentQuery('');
    setFormError('');
    setEditorOpen(true);
  };

  const toggleStudent = (
    studentId
  ) => {
    const numericId =
      Number(studentId);

    setSelectedStudentIds(
      (current) =>
        current.includes(
          numericId
        )
          ? current.filter(
              (item) =>
                item !==
                numericId
            )
          : [
              ...current,
              numericId,
            ]
    );
  };

  const filteredRoster =
    useMemo(
      () =>
        roster.filter(
          (student) =>
            String(
              student.name ||
                ''
            )
              .toLowerCase()
              .includes(
                studentQuery.toLowerCase()
              )
        ),
      [
        roster,
        studentQuery,
      ]
    );

  const handleAttachmentChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setFormError(
          'Attachment must be smaller than 5 MB.'
        );

        event.target.value =
          '';

        return;
      }

      setForm(
        (current) => ({
          ...current,

          attachment: {
            name: file.name,
            size:
              fileSizeLabel(
                file.size
              ),
            type: file.type,
            dataUrl: '',
            file,
          },
        })
      );

      setFormError('');
    };

  const validateForm = (
    mode
  ) => {
    if (
      !form.title.trim() ||
      !form.content.trim()
    ) {
      return 'Title and content are required.';
    }

    if (
      [
        'course',
        'major',
        'faculty',
      ].includes(
        form.audienceType
      ) &&
      !form.audienceValue.trim()
    ) {
      return 'Please specify the audience for this announcement.';
    }

    if (
      form.audienceType ===
        'students' &&
      !selectedStudentIds.length
    ) {
      return 'Select at least one student.';
    }

    if (
      mode ===
        'schedule' &&
      !form.publishAt
    ) {
      return 'Choose a schedule date and time first.';
    }

    if (
      mode === 'schedule'
    ) {
      const publishDate =
        new Date(
          form.publishAt
        );

      if (
        Number.isNaN(
          publishDate.getTime()
        ) ||
        publishDate.getTime() <=
          Date.now()
      ) {
        return 'Schedule time must be in the future.';
      }
    }

    return '';
  };

  const buildData = () => ({
    ...form,

    audienceStudentIds:
      form.audienceType ===
      'students'
        ? selectedStudentIds
        : [],

    author:
      trainerData?.displayName ||
      'Trainer',
  });

  const save = async (
    mode
  ) => {
    if (saving) {
      return;
    }

    const validationError =
      validateForm(mode);

    if (validationError) {
      setFormError(
        validationError
      );

      return;
    }

    if (
      mode === 'publish' &&
      !window.confirm(
        'Publish this announcement now? Students in the selected audience will be notified immediately.'
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      setError('');

      const data =
        buildData();

      let response;

      if (editingId) {
        response =
          await updateTrainerAnnouncement(
            editingId,
            data
          );
      } else {
        response =
          await createTrainerAnnouncement(
            data
          );
      }

      let announcement =
        response.announcement;

      const announcementId =
        announcement.id;

      if (
        mode === 'publish'
      ) {
        response =
          await publishTrainerAnnouncement(
            announcementId
          );

        announcement =
          response.announcement;
      }

      if (
        mode ===
          'schedule' &&
        form.publishAt
      ) {
        response =
          await scheduleTrainerAnnouncement(
            announcementId,
            new Date(
              form.publishAt
            ).toISOString()
          );

        announcement =
          response.announcement;
      }

      upsertAnnouncement(
        announcement
      );

      setFilter('all');
      setType('all');

      setSelectedId(
        announcement.id
      );

      setEditorOpen(false);
      setEditingId(null);

      setForm(emptyForm);

      setSelectedStudentIds(
        []
      );
    } catch (
      requestError
    ) {
      setFormError(
        requestError.message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate =
    async () => {
      if (
        !selected ||
        saving
      ) {
        return;
      }

      try {
        setSaving(true);
        setError('');

        const response =
          await duplicateTrainerAnnouncement(
            selected.id
          );

        const copy =
          response.announcement;

        upsertAnnouncement(
          copy
        );

        setFilter('all');
        setType('all');

        setSelectedId(
          copy.id
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      } finally {
        setSaving(false);
      }
    };

  const handleArchive =
    async () => {
      if (
        !selected ||
        saving
      ) {
        return;
      }

      if (
        !window.confirm(
          'Archive this announcement? Reading records will be preserved.'
        )
      ) {
        return;
      }

      try {
        setSaving(true);
        setError('');

        await archiveTrainerAnnouncement(
          selected.id
        );

        const remaining =
          announcements.filter(
            (item) =>
              String(
                item.id
              ) !==
              String(
                selected.id
              )
          );

        setAnnouncements(
          remaining
        );

        setSelectedId(
          remaining[0]?.id ??
            null
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="ta-page">
        <div className="ta-empty">
          Loading announcements...
        </div>
      </div>
    );
  }

  return (
    <div className="ta-page">
      <header className="ta-heading">
        <div>
          <span>
            COMMUNICATION CENTER
          </span>

          <h1>
            Announcements
          </h1>

          <p>
            Publish important
            updates and notify
            the right students.
          </p>
        </div>

        <button
          onClick={openNew}
          disabled={saving}
        >
          <FiPlus />

          New announcement
        </button>
      </header>

      {error && (
        <p className="ta-form-error">
          {error}
        </p>
      )}

      <section className="ta-toolbar">
        <nav>
          {[
            'all',
            'published',
            'scheduled',
            'draft',
          ].map((value) => (
            <button
              className={
                filter === value
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter(
                  value
                )
              }
              key={value}
            >
              {value === 'all'
                ? 'All'
                : labels[
                    value
                  ]}
            </button>
          ))}
        </nav>

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
            placeholder="Search announcements"
          />
        </label>

        <select
          value={type}
          onChange={(
            event
          ) =>
            setType(
              event.target
                .value
            )
          }
        >
          <option value="all">
            All types
          </option>

          {ANNOUNCEMENT_TYPES.map(
            (value) => (
              <option
                key={value}
              >
                {value}
              </option>
            )
          )}
        </select>
      </section>

      <div className="ta-layout">
        <section className="ta-list">
          {list.map(
            (item) => {
              const TypeIcon =
                TYPE_ICONS[
                  item.type
                ] || FiBell;

              return (
                <button
                  key={item.id}
                  className={`ta-row ${
                    String(
                      selected?.id
                    ) ===
                    String(
                      item.id
                    )
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() =>
                    setSelectedId(
                      item.id
                    )
                  }
                >
                  <i>
                    <TypeIcon />
                  </i>

                  <span>
                    <small
                      className={`ta-type ${item.type
                        .toLowerCase()
                        .replace(
                          ' ',
                          '-'
                        )}`}
                    >
                      {
                        item.type
                      }
                    </small>

                    <strong>
                      {
                        item.title
                      }
                    </strong>

                    <em>
                      <FiUsers />{' '}
                      {
                        item.audienceLabel
                      }
                    </em>
                  </span>

                  <b>
                    <time>
                      {new Date(
                        item.publishAt ||
                          item.publishedAt ||
                          item.createdAt
                      ).toLocaleDateString(
                        'en-US',
                        {
                          month:
                            'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </time>

                    <small
                      className={`ta-status ${item.status}`}
                    >
                      {
                        labels[
                          item
                            .status
                        ]
                      }
                    </small>
                  </b>
                </button>
              );
            }
          )}

          {!list.length && (
            <div className="ta-empty">
              No announcements
              match the selected
              filters.
            </div>
          )}
        </section>

        <aside className="ta-preview">
          {selected ? (
            <>
              <small
                className={`ta-type ${selected.type
                  .toLowerCase()
                  .replace(
                    ' ',
                    '-'
                  )}`}
              >
                {
                  selected.type
                }
              </small>

              <h2>
                {
                  selected.title
                }
              </h2>

              <div className="ta-preview-meta">
                <span
                  className={`ta-status ${selected.status}`}
                >
                  {
                    labels[
                      selected
                        .status
                    ]
                  }
                </span>

                <span>
                  <FiUsers />{' '}
                  {
                    selected.audienceLabel
                  }
                </span>
              </div>

              <p className="ta-date">
                <FiCalendar />

                {selected.status ===
                'scheduled'
                  ? 'Scheduled'
                  : selected.status ===
                      'published'
                    ? 'Published'
                    : 'Created'}{' '}
                on{' '}
                {new Date(
                  selected.publishAt ||
                    selected.publishedAt ||
                    selected.createdAt
                ).toLocaleString(
                  'en-US',
                  {
                    month:
                      'short',
                    day: 'numeric',
                    year:
                      'numeric',
                    hour:
                      '2-digit',
                    minute:
                      '2-digit',
                  }
                )}
              </p>

              <div className="ta-copy">
                {selected.content
                  .split('\n')
                  .map(
                    (
                      line,
                      index
                    ) => (
                      <p
                        key={
                          index
                        }
                      >
                        {line || (
                          <br />
                        )}
                      </p>
                    )
                  )}
              </div>

              {selected.attachment && (
                selected
                  .attachment
                  .dataUrl ? (
                  <a
                    className="ta-file"
                    href={
                      selected
                        .attachment
                        .dataUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    download={
                      selected
                        .attachment
                        .name
                    }
                  >
                    <FiFileText />

                    <span>
                      <strong>
                        {
                          selected
                            .attachment
                            .name
                        }
                      </strong>

                      <small>
                        {
                          selected
                            .attachment
                            .size
                        }{' '}
                        · Click to
                        download
                      </small>
                    </span>
                  </a>
                ) : (
                  <div className="ta-file">
                    <FiFileText />

                    <span>
                      <strong>
                        {
                          selected
                            .attachment
                            .name
                        }
                      </strong>

                      <small>
                        {
                          selected
                            .attachment
                            .size
                        }
                      </small>
                    </span>
                  </div>
                )
              )}

              {selected.link && (
                <a
                  className="ta-link"
                  href={
                    selected.link
                  }
                >
                  Open related
                  page
                </a>
              )}

              {selected.status ===
                'published' && (
                <div className="ta-delivery">
                  <FiBell />

                  <span>
                    <strong>
                      Notification
                      sent
                    </strong>

                    <small>
                      {stats.recipients >
                      0
                        ? `${stats.recipients} recipients · `
                        : ''}

                      {stats.views}{' '}
                      viewed
                    </small>
                  </span>
                </div>
              )}

              <div className="ta-actions">
                <button
                  onClick={() =>
                    openEdit(
                      selected
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <FiEdit2 />

                  Edit
                </button>

                <button
                  onClick={
                    handleDuplicate
                  }
                  disabled={
                    saving
                  }
                >
                  <FiCopy />

                  Duplicate
                </button>
              </div>

              <button
                className="ta-archive"
                onClick={
                  handleArchive
                }
                disabled={
                  saving
                }
              >
                <FiArchive />

                Archive
              </button>
            </>
          ) : (
            <div className="ta-empty">
              Select an
              announcement to
              preview it.
            </div>
          )}
        </aside>
      </div>

      {editorOpen && (
        <div
          className="ta-modal"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={(
              event
            ) => {
              event.preventDefault();

              save('draft');
            }}
          >
            <header>
              <div>
                <h2>
                  {editingId
                    ? 'Edit announcement'
                    : 'New announcement'}
                </h2>

                <p>
                  Choose the
                  message,
                  audience, and
                  publishing
                  option.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditorOpen(
                    false
                  )
                }
                disabled={
                  saving
                }
              >
                <FiX />
              </button>
            </header>

            <div className="ta-form-grid">
              <label className="full">
                Title *

                <input
                  value={
                    form.title
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      title:
                        event
                          .target
                          .value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Type

                <select
                  value={
                    form.type
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      type:
                        event
                          .target
                          .value,
                    })
                  }
                >
                  {ANNOUNCEMENT_TYPES.map(
                    (
                      value
                    ) => (
                      <option
                        key={
                          value
                        }
                      >
                        {
                          value
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Audience

                <select
                  value={
                    form.audienceType
                  }
                  onChange={(
                    event
                  ) => {
                    setForm({
                      ...form,
                      audienceType:
                        event
                          .target
                          .value,
                      audienceValue:
                        '',
                    });

                    setSelectedStudentIds(
                      []
                    );
                  }}
                >
                  <option value="all">
                    All students
                  </option>

                  <option value="faculty">
                    Faculty
                  </option>

                  <option value="major">
                    Major
                  </option>

                  <option value="course">
                    Course
                  </option>

                  <option value="students">
                    Selected
                    students
                  </option>
                </select>
              </label>

              {form.audienceType ===
                'course' && (
                <label className="full">
                  Course *

                  <select
                    value={
                      form.audienceValue
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        audienceValue:
                          event
                            .target
                            .value,
                      })
                    }
                    required
                  >
                    <option value="">
                      Select one
                      of your
                      courses
                    </option>

                    {myCourses.map(
                      (
                        course
                      ) => (
                        <option
                          key={
                            course.id
                          }
                          value={
                            course.title
                          }
                        >
                          {
                            course.title
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}

              {form.audienceType ===
                'major' && (
                <label className="full">
                  Major *

                  <input
                    value={
                      form.audienceValue
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        audienceValue:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="e.g. Computer Engineering"
                    required
                  />
                </label>
              )}

              {form.audienceType ===
                'faculty' && (
                <label className="full">
                  Faculty *

                  <input
                    value={
                      form.audienceValue
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        audienceValue:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="e.g. Engineering and Information Technology"
                    required
                  />
                </label>
              )}

              {form.audienceType ===
                'students' && (
                <div className="full ta-student-picker">
                  <span>
                    Select
                    students * (
                    {
                      selectedStudentIds.length
                    }{' '}
                    selected)
                  </span>

                  <label className="ta-student-search">
                    <FiSearch />

                    <input
                      value={
                        studentQuery
                      }
                      onChange={(
                        event
                      ) =>
                        setStudentQuery(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Search your students"
                    />
                  </label>

                  <div className="ta-student-list">
                    {filteredRoster.map(
                      (
                        student
                      ) => (
                        <label
                          key={
                            student.id
                          }
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(
                              Number(
                                student.id
                              )
                            )}
                            onChange={() =>
                              toggleStudent(
                                student.id
                              )
                            }
                          />

                          {
                            student.name
                          }
                        </label>
                      )
                    )}

                    {!filteredRoster.length && (
                      <p className="ta-student-empty">
                        No students
                        match this
                        search.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <label className="full">
                Content *

                <textarea
                  value={
                    form.content
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      content:
                        event
                          .target
                          .value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Related link

                <input
                  value={
                    form.link
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      link:
                        event
                          .target
                          .value,
                    })
                  }
                  placeholder="/student-dashboard/competitions"
                />
              </label>

              <label>
                Schedule time

                <input
                  type="datetime-local"
                  value={
                    form.publishAt
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      publishAt:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </label>

              <label className="full">
                Attachment

                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp"
                  onChange={
                    handleAttachmentChange
                  }
                />

                {form.attachment && (
                  <small className="ta-attachment-hint">
                    {
                      form
                        .attachment
                        .name
                    }{' '}
                    (
                    {
                      form
                        .attachment
                        .size
                    }
                    )
                  </small>
                )}
              </label>
            </div>

            {formError && (
              <p className="ta-form-error">
                {formError}
              </p>
            )}

            <footer>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setEditorOpen(
                    false
                  )
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ghost"
                disabled={
                  saving
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save draft'}
              </button>

              <button
                type="button"
                className="schedule"
                disabled={
                  !form.publishAt ||
                  saving
                }
                onClick={() =>
                  save(
                    'schedule'
                  )
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Schedule'}
              </button>

              <button
                type="button"
                className="publish"
                disabled={
                  saving
                }
                onClick={() =>
                  save(
                    'publish'
                  )
                }
              >
                {saving
                  ? 'Publishing...'
                  : 'Publish now'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}