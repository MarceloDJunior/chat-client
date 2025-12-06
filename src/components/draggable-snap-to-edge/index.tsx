import { useRef, ReactNode, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

type DraggableSnapToEdgeProps = {
  children: ReactNode;
  className?: string;
  padding?: number;
  width: number;
  height: number;
};

export const DraggableSnapToEdge = ({
  children,
  className,
  padding = 20,
  width,
  height,
}: DraggableSnapToEdgeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(window.innerWidth - width - padding);
  const y = useMotionValue(window.innerHeight - height - padding);

  // Update initial position when width/height changes
  useEffect(() => {
    x.set(window.innerWidth - width - padding);
    y.set(window.innerHeight - height - padding);
  }, [width, height, padding, x, y]);

  const handleDragEnd = () => {
    if (!containerRef.current) return;

    // Use requestAnimationFrame to ensure we get the updated position
    requestAnimationFrame(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Calculate distances to each edge from center
      const distToLeft = centerX;
      const distToRight = windowWidth - centerX;
      const distToTop = centerY;
      const distToBottom = windowHeight - centerY;

      // Find minimum distance
      const minDist = Math.min(
        distToLeft,
        distToRight,
        distToTop,
        distToBottom,
      );

      // Snap to closest edge with animation
      const springConfig = {
        type: 'spring' as const,
        stiffness: 500,
        damping: 35,
      };

      if (minDist === distToLeft) {
        animate(x, padding, springConfig);
      } else if (minDist === distToRight) {
        animate(x, windowWidth - rect.width - padding, springConfig);
      }

      if (minDist === distToTop) {
        animate(y, padding, springConfig);
      } else if (minDist === distToBottom) {
        animate(y, windowHeight - rect.height - padding, springConfig);
      }
    });
  };

  return (
    <motion.div
      ref={containerRef}
      className={className}
      drag
      dragElastic={0}
      dragMomentum={false}
      dragConstraints={{
        top: padding,
        left: padding,
        right: window.innerWidth - width - padding,
        bottom: window.innerHeight - height - padding,
      }}
      style={{ x, y }}
      onDragEnd={handleDragEnd}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
    >
      {children}
    </motion.div>
  );
};
