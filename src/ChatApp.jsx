import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiArrowLeft, FiCheck, FiEdit2, FiFileText, FiImage, FiMessageSquare,
  FiMoreVertical, FiPaperclip, FiPlay, FiPlus, FiSearch, FiSend, FiSlash,
  FiTrash2, FiUserCheck, FiUserX, FiX,
} from 'react-icons/fi';
import {
  MAX_ATTACHMENT_BYTES, MESSAGE_EDIT_WINDOW_MS,
  readFileAsAttachment, useStudentConversations, useTrainerConversations,
} from './SharedConversationsContext';
import './ChatApp.css';

const ACCEPTED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const ACCEPTED_ATTR = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4';

const initials = (name = '') => name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const timeLabel = (value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const sizeLabel = (bytes = 0) => (bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

function Avatar({ name, avatar, status }) {
  return (
    <span className="chat-avatar">
      {avatar ? <img src={avatar} alt="" /> : initials(name)}
      {status && <i className={status} />}
    </span>
  );
}

function AttachmentChip({ attachment, onPreview }) {
  const image = attachment.type?.startsWith('image/');
  const video = attachment.type?.startsWith('video/');
  return (
    <button type="button" className="chat-attachment" onClick={() => onPreview(attachment)}>
      {image ? <FiImage /> : video ? <FiPlay /> : <FiFileText />}
      <span><strong>{attachment.name}</strong><small>{sizeLabel(attachment.size)}</small></span>
    </button>
  );
}

function NewChatPanel({ directory, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const filtered = directory.filter((t) => `${t.name} ${t.specialty} ${t.course}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-newchat-panel" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Message an instructor</h3>
          <button type="button" onClick={onClose}><FiX /></button>
        </header>
        <label className="chat-search">
          <FiSearch />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by instructor, course, or specialty" />
        </label>
        <div className="chat-newchat-list">
          {filtered.map((t) => (
            <button type="button" key={t.email} onClick={() => onPick(t.email)}>
              <Avatar name={t.name} avatar={t.avatar} status={t.status} />
              <span>
                <strong>{t.name}</strong>
                <small>{t.specialty} · {t.course}</small>
              </span>
            </button>
          ))}
          {!filtered.length && <p className="chat-newchat-empty">No matching instructors.</p>}
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ attachment, onClose }) {
  const isImage = attachment.type?.startsWith('image/');
  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-preview-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose}><FiX /></button>
        <h3>{attachment.name}</h3>
        {isImage && attachment.dataUrl ? (
          <img src={attachment.dataUrl} alt={attachment.name} />
        ) : (
          <p>Preview isn't available for this file.{attachment.dataUrl && ' You can still download it below.'}</p>
        )}
        {attachment.dataUrl && (
          <a href={attachment.dataUrl} download={attachment.name} className="chat-preview-download">Download file</a>
        )}
      </div>
    </div>
  );
}

/**
 * Shared chat UI for both roles. `role` decides permissions (only a student
 * can start a new conversation; only a trainer sees the accept/decline
 * gate) — everything else, including the underlying data, is identical.
 */
export default function ChatApp({ role, currentUser }) {
  const isStudent = role === 'student';
  // eslint-disable-next-line react-hooks/rules-of-hooks -- `role` is fixed per mounted instance (Messages.jsx always passes 'student', TrainerMessages.jsx always passes 'trainer'), so which hook runs never changes across renders.
  const api = isStudent ? useStudentConversations(currentUser) : useTrainerConversations(currentUser);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [mobileThread, setMobileThread] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const [threadQuery, setThreadQuery] = useState('');
  const fileRef = useRef(null);
  const threadRef = useRef(null);

  const partyOf = (c) => (isStudent
    ? { name: c.contact?.name || 'Instructor', avatar: c.contact?.avatar, status: c.contact?.status, sub: c.contact?.specialty }
    : { name: c.studentName, avatar: c.studentAvatar, status: null, sub: c.topic });

  const isPending = (c) => !isStudent && !c.accepted && c.messages.length > 0;

  const sorted = useMemo(() => [...api.conversations].sort((a, b) => {
    const at = a.messages.at(-1)?.time || a.id;
    const bt = b.messages.at(-1)?.time || b.id;
    return new Date(bt) - new Date(at);
  }), [api.conversations]);

  const visible = sorted.filter((c) => {
    const p = partyOf(c);
    const matchesSearch = `${p.name} ${p.sub || ''}`.toLowerCase().includes(search.toLowerCase());
    const unread = isStudent ? c.unreadForStudent : c.unreadForTrainer;
    return matchesSearch && (filter !== 'unread' || unread > 0);
  });

  const totalUnread = api.conversations.reduce((sum, c) => sum + (isStudent ? c.unreadForStudent : c.unreadForTrainer), 0);
  const selected = api.conversations.find((c) => c.id === selectedId) || null;
  const selectedParty = selected ? partyOf(selected) : null;
  const selectedPending = selected ? isPending(selected) : false;

  const threadMessages = useMemo(() => {
    if (!selected) return [];
    if (!threadQuery.trim()) return selected.messages;
    const q = threadQuery.toLowerCase();
    return selected.messages.filter((m) => (m.text || '').toLowerCase().includes(q));
  }, [selected, threadQuery]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [selected?.id, selected?.messages?.length]);

  const openChat = (id) => {
    setSelectedId(id);
    api.openConversation(id);
    setMobileThread(true);
    setShowMenu(false);
    setShowThreadSearch(false);
    setThreadQuery('');
  };

  const addFiles = async (fileList) => {
    setError('');
    const valid = [];
    for (const file of [...fileList]) {
      if (!ACCEPTED_TYPES.includes(file.type)) { setError(`${file.name}: unsupported file type.`); continue; }
      if (file.size > MAX_ATTACHMENT_BYTES) { setError(`${file.name}: maximum size is 25 MB.`); continue; }
      // eslint-disable-next-line no-await-in-loop
      valid.push(await readFileAsAttachment(file));
    }
    setAttachments((current) => [...current, ...valid]);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!selected || selected.blockedBy) return;
    if (editingId) {
      if (draft.trim()) api.editMessage(selected.id, editingId, draft);
      setEditingId(null);
      setDraft('');
      return;
    }
    if (!draft.trim() && !attachments.length) return;
    api.sendMessage(selected.id, { text: draft, attachments });
    setDraft('');
    setAttachments([]);
  };

  const beginEdit = (message) => {
    setEditingId(message.id);
    setDraft(message.text);
  };
  const cancelEdit = () => { setEditingId(null); setDraft(''); };

  const handlePick = (email) => {
    const id = api.startConversation(email);
    openChat(id);
    setShowNewChat(false);
  };

  return (
    <div className="chat-app">
      <aside className={`chat-list-pane ${mobileThread ? 'mobile-hidden' : ''}`}>
        <header className="chat-list-head">
          <div>
            <h1>{isStudent ? 'Messages' : 'Student messages'}</h1>
            <p>{isStudent ? 'Message instructors connected to your courses.' : 'Reply to students from your courses.'}</p>
          </div>
          {isStudent && (
            <button type="button" className="chat-new-button" onClick={() => setShowNewChat(true)}>
              <FiPlus /> New
            </button>
          )}
        </header>

        <label className="chat-search">
          <FiSearch />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" />
        </label>

        <div className="chat-filter-tabs">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button type="button" className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
            Unread {totalUnread > 0 && <b>{totalUnread}</b>}
          </button>
        </div>

        <div className="chat-list-items">
          {visible.map((c) => {
            const p = partyOf(c);
            const unread = isStudent ? c.unreadForStudent : c.unreadForTrainer;
            const pending = isPending(c);
            const last = c.messages.at(-1);
            return (
              <button
                type="button"
                key={c.id}
                className={`chat-list-item ${selectedId === c.id ? 'active' : ''} ${pending ? 'is-pending' : ''}`}
                onClick={() => openChat(c.id)}
              >
                <Avatar name={p.name} avatar={p.avatar} status={p.status} />
                <span className="chat-list-item-copy">
                  <strong>{p.name}{last && <time>{timeLabel(last.time)}</time>}</strong>
                  <span>{last?.deleted ? 'Message deleted' : last?.text || (last?.attachments?.length ? 'Attachment' : 'Say hello 👋')}</span>
                  <small>{p.sub}</small>
                </span>
                {pending && <b className="chat-badge pending">New</b>}
                {!pending && unread > 0 && <b className="chat-badge">{unread}</b>}
              </button>
            );
          })}
          {!visible.length && (
            <div className="chat-list-empty">
              <FiMessageSquare />
              <p>{isStudent ? 'No conversations yet — start one with an instructor.' : 'No student has messaged you yet.'}</p>
            </div>
          )}
        </div>
      </aside>

      <section className={`chat-thread-pane ${mobileThread ? '' : 'mobile-hidden'}`}>
        {!selected ? (
          <div className="chat-thread-empty">
            <FiMessageSquare />
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to see the full thread.</p>
          </div>
        ) : (
          <>
            <header className="chat-thread-head">
              <button type="button" className="chat-thread-back" onClick={() => setMobileThread(false)}><FiArrowLeft /></button>
              <Avatar name={selectedParty.name} avatar={selectedParty.avatar} status={selectedParty.status} />
              <div className="chat-thread-identity">
                <h2>{selectedParty.name}</h2>
                <p>{selectedParty.sub}</p>
              </div>
              <div className="chat-thread-menu">
                <button type="button" onClick={() => setShowMenu((v) => !v)}><FiMoreVertical /></button>
                {showMenu && (
                  <div className="chat-thread-menu-list">
                    <button type="button" onClick={() => { setShowThreadSearch((v) => !v); setShowMenu(false); }}><FiSearch /> Search in thread</button>
                    <button type="button" onClick={() => { api.toggleBlock(selected.id); setShowMenu(false); }}>
                      <FiSlash /> {selected.blockedBy ? 'Unblock' : 'Block conversation'}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => { if (window.confirm('Clear all messages in this conversation?')) api.clearConversation(selected.id); setShowMenu(false); }}
                    >
                      <FiTrash2 /> Clear conversation
                    </button>
                  </div>
                )}
              </div>
            </header>

            {showThreadSearch && (
              <label className="chat-thread-search">
                <FiSearch />
                <input autoFocus value={threadQuery} onChange={(e) => setThreadQuery(e.target.value)} placeholder="Search inside this conversation" />
                <button type="button" onClick={() => { setShowThreadSearch(false); setThreadQuery(''); }}><FiX /></button>
              </label>
            )}

            <div className="chat-thread-topic"><FiFileText /> {selected.topic}</div>

            <div className="chat-messages" ref={threadRef}>
              {threadMessages.map((message) => {
                const mine = message.sender === role;
                const editable = mine && !message.deleted && Date.now() - new Date(message.time).getTime() <= MESSAGE_EDIT_WINDOW_MS;
                return (
                  <div className={`chat-message-row ${mine ? 'mine' : 'theirs'}`} key={message.id}>
                    <div className={`chat-bubble ${message.deleted ? 'deleted' : ''}`}>
                      {message.deleted ? (
                        <em>Message deleted</em>
                      ) : (
                        <>
                          <p>{message.text}</p>
                          {(message.attachments || []).map((a) => (
                            <AttachmentChip key={a.id} attachment={a} onPreview={setPreview} />
                          ))}
                        </>
                      )}
                      <footer>
                        <time>{timeLabel(message.time)}</time>
                        {message.editedAt && <span>Edited</span>}
                        {mine && !message.deleted && <span>{message.read ? <><FiCheck /><FiCheck /></> : <FiCheck />}</span>}
                      </footer>
                    </div>
                    {editable && (
                      <div className="chat-message-tools">
                        <button type="button" onClick={() => beginEdit(message)}><FiEdit2 /> Edit</button>
                        <button type="button" onClick={() => api.deleteMessage(selected.id, message.id)}><FiTrash2 /> Delete</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selected.blockedBy ? (
              <div className="chat-locked">
                This conversation is blocked.
                <button type="button" onClick={() => api.toggleBlock(selected.id)}>Unblock</button>
              </div>
            ) : selectedPending ? (
              <div className="chat-request-banner">
                <div>
                  <strong>New message request</strong>
                  <p>{selectedParty.name} messaged you for the first time. Accept to start replying.</p>
                </div>
                <div className="chat-request-actions">
                  <button type="button" className="decline" onClick={() => api.declineConversation(selected.id)}><FiUserX /> Decline</button>
                  <button type="button" className="accept" onClick={() => api.acceptConversation(selected.id)}><FiUserCheck /> Accept</button>
                </div>
              </div>
            ) : (
              <form className="chat-composer" onSubmit={submit}>
                {editingId && (
                  <div className="chat-composer-context">
                    <span>Editing message</span>
                    <button type="button" onClick={cancelEdit}><FiX /></button>
                  </div>
                )}
                {attachments.length > 0 && (
                  <div className="chat-composer-files">
                    {attachments.map((file) => (
                      <span key={file.id}>
                        <FiFileText /> {file.name}
                        <button type="button" onClick={() => setAttachments((items) => items.filter((i) => i.id !== file.id))}><FiX /></button>
                      </span>
                    ))}
                  </div>
                )}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
                  placeholder="Write a message…"
                  rows={1}
                />
                <input ref={fileRef} type="file" multiple hidden accept={ACCEPTED_ATTR} onChange={(e) => addFiles(e.target.files)} />
                <button type="button" className="chat-attach-btn" title="Attach a file" onClick={() => fileRef.current?.click()}>
                  <FiPaperclip />
                </button>
                <button type="submit" className="chat-send-btn" disabled={!draft.trim() && !attachments.length}>
                  <FiSend />
                </button>
                {error && <p className="chat-composer-error">{error}</p>}
              </form>
            )}
          </>
        )}
      </section>

      {isStudent && showNewChat && (
        <NewChatPanel directory={api.directory} onPick={handlePick} onClose={() => setShowNewChat(false)} />
      )}

      {preview && <PreviewModal attachment={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
