import { useQuery } from 'react-query';
import { User } from '@/models/user';
import { api } from '@/services/api';

const getCurrentUser = async () => {
  const response = await api.get('/users/me');

  return response.data;
};

export const useGetUser = () =>
  useQuery<User>('getUser', getCurrentUser, {
    retry: false,
  });

export const getUser = async (userId: number) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};
