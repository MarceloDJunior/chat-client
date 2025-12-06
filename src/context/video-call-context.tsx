import { createContext, useContext, useState, ReactNode } from 'react';
import { Contact } from '@/models/contact';
import { User } from '@/models/user';
import { useVideoCall } from '@/hooks/use-video-call';
import { getUser, useGetUser } from '@/queries/user';

type VideoCallStatus =
  | 'active'
  | 'calling'
  | 'receiving-call'
  | 'rejected'
  | 'inactive'
  | 'closed-user'
  | 'closed-disconnected';

interface StreamState {
  stream: MediaStream | undefined;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

type VideoCallContextType = {
  videoCallStatus: VideoCallStatus;
  remoteContact?: Contact;
  callingContact?: Contact;
  localUser?: User;
  localStreamState: StreamState;
  remoteStreamState: StreamState;
  setVideoCallStatus: (status: VideoCallStatus) => void;
  startCall: (contact: Contact) => Promise<void>;
  endCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
};

const VideoCallContext = createContext({} as VideoCallContextType);

export const useVideoCallContext = () => useContext(VideoCallContext);

type VideoCallProviderProps = {
  children: ReactNode;
};

export const VideoCallProvider = ({ children }: VideoCallProviderProps) => {
  const [videoCallStatus, setVideoCallStatus] =
    useState<VideoCallStatus>('inactive');
  const [remoteContact, setRemoteContact] = useState<Contact | undefined>();
  const [callingContact, setCallingContact] = useState<Contact>();
  const { data: localUser } = useGetUser();

  const {
    localStreamState,
    remoteStreamState,
    requestVideoCall,
    endTransmission,
    acceptVideoCall,
    rejectVideoCall,
    toggleVideo,
    toggleAudio,
  } = useVideoCall({
    onAcceptCall: () => {
      setVideoCallStatus('active');
    },
    onRejectCall: () => {
      setVideoCallStatus('rejected');
    },
    onReceiveCall: async (userId: number) => {
      const user = await getUser(userId);
      setCallingContact(user);
      setVideoCallStatus('receiving-call');
    },
    onCallClosedByUser: () => {
      setVideoCallStatus('closed-user');
    },
    onCallDisconnected: () => {
      setVideoCallStatus('closed-disconnected');
    },
  });

  const startCall = async (contact: Contact) => {
    setRemoteContact(contact);
    setVideoCallStatus('calling');
    await requestVideoCall(contact);
  };

  const endCall = () => {
    endTransmission();
    setVideoCallStatus('inactive');
  };

  const acceptCall = () => {
    if (callingContact) {
      acceptVideoCall(callingContact);
      setRemoteContact(callingContact);
      setVideoCallStatus('active');
    }
  };

  const rejectCall = () => {
    if (callingContact) {
      rejectVideoCall(callingContact);
      setVideoCallStatus('inactive');
    }
  };

  return (
    <VideoCallContext.Provider
      value={{
        videoCallStatus,
        remoteContact,
        callingContact,
        localUser,
        localStreamState,
        remoteStreamState,
        setVideoCallStatus,
        startCall,
        endCall,
        acceptCall,
        rejectCall,
        toggleVideo,
        toggleAudio,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};
