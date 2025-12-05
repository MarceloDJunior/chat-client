import { ReactComponent as PhoneAcceptIcon } from '@/assets/icons/phone-accept.svg';
import { ReactComponent as PhoneDeclineIcon } from '@/assets/icons/phone-decline.svg';
import { incomingCallSound } from '@/hooks/use-audio-unlock';
import styles from './styles.module.scss';
import { useEffect } from 'react';

type CallActionsProps = {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
};

export const CallActions = ({
  callerName,
  onAccept,
  onReject,
}: CallActionsProps) => {
  useEffect(() => {
    incomingCallSound.loop = true;
    incomingCallSound.currentTime = 0;

    incomingCallSound.play().catch((error) => {
      console.error('Failed to play sound:', error);
    });

    return () => {
      incomingCallSound.pause();
      incomingCallSound.currentTime = 0;
    };
  }, []);

  const handleAccept = () => {
    incomingCallSound.pause();
    incomingCallSound.currentTime = 0;
    onAccept();
  };

  const handleReject = () => {
    incomingCallSound.pause();
    incomingCallSound.currentTime = 0;
    onReject();
  };

  return (
    <div className={styles.container}>
      <p className={styles.message}>{callerName} is calling you...</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles['reject-button']}
          onClick={handleReject}
        >
          <PhoneDeclineIcon />
          Decline
        </button>
        <button
          type="button"
          className={styles['accept-button']}
          onClick={handleAccept}
        >
          <PhoneAcceptIcon />
          Accept
        </button>
      </div>
    </div>
  );
};
