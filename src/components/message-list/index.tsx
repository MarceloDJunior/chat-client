import { Fragment, useMemo } from 'react';
import { DateHelper } from '../../helpers/date';
import { Message } from '../../models/message';
import { User } from '../../models/user';
import CheckIcon from '../../assets/icons/check.svg';
import DoubleCheckIcon from '../../assets/icons/double-check.svg';
import * as S from './styles';

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

  const isSent = (message: Message): boolean => {
    return message.from.id === myUser.id;
  };

  return (
    <S.Container>
      {orderedMessages?.map((message) => {
        const currentDate = DateHelper.formatDate(message.dateTime);
        const isDifferentFromPrevious = currentDate !== lastMessageDate;
        lastMessageDate = currentDate;
        return (
          <Fragment key={`${message.id}-${message.dateTime.toString()}`}>
            {isDifferentFromPrevious && <S.Date>{currentDate}</S.Date>}
            <S.MessageWrapper isSent={isSent(message)}>
              <S.MessageContent>
                <div>{message.text}</div>
                <S.Time>
                  {DateHelper.formatHoursMinutes(message.dateTime)}
                </S.Time>
                <S.Status>
                  {isSent(message) && (
                    <img
                      src={message.read ? DoubleCheckIcon : CheckIcon}
                      height={message.read ? 20 : 18}
                      width={message.read ? 20 : 18}
                    />
                  )}
                </S.Status>
              </S.MessageContent>
            </S.MessageWrapper>
          </Fragment>
        );
      })}
    </S.Container>
  );
};
