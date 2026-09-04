const getStudentToken = () => {
  return (
    localStorage.getItem('student_token') ||
    sessionStorage.getItem('student_token')
  );
};

const refreshStudentNotifications = () => {
  window.dispatchEvent(
    new Event('student-notifications-changed')
  );
};

const studentLearningRequest = async (
  endpoint,
  options = {}
) => {
  const token = getStudentToken();

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

export async function getStudentMyCourses() {
  return studentLearningRequest(
    '/student/my-courses'
  );
}

export async function getStudentLearningCourse(
  courseId
) {
  return studentLearningRequest(
    `/student/my-courses/${courseId}`
  );
}

export async function updateStudentLessonProgress(
  courseId,
  lessonId,
  isCompleted,
  progressPercentage
) {
  const body = {
    is_completed: isCompleted,
  };

  if (progressPercentage !== undefined) {
    body.progress_percentage =
      progressPercentage;
  }

  const data = await studentLearningRequest(
    `/student/my-courses/${courseId}/lessons/${lessonId}/progress`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (data.course_completed_now) {
    refreshStudentNotifications();
  }

  return data;
}

export async function updateStudentLessonBookmark(
  courseId,
  lessonId,
  isBookmarked
) {
  return studentLearningRequest(
    `/student/my-courses/${courseId}/lessons/${lessonId}/bookmark`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_bookmarked: isBookmarked,
      }),
    }
  );
}

export async function removeStudentCourse(
  courseId
) {
  return studentLearningRequest(
    `/student/my-courses/${courseId}`,
    {
      method: 'DELETE',
    }
  );
}