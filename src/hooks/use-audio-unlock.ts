import { useEffect } from 'react';
import SentMessageSound from '@/assets/sounds/sent-message.mp3';
import ReceivedMessageSound from '@/assets/sounds/received-message.mp3';
import IncomingCallSound from '@/assets/sounds/incoming-call.mp3';

// Pre-create audio instances at module level and export them
export const sentMessageSound = new Audio(SentMessageSound);
sentMessageSound.muted = true;
export const receivedMessageSound = new Audio(ReceivedMessageSound);
receivedMessageSound.muted = true;
export const incomingCallSound = new Audio(IncomingCallSound);
incomingCallSound.muted = true;

/**
 * Hook to unlock audio playback on browsers with strict autoplay policies.
 *
 * Modern browsers (especially Safari) prevent audio from playing automatically
 * to avoid disrupting the user experience. Safari is particularly strict and
 * requires that every audio element be played at least once during a user
 * interaction (click, tap, etc.) before it can be used programmatically later.
 *
 * This hook plays all audio files muted on the first user click, which "unlocks"
 * them for future programmatic playback without user interaction. Without this,
 * notification sounds and other audio would fail to play silently.
 */
export const useAudioUnlock = () => {
  useEffect(() => {
    // Unlock audio on the first user interaction
    window.addEventListener(
      'click',
      () => {
        sentMessageSound.play().then(() => {
          sentMessageSound.pause();
          sentMessageSound.muted = false;
        });
        receivedMessageSound.play().then(() => {
          receivedMessageSound.pause();
          receivedMessageSound.muted = false;
        });
        incomingCallSound.play().then(() => {
          incomingCallSound.pause();
          incomingCallSound.muted = false;
        });
      },
      { once: true },
    );
  }, []);
};
