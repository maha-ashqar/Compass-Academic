/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TrainerMessagesContext = createContext(null);
const CONVERSATIONS_KEY = 'trainer_messages_conversations_v3';
const DRAFTS_KEY = 'trainer_messages_drafts_v1';

const defaultConversations = [
  {
    id: 1,
    studentId: '20231042',
    name: 'Mohammed Ali',
    role: 'Software Engineering student',
    course: 'Scalable Software Architecture',
    progress: 74,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80',
    status: 'online',
    unreadCount: 2,
    blocked: false,
    messages: [
      { id: 11, sender: 'them', text: 'Hello, I need clarification about the architecture assignment.', time: '2026-08-04T09:40:00', status: 'read' },
      { id: 12, sender: 'me', text: 'Of course. Which part would you like me to explain?', time: '2026-08-04T09:44:00', status: 'read' },
      { id: 13, sender: 'them', text: 'Should the service diagram include the API gateway and database boundaries?', time: '2026-08-04T09:47:00', status: 'delivered' },
    ],
  },
  {
    id: 2,
    studentId: '20232218',
    name: 'Maha Khaled',
    role: 'UI/UX Design student',
    course: 'Crafting Digital Experiences',
    progress: 61,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&q=80',
    status: 'online',
    unreadCount: 0,
    blocked: false,
    messages: [
      { id: 21, sender: 'them', text: 'Thank you for the detailed feedback on my prototype.', time: '2026-08-03T11:20:00', status: 'read' },
      { id: 22, sender: 'me', text: 'You are welcome. The revised navigation is much clearer.', time: '2026-08-03T11:28:00', status: 'read' },
    ],
  },
  {
    id: 3,
    studentId: '20230165',
    name: 'Yousef Amin',
    role: 'Artificial Intelligence student',
    course: 'Applied AI & Machine Learning',
    progress: 48,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80',
    status: 'away',
    unreadCount: 1,
    blocked: false,
    messages: [
      { id: 31, sender: 'them', text: 'I uploaded the revised notebook and evaluation report.', time: '2026-08-04T08:12:00', status: 'delivered' },
    ],
  },
  {
    id: 4,
    studentId: '20233409',
    name: 'Lina Aboud',
    role: 'Front-End Development student',
    course: 'Modern Web Applications',
    progress: 86,
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&q=80',
    status: 'offline',
    unreadCount: 0,
    blocked: false,
    messages: [
      { id: 41, sender: 'me', text: 'Your component documentation has been reviewed.', time: '2026-08-02T15:10:00', status: 'read' },
    ],
  },
];

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export function TrainerMessagesProvider({ children }) {
  const [conversations, setConversations] = useState(() => readStorage(CONVERSATIONS_KEY, defaultConversations));
  const [drafts, setDrafts] = useState(() => readStorage(DRAFTS_KEY, {}));
  const [typingIds, setTypingIds] = useState([]);

  useEffect(() => {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  }, [drafts]);

  const updateConversation = useCallback((contactId, updater) => {
    setConversations((current) => current.map((conversation) => (
      conversation.id === contactId ? updater(conversation) : conversation
    )));
  }, []);

  const markRead = useCallback((contactId) => {
    updateConversation(contactId, (conversation) => ({ ...conversation, unreadCount: 0 }));
  }, [updateConversation]);

  const saveDraft = useCallback((contactId, text) => {
    setDrafts((current) => ({ ...current, [contactId]: text }));
  }, []);

  const sendMessage = useCallback((contactId, payload) => {
    const data = typeof payload === 'string' ? { text: payload } : payload;
    const message = {
      id: Date.now(),
      sender: 'me',
      text: data.text || '',
      attachments: data.attachments || [],
      replyTo: data.replyTo || null,
      time: new Date().toISOString(),
      status: 'sent',
    };
    updateConversation(contactId, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, message],
    }));
    saveDraft(contactId, '');
    window.setTimeout(() => {
      updateConversation(contactId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((item) => (
          item.id === message.id ? { ...item, status: 'delivered' } : item
        )),
      }));
    }, 600);
    return message;
  }, [saveDraft, updateConversation]);

  const receiveAutoReply = useCallback((contactId, text) => {
    updateConversation(contactId, (conversation) => ({
      ...conversation,
      unreadCount: conversation.unreadCount + 1,
      messages: [...conversation.messages, {
        id: Date.now() + 1,
        sender: 'them',
        text,
        time: new Date().toISOString(),
        status: 'delivered',
      }],
    }));
  }, [updateConversation]);

  const setTyping = useCallback((contactId, value) => {
    setTypingIds((current) => value
      ? [...new Set([...current, contactId])]
      : current.filter((id) => id !== contactId));
  }, []);

  const deleteMessage = useCallback((contactId, messageId) => {
    updateConversation(contactId, (conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => (
        message.id === messageId ? { ...message, text: '', attachments: [], deleted: true } : message
      )),
    }));
  }, [updateConversation]);

  const clearConversation = useCallback((contactId) => {
    updateConversation(contactId, (conversation) => ({ ...conversation, messages: [], unreadCount: 0 }));
  }, [updateConversation]);

  const toggleBlock = useCallback((contactId) => {
    updateConversation(contactId, (conversation) => ({ ...conversation, blocked: !conversation.blocked }));
  }, [updateConversation]);

  const unreadTotal = useMemo(
    () => conversations.reduce((total, item) => total + (item.unreadCount || 0), 0),
    [conversations]
  );

  const value = useMemo(() => ({
    conversations,
    drafts,
    typingIds,
    unreadTotal,
    markRead,
    saveDraft,
    sendMessage,
    receiveAutoReply,
    setTyping,
    deleteMessage,
    clearConversation,
    toggleBlock,
  }), [conversations, drafts, typingIds, unreadTotal, markRead, saveDraft, sendMessage,
    receiveAutoReply, setTyping, deleteMessage, clearConversation, toggleBlock]);

  return <TrainerMessagesContext.Provider value={value}>{children}</TrainerMessagesContext.Provider>;
}

export function useTrainerMessages() {
  const context = useContext(TrainerMessagesContext);
  if (!context) throw new Error('useTrainerMessages must be used within TrainerMessagesProvider');
  return context;
}