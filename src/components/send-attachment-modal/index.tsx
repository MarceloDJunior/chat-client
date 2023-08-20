import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SendIcon from '@/assets/icons/send.svg';
import { ReactComponent as CloseIcon } from '@/assets/icons/close.svg';
import { ReactComponent as DocumentIcon } from '@/assets/icons/document.svg';
import { Attachment } from '@/models/attachment';
import { FileHelper, FileType } from '@/helpers/file';
import { Carousel } from '../carousel';
import { Loader } from '../loader';
import styles from './styles.module.scss';

type SendAttachmentModalProps = {
  attachments: Attachment[];
  onClose: () => void;
  onSubmit: (text: string, file: File) => void;
};

type Preview = {
  loaded: boolean;
  type?: FileType;
  dataURL?: string;
};

type AttachmentEditable = {
  file: File;
  preview: Preview;
  subtitle?: string;
};

export const SendAttachmentModal = ({
  attachments,
  onClose,
  onSubmit,
}: SendAttachmentModalProps) => {
  const [currentAttachments, setCurrentAttachments] = useState<
    AttachmentEditable[]
  >([]);

  const handleSubmit = useCallback(async () => {
    for (const attachment of currentAttachments) {
      onSubmit(attachment.subtitle ?? '', attachment.file);
    }
    onClose();
  }, [currentAttachments, onClose, onSubmit]);

  const getPreview = (attachment: AttachmentEditable) => {
    const preview = attachment.preview;

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

  const updateAttachmentPreview = (fileName: string, previewData: Preview) => {
    setCurrentAttachments((attachments) => {
      return attachments.map((attachment) => {
        if (attachment.file.name === fileName) {
          return {
            ...attachment,
            preview: previewData,
          };
        }
        return attachment;
      });
    });
  };

  const updateAttachmentSubtitle = (fileName: string, subtitle: string) => {
    setCurrentAttachments((attachments) => {
      return attachments.map((attachment) => {
        if (attachment.file.name === fileName) {
          return {
            ...attachment,
            subtitle,
          };
        }
        return attachment;
      });
    });
  };

  useEffect(() => {
    const loadPreview = async (attachment: AttachmentEditable) => {
      updateAttachmentPreview(attachment.file.name, { loaded: false });
      const dataURL = URL.createObjectURL(attachment.file);
      const type = FileHelper.getFileType(attachment.file);
      updateAttachmentPreview(attachment.file.name, {
        dataURL,
        type,
        loaded: true,
      });
    };

    const initialAttachments = attachments.map((attachment) => ({
      file: attachment.file,
      subtitle: attachment.subtitle,
      preview: {
        loaded: false,
      },
    }));

    setCurrentAttachments(initialAttachments);

    for (const attachment of initialAttachments) {
      loadPreview(attachment);
    }
  }, [attachments]);

  return (
    <motion.div
      className={styles.container}
      initial={{ scale: 0.2, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.3, opacity: 0 }}
    >
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
        <Carousel>
          {currentAttachments.map((attachment) => (
            <div className={styles.item} key={attachment.file.name}>
              <h3>{attachment.file.name}</h3>
              <div className={styles.preview}>
                {getPreview(attachment)}
                <div className={styles.size}>
                  {FileHelper.bytesToKilobytes(attachment.file.size)} KB
                </div>
              </div>
              <form
                onSubmit={handleSubmit}
                className={styles['submit-container']}
              >
                <input
                  type="text"
                  name="text"
                  onChange={(event) =>
                    updateAttachmentSubtitle(
                      attachment.file.name,
                      event.target.value,
                    )
                  }
                  value={attachment.subtitle}
                  placeholder="Write message..."
                />
                <button type="submit" title="Send">
                  <img src={SendIcon} alt="Send" width={32} height={32} />
                </button>
              </form>
            </div>
          ))}
        </Carousel>
      </div>
    </motion.div>
  );
};
