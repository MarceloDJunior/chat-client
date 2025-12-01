import { motion } from 'framer-motion';
import { ReactComponent as CloseIcon } from '@/assets/icons/close.svg';
import styles from './styles.module.scss';
import { Overlay } from '../overlay';

type VideoCallModalProps = {
  onClose?: () => void;
  children: React.ReactNode;
};

export const Dialog = ({ onClose, children }: VideoCallModalProps) => {
  return (
    <Overlay>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className={styles.container}>
          {onClose && (
            <div>
              <button
                type="button"
                className={styles['close-button']}
                onClick={onClose}
              >
                <CloseIcon />
              </button>
            </div>
          )}
          <div className={styles.content}>{children}</div>
        </div>
      </motion.div>
    </Overlay>
  );
};
