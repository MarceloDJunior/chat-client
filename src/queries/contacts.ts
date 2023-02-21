import { useQuery } from 'react-query';
import { ACCESS_TOKEN } from '../constants/cookies';
import { CookiesHelper } from '../helpers/cookies';
import { User } from '../models/user';
import { api } from '../services/api';

const getContacts = async () => {
  const response = await api.get('/users', {
    headers: {
      Authorization: 'Bearer ' + CookiesHelper.get(ACCESS_TOKEN),
    },
  });
  if (response.status !== 200) {
    throw new Error();
  }
  return response.data;
};

export const useGetContactsQuery = () =>
  useQuery<User[]>('getContacts', getContacts);
