import {
  createBrowserRouter,
  RouterProvider as RouterDomProvider,
} from 'react-router-dom';
import { Home } from './pages/home';
import { LoginResponse } from './pages/login-response';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login-response',
    element: <LoginResponse />,
  },
]);

export const RouterProvider = () => <RouterDomProvider router={router} />;
