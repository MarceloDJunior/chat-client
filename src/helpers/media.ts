import { FileHelper, FileType } from './file';

type Dimensions = {
  width: number;
  height: number;
};

export class MediaHelper {
  public static async getDimensions(file: File): Promise<Dimensions | null> {
    try {
      const self = new MediaHelper();
      const url = URL.createObjectURL(file);
      const fileType = FileHelper.getFileType(file);
      if (fileType === FileType.IMAGE) {
        return await self.getImageDimensions(url);
      }
      if (fileType === FileType.VIDEO) {
        return await self.getVideoDimensions(url);
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private async getImageDimensions(url: string): Promise<Dimensions> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  private async getVideoDimensions(url: string): Promise<Dimensions> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () =>
        resolve({ width: video.videoWidth, height: video.videoHeight });
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = url;
    });
  }
}
