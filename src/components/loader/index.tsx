import styles from './styles.module.scss';

type LoaderProps = {
  width?: number;
  height?: number;
  color?: string;
};

export const Loader = ({
  height = 60,
  width = 80,
  color = '#b7bed9',
}: LoaderProps) => {
  return (
    <div className={styles.container} style={{ height, width }}>
      <div style={{ backgroundColor: color }}></div>
      <div style={{ backgroundColor: color }}></div>
      <div style={{ backgroundColor: color }}></div>
    </div>
  );
};
