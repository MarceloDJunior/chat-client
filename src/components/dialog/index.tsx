import { motion } from 'framer-motion';
import styles from './styles.module.scss';
import { Overlay } from '../overlay';
import { useOutsideClick } from '@/hooks/use-outside-click';

type DialogButton = {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

type DialogProps = {
  onClose?: () => void;
  title?: string;
  message?: string;
  content?: React.ReactNode;
  buttons?: DialogButton[];
};

export const Dialog = ({
  onClose,
  title,
  message,
  content,
  buttons,
}: DialogProps) => {
  const hasButtons = buttons && buttons.length > 0;
  const showCloseButton = onClose && !hasButtons;
  const showActions = hasButtons || showCloseButton;

  const ref = useOutsideClick(() => {
    if (onClose) {
      onClose();
    }
  });

  return (
    <Overlay>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className={styles.container} ref={ref}>
          {title && (
            <div className={styles.header}>
              <h2 className={styles.title}>{title}</h2>
            </div>
          )}

          <div className={styles.content}>
            {content ? (
              content
            ) : message ? (
              <p className={styles.message}>{message}</p>
            ) : null}
          </div>

          {showActions && (
            <div className={styles.actions}>
              {buttons?.map((button, index) => (
                <button
                  key={index}
                  type="button"
                  className={
                    button.variant === 'primary'
                      ? styles['button-primary']
                      : styles['button-secondary']
                  }
                  onClick={button.onClick}
                >
                  {button.text}
                </button>
              ))}
              {showCloseButton && (
                <button
                  type="button"
                  className={styles['button-close']}
                  onClick={onClose}
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Overlay>
  );
};
