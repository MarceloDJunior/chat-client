import { useMemo } from 'react';
import classNames from 'classnames';
import { Contact } from '../../models/contact';
import PlaceholderImage from '../../assets/images/profile-placeholder.jpg';
import styles from './styles.module.scss';

type ContactListProps = {
  contacts: Contact[];
  onlineUserIds: number[];
  onContactClick: (contact: Contact) => void;
};

export const ContactList = ({
  contacts,
  onlineUserIds,
  onContactClick,
}: ContactListProps) => {
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

  return (
    <div className={styles.container}>
      <ul>
        {contactsWithStatus.map((contact) => (
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
  );
};
