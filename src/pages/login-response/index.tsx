import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '../../components/loader';
import { ACCESS_TOKEN } from '../../constants/cookies';
import { CookiesHelper } from '../../helpers/cookies';
import { useCreateOrUpdateUserMutation } from '../../mutations/user';

export const LoginResponse = () => {
  const { user, getAccessTokenSilently, isLoading, error, logout } = useAuth0();
  const navigate = useNavigate();

  const createOrUpdateUsermutation = useCreateOrUpdateUserMutation();

  const handleError = (error: any) => {
    console.error(error);
    CookiesHelper.remove(ACCESS_TOKEN);
    logout();
    navigate('/');
  };

  useEffect(() => {
    const getToken = async () => {
      try {
        if (!user) {
          return;
        }
        const accessToken = await getAccessTokenSilently();
        CookiesHelper.set(ACCESS_TOKEN, accessToken);
        await createOrUpdateUsermutation.mutateAsync(user);
        navigate('/');
      } catch (error) {
        handleError(error);
      }
    };
    if (!isLoading) {
      if (error) {
        handleError(error);
      } else {
        getToken();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
      }}
    >
      <Loader />
    </div>
  );
};
