import styles from './styles.module.scss';

type ProgressBarProps = {
  progress: number;
};

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.progress} style={{ width: `${progress}%` }}></div>
    </div>
  );
};
