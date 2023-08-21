import { useEffect, useRef, MutableRefObject } from 'react';

export const useOutsideClick = (
  callback: () => void,
): MutableRefObject<null | HTMLDivElement> => {
  const ref = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement; // clicked element
      // Check if the clicked element or any of its parents is a button or a link
      let currentNode: HTMLElement | null = targetElement;
      while (currentNode) {
        const isClickableElement =
          currentNode.tagName === 'A' ||
          currentNode.tagName === 'BUTTON' ||
          currentNode.getAttribute('onclick');
        if (isClickableElement) {
          return;
        }
        currentNode = currentNode.parentElement;
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
