import { useQuery } from 'react-query';
import { Contact } from '../models/contact';
import { api } from '../services/api';

const getContacts = async () => {
  const response = await api.get('/users/contacts');
  if (response.status !== 200) {
    throw new Error();
  }
  return response.data;
};

export const useGetContactsQuery = () =>
  useQuery<Contact[]>('getContacts', getContacts);
