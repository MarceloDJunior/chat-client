import {
  FormEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import { LogoutButton } from '../../components/logout-button';
import { LAST_CONTACT_ID } from '../../constants/session';
import { useGetContactsQuery } from '../../queries/contacts';
import { useGetUser } from '../../queries/user';
import PlaceholderImage from '../../assets/images/profile-placeholder.jpg';
import CheckIcon from '../../assets/icons/check.svg';
import DoubleCheckIcon from '../../assets/icons/double-check.svg';
import {
  useGetMessagesMutation,
  useSendMessageMutation,
  useUpdateReadMutation,
} from '../../mutations/messages';
import { Message } from '../../models/message';
import { DateHelper } from '../../helpers/date';
import { Contact } from '../../models/contact';
import styles from './styles.module.scss';
import { useWebSocketContext } from '../../context/websocket-context';

let lastMessageId: number;

const initialContactId = sessionStorage.getItem(LAST_CONTACT_ID);

export const Chat = () => {
  const { data: user } = useGetUser();
  const { data: contactsFromServer, refetch: refetchContacts } =
    useGetContactsQuery();
  const [currentContact, setCurrentContact] = useState<Contact>();
  const [text, setText] = useState<string>('');
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
  let lastMessageDate: string;

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

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (!user || !currentContact) {
        return;
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
      setText('');
      addNewMessage(message);
    } catch (err) {
      console.error(err);
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
      sessionStorage.setItem(LAST_CONTACT_ID, currentContact.id.toString());
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

  const orderedMessages = useMemo(() => {
    const orderedMessages = [...messages];
    orderedMessages.reverse();
    return orderedMessages;
  }, [messages]);

  const contactsWithStatus = useMemo(() => {
    if (!contacts) {
      return [];
    }

    const contactsWithStatus: Contact[] = contacts.map((contact) => ({
      ...contact,
      status: onlineUserIds.includes(contact.id) ? 'online' : 'offline',
    }));

    const orderedContacts = contactsWithStatus?.sort((c1) =>
      c1.status === 'online' ? -1 : 1,
    );

    return orderedContacts;
  }, [contacts, onlineUserIds]);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <img src={user.picture} alt="Picture" className={styles.picture} />
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <LogoutButton />
          </div>
        </div>
        <div className={styles.contacts}>
          <ul>
            {contactsWithStatus.map((contact) => (
              <li
                key={contact.id}
                role="button"
                onClick={() => openChat(contact)}
              >
                <img
                  src={contact.picture ?? PlaceholderImage}
                  alt="Picture"
                  className={styles.picture}
                />
                <div>
                  <div className={styles.name}>
                    {contact.name}{' '}
                    {!!contact.newMessages && (
                      <span className={styles['new-messages']}>
                        {contact.newMessages}
                      </span>
                    )}
                  </div>
                  <span
                    className={classNames(styles.status, {
                      [styles.online]: contact.status === 'online',
                    })}
                  >
                    {contact.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <main className={styles['main-content']}>
        {currentContact ? (
          <>
            <div className={styles['contact-info']}>
              <img
                src={currentContact.picture ?? PlaceholderImage}
                alt="Picture"
                className={styles.picture}
              />
              <div className={styles.name}>{currentContact.name}</div>
            </div>
            <div className={styles.messages} ref={messagesRef}>
              {isLoadingMessages ? (
                <div className={styles.center}>Loading...</div>
              ) : (
                orderedMessages?.map((message) => {
                  const currentDate = DateHelper.formatDate(message.dateTime);
                  const isDifferentFromPrevious =
                    currentDate !== lastMessageDate;
                  lastMessageDate = currentDate;
                  return (
                    <Fragment
                      key={`${message.id}-${message.dateTime.toString()}`}
                    >
                      {isDifferentFromPrevious && (
                        <div className={styles.date}>{currentDate}</div>
                      )}
                      <div
                        className={classNames(styles['message-container'], {
                          [styles.sent]: message.from.id === user.id,
                        })}
                      >
                        <div className={styles.message}>
                          <div className={styles.text}>{message.text}</div>
                          <div className={styles.time}>
                            {DateHelper.formatHoursMinutes(message.dateTime)}
                          </div>
                          <div className={styles['message-status']}>
                            {message.from.id === user.id && (
                              <img
                                src={message.read ? DoubleCheckIcon : CheckIcon}
                                height={message.read ? 20 : 18}
                                width={message.read ? 20 : 18}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSendMessage} className={styles['input-box']}>
              <input
                type="text"
                onChange={(event) => setText(event.target.value)}
                value={text}
                readOnly={isSending}
                onFocus={updateMessagesRead}
              />
              <button type="submit" disabled={isSending}>
                Send Message
              </button>
            </form>
          </>
        ) : (
          <h3>Select a user to start chatting</h3>
        )}
      </main>
    </div>
  );
};
