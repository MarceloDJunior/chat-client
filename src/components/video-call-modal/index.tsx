import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ReactComponent as PhoneDeclineIcon } from '@/assets/icons/phone-decline.svg';
import { ReactComponent as MicIcon } from '@/assets/icons/mic.svg';
import { ReactComponent as MicOffIcon } from '@/assets/icons/mic-off.svg';
import { ReactComponent as VideoIcon } from '@/assets/icons/video.svg';
import { ReactComponent as VideoOffIcon } from '@/assets/icons/video-off.svg';
import type { User } from '@/models/user';
import styles from './styles.module.scss';

type StreamState = {
  stream: MediaStream | undefined;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
};

type VideoCallModalProps = {
  localStreamState: StreamState;
  remoteStreamState: StreamState;
  currentUser?: User;
  remoteUser?: User;
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
  onClose: () => void;
};

export const VideoCallModal = ({
  localStreamState,
  remoteStreamState,
  currentUser,
  remoteUser,
  onToggleVideo,
  onToggleAudio,
  onClose,
}: VideoCallModalProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    stream: localStream,
    isVideoEnabled,
    isAudioEnabled,
  } = localStreamState;
  const { stream: remoteStream, isVideoEnabled: isRemoteVideoEnabled } =
    remoteStreamState;

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
      <div className={styles.content}>
        <video
          className={styles['remote-video']}
          ref={remoteVideoRef}
          autoPlay
          playsInline
          controls={false}
          style={{ display: isRemoteVideoEnabled ? 'block' : 'none' }}
        />
        {!isRemoteVideoEnabled && (
          <div className={styles['video-placeholder']}>
            {remoteUser?.picture ? (
              <img
                src={remoteUser.picture}
                alt={remoteUser.name}
                className={styles['placeholder-image']}
              />
            ) : (
              <div className={styles['placeholder-avatar']}>
                {remoteUser?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <p className={styles['placeholder-text']}>
              {remoteUser?.name || 'Remote User'}
            </p>
          </div>
        )}
        {!remoteStreamState.isAudioEnabled && (
          <div className={styles['audio-indicator']}>
            <MicOffIcon />
          </div>
        )}
        <div className={styles['local-video-container']}>
          <video
            className={styles['local-video']}
            ref={localVideoRef}
            autoPlay
            playsInline
            controls={false}
            style={{ display: isVideoEnabled ? 'block' : 'none' }}
          />
          {!isVideoEnabled && (
            <div className={styles['local-video-placeholder']}>
              {currentUser?.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className={styles['local-placeholder-image']}
                />
              ) : (
                <div className={styles['local-placeholder-avatar']}>
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <div className={styles['left-controls']}>
            <button
              type="button"
              className={`${styles['control-button']} ${
                !isAudioEnabled ? styles.disabled : ''
              }`}
              onClick={onToggleAudio}
            >
              {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
            </button>
            <button
              type="button"
              className={`${styles['control-button']} ${
                !isVideoEnabled ? styles.disabled : ''
              }`}
              onClick={onToggleVideo}
            >
              {isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />}
            </button>
          </div>
          <div className={styles.separator} />
          <button
            type="button"
            className={styles['end-call-button']}
            onClick={closeVideo}
          >
            <PhoneDeclineIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
