import { useMemo } from 'react';
import { Contact } from '../../models/contact';
import PlaceholderImage from '../../assets/images/profile-placeholder.jpg';
import * as S from './styles';

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
    <div>
      <S.ContactList>
        {contactsWithStatus.map((contact) => (
          <S.ContactWrapper
            key={contact.id}
            role="button"
            onClick={() => onContactClick(contact)}
          >
            <S.Picture
              src={contact.picture ?? PlaceholderImage}
              alt="Picture"
            />
            <div>
              <S.Name>
                {contact.name}{' '}
                {!!contact.newMessages && (
                  <S.NewMessagesCounter>
                    {contact.newMessages}
                  </S.NewMessagesCounter>
                )}
              </S.Name>
              <S.Status isOnline={contact.status === 'online'}>
                {contact.status}
              </S.Status>
            </div>
          </S.ContactWrapper>
        ))}
      </S.ContactList>
    </div>
  );
};
