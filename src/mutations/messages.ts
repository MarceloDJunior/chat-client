import { useMutation } from 'react-query';
import { Message } from '../models/message';
import { api } from '../services/api';

const getMessages = async (contactId: number): Promise<Message[]> => {
  const response = await api.get(`/messages/${contactId}?take=50&order=DESC`);
  if (response.status !== 200) {
    throw new Error('An error occurred while getting messages');
  }
  return response.data.data;
};

export const useGetMessagesMutation = () => useMutation(getMessages);

const sendMessage = async (message: Message) => {
  const response = await api.post('/messages/send', {
    fromId: message.from.id,
    toId: message.to.id,
    text: message.text,
  });
  if (response.status !== 201) {
    throw new Error('An error occurred while sending message');
  }
};

export const useSendMessageMutation = () =>
  useMutation('sendMessage', sendMessage);
