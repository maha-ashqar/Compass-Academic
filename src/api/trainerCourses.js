const API_URL = import.meta.env.VITE_API_URL;

function getTrainerToken() {
  return (
    localStorage.getItem('trainer_token') ||
    sessionStorage.getItem('trainer_token')
  );
}

async function trainerCourseRequest(endpoint, options = {}) {
  const token = getTrainerToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers || {}),
    },
  });

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

export function getTrainerCourses() {
  return trainerCourseRequest('/trainer/courses');
}

export function createTrainerCourse(payload) {
  return trainerCourseRequest('/trainer/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTrainerCourse(courseId, payload) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export function publishTrainerCourse(courseId) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/publish`,
    {
      method: 'POST',
    }
  );
}

export function hideTrainerCourse(courseId) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/hide`,
    {
      method: 'POST',
    }
  );
}

export function archiveTrainerCourse(courseId) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/archive`,
    {
      method: 'POST',
    }
  );
}

export function duplicateTrainerCourse(courseId) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/duplicate`,
    {
      method: 'POST',
    }
  );
}

export function deleteTrainerCourse(courseId, reason) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }
  );
}

export function createTrainerCourseModule(
  courseId,
  title
) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/modules`,
    {
      method: 'POST',
      body: JSON.stringify({ title }),
    }
  );
}

export function reorderTrainerCourseModules(
  courseId,
  moduleIds
) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/modules/reorder`,
    {
      method: 'PUT',
      body: JSON.stringify({
        module_ids: moduleIds,
      }),
    }
  );
}

export function createTrainerLesson(
  courseId,
  moduleId,
  payload
) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/modules/${moduleId}/lessons`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export function updateTrainerLesson(
  courseId,
  lessonId,
  payload
) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/lessons/${lessonId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export function deleteTrainerLesson(
  courseId,
  lessonId
) {
  return trainerCourseRequest(
    `/trainer/courses/${courseId}/lessons/${lessonId}`,
    {
      method: 'DELETE',
    }
  );
}