const API_URL = import.meta.env.VITE_API_URL;

function getTrainerToken() {
  return localStorage.getItem('trainer_token') || sessionStorage.getItem('trainer_token');
}

async function trainerProjectRequest(endpoint, options = {}) {
  const token = getTrainerToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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

export function getTrainerProjects() {
  return trainerProjectRequest('/trainer/projects');
}

export function getTrainerProject(projectId) {
  return trainerProjectRequest(`/trainer/projects/${projectId}`);
}

export function createTrainerProject(payload) {
  return trainerProjectRequest('/trainer/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function saveTrainerProjectReview(projectId, payload) {
  return trainerProjectRequest(`/trainer/projects/${projectId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function approveTrainerProject(projectId, payload) {
  return trainerProjectRequest(`/trainer/projects/${projectId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function requestTrainerProjectChanges(projectId, payload) {
  return trainerProjectRequest(
    `/trainer/projects/${projectId}/request-changes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export function unpublishTrainerProject(projectId) {
  return trainerProjectRequest(`/trainer/projects/${projectId}/unpublish`, {
    method: 'POST',
  });
}

export function deleteTrainerProject(projectId, reason) {
  return trainerProjectRequest(`/trainer/projects/${projectId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}