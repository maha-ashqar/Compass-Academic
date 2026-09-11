const getStudentToken = () =>
  localStorage.getItem('student_token') ||
  sessionStorage.getItem('student_token');

async function studentAnnouncementRequest(
  endpoint,
  options = {}
) {
  const token = getStudentToken();

  if (!token) {
    throw new Error(
      'No authentication token found.'
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
    throw new Error(
      data?.message ||
        'Unable to load announcement.'
    );
  }

  return data;
}

export function getStudentAnnouncement(
  announcementId
) {
  return studentAnnouncementRequest(
    `/student/announcements/${announcementId}`
  );
}

export function markStudentAnnouncementRead(
  announcementId
) {
  return studentAnnouncementRequest(
    `/student/announcements/${announcementId}/read`,
    {
      method: 'PUT',
    }
  );
}