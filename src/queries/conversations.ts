import { useQuery } from 'react-query';
import { Conversation } from '@/models/conversation';
import { api } from '@/services/api';

const getConversations = async () => {
  const response = await api.get('/conversations');
  if (response.status !== 200) {
    throw new Error();
  }
  return response.data.data;
};

export const useGetConversationsQuery = () =>
  useQuery<Conversation[]>('getConversations', getConversations);
