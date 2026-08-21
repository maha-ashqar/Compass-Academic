import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiArrowLeft, FiCheck, FiChevronDown, FiEdit2, FiFile,
  FiFileText, FiImage, FiLink, FiMessageSquare, FiMoreHorizontal, FiPaperclip,
  FiPlay, FiSearch, FiSend, FiTrash2, FiUser, FiX,
} from 'react-icons/fi';
import { MAX_ATTACHMENT_BYTES, MESSAGE_EDIT_WINDOW_MS, useMessages } from './MessagesContext';
import './Messages.css';

const AUTO_REPLIES = [
  'شكرًا على التحديث. سأراجعه وأعود إليك قريبًا.',
  'تم الاستلام. الرجاء التأكد من إرفاق الملف النهائي بالواجب.',
  'تقدّم جيد. أضفت هذه الملاحظة إلى متابعة الكورس الخاص بك.',
];
const ACCEPTED = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const timeLabel = (value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const shortDate = (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const sizeLabel = (bytes = 0) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function Avatar({ contact, small = false }) {
  return (
    <span className={`msg-avatar ${small ? 'small' : ''}`}>
      {contact.avatar ? <img src={contact.avatar} alt="" /> : <FiUser />}
      <i className={`presence ${contact.status || 'offline'}`} />
    </span>
  );
}

function Directory({ contacts, conversations, onOpen, onInbox }) {
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [role, setRole] = useState('all');
  const courses = [...new Set(contacts.map((contact) => contact.course))];
  const filtered = contacts.filter((contact) => {
    const haystack = `${contact.name} ${contact.specialty} ${contact.course}`.toLowerCase();
    return haystack.includes(query.toLowerCase())
      && (course === 'all' || contact.course === course)
      && (availability === 'all' || contact.status === availability)
      && (role === 'all' || contact.role === role);
  });
  const unread = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

  return (
    <main className="message-page" dir="ltr">
      <header className="message-page-head">
        <div><small>Academic support network</small><h1>Contact an instructor</h1><p>Message instructors connected to your enrolled courses, assignments, and active projects.</p></div>
        {conversations.length > 0 && <button className="msg-outline-button" onClick={onInbox}>My conversations <b>{conversations.length}</b></button>}
      </header>

      <section className="contact-summary">
        <div><small>Who can I message?</small><strong>Your instructors and academic mentors</strong><span>Contacts are based on your courses and learning activities.</span></div>
        <dl><div><dt>Available now</dt><dd>{contacts.filter((item) => item.status === 'online').length}</dd></div><div><dt>My instructors</dt><dd>{contacts.length}</dd></div><div><dt>Unread</dt><dd>{unread}</dd></div></dl>
      </section>

      <section className="contact-filters">
        <label><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by instructor, course, or specialization" /></label>
        <select value={course} onChange={(event) => setCourse(event.target.value)}><option value="all">All courses</option>{courses.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">Availability</option><option value="online">Online</option><option value="away">Away</option><option value="offline">Offline</option></select>
        <select value={role} onChange={(event) => setRole(event.target.value)}><option value="all">Role</option><option>Instructor</option><option>Academic Mentor</option><option>Project Mentor</option></select>
        <button onClick={() => { setQuery(''); setCourse('all'); setAvailability('all'); setRole('all'); }}>Clear filters</button>
      </section>

      <div className="contact-section-title"><h2>Available to message</h2><span>{filtered.length} verified contacts</span></div>
      <section className="contact-list">
        {filtered.map((contact) => (
          <button className={`contact-row role-${contact.role.replace(/\s+/g, '-').toLowerCase()}`} key={contact.id} onClick={() => onOpen(contact)}>
            <Avatar contact={contact} />
            <span className="contact-row-main">
              <span className="contact-row-top">
                <span className="contact-row-name"><strong>{contact.name}</strong><i>{contact.role}</i></span>
                <span className="verified"><FiCheck /> Verified</span>
              </span>
              <span className="contact-row-meta"><em>{contact.specialty}</em><b>{contact.course}</b></span>
              <span className="contact-row-availability"><i className={`presence-inline ${contact.status}`} />{contact.availability}</span>
            </span>
            <span className="contact-row-cta">Message <FiArrowLeft /></span>
          </button>
        ))}
      </section>
      {!filtered.length && <div className="messages-empty"><FiSearch /><h3>No matching contacts</h3><p>Clear the filters and try another search.</p></div>}
      <aside className="message-help"><span>i</span><div><strong>Can't find the instructor you need?</strong><p>Only instructors connected to your learning activities are shown.</p></div><button>Contact support →</button></aside>
    </main>
  );
}

function Attachment({ attachment, onPreview }) {
  const image = attachment.type?.startsWith('image/');
  const video = attachment.type?.startsWith('video/');
  return <button className="message-attachment" onClick={() => onPreview(attachment)}>{image ? <FiImage /> : video ? <FiPlay /> : <FiFileText />}<span><strong>{attachment.name}</strong><small>{sizeLabel(attachment.size)}</small></span></button>;
}

function Inbox({ conversations, selectedId, onSelect, onDirectory }) {
  const {
    drafts, typingIds, connectionStatus, openConversation, sendMessage, receiveAutoReply,
    saveDraft, setTyping, editMessage, deleteMessage, reportMessage, clearConversation, toggleBlock,
  } = useMessages();
  const [listQuery, setListQuery] = useState('');
  const [messageQuery, setMessageQuery] = useState('');
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [attachments, setAttachments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [mobileShowThread, setMobileShowThread] = useState(true);
  const fileRef = useRef(null);
  const threadRef = useRef(null);
  const selected = conversations.find((item) => item.id === selectedId) || conversations[0];
  const draft = selected ? drafts[selected.id] || '' : '';

  useEffect(() => {
    if (selected) openConversation(selected.id);
  }, [selected?.id, openConversation]);
  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [selected?.id]);

  const listed = conversations.filter((item) => {
    const matches = `${item.name} ${item.course}`.toLowerCase().includes(listQuery.toLowerCase());
    return matches && (filter === 'all' || (filter === 'unread' && item.unreadCount) || (filter === 'instructors' && item.role === 'Instructor'));
  });
  const messages = (selected?.messages || []).filter((message) => !messageQuery || `${message.text} ${(message.attachments || []).map((item) => item.name).join(' ')}`.toLowerCase().includes(messageQuery.toLowerCase()));
  const visibleMessages = messages.slice(-visibleCount);

  const addFiles = async (files) => {
    setError('');
    const valid = [];
    for (const file of [...files]) {
      if (!ACCEPTED.includes(file.type)) { setError(`${file.name}: unsupported file type.`); continue; }
      if (file.size > MAX_ATTACHMENT_BYTES) { setError(`${file.name}: maximum size is 25 MB.`); continue; }
      let previewUrl = '';
      if ((file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('video/')) && file.size <= 3 * 1024 * 1024) {
        previewUrl = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); });
      }
      valid.push({ id: `file-${Date.now()}-${valid.length}`, name: file.name, size: file.size, type: file.type, previewUrl });
    }
    setAttachments((current) => [...current, ...valid]);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!selected || selected.closed || selected.blocked) return;
    if (editing) {
      if (draft.trim()) editMessage(selected.id, editing.id, draft);
      setEditing(null); saveDraft(selected.id, ''); return;
    }
    if (!draft.trim() && !attachments.length) return;
    sendMessage(selected.id, { text: draft, attachments, replyTo });
    setAttachments([]); setReplyTo(null);
    setTyping(selected.id, true);
    window.setTimeout(() => {
      setTyping(selected.id, false);
      receiveAutoReply(selected.id, AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)]);
    }, 1200);
  };

  const beginEdit = (message) => { setEditing(message); saveDraft(selected.id, message.text); };
  const handleThreadScroll = (event) => { if (event.currentTarget.scrollTop < 12 && visibleCount < messages.length) setVisibleCount((count) => count + 20); };
  const openChat = (id) => { onSelect(id); setMobileShowThread(true); };

  if (!selected) return <div className="messages-empty"><FiMessageSquare /><h3>No conversations yet</h3><button onClick={onDirectory}>Start a conversation</button></div>;

  return (
    <main className="message-page inbox-focus" dir="ltr">
      <header className="message-page-head inbox-page-head">
        <div>
          <button className="inbox-back-link" onClick={onDirectory}><FiArrowLeft /> Instructor directory</button>
          <h1>Messages</h1>
        </div>
        <span className={`connection-pill ${connectionStatus}`}>{connectionStatus === 'online' ? 'Connected' : 'Offline'}</span>
      </header>
      {connectionStatus === 'offline' && <div className="offline-banner"><FiAlertTriangle /> You are offline. New messages will be sent automatically when your connection returns.</div>}

      <section className="inbox-shell">
        <aside className={`conversation-list ${mobileShowThread ? 'mobile-hidden' : ''}`}>
          <div className="conversation-list-title"><h2>Conversations</h2><span>{conversations.reduce((sum, item) => sum + item.unreadCount, 0)} new</span></div>
          <label className="conversation-search"><FiSearch /><input value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Search conversations" /></label>
          <div className="conversation-filters">{['all', 'unread', 'instructors'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
          <div className="conversation-items">{listed.map((conversation) => {
            const last = conversation.messages.at(-1);
            return <button key={conversation.id} className={`conversation-item ${selected.id === conversation.id ? 'active' : ''}`} onClick={() => openChat(conversation.id)}><Avatar contact={conversation} small /><span><strong>{conversation.name}</strong><p>{last?.deleted ? 'Message deleted' : last?.text || 'Attachment'}</p><small>{conversation.course}</small></span><time>{last ? timeLabel(last.time) : ''}</time>{conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}</button>;
          })}</div>
          <button className="new-message-tab" onClick={onDirectory}><FiUser /> Message another instructor</button>
        </aside>

        <section className={`thread-panel ${mobileShowThread ? '' : 'mobile-hidden'}`}>
          <header className="thread-head">
            <button className="thread-back-mobile" onClick={() => setMobileShowThread(false)}><FiArrowLeft /></button>
            <div className="thread-head-identity"><Avatar contact={selected} /><span><h2>{selected.name} <em>Verified</em></h2><p>{selected.course} · {selected.availability}</p></span></div>
            <div className="thread-head-actions"><button title="Search messages" onClick={() => { setMessageSearchOpen((value) => !value); setMessageQuery(''); }}><FiSearch /></button><button title="Conversation menu" onClick={() => { if (window.confirm('Clear this conversation?')) clearConversation(selected.id); }}><FiMoreHorizontal /></button></div>
          </header>
          {messageSearchOpen && <label className="message-search"><FiSearch /><input autoFocus value={messageQuery} onChange={(event) => setMessageQuery(event.target.value)} placeholder="Search inside this conversation" /><button onClick={() => { setMessageSearchOpen(false); setMessageQuery(''); }}><FiX /></button></label>}
          <div className="conversation-context"><FiFileText /><span><strong>Conversation context</strong><small>{selected.context?.title} · {selected.context?.subtitle}</small></span><button>Open {selected.context?.type || 'course'} →</button></div>

          <div className="message-thread" ref={threadRef} onScroll={handleThreadScroll}>
            {visibleCount < messages.length && <button className="load-older" onClick={() => setVisibleCount((count) => count + 20)}>Load older messages</button>}
            <div className="day-divider"><span>Today</span></div>
            {visibleMessages.map((message) => (
              <article className={`bubble-row ${message.sender}`} key={message.id}>
                <div className={`message-bubble ${message.deleted ? 'deleted' : ''}`}>
                  {message.replyTo && <blockquote>Replying to: {message.replyTo.text || 'Attachment'}</blockquote>}
                  <p>{message.deleted ? 'Message deleted' : message.text}</p>
                  {!message.deleted && (message.attachments || []).map((attachment) => <Attachment key={attachment.id} attachment={attachment} onPreview={setPreview} />)}
                  <footer><time>{timeLabel(message.time)}</time>{message.editedAt && <span>Edited</span>}{message.sender === 'me' && <span>{message.status === 'queued' ? 'Queued' : message.status === 'read' ? '✓✓ Read' : message.status === 'delivered' ? '✓✓ Delivered' : '✓ Sent'}</span>}</footer>
                  {!message.deleted && <div className="bubble-actions"><button onClick={() => setReplyTo(message)}>Reply</button>{message.sender === 'me' && Date.now() - new Date(message.time).getTime() <= MESSAGE_EDIT_WINDOW_MS && <button onClick={() => beginEdit(message)}><FiEdit2 /> Edit</button>}{message.sender === 'me' ? <button onClick={() => deleteMessage(selected.id, message.id)}><FiTrash2 /> Delete</button> : <button onClick={() => { reportMessage(selected.id, message.id); alert('The message was reported for review.'); }}>Report</button>}</div>}
                </div>
              </article>
            ))}
            {typingIds.includes(selected.id) && <div className="typing-indicator"><span /><span /><span /> {selected.name} is typing…</div>}
          </div>

          {selected.closed ? <div className="read-only-note">This course has ended. The conversation is available in read-only mode.</div> : selected.blocked ? <div className="read-only-note">This conversation is blocked. <button onClick={() => toggleBlock(selected.id)}>Unblock</button></div> : (
            <form className="composer" onSubmit={submit}>
              {(replyTo || editing) && <div className="composer-context"><span>{editing ? `Editing: ${editing.text}` : `Replying to: ${replyTo.text || 'Attachment'}`}</span><button type="button" onClick={() => { setReplyTo(null); setEditing(null); saveDraft(selected.id, ''); }}><FiX /></button></div>}
              {attachments.length > 0 && <div className="composer-files">{attachments.map((file) => <span key={file.id}><FiFile />{file.name}<button type="button" onClick={() => setAttachments((items) => items.filter((item) => item.id !== file.id))}><FiX /></button></span>)}</div>}
              <textarea value={draft} onChange={(event) => saveDraft(selected.id, event.target.value)} placeholder="Write a message…" rows="2" />
              <footer><div><button type="button" title="Attach a file" onClick={() => fileRef.current?.click()}><FiPaperclip /></button><button type="button" title="Add link" onClick={() => saveDraft(selected.id, `${draft}${draft ? '\n' : ''}https://`)}><FiLink /></button><input ref={fileRef} hidden type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4" onChange={(event) => addFiles(event.target.files)} /></div><small>Draft saved automatically</small><button className="send-button" type="submit">Send <FiSend /></button></footer>
              {error && <p className="composer-error">{error}</p>}
            </form>
          )}
        </section>
      </section>
      {preview && <div className="preview-modal" onClick={() => setPreview(null)}><div onClick={(event) => event.stopPropagation()}><button onClick={() => setPreview(null)}><FiX /></button><h3>{preview.name}</h3>{preview.previewUrl ? (preview.type.startsWith('image/') ? <img src={preview.previewUrl} alt={preview.name} /> : preview.type.startsWith('video/') ? <video src={preview.previewUrl} controls /> : <iframe src={preview.previewUrl} title={preview.name} />) : <p>Preview is unavailable for large local files. The attachment metadata was saved.</p>}</div></div>}
    </main>
  );
}

export default function Messages({ onConversationModeChange }) {
  const { contacts, conversations, ensureConversation } = useMessages();
  const [view, setView] = useState('directory');
  const [selectedId, setSelectedId] = useState(conversations[0]?.id || null);

  useEffect(() => {
    onConversationModeChange?.(view === 'inbox');
    return () => onConversationModeChange?.(false);
  }, [view, onConversationModeChange]);

  const openContact = (contact) => { const id = ensureConversation(contact); setSelectedId(id); setView('inbox'); };
  const goToInbox = () => {
    if (!conversations.length) return;
    setSelectedId((current) => current ?? conversations[0]?.id);
    setView('inbox');
  };

  return view === 'directory'
    ? <Directory contacts={contacts} conversations={conversations} onOpen={openContact} onInbox={goToInbox} />
    : <Inbox conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} onDirectory={() => setView('directory')} />;
}
