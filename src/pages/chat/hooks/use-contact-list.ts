import { useEffect, useState } from 'react';
import { LAST_CONTACT_ID } from '@/constants/cookies';
import { useWebSocketContext } from '@/context/websocket-context';
import { CookiesHelper } from '@/helpers/cookies';
import { NotificationHelper } from '@/helpers/notification';
import { Contact } from '@/models/contact';
import { Conversation } from '@/models/conversation';
import { Message } from '@/models/message';
import { useGetContactsQuery } from '@/queries/contacts';
import { useGetConversationsQuery } from '@/queries/conversations';
import { useGetUser } from '@/queries/user';
import { useTabActive } from '@/hooks/use-tab-active';

const initialContactId = CookiesHelper.get(LAST_CONTACT_ID);

const updatePageTitle = (newTitle: string) => {
  document.title = newTitle;
};

type Props = {
  currentContact: Contact | undefined;
  isAtScrollBottom?: boolean;
  setCurrentContact: (contact?: Contact) => void;
};

export const useContactList = ({
  currentContact,
  isAtScrollBottom,
  setCurrentContact,
}: Props) => {
  const { data: user } = useGetUser();
  const { data: conversationsFromServer } = useGetConversationsQuery();
  const { data: contacts } = useGetContactsQuery();
  const { socket } = useWebSocketContext();
  const { isTabActive } = useTabActive();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Contact[]>([]);

  const openChatWith = (contact: Contact) => {
    setCurrentContact(contact);
    resetCounterAndUpdateLastMessage(contact.id);
    NotificationHelper.requestPermission();
  };

  const closeChat = () => {
    setCurrentContact(undefined);
  };

  const resetCounterAndUpdateLastMessage = (contactId: number) => {
    setConversations((prevConversations) => {
      const newConversations = [...(prevConversations ?? [])];
      return newConversations.map((conversation) => {
        if (conversation.contact.id === contactId) {
          const lastMessage = conversation.lastMessage;
          const isSent = lastMessage?.from.id === user?.id;
          return {
            ...conversation,
            newMessages: 0,
            lastMessage: {
              ...lastMessage,
              read: isSent ? true : lastMessage?.read,
            },
          } as Conversation;
        }
        return conversation;
      });
    });
  };

  const updateConversationOnNewMessage = (
    contact: Contact,
    message: Message,
    received?: boolean,
  ) => {
    if (!hasConversationWith(contact.id)) {
      addConversation(contact, message, received);
      return;
    }
    if (currentContact?.id === message.from.id) {
      if (!isTabActive || !isAtScrollBottom) {
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
  };

  const hasConversationWith = (contactId: number): boolean => {
    return !!conversations.find(
      (conversation) => conversation.contact.id === contactId,
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

  useEffect(() => {
    if (conversationsFromServer?.length) {
      setConversations([...conversationsFromServer]);
    }
  }, [conversationsFromServer]);

  useEffect(() => {
    if (socket) {
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
        if (currentContact) {
          setCurrentContact({
            ...currentContact,
            status: isCurrentContactOnline ? 'online' : 'offline',
          });
        }
      });
    }
    return () => {
      socket?.off('connectedUsers');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id, socket]);

  useEffect(() => {
    const setInitialConversation = () => {
      if (!!conversations?.length && initialContactId) {
        const initialConversation = conversations.find(
          (conversation) =>
            conversation.contact.id === Number(initialContactId),
        );
        if (initialConversation) {
          setCurrentContact(currentContact ?? initialConversation.contact);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, setCurrentContact]);

  return {
    conversations,
    contacts,
    onlineUsers,
    openChatWith,
    closeChat,
    updateConversationOnNewMessage,
    resetCounterAndUpdateLastMessage,
  };
};
