import { FormEvent, useState } from 'react';
import SendIcon from '@/assets/icons/send.svg';
import styles from './styles.module.scss';

type SendMessageFieldProps = {
  onSubmit: (text: string) => Promise<boolean>;
  onFocus?: () => void;
};

export const SendMessageField = ({
  onSubmit,
  onFocus,
}: SendMessageFieldProps) => {
  const [text, setText] = useState<string>('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setText('');
    await onSubmit(text);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        type="text"
        name="text"
        onChange={(event) => setText(event.target.value)}
        value={text}
        onFocus={onFocus}
        placeholder="Write message..."
      />
      <button type="submit" title="Send Message">
        <img src={SendIcon} alt="Send Message" width={32} height={32} />
      </button>
    </form>
  );
};
