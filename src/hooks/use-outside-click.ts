import { useEffect, useRef, MutableRefObject } from 'react';

export const useOutsideClick = (
  callback: () => void,
): MutableRefObject<null | HTMLDivElement> => {
  const ref = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement; // clicked element
      // If the clicked element has an onclick event or an href attribute, don't run the callback
      if (targetElement.onclick || targetElement.getAttribute('href')) {
        return;
      }
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
};
