import { useCallback, useEffect, useRef, useState } from 'react';
import { LAST_CONTACT_ID } from '../../constants/cookies';
import { useGetContactsQuery } from '../../queries/contacts';
import { useGetUser } from '../../queries/user';
import {
  useGetMessagesMutation,
  useSendMessageMutation,
  useUpdateReadMutation,
} from '../../mutations/messages';
import { Message } from '../../models/message';
import { Contact } from '../../models/contact';
import { useWebSocketContext } from '../../context/websocket-context';
import { ProfileHeader } from '../../components/profile-header';
import { ContactList } from '../../components/contact-list';
import { ContactHeader } from '../../components/contact-header';
import { MessageList } from '../../components/message-list';
import { SendMessageField } from '../../components/send-message-field';
import { CookiesHelper } from '../../helpers/cookies';
import * as S from './styles';

let lastMessageId: number;

const initialContactId = CookiesHelper.get(LAST_CONTACT_ID);

export const Chat = () => {
  const { data: user } = useGetUser();
  const { data: contactsFromServer, refetch: refetchContacts } =
    useGetContactsQuery();
  const [currentContact, setCurrentContact] = useState<Contact>();
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [contacts, setContacts] = useState<Contact[]>();
  const [messages, setMessages] = useState<Message[]>([]);
  const { mutateAsync: getMessages, isLoading: isLoadingMessages } =
    useGetMessagesMutation();
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
      addNewMessage(message);
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

  const handleNewMessage = useCallback(
    (message: Message) => {
      if (!message.id || lastMessageId === message.id) {
        return;
      }
      lastMessageId = message.id;
      if (currentContact?.id === message.from.id) {
        addNewMessage(message);
      } else {
        incrementContactNewMessages(message.from.id);
      }
    },
    [currentContact?.id],
  );

  const incrementContactNewMessages = (contactId: number) => {
    setContacts((prevContacts) => {
      return prevContacts?.map((contact) => {
        if (contact.id === contactId) {
          return { ...contact, newMessages: (contact.newMessages ?? 0) + 1 };
        }
        return contact;
      });
    });
  };

  const resetContactNewMessages = (contactId: number) => {
    setContacts((prevContacts) => {
      return prevContacts?.map((contact) => {
        if (contact.id === contactId) {
          return { ...contact, newMessages: 0 };
        }
        return contact;
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
        refetchContacts();
        setOnlineUserIds(JSON.parse(payload) as number[]);
      });
    }
    return () => {
      socket?.off('messageReceived');
      socket?.off('connectedUsers');
    };
  }, [handleNewMessage, refetchContacts, setMessagesRead, socket]);

  useEffect(() => {
    scrollToRecentMessage();
  }, [messages]);

  useEffect(() => {
    if (contacts && !currentContact && initialContactId) {
      const initialContact = contacts.find(
        (contact) => contact.id === Number(initialContactId),
      );
      if (initialContact) {
        setCurrentContact(initialContact);
      }
    }
  }, [contacts, currentContact]);

  useEffect(() => {
    if (contactsFromServer) {
      setContacts(contactsFromServer);
    }
  }, [contactsFromServer]);

  if (!user) {
    return null;
  }

  return (
    <S.Container>
      <S.Sidebar>
        <ProfileHeader user={user} />
        <ContactList
          contacts={contacts ?? []}
          onlineUserIds={onlineUserIds}
          onContactClick={openChat}
        />
      </S.Sidebar>
      <S.MainContent onMouseEnter={updateMessagesRead}>
        {currentContact ? (
          <>
            <ContactHeader contact={currentContact} />
            <S.Messages ref={messagesRef}>
              {isLoadingMessages ? (
                <S.Center>Loading...</S.Center>
              ) : (
                <MessageList messages={messages} myUser={user} />
              )}
            </S.Messages>
            <SendMessageField
              onSubmit={handleSendMessage}
              isSending={isSending}
            />
          </>
        ) : (
          <h3>Select a user to start chatting</h3>
        )}
      </S.MainContent>
    </S.Container>
  );
};
