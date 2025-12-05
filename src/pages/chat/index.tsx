import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConversationsList } from '@/components/conversations-list';
import { ContactInfo } from '@/components/contact-info';
import { DragNDropZone } from '@/components/drag-n-drop-zone';
import { MessageList } from '@/components/message-list';
import { ModalPageWithNavigation } from '@/components/modal-page-with-navigation';
import { ProfileHeader } from '@/components/profile-header';
import { SendAttachmentModal } from '@/components/send-attachment-modal';
import { SendMessageField } from '@/components/send-message-field';
import { MessageListSkeleton } from '@/components/skeletons/message-list';
import { useWebSocketContext } from '@/context/websocket-context';
import { useDialog } from '@/context/dialog-context';
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { Contact } from '@/models/contact';
import { getUser, useGetUser } from '@/queries/user';
import { useContactList } from './hooks/use-contact-list';
import { useMessaging } from './hooks/use-messaging';
import { useAttachments } from './hooks/use-attachments';
import { useChatScroll } from './hooks/use-chat-scroll';
import styles from './styles.module.scss';
import { VideoCallModal } from '@/components/video-call-modal';
import { useVideoCall } from './hooks/use-video-call';
import { Dialog } from '@/components/dialog';
import { CallActions } from './components/call-actions';

type VideoCallStatus =
  | 'active'
  | 'calling'
  | 'receiving-call'
  | 'rejected'
  | 'inactive'
  | 'closed';

