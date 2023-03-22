import { FormEvent, useState } from 'react';
import SendIcon from '../../assets/icons/send.svg';
import styles from './styles.module.scss';

type SendMessageFieldProps = {
  onSubmit: (text: string) => Promise<boolean>;
  onFocus?: () => void;
  isSending?: boolean;
};

export const SendMessageField = ({
  onSubmit,
  onFocus,
  isSending,
}: SendMessageFieldProps) => {
  const [text, setText] = useState<string>('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await onSubmit(text);
    if (result) {
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        type="text"
        name="text"
        onChange={(event) => setText(event.target.value)}
        value={text}
        readOnly={isSending}
        onFocus={onFocus}
        placeholder="Write message..."
      />
      <button type="submit" disabled={isSending}>
        <img src={SendIcon} alt="Send Message" width={32} height={32} />
      </button>
    </form>
  );
};
