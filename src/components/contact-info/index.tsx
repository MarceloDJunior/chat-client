import classNames from 'classnames';
import { Contact } from '@/models/contact';
import PlaceholderImage from '@/assets/images/profile-placeholder.jpg';
import { ReactComponent as VideoIcon } from '@/assets/icons/video.svg';
import styles from './styles.module.scss';

type ContactInfoProps = {
  contact: Contact;
  onVideoCallClick: () => void;
};

export const ContactInfo = ({
  contact,
  onVideoCallClick,
}: ContactInfoProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <img
          src={contact.picture ?? PlaceholderImage}
          alt="Picture"
          className={styles.picture}
        />
        <div>
          <div className={styles.name} title={contact.name}>
            {contact.name}
          </div>
          <span
            className={classNames(styles.status, {
              [styles.online]: contact.status === 'online',
            })}
          >
            {contact.status}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        <button onClick={onVideoCallClick} title="Video Call">
          <VideoIcon />
        </button>
      </div>
    </div>
  );
};
