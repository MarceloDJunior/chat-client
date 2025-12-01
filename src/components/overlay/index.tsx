import classNames from 'classnames';
import styles from './styles.module.scss';
import { motion } from 'framer-motion';

interface OverlayProps {
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
}

export const Overlay = ({
  className,
  children,
  opacity = 0.5,
}: OverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={classNames(styles.overlay, className)}
      style={{ backgroundColor: `rgba(0, 0, 0, ${opacity})` }}
    >
      {children}
    </motion.div>
  );
};
