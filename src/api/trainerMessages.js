export const getTrainerMessagesToken = () => {
  return (
    localStorage.getItem('trainer_token') ||
    sessionStorage.getItem('trainer_token')
  );
};

async function trainerMessagesRequest(
  endpoint,
  options = {}
) {
  const token = getTrainerMessagesToken();

  if (!token) {
    throw new Error(
      'No trainer authentication token found.'
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
    const validationError =
      data?.errors
        ? Object.values(
            data.errors
          ).flat()[0]
        : null;

    throw new Error(
      validationError ||
        data?.message ||
        'Unable to complete the request.'
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Conversations
|--------------------------------------------------------------------------
*/

export function getTrainerConversations() {
  return trainerMessagesRequest(
    '/trainer/messages/conversations'
  );
}

export function getTrainerConversation(
  conversationId
) {
  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}`
  );
}

export function markTrainerConversationRead(
  conversationId
) {
  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}/read`,
    {
      method: 'PUT',
    }
  );
}

/*
|--------------------------------------------------------------------------
| Message requests
|--------------------------------------------------------------------------
*/

export function acceptTrainerConversation(
  conversationId
) {
  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}/accept`,
    {
      method: 'PUT',
    }
  );
}

export function declineTrainerConversation(
  conversationId
) {
  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}/decline`,
    {
      method: 'PUT',
    }
  );
}

/*
|--------------------------------------------------------------------------
| Messages
|--------------------------------------------------------------------------
*/

export function sendTrainerMessage(
  conversationId,
  {
    text = '',
    attachments = [],
  } = {}
) {
  const form = new FormData();

  if (text.trim()) {
    form.append(
      'message',
      text.trim()
    );
  }

  attachments.forEach(
    (attachment) => {
      const file =
        attachment?.file instanceof File
          ? attachment.file
          : attachment instanceof File
            ? attachment
            : null;

      if (file) {
        form.append(
          'attachments[]',
          file
        );
      }
    }
  );

  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: form,
    }
  );
}

export function updateTrainerMessage(
  conversationId,
  messageId,
  text
) {
  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}/messages/${messageId}`,
    {
      method: 'PUT',

      body: JSON.stringify({
        message: text,
      }),
    }
  );
}

export function deleteTrainerMessage(
  conversationId,
  messageId
) {
  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}/messages/${messageId}`,
    {
      method: 'DELETE',
    }
  );
}

/*
|--------------------------------------------------------------------------
| Block
|--------------------------------------------------------------------------
*/

export function toggleTrainerConversationBlock(
  conversationId
) {
  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}/block`,
    {
      method: 'PUT',
    }
  );
}

/*
|--------------------------------------------------------------------------
| Clear
|--------------------------------------------------------------------------
*/

export function clearTrainerConversation(
  conversationId
) {
  return trainerMessagesRequest(
    `/trainer/messages/conversations/${conversationId}/messages`,
    {
      method: 'DELETE',
    }
  );
}