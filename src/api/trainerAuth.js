const API_URL = import.meta.env.VITE_API_URL;

function getTrainerToken() {
  return (
    localStorage.getItem('trainer_token') ||
    sessionStorage.getItem('trainer_token')
  );
}

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    const message =
      data.message ||
      data.errors?.email?.[0] ||
      'Something went wrong.';

    throw new Error(message);
  }

  return data;
}

export async function trainerLogin(email, password) {
  const response = await fetch(`${API_URL}/trainer/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return handleResponse(response);
}

export async function getTrainerMe() {
  const token = getTrainerToken();

  const response = await fetch(`${API_URL}/trainer/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

export async function trainerLogout() {
  const token = getTrainerToken();

  const response = await fetch(`${API_URL}/trainer/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}