import { motion } from 'framer-motion';
import { ReactComponent as CloseIcon } from '@/assets/icons/close.svg';
import { ReactComponent as DownloadIcon } from '@/assets/icons/download.svg';
import { FileHelper, FileType } from '@/helpers/file';
import { useOutsideClick } from '@/hooks/use-outside-click';
import styles from './styles.module.scss';

type MediaViewerProps = {
  fileName: string;
  fileUrl: string;
  animationId: string;
  onClose: () => void;
};

export const MediaViewer = ({
  fileName,
  fileUrl,
  animationId,
  onClose,
}: MediaViewerProps) => {
  const ref = useOutsideClick(onClose);

  const renderMedia = () => {
    switch (FileHelper.getFileType(fileName)) {
      case FileType.IMAGE:
        return <motion.img src={fileUrl} layoutId={animationId} />;
      case FileType.VIDEO:
        return (
          <motion.video
            src={fileUrl}
            controls
            autoPlay
            layoutId={animationId}
          />
        );
      default:
        return (
          <a href={fileUrl} download={fileName} title="Download">
            {fileName}
          </a>
        );
    }
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <a href={fileUrl} download={fileName}>
            <button
              type="button"
              className={styles['download-button']}
              aria-label="Download"
            >
              <DownloadIcon />
            </button>
          </a>
          <button
            type="button"
            className={styles['close-button']}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles['media-container']}>
          <div className={styles.media} ref={ref}>
            {renderMedia()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
