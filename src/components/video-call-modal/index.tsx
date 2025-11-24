import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ReactComponent as CloseIcon } from '@/assets/icons/close.svg';
import styles from './styles.module.scss';

type VideoCallModalProps = {
  getVideoStream: () => Promise<MediaStream>;
  onClose: () => void;
};

export const VideoCallModal = ({
  getVideoStream,
  onClose,
}: VideoCallModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const openCamera = async () => {
      try {
        const stream = await getVideoStream();
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        alert('Error opening camera');
      }
    };

    openCamera();
  }, [getVideoStream]);

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
        <video ref={videoRef} autoPlay playsInline controls={false} />
      </div>
    </motion.div>
  );
};
