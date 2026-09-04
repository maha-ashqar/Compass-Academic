const getStudentToken = () => {
  return (
    localStorage.getItem('student_token') ||
    sessionStorage.getItem('student_token')
  );
};

const studentRequest = async (endpoint, options = {}) => {
  const token = getStudentToken();

  if (!token) {
    throw new Error('No authentication token found.');
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

  const data = await response.json();

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
};

export async function getStudentCourses() {
  return studentRequest('/student/courses');
}

export async function getStudentCourse(courseId) {
  return studentRequest(`/student/courses/${courseId}`);
}

export async function enrollStudentCourse(courseId) {
  return studentRequest(`/student/courses/${courseId}/enroll`, {
    method: 'POST',
  });
}