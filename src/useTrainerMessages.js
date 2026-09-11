import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  acceptTrainerConversation,
  clearTrainerConversation,
  declineTrainerConversation,
  deleteTrainerMessage,
  getTrainerConversations,
  getTrainerMessagesToken,
  markTrainerConversationRead,
  sendTrainerMessage,
  toggleTrainerConversationBlock,
  updateTrainerMessage,
} from './api/trainerMessages';

const MESSAGE_REFRESH_MS = 15000;

const replaceConversation = (
  conversations,
  conversation
) => {
  const exists =
    conversations.some(
      (item) =>
        item.id === conversation.id
    );

  if (!exists) {
    return [
      conversation,
      ...conversations,
    ];
  }

  return conversations.map(
    (item) =>
      item.id === conversation.id
        ? conversation
        : item
  );
};

const dispatchMessagesChanged =
  () => {
    window.dispatchEvent(
      new Event(
        'trainer-messages-changed'
      )
    );
  };

export function useTrainerConversations() {
  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const lastTokenRef = useRef(
    getTrainerMessagesToken()
  );

  /*
  |--------------------------------------------------------------------------
  | Refresh conversations
  |--------------------------------------------------------------------------
  */

  const refreshConversations =
    useCallback(async () => {
      if (
        !getTrainerMessagesToken()
      ) {
        setConversations([]);
        setLoading(false);

        return;
      }

      try {
        setError('');

        const data =
          await getTrainerConversations();

        setConversations(
          Array.isArray(
            data.conversations
          )
            ? data.conversations
            : []
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load trainer conversations.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  const refresh =
    useCallback(async () => {
      await refreshConversations();
    }, [refreshConversations]);

  /*
  |--------------------------------------------------------------------------
  | Initial load + polling
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    refreshConversations();

    const onMessagesChanged =
      () => {
        refreshConversations();
      };

    const onFocus = () => {
      if (
        getTrainerMessagesToken()
      ) {
        refreshConversations();
      }
    };

    window.addEventListener(
      'trainer-messages-changed',
      onMessagesChanged
    );

    window.addEventListener(
      'focus',
      onFocus
    );

    /*
     * Watch login/logout token.
     */
    const tokenWatcher =
      window.setInterval(() => {
        const currentToken =
          getTrainerMessagesToken();

        if (
          currentToken !==
          lastTokenRef.current
        ) {
          lastTokenRef.current =
            currentToken;

          if (currentToken) {
            refreshConversations();
          } else {
            setConversations([]);
            setError('');
          }
        }
      }, 500);

    /*
     * Polling للرسائل الجديدة.
     */
    const messageRefresh =
      window.setInterval(() => {
        if (
          getTrainerMessagesToken()
        ) {
          refreshConversations();
        }
      }, MESSAGE_REFRESH_MS);

    return () => {
      window.removeEventListener(
        'trainer-messages-changed',
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
  }, [refreshConversations]);

  /*
  |--------------------------------------------------------------------------
  | Open conversation / mark read
  |--------------------------------------------------------------------------
  */

  const openConversation =
    useCallback(
      async (conversationId) => {
        /*
         * Optimistic read.
         */
        setConversations(
          (current) =>
            current.map(
              (conversation) =>
                conversation.id ===
                conversationId
                  ? {
                      ...conversation,

                      unreadForTrainer:
                        0,

                      messages:
                        conversation.messages.map(
                          (
                            message
                          ) =>
                            message.sender !==
                            'trainer'
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
            await markTrainerConversationRead(
              conversationId
            );

          if (
            data.conversation
          ) {
            setConversations(
              (current) =>
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
      },
      [refreshConversations]
    );

  /*
  |--------------------------------------------------------------------------
  | Accept
  |--------------------------------------------------------------------------
  */

  const acceptConversation =
    useCallback(
      async (conversationId) => {
        const data =
          await acceptTrainerConversation(
            conversationId
          );

        if (data.conversation) {
          setConversations(
            (current) =>
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

  /*
  |--------------------------------------------------------------------------
  | Decline
  |--------------------------------------------------------------------------
  */

  const declineConversation =
    useCallback(
      async (conversationId) => {
        const data =
          await declineTrainerConversation(
            conversationId
          );

        /*
         * Declined requests no longer
         * appear in trainer list.
         */
        setConversations(
          (current) =>
            current.filter(
              (conversation) =>
                conversation.id !==
                conversationId
            )
        );

        dispatchMessagesChanged();

        return data;
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Send
  |--------------------------------------------------------------------------
  */

  const sendMessage =
    useCallback(
      async (
        conversationId,
        payload
      ) => {
        const data =
          await sendTrainerMessage(
            conversationId,
            payload
          );

        if (data.conversation) {
          setConversations(
            (current) =>
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

  /*
  |--------------------------------------------------------------------------
  | Edit
  |--------------------------------------------------------------------------
  */

  const editMessage =
    useCallback(
      async (
        conversationId,
        messageId,
        text
      ) => {
        const data =
          await updateTrainerMessage(
            conversationId,
            messageId,
            text
          );

        if (data.conversation) {
          setConversations(
            (current) =>
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

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const deleteMessage =
    useCallback(
      async (
        conversationId,
        messageId
      ) => {
        const data =
          await deleteTrainerMessage(
            conversationId,
            messageId
          );

        if (data.conversation) {
          setConversations(
            (current) =>
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

  /*
  |--------------------------------------------------------------------------
  | Block
  |--------------------------------------------------------------------------
  */

  const toggleBlock =
    useCallback(
      async (conversationId) => {
        const data =
          await toggleTrainerConversationBlock(
            conversationId
          );

        if (data.conversation) {
          setConversations(
            (current) =>
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

  /*
  |--------------------------------------------------------------------------
  | Clear
  |--------------------------------------------------------------------------
  */

  const clearConversation =
    useCallback(
      async (conversationId) => {
        const data =
          await clearTrainerConversation(
            conversationId
          );

        if (data.conversation) {
          setConversations(
            (current) =>
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

  /*
  |--------------------------------------------------------------------------
  | Counts
  |--------------------------------------------------------------------------
  */

  const unreadCount =
    useMemo(
      () =>
        conversations.reduce(
          (
            total,
            conversation
          ) =>
            total +
            Number(
              conversation
                .unreadForTrainer ||
                0
            ),
          0
        ),
      [conversations]
    );

  const pendingCount =
    useMemo(
      () =>
        conversations.filter(
          (conversation) =>
            !conversation.accepted &&
            conversation.messages
              .length > 0
        ).length,
      [conversations]
    );

  return {
    conversations,

    /*
     * المدرب لا يبدأ New Chat
     * من الواجهة الحالية.
     */
    directory: [],

    loading,
    error,
    unreadCount,
    pendingCount,

    refresh,
    refreshConversations,

    openConversation,
    acceptConversation,
    declineConversation,

    sendMessage,
    editMessage,
    deleteMessage,

    toggleBlock,
    clearConversation,
  };
}