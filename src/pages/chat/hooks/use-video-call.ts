import { SocketEvent } from '@/constants/socket-events';
import { useWebSocketContext } from '@/context/websocket-context';
import { Contact } from '@/models/contact';
import { useGetUser } from '@/queries/user';
import { useCallback, useEffect, useState } from 'react';

interface RTCConnectionMessage {
  fromId: number;
  toId: number;
  type: 'ice_candidate' | 'offer' | 'answer';
  data: RTCSessionDescriptionInit | RTCIceCandidate;
}

let peerConnection: RTCPeerConnection;

export const useVideoCall = () => {
  const { socket } = useWebSocketContext();
  const { data: user } = useGetUser();

  const [localStream, setLocalStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const [destinationContact, setDestinationContact] = useState<Contact>();
  const [shouldStartTransmission, setShouldStartTransmission] =
    useState<boolean>(false);

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

    if (localStream) return localStream;

    const cameras = await getConnectedDevices('videoinput');
    if (cameras && cameras.length > 0) {
      // TODO: Add option to select camera
      const camera = cameras[1] ?? cameras[0];
      // Open first available video camera with a resolution of 1280x720 pixels
      const stream = await openCamera(camera.deviceId, 1280, 720);
      setLocalStream(stream);
      return stream;
    }
    throw new Error('Error opening camera');
  };

  const setupPeerConnectionHandlers = useCallback(() => {
    peerConnection = new RTCPeerConnection({});
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && destinationContact && user) {
        console.log('Setting up ice candidate');
        const data: RTCConnectionMessage = {
          data: event.candidate,
          type: 'ice_candidate',
          fromId: user.id,
          toId: destinationContact.id,
        };
        socket?.emit(SocketEvent.RTC_CONNECTION, JSON.stringify(data));
      }
    };
    peerConnection.ontrack = (event) => {
      console.log('Remote event', event);
      setRemoteStream(event.streams[0]);
    };

    if (localStream) {
      const existingSenders = peerConnection.getSenders();
      for (const track of localStream.getTracks()) {
        console.log('Adding track...', track);
        // Only add track if it hasn't been added already
        const trackAlreadyAdded = existingSenders.some(
          (sender) => sender.track === track,
        );
        if (!trackAlreadyAdded) {
          peerConnection.addTrack(track, localStream);
        }
      }
    }
  }, [destinationContact, localStream, socket, user]);

  const startTransmission = async () => {
    setShouldStartTransmission(true);
  };

  const setAndSendLocalDescription = useCallback(
    (sessionDescriptionInit: RTCSessionDescriptionInit) => {
      const sessionDescription = new RTCSessionDescription(
        sessionDescriptionInit,
      );
      peerConnection.setLocalDescription(sessionDescription);
      if (!user || !destinationContact) return;
      if (sessionDescription.type === 'offer') {
        const data: RTCConnectionMessage = {
          data: sessionDescription,
          type: 'offer',
          fromId: user.id,
          toId: destinationContact.id,
        };
        socket?.emit(SocketEvent.RTC_CONNECTION, JSON.stringify(data));
      }
      if (sessionDescription.type === 'answer') {
        const data: RTCConnectionMessage = {
          data: sessionDescription,
          type: 'answer',
          fromId: user.id,
          toId: destinationContact.id,
        };
        socket?.emit(SocketEvent.RTC_CONNECTION, JSON.stringify(data));
      }
    },
    [destinationContact, socket, user],
  );

  const confirmVideoCallRequest = useCallback(async () => {
    const answer = await peerConnection.createAnswer();
    console.log('Sending answer', answer);
    if (answer) {
      setAndSendLocalDescription(answer);
    }
  }, [setAndSendLocalDescription]);

  const sendVideoCallRequest = useCallback(async () => {
    // Check if there's already an offer to respond to
    if (peerConnection.signalingState === 'have-remote-offer') {
      console.log('Already has an offer. Responding...');
      await confirmVideoCallRequest();
      return;
    }
    const offer = await peerConnection.createOffer();
    console.log('Creating offer', offer);
    if (offer) {
      setAndSendLocalDescription(offer);
    }
  }, [confirmVideoCallRequest, setAndSendLocalDescription]);

  useEffect(() => {
    const setup = async () => {
      try {
        setupPeerConnectionHandlers();
        await sendVideoCallRequest();
      } catch (e) {
        console.log('Error establishing connection', e);
      }
    };

    if (shouldStartTransmission && localStream && user && destinationContact) {
      setup();
    }
  }, [
    destinationContact,
    localStream,
    sendVideoCallRequest,
    setupPeerConnectionHandlers,
    shouldStartTransmission,
    user,
  ]);

  useEffect(() => {
    if (socket && shouldStartTransmission) {
      socket.on(SocketEvent.RTC_CONNECTION, async (payload: string) => {
        const data = JSON.parse(payload) as RTCConnectionMessage;
        console.log('Event received', { data });
        if (data.type === 'offer') {
          peerConnection.close();
          setupPeerConnectionHandlers();
          const sessionDescription = data.data as RTCSessionDescriptionInit;
          peerConnection.setRemoteDescription(
            new RTCSessionDescription(sessionDescription),
          );
          // Setup handlers and add tracks before responding
          // TODO: Implement logic to answer yes or no before confirming
          // For now, both need to click on the video icon to have a call
          await confirmVideoCallRequest();
        }
        if (data.type === 'answer') {
          const sessionDescription = data.data as RTCSessionDescriptionInit;
          peerConnection.setRemoteDescription(
            new RTCSessionDescription(sessionDescription),
          );
        }
        if (data.type === 'ice_candidate') {
          const iceCandidate = data.data as RTCIceCandidate;
          peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
        }
      });
    }
    return () => {
      socket?.off(SocketEvent.RTC_CONNECTION);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, shouldStartTransmission]);

  const endCall = () => {
    // Close local camera and stop tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(undefined);
    }

    // Close peer connection to cancel any pending offers/answers
    if (peerConnection) {
      peerConnection.close();
    }

    // Clear remote stream
    setRemoteStream(undefined);
    setDestinationContact(undefined);
    setShouldStartTransmission(false);
  };

  return {
    openCameraAndGetStream,
    startTransmission,
    endCall,
    remoteStream,
    setDestinationContact,
  };
};
