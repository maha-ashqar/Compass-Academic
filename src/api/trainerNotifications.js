const getTrainerToken = () =>
  localStorage.getItem('trainer_token') ||
  sessionStorage.getItem('trainer_token');

const normalizeNotification = (item) => ({
  id: item.id,
  type: item.type || 'system',
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

  assignmentId: item.assignment_id || null,
  submissionId: item.submission_id || null,
  projectId: item.project_id || null,
  competitionId: item.competition_id || null,
  registrationId: item.registration_id || null,
  studentId: item.student_id || null,
  courseId: item.course_id || null,

  readAt: item.read_at || null,
  createdAt: item.created_at || null,
});

async function trainerNotificationRequest(
  endpoint,
  options = {}
) {
  const token = getTrainerToken();

  if (!token) {
    throw new Error(
      'No trainer authentication token found.'
    );
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
    const validationError = data?.errors
      ? Object.values(data.errors).flat()[0]
      : null;

    throw new Error(
      validationError ||
        data?.message ||
        'Unable to complete the request.'
    );
  }

  return data;
}

export async function getTrainerNotifications() {
  const data = await trainerNotificationRequest(
    '/trainer/notifications'
  );

  return {
    notifications: Array.isArray(data.notifications)
      ? data.notifications.map(normalizeNotification)
      : [],

    unreadCount:
      Number(data.unread_count) || 0,
  };
}

export async function markTrainerNotificationRead(
  notificationId
) {
  const data = await trainerNotificationRequest(
    `/trainer/notifications/${notificationId}/read`,
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

export function markAllTrainerNotificationsRead() {
  return trainerNotificationRequest(
    '/trainer/notifications/read-all',
    {
      method: 'PUT',
    }
  );
}

export { getTrainerToken };