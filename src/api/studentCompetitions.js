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

async function studentCompetitionRequest(
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

export async function getStudentCompetitions() {
  return studentCompetitionRequest(
    '/student/competitions'
  );
}

export async function getStudentCompetition(
  competitionId
) {
  return studentCompetitionRequest(
    `/student/competitions/${competitionId}`
  );
}

export async function registerStudentCompetition(
  competitionId,
  payload
) {
  const data = await studentCompetitionRequest(
    `/student/competitions/${competitionId}/register`,
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

export async function saveStudentCompetitionSubmission(
  competitionId,
  payload
) {
  return studentCompetitionRequest(
    `/student/competitions/${competitionId}/submission`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function uploadStudentCompetitionFiles(
  competitionId,
  files
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files[]', file);
  });

  return studentCompetitionRequest(
    `/student/competitions/${competitionId}/submission/files`,
    {
      method: 'POST',
      body: formData,
    }
  );
}

export async function deleteStudentCompetitionFile(
  competitionId,
  fileId
) {
  return studentCompetitionRequest(
    `/student/competitions/${competitionId}/submission/files/${fileId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function submitStudentCompetitionWork(
  competitionId
) {
  const data = await studentCompetitionRequest(
    `/student/competitions/${competitionId}/submission/submit`,
    {
      method: 'POST',
    }
  );

  refreshStudentNotifications();

  return data;
}