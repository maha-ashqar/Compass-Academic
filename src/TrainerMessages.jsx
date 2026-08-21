import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiArrowLeft, FiCheck, FiFile, FiFileText,
  FiImage, FiMessageSquare, FiMic, FiPaperclip, FiPlay, FiSearch, FiSend,
  FiSquare, FiTrash2, FiUserCheck, FiUserX, FiX,
} from 'react-icons/fi';
import { useTrainerMessages } from './TrainerMessagesContext';
import './TrainerMessages.css';

/* ============================================================
   Trainer Messages
   Same architecture and visual language as the student-side
   Messages component (directory -> full-screen inbox takeover,
   same navy/blue/cyan brand tokens via the --dashboard-* CSS
   variables), adapted for the trainer's needs:
     - Accept / decline gate for a student's first message
       (tracked locally — no backend field required)
     - Voice-note recording in the composer
     - File attachments (already supported, now with a size cap)
   ============================================================ */

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_TYPES = [
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png', 'image/webp', 'video/mp4',
];
const ACCEPTED_ATTR = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4';
const ACCEPTED_SET_KEY = 'compass_trainer_accepted_conversations_v1';

const AUTO_REPLY_HINTS = [
  'Thank you, I will review it and get back to you.',
  'Understood — I will check the instructions and reply shortly.',
  'Got the file, reviewing it now.',
];

const initials = (name = '') => name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const timeLabel = (value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const sizeLabel = (bytes = 0) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const durationLabel = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const readAcceptedSet = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(ACCEPTED_SET_KEY));
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
};

// A conversation is a "request" until the trainer has replied at least
// once, or has explicitly accepted it. This needs no backend field —
// it falls back to true the moment the trainer sends a message.
const isPendingRequest = (conversation, acceptedIds) => {
  if (!conversation) return false;
  if (conversation.blocked) return false;
  if (acceptedIds.has(conversation.id)) return false;
  const messages = conversation.messages || [];
  return messages.length > 0 && messages.every((m) => m.sender !== 'me');
};

function Avatar({ contact, size = '' }) {
  return (
    <span className={`trainer-chat-avatar ${size}`}>
      {contact.avatar ? <img src={contact.avatar} alt="" /> : initials(contact.name)}
      <i className={contact.status || 'offline'} aria-hidden="true" />
    </span>
  );
}

function Attachment({ attachment, onPreview }) {
  if (attachment.kind === 'voice' || attachment.type?.startsWith('audio/')) {
    return (
      <div className="trainer-chat-voice-note">
        <audio controls src={attachment.url} preload="metadata" />
      </div>
    );
  }
  const image = attachment.type?.startsWith('image/');
  const video = attachment.type?.startsWith('video/');
  return (
    <button type="button" className="trainer-chat-file" onClick={() => onPreview(attachment)}>
      {image ? <FiImage /> : video ? <FiPlay /> : <FiFileText />}
      <span><strong>{attachment.name}</strong><small>{sizeLabel(attachment.size)}</small></span>
    </button>
  );
}

/* ---------- Directory: browse every student conversation ---------- */

