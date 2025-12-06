import { VideoCallModal } from '@/components/video-call-modal';
import { Dialog } from '@/components/dialog';
import { CallActions } from '../call-actions';
import { useVideoCallContext } from '@/context/video-call-context';

export const VideoCall = () => {
  const {
    videoCallStatus,
    remoteContact,
    callingContact,
    localUser,
    localStreamState,
    remoteStreamState,
    setVideoCallStatus,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  } = useVideoCallContext();
  if (videoCallStatus === 'active') {
    return (
      <VideoCallModal
        localStreamState={localStreamState}
        remoteStreamState={remoteStreamState}
        currentUser={localUser}
        remoteUser={remoteContact}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onClose={endCall}
      />
    );
  }

  if (videoCallStatus === 'calling') {
    return (
      <Dialog
        title="Video call"
        message={`Calling ${remoteContact?.name}...`}
        buttons={[
          {
            text: 'Cancel',
            onClick: endCall,
            variant: 'secondary',
          },
        ]}
      />
    );
  }

  if (videoCallStatus === 'receiving-call' && callingContact) {
    return (
      <Dialog
        content={
          <CallActions
            callerName={callingContact.name}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        }
      />
    );
  }

  if (videoCallStatus === 'rejected') {
    return (
      <Dialog
        title="Video call"
        message={`${remoteContact?.name} rejected the call`}
        onClose={() => setVideoCallStatus('inactive')}
      />
    );
  }

  if (videoCallStatus === 'closed-user') {
    return (
      <Dialog
        title="Video call"
        message={`${remoteContact?.name} ended the call`}
        onClose={() => setVideoCallStatus('inactive')}
      />
    );
  }

  if (videoCallStatus === 'closed-disconnected') {
    return (
      <Dialog
        title="Video call"
        message={`${remoteContact?.name} has been disconnected`}
        onClose={() => setVideoCallStatus('inactive')}
      />
    );
  }

  return null;
};
