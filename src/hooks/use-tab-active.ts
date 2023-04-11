import { useEffect, useState } from 'react';

export const useTabActive = () => {
  const [visibilityState, setVisibilityState] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setVisibilityState(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    isTabActive: visibilityState,
  };
};
