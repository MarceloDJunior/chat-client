import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { LoginButton } from '../../components/login-button';
import { LogoutButton } from '../../components/logout-button';
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

export const Home = () => {
  const { data: user, isLoading } = useGetUser();
  const { data: contacts } = useGetContactsQuery();
  const [currentContact, setCurrentContact] = useState<User>();
  const [text, setText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { mutateAsync: getMessages, isLoading: isLoadingMessages } =
    useGetMessagesMutation();
  const { mutateAsync: sendMessage, isLoading: isSending } =
    useSendMessageMutation();
  const messagesRef = useRef<HTMLDivElement>(null);

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
        date: new Date(),
        text,
      };
      await sendMessage(message);
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
    }
  }, [currentContact]);

  useEffect(() => {
    scrollToRecentMessage();
  }, [messages]);

  const orderedMessages = useMemo(() => {
    const orderedMessages = [...messages];
    orderedMessages.reverse();
    return orderedMessages;
  }, [messages]);

  if (isLoading) {
    return <div className={styles.container}>Loading ...</div>;
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
            {contacts?.map((contact) => (
              <li role="button" onClick={() => openChat(contact)}>
                <img
                  src={contact.picture ?? PlaceholderImage}
                  alt="Picture"
                  className={styles.picture}
                />
                <div className={styles.name}>{contact.name}</div>
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
              {isLoadingMessages
                ? 'Loading...'
                : orderedMessages?.map((message) => (
                    <div
                      className={classNames(styles['message-container'], {
                        [styles.sent]: message.from.id === user.id,
                      })}
                    >
                      <div className={styles.message}>{message.text}</div>
                    </div>
                  ))}
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
    <div className={styles.container}>
      <LoginButton />
    </div>
  );
};
