import { Fragment, useState } from 'react';
import { ReactComponent as LeftArrowIcon } from '@/assets/icons/left-arrow.svg';
import { ReactComponent as RightArrowIcon } from '@/assets/icons/right-arrow.svg';
import styles from './styles.module.scss';

type CarouselProps = {
  children: React.ReactNode[];
};

export const Carousel = ({ children }: CarouselProps) => {
  const [current, setCurrent] = useState(0);

  const isFirst = current === 0;
  const isLast = current === children.length - 1;

  const nextSlide = () => {
    if (!isLast) {
      setCurrent(current + 1);
    }
  };

  const prevSlide = () => {
    if (!isFirst) {
      setCurrent(current - 1);
    }
  };

  return (
    <div className={styles.container}>
      {children.length > 1 && (
        <button
          onClick={prevSlide}
          title="Prev"
          className={styles['prev-button']}
          disabled={isFirst}
        >
          <LeftArrowIcon />
        </button>
      )}
      {children.map((item, index) => (
        <Fragment key={index}>{index === current && item}</Fragment>
      ))}
      {children.length > 1 && (
        <button
          onClick={nextSlide}
          title="Next"
          className={styles['next-button']}
          disabled={isLast}
        >
          <RightArrowIcon />
        </button>
      )}
    </div>
  );
};
