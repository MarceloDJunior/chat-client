import { FileHelper } from '@/helpers/file';
import { Attachment } from '@/models/attachment';
import { useCallback, useState } from 'react';

type Props = {
  currentText?: string;
};

const MAX_FILE_SIZE_IN_BYTES = 1024 * 1024 * 50; // 50MB

export const useAttachments = ({ currentText }: Props) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const checkAndRemoveBigAttachments = useCallback(
    (attachments: Attachment[]): Attachment[] => {
      const maxSizeInMB = FileHelper.bytesToMegabytes(MAX_FILE_SIZE_IN_BYTES);
      if (attachments.length === 1) {
        const attachment = attachments[0];
        if (attachment.file.size > MAX_FILE_SIZE_IN_BYTES) {
          alert(
            `The selected file exceeds the maximum allowed size of ${maxSizeInMB}MB. Please choose a smaller file.`,
          );
          return [];
        }
        return [attachment];
      }

      const allowedAttachments = [];
      let hasBigFiles = false;
      for (const attachment of attachments) {
        if (attachment.file.size > MAX_FILE_SIZE_IN_BYTES) {
          hasBigFiles = true;
        } else {
          allowedAttachments.push(attachment);
        }
      }
      if (hasBigFiles) {
        if (allowedAttachments.length === 0) {
          alert(
            `All the selected files exceed the ${maxSizeInMB}MB limit. Please select files that are each under 2MB.`,
          );
        } else {
          alert(
            `Some files were larger than the ${maxSizeInMB}MB size limit and have not been uploaded. Please make sure each individual file is smaller than ${maxSizeInMB}MB.`,
          );
        }
      }
      return allowedAttachments;
    },
    [],
  );

  const updateAttachments = useCallback(
    (files: File[]) => {
      const attachments: Attachment[] = files.map((file, index) => ({
        file,
        subtitle: index === 0 ? currentText : undefined,
      }));
      const allowedAttachments = checkAndRemoveBigAttachments(attachments);
      setAttachments(allowedAttachments);
    },
    [checkAndRemoveBigAttachments, currentText],
  );

  const removeAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return {
    attachments,
    updateAttachments,
    removeAttachments,
  };
};
