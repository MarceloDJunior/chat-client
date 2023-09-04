export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  OTHER = 'other',
}

const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const videoTypes = ['mp4', 'webm', 'ogg', 'mov', 'quicktime'];

export class FileHelper {
  public static getFileExtension(fileName: string): string | null {
    const splitted = fileName.split('.');
    if (splitted.length > 1) {
      return splitted.pop() || null;
    }
    return null;
  }

  public static bytesToKilobytes(size: number): number {
    return Math.floor(size / 1024);
  }

  public static bytesToMegabytes(size: number): number {
    return Math.floor(size / (1024 * 1024));
  }

  public static async dataURLtoFile(
    dataUrl: string,
    fileName: string,
  ): Promise<File> {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  }

  public static getFileType(file: File | string): FileType {
    if (file instanceof File) {
      return this.getFileTypeFromFile(file);
    } else {
      return this.getFileTypeFromString(file);
    }
  }

  private static getFileTypeFromString(fileName: string): FileType {
    const extension = this.getFileExtension(fileName)?.toLowerCase();
    if (extension) {
      if (imageTypes.includes(extension)) {
        return FileType.IMAGE;
      }
      if (videoTypes.includes(extension)) {
        return FileType.VIDEO;
      }
    }
    return FileType.OTHER;
  }

  private static getFileTypeFromFile(file: File): FileType {
    const fileType = file.type.split('/').pop();
    if (fileType) {
      if (imageTypes.includes(fileType)) {
        return FileType.IMAGE;
      }
      if (videoTypes.includes(fileType)) {
        return FileType.VIDEO;
      }
    }
    return FileType.OTHER;
  }
}
