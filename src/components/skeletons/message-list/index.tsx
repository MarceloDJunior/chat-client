import React from 'react';
import { Skeleton } from '@/components/skeleton';
import { Random } from '@/helpers/random';
import styles from './styles.module.scss';

export const MessageListSkeleton = React.memo(() => {
  return (
    <div className={styles.skeleton}>
      <Skeleton
        height={70}
        radius={15}
        width={Random.fromArray(['80%', '60%'])}
        alignSelf={Random.fromArray(['start', 'end'])}
      />
      <Skeleton
        height={70}
        radius={15}
        width={Random.fromArray(['70%', '40%'])}
        alignSelf={Random.fromArray(['start', 'end'])}
      />
      <Skeleton
        height={70}
        radius={15}
        width={Random.fromArray(['30%', '40%'])}
        alignSelf={Random.fromArray(['start', 'end'])}
      />
      <Skeleton
        height={70}
        radius={15}
        width={Random.fromArray(['50%', '70%'])}
        alignSelf={Random.fromArray(['start', 'end'])}
      />
      <Skeleton
        height={180}
        radius={15}
        width={'80%'}
        alignSelf={Random.fromArray(['start', 'end'])}
      />
      <Skeleton
        height={70}
        radius={15}
        width={Random.fromArray(['80%', '40%'])}
        alignSelf={Random.fromArray(['start', 'end'])}
      />
      <Skeleton
        height={70}
        radius={15}
        width={Random.fromArray(['50%', '60%'])}
        alignSelf={Random.fromArray(['start', 'end'])}
      />
      <Skeleton
        height={70}
        radius={15}
        width={Random.fromArray(['30%', '70%'])}
        alignSelf={Random.fromArray(['start', 'end'])}
      />
    </div>
  );
});
