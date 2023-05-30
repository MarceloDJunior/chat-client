import { FormEvent, useState } from 'react';
import SendIcon from '@/assets/icons/send.svg';
import { ReactComponent as AttachmentIcon } from '@/assets/icons/attachment.svg';
import styles from './styles.module.scss';
import { FilePicker } from '@/helpers/file-picker';

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

  const onFileSelected = (files: File) => {
    console.log(files);
  };

  const handleAddAttachmentClick = () => {
    FilePicker.openFilePicker(onFileSelected, { multiple: true });
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
