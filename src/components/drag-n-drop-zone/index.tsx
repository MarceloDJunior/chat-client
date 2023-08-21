import { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FileHelper } from '@/helpers/file';
import styles from './styles.module.scss';

type DroppableProps = {
  children: React.ReactNode;
  className?: string;
  allowedExtensions?: string[];
  onDropFiles?: (files: File[]) => void;
};

export const DragNDropZone = ({
  className,
  children,
  allowedExtensions,
  onDropFiles,
}: DroppableProps) => {
  const droppableRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const checkIfFilesAreValid = useCallback(
    (files: File[]): boolean => {
      if (!allowedExtensions) {
        return true;
      }

      return files.every((file) => {
        const fileExtension = FileHelper.getFileExtension(file.name);
        return fileExtension && allowedExtensions.includes(fileExtension);
      });
    },
    [allowedExtensions],
  );

  const onDragStartEvent = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeaveEvent = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const data = event.dataTransfer;
      const files = data?.files;

      if (files && onDropFiles) {
        const filesArray = Array.from(files);
        if (checkIfFilesAreValid(filesArray)) {
          onDropFiles(filesArray);
        }
      }
    },
    [checkIfFilesAreValid, onDropFiles],
  );

  useEffect(() => {
    const element = droppableRef.current;

    if (element) {
      element.addEventListener('dragover', onDragStartEvent);
      element.addEventListener('dragleave', onDragLeaveEvent);
      element.addEventListener('drop', onDrop);
    }

    return () => {
      if (element) {
        element.removeEventListener('dragover', onDragStartEvent);
        element.removeEventListener('dragleave', onDragLeaveEvent);
        element.removeEventListener('drop', onDrop);
      }
    };
  }, [onDragLeaveEvent, onDragStartEvent, onDrop]);

  return (
    <div className={classNames(className, styles.container)} ref={droppableRef}>
      <>
        {children}
        <div
          className={classNames(styles.overlay, {
            [styles.dragging]: isDragging,
          })}
        >
          Drop here
        </div>
      </>
    </div>
  );
};
