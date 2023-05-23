import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LAST_CONTACT_ID } from '@/constants/cookies';
import { useGetConversationsQuery } from '@/queries/conversations';
import { useGetUser } from '@/queries/user';
import {
  useGetMessagesMutation,
  useSendMessageMutation,
  useUpdateReadMutation,
} from '@/mutations/messages';
import { Message } from '@/models/message';
import { useWebSocketContext } from '@/context/websocket-context';
import { ProfileHeader } from '@/components/profile-header';
import { ConversationsList } from '@/components/conversations-list';
import { ContactInfo } from '@/components/contact-info';
import { MessageList } from '@/components/message-list';
import { ModalPageWithNavigation } from '@/components/modal-page-with-navigation';
import { SendMessageField } from '@/components/send-message-field';
import { CookiesHelper } from '@/helpers/cookies';
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { Loader } from '@/components/loader';
import { Conversation } from '@/models/conversation';
import { Contact } from '@/models/contact';
import { useGetContactsQuery } from '@/queries/contacts';
import styles from './styles.module.scss';
import { useTabActive } from '@/hooks/use-tab-active';
import { NotificationHelper } from '@/helpers/notification';

let lastMessageId: number;

const initialContactId = CookiesHelper.get(LAST_CONTACT_ID);

const updatePageTitle = (newTitle: string) => {
  document.title = newTitle;
};

const generateUniqueId = () =>
  new Date().getTime() + Math.floor(Math.random() * 1000);

export const Chat = () => {
  const { data: user } = useGetUser();
  const { data: conversationsFromServer } = useGetConversationsQuery();
  const { data: contacts } = useGetContactsQuery();
  const { mutateAsync: getMessages } = useGetMessagesMutation();
  const { mutateAsync: sendMessage } = useSendMessageMutation();
  const { mutateAsync: updateRead } = useUpdateReadMutation();
  const { socket, connect: connectWebSocket } = useWebSocketContext();
  const { isMobile } = useBreakpoints();
  const { isTabActive } = useTabActive();
  const messagesRef = useRef<HTMLDivElement>(null);
  const [currentContact, setCurrentContact] = useState<Contact>();
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const openChat = useCallback((contact: Contact) => {
    setCurrentContact(contact);
    resetContactNewMessages(contact.id);
    NotificationHelper.requestPermission();
  }, []);

  const closeChat = () => {
    setCurrentContact(undefined);
  };

  const isMobileConversationVisible = !!currentContact;

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

  const handleSendMessage = async (text: string): Promise<boolean> => {
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
      await sendMessage(message);
      message.pending = false;
      socket?.emit('sendMessage', JSON.stringify(message));
      socket?.emit('messagesRead', currentContact.id);
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

  const scrollToRecentMessage = () => {
    const ref = messagesRef.current;
    if (ref) {
      ref.scroll({ top: ref.scrollHeight, behavior: 'smooth' });
    }
  };

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

  const hasConversationWith = useCallback(
    (contactId: number): boolean => {
      return !!conversations?.find(
        (conversation) => conversation.contact.id === contactId,
      );
    },
    [conversations],
  );

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
            onClick: () => openChat(message.from),
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
      openChat,
    ],
  );

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

  const updateMessagesRead = async () => {
    try {
      if (currentContact) {
        await updateRead(currentContact.id);
        resetContactNewMessages(currentContact.id);
        socket?.emit('messagesRead', currentContact.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const setMessagesRead = useCallback(
    (contactId: number) => {
      if (currentContact?.id === contactId) {
        setMessages((prevMessages) =>
          prevMessages.map((message) => ({ ...message, read: true })),
        );
      }
    },
    [currentContact?.id],
  );

  const loadMoreMessages = useCallback(async () => {
    const { data, meta } = await getMessages({
      contactId: currentContact?.id ?? 0,
      page: currentPage + 1,
    });
    setMessages((prevData) => prevData.concat(data));
    setHasMoreMessages(meta.hasNextPage);
    setCurrentPage((prevValue) => prevValue + 1);
  }, [currentContact?.id, getMessages, currentPage]);

  const lastMessage = useMemo(() => {
    if (!(messages.length > 0)) {
      return null;
    }
    const lastMessage = messages[0];
    return lastMessage;
  }, [messages]);

  useEffect(() => {
    const resetChat = () => {
      setIsAtBottom(true);
      setIsLoading(true);
      setMessages([]);
    };

    const getInitialMessages = async (contactId: number) => {
      const { data, meta } = await getMessages({
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
        console.log('Message Received', message);
        handleNewMessage(message);
      });

      socket.on('messagesRead', (payload: string) => {
        const fromId = Number(payload);
        setMessagesRead(fromId);
      });

      socket.on('connectedUsers', (payload: string) => {
        console.log('Connected Users', payload);
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
  }, [currentContact?.id, handleNewMessage, setMessagesRead, socket]);

  useEffect(() => {
    if (!lastMessage?.id) return;

    const isSentFromMe = lastMessage.from?.id === user?.id;
    const isSentFromContactAndIsChatActive = !isSentFromMe && isAtBottom;

    if (isSentFromMe || isSentFromContactAndIsChatActive) {
      scrollToRecentMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id, isMobile]);

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
    if (conversationsFromServer) {
      setConversations(conversationsFromServer);
    }
  }, [conversationsFromServer]);

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
  }, []);

  const renderChatComponents = () => {
    if (!user) {
      return null;
    }
    return (
      <div className={styles.chat}>
        <div className={styles.messages} ref={messagesRef}>
          <MessageList
            messages={messages}
            myUser={user}
            hasMoreMessages={hasMoreMessages}
            onLoadMoreClick={loadMoreMessages}
          />
        </div>
        {isLoading ? (
          <div className={styles.overlay}>
            <Loader height={46} width={60} />
          </div>
        ) : null}
        <SendMessageField onSubmit={handleSendMessage} />
      </div>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ProfileHeader user={user} />
        <ConversationsList
          contacts={contacts ?? []}
          conversations={conversations ?? []}
          onlineUserIds={onlineUserIds}
          onContactClick={openChat}
        />
      </div>
      <main
        className={styles['main-content']}
        onMouseEnter={updateMessagesRead}
      >
        {isMobile ? ( // render chat components inside navigation page on mobile
          <ModalPageWithNavigation
            isVisible={isMobileConversationVisible}
            onClose={closeChat}
            headerContent={
              currentContact ? <ContactInfo contact={currentContact} /> : null
            }
          >
            {renderChatComponents()}
          </ModalPageWithNavigation>
        ) : currentContact ? ( // render chat components in desktop if contact is selected
          <>
            <div className={styles['contact-header']}>
              <ContactInfo contact={currentContact} />
            </div>
            {renderChatComponents()}
          </>
        ) : (
          <h3>Select a user to start chatting</h3>
        )}
      </main>
    </div>
  );
};
