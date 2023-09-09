import { Fragment, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import { ReactComponent as DownloadIcon } from '@/assets/icons/download.svg';
import { DateHelper } from '@/helpers/date';
import { FileHelper, FileType } from '@/helpers/file';
import { Message } from '@/models/message';
import { User } from '@/models/user';
import { MessageStatus } from '../message-status';
import { MediaViewer } from '../media-viewer';
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

  const renderMessageMedia = (message: Message) => {
    if (message.fileName && message.fileUrl) {
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
            <div className={styles['media-wrapper']}>
              <motion.img
                layoutId={animationId}
                src={message.fileUrl}
                className={styles['img-preview']}
                onClick={openMedia}
              />
            </div>
          );
        case FileType.VIDEO:
          return (
            <div className={styles['media-wrapper']}>
              <motion.div
                layoutId={animationId}
                role="button"
                onClick={openMedia}
                className={styles['video-preview']}
              >
                <video src={message.fileUrl} onClick={openMedia} />
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
