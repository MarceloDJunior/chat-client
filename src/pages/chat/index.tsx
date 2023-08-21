import { useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConversationsList } from '@/components/conversations-list';
import { ContactInfo } from '@/components/contact-info';
import { DragNDropZone } from '@/components/drag-n-drop-zone';
import { Loader } from '@/components/loader';
import { MessageList } from '@/components/message-list';
import { ModalPageWithNavigation } from '@/components/modal-page-with-navigation';
import { ProfileHeader } from '@/components/profile-header';
import { SendAttachmentModal } from '@/components/send-attachment-modal';
import { SendMessageField } from '@/components/send-message-field';
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { useChat } from '@/hooks/use-chat';
import { Attachment } from '@/models/attachment';
import styles from './styles.module.scss';

export const Chat = () => {
  const { isMobile } = useBreakpoints();
  const messagesRef = useRef<HTMLDivElement>(null);
  const {
    user,
    conversations,
    contacts,
    currentContact,
    messages,
    hasMoreMessages,
    isLoading,
    onlineUserIds,
    text,
    setText,
    sendMessage,
    loadMoreMessages,
    updateMessagesRead,
    openChatWith,
    closeChat,
  } = useChat(messagesRef);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const isMobileConversationVisible = !!currentContact;

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      const attachments: Attachment[] = files.map((file, index) => ({
        file,
        subtitle: index === 0 ? text : undefined,
      }));
      setAttachments(attachments);
    },
    [text],
  );

  const handleAttachmentsClose = useCallback(() => {
    setAttachments([]);
  }, []);

  const renderChatComponents = () => {
    if (!user) {
      return null;
    }
    return (
      <div className={styles.chat}>
        <div className={styles.messages} ref={messagesRef}>
          <MessageList
            messages={messages}
            myUser={user}
            hasMoreMessages={hasMoreMessages}
            onLoadMoreClick={loadMoreMessages}
          />
        </div>
        {isLoading ? (
          <div className={styles.overlay}>
            <Loader height={46} width={60} />
          </div>
        ) : null}
        <AnimatePresence>
          {attachments.length > 0 ? (
            <SendAttachmentModal
              attachments={attachments}
              onClose={handleAttachmentsClose}
              onSubmit={sendMessage}
            />
          ) : null}
        </AnimatePresence>
        <SendMessageField
          text={text}
          setText={setText}
          onSubmit={sendMessage}
          onFilesSelected={handleFilesSelected}
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
          contacts={contacts ?? []}
          conversations={conversations ?? []}
          onlineUserIds={onlineUserIds}
          onContactClick={openChatWith}
        />
      </div>
      <main className={styles['main-content']} onMouseMove={updateMessagesRead}>
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
            onDropFiles={handleFilesSelected}
          >
            <div className={styles['contact-header']}>
              <ContactInfo contact={currentContact} />
            </div>
            {renderChatComponents()}
          </DragNDropZone>
        ) : (
          <h3>Select a user to start chatting</h3>
        )}
      </main>
    </div>
  );
};
