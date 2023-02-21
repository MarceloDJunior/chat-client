import { useAuth0 } from '@auth0/auth0-react';
import { ACCESS_TOKEN } from '../constants/cookies';
import { CookiesHelper } from '../helpers/cookies';

export const LogoutButton = () => {
  const { logout } = useAuth0();

  const handleLogout = () => {
    CookiesHelper.remove(ACCESS_TOKEN);
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return <button onClick={handleLogout}>Log Out</button>;
};
