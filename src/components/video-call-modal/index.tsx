import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ReactComponent as CloseIcon } from '@/assets/icons/close.svg';
import styles from './styles.module.scss';

type VideoCallModalProps = {
  localStream: MediaStream | undefined;
  remoteStream: MediaStream | undefined;
  onClose: () => void;
};

export const VideoCallModal = ({
  localStream,
  remoteStream,
  onClose,
}: VideoCallModalProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  const closeVideo = () => {
    onClose();
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ scale: 0.2, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.3, opacity: 0 }}
    >
      <div>
        <button
          type="button"
          className={styles['close-button']}
          onClick={closeVideo}
        >
          <CloseIcon />
        </button>
      </div>
      <div className={styles.content}>
        <video
          className={styles['remote-video']}
          ref={remoteVideoRef}
          autoPlay
          playsInline
          controls={false}
        />
        <video
          className={styles['local-video']}
          ref={localVideoRef}
          autoPlay
          playsInline
          controls={false}
        />
      </div>
    </motion.div>
  );
};
