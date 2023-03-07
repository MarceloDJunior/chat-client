import { LoginButton } from '../../components/login-button';
import { useGetUser } from '../../queries/user';
import { Chat } from '../chat';
import styles from './styles.module.scss';

export const Home = () => {
  const { data: user, isLoading } = useGetUser();

  if (isLoading) {
    return <div className={styles.center}>Loading ...</div>;
  }

  if (user) {
    return <Chat />;
  }

  return (
    <div className={styles.center}>
      <LoginButton />
    </div>
  );
};
