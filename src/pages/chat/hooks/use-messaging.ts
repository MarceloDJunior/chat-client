import { useEffect, useMemo, useState } from 'react';
import ReceivedMessageSound from '@/assets/sounds/received-message.mp3';
import SentMessageSound from '@/assets/sounds/sent-message.mp3';
import { LAST_CONTACT_ID } from '@/constants/cookies';
import { useWebSocketContext } from '@/context/websocket-context';
import { CookiesHelper } from '@/helpers/cookies';
import { Contact } from '@/models/contact';
import { Message } from '@/models/message';
import {
  useGetMessagesMutation,
  useGetPresignedUrl,
  useSendMessageMutation,
  useUpdateReadMutation,
} from '@/mutations/messages';
import { S3Helper } from '@/helpers/s3';
import { useTabActive } from '@/hooks/use-tab-active';
import { useGetUser } from '@/queries/user';
import { MediaHelper } from '@/helpers/media';
import { SocketEvent } from '@/constants/socket-events';

let lastMessageId: number;
const receivedMessageSound = new Audio(ReceivedMessageSound);
receivedMessageSound.muted = true;
const sentMessageSound = new Audio(SentMessageSound);
sentMessageSound.muted = true;

const generateUniqueId = () =>
  new Date().getTime() + Math.floor(Math.random() * 1000);

type Props = {
  currentContact: Contact | undefined;
  distanceFromBottom?: number;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
  onMessagesRead?: (contactId: number) => void;
  scrollToRecentMessage?: () => void;
  preserveScrollPositionOnNextChange?: () => void;
};

