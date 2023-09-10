import { motion } from 'framer-motion';
import styles from './styles.module.scss';

type ProgressBarProps = {
  progress: number;
};

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      exit={{ scaleY: 0, opacity: 0.5 }}
      className={styles.container}
    >
      <div className={styles.progress} style={{ width: `${progress}%` }}></div>
    </motion.div>
  );
};
