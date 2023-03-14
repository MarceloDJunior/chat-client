import { useAuth0 } from '@auth0/auth0-react';
import { ACCESS_TOKEN } from '../../constants/cookies';
import { useWebSocketContext } from '../../context/websocket-context';
import { CookiesHelper } from '../../helpers/cookies';
import { User } from '../../models/user';
import * as S from './styles';

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
    <S.Container>
      <S.Picture src={user.picture} alt="Picture" />
      <div>
        <S.Name>{user.name}</S.Name>
        <S.Email>{user.email}</S.Email>
        <button onClick={handleLogout}>Log Out</button>
      </div>
    </S.Container>
  );
};
