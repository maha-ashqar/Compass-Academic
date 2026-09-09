const API_URL = import.meta.env.VITE_API_URL;

function getTrainerToken() {
  return localStorage.getItem('trainer_token') || sessionStorage.getItem('trainer_token');
}

async function trainerAssignmentRequest(endpoint, options = {}) {
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

export function getTrainerAssignments() {
  return trainerAssignmentRequest('/trainer/assignments');
}

export function getTrainerAssignment(assignmentId) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}`
  );
}

export function createTrainerAssignment(payload) {
  return trainerAssignmentRequest('/trainer/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTrainerAssignment(assignmentId, payload) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export function publishTrainerAssignment(assignmentId) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/publish`,
    {
      method: 'POST',
    }
  );
}

export function duplicateTrainerAssignment(assignmentId) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/duplicate`,
    {
      method: 'POST',
    }
  );
}

export function archiveTrainerAssignment(assignmentId) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/archive`,
    {
      method: 'POST',
    }
  );
}

export function deleteTrainerAssignment(assignmentId, reason) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }
  );
}

export function extendTrainerAssignmentDeadline(
  assignmentId,
  deadlineAt
) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/extend-deadline`,
    {
      method: 'POST',
      body: JSON.stringify({
        deadline_at: deadlineAt,
      }),
    }
  );
}

export function closeTrainerAssignment(assignmentId, reason) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/close`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }
  );
}

export function reopenTrainerAssignment(
  assignmentId,
  reason,
  deadlineAt
) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/reopen`,
    {
      method: 'POST',
      body: JSON.stringify({
        reason,
        deadline_at: deadlineAt,
      }),
    }
  );
}

export function getTrainerAssignmentSubmissions(assignmentId) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/submissions`
  );
}

export function gradeTrainerSubmission(
  assignmentId,
  submissionId,
  payload
) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/submissions/${submissionId}/grade`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export function requestTrainerResubmission(
  assignmentId,
  submissionId,
  payload
) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/submissions/${submissionId}/request-resubmission`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export function deleteTrainerSubmission(
  assignmentId,
  submissionId,
  reason
) {
  return trainerAssignmentRequest(
    `/trainer/assignments/${assignmentId}/submissions/${submissionId}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }
  );
}