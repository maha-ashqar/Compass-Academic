const API_URL = import.meta.env.VITE_API_URL;

const getStudentToken = () => {
  return (
    localStorage.getItem('student_token') ||
    sessionStorage.getItem('student_token')
  );
};

async function request(endpoint, options = {}, auth = false) {
  const token = auth ? getStudentToken() : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export function studentLogin(email, password) {
  return request('/student/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function studentRegister(payload) {
  return request('/student/register', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    }),
  });
}

export function getStudentMe() {
  return request('/student/me', {}, true);
}

export async function studentLogout() {
  try {
    return await request('/student/logout', {
      method: 'POST',
    }, true);
  } finally {
    localStorage.removeItem('student_token');
    sessionStorage.removeItem('student_token');
  }
}

export function requestStudentPasswordReset(email) {
  return request('/student/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyStudentPasswordResetCode(email, code) {
  return request('/student/forgot-password/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function resetStudentPassword(payload) {
  return request('/student/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      code: payload.code,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    }),
  });
}