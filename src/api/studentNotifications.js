const getStudentToken = () =>
  localStorage.getItem('student_token') ||
  sessionStorage.getItem('student_token');

const normalizeNotification = (item) => ({
  id: item.id,
  group: item.group || 'Earlier',
  category: item.category || 'system',
  icon: item.icon || '🔔',
  title: item.title || 'Notification',
  text: item.text || '',
  time: item.time || '',
  read: Boolean(item.read),
  featured: Boolean(item.featured),
  actionLabel: item.action_label || null,
  actionTab: item.action_tab || null,
  actionPath: item.action_path || null,
  secondaryLabel: item.secondary_label || null,
  secondaryTab: item.secondary_tab || null,
  announcementId: item.announcement_id || null,
  readAt: item.read_at || null,
  createdAt: item.created_at || null,
});

async function studentNotificationRequest(
  endpoint,
  options = {}
) {
  const token = getStudentToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const validationError = data.errors
      ? Object.values(data.errors).flat()[0]
      : null;

    throw new Error(
      validationError ||
        data.message ||
        'Unable to complete the request.'
    );
  }

  return data;
}

export async function getStudentNotifications() {
  const data = await studentNotificationRequest(
    '/student/notifications'
  );

  return {
    notifications: Array.isArray(data.notifications)
      ? data.notifications.map(normalizeNotification)
      : [],
    unreadCount:
      Number(data.unread_count) || 0,
  };
}

export async function markStudentNotificationRead(
  notificationId
) {
  const data = await studentNotificationRequest(
    `/student/notifications/${notificationId}/read`,
    {
      method: 'PUT',
    }
  );

  return {
    ...data,
    notification: data.notification
      ? normalizeNotification(data.notification)
      : null,
  };
}

export async function markAllStudentNotificationsRead() {
  return studentNotificationRequest(
    '/student/notifications/read-all',
    {
      method: 'PUT',
    }
  );
}

export { getStudentToken };