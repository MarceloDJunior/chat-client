import styles from './styles.module.scss';

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  alignSelf?: 'start' | 'end' | 'center';
};

export const Skeleton = ({
  width = '100%',
  height = 30,
  radius = '5px',
  alignSelf,
}: SkeletonProps) => {
  return (
    <div
      className={styles.skeleton}
      style={{
        width,
        height,
        borderRadius: radius,
        alignSelf,
      }}
    />
  );
};
