import { useMutation } from 'react-query';
import { Message } from '@/models/message';
import { api } from '@/services/api';
import { Paginated } from '@/models/paginated';

type GetMessagesParams = {
  contactId: number;
  page: number;
};

const getMessages = async ({
  contactId,
  page,
}: GetMessagesParams): Promise<Paginated<Message>> => {
  const response = await api.get(
    `/messages/${contactId}?page=${page}&take=50&order=DESC`,
  );
  if (response.status !== 200) {
    throw new Error('An error occurred while getting messages');
  }
  return response.data;
};

export const useGetMessagesMutation = () =>
  useMutation('getMessages', getMessages);

const sendMessage = async (message: Message): Promise<number> => {
  const response = await api.post('/conversations/send-message', {
    toId: message.to.id,
    text: message.text,
    dateTime: message.dateTime,
  });
  if (response.status !== 201) {
    throw new Error('An error occurred while sending message');
  }
  return response.data.id;
};

export const useSendMessageMutation = () =>
  useMutation('sendMessage', sendMessage);

const updateRead = async (contactId: number): Promise<void> => {
  const response = await api.get(`/conversations/${contactId}/update-read`);
  if (response.status !== 200) {
    throw new Error('An error occurred while updating message');
  }
  return response.data.id;
};

export const useUpdateReadMutation = () => useMutation(updateRead);
