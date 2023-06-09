import classNames from 'classnames';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { DateHelper } from '@/helpers/date';
import { FileHelper, FileType } from '@/helpers/file';
import { Message } from '@/models/message';
import { User } from '@/models/user';
import styles from './styles.module.scss';
import { MessageStatus } from '../message-status';

type MessageListProps = {
  myUser: User;
  messages: Message[];
  hasMoreMessages: boolean;
  onLoadMoreClick: () => void;
};

export const MessageList = ({
  myUser,
  messages,
  hasMoreMessages,
  onLoadMoreClick,
}: MessageListProps) => {
  let lastMessageDate: string;
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  const renderMessageAttachment = (message: Message) => {
    if (message.fileName && message.fileUrl) {
      switch (FileHelper.getFileType(message.fileName)) {
        case FileType.IMAGE:
          return <img src={message.fileUrl} className={styles.preview} />;
        case FileType.VIDEO:
          return (
            <video src={message.fileUrl} className={styles.preview} controls />
          );
        default:
          return (
            <a href={message.fileUrl} download title="Download">
              {message.fileName}
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
                {renderMessageAttachment(message)}
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
    </div>
  );
};
