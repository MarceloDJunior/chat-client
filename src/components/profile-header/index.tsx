import { useAuth0 } from '@auth0/auth0-react';
import { ACCESS_TOKEN } from '../../constants/cookies';
import { useWebSocketContext } from '../../context/websocket-context';
import { CookiesHelper } from '../../helpers/cookies';
import { User } from '../../models/user';
import styles from './styles.module.scss';

type ProfileHeaderProps = {
  user: User;
};

export const ProfileHeader = ({ user }: ProfileHeaderProps) => {
  const { logout } = useAuth0();
  const { socket } = useWebSocketContext();

  const handleLogout = () => {
    CookiesHelper.remove(ACCESS_TOKEN);
    socket?.disconnect();
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <div className={styles.container}>
      <img src={user.picture} alt="Picture" className={styles.picture} />
      <div>
        <h2>{user.name}</h2>
        <button onClick={handleLogout}>Disconnect</button>
      </div>
    </div>
  );
};
