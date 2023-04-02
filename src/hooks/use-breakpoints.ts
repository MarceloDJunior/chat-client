import breakpoints from '@/styles/breakpoints.module.scss';
import { useEffect, useState } from 'react';

export const useBreakpoints = () => {
  const [width, setWidth] = useState(0);

  const isMobile = width < parseInt(breakpoints.screenSmMin);
  const isTablet =
    width >= parseInt(breakpoints.screenSmMin) &&
    width < parseInt(breakpoints.screenMdMin);
  const isDesktop = width >= parseInt(breakpoints.screenMdMin);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
};
