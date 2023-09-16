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
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { Contact } from '@/models/contact';
import { useGetUser } from '@/queries/user';
import { useContactList } from './hooks/use-contact-list';
import { useMessaging } from './hooks/use-messaging';
import { useAttachments } from './hooks/use-attachments';
import { useChatScroll } from './hooks/use-chat-scroll';
import styles from './styles.module.scss';

export const Chat = () => {
  const { isMobile } = useBreakpoints();
  const messagesRef = useRef<HTMLDivElement>(null);
  const { data: user } = useGetUser();
  const { connect: connectWebSocket } = useWebSocketContext();
  const [currentContact, setCurrentContact] = useState<Contact | undefined>();
  const { isAtBottom, scrollToBottom } = useChatScroll(messagesRef);
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
    isAtScrollBottom: isAtBottom,
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
    isAtScrollBottom: isAtBottom,
    onMessageReceived: (message) =>
      updateConversationOnNewMessage(message.from, message, true),
    onMessageSent: (message) =>
      updateConversationOnNewMessage(message.to, message, false),
    onMessagesRead: (contactId) => resetCounterAndSetReadLastMessage(contactId),
    scrollToRecentMessage: scrollToBottom,
  });
  const { attachments, updateAttachments, removeAttachments } = useAttachments({
    currentText: text,
  });

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const isMobileConversationVisible = !!currentContact;

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
              currentContact ? <ContactInfo contact={currentContact} /> : null
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
              <ContactInfo contact={currentContact} />
            </div>
            {renderChatComponents()}
          </DragNDropZone>
        ) : (
          <h3>Select a user to start a conversation</h3>
        )}
      </main>
    </div>
  );
};
