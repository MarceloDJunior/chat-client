import { createContext, useCallback, useContext, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/config/environment';
import { ACCESS_TOKEN } from '@/constants/cookies';
import { CookiesHelper } from '@/helpers/cookies';

type WebSocketContextType = {
  socket: Socket | null;
  connect: () => void;
};

const WebSocketContext = createContext({} as WebSocketContextType);

export const useWebSocketContext = () => useContext(WebSocketContext);

type WebSocketProviderProps = {
  children: React.ReactNode;
};

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = useCallback(() => {
    if (socket) return;
    const newSocket = io(WS_URL, {
      multiplex: true,
      transports: ['websocket'],
      query: {
        accessToken: CookiesHelper.get(ACCESS_TOKEN),
      },
    });
    setSocket(newSocket);
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{ socket, connect }}>
      {children}
    </WebSocketContext.Provider>
  );
};
