import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiFileText,
  FiImage,
  FiMessageSquare,
  FiMoreVertical,
  FiPaperclip,
  FiPlay,
  FiPlus,
  FiSearch,
  FiSend,
  FiSlash,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiX,
} from 'react-icons/fi';
import {
  MAX_ATTACHMENT_BYTES,
  MESSAGE_EDIT_WINDOW_MS,
  readFileAsAttachment,
  useTrainerConversations,
} from './SharedConversationsContext';
import {
  useStudentConversations,
} from './useStudentMessages';
import './ChatApp.css';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
];

const ACCEPTED_ATTR =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const timeLabel = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString(
    'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

const sizeLabel = (bytes = 0) =>
  bytes < 1024 * 1024
    ? `${Math.max(
        1,
        Math.ceil(bytes / 1024)
      )} KB`
    : `${(
        bytes /
        1024 /
        1024
      ).toFixed(1)} MB`;

function Avatar({
  name,
  avatar,
  status,
}) {
  return (
    <span className="chat-avatar">
      {avatar ? (
        <img
          src={avatar}
          alt=""
        />
      ) : (
        initials(name)
      )}

      {status && (
        <i className={status} />
      )}
    </span>
  );
}

function AttachmentChip({
  attachment,
  onPreview,
}) {
  const image =
    attachment.type?.startsWith(
      'image/'
    );

  const video =
    attachment.type?.startsWith(
      'video/'
    );

  return (
    <button
      type="button"
      className="chat-attachment"
      onClick={() =>
        onPreview(attachment)
      }
    >
      {image ? (
        <FiImage />
      ) : video ? (
        <FiPlay />
      ) : (
        <FiFileText />
      )}

      <span>
        <strong>
          {attachment.name}
        </strong>

        <small>
          {sizeLabel(
            attachment.size
          )}
        </small>
      </span>
    </button>
  );
}

function NewChatPanel({
  directory,
  onPick,
  onClose,
  busy,
}) {
  const [query, setQuery] =
    useState('');

  const filtered = directory.filter(
    (person) =>
      `${person.name} ${person.role || ''} ${person.specialty || ''} ${person.course || ''}`
        .toLowerCase()
        .includes(
          query.toLowerCase()
        )
  );

  return (
    <div
      className="chat-overlay"
      onClick={onClose}
    >
      <div
        className="chat-newchat-panel"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header>
          <h3>
            Start a new conversation
          </h3>

          <button
            type="button"
            onClick={onClose}
          >
            <FiX />
          </button>
        </header>

        <label className="chat-search">
          <FiSearch />

          <input
            autoFocus
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Search students or instructors"
          />
        </label>

        <div className="chat-newchat-list">
          {filtered.map(
            (person) => (
              <button
                type="button"
                key={
                  person.recipient_user_id ??
                  person.user_id ??
                  person.email
                }
                disabled={busy}
                onClick={() =>
                  onPick(
                    person.recipient_user_id ??
                      person.user_id
                  )
                }
              >
                <Avatar
                  name={person.name}
                  avatar={
                    person.avatar
                  }
                  status={
                    person.status
                  }
                />

                <span>
                  <strong>
                    {person.name}
                  </strong>

                  <small>
                    {person.role}
                    {person.specialty
                      ? ` · ${person.specialty}`
                      : ''}
                    {person.course
                      ? ` · ${person.course}`
                      : ''}
                  </small>
                </span>
              </button>
            )
          )}

          {!filtered.length && (
            <p className="chat-newchat-empty">
              No matching
              people.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  attachment,
  onClose,
}) {
  const isImage =
    attachment.type?.startsWith(
      'image/'
    );

  return (
    <div
      className="chat-overlay"
      onClick={onClose}
    >
      <div
        className="chat-preview-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={onClose}
        >
          <FiX />
        </button>

        <h3>{attachment.name}</h3>

        {isImage &&
        attachment.dataUrl ? (
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
          />
        ) : (
          <p>
            Preview isn't available
            for this file.
            {attachment.dataUrl &&
              ' You can still download it below.'}
          </p>
        )}

        {attachment.dataUrl && (
          <a
            href={attachment.dataUrl}
            download={attachment.name}
            className="chat-preview-download"
          >
            Download file
          </a>
        )}
      </div>
    </div>
  );
}

export default function ChatApp({
  role,
  currentUser,
}) {
  const isStudent =
    role === 'student';

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const api = isStudent
    ? useStudentConversations(
        currentUser
      )
    : useTrainerConversations(
        currentUser
      );

  const [search, setSearch] =
    useState('');

  const [filter, setFilter] =
    useState('all');

  const [
    selectedId,
    setSelectedId,
  ] = useState(null);

  const [
    mobileThread,
    setMobileThread,
  ] = useState(false);

  const [
    showNewChat,
    setShowNewChat,
  ] = useState(false);

  const [draft, setDraft] =
    useState('');

  const [
    attachments,
    setAttachments,
  ] = useState([]);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [error, setError] =
    useState('');

  const [preview, setPreview] =
    useState(null);

  const [showMenu, setShowMenu] =
    useState(false);

  const [
    showThreadSearch,
    setShowThreadSearch,
  ] = useState(false);

  const [
    threadQuery,
    setThreadQuery,
  ] = useState('');

  const [sending, setSending] =
    useState(false);

  const [
    startingChat,
    setStartingChat,
  ] = useState(false);

  const fileRef = useRef(null);
  const threadRef = useRef(null);

  const partyOf = (conversation) =>
    isStudent
      ? {
          name:
            conversation.contact
              ?.name ||
            'Instructor',
          avatar:
            conversation.contact
              ?.avatar,
          status:
            conversation.contact
              ?.status,
          sub:
            conversation.contact
              ?.specialty,
        }
      : {
          name:
            conversation.studentName,
          avatar:
            conversation.studentAvatar,
          status: null,
          sub: conversation.topic,
        };

  const isPending = (
    conversation
  ) =>
    !isStudent &&
    !conversation.accepted &&
    conversation.messages.length >
      0;

  const sorted = useMemo(
    () =>
      [...api.conversations].sort(
        (a, b) => {
          const at =
            a.messages.at(-1)
              ?.time ||
            a.id;

          const bt =
            b.messages.at(-1)
              ?.time ||
            b.id;

          return (
            new Date(bt) -
            new Date(at)
          );
        }
      ),
    [api.conversations]
  );

  const visible = sorted.filter(
    (conversation) => {
      const party =
        partyOf(conversation);

      const matchesSearch =
        `${party.name} ${
          party.sub || ''
        }`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const unread = isStudent
        ? conversation.unreadForStudent
        : conversation.unreadForTrainer;

      return (
        matchesSearch &&
        (filter !== 'unread' ||
          unread > 0)
      );
    }
  );

  const totalUnread =
    api.conversations.reduce(
      (sum, conversation) =>
        sum +
        (isStudent
          ? conversation.unreadForStudent
          : conversation.unreadForTrainer),
      0
    );

  const selected =
    api.conversations.find(
      (conversation) =>
        conversation.id ===
        selectedId
    ) || null;

  const selectedParty = selected
    ? partyOf(selected)
    : null;

  const selectedPending = selected
    ? isPending(selected)
    : false;

  const threadMessages =
    useMemo(() => {
      if (!selected) {
        return [];
      }

      if (!threadQuery.trim()) {
        return selected.messages;
      }

      const query =
        threadQuery.toLowerCase();

      return selected.messages.filter(
        (message) =>
          (message.text || '')
            .toLowerCase()
            .includes(query)
      );
    }, [selected, threadQuery]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop =
        threadRef.current
          .scrollHeight;
    }
  }, [
    selected?.id,
    selected?.messages?.length,
  ]);

  useEffect(() => {
    if (
      selectedId &&
      !api.conversations.some(
        (conversation) =>
          conversation.id ===
          selectedId
      )
    ) {
      setSelectedId(null);
      setMobileThread(false);
    }
  }, [
    api.conversations,
    selectedId,
  ]);

  const openChat = async (id) => {
    setSelectedId(id);
    setMobileThread(true);
    setShowMenu(false);
    setShowThreadSearch(false);
    setThreadQuery('');
    setError('');

    try {
      await api.openConversation(id);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to open the conversation.'
      );
    }
  };

  const addFiles = async (
    fileList
  ) => {
    setError('');

    const valid = [];

    for (const file of [
      ...fileList,
    ]) {
      if (
        !ACCEPTED_TYPES.includes(
          file.type
        )
      ) {
        setError(
          `${file.name}: unsupported file type.`
        );

        continue;
      }

      if (
        file.size >
        MAX_ATTACHMENT_BYTES
      ) {
        setError(
          `${file.name}: maximum size is 25 MB.`
        );

        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const attachment =
        await readFileAsAttachment(
          file
        );

      valid.push({
        ...attachment,
        file,
      });
    }

    setAttachments((current) => [
      ...current,
      ...valid,
    ]);

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const submit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !selected ||
      selected.blockedBy ||
      sending
    ) {
      return;
    }

    setError('');

    try {
      setSending(true);

      if (editingId) {
        if (draft.trim()) {
          await api.editMessage(
            selected.id,
            editingId,
            draft
          );
        }

        setEditingId(null);
        setDraft('');

        return;
      }

      if (
        !draft.trim() &&
        !attachments.length
      ) {
        return;
      }

      await api.sendMessage(
        selected.id,
        {
          text: draft,
          attachments,
        }
      );

      setDraft('');
      setAttachments([]);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Message could not be sent.'
      );
    } finally {
      setSending(false);
    }
  };

  const beginEdit = (
    message
  ) => {
    setEditingId(message.id);
    setDraft(message.text);
    setAttachments([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft('');
  };

  const handlePick = async (
    recipientUserId
  ) => {
    if (startingChat) {
      return;
    }

    setError('');

    try {
      setStartingChat(true);

      const conversation =
        await api.startConversation(
          recipientUserId
        );

      if (conversation?.id) {
        setSelectedId(
          conversation.id
        );

        setMobileThread(true);
        setShowMenu(false);
        setShowThreadSearch(
          false
        );
        setThreadQuery('');

        await api.openConversation(
          conversation.id
        );
      }

      setShowNewChat(false);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to start the conversation.'
      );
    } finally {
      setStartingChat(false);
    }
  };

  const handleDeleteMessage =
    async (messageId) => {
      if (!selected) {
        return;
      }

      if (
        !window.confirm(
          'Delete this message?'
        )
      ) {
        return;
      }

      setError('');

      try {
        await api.deleteMessage(
          selected.id,
          messageId
        );

        if (
          editingId === messageId
        ) {
          cancelEdit();
        }
      } catch (requestError) {
        setError(
          requestError.message ||
            'Message could not be deleted.'
        );
      }
    };

  const handleToggleBlock =
    async () => {
      if (!selected) {
        return;
      }

      setShowMenu(false);
      setError('');

      try {
        await api.toggleBlock(
          selected.id
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            'Conversation block status could not be updated.'
        );
      }
    };

  const handleClearConversation =
    async () => {
      if (!selected) {
        return;
      }

      if (
        !window.confirm(
          'Clear all messages in this conversation from your view?'
        )
      ) {
        return;
      }

      setShowMenu(false);
      setError('');

      try {
        await api.clearConversation(
          selected.id
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            'Conversation could not be cleared.'
        );
      }
    };

  return (
    <div className="chat-app">
      <aside
        className={`chat-list-pane ${
          mobileThread
            ? 'mobile-hidden'
            : ''
        }`}
      >
        <header className="chat-list-head">
          <div>
            <h1>
              {isStudent
                ? 'Messages'
                : 'Student messages'}
            </h1>

            <p>
              {isStudent
                ? 'Message any student, or contact instructors from your courses.'
                : 'Reply to students from your courses.'}
            </p>
          </div>

          {isStudent && (
            <button
              type="button"
              className="chat-new-button"
              onClick={() =>
                setShowNewChat(
                  true
                )
              }
            >
              <FiPlus />
              New
            </button>
          )}
        </header>

        {(api.error || error) && (
          <div className="chat-composer-error">
            {error || api.error}
          </div>
        )}

        <label className="chat-search">
          <FiSearch />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search conversations"
          />
        </label>

        <div className="chat-filter-tabs">
          <button
            type="button"
            className={
              filter === 'all'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFilter('all')
            }
          >
            All
          </button>

          <button
            type="button"
            className={
              filter === 'unread'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFilter('unread')
            }
          >
            Unread
            {totalUnread > 0 && (
              <b>{totalUnread}</b>
            )}
          </button>
        </div>

        <div className="chat-list-items">
          {api.loading &&
          !visible.length ? (
            <div className="chat-list-empty">
              <FiMessageSquare />
              <p>
                Loading
                conversations...
              </p>
            </div>
          ) : (
            visible.map(
              (conversation) => {
                const party =
                  partyOf(
                    conversation
                  );

                const unread =
                  isStudent
                    ? conversation.unreadForStudent
                    : conversation.unreadForTrainer;

                const pending =
                  isPending(
                    conversation
                  );

                const last =
                  conversation.messages.at(
                    -1
                  );

                return (
                  <button
                    type="button"
                    key={
                      conversation.id
                    }
                    className={`chat-list-item ${
                      selectedId ===
                      conversation.id
                        ? 'active'
                        : ''
                    } ${
                      pending
                        ? 'is-pending'
                        : ''
                    }`}
                    onClick={() =>
                      openChat(
                        conversation.id
                      )
                    }
                  >
                    <Avatar
                      name={
                        party.name
                      }
                      avatar={
                        party.avatar
                      }
                      status={
                        party.status
                      }
                    />

                    <span className="chat-list-item-copy">
                      <strong>
                        {party.name}

                        {last && (
                          <time>
                            {timeLabel(
                              last.time
                            )}
                          </time>
                        )}
                      </strong>

                      <span>
                        {last?.deleted
                          ? 'Message deleted'
                          : last?.text ||
                            (last
                              ?.attachments
                              ?.length
                              ? 'Attachment'
                              : 'Say hello 👋')}
                      </span>

                      <small>
                        {party.sub}
                      </small>
                    </span>

                    {pending && (
                      <b className="chat-badge pending">
                        New
                      </b>
                    )}

                    {!pending &&
                      unread > 0 && (
                        <b className="chat-badge">
                          {unread}
                        </b>
                      )}
                  </button>
                );
              }
            )
          )}

          {!api.loading &&
            !visible.length && (
              <div className="chat-list-empty">
                <FiMessageSquare />

                <p>
                  {isStudent
                    ? 'No conversations yet — start one with an instructor.'
                    : 'No student has messaged you yet.'}
                </p>
              </div>
            )}
        </div>
      </aside>

      <section
        className={`chat-thread-pane ${
          mobileThread
            ? ''
            : 'mobile-hidden'
        }`}
      >
        {!selected ? (
          <div className="chat-thread-empty">
            <FiMessageSquare />

            <h3>
              Select a conversation
            </h3>

            <p>
              Choose a conversation
              from the list to see
              the full thread.
            </p>
          </div>
        ) : (
          <>
            <header className="chat-thread-head">
              <button
                type="button"
                className="chat-thread-back"
                onClick={() =>
                  setMobileThread(
                    false
                  )
                }
              >
                <FiArrowLeft />
              </button>

              <Avatar
                name={
                  selectedParty.name
                }
                avatar={
                  selectedParty.avatar
                }
                status={
                  selectedParty.status
                }
              />

              <div className="chat-thread-identity">
                <h2>
                  {
                    selectedParty.name
                  }
                </h2>

                <p>
                  {selectedParty.sub}
                </p>
              </div>

              <div className="chat-thread-menu">
                <button
                  type="button"
                  onClick={() =>
                    setShowMenu(
                      (value) =>
                        !value
                    )
                  }
                >
                  <FiMoreVertical />
                </button>

                {showMenu && (
                  <div className="chat-thread-menu-list">
                    <button
                      type="button"
                      onClick={() => {
                        setShowThreadSearch(
                          (value) =>
                            !value
                        );

                        setShowMenu(
                          false
                        );
                      }}
                    >
                      <FiSearch />
                      Search in thread
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleToggleBlock
                      }
                    >
                      <FiSlash />
                      {selected.blockedBy
                        ? 'Unblock'
                        : 'Block conversation'}
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={
                        handleClearConversation
                      }
                    >
                      <FiTrash2 />
                      Clear conversation
                    </button>
                  </div>
                )}
              </div>
            </header>

            {showThreadSearch && (
              <label className="chat-thread-search">
                <FiSearch />

                <input
                  autoFocus
                  value={
                    threadQuery
                  }
                  onChange={(event) =>
                    setThreadQuery(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search inside this conversation"
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowThreadSearch(
                      false
                    );

                    setThreadQuery(
                      ''
                    );
                  }}
                >
                  <FiX />
                </button>
              </label>
            )}

            <div className="chat-thread-topic">
              <FiFileText />
              {selected.topic}
            </div>

            <div
              className="chat-messages"
              ref={threadRef}
            >
              {threadMessages.map(
                (message) => {
                  const mine =
                    message.sender ===
                    role;

                  const editable =
  mine &&
  !message.deleted &&
  message.canEdit === true;

                  return (
                    <div
                      className={`chat-message-row ${
                        mine
                          ? 'mine'
                          : 'theirs'
                      }`}
                      key={message.id}
                    >
                      <div
                        className={`chat-bubble ${
                          message.deleted
                            ? 'deleted'
                            : ''
                        }`}
                      >
                        {message.deleted ? (
                          <em>
                            Message
                            deleted
                          </em>
                        ) : (
                          <>
                            {message.text && (
                              <p>
                                {
                                  message.text
                                }
                              </p>
                            )}

                            {(
                              message.attachments ||
                              []
                            ).map(
                              (
                                attachment
                              ) => (
                                <AttachmentChip
                                  key={
                                    attachment.id
                                  }
                                  attachment={
                                    attachment
                                  }
                                  onPreview={
                                    setPreview
                                  }
                                />
                              )
                            )}
                          </>
                        )}

                        <footer>
                          <time>
                            {timeLabel(
                              message.time
                            )}
                          </time>

                          {message.editedAt && (
                            <span>
                              Edited
                            </span>
                          )}

                          {mine &&
                            !message.deleted && (
                              <span>
                                {message.read ? (
                                  <>
                                    <FiCheck />
                                    <FiCheck />
                                  </>
                                ) : (
                                  <FiCheck />
                                )}
                              </span>
                            )}
                        </footer>
                      </div>

                      {editable && (
                        <div className="chat-message-tools">
                          <button
                            type="button"
                            onClick={() =>
                              beginEdit(
                                message
                              )
                            }
                          >
                            <FiEdit2 />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteMessage(
                                message.id
                              )
                            }
                          >
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {selected.blockedBy ? (
              <div className="chat-locked">
                This conversation is
                blocked.

                <button
                  type="button"
                  onClick={
                    handleToggleBlock
                  }
                >
                  {selected.blockedBy ===
                  'student'
                    ? 'Unblock'
                    : 'Blocked by other user'}
                </button>
              </div>
            ) : selectedPending ? (
              <div className="chat-request-banner">
                <div>
                  <strong>
                    New message
                    request
                  </strong>

                  <p>
                    {
                      selectedParty.name
                    }{' '}
                    messaged you for
                    the first time.
                    Accept to start
                    replying.
                  </p>
                </div>

                <div className="chat-request-actions">
                  <button
                    type="button"
                    className="decline"
                    onClick={() =>
                      api.declineConversation(
                        selected.id
                      )
                    }
                  >
                    <FiUserX />
                    Decline
                  </button>

                  <button
                    type="button"
                    className="accept"
                    onClick={() =>
                      api.acceptConversation(
                        selected.id
                      )
                    }
                  >
                    <FiUserCheck />
                    Accept
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="chat-composer"
                onSubmit={submit}
              >
                {editingId && (
                  <div className="chat-composer-context">
                    <span>
                      Editing message
                    </span>

                    <button
                      type="button"
                      onClick={
                        cancelEdit
                      }
                    >
                      <FiX />
                    </button>
                  </div>
                )}

                {attachments.length >
                  0 && (
                  <div className="chat-composer-files">
                    {attachments.map(
                      (file) => (
                        <span
                          key={
                            file.id
                          }
                        >
                          <FiFileText />
                          {file.name}

                          <button
                            type="button"
                            onClick={() =>
                              setAttachments(
                                (
                                  items
                                ) =>
                                  items.filter(
                                    (
                                      item
                                    ) =>
                                      item.id !==
                                      file.id
                                  )
                              )
                            }
                          >
                            <FiX />
                          </button>
                        </span>
                      )
                    )}
                  </div>
                )}

                <textarea
                  value={draft}
                  onChange={(event) =>
                    setDraft(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        'Enter' &&
                      !event.shiftKey
                    ) {
                      submit(
                        event
                      );
                    }
                  }}
                  placeholder="Write a message…"
                  rows={1}
                  disabled={sending}
                />

                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  hidden
                  accept={
                    ACCEPTED_ATTR
                  }
                  onChange={(event) =>
                    addFiles(
                      event.target
                        .files
                    )
                  }
                />

                {!editingId && (
                  <button
                    type="button"
                    className="chat-attach-btn"
                    title="Attach a file"
                    disabled={sending}
                    onClick={() =>
                      fileRef.current?.click()
                    }
                  >
                    <FiPaperclip />
                  </button>
                )}

                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={
                    sending ||
                    (!draft.trim() &&
                      !attachments.length)
                  }
                >
                  <FiSend />
                </button>

                {error && (
                  <p className="chat-composer-error">
                    {error}
                  </p>
                )}
              </form>
            )}
          </>
        )}
      </section>

      {isStudent &&
        showNewChat && (
          <NewChatPanel
            directory={
              api.directory
            }
            onPick={handlePick}
            onClose={() =>
              setShowNewChat(
                false
              )
            }
            busy={startingChat}
          />
        )}

      {preview && (
        <PreviewModal
          attachment={preview}
          onClose={() =>
            setPreview(null)
          }
        />
      )}
    </div>
  );
}
