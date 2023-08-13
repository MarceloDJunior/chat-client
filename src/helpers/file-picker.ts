const PICKER_ID = 'file-picker-input-element';

type FilePickerOptions = {
  allowedFileTypes?: string[];
  multiple?: boolean;
};

type FileSelectedCallbackSingle = (file: File) => void;
type FileSelectedCallbackMultiple = (files: File[]) => void;

// Determine the return type based on the options
type FileSelectedCallback<T extends FilePickerOptions> =
  T['multiple'] extends true
    ? FileSelectedCallbackMultiple
    : FileSelectedCallbackSingle;

export class FilePicker {
  private inputFile: HTMLInputElement | null = null;
  private options?: FilePickerOptions;
  private callback: FileSelectedCallback<any> | null = null;

  public static openFilePicker = <GenericOptionsType extends FilePickerOptions>(
    callback: FileSelectedCallback<GenericOptionsType>,
    options?: GenericOptionsType,
  ) => {
    const self = new FilePicker();
    self.options = options;
    self.callback = callback;

    self.setupInputFile();
    self.addChangeListener();
    self.removePickerOnDialogClose();
    self.addInputToBody();
    self.inputFile?.click();
  };

  private setupInputFile() {
    const inputFile = document.createElement('input');
    inputFile.style.display = 'none';
    inputFile.id = PICKER_ID;
    inputFile.value = '';
    inputFile.type = 'file';
    inputFile.multiple = this.options?.multiple || false;
    inputFile.accept = this.makeAcceptString();
    this.inputFile = inputFile;
  }

  private makeAcceptString(): string {
    const allowedFileTypes = this.options?.allowedFileTypes;
    if (allowedFileTypes) {
      return allowedFileTypes.map((extension) => `.${extension}`).join(',');
    }
    return '*';
  }

  private addChangeListener() {
    this.inputFile?.addEventListener('change', (event: Event) => {
      const files = (<HTMLInputElement>event.target)?.files;
      if (files && files.length > 0) {
        if (this.inputFile?.multiple) {
          const validFiles: File[] = [];
          Array.from(files).forEach((file: File) => {
            if (this.validateFileType(file)) {
              validFiles.push(file);
            }
          });
          if (this.callback) {
            const callback = this.callback as FileSelectedCallbackMultiple;
            callback(validFiles);
          }
        } else {
          const file = files[0];
          if (file && this.callback) {
            const callback = this.callback as FileSelectedCallbackSingle;
            callback(file);
          }
        }
      }
    });
  }

  private validateFileType(file: File): boolean {
    const extension = this.getFileExtension(file.name);
    if (
      !this.options?.allowedFileTypes ||
      (extension && this.options?.allowedFileTypes.includes(extension))
    ) {
      return true;
    }
    return false;
  }

  private getFileExtension(fileName: string): string | null {
    const splitted = fileName.split('.');
    if (splitted.length > 1) {
      return splitted.pop() || null;
    }
    return null;
  }

  private removePickerOnDialogClose() {
    window.addEventListener('focus', () => {
      this.removePicker();
    });
  }

  private removePicker() {
    const picker = document.getElementById(PICKER_ID);
    if (picker) {
      document.body.removeChild(picker);
    }
  }

  private addInputToBody() {
    this.removePicker();
    if (this.inputFile) {
      document.body.appendChild(this.inputFile);
    }
  }
}
