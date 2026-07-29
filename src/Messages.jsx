import { useState, useRef, useEffect, useMemo } from 'react';
import {
  FiVideo, FiPhone, FiMoreVertical, FiPaperclip, FiImage,
  FiSmile, FiSend, FiFileText, FiCalendar, FiMail, FiUser, FiSlash, FiSearch
} from 'react-icons/fi';
import { useMessages } from './MessagesContext';
import './Messages.css';

const getInitials = (name) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const autoReplies = [
  'Thanks for the update, I will get back to you soon.',
  'Got it, noted!',
  'Sounds good, keep up the great work.',
  'I will review this and reply shortly.',
];

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (iso) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'TODAY';
  if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

  return date
    .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    .toUpperCase();
};

const Messages = () => {
  const { conversations, sendMessage, receiveAutoReply, clearConversation, toggleBlock } = useMessages();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [callBanner, setCallBanner] = useState(null);

  const bottomRef = useRef(null);
  const menuRef = useRef(null);

  const selectedContact = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact?.messages.length, isTyping]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const openContact = (id) => {
    setSelectedId(id);
    setShowMenu(false);
  };

  const goBackToList = () => {
    setSelectedId(null);
    setDraft('');
    setShowMenu(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selectedContact || selectedContact.blocked) return;

    sendMessage(selectedContact.id, text);
    setDraft('');

    setIsTyping(true);
    setTimeout(() => {
      const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      receiveAutoReply(selectedContact.id, reply);
      setIsTyping(false);
    }, 1400);
  };

  const triggerCall = (type) => {
    setCallBanner(`${type === 'video' ? 'Video calling' : 'Calling'} ${selectedContact.name}...`);
    setTimeout(() => setCallBanner(null), 2500);
  };

  const groupedMessages = useMemo(() => {
    if (!selectedContact) return [];
    const groups = [];
    let lastDate = null;

    selectedContact.messages.forEach((msg) => {
      const label = formatDateLabel(msg.time);
      if (label !== lastDate) {
        groups.push({ type: 'divider', label, id: `divider-${msg.id}` });
        lastDate = label;
      }
      groups.push({ type: 'message', ...msg });
    });

    return groups;
  }, [selectedContact]);

  if (selectedContact) {
    const readableStatus =
      selectedContact.status === 'online' ? 'Online now' : 'Offline';

    return (
      <div className="messages-shell">
        <aside className="contacts-panel">
          <div className="contacts-panel-header">
            <h2>Recent Chats</h2>
            <button className="icon-btn-plain" onClick={() => setShowSearch((p) => !p)}>
              <FiSearch />
            </button>
          </div>

          {showSearch && (
            <input
              type="text"
              className="contact-search-input"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          )}

          <div className="contacts-shortcuts">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`shortcut-avatar-wrap ${selectedId === c.id ? 'active' : ''}`}
                onClick={() => openContact(c.id)}
              >
                <div className="shortcut-avatar">
                  {c.avatar ? <img src={c.avatar} alt={c.name} /> : getInitials(c.name)}
                </div>
                <span>{c.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div className="contacts-full-list">
            {filteredContacts.map((c) => {
              const lastMsg = c.messages[c.messages.length - 1];
              return (
                <div
                  key={c.id}
                  className={`contact-row ${selectedId === c.id ? 'selected' : ''}`}
                  onClick={() => openContact(c.id)}
                >
                  <div className="contact-row-avatar">
                    {c.avatar ? <img src={c.avatar} alt={c.name} /> : getInitials(c.name)}
                    {c.status === 'online' && <span className="online-dot" />}
                  </div>
                  <div className="contact-row-info">
                    <div className="contact-row-top">
                      <h4>{c.name}</h4>
                      <span>{lastMsg ? formatTime(lastMsg.time) : ''}</span>
                    </div>
                    <p>{lastMsg ? `${lastMsg.sender === 'me' ? 'You: ' : ''}${lastMsg.text}` : 'No messages yet'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="conversation-panel">
          <div className="conversation-top">
            <div className="conversation-top-left" onClick={goBackToList} title="Back to all conversations">
              <div className="conversation-avatar">
                {selectedContact.avatar ? (
                  <img src={selectedContact.avatar} alt={selectedContact.name} />
                ) : (
                  getInitials(selectedContact.name)
                )}
              </div>
              <div>
                <h3>{selectedContact.name}</h3>
                <span className={selectedContact.status === 'online' ? 'status-online' : 'status-offline'}>
                  {selectedContact.blocked ? 'Blocked' : readableStatus}
                </span>
              </div>
            </div>

            <div className="conversation-top-actions">
              <button className="icon-btn-plain" onClick={() => triggerCall('video')}>
                <FiVideo />
              </button>
              <button className="icon-btn-plain" onClick={() => triggerCall('voice')}>
                <FiPhone />
              </button>
              <div className="more-menu-wrap" ref={menuRef}>
                <button className="icon-btn-plain" onClick={() => setShowMenu((p) => !p)}>
                  <FiMoreVertical />
                </button>
                {showMenu && (
                  <div className="more-menu-dropdown">
                    <div
                      className="more-menu-item"
                      onClick={() => {
                        clearConversation(selectedContact.id);
                        setShowMenu(false);
                      }}
                    >
                      Clear conversation
                    </div>
                    <div
                      className="more-menu-item danger"
                      onClick={() => {
                        toggleBlock(selectedContact.id);
                        setShowMenu(false);
                      }}
                    >
                      {selectedContact.blocked ? 'Unblock user' : 'Block user'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {callBanner && <div className="call-banner">{callBanner}</div>}

          <div className="conversation-thread">
            {groupedMessages.length === 0 && (
              <p className="thread-empty">No messages yet. Say hello 👋</p>
            )}

            {groupedMessages.map((item) =>
              item.type === 'divider' ? (
                <div key={item.id} className="date-divider">
                  <span>{item.label}</span>
                </div>
              ) : (
                <div key={item.id} className={`message-row ${item.sender === 'me' ? 'me' : 'them'}`}>
                  {item.sender === 'them' && (
                    <div className="message-avatar">
                      {selectedContact.avatar ? (
                        <img src={selectedContact.avatar} alt="" />
                      ) : (
                        getInitials(selectedContact.name)
                      )}
                    </div>
                  )}
                  <div className="message-bubble">
                    <p>{item.text}</p>
                  </div>
                  {item.sender === 'me' && <div className="message-time-tag">YOU</div>}
                </div>
              )
            )}

            {isTyping && (
              <div className="message-row them">
                <div className="message-avatar">
                  {selectedContact.avatar ? (
                    <img src={selectedContact.avatar} alt="" />
                  ) : (
                    getInitials(selectedContact.name)
                  )}
                </div>
                <div className="message-bubble typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {selectedContact.blocked ? (
            <div className="blocked-banner">
              You have blocked this contact.
              <span onClick={() => toggleBlock(selectedContact.id)}> Unblock</span>
            </div>
          ) : (
            <form className="conversation-input-row" onSubmit={handleSend}>
              <button type="button" className="icon-btn-plain" title="Emoji">
                <FiSmile />
              </button>
              <button type="button" className="icon-btn-plain" title="Attach file">
                <FiPaperclip />
              </button>
              <button type="button" className="icon-btn-plain" title="Attach image">
                <FiImage />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!draft.trim()}>
                Send <FiSend />
              </button>
            </form>
          )}
        </section>

        <aside className="details-panel">
          <div className="details-profile">
            <div className="details-avatar">
              {selectedContact.avatar ? (
                <img src={selectedContact.avatar} alt={selectedContact.name} />
              ) : (
                getInitials(selectedContact.name)
              )}
            </div>
            <h3>{selectedContact.name}</h3>
            <span>{selectedContact.role}</span>

            <div className="details-quick-actions">
              <span className="quick-action-btn"><FiUser /></span>
              <span className="quick-action-btn"><FiMail /></span>
              <span className="quick-action-btn"><FiCalendar /></span>
            </div>
          </div>

          <div className="details-section">
            <span className="details-section-label">Participant Details</span>
            <div className="details-row">
              <span className="details-row-label">{selectedContact.info.label1}</span>
              <span className="details-row-value">{selectedContact.info.value1}</span>
            </div>
            <div className="details-row">
              <span className="details-row-label">{selectedContact.info.label2}</span>
              <span className="details-row-value">{selectedContact.info.value2}</span>
            </div>
          </div>

          <div className="details-section">
            <span className="details-section-label">Shared Files</span>
            {selectedContact.files.length === 0 ? (
              <p className="details-empty">No shared files</p>
            ) : (
              selectedContact.files.map((f, i) => (
                <div className="file-item" key={i}>
                  <span className="file-icon"><FiFileText /></span>
                  <div>
                    <p className="file-name">{f.name}</p>
                    <span className="file-size">{f.size}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="details-section">
            <span className="details-section-label">Shared Images</span>
            {selectedContact.images.length === 0 ? (
              <p className="details-empty">No shared images</p>
            ) : (
              <div className="shared-images-grid">
                {selectedContact.images.map((img, i) => (
                  <img key={i} src={img} alt="" />
                ))}
              </div>
            )}
          </div>

          <button
            className={`block-user-btn ${selectedContact.blocked ? 'blocked' : ''}`}
            onClick={() => toggleBlock(selectedContact.id)}
          >
            <FiSlash /> {selectedContact.blocked ? 'Unblock User' : 'Block User'}
          </button>
        </aside>
      </div>
    );
  }

  return (
    <div className="messages-shell no-selection">
      <aside className="contacts-panel full">
        <div className="contacts-panel-header">
          <h2>Recent Chats</h2>
          <button className="icon-btn-plain" onClick={() => setShowSearch((p) => !p)}>
            <FiSearch />
          </button>
        </div>

        {showSearch && (
          <input
            type="text"
            className="contact-search-input"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        )}

        <div className="contacts-shortcuts">
          {conversations.map((c) => (
            <div key={c.id} className="shortcut-avatar-wrap" onClick={() => openContact(c.id)}>
              <div className="shortcut-avatar">
                {c.avatar ? <img src={c.avatar} alt={c.name} /> : getInitials(c.name)}
              </div>
              <span>{c.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        <div className="contacts-full-list">
          {filteredContacts.map((c) => {
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <div key={c.id} className="contact-row" onClick={() => openContact(c.id)}>
                <div className="contact-row-avatar">
                  {c.avatar ? <img src={c.avatar} alt={c.name} /> : getInitials(c.name)}
                  {c.status === 'online' && <span className="online-dot" />}
                </div>
                <div className="contact-row-info">
                  <div className="contact-row-top">
                    <h4>{c.name}</h4>
                    <span>{lastMsg ? formatTime(lastMsg.time) : ''}</span>
                  </div>
                  <p>{lastMsg ? `${lastMsg.sender === 'me' ? 'You: ' : ''}${lastMsg.text}` : 'No messages yet'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

export default Messages;