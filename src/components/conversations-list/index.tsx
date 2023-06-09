import { useMemo } from 'react';
import classNames from 'classnames';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import PlaceholderImage from '@/assets/images/profile-placeholder.jpg';
import { DateHelper } from '@/helpers/date';
import { FileHelper, FileType } from '@/helpers/file';
import { Conversation } from '@/models/conversation';
import { Contact } from '@/models/contact';
import { useGetUser } from '@/queries/user';
import styles from './styles.module.scss';
import { MessageStatus } from '../message-status';

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
  const { data: user } = useGetUser();
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
  }: Conversation) => {
    const renderLastMessageText = () => {
      if (lastMessage?.text) {
        return lastMessage.text;
      }
      if (lastMessage?.fileName) {
        switch (FileHelper.getFileType(lastMessage.fileName)) {
          case FileType.IMAGE:
            return 'Sent image';
          case FileType.VIDEO:
            return 'Sent video';
          default:
            return 'Sent file';
        }
      }
      return '';
    };

    return (
      <li
        key={contact.id}
        role="button"
        onClick={() => onContactClick(contact)}
      >
        <img
          src={contact.picture ?? PlaceholderImage}
          alt="Picture"
          className={styles.picture}
        />
        <div className={styles.wrapper}>
          <div className={styles['contact-info']}>
            <div className={styles.name} title={contact.name}>
              {contact.name}
            </div>
            {lastMessage && (
              <div className={styles['last-message']}>
                {lastMessage.from.id === user?.id && (
                  <MessageStatus
                    message={lastMessage}
                    className={styles.icon}
                    color="#b5b5b5"
                  />
                )}
                <span>{renderLastMessageText()}</span>
              </div>
            )}
            {contact.status === 'online' && (
              <span className={classNames(styles.status, styles.online)}>
                {contact.status}
              </span>
            )}
          </div>
          <div className={styles['last-message-wrapper']}>
            {lastMessage && (
              <div className={styles.time}>
                {DateHelper.formatHoursMinutes(lastMessage.dateTime)}
              </div>
            )}
            {!!newMessages && (
              <span className={styles['new-messages']}>{newMessages}</span>
            )}
          </div>
        </div>
      </li>
    );
  };

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
