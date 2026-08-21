/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const MessagesContext = createContext(null);
const STORAGE_KEY = 'compass_messages_v4';
const DRAFTS_KEY = 'compass_message_drafts_v1';
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const messageContacts = [
  { id: 1, name: 'Eng. Ahmad Khalil', role: 'Instructor', specialty: 'Software Engineering', course: 'Front-End Development', status: 'online', availability: 'Online now · Usually replies within 2 hours', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80' },
  { id: 2, name: 'Eng. Sara Youssef', role: 'Instructor', specialty: 'Mobile Engineering', course: 'Flutter Masterclass', status: 'online', availability: 'Office hours 1–3 PM · Usually replies today', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80' },
  { id: 3, name: 'Dr. Omar Fares', role: 'Instructor', specialty: 'Artificial Intelligence', course: 'Applied AI', status: 'away', availability: 'Available tomorrow · Usually replies within 1 day', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&q=80' },
  { id: 4, name: 'Dr. Rania Saleh', role: 'Academic Mentor', specialty: 'Academic Research', course: 'Research Foundations', status: 'away', availability: 'Office hours Wed · Usually replies within 1 day', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80' },
  { id: 5, name: 'Eng. Yazan Nasser', role: 'Instructor', specialty: 'Full-Stack Development', course: 'Modern Web Applications', status: 'offline', availability: 'Away · Usually replies within 2 days', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80' },
  { id: 6, name: 'Lina Aboud', role: 'Project Mentor', specialty: 'Product Design', course: 'UI/UX Design Principles', status: 'online', availability: 'Online now · Usually replies within 3 hours', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80' },
];

const seedMessages = {
  1: [
    { id: 'm-1', sender: 'them', text: 'Hello Maha, I reviewed your first draft. The structure is good, but check the mobile navigation.', time: '2026-08-04T09:50:00', status: 'read' },
    { id: 'm-2', sender: 'me', text: 'Thank you. I updated the navigation and improved the responsive breakpoint.', time: '2026-08-04T10:18:00', status: 'read' },
    { id: 'm-3', sender: 'them', text: 'The new version is much clearer. Please also attach the accessibility checklist.', time: '2026-08-04T10:42:00', status: 'read', attachments: [{ id: 'a-1', name: 'accessibility-checklist.pdf', size: 186368, type: 'application/pdf' }] },
    { id: 'm-4', sender: 'me', text: 'I will attach it with the final submission. Thank you.', time: '2026-08-04T10:46:00', status: 'sent' },
  ],
  2: [{ id: 'm-5', sender: 'them', text: 'The Flutter resources are now available in your course.', time: '2026-08-03T13:20:00', status: 'delivered' }],
  3: [{ id: 'm-6', sender: 'them', text: 'Please review the updated project rubric before submitting.', time: '2026-08-01T11:00:00', status: 'read' }],
  6: [{ id: 'm-7', sender: 'them', text: 'I uploaded the presentation notes for your project team.', time: '2026-07-31T09:00:00', status: 'read' }],
};

const makeConversation = (contact) => ({
  id: contact.id,
  contactId: contact.id,
  ...contact,
  blocked: false,
  closed: false,
  unreadCount: contact.id === 2 ? 2 : contact.id === 3 ? 1 : 0,
  context: contact.id === 1
    ? { type: 'assignment', title: 'Responsive Portfolio Website', subtitle: 'Assignment due Aug 10' }
    : { type: 'course', title: contact.course, subtitle: contact.specialty },
  messages: seedMessages[contact.id] || [],
});

const seedConversations = messageContacts.filter((contact) => [1, 2, 3, 6].includes(contact.id)).map(makeConversation);

const readStorage = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizeConversation = (conversation) => ({
  ...conversation,
  unreadCount: Number(conversation.unreadCount ?? (conversation.unread ? 1 : 0)),
  blocked: Boolean(conversation.blocked),
  closed: Boolean(conversation.closed),
  messages: (conversation.messages || []).map((message) => ({
    status: message.sender === 'me' ? 'read' : 'delivered',
    attachments: [],
    deleted: false,
    ...message,
  })),
});

export function MessagesProvider({ children }) {
  const [conversations, setConversations] = useState(() => {
    const stored = readStorage(STORAGE_KEY, null);
    if (Array.isArray(stored)) return stored.map(normalizeConversation);
    return seedConversations;
  });
  const [drafts, setDrafts] = useState(() => readStorage(DRAFTS_KEY, {}));
  const [typingIds, setTypingIds] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(() => navigator.onLine ? 'online' : 'offline');
  const [reports, setReports] = useState([]);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)), [conversations]);
  useEffect(() => localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)), [drafts]);

  useEffect(() => {
    const online = () => setConnectionStatus('online');
    const offline = () => setConnectionStatus('offline');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  useEffect(() => {
    if (connectionStatus !== 'online') return;
    setConversations((current) => current.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => message.status === 'queued' ? { ...message, status: 'sent' } : message),
    })));
  }, [connectionStatus]);

  const ensureConversation = useCallback((contact) => {
    setConversations((current) => current.some((item) => item.contactId === contact.id)
      ? current
      : [makeConversation(contact), ...current]);
    return contact.id;
  }, []);

  const openConversation = useCallback((id) => {
    setConversations((current) => current.map((conversation) => conversation.id === id ? {
      ...conversation,
      unreadCount: 0,
      messages: conversation.messages.map((message) => message.sender === 'them' ? { ...message, status: 'read' } : message),
    } : conversation));
  }, []);

  const sendMessage = useCallback((conversationId, payload) => {
    const data = typeof payload === 'string' ? { text: payload } : payload;
    const text = data.text?.trim() || '';
    if (!text && !(data.attachments || []).length) return null;
    const id = data.clientId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const message = {
      id,
      clientId: id,
      sender: 'me',
      text,
      attachments: data.attachments || [],
      replyTo: data.replyTo || null,
      time: new Date().toISOString(),
      status: connectionStatus === 'online' ? 'sent' : 'queued',
      deleted: false,
    };
    setConversations((current) => current.map((conversation) => {
      if (conversation.id !== conversationId || conversation.closed || conversation.blocked) return conversation;
      if (conversation.messages.some((item) => item.clientId === id)) return conversation;
      return { ...conversation, messages: [...conversation.messages, message] };
    }));
    setDrafts((current) => ({ ...current, [conversationId]: '' }));
    if (connectionStatus === 'online') {
      window.setTimeout(() => setConversations((current) => current.map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map((item) => item.id === id ? { ...item, status: 'delivered' } : item),
      }))), 650);
    }
    return id;
  }, [connectionStatus]);

  const receiveAutoReply = useCallback((conversationId, text) => {
    const message = { id: `reply-${Date.now()}`, sender: 'them', text, time: new Date().toISOString(), status: 'delivered', attachments: [] };
    setConversations((current) => current.map((conversation) => conversation.id === conversationId
      ? { ...conversation, messages: [...conversation.messages, message], unreadCount: conversation.unreadCount + 1 }
      : conversation));
  }, []);

  const saveDraft = useCallback((id, value) => setDrafts((current) => ({ ...current, [id]: value })), []);
  const setTyping = useCallback((id, value) => setTypingIds((current) => value ? [...new Set([...current, id])] : current.filter((item) => item !== id)), []);

  const editMessage = useCallback((conversationId, messageId, text) => setConversations((current) => current.map((conversation) => conversation.id !== conversationId ? conversation : {
    ...conversation,
    messages: conversation.messages.map((message) => {
      const editable = message.id === messageId && message.sender === 'me' && !message.deleted && Date.now() - new Date(message.time).getTime() <= MESSAGE_EDIT_WINDOW_MS;
      return editable ? { ...message, text: text.trim(), editedAt: new Date().toISOString() } : message;
    }),
  })), []);

  const deleteMessage = useCallback((conversationId, messageId) => setConversations((current) => current.map((conversation) => conversation.id !== conversationId ? conversation : {
    ...conversation,
    messages: conversation.messages.map((message) => message.id === messageId && message.sender === 'me'
      ? { ...message, text: '', attachments: [], deleted: true, deletedAt: new Date().toISOString() }
      : message),
  })), []);

  const reportMessage = useCallback((conversationId, messageId, reason = 'Inappropriate content') => {
    setReports((current) => [...current, { id: Date.now(), conversationId, messageId, reason, reportedAt: new Date().toISOString() }]);
  }, []);

  const clearConversation = useCallback((id) => setConversations((current) => current.map((conversation) => conversation.id === id ? { ...conversation, messages: [] } : conversation)), []);
  const toggleBlock = useCallback((id) => setConversations((current) => current.map((conversation) => conversation.id === id ? { ...conversation, blocked: !conversation.blocked } : conversation)), []);

  const value = useMemo(() => ({
    conversations, contacts: messageContacts, drafts, typingIds, connectionStatus, reports,
    ensureConversation, openConversation, sendMessage, receiveAutoReply, saveDraft, setTyping,
    editMessage, deleteMessage, reportMessage, clearConversation, toggleBlock,
  }), [conversations, drafts, typingIds, connectionStatus, reports, ensureConversation, openConversation, sendMessage, receiveAutoReply, saveDraft, setTyping, editMessage, deleteMessage, reportMessage, clearConversation, toggleBlock]);

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) throw new Error('useMessages must be used within a MessagesProvider');
  return context;
};