import { ReactComponent as CloseIcon } from '@/assets/icons/close.svg';
import { ReactComponent as DownloadIcon } from '@/assets/icons/download.svg';
import { FileHelper, FileType } from '@/helpers/file';
import { useOutsideClick } from '@/hooks/use-outside-click';
import styles from './styles.module.scss';

type MediaViewerProps = {
  fileName: string;
  fileUrl: string;
  onClose: () => void;
};

export const MediaViewer = ({
  fileName,
  fileUrl,
  onClose,
}: MediaViewerProps) => {
  const ref = useOutsideClick(onClose);

  const renderMedia = () => {
    switch (FileHelper.getFileType(fileName)) {
      case FileType.IMAGE:
        return <img src={fileUrl} />;
      case FileType.VIDEO:
        return <video src={fileUrl} controls autoPlay />;
      default:
        return (
          <a href={fileUrl} download title="Download">
            {fileName}
          </a>
        );
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <a href={fileUrl} download>
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
    </div>
  );
};
