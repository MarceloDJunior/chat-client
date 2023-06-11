import { FormEvent } from 'react';
import SendIcon from '@/assets/icons/send.svg';
import { ReactComponent as AttachmentIcon } from '@/assets/icons/attachment.svg';
import { FilePicker } from '@/helpers/file-picker';
import styles from './styles.module.scss';

type SendMessageFieldProps = {
  text: string;
  setText: (value: string) => void;
  onSubmit: (text: string) => Promise<boolean>;
  onFileSelected: (file: File) => void;
  onFocus?: () => void;
};

export const SendMessageField = ({
  text,
  setText,
  onSubmit,
  onFileSelected,
  onFocus,
}: SendMessageFieldProps) => {
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setText('');
    await onSubmit(text);
  };

  const handleAddAttachmentClick = () => {
    FilePicker.openFilePicker(onFileSelected);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <button
        type="button"
        title="Add attachments"
        className={styles['add-attachment']}
        onClick={handleAddAttachmentClick}
      >
        <AttachmentIcon />
      </button>
      <input
        type="text"
        name="text"
        onChange={(event) => setText(event.target.value)}
        value={text}
        onFocus={onFocus}
        placeholder="Write message..."
      />
      <button type="submit" title="Send Message" disabled={!text}>
        <img src={SendIcon} alt="Send Message" width={32} height={32} />
      </button>
    </form>
  );
};
