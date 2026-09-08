const API_URL = import.meta.env.VITE_API_URL;

function getTrainerToken() {
  return (
    localStorage.getItem('trainer_token') ||
    sessionStorage.getItem('trainer_token')
  );
}

async function handleResponse(response) {
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
        'Unable to load trainer dashboard.'
    );
  }

  return data;
}

export async function getTrainerDashboard() {
  const token = getTrainerToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(
    `${API_URL}/trainer/dashboard`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}