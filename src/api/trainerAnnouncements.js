const getTrainerToken = () =>
  localStorage.getItem('trainer_token') ||
  sessionStorage.getItem('trainer_token');

async function trainerAnnouncementsRequest(
  endpoint,
  options = {}
) {
  const token = getTrainerToken();

  if (!token) {
    throw new Error(
      'No trainer authentication token found.'
    );
  }

  const isFormData =
    options.body instanceof FormData;

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,

        ...(isFormData
          ? {}
          : options.body
            ? {
                'Content-Type':
                  'application/json',
              }
            : {}),

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
    const validationError =
      data?.errors &&
      Object.values(data.errors)
        .flat()
        .find(Boolean);

    throw new Error(
      validationError ||
        data?.message ||
        'Unable to complete the request.'
    );
  }

  return data;
}

function announcementFormData(
  announcement,
  { update = false } = {}
) {
  const form = new FormData();

  if (update) {
    form.append('_method', 'PUT');
  }

  form.append(
    'title',
    announcement.title?.trim() || ''
  );

  form.append(
    'content',
    announcement.content?.trim() || ''
  );

  form.append(
    'type',
    announcement.type || 'General'
  );

  form.append(
    'audienceType',
    announcement.audienceType || 'all'
  );

  if (announcement.audienceValue) {
    form.append(
      'audienceValue',
      announcement.audienceValue
    );
  }

  if (announcement.link) {
    form.append(
      'link',
      announcement.link
    );
  }

  if (announcement.publishAt) {
    form.append(
      'publishAt',
      announcement.publishAt
    );
  }

  (
    announcement.audienceStudentIds ||
    []
  ).forEach((studentId) => {
    form.append(
      'audienceStudentIds[]',
      studentId
    );
  });

  if (
    announcement.attachment?.file
    instanceof File
  ) {
    form.append(
      'attachment',
      announcement.attachment.file
    );
  }

  if (announcement.removeAttachment) {
    form.append(
      'removeAttachment',
      '1'
    );
  }

  return form;
}

export function getTrainerAnnouncements() {
  return trainerAnnouncementsRequest(
    '/trainer/announcements'
  );
}

export function getTrainerAnnouncement(
  announcementId
) {
  return trainerAnnouncementsRequest(
    `/trainer/announcements/${announcementId}`
  );
}

export function createTrainerAnnouncement(
  announcement
) {
  return trainerAnnouncementsRequest(
    '/trainer/announcements',
    {
      method: 'POST',
      body: announcementFormData(
        announcement
      ),
    }
  );
}

export function updateTrainerAnnouncement(
  announcementId,
  announcement
) {
  return trainerAnnouncementsRequest(
    `/trainer/announcements/${announcementId}`,
    {
      method: 'POST',
      body: announcementFormData(
        announcement,
        {
          update: true,
        }
      ),
    }
  );
}

export function publishTrainerAnnouncement(
  announcementId
) {
  return trainerAnnouncementsRequest(
    `/trainer/announcements/${announcementId}/publish`,
    {
      method: 'POST',
    }
  );
}

export function scheduleTrainerAnnouncement(
  announcementId,
  publishAt
) {
  return trainerAnnouncementsRequest(
    `/trainer/announcements/${announcementId}/schedule`,
    {
      method: 'POST',
      body: JSON.stringify({
        publishAt,
      }),
    }
  );
}

export function archiveTrainerAnnouncement(
  announcementId
) {
  return trainerAnnouncementsRequest(
    `/trainer/announcements/${announcementId}/archive`,
    {
      method: 'POST',
    }
  );
}

export function duplicateTrainerAnnouncement(
  announcementId
) {
  return trainerAnnouncementsRequest(
    `/trainer/announcements/${announcementId}/duplicate`,
    {
      method: 'POST',
    }
  );
}

export function deleteTrainerAnnouncement(
  announcementId
) {
  return trainerAnnouncementsRequest(
    `/trainer/announcements/${announcementId}`,
    {
      method: 'DELETE',
    }
  );
}

export function getTrainerAnnouncementStats(
  announcementId
) {
  return trainerAnnouncementsRequest(
    `/trainer/announcements/${announcementId}/stats`
  );
}

export function publishDueTrainerAnnouncements() {
  return trainerAnnouncementsRequest(
    '/trainer/announcements/publish-due',
    {
      method: 'POST',
    }
  );
}