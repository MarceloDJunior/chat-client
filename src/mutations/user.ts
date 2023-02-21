import { useMutation } from 'react-query';
import { User } from '@auth0/auth0-spa-js';
import { api } from '../services/api';

const createOrUpdateUser = async (user: User) => {
  const response = await api.post('/users/auth0-login', user);
  if (response.status !== 200) {
    throw new Error('An error occurred while logging in');
  }
};

export const useCreateOrUpdateUserMutation = () =>
  useMutation('createOrUpdateUser', createOrUpdateUser);
