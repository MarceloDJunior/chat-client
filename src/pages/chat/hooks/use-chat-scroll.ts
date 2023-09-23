// Add check to see if is at bottom and if it's not, increment new message

import { RefObject, useEffect, useState } from 'react';

export const useChatScroll = (messagesRef: RefObject<HTMLDivElement>) => {
  const [distanceFromBottom, setDistanceFromBottom] = useState(0);
  const [preserveScrollPosition, setPreserveScrollPosition] = useState(false);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);
  const messagesUpdatedRef = messagesRef.current;

  useEffect(() => {
    const scrollPositionListener = (event: Event) => {
      const element = event.target as HTMLElement;
      const distanceFromBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight;
      setDistanceFromBottom(distanceFromBottom);
    };

    messagesUpdatedRef?.addEventListener('scroll', scrollPositionListener);

    return () => {
      messagesUpdatedRef?.removeEventListener('scroll', scrollPositionListener);
    };
  }, [messagesUpdatedRef]);

  useEffect(() => {
    const messagesContainerObserver = new MutationObserver(() => {
      const hasLodedOlderMessages =
        messagesUpdatedRef &&
        messagesUpdatedRef.scrollHeight !== prevScrollHeight;
      if (hasLodedOlderMessages) {
        const currentScrollHeight = messagesUpdatedRef.scrollHeight;
        if (preserveScrollPosition) {
          // Preserve the scroll position, keeping the same distance from the bottom it had before
          messagesUpdatedRef.scrollTop =
            currentScrollHeight -
            distanceFromBottom -
            messagesUpdatedRef.clientHeight;
          setPreserveScrollPosition(false);
        }
        setPrevScrollHeight(messagesUpdatedRef.scrollHeight);
      }
    });

    // Add observer to the first child of the messages ref, the messages container
    // Messages ref = holds the scrollable div with fixed size.
    // Messages container = holds all the messages and have a dynamic height.
    // This way, we detect when new messages are added to the container div.
    if (messagesUpdatedRef?.firstElementChild) {
      messagesContainerObserver.observe(messagesUpdatedRef.firstElementChild, {
        childList: true,
      });
    }

    return () => messagesContainerObserver.disconnect();
  }, [
    distanceFromBottom,
    messagesUpdatedRef,
    preserveScrollPosition,
    prevScrollHeight,
  ]);

  const scrollToBottom = () => {
    const ref = messagesRef.current;
    if (ref) {
      ref.scroll({ top: ref.scrollHeight, behavior: 'smooth' });
    }
  };

  return {
    distanceFromBottom,
    scrollToBottom,
    preserveScrollPositionOnNextChange: () => setPreserveScrollPosition(true),
  };
};
