/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const NotificationsContext = createContext(null);

const initialNotifications = [
  {
    id: 1, group: 'Today', category: 'academics', icon: '🎓',
    title: 'Grade Released: Data Structures',
    text: "Your final grade for CS301 has been posted. You achieved an 'A'. Well done!",
    time: '10m ago', read: false, actionLabel: 'View Grade', actionTab: 'Courses',
  },
  {
    id: 2, group: 'Today', category: 'system', icon: '⚠️',
    title: 'Library Book Overdue',
    text: "'Advanced Algorithms' was due yesterday. Please return it to avoid further fines.",
    time: '2h ago', read: false, actionLabel: 'Renew Now', actionTab: null,
  },
  {
    id: 3, group: 'Yesterday', category: 'internships', icon: '💼',
    title: 'Google Summer Internship 2024',
    text: "Your application status has been updated to 'Interview Stage'. Please select a time slot for your technical screening.",
    time: '1d ago', read: false, featured: true,
    actionLabel: 'Schedule Interview', actionTab: 'Messages',
    secondaryLabel: 'View Details', secondaryTab: 'Messages',
  },
  {
    id: 4, group: 'Yesterday', category: 'internships', icon: '👥',
    title: 'New Workshop: AI in Ethics',
    text: 'Join Dr. Sarah Chen for a deep dive into the societal impacts of large language models this Friday at 4 PM.',
    time: '1d ago', read: false, actionTab: 'Courses',
  },
  {
    id: 5, group: 'Last Week', category: 'system', icon: 'ℹ️',
    title: 'Maintenance Notice',
    text: 'Student portal will be down for scheduled maintenance this Sunday.',
    time: '4d ago', read: true, actionTab: null,
  },
  {
    id: 6, group: 'Last Week', category: 'academics', icon: '✅',
    title: 'Tuition Payment Received',
    text: 'Your payment for Semester 2 has been processed successfully. Your receipt is attached.',
    time: '5d ago', read: true, actionTab: null,
  },
  {
    id: 7, group: 'Last Week', category: 'academics', icon: '✉️',
    title: 'New Message from Mentor',
    text: 'Your mentor sent you a message regarding your project proposal.',
    time: '6d ago', read: true, actionTab: 'Messages',
  },
];

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications]);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // يستخدمها المدرب لبث توجيه/إعلان يوصل مباشرة لكل الطلاب (نفس الـ Provider مشترك بين الطالب والمدرب)
  const addNotification = ({
    title,
    text,
    category = 'academics',
    icon = '📢',
    actionLabel = null,
    actionTab = null,
    featured = false,
    actionPath = null,
    announcementId = null,
    audienceType = 'all',
    audienceValue = '',
  }) => {
    const newNotification = {
      id: Date.now(),
      group: 'Today',
      category,
      icon,
      title,
      text,
      time: 'Just now',
      read: false,
      featured,
      actionLabel,
      actionTab,
      actionPath,
      announcementId,
      audienceType,
      audienceValue,
    };
    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getStudentNotifications = (student) => notifications.filter((item) => {
    if (!item.audienceType || item.audienceType === 'all') return true;
    const expected = String(item.audienceValue || '').toLowerCase();
    if (item.audienceType === 'faculty') return String(student?.faculty || '').toLowerCase() === expected;
    if (item.audienceType === 'major') return String(student?.major || student?.program || '').toLowerCase() === expected;
    if (item.audienceType === 'course') return (student?.courses || []).some((course) => String(course.id || course.title || course).toLowerCase() === expected);
    if (item.audienceType === 'students') return expected.split(',').map((value) => value.trim()).includes(String(student?.email || student?.id).toLowerCase());
    return true;
  });

  return (
    <NotificationsContext.Provider
      value={{ notifications, getStudentNotifications, markAsRead, markAllRead, addNotification, unreadCount }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
