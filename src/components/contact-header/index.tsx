import classNames from 'classnames';
import { Contact } from '@/models/contact';
import PlaceholderImage from '@/assets/images/profile-placeholder.jpg';
import styles from './styles.module.scss';

type ContactHeaderProps = {
  contact: Contact;
};

export const ContactHeader = ({ contact }: ContactHeaderProps) => {
  return (
    <div className={styles.container}>
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
    </div>
  );
};
