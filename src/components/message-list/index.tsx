import classNames from 'classnames';
import { Fragment, useMemo } from 'react';
import { DateHelper } from '../../helpers/date';
import { Message } from '../../models/message';
import { User } from '../../models/user';
import CheckIcon from '../../assets/icons/check.svg';
import DoubleCheckIcon from '../../assets/icons/double-check.svg';
import styles from './styles.module.scss';

type MessageListProps = {
  myUser: User;
  messages: Message[];
};

export const MessageList = ({ myUser, messages }: MessageListProps) => {
  let lastMessageDate: string;

  const orderedMessages = useMemo(() => {
    const orderedMessages = [...messages];
    orderedMessages.reverse();
    return orderedMessages;
  }, [messages]);

  return (
    <div className={styles.container}>
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
              })}
            >
              <div className={styles.message}>
                <div className={styles.text}>{message.text}</div>
                <div className={styles.time}>
                  {DateHelper.formatHoursMinutes(message.dateTime)}
                </div>
                <div className={styles['message-status']}>
                  {message.from.id === myUser.id && (
                    <img
                      src={message.read ? DoubleCheckIcon : CheckIcon}
                      width={message.read ? 18 : 16}
                    />
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
