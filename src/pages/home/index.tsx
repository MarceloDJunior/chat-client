import {
  FormEvent,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import io, { Socket } from 'socket.io-client';
import { LoginButton } from '../../components/login-button';
import { LogoutButton } from '../../components/logout-button';
import { WS_URL } from '../../config/environment';
import { ACCESS_TOKEN } from '../../constants/cookies';
import { LAST_CONTACT_ID } from '../../constants/session';
import { CookiesHelper } from '../../helpers/cookies';
import { useGetContactsQuery } from '../../queries/contacts';
import { useGetUser } from '../../queries/user';
import PlaceholderImage from '../../assets/profile-placeholder.jpg';
import { User } from '../../models/user';
import styles from './styles.module.scss';
import {
  useGetMessagesMutation,
  useSendMessageMutation,
} from '../../mutations/messages';
import { Message } from '../../models/message';
import { DateHelper } from '../../helpers/date';

let socket: Socket;

const initialContactId = sessionStorage.getItem(LAST_CONTACT_ID);

export const Home = () => {
  const { data: user, isLoading } = useGetUser();
  const { data: contacts, refetch: refetchContacts } = useGetContactsQuery();
  const [currentContact, setCurrentContact] = useState<User>();
  const [text, setText] = useState<string>('');
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const { mutateAsync: getMessages, isLoading: isLoadingMessages } =
    useGetMessagesMutation();
  const { mutateAsync: sendMessage, isLoading: isSending } =
    useSendMessageMutation();
  const messagesRef = useRef<HTMLDivElement>(null);
  let lastMessageDate: string;

  const openChat = (user: User) => {
    setCurrentContact(user);
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
      };
      const insertedId = await sendMessage(message);
      message.id = insertedId;
      socket && socket.emit('sendMessage', JSON.stringify(message));
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
  }, [currentContact]);

  useEffect(() => {
    if (!socket) {
      socket = io(WS_URL, {
        multiplex: true,
        transports: ['websocket'],
        query: {
          accessToken: CookiesHelper.get(ACCESS_TOKEN),
        },
      });

      socket.on('messageReceived', (payload: string) => {
        const message: Message = JSON.parse(payload);
        console.log('Message Received', message);
        if (!messages.find((msg) => msg.id === message.id)) {
          addNewMessage(message);
        }
      });

      socket.on('connectedUsers', (payload: string) => {
        console.log('Connected Users', payload);
        refetchContacts();
        setOnlineUserIds(JSON.parse(payload) as number[]);
      });
    }
  }, []);

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
  }, [contacts]);

  const orderedMessages = useMemo(() => {
    const orderedMessages = [...messages];
    orderedMessages.reverse();
    return orderedMessages;
  }, [messages]);

  const contactsWithStatus = useMemo(() => {
    if (!contacts) {
      return [];
    }

    const contactsWithStatus: User[] = contacts.map((contact) => ({
      ...contact,
      status: onlineUserIds.includes(contact.id) ? 'online' : 'offline',
    }));

    const orderedContacts = contactsWithStatus?.sort((c1) =>
      c1.status === 'online' ? -1 : 1,
    );

    return orderedContacts;
  }, [contacts, onlineUserIds]);

  if (isLoading) {
    return <div className={styles.center}>Loading ...</div>;
  }

  return user ? (
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
                  <div className={styles.name}>{contact.name}</div>
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
  ) : (
    <div className={styles.center}>
      <LoginButton />
    </div>
  );
};
