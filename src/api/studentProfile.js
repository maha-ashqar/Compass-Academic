const getStudentToken = () =>
  localStorage.getItem('student_token') ||
  sessionStorage.getItem('student_token');

export async function getStudentProfile() {
  const token = getStudentToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/student/profile`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'Unable to load student profile.'
    );
  }

  return data;
}

export async function updateStudentProfile(profile) {
  const token = getStudentToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/student/profile`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const validationError = data.errors
      ? Object.values(data.errors).flat()[0]
      : null;

    throw new Error(
      validationError ||
      data.message ||
      'Unable to update student profile.'
    );
  }

  return data;
}
export async function uploadStudentAvatar(file) {
  const token = getStudentToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/student/profile/avatar`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const validationError = data.errors
      ? Object.values(data.errors).flat()[0]
      : null;

    throw new Error(
      validationError ||
      data.message ||
      'Unable to upload profile image.'
    );
  }

  return data;
}