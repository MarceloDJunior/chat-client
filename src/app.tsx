import { Auth0Provider } from '@auth0/auth0-react';
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
} from './config/environment';
import { WebSocketProvider } from './context/websocket-context';
import { RouterProvider } from './router';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: `${window.location.origin}/login-response`,
          audience: AUTH0_AUDIENCE,
        }}
      >
        <CookiesProvider>
          <WebSocketProvider>
            <RouterProvider />
          </WebSocketProvider>
        </CookiesProvider>
      </Auth0Provider>
    </QueryClientProvider>
  );
};

export default App;
