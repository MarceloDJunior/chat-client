import { useQuery } from 'react-query';
import { Contact } from '@/models/contact';
import { api } from '@/services/api';

const getContacts = async () => {
  const response = await api.get('/users/contacts');
  return response.data;
};

export const useGetContactsQuery = () =>
  useQuery<Contact[]>('getContacts', getContacts);
