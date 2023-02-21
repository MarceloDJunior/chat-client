import { useQuery } from 'react-query';
import { User } from '../models/user';
import { api } from '../services/api';

const getUser = async () => {
  const response = await api.get('/users/me');
  if (response.status !== 200) {
    throw new Error();
  }
  return response.data;
};

export const useGetUser = () =>
  useQuery<User>('getUser', getUser, {
    retry: false,
  });