function Directory({ conversations, acceptedIds, onOpen, onAccept, onDecline }) {
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [pendingOnly, setPendingOnly] = useState(false);

  const courses = useMemo(() => [...new Set(conversations.map((c) => c.course).filter(Boolean))], [conversations]);
  const pendingCount = conversations.filter((c) => isPendingRequest(c, acceptedIds)).length;
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const onlineCount = conversations.filter((c) => c.status === 'online').length;

  const filtered = conversations.filter((c) => {
    const haystack = `${c.name} ${c.course || ''}`.toLowerCase();
    if (!haystack.includes(query.toLowerCase())) return false;
    if (course !== 'all' && c.course !== course) return false;
    if (availability !== 'all' && c.status !== availability) return false;
    if (pendingOnly && !isPendingRequest(c, acceptedIds)) return false;
    return true;
  });

  return (
    <main className="trainer-chat-page" dir="ltr">
      <header className="trainer-chat-page-head">
        <div>
          <small>Academic communication</small>
          <h1>Student messages</h1>
          <p>Reply to students, accept new conversations, and share files or voice notes to answer their questions.</p>
        </div>
      </header>

      <section className="trainer-chat-summary">
        <div>
          <small>Who's messaging you?</small>
          <strong>Students from your enrolled courses</strong>
          <span>Every conversation below comes from a student in one of your courses.</span>
        </div>
        <dl>
          <div><dt>Students</dt><dd>{conversations.length}</dd></div>
          <div><dt>Online now</dt><dd>{onlineCount}</dd></div>
          <div><dt>Pending requests</dt><dd>{pendingCount}</dd></div>
          <div><dt>Unread</dt><dd>{unreadCount}</dd></div>
        </dl>
      </section>

      <section className="trainer-chat-filters">
        <label>
          <FiSearch />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by student or course" />
        </label>
        <select value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="all">All courses</option>
          {courses.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
          <option value="all">Availability</option>
          <option value="online">Online</option>
          <option value="away">Away</option>
          <option value="offline">Offline</option>
        </select>
        <button
          type="button"
          className={`trainer-chat-pending-toggle ${pendingOnly ? 'active' : ''}`}
          onClick={() => setPendingOnly((v) => !v)}
        >
          Pending only {pendingCount > 0 && <b>{pendingCount}</b>}
        </button>
      </section>

      <div className="trainer-chat-section-title">
        <h2>Conversations</h2>
        <span>{filtered.length} students</span>
      </div>

      <section className="trainer-chat-list">
        {filtered.map((contact) => {
          const pending = isPendingRequest(contact, acceptedIds);
          const last = contact.messages?.at(-1);
          return (
            <div className={`trainer-chat-row ${pending ? 'is-pending' : ''}`} key={contact.id}>
              <button type="button" className="trainer-chat-row-main" onClick={() => onOpen(contact.id)}>
                <Avatar contact={contact} />
                <span className="trainer-chat-row-copy">
                  <span className="trainer-chat-row-top">
                    <strong>{contact.name}</strong>
                    {pending && <em className="trainer-chat-request-tag">New request</em>}
                    {!pending && contact.unreadCount > 0 && <b className="trainer-chat-unread">{contact.unreadCount}</b>}
                  </span>
                  <span className="trainer-chat-row-meta">
                    <em>{contact.course || 'General'}</em>
                    <span>{last?.deleted ? 'Message deleted' : last?.text || 'No messages yet'}</span>
                  </span>
                </span>
              </button>
              {pending ? (
                <span className="trainer-chat-row-actions">
                  <button type="button" className="decline" onClick={() => onDecline(contact.id)}><FiUserX /> Decline</button>
                  <button type="button" className="accept" onClick={() => onAccept(contact.id)}><FiUserCheck /> Accept</button>
                </span>
              ) : (
                <button type="button" className="trainer-chat-row-cta" onClick={() => onOpen(contact.id)}>Open <FiArrowLeft /></button>
              )}
            </div>
          );
        })}
        {!filtered.length && (
          <div className="trainer-chat-empty">
            <FiSearch />
            <h3>No matching conversations</h3>
            <p>Clear the filters and try again.</p>
          </div>
        )}
      </section>
    </main>
  );
}

/* ---------- Inbox: the full-screen two-pane conversation workspace ---------- */

function ConversationWorkspace({ conversations, selectedId, acceptedIds, onSelect, onAccept, onDecline, onBack }) {
  const { drafts, typingIds, markRead, saveDraft, sendMessage, receiveAutoReply, setTyping, deleteMessage, clearConversation, toggleBlock } = useTrainerMessages();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [mobileShowThread, setMobileShowThread] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const fileRef = useRef(null);
  const threadRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  // Mirrors recordSeconds so the recorder's onstop closure (captured once,
  // when recording starts) can always read the latest elapsed time.
  const recordSecondsRef = useRef(0);
  useEffect(() => { recordSecondsRef.current = recordSeconds; }, [recordSeconds]);

  const selected = conversations.find((c) => c.id === selectedId) || conversations[0];
  const draft = selected ? drafts[selected.id] || '' : '';
  const pending = isPendingRequest(selected, acceptedIds);

  const visible = useMemo(() => conversations.filter((item) => {
    const matches = `${item.name} ${item.course || ''}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter !== 'unread' || item.unreadCount > 0);
  }), [conversations, query, filter]);

  useEffect(() => { if (selected && !pending) markRead(selected.id); }, [selected?.id, pending, markRead]);
  useEffect(() => { threadRef.current && (threadRef.current.scrollTop = threadRef.current.scrollHeight); }, [selected?.id, selected?.messages?.length]);
  useEffect(() => () => window.clearInterval(recordTimerRef.current), []);

  if (!selected) return null;

  const selectContact = (id) => { onSelect(id); setAttachments([]); setMobileShowThread(true); };

  const addFiles = (files) => {
    setError('');
    const valid = [];
    for (const file of [...files]) {
      if (!ACCEPTED_TYPES.includes(file.type)) { setError(`${file.name}: unsupported file type.`); continue; }
      if (file.size > MAX_FILE_BYTES) { setError(`${file.name}: maximum size is 25 MB.`); continue; }
      valid.push({ id: `file-${Date.now()}-${valid.length}`, name: file.name, size: file.size, type: file.type });
    }
    setAttachments((current) => [...current, ...valid]);
  };

  // ---------- Voice notes ----------
  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recorder.wasCancelled) return;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAttachments((current) => [...current, {
          id: `voice-${Date.now()}`, name: `Voice message (${durationLabel(recordSecondsRef.current)})`,
          type: 'audio/webm', kind: 'voice', url, size: blob.size,
        }]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setError('Microphone access was denied or is unavailable.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    window.clearInterval(recordTimerRef.current);
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.wasCancelled = true;
      mediaRecorderRef.current.stop();
    }
    window.clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!selected || selected.blocked || pending) return;
    if (!draft.trim() && !attachments.length) return;
    sendMessage(selected.id, { text: draft.trim(), attachments });
    onAccept(selected.id);
    setAttachments([]);
    setTyping(selected.id, true);
    window.setTimeout(() => {
      setTyping(selected.id, false);
      receiveAutoReply(selected.id, AUTO_REPLY_HINTS[Math.floor(Math.random() * AUTO_REPLY_HINTS.length)]);
    }, 1100);
  };

  return (
    <main className="trainer-chat-page trainer-chat-focus" dir="ltr">
      <header className="trainer-chat-page-head trainer-chat-inbox-head">
        <button type="button" className="trainer-chat-back-link" onClick={onBack}><FiArrowLeft /> Student directory</button>
        <h1>Messages</h1>
      </header>

      <section className="trainer-chat-workspace">
        <aside className={`trainer-chat-inbox ${mobileShowThread ? 'mobile-hidden' : ''}`}>
          <div className="trainer-chat-inbox-title"><h2>Conversations</h2></div>
          <label className="trainer-chat-search"><FiSearch /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations" /></label>
          <div className="trainer-chat-filter-tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
            <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>Unread</button>
          </div>
          <div className="trainer-chat-contact-list">
            {visible.map((item) => {
              const itemPending = isPendingRequest(item, acceptedIds);
              const last = item.messages?.at(-1);
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`trainer-chat-contact ${item.id === selected.id ? 'active' : ''} ${itemPending ? 'is-pending' : ''}`}
                  onClick={() => selectContact(item.id)}
                >
                  <Avatar contact={item} />
                  <span className="trainer-chat-contact-copy">
                    <strong>{item.name}<time>{last ? timeLabel(last.time) : ''}</time></strong>
                    <span>{last?.deleted ? 'Message deleted' : last?.text || 'No messages yet'}</span>
                    <small>{item.course}</small>
                  </span>
                  {itemPending && <b className="trainer-chat-unread pending">New</b>}
                  {!itemPending && item.unreadCount > 0 && <b className="trainer-chat-unread">{item.unreadCount}</b>}
                </button>
              );
            })}
          </div>
        </aside>

        <section className={`trainer-chat-thread ${mobileShowThread ? '' : 'mobile-hidden'}`}>
          <header className="trainer-chat-thread-header">
            <button type="button" className="trainer-chat-thread-back-mobile" onClick={() => setMobileShowThread(false)}><FiArrowLeft /></button>
            <Avatar contact={selected} />
            <div>
              <h2>{selected.name}</h2>
              <p>{selected.course} · <span className={selected.status}>{selected.status}</span></p>
            </div>
            <div className="trainer-chat-thread-actions">
              <button type="button" title="Clear conversation" onClick={() => { if (window.confirm('Clear this conversation?')) clearConversation(selected.id); }}><FiTrash2 /></button>
            </div>
          </header>

          <div className="trainer-chat-message-area" ref={threadRef}>
            <div className="trainer-chat-day"><span>Today</span></div>
            {(selected.messages || []).map((message) => (
              <div className={`trainer-chat-message-row ${message.sender === 'me' ? 'mine' : 'theirs'}`} key={message.id}>
                <div className="trainer-chat-bubble-wrap">
                  <div className={`trainer-chat-bubble ${message.deleted ? 'deleted' : ''}`}>
                    {message.deleted ? <em>Message deleted</em> : <p>{message.text}</p>}
                    {!message.deleted && (message.attachments || []).map((attachment) => (
                      <Attachment key={attachment.id} attachment={attachment} onPreview={setPreview} />
                    ))}
                    <time>{timeLabel(message.time)} {message.sender === 'me' && <FiCheck />}</time>
                  </div>
                  {!message.deleted && message.sender === 'me' && (
                    <div className="trainer-chat-message-tools">
                      <button type="button" onClick={() => deleteMessage(selected.id, message.id)}><FiTrash2 /> Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typingIds.includes(selected.id) && <div className="trainer-chat-typing"><i /><i /><i /><span>{selected.name.split(' ')[0]} is typing</span></div>}
          </div>

          {selected.blocked ? (
            <div className="trainer-chat-locked">
              This student is blocked.
              <button type="button" onClick={() => toggleBlock(selected.id)}>Unblock</button>
            </div>
          ) : pending ? (
            <div className="trainer-chat-request-banner">
              <div><strong>New message request</strong><p>{selected.name} messaged you for the first time. Accept to start replying.</p></div>
              <div className="trainer-chat-request-actions">
                <button type="button" className="decline" onClick={() => onDecline(selected.id)}><FiUserX /> Decline</button>
                <button type="button" className="accept" onClick={() => onAccept(selected.id)}><FiUserCheck /> Accept</button>
              </div>
            </div>
          ) : (
            <form className="trainer-chat-composer" onSubmit={submit}>
              {attachments.length > 0 && (
                <div className="trainer-chat-attachment-list">
                  {attachments.map((file) => (
                    <span key={file.id}>
                      {file.kind === 'voice' ? <FiMic /> : <FiFile />} {file.name}
                      <button type="button" onClick={() => setAttachments((items) => items.filter((i) => i.id !== file.id))}><FiX /></button>
                    </span>
                  ))}
                </div>
              )}

              {isRecording ? (
                <div className="trainer-chat-recording">
                  <span className="trainer-chat-recording-dot" />
                  <span className="trainer-chat-recording-time">{durationLabel(recordSeconds)}</span>
                  <span className="trainer-chat-recording-label">Recording voice message…</span>
                  <button type="button" className="trainer-chat-recording-cancel" onClick={cancelRecording}><FiX /></button>
                  <button type="button" className="trainer-chat-recording-stop" onClick={stopRecording}><FiSquare /> Stop</button>
                </div>
              ) : (
                <textarea
                  value={draft}
                  onChange={(e) => saveDraft(selected.id, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
                  placeholder="Write a reply…"
                />
              )}

              <footer>
                <input ref={fileRef} type="file" multiple hidden accept={ACCEPTED_ATTR} onChange={(e) => addFiles(e.target.files)} />
                <button type="button" title="Attach a file" onClick={() => fileRef.current?.click()} disabled={isRecording}><FiPaperclip /></button>
                <button
                  type="button"
                  title={isRecording ? 'Recording…' : 'Record a voice message'}
                  className={isRecording ? 'is-active' : ''}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  <FiMic />
                </button>
                <span>{draft || attachments.length ? 'Draft saved automatically' : 'Press Enter to send · Shift+Enter for a new line'}</span>
                <button type="submit" className="trainer-chat-send" disabled={isRecording || (!draft.trim() && !attachments.length)}>
                  Send <FiSend />
                </button>
              </footer>
              {error && <p className="trainer-chat-composer-error">{error}</p>}
            </form>
          )}
        </section>
      </section>

      {preview && (
        <div className="trainer-chat-preview-modal" onClick={() => setPreview(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreview(null)}><FiX /></button>
            <h3>{preview.name}</h3>
            <p>Preview isn't available for this file — the attachment was saved to the conversation.</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TrainerMessages() {
  const { conversations, toggleBlock } = useTrainerMessages();
  const [view, setView] = useState('directory');
  const [selectedId, setSelectedId] = useState(null);
  const [acceptedIds, setAcceptedIds] = useState(readAcceptedSet);

  useEffect(() => {
    try { localStorage.setItem(ACCEPTED_SET_KEY, JSON.stringify([...acceptedIds])); } catch { /* ignore */ }
  }, [acceptedIds]);

  const acceptConversation = (id) => setAcceptedIds((current) => new Set(current).add(id));
  const declineConversation = (id) => toggleBlock(id);

  const openConversation = (id) => { setSelectedId(id); setView('inbox'); };
  const openDirectory = () => setView('directory');

  if (!conversations.length) {
    return (
      <main className="trainer-chat-page" dir="ltr">
        <div className="trainer-chat-empty standalone">
          <FiMessageSquare />
          <h3>No student conversations yet</h3>
          <p>Once a student in one of your courses sends a message, it will show up here.</p>
        </div>
      </main>
    );
  }

  return view === 'directory'
    ? (
      <Directory
        conversations={conversations}
        acceptedIds={acceptedIds}
        onOpen={openConversation}
        onAccept={acceptConversation}
        onDecline={declineConversation}
      />
    )
    : (
      <ConversationWorkspace
        conversations={conversations}
        selectedId={selectedId}
        acceptedIds={acceptedIds}
        onSelect={setSelectedId}
        onAccept={acceptConversation}
        onDecline={declineConversation}
        onBack={openDirectory}
      />
    );
}
