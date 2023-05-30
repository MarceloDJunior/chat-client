const PICKER_ID = 'file-picker-input-element';

type FileSelectedCallback = (files: File) => void;

type FilePickerOptions = {
  allowedFileTypes?: string[];
  multiple?: boolean;
};

export class FilePicker {
  private inputFile: HTMLInputElement | null = null;
  private options?: FilePickerOptions;
  private callback: FileSelectedCallback | null = null;

  public static openFilePicker = (
    callback: FileSelectedCallback,
    options?: FilePickerOptions,
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
          Array.from(files).forEach((file: File) => {
            this.checkFileType(file);
          });
        } else {
          this.checkFileType(files[0]);
        }
      }
    });
  }

  private checkFileType(file: File) {
    const extension = this.getFileExtension(file.name);
    if (
      !this.options?.allowedFileTypes ||
      (extension && this.options?.allowedFileTypes.includes(extension))
    ) {
      this.callback?.(file);
    }
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
