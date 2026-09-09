const API_URL = import.meta.env.VITE_API_URL;

function getTrainerToken() {
  return (
    localStorage.getItem('trainer_token') ||
    sessionStorage.getItem('trainer_token')
  );
}

async function trainerStudentRequest(endpoint, options = {}) {
  const token = getTrainerToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
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

export function getTrainerStudents() {
  return trainerStudentRequest('/trainer/students');
}

export function getTrainerStudent(studentId) {
  return trainerStudentRequest(
    `/trainer/students/${studentId}`
  );
}