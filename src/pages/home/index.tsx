import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useGetUser } from '../../queries/user';
import { Chat } from '../chat';
import styles from './styles.module.scss';

export const Home = () => {
  const { data: user, isLoading } = useGetUser();
  const { loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isLoading && !user) {
      loginWithRedirect();
    }
  }, [isLoading, loginWithRedirect, user]);

  if (isLoading) {
    return <div className={styles.center}>Loading ...</div>;
  }

  if (user) {
    return <Chat />;
  }

  return null;
};
