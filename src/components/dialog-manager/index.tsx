import { AnimatePresence } from 'framer-motion';
import { useDialog } from '@/context/dialog-context';
import { Dialog } from '@/components/dialog';

export const DialogManager = () => {
  const { dialogState, hideDialog } = useDialog();

  if (!dialogState.isOpen) return null;

  const handleClose = () => {
    if (dialogState.options?.onCancel) {
      dialogState.options.onCancel();
    }
    hideDialog();
  };

  const handleConfirm = () => {
    if (dialogState.options?.onConfirm) {
      dialogState.options.onConfirm();
    }
    hideDialog();
  };

  const buttons = [];

  if (dialogState.options?.cancelText) {
    buttons.push({
      text: dialogState.options.cancelText,
      onClick: handleClose,
      variant: 'secondary' as const,
    });
  }

  if (dialogState.options?.confirmText) {
    buttons.push({
      text: dialogState.options.confirmText,
      onClick: handleConfirm,
      variant: 'primary' as const,
    });
  }

  return (
    <AnimatePresence>
      {dialogState.isOpen && (
        <Dialog
          title={dialogState.title}
          message={dialogState.message}
          onClose={handleClose}
          buttons={buttons.length > 0 ? buttons : undefined}
        />
      )}
    </AnimatePresence>
  );
};
