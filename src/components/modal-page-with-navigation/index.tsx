import classNames from 'classnames';
import { ReactComponent as LeftArrowIcon } from '@/assets/icons/left-arrow.svg';
import styles from './styles.module.scss';

type ModalPageWithNavigationProps = {
  isVisible: boolean;
  onClose: () => void;
  headerContent: React.ReactNode;
  children: React.ReactNode;
};

export const ModalPageWithNavigation = ({
  isVisible,
  onClose,
  headerContent,
  children,
}: ModalPageWithNavigationProps) => {
  return (
    <div
      className={classNames(styles.container, { [styles.visible]: isVisible })}
    >
      <div className={styles.nav}>
        <button type="button" onClick={onClose}>
          <span className={styles.icon}>
            <LeftArrowIcon />
          </span>
        </button>
        {headerContent}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
