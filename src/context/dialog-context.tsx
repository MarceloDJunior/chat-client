import { createContext, useCallback, useContext, useState } from 'react';

type DialogOptions = {
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
};

type DialogState = {
  isOpen: boolean;
  title: string;
  message: string;
  options?: DialogOptions;
};

type DialogContextType = {
  dialogState: DialogState;
  showDialog: (title: string, message: string, options?: DialogOptions) => void;
  hideDialog: () => void;
};

const DialogContext = createContext({} as DialogContextType);

export const useDialog = () => useContext(DialogContext);

type DialogProviderProps = {
  children: React.ReactNode;
};

export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    options: undefined,
  });

  const showDialog = useCallback(
    (title: string, message: string, options?: DialogOptions) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        options,
      });
    },
    [],
  );

  const hideDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return (
    <DialogContext.Provider value={{ dialogState, showDialog, hideDialog }}>
      {children}
    </DialogContext.Provider>
  );
};
