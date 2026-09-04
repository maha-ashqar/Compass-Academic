const getStudentToken = () => {
  return (
    localStorage.getItem('student_token') ||
    sessionStorage.getItem('student_token')
  );
};

const refreshStudentNotifications = () => {
  window.dispatchEvent(
    new Event('student-notifications-changed')
  );
};

async function studentProjectRequest(
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

export async function getStudentProjects() {
  return studentProjectRequest('/student/projects');
}

export async function getStudentProjectMeta() {
  return studentProjectRequest(
    '/student/projects/meta'
  );
}

export async function getStudentProject(
  projectId
) {
  return studentProjectRequest(
    `/student/projects/${projectId}`
  );
}

export async function createStudentProject(
  payload
) {
  return studentProjectRequest(
    '/student/projects',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function updateStudentProject(
  projectId,
  payload
) {
  return studentProjectRequest(
    `/student/projects/${projectId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function uploadStudentProjectMedia(
  projectId,
  media
) {
  const formData = new FormData();

  Object.entries(media).forEach(
    ([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    }
  );

  return studentProjectRequest(
    `/student/projects/${projectId}/media`,
    {
      method: 'POST',
      body: formData,
    }
  );
}

export async function deleteStudentProjectMedia(
  projectId,
  type
) {
  return studentProjectRequest(
    `/student/projects/${projectId}/media/${type}`,
    {
      method: 'DELETE',
    }
  );
}

export async function submitStudentProject(
  projectId
) {
  const data = await studentProjectRequest(
    `/student/projects/${projectId}/submit`,
    {
      method: 'POST',
    }
  );

  refreshStudentNotifications();

  return data;
}

export async function deleteStudentProject(
  projectId
) {
  return studentProjectRequest(
    `/student/projects/${projectId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function toggleStudentProjectLike(
  projectId
) {
  return studentProjectRequest(
    `/student/projects/${projectId}/like`,
    {
      method: 'POST',
    }
  );
}

export async function rateStudentProject(
  projectId,
  rating
) {
  return studentProjectRequest(
    `/student/projects/${projectId}/rating`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating }),
    }
  );
}