import { useCallback, useEffect, useState } from 'react';
import { Attachment } from '@/models/attachment';
import { ReactComponent as CloseIcon } from '@/assets/icons/close.svg';
import { ReactComponent as DocumentIcon } from '@/assets/icons/document.svg';
import SendIcon from '@/assets/icons/send.svg';
import styles from './styles.module.scss';
import { FileHelper, FileType } from '@/helpers/file';
import { Loader } from '../loader';

type SendAttachmentModalProps = {
  attachment: Attachment;
  onClose: () => void;
  onSubmit: (text: string, file: File) => void;
};

type Preview = {
  loaded: boolean;
  type?: FileType;
  dataURL?: string;
};

export const SendAttachmentModal = ({
  attachment,
  onClose,
  onSubmit,
}: SendAttachmentModalProps) => {
  const [subtitle, setSubtitle] = useState(attachment.subtitle ?? '');
  const [preview, setPreview] = useState<Preview>({ loaded: false });

  const handleSubmit = useCallback(() => {
    onSubmit(subtitle ?? '', attachment.file);
    onClose();
  }, [attachment.file, onClose, onSubmit, subtitle]);

  const getPreview = () => {
    if (!preview.loaded) {
      return <Loader width={50} height={50} />;
    }

    switch (preview.type) {
      case 'image':
        return <img src={preview.dataURL} />;
      case 'video':
        return <video src={preview.dataURL} controls />;
      default:
        return (
          <div className={styles.icon}>
            <DocumentIcon />
          </div>
        );
    }
  };

  useEffect(() => {
    const loadPreview = async () => {
      setPreview({ loaded: false });
      const dataURL = URL.createObjectURL(attachment.file);
      const type = FileHelper.getFileType(attachment.file);
      setPreview({
        dataURL,
        type,
        loaded: true,
      });
    };
    loadPreview();
  }, [attachment.file]);

  return (
    <div className={styles.container}>
      <div>
        <button
          type="button"
          className={styles['close-button']}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>
      <div className={styles.content}>
        <h3>{attachment.file.name}</h3>
        <div className={styles.preview}>
          <>{getPreview()}</>
          <div className={styles.size}>
            {FileHelper.bytesToKilobytes(attachment.file.size)} KB
          </div>
        </div>
        <form onSubmit={handleSubmit} className={styles['submit-container']}>
          <input
            type="text"
            name="text"
            onChange={(event) => setSubtitle(event.target.value)}
            value={subtitle}
            placeholder="Write message..."
          />
          <button type="submit" title="Send">
            <img src={SendIcon} alt="Send" width={32} height={32} />
          </button>
        </form>
      </div>
    </div>
  );
};
