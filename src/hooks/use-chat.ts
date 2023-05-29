import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { LAST_CONTACT_ID } from '@/constants/cookies';
import { useWebSocketContext } from '@/context/websocket-context';
import { CookiesHelper } from '@/helpers/cookies';
import { NotificationHelper } from '@/helpers/notification';
import { Contact } from '@/models/contact';
import { Conversation } from '@/models/conversation';
import { Message } from '@/models/message';
import {
  useGetMessagesMutation,
  useSendMessageMutation,
  useUpdateReadMutation,
} from '@/mutations/messages';
import { useGetContactsQuery } from '@/queries/contacts';
import { useGetConversationsQuery } from '@/queries/conversations';
import { useGetUser } from '@/queries/user';
import { useTabActive } from './use-tab-active';

let lastMessageId: number;

const generateUniqueId = () =>
  new Date().getTime() + Math.floor(Math.random() * 1000);

const initialContactId = CookiesHelper.get(LAST_CONTACT_ID);

const updatePageTitle = (newTitle: string) => {
  document.title = newTitle;
};

export const useChat = (messagesRef: RefObject<HTMLDivElement>) => {
  const { data: user } = useGetUser();
  const { data: conversationsFromServer } = useGetConversationsQuery();
  const { data: contacts } = useGetContactsQuery();
  const { mutateAsync: mutateGetMessages } = useGetMessagesMutation();
  const { mutateAsync: mutateSendMessage } = useSendMessageMutation();
  const { mutateAsync: mutateUpdateRead } = useUpdateReadMutation();
  const { socket, connect: connectWebSocket } = useWebSocketContext();
  const { isTabActive } = useTabActive();

  const [currentContact, setCurrentContact] = useState<Contact>();
  const [conversations, setConversations] = useState<Conversation[]>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const openChatWith = useCallback((contact: Contact) => {
    setCurrentContact(contact);
    resetContactNewMessages(contact.id);
    NotificationHelper.requestPermission();
  }, []);

  const closeChat = () => {
    setCurrentContact(undefined);
  };

  const resetContactNewMessages = (contactId: number) => {
    setConversations((prevConversations) => {
      return prevConversations?.map((conversation) => {
        if (conversation.contact.id === contactId) {
          return { ...conversation, newMessages: 0 } as Conversation;
        }
        return conversation;
      });
    });
  };

  const addNewMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      newMessages.unshift(message);
      return newMessages;
    });
  }, []);

  const updateMessage = (message: Message) => {
    setMessages((prevMessages) =>
      prevMessages.map((currMessage) => {
        if (currMessage.id === message.id) {
          return message;
        }
        return currMessage;
      }),
    );
  };

  const addConversation = useCallback(
    (contact: Contact, message: Message) => {
      setConversations((prevConversations) => {
        const conversations = [...(prevConversations ?? [])];
        conversations.unshift({
          contact,
          lastMessage: message,
          newMessages: 0,
        });

        return conversations;
      });
      if (contact.id === currentContact?.id) {
        addNewMessage(message);
      }
    },
    [addNewMessage, currentContact?.id],
  );

  const hasConversationWith = useCallback(
    (contactId: number): boolean => {
      return !!conversations?.find(
        (conversation) => conversation.contact.id === contactId,
      );
    },
    [conversations],
  );

  const updateConversationLastMessage = (message: Message) => {
    setConversations((prevConversations) => {
      return prevConversations?.map((conversation) => {
        if (
          [message.from.id, message.to.id].includes(conversation.contact.id)
        ) {
          return { ...conversation, lastMessage: message } as Conversation;
        }
        return conversation;
      });
    });
  };

  const sendMessage = async (text: string): Promise<boolean> => {
    try {
      if (!user || !currentContact) {
        return false;
      }
      const tempId = generateUniqueId();
      const message: Message = {
        id: tempId,
        from: user,
        to: currentContact,
        dateTime: new Date(),
        text,
        read: false,
        pending: true,
      };
      addNewMessage(message);
      await mutateSendMessage(message);
      message.pending = false;
      socket?.emit('sendMessage', JSON.stringify(message));
      if (!hasConversationWith(currentContact.id)) {
        addConversation(currentContact, message);
      } else {
        updateMessage(message);
        updateConversationLastMessage(message);
      }

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const incrementContactNewMessages = (contactId: number) => {
    setConversations((prevConversations) => {
      return prevConversations?.map((conversation) => {
        if (conversation.contact.id === contactId) {
          return {
            ...conversation,
            newMessages: (conversation.newMessages ?? 0) + 1,
          } as Conversation;
        }
        return conversation;
      });
    });
  };

  const handleNewMessage = useCallback(
    (message: Message) => {
      if (!message.id || lastMessageId === message.id) {
        return;
      }
      lastMessageId = message.id;
      if (!hasConversationWith(message.from.id)) {
        addConversation(message.from, message);
      } else {
        if (currentContact?.id === message.from.id) {
          addNewMessage(message);
          if (!isTabActive) {
            incrementContactNewMessages(message.from.id);
          }
        } else {
          incrementContactNewMessages(message.from.id);
        }

        if (!isTabActive) {
          NotificationHelper.showNotification({
            title: `New message from ${message.from.name}`,
            message: message.text,
            icon: message.from.picture,
            onClick: () => openChatWith(message.from),
          });
        }

        updateConversationLastMessage(message);
      }
    },
    [
      addConversation,
      addNewMessage,
      currentContact?.id,
      hasConversationWith,
      isTabActive,
      openChatWith,
    ],
  );

  const loadMoreMessages = useCallback(async () => {
    const { data, meta } = await mutateGetMessages({
      contactId: currentContact?.id ?? 0,
      page: currentPage + 1,
    });
    setMessages((prevData) => prevData.concat(data));
    setHasMoreMessages(meta.hasNextPage);
    setCurrentPage((prevValue) => prevValue + 1);
  }, [currentContact?.id, mutateGetMessages, currentPage]);

  const scrollToRecentMessage = () => {
    const ref = messagesRef.current;
    if (ref) {
      ref.scroll({ top: ref.scrollHeight, behavior: 'smooth' });
    }
  };

  const hasUnreadMessages = useMemo(
    () =>
      !!messages.some(
        (message) => message.from?.id === currentContact?.id && !message.read,
      ),
    [currentContact?.id, messages],
  );

  const setMessagesRead = useCallback(() => {
    setMessages((prevMessages) =>
      prevMessages.map((message) => ({ ...message, read: true })),
    );
  }, []);

  const updateMessagesRead = useCallback(async () => {
    try {
      if (currentContact && isAtBottom && hasUnreadMessages) {
        await mutateUpdateRead(currentContact.id);
        resetContactNewMessages(currentContact.id);
        setMessagesRead();
        socket?.emit('messagesRead', currentContact.id);
      }
    } catch (err) {
      console.error(err);
    }
  }, [
    currentContact,
    isAtBottom,
    hasUnreadMessages,
    mutateUpdateRead,
    setMessagesRead,
    socket,
  ]);

  const lastMessage = useMemo(() => {
    if (!(messages.length > 0)) {
      return null;
    }
    const lastMessage = messages[0];
    return lastMessage;
  }, [messages]);

  useEffect(() => {
    if (conversationsFromServer) {
      setConversations(conversationsFromServer);
    }
  }, [conversationsFromServer]);

  useEffect(() => {
    const resetChat = () => {
      setIsAtBottom(true);
      setIsLoading(true);
      setMessages([]);
    };

    const getInitialMessages = async (contactId: number) => {
      const { data, meta } = await mutateGetMessages({
        contactId,
        page: 1,
      });
      setMessages(data);
      setHasMoreMessages(meta.hasNextPage);
      setCurrentPage(1);
      // timeout to give some time to finish scrolling before hiding loader
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    };

    if (currentContact) {
      resetChat();
      getInitialMessages(currentContact.id);
      CookiesHelper.set(LAST_CONTACT_ID, currentContact.id.toString());
    } else {
      CookiesHelper.remove(LAST_CONTACT_ID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id]);

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  useEffect(() => {
    if (socket) {
      socket.on('messageReceived', (payload: string) => {
        const message: Message = JSON.parse(payload);
        handleNewMessage(message);
      });

      socket.on('messagesRead', () => {
        setMessagesRead();
      });

      socket.on('connectedUsers', (payload: string) => {
        const onlineUserIds = JSON.parse(payload) as number[];
        setOnlineUserIds(onlineUserIds);
        const isCurrentContactOnline = !!(
          currentContact?.id && onlineUserIds.includes(currentContact.id)
        );
        setCurrentContact((prevContact) => {
          if (prevContact) {
            return {
              ...prevContact,
              status: isCurrentContactOnline ? 'online' : 'offline',
            };
          }
        });
      });
    }
    return () => {
      socket?.off('messageReceived');
      socket?.off('messagesRead');
      socket?.off('connectedUsers');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id, socket]);

  useEffect(() => {
    if (!lastMessage?.id) return;

    const isSentFromMe = lastMessage.from?.id === user?.id;
    const isSentFromContactAndIsChatActive =
      !isSentFromMe && isAtBottom && isTabActive;

    if (isSentFromMe || isSentFromContactAndIsChatActive) {
      scrollToRecentMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id]);

  useEffect(() => {
    const setInitialConversation = () => {
      if (!!conversations?.length && initialContactId) {
        const initialConversation = conversations.find(
          (conversation) =>
            conversation.contact.id === Number(initialContactId),
        );
        if (initialConversation) {
          setCurrentContact(
            (prevValue) => prevValue ?? initialConversation.contact,
          );
        }
      }
    };

    const updatePageTitleOnNewMessages = () => {
      if (!conversations?.length) {
        return;
      }

      const totalNewMessages: number = conversations.reduce(
        (acc, currConversation) => {
          return acc + (currConversation.newMessages ?? 0);
        },
        0,
      );

      const newTitle = totalNewMessages ? `Chat (${totalNewMessages})` : 'Chat';
      updatePageTitle(newTitle);
    };

    setInitialConversation();
    updatePageTitleOnNewMessages();
  }, [conversations]);

  useEffect(() => {
    const addListenerToCheckIfIsAtTheEndOfChat = () => {
      const messagesContainerRef = messagesRef.current;

      const listener = (event: any) => {
        const element = event.target;
        const isAtBottom =
          element.scrollHeight - element.scrollTop - element.clientHeight <= 30;
        setIsAtBottom(isAtBottom);
      };

      messagesContainerRef?.addEventListener('scroll', listener);

      return () => {
        messagesContainerRef?.removeEventListener('scroll', listener);
      };
    };
    addListenerToCheckIfIsAtTheEndOfChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    conversations,
    contacts,
    currentContact,
    messages,
    hasMoreMessages,
    isLoading,
    onlineUserIds,
    sendMessage,
    loadMoreMessages,
    updateMessagesRead,
    openChatWith,
    closeChat,
  };
};
