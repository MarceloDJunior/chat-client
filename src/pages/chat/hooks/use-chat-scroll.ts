// Add check to see if is at bottom and if it's not, increment new message

import { RefObject, useEffect, useState } from 'react';

export const useChatScroll = (messagesRef: RefObject<HTMLDivElement>) => {
  const [isAtBottom, setIsAtBottom] = useState(true);

  const messagesUpdated = messagesRef.current;

  useEffect(() => {
    const messagesContainerRef = messagesUpdated;

    const listener = (event: any) => {
      const element = event.target;
      const isAtBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight <= 30;
      setIsAtBottom(isAtBottom);
    };

    messagesContainerRef?.addEventListener('scroll', listener);

    return () => {
      messagesContainerRef?.removeEventListener('scroll', listener);
    };
  }, [messagesUpdated]);

  const scrollToBottom = () => {
    const ref = messagesRef.current;
    if (ref) {
      ref.scroll({ top: ref.scrollHeight, behavior: 'smooth' });
    }
  };

  return {
    isAtBottom,
    scrollToBottom,
  };
};