export const Chat = () => {
  const { isMobile } = useBreakpoints();
  const messagesRef = useRef<HTMLDivElement>(null);
  const { data: user } = useGetUser();
  const { connect: connectWebSocket } = useWebSocketContext();
  const { showDialog } = useDialog();

  const [currentContact, setCurrentContact] = useState<Contact | undefined>();
  const [videoCallStatus, setVideoCallStatus] =
    useState<VideoCallStatus>('inactive');
  const [callingUser, setCallingUser] = useState<Contact>();

  const {
    distanceFromBottom,
    scrollToBottom,
    preserveScrollPositionOnNextChange,
  } = useChatScroll(messagesRef);
  const {
    conversations,
    contacts,
    onlineUsers,
    openChatWith,
    closeChat,
    updateConversationOnNewMessage,
    resetCounterAndSetReadLastMessage,
  } = useContactList({
    currentContact,
    distanceFromBottom,
    setCurrentContact,
  });
  const {
    messages,
    hasMoreMessages,
    isLoading,
    text,
    setText,
    sendMessage,
    loadMoreMessages,
    updateMessagesRead,
  } = useMessaging({
    currentContact,
    distanceFromBottom,
    onMessageReceived: (message) =>
      updateConversationOnNewMessage(message.from, message, true),
    onMessageSent: (message) =>
      updateConversationOnNewMessage(message.to, message, false),
    onMessagesRead: (contactId) => resetCounterAndSetReadLastMessage(contactId),
    scrollToRecentMessage: scrollToBottom,
    preserveScrollPositionOnNextChange,
  });
  const { attachments, updateAttachments, removeAttachments } = useAttachments({
    currentText: text,
  });
  const {
    localStream,
    remoteStream,
    requestVideoCall,
    endTransmission,
    acceptVideoCall,
    rejectVideoCall,
  } = useVideoCall({
    onAcceptCall: () => {
      console.log('Call accepted');
      setVideoCallStatus('active');
    },
    onRejectCall: () => {
      setVideoCallStatus('rejected');
    },
    onReceiveCall: async (userId: number) => {
      const user = await getUser(userId);
      setCallingUser(user);
      setVideoCallStatus('receiving-call');
    },
    onCallClosedByUser: () => {
      setVideoCallStatus('closed');
    },
  });

  const onVideoCallClick = async () => {
    if (!currentContact) return;
    if (currentContact.status === 'offline') {
      showDialog('User Offline', `${currentContact.name} is offline`);
      return;
    }
    setVideoCallStatus('calling');
    await requestVideoCall(currentContact);
  };

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const isMobileConversationVisible = !!currentContact;

  const renderVideoCallComponent = () => {
    // TODO: Move all this logic to another component
    if (videoCallStatus === 'active') {
      return (
        <VideoCallModal
          localStream={localStream}
          remoteStream={remoteStream}
          onClose={() => {
            endTransmission();
            setVideoCallStatus('inactive');
          }}
        />
      );
    }

    if (videoCallStatus === 'calling') {
      return (
        <Dialog
          title="Video call"
          message={`Calling ${currentContact?.name}...`}
          buttons={[
            {
              text: 'Cancel',
              onClick: () => {
                endTransmission();
                setVideoCallStatus('inactive');
              },
              variant: 'secondary',
            },
          ]}
        />
      );
    }

    if (videoCallStatus === 'receiving-call' && callingUser) {
      // TODO: Add sound an better style
      return (
        <Dialog
          content={
            <CallActions
              callerName={callingUser.name}
              onAccept={() => {
                acceptVideoCall(callingUser);
                setVideoCallStatus('active');
              }}
              onReject={() => {
                rejectVideoCall(callingUser);
                setVideoCallStatus('inactive');
              }}
            />
          }
        />
      );
    }

    if (videoCallStatus === 'rejected') {
      return (
        <Dialog
          title="Video call"
          message={`${currentContact?.name} rejected the call`}
          onClose={() => {
            setVideoCallStatus('inactive');
          }}
        />
      );
    }

    if (videoCallStatus === 'closed') {
      return (
        <Dialog
          title="Video call"
          message={`${currentContact?.name} ended the call`}
          onClose={() => {
            setVideoCallStatus('inactive');
          }}
        />
      );
    }
    return null;
  };

  const renderChatComponents = () => {
    if (!user) {
      return null;
    }
    return (
      <div className={styles.chat}>
        <div className={styles['messages-container']}>
          <div className={styles.messages} ref={messagesRef}>
            <MessageList
              messages={messages}
              myUser={user}
              hasMoreMessages={hasMoreMessages}
              onLoadMoreClick={loadMoreMessages}
            />
          </div>
          {isLoading && <MessageListSkeleton />}
        </div>
        <AnimatePresence>
          {attachments.length > 0 ? (
            <SendAttachmentModal
              attachments={attachments}
              onClose={removeAttachments}
              onSubmit={sendMessage}
            />
          ) : null}
        </AnimatePresence>
        <SendMessageField
          text={text}
          setText={setText}
          onSubmit={sendMessage}
          onFilesSelected={updateAttachments}
        />
      </div>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ProfileHeader user={user} />
        <ConversationsList
          conversations={conversations ?? []}
          allUsers={contacts ?? []}
          onlineUsers={onlineUsers}
          onContactClick={openChatWith}
        />
      </div>
      <main
        className={styles['main-content']}
        onMouseMove={updateMessagesRead}
        onTouchMove={updateMessagesRead}
      >
        {isMobile ? ( // render chat components inside navigation page on mobile
          <ModalPageWithNavigation
            isVisible={isMobileConversationVisible}
            onClose={closeChat}
            headerContent={
              currentContact ? (
                <ContactInfo
                  contact={currentContact}
                  onVideoCallClick={onVideoCallClick}
                />
              ) : null
            }
          >
            {renderChatComponents()}
          </ModalPageWithNavigation>
        ) : currentContact ? ( // render chat components in desktop if contact is selected
          <DragNDropZone
            className={styles.dropzone}
            onDropFiles={updateAttachments}
          >
            <div className={styles['contact-header']}>
              <ContactInfo
                contact={currentContact}
                onVideoCallClick={onVideoCallClick}
              />
            </div>
            {renderChatComponents()}
          </DragNDropZone>
        ) : (
          <h3>Select a user to start a conversation</h3>
        )}
        {renderVideoCallComponent()}
      </main>
    </div>
  );
};
