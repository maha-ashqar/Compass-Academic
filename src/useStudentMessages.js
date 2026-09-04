import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  clearStudentConversation,
  createStudentConversation,
  deleteStudentMessage,
  getStudentConversations,
  getStudentMessageDirectory,
  getStudentMessagesToken,
  markStudentConversationRead,
  sendStudentMessage,
  toggleStudentConversationBlock,
  updateStudentMessage,
} from './api/studentMessages';

const MESSAGE_REFRESH_MS = 15000;

const replaceConversation = (
  conversations,
  conversation
) => {
  const exists = conversations.some(
    (item) =>
      item.id === conversation.id
  );

  if (!exists) {
    return [
      conversation,
      ...conversations,
    ];
  }

  return conversations.map((item) =>
    item.id === conversation.id
      ? conversation
      : item
  );
};

const dispatchMessagesChanged = () => {
  window.dispatchEvent(
    new Event('student-messages-changed')
  );
};

export function useStudentConversations() {
  const [conversations, setConversations] =
    useState([]);

  const [directory, setDirectory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const lastTokenRef = useRef(
    getStudentMessagesToken()
  );

  const refreshConversations =
    useCallback(async () => {
      if (!getStudentMessagesToken()) {
        setConversations([]);
        setLoading(false);
        return;
      }

      try {
        setError('');

        const data =
          await getStudentConversations();

        setConversations(
          Array.isArray(data.conversations)
            ? data.conversations
            : []
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load conversations.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  const refreshDirectory =
    useCallback(async () => {
      if (!getStudentMessagesToken()) {
        setDirectory([]);
        return;
      }

      try {
        const data =
          await getStudentMessageDirectory();

        setDirectory(
          Array.isArray(data.directory)
            ? data.directory
            : []
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load people.'
        );
      }
    }, []);

  const refresh = useCallback(
    async () => {
      await Promise.all([
        refreshConversations(),
        refreshDirectory(),
      ]);
    },
    [
      refreshConversations,
      refreshDirectory,
    ]
  );

  useEffect(() => {
    refresh();

    const onMessagesChanged = () => {
      refreshConversations();
    };

    const onFocus = () => {
      if (getStudentMessagesToken()) {
        refreshConversations();
      }
    };

    window.addEventListener(
      'student-messages-changed',
      onMessagesChanged
    );

    window.addEventListener(
      'focus',
      onFocus
    );

    const tokenWatcher =
      window.setInterval(() => {
        const currentToken =
          getStudentMessagesToken();

        if (
          currentToken !==
          lastTokenRef.current
        ) {
          lastTokenRef.current =
            currentToken;

          if (currentToken) {
            refresh();
          } else {
            setConversations([]);
            setDirectory([]);
          }
        }
      }, 500);

    const messageRefresh =
      window.setInterval(() => {
        if (getStudentMessagesToken()) {
          refreshConversations();
        }
      }, MESSAGE_REFRESH_MS);

    return () => {
      window.removeEventListener(
        'student-messages-changed',
        onMessagesChanged
      );

      window.removeEventListener(
        'focus',
        onFocus
      );

      window.clearInterval(
        tokenWatcher
      );

      window.clearInterval(
        messageRefresh
      );
    };
  }, [
    refresh,
    refreshConversations,
  ]);

  const startConversation =
    useCallback(async (recipientUserId) => {
      const data =
        await createStudentConversation(
          recipientUserId
        );

      if (data.conversation) {
        setConversations((current) =>
          replaceConversation(
            current,
            data.conversation
          )
        );
      }

      dispatchMessagesChanged();

      return data.conversation;
    }, []);

  const openConversation =
    useCallback(async (conversationId) => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id ===
          conversationId
            ? {
                ...conversation,
                unreadForStudent: 0,
                messages:
                  conversation.messages.map(
                    (message) =>
                      message.sender !==
                      'student'
                        ? {
                            ...message,
                            read: true,
                          }
                        : message
                  ),
              }
            : conversation
        )
      );

      try {
        const data =
          await markStudentConversationRead(
            conversationId
          );

        if (data.conversation) {
          setConversations((current) =>
            replaceConversation(
              current,
              data.conversation
            )
          );
        }

        dispatchMessagesChanged();

        return data.conversation;
      } catch (requestError) {
        await refreshConversations();

        throw requestError;
      }
    }, [refreshConversations]);

  const sendMessage =
    useCallback(
      async (
        conversationId,
        payload
      ) => {
        const data =
          await sendStudentMessage(
            conversationId,
            payload
          );

        if (data.conversation) {
          setConversations((current) =>
            replaceConversation(
              current,
              data.conversation
            )
          );
        }

        dispatchMessagesChanged();

        return data.conversation;
      },
      []
    );

  const editMessage =
    useCallback(
      async (
        conversationId,
        messageId,
        text
      ) => {
        const data =
          await updateStudentMessage(
            conversationId,
            messageId,
            text
          );

        if (data.conversation) {
          setConversations((current) =>
            replaceConversation(
              current,
              data.conversation
            )
          );
        }

        dispatchMessagesChanged();

        return data.conversation;
      },
      []
    );

  const deleteMessage =
    useCallback(
      async (
        conversationId,
        messageId
      ) => {
        const data =
          await deleteStudentMessage(
            conversationId,
            messageId
          );

        if (data.conversation) {
          setConversations((current) =>
            replaceConversation(
              current,
              data.conversation
            )
          );
        }

        dispatchMessagesChanged();

        return data.conversation;
      },
      []
    );

  const toggleBlock =
    useCallback(
      async (conversationId) => {
        const data =
          await toggleStudentConversationBlock(
            conversationId
          );

        if (data.conversation) {
          setConversations((current) =>
            replaceConversation(
              current,
              data.conversation
            )
          );
        }

        dispatchMessagesChanged();

        return data.conversation;
      },
      []
    );

  const clearConversation =
    useCallback(
      async (conversationId) => {
        const data =
          await clearStudentConversation(
            conversationId
          );

        if (data.conversation) {
          setConversations((current) =>
            replaceConversation(
              current,
              data.conversation
            )
          );
        }

        dispatchMessagesChanged();

        return data.conversation;
      },
      []
    );

  const unreadCount = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) =>
          total +
          Number(
            conversation.unreadForStudent ||
              0
          ),
        0
      ),
    [conversations]
  );

  return {
    conversations,
    directory,
    loading,
    error,
    unreadCount,
    refresh,
    refreshConversations,
    startConversation,
    sendMessage,
    openConversation,
    editMessage,
    deleteMessage,
    toggleBlock,
    clearConversation,
  };
}