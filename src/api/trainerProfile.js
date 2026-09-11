const getTrainerToken = () =>
  localStorage.getItem('trainer_token') ||
  sessionStorage.getItem('trainer_token');

async function trainerProfileRequest(
  endpoint,
  options = {}
) {
  const token = getTrainerToken();

  const isFormData =
    options.body instanceof FormData;

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',

        ...(isFormData
          ? {}
          : {
              'Content-Type':
                'application/json',
            }),

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

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
    const firstError =
      data?.errors &&
      Object.values(data.errors)
        .flat()
        .find(Boolean);

    throw new Error(
      firstError ||
        data?.message ||
        'Something went wrong.'
    );
  }

  return data;
}

export function getTrainerProfile() {
  return trainerProfileRequest(
    '/trainer/profile'
  );
}

export function updateTrainerProfile(
  payload
) {
  return trainerProfileRequest(
    '/trainer/profile',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export function uploadTrainerAvatar(file) {
  const formData = new FormData();

  formData.append('avatar', file);

  return trainerProfileRequest(
    '/trainer/profile/avatar',
    {
      method: 'POST',
      body: formData,
    }
  );
}

export function deleteTrainerAvatar() {
  return trainerProfileRequest(
    '/trainer/profile/avatar',
    {
      method: 'DELETE',
    }
  );
}

export function uploadTrainerDegreeCertificate(
  file
) {
  const formData = new FormData();

  formData.append(
    'certificate',
    file
  );

  return trainerProfileRequest(
    '/trainer/profile/degree-certificate',
    {
      method: 'POST',
      body: formData,
    }
  );
}

export function deleteTrainerDegreeCertificate() {
  return trainerProfileRequest(
    '/trainer/profile/degree-certificate',
    {
      method: 'DELETE',
    }
  );
}