const getTrainerToken = () =>
  localStorage.getItem('trainer_token') ||
  sessionStorage.getItem('trainer_token');

async function trainerSettingsRequest(
  endpoint,
  options = {}
) {
  const token = getTrainerToken();

  if (!token) {
    throw new Error(
      'No trainer authentication token found.'
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
    const validationError =
      data?.errors &&
      Object.values(data.errors)
        .flat()
        .find(Boolean);

    throw new Error(
      validationError ||
        data?.message ||
        'Unable to complete the request.'
    );
  }

  return data;
}

export function changeTrainerPassword(
  payload
) {
  return trainerSettingsRequest(
    '/trainer/settings/password',
    {
      method: 'PUT',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}