export const getStudentMessagesToken = () => {
  return (
    localStorage.getItem('student_token') ||
    sessionStorage.getItem('student_token')
  );
};

async function studentMessagesRequest(
  endpoint,
  options = {}
) {
  const token = getStudentMessagesToken();

  if (!token) {
    throw new Error(
      'No authentication token found.'
    );
  }

  const isFormData =
    options.body instanceof FormData;

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(isFormData
          ? {}
          : options.body
            ? {
                'Content-Type':
                  'application/json',
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

export function getStudentMessageDirectory() {
  return studentMessagesRequest(
    '/student/messages/directory'
  );
}

export function getStudentConversations() {
  return studentMessagesRequest(
    '/student/messages/conversations'
  );
}

export function getStudentConversation(
  conversationId
) {
  return studentMessagesRequest(
    `/student/messages/conversations/${conversationId}`
  );
}

export function createStudentConversation(
  recipientUserId
) {
  return studentMessagesRequest(
    '/student/messages/conversations',
    {
      method: 'POST',
      body: JSON.stringify({
        recipient_user_id:
          recipientUserId,
      }),
    }
  );
}

export function markStudentConversationRead(
  conversationId
) {
  return studentMessagesRequest(
    `/student/messages/conversations/${conversationId}/read`,
    {
      method: 'PUT',
    }
  );
}

export function sendStudentMessage(
  conversationId,
  { text = '', attachments = [] } = {}
) {
  const form = new FormData();

  if (text.trim()) {
    form.append('message', text.trim());
  }

  attachments.forEach((attachment) => {
    const file =
      attachment?.file instanceof File
        ? attachment.file
        : attachment instanceof File
          ? attachment
          : null;

    if (file) {
      form.append('attachments[]', file);
    }
  });

  return studentMessagesRequest(
    `/student/messages/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: form,
    }
  );
}

export function updateStudentMessage(
  conversationId,
  messageId,
  text
) {
  return studentMessagesRequest(
    `/student/messages/conversations/${conversationId}/messages/${messageId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: text,
      }),
    }
  );
}

export function deleteStudentMessage(
  conversationId,
  messageId
) {
  return studentMessagesRequest(
    `/student/messages/conversations/${conversationId}/messages/${messageId}`,
    {
      method: 'DELETE',
    }
  );
}

export function toggleStudentConversationBlock(
  conversationId
) {
  return studentMessagesRequest(
    `/student/messages/conversations/${conversationId}/block`,
    {
      method: 'PUT',
    }
  );
}

export function clearStudentConversation(
  conversationId
) {
  return studentMessagesRequest(
    `/student/messages/conversations/${conversationId}/messages`,
    {
      method: 'DELETE',
    }
  );
}