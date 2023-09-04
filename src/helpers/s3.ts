import axios from 'axios';

export class S3Helper {
  public static async uploadFile(
    file: File,
    preSignedUrl: string,
  ): Promise<void> {
    try {
      await axios.put(preSignedUrl, file, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });

      console.log('File uploaded successfully');
    } catch (err) {
      console.error('Error uploading file', err);
    }
  }

  public static getFileUrlFromPresignedUrl(url: string): string {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  }
}
