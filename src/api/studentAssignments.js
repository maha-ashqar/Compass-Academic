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

async function studentAssignmentRequest(
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

export async function getStudentAssignments() {
  return studentAssignmentRequest(
    '/student/assignments'
  );
}

export async function getStudentAssignment(
  assignmentId
) {
  return studentAssignmentRequest(
    `/student/assignments/${assignmentId}`
  );
}

export async function saveStudentAssignmentDraft(
  assignmentId,
  payload
) {
  return studentAssignmentRequest(
    `/student/assignments/${assignmentId}/submission`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function uploadStudentAssignmentFiles(
  assignmentId,
  files
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files[]', file);
  });

  return studentAssignmentRequest(
    `/student/assignments/${assignmentId}/submission/files`,
    {
      method: 'POST',
      body: formData,
    }
  );
}

export async function deleteStudentAssignmentFile(
  assignmentId,
  fileId
) {
  return studentAssignmentRequest(
    `/student/assignments/${assignmentId}/submission/files/${fileId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function submitStudentAssignment(
  assignmentId,
  payload
) {
  const data = await studentAssignmentRequest(
    `/student/assignments/${assignmentId}/submission/submit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  refreshStudentNotifications();

  return data;
}