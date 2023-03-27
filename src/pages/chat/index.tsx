import { useCallback, useEffect, useRef, useState } from 'react';
import { LAST_CONTACT_ID } from '../../constants/cookies';
import { useGetConversationsQuery } from '../../queries/conversations';
import { useGetUser } from '../../queries/user';
import {
  useGetMessagesMutation,
  useSendMessageMutation,
  useUpdateReadMutation,
} from '../../mutations/messages';
import { Message } from '../../models/message';
import styles from './styles.module.scss';
import { useWebSocketContext } from '../../context/websocket-context';
import { ProfileHeader } from '../../components/profile-header';
import { ConversationsList } from '../../components/conversations-list';
import { ContactHeader } from '../../components/contact-header';
import { MessageList } from '../../components/message-list';
import { SendMessageField } from '../../components/send-message-field';
import { CookiesHelper } from '../../helpers/cookies';
import { Loader } from '../../components/loader';
import { Conversation } from '../../models/conversation';
import { Contact } from '../../models/contact';
import { useGetContactsQuery } from '../../queries/contacts';

let lastMessageId: number;

const initialContactId = CookiesHelper.get(LAST_CONTACT_ID);

export const Chat = () => {
  const { data: user } = useGetUser();
  const { data: conversationsFromServer, refetch: refetchConversations } =
    useGetConversationsQuery();
  const { data: contacts } = useGetContactsQuery();
  const [currentContact, setCurrentContact] = useState<Contact>();
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: getMessages } = useGetMessagesMutation();
  const { mutateAsync: sendMessage, isLoading: isSending } =
    useSendMessageMutation();
  const { mutateAsync: updateRead } = useUpdateReadMutation();
  const { socket, connect: connectWebSocket } = useWebSocketContext();
  const messagesRef = useRef<HTMLDivElement>(null);

  const openChat = (contact: Contact) => {
    setCurrentContact(contact);
    resetContactNewMessages(contact.id);
  };

  const addNewMessage = (message: Message) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      newMessages.unshift(message);
      return newMessages;
    });
  };

  const addConversation = (contact: Contact, message: Message) => {
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
  };

  const handleSendMessage = async (text: string): Promise<boolean> => {
    try {
      if (!user || !currentContact) {
        return false;
      }
      const message: Message = {
        from: user,
        to: currentContact,
        dateTime: new Date(),
        text,
        read: false,
      };
      const insertedId = await sendMessage(message);
      message.id = insertedId;
      socket?.emit('sendMessage', JSON.stringify(message));
      socket?.emit('messagesRead', currentContact.id);
      if (!hasConversationWith(currentContact.id)) {
        addConversation(currentContact, message);
      } else {
        addNewMessage(message);
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
        } else {
          incrementContactNewMessages(message.from.id);
        }
        updateConversationLastMessage(message);
      }
    },
    [addConversation, currentContact?.id, hasConversationWith],
  );

  const incrementContactNewMessages = (contactId: number) => {
    console.log('dsjiduhjiasdjisadi');
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

  useEffect(() => {
    const getInitialMessages = async (contactId: number) => {
      const messages = await getMessages(contactId);
      setMessages(messages);
    };

    if (currentContact) {
      setIsLoading(true);
      setMessages([]);
      getInitialMessages(currentContact.id);
      CookiesHelper.set(LAST_CONTACT_ID, currentContact.id.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact]);

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
        refetchConversations();
        setOnlineUserIds(JSON.parse(payload) as number[]);
      });
    }
    return () => {
      socket?.off('messageReceived');
      socket?.off('connectedUsers');
    };
  }, [handleNewMessage, refetchConversations, setMessagesRead, socket]);

  useEffect(() => {
    scrollToRecentMessage();
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, [messages]);

  useEffect(() => {
    if (conversations && !currentContact && initialContactId) {
      const initialConversation = conversations.find(
        (conversation) => conversation.contact.id === Number(initialContactId),
      );
      if (initialConversation) {
        setCurrentContact(initialConversation.contact);
      }
    }
  }, [conversations, currentContact]);

  useEffect(() => {
    if (conversationsFromServer) {
      console.log(conversationsFromServer);
      setConversations(conversationsFromServer);
    }
  }, [conversationsFromServer]);

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
        {currentContact ? (
          <>
            <ContactHeader contact={currentContact} />
            <div className={styles.messages} ref={messagesRef}>
              <MessageList messages={messages} myUser={user} />
            </div>
            {isLoading ? (
              <div className={styles.overlay}>
                <Loader height={46} width={60} />
              </div>
            ) : null}
            <SendMessageField
              onSubmit={handleSendMessage}
              isSending={isSending}
            />
          </>
        ) : (
          <h3>Select a user to start chatting</h3>
        )}
      </main>
    </div>
  );
};
