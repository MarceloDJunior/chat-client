import { useMemo } from 'react';
import classNames from 'classnames';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import PlaceholderImage from '../../assets/images/profile-placeholder.jpg';
import styles from './styles.module.scss';
import { DateHelper } from '../../helpers/date';
import { Conversation } from '../../models/conversation';
import { Contact } from '../../models/contact';

type ConversationsListProps = {
  conversations: Conversation[];
  contacts: Contact[];
  onlineUserIds: number[];
  onContactClick: (contact: Contact) => void;
};

export const ConversationsList = ({
  conversations,
  contacts,
  onlineUserIds,
  onContactClick,
}: ConversationsListProps) => {
  const [animationParent] = useAutoAnimate();
  const orderedStatusConversations = useMemo(() => {
    if (!conversations) {
      return [];
    }

    const conversationWithContactStatus: Conversation[] = conversations.map(
      (conversation) => ({
        ...conversation,
        contact: {
          ...conversation.contact,
          status: onlineUserIds.includes(conversation.contact.id)
            ? 'online'
            : 'offline',
        } as Contact,
      }),
    );

    const orderedConversations = conversationWithContactStatus.sort((c1, c2) =>
      new Date(c1.lastMessage?.dateTime ?? 0).getTime() >
      new Date(c2.lastMessage?.dateTime ?? 0).getTime()
        ? -1
        : 1,
    );

    return orderedConversations;
  }, [conversations, onlineUserIds]);

  const contactsWithoutConversations = useMemo(() => {
    const contactsWithoutConversations = contacts.filter(
      (contact) =>
        !conversations.find(
          (conversation) => conversation.contact.id === contact.id,
        ),
    );

    const contactsWithStatus = contactsWithoutConversations.map(
      (contact) =>
        ({
          ...contact,
          status: onlineUserIds.includes(contact.id) ? 'online' : 'offline',
        } as Contact),
    );

    return contactsWithStatus;
  }, [contacts, conversations, onlineUserIds]);

  const renderContact = ({
    contact,
    lastMessage,
    newMessages,
  }: Conversation) => (
    <li key={contact.id} role="button" onClick={() => onContactClick(contact)}>
      <img
        src={contact.picture ?? PlaceholderImage}
        alt="Picture"
        className={styles.picture}
      />
      <div className={styles.wrapper}>
        <div>
          <div className={styles.name}>{contact.name} </div>
          {lastMessage && (
            <div>{DateHelper.formatHoursMinutes(lastMessage.dateTime)}</div>
          )}
          <span
            className={classNames(styles.status, {
              [styles.online]: contact.status === 'online',
            })}
          >
            {contact.status}
          </span>
        </div>
        {!!newMessages && (
          <span className={styles['new-messages']}>{newMessages}</span>
        )}
      </div>
    </li>
  );

  return (
    <div className={styles.container}>
      <ul ref={animationParent}>
        {orderedStatusConversations.length > 0 && (
          <>
            <h4>Conversations</h4>
            {orderedStatusConversations.map((conversation) =>
              renderContact(conversation),
            )}
          </>
        )}
        {contactsWithoutConversations.length > 0 && (
          <>
            <h4>Contacts</h4>
            {contactsWithoutConversations.map((contact) =>
              renderContact({ contact }),
            )}
          </>
        )}
      </ul>
    </div>
  );
};
