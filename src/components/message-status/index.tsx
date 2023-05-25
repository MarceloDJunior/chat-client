import { ReactComponent as CheckIcon } from '@/assets/icons/check.svg';
import { ReactComponent as DoubleCheckIcon } from '@/assets/icons/double-check.svg';
import { ReactComponent as PendingIcon } from '@/assets/icons/pending.svg';
import { Message } from '@/models/message';

type MessageStatusProps = {
  message: Message;
  className?: string;
  color?: string;
};

export const MessageStatus = ({
  message,
  className,
  color = '#FFFFFF',
}: MessageStatusProps) => {
  const Icon = (props: any) => {
    if (message.pending) {
      return <PendingIcon {...props} style={{ fill: color }} />;
    }
    if (message.read) {
      return <DoubleCheckIcon {...props} style={{ stroke: color }} />;
    }
    return <CheckIcon {...props} style={{ stroke: color }} />;
  };

  return (
    <Icon className={className} width={message.read ? 18 : 16} height={16} />
  );
};
