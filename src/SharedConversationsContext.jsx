/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* ============================================================
   SHARED CONVERSATIONS STORE
   One conversation object is now visible to BOTH the student
   and the trainer side — there is no more "student's copy" vs
   "trainer's copy" of the same chat. A message sent by either
   role is the same array entry the other role reads.

   A conversation is identified by (studentEmail, trainerEmail),
   so both a student's "Messages" page and a trainer's "Student
   messages" page resolve to the exact same object here.
   ============================================================ */

const STORAGE_KEY = 'compass_conversations_v1';
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;

/* ---------- The fixed roster of instructors a student can message ---------- */
export const trainerDirectory = [
  { email: 'ahmad@compass.edu.sa', name: 'Eng. Ahmad Khalil', role: 'Instructor', specialty: 'Software Engineering', course: 'Front-End Development', status: 'online', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80' },
  { email: 'sara@compass.edu.sa', name: 'Eng. Sara Youssef', role: 'Instructor', specialty: 'Mobile Engineering', course: 'Flutter Masterclass', status: 'online', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80' },
  { email: 'omar@compass.edu.sa', name: 'Dr. Omar Fares', role: 'Instructor', specialty: 'Artificial Intelligence', course: 'Applied AI', status: 'away', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&q=80' },
  { email: 'rania@compass.edu.sa', name: 'Dr. Rania Saleh', role: 'Academic Mentor', specialty: 'Academic Research', course: 'Research Foundations', status: 'away', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80' },
  { email: 'yazan@compass.edu.sa', name: 'Eng. Yazan Nasser', role: 'Instructor', specialty: 'Full-Stack Development', course: 'Modern Web Applications', status: 'offline', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80' },
  { email: 'lina@compass.edu.sa', name: 'Lina Aboud', role: 'Project Mentor', specialty: 'Product Design', course: 'UI/UX Design Principles', status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80' },
];

export const getTrainerByEmail = (email = '') =>
  trainerDirectory.find((t) => t.email.toLowerCase() === email.toLowerCase()) || null;

const conversationId = (studentEmail, trainerEmail) =>
  `${(studentEmail || '').trim().toLowerCase()}::${(trainerEmail || '').trim().toLowerCase()}`;

/* Seed one real, working conversation between the two default demo
   accounts (mohammed@university.edu.sa the default student, and
   ahmad@compass.edu.sa the default trainer) so opening either
   dashboard for the first time shows a genuinely connected thread —
   not two disconnected mock datasets. */
const seedConversations = [
  {
    id: conversationId('mohammed@university.edu.sa', 'ahmad@compass.edu.sa'),
    studentEmail: 'mohammed@university.edu.sa',
    studentName: 'Mohammed Ali',
    studentAvatar: '',
    trainerEmail: 'ahmad@compass.edu.sa',
    topic: 'Responsive Portfolio Website · Assignment due Aug 10',
    accepted: true,
    blockedBy: null,
    unreadForStudent: 0,
    unreadForTrainer: 1,
    messages: [
      { id: 'seed-1', sender: 'trainer', text: 'Hello Mohammed, I reviewed your first draft. The structure is good, but check the mobile navigation.', time: '2026-08-04T09:50:00', read: true, attachments: [] },
      { id: 'seed-2', sender: 'student', text: 'Thank you. I updated the navigation and improved the responsive breakpoint.', time: '2026-08-04T10:18:00', read: true, attachments: [] },
      { id: 'seed-3', sender: 'trainer', text: 'The new version is much clearer. Please also attach the accessibility checklist before the deadline.', time: '2026-08-04T10:42:00', read: false, attachments: [] },
    ],
  },
];

const readStorage = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : seedConversations;
  } catch {
    return seedConversations;
  }
};

const ConversationsContext = createContext(null);

export function ConversationsProvider({ children }) {
  const [conversations, setConversations] = useState(readStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const mutate = useCallback((id, updater) => {
    setConversations((current) => current.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  /** Student opens (or silently creates) the thread with a given trainer. */
  const ensureConversation = useCallback((studentData, trainerEmail) => {
    const id = conversationId(studentData.email, trainerEmail);
    setConversations((current) => {
      if (current.some((c) => c.id === id)) return current;
      const trainer = getTrainerByEmail(trainerEmail);
      return [
        {
          id,
          studentEmail: studentData.email,
          studentName: studentData.displayName || 'Student',
          studentAvatar: studentData.avatar || '',
          trainerEmail,
          topic: trainer?.course || 'General',
          accepted: false,
          blockedBy: null,
          unreadForStudent: 0,
          unreadForTrainer: 0,
          messages: [],
        },
        ...current,
      ];
    });
    return id;
  }, []);

  const sendMessage = useCallback((id, role, { text = '', attachments = [] } = {}) => {
    const trimmed = text.trim();
    if (!trimmed && !attachments.length) return;
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: role,
      text: trimmed,
      attachments,
      time: new Date().toISOString(),
      read: false,
      deleted: false,
    };
    mutate(id, (c) => ({
      ...c,
      accepted: role === 'trainer' ? true : c.accepted,
      messages: [...c.messages, message],
      unreadForStudent: role === 'trainer' ? c.unreadForStudent + 1 : c.unreadForStudent,
      unreadForTrainer: role === 'student' ? c.unreadForTrainer + 1 : c.unreadForTrainer,
    }));
  }, [mutate]);

  /** Marks every message from the *other* party as read, and zeroes this role's unread count. */
  const openConversation = useCallback((id, role) => {
    mutate(id, (c) => ({
      ...c,
      unreadForStudent: role === 'student' ? 0 : c.unreadForStudent,
      unreadForTrainer: role === 'trainer' ? 0 : c.unreadForTrainer,
      messages: c.messages.map((m) => (m.sender !== role ? { ...m, read: true } : m)),
    }));
  }, [mutate]);

  const editMessage = useCallback((id, role, messageId, text) => mutate(id, (c) => ({
    ...c,
    messages: c.messages.map((m) => {
      const editable = m.id === messageId && m.sender === role && !m.deleted
        && Date.now() - new Date(m.time).getTime() <= MESSAGE_EDIT_WINDOW_MS;
      return editable ? { ...m, text: text.trim(), editedAt: new Date().toISOString() } : m;
    }),
  })), [mutate]);

  const deleteMessage = useCallback((id, role, messageId) => mutate(id, (c) => ({
    ...c,
    messages: c.messages.map((m) => (m.id === messageId && m.sender === role
      ? { ...m, text: '', attachments: [], deleted: true }
      : m)),
  })), [mutate]);

  const acceptConversation = useCallback((id) => mutate(id, (c) => ({ ...c, accepted: true, blockedBy: null })), [mutate]);
  const declineConversation = useCallback((id) => mutate(id, (c) => ({ ...c, blockedBy: 'trainer' })), [mutate]);
  const toggleBlock = useCallback((id, role) => mutate(id, (c) => ({
    ...c,
    blockedBy: c.blockedBy ? null : role,
  })), [mutate]);
  const clearConversation = useCallback((id) => mutate(id, (c) => ({ ...c, messages: [] })), [mutate]);

  const value = useMemo(() => ({
    conversations,
    ensureConversation,
    sendMessage,
    openConversation,
    editMessage,
    deleteMessage,
    acceptConversation,
    declineConversation,
    toggleBlock,
    clearConversation,
  }), [conversations, ensureConversation, sendMessage, openConversation, editMessage, deleteMessage, acceptConversation, declineConversation, toggleBlock, clearConversation]);

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
}

function useConversationsContext() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error('useConversations must be used within a ConversationsProvider');
  return ctx;
}

/** Student-side view: conversations that belong to the current student. */
export function useStudentConversations(studentData) {
  const ctx = useConversationsContext();
  const email = (studentData?.email || '').toLowerCase();
  const conversations = useMemo(
    () => ctx.conversations
      .filter((c) => c.studentEmail.toLowerCase() === email)
      .map((c) => ({ ...c, contact: getTrainerByEmail(c.trainerEmail) })),
    [ctx.conversations, email],
  );
  return {
    conversations,
    directory: trainerDirectory,
    startConversation: (trainerEmail) => ctx.ensureConversation(studentData, trainerEmail),
    sendMessage: (id, payload) => ctx.sendMessage(id, 'student', payload),
    openConversation: (id) => ctx.openConversation(id, 'student'),
    editMessage: (id, messageId, text) => ctx.editMessage(id, 'student', messageId, text),
    deleteMessage: (id, messageId) => ctx.deleteMessage(id, 'student', messageId),
    toggleBlock: (id) => ctx.toggleBlock(id, 'student'),
    clearConversation: ctx.clearConversation,
  };
}

/** Trainer-side view: conversations started by students with this trainer. */
export function useTrainerConversations(trainerData) {
  const ctx = useConversationsContext();
  const email = (trainerData?.email || '').toLowerCase();
  const conversations = useMemo(
    () => ctx.conversations.filter((c) => c.trainerEmail.toLowerCase() === email),
    [ctx.conversations, email],
  );
  return {
    conversations,
    sendMessage: (id, payload) => ctx.sendMessage(id, 'trainer', payload),
    openConversation: (id) => ctx.openConversation(id, 'trainer'),
    editMessage: (id, messageId, text) => ctx.editMessage(id, 'trainer', messageId, text),
    deleteMessage: (id, messageId) => ctx.deleteMessage(id, 'trainer', messageId),
    toggleBlock: (id) => ctx.toggleBlock(id, 'trainer'),
    acceptConversation: ctx.acceptConversation,
    declineConversation: ctx.declineConversation,
    clearConversation: ctx.clearConversation,
  };
}

export const readFileAsAttachment = (file) => new Promise((resolve) => {
  const base = { id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: file.name, size: file.size, type: file.type, dataUrl: '' };
  if (file.size > 3 * 1024 * 1024) return resolve(base);
  const reader = new FileReader();
  reader.onerror = () => resolve(base);
  reader.onload = () => resolve({ ...base, dataUrl: String(reader.result || '') });
  reader.readAsDataURL(file);
});
