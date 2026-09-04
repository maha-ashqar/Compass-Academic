export const getStudentSettingsToken = () => {
  return (
    localStorage.getItem('student_token') ||
    sessionStorage.getItem('student_token')
  );
};

async function studentSettingsRequest(
  endpoint,
  options = {}
) {
  const token = getStudentSettingsToken();

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

export async function getStudentSettings() {
  return studentSettingsRequest(
    '/student/settings'
  );
}

export async function updateStudentSettings(
  payload
) {
  return studentSettingsRequest(
    '/student/settings',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function resetStudentSettings() {
  return studentSettingsRequest(
    '/student/settings/reset',
    {
      method: 'POST',
    }
  );
}

export async function changeStudentPassword(
  payload
) {
  return studentSettingsRequest(
    '/student/settings/password',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}