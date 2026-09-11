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

async function trainerAuthRequest(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body
          ? {
              'Content-Type': 'application/json',
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
    const validationError =
      data?.errors
        ? Object.values(data.errors).flat()[0]
        : null;

    throw new Error(
      validationError ||
        data?.message ||
        'Unable to complete the request.'
    );
  }

  return data;
}

export function trainerRegister({
  name,
  email,
  password,
  passwordConfirmation,
}) {
  return trainerAuthRequest(
    '/trainer/register',
    {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation:
          passwordConfirmation,
      }),
    }
  );
}

export function requestTrainerPasswordReset(
  email
) {
  return trainerAuthRequest(
    '/trainer/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
      }),
    }
  );
}

export function verifyTrainerPasswordResetCode(
  email,
  code
) {
  return trainerAuthRequest(
    '/trainer/forgot-password/verify',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
      }),
    }
  );
}

export function resetTrainerPassword({
  email,
  code,
  password,
  passwordConfirmation,
}) {
  return trainerAuthRequest(
    '/trainer/reset-password',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        password,
        password_confirmation:
          passwordConfirmation,
      }),
    }
  );
}