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

interface CallRequestMessage {
  fromId: number;
  toId: number;
}

interface CallResponseMessage {
  fromId: number;
  toId: number;
  response: 'yes' | 'no';
}

interface CallMediaState {
  fromId: number;
  toId: number;
  video: boolean;
  audio: boolean;
}

interface VideoCallProps {
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onReceiveCall: (userId: number) => void;
  onCallClosedByUser: (userId: number) => void;
  onCallDisconnected: (userId: number) => void;
}

let peerConnection: RTCPeerConnection;

export const useVideoCall = ({
  onAcceptCall,
  onRejectCall,
  onReceiveCall,
  onCallClosedByUser,
  onCallDisconnected,
}: VideoCallProps) => {
  const { socket } = useWebSocketContext();
  const { data: user } = useGetUser();

  const [localStream, setLocalStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const [destinationContact, setDestinationContact] = useState<Contact>();
  const [shouldStartTransmission, setShouldStartTransmission] =
    useState<boolean>(false);
  const [isLocalVideoEnabled, setIsLocalVideoEnabled] = useState(true);
  const [isLocalAudioEnabled, setIsLocalAudioEnabled] = useState(true);
  const [isDestinationVideoEnabled, setIsDestinationVideoEnabled] =
    useState(true);
  const [isDestinationAudioEnabled, setIsDestinationAudioEnabled] =
    useState(true);

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

  const requestVideoCall = async (contact: Contact) => {
    if (!user?.id) return;
    setDestinationContact(contact);
    const data: CallRequestMessage = {
      fromId: user.id,
      toId: contact.id,
    };
    await openCameraAndGetStream();
    socket?.emit(SocketEvent.CALL_REQUEST, JSON.stringify(data));
  };

  const acceptVideoCall = async (contact: Contact) => {
    const data: CallResponseMessage = {
      fromId: user?.id ?? 0,
      toId: contact.id,
      response: 'yes',
    };
    socket?.emit(SocketEvent.CALL_RESPONSE, JSON.stringify(data));
    setDestinationContact(contact);
    await openCameraAndGetStream();
    await startTransmission();
  };

  const rejectVideoCall = (contact: Contact) => {
    const data: CallResponseMessage = {
      fromId: user?.id ?? 0,
      toId: contact.id,
      response: 'no',
    };
    socket?.emit(SocketEvent.CALL_RESPONSE, JSON.stringify(data));
  };

  const closeConnection = useCallback(() => {
    // TODO: Add websocket message and UI element to indicate transmission ended
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
  }, [localStream]);

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
    if (socket) {
      socket.on(SocketEvent.CALL_RESPONSE, (payload: string) => {
        const data = JSON.parse(payload) as CallResponseMessage;
        console.log('Received call response', data);
        if (data.response === 'yes') {
          startTransmission();
          onAcceptCall();
        }
        if (data.response === 'no') {
          onRejectCall();
        }
      });

      socket.on(SocketEvent.CALL_REQUEST, (payload: string) => {
        const data = JSON.parse(payload) as CallRequestMessage;
        console.log('Received call request', data);
        if (data.toId === user?.id) onReceiveCall(data.fromId);
      });

      socket.on(SocketEvent.CALL_END, (payload: string) => {
        const data = JSON.parse(payload) as CallRequestMessage;
        console.log('Received call end', data);
        closeConnection();
        onCallClosedByUser(data.fromId);
      });

      socket.on(SocketEvent.CALL_MEDIA_STATE, (payload: string) => {
        const data = JSON.parse(payload) as CallMediaState;
        console.log('Received call media state', data);
        if (data.toId == user?.id) {
          setIsDestinationAudioEnabled(!!data.audio);
          setIsDestinationVideoEnabled(!!data.video);
        }
      });
    }

    return () => {
      socket?.off(SocketEvent.CALL_RESPONSE);
      socket?.off(SocketEvent.CALL_REQUEST);
      socket?.off(SocketEvent.CALL_END);
      socket?.off(SocketEvent.CALL_MEDIA_STATE);
    };
  }, [
    closeConnection,
    onAcceptCall,
    onCallClosedByUser,
    onReceiveCall,
    onRejectCall,
    socket,
    user?.id,
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
  // Close local camera and stop tracks

  useEffect(() => {
    // Send update on media status changes
    if (user && destinationContact) {
      const data: CallMediaState = {
        fromId: user.id,
        toId: destinationContact.id,
        audio: isLocalAudioEnabled,
        video: isLocalVideoEnabled,
      };
      socket?.emit(SocketEvent.CALL_MEDIA_STATE, JSON.stringify(data));
    }
  }, [
    isLocalVideoEnabled,
    isLocalAudioEnabled,
    user,
    destinationContact,
    socket,
  ]);

  const endTransmission = () => {
    const data: CallRequestMessage = {
      fromId: user?.id ?? 0,
      toId: destinationContact?.id ?? 0,
    };
    socket?.emit(SocketEvent.CALL_END, JSON.stringify(data));

    closeConnection();
  };

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsLocalVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsLocalAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Monitor remote stream and disconnect if no data received
  useEffect(() => {
    if (!remoteStream || !peerConnection) return;

    let lastBytes = 0;
    let noDataCount = 0;

    const interval = setInterval(async () => {
      const stats = await peerConnection.getStats();
      let bytes = 0;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp') bytes += report.bytesReceived || 0;
      });

      if (bytes > lastBytes) {
        noDataCount = 0;
      } else if (++noDataCount >= 3) {
        closeConnection();
        onCallDisconnected(destinationContact?.id ?? 0);
      }

      lastBytes = bytes;
    }, 1000);

    return () => clearInterval(interval);
  }, [
    remoteStream,
    closeConnection,
    onCallDisconnected,
    destinationContact?.id,
  ]);

  return {
    localStreamState: {
      stream: localStream,
      isVideoEnabled: isLocalVideoEnabled,
      isAudioEnabled: isLocalAudioEnabled,
    },
    remoteStreamState: {
      stream: remoteStream,
      isVideoEnabled: isDestinationVideoEnabled,
      isAudioEnabled: isDestinationAudioEnabled,
    },
    startTransmission,
    endTransmission,
    requestVideoCall,
    acceptVideoCall,
    rejectVideoCall,
    toggleVideo,
    toggleAudio,
  };
};
