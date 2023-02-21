import { useQuery } from 'react-query';
import { ACCESS_TOKEN } from '../constants/cookies';
import { CookiesHelper } from '../helpers/cookies';
import { User } from '../models/user';
import { api } from '../services/api';

const getUser = async () => {
  const response = await api.get('/users/me', {
    headers: {
      Authorization: 'Bearer ' + CookiesHelper.get(ACCESS_TOKEN),
    },
  });
  if (response.status !== 200) {
    throw new Error();
  }
  return response.data;
};

export const useGetUser = () =>
  useQuery<User>('getUser', getUser, {
    retry: false,
  });
