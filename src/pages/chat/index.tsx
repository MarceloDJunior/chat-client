import { useCallback, useRef, useState } from 'react';
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
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { useChat } from '@/hooks/use-chat';
import { Attachment } from '@/models/attachment';
import styles from './styles.module.scss';

const MAX_FILE_SIZE_IN_BYTES = 1024 * 1024 * 1; // 1MB

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
    onlineUsers,
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

  const checkAndRemoveBigAttachments = (
    attachments: Attachment[],
  ): Attachment[] => {
    if (attachments.length === 1) {
      const attachment = attachments[0];
      if (attachment.file.size > MAX_FILE_SIZE_IN_BYTES) {
        alert(
          'The selected file exceeds the maximum allowed size of 1MB. Please choose a smaller file.',
        );
        return [];
      }
      return [attachment];
    }

    const allowedAttachments = [];
    let hasBigFiles = false;
    for (const attachment of attachments) {
      if (attachment.file.size > MAX_FILE_SIZE_IN_BYTES) {
        hasBigFiles = true;
      } else {
        allowedAttachments.push(attachment);
      }
    }
    if (hasBigFiles) {
      if (allowedAttachments.length === 0) {
        alert(
          'All the selected files exceed the 2MB limit. Please select files that are each under 2MB.',
        );
      } else {
        alert(
          'Some files were larger than the 2MB size limit and have not been uploaded. Please make sure each individual file is smaller than 2MB.',
        );
      }
    }
    return allowedAttachments;
  };

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      const attachments: Attachment[] = files.map((file, index) => ({
        file,
        subtitle: index === 0 ? text : undefined,
      }));
      const allowedAttachments = checkAndRemoveBigAttachments(attachments);
      setAttachments(allowedAttachments);
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
          conversations={conversations ?? []}
          allUsers={contacts ?? []}
          onlineUsers={onlineUsers}
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
          <h3>Select a user to start a conversation</h3>
        )}
      </main>
    </div>
  );
};
