import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useGetUser } from '../../queries/user';
import { Chat } from '../chat';
import * as S from './styles';

export const Home = () => {
  const { data: user, isLoading } = useGetUser();
  const { loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isLoading && !user) {
      loginWithRedirect();
    }
  }, [isLoading, loginWithRedirect, user]);

  if (isLoading) {
    return <S.Center>Loading ...</S.Center>;
  }

  if (user) {
    return <Chat />;
  }

  return null;
};
