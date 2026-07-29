/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const MessagesContext = createContext(null);

const defaultConversations = [
  {
    id: 1,
    name: 'Dr. Sarah Al-Mansour',
    role: 'Academic Advisor',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80',
    status: 'online',
    blocked: false,
    info: { label1: 'Primary Course', value1: 'CS402: Advanced Algorithms', label2: 'Office Hours', value2: 'Mon/Wed 2:00 PM - 4:00 PM' },
    files: [
      { name: 'graduation_proposal_v2.pdf', size: '2.4 MB · Yesterday' },
      { name: 'reading_list.docx', size: '1.1 MB · 2 days ago' },
    ],
    images: [
      'https://images.unsplash.com/photo-1517842645767-c639042777db?w=200&h=200&fit=crop&q=80',
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&h=200&fit=crop&q=80',
    ],
    messages: [
      { id: 1, sender: 'them', text: 'Hello! I\'ve had a chance to look over your research proposal for the Advanced Algorithm course.', time: '2026-07-01T10:30:00' },
      { id: 2, sender: 'me', text: 'That\'s great! I was particularly worried about the methodology section. Was it clear enough?', time: '2026-07-01T10:35:00' },
      { id: 3, sender: 'them', text: 'It was quite clear. I\'ve attached some additional reading that might help you refine the complexity analysis part.', time: '2026-07-01T10:40:00' },
      { id: 4, sender: 'them', text: 'Yes, the feedback is ready for your review in the portal, or we can discuss it briefly here.', time: '2026-07-01T10:42:00' },
    ],
  },
  {
    id: 2,
    name: 'Eng. Ahmad Khalil',
    role: 'Software Engineering Instructor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80',
    status: 'offline',
    blocked: false,
    info: { label1: 'Primary Course', value1: 'SE301: Software Architecture', label2: 'Office Hours', value2: 'Sun/Tue 11:00 AM - 1:00 PM' },
    files: [{ name: 'assignment_feedback.pdf', size: '860 KB · 3 days ago' }],
    images: [],
    messages: [
      { id: 1, sender: 'them', text: 'Great progress on the last assignment!', time: '2026-06-30T09:15:00' },
      { id: 2, sender: 'me', text: 'Thank you! I focused on the design patterns section.', time: '2026-06-30T09:20:00' },
    ],
  },
  {
    id: 3,
    name: 'Compass Academy Support',
    role: 'Support Team',
    avatar: null,
    status: 'online',
    blocked: false,
    info: { label1: 'Department', value1: 'Student Support', label2: 'Availability', value2: '24/7 via chat' },
    files: [],
    images: [],
    messages: [
      { id: 1, sender: 'them', text: 'Welcome to Compass Academy! Let us know if you need any help.', time: '2026-06-28T08:00:00' },
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

export const MessagesProvider = ({ children }) => {
  const [conversations, setConversations] = useState(() =>
    loadFromStorage('messages_conversations_v2', defaultConversations)
  );

  useEffect(() => {
    try {
      localStorage.setItem('messages_conversations_v2', JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations to storage:', error);
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
        return { ...c, messages: [...c.messages, newMsg], unread: false };
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
    <MessagesContext.Provider
      value={{ conversations, sendMessage, receiveAutoReply, clearConversation, toggleBlock }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};