export const useMessaging = ({
  currentContact,
  distanceFromBottom = 0,
  onMessageSent,
  onMessageReceived,
  onMessagesRead,
  scrollToRecentMessage,
  preserveScrollPositionOnNextChange,
}: Props) => {
  const { data: user } = useGetUser();
  const { mutateAsync: mutateGetMessages } = useGetMessagesMutation();
  const { mutateAsync: mutateSendMessage } = useSendMessageMutation();
  const { mutateAsync: mutateUpdateRead } = useUpdateReadMutation();
  const { mutateAsync: mutateGetPresignedUrl } = useGetPresignedUrl();
  const { socket } = useWebSocketContext();
  const { isTabActive } = useTabActive();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [text, setText] = useState<string>('');

  const isAtScrollBottom = distanceFromBottom <= 30;

  const addNewMessage = (message: Message) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      newMessages.unshift(message);
      return newMessages;
    });
  };

  const updateMessage = (message: Message) => {
    setMessages((prevMessages) =>
      prevMessages.map((currMessage) => {
        if (currMessage.id === message.id) {
          return message;
        }
        return currMessage;
      }),
    );
  };

  const createPendingMessage = (text: string, file?: File) => {
    if (!user || !currentContact) {
      return null;
    }
    if (!text && !file) {
      return null;
    }
    const tempId = generateUniqueId();
    const message: Message = {
      id: tempId,
      from: user,
      to: currentContact,
      dateTime: new Date(),
      text,
      read: false,
      pending: true,
    };
    return message;
  };

  const getUrlWithMediaDimensions = async (
    presignedUrl: string,
    file: File,
  ) => {
    let fileUrl = S3Helper.getFileUrlFromPresignedUrl(presignedUrl);
    const dimensions = await MediaHelper.getDimensions(file);
    if (dimensions) {
      const newUrl = new URL(fileUrl);
      newUrl.searchParams.append('width', dimensions.width.toString());
      newUrl.searchParams.append('height', dimensions.height.toString());
      fileUrl = newUrl.toString();
    }
    return fileUrl;
  };

  const sendMessage = async (text: string, file?: File): Promise<boolean> => {
    try {
      const message = createPendingMessage(text, file);
      if (!message) {
        return false;
      }
      setText('');
      if (file) {
        const tempFileURL = URL.createObjectURL(file);
        message.fileName = file.name;
        message.fileUrl = tempFileURL;
        addNewMessage(message);

        const presignedFileUrl = await mutateGetPresignedUrl(file.name);
        await S3Helper.uploadFile(file, presignedFileUrl, (progress) => {
          message.progress = progress;
          updateMessage(message);
        });
        message.fileUrl = await getUrlWithMediaDimensions(
          presignedFileUrl,
          file,
        );
      } else {
        addNewMessage(message);
      }
      sentMessageSound.play();
      await mutateSendMessage(message);
      message.pending = false;
      socket?.emit(SocketEvent.SEND_MESSAGE, JSON.stringify(message));
      updateMessage(message);
      onMessageSent?.(message);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleNewMessage = (message: Message) => {
    if (!message.id || lastMessageId === message.id) {
      return;
    }
    receivedMessageSound.play();
    lastMessageId = message.id;
    if (currentContact?.id === message.from.id) {
      addNewMessage(message);
    }
    onMessageReceived?.(message);
  };

  const updateMessages = (data: Message[]) => {
    setMessages((prevData) => {
      // Remove duplicates
      const newData = data.filter(
        (dataItem) =>
          !prevData.some((prevDataItem) => prevDataItem.id === dataItem.id),
      );

      return prevData.concat(newData);
    });
  };

  const loadMoreMessages = async () => {
    preserveScrollPositionOnNextChange?.();
    const { data, meta } = await mutateGetMessages({
      contactId: currentContact?.id ?? 0,
      page: currentPage + 1,
    });
    updateMessages(data);
    setHasMoreMessages(meta.hasNextPage);
    setCurrentPage((prevValue) => prevValue + 1);
  };

  const hasUnreadMessages = useMemo(
    () =>
      !!messages.some(
        (message) => message.from?.id === currentContact?.id && !message.read,
      ),
    [currentContact?.id, messages],
  );

  const setMessagesRead = (fromId: number) => {
    if (currentContact?.id === fromId) {
      setMessages((prevMessages) =>
        prevMessages.map((message) => ({ ...message, read: true })),
      );
    }
    onMessagesRead?.(fromId);
  };

  const updateMessagesRead = async () => {
    try {
      if (currentContact && isAtScrollBottom && hasUnreadMessages) {
        await mutateUpdateRead(currentContact.id);
        setMessagesRead(currentContact.id);
        socket?.emit(SocketEvent.MESSAGES_READ, currentContact.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const lastMessage = useMemo(() => {
    if (!(messages.length > 0)) {
      return null;
    }
    const lastMessage = messages[0];
    return lastMessage;
  }, [messages]);

  useEffect(() => {
    // Unlock audio on the first user interaction
    window.addEventListener(
      'click',
      () => {
        receivedMessageSound.play().then(() => {
          receivedMessageSound.pause();
          receivedMessageSound.muted = false;
        });
        sentMessageSound.play().then(() => {
          sentMessageSound.pause();
          sentMessageSound.muted = false;
        });
      },
      { once: true },
    ); // The listener is removed after one execution
  }, []);

  useEffect(() => {
    const resetChat = () => {
      setIsLoading(true);
      setMessages([]);
    };

    const getInitialMessages = async (contactId: number) => {
      const { data, meta } = await mutateGetMessages({
        contactId,
        page: 1,
      });
      setMessages(data);
      setHasMoreMessages(meta.hasNextPage);
      setCurrentPage(1);
      // timeout to give some time to finish scrolling before hiding loader
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    };

    if (currentContact) {
      resetChat();
      getInitialMessages(currentContact.id);
      CookiesHelper.set(LAST_CONTACT_ID, currentContact.id.toString());
    } else {
      CookiesHelper.remove(LAST_CONTACT_ID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id]);

  useEffect(() => {
    if (socket) {
      socket.on(SocketEvent.MESSAGE_RECEIVED, (payload: string) => {
        const message: Message = JSON.parse(payload);
        handleNewMessage(message);
      });

      socket.on(SocketEvent.MESSAGES_READ, (fromId: string) => {
        setMessagesRead(Number(fromId));
      });
    }
    return () => {
      socket?.off(SocketEvent.MESSAGE_RECEIVED);
      socket?.off(SocketEvent.MESSAGES_READ);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id, socket, handleNewMessage]);

  useEffect(() => {
    if (!lastMessage?.id) return;

    const isSentFromMe = lastMessage.from?.id === user?.id;
    const isSentFromContactAndIsChatActive =
      !isSentFromMe && isAtScrollBottom && isTabActive;

    if (isSentFromMe || isSentFromContactAndIsChatActive) {
      // Give some time to render the last message
      setTimeout(() => {
        scrollToRecentMessage?.();
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id]);

  return {
    currentContact,
    messages,
    hasMoreMessages,
    isLoading,
    text,
    setText,
    sendMessage,
    loadMoreMessages,
    updateMessagesRead,
  };
};
