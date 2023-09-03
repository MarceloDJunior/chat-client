import { RefObject, useEffect, useMemo, useState } from 'react';
import ReceivedMessageSound from '@/assets/sounds/received-message.mp3';
import SentMessageSound from '@/assets/sounds/sent-message.mp3';
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
const receivedMessageSound = new Audio(ReceivedMessageSound);
receivedMessageSound.muted = true;
const sentMessageSound = new Audio(SentMessageSound);
sentMessageSound.muted = true;

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [text, setText] = useState<string>('');

  const openChatWith = (contact: Contact) => {
    setCurrentContact(contact);
    resetContactNewMessages(contact.id);
    NotificationHelper.requestPermission();
  };

  const closeChat = () => {
    setCurrentContact(undefined);
  };

  const resetContactNewMessages = (contactId: number) => {
    setConversations((prevConversations) => {
      const newConversations = [...(prevConversations ?? [])];
      return newConversations.map((conversation) => {
        if (conversation.contact.id === contactId) {
          return { ...conversation, newMessages: 0 } as Conversation;
        }
        return conversation;
      });
    });
  };

  const addNewMessage = (message: Message) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      newMessages.unshift(message);
      return newMessages;
    });
  };

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

  const addConversation = (
    contact: Contact,
    message: Message,
    received?: boolean,
  ) => {
    const isCurrentContact = contact.id === currentContact?.id;
    setConversations((prevConversations) => {
      const newConversations = [...prevConversations];

      newConversations.unshift({
        contact,
        lastMessage: message,
        newMessages: received && !isCurrentContact ? 1 : 0,
      });

      return newConversations;
    });
    if (isCurrentContact && received) {
      addNewMessage(message);
    }
  };

  const hasConversationWith = (contactId: number): boolean => {
    return !!conversations.find(
      (conversation) => conversation.contact.id === contactId,
    );
  };

  const updateConversationLastMessage = (message: Message) => {
    setConversations((prevConversations) => {
      const newConversations = [...prevConversations];
      return newConversations.map((conversation) => {
        if (
          [message.from.id, message.to.id].includes(conversation.contact.id)
        ) {
          return { ...conversation, lastMessage: message } as Conversation;
        }
        return conversation;
      });
    });
  };

  const sendMessage = async (text: string, file?: File): Promise<boolean> => {
    try {
      if (!user || !currentContact) {
        return false;
      }
      if (!text && !file) {
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
      if (file) {
        const fileDataURL = URL.createObjectURL(file);
        message.fileName = file.name;
        message.fileUrl = fileDataURL;
      }
      setText('');
      addNewMessage(message);
      sentMessageSound.play();
      const { fileUrl, fileName } = await mutateSendMessage({ message, file });
      message.pending = false;
      message.fileUrl = fileUrl;
      message.fileName = fileName;
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
      const newConversations = [...prevConversations];
      return newConversations.map((conversation) => {
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

  const handleNewMessage = (message: Message) => {
    if (!message.id || lastMessageId === message.id) {
      return;
    }
    receivedMessageSound.play();
    lastMessageId = message.id;
    if (!hasConversationWith(message.from.id)) {
      addConversation(message.from, message, true);
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
  };

  const loadMoreMessages = async () => {
    const { data, meta } = await mutateGetMessages({
      contactId: currentContact?.id ?? 0,
      page: currentPage + 1,
    });
    setMessages((prevData) => prevData.concat(data));
    setHasMoreMessages(meta.hasNextPage);
    setCurrentPage((prevValue) => prevValue + 1);
  };

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

  const setMessagesRead = () => {
    setMessages((prevMessages) =>
      prevMessages.map((message) => ({ ...message, read: true })),
    );
  };

  const updateMessagesRead = async () => {
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
  };

  const lastMessage = useMemo(() => {
    if (!(messages.length > 0)) {
      return null;
    }
    const lastMessage = messages[0];
    return lastMessage;
  }, [messages]);

  useEffect(() => {
    // Unlock audio on the first user interaction
    window.addEventListener(
      'click',
      () => {
        receivedMessageSound.play().then(() => {
          receivedMessageSound.pause();
          receivedMessageSound.muted = false;
        });
        sentMessageSound.play().then(() => {
          sentMessageSound.pause();
          sentMessageSound.muted = false;
        });
      },
      { once: true },
    ); // The listener is removed after one execution
  }, []);

  useEffect(() => {
    if (conversationsFromServer?.length) {
      setConversations([...conversationsFromServer]);
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
        const onlineUsers = JSON.parse(payload) as Contact[];
        const usersWithoutMine = onlineUsers.filter(
          (contact) => contact.id !== user?.id,
        );
        setOnlineUsers(usersWithoutMine);
        const isCurrentContactOnline = !!(
          currentContact?.id &&
          onlineUsers.find((user) => user.id === currentContact.id)
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
  }, [currentContact?.id, socket, handleNewMessage]);

  useEffect(() => {
    if (!lastMessage?.id) return;

    const isSentFromMe = lastMessage.from?.id === user?.id;
    const isSentFromContactAndIsChatActive =
      !isSentFromMe && isAtBottom && isTabActive;

    if (isSentFromMe || isSentFromContactAndIsChatActive) {
      // Give some time to render the last message
      setTimeout(() => {
        scrollToRecentMessage();
      }, 200);
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
    onlineUsers,
    text,
    setText,
    sendMessage,
    loadMoreMessages,
    updateMessagesRead,
    openChatWith,
    closeChat,
  };
};
