import { useState } from 'react';

export const useVideoCall = () => {
  const [stream, setStream] = useState<MediaStream>();

  const openCameraAndGetStream = async () => {
    async function getConnectedDevices(type: string) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === type);
    }

    // Open camera with at least minWidth and minHeight capabilities
    async function openCamera(
      cameraId: string,
      minWidth: number,
      minHeight: number,
    ) {
      const constraints: MediaStreamConstraints = {
        audio: { echoCancellation: true },
        video: {
          deviceId: cameraId,
          width: { min: minWidth },
          height: { min: minHeight },
        },
      };

      return await navigator.mediaDevices.getUserMedia(constraints);
    }

    if (stream) return stream;

    const cameras = await getConnectedDevices('videoinput');
    if (cameras && cameras.length > 0) {
      // Open first available video camera with a resolution of 1280x720 pixels
      const stream = await openCamera(cameras[0].deviceId, 1280, 720);
      setStream(stream);
      return stream;
    }
    throw new Error('Error opening camera');
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(undefined);
    }
  };

  return { openCameraAndGetStream, closeCamera };
};
