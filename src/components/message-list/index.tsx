import { Fragment, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactComponent as DownloadIcon } from '@/assets/icons/download.svg';
import { ReactComponent as PlayIcon } from '@/assets/icons/play.svg';
import { DateHelper } from '@/helpers/date';
import { FileHelper, FileType } from '@/helpers/file';
import { Message } from '@/models/message';
import { User } from '@/models/user';
import { MessageStatus } from '../message-status';
import { MediaViewer } from '../media-viewer';
import { ProgressBar } from '../progress-bar';
import styles from './styles.module.scss';

type MessageListProps = {
  myUser: User;
  messages: Message[];
  hasMoreMessages: boolean;
  onLoadMoreClick: () => void;
};

type Media = {
  fileName: string;
  fileUrl: string;
  animationId: string;
};

export const MessageList = ({
  myUser,
  messages,
  hasMoreMessages,
  onLoadMoreClick,
}: MessageListProps) => {
  let lastMessageDate: string;
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentOpenMedia, setCurrentOpenMedia] = useState<Media>();

  const orderedMessages = useMemo(() => {
    const orderedMessages = [...messages];
    orderedMessages.reverse();
    setIsLoadingMore(false);
    return orderedMessages;
  }, [messages]);

  const handleLoadMoreClick = useCallback(() => {
    setIsLoadingMore(true);
    // Give some time to show the loading state
    setTimeout(() => {
      onLoadMoreClick();
    }, 200);
  }, [onLoadMoreClick]);

  const getLayoutShiftPreventionStyles = (fileUrl: string) => {
    // Preload the image size from the URL params to avoid layout shift
    const url = new URL(fileUrl);
    const width = Number(url.searchParams.get('width'));
    const height = Number(url.searchParams.get('height'));
    const style: Record<string, any> = {};
    if (width && height) {
      const aspectRatio = width / height;
      style.aspectRatio = aspectRatio;
      if (width > height) {
        style.width = Math.min(width, 220);
      } else {
        style.height = Math.min(height, 220);
      }
    }
    return style;
  };

  const renderMessageMedia = (message: Message) => {
    if (message.fileName && message.fileUrl) {
      const wrapperStyle = getLayoutShiftPreventionStyles(message.fileUrl);
      // When image is already uploaded, we need to fill the preloaded size to avoid layout shift
      // When it's being uploaded, the local image is already loaded, so we use the default size
      const imageSize = message.pending ? 'auto' : '100%';
      const animationId = String(message.id);
      const openMedia = () =>
        setCurrentOpenMedia({
          fileName: message.fileName ?? '',
          fileUrl: message.fileUrl ?? '',
          animationId,
        });

      switch (FileHelper.getFileType(message.fileName)) {
        case FileType.IMAGE:
          return (
            <div className={styles['media-wrapper']} style={wrapperStyle}>
              <motion.img
                layoutId={animationId}
                src={message.fileUrl}
                className={styles['img-preview']}
                onClick={openMedia}
                style={{ width: imageSize, height: imageSize }}
              />
            </div>
          );
        case FileType.VIDEO:
          return (
            <div className={styles['media-wrapper']} style={wrapperStyle}>
              <motion.div
                layoutId={animationId}
                role="button"
                onClick={openMedia}
                className={styles['video-preview']}
                style={{ width: imageSize, height: imageSize }}
              >
                <video src={message.fileUrl} onClick={openMedia} />
                <PlayIcon />
              </motion.div>
            </div>
          );
        default:
          return (
            <a
              href={message.fileUrl}
              download
              title="Download"
              className={styles.download}
            >
              {message.fileName} <DownloadIcon />
            </a>
          );
      }
    }
    return null;
  };

  return (
    <div className={styles.container}>
      {hasMoreMessages && (
        <div className={styles['load-more-button-container']}>
          <button
            className={styles['load-more-button']}
            onClick={handleLoadMoreClick}
            disabled={isLoadingMore}
          >
            Load More
          </button>
        </div>
      )}
      {orderedMessages?.map((message) => {
        const currentDate = DateHelper.formatDate(message.dateTime);
        const isDifferentFromPrevious = currentDate !== lastMessageDate;
        lastMessageDate = currentDate;
        return (
          <Fragment key={`${message.id}-${message.dateTime.toString()}`}>
            {isDifferentFromPrevious && (
              <div className={styles.date}>{currentDate}</div>
            )}
            <div
              className={classNames(styles['message-container'], {
                [styles.sent]: message.from.id === myUser.id,
                [styles.pending]: !!message.pending,
              })}
            >
              <div className={styles.message}>
                {renderMessageMedia(message)}
                <AnimatePresence>
                  {message.pending && message.fileName && (
                    <ProgressBar progress={message.progress ?? 0} />
                  )}
                </AnimatePresence>
                <div className={styles.text}>{message.text}</div>
                <div className={styles.time}>
                  {DateHelper.formatHoursMinutes(message.dateTime)}
                </div>
                <div className={styles['message-status']}>
                  {message.from.id === myUser.id && (
                    <MessageStatus message={message} />
                  )}
                </div>
              </div>
            </div>
          </Fragment>
        );
      })}
      {currentOpenMedia && (
        <MediaViewer
          fileName={currentOpenMedia.fileName}
          fileUrl={currentOpenMedia.fileUrl}
          animationId={currentOpenMedia.animationId}
          onClose={() => setCurrentOpenMedia(undefined)}
        />
      )}
    </div>
  );
};
