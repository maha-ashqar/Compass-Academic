const getStudentToken = () =>
  localStorage.getItem('student_token') ||
  sessionStorage.getItem('student_token');

const refreshStudentNotifications = () => {
  window.dispatchEvent(
    new Event('student-notifications-changed')
  );
};

async function parseResponse(response) {
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

async function studentRequest(
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

  return parseResponse(response);
}

export async function getStudentAchievements() {
  return studentRequest(
    '/student/achievements'
  );
}

export async function addStudentCredential(
  payload
) {
  const formData = new FormData();

  formData.append('title', payload.title);
  formData.append('issuer', payload.issuer);

  formData.append(
    'credential_url',
    payload.credential_url
  );

  if (payload.issue_date) {
    formData.append(
      'issue_date',
      payload.issue_date
    );
  }

  if (payload.credential_id) {
    formData.append(
      'credential_id',
      payload.credential_id
    );
  }

  if (payload.description) {
    formData.append(
      'description',
      payload.description
    );
  }

  if (payload.file) {
    formData.append(
      'file',
      payload.file
    );
  }

  const data = await studentRequest(
    '/student/achievements/credentials',
    {
      method: 'POST',
      body: formData,
    }
  );

  refreshStudentNotifications();

  return data;
}

export async function deleteStudentCredential(
  credentialId
) {
  return studentRequest(
    `/student/achievements/credentials/${credentialId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getPublicPortfolio(
  portfolioCode
) {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/portfolio/${encodeURIComponent(
      portfolioCode
    )}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  return parseResponse(response);
}