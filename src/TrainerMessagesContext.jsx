/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const TrainerMessagesContext = createContext(null);

const STORAGE_KEY = 'trainer_messages_conversations_v1';

const defaultConversations = [
  {
    id: 1,
    name: 'Mohammed Ali',
    role: 'Student — Software Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80',
    status: 'online',
    blocked: false,
    info: { label1: 'Enrolled Course', value1: 'Software Engineering', label2: 'Progress', value2: '74%' },
    files: [],
    images: [],
    messages: [
      { id: 1, sender: 'them', text: 'Hi! I had a question about the architecture assignment.', time: '2026-07-15T10:00:00' },
      { id: 2, sender: 'me', text: 'Sure, go ahead and ask.', time: '2026-07-15T10:05:00' },
    ],
  },
  {
    id: 2,
    name: 'Maha Khaled',
    role: 'Student — Advanced UI/UX Design',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&q=80',
    status: 'offline',
    blocked: false,
    info: { label1: 'Enrolled Course', value1: 'Advanced UI/UX Design', label2: 'Progress', value2: '40%' },
    files: [],
    images: [],
    messages: [
      { id: 1, sender: 'them', text: 'Thank you for the feedback on my last submission!', time: '2026-07-14T09:00:00' },
    ],
  },
];

const loadFromStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key} from storage:`, error);
    return fallback;
  }
};

export const TrainerMessagesProvider = ({ children }) => {
  const [conversations, setConversations] = useState(() =>
    loadFromStorage(STORAGE_KEY, defaultConversations)
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save trainer conversations to storage:', error);
    }
  }, [conversations]);

  const sendMessage = (contactId, text) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c;
        const newMsg = { id: Date.now(), sender: 'me', text, time: new Date().toISOString() };
        return { ...c, messages: [...c.messages, newMsg] };
      })
    );
  };

  const receiveAutoReply = (contactId, text) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c;
        const newMsg = { id: Date.now() + 1, sender: 'them', text, time: new Date().toISOString() };
        return { ...c, messages: [...c.messages, newMsg] };
      })
    );
  };

  const clearConversation = (contactId) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, messages: [] } : c))
    );
  };

  const toggleBlock = (contactId) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, blocked: !c.blocked } : c))
    );
  };

  return (
    <TrainerMessagesContext.Provider
      value={{ conversations, sendMessage, receiveAutoReply, clearConversation, toggleBlock }}
    >
      {children}
    </TrainerMessagesContext.Provider>
  );
};

export const useTrainerMessages = () => {
  const context = useContext(TrainerMessagesContext);
  if (!context) {
    throw new Error('useTrainerMessages must be used within a TrainerMessagesProvider');
  }
  return context;
};
