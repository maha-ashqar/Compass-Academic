/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNotifications } from './NotificationsContext';

const AnnouncementsContext = createContext(null);
const STORAGE_KEY = 'compass_announcements_v1';

export const ANNOUNCEMENT_TYPES = ['Policy', 'Competition', 'Faculty instructions', 'General'];

const seedAnnouncements = [
  {
    id: 1,
    title: 'Updated academic integrity policy',
    content: 'We have updated the academic integrity policy to reflect current standards and technologies. All students are expected to review the policy carefully.\n\nKey updates include guidance on AI tool usage, collaboration boundaries, and citation requirements.',
    type: 'Policy', status: 'published', audienceType: 'all', audienceLabel: 'All students',
    attachment: { name: 'Academic Integrity Policy_2025.pdf', size: '512 KB' },
    createdAt: '2026-08-12T10:00:00.000Z', publishedAt: '2026-08-12T10:00:00.000Z',
    recipients: 428, readBy: [],
  },
  {
    id: 2, title: 'AI Innovation Challenge 2026',
    content: 'Registration for the AI Innovation Challenge is opening soon. Build an AI solution for a real campus challenge.',
    type: 'Competition', status: 'scheduled', audienceType: 'major', audienceValue: 'Computer Engineering',
    audienceLabel: 'Computer Engineering students', publishAt: '2026-08-20T09:00:00.000Z',
    link: '/student-dashboard/competitions', createdAt: '2026-08-13T12:00:00.000Z', recipients: 0, readBy: [],
  },
];

const loadAnnouncements = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : seedAnnouncements;
  } catch { return seedAnnouncements; }
};

export const AnnouncementsProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState(loadAnnouncements);
  const { addNotification } = useNotifications();

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements)); }
    catch (error) { console.error('Failed to save announcements:', error); }
  }, [announcements]);

  const createAnnouncementNotifications = useCallback((announcement) => {
    addNotification({
      title: announcement.title,
      text: announcement.content,
      category: 'announcement',
      icon: announcement.type === 'Competition' ? '🏆' : '📢',
      actionLabel: 'Read announcement',
      actionPath: `/student-dashboard/announcements/${announcement.id}`,
      announcementId: announcement.id,
      audienceType: announcement.audienceType,
      audienceValue: announcement.audienceValue,
    });
  }, [addNotification]);

  const createAnnouncement = useCallback((data) => {
    const item = { ...data, id: Date.now(), status: 'draft', createdAt: new Date().toISOString(), recipients: 0, readBy: [], auditLog: [] };
    setAnnouncements((prev) => [item, ...prev]);
    return item;
  }, []);

  const updateAnnouncement = useCallback((id, data) => {
    setAnnouncements((prev) => prev.map((item) => String(item.id) === String(id)
      ? { ...item, ...data, updatedAt: new Date().toISOString() }
      : item));
  }, []);

  const publishAnnouncement = useCallback((id, { notifyUpdate = false } = {}) => {
    let published;
    setAnnouncements((prev) => prev.map((item) => {
      if (String(item.id) !== String(id)) return item;
      const firstPublish = item.status !== 'published';
      published = { ...item, status: 'published', publishedAt: item.publishedAt || new Date().toISOString(), publishAt: null, recipients: item.recipients || 428 };
      if (firstPublish || notifyUpdate) createAnnouncementNotifications(published);
      return published;
    }));
    return published;
  }, [createAnnouncementNotifications]);

  const scheduleAnnouncement = useCallback((id, publishAt) => updateAnnouncement(id, { status: 'scheduled', publishAt }), [updateAnnouncement]);
  const archiveAnnouncement = useCallback((id) => updateAnnouncement(id, { status: 'archived', archivedAt: new Date().toISOString() }), [updateAnnouncement]);
  const duplicateAnnouncement = useCallback((id) => {
    const source = announcements.find((item) => String(item.id) === String(id));
    if (!source) return null;
    return createAnnouncement({ ...source, id: undefined, title: `${source.title} (Copy)`, publishedAt: null, publishAt: null });
  }, [announcements, createAnnouncement]);

  const markAnnouncementRead = useCallback((id, studentId) => {
    if (!studentId) return;
    setAnnouncements((prev) => {
      const target = prev.find((item) => String(item.id) === String(id));
      if (!target || (target.readBy || []).includes(studentId)) return prev;
      return prev.map((item) => String(item.id) === String(id)
        ? { ...item, readBy: [...(item.readBy || []), studentId] }
        : item);
    });
  }, []);

  useEffect(() => {
    const publishDue = () => {
      const now = Date.now();
      announcements.filter((item) => item.status === 'scheduled' && new Date(item.publishAt).getTime() <= now)
        .forEach((item) => publishAnnouncement(item.id));
    };
    publishDue();
    const timer = window.setInterval(publishDue, 30000);
    return () => window.clearInterval(timer);
  }, [announcements, publishAnnouncement]);

  const api = useMemo(() => ({
    announcements,
    getTrainerAnnouncements: () => announcements.filter((item) => item.status !== 'archived'),
    getAnnouncementById: (id) => announcements.find((item) => String(item.id) === String(id)) || null,
    createAnnouncement,
    saveAnnouncementDraft: createAnnouncement,
    updateAnnouncement,
    publishAnnouncement,
    scheduleAnnouncement,
    archiveAnnouncement,
    duplicateAnnouncement,
    markAnnouncementRead,
    getAnnouncementDeliveryStats: (id) => {
      const item = announcements.find((entry) => String(entry.id) === String(id));
      return { recipients: item?.recipients || 0, views: item?.readBy?.length || 0 };
    },
  }), [announcements, archiveAnnouncement, createAnnouncement, duplicateAnnouncement, markAnnouncementRead, publishAnnouncement, scheduleAnnouncement, updateAnnouncement]);

  return <AnnouncementsContext.Provider value={api}>{children}</AnnouncementsContext.Provider>;
};

export const useAnnouncements = () => {
  const value = useContext(AnnouncementsContext);
  if (!value) throw new Error('useAnnouncements must be used within AnnouncementsProvider');
  return value;
};